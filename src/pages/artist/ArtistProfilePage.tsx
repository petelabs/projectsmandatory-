import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  ShieldCheck,
  Play,
  Pause,
  DollarSign,
  Heart,
  Share2,
  ExternalLink,
  Users,
  Crown,
  ShoppingBag,
  Ticket,
  Sparkles,
  Layers,
  Music,
} from 'lucide-react';
import { Song, ArtistProfile, MerchProduct, EventRecord, Album } from '../../types';
import { usePlayback } from '../../context/PlaybackContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ArtistTipModal } from '../../components/monetization/ArtistTipModal';
import { ArtistFanMembershipModal } from '../../components/monetization/ArtistFanMembershipModal';
import { SongActionMenuModal } from '../../components/common/SongActionMenuModal';
import { extractArtistsFromSongs } from '../../lib/recommendations';
import { INITIAL_ALBUMS } from '../../data/initialData';
import { api } from '../../lib/api';
import { useLibrary } from '../../context/LibraryContext';
import { shareArtist } from '../../lib/share';

interface ArtistProfilePageProps {
  artistId: string;
  songs: Song[];
  albums?: Album[];
  onSelectSong: (songId: string) => void;
  onNavigate: (path: string) => void;
}

export const ArtistProfilePage: React.FC<ArtistProfilePageProps> = ({
  artistId,
  songs,
  albums = INITIAL_ALBUMS,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { currentSong, isPlaying, playSong } = usePlayback();
  const { isArtistFollowed, toggleFollowArtist } = useLibrary();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'popular' | 'releases' | 'merch' | 'events' | 'about'>('popular');
  const [selectedActionSong, setSelectedActionSong] = useState<Song | null>(null);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [merchItems, setMerchItems] = useState<MerchProduct[]>([]);
  const [eventsList, setEventsList] = useState<EventRecord[]>([]);

  // Dynamically resolve artist name from songs catalog or URL
  const matchedSong = songs.find(
    (s) => s.artistId === artistId || s.artist.toLowerCase() === decodeURIComponent(artistId).toLowerCase()
  );
  const artistName =
    matchedSong?.artist ||
    decodeURIComponent(artistId)
      .replace(/^artist-/, '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const isFollowing = isArtistFollowed(artistId, artistName);

  const toggleFollow = () => {
    toggleFollowArtist(artistId, artistName);
    showToast(!isFollowing ? `Following ${artistName}` : `Unfollowed ${artistName}`, 'info');
  };

  const artistSongs = songs.filter(
    (s) => (s.artistId && s.artistId === artistId) || s.artist.toLowerCase() === artistName.toLowerCase()
  );

  const displaySongs = artistSongs;
  const totalStreams = artistSongs.reduce((sum, s) => sum + (s.streamCount || s.downloadCount || 0), 0);

  const artistAlbums = albums.filter(
    (al) => al.artist.toLowerCase().includes(artistName.toLowerCase()) || al.artistId === artistId
  );

  const artistAvatar =
    displaySongs[0]?.coverImage ||
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop';

  // Related Artists
  const relatedArtists = useMemo(() => {
    return extractArtistsFromSongs(songs)
      .filter((a) => !a.name.toLowerCase().includes(artistName.toLowerCase()))
      .slice(0, 4);
  }, [songs, artistName]);

  useEffect(() => {
    api.getArtistMerch(artistId).then((res) => {
      if (res.success) setMerchItems(res.products || []);
    });
    api.getArtistEvents(artistId).then((res) => {
      if (res.success) setEventsList(res.events || []);
    });
  }, [artistId]);

  return (
    <>
      <div className="space-y-6 pb-12 text-left">
        {/* Top Bar with Back and More options */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => window.history.back()}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 rounded-full transition active:scale-95 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
            }`}
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.2px]" />
          </button>

          <button
            onClick={async () => {
              await shareArtist({ id: artistId, name: artistName }, () => {
                showToast('Artist profile link copied!', 'success');
              });
            }}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2 rounded-full transition active:scale-95 ${
              isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-black'
            }`}
            aria-label="Share artist"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* ===================================================
            ARTIST HEADER: CENTERED CIRCLE, NAME, VERIFIED, LISTENERS
            =================================================== */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-[#1455D9]/30">
            <img
              src={artistAvatar}
              alt={artistName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-[#111827]'
                }`}
              >
                {artistName}
              </h1>
              <div
                className="w-5 h-5 rounded-full bg-[#18A558] text-white flex items-center justify-center shadow-sm"
                title="Verified Artist"
              >
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5px]" />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {totalStreams > 0
                ? `${totalStreams.toLocaleString()} total streams`
                : `${artistSongs.length} release${artistSongs.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {/* Action Row: Follow Button + Tip Artist + VIP Fan Club */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={toggleFollow}
              className={`min-h-[40px] px-5 py-2 rounded-full text-xs font-bold transition active:scale-95 shadow-sm ${
                isFollowing
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-[#1455D9] hover:bg-[#0f44b3] text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>

            <button
              onClick={() => setShowTipModal(true)}
              className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-bold border transition active:scale-95 flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#11151F] border-slate-700 text-white hover:border-slate-600'
                  : 'bg-white border-[#E5E7EB] text-[#111827] hover:border-slate-300 shadow-sm'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-[#18A558]" />
              <span>Tip Artist</span>
            </button>

            <button
              onClick={() => setShowMembershipModal(true)}
              className="min-h-[40px] px-4 py-2 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-950/40"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>VIP Fan Club</span>
            </button>
          </div>
        </div>

        {/* ===================================================
            TABS: POPULAR | RELEASES | MERCH | EVENTS | ABOUT
            =================================================== */}
        <div className="border-b border-slate-200 dark:border-slate-800">
          <div className="flex justify-around overflow-x-auto">
            {[
              { id: 'popular' as const, label: 'Popular' },
              { id: 'releases' as const, label: 'Releases' },
              { id: 'merch' as const, label: `Merch (${merchItems.length})` },
              { id: 'events' as const, label: `Events (${eventsList.length})` },
              { id: 'about' as const, label: 'About' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-2 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#1455D9] text-[#1455D9]'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===================================================
            TAB 1: POPULAR (NUMBERED 1 TO 5 LIST)
            =================================================== */}
        {activeTab === 'popular' && (
          <div className="space-y-6">
            {displaySongs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <Music className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-400">No tracks published yet by {artistName}</p>
                <p className="text-xs text-slate-500">Check back soon for new studio master releases.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {displaySongs.slice(0, 5).map((song, index) => {
                  const isThisPlaying = currentSong?.id === song.id && isPlaying;

                  return (
                    <div
                      key={song.id}
                      onClick={() => playSong(song, displaySongs)}
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
                        <span className="w-5 text-center font-mono font-bold text-xs text-slate-400">
                          {index + 1}
                        </span>

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
                          <p className="text-xs text-slate-400 truncate">
                            {(song.streamCount || song.downloadCount || 0).toLocaleString()} streams
                          </p>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-2 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedActionSong(song);
                        }}
                      >
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                          {song.duration || '3:30'}
                        </span>
                        <button
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white transition rounded-full"
                          aria-label={`Options for ${song.title}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Fans Also Like / Related Artists */}
            {relatedArtists.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold tracking-tight">Fans Also Like</h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1">
                  {relatedArtists.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onNavigate(`/artist/${rel.id}`)}
                      className="flex flex-col items-center text-center cursor-pointer group flex-shrink-0 w-24 active:scale-95 transition"
                    >
                      <img
                        src={rel.image}
                        alt={rel.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-[#1455D9]/40 group-hover:ring-[#1455D9] transition mb-1.5"
                      />
                      <span className="text-xs font-bold truncate w-full">{rel.name}</span>
                      <span className="text-[10px] text-slate-400 truncate w-full">{rel.genres[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TAB 2: RELEASES (ALBUMS & SINGLES)
            =================================================== */}
        {activeTab === 'releases' && (
          <div className="space-y-6">
            {artistAlbums.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Albums & EPs
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {artistAlbums.map((album) => (
                    <div
                      key={album.id}
                      onClick={() => onNavigate(`/album/${album.id}`)}
                      className="group cursor-pointer space-y-2 text-left"
                    >
                      <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
                        <img
                          src={album.coverImage}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#1455D9] text-white text-[9px] font-bold uppercase">
                          {album.type}
                        </div>
                      </div>
                      <h4 className="text-xs font-bold truncate">{album.title}</h4>
                      <p className="text-[11px] text-slate-400">{album.genre}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                All Tracks & Singles
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {displaySongs.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => playSong(song, displaySongs)}
                    className="group cursor-pointer space-y-2 text-left"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md">
                      <img
                        src={song.coverImage}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <h4 className="text-xs font-bold truncate">{song.title}</h4>
                    <p className="text-[11px] text-slate-400">{song.genre || 'Single'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================
            TAB 3: MERCHANDISE STOREFRONT
            =================================================== */}
        {activeTab === 'merch' && (
          <div className="space-y-4">
            {merchItems.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Merch Available Yet</h4>
                <p className="text-xs text-slate-400">Official apparel and merchandise drops will appear here soon.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {merchItems.map((item) => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs truncate">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono font-bold text-white text-xs">
                          MK {item.priceMWK.toLocaleString()}
                        </span>
                        <button
                          onClick={() => showToast(`Selected "${item.title}". Pre-order checkout ready!`, 'success')}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                        >
                          Order
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================
            TAB 4: LIVE CONCERTS & EVENTS
            =================================================== */}
        {activeTab === 'events' && (
          <div className="space-y-3">
            {eventsList.length === 0 ? (
              <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 text-center space-y-2">
                <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Upcoming Concerts</h4>
                <p className="text-xs text-slate-400">Stay tuned for upcoming tour dates and acoustic sessions.</p>
              </div>
            ) : (
              eventsList.map((evt) => (
                <div key={evt.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-sm">{evt.eventName}</h4>
                    <div className="text-xs text-slate-400">
                      {evt.venue}, {evt.city} • {new Date(evt.eventDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-amber-400 text-xs mb-1">
                      From MK {(evt.ticketTypes[0]?.priceMWK || 5000).toLocaleString()}
                    </div>
                    <button
                      onClick={() => showToast(`Tickets for "${evt.eventName}" are reserved!`, 'success')}
                      className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs"
                    >
                      Get Ticket
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===================================================
            TAB 5: ABOUT
            =================================================== */}
        {activeTab === 'about' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Biography</h3>
            <p>
              {artistName} is an acclaimed musical pioneer redefining contemporary African rhythms, blending authentic storytelling with energetic afro-fusion beats.
            </p>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-slate-400">
              <span>Origin: Lilongwe, Malawi</span>
              <span>Joined: 2026</span>
            </div>
          </div>
        )}

        {/* Modal: Tip Artist */}
        {showTipModal && (
          <ArtistTipModal
            artistId={artistId}
            artistName={artistName}
            isOpen={showTipModal}
            onClose={() => setShowTipModal(false)}
            onTipSuccess={() => {
              showToast(`Thank you! Tip sent to ${artistName}`, 'success');
            }}
          />
        )}

        {/* Modal: VIP Fan Club */}
        {showMembershipModal && (
          <ArtistFanMembershipModal
            artistId={artistId}
            artistName={artistName}
            userId={user?.id || 'guest'}
            userEmail={user?.email || 'fan@example.com'}
            userName={user?.name || 'Loyal Fan'}
            isOpen={showMembershipModal}
            onClose={() => setShowMembershipModal(false)}
            onJoinSuccess={() => {
              showToast(`You are now an official VIP member of ${artistName}!`, 'success');
            }}
          />
        )}
      </div>

      {/* Song Action Menu Modal */}
      <SongActionMenuModal
        song={selectedActionSong}
        isOpen={!!selectedActionSong}
        onClose={() => setSelectedActionSong(null)}
        onNavigate={onNavigate}
      />
    </>
  );
};
