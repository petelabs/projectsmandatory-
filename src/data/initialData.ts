import { Song, ArtistSettings, Order } from '../types';

export const INITIAL_ARTIST_SETTINGS: ArtistSettings = {
  artistName: 'Hapsin',
  artistTagline: 'Official Music & Studio Master Catalog',
  artistBio: 'Official digital music storefront and music promotion platform for Hapsin. Stream, purchase master recordings, and discover promoted African music.',
  profileImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
  bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop',
  contactEmail: 'petedianolabs@gmail.com',
  contactPhone: '+265 999 123 456',
  whatsappNumber: '+265 888 789 012',
  studioLocation: 'Lilongwe & Blantyre, Malawi',
  currency: 'MWK',
  paychanguPublicKey: '',
  paychanguMode: 'live',
  socialLinks: {
    instagram: 'https://instagram.com/hapsinmusic',
    facebook: 'https://facebook.com/hapsinmusic',
    youtube: 'https://youtube.com/@hapsinmusic',
    twitter: 'https://x.com/hapsinmusic',
  },
  copyrightNotice: '© 2026 Hapsin. All Rights Reserved.',
  allowGuestPurchases: true,
  maxDownloadAttempts: 5,
  tokenValidityDays: 30,
};

// Clean fresh catalog — songs are uploaded by the artist via Admin Portal
export const INITIAL_SONGS: Song[] = [];

// Clean fresh orders — populated by real PayChangu customer transactions
export const INITIAL_ORDERS: Order[] = [];
