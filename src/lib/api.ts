import { Song, Order, Customer, ArtistSettings, PaymentMethod } from '../types';

export const api = {
  // Songs
  async getSongs(): Promise<Song[]> {
    const res = await fetch('/api/songs');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch songs');
    return data.songs;
  },

  async getSong(id: string): Promise<Song> {
    const res = await fetch(`/api/songs/${id}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch song');
    return data.song;
  },

  // Artist info
  async getArtist(): Promise<{ artist: Partial<ArtistSettings> }> {
    const res = await fetch('/api/artist');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch artist profile');
    return data;
  },

  async getArtistSettings(): Promise<Partial<ArtistSettings>> {
    const res = await fetch('/api/artist');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch artist profile');
    return data.artist;
  },

  // Checkout
  async createOrder(payload: {
    songId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
  }): Promise<{
    id: string;
    txRef: string;
    songTitle: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerPhone: string;
    paymentMethod: PaymentMethod;
    paychanguPublicKey?: string;
  }> {
    const res = await fetch('/api/checkout/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to initialize order');
    return data.order;
  },

  // Payment Verification (Server-Side)
  async verifyPayment(payload: {
    txRef: string;
    paychanguRef?: string;
    mockSuccess?: boolean;
  }): Promise<{
    verified: boolean;
    order: Order;
    purchaseToken: string;
  }> {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Payment verification failed');
    return data;
  },

  async getOrderByTxRef(txRef: string): Promise<Order> {
    const res = await fetch(`/api/payments/order/${encodeURIComponent(txRef)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Order not found');
    return data.order;
  },

  // User purchases
  async getUserPurchases(email: string): Promise<Order[]> {
    const res = await fetch(`/api/user/purchases?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load purchases');
    return data.purchases;
  },

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return this.getUserPurchases(email);
  },

  // Protected download link builder
  getDownloadUrl(purchaseToken: string): string {
    return `/api/download/${encodeURIComponent(purchaseToken)}`;
  },

  // Admin APIs
  admin: {
    async login(password: string): Promise<{ token: string; artistName: string }> {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Invalid credentials');
      return data;
    },

    async getStats(token: string) {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch admin stats');
      return data.stats;
    },

    async getSongs(token: string): Promise<Song[]> {
      const res = await fetch('/api/admin/songs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch songs');
      return data.songs;
    },

    async createSong(token: string, songData: Partial<Song>): Promise<Song> {
      const res = await fetch('/api/admin/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(songData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create song');
      return data.song;
    },

    async updateSong(token: string, id: string, updates: Partial<Song>): Promise<Song> {
      const res = await fetch(`/api/admin/songs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update song');
      return data.song;
    },

    async deleteSong(token: string, id: string): Promise<void> {
      const res = await fetch(`/api/admin/songs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete song');
    },

    async getOrders(token: string): Promise<Order[]> {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch orders');
      return data.orders;
    },

    async updateOrderStatus(token: string, id: string, status: string, notes?: string): Promise<Order> {
      const res = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update order');
      return data.order;
    },

    async getCustomers(token: string): Promise<Customer[]> {
      const res = await fetch('/api/admin/customers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch customers');
      return data.customers;
    },

    async getSettings(token: string): Promise<ArtistSettings> {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch settings');
      return data.settings;
    },

    async updateSettings(token: string, settings: Partial<ArtistSettings>): Promise<ArtistSettings> {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update settings');
      return data.settings;
    },
  },
};
