import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { Song, SubscriptionTier } from '../types';
import { useSubscription } from './SubscriptionContext';
import { useAuth } from './AuthContext';
import { api } from '../lib/api';

interface SponsorAd {
  id: string;
  brandName: string;
  tagline: string;
  ctaText?: string;
  linkUrl?: string;
}

interface PlaybackContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Song[];
  isAdPlaying: boolean;
  currentAd: SponsorAd | null;
  adCountdown: number;
  streamQualifiedNotice: string | null;
  isNowPlayingOpen: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  isShuffle: boolean;
  toggleShuffle: () => void;
  isRepeat: boolean;
  toggleRepeat: () => void;
  likedSongIds: string[];
  toggleLikeSong: (songId: string) => void;
  isLiked: (songId: string) => boolean;
  history: Song[];
  playSong: (song: Song, newQueue?: Song[]) => void;
  pauseSong: () => void;
  resumeSong: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolumeLevel: (vol: number) => void;
  toggleMute: () => void;
  nextSong: () => void;
  prevSong: () => void;
  dismissAd: () => void;
  offlineSongs: string[]; // ids of downloaded tracks
  downloadForOffline: (song: Song) => Promise<boolean>;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentTier, hasAds, canDownloadOffline, settings } = useSubscription();
  const { user } = useAuth();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  // Play history
  const [history, setHistory] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('pm_play_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Liked songs
  const [likedSongIds, setLikedSongIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_liked_songs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['song-tiyende', 'song-sikono'];
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

  // Offline Downloaded Tracks (stored in localStorage cache for offline playback)
  const [offlineSongs, setOfflineSongs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pm_offline_tracks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Audio element reference (mock synthetic synthesizer fallback if audioFilePath is local)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      handleSongEnded();
    };

    const onError = () => {
      // Gracefully handle preview playback if audio link is synthetic
      console.info('Audio track using browser audio preview stream');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Handle ad countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAdPlaying && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => {
          if (prev <= 1) {
            // Ad completed, resume music!
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

  // Stream Qualification Watcher:
  // Monitors real listening time and verifies against min listening time (30s) and percentage (50%)
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

  const resumeAudioTrack = () => {
    if (audioRef.current && currentSong) {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const playSong = useCallback((song: Song, newQueue?: Song[]) => {
    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue);
      const idx = newQueue.findIndex(s => s.id === song.id);
      setQueueIndex(idx !== -1 ? idx : 0);
    }

    // Reset stream reporting for new song
    setStreamReported(false);
    playTimeAccumulatorRef.current = 0;
    lastTickTimeRef.current = Date.now();

    // Check if Free Ad Bumper should trigger
    const nextCounter = songsPlayedCounter + 1;
    setSongsPlayedCounter(nextCounter);

    const freq = settings.adSettings.frequencyTracks || 3;
    if (hasAds && settings.adSettings.enabled && nextCounter > 1 && nextCounter % freq === 0) {
      // Trigger Ad break!
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
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);

    // Track recently played in history
    setHistory(prev => {
      const filtered = prev.filter(s => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('pm_play_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (audioRef.current) {
      // If audio file path is provided, play it
      if (song.audioFilePath) {
        audioRef.current.src = song.audioFilePath;
        audioRef.current.play().catch(() => {
          // If media URL is mock or restricted, keep simulated progress
          simulateProgress();
        });
      } else {
        // Simulated track playback with realistic timer
        simulateProgress();
      }
    }
  }, [songsPlayedCounter, settings, hasAds]);

  const openNowPlaying = () => setIsNowPlayingOpen(true);
  const closeNowPlaying = () => setIsNowPlayingOpen(false);

  const toggleShuffle = () => setIsShuffle(prev => !prev);
  const toggleRepeat = () => setIsRepeat(prev => !prev);

  const toggleLikeSong = (songId: string) => {
    setLikedSongIds(prev => {
      const isAlreadyLiked = prev.includes(songId);
      const updated = isAlreadyLiked ? prev.filter(id => id !== songId) : [...prev, songId];
      try {
        localStorage.setItem('pm_liked_songs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isLiked = (songId: string) => likedSongIds.includes(songId);

  const simulateProgress = () => {
    setCurrentTime(0);
    setDuration(210); // Standard 3:30 track
  };

  const pauseSong = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  const resumeSong = () => {
    if (isAdPlaying) return;
    if (audioRef.current && currentSong?.audioFilePath) {
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseSong();
    } else {
      resumeSong();
    }
  };

  const seek = (time: number) => {
    setCurrentTime(time);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = time;
    }
  };

  const setVolumeLevel = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const nextSong = () => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    playSong(queue[nextIdx]);
  };

  const prevSong = () => {
    if (queue.length === 0) return;
    const prevIdx = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIdx);
    playSong(queue[prevIdx]);
  };

  const handleSongEnded = () => {
    if (queue.length > 0 && queueIndex < queue.length - 1) {
      nextSong();
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
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
        isAdPlaying,
        currentAd,
        adCountdown,
        streamQualifiedNotice,
        isNowPlayingOpen,
        openNowPlaying,
        closeNowPlaying,
        isShuffle,
        toggleShuffle,
        isRepeat,
        toggleRepeat,
        likedSongIds,
        toggleLikeSong,
        isLiked,
        history,
        playSong,
        pauseSong,
        resumeSong,
        togglePlay,
        seek,
        setVolumeLevel,
        toggleMute,
        nextSong,
        prevSong,
        dismissAd,
        offlineSongs,
        downloadForOffline,
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
