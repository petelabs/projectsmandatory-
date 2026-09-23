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
  albumId?: string;
  albumTitle?: string;
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
  boostClicks?: number; // Unique Share & Boost referral clicks
  boostPurchases?: number; // Purchases originating from boost referrals
  tags?: string[];
  moods?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  coverImage: string;
  genre: string;
  releaseDate: string;
  type: 'ALBUM' | 'EP' | 'SINGLE';
  description: string;
  songIds: string[];
  songs?: Song[];
  priceMWK?: number;
  totalDuration?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  playCount?: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  curator: string;
  genre?: string;
  mood?: string;
  isEditorial: boolean;
  isMalawiSpecial?: boolean;
  isPublic?: boolean;
  ownerId?: string;
  ownerEmail?: string;
  songIds: string[];
  songs?: Song[];
  playCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export type DownloadQuality = '128kbps' | '320kbps' | 'lossless';

export interface DownloadRecord {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  artistId?: string;
  coverImage: string;
  fileSize: string;
  duration?: string;
  quality: DownloadQuality;
  downloadedAt: string;
  status: 'downloading' | 'completed' | 'paused' | 'failed';
  progress: number; // 0 - 100
  cachedAudioUrl?: string;
}

export interface SavedAlbumRecord {
  id: string;
  albumId: string;
  userId: string;
  savedAt: string;
}

export interface FollowedArtistRecord {
  id: string;
  artistId: string;
  artistName: string;
  userId: string;
  followedAt: string;
}

export interface ArtistNotification {
  id: string;
  title: string;
  message: string;
  type: 'VERIFICATION_APPROVED' | 'VERIFICATION_REJECTED' | 'SONG_APPROVED' | 'NEW_SALE' | 'NEW_TIP' | 'BOOST_MILESTONE';
  read: boolean;
  createdAt: string;
}

export interface ArtistVerificationDetails {
  nationalIdOrPhone: string;
  yearsActive?: string;
  musicSampleUrl?: string;
  whyPromote?: string;
  socialLinks?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
}

export interface BoostReferral {
  id: string;
  artistId: string;
  artistName: string;
  songId?: string;
  songTitle?: string;
  code: string;
  visitorId?: string;
  source?: string; // 'whatsapp', 'facebook', 'twitter', 'direct'
  convertedToPurchase: boolean;
  orderId?: string;
  amountMWK?: number;
  createdAt: string;
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
  verificationStatus: 'UNVERIFIED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  verificationRequestedAt?: string;
  verifiedAt?: string;
  verificationFeedback?: string;
  verificationDetails?: ArtistVerificationDetails;
  notifications?: ArtistNotification[];
  referralStats?: {
    totalReferralClicks: number;
    totalReferralPlays: number;
    totalReferralPurchases: number;
    totalReferralRevenueMWK: number;
  };
  analytics?: {
    totalPlays: number;
    totalPageViews: number;
  };
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
  producer?: string;
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
  activeRole?: 'user' | 'artist';
  referralCode?: string;
  referredBy?: string;
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

// ==========================================
// PHASE 1 MONETISATION ARCHITECTURE TYPES
// ==========================================

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';

export interface SubscriptionPlan {
  id: string; // 'free' | 'premium' | 'premium_plus'
  name: string; // 'Free' | 'Premium' | 'Premium Plus'
  tier: SubscriptionTier;
  priceMWK: number; // 0, 1000, 2500 - configurable
  interval: 'month' | 'year';
  description: string;
  hasAds: boolean;
  allowsOfflineDownloads: boolean;
  audioQuality: string; // '128kbps Standard' | '320kbps High Quality' | 'Lossless Studio Master'
  features: string[];
  isActive: boolean;
  updatedAt?: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  userEmail: string;
  planId: string;
  planTier: SubscriptionTier;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  amountMWK: number;
  paymentMethod: PaymentMethod;
  txRef: string;
  paychanguRef?: string;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
}

export interface QualifyingStreamRules {
  minListeningTimeSec: number; // Default: 30 seconds
  minPercentPlayed: number; // Default: 50%
  maxRepeatsPerHour: number; // Default: 5 streams per song/user/hour
  antiFraudStrictness: 'NORMAL' | 'HIGH' | 'STRICT';
}

export interface AdSettings {
  enabled: boolean;
  frequencyTracks: number; // Audio ad interval, e.g. every 3 tracks
  eligiblePlans: SubscriptionTier[]; // ['FREE']
  audioAdDurationSec: number; // e.g. 10s audio sponsor break
  activeSponsors: Array<{
    id: string;
    brandName: string;
    tagline: string;
    audioUrl?: string;
    bannerUrl?: string;
    ctaText?: string;
    linkUrl?: string;
  }>;
}

export interface MonetizationSettings {
  id: string;
  creatorRoyaltyPoolPercentage: number; // Default: 60%
  platformRevenuePercentage: number; // Default: 40%
  tipPlatformFeePercentage: number; // Default: 10%
  qualifyingStreamRules: QualifyingStreamRules;
  adSettings: AdSettings;
  updatedAt: string;
  updatedBy?: string;
}

export interface StreamRecord {
  id: string;
  songId: string;
  songTitle: string;
  artistId: string;
  artistName: string;
  userId?: string;
  userTier: SubscriptionTier;
  durationPlayedSec: number;
  songDurationSec: number;
  percentPlayed: number;
  ipHash?: string;
  deviceFingerprint?: string;
  isQualified: boolean;
  unqualifiedReason?: string;
  isFlaggedSuspicious: boolean;
  fraudReason?: string;
  periodMonth: string; // '2026-09'
  timestamp: string;
}

export interface FraudFlag {
  id: string;
  streamId?: string;
  songId?: string;
  artistId?: string;
  userId?: string;
  reason: string; // 'RAPID_PLAY_SKIPPING' | 'BOT_LOOP_PATTERN' | 'VELOCITY_LIMIT_EXCEEDED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  affectedStreamsCount: number;
  estimatedFlaggedAmountMWK: number;
  status: 'PENDING_REVIEW' | 'CONFIRMED_FRAUD' | 'DISMISSED';
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export interface RoyaltyPeriod {
  id: string; // 'period-2026-09'
  month: string; // '2026-09'
  title: string; // 'September 2026'
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CALCULATING' | 'FINALIZED' | 'CLOSED';
  totalSubscriptionRevenueMWK: number;
  totalAdRevenueMWK: number;
  eligibleRevenueMWK: number;
  creatorPoolPercentage: number; // 60
  platformPercentage: number; // 40
  creatorRoyaltyPoolMWK: number; // 60% of eligible
  platformRevenueMWK: number; // 40%
  totalQualifyingStreams: number;
  totalFlaggedStreams: number;
  finalizedAt?: string;
  finalizedBy?: string;
}

export interface RoyaltyStatement {
  id: string;
  periodId: string;
  periodMonth: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  totalCreatorPoolMWK: number;
  artistQualifyingStreams: number;
  totalPlatformQualifyingStreams: number;
  streamsharePercentage: number; // e.g. 10.5%
  calculatedCreatorAllocationMWK: number;
  adjustmentsMWK: number; // rights splits, deductions, refunds
  finalAmountMWK: number; // calculatedCreatorAllocationMWK - adjustments
  status: 'DRAFT' | 'FINALIZED' | 'PAID';
  isImmutable: boolean;
  createdAt: string;
  finalizedAt?: string;
  paidAt?: string;
}

export interface ArtistEarningsSummary {
  artistId: string;
  artistName: string;
  totalQualifyingStreams: number;
  currentStreamsharePercent: number;
  estimatedCurrentPeriodEarningsMWK: number;
  subscriptionEarningsMWK: number;
  adSupportedEarningsMWK: number;
  finalizedEarningsMWK: number; // Immutable from closed statements
  pendingPayoutMWK: number; // Ready for payout
  totalPaidOutMWK: number;
  tipsEarnedMWK: number;
  directSalesEarnedMWK: number;
  lifetimeTotalEarnedMWK: number;
  withdrawableBalanceMWK: number; // Only FINALIZED earnings + tips + direct sales, NOT estimated!
  updatedAt: string;
}

export interface TipRecord {
  id: string;
  artistId: string;
  artistName: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  amountMWK: number;
  platformFeeMWK: number; // e.g. 10%
  artistAmountMWK: number; // e.g. 90%
  message?: string;
  txRef: string;
  paychanguRef?: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  paidAt?: string;
}

export interface ContentPurchase {
  id: string;
  userId?: string;
  customerEmail: string;
  customerPhone?: string;
  itemType: 'SONG' | 'ALBUM';
  itemId: string;
  itemTitle: string;
  artistId?: string;
  artistName?: string;
  amountMWK: number;
  txRef: string;
  purchaseToken?: string;
  tokenExpiresAt?: string;
  maxDownloads: number;
  downloadCount: number;
  status: PaymentStatus;
  purchasedAt: string;
}

export interface AdminMonetizationSummary {
  totalSubscriptionRevenueMWK: number;
  premiumSubscribersCount: number;
  premiumPlusSubscribersCount: number;
  freeUsersCount: number;
  adRevenueMWK: number;
  individualPurchaseRevenueMWK: number;
  tipRevenueMWK: number;
  creatorRoyaltyPoolMWK: number; // 60%
  platformRevenueMWK: number; // 40%
  pendingPayoutsMWK: number;
  completedPayoutsMWK: number;
  refundsMWK: number;
  chargebacksMWK: number;
  fraudFlaggedRevenueMWK: number;
  currentPeriod: RoyaltyPeriod;
}

// ==========================================
// PHASE 2 MONETISATION & GROWTH TYPES
// ==========================================

export type PromotionPlacement = 
  | 'HOME_FEATURED' 
  | 'TRENDING_DISCOVERY' 
  | 'SEARCH_DISCOVERY' 
  | 'GENRE_PAGES' 
  | 'FEATURED_RELEASES' 
  | 'RECOMMENDED';

export type PromotionCampaignStatus = 
  | 'DRAFT' 
  | 'PENDING_APPROVAL' 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'REJECTED';

export interface ArtistProSettings {
  enabled: boolean;
  priceMWK: number; // Configurable by admin (e.g., 5,000 MWK/month)
  interval: 'month' | 'year';
  features: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface ArtistProSubscription {
  id: string;
  artistId: string;
  artistName: string;
  userId: string;
  userEmail: string;
  planTier: 'ARTIST_PRO';
  priceMWK: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
  paymentMethod: PaymentMethod;
  txRef: string;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PromotionCampaign {
  id: string;
  artistId: string;
  artistName: string;
  userId: string;
  songId?: string;
  songTitle?: string;
  songCover?: string;
  albumId?: string;
  albumTitle?: string;
  targetPlacement: PromotionPlacement;
  budgetMWK: number;
  spentMWK: number;
  remainingBudgetMWK: number;
  startDate: string;
  endDate: string;
  status: PromotionCampaignStatus;
  adminNotes?: string;
  impressions: number;
  clicks: number;
  playsGenerated: number;
  saves: number;
  followsGenerated: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PromotionTransaction {
  id: string;
  artistId: string;
  campaignId?: string;
  type: 'TOPUP' | 'BUDGET_RESERVED' | 'IMPRESSION_SPEND' | 'CLICK_SPEND' | 'PLAY_SPEND' | 'BUDGET_REFUND';
  amountMWK: number;
  txRef?: string;
  description: string;
  createdAt: string;
}

export interface PromotionWallet {
  id: string; // artistId
  artistId: string;
  artistName: string;
  availableBalanceMWK: number;
  reservedBudgetMWK: number;
  lifetimeSpentMWK: number;
  lifetimeTopUpMWK: number;
  lastTopUpDate?: string;
  updatedAt: string;
}

export interface FeaturedPlacement {
  id: string;
  artistId: string;
  artistName: string;
  userId: string;
  releaseType: 'SONG' | 'ALBUM' | 'EP';
  itemId: string;
  itemTitle: string;
  itemCover: string;
  genre: string;
  placementSection: 'HOME_BANNER' | 'NEW_RELEASES_HERO' | 'GENRE_SPOTLIGHT';
  startDate: string;
  endDate: string;
  priceMWK: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'REJECTED' | 'EXPIRED';
  adminNotes?: string;
  txRef?: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface GiftSubscription {
  id: string;
  senderUserId?: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  planTier: 'PREMIUM' | 'PREMIUM_PLUS';
  durationMonths: number;
  amountMWK: number;
  giftCode: string;
  giftMessage?: string;
  paymentMethod: PaymentMethod;
  txRef: string;
  status: 'PURCHASED' | 'CLAIMED' | 'EXPIRED' | 'CANCELLED';
  claimedByUserId?: string;
  claimedAt?: string;
  expiresAt: string; // Valid for 1 year to claim
  createdAt: string;
}

export interface FamilyPlan {
  id: string;
  ownerUserId: string;
  ownerEmail: string;
  ownerName: string;
  planTier: 'FAMILY_PREMIUM';
  priceMWK: number; // Configurable by admin (e.g. 4,000 MWK/month)
  maxMembers: number; // Default 6
  activeMembersCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  txRef?: string;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyPlanId: string;
  memberUserId?: string;
  memberEmail: string;
  memberName: string;
  role: 'OWNER' | 'MEMBER';
  inviteStatus: 'INVITED' | 'ACCEPTED' | 'REMOVED';
  invitedAt: string;
  joinedAt?: string;
}

export interface ArtistMembershipPlan {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  description: string;
  priceMWK: number; // Configurable by artist (e.g., 1,500 MWK/mo)
  billingInterval: 'MONTHLY' | 'YEARLY';
  perks: string[]; // ['Exclusive releases', 'Early access', 'Supporter badge', 'Behind-the-scenes']
  isActive: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ArtistMembershipSubscription {
  id: string;
  planId: string;
  artistId: string;
  artistName: string;
  userId: string;
  userEmail: string;
  userName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  priceMWK: number;
  artistShareMWK: number; // 85%
  platformFeeMWK: number; // 15%
  txRef: string;
  startedAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface MerchProduct {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  description: string;
  priceMWK: number;
  imageUrl: string;
  inventory: number;
  category: 'APPAREL' | 'DIGITAL_ITEM' | 'ACCESSORY';
  status: 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'DISABLED';
  createdAt: string;
}

export interface EventRecord {
  id: string;
  artistId: string;
  artistName: string;
  eventName: string;
  description: string;
  venue: string;
  city: string;
  eventDate: string;
  eventTime: string;
  ticketTypes: Array<{
    name: string;
    priceMWK: number;
    capacity: number;
    sold: number;
  }>;
  totalCapacity: number;
  totalTicketsSold: number;
  bannerUrl?: string;
  status: 'UPCOMING' | 'SOLD_OUT' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
}

export type PlatformRevenueSource = 
  | 'SUBSCRIPTION_SHARE'
  | 'ARTIST_PRO'
  | 'PROMOTION'
  | 'CAMPAIGN_SPEND'
  | 'CAMPAIGN_FEE'
  | 'FEATURED_PLACEMENT'
  | 'FEATURED_RELEASE'
  | 'GIFT_SUBSCRIPTION'
  | 'FAMILY_SUBSCRIPTION'
  | 'FAMILY_PLAN'
  | 'ARTIST_MEMBERSHIP_FEE'
  | 'FAN_MEMBERSHIP'
  | 'TIP_PLATFORM_FEE'
  | 'TIP_FEE'
  | 'MERCHANDISE_FEE'
  | 'EVENT_FEE'
  | 'INDIVIDUAL_SONG_SALE';

export interface PlatformRevenueEntry {
  id: string;
  source: PlatformRevenueSource;
  amountMWK: number;
  relatedId?: string; // campaignId, subscriptionId, tipId, orderId
  artistId?: string;
  userId?: string;
  periodMonth: string; // '2026-09'
  description: string;
  createdAt: string;
}

export interface AdminFinancialLog {
  id: string;
  adminEmail: string;
  action: string;
  settingKey: string;
  previousValue: string;
  newValue: string;
  timestamp: string;
}

export interface Phase2AdminSettings {
  artistPro: {
    enabled: boolean;
    priceMWK: number;
    features: string[];
  };
  promotions: {
    minBudgetMWK: number;
    maxBudgetMWK: number;
    costPerImpressionMWK: number;
    costPerPlayMWK: number;
    costPerClickMWK: number;
    allowedPlacements: PromotionPlacement[];
  };
  featuredReleases: {
    songPlacementPriceMWK: number;
    albumPlacementPriceMWK: number;
    durationDays: number;
  };
  giftSubscriptions: {
    enabled: boolean;
    availableTiers: Array<'PREMIUM' | 'PREMIUM_PLUS'>;
    availableDurationsMonths: number[];
  };
  familyPlans: {
    enabled: boolean;
    priceMWK: number;
    maxMembers: number;
  };
  artistMemberships: {
    enabled: boolean;
    minPriceMWK: number;
    maxPriceMWK: number;
    platformFeePercent: number; // e.g., 15%
  };
  tips: {
    minTipMWK: number;
    platformFeePercent: number; // e.g., 10%
  };
}


