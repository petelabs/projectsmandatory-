import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LogOut,
  Plus,
  Music,
  DollarSign,
  Download,
  Settings,
  ShoppingCart,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  Users,
  Radio,
  FileAudio,
} from 'lucide-react';
import { Song, Order, ArtistSettings } from '../../types';
import { api } from '../../lib/api';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../context/ToastContext';

interface AdminDashboardPageProps {
  onLogout: () => void;
  onNavigateStore: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onLogout,
  onNavigateStore,
}) => {
  const { adminToken, logout } = useAdmin();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'songs' | 'orders' | 'settings'>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<{
    totalRevenueMWK?: number;
    totalRevenue?: number;
    totalSales: number;
    totalDownloads: number;
    totalCustomers?: number;
    totalSongs: number;
  }>({
    totalRevenueMWK: 0,
    totalRevenue: 0,
    totalSales: 0,
    totalDownloads: 0,
    totalCustomers: 0,
    totalSongs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);

  // Artist settings state
  const [artistSettings, setArtistSettings] = useState<ArtistSettings>({
    artistName: 'PROJECTS MANDATORY',
    artistBio: 'Official studio recordings and master audio files directly from PROJECTS MANDATORY.',
    profileImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    contactEmail: 'management@projectsmandatory.com',
    contactPhone: '+265 999 123 456',
  });

  const loadData = async () => {
    if (!adminToken) return;
    setIsLoading(true);
    try {
      const [fetchedSongs, fetchedOrders, fetchedStats, fetchedSettings] = await Promise.all([
        api.admin.getSongs(adminToken),
        api.admin.getOrders(adminToken),
        api.admin.getStats(adminToken),
        api.getArtistSettings(),
      ]);

      setSongs(fetchedSongs);
      setOrders(fetchedOrders);
      setStats(fetchedStats);
      if (fetchedSettings) {
        setArtistSettings(fetchedSettings as ArtistSettings);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch admin data';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminToken]);

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !editingSong) return;

    try {
      if (editingSong.id) {
        await api.admin.updateSong(adminToken, editingSong.id, editingSong);
        showToast(`Updated "${editingSong.title}" successfully`, 'success');
      } else {
        const newSongData = {
          title: editingSong.title || 'Untitled Track',
          artist: editingSong.artist || 'PROJECTS MANDATORY',
          featuredArtists: editingSong.featuredArtists || '',
          priceMWK: Number(editingSong.priceMWK) || 1500,
          genre: editingSong.genre || 'Afro-fusion',
          releaseDate: editingSong.releaseDate || new Date().toISOString().split('T')[0],
          coverImage: editingSong.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
          description: editingSong.description || 'Studio master recording from PROJECTS MANDATORY.',
          producer: editingSong.producer || 'Mandatory Studios',
          fileSize: editingSong.fileSize || '10.5 MB',
          fileFormat: editingSong.fileFormat || '320kbps MP3 + WAV Master',
          isPublished: editingSong.isPublished !== false,
          isLatest: !!editingSong.isLatest,
          isFeatured: !!editingSong.isFeatured,
          lyrics: editingSong.lyrics || '',
        };
        await api.admin.createSong(adminToken, newSongData);
        showToast(`Created new track "${newSongData.title}"`, 'success');
      }

      setIsModalOpen(false);
      setEditingSong(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save song';
      showToast(msg, 'error');
    }
  };

  const handleTogglePublish = async (song: Song) => {
    if (!adminToken) return;
    try {
      const newPublished = !song.isPublished;
      await api.admin.updateSong(adminToken, song.id, { isPublished: newPublished });
      showToast(
        `Song "${song.title}" is now ${newPublished ? 'Published' : 'Unpublished (Draft)'}`,
        'info'
      );
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not toggle status';
      showToast(msg, 'error');
    }
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!adminToken) return;
    if (!window.confirm(`Are you sure you want to delete "${songTitle}" from the marketplace?`)) {
      return;
    }

    try {
      await api.admin.deleteSong(adminToken, songId);
      showToast(`Deleted "${songTitle}"`, 'info');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete song';
      showToast(msg, 'error');
    }
  };

  const handleUpdatePriceQuick = async (song: Song, newPrice: number) => {
    if (!adminToken || isNaN(newPrice) || newPrice < 0) return;
    try {
      await api.admin.updateSong(adminToken, song.id, { priceMWK: newPrice });
      showToast(`Updated price for "${song.title}" to MK ${newPrice.toLocaleString()}`, 'success');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update price';
      showToast(msg, 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    try {
      await api.admin.updateSettings(adminToken, artistSettings);
      showToast('Artist settings updated successfully', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not update settings';
      showToast(msg, 'error');
    }
  };

  const revenueDisplay = stats.totalRevenueMWK ?? stats.totalRevenue ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 text-left animate-in fade-in py-2">
      
      {/* Top Mobile-Friendly Admin Header Bar */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold tracking-wider">
              ARTIST ADMIN SUITE
            </span>
            <span className="text-[11px] font-mono text-slate-400">PayChangu Live Gateway</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            PROJECTS MANDATORY
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={onNavigateStore}
            className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Public Store
          </button>
          <button
            onClick={() => {
              logout();
              onLogout();
            }}
            className="min-h-[44px] px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 4 Core Stat Cards: REVENUE, SALES, DOWNLOADS, CUSTOMERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: REVENUE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">REVENUE</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block truncate">
            MK {revenueDisplay.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">Verified Payments</span>
        </div>

        {/* Card 2: SALES */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">SALES</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block">
            {stats.totalSales}
          </span>
          <span className="text-[10px] text-blue-400 font-medium">Paid Orders</span>
        </div>

        {/* Card 3: DOWNLOADS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">DOWNLOADS</span>
            <Download className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block">
            {stats.totalDownloads || orders.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0)}
          </span>
          <span className="text-[10px] text-orange-400 font-medium">Delivered Master Files</span>
        </div>

        {/* Card 4: CUSTOMERS */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">CUSTOMERS</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block">
            {stats.totalCustomers || new Set(orders.map((o) => o.customerEmail.toLowerCase())).size}
          </span>
          <span className="text-[10px] text-purple-400 font-medium">Unique Buyers</span>
        </div>
      </div>

      {/* Tabs Navigation (Horizontally scrollable on mobile) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('songs')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'songs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Songs & Pricing ({songs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>PayChangu Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Artist Settings</span>
        </button>
      </div>

      {/* ===================================================
          TAB 1: SONGS MANAGEMENT
          =================================================== */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Catalog Management
              </h2>
              <p className="text-xs text-slate-400">
                Upload master tracks, toggle publishing status, and set independent prices in MWK.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingSong({
                  title: '',
                  artist: 'PROJECTS MANDATORY',
                  priceMWK: 1500,
                  genre: 'Afro-fusion',
                  releaseDate: new Date().toISOString().split('T')[0],
                  coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
                  description: '',
                  fileSize: '10.5 MB',
                  fileFormat: '320kbps MP3 + WAV Master',
                  isPublished: true,
                  isLatest: false,
                  isFeatured: false,
                });
                setIsModalOpen(true);
              }}
              className="min-h-[44px] px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-rose-950/50 flex items-center justify-center gap-2 self-stretch sm:self-center transition"
            >
              <Plus className="w-4 h-4" />
              <span>UPLOAD NEW SONG</span>
            </button>
          </div>

          <div className="space-y-3">
            {songs.map((song) => (
              <div
                key={song.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                    <img
                      src={song.coverImage}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {song.isPublished ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 text-[10px] font-bold">
                          PUBLISHED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-950/70 border border-amber-800/80 text-amber-400 text-[10px] font-bold">
                          UNPUBLISHED (DRAFT)
                        </span>
                      )}
                      {song.isLatest && <Badge variant="accent" size="sm">LATEST</Badge>}
                      {song.isFeatured && <Badge variant="primary" size="sm">FEATURED</Badge>}
                      <span className="text-[11px] text-slate-400 font-mono">{song.genre}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {song.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {song.artist} • {song.downloadCount || 0} downloads
                    </p>
                  </div>
                </div>

                {/* Price & Action Controls */}
                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Price in MWK */}
                  <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-mono text-slate-400 font-bold">MK</span>
                    <input
                      type="number"
                      defaultValue={song.priceMWK}
                      onBlur={(e) => handleUpdatePriceQuick(song, Number(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUpdatePriceQuick(song, Number((e.target as HTMLInputElement).value));
                        }
                      }}
                      className="w-20 sm:w-24 bg-transparent text-sm font-black font-mono text-white focus:outline-none"
                      title="Edit Price in MWK"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Publish/Unpublish toggle */}
                    <button
                      onClick={() => handleTogglePublish(song)}
                      className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border transition flex items-center justify-center ${
                        song.isPublished
                          ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400'
                          : 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-800/60 text-amber-300'
                      }`}
                      title={song.isPublished ? 'Unpublish (Hide from store)' : 'Publish (Show in store)'}
                    >
                      {song.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit Song Modal */}
                    <button
                      onClick={() => {
                        setEditingSong(song);
                        setIsModalOpen(true);
                      }}
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center"
                      title="Edit Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Song */}
                    <button
                      onClick={() => handleDeleteSong(song.id, song.title)}
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition flex items-center justify-center"
                      title="Delete Track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================
          TAB 2: ORDERS LEDGER
          =================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                PayChangu Transactions Ledger
              </h2>
              <p className="text-xs text-slate-400">
                Verified customer payments and digital download tokens.
              </p>
            </div>
            <button
              onClick={loadData}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            <table className="w-full text-left text-xs text-slate-300 min-w-[600px]">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Tx Reference</th>
                  <th className="p-3">Customer & Contact</th>
                  <th className="p-3">Song</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold text-white">{ord.txRef}</td>
                    <td className="p-3">
                      <div className="font-sans font-semibold text-slate-200">{ord.customerName}</div>
                      <div className="text-[11px] text-slate-400">{ord.customerEmail}</div>
                      <div className="text-[11px] text-slate-500">{ord.customerPhone}</div>
                    </td>
                    <td className="p-3 font-sans font-medium text-slate-200">{ord.songTitle}</td>
                    <td className="p-3 font-bold text-white">MK {ord.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <Badge variant={ord.status === 'PAID' ? 'success' : 'warning'} size="sm">
                        {ord.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{ord.createdAt?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================
          TAB 3: ARTIST SETTINGS
          =================================================== */}
      {activeTab === 'settings' && (
        <div className="max-w-xl space-y-6">
          <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Artist Profile & Contacts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Public artist profile and PayChangu configuration.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <Input
                label="Artist Stage Name"
                value={artistSettings.artistName}
                onChange={(e) => setArtistSettings({ ...artistSettings, artistName: e.target.value })}
                required
              />

              <Input
                label="Profile Image URL"
                value={artistSettings.profileImage}
                onChange={(e) => setArtistSettings({ ...artistSettings, profileImage: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Artist Biography
                </label>
                <textarea
                  rows={3}
                  value={artistSettings.artistBio}
                  onChange={(e) => setArtistSettings({ ...artistSettings, artistBio: e.target.value })}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 text-slate-100 text-xs sm:text-sm p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Email"
                  value={artistSettings.contactEmail}
                  onChange={(e) => setArtistSettings({ ...artistSettings, contactEmail: e.target.value })}
                />
                <Input
                  label="Support Phone (Malawi)"
                  value={artistSettings.contactPhone}
                  onChange={(e) => setArtistSettings({ ...artistSettings, contactPhone: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="success" size="md">
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          MOBILE-OPTIMIZED MODAL: ADD / EDIT SONG
          =================================================== */}
      {isModalOpen && editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700 p-5 sm:p-7 shadow-2xl relative text-left my-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingSong(null);
              }}
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-lg bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 font-['Syne',sans-serif]">
              {editingSong.id ? 'Edit Track Details' : 'Upload New Master Track'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Set track metadata and independent price in Malawi Kwacha.
            </p>

            <form onSubmit={handleSaveSong} className="space-y-4">
              <Input
                label="Song Title"
                placeholder="e.g. Mandatory Anthem"
                value={editingSong.title || ''}
                onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Price (MWK)"
                  type="number"
                  placeholder="1500"
                  value={editingSong.priceMWK || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, priceMWK: Number(e.target.value) })}
                  required
                />
                <Input
                  label="Genre"
                  placeholder="Afro-fusion, Pop"
                  value={editingSong.genre || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Featured Artists"
                  placeholder="Optional"
                  value={editingSong.featuredArtists || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, featuredArtists: e.target.value })}
                />
                <Input
                  label="Producer"
                  placeholder="Mandatory Studios"
                  value={editingSong.producer || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, producer: e.target.value })}
                />
              </div>

              <Input
                label="Cover Image URL"
                placeholder="https://images.unsplash.com/..."
                value={editingSong.coverImage || ''}
                onChange={(e) => setEditingSong({ ...editingSong, coverImage: e.target.value })}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Track Description
                </label>
                <textarea
                  rows={2}
                  value={editingSong.description || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, description: e.target.value })}
                  placeholder="Liner notes..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 text-slate-100 text-xs sm:text-sm p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={editingSong.isPublished !== false}
                    onChange={(e) => setEditingSong({ ...editingSong, isPublished: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0"
                  />
                  <span>Published in Store</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={!!editingSong.isLatest}
                    onChange={(e) => setEditingSong({ ...editingSong, isLatest: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-rose-600 focus:ring-0"
                  />
                  <span>Latest Release</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSong(null);
                  }}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Save Track
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
