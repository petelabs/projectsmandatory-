import { Song, ArtistSettings, Order } from '../types';

export const INITIAL_ARTIST_SETTINGS: ArtistSettings = {
  artistName: 'PROJECTS MANDATORY',
  artistTagline: 'Music That Belongs To You.',
  artistBio: 'Official studio recordings and master audio files directly from PROJECTS MANDATORY.',
  profileImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
  bannerImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop',
  contactEmail: 'mgmt@projectsmandatory.com',
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
    twitter: 'https://x.com/mandatorystudio',
  },
  copyrightNotice: '© 2026 PROJECTS MANDATORY. All Master Recording Rights Reserved.',
  allowGuestPurchases: true,
  maxDownloadAttempts: 5,
  tokenValidityDays: 30,
};

// Clean fresh catalog — songs are uploaded by the artist via Admin Portal
export const INITIAL_SONGS: Song[] = [];

// Clean fresh orders — populated by real PayChangu customer transactions
export const INITIAL_ORDERS: Order[] = [];
