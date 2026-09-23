import React, { useState } from 'react';
import { Phone, MapPin, Send, MessageSquare, ShieldCheck, CheckCircle, MessageCircle, Sparkles } from 'lucide-react';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import {
  sendContactMessageToFirestore,
  OFFICIAL_WHATSAPP_NUMBER,
  OFFICIAL_WHATSAPP_LINK,
} from '../lib/firebase';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phoneOrWhatsApp, setPhoneOrWhatsApp] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneOrWhatsApp.trim() || !message.trim()) {
      showToast('Please enter your name, phone/WhatsApp number, and message.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendContactMessageToFirestore({
        name: name.trim(),
        phoneOrWhatsApp: phoneOrWhatsApp.trim(),
        subject: subject.trim() || 'General Inquiry',
        message: message.trim(),
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
      showToast('Your message has been sent directly to the Admin Dashboard!', 'success');
    } catch (err: any) {
      console.error('Failed to submit contact message:', err);
      setIsSubmitting(false);
      showToast(err.message || 'Failed to send message. You can also chat on WhatsApp.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in">
      
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Projects Mandatory Support & Inquiries</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-['Syne',sans-serif]">
          Contact Projects Mandatory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl">
          Get in touch directly through WhatsApp or send a message right here on the website for artist support, distribution inquiries, or customer assistance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info Cards */}
        <div className="md:col-span-5 space-y-4">
          
          {/* Direct WhatsApp Callout */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-800/80 space-y-4 shadow-lg shadow-emerald-950/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Direct WhatsApp Chat
                </h3>
                <span className="text-xs text-emerald-400 font-semibold">
                  Fastest Response
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Chat directly with the Projects Mandatory artist and support management team on WhatsApp.
            </p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/60 text-center">
              <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">Official WhatsApp Number</span>
              <span className="text-lg font-extrabold text-emerald-300 font-mono tracking-wide block mt-0.5">
                {OFFICIAL_WHATSAPP_NUMBER}
              </span>
            </div>

            <a
              href={OFFICIAL_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-950/40 transition active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Open WhatsApp Chat</span>
            </a>
          </div>

          {/* Location & Guidelines */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Studio & Management
            </h3>
            
            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-600/20 text-rose-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Headquarters</span>
                  <span className="text-slate-100">Lilongwe & Blantyre, Malawi</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Direct Contact</span>
                  <span className="text-slate-100">{OFFICIAL_WHATSAPP_NUMBER}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Instant Download Support</span>
            </div>
            <p>
              If you experienced any network issue during mobile money checkout (Airtel Money / TNM Mpamba), contact us with your reference code or write a message below.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="md:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 sm:p-8">
          {isSubmitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-800">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Message Delivered to Admin!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Thank you, <strong className="text-white">{name}</strong>. Your message has been recorded directly in the Projects Mandatory admin dashboard. We will get back to you via WhatsApp or phone at <strong className="text-emerald-400">{phoneOrWhatsApp}</strong>.
              </p>
              
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSubmitted(false);
                    setMessage('');
                    setSubject('');
                  }}
                >
                  Send Another Message
                </Button>
                <a
                  href={OFFICIAL_WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
                  Send a Message on the Website
                </h3>
                <p className="text-xs text-slate-400">
                  Your message goes straight to the administrator dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name"
                  placeholder="e.g. John Banda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Phone / WhatsApp Number"
                  placeholder="e.g. 0984 67 96 91 or +265..."
                  value={phoneOrWhatsApp}
                  onChange={(e) => setPhoneOrWhatsApp(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Subject / Topic"
                placeholder="Booking inquiry, music promo, download support..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Your Message <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write what you need help with, music inquiries, distribution, or artist support..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-700/80 text-slate-100 text-sm placeholder-slate-500 p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send Message to Admin
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

