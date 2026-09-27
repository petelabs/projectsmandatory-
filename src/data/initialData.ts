import { Song, ArtistSettings, Order, Album, Playlist } from '../types';

export const INITIAL_ARTIST_SETTINGS: ArtistSettings = {
  artistName: 'Projects Mandatory',
  artistTagline: 'Premier African Digital Music Storefront & Artist Hub',
  artistBio: 'Projects Mandatory is Malawi\'s premier digital music marketplace. Stream track previews, purchase uncompressed studio master recordings, and empower independent artists with direct 70% payouts.',
  profileImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
  bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop',
  contactEmail: 'support@projectsmandatory.com',
  contactPhone: '+265 999 123 456',
  whatsappNumber: '+265 888 789 012',
  studioLocation: 'Lilongwe & Blantyre, Malawi',
  currency: 'MWK',
  paychanguPublicKey: '',
  paychanguMode: 'live',
  socialLinks: {
    instagram: 'https://instagram.com/projectsmandatory',
    facebook: 'https://facebook.com/projectsmandatory',
    youtube: 'https://youtube.com/@projectsmandatory',
    twitter: 'https://x.com/projectsmandatory',
  },
  copyrightNotice: '© 2026 Projects Mandatory. All Rights Reserved.',
  allowGuestPurchases: true,
  maxDownloadAttempts: 5,
  tokenValidityDays: 30,
};

// Live Firestore catalogue - Clean fresh start (Real songs uploaded by artists via Studio)
export const INITIAL_SONGS: Song[] = [];

// Curated Albums & EPs - Clean fresh start (Populated by real releases)
export const INITIAL_ALBUMS: Album[] = [];

// Curated Playlists - Clean fresh start (Populated by real playlists)
export const INITIAL_PLAYLISTS: Playlist[] = [];

// Clean fresh orders — populated by real PayChangu customer transactions
export const INITIAL_ORDERS: Order[] = [];

export const DEFAULT_PLANS: import('../types').SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'FREE',
    priceMWK: 0,
    interval: 'month',
    description: 'Ad-supported music streaming for casual listeners.',
    hasAds: true,
    allowsOfflineDownloads: false,
    audioQuality: '128kbps Standard Audio',
    features: [
      'Full catalog streaming with ads',
      'Curated playlists & artist discovery',
      'Support artists through ad-royalty share',
      'No offline downloads'
    ],
    isActive: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    tier: 'PREMIUM',
    priceMWK: 1000,
    interval: 'month',
    description: 'Continuous uninterrupted music streaming with zero ads.',
    hasAds: false,
    allowsOfflineDownloads: false,
    audioQuality: '320kbps High Quality',
    features: [
      'Unlimited ad-free streaming',
      'High-fidelity 320kbps audio playback',
      'Direct contribution to Creator Royalty Pool',
      'Unlimited skips & background playback',
      'No offline downloads'
    ],
    isActive: true,
  },
  {
    id: 'premium_plus',
    name: 'Premium Plus',
    tier: 'PREMIUM_PLUS',
    priceMWK: 2500,
    interval: 'month',
    description: 'The ultimate music experience with offline downloads and studio master quality.',
    hasAds: false,
    allowsOfflineDownloads: true,
    audioQuality: 'Lossless Studio Master Quality',
    features: [
      'Unlimited ad-free streaming',
      'Offline listening & local track downloads',
      'Highest audio master quality (uncompressed)',
      'Maximum allocation to Creator Royalty Pool',
      'Priority access to exclusive artist releases'
    ],
    isActive: true,
  },
];

export const DEFAULT_MONETIZATION_SETTINGS: import('../types').MonetizationSettings = {
  id: 'global-settings',
  creatorRoyaltyPoolPercentage: 60,
  platformRevenuePercentage: 40,
  tipPlatformFeePercentage: 10,
  qualifyingStreamRules: {
    minListeningTimeSec: 30,
    minPercentPlayed: 50,
    maxRepeatsPerHour: 5,
    antiFraudStrictness: 'HIGH',
  },
  adSettings: {
    enabled: true,
    frequencyTracks: 3, // Play audio ad cue every 3 tracks for free users
    eligiblePlans: ['FREE'],
    audioAdDurationSec: 10,
    activeSponsors: [
      {
        id: 'sponsor-airtel',
        brandName: 'Airtel Money Malawi',
        tagline: 'Fast, secure, and instant payments anywhere in Malawi.',
        ctaText: 'Upgrade to Ad-Free Premium for only MK 1,000/mo',
        linkUrl: '/pricing',
      },
      {
        id: 'sponsor-tnm',
        brandName: 'TNM Mpamba',
        tagline: 'Always with you. Stream local Malawian anthems seamlessly.',
        ctaText: 'Go Premium Plus for offline downloads: MK 2,500/mo',
        linkUrl: '/pricing',
      },
    ],
  },
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_PHASE2_ADMIN_SETTINGS: import('../types').Phase2AdminSettings = {
  artistPro: {
    enabled: true,
    priceMWK: 5000,
    features: [
      'Advanced Listener & Geographic Analytics',
      'Audience Growth Trajectory & Demographic Insights',
      'Advanced Earnings & Stream Breakdown',
      'Custom Banner & Enhanced Profile Theme',
      'Scheduled Release Automation & Pre-Save Links',
      'Priority Artist Review & Platform Placement Eligibility',
      'Access to Advanced Self-Serve Campaign Manager',
    ],
  },
  promotions: {
    minBudgetMWK: 5000,
    maxBudgetMWK: 250000,
    costPerImpressionMWK: 5,
    costPerPlayMWK: 15,
    costPerClickMWK: 25,
    allowedPlacements: [
      'HOME_FEATURED',
      'TRENDING_DISCOVERY',
      'SEARCH_DISCOVERY',
      'GENRE_PAGES',
      'FEATURED_RELEASES',
      'RECOMMENDED',
    ],
  },
  featuredReleases: {
    songPlacementPriceMWK: 10000,
    albumPlacementPriceMWK: 25000,
    durationDays: 14,
  },
  giftSubscriptions: {
    enabled: true,
    availableTiers: ['PREMIUM', 'PREMIUM_PLUS'],
    availableDurationsMonths: [1, 3, 6, 12],
  },
  familyPlans: {
    enabled: true,
    priceMWK: 4500,
    maxMembers: 6,
  },
  artistMemberships: {
    enabled: true,
    minPriceMWK: 500,
    maxPriceMWK: 25000,
    platformFeePercent: 15, // 15% platform fee, 85% to artist
  },
  tips: {
    minTipMWK: 500,
    platformFeePercent: 10, // 10% platform fee, 90% to artist
  },
};
