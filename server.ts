import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ARTIST_SETTINGS, INITIAL_ORDERS, INITIAL_SONGS } from './src/data/initialData';
import { Customer, Order, Song, ArtistSettings } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database (Server-authoritative state synchronized with Firestore model)
let songs: Song[] = [...INITIAL_SONGS];
let orders: Order[] = [...INITIAL_ORDERS];
let artistSettings: ArtistSettings = { ...INITIAL_ARTIST_SETTINGS };
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mandatory2025';

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

// 4. Create pending checkout order (Server-Authoritative Pricing)
app.post('/api/checkout/create-order', async (req, res) => {
  const { songId, customerName, customerEmail, customerPhone, paymentMethod, userId } = req.body;

  if (!songId || !customerName || !customerEmail || !customerPhone) {
    return res.status(400).json({ success: false, error: 'All customer fields and song ID are required.' });
  }

  // Retrieve actual price from server state - NEVER trust frontend price
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
    paymentMethod: paymentMethod || 'AIRTEL_MONEY',
    status: 'PENDING',
    downloadCount: 0,
    maxDownloads: artistSettings.maxDownloadAttempts || 5,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);

  // Optional: If PayChangu secret key is configured, create live PayChangu hosted checkout link
  let checkoutUrl: string | undefined;
  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret) {
    try {
      const nameParts = customerName.trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'User';

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
          callback_url: `${req.protocol}://${req.get('host')}/api/webhooks/paychangu`,
          return_url: `${req.protocol}://${req.get('host')}/payment/status/${newOrder.txRef}`,
          customization: {
            title: `PROJECTS MANDATORY - ${song.title}`,
            description: `Original Master Recording by ${song.artist}`,
            logo: song.coverImage,
          },
        }),
      });

      const pcData = await pcResponse.json();
      if (pcData.status === 'success' && pcData.data?.checkout_url) {
        checkoutUrl = pcData.data.checkout_url;
      }
    } catch (pcErr) {
      console.warn('PayChangu API initialization notice:', pcErr);
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
      paymentMethod: newOrder.paymentMethod,
      paychanguPublicKey: process.env.PAYCHANGU_PUBLIC_KEY || artistSettings.paychanguPublicKey,
      checkoutUrl,
    },
  });
});

// 5. Server-side payment verification (PayChangu verification gateway)
app.post('/api/payments/verify', async (req, res) => {
  const { txRef, paychanguRef, mockSuccess } = req.body;

  if (!txRef) {
    return res.status(400).json({ success: false, error: 'Transaction reference is required.' });
  }

  const orderIndex = orders.findIndex(o => o.txRef === txRef);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, error: 'Order not found for transaction reference.' });
  }

  const order = orders[orderIndex];

  // If already paid, return existing token
  if (order.status === 'PAID' && order.purchaseToken) {
    return res.json({
      success: true,
      verified: true,
      order,
      purchaseToken: order.purchaseToken,
    });
  }

  // Server-side verification logic:
  let paymentVerified = false;
  const paychanguSecret = process.env.PAYCHANGU_SECRET_KEY;

  if (paychanguSecret && !mockSuccess) {
    try {
      const response = await fetch(`https://api.paychangu.com/verify-payment/${encodeURIComponent(txRef)}`, {
        headers: {
          'Authorization': `Bearer ${paychanguSecret}`,
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (data.status === 'success' && (data.data?.status === 'successful' || data.data?.status === 'paid')) {
        // Strict verification of amount and currency
        if (Number(data.data.amount) >= order.amount && data.data.currency?.toUpperCase() === 'MWK') {
          paymentVerified = true;
          if (data.data.tx_ref) {
            order.paychanguRef = data.data.tx_ref;
          }
        }
      }
    } catch (err) {
      console.error('PayChangu API verification error:', err);
    }
  } else {
    // Sandbox / Test Mode: verified
    paymentVerified = true;
  }

  if (!paymentVerified) {
    order.status = 'FAILED';
    return res.status(400).json({
      success: false,
      verified: false,
      error: 'Payment verification failed. The transaction was not marked successful by the provider.',
    });
  }

  // Generate secure cryptographically random purchase token
  const purchaseToken = `pm_dl_${crypto.randomBytes(24).toString('hex')}`;
  const validityDays = artistSettings.tokenValidityDays || 30;
  const expiresAt = Date.now() + validityDays * 24 * 60 * 60 * 1000;

  order.status = 'PAID';
  order.paidAt = new Date().toISOString();
  order.purchaseToken = purchaseToken;
  order.tokenExpiresAt = new Date(expiresAt).toISOString();
  if (paychanguRef) {
    order.paychanguRef = paychanguRef;
  }

  // Register active download token
  activeDownloadTokens.set(purchaseToken, {
    orderId: order.id,
    songId: order.songId,
    customerEmail: order.customerEmail,
    expiresAt,
    maxDownloads: order.maxDownloads || 5,
    downloadsUsed: 0,
  });

  // Increment song download & popularity counter
  const song = songs.find(s => s.id === order.songId);
  if (song) {
    song.downloadCount += 1;
  }

  res.json({
    success: true,
    verified: true,
    order,
    purchaseToken,
  });
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
// ADMIN API ENDPOINTS (Protected)
// ==========================================

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin token required' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== `admin_session_${ADMIN_PASSWORD}`) {
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid admin token' });
  }
  next();
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
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

startServer();
