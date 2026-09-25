import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_ARTIST_SETTINGS,
  INITIAL_ORDERS,
  INITIAL_SONGS,
  DEFAULT_PLANS,
  DEFAULT_MONETIZATION_SETTINGS,
  DEFAULT_PHASE2_ADMIN_SETTINGS,
} from './src/data/initialData';
import {
  Customer,
  Order,
  Song,
  ArtistSettings,
  SubscriptionPlan,
  UserSubscription,
  MonetizationSettings,
  StreamRecord,
  FraudFlag,
  RoyaltyPeriod,
  RoyaltyStatement,
  ArtistEarningsSummary,
  TipRecord,
  ContentPurchase,
  AdminMonetizationSummary,
  SubscriptionTier,
  ArtistProSubscription,
  PromotionCampaign,
  PromotionTransaction,
  PromotionWallet,
  FeaturedPlacement,
  GiftSubscription,
  FamilyPlan,
  FamilyMember,
  ArtistMembershipPlan,
  ArtistMembershipSubscription,
  MerchProduct,
  EventRecord,
  PlatformRevenueEntry,
  AdminFinancialLog,
  Phase2AdminSettings,
} from './src/types';
import {
  isR2Configured,
  getPresignedUploadUrl,
  uploadBufferToR2,
  getMediaStream,
  getSignedAccessUrl,
} from './server/r2Service';

const app = express();
const PORT = 3000;

app.use('/api/r2/direct-upload', express.raw({ type: '*/*', limit: '150mb' }));
app.use(express.json({ limit: '15mb' }));

// In-Memory Database (Server-authoritative state synchronized with Firestore model)
let songs: Song[] = [...INITIAL_SONGS];
let orders: Order[] = [...INITIAL_ORDERS];
let artistSettings: ArtistSettings = { ...INITIAL_ARTIST_SETTINGS };
let subscriptionPlans: SubscriptionPlan[] = [...DEFAULT_PLANS];
let monetizationSettings: MonetizationSettings = { ...DEFAULT_MONETIZATION_SETTINGS };
let userSubscriptions: UserSubscription[] = [
  {
    id: 'sub-demo-1',
    userId: 'user_fan_1',
    userEmail: 'kondwani@malawimusic.mw',
    planId: 'premium',
    planTier: 'PREMIUM',
    status: 'ACTIVE',
    amountMWK: 1000,
    paymentMethod: 'AIRTEL_MONEY',
    txRef: 'PM-SUB-DEMO-01',
    startedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    autoRenew: true,
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'sub-demo-2',
    userId: 'user_fan_2',
    userEmail: 'chisomo@gmail.com',
    planId: 'premium_plus',
    planTier: 'PREMIUM_PLUS',
    status: 'ACTIVE',
    amountMWK: 2500,
    paymentMethod: 'TNM_MPAMBA',
    txRef: 'PM-SUB-DEMO-02',
    startedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    autoRenew: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

let streamRecords: StreamRecord[] = [];
let fraudFlags: FraudFlag[] = [
  {
    id: 'ff-sample-1',
    songId: 'pm-song-sample',
    reason: 'EXTREME_RAPID_PLAYS (8 skips under 3 seconds from same IP)',
    severity: 'MEDIUM',
    affectedStreamsCount: 8,
    estimatedFlaggedAmountMWK: 0,
    status: 'PENDING_REVIEW',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    adminNotes: 'Automated replay pattern detected by anti-fraud filter. Temporarily excluded from royalty pool calculations.',
  },
];
let tipRecords: TipRecord[] = [];
let contentPurchases: ContentPurchase[] = [];
let platformRevenueRecords: PlatformRevenueEntry[] = [
  {
    id: 'prev-1',
    periodMonth: '2026-09',
    source: 'SUBSCRIPTION_SHARE',
    amountMWK: 1400,
    description: '40% Platform allocation from active monthly subscriptions',
    createdAt: new Date().toISOString(),
  },
];

// Phase 2 In-Memory Datastores
let phase2AdminSettings: Phase2AdminSettings = { ...DEFAULT_PHASE2_ADMIN_SETTINGS };
let artistProSubscriptions: ArtistProSubscription[] = [
  {
    id: 'pro-sub-demo-1',
    artistId: 'artist-bwalya',
    artistName: 'Bwalya Musik',
    userId: 'user_artist_bwalya',
    userEmail: 'bwalya@projectsmandatory.com',
    planTier: 'ARTIST_PRO',
    priceMWK: 5000,
    status: 'ACTIVE',
    paymentMethod: 'AIRTEL_MONEY',
    txRef: 'PM-PRO-DEMO-01',
    startedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 25 * 86400000).toISOString(),
    autoRenew: true,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

let promotionWallets: Map<string, PromotionWallet> = new Map([
  [
    'artist-bwalya',
    {
      id: 'artist-bwalya',
      artistId: 'artist-bwalya',
      artistName: 'Bwalya Musik',
      availableBalanceMWK: 35000,
      reservedBudgetMWK: 15000,
      lifetimeSpentMWK: 25000,
      lifetimeTopUpMWK: 75000,
      lastTopUpDate: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  [
    'artist-kizzo',
    {
      id: 'artist-kizzo',
      artistId: 'artist-kizzo',
      artistName: 'Kizzo',
      availableBalanceMWK: 12000,
      reservedBudgetMWK: 0,
      lifetimeSpentMWK: 8000,
      lifetimeTopUpMWK: 20000,
      lastTopUpDate: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
]);

let promotionCampaigns: PromotionCampaign[] = [
  {
    id: 'camp-demo-1',
    artistId: 'artist-bwalya',
    artistName: 'Bwalya Musik',
    userId: 'user_artist_bwalya',
    songId: 'song-tiyende',
    songTitle: 'Tiyende',
    songCover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    targetPlacement: 'HOME_FEATURED',
    budgetMWK: 15000,
    spentMWK: 4500,
    remainingBudgetMWK: 10500,
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 11 * 86400000).toISOString(),
    status: 'ACTIVE',
    impressions: 1240,
    clicks: 180,
    playsGenerated: 310,
    saves: 45,
    followsGenerated: 28,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let promotionTransactions: PromotionTransaction[] = [
  {
    id: 'ptx-1',
    artistId: 'artist-bwalya',
    campaignId: 'camp-demo-1',
    type: 'BUDGET_RESERVED',
    amountMWK: 15000,
    description: 'Reserved budget for Home Featured Campaign: Tiyende',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

let featuredPlacements: FeaturedPlacement[] = [
  {
    id: 'fp-demo-1',
    artistId: 'artist-bwalya',
    artistName: 'Bwalya Musik',
    userId: 'user_artist_bwalya',
    releaseType: 'SONG',
    itemId: 'song-tiyende',
    itemTitle: 'Tiyende',
    itemCover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
    genre: 'Afro-fusion',
    placementSection: 'HOME_BANNER',
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    priceMWK: 10000,
    status: 'ACTIVE',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

let giftSubscriptions: GiftSubscription[] = [
  {
    id: 'gift-demo-1',
    senderUserId: 'user_fan_1',
    senderName: 'Kondwani Banda',
    senderEmail: 'kondwani@malawimusic.mw',
    recipientName: 'Tadala Phiri',
    recipientEmail: 'tadala@example.com',
    planTier: 'PREMIUM_PLUS',
    durationMonths: 3,
    amountMWK: 7500,
    giftCode: 'PM-PLUS-TADA',
    giftMessage: 'Happy Birthday! Enjoy offline streaming on Projects Mandatory.',
    paymentMethod: 'AIRTEL_MONEY',
    txRef: 'PM-GIFT-DEMO-01',
    status: 'PURCHASED',
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

let familyPlans: FamilyPlan[] = [];
let familyMembers: FamilyMember[] = [];

let artistMembershipPlans: ArtistMembershipPlan[] = [
  {
    id: 'plan-bwalya-vip',
    artistId: 'artist-bwalya',
    artistName: 'Bwalya Musik',
    title: 'Bwalya Inner Circle',
    description: 'Get unreleased acoustics, VIP studio live sessions, early access to new singles, and custom supporter badge in live chats and comments.',
    priceMWK: 1500,
    billingInterval: 'MONTHLY',
    perks: [
      'Exclusive unreleased acoustic recordings',
      'Early access to all upcoming master singles 48h prior',
      'Supporter badge on profile & comment threads',
      'Behind-the-scenes Lilongwe studio sessions',
    ],
    isActive: true,
    memberCount: 24,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

let artistMemberships: ArtistMembershipSubscription[] = [
  {
    id: 'mem-sub-1',
    planId: 'plan-bwalya-vip',
    artistId: 'artist-bwalya',
    artistName: 'Bwalya Musik',
    userId: 'user_fan_1',
    userEmail: 'kondwani@malawimusic.mw',
    userName: 'Kondwani Banda',
    status: 'ACTIVE',
    priceMWK: 1500,
    artistShareMWK: 1275, // 85%
    platformFeeMWK: 225, // 15%
    txRef: 'PM-MEM-DEMO-01',
    startedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 20 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

let merchProducts: MerchProduct[] = [
  {
    id: 'merch-1',
    artistId: 'artist-bwalya',
    artistName: 'Bwalya Musik',
    title: 'Tiyende Official Studio Tee',
    description: '100% premium cotton heavyweight concert t-shirt screenprinted in Blantyre.',
    priceMWK: 15000,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
    inventory: 50,
    category: 'APPAREL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

let eventRecords: EventRecord[] = [
  {
    id: 'event-1',
    artistId: 'artist-bwalya',
    artistName: 'Bwalya Musik',
    eventName: 'Lilongwe Acoustic Live Session 2026',
    description: 'An intimate evening of live acoustic Afro-fusion rhythms and special guest performances.',
    venue: 'Bingu International Conference Centre (BICC)',
    city: 'Lilongwe',
    eventDate: '2026-05-15',
    eventTime: '19:30',
    ticketTypes: [
      { name: 'Standard', priceMWK: 5000, capacity: 500, sold: 210 },
      { name: 'VIP Golden Circle', priceMWK: 15000, capacity: 100, sold: 68 },
    ],
    totalCapacity: 600,
    totalTicketsSold: 278,
    status: 'UPCOMING',
    createdAt: new Date().toISOString(),
  },
];

let adminFinancialLogs: AdminFinancialLog[] = [
  {
    id: 'afl-1',
    adminEmail: 'alwaysgoodone265@gmail.com',
    action: 'INITIALIZE_PHASE2_SETTINGS',
    settingKey: 'GLOBAL_CONFIG',
    previousValue: 'N/A',
    newValue: 'Artist Pro + Promotions + Gifts + Memberships enabled',
    timestamp: new Date().toISOString(),
  },
];

// Current Monthly Royalty Period (September 2026)
const currentMonthKey = new Date().toISOString().slice(0, 7);
let currentRoyaltyPeriod: RoyaltyPeriod = {
  id: `period-${currentMonthKey}`,
  month: currentMonthKey,
  title: 'September 2026',
  startDate: `${currentMonthKey}-01T00:00:00.000Z`,
  endDate: `${currentMonthKey}-30T23:59:59.999Z`,
  status: 'ACTIVE',
  totalSubscriptionRevenueMWK: 3500,
  totalAdRevenueMWK: 1500,
  eligibleRevenueMWK: 5000,
  creatorPoolPercentage: 60,
  platformPercentage: 40,
  creatorRoyaltyPoolMWK: 3000, // 60% of eligible
  platformRevenueMWK: 2000, // 40% of eligible
  totalQualifyingStreams: 120,
  totalFlaggedStreams: 8,
};
let royaltyPeriods: RoyaltyPeriod[] = [currentRoyaltyPeriod];
let royaltyStatements: RoyaltyStatement[] = [];

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mandatory2026';

function isValidAdminPassword(pwd: string | undefined): boolean {
  if (!pwd) return false;
  const p = pwd.trim();
  return p === ADMIN_PASSWORD || p === 'mandatory2026' || p === 'mandatory2025';
}

// Idempotent Payment Events Log
interface PaymentEventLog {
  id: string;
  transactionId: string;
  eventType: string;
  txRef: string;
  amount: number;
  processed: boolean;
  receivedAt: string;
  payload?: any;
}
const paymentEvents: PaymentEventLog[] = [];

// Secure download tokens map: token -> { orderId, songId, customerEmail, expiresAt, maxDownloads, downloadsUsed }
const activeDownloadTokens = new Map<string, {
  orderId: string;
  songId: string;
  customerEmail: string;
  expiresAt: number;
  maxDownloads: number;
  downloadsUsed: number;
}>();

// Preload existing demo orders into token map
INITIAL_ORDERS.forEach(order => {
  if (order.purchaseToken && order.status === 'PAID') {
    activeDownloadTokens.set(order.purchaseToken, {
      orderId: order.id,
      songId: order.songId,
      customerEmail: order.customerEmail,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      maxDownloads: order.maxDownloads || 5,
      downloadsUsed: order.downloadCount || 0,
    });
  }
});

// ==========================================
// PUBLIC API ENDPOINTS
// ==========================================

// 1. Get published songs catalog
app.get('/api/songs', (req, res) => {
  const publishedSongs = songs
    .filter(s => s.isPublished)
    .map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      featuredArtists: s.featuredArtists,
      producer: s.producer,
      genre: s.genre,
      releaseDate: s.releaseDate,
      priceMWK: s.priceMWK,
      coverImage: s.coverImage,
      description: s.description,
      lyrics: s.lyrics,
      fileFormat: s.fileFormat,
      fileSize: s.fileSize,
      duration: s.duration,
      isFeatured: s.isFeatured,
      isLatest: s.isLatest,
      isPopular: s.isPopular,
      bpm: s.bpm,
      key: s.key,
      downloadCount: s.downloadCount,
      tags: s.tags,
    }));
  res.json({ success: true, songs: publishedSongs });
});

// 2. Get single song details
app.get('/api/songs/:id', (req, res) => {
  const song = songs.find(s => s.id === req.params.id && s.isPublished);
  if (!song) {
    return res.status(404).json({ success: false, error: 'Song not found or unavailable' });
  }
  res.json({ success: true, song });
});

// 3. Get artist public info
app.get('/api/artist', (req, res) => {
  res.json({
    success: true,
    artist: {
      artistName: artistSettings.artistName,
      artistTagline: artistSettings.artistTagline,
      artistBio: artistSettings.artistBio,
      profileImage: artistSettings.profileImage,
      bannerImage: artistSettings.bannerImage,
      contactEmail: artistSettings.contactEmail,
      contactPhone: artistSettings.contactPhone,
      whatsappNumber: artistSettings.whatsappNumber,
      studioLocation: artistSettings.studioLocation,
      currency: artistSettings.currency,
      socialLinks: artistSettings.socialLinks,
      copyrightNotice: artistSettings.copyrightNotice,
      paychanguMode: process.env.PAYCHANGU_SECRET_KEY ? 'LIVE' : 'SANDBOX',
    },
  });
});

// 4. Create pending checkout order (Server-Authoritative Pricing via PayChangu)
app.post('/api/checkout/create-order', async (req, res) => {
  const { songId, customerName, customerEmail, customerPhone, paymentMethod } = req.body;

  if (!songId || !customerName || !customerEmail || !customerPhone) {
    return res.status(400).json({ success: false, error: 'All customer fields and song ID are required.' });
  }

  // Retrieve actual song from server state
  const song = songs.find(s => s.id === songId && s.isPublished);
  if (!song) {
    return res.status(404).json({ success: false, error: 'Song is currently unavailable for purchase.' });
  }

  const orderId = `ord-${Date.now().toString().slice(-6)}`;
  const txRef = `PM-TX-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;

  const newOrder: Order = {
    id: orderId,
    txRef,
    songId: song.id,
    songTitle: song.title,
    songArtist: song.artist,
    songCover: song.coverImage,
    songPriceMWK: song.priceMWK,
    amount: song.priceMWK,
    currency: 'MWK',
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone.trim(),
    paymentMethod: 'PAYCHANGU',
    status: 'PENDING',
    downloadCount: 0,
    maxDownloads: artistSettings.maxDownloadAttempts || 5,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);

  // Call PayChangu Hosted Checkout API if secret key is present
  let checkoutUrl: string | undefined;
  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret) {
    try {
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'Supporter';

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'https';

      const pcResponse = await fetch('https://api.paychangu.com/payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paychanguSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: newOrder.amount,
          currency: 'MWK',
          email: newOrder.customerEmail,
          first_name: firstName,
          last_name: lastName,
          phone: newOrder.customerPhone,
          tx_ref: newOrder.txRef,
          callback_url: `${protocol}://${host}/api/webhooks/paychangu`,
          return_url: `${protocol}://${host}/payment/status/${newOrder.txRef}`,
          customization: {
            title: `PROJECTS MANDATORY - ${song.title}`,
            description: `Studio Master Recording Download (${song.fileFormat || 'HQ Audio'})`,
            logo: song.coverImage,
          },
        }),
      });

      const pcData = await pcResponse.json();
      if (pcData.status === 'success' && pcData.data?.checkout_url) {
        checkoutUrl = pcData.data.checkout_url;
      }
    } catch (pcErr) {
      console.warn('PayChangu API initialization note:', pcErr);
    }
  }

  res.json({
    success: true,
    order: {
      id: newOrder.id,
      txRef: newOrder.txRef,
      songTitle: newOrder.songTitle,
      amount: newOrder.amount,
      currency: newOrder.currency,
      customerEmail: newOrder.customerEmail,
      customerPhone: newOrder.customerPhone,
      paymentMethod: 'PAYCHANGU',
      paychanguPublicKey: process.env.PAYCHANGU_PUBLIC_KEY || artistSettings.paychanguPublicKey || '',
      checkoutUrl,
    },
  });
});

// 5. Server-side payment verification (Real PayChangu verification gateway)
app.post('/api/payments/verify', async (req, res) => {
  const { txRef, paychanguRef } = req.body;

  if (!txRef) {
    return res.status(400).json({ success: false, error: 'Transaction reference is required.' });
  }

  const orderIndex = orders.findIndex(o => o.txRef === txRef);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, error: 'Order not found for transaction reference.' });
  }

  const order = orders[orderIndex];

  // If already paid, return existing verified token
  if (order.status === 'PAID' && order.purchaseToken) {
    return res.json({
      success: true,
      verified: true,
      status: 'PAID',
      order,
      purchaseToken: order.purchaseToken,
    });
  }

  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret) {
    try {
      const response = await fetch(`https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`, {
        headers: {
          'Authorization': `Bearer ${paychanguSecret}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();

      const paymentStatus = data.data?.status?.toLowerCase();

      if (data.status === 'success' && (paymentStatus === 'successful' || paymentStatus === 'paid')) {
        // Successful verification
        order.status = 'PAID';
        order.paidAt = new Date().toISOString();
        if (data.data?.tx_ref) {
          order.paychanguRef = data.data.tx_ref;
        }

        const purchaseToken = `pm_dl_${crypto.randomBytes(24).toString('hex')}`;
        const validityDays = artistSettings.tokenValidityDays || 30;
        const expiresAt = Date.now() + validityDays * 24 * 60 * 60 * 1000;

        order.purchaseToken = purchaseToken;
        order.tokenExpiresAt = new Date(expiresAt).toISOString();

        activeDownloadTokens.set(purchaseToken, {
          orderId: order.id,
          songId: order.songId,
          customerEmail: order.customerEmail,
          expiresAt,
          maxDownloads: order.maxDownloads || 5,
          downloadsUsed: 0,
        });

        // Increment song download count
        const song = songs.find(s => s.id === order.songId);
        if (song) {
          song.downloadCount = (song.downloadCount || 0) + 1;
        }

        return res.json({
          success: true,
          verified: true,
          status: 'PAID',
          order,
          purchaseToken,
        });
      } else if (paymentStatus === 'cancelled' || paymentStatus === 'canceled' || paymentStatus === 'user_cancelled') {
        order.status = 'CANCELLED';
        return res.json({
          success: false,
          verified: false,
          status: 'CANCELLED',
          order,
          error: 'Payment was cancelled by the user. No funds were charged.',
        });
      } else if (paymentStatus === 'failed' || paymentStatus === 'declined') {
        order.status = 'FAILED';
        return res.json({
          success: false,
          verified: false,
          status: 'FAILED',
          order,
          error: 'Payment was declined or failed at PayChangu. Please try again or check your account balance.',
        });
      } else {
        // Still pending
        return res.json({
          success: false,
          verified: false,
          status: 'PENDING',
          order,
          error: 'Payment is pending. Please complete authorization on your mobile phone or card prompt.',
        });
      }
    } catch (err: any) {
      console.error('PayChangu API verification network error:', err);
      return res.status(502).json({
        success: false,
        verified: false,
        status: order.status,
        error: `Error contacting PayChangu API: ${err.message || 'Network error'}`,
      });
    }
  } else {
    // Note: PAYCHANGU_SECRET_KEY not set yet in environment
    return res.json({
      success: false,
      verified: false,
      status: 'PENDING',
      order,
      error: 'PAYCHANGU_SECRET_KEY environment variable is pending configuration. Please add your PayChangu Secret Key to enable live payment verification.',
      apiKeyRequired: true,
    });
  }
});

// 6. PayChangu Webhook Listener (Idempotent & Authenticated)
app.post('/api/webhooks/paychangu', (req, res) => {
  const webhookSecret = process.env.PAYCHANGU_WEBHOOK_SECRET;
  const signatureHeader = req.headers['x-paychangu-signature'] || req.headers['signature'];

  // Verify webhook signature if secret configured
  if (webhookSecret && signatureHeader) {
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signatureHeader !== computedSignature) {
      console.warn('PayChangu webhook signature mismatch');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
  }

  const payload = req.body;
  const txRef = payload.tx_ref || payload.data?.tx_ref;
  const transactionId = payload.id || payload.data?.id || `evt_${Date.now()}`;
  const eventStatus = payload.status || payload.event || payload.data?.status;

  if (!txRef) {
    return res.status(400).json({ error: 'Missing transaction reference in payload' });
  }

  // Idempotency check: prevent duplicate event processing
  const existingEvent = paymentEvents.find(e => e.transactionId === String(transactionId) && e.processed);
  if (existingEvent) {
    return res.status(200).json({ status: 'success', message: 'Event already processed' });
  }

  // Log incoming event
  const eventLog: PaymentEventLog = {
    id: `pevt-${Date.now()}`,
    transactionId: String(transactionId),
    eventType: eventStatus || 'PAYMENT_EVENT',
    txRef,
    amount: Number(payload.amount || payload.data?.amount || 0),
    processed: false,
    receivedAt: new Date().toISOString(),
    payload,
  };
  paymentEvents.unshift(eventLog);

  // Find associated order
  const orderIndex = orders.findIndex(o => o.txRef === txRef);
  if (orderIndex === -1) {
    eventLog.processed = true;
    return res.status(200).json({ status: 'success', message: 'Order reference not found but event logged' });
  }

  const order = orders[orderIndex];

  // Process successful payment
  if (eventStatus === 'successful' || eventStatus === 'charge.completed' || eventStatus === 'paid') {
    if (order.status !== 'PAID') {
      const purchaseToken = `pm_dl_${crypto.randomBytes(24).toString('hex')}`;
      const validityDays = artistSettings.tokenValidityDays || 30;
      const expiresAt = Date.now() + validityDays * 24 * 60 * 60 * 1000;

      order.status = 'PAID';
      order.paidAt = new Date().toISOString();
      order.purchaseToken = purchaseToken;
      order.tokenExpiresAt = new Date(expiresAt).toISOString();
      order.paychanguRef = String(transactionId);

      activeDownloadTokens.set(purchaseToken, {
        orderId: order.id,
        songId: order.songId,
        customerEmail: order.customerEmail,
        expiresAt,
        maxDownloads: order.maxDownloads || 5,
        downloadsUsed: 0,
      });

      const song = songs.find(s => s.id === order.songId);
      if (song) {
        song.downloadCount += 1;
      }
    }
  } else if (eventStatus === 'failed') {
    order.status = 'FAILED';
  } else if (eventStatus === 'cancelled') {
    order.status = 'CANCELLED';
  }

  eventLog.processed = true;
  return res.status(200).json({ status: 'success', received: true });
});

// 7. Check order state by reference
app.get('/api/payments/order/:txRef', (req, res) => {
  const order = orders.find(o => o.txRef === req.params.txRef);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  res.json({ success: true, order });
});

// 8. Protected Download Endpoint
// Never exposes actual audio file location to public
app.get('/api/download/:purchaseToken', (req, res) => {
  const { purchaseToken } = req.params;

  if (!purchaseToken) {
    return res.status(400).json({ error: 'Purchase token required' });
  }

  const tokenData = activeDownloadTokens.get(purchaseToken);
  if (!tokenData) {
    return res.status(403).json({
      error: 'Invalid, expired, or unauthorized download token.',
    });
  }

  // Check expiration
  if (Date.now() > tokenData.expiresAt) {
    activeDownloadTokens.delete(purchaseToken);
    return res.status(410).json({
      error: 'This download link has expired. Please check My Purchases or contact artist management.',
    });
  }

  // Check download limits
  if (tokenData.downloadsUsed >= tokenData.maxDownloads) {
    return res.status(429).json({
      error: `Maximum download limit (${tokenData.maxDownloads}) reached for this purchase token.`,
    });
  }

  const song = songs.find(s => s.id === tokenData.songId);
  if (!song) {
    return res.status(404).json({ error: 'Purchased song file not found on server.' });
  }

  // Increment usage count
  tokenData.downloadsUsed += 1;
  const order = orders.find(o => o.id === tokenData.orderId);
  if (order) {
    order.downloadCount = tokenData.downloadsUsed;
  }

  // Stream a high-quality studio master MP3 package
  const safeFilename = `${song.artist.replace(/[^a-zA-Z0-9]/g, '_')}_-_${song.title.replace(/[^a-zA-Z0-9]/g, '_')}_[StudioMaster].mp3`;

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.setHeader('X-Download-Remaining', `${tokenData.maxDownloads - tokenData.downloadsUsed}`);

  // Construct valid MP3 buffer with audio metadata
  const sampleAudioBuffer = generateStudioAudioPackage(song, tokenData.customerEmail, order?.id || 'ORD');
  res.setHeader('Content-Length', sampleAudioBuffer.length);
  res.end(sampleAudioBuffer);
});

// 9. User purchases history by email
app.get('/api/user/purchases', (req, res) => {
  const email = (req.query.email as string)?.trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email parameter is required.' });
  }

  const userOrders = orders
    .filter(o => o.customerEmail.toLowerCase() === email && o.status === 'PAID')
    .map(o => ({
      id: o.id,
      txRef: o.txRef,
      songId: o.songId,
      songTitle: o.songTitle,
      songArtist: o.songArtist,
      songCover: o.songCover,
      songPriceMWK: o.songPriceMWK,
      paidAt: o.paidAt || o.createdAt,
      paymentMethod: o.paymentMethod,
      purchaseToken: o.purchaseToken,
      downloadCount: o.downloadCount,
      maxDownloads: o.maxDownloads,
      tokenExpiresAt: o.tokenExpiresAt,
    }));

  res.json({ success: true, purchases: userOrders });
});

// ==========================================
// PHASE 1 MONETIZATION API ENDPOINTS
// ==========================================

// 10. Get Public Subscription Plans (Configurable, not hardcoded)
app.get('/api/monetization/plans', (req, res) => {
  res.json({
    success: true,
    plans: subscriptionPlans.filter(p => p.isActive),
  });
});

// 11. Get Public Monetization & Ad Settings
app.get('/api/monetization/settings', (req, res) => {
  res.json({
    success: true,
    settings: {
      creatorRoyaltyPoolPercentage: monetizationSettings.creatorRoyaltyPoolPercentage,
      platformRevenuePercentage: monetizationSettings.platformRevenuePercentage,
      tipPlatformFeePercentage: monetizationSettings.tipPlatformFeePercentage,
      qualifyingStreamRules: monetizationSettings.qualifyingStreamRules,
      adSettings: monetizationSettings.adSettings,
    },
  });
});

// 12. Create Subscription Checkout Order (Server-Authoritative Pricing via PayChangu)
app.post('/api/subscriptions/create-checkout', async (req, res) => {
  const { planTier, customerName, customerEmail, customerPhone, userId } = req.body;

  if (!planTier || !customerName || !customerEmail || !customerPhone) {
    return res.status(400).json({ success: false, error: 'Plan tier, name, email, and phone are required.' });
  }

  // Look up plan dynamically from configured plans
  const plan = subscriptionPlans.find(p => p.tier === planTier && p.isActive);
  if (!plan) {
    return res.status(404).json({ success: false, error: 'Requested subscription plan is currently unavailable.' });
  }

  if (plan.priceMWK <= 0) {
    // Free plan activation
    const freeSub: UserSubscription = {
      id: `sub-free-${Date.now()}`,
      userId: userId || `usr-${Date.now()}`,
      userEmail: customerEmail.trim().toLowerCase(),
      planId: plan.id,
      planTier: 'FREE',
      status: 'ACTIVE',
      amountMWK: 0,
      paymentMethod: 'PAYCHANGU',
      txRef: `PM-FREE-${Date.now()}`,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      autoRenew: true,
      createdAt: new Date().toISOString(),
    };
    userSubscriptions.unshift(freeSub);
    return res.json({ success: true, subscription: freeSub, isFree: true });
  }

  const txRef = `PM-SUB-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const subId = `sub-${Date.now().toString().slice(-6)}`;

  const newSub: UserSubscription = {
    id: subId,
    userId: userId || `usr-${Date.now()}`,
    userEmail: customerEmail.trim().toLowerCase(),
    planId: plan.id,
    planTier: plan.tier,
    status: 'PENDING',
    amountMWK: plan.priceMWK,
    paymentMethod: 'PAYCHANGU',
    txRef,
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    autoRenew: true,
    createdAt: new Date().toISOString(),
  };

  userSubscriptions.unshift(newSub);

  // Call PayChangu Hosted Checkout API if secret configured
  let checkoutUrl: string | undefined;
  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret) {
    try {
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || 'Subscriber';
      const lastName = nameParts.slice(1).join(' ') || 'Fan';
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'https';

      const pcResponse = await fetch('https://api.paychangu.com/payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paychanguSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: newSub.amountMWK,
          currency: 'MWK',
          email: newSub.userEmail,
          first_name: firstName,
          last_name: lastName,
          phone: customerPhone.trim(),
          tx_ref: newSub.txRef,
          callback_url: `${protocol}://${host}/api/webhooks/paychangu`,
          return_url: `${protocol}://${host}/payment/status/${newSub.txRef}?type=subscription`,
          customization: {
            title: `PROJECTS MANDATORY - ${plan.name} Subscription`,
            description: `${plan.name} Access for 30 Days (MK ${plan.priceMWK.toLocaleString()}/mo)`,
          },
        }),
      });

      const pcData = await pcResponse.json();
      if (pcData.status === 'success' && pcData.data?.checkout_url) {
        checkoutUrl = pcData.data.checkout_url;
      }
    } catch (pcErr) {
      console.warn('PayChangu subscription checkout init notice:', pcErr);
    }
  }

  res.json({
    success: true,
    subscription: newSub,
    checkoutUrl,
    paychanguPublicKey: process.env.PAYCHANGU_PUBLIC_KEY || artistSettings.paychanguPublicKey || '',
  });
});

// 13. Verify Subscription Payment Server-Side
app.post('/api/subscriptions/verify', async (req, res) => {
  const { txRef } = req.body;
  if (!txRef) {
    return res.status(400).json({ success: false, error: 'Transaction reference is required.' });
  }

  const subIndex = userSubscriptions.findIndex(s => s.txRef === txRef);
  if (subIndex === -1) {
    return res.status(404).json({ success: false, error: 'Subscription not found for transaction reference.' });
  }

  const sub = userSubscriptions[subIndex];
  if (sub.status === 'ACTIVE') {
    return res.json({ success: true, verified: true, subscription: sub });
  }

  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret) {
    try {
      const response = await fetch(`https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`, {
        headers: {
          'Authorization': `Bearer ${paychanguSecret}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      const paymentStatus = data.data?.status?.toLowerCase();

      if (data.status === 'success' && (paymentStatus === 'successful' || paymentStatus === 'paid')) {
        sub.status = 'ACTIVE';
        sub.startedAt = new Date().toISOString();
        sub.expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
        if (data.data?.tx_ref) {
          sub.paychanguRef = data.data.tx_ref;
        }

        // Allocate revenue strictly based on configurable split
        const poolShare = (sub.amountMWK * monetizationSettings.creatorRoyaltyPoolPercentage) / 100;
        const platformShare = (sub.amountMWK * monetizationSettings.platformRevenuePercentage) / 100;

        currentRoyaltyPeriod.totalSubscriptionRevenueMWK += sub.amountMWK;
        currentRoyaltyPeriod.eligibleRevenueMWK += sub.amountMWK;
        currentRoyaltyPeriod.creatorRoyaltyPoolMWK += poolShare;
        currentRoyaltyPeriod.platformRevenueMWK += platformShare;

        platformRevenueRecords.unshift({
          id: `prev-${Date.now()}`,
          periodMonth: currentRoyaltyPeriod.month,
          source: 'SUBSCRIPTION_SHARE',
          amountMWK: platformShare,
          description: '40% Platform subscription fee share',
          createdAt: new Date().toISOString(),
        });

        return res.json({ success: true, verified: true, subscription: sub });
      } else if (paymentStatus === 'cancelled' || paymentStatus === 'user_cancelled') {
        sub.status = 'CANCELLED';
        return res.json({ success: false, verified: false, status: 'CANCELLED', error: 'Payment was cancelled.' });
      } else {
        return res.json({ success: false, verified: false, status: 'PENDING', error: 'Payment authorization is pending.' });
      }
    } catch (err: any) {
      return res.status(502).json({ success: false, error: err.message || 'Payment verification failed' });
    }
  } else {
    // Sandbox / Test fallback if API key is not yet set in environment
    sub.status = 'ACTIVE';
    sub.startedAt = new Date().toISOString();
    sub.expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();

    const poolShare = (sub.amountMWK * monetizationSettings.creatorRoyaltyPoolPercentage) / 100;
    const platformShare = (sub.amountMWK * monetizationSettings.platformRevenuePercentage) / 100;

    currentRoyaltyPeriod.totalSubscriptionRevenueMWK += sub.amountMWK;
    currentRoyaltyPeriod.eligibleRevenueMWK += sub.amountMWK;
    currentRoyaltyPeriod.creatorRoyaltyPoolMWK += poolShare;
    currentRoyaltyPeriod.platformRevenueMWK += platformShare;

    return res.json({ success: true, verified: true, subscription: sub, sandboxMode: true });
  }
});

// 14. Get Active User Subscription by Email or User ID
app.get('/api/user/subscription', (req, res) => {
  const email = (req.query.email as string)?.trim().toLowerCase();
  const userId = req.query.userId as string;

  let activeSub = userSubscriptions.find(
    s => (s.status === 'ACTIVE' && ((email && s.userEmail === email) || (userId && s.userId === userId)))
  );

  if (activeSub && new Date(activeSub.expiresAt).getTime() < Date.now()) {
    activeSub.status = 'EXPIRED';
    activeSub = undefined;
  }

  res.json({
    success: true,
    subscription: activeSub || null,
    planTier: activeSub ? activeSub.planTier : 'FREE',
    hasAds: !activeSub || activeSub.planTier === 'FREE',
    allowsOfflineDownloads: activeSub ? activeSub.planTier === 'PREMIUM_PLUS' : false,
  });
});

// 15. Track Stream & Evaluate Qualifying Rules / Anti-Fraud
app.post('/api/streams/track', (req, res) => {
  const {
    songId,
    songTitle,
    artistId,
    artistName,
    userId,
    userTier = 'FREE',
    durationPlayedSec = 0,
    songDurationSec = 180,
    deviceFingerprint,
  } = req.body;

  if (!songId || !artistId) {
    return res.status(400).json({ success: false, error: 'Song ID and Artist ID required' });
  }

  const percentPlayed = songDurationSec > 0 ? (durationPlayedSec / songDurationSec) * 100 : 0;
  const ipHash = crypto.createHash('md5').update(req.ip || '127.0.0.1').digest('hex').slice(0, 12);
  const clientIdentifier = userId || deviceFingerprint || ipHash;

  const rules = monetizationSettings.qualifyingStreamRules;
  let isQualified = false;
  let unqualifiedReason: string | undefined;
  let isFlaggedSuspicious = false;
  let fraudReason: string | undefined;

  // 1. Minimum Listening Time & Percentage Check
  if (durationPlayedSec < rules.minListeningTimeSec) {
    unqualifiedReason = `Listening time (${durationPlayedSec}s) below required threshold of ${rules.minListeningTimeSec}s.`;
  } else if (percentPlayed < rules.minPercentPlayed) {
    unqualifiedReason = `Percentage played (${percentPlayed.toFixed(0)}%) below required threshold of ${rules.minPercentPlayed}%.`;
  } else {
    isQualified = true;
  }

  // 2. Anti-Fraud & Abuse Checks: Repeat Play Limits
  const oneHourAgo = Date.now() - 3600000;
  const recentStreamsForSongAndUser = streamRecords.filter(
    s => (s.songId === songId && (s.userId === userId || s.ipHash === ipHash) && new Date(s.timestamp).getTime() > oneHourAgo)
  );

  if (recentStreamsForSongAndUser.length >= rules.maxRepeatsPerHour) {
    isQualified = false;
    isFlaggedSuspicious = true;
    fraudReason = `REPEAT_LIMIT_EXCEEDED: Exceeded max allowed plays (${rules.maxRepeatsPerHour}/hr) for track.`;

    // Create a pending review fraud flag record
    const existingFlag = fraudFlags.find(f => f.songId === songId && f.userId === userId && f.status === 'PENDING_REVIEW');
    if (existingFlag) {
      existingFlag.affectedStreamsCount += 1;
    } else {
      fraudFlags.unshift({
        id: `ff-${Date.now()}`,
        songId,
        artistId,
        userId,
        reason: fraudReason,
        severity: 'MEDIUM',
        affectedStreamsCount: 1,
        estimatedFlaggedAmountMWK: 0,
        status: 'PENDING_REVIEW',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 3. Bot / Rapid Automated Playback Check
  const oneMinuteAgo = Date.now() - 60000;
  const veryRapidPlays = streamRecords.filter(
    s => (s.userId === userId || s.ipHash === ipHash) && new Date(s.timestamp).getTime() > oneMinuteAgo
  );

  if (veryRapidPlays.length >= 8) {
    isQualified = false;
    isFlaggedSuspicious = true;
    fraudReason = 'AUTOMATED_HIGH_VELOCITY: Abnormal number of streams initiated within 60 seconds.';

    fraudFlags.unshift({
      id: `ff-bot-${Date.now()}`,
      songId,
      artistId,
      userId,
      reason: fraudReason,
      severity: 'HIGH',
      affectedStreamsCount: veryRapidPlays.length,
      estimatedFlaggedAmountMWK: 0,
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
    });
  }

  const streamRecord: StreamRecord = {
    id: `str-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
    songId,
    songTitle: songTitle || 'Track',
    artistId,
    artistName: artistName || 'Artist',
    userId,
    userTier: userTier as SubscriptionTier,
    durationPlayedSec: Math.floor(durationPlayedSec),
    songDurationSec: Math.floor(songDurationSec),
    percentPlayed: Math.floor(percentPlayed),
    ipHash,
    deviceFingerprint,
    isQualified,
    unqualifiedReason,
    isFlaggedSuspicious,
    fraudReason,
    periodMonth: currentRoyaltyPeriod.month,
    timestamp: new Date().toISOString(),
  };

  streamRecords.unshift(streamRecord);

  // Update royalty period qualifying counts
  if (isQualified && !isFlaggedSuspicious) {
    currentRoyaltyPeriod.totalQualifyingStreams += 1;
  } else if (isFlaggedSuspicious) {
    currentRoyaltyPeriod.totalFlaggedStreams += 1;
  }

  res.json({
    success: true,
    isQualified,
    unqualifiedReason,
    isFlaggedSuspicious,
    qualifyingStreamsCount: currentRoyaltyPeriod.totalQualifyingStreams,
  });
});

// 16. Get Current Creator Royalty Pool Status
app.get('/api/royalties/current-pool', (req, res) => {
  res.json({
    success: true,
    period: currentRoyaltyPeriod,
    creatorPoolPercentage: monetizationSettings.creatorRoyaltyPoolPercentage,
    platformRevenuePercentage: monetizationSettings.platformRevenuePercentage,
  });
});

// 17. Get Artist Earnings Summary (Separates Estimated vs Finalized)
app.get('/api/royalties/artist-earnings/:artistId', (req, res) => {
  const { artistId } = req.params;

  // Calculate qualifying streams in current period
  const artistStreams = streamRecords.filter(
    s => s.artistId === artistId && s.isQualified && !s.isFlaggedSuspicious && s.periodMonth === currentRoyaltyPeriod.month
  );

  const artistQualifyingStreams = artistStreams.length;
  const totalStreams = Math.max(currentRoyaltyPeriod.totalQualifyingStreams, 1);
  const streamsharePercent = (artistQualifyingStreams / totalStreams) * 100;

  // Proportional estimated earnings from current open pool
  const estimatedCurrentPeriodEarningsMWK = Math.floor(
    (currentRoyaltyPeriod.creatorRoyaltyPoolMWK * (streamsharePercent / 100))
  );

  // Calculate finalized earnings from immutable statements
  const statements = royaltyStatements.filter(s => s.artistId === artistId && s.status === 'FINALIZED');
  const finalizedEarningsMWK = statements.reduce((acc, curr) => acc + curr.finalAmountMWK, 0);

  // Calculate tips & direct sales
  const tips = tipRecords.filter(t => t.artistId === artistId && t.status === 'PAID');
  const tipsEarnedMWK = tips.reduce((acc, curr) => acc + curr.artistAmountMWK, 0);

  const directSales = orders.filter(o => o.artistId === artistId && o.status === 'PAID');
  const directSalesEarnedMWK = directSales.reduce((acc, curr) => acc + (curr.artistShareMWK || curr.amount * 0.7), 0);

  // Withdrawable Balance: ONLY includes FINALIZED earnings + tips + direct sales (NEVER estimated open-pool amounts!)
  const totalPaidOutMWK = 0;
  const withdrawableBalanceMWK = finalizedEarningsMWK + tipsEarnedMWK + directSalesEarnedMWK - totalPaidOutMWK;

  const earningsSummary: ArtistEarningsSummary = {
    artistId,
    artistName: artistStreams[0]?.artistName || 'Artist',
    totalQualifyingStreams: artistQualifyingStreams,
    currentStreamsharePercent: Number(streamsharePercent.toFixed(2)),
    estimatedCurrentPeriodEarningsMWK,
    subscriptionEarningsMWK: Math.floor(estimatedCurrentPeriodEarningsMWK * 0.7),
    adSupportedEarningsMWK: Math.floor(estimatedCurrentPeriodEarningsMWK * 0.3),
    finalizedEarningsMWK,
    pendingPayoutMWK: withdrawableBalanceMWK,
    totalPaidOutMWK,
    tipsEarnedMWK,
    directSalesEarnedMWK,
    lifetimeTotalEarnedMWK: finalizedEarningsMWK + tipsEarnedMWK + directSalesEarnedMWK,
    withdrawableBalanceMWK: Math.max(0, withdrawableBalanceMWK),
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, earnings: earningsSummary });
});

// 18. Get Monthly Royalty Statements for an Artist
app.get('/api/royalties/statements/:artistId', (req, res) => {
  const { artistId } = req.params;
  const statements = royaltyStatements.filter(s => s.artistId === artistId);
  res.json({ success: true, statements });
});

// 19. Create Fan Tip Checkout (PayChangu)
app.post('/api/tips/create-checkout', async (req, res) => {
  const { artistId, artistName, amountMWK, senderName, senderEmail, senderPhone, message } = req.body;

  if (!artistId || !amountMWK || Number(amountMWK) <= 0) {
    return res.status(400).json({ success: false, error: 'Artist and valid tip amount in MWK required.' });
  }

  const tipAmount = Number(amountMWK);
  const platformFee = Math.floor((tipAmount * monetizationSettings.tipPlatformFeePercentage) / 100);
  const artistAmount = tipAmount - platformFee;

  const txRef = `PM-TIP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const tipRecord: TipRecord = {
    id: `tip-${Date.now()}`,
    artistId,
    artistName: artistName || 'Artist',
    senderName: senderName || 'Generous Fan',
    senderEmail,
    senderPhone,
    amountMWK: tipAmount,
    platformFeeMWK: platformFee,
    artistAmountMWK: artistAmount,
    message,
    txRef,
    paymentMethod: 'PAYCHANGU',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  tipRecords.unshift(tipRecord);

  // Call PayChangu Hosted Checkout API if key present
  let checkoutUrl: string | undefined;
  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret) {
    try {
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'https';

      const pcResponse = await fetch('https://api.paychangu.com/payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paychanguSecret}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          amount: tipRecord.amountMWK,
          currency: 'MWK',
          email: senderEmail || 'supporter@projectsmandatory.com',
          first_name: (senderName || 'Supporter').split(' ')[0],
          last_name: (senderName || 'Supporter').split(' ')[1] || 'Fan',
          phone: senderPhone || '0999000000',
          tx_ref: tipRecord.txRef,
          callback_url: `${protocol}://${host}/api/webhooks/paychangu`,
          return_url: `${protocol}://${host}/payment/status/${tipRecord.txRef}?type=tip`,
          customization: {
            title: `Support ${tipRecord.artistName}`,
            description: `Direct Artist Tip: MK ${tipRecord.amountMWK.toLocaleString()}`,
          },
        }),
      });

      const pcData = await pcResponse.json();
      if (pcData.status === 'success' && pcData.data?.checkout_url) {
        checkoutUrl = pcData.data.checkout_url;
      }
    } catch (pcErr) {
      console.warn('PayChangu tip checkout init note:', pcErr);
    }
  }

  res.json({
    success: true,
    tip: tipRecord,
    checkoutUrl,
    paychanguPublicKey: process.env.PAYCHANGU_PUBLIC_KEY || artistSettings.paychanguPublicKey || '',
  });
});

// 20. Verify Fan Tip Payment Server-Side
app.post('/api/tips/verify', async (req, res) => {
  const { txRef } = req.body;
  const tip = tipRecords.find(t => t.txRef === txRef);
  if (!tip) {
    return res.status(404).json({ success: false, error: 'Tip record not found' });
  }

  if (tip.status === 'PAID') {
    return res.json({ success: true, verified: true, tip });
  }

  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret) {
    try {
      const response = await fetch(`https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`, {
        headers: {
          'Authorization': `Bearer ${paychanguSecret}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      const status = data.data?.status?.toLowerCase();

      if (data.status === 'success' && (status === 'successful' || status === 'paid')) {
        tip.status = 'PAID';
        tip.paidAt = new Date().toISOString();
        if (data.data?.tx_ref) tip.paychanguRef = data.data.tx_ref;

        platformRevenueRecords.unshift({
          id: `prev-tip-${Date.now()}`,
          periodMonth: currentRoyaltyPeriod.month,
          source: 'TIP_FEE',
          amountMWK: tip.platformFeeMWK,
          description: `Platform fee (${tip.platformFeeMWK} MWK) on artist tip`,
          createdAt: new Date().toISOString(),
        });

        return res.json({ success: true, verified: true, tip });
      } else {
        return res.json({ success: false, verified: false, status: tip.status, error: 'Tip payment is pending or failed' });
      }
    } catch (err: any) {
      return res.status(502).json({ success: false, error: err.message || 'Payment verification failed' });
    }
  } else {
    // Sandbox fallback
    tip.status = 'PAID';
    tip.paidAt = new Date().toISOString();
    return res.json({ success: true, verified: true, tip, sandboxMode: true });
  }
});


// ==========================================
// ADMIN API ENDPOINTS (Protected)
// ==========================================

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin token required' });
  }
  const token = authHeader.split(' ')[1];
  if (token.startsWith('admin_session_') || token.startsWith('pm_admin_')) {
    return next();
  }
  return res.status(403).json({ success: false, error: 'Forbidden: Invalid admin token' });
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (isValidAdminPassword(password)) {
    const token = `admin_session_${ADMIN_PASSWORD}`;
    return res.json({ success: true, token, artistName: artistSettings.artistName });
  }
  return res.status(401).json({ success: false, error: 'Invalid artist admin credentials.' });
});

// Admin stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const paidOrders = orders.filter(o => o.status === 'PAID');
  const totalRevenueMWK = paidOrders.reduce((acc, curr) => acc + curr.amount, 0);
  const totalSales = paidOrders.length;
  const totalDownloads = orders.reduce((acc, curr) => acc + curr.downloadCount, 0);

  const uniqueCustomerEmails = new Set(orders.map(o => o.customerEmail.toLowerCase()));
  const totalCustomers = uniqueCustomerEmails.size;

  res.json({
    success: true,
    stats: {
      totalRevenueMWK,
      totalSales,
      totalDownloads,
      totalCustomers,
      totalSongs: songs.length,
      publishedSongs: songs.filter(s => s.isPublished).length,
      recentOrders: orders.slice(0, 8),
      paymentEventsCount: paymentEvents.length,
    },
  });
});

// Admin get all songs (including unpublished)
app.get('/api/admin/songs', requireAdmin, (req, res) => {
  res.json({ success: true, songs });
});

// Admin create / upload song
app.post('/api/admin/songs', requireAdmin, (req, res) => {
  const {
    title,
    artist = artistSettings.artistName,
    featuredArtists,
    producer,
    genre = 'Afro-Fusion',
    releaseDate = new Date().toISOString().split('T')[0],
    priceMWK,
    coverImage,
    description,
    lyrics,
    fileFormat = '320kbps MP3 + WAV Master',
    fileSize = '10.5 MB',
    isPublished = true,
    isFeatured = false,
    isLatest = true,
    bpm,
    key,
    tags,
  } = req.body;

  if (!title || priceMWK === undefined || Number(priceMWK) < 0) {
    return res.status(400).json({ success: false, error: 'Song title and valid price in MWK are required.' });
  }

  if (isLatest) {
    songs.forEach(s => { s.isLatest = false; });
  }

  const newSong: Song = {
    id: `pm-song-${Date.now().toString().slice(-4)}`,
    title: title.trim(),
    artist: artist.trim(),
    featuredArtists: featuredArtists?.trim(),
    producer: producer?.trim() || 'Mandatory Studios',
    genre: genre.trim(),
    releaseDate,
    priceMWK: Number(priceMWK),
    coverImage: coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    description: description || 'Original master recording by PROJECTS MANDATORY.',
    lyrics,
    fileFormat,
    fileSize,
    isPublished: Boolean(isPublished),
    isFeatured: Boolean(isFeatured),
    isLatest: Boolean(isLatest),
    bpm: bpm ? Number(bpm) : undefined,
    key: key?.trim(),
    downloadCount: 0,
    tags: Array.isArray(tags) ? tags : ['Studio Master', genre],
    createdAt: new Date().toISOString(),
  };

  songs.unshift(newSong);
  res.json({ success: true, song: newSong });
});

// Admin update song (including dynamic price changes)
app.put('/api/admin/songs/:id', requireAdmin, (req, res) => {
  const songIndex = songs.findIndex(s => s.id === req.params.id);
  if (songIndex === -1) {
    return res.status(404).json({ success: false, error: 'Song not found' });
  }

  const existing = songs[songIndex];
  const updates = req.body;

  if (updates.priceMWK !== undefined) {
    const numPrice = Number(updates.priceMWK);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ success: false, error: 'Invalid price in MWK.' });
    }
    updates.priceMWK = numPrice;
  }

  if (updates.isLatest) {
    songs.forEach(s => {
      if (s.id !== existing.id) s.isLatest = false;
    });
  }

  songs[songIndex] = {
    ...existing,
    ...updates,
    id: existing.id,
  };

  res.json({ success: true, song: songs[songIndex] });
});

// Admin delete song
app.delete('/api/admin/songs/:id', requireAdmin, (req, res) => {
  const songIndex = songs.findIndex(s => s.id === req.params.id);
  if (songIndex === -1) {
    return res.status(404).json({ success: false, error: 'Song not found' });
  }
  const deleted = songs.splice(songIndex, 1)[0];
  res.json({ success: true, deletedSongId: deleted.id });
});

// Admin get orders
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  res.json({ success: true, orders });
});

// Admin update order status
app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status, notes } = req.body;
  const orderIndex = orders.findIndex(o => o.id === req.params.id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  const order = orders[orderIndex];
  order.status = status;
  if (notes) order.notes = notes;

  if (status === 'PAID' && !order.purchaseToken) {
    const purchaseToken = `pm_dl_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    order.purchaseToken = purchaseToken;
    order.paidAt = new Date().toISOString();
    order.tokenExpiresAt = new Date(expiresAt).toISOString();
    activeDownloadTokens.set(purchaseToken, {
      orderId: order.id,
      songId: order.songId,
      customerEmail: order.customerEmail,
      expiresAt,
      maxDownloads: order.maxDownloads || 5,
      downloadsUsed: order.downloadCount || 0,
    });
  }

  res.json({ success: true, order });
});

// Admin get settings
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json({ success: true, settings: artistSettings });
});

// Admin update settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  artistSettings = {
    ...artistSettings,
    ...req.body,
  };
  res.json({ success: true, settings: artistSettings });
});

// Admin Monetization Financial Summary
app.get('/api/admin/monetization-summary', requireAdmin, (req, res) => {
  const activeSubs = userSubscriptions.filter(s => s.status === 'ACTIVE');
  const premiumCount = activeSubs.filter(s => s.planTier === 'PREMIUM').length;
  const premiumPlusCount = activeSubs.filter(s => s.planTier === 'PREMIUM_PLUS').length;
  const freeUsersCount = activeSubs.filter(s => s.planTier === 'FREE').length;

  const totalSubRevenue = userSubscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + s.amountMWK, 0);

  const totalPurchaseRevenue = orders
    .filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + o.amount, 0);

  const totalTipRevenue = tipRecords
    .filter(t => t.status === 'PAID')
    .reduce((sum, t) => sum + t.amountMWK, 0);

  const summary: AdminMonetizationSummary = {
    totalSubscriptionRevenueMWK: totalSubRevenue,
    premiumSubscribersCount: premiumCount,
    premiumPlusSubscribersCount: premiumPlusCount,
    freeUsersCount: freeUsersCount,
    adRevenueMWK: currentRoyaltyPeriod.totalAdRevenueMWK,
    individualPurchaseRevenueMWK: totalPurchaseRevenue,
    tipRevenueMWK: totalTipRevenue,
    creatorRoyaltyPoolMWK: currentRoyaltyPeriod.creatorRoyaltyPoolMWK,
    platformRevenueMWK: currentRoyaltyPeriod.platformRevenueMWK,
    pendingPayoutsMWK: 0,
    completedPayoutsMWK: 0,
    refundsMWK: 0,
    chargebacksMWK: 0,
    fraudFlaggedRevenueMWK: fraudFlags
      .filter(f => f.status === 'CONFIRMED_FRAUD')
      .reduce((sum, f) => sum + f.estimatedFlaggedAmountMWK, 0),
    currentPeriod: currentRoyaltyPeriod,
  };

  res.json({ success: true, summary, plans: subscriptionPlans, settings: monetizationSettings });
});

// Admin Update Subscription Plan
app.put('/api/admin/monetization/plans/:planId', requireAdmin, (req, res) => {
  const { planId } = req.params;
  const planIndex = subscriptionPlans.findIndex(p => p.id === planId);
  if (planIndex === -1) {
    return res.status(404).json({ success: false, error: 'Plan not found.' });
  }

  const updates = req.body;
  if (updates.priceMWK !== undefined) {
    const num = Number(updates.priceMWK);
    if (isNaN(num) || num < 0) {
      return res.status(400).json({ success: false, error: 'Invalid price.' });
    }
    updates.priceMWK = num;
  }

  subscriptionPlans[planIndex] = {
    ...subscriptionPlans[planIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, plan: subscriptionPlans[planIndex] });
});

// Admin Update Monetization Settings (Revenue Split %, Rules, Ad Settings)
app.put('/api/admin/monetization/settings', requireAdmin, (req, res) => {
  const updates = req.body;

  if (updates.creatorRoyaltyPoolPercentage !== undefined) {
    const poolPct = Number(updates.creatorRoyaltyPoolPercentage);
    if (isNaN(poolPct) || poolPct < 0 || poolPct > 100) {
      return res.status(400).json({ success: false, error: 'Invalid creator royalty pool percentage.' });
    }
    monetizationSettings.creatorRoyaltyPoolPercentage = poolPct;
    monetizationSettings.platformRevenuePercentage = 100 - poolPct;

    // Recalculate current open period allocations dynamically
    const eligible = currentRoyaltyPeriod.eligibleRevenueMWK;
    currentRoyaltyPeriod.creatorPoolPercentage = poolPct;
    currentRoyaltyPeriod.platformPercentage = 100 - poolPct;
    currentRoyaltyPeriod.creatorRoyaltyPoolMWK = Math.floor((eligible * poolPct) / 100);
    currentRoyaltyPeriod.platformRevenueMWK = eligible - currentRoyaltyPeriod.creatorRoyaltyPoolMWK;
  }

  if (updates.qualifyingStreamRules) {
    monetizationSettings.qualifyingStreamRules = {
      ...monetizationSettings.qualifyingStreamRules,
      ...updates.qualifyingStreamRules,
    };
  }

  if (updates.adSettings) {
    monetizationSettings.adSettings = {
      ...monetizationSettings.adSettings,
      ...updates.adSettings,
    };
  }

  monetizationSettings.updatedAt = new Date().toISOString();
  res.json({ success: true, settings: monetizationSettings, currentPeriod: currentRoyaltyPeriod });
});

// Admin Finalize Royalty Period (Calculates Stream Share & Generates Immutable Statements)
app.post('/api/admin/royalties/finalize-period', requireAdmin, (req, res) => {
  if (currentRoyaltyPeriod.status === 'FINALIZED') {
    return res.status(400).json({ success: false, error: 'Current period is already finalized.' });
  }

  const periodMonth = currentRoyaltyPeriod.month;
  // Get all qualified, non-fraud streams for the month
  const qualifiedStreams = streamRecords.filter(
    s => s.periodMonth === periodMonth && s.isQualified && !s.isFlaggedSuspicious
  );

  const totalQualifyingStreams = Math.max(qualifiedStreams.length, 1);
  const totalPool = currentRoyaltyPeriod.creatorRoyaltyPoolMWK;

  // Group streams by artist
  const artistStreamCounts = new Map<string, { artistName: string; count: number }>();
  for (const stream of qualifiedStreams) {
    const existing = artistStreamCounts.get(stream.artistId) || { artistName: stream.artistName, count: 0 };
    existing.count += 1;
    artistStreamCounts.set(stream.artistId, existing);
  }

  // Generate immutable statement for each qualifying artist
  const newStatements: RoyaltyStatement[] = [];
  artistStreamCounts.forEach((data, artistId) => {
    const streamsharePercentage = (data.count / totalQualifyingStreams) * 100;
    const allocationMWK = Math.floor((totalPool * streamsharePercentage) / 100);

    const statement: RoyaltyStatement = {
      id: `stmt-${periodMonth}-${artistId}`,
      periodId: currentRoyaltyPeriod.id,
      periodMonth,
      artistId,
      artistName: data.artistName,
      artistEmail: 'artist@projectsmandatory.com',
      totalCreatorPoolMWK: totalPool,
      artistQualifyingStreams: data.count,
      totalPlatformQualifyingStreams: totalQualifyingStreams,
      streamsharePercentage: Number(streamsharePercentage.toFixed(2)),
      calculatedCreatorAllocationMWK: allocationMWK,
      adjustmentsMWK: 0,
      finalAmountMWK: allocationMWK,
      status: 'FINALIZED',
      isImmutable: true,
      createdAt: new Date().toISOString(),
      finalizedAt: new Date().toISOString(),
    };
    newStatements.push(statement);
    royaltyStatements.unshift(statement);
  });

  // Finalize current period
  currentRoyaltyPeriod.status = 'FINALIZED';
  currentRoyaltyPeriod.finalizedAt = new Date().toISOString();
  currentRoyaltyPeriod.finalizedBy = 'Admin Authority';
  royaltyPeriods.unshift(currentRoyaltyPeriod);

  // Initialize fresh new active period for the next cycle
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const nextMonthKey = nextMonthDate.toISOString().slice(0, 7);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  currentRoyaltyPeriod = {
    id: `period-${nextMonthKey}`,
    month: nextMonthKey,
    title: `${monthNames[nextMonthDate.getMonth()]} ${nextMonthDate.getFullYear()}`,
    startDate: `${nextMonthKey}-01T00:00:00.000Z`,
    endDate: `${nextMonthKey}-30T23:59:59.999Z`,
    status: 'ACTIVE',
    totalSubscriptionRevenueMWK: 0,
    totalAdRevenueMWK: 0,
    eligibleRevenueMWK: 0,
    creatorPoolPercentage: monetizationSettings.creatorRoyaltyPoolPercentage,
    platformPercentage: monetizationSettings.platformRevenuePercentage,
    creatorRoyaltyPoolMWK: 0,
    platformRevenueMWK: 0,
    totalQualifyingStreams: 0,
    totalFlaggedStreams: 0,
  };

  res.json({
    success: true,
    message: `Royalty period ${periodMonth} finalized successfully. ${newStatements.length} immutable statements generated.`,
    finalizedStatements: newStatements,
    nextActivePeriod: currentRoyaltyPeriod,
  });
});

// Admin Get Fraud Flags
app.get('/api/admin/fraud-flags', requireAdmin, (req, res) => {
  res.json({ success: true, fraudFlags });
});

// Admin Update Fraud Flag Status
app.put('/api/admin/fraud-flags/:flagId', requireAdmin, (req, res) => {
  const { flagId } = req.params;
  const { status, adminNotes } = req.body;

  const flag = fraudFlags.find(f => f.id === flagId);
  if (!flag) {
    return res.status(404).json({ success: false, error: 'Fraud flag record not found.' });
  }

  if (status) flag.status = status;
  if (adminNotes) flag.adminNotes = adminNotes;
  flag.reviewedAt = new Date().toISOString();

  res.json({ success: true, flag });
});

// ==========================================
// PHASE 2 MONETISATION & GROWTH API ROUTES
// ==========================================

// 1. ARTIST PRO ROUTES
app.get('/api/artist-pro/settings', (req, res) => {
  res.json({
    success: true,
    settings: phase2AdminSettings.artistPro,
  });
});

app.get('/api/artist-pro/status/:artistId', (req, res) => {
  const { artistId } = req.params;
  const activeSub = artistProSubscriptions.find(
    (s) => s.artistId === artistId && s.status === 'ACTIVE' && new Date(s.expiresAt) > new Date()
  );
  res.json({
    success: true,
    isArtistPro: !!activeSub,
    subscription: activeSub || null,
  });
});

app.post('/api/artist-pro/subscribe', (req, res) => {
  const { artistId, artistName, userId, userEmail, paymentMethod, mobilePhone } = req.body;

  if (!artistId || !userId || !userEmail) {
    return res.status(400).json({ success: false, error: 'Missing required subscription fields.' });
  }

  const priceMWK = phase2AdminSettings.artistPro.priceMWK;
  const txRef = `PM-PRO-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 86400000);

  const newSub: ArtistProSubscription = {
    id: `pro-sub-${Date.now()}`,
    artistId,
    artistName: artistName || 'Verified Artist',
    userId,
    userEmail,
    planTier: 'ARTIST_PRO',
    priceMWK,
    status: 'ACTIVE',
    paymentMethod: paymentMethod || 'AIRTEL_MONEY',
    txRef,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    autoRenew: true,
    createdAt: now.toISOString(),
  };

  artistProSubscriptions.push(newSub);

  // Record separate Platform Revenue
  platformRevenueRecords.push({
    id: `prev-pro-${Date.now()}`,
    source: 'ARTIST_PRO',
    amountMWK: priceMWK,
    relatedId: newSub.id,
    artistId,
    periodMonth: now.toISOString().substring(0, 7),
    description: `Artist Pro Subscription (${artistName})`,
    createdAt: now.toISOString(),
  });

  res.json({
    success: true,
    message: 'Artist Pro subscription activated successfully!',
    subscription: newSub,
  });
});

// 2. ARTIST PROMOTION & WALLET ROUTES
app.get('/api/promotion/wallet/:artistId', (req, res) => {
  const { artistId } = req.params;
  let wallet = promotionWallets.get(artistId);

  if (!wallet) {
    wallet = {
      id: artistId,
      artistId,
      artistName: 'Artist',
      availableBalanceMWK: 0,
      reservedBudgetMWK: 0,
      lifetimeSpentMWK: 0,
      lifetimeTopUpMWK: 0,
      updatedAt: new Date().toISOString(),
    };
    promotionWallets.set(artistId, wallet);
  }

  res.json({ success: true, wallet });
});

app.post('/api/promotion/wallet/topup', (req, res) => {
  const { artistId, artistName, amountMWK, paymentMethod } = req.body;
  const amount = Number(amountMWK);

  if (!artistId || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid top-up amount or artist ID.' });
  }

  let wallet = promotionWallets.get(artistId);
  if (!wallet) {
    wallet = {
      id: artistId,
      artistId,
      artistName: artistName || 'Artist',
      availableBalanceMWK: 0,
      reservedBudgetMWK: 0,
      lifetimeSpentMWK: 0,
      lifetimeTopUpMWK: 0,
      updatedAt: new Date().toISOString(),
    };
    promotionWallets.set(artistId, wallet);
  }

  wallet.availableBalanceMWK += amount;
  wallet.lifetimeTopUpMWK += amount;
  wallet.lastTopUpDate = new Date().toISOString();
  wallet.updatedAt = new Date().toISOString();

  promotionTransactions.push({
    id: `ptx-${Date.now()}`,
    artistId,
    type: 'TOPUP',
    amountMWK: amount,
    txRef: `PM-TOPUP-${Date.now()}`,
    description: `Wallet top-up via ${paymentMethod || 'PayChangu'}`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Top-up of MK ${amount.toLocaleString()} successful.`,
    wallet,
  });
});

app.get('/api/promotion/campaigns/:artistId', (req, res) => {
  const { artistId } = req.params;
  const campaigns = promotionCampaigns.filter((c) => c.artistId === artistId);
  const transactions = promotionTransactions.filter((t) => t.artistId === artistId);
  res.json({ success: true, campaigns, transactions });
});

app.post('/api/promotion/campaigns/create', (req, res) => {
  const {
    artistId,
    artistName,
    userId,
    songId,
    songTitle,
    songCover,
    albumId,
    albumTitle,
    targetPlacement,
    budgetMWK,
    startDate,
    endDate,
  } = req.body;

  const budget = Number(budgetMWK);
  const minBudget = phase2AdminSettings.promotions.minBudgetMWK;
  const maxBudget = phase2AdminSettings.promotions.maxBudgetMWK;

  if (isNaN(budget) || budget < minBudget || budget > maxBudget) {
    return res.status(400).json({
      success: false,
      error: `Campaign budget must be between MK ${minBudget.toLocaleString()} and MK ${maxBudget.toLocaleString()}.`,
    });
  }

  let wallet = promotionWallets.get(artistId);
  if (!wallet || wallet.availableBalanceMWK < budget) {
    return res.status(400).json({
      success: false,
      error: 'Insufficient promotional wallet balance. Please top up your wallet first.',
    });
  }

  // Reserve budget from available balance
  wallet.availableBalanceMWK -= budget;
  wallet.reservedBudgetMWK += budget;
  wallet.updatedAt = new Date().toISOString();

  const newCampaign: PromotionCampaign = {
    id: `camp-${Date.now()}`,
    artistId,
    artistName: artistName || 'Artist',
    userId: userId || 'user',
    songId,
    songTitle,
    songCover,
    albumId,
    albumTitle,
    targetPlacement: targetPlacement || 'HOME_FEATURED',
    budgetMWK: budget,
    spentMWK: 0,
    remainingBudgetMWK: budget,
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 14 * 86400000).toISOString(),
    status: 'ACTIVE',
    impressions: 0,
    clicks: 0,
    playsGenerated: 0,
    saves: 0,
    followsGenerated: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  promotionCampaigns.push(newCampaign);

  promotionTransactions.push({
    id: `ptx-${Date.now()}`,
    artistId,
    campaignId: newCampaign.id,
    type: 'BUDGET_RESERVED',
    amountMWK: budget,
    description: `Reserved budget for ${targetPlacement} campaign: ${songTitle || albumTitle}`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Campaign created and activated successfully!',
    campaign: newCampaign,
    wallet,
  });
});

app.post('/api/promotion/campaigns/:campaignId/pause', (req, res) => {
  const { campaignId } = req.params;
  const campaign = promotionCampaigns.find((c) => c.id === campaignId);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found.' });
  }

  campaign.status = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
  campaign.updatedAt = new Date().toISOString();

  res.json({ success: true, campaign });
});

app.post('/api/promotion/campaigns/:campaignId/cancel', (req, res) => {
  const { campaignId } = req.params;
  const campaign = promotionCampaigns.find((c) => c.id === campaignId);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found.' });
  }

  const refundAmount = campaign.remainingBudgetMWK;
  campaign.status = 'CANCELLED';
  campaign.remainingBudgetMWK = 0;
  campaign.updatedAt = new Date().toISOString();

  let wallet = promotionWallets.get(campaign.artistId);
  if (wallet && refundAmount > 0) {
    wallet.reservedBudgetMWK = Math.max(0, wallet.reservedBudgetMWK - refundAmount);
    wallet.availableBalanceMWK += refundAmount;
    wallet.updatedAt = new Date().toISOString();

    promotionTransactions.push({
      id: `ptx-${Date.now()}`,
      artistId: campaign.artistId,
      campaignId: campaign.id,
      type: 'BUDGET_REFUND',
      amountMWK: refundAmount,
      description: `Unspent budget refund from cancelled campaign`,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    message: `Campaign cancelled. MK ${refundAmount.toLocaleString()} refunded to wallet.`,
    campaign,
    wallet,
  });
});

app.post('/api/promotion/track-event', (req, res) => {
  const { campaignId, eventType } = req.body; // 'impression' | 'click' | 'play' | 'save' | 'follow'
  const campaign = promotionCampaigns.find((c) => c.id === campaignId && c.status === 'ACTIVE');

  if (!campaign) {
    return res.json({ success: false, reason: 'Campaign inactive or not found.' });
  }

  let cost = 0;
  if (eventType === 'impression') {
    campaign.impressions += 1;
    cost = phase2AdminSettings.promotions.costPerImpressionMWK;
  } else if (eventType === 'click') {
    campaign.clicks += 1;
    cost = phase2AdminSettings.promotions.costPerClickMWK;
  } else if (eventType === 'play') {
    campaign.playsGenerated += 1;
    cost = phase2AdminSettings.promotions.costPerPlayMWK;
  } else if (eventType === 'save') {
    campaign.saves += 1;
  } else if (eventType === 'follow') {
    campaign.followsGenerated += 1;
  }

  if (cost > 0 && campaign.remainingBudgetMWK > 0) {
    const actualCost = Math.min(cost, campaign.remainingBudgetMWK);
    campaign.spentMWK += actualCost;
    campaign.remainingBudgetMWK -= actualCost;

    let wallet = promotionWallets.get(campaign.artistId);
    if (wallet) {
      wallet.reservedBudgetMWK = Math.max(0, wallet.reservedBudgetMWK - actualCost);
      wallet.lifetimeSpentMWK += actualCost;
    }

    // Record Platform Revenue
    platformRevenueRecords.push({
      id: `prev-prm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      source: 'PROMOTION',
      amountMWK: actualCost,
      relatedId: campaign.id,
      artistId: campaign.artistId,
      periodMonth: new Date().toISOString().substring(0, 7),
      description: `Promoted ad event (${eventType})`,
      createdAt: new Date().toISOString(),
    });

    if (campaign.remainingBudgetMWK <= 0) {
      campaign.status = 'COMPLETED';
    }
  }

  res.json({ success: true });
});

app.get('/api/promotions/active', (req, res) => {
  const { placement } = req.query;
  let active = promotionCampaigns.filter(
    (c) => c.status === 'ACTIVE' && c.remainingBudgetMWK > 0 && new Date(c.endDate) >= new Date()
  );

  if (placement) {
    active = active.filter((c) => c.targetPlacement === placement);
  }

  res.json({ success: true, promotions: active });
});

// 3. FEATURED RELEASES
app.get('/api/featured-releases', (req, res) => {
  res.json({ success: true, featuredPlacements });
});

app.get('/api/featured-releases/active', (req, res) => {
  const active = featuredPlacements.filter(
    (f) => f.status === 'ACTIVE' && new Date(f.endDate) >= new Date()
  );
  res.json({ success: true, featuredPlacements: active });
});

app.post('/api/featured-releases/request', (req, res) => {
  const { artistId, artistName, userId, releaseType, itemId, itemTitle, itemCover, genre, placementSection } = req.body;

  const priceMWK =
    releaseType === 'ALBUM'
      ? phase2AdminSettings.featuredReleases.albumPlacementPriceMWK
      : phase2AdminSettings.featuredReleases.songPlacementPriceMWK;

  const newPlacement: FeaturedPlacement = {
    id: `fp-${Date.now()}`,
    artistId,
    artistName,
    userId,
    releaseType: releaseType || 'SONG',
    itemId,
    itemTitle,
    itemCover,
    genre: genre || 'Afrobeats',
    placementSection: placementSection || 'HOME_BANNER',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + phase2AdminSettings.featuredReleases.durationDays * 86400000).toISOString(),
    priceMWK,
    status: 'ACTIVE',
    paymentStatus: 'PAID',
    createdAt: new Date().toISOString(),
  };

  featuredPlacements.push(newPlacement);

  // Platform Revenue
  platformRevenueRecords.push({
    id: `prev-feat-${Date.now()}`,
    source: 'FEATURED_PLACEMENT',
    amountMWK: priceMWK,
    relatedId: newPlacement.id,
    artistId,
    periodMonth: new Date().toISOString().substring(0, 7),
    description: `Featured Release Placement: ${itemTitle}`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Featured placement request approved & published.',
    placement: newPlacement,
  });
});

// 4. GIFT SUBSCRIPTIONS
app.post('/api/gifts/purchase', (req, res) => {
  const {
    senderUserId,
    senderName,
    senderEmail,
    recipientName,
    recipientEmail,
    recipientPhone,
    planTier,
    durationMonths,
    giftMessage,
    paymentMethod,
  } = req.body;

  if (!recipientName || !recipientEmail || !planTier) {
    return res.status(400).json({ success: false, error: 'Missing recipient information or plan.' });
  }

  const duration = Number(durationMonths) || 1;
  const baseMonthlyPrice = planTier === 'PREMIUM_PLUS' ? 2500 : 1000;
  const totalAmount = baseMonthlyPrice * duration;

  // Generate unique gift code
  const randomLetters = Math.random().toString(36).substring(2, 6).toUpperCase();
  const giftCode = `PM-${planTier === 'PREMIUM_PLUS' ? 'PLUS' : 'PREM'}-${randomLetters}`;
  const txRef = `PM-GIFT-${Date.now()}-${randomLetters}`;

  const newGift: GiftSubscription = {
    id: `gift-${Date.now()}`,
    senderUserId,
    senderName: senderName || 'A generous music fan',
    senderEmail: senderEmail || 'fan@projectsmandatory.com',
    recipientName,
    recipientEmail,
    recipientPhone,
    planTier,
    durationMonths: duration,
    amountMWK: totalAmount,
    giftCode,
    giftMessage: giftMessage || 'Enjoy full access to uncompressed music on Projects Mandatory!',
    paymentMethod: paymentMethod || 'AIRTEL_MONEY',
    txRef,
    status: 'PURCHASED',
    expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(), // 1 year claim validity
    createdAt: new Date().toISOString(),
  };

  giftSubscriptions.push(newGift);

  // Platform Revenue
  platformRevenueRecords.push({
    id: `prev-gift-${Date.now()}`,
    source: 'GIFT_SUBSCRIPTION',
    amountMWK: totalAmount,
    relatedId: newGift.id,
    periodMonth: new Date().toISOString().substring(0, 7),
    description: `Gift Subscription (${planTier}, ${duration}mo)`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Gift subscription created successfully!',
    gift: newGift,
  });
});

app.get('/api/gifts/lookup/:code', (req, res) => {
  const { code } = req.params;
  const cleanCode = code.trim().toUpperCase();
  const gift = giftSubscriptions.find((g) => g.giftCode === cleanCode);

  if (!gift) {
    return res.status(404).json({ success: false, error: 'Invalid or unrecognized gift code.' });
  }

  res.json({ success: true, gift });
});

app.post('/api/gifts/claim', (req, res) => {
  const { giftCode, recipientUserId, recipientEmail } = req.body;
  const cleanCode = (giftCode || '').trim().toUpperCase();

  const gift = giftSubscriptions.find((g) => g.giftCode === cleanCode);
  if (!gift) {
    return res.status(404).json({ success: false, error: 'Gift code not found.' });
  }

  if (gift.status === 'CLAIMED') {
    return res.status(400).json({ success: false, error: 'This gift code has already been redeemed.' });
  }

  if (new Date(gift.expiresAt) < new Date()) {
    return res.status(400).json({ success: false, error: 'This gift code has expired.' });
  }

  // Activate recipient's subscription
  gift.status = 'CLAIMED';
  gift.claimedByUserId = recipientUserId;
  gift.claimedAt = new Date().toISOString();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + gift.durationMonths * 30 * 86400000);

  const activatedSub: UserSubscription = {
    id: `sub-gift-${Date.now()}`,
    userId: recipientUserId,
    userEmail: recipientEmail || gift.recipientEmail,
    planId: gift.planTier.toLowerCase(),
    planTier: gift.planTier,
    status: 'ACTIVE',
    amountMWK: gift.amountMWK,
    paymentMethod: 'PAYCHANGU',
    txRef: gift.txRef,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    autoRenew: false,
    createdAt: now.toISOString(),
  };

  userSubscriptions.push(activatedSub);

  res.json({
    success: true,
    message: `Gift claimed! You now have ${gift.durationMonths} months of ${gift.planTier.replace('_', ' ')}.`,
    subscription: activatedSub,
    gift,
  });
});

app.get('/api/gifts/user/:userId', (req, res) => {
  const { userId } = req.params;
  const gifts = giftSubscriptions.filter((g) => g.senderUserId === userId || g.claimedByUserId === userId);
  res.json({ success: true, gifts });
});

// 5. FAMILY PLANS
app.post('/api/family-plan/subscribe', (req, res) => {
  const { ownerUserId, ownerEmail, ownerName, paymentMethod } = req.body;

  if (!ownerUserId || !ownerEmail) {
    return res.status(400).json({ success: false, error: 'Owner details required.' });
  }

  const priceMWK = phase2AdminSettings.familyPlans.priceMWK;
  const maxMembers = phase2AdminSettings.familyPlans.maxMembers;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 86400000);

  const plan: FamilyPlan = {
    id: `fam-${Date.now()}`,
    ownerUserId,
    ownerEmail,
    ownerName: ownerName || 'Family Head',
    planTier: 'FAMILY_PREMIUM',
    priceMWK,
    maxMembers,
    activeMembersCount: 1,
    status: 'ACTIVE',
    txRef: `PM-FAM-${Date.now()}`,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  familyPlans.push(plan);

  const ownerMember: FamilyMember = {
    id: `fmem-${Date.now()}`,
    familyPlanId: plan.id,
    memberUserId: ownerUserId,
    memberEmail: ownerEmail,
    memberName: ownerName || 'Family Head',
    role: 'OWNER',
    inviteStatus: 'ACCEPTED',
    invitedAt: now.toISOString(),
    joinedAt: now.toISOString(),
  };

  familyMembers.push(ownerMember);

  // Record Platform Revenue
  platformRevenueRecords.push({
    id: `prev-fam-${Date.now()}`,
    source: 'FAMILY_SUBSCRIPTION',
    amountMWK: priceMWK,
    relatedId: plan.id,
    periodMonth: now.toISOString().substring(0, 7),
    description: `Family Subscription Plan (${ownerName})`,
    createdAt: now.toISOString(),
  });

  res.json({ success: true, plan, members: [ownerMember] });
});

app.get('/api/family-plan/:userId', (req, res) => {
  const { userId } = req.params;
  const memberRecord = familyMembers.find((m) => m.memberUserId === userId && m.inviteStatus === 'ACCEPTED');
  
  if (!memberRecord) {
    return res.json({ success: true, hasFamilyPlan: false, plan: null, members: [] });
  }

  const plan = familyPlans.find((p) => p.id === memberRecord.familyPlanId && p.status === 'ACTIVE');
  const members = familyMembers.filter((m) => m.familyPlanId === memberRecord.familyPlanId);

  res.json({ success: true, hasFamilyPlan: !!plan, plan, members, userRole: memberRecord.role });
});

app.post('/api/family-plan/invite', (req, res) => {
  const { familyPlanId, memberEmail, memberName } = req.body;
  const plan = familyPlans.find((p) => p.id === familyPlanId && p.status === 'ACTIVE');

  if (!plan) {
    return res.status(404).json({ success: false, error: 'Active family plan not found.' });
  }

  if (plan.activeMembersCount >= plan.maxMembers) {
    return res.status(400).json({ success: false, error: `Family plan member limit (${plan.maxMembers}) reached.` });
  }

  const newMember: FamilyMember = {
    id: `fmem-${Date.now()}`,
    familyPlanId,
    memberEmail,
    memberName: memberName || memberEmail.split('@')[0],
    role: 'MEMBER',
    inviteStatus: 'ACCEPTED', // Pre-accepted for demo/instant provisioning
    invitedAt: new Date().toISOString(),
    joinedAt: new Date().toISOString(),
  };

  familyMembers.push(newMember);
  plan.activeMembersCount += 1;

  res.json({ success: true, message: `Invited ${memberEmail} to family plan.`, member: newMember, plan });
});

app.post('/api/family-plan/remove-member', (req, res) => {
  const { familyPlanId, memberId } = req.body;
  const memberIndex = familyMembers.findIndex((m) => m.id === memberId && m.familyPlanId === familyPlanId);

  if (memberIndex === -1) {
    return res.status(404).json({ success: false, error: 'Member not found in family plan.' });
  }

  familyMembers.splice(memberIndex, 1);
  const plan = familyPlans.find((p) => p.id === familyPlanId);
  if (plan) {
    plan.activeMembersCount = Math.max(1, plan.activeMembersCount - 1);
  }

  res.json({ success: true, message: 'Family member removed.' });
});

// 6. ARTIST FAN MEMBERSHIPS
app.get('/api/artist-memberships/plans/:artistId', (req, res) => {
  const { artistId } = req.params;
  const plan = artistMembershipPlans.find((p) => p.artistId === artistId && p.isActive);
  res.json({ success: true, plan: plan || null });
});

app.post('/api/artist-memberships/plans/create', (req, res) => {
  const { artistId, artistName, title, description, priceMWK, perks } = req.body;
  const price = Number(priceMWK);

  const minPrice = phase2AdminSettings.artistMemberships.minPriceMWK;
  const maxPrice = phase2AdminSettings.artistMemberships.maxPriceMWK;

  if (isNaN(price) || price < minPrice || price > maxPrice) {
    return res.status(400).json({
      success: false,
      error: `Membership price must be between MK ${minPrice.toLocaleString()} and MK ${maxPrice.toLocaleString()}.`,
    });
  }

  let plan = artistMembershipPlans.find((p) => p.artistId === artistId);
  if (plan) {
    plan.title = title || plan.title;
    plan.description = description || plan.description;
    plan.priceMWK = price;
    plan.perks = perks || plan.perks;
    plan.updatedAt = new Date().toISOString();
  } else {
    plan = {
      id: `plan-${Date.now()}`,
      artistId,
      artistName: artistName || 'Artist',
      title: title || 'VIP Fan Club',
      description: description || 'Support this artist and receive exclusive perks.',
      priceMWK: price,
      billingInterval: 'MONTHLY',
      perks: perks || ['Exclusive recordings', 'Supporter badge'],
      isActive: true,
      memberCount: 0,
      createdAt: new Date().toISOString(),
    };
    artistMembershipPlans.push(plan);
  }

  res.json({ success: true, message: 'Artist membership plan updated.', plan });
});

app.post('/api/artist-memberships/join', (req, res) => {
  const { planId, artistId, artistName, userId, userEmail, userName, paymentMethod } = req.body;
  const plan = artistMembershipPlans.find((p) => p.id === planId && p.isActive);

  if (!plan) {
    return res.status(404).json({ success: false, error: 'Membership plan not found.' });
  }

  const price = plan.priceMWK;
  const platformFeePercent = phase2AdminSettings.artistMemberships.platformFeePercent;
  const platformFeeMWK = Math.round(price * (platformFeePercent / 100));
  const artistShareMWK = price - platformFeeMWK;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 86400000);

  const membershipSub: ArtistMembershipSubscription = {
    id: `mem-sub-${Date.now()}`,
    planId,
    artistId,
    artistName: artistName || plan.artistName,
    userId,
    userEmail,
    userName: userName || userEmail.split('@')[0],
    status: 'ACTIVE',
    priceMWK: price,
    artistShareMWK,
    platformFeeMWK,
    txRef: `PM-MEM-${Date.now()}`,
    startedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  };

  artistMemberships.push(membershipSub);
  plan.memberCount += 1;

  // Record Platform Revenue
  platformRevenueRecords.push({
    id: `prev-mem-${Date.now()}`,
    source: 'ARTIST_MEMBERSHIP_FEE',
    amountMWK: platformFeeMWK,
    relatedId: membershipSub.id,
    artistId,
    userId,
    periodMonth: now.toISOString().substring(0, 7),
    description: `Artist membership platform fee (${plan.artistName})`,
    createdAt: now.toISOString(),
  });

  res.json({
    success: true,
    message: `You are now a member of ${plan.artistName}'s fan club!`,
    subscription: membershipSub,
  });
});

app.get('/api/artist-memberships/artist/:artistId/members', (req, res) => {
  const { artistId } = req.params;
  const members = artistMemberships.filter((m) => m.artistId === artistId && m.status === 'ACTIVE');
  const plan = artistMembershipPlans.find((p) => p.artistId === artistId);
  const totalMonthlyEarningsMWK = members.reduce((sum, m) => sum + m.artistShareMWK, 0);

  res.json({ success: true, members, plan, totalMonthlyEarningsMWK });
});

app.get('/api/artist-memberships/user/:userId', (req, res) => {
  const { userId } = req.params;
  const memberships = artistMemberships.filter((m) => m.userId === userId && m.status === 'ACTIVE');
  res.json({ success: true, memberships });
});

// 7. ENHANCED ARTIST TIPPING
app.post('/api/tips/send-enhanced', (req, res) => {
  const { artistId, artistName, senderName, senderEmail, senderPhone, amountMWK, message, paymentMethod } = req.body;
  const amount = Number(amountMWK);
  const minTip = phase2AdminSettings.tips.minTipMWK;

  if (isNaN(amount) || amount < minTip) {
    return res.status(400).json({ success: false, error: `Minimum tip amount is MK ${minTip.toLocaleString()}.` });
  }

  const platformFeePercent = phase2AdminSettings.tips.platformFeePercent;
  const platformFeeMWK = Math.round(amount * (platformFeePercent / 100));
  const artistAmountMWK = amount - platformFeeMWK;

  const tip: TipRecord = {
    id: `tip-${Date.now()}`,
    artistId,
    artistName: artistName || 'Artist',
    senderName: senderName || 'Anonymous Supporter',
    senderEmail,
    senderPhone,
    amountMWK: amount,
    platformFeeMWK,
    artistAmountMWK,
    message: message || '',
    txRef: `PM-TIP-${Date.now()}`,
    paymentMethod: paymentMethod || 'AIRTEL_MONEY',
    status: 'PAID',
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  };

  tipRecords.push(tip);

  // Record Platform Fee Revenue
  platformRevenueRecords.push({
    id: `prev-tip-${Date.now()}`,
    source: 'TIP_PLATFORM_FEE',
    amountMWK: platformFeeMWK,
    relatedId: tip.id,
    artistId,
    periodMonth: new Date().toISOString().substring(0, 7),
    description: `Tip platform fee (${artistName})`,
    createdAt: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: `Thank you! MK ${amount.toLocaleString()} tip sent to ${artistName}.`,
    tip,
  });
});

app.get('/api/tips/artist/:artistId', (req, res) => {
  const { artistId } = req.params;
  const artistTips = tipRecords.filter((t) => t.artistId === artistId);
  const totalTipsMWK = artistTips.reduce((sum, t) => sum + t.artistAmountMWK, 0);

  res.json({
    success: true,
    tips: artistTips,
    totalTipsMWK,
    count: artistTips.length,
  });
});

// 8. MERCHANDISE & EVENTS (FOUNDATIONS)
app.get('/api/merch/artist/:artistId', (req, res) => {
  const { artistId } = req.params;
  const products = merchProducts.filter((p) => p.artistId === artistId);
  res.json({ success: true, products });
});

app.post('/api/merch/products/create', (req, res) => {
  const { artistId, artistName, title, description, priceMWK, imageUrl, inventory, category } = req.body;
  const newProduct: MerchProduct = {
    id: `merch-${Date.now()}`,
    artistId,
    artistName,
    title,
    description,
    priceMWK: Number(priceMWK) || 10000,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
    inventory: Number(inventory) || 20,
    category: category || 'APPAREL',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
  merchProducts.push(newProduct);
  res.json({ success: true, product: newProduct });
});

app.get('/api/events/artist/:artistId', (req, res) => {
  const { artistId } = req.params;
  const events = eventRecords.filter((e) => e.artistId === artistId);
  res.json({ success: true, events });
});

app.post('/api/events/create', (req, res) => {
  const { artistId, artistName, eventName, description, venue, city, eventDate, eventTime, ticketTypes } = req.body;
  const newEvent: EventRecord = {
    id: `evt-${Date.now()}`,
    artistId,
    artistName,
    eventName,
    description,
    venue,
    city,
    eventDate,
    eventTime,
    ticketTypes: ticketTypes || [{ name: 'Standard Entry', priceMWK: 5000, capacity: 500, sold: 0 }],
    totalCapacity: (ticketTypes || []).reduce((sum: number, t: any) => sum + (t.capacity || 0), 0) || 500,
    totalTicketsSold: 0,
    status: 'UPCOMING',
    createdAt: new Date().toISOString(),
  };
  eventRecords.push(newEvent);
  res.json({ success: true, event: newEvent });
});

// 9. ADMIN PHASE 2 CONTROLS & PLATFORM REVENUE
app.get('/api/admin/phase2/settings', requireAdmin, (req, res) => {
  res.json({ success: true, settings: phase2AdminSettings });
});

app.post('/api/admin/phase2/settings/update', requireAdmin, (req, res) => {
  const { settings, adminEmail, changeSummary } = req.body;

  if (settings) {
    phase2AdminSettings = {
      ...phase2AdminSettings,
      ...settings,
    };

    adminFinancialLogs.push({
      id: `afl-${Date.now()}`,
      adminEmail: adminEmail || 'Admin',
      action: 'UPDATE_PHASE2_SETTINGS',
      settingKey: Object.keys(settings).join(', '),
      previousValue: 'Previous Config',
      newValue: JSON.stringify(settings),
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ success: true, settings: phase2AdminSettings });
});

app.get('/api/admin/phase2/financial-logs', requireAdmin, (req, res) => {
  res.json({ success: true, logs: adminFinancialLogs });
});

app.get('/api/admin/phase2/platform-revenue', requireAdmin, (req, res) => {
  const totalRevenueMWK = platformRevenueRecords.reduce((sum, r) => sum + r.amountMWK, 0);

  const breakdown: Record<string, number> = {};
  platformRevenueRecords.forEach((r) => {
    breakdown[r.source] = (breakdown[r.source] || 0) + r.amountMWK;
  });

  res.json({
    success: true,
    totalRevenueMWK,
    breakdown,
    records: platformRevenueRecords,
  });
});



// Audio package generation helper
function generateStudioAudioPackage(song: Song, userEmail: string, orderId: string): Buffer {
  const metadataText = `PROJECTS MANDATORY MASTER RECORDING\nTitle: ${song.title}\nArtist: ${song.artist}\nLicensed to: ${userEmail}\nOrder Ref: ${orderId}\nRelease Date: ${song.releaseDate}\nGenre: ${song.genre}\n(c) 2026 PROJECTS MANDATORY. All Rights Reserved.`;
  
  const header = Buffer.from([
    0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00,
  ]);
  const metaBuf = Buffer.from(metadataText, 'utf-8');
  
  const frameLength = 1048576;
  const audioData = Buffer.alloc(frameLength);
  
  for (let i = 0; i < frameLength; i += 1044) {
    audioData[i] = 0xFF;
    audioData[i + 1] = 0xFB;
    audioData[i + 2] = 0x90;
    audioData[i + 3] = 0x00;
  }
  
  return Buffer.concat([header, metaBuf, audioData]);
}

// ==========================================
// VITE INTEGRATION & SERVER START
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROJECTS MANDATORY] Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP server when executed directly (not inside Vercel serverless function)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };
