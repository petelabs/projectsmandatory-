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
  featuredArtists?: string;
  producer?: string;
  genre: string;
  releaseDate: string;
  priceMWK: number;
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
}

export interface Order {
  id: string;
  txRef: string;
  songId: string;
  songTitle: string;
  songArtist: string;
  songCover: string;
  songPriceMWK: number;
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

