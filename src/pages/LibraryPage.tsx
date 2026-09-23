import React, { useState, useMemo } from 'react';
import {
  Heart,
  Download,
  ListMusic,
  Disc,
  User,
  Play,
  Pause,
  Clock,
  MoreVertical,
  Plus,
  Trash2,
  Wifi,
  Settings,
  Share2,
  Crown,
  Sparkles,
} from 'lucide-react';
import { Song, Album } from '../types';
import { usePlayback } from '../context/PlaybackContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../context/ThemeContext';
import { useLibrary } from '../context/LibraryContext';
import { SongActionMenuModal } from '../components/common/SongActionMenuModal';
import { CreatePlaylistModal } from '../components/common/CreatePlaylistModal';
import { ShareModal } from '../components/common/ShareModal';

interface LibraryPageProps {
  songs: Song[];
  albums?: Album[];
  onNavigate: (path: string) => void;
}

type LibraryTab = 'liked' | 'playlists' | 'albums' | 'artists' | 'downloads' | 'recent';

export const LibraryPage: React.FC<LibraryPageProps> = ({
  songs,
  albums = [],
  onNavigate,
}) => {
  const {
    currentSong,
    isPlaying,
    playSong,
    likedSongIds,
    offlineSongs,
    history,
    queue,
  } = usePlayback();
  const { canDownloadOffline } = useSubscription();
  const { isDark } = useTheme();
  const {
    playlists,
    savedAlbumIds,
    followedArtistIds,
    downloadTasks,
    downloadSettings,
    updateDownloadSettings,
    saveQueueAsPlaylist,
    deleteDownload,
    clearListeningHistory,
    toggleSaveAlbum,
    toggleFollowArtist,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<LibraryTab>('liked');
  const [selectedMenuSong, setSelectedMenuSong] = useState<Song | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saveQueueTitle, setSaveQueueTitle] = useState('');
  const [isSaveQueueOpen, setIsSaveQueueOpen] = useState(false);

  // Filtered lists
  const likedSongsList = useMemo(() => {
    return songs.filter((s) => likedSongIds.includes(s.id));
  }, [songs, likedSongIds]);

  const downloadedSongsList = useMemo(() => {
    return songs.filter((s) => offlineSongs.includes(s.id));
  }, [songs, offlineSongs]);

  const savedAlbumsList = useMemo(() => {
    return albums.filter((a) => savedAlbumIds.includes(a.id));
  }, [albums, savedAlbumIds]);

  // Unique artists from followed IDs or catalog
  const followedArtists = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image: string; trackCount: number }>();
    songs.forEach((s) => {
      const artId = s.artistId || `artist-${s.artist.toLowerCase().replace(/\s+/g, '-')}`;
      if (followedArtistIds.includes(artId) || followedArtistIds.includes(s.artist)) {
        if (!map.has(artId)) {
          map.set(artId, {
            id: artId,
            name: s.artist,
            image: s.coverImage,
            trackCount: 1,
          });
        } else {
          map.get(artId)!.trackCount += 1;
        }
      }
    });
    return Array.from(map.values());
  }, [songs, followedArtistIds]);

  const tabs = [
    { id: 'liked' as LibraryTab, label: 'Liked Songs', count: likedSongsList.length },
    { id: 'playlists' as LibraryTab, label: 'Playlists', count: playlists.length },
    { id: 'albums' as LibraryTab, label: 'Albums', count: savedAlbumsList.length },
    { id: 'artists' as LibraryTab, label: 'Artists', count: followedArtists.length },
    { id: 'downloads' as LibraryTab, label: 'Downloads', count: downloadedSongsList.length },
    { id: 'recent' as LibraryTab, label: 'Recent', count: history.length },
  ];

  const handleSaveQueue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveQueueTitle.trim()) return;
    saveQueueAsPlaylist(saveQueueTitle);
    setSaveQueueTitle('');
    setIsSaveQueueOpen(false);
  };

  return (
    <>
      <div className="space-y-4 pb-8 text-left">
        {/* Title Bar */}
        <div className="flex items-center justify-between pt-1">
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-[#111827]'
            }`}
          >
            Your Library
          </h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#1455D9] text-white text-xs font-bold flex items-center gap-1 hover:bg-blue-600 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Playlist</span>
          </button>
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
          <div className="space-y-3">
            {likedSongsList.length === 0 ? (
              <div
                className={`p-10 rounded-2xl text-center border ${
                  isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <Heart className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-bold">No liked songs yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tap the heart icon on any track in the storefront or player to save it to your collection.
                </p>
                <button
                  onClick={() => onNavigate('/music')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
                >
                  Discover Music
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
                            : 'bg-blue-50 border-[#1455D9]/30'
                          : isDark
                          ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-850'
                          : 'bg-white border-[#E5E7EB] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                          <img
                            src={song.coverImage}
                            alt={song.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          {isThisPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Pause className="w-4 h-4 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-sm font-bold truncate leading-tight ${
                              isThisPlaying
                                ? 'text-[#1455D9]'
                                : isDark
                                ? 'text-white'
                                : 'text-[#111827]'
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-2 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMenuSong(song);
                        }}
                      >
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                          {song.duration || '3:30'}
                        </span>
                        <button
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition rounded-full"
                          aria-label="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TAB 2: PLAYLISTS
            =================================================== */}
        {activeTab === 'playlists' && (
          <div className="space-y-4">
            {/* Quick Actions Header */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#1455D9] text-white text-xs font-bold flex items-center gap-2 hover:bg-blue-600 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Playlist
              </button>

              {queue.length > 0 && (
                <button
                  onClick={() => setIsSaveQueueOpen(!isSaveQueueOpen)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition ${
                    isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Save Queue as Playlist
                </button>
              )}
            </div>

            {/* Save Queue Form Modal Banner */}
            {isSaveQueueOpen && (
              <form
                onSubmit={handleSaveQueue}
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Save Active Queue ({queue.length} songs)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={saveQueueTitle}
                    onChange={(e) => setSaveQueueTitle(e.target.value)}
                    placeholder="Queue Playlist Title..."
                    className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border ${
                      isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}

            {/* Playlists Grid */}
            {playlists.length === 0 ? (
              <div
                className={`p-10 rounded-2xl text-center border ${
                  isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <ListMusic className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-bold">No personal playlists yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Organize your favorite tracks into custom playlists for any vibe or event.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
                >
                  Create Playlist
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => onNavigate(`/playlist/${pl.id}`)}
                    className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer border transition active:scale-[0.99] ${
                      isDark
                        ? 'bg-[#11151F] border-slate-800 hover:border-slate-700'
                        : 'bg-white border-[#E5E7EB] hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={pl.coverImage}
                      alt={pl.title}
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-slate-800"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold truncate">{pl.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {pl.songIds.length} {pl.songIds.length === 1 ? 'track' : 'tracks'} • {pl.curator}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TAB 3: SAVED ALBUMS
            =================================================== */}
        {activeTab === 'albums' && (
          <div className="space-y-3">
            {savedAlbumsList.length === 0 ? (
              <div
                className={`p-10 rounded-2xl text-center border ${
                  isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <Disc className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-bold">No saved albums</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Save entire albums or EPs to access them directly from your library.
                </p>
                <button
                  onClick={() => onNavigate('/music')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
                >
                  Browse Albums
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {savedAlbumsList.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onNavigate(`/album/${album.id}`)}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer border transition active:scale-[0.99] ${
                      isDark ? 'bg-[#11151F] border-slate-800 hover:border-slate-700' : 'bg-white border-[#E5E7EB]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={album.coverImage}
                        alt={album.title}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-slate-800"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold truncate">{album.title}</h4>
                        <p className="text-xs text-slate-400 truncate">{album.artist}</p>
                        <span className="text-[10px] text-[#1455D9] font-semibold mt-0.5 block">
                          {album.type} • {album.genre}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TAB 4: FOLLOWED ARTISTS
            =================================================== */}
        {activeTab === 'artists' && (
          <div className="space-y-3">
            {followedArtists.length === 0 ? (
              <div
                className={`p-10 rounded-2xl text-center border ${
                  isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <User className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-bold">No followed artists</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Follow artists to receive notifications when they release new music or launch campaigns.
                </p>
                <button
                  onClick={() => onNavigate('/artists')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
                >
                  Explore Artists
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {followedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => onNavigate(`/artist/${artist.id}`)}
                    className={`p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer border transition active:scale-[0.98] ${
                      isDark ? 'bg-[#11151F] border-slate-800 hover:border-slate-700' : 'bg-white border-[#E5E7EB]'
                    }`}
                  >
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-16 h-16 rounded-full object-cover mb-2 ring-2 ring-[#1455D9]/40 bg-slate-800"
                    />
                    <h4 className="text-xs font-bold truncate w-full">{artist.name}</h4>
                    <span className="text-[10px] text-slate-400 mt-0.5">Following</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TAB 5: DOWNLOADS & OFFLINE STORAGE
            =================================================== */}
        {activeTab === 'downloads' && (
          <div className="space-y-4">
            {/* Download Settings Bar */}
            <div
              className={`p-3.5 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-[#1455D9]" />
                  <span className="text-xs font-bold">Download over Wi-Fi only</span>
                </div>
                <button
                  onClick={() =>
                    updateDownloadSettings({ wifiOnly: !downloadSettings.wifiOnly })
                  }
                  className={`w-10 h-5 rounded-full flex items-center p-0.5 transition ${
                    downloadSettings.wifiOnly ? 'bg-[#1455D9]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition transform ${
                      downloadSettings.wifiOnly ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-xs">
                <span className="text-slate-400 font-medium">Download Quality</span>
                <select
                  value={downloadSettings.quality}
                  onChange={(e) =>
                    updateDownloadSettings({
                      quality: e.target.value as '320kbps' | '160kbps',
                    })
                  }
                  className={`px-2 py-1 rounded-lg border text-xs font-bold outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="320kbps">High Quality (320kbps MP3)</option>
                  <option value="160kbps">Standard Quality (160kbps MP3)</option>
                </select>
              </div>
            </div>

            {/* List of Offline Downloads */}
            {!canDownloadOffline ? (
              <div
                className={`p-6 rounded-2xl border text-center space-y-3 ${
                  isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <Crown className="w-8 h-8 text-[#F59E0B] mx-auto" />
                <h3 className="text-base font-bold">Offline Downloads</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upgrade to Premium Plus to save tracks and play unlimited music offline anywhere in Malawi.
                </p>
                <button
                  onClick={() => onNavigate('/pricing')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1455D9] to-blue-700 text-white text-xs font-bold uppercase tracking-wider"
                >
                  View Plans & Upgrade
                </button>
              </div>
            ) : downloadedSongsList.length === 0 ? (
              <div
                className={`p-10 rounded-2xl text-center border ${
                  isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <Download className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-bold">No downloaded tracks</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tap the download icon on any song to save it for offline playback.
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
                      className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none border ${
                        isThisPlaying
                          ? isDark
                            ? 'bg-slate-800/80 border-[#1455D9]/50'
                            : 'bg-blue-50 border-[#1455D9]/30'
                          : isDark
                          ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-850'
                          : 'bg-white border-[#E5E7EB]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={song.coverImage}
                          alt={song.title}
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold truncate leading-tight">{song.title}</h4>
                          <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-md">
                          Offline Ready
                        </span>
                        <button
                          onClick={() => deleteDownload(song.id)}
                          className="p-2 text-slate-400 hover:text-rose-400 transition"
                          title="Remove download"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TAB 6: RECENTLY PLAYED
            =================================================== */}
        {activeTab === 'recent' && (
          <div className="space-y-3">
            {history.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={clearListeningHistory}
                  className="text-xs text-rose-500 font-bold hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
              </div>
            )}

            {history.length === 0 ? (
              <div
                className={`p-10 rounded-2xl text-center border ${
                  isDark ? 'bg-[#11151F] border-slate-800' : 'bg-white border-[#E5E7EB]'
                }`}
              >
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <h3 className="text-base font-bold">No recent listening history</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Songs you play will automatically appear here.
                </p>
                <button
                  onClick={() => onNavigate('/music')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#1455D9] text-white text-xs font-bold"
                >
                  Start Listening
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {history.map((song, idx) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;
                  return (
                    <div
                      key={`recent-${song.id}-${idx}`}
                      onClick={() => playSong(song, history)}
                      className={`p-2.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition select-none border ${
                        isThisPlaying
                          ? isDark
                            ? 'bg-slate-800/80 border-[#1455D9]/50'
                            : 'bg-blue-50 border-[#1455D9]/30'
                          : isDark
                          ? 'bg-[#11151F] border-slate-800/80 hover:bg-slate-850'
                          : 'bg-white border-[#E5E7EB]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={song.coverImage}
                          alt={song.title}
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold truncate leading-tight">{song.title}</h4>
                          <p className="text-xs text-slate-400 truncate">{song.artist}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMenuSong(song);
                        }}
                        className="p-2 text-slate-400 hover:text-white transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <SongActionMenuModal
        song={selectedMenuSong}
        isOpen={!!selectedMenuSong}
        onClose={() => setSelectedMenuSong(null)}
        onNavigate={onNavigate}
      />

      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(id) => onNavigate(`/playlist/${id}`)}
      />
    </>
  );
};
