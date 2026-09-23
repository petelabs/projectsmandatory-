import React, { useState, useMemo } from 'react';
import {
  Heart,
  Download,
  ListMusic,
  Disc,
  User,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { Song } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';

interface LibraryPageProps {
  songs: Song[];
  onNavigate: (path: string) => void;
}

type LibraryTab = 'liked' | 'downloads' | 'playlists' | 'artists';

export const LibraryPage: React.FC<LibraryPageProps> = ({
  songs,
  onNavigate,
}) => {
  const {
    currentSong,
    isPlaying,
    playSong,
    likedSongIds,
    offlineSongs,
  } = usePlayback();
  const { canDownloadOffline } = useSubscription();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<LibraryTab>('liked');

  // Filtered lists
  const likedSongsList = useMemo(() => {
    return songs.filter((s) => likedSongIds.includes(s.id));
  }, [songs, likedSongIds]);

  const downloadedSongsList = useMemo(() => {
    return songs.filter((s) => offlineSongs.includes(s.id));
  }, [songs, offlineSongs]);

  // Unique artists from user library
  const savedArtists = useMemo(() => {
    const map = new Map<string, { name: string; count: number; image: string; id: string }>();
    songs.forEach((s) => {
      if (!map.has(s.artist)) {
        map.set(s.artist, {
          name: s.artist,
          count: 1,
          image: s.coverImage,
          id: s.artistId || `artist-${s.artist.toLowerCase().replace(/\s+/g, '-')}`,
        });
      }
    });
    return Array.from(map.values()).slice(0, 8);
  }, [songs]);

  const tabs = [
    { id: 'liked' as LibraryTab, label: 'Liked Songs', count: likedSongsList.length },
    { id: 'downloads' as LibraryTab, label: 'Downloads', count: downloadedSongsList.length },
    { id: 'playlists' as LibraryTab, label: 'Playlists', count: 3 },
    { id: 'artists' as LibraryTab, label: 'Artists', count: savedArtists.length },
  ];

  return (
    <div className="space-y-4 pb-6 text-left">
      {/* Title */}
      <div className="pt-1">
        <h1
          className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-[#111827]'
          }`}
        >
          Your Library
        </h1>
      </div>

      {/* Library Segmented Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
              activeTab === tab.id
                ? 'bg-[#1455D9] text-white shadow-sm'
                : isDark
                ? 'bg-[#11151F] text-slate-300 border border-slate-800'
                : 'bg-white text-slate-700 border border-[#E5E7EB]'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ===================================================
          TAB 1: LIKED SONGS
          =================================================== */}
      {activeTab === 'liked' && (
        <div className="space-y-2">
          {likedSongsList.length === 0 ? (
            <div
              className={`p-10 rounded-2xl text-center border ${
                isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <Heart className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold">Your library is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Start listening and tap the heart icon on any song to save it here.
              </p>
              <button
                onClick={() => onNavigate('/music')}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
              >
                Browse Music
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {likedSongsList.map((song) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, likedSongsList)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none active:scale-[0.99] border ${
                      isThisPlaying
                        ? isDark
                          ? 'bg-slate-800/80 border-[#1455D9]/50'
                          : 'bg-blue-50/70 border-[#1455D9]/40'
                        : isDark
                        ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-800/40'
                        : 'bg-white border-[#E5E7EB] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <h4
                          className={`text-sm font-bold truncate leading-tight ${
                            isThisPlaying ? 'text-[#1455D9]' : isDark ? 'text-white' : 'text-[#111827]'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">
                        {song.duration || '3:30'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================
          TAB 2: DOWNLOADS (OFFLINE SONGS)
          =================================================== */}
      {activeTab === 'downloads' && (
        <div className="space-y-3">
          {!canDownloadOffline && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-300">
                    Offline Listening requires Premium Plus
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Save mobile data and listen without an internet connection.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/pricing')}
                className="px-3 py-1.5 rounded-lg bg-[#E53935] text-white text-xs font-bold whitespace-nowrap shadow-sm"
              >
                Upgrade
              </button>
            </div>
          )}

          {downloadedSongsList.length === 0 ? (
            <div
              className={`p-10 rounded-2xl text-center border ${
                isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <Download className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold">No offline downloads yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Tap the download button on any song to save it for offline listening.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {downloadedSongsList.map((song) => {
                const isThisPlaying = currentSong?.id === song.id && isPlaying;
                return (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, downloadedSongsList)}
                    className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none active:scale-[0.99] border ${
                      isDark
                        ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-800/40'
                        : 'bg-white border-[#E5E7EB] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold truncate leading-tight">
                            {song.title}
                          </h4>
                          {/* Success Green #18A558 Downloaded Badge */}
                          <ShieldCheck className="w-3.5 h-3.5 text-[#18A558]" />
                        </div>
                        <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <span className="text-xs text-slate-400 font-mono">
                      {song.duration || '3:30'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================================================
          TAB 3: PLAYLISTS
          =================================================== */}
      {activeTab === 'playlists' && (
        <div className="space-y-2">
          {[
            { title: 'Favorites & Heavy Rotation', count: '14 songs', color: 'from-blue-600 to-indigo-700' },
            { title: 'Acoustic & Malawi Soul', count: '8 songs', color: 'from-emerald-600 to-teal-700' },
            { title: 'Afrobeats Workout', count: '21 songs', color: 'from-rose-600 to-amber-600' },
          ].map((pl) => (
            <div
              key={pl.title}
              onClick={() => onNavigate('/music')}
              className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition active:scale-[0.99] ${
                isDark
                  ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                  : 'bg-white border-[#E5E7EB] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${pl.color} flex items-center justify-center text-white`}
                >
                  <ListMusic className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight">{pl.title}</h4>
                  <span className="text-xs text-slate-400">{pl.count}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      )}

      {/* ===================================================
          TAB 4: ARTISTS
          =================================================== */}
      {activeTab === 'artists' && (
        <div className="space-y-2">
          {savedArtists.map((artist) => (
            <div
              key={artist.name}
              onClick={() => onNavigate(`/artist/${artist.id}`)}
              className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition active:scale-[0.99] ${
                isDark
                  ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                  : 'bg-white border-[#E5E7EB] hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-[#1455D9]/40"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="text-sm font-bold leading-tight">{artist.name}</h4>
                  <span className="text-xs text-slate-400">Verified Artist</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
