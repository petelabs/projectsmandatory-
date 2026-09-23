import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { api } from '../../lib/api';
import { MerchProduct } from '../../types';

interface ArtistMerchManagerProps {
  artistId: string;
  artistName: string;
}

export const ArtistMerchManager: React.FC<ArtistMerchManagerProps> = ({ artistId, artistName }) => {
  const [products, setProducts] = useState<MerchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpenAdd, setIsOpenAdd] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceMWK, setPriceMWK] = useState<number>(15000);
  const [inventory, setInventory] = useState<number>(50);
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState<'APPAREL' | 'DIGITAL_ITEM' | 'ACCESSORY'>('APPAREL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [artistId]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getArtistMerch(artistId);
      if (res.success) setProducts(res.products || []);
    } catch {
      console.error('Failed to load merch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createMerchProduct({
        artistId,
        artistName,
        title: title.trim(),
        description: description.trim(),
        priceMWK,
        inventory,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=600&auto=format&fit=crop',
        category,
      });

      if (res.success && res.product) {
        setProducts((prev) => [res.product, ...prev]);
        setIsOpenAdd(false);
        setTitle('');
        setDescription('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            <span>Merchandise Storefront Foundation</span>
          </h3>
          <p className="text-xs text-slate-400">Offer physical apparel, concert gear, or digital bundles to your fans</p>
        </div>
        <button
          onClick={() => setIsOpenAdd(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {products.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No merchandise products listed yet. Create t-shirts, caps, or vinyl records to sell to your supporters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex gap-4">
              <img
                src={p.imageUrl}
                alt={p.title}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-800 shrink-0"
              />
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-white text-xs truncate">{p.title}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">
                      {p.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{p.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="font-mono font-bold text-white text-xs">
                    MK {p.priceMWK.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500">{p.inventory} in stock</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {isOpenAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-blue-500/30 p-6 shadow-2xl text-left">
            <h3 className="text-lg font-black text-white mb-4">Add Merchandise Item</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tour Concert Tee"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Price (MWK)</label>
                <input
                  type="number"
                  required
                  value={priceMWK}
                  onChange={(e) => setPriceMWK(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Stock Inventory</label>
                  <input
                    type="number"
                    value={inventory}
                    onChange={(e) => setInventory(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="APPAREL">Apparel</option>
                    <option value="ACCESSORY">Accessory</option>
                    <option value="DIGITAL_ITEM">Digital Bundle</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="100% cotton official merchandise..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpenAdd(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
