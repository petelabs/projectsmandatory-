import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Music,
  UploadCloud,
  CheckCircle2,
  FileAudio,
  Image as ImageIcon,
  ArrowLeft,
  Send,
  Loader2,
  DollarSign,
  Phone,
  Mail,
  User,
  Radio,
  Share2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useToast } from '../context/ToastContext';
import { submitPromotionRequest, uploadCoverToStorage, uploadAudioToStorage } from '../lib/firebase';
import { MusicPromotionRequest } from '../types';

interface PromoteMusicPageProps {
  onBack: () => void;
  onExploreMusic: () => void;
}

export const PromoteMusicPage: React.FC<PromoteMusicPageProps> = ({ onBack, onExploreMusic }) => {
  const { showToast } = useToast();

  const [artistName, setArtistName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [featuredArtists, setFeaturedArtists] = useState('');
  const [genre, setGenre] = useState('Afro-beats');
  const [proposedPriceMWK, setProposedPriceMWK] = useState<number>(1500);
  const [description, setDescription] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');

  // Media upload state
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string>('');
  const [coverUploadProgress, setCoverUploadProgress] = useState<number | null>(null);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUploadProgress, setAudioUploadProgress] = useState<number | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const genres = [
    'Afro-beats',
    'Afro-fusion',
    'Amapiano',
    'Hip Hop / Rap',
    'Gospel',
    'Dancehall',
    'Reggae',
    'R&B / Soul',
    'Traditional / Folk',
    'Acoustic',
  ];

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
        return;
      }
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|flac)$/i)) {
        showToast('Please select a valid audio file (MP3, WAV, M4A)', 'error');
        return;
      }
      setAudioFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!artistName.trim() || !email.trim() || !phone.trim() || !songTitle.trim()) {
      showToast('Please fill in all required fields (Artist Name, Email, Phone, Song Title)', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalCoverUrl = coverPreviewUrl;
      let finalAudioUrl = uploadedAudioUrl || streamUrl;
      let audioFileName = audioFile ? audioFile.name : undefined;

      // 1. Upload Cover Artwork if selected
      if (coverFile) {
        try {
          const coverRes = await uploadCoverToStorage(coverFile, (progress) => {
            setCoverUploadProgress(progress);
          });
          finalCoverUrl = coverRes.downloadUrl;
        } catch (coverErr) {
          console.warn('Cover upload note:', coverErr);
        }
      }

      // 2. Upload Audio File if selected
      if (audioFile) {
        try {
          const audioRes = await uploadAudioToStorage(audioFile, (progress) => {
            setAudioUploadProgress(progress);
          });
          finalAudioUrl = audioRes.downloadUrl;
          audioFileName = audioRes.fileName;
        } catch (audioErr) {
          console.warn('Audio upload note:', audioErr);
        }
      }

      // 3. Save submission to Firestore
      const requestId = await submitPromotionRequest({
        artistName: artistName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
        songTitle: songTitle.trim(),
        featuredArtists: featuredArtists.trim() || undefined,
        genre,
        proposedPriceMWK: Number(proposedPriceMWK) || 0,
        coverImage: finalCoverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
        audioFilePath: finalAudioUrl,
        audioFileName,
        streamUrl: streamUrl.trim() || undefined,
        description: description.trim() || undefined,
        socialLinks: {
          instagram: instagram.trim() || undefined,
          tiktok: tiktok.trim() || undefined,
          youtube: youtube.trim() || undefined,
        },
      });

      setSubmittedRequestId(requestId);
      showToast('Music promotion request submitted successfully!', 'success');
    } catch (err: any) {
      console.error('Promotion request submission error:', err);
      showToast(err.message || 'Failed to submit promotion request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view
  if (submittedRequestId) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
            Request Received
          </span>
          <h1 className="text-3xl font-extrabold text-white font-['Syne',sans-serif]">
            Thank You, {artistName}!
          </h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Your track <strong className="text-white">"{songTitle}"</strong> has been submitted to the Projects Mandatory music promotion team.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs text-slate-400">Submission Reference:</span>
            <span className="font-mono text-xs text-emerald-400 font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              {submittedRequestId}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p className="font-semibold text-white">What happens next?</p>
            <ol className="list-decimal pl-5 space-y-1 text-slate-400">
              <li>Projects Mandatory management will review your audio and artwork quality.</li>
              <li>Once accepted, your track will be published on the store catalog with instant PayChangu Malawi mobile money checkout.</li>
              <li>You will be contacted via WhatsApp ({whatsapp || phone}) or email ({email}).</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button variant="primary" onClick={onExploreMusic}>
            Explore Music Store
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSubmittedRequestId(null);
              setSongTitle('');
              setAudioFile(null);
              setCoverFile(null);
            }}
          >
            Submit Another Track
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-left animate-in fade-in py-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Store</span>
      </button>

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Artist Promotion Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-['Syne',sans-serif]">
            Promote Your Music on <span className="text-rose-500">Projects Mandatory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Get your original music discovered, streamed, and sold directly to thousands of music fans in Malawi and across Africa with instant mobile money (Airtel & TNM) and card payments.
          </p>
        </div>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Artist Contact Information */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">1. Artist & Contact Info</h2>
              <p className="text-xs text-slate-400">How our curation team can reach you</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Artist / Stage Name *"
              placeholder="e.g. Young Ace, Queen Vee"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              required
            />
            <Input
              label="Contact Email *"
              type="email"
              placeholder="artist@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Phone Number (Call / SMS) *"
              type="tel"
              placeholder="+265 999 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Input
              label="WhatsApp Number (for instant updates)"
              type="tel"
              placeholder="+265 888 000 000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
        </div>

        {/* Step 2: Song Details */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">2. Song Details</h2>
              <p className="text-xs text-slate-400">Information about the track you are promoting</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Song Title *"
              placeholder="e.g. Malawi Vibes, Forever Mine"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              required
            />
            <Input
              label="Featured Artists (optional)"
              placeholder="e.g. feat. Eli Njuchi, Tay Grin"
              value={featuredArtists}
              onChange={(e) => setFeaturedArtists(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Music Genre *
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                {genres.map((g) => (
                  <option key={g} value={g} className="bg-slate-900 text-white">
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Proposed Store Price (MWK) - (0 for Free Promo)"
              type="number"
              min="0"
              step="100"
              placeholder="1500"
              value={proposedPriceMWK}
              onChange={(e) => setProposedPriceMWK(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Song Story & Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Tell listeners what inspired this song, producers, recording story..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>
        </div>

        {/* Step 3: Media Upload */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">3. Audio & Artwork Upload</h2>
              <p className="text-xs text-slate-400">High-quality audio track and square cover art</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Cover Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Cover Artwork (Square Image)</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
              <div
                onClick={() => coverInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition min-h-[160px]"
              >
                {coverPreviewUrl ? (
                  <div className="relative group w-24 h-24 rounded-xl overflow-hidden shadow-lg">
                    <img src={coverPreviewUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <span className="text-[10px] text-white font-semibold">Change</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-white">Upload Cover Art</p>
                      <p className="text-[10px] text-slate-500">JPG, PNG (Min 1000x1000 recommended)</p>
                    </div>
                  </>
                )}
              </div>
              {coverUploadProgress !== null && (
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-rose-500 h-full transition-all" style={{ width: `${coverUploadProgress}%` }} />
                </div>
              )}
            </div>

            {/* Audio Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Audio Track (MP3 / WAV)</label>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioSelect}
                className="hidden"
              />
              <div
                onClick={() => audioInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition min-h-[160px]"
              >
                {audioFile ? (
                  <div className="flex flex-col items-center text-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px]">{audioFile.name}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">Ready to upload ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-400">
                      <FileAudio className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-white">Upload Master Audio</p>
                      <p className="text-[10px] text-slate-500">MP3 (320kbps) or WAV master</p>
                    </div>
                  </>
                )}
              </div>
              {audioUploadProgress !== null && (
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full transition-all" style={{ width: `${audioUploadProgress}%` }} />
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Input
              label="Or Stream / Audiomack / YouTube Preview Link (optional)"
              placeholder="https://audiomack.com/artist/song..."
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Step 4: Social Handles */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">4. Artist Social Handles (Optional)</h2>
              <p className="text-xs text-slate-400">For cross-promotion on Projects Mandatory social pages</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Instagram handle"
              placeholder="@artist_official"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
            <Input
              label="TikTok handle"
              placeholder="@artist_tiktok"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
            />
            <Input
              label="YouTube channel"
              placeholder="https://youtube.com/@..."
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-4 text-sm font-bold shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Submit Track for Promotion
          </Button>
          <p className="text-[11px] text-slate-500 text-center mt-2.5">
            By submitting, you confirm you are the copyright holder or authorized representative for this music recording.
          </p>
        </div>
      </form>
    </div>
  );
};
