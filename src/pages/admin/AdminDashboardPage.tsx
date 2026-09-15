import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  FileAudio,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Song, Order, ArtistSettings } from '../../types';
import { api } from '../../lib/api';
import {
  uploadAudioToStorage,
  uploadCoverToStorage,
  subscribeAllSongs,
  subscribeOrders,
  subscribeArtistSettings,
  saveSongToFirestore,
  deleteSongFromFirestore,
  saveArtistSettingsToFirestore,
} from '../../lib/firebase';
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
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<Partial<Song> | null>(null);

  // File upload states for Firebase Storage
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState<number | null>(null);
  const [audioUploadSuccess, setAudioUploadSuccess] = useState(false);

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Artist settings state
  const [artistSettings, setArtistSettings] = useState<ArtistSettings>({
    artistName: 'PROJECTS MANDATORY',
    artistBio: 'Official studio recordings and master audio files directly from PROJECTS MANDATORY.',
    profileImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
    contactEmail: 'management@projectsmandatory.com',
    contactPhone: '+265 999 123 456',
  });

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setIsLoading(true);

    // 1. Subscribe to all songs in real-time
    const unsubscribeSongs = subscribeAllSongs((realtimeSongs) => {
      setSongs(realtimeSongs);
      setIsLoading(false);
    });

    // 2. Subscribe to orders in real-time
    const unsubscribeOrders = subscribeOrders((realtimeOrders) => {
      setOrders(realtimeOrders);
    });

    // 3. Subscribe to artist settings
    const unsubscribeSettings = subscribeArtistSettings((settings) => {
      if (settings) setArtistSettings(settings);
    });

    return () => {
      unsubscribeSongs();
      unsubscribeOrders();
      unsubscribeSettings();
    };
  }, []);

  // Compute live statistics from real Firestore orders
  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalSales = paidOrders.length;
  const totalDownloads = orders.reduce((sum, o) => sum + (o.downloadCount || 0), 0);
  const uniqueCustomers = new Set(paidOrders.map((o) => o.customerEmail.toLowerCase())).size;

  // Handle Cover File Selection
  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (.jpg, .png, .webp)', 'error');
      return;
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
    setCoverUploadProgress(0);

    try {
      showToast('Uploading cover artwork to Firebase Cloud Storage...', 'info');
      const { downloadUrl } = await uploadCoverToStorage(file, (pct) => {
        setCoverUploadProgress(pct);
      });

      setEditingSong((prev) => ({
        ...prev,
        coverImage: downloadUrl,
      }));
      setCoverUploadProgress(100);
      showToast('Cover artwork uploaded successfully!', 'success');
    } catch (err) {
      console.error('Cover upload error:', err);
      showToast('Failed to upload cover image to Firebase Storage', 'error');
      setCoverUploadProgress(null);
    }
  };

  // Handle Master Audio File Selection
  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check audio extension
    const validExts = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg'];
    const isAudio = validExts.some((ext) => file.name.toLowerCase().endsWith(ext)) || file.type.startsWith('audio/');
    if (!isAudio) {
      showToast('Please upload an audio master file (.mp3, .wav, .flac)', 'error');
      return;
    }

    setAudioFile(file);
    setAudioUploadProgress(0);
    setAudioUploadSuccess(false);

    try {
      showToast('Uploading studio master file to Firebase Cloud Storage...', 'info');
      const result = await uploadAudioToStorage(file, (pct) => {
        setAudioUploadProgress(pct);
      });

      setEditingSong((prev) => ({
        ...prev,
        audioFilePath: result.storagePath,
        audioFileName: result.fileName,
        fileSize: result.fileSize,
        fileFormat: result.fileFormat,
      }));

      setAudioUploadProgress(100);
      setAudioUploadSuccess(true);
      showToast(`Master file "${file.name}" uploaded to Cloud Storage!`, 'success');
    } catch (err) {
      console.error('Audio upload error:', err);
      showToast('Failed to upload master audio file to Firebase Storage', 'error');
      setAudioUploadProgress(null);
    }
  };

  const handleOpenAddModal = () => {
    setEditingSong({
      id: `pm-song-${Date.now()}`,
      title: '',
      artist: 'PROJECTS MANDATORY',
      featuredArtists: '',
      producer: 'Mandatory Studios',
      genre: 'Afro-fusion',
      priceMWK: 1500,
      releaseDate: new Date().toISOString().split('T')[0],
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      description: '',
      fileSize: '10.5 MB',
      fileFormat: '320kbps MP3 Master',
      isPublished: true,
      isLatest: false,
      isFeatured: false,
      isPopular: false,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    });
    setAudioFile(null);
    setAudioUploadProgress(null);
    setAudioUploadSuccess(false);
    setCoverFile(null);
    setCoverUploadProgress(null);
    setCoverPreviewUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (song: Song) => {
    setEditingSong(song);
    setAudioFile(null);
    setAudioUploadProgress(null);
    setAudioUploadSuccess(!!song.audioFilePath);
    setCoverFile(null);
    setCoverUploadProgress(null);
    setCoverPreviewUrl(song.coverImage || '');
    setIsModalOpen(true);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !editingSong.title) {
      showToast('Please provide a song title', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const songToSave: Song = {
        id: editingSong.id || `pm-song-${Date.now()}`,
        title: editingSong.title.trim(),
        artist: editingSong.artist?.trim() || 'PROJECTS MANDATORY',
        featuredArtists: editingSong.featuredArtists?.trim() || '',
        producer: editingSong.producer?.trim() || 'Mandatory Studios',
        genre: editingSong.genre?.trim() || 'Afro-fusion',
        priceMWK: Number(editingSong.priceMWK) || 1500,
        releaseDate: editingSong.releaseDate || new Date().toISOString().split('T')[0],
        coverImage:
          editingSong.coverImage ||
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
        description: editingSong.description || 'Official studio master recording from PROJECTS MANDATORY.',
        audioFilePath: editingSong.audioFilePath || '/audio/sample_master.mp3',
        audioFileName: editingSong.audioFileName || `${editingSong.title || 'track'}.mp3`,
        fileSize: editingSong.fileSize || '10.2 MB',
        fileFormat: editingSong.fileFormat || '320kbps MP3 HQ Master',
        isPublished: editingSong.isPublished !== false,
        isLatest: !!editingSong.isLatest,
        isFeatured: !!editingSong.isFeatured,
        isPopular: !!editingSong.isPopular,
        lyrics: editingSong.lyrics || '',
        downloadCount: editingSong.downloadCount || 0,
        createdAt: editingSong.createdAt || new Date().toISOString(),
      };

      // 1. Direct real-time write to Firestore
      await saveSongToFirestore(songToSave);

      // 2. Also notify backend API
      if (adminToken) {
        try {
          if (songs.some((s) => s.id === songToSave.id)) {
            await api.admin.updateSong(adminToken, songToSave.id, songToSave);
          } else {
            await api.admin.createSong(adminToken, songToSave);
          }
        } catch {
          // Firestore already updated
        }
      }

      showToast(`Song "${songToSave.title}" saved to database!`, 'success');
      setIsModalOpen(false);
      setEditingSong(null);
    } catch (err) {
      console.error('Error saving song:', err);
      showToast('Could not save song to Firestore database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (song: Song) => {
    try {
      const updatedStatus = !song.isPublished;
      await saveSongToFirestore({ ...song, isPublished: updatedStatus });
      if (adminToken) {
        api.admin.updateSong(adminToken, song.id, { isPublished: updatedStatus }).catch(() => {});
      }
      showToast(
        `Song "${song.title}" is now ${updatedStatus ? 'Published in Store' : 'Unpublished (Draft)'}`,
        'info'
      );
    } catch (err) {
      showToast('Failed to update publishing status', 'error');
    }
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${songTitle}" from the store and database?`)) {
      return;
    }

    try {
      await deleteSongFromFirestore(songId);
      if (adminToken) {
        api.admin.deleteSong(adminToken, songId).catch(() => {});
      }
      showToast(`Deleted "${songTitle}" from database`, 'info');
    } catch (err) {
      showToast('Failed to delete song', 'error');
    }
  };

  const handleQuickPriceUpdate = async (song: Song, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    try {
      await saveSongToFirestore({ ...song, priceMWK: newPrice });
      if (adminToken) {
        api.admin.updateSong(adminToken, song.id, { priceMWK: newPrice }).catch(() => {});
      }
      showToast(`Updated price for "${song.title}" to MK ${newPrice.toLocaleString()}`, 'success');
    } catch {
      showToast('Could not update price', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveArtistSettingsToFirestore(artistSettings);
      if (adminToken) {
        api.admin.updateSettings(adminToken, artistSettings).catch(() => {});
      }
      showToast('Artist settings saved to Firestore!', 'success');
    } catch {
      showToast('Could not save artist settings', 'error');
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 text-left animate-in fade-in py-2">
      
      {/* Top Header Bar */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold tracking-wider">
              REAL-TIME FIRESTORE & STORAGE CONNECTED
            </span>
            <span className="text-[11px] font-mono text-slate-400">Live Artist Suite</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            PROJECTS MANDATORY Portal
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={onNavigateStore}
            className="min-h-[44px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Public Storefront
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

      {/* 4 Real-time Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">REVENUE</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block truncate">
            MK {totalRevenue.toLocaleString()}
          </span>
          <span className="text-[10px] text-emerald-400 font-medium">Real-time Verified</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">SALES</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block">
            {totalSales}
          </span>
          <span className="text-[10px] text-blue-400 font-medium">Completed Purchases</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">DOWNLOADS</span>
            <Download className="w-4 h-4 text-orange-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block">
            {totalDownloads}
          </span>
          <span className="text-[10px] text-orange-400 font-medium">Delivered Master Files</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">CUSTOMERS</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-lg sm:text-2xl font-black text-white font-mono block">
            {uniqueCustomers}
          </span>
          <span className="text-[10px] text-purple-400 font-medium">Unique Buyers</span>
        </div>
      </div>

      {/* Tabs */}
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
          <span>Upload & Songs ({songs.length})</span>
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
          <span>Live Purchases ({orders.length})</span>
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
          <span>Artist Profile</span>
        </button>
      </div>

      {/* TAB 1: SONGS & UPLOADS */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Master Audio Catalog & Real-Time Storage
              </h2>
              <p className="text-xs text-slate-400">
                Upload master audio directly to Firebase Storage and adjust prices in Malawi Kwacha.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="min-h-[44px] px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 self-stretch sm:self-center transition"
            >
              <Plus className="w-4 h-4" />
              <span>UPLOAD NEW TRACK</span>
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-xs">Connecting to Firestore real-time database...</p>
            </div>
          ) : songs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <UploadCloud className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-white font-bold text-sm">No songs in database yet</h3>
              <p className="text-xs max-w-sm mx-auto">
                Click &quot;Upload New Track&quot; above to add your first studio master recording.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Upload First Song
              </button>
            </div>
          ) : (
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
                        {song.isPublished !== false ? (
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
                        {song.artist} • {song.fileFormat || 'Master MP3'} • {song.fileSize || 'Studio'} • {song.downloadCount || 0} downloads
                      </p>
                    </div>
                  </div>

                  {/* Price & Action Controls */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    {/* Quick Price Editor in MWK */}
                    <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-xs font-mono text-slate-400 font-bold">MK</span>
                      <input
                        type="number"
                        defaultValue={song.priceMWK}
                        onBlur={(e) => handleQuickPriceUpdate(song, Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleQuickPriceUpdate(song, Number((e.target as HTMLInputElement).value));
                          }
                        }}
                        className="w-20 sm:w-24 bg-transparent text-sm font-black font-mono text-white focus:outline-none"
                        title="Edit Price in MWK"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Publish / Unpublish */}
                      <button
                        onClick={() => handleTogglePublish(song)}
                        className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border transition flex items-center justify-center ${
                          song.isPublished !== false
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400'
                            : 'bg-amber-950/60 hover:bg-amber-900/60 border-amber-800/60 text-amber-300'
                        }`}
                        title={song.isPublished !== false ? 'Unpublish (Hide from store)' : 'Publish (Show in store)'}
                      >
                        {song.isPublished !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit Modal */}
                      <button
                        onClick={() => handleOpenEditModal(song)}
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center"
                        title="Edit Track & Audio Master"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteSong(song.id, song.title)}
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 transition flex items-center justify-center"
                        title="Delete Track from Database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Real-Time Orders & Transactions
              </h2>
              <p className="text-xs text-slate-400">
                Live customer purchases from Firestore database.
              </p>
            </div>
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
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                      No customer orders yet. Verified transactions will appear here in real-time.
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ARTIST SETTINGS */}
      {activeTab === 'settings' && (
        <div className="max-w-xl space-y-6">
          <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Artist Profile & Contacts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved directly to Firestore `artistSettings/current`.
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
                  Save Settings to Database
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: UPLOAD MASTER AUDIO & COVER ARTWORK TO FIREBASE STORAGE & FIRESTORE
          ========================================================================= */}
      {isModalOpen && editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700 p-5 sm:p-7 shadow-2xl relative text-left my-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingSong(null);
              }}
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 font-['Syne',sans-serif]">
              {editingSong.title ? `Edit "${editingSong.title}"` : 'Upload New Studio Track'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Upload your audio master file and artwork to Firebase Cloud Storage.
            </p>

            <form onSubmit={handleSaveSong} className="space-y-4">
              
              {/* 1. AUDIO MASTER FILE UPLOADER (FIREBASE STORAGE) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileAudio className="w-4 h-4 text-rose-500" />
                    <span>1. Studio Audio Master File (MP3 / WAV / FLAC)</span>
                  </label>
                  {audioUploadSuccess && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded to Storage
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioSelect}
                  accept=".mp3,.wav,.flac,.m4a,.aac"
                  className="hidden"
                />

                <div
                  onClick={() => audioInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-rose-500/80 rounded-xl p-4 text-center cursor-pointer transition bg-slate-900/50 hover:bg-slate-900"
                >
                  <UploadCloud className="w-6 h-6 text-rose-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-200">
                    {audioFile ? audioFile.name : editingSong.audioFileName || 'Click to select studio master audio file'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports high fidelity 320kbps MP3, 24-bit WAV, FLAC (stored privately in Firebase Cloud Storage)
                  </p>
                </div>

                {audioUploadProgress !== null && audioUploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Uploading to Firebase Cloud Storage...</span>
                      <span>{audioUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-600 h-full transition-all duration-300"
                        style={{ width: `${audioUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. COVER ARTWORK UPLOADER (FIREBASE STORAGE) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    <span>2. Cover Artwork Image</span>
                  </label>
                  {editingSong.coverImage && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverSelect}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-4">
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-700 hover:border-blue-500 shrink-0 cursor-pointer flex items-center justify-center transition"
                  >
                    {coverPreviewUrl || editingSong.coverImage ? (
                      <img
                        src={coverPreviewUrl || editingSong.coverImage}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-slate-500" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 mb-1"
                    >
                      Choose Cover Image
                    </button>
                    <p className="text-[10px] text-slate-400">
                      Square ratio recommended (e.g. 1000x1000 JPG / PNG / WebP)
                    </p>
                  </div>
                </div>

                {coverUploadProgress !== null && coverUploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Uploading artwork...</span>
                      <span>{coverUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${coverUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 3. TRACK METADATA & PRICING */}
              <Input
                label="Track Title"
                placeholder="e.g. Mandatory Soul"
                value={editingSong.title || ''}
                onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Price in Malawi Kwacha (MWK)"
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Track Description & Liner Notes
                </label>
                <textarea
                  rows={2}
                  value={editingSong.description || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, description: e.target.value })}
                  placeholder="Inspiration, backstory..."
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

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={!!editingSong.isFeatured}
                    onChange={(e) => setEditingSong({ ...editingSong, isFeatured: e.target.checked })}
                    className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                  />
                  <span>Featured Track</span>
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
                  disabled={isSaving}
                  className="min-h-[44px] px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? 'Saving to Database...' : 'Save & Publish Track'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
