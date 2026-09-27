import React, { useState } from 'react';
import {
  User,
  Camera,
  Mail,
  Phone,
  KeyRound,
  ShieldCheck,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, uploadFileToR2OrStorage, updateFirestoreUserProfile } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || user?.photoURL || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarPreview || undefined;

      if (avatarFile) {
        // Upload avatar image to Cloudflare R2 / Storage
        finalAvatarUrl = await uploadFileToR2OrStorage(
          avatarFile,
          `avatars/${user?.id || 'user'}_${Date.now()}_${avatarFile.name}`
        );
      }

      const updates = {
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: finalAvatarUrl,
        photoURL: finalAvatarUrl,
      };

      updateProfile(updates);

      if (user?.id) {
        await updateFirestoreUserProfile(user.id, updates);
      }

      showToast('Profile updated successfully!', 'success');
      onClose();
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      showToast('No email associated with this account.', 'error');
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      showToast(`Password reset link sent to ${user.email}`, 'success');
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      showToast('Could not send reset email. Please try again later.', 'error');
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border text-left space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-[#0E131F] border-slate-800 text-white' : 'bg-white border-[#E5E7EB] text-[#111827]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold">Edit Profile</h3>
          <button
            onClick={onClose}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-full"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center gap-2 pt-1">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-800 ring-4 ring-[#1455D9]/40 group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={name || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-700 text-white font-bold text-xl">
                  {name ? name[0].toUpperCase() : 'U'}
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-white"
              >
                <Camera className="w-5 h-5" />
              </label>
            </div>

            <label
              htmlFor="avatar-upload"
              className="text-xs font-semibold text-[#1455D9] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Photo</span>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Display Name / Stage Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-[#1455D9]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#1455D9]'
                }`}
                placeholder="e.g. Chipo Phiri"
              />
            </div>
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs border outline-none opacity-70 cursor-not-allowed ${
                  isDark
                    ? 'bg-slate-900/50 border-slate-800 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Phone / WhatsApp Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs border outline-none transition ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-white focus:border-[#1455D9]'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#1455D9]'
                }`}
                placeholder="e.g. +265 999 123 456"
              />
            </div>
          </div>

          {/* Password Reset Section */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">Security & Password</p>
                <p className="text-[10px] text-slate-400">Receive reset instructions via email</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isSendingReset || !user?.email}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95 disabled:opacity-50"
            >
              {isSendingReset ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#1455D9] text-white font-bold text-xs hover:bg-[#1146B8] transition active:scale-95 shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
