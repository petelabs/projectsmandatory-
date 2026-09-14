import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, ShieldCheck, CheckCircle } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('Your message has been delivered to management!', 'success');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
          Contact & Bookings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl">
          For live performances, licensing, media inquiries, or customer support regarding your downloads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info Cards */}
        <div className="md:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Management & Inquiries
            </h3>
            
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Email Inquiries</span>
                  <a href="mailto:management@projectsmandatory.com" className="text-slate-100 hover:text-blue-400">
                    management@projectsmandatory.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Booking / Support Phone</span>
                  <span className="text-slate-100">+265 999 123 456 / +265 888 765 432</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Location</span>
                  <span className="text-slate-100">Lilongwe & Blantyre, Malawi</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Download Order Support</span>
            </div>
            <p>
              If you experienced any network interruption while paying with PayChangu or downloading, send your Transaction Reference and our support team will immediately re-authorize your download.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="md:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-800">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Message Received!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Thank you for reaching out. We will get back to your email within 24 hours.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSubmitted(false);
                  setMessage('');
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Send a Direct Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Subject"
                placeholder="Booking inquiry, media request, or download help..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Message <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 text-slate-100 text-sm placeholder-slate-500 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
