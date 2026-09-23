import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Plus, Ticket, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import { EventRecord } from '../../types';

interface ArtistEventManagerProps {
  artistId: string;
  artistName: string;
}

export const ArtistEventManager: React.FC<ArtistEventManagerProps> = ({ artistId, artistName }) => {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpenAdd, setIsOpenAdd] = useState(false);

  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('Lilongwe');
  const [eventDate, setEventDate] = useState('2026-06-20');
  const [eventTime, setEventTime] = useState('19:00');
  const [ticketPriceMWK, setTicketPriceMWK] = useState<number>(5000);
  const [capacity, setCapacity] = useState<number>(500);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [artistId]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getArtistEvents(artistId);
      if (res.success) setEvents(res.events || []);
    } catch {
      console.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !venue.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createEvent({
        artistId,
        artistName,
        eventName: eventName.trim(),
        venue: venue.trim(),
        city,
        eventDate,
        eventTime,
        description: description.trim(),
        ticketTypes: [{ name: 'Standard Entry', priceMWK: ticketPriceMWK, capacity, sold: 0 }],
      });

      if (res.success && res.event) {
        setEvents((prev) => [res.event, ...prev]);
        setIsOpenAdd(false);
        setEventName('');
        setVenue('');
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
            <Ticket className="w-5 h-5 text-amber-400" />
            <span>Concerts & Event Ticketing Foundation</span>
          </h3>
          <p className="text-xs text-slate-400">List upcoming live concerts, acoustic sessions, and show tickets</p>
        </div>
        <button
          onClick={() => setIsOpenAdd(true)}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {events.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No live events scheduled yet. Create your next live show or acoustic session to engage local fans.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{evt.eventName}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{evt.venue}, {evt.city}</span>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono">
                  {evt.status}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>{new Date(evt.eventDate).toLocaleDateString()} @ {evt.eventTime}</span>
                </div>
                <div className="font-mono font-bold text-amber-400">
                  From MK {(evt.ticketTypes[0]?.priceMWK || 5000).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{evt.totalTicketsSold} tickets sold</span>
                <span>Capacity: {evt.totalCapacity}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {isOpenAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 shadow-2xl text-left">
            <h3 className="text-lg font-black text-white mb-4">Add Live Event</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Blantyre Live Acoustic Night"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Robin's Park"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ticket Price (MWK)</label>
                  <input
                    type="number"
                    required
                    value={ticketPriceMWK}
                    onChange={(e) => setTicketPriceMWK(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
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
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
