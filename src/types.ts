export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod = 
  | 'AIRTEL_MONEY' 
  | 'TNM_MPAMBA' 
  | 'CARD' 
  | 'BANK_TRANSFER' 
  | 'PAYCHANGU';

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: string; // Links to ArtistProfile.id / userId
  featuredArtists?: string;
  producer?: string;
  genre: string;
  releaseDate: string;
  priceMWK: number; // Maximum 5,000 MWK
  artistShareMWK?: number; // 70% of priceMWK
  platformShareMWK?: number; // 30% of priceMWK
  coverImage: string;
  description: string;
  lyrics?: string;
  audioFilePath?: string; // Firebase Storage path or download URL
  audioFileName?: string;
  fileFormat: string; // e.g. "320kbps MP3 + WAV Master"
  fileSize: string; // e.g. "9.8 MB"
  duration?: string; // e.g. "3:45"
  isPublished: boolean;
  isFeatured?: boolean;
  isLatest?: boolean;
  isPopular?: boolean;
  bpm?: number;
  key?: string;
  downloadCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ArtistProfile {
  id: string; // Document ID (usually matches userId)
  userId: string; // Firebase Auth UID
  artistName: string; // Stage / Brand name
  email: string;
  phone: string;
  whatsapp?: string;
  bio: string;
  genres: string[];
  avatarUrl: string;
  bannerUrl?: string;
  location?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  payoutDetails: {
    accountType: 'AIRTEL_MONEY' | 'TNM_MPAMBA' | 'BANK';
    accountNumber: string; // e.g. "0999123456" or "0888123456"
    accountName: string;
    bankName?: string;
  };
  wallet: {
    totalEarnedMWK: number; // Cumulative 70% share from song sales & fan tips
    pendingPayoutMWK: number; // Current balance awaiting disbursement
    totalPaidOutMWK: number; // Total successfully disbursed by admin
    totalSongSalesCount: number;
    totalTipsReceivedMWK: number;
    totalSupportersCount: number;
  };
  isVerified: boolean;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED';
  inviteCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ArtistSongSubmission {
  id: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  artistPhone: string;
  title: string;
  featuredArtists?: string;
  genre: string;
  releaseDate: string;
  priceMWK: number; // Capped at MWK 5,000
  artistShareMWK: number; // 70% of priceMWK
  platformShareMWK: number; // 30% of priceMWK
  coverImage: string;
  audioFilePath?: string;
  audioFileName?: string;
  fileSize?: string;
  fileFormat?: string;
  streamUrl?: string;
  description: string;
  lyrics?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminFeedback?: string;
  publishedSongId?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ArtistSupportTip {
  id: string;
  artistId: string;
  artistName: string;
  supporterName: string;
  supporterEmail?: string;
  supporterPhone: string;
  amountMWK: number;
  artistShareMWK: number; // 70% credited to artist
  platformShareMWK: number; // 30% platform fee
  message?: string;
  paymentMethod: PaymentMethod;
  txRef: string;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
}

export interface ArtistPayoutRecord {
  id: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  amountMWK: number;
  payoutMethod: 'AIRTEL_MONEY' | 'TNM_MPAMBA' | 'BANK';
  accountNumber: string;
  accountName: string;
  bankName?: string;
  status: 'REQUESTED' | 'PROCESSED' | 'REJECTED';
  transactionRef?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export interface Order {
  id: string;
  txRef: string;
  songId: string;
  songTitle: string;
  songArtist: string;
  songCover: string;
  songPriceMWK: number;
  artistId?: string;
  artistShareMWK?: number;
  platformShareMWK?: number;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  purchaseToken?: string;
  tokenExpiresAt?: string;
  downloadCount: number;
  maxDownloads: number;
  createdAt: string;
  paidAt?: string;
  paychanguRef?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalSpentMWK: number;
  purchaseCount: number;
  lastPurchaseDate: string;
  firstPurchaseDate: string;
  purchasedSongIds: string[];
}

export interface ArtistSettings {
  artistName: string;
  artistTagline: string;
  artistBio: string;
  profileImage: string;
  bannerImage: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  studioLocation: string;
  currency: string;
  paychanguPublicKey: string;
  paychanguMode: 'sandbox' | 'live';
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
  copyrightNotice: string;
  allowGuestPurchases: boolean;
  maxDownloadAttempts: number;
  tokenValidityDays: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  isGoogleUser?: boolean;
  isArtist?: boolean;
  artistId?: string;
}

export interface DownloadTokenPayload {
  token: string;
  orderId: string;
  songId: string;
  songTitle: string;
  customerEmail: string;
  expiresAt: string;
  remainingDownloads: number;
}

export interface MusicPromotionRequest {
  id: string;
  artistName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  songTitle: string;
  featuredArtists?: string;
  genre: string;
  proposedPriceMWK?: number;
  audioFilePath?: string;
  audioFileName?: string;
  coverImage?: string;
  streamUrl?: string;
  description?: string;
  lyrics?: string;
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phoneOrWhatsApp: string;
  subject?: string;
  message: string;
  createdAt: string;
  read?: boolean;
  status?: 'NEW' | 'READ' | 'ARCHIVED';
}
