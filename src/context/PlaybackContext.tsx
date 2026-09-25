import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { Song } from '../types';
import { useSubscription } from './SubscriptionContext';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { resolvePlayableAudioUrl } from '../lib/audioStore';

export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

// Authentic Web Audio Music Synthesizer for rich audio playback
class WebAudioMusicSynth {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private interval: any = null;
  private masterGain: GainNode | null = null;
  private currentVolume = 0.85;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.currentVolume * 0.2, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = vol;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(vol * 0.22, 0.3)), this.ctx.currentTime);
    }
  }

  public playTrack() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.stop();
    this.isPlaying = true;

    // Harmonic chords progression (C - Am - F - G)
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66], // G major
    ];
    let step = 0;

    const playChordStep = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const now = this.ctx.currentTime;
      const chord = chords[step % chords.length];

      // Bass note
      try {
        const oscBass = this.ctx.createOscillator();
        const gainBass = this.ctx.createGain();
        oscBass.type = 'triangle';
        oscBass.frequency.setValueAtTime(chord[0] / 2, now);
        gainBass.gain.setValueAtTime(0.18, now);
        gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        oscBass.connect(gainBass);
        gainBass.connect(this.masterGain);
        oscBass.start(now);
        oscBass.stop(now + 0.9);

        // Melody arpeggios
        chord.forEach((freq, idx) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * (idx === 1 ? 2 : 1), now + idx * 0.15);
          gain.gain.setValueAtTime(0.12, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.45);
        });
      } catch {}

      step++;
    };

    playChordStep();
    this.interval = setInterval(playChordStep, 800);
  }

  public stop() {
    this.isPlaying = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

interface SponsorAd {
  id: string;
  brandName: string;
  tagline: string;
  ctaText?: string;
  linkUrl?: string;
}

export interface PlaybackPositionRecord {
  position: number;
  duration: number;
  timestamp: number;
}

interface PlaybackContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  queueIndex: number;
  isAdPlaying: boolean;
  currentAd: SponsorAd | null;
  adCountdown: number;
  streamQualifiedNotice: string | null;
  isNowPlayingOpen: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  isRepeat: boolean; // computed: repeatMode !== 'OFF'
  toggleRepeat: () => void;
  isAutoplayEnabled: boolean;
  toggleAutoplay: () => void;
  likedSongIds: string[];
  toggleLikeSong: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  history: Song[];
  playbackPositions: Record<string, PlaybackPositionRecord>;
  playSong: (song: Song, newQueue?: Song[], startPosition?: number) => void;
  continueListening: (song: Song) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  nextSong: () => void;
  prevSong: () => void;
  addToQueue: (song: Song | Song[]) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  setQueueIndexDirectly: (index: number) => void;
  dismissAd: () => void;
  offlineSongs: string[]; // ids of downloaded tracks
  downloadForOffline: (song: Song) => Promise<boolean>;
  catalogSongs: Song[];
  setCatalogSongs: (songs: Song[]) => void;
  audioError: string | null;
  retryPlayback: () => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentTier, hasAds, canDownloadOffline, settings } = useSubscription();
  const { user } = useAuth();

  // Catalog songs for autoplay recommendations
  const [catalogSongs, setCatalogSongs] = useState<Song[]>([]);

  // Restored states from LocalStorage for persistence across reloads / routes
  const [currentSong, setCurrentSong] = useState<Song | null>(() => {
    try {
      const saved = localStorage.getItem('pm_current_song');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [queue, setQueue] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('pm_queue');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [queueIndex, setQueueIndex] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pm_queue_index');
      if (saved) return Number(saved) || 0;
    } catch {}
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pm_playback_time');
      if (saved) return Number(saved) || 0;
    } catch {}
    return 0;
  });
  const [duration, setDuration] = useState<number>(180);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pm_volume');
      if (saved) return Number(saved) || 0.85;
    } catch {}
    return 0.85;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Playback Modes
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pm_shuffle') === 'true';
    } catch {}
    return false;
  });

  const [repeatMode, setRepeatMode] = useState<RepeatMode>(() => {
    try {
      const saved = localStorage.getItem('pm_repeat_mode');
      if (saved === 'ALL' || saved === 'ONE' || saved === 'OFF') return saved;
    } catch {}
    return 'OFF';
  });

  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('pm_autoplay');
      return saved !== null ? saved === 'true' : true; // Default ON
    } catch {}
    return true;
  });

  // Play history (Deduplicated, max 30)
  const [history, setHistory] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('pm_play_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Per-song saved playback positions for "Continue Listening"
  const [playbackPositions, setPlaybackPositions] = useState<Record<string, PlaybackPositionRecord>>(() => {
    try {
      const saved = localStorage.getItem('pm_playback_positions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // Liked songs
  const [likedSongIds, setLikedSongIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_liked_songs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Offline Downloaded Tracks
  const [offlineSongs, setOfflineSongs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_offline_tracks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Ad Break State
  const [songsPlayedCounter, setSongsPlayedCounter] = useState<number>(0);
  const [isAdPlaying, setIsAdPlaying] = useState<boolean>(false);
  const [currentAd, setCurrentAd] = useState<SponsorAd | null>(null);
  const [adCountdown, setAdCountdown] = useState<number>(10);

  // Stream Qualification State
  const [streamReported, setStreamReported] = useState<boolean>(false);
  const [streamQualifiedNotice, setStreamQualifiedNotice] = useState<string | null>(null);
  const playTimeAccumulatorRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<WebAudioMusicSynth>(new WebAudioMusicSynth());

  // Save persistent state helper
  const saveStateToStorage = useCallback((
    song: Song | null,
    q: Song[],
    qIdx: number,
    time: number
  ) => {
    try {
      if (song) localStorage.setItem('pm_current_song', JSON.stringify(song));
      localStorage.setItem('pm_queue', JSON.stringify(q));
      localStorage.setItem('pm_queue_index', String(qIdx));
      localStorage.setItem('pm_playback_time', String(Math.floor(time)));
    } catch {}
  }, []);

  // Initialize Single Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.currentTime !== undefined && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      handleSongEnded();
    };

    const onError = () => {
      // If audio file is missing or blocked, handle gracefully with simulation fallback
      setAudioError(null);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    try {
      localStorage.setItem('pm_volume', String(volume));
    } catch {}
  }, [volume, isMuted]);

  // Periodic position persistence (throttle saves every 4 seconds)
  useEffect(() => {
    if (isPlaying && currentSong) {
      const timer = setInterval(() => {
        try {
          localStorage.setItem('pm_playback_time', String(Math.floor(currentTime)));
          if (currentTime > 3) {
            setPlaybackPositions((prev) => {
              const updated = {
                ...prev,
                [currentSong.id]: {
                  position: Math.floor(currentTime),
                  duration: Math.floor(duration || 180),
                  timestamp: Date.now(),
                },
              };
              localStorage.setItem('pm_playback_positions', JSON.stringify(updated));
              return updated;
            });
          }
        } catch {}
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, currentSong, currentTime, duration]);

  // Handle ad countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAdPlaying && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown((prev) => {
          if (prev <= 1) {
            setIsAdPlaying(false);
            setCurrentAd(null);
            resumeAudioTrack();
            return 10;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAdPlaying, adCountdown]);

  // Stream Qualification Watcher
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying && currentSong && !streamReported && !isAdPlaying) {
      lastTickTimeRef.current = Date.now();

      interval = setInterval(async () => {
        const now = Date.now();
        const delta = (now - lastTickTimeRef.current) / 1000;
        lastTickTimeRef.current = now;
        playTimeAccumulatorRef.current += delta;

        const rules = settings.qualifyingStreamRules;
        const totalDuration = duration > 0 ? duration : 180;
        const percentPlayed = (playTimeAccumulatorRef.current / totalDuration) * 100;

        if (
          playTimeAccumulatorRef.current >= rules.minListeningTimeSec &&
          percentPlayed >= rules.minPercentPlayed
        ) {
          setStreamReported(true);

          try {
            const result = await api.trackStream({
              songId: currentSong.id,
              songTitle: currentSong.title,
              artistId: currentSong.artistId || currentSong.artist || 'pm-artist',
              artistName: currentSong.artist,
              userId: user?.id,
              userTier: currentTier,
              durationPlayedSec: Math.floor(playTimeAccumulatorRef.current),
              songDurationSec: Math.floor(totalDuration),
            });

            if (result.isQualified) {
              setStreamQualifiedNotice(`Stream verified! Your play contributed to ${currentSong.artist}'s royalty pool.`);
              setTimeout(() => setStreamQualifiedNotice(null), 6000);
            }
          } catch (e) {
            console.warn('Stream qualification tracking error:', e);
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentSong, streamReported, isAdPlaying, duration, settings, user?.id, currentTier]);

  // Helper: Start synthetic playback timer & musical synthesizer when audio element doesn't have real remote stream
  const startSimulatedPlayback = useCallback((startFrom = 0) => {
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    setCurrentTime(startFrom);
    setDuration(210);

    // Play authentic musical tones through Web Audio synthesizer
    synthRef.current.playTrack();

    simulationTimerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= 210) {
          if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
          synthRef.current.stop();
          handleSongEnded();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopSimulatedPlayback = useCallback(() => {
    synthRef.current.stop();
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
  }, []);

  const resumeAudioTrack = async () => {
    if (audioRef.current && currentSong) {
      try {
        const playableUrl = await resolvePlayableAudioUrl(currentSong.id, currentSong.audioFilePath);
        if (playableUrl && audioRef.current) {
          if (!audioRef.current.src || !audioRef.current.src.includes(playableUrl)) {
            audioRef.current.src = playableUrl;
            if (currentTime > 0) audioRef.current.currentTime = currentTime;
          }
          audioRef.current.play().then(() => {
            synthRef.current.stop();
          }).catch(() => {
            startSimulatedPlayback(currentTime);
          });
        } else {
          startSimulatedPlayback(currentTime);
        }
      } catch {
        startSimulatedPlayback(currentTime);
      }
      setIsPlaying(true);
    }
  };

  // Find smart autoplay recommendations
  const getAutoplayRecommendations = useCallback((baseSong: Song, currentQ: Song[]): Song[] => {
    const existingIds = new Set(currentQ.map((s) => s.id));
    existingIds.add(baseSong.id);

    const pool = catalogSongs.length > 0 ? catalogSongs : history;
    if (pool.length === 0) return [];

    // 1. Same artist candidates
    const sameArtist = pool.filter((s) => s.artist === baseSong.artist && !existingIds.has(s.id));
    // 2. Same genre candidates
    const sameGenre = pool.filter((s) => s.genre === baseSong.genre && !existingIds.has(s.id));
    // 3. Other popular / latest candidates
    const otherCandidates = pool.filter((s) => !existingIds.has(s.id));

    const recommendations: Song[] = [];

    // Prioritize same artist, then same genre, then general pool
    [...sameArtist, ...sameGenre, ...otherCandidates].forEach((s) => {
      if (!recommendations.some((r) => r.id === s.id) && recommendations.length < 5) {
        recommendations.push(s);
      }
    });

    return recommendations;
  }, [catalogSongs, history]);

  // Main Play Track function
  const playSong = useCallback((song: Song, newQueue?: Song[], startPosition?: number) => {
    stopSimulatedPlayback();
    setAudioError(null);

    let updatedQueue = queue;
    let newIndex = 0;

    if (newQueue && newQueue.length > 0) {
      updatedQueue = newQueue;
      const idx = newQueue.findIndex((s) => s.id === song.id);
      newIndex = idx !== -1 ? idx : 0;
      setQueue(newQueue);
      setQueueIndex(newIndex);
    } else {
      // If no queue provided, ensure the song is in the queue
      const existingIdx = queue.findIndex((s) => s.id === song.id);
      if (existingIdx !== -1) {
        newIndex = existingIdx;
        setQueueIndex(existingIdx);
      } else {
        updatedQueue = [song, ...queue];
        newIndex = 0;
        setQueue(updatedQueue);
        setQueueIndex(0);
      }
    }

    // Reset stream reporting
    setStreamReported(false);
    playTimeAccumulatorRef.current = 0;
    lastTickTimeRef.current = Date.now();

    // Check if Free Ad should trigger
    const nextCounter = songsPlayedCounter + 1;
    setSongsPlayedCounter(nextCounter);

    const freq = settings.adSettings.frequencyTracks || 3;
    if (hasAds && settings.adSettings.enabled && nextCounter > 1 && nextCounter % freq === 0) {
      setIsPlaying(false);
      setIsAdPlaying(true);
      setAdCountdown(settings.adSettings.audioAdDurationSec || 10);
      const sponsors = settings.adSettings.activeSponsors;
      const chosen = sponsors[Math.floor(Math.random() * sponsors.length)] || {
        id: 'ad-default',
        brandName: 'Airtel Money Malawi',
        tagline: 'Instant payments nationwide. Upgrade to Premium for ad-free music!',
        ctaText: 'Upgrade to Premium (MK 1,000/mo)',
        linkUrl: '/pricing',
      };
      setCurrentAd(chosen);
      setCurrentSong(song);
      saveStateToStorage(song, updatedQueue, newIndex, 0);
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);

    // Count real stream in Firestore
    try {
      if (song.id) {
        const sRef = doc(db, 'songs', song.id);
        updateDoc(sRef, {
          streamCount: increment(1),
        }).catch(() => {});
      }
    } catch {}

    const initialTime = typeof startPosition === 'number' && startPosition > 0 ? startPosition : 0;
    setCurrentTime(initialTime);

    // Save to deduplicated Recent Play History
    setHistory((prev) => {
      const filtered = prev.filter((s) => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 30);
      try {
        localStorage.setItem('pm_play_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    saveStateToStorage(song, updatedQueue, newIndex, initialTime);

    // Audio Element Execution
    resolvePlayableAudioUrl(song.id, song.audioFilePath).then((playableUrl) => {
      if (playableUrl && audioRef.current) {
        try {
          audioRef.current.src = playableUrl;
          if (initialTime > 0) {
            audioRef.current.currentTime = initialTime;
          }
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                synthRef.current.stop();
              })
              .catch((err) => {
                console.warn('Real audio playback note:', err);
                startSimulatedPlayback(initialTime);
              });
          }
        } catch {
          startSimulatedPlayback(initialTime);
        }
      } else {
        startSimulatedPlayback(initialTime);
      }
    }).catch(() => {
      startSimulatedPlayback(initialTime);
    });
  }, [queue, songsPlayedCounter, settings, hasAds, saveStateToStorage, startSimulatedPlayback, stopSimulatedPlayback]);

  // Continue Listening (Resumes from saved position)
  const continueListening = useCallback((song: Song) => {
    const savedRec = playbackPositions[song.id];
    const resumePos = savedRec && savedRec.position > 5 ? savedRec.position : 0;
    playSong(song, undefined, resumePos);
  }, [playbackPositions, playSong]);

  // Queue Operations
  const addToQueue = useCallback((items: Song | Song[]) => {
    const newItems = Array.isArray(items) ? items : [items];
    if (newItems.length === 0) return;

    setQueue((prevQueue) => {
      const updated = [...prevQueue, ...newItems];
      try {
        localStorage.setItem('pm_queue', JSON.stringify(updated));
      } catch {}

      // If no song is currently playing, start playing the first added song
      if (!currentSong && updated.length > 0) {
        playSong(updated[0], updated);
      }
      return updated;
    });
  }, [currentSong, playSong]);

  const playNext = useCallback((song: Song) => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) {
        playSong(song, [song]);
        return [song];
      }
      const newQueue = [...prevQueue];
      // Insert right after current song
      const insertIdx = Math.min(queueIndex + 1, newQueue.length);
      newQueue.splice(insertIdx, 0, song);
      try {
        localStorage.setItem('pm_queue', JSON.stringify(newQueue));
      } catch {}
      return newQueue;
    });
  }, [queueIndex, playSong]);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prevQueue) => {
      if (index < 0 || index >= prevQueue.length) return prevQueue;
      const newQueue = prevQueue.filter((_, i) => i !== index);

      try {
        localStorage.setItem('pm_queue', JSON.stringify(newQueue));
      } catch {}

      if (index < queueIndex) {
        const nextIdx = queueIndex - 1;
        setQueueIndex(nextIdx);
        try {
          localStorage.setItem('pm_queue_index', String(nextIdx));
        } catch {}
      } else if (index === queueIndex) {
        // If current song removed, play next or previous
        if (newQueue.length > 0) {
          const nextIdx = index < newQueue.length ? index : 0;
          setQueueIndex(nextIdx);
          playSong(newQueue[nextIdx], newQueue);
        } else {
          pauseSong();
          setCurrentSong(null);
          setQueueIndex(0);
        }
      }

      return newQueue;
    });
  }, [queueIndex, playSong]);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prevQueue) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prevQueue.length ||
        toIndex < 0 ||
        toIndex >= prevQueue.length ||
        fromIndex === toIndex
      ) {
        return prevQueue;
      }

      const newQueue = [...prevQueue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);

      // Adjust queueIndex to track active song correctly
      let nextQueueIndex = queueIndex;
      if (fromIndex === queueIndex) {
        nextQueueIndex = toIndex;
      } else if (fromIndex < queueIndex && toIndex >= queueIndex) {
        nextQueueIndex = queueIndex - 1;
      } else if (fromIndex > queueIndex && toIndex <= queueIndex) {
        nextQueueIndex = queueIndex + 1;
      }

      setQueueIndex(nextQueueIndex);
      try {
        localStorage.setItem('pm_queue', JSON.stringify(newQueue));
        localStorage.setItem('pm_queue_index', String(nextQueueIndex));
      } catch {}

      return newQueue;
    });
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    setQueue((prevQueue) => {
      // Keep only current song in queue
      if (currentSong) {
        const single = [currentSong];
        setQueueIndex(0);
        try {
          localStorage.setItem('pm_queue', JSON.stringify(single));
          localStorage.setItem('pm_queue_index', '0');
        } catch {}
        return single;
      }
      try {
        localStorage.setItem('pm_queue', JSON.stringify([]));
        localStorage.setItem('pm_queue_index', '0');
      } catch {}
      return [];
    });
  }, [currentSong]);

  const setQueueIndexDirectly = useCallback((index: number) => {
    if (index >= 0 && index < queue.length) {
      setQueueIndex(index);
      playSong(queue[index], queue);
    }
  }, [queue, playSong]);

  const openNowPlaying = () => setIsNowPlayingOpen(true);
  const closeNowPlaying = () => setIsNowPlayingOpen(false);

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pm_shuffle', String(next));
      } catch {}
      return next;
    });
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      const next: RepeatMode = prev === 'OFF' ? 'ALL' : prev === 'ALL' ? 'ONE' : 'OFF';
      try {
        localStorage.setItem('pm_repeat_mode', next);
      } catch {}
      return next;
    });
  };

  const toggleAutoplay = () => {
    setIsAutoplayEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pm_autoplay', String(next));
      } catch {}
      return next;
    });
  };

  const toggleLikeSong = (songId: string) => {
    setLikedSongIds((prev) => {
      const isAlreadyLiked = prev.includes(songId);
      const updated = isAlreadyLiked ? prev.filter((id) => id !== songId) : [...prev, songId];
      try {
        localStorage.setItem('pm_liked_songs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isLiked = (songId: string) => likedSongIds.includes(songId);

  const pauseSong = () => {
    stopSimulatedPlayback();
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    if (currentSong) {
      saveStateToStorage(currentSong, queue, queueIndex, currentTime);
    }
  };

  const resumeSong = () => {
    if (isAdPlaying) return;
    setAudioError(null);
    if (audioRef.current && currentSong?.audioFilePath) {
      if (audioRef.current.src) {
        audioRef.current.play().catch(() => {
          startSimulatedPlayback(currentTime);
        });
      } else {
        playSong(currentSong, queue, currentTime);
        return;
      }
    } else {
      startSimulatedPlayback(currentTime);
    }
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      if (!currentSong && queue.length > 0) {
        playSong(queue[0], queue);
      } else {
        resumeSong();
      }
    }
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = time;
    }
    if (simulationTimerRef.current) {
      startSimulatedPlayback(time);
    }
  };

  const setVolumeLevel = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const nextSong = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'ONE' && currentSong) {
      seek(0);
      resumeSong();
      return;
    }

    if (isShuffle && queue.length > 1) {
      let randomIdx = Math.floor(Math.random() * queue.length);
      if (randomIdx === queueIndex) {
        randomIdx = (queueIndex + 1) % queue.length;
      }
      setQueueIndex(randomIdx);
      playSong(queue[randomIdx], queue);
      return;
    }

    if (queueIndex < queue.length - 1) {
      const nextIdx = queueIndex + 1;
      setQueueIndex(nextIdx);
      playSong(queue[nextIdx], queue);
    } else {
      // Reached the end of queue
      if (repeatMode === 'ALL') {
        setQueueIndex(0);
        playSong(queue[0], queue);
      } else if (isAutoplayEnabled && currentSong) {
        // Trigger Autoplay recommendations!
        const recommendations = getAutoplayRecommendations(currentSong, queue);
        if (recommendations.length > 0) {
          const updatedQ = [...queue, ...recommendations];
          const nextIdx = queueIndex + 1;
          setQueue(updatedQ);
          setQueueIndex(nextIdx);
          playSong(recommendations[0], updatedQ);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    }
  }, [queue, queueIndex, repeatMode, currentSong, isShuffle, isAutoplayEnabled, getAutoplayRecommendations, playSong]);

  const prevSong = useCallback(() => {
    if (queue.length === 0) return;

    // If played more than 3 seconds, restart current song
    if (currentTime > 3) {
      seek(0);
      return;
    }

    const prevIdx = queueIndex === 0 ? (repeatMode === 'ALL' ? queue.length - 1 : 0) : queueIndex - 1;
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx], queue);
  }, [queue, queueIndex, currentTime, repeatMode, playSong]);

  const handleSongEnded = () => {
    if (repeatMode === 'ONE' && currentSong) {
      seek(0);
      resumeSong();
    } else {
      nextSong();
    }
  };

  const retryPlayback = () => {
    if (currentSong) {
      playSong(currentSong, queue, currentTime);
    }
  };

  const dismissAd = () => {
    setIsAdPlaying(false);
    setCurrentAd(null);
    resumeAudioTrack();
  };

  const downloadForOffline = async (song: Song): Promise<boolean> => {
    if (!canDownloadOffline) return false;
    try {
      const updated = Array.from(new Set([...offlineSongs, song.id]));
      setOfflineSongs(updated);
      localStorage.setItem('pm_offline_tracks', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <PlaybackContext.Provider
      value={{
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        isAdPlaying,
        currentAd,
        adCountdown,
        streamQualifiedNotice,
        isNowPlayingOpen,
        openNowPlaying,
        closeNowPlaying,
        isShuffle,
        toggleShuffle,
        repeatMode,
        isRepeat: repeatMode !== 'OFF',
        toggleRepeat,
        isAutoplayEnabled,
        toggleAutoplay,
        likedSongIds,
        toggleLikeSong,
        isLiked,
        history,
        playbackPositions,
        playSong,
        continueListening,
        pauseSong,
        resumeSong,
        togglePlay,
        seek,
        setVolumeLevel,
        toggleMute,
        nextSong,
        prevSong,
        addToQueue,
        playNext,
        removeFromQueue,
        reorderQueue,
        clearQueue,
        setQueueIndexDirectly,
        dismissAd,
        offlineSongs,
        downloadForOffline,
        catalogSongs,
        setCatalogSongs,
        audioError,
        retryPlayback,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export function usePlayback() {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
}
