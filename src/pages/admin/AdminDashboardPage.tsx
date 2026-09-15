import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  LogOut,
  Plus,
  Music,
  DollarSign,
  Download,
  ShoppingCart,
  Trash2,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  UploadCloud,
  FileAudio,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Phone,
  MessageCircle,
  MessageSquare,
  Play,
  Pause,
  ExternalLink,
  MailCheck,
} from 'lucide-react';
import { Song, Order, MusicPromotionRequest, ContactMessage } from '../../types';
import {
  uploadAudioToStorage,
  uploadCoverToStorage,
  subscribeAllSongs,
  subscribeOrders,
  saveSongToFirestore,
  deleteSongFromFirestore,
  subscribePromotionRequests,
  updatePromotionRequestStatus,
  deletePromotionRequest,
  subscribeContactMessages,
  markContactMessageRead,
  deleteContactMessage,
  AUTHORIZED_ADMIN_EMAILS,
  OFFICIAL_WHATSAPP_NUMBER,
  OFFICIAL_WHATSAPP_LINK,
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
  const { adminEmail, logout } = useAdmin();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'songs' | 'requests' | 'messages' | 'orders'>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promoRequests, setPromoRequests] = useState<MusicPromotionRequest[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [messageFilter, setMessageFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Audio Preview in Dashboard
  const [playingRequestId, setPlayingRequestId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Modal state for Song editing/uploading
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
  const [isProcessingRequest, setIsProcessingRequest] = useState<string | null>(null);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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

    // 3. Subscribe to music promotion requests in real-time
    const unsubscribePromo = subscribePromotionRequests((requests) => {
      setPromoRequests(requests);
    });

    // 4. Subscribe to customer contact messages in real-time
    const unsubscribeMessages = subscribeContactMessages((messages) => {
      setContactMessages(messages);
    });

    return () => {
      unsubscribeSongs();
      unsubscribeOrders();
      unsubscribePromo();
      unsubscribeMessages();
    };
  }, []);

  // Compute live statistics from real Firestore orders & messages
  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalSales = paidOrders.length;
  const totalDownloads = orders.reduce((sum, o) => sum + (o.downloadCount || 0), 0);
  const pendingRequestsCount = promoRequests.filter((r) => r.status === 'PENDING').length;
  const unreadMessagesCount = contactMessages.filter((m) => !m.read).length;

  // Clean WhatsApp Link Generator with NO auto-filled message
  const getCleanWhatsAppLink = (rawPhone: string) => {
    let clean = (rawPhone || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '265' + clean.substring(1);
    } else if (clean.length === 9 && (clean.startsWith('8') || clean.startsWith('9'))) {
      clean = '265' + clean;
    }
    return `https://wa.me/${clean}`;
  };

  // Audio preview playback handler
  const handleTogglePlayAudio = (requestId: string, audioUrl?: string) => {
    if (!audioUrl) {
      showToast('No preview audio stream available for this track', 'info');
      return;
    }

    if (playingRequestId === requestId) {
      audioPreviewRef.current?.pause();
      setPlayingRequestId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = audioUrl;
        audioPreviewRef.current.play().catch((err) => {
          console.warn('Playback error:', err);
          showToast('Could not play audio preview directly in browser', 'error');
        });
        setPlayingRequestId(requestId);
      }
    }
  };

  // Accept Promotion Request & Publish to Catalog
  const handleAcceptRequest = async (request: MusicPromotionRequest) => {
    setIsProcessingRequest(request.id);
    try {
      const newSongId = `song-promo-${Date.now()}`;
      const newSong: Song = {
        id: newSongId,
        title: request.songTitle,
        artist: request.artistName,
        featuredArtists: request.featuredArtists || '',
        genre: request.genre || 'Afro-fusion',
        priceMWK: request.proposedPriceMWK ?? 1500,
        releaseDate: new Date().toISOString().split('T')[0],
        coverImage: request.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
        description: request.description || `Promoted music on Projects Mandatory by ${request.artistName}.`,
        audioFilePath: request.audioFilePath || '',
        audioFileName: request.audioFileName || `${request.songTitle}.mp3`,
        fileFormat: '320kbps MP3 Master',
        fileSize: 'Studio Master',
        isPublished: true,
        isLatest: true,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
      };

      await saveSongToFirestore(newSong);
      await updatePromotionRequestStatus(request.id, 'ACCEPTED', 'Approved and published to Projects Mandatory catalog.');

      showToast(`Accepted "${request.songTitle}" by ${request.artistName}! Published to store catalog.`, 'success');
    } catch (err: any) {
      console.error('Accept request error:', err);
      showToast(err.message || 'Failed to accept promotion request', 'error');
    } finally {
      setIsProcessingRequest(null);
    }
  };

  // Reject Promotion Request
  const handleRejectRequest = async (requestId: string, artistName: string) => {
    const reason = window.prompt(`Enter optional rejection notes or feedback for ${artistName}:`, 'Track did not meet master audio quality guidelines.');
    if (reason === null) return;

    setIsProcessingRequest(requestId);
    try {
      await updatePromotionRequestStatus(requestId, 'REJECTED', reason);
      showToast(`Request by ${artistName} marked as rejected.`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to reject request', 'error');
    } finally {
      setIsProcessingRequest(null);
    }
  };

  // Delete Promotion Request
  const handleDeleteRequest = async (requestId: string, songTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete the promotion request for "${songTitle}"?`)) {
      return;
    }

    try {
      await deletePromotionRequest(requestId);
      showToast('Promotion request deleted.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete request', 'error');
    }
  };

  // Toggle Contact Message Read/Unread
  const handleToggleMessageRead = async (msg: ContactMessage) => {
    try {
      await markContactMessageRead(msg.id, !msg.read);
      showToast(`Message marked as ${!msg.read ? 'read' : 'unread'}.`);
    } catch (err) {
      showToast('Failed to update message status', 'error');
    }
  };

  // Delete Contact Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer message?')) {
      return;
    }
    try {
      await deleteContactMessage(msgId);
      showToast('Message deleted.', 'info');
    } catch (err) {
      showToast('Failed to delete message', 'error');
    }
  };

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
      id: `hapsin-song-${Date.now()}`,
      title: '',
      artist: 'Hapsin',
      featuredArtists: '',
      producer: 'Projects Mandatory Studios',
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
        id: editingSong.id || `hapsin-song-${Date.now()}`,
        title: editingSong.title.trim(),
        artist: editingSong.artist?.trim() || 'Hapsin',
        featuredArtists: editingSong.featuredArtists?.trim() || '',
        producer: editingSong.producer?.trim() || '',
        genre: editingSong.genre?.trim() || 'Afro-beats',
        priceMWK: Number(editingSong.priceMWK) || 1500,
        releaseDate: editingSong.releaseDate || new Date().toISOString().split('T')[0],
        coverImage: editingSong.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
        description: editingSong.description || '',
        lyrics: editingSong.lyrics || '',
        audioFilePath: editingSong.audioFilePath || '',
        audioFileName: editingSong.audioFileName || '',
        fileFormat: editingSong.fileFormat || '320kbps MP3 Master',
        fileSize: editingSong.fileSize || '9.5 MB',
        isPublished: editingSong.isPublished !== false,
        isLatest: !!editingSong.isLatest,
        isFeatured: !!editingSong.isFeatured,
        isPopular: !!editingSong.isPopular,
        downloadCount: editingSong.downloadCount || 0,
        createdAt: editingSong.createdAt || new Date().toISOString(),
      };

      await saveSongToFirestore(songToSave);
      showToast(`Track "${songToSave.title}" saved to Firestore database!`, 'success');
      setIsModalOpen(false);
      setEditingSong(null);
    } catch (err) {
      console.error('Save song error:', err);
      showToast('Failed to save song to database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (song: Song) => {
    try {
      const updated = { ...song, isPublished: song.isPublished === false };
      await saveSongToFirestore(updated);
      showToast(`Track "${song.title}" is now ${updated.isPublished ? 'Published' : 'Unpublished'}`);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleQuickPriceUpdate = async (song: Song, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    try {
      await saveSongToFirestore({ ...song, priceMWK: newPrice });
      showToast(`Price for "${song.title}" updated to MK ${newPrice.toLocaleString()}`);
    } catch (err) {
      showToast('Failed to update price', 'error');
    }
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${songTitle}" from the store database?`)) {
      return;
    }
    try {
      await deleteSongFromFirestore(songId);
      showToast(`Track "${songTitle}" deleted from Firestore database`, 'info');
    } catch (err) {
      showToast('Failed to delete song', 'error');
    }
  };

  const filteredRequests = promoRequests.filter((r) => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  const filteredMessages = contactMessages.filter((m) => {
    if (messageFilter === 'UNREAD') return !m.read;
    if (messageFilter === 'READ') return !!m.read;
    return true;
  });

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-12">
      {/* Hidden audio element for previews */}
      <audio ref={audioPreviewRef} onEnded={() => setPlayingRequestId(null)} />

      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-['Syne',sans-serif]">
                Projects Mandatory Admin Portal
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 text-[10px] font-mono font-bold">
                Google Auth Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Featuring Artist <strong className="text-rose-400">Hapsin</strong> • Signed in as <span className="text-emerald-400 font-mono font-semibold">{adminEmail || 'Verified Administrator'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={onNavigateStore}>
            Storefront
          </Button>
          <Button variant="danger" size="sm" onClick={() => { logout(); onLogout(); }} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Authorized Admins & WhatsApp Hotline Notice Bar */}
      <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Authorized Admin Accounts: <strong className="text-emerald-300 font-mono">alwaysgoodone265@gmail.com</strong>, <strong className="text-emerald-300 font-mono">petedianolabs@gmail.com</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Official WhatsApp:</span>
          <a
            href={OFFICIAL_WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 font-mono font-bold hover:underline flex items-center gap-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{OFFICIAL_WHATSAPP_NUMBER}</span>
          </a>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Paid Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">
            MK {totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-emerald-400 font-semibold">{totalSales} verified transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Catalog Tracks</span>
            <Music className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">{songs.length}</p>
          <p className="text-[10px] text-slate-400">{songs.filter((s) => s.isPublished !== false).length} published live</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Promo Requests</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">{promoRequests.length}</p>
          <p className="text-[10px] text-amber-400 font-semibold">{pendingRequestsCount} pending review</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Customer Messages</span>
            <MessageSquare className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-white">{contactMessages.length}</p>
          <p className="text-[10px] text-rose-400 font-semibold">{unreadMessagesCount} unread submissions</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'songs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Music Catalog ({songs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'requests'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Promotion Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-300 text-slate-950 rounded-full text-[10px] font-black">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'messages'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Messages</span>
          {unreadMessagesCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-400 text-white rounded-full text-[10px] font-black">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Orders & Payments ({orders.length})</span>
        </button>
      </div>

      {/* TAB 1: MUSIC CATALOG */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Song Catalog & Master Files
              </h2>
              <p className="text-xs text-slate-400">
                Manage high-fidelity masters in Firebase Cloud Storage and pricing in MWK.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddModal}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Upload New Track
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-3">Track Info</th>
                    <th className="p-3">Artist</th>
                    <th className="p-3">Genre</th>
                    <th className="p-3">Price (MWK)</th>
                    <th className="p-3">Storage Status</th>
                    <th className="p-3">Publish</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {songs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        {isLoading ? 'Loading catalog from Firestore...' : 'No songs uploaded yet. Click "Upload New Track" above!'}
                      </td>
                    </tr>
                  ) : (
                    songs.map((song) => (
                      <tr key={song.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                            />
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-1.5">
                                <span>{song.title}</span>
                                {song.isLatest && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 text-[9px] font-bold">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{song.releaseDate}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-200">{song.artist}</span>
                          {song.featuredArtists && (
                            <span className="text-slate-400 text-[11px] block">ft. {song.featuredArtists}</span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-300">{song.genre}</td>
                        <td className="p-3">
                          <input
                            type="number"
                            defaultValue={song.priceMWK}
                            onBlur={(e) => handleQuickPriceUpdate(song, Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="p-3">
                          {song.audioFilePath ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Master Ready
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                              <AlertCircle className="w-3 h-3" /> No Audio File
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleTogglePublish(song)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition flex items-center gap-1 ${
                              song.isPublished !== false
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900'
                                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {song.isPublished !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{song.isPublished !== false ? 'Live' : 'Hidden'}</span>
                          </button>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(song)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Edit Track"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSong(song.id, song.title)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                            title="Delete Track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROMOTION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Music Promotion Submissions
              </h2>
              <p className="text-xs text-slate-400">
                Review submissions from independent artists. Accept to immediately add them to the catalog.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
              {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRequestFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    requestFilter === filter
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No promotion requests matching &quot;{requestFilter}&quot;</p>
              <p className="text-xs text-slate-500">
                Artists can submit their music via the &quot;Promote Music&quot; link on the storefront.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => {
                const isPlaying = playingRequestId === req.id;
                const isBusy = isProcessingRequest === req.id;
                const rawPhone = req.whatsapp || req.phone;
                const waLink = rawPhone ? getCleanWhatsAppLink(rawPhone) : '';

                return (
                  <div
                    key={req.id}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700/80 transition"
                  >
                    {/* Header: Cover + Title + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        {req.coverImage ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700 shadow-md">
                            <img src={req.coverImage} alt={req.songTitle} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center text-slate-500 shrink-0">
                            <Music className="w-6 h-6" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                req.status === 'ACCEPTED'
                                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                                  : req.status === 'REJECTED'
                                  ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                              }`}
                            >
                              {req.status}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{req.genre}</span>
                            <span className="text-[11px] text-slate-500">• Submitted {req.createdAt?.split('T')[0]}</span>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-white">
                            {req.songTitle}
                          </h3>
                          <p className="text-xs text-slate-300">
                            By <strong className="text-rose-400">{req.artistName}</strong>
                            {req.featuredArtists && <span className="text-slate-400"> ({req.featuredArtists})</span>}
                          </p>
                        </div>
                      </div>

                      {/* Proposed Price */}
                      <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-left sm:text-right shrink-0">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Proposed Store Price</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          {req.proposedPriceMWK ? `MK ${req.proposedPriceMWK.toLocaleString()}` : 'Free Promo'}
                        </span>
                      </div>
                    </div>

                    {/* Audio Player / Stream Link */}
                    {(req.audioFilePath || req.streamUrl) && (
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => handleTogglePlayAudio(req.id, req.audioFilePath || req.streamUrl)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                              isPlaying
                                ? 'bg-amber-500 text-slate-950 shadow-md'
                                : 'bg-slate-800 text-white hover:bg-slate-700'
                            }`}
                            title={isPlaying ? 'Pause Audio' : 'Play Audio Preview'}
                          >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                          </button>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">
                              {req.audioFileName || 'Master Audio Recording'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {isPlaying ? 'Playing in browser...' : 'Click to preview submitted track'}
                            </p>
                          </div>
                        </div>

                        {req.streamUrl && (
                          <a
                            href={req.streamUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 shrink-0 font-medium"
                          >
                            <span>External Stream</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Description or Notes */}
                    {req.description && (
                      <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
                        <strong className="text-slate-400">Story/Notes:</strong> {req.description}
                      </p>
                    )}

                    {/* Admin notes if reviewed */}
                    {req.adminNotes && (
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300">
                        <strong className="text-slate-400">Admin Review Notes:</strong> {req.adminNotes}
                      </div>
                    )}

                    {/* Contact details & Action Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                      {/* Contact Badges */}
                      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-300">
                        {rawPhone && (
                          <a
                            href={`tel:${rawPhone}`}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{rawPhone}</span>
                          </a>
                        )}

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 flex items-center gap-1.5 transition font-semibold"
                            title="Open WhatsApp Chat (No auto-filled message)"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp Chat</span>
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {req.status !== 'ACCEPTED' && (
                          <Button
                            variant="success"
                            size="sm"
                            isLoading={isBusy}
                            onClick={() => handleAcceptRequest(req)}
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                          >
                            Accept & Publish
                          </Button>
                        )}

                        {req.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            isLoading={isBusy}
                            onClick={() => handleRejectRequest(req.id, req.artistName)}
                            leftIcon={<X className="w-3.5 h-3.5" />}
                          >
                            Reject
                          </Button>
                        )}

                        <button
                          onClick={() => handleDeleteRequest(req.id, req.songTitle)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                          title="Delete Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOMER MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
                Website Contact Messages
              </h2>
              <p className="text-xs text-slate-400">
                Direct messages submitted by clients and visitors on the website contact form.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
              {(['ALL', 'UNREAD', 'READ'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMessageFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    messageFilter === filter
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-2xl border border-slate-800 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-white">No messages matching &quot;{messageFilter}&quot;</p>
              <p className="text-xs text-slate-500">
                When visitors write messages on the Contact page, they will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => {
                const waLink = getCleanWhatsAppLink(msg.phoneOrWhatsApp);

                return (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-2xl bg-slate-900 border transition shadow-md space-y-3 ${
                      !msg.read ? 'border-rose-500/50 bg-slate-900/90' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {!msg.read ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-950 text-rose-400 border border-rose-800">
                            NEW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                            READ
                          </span>
                        )}
                        <h3 className="font-bold text-white text-sm sm:text-base">{msg.name}</h3>
                        <span className="text-xs text-slate-400 font-mono">({msg.phoneOrWhatsApp})</span>
                      </div>

                      <span className="text-[11px] text-slate-500 font-mono">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Recent'}
                      </span>
                    </div>

                    {msg.subject && (
                      <p className="text-xs font-semibold text-slate-200">
                        Subject: <span className="text-rose-400">{msg.subject}</span>
                      </p>
                    )}

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        {/* Direct WhatsApp chat button */}
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition"
                          title="Open WhatsApp chat with user (no auto-filled message)"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Chat on WhatsApp ({msg.phoneOrWhatsApp})</span>
                        </a>

                        <a
                          href={`tel:${msg.phoneOrWhatsApp}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          <span>Call</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleMessageRead(msg)}
                          leftIcon={msg.read ? <MailCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        >
                          {msg.read ? 'Mark as Unread' : 'Mark as Read'}
                        </Button>

                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ORDERS & PAYMENTS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-['Syne',sans-serif]">
              PayChangu Orders & Download Ledger
            </h2>
            <p className="text-xs text-slate-400">
              Live mobile money (Airtel Money, TNM Mpamba) & card transactions from Firestore `orders`.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Track</th>
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

      {/* MODAL: UPLOAD MASTER AUDIO & COVER ARTWORK */}
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
              
              {/* 1. AUDIO MASTER FILE UPLOADER */}
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
                    Supports high fidelity 320kbps MP3, 24-bit WAV, FLAC (stored in Firebase Cloud Storage)
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

              {/* 2. COVER ARTWORK UPLOADER */}
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
                  label="Artist Stage Name"
                  placeholder="Hapsin"
                  value={editingSong.artist || 'Hapsin'}
                  onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                  required
                />
                <Input
                  label="Price in Malawi Kwacha (MWK)"
                  type="number"
                  placeholder="1500"
                  value={editingSong.priceMWK || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, priceMWK: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Genre"
                  placeholder="Afro-fusion, Pop"
                  value={editingSong.genre || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value })}
                  required
                />
                <Input
                  label="Featured Artists"
                  placeholder="Optional"
                  value={editingSong.featuredArtists || ''}
                  onChange={(e) => setEditingSong({ ...editingSong, featuredArtists: e.target.value })}
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
