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
  Users,
  Smartphone,
  Send,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import {
  Song,
  Order,
  MusicPromotionRequest,
  ContactMessage,
  ArtistProfile,
  ArtistSongSubmission,
} from '../../types';
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
  subscribeAllSongSubmissions,
  approveAndPublishSong,
  rejectSongSubmission,
  deleteSongSubmission,
  subscribeAllArtists,
  processArtistPayout,
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

type AdminTab = 'songs' | 'submissions' | 'artists' | 'requests' | 'messages' | 'orders';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onLogout,
  onNavigateStore,
}) => {
  const { adminEmail, logout } = useAdmin();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('submissions');
  const [songs, setSongs] = useState<Song[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [submissions, setSubmissions] = useState<ArtistSongSubmission[]>([]);
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [promoRequests, setPromoRequests] = useState<MusicPromotionRequest[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [messageFilter, setMessageFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Audio Preview in Dashboard
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
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
  const [processingSubmissionId, setProcessingSubmissionId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState<string>('');
  const [rejectModalSubmission, setRejectModalSubmission] = useState<ArtistSongSubmission | null>(null);

  // Payout Modal state
  const [selectedArtistForPayout, setSelectedArtistForPayout] = useState<ArtistProfile | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [isProcessingPayout, setIsProcessingPayout] = useState<boolean>(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setIsLoading(true);

    const unsubSongs = subscribeAllSongs((data) => {
      setSongs(data);
      setIsLoading(false);
    });

    const unsubOrders = subscribeOrders((data) => {
      setOrders(data);
    });

    const unsubSubmissions = subscribeAllSongSubmissions((data) => {
      setSubmissions(data);
    });

    const unsubArtists = subscribeAllArtists((data) => {
      setArtists(data);
    });

    const unsubPromo = subscribePromotionRequests((data) => {
      setPromoRequests(data);
    });

    const unsubMessages = subscribeContactMessages((data) => {
      setContactMessages(data);
    });

    return () => {
      unsubSongs();
      unsubOrders();
      unsubSubmissions();
      unsubArtists();
      unsubPromo();
      unsubMessages();
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  // Audio preview helper
  const handleTogglePlayAudio = (url?: string) => {
    if (!url) {
      showToast('No audio recording stream available', 'info');
      return;
    }

    if (playingAudioUrl === url) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      setPlayingAudioUrl(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingAudioUrl(null);
      audioPreviewRef.current = audio;
      setPlayingAudioUrl(url);
    }
  };

  // Approve artist track submission and publish to catalog
  const handleApproveSubmission = async (sub: ArtistSongSubmission) => {
    setProcessingSubmissionId(sub.id);
    try {
      await approveAndPublishSong(sub);
      showToast(`Track "${sub.title}" by ${sub.artistName} approved and published to store!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve track';
      showToast(msg, 'error');
    } finally {
      setProcessingSubmissionId(null);
    }
  };

  // Reject artist track submission
  const handleConfirmReject = async () => {
    if (!rejectModalSubmission) return;
    setProcessingSubmissionId(rejectModalSubmission.id);
    try {
      await rejectSongSubmission(rejectModalSubmission.id, rejectFeedback.trim());
      showToast(`Submission rejected with feedback sent to artist.`, 'info');
      setRejectModalSubmission(null);
      setRejectFeedback('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject track';
      showToast(msg, 'error');
    } finally {
      setProcessingSubmissionId(null);
    }
  };

  // Process Payout Disbursement
  const handleDisbursePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtistForPayout || payoutAmount <= 0) return;

    setIsProcessingPayout(true);
    try {
      await processArtistPayout(
        selectedArtistForPayout.id,
        payoutAmount,
        payoutNotes.trim() || `Disbursed to ${selectedArtistForPayout.payoutDetails?.accountNumber || selectedArtistForPayout.phone}`
      );
      showToast(`MK ${payoutAmount.toLocaleString()} payout successfully recorded for ${selectedArtistForPayout.artistName}!`, 'success');
      setSelectedArtistForPayout(null);
      setPayoutAmount(0);
      setPayoutNotes('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not process payout';
      showToast(msg, 'error');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Open modal to create/edit song
  const handleOpenSongModal = (song?: Song) => {
    if (song) {
      setEditingSong(song);
      setCoverPreviewUrl(song.coverImage || '');
      setAudioUploadSuccess(!!song.audioFilePath);
    } else {
      setEditingSong({
        id: `song-${Date.now()}`,
        title: '',
        artist: 'Hapsin',
        featuredArtists: '',
        genre: 'Afro-fusion',
        releaseDate: new Date().toISOString().split('T')[0],
        priceMWK: 1500,
        description: '',
        fileFormat: '320kbps MP3 Master',
        fileSize: 'Studio Master',
        isPublished: true,
        isLatest: true,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
      });
      setCoverPreviewUrl('');
      setAudioUploadSuccess(false);
    }
    setAudioFile(null);
    setAudioUploadProgress(null);
    setCoverFile(null);
    setCoverUploadProgress(null);
    setIsModalOpen(true);
  };

  // Handle Save Song
  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !editingSong.title) {
      showToast('Track title is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      let finalAudioUrl = editingSong.audioFilePath || '';
      let finalAudioFileName = editingSong.audioFileName || `${editingSong.title}.mp3`;
      let finalFileSize = editingSong.fileSize || 'Studio Master';
      let finalFileFormat = editingSong.fileFormat || '320kbps MP3 Master';

      // 1. Upload audio if file selected
      if (audioFile) {
        showToast('Uploading master audio recording to storage...', 'info');
        const audioUploadResult = await uploadAudioToStorage(audioFile, (percent) => {
          setAudioUploadProgress(percent);
        });
        finalAudioUrl = audioUploadResult.downloadUrl;
        finalAudioFileName = audioUploadResult.fileName;
        finalFileSize = audioUploadResult.fileSize;
        finalFileFormat = audioUploadResult.fileFormat;
      }

      // 2. Upload cover if file selected
      let finalCoverUrl = coverPreviewUrl || editingSong.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop';
      if (coverFile) {
        showToast('Uploading cover image to storage...', 'info');
        const coverUploadResult = await uploadCoverToStorage(coverFile, (percent) => {
          setCoverUploadProgress(percent);
        });
        finalCoverUrl = coverUploadResult.downloadUrl;
      }

      const songPayload: Song = {
        id: editingSong.id || `song-${Date.now()}`,
        title: editingSong.title,
        artist: editingSong.artist || 'Hapsin',
        featuredArtists: editingSong.featuredArtists || '',
        genre: editingSong.genre || 'Afro-fusion',
        releaseDate: editingSong.releaseDate || new Date().toISOString().split('T')[0],
        priceMWK: Math.min(Math.max(0, editingSong.priceMWK || 0), 5000), // capped at 5000 MWK
        coverImage: finalCoverUrl,
        description: editingSong.description || '',
        lyrics: editingSong.lyrics || '',
        audioFilePath: finalAudioUrl,
        audioFileName: finalAudioFileName,
        fileFormat: finalFileFormat,
        fileSize: finalFileSize,
        isPublished: editingSong.isPublished ?? true,
        isLatest: editingSong.isLatest ?? true,
        downloadCount: editingSong.downloadCount || 0,
        createdAt: editingSong.createdAt || new Date().toISOString(),
      };

      await saveSongToFirestore(songPayload);
      showToast(`"${songPayload.title}" saved to live catalog!`, 'success');
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save song';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
      setAudioUploadProgress(null);
      setCoverUploadProgress(null);
    }
  };

  // Toggle Song Published
  const handleTogglePublish = async (song: Song) => {
    try {
      await saveSongToFirestore({
        ...song,
        isPublished: !song.isPublished,
      });
      showToast(`Track status changed to ${!song.isPublished ? 'Published' : 'Unpublished'}`, 'info');
    } catch (err) {
      showToast('Could not update status', 'error');
    }
  };

  // Delete Song
  const handleDeleteSong = async (songId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await deleteSongFromFirestore(songId);
      showToast(`"${title}" deleted from catalog.`, 'info');
    } catch (err) {
      showToast('Could not delete song', 'error');
    }
  };

  // Promotion Request status update
  const handleUpdatePromoStatus = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await updatePromotionRequestStatus(requestId, status);
      showToast(`Promotion request marked as ${status}.`, 'success');
    } catch (err) {
      showToast('Failed to update request', 'error');
    }
  };

  // Calculations
  const totalRevenue = orders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalPaidOrders = orders.filter((o) => o.status === 'PAID').length;
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'PENDING').length;
  const unreadMessagesCount = contactMessages.filter((m) => !m.read).length;

  const filteredSubmissions = submissions.filter((s) => {
    if (submissionFilter === 'ALL') return true;
    return s.status === submissionFilter;
  });

  const filteredPromo = promoRequests.filter((r) => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  const filteredMessages = contactMessages.filter((m) => {
    if (messageFilter === 'ALL') return true;
    if (messageFilter === 'UNREAD') return !m.read;
    return m.read;
  });

  return (
    <div className="space-y-6 text-left animate-in fade-in pb-16">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white font-['Syne',sans-serif]">
                Projects Mandatory Administration
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                SECURE CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin Session: <strong className="text-slate-200">{adminEmail || 'Administrator'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateStore}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>
          <button
            onClick={() => {
              logout();
              onLogout();
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold transition flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-['Syne',sans-serif]">
            MK {totalRevenue.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">{totalPaidOrders} paid transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Track Approvals</span>
            <UploadCloud className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-['Syne',sans-serif]">
            {pendingSubmissionsCount} Pending
          </div>
          <p className="text-[10px] text-slate-500">{submissions.length} total artist submissions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Registered Artists</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-['Syne',sans-serif]">
            {artists.length}
          </div>
          <p className="text-[10px] text-indigo-400">70/30 split enabled</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">User Inquiries</span>
            <MessageSquare className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-['Syne',sans-serif]">
            {unreadMessagesCount} Unread
          </div>
          <p className="text-[10px] text-slate-500">{contactMessages.length} total messages</p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'submissions', label: `Artist Approvals (${pendingSubmissionsCount})`, icon: UploadCloud, badge: pendingSubmissionsCount > 0 },
          { id: 'artists', label: `Artists & Payouts (${artists.length})`, icon: Users },
          { id: 'songs', label: `Live Catalog (${songs.length})`, icon: Music },
          { id: 'messages', label: `Contact Inquiries (${unreadMessagesCount})`, icon: MessageSquare, badge: unreadMessagesCount > 0 },
          { id: 'requests', label: `Promote Requests (${promoRequests.length})`, icon: Sparkles },
          { id: 'orders', label: `Sales Orders (${orders.length})`, icon: ShoppingCart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ARTIST SONG SUBMISSIONS & APPROVALS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
                Artist Track Submissions & Publishing Pipeline
              </h3>
              <p className="text-xs text-slate-400">
                Review master audio tracks submitted by artists. Capped at MK 5,000 max with 70% artist payout split.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSubmissionFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    submissionFilter === filter
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <UploadCloud className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No submissions matching current filter.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredSubmissions.map((sub) => {
                const isPlaying = playingAudioUrl === sub.audioFilePath;
                const isProcessing = processingSubmissionId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl hover:border-slate-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 shrink-0 group">
                          <img src={sub.coverImage} alt={sub.title} className="w-full h-full object-cover" />
                          {sub.audioFilePath && (
                            <button
                              onClick={() => handleTogglePlayAudio(sub.audioFilePath)}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                              title="Listen to master audio"
                            >
                              {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                            </button>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-white">{sub.title}</h4>
                            <span className="text-xs text-slate-400">by <strong className="text-rose-400">{sub.artistName}</strong></span>
                            {sub.featuredArtists && (
                              <span className="text-xs text-slate-400">({sub.featuredArtists})</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                            <span>Genre: <strong>{sub.genre}</strong></span>
                            <span>•</span>
                            <span>Phone: <strong className="text-slate-300">{sub.artistPhone}</strong></span>
                            <span>•</span>
                            <span>Format: <strong>{sub.fileFormat || 'Studio Master'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div>
                        {sub.status === 'PENDING' && (
                          <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 text-xs font-bold">
                            PENDING REVIEW
                          </span>
                        )}
                        {sub.status === 'APPROVED' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-xs font-bold">
                            APPROVED & PUBLISHED
                          </span>
                        )}
                        {sub.status === 'REJECTED' && (
                          <span className="px-3 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-500/40 text-xs font-bold">
                            REJECTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price & 70/30 Split Card */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Track Price</span>
                          <span className="font-extrabold text-white text-sm">MK {sub.priceMWK.toLocaleString()}</span>
                        </div>
                        <div className="border-l border-slate-800 pl-4">
                          <span className="text-slate-500 block text-[10px]">Artist Net Share (70%)</span>
                          <span className="font-bold text-emerald-400 text-sm">MK {sub.artistShareMWK.toLocaleString()}</span>
                        </div>
                        <div className="border-l border-slate-800 pl-4">
                          <span className="text-slate-500 block text-[10px]">Platform Share (30%)</span>
                          <span className="font-bold text-slate-300 text-sm">MK {sub.platformShareMWK.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Direct Audio Player */}
                      {sub.audioFilePath && (
                        <button
                          onClick={() => handleTogglePlayAudio(sub.audioFilePath)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                            isPlaying
                              ? 'bg-amber-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span>{isPlaying ? 'Pause Audio' : 'Play Master Audio'}</span>
                        </button>
                      )}
                    </div>

                    {/* Action Controls */}
                    {sub.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2.5 pt-1">
                        <button
                          onClick={() => setRejectModalSubmission(sub)}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject with Feedback</span>
                        </button>

                        <Button
                          variant="success"
                          size="sm"
                          isLoading={isProcessing}
                          onClick={() => handleApproveSubmission(sub)}
                          className="px-5 py-2 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-950/60"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Publish to Store</span>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ARTISTS & PAYOUTS */}
      {activeTab === 'artists' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
                Registered Artists Directory & Mobile Payouts
              </h3>
              <p className="text-xs text-slate-400">
                Track artist wallet balances, direct fan tips received, and disburse 70% earnings via Airtel Money & Mpamba.
              </p>
            </div>
          </div>

          {artists.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <Users className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No artist profiles registered in Firestore yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 border-2 border-rose-500/40 shrink-0">
                      <img src={artist.avatarUrl} alt={artist.artistName} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">{artist.artistName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-500/40">
                          {artist.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {artist.email} • {artist.phone}
                      </p>
                    </div>
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Total Earned (70%)</span>
                      <span className="font-extrabold text-emerald-400">
                        MK {(artist.wallet?.totalEarnedMWK || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Pending Payout</span>
                      <span className="font-extrabold text-amber-400">
                        MK {(artist.wallet?.pendingPayoutMWK || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Disbursed So Far</span>
                      <span className="font-extrabold text-slate-300">
                        MK {(artist.wallet?.totalPaidOutMWK || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payout Details */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Payout Method:</span>
                      <span className="font-bold text-white">{artist.payoutDetails?.accountType || 'AIRTEL_MONEY'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Account / SIM Number:</span>
                      <span className="font-bold text-emerald-400">{artist.payoutDetails?.accountNumber || artist.phone}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Registered Name:</span>
                      <span className="font-bold text-white">{artist.payoutDetails?.accountName || artist.artistName}</span>
                    </div>
                  </div>

                  {/* Payout Action */}
                  <div className="pt-1 flex items-center justify-between">
                    <a
                      href={`https://wa.me/265${artist.phone.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp Artist</span>
                    </a>

                    <button
                      onClick={() => {
                        setSelectedArtistForPayout(artist);
                        setPayoutAmount(artist.wallet?.pendingPayoutMWK || 0);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Record Mobile Payout</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SONGS CATALOG (Add/Edit) */}
      {activeTab === 'songs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
              Live Store Catalog ({songs.length})
            </h3>
            <button
              onClick={() => handleOpenSongModal()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-rose-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Track</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {songs.map((song) => (
              <div
                key={song.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 flex flex-col justify-between shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                      <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{song.title}</h4>
                      <p className="text-xs text-rose-400 font-semibold">{song.artist}</p>
                      <span className="text-xs text-emerald-400 font-bold">MK {song.priceMWK.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Format: <strong>{song.fileFormat}</strong></div>
                    <div>Downloads: <strong>{song.downloadCount || 0}</strong></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(song)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                      song.isPublished
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {song.isPublished ? 'Published' : 'Draft'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenSongModal(song)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                      title="Edit Track"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSong(song.id, song.title)}
                      className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 transition"
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

      {/* TAB 4: CONTACT MESSAGES */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
              Website Contact Messages ({contactMessages.length})
            </h3>
            <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {(['ALL', 'UNREAD', 'READ'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setMessageFilter(f)}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    messageFilter === f ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              No messages found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-2xl border transition space-y-2 ${
                    !msg.read
                      ? 'bg-slate-900 border-rose-500/40 shadow-lg'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold text-white">{msg.name}</span>
                      <span className="text-xs text-slate-400 ml-2 font-mono">{msg.phoneOrWhatsApp}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {msg.message}
                  </p>

                  <div className="flex justify-between items-center pt-1">
                    <a
                      href={`https://wa.me/265${msg.phoneOrWhatsApp.replace(/[^0-9]/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Reply on WhatsApp</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => markContactMessageRead(msg.id, !msg.read)}
                        className="text-xs text-slate-400 hover:text-white px-2 py-1"
                      >
                        {msg.read ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      <button
                        onClick={() => deleteContactMessage(msg.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GENERAL PROMOTION REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
            General Music Promotion Requests ({promoRequests.length})
          </h3>
          <div className="space-y-3">
            {promoRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-white">{req.songTitle}</h4>
                    <span className="text-xs text-slate-400">by {req.artistName} ({req.phone})</span>
                  </div>
                  <Badge variant={req.status === 'ACCEPTED' ? 'success' : req.status === 'REJECTED' ? 'error' : 'warning'}>
                    {req.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">{req.description}</p>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="success" onClick={() => handleUpdatePromoStatus(req.id, 'ACCEPTED')}>
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleUpdatePromoStatus(req.id, 'REJECTED')}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ORDERS & SALES */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
            Customer Purchases & Order Ledger ({orders.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-2xl overflow-hidden">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Track</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((order) => (
                  <tr key={order.id} className="bg-slate-900/60 hover:bg-slate-900">
                    <td className="p-3 font-bold text-white">{order.songTitle}</td>
                    <td className="p-3">{order.customerEmail}</td>
                    <td className="p-3 font-bold text-emerald-400">MK {order.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'PAID' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SONG */}
      {isModalOpen && editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white font-['Syne',sans-serif]">
                {editingSong.id ? 'Edit Master Track' : 'Add New Master Track'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSong} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Track Title *</label>
                  <input
                    type="text"
                    required
                    value={editingSong.title || ''}
                    onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Artist Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSong.artist || 'Hapsin'}
                    onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Genre</label>
                  <input
                    type="text"
                    value={editingSong.genre || 'Afro-fusion'}
                    onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Price (MWK - max 5,000)</label>
                  <input
                    type="number"
                    min="0"
                    max="5000"
                    step="100"
                    value={editingSong.priceMWK || 1500}
                    onChange={(e) => setEditingSong({ ...editingSong, priceMWK: Math.min(5000, parseInt(e.target.value, 10) || 0) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              {/* Master Audio Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <FileAudio className="w-4 h-4 text-rose-500" />
                  <span>Attach Studio Audio Master (MP3 / WAV)</span>
                </label>
                <input
                  type="file"
                  accept="audio/*,.mp3,.wav,.flac"
                  onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-rose-600 file:text-white file:cursor-pointer"
                />
              </div>

              {/* Cover Art Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>Attach Single Artwork</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCoverFile(e.target.files[0]);
                      setCoverPreviewUrl(URL.createObjectURL(e.target.files[0]));
                    }
                  }}
                  className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white file:cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSaving}
                className="w-full font-bold text-xs uppercase py-3.5 bg-rose-600 hover:bg-rose-500"
              >
                Save Track to Live Catalog
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REJECT SUBMISSION WITH FEEDBACK */}
      {rejectModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              Reject Submission: &quot;{rejectModalSubmission.title}&quot;
            </h3>
            <p className="text-xs text-slate-400">
              Provide constructive feedback to {rejectModalSubmission.artistName} on why the track requires revision.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Master track has audio distortion. Please re-export in 320kbps."
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectModalSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Send Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISBURSE PAYOUT */}
      {selectedArtistForPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleDisbursePayout} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">
              Record Payout for {selectedArtistForPayout.artistName}
            </h3>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Pending Balance:</span>
                <span className="font-bold text-emerald-400">MK {(selectedArtistForPayout.wallet?.pendingPayoutMWK || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Account:</span>
                <span className="font-bold text-white">{selectedArtistForPayout.payoutDetails?.accountNumber || selectedArtistForPayout.phone}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Disbursed Amount (MWK) *</label>
              <input
                type="number"
                required
                min="1"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Transaction Ref / Notes</label>
              <input
                type="text"
                placeholder="e.g. Airtel Money Trans Ref #1294819"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedArtistForPayout(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="success"
                isLoading={isProcessingPayout}
                className="px-5 py-2 font-bold text-xs"
              >
                Confirm Payout Disbursed
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
