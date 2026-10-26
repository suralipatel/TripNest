import React, { useState, useRef } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Ticket,
  Plane,
  Train,
  Bus,
  Hotel,
  CalendarCheck,
  Luggage,
  Plus,
  Trash2,
  Clock,
  Camera,
  ArrowLeft,
  Check,
  CheckSquare,
  Pencil,
  Users,
  Lock,
} from 'lucide-react';
import TicketCard from './TicketCard';
import confetti from 'canvas-confetti';

function formatTripDates(startStr, endStr) {
  if (!startStr) return { text: 'Date TBD', duration: '' };
  try {
    const [sY, sM, sD] = startStr.split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sMonth = months[sM - 1] || '';
    if (!endStr) return { text: `${sD} ${sMonth} ${sY}`, duration: '' };
    const [eY, eM, eD] = endStr.split('-').map(Number);
    const eMonth = months[eM - 1] || '';
    const sDate = new Date(sY, sM - 1, sD);
    const eDate = new Date(eY, eM - 1, eD);
    const diffDays = Math.max(1, Math.round((eDate - sDate) / (1000 * 60 * 60 * 24)) + 1);
    const duration = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    if (sY === eY && sM === eM) return { text: `${sD} – ${eD} ${sMonth} ${sY}`, duration };
    if (sY === eY) return { text: `${sD} ${sMonth} – ${eD} ${eMonth} ${sY}`, duration };
    return { text: `${sD} ${sMonth} ${sY} – ${eD} ${eMonth} ${eY}`, duration };
  } catch (e) {
    return { text: `${startStr} to ${endStr}`, duration: '' };
  }
}

export default function TripDetailModal({
  trip,
  tickets = [],
  onClose,
  onAddTicket,
  onDeleteTicket,
  onShowQR,
  onTogglePacking,
  onAddPackingItem,
  onEditPackingItem,
  onDeletePackingItem,
  onAddItineraryItem,
  onDeleteTrip,
  onUpdateCoverImage,
  onEditTrip,
}) {
  // Main 3 Badges: 'tickets' | 'itinerary' | 'packing'
  const [activeMainTab, setActiveMainTab] = useState('tickets');

  // Sub-filter inside Tickets: 'all' | 'flight' | 'bus' | 'train' | 'hotel'
  const [ticketFilter, setTicketFilter] = useState('all');

  // Packing list state
  const [newPackingText, setNewPackingText] = useState('');
  const [editingPackingId, setEditingPackingId] = useState(null);
  const [editingPackingText, setEditingPackingText] = useState('');
  const fileInputRef = useRef(null);

  // Itinerary form state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [eventDay, setEventDay] = useState(1);
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState('activity');
  const [selectedDayFilter, setSelectedDayFilter] = useState('all');

  if (!trip) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateCoverImage) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > 1200) {
          height = Math.round((height * 1200) / width);
          width = 1200;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        onUpdateCoverImage(trip._id || trip.id, dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePackingToggle = (itemId, currentVal) => {
    onTogglePacking(trip._id || trip.id, itemId, !currentVal);
    if (!currentVal) {
      try {
        confetti({
          particleCount: 22,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#0D9488', '#2DD4BF', '#0284C7'],
        });
      } catch {}
    }
  };

  const handleAddPacking = (e) => {
    e.preventDefault();
    if (!newPackingText.trim()) return;
    onAddPackingItem(trip._id || trip.id, newPackingText.trim(), 'General');
    setNewPackingText('');
  };

  const handleStartEditPacking = (item, e) => {
    if (e) e.stopPropagation();
    setEditingPackingId(item.id || item._id);
    setEditingPackingText(item.item);
  };

  const handleSaveEditPacking = (itemId, e) => {
    if (e) e.preventDefault();
    if (!editingPackingText.trim()) return;
    if (onEditPackingItem) {
      onEditPackingItem(trip._id || trip.id, itemId, editingPackingText.trim());
    }
    setEditingPackingId(null);
    setEditingPackingText('');
  };

  const handleCancelEditPacking = (e) => {
    if (e) e.stopPropagation();
    setEditingPackingId(null);
    setEditingPackingText('');
  };

  const handleDeletePacking = (itemId, e) => {
    if (e) e.stopPropagation();
    if (onDeletePackingItem) {
      onDeletePackingItem(trip._id || trip.id, itemId);
    }
  };

  const handleAddItinerary = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    onAddItineraryItem(trip._id || trip.id, {
      title: eventTitle.trim(),
      day: Number(eventDay) || 1,
      time: eventTime,
      location: eventLocation.trim(),
      type: eventType,
    });
    setEventTitle('');
    setEventLocation('');
    setShowAddEvent(false);
  };

  // Grouped items
  const flightTickets = tickets.filter((t) => t.ticketType === 'flight');
  const busTickets = tickets.filter((t) => t.ticketType === 'bus');
  const trainTickets = tickets.filter((t) => t.ticketType === 'train');
  const hotelTickets = tickets.filter((t) => t.ticketType === 'hotel');

  const filteredTickets = ticketFilter === 'all'
    ? tickets
    : tickets.filter((t) => t.ticketType === ticketFilter);

  const itineraryItems = trip.itinerary || [];
  const packingList = trip.packingList || [];
  const packedCount = packingList.filter((p) => p.packed).length;
  const packingPercent = packingList.length > 0 ? Math.round((packedCount / packingList.length) * 100) : 0;
  const dateInfo = formatTripDates(trip.startDate, trip.endDate);

  // Main 3 Badges
  const mainBadges = [
    {
      id: 'tickets',
      label: 'Tickets',
      icon: Ticket,
      count: tickets.length,
    },
    {
      id: 'itinerary',
      label: 'Itinerary',
      icon: CalendarCheck,
      count: itineraryItems.length,
    },
    {
      id: 'packing',
      label: 'Packing',
      icon: Luggage,
      count: packingList.length > 0 ? `${packedCount}/${packingList.length}` : '0',
    },
  ];

  // Sub Badges for Tickets (Flight, Bus, Train, Hotel)
  const ticketSubBadges = [
    {
      id: 'all',
      label: 'All',
      icon: Ticket,
      count: tickets.length,
      color: '#475569',
      activeBg: '#1E293B',
      activeShadow: '0 3px 10px rgba(30, 41, 59, 0.25)',
    },
    {
      id: 'flight',
      label: 'Flight',
      icon: Plane,
      count: flightTickets.length,
      color: '#0D9488',
      activeBg: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
      activeShadow: '0 3px 10px rgba(13, 148, 136, 0.3)',
    },
    {
      id: 'bus',
      label: 'Bus',
      icon: Bus,
      count: busTickets.length,
      color: '#EA580C',
      activeBg: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
      activeShadow: '0 3px 10px rgba(234, 88, 12, 0.3)',
    },
    {
      id: 'train',
      label: 'Train',
      icon: Train,
      count: trainTickets.length,
      color: '#059669',
      activeBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      activeShadow: '0 3px 10px rgba(5, 150, 105, 0.3)',
    },
    {
      id: 'hotel',
      label: 'Hotel',
      icon: Hotel,
      count: hotelTickets.length,
      color: '#2563EB',
      activeBg: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      activeShadow: '0 3px 10px rgba(37, 99, 235, 0.3)',
    },
  ];

  // Unique days in itinerary
  const itineraryDays = Array.from(new Set(itineraryItems.map((e) => e.day))).sort((a, b) => a - b);
  const filteredItinerary = selectedDayFilter === 'all'
    ? itineraryItems
    : itineraryItems.filter((e) => e.day === Number(selectedDayFilter));

  // Packing list items
  const filteredPacking = packingList;

  // Label for "+ Add Ticket" button based on current ticket filter
  const getAddTicketType = () => {
    if (ticketFilter === 'all') return 'flight';
    return ticketFilter;
  };

  const getAddTicketLabel = () => {
    switch (ticketFilter) {
      case 'flight': return 'Add Flight';
      case 'bus': return 'Add Bus';
      case 'train': return 'Add Train';
      case 'hotel': return 'Add Hotel';
      default: return 'Add Ticket';
    }
  };

  return (
    <div className="fullscreen-trip-section" role="dialog" aria-modal="true">
      {/* ===================================================================
          1. TRIP VIEW MAIN CARD (HERO BANNER)
          =================================================================== */}
      <div style={{ position: 'relative', height: 215, flexShrink: 0, width: '100%' }}>
        <img
          src={trip.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'}
          alt={trip.destination}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,30,54,0.65) 0%, rgba(15,30,54,0.18) 38%, rgba(15,30,54,0.92) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 16px 14px',
          }}
        >
          {/* Top Row: Back Navigation Button + Country Tag + Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px 7px 10px',
                  borderRadius: 20,
                  background: 'rgba(15, 30, 54, 0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                }}
                title="Back to Trips"
              >
                <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.4} />
                <span>Trips</span>
              </button>

              {trip.country && (
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.4)',
                    color: '#FFFFFF',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '5px 11px',
                    borderRadius: 16,
                    letterSpacing: '0.4px',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {trip.country}
                </span>
              )}
            </div>

            {/* Right Action Icons: Edit, Gallery Photo, Delete, Close */}
            <div style={{ display: 'flex', gap: 8 }}>
              {onEditTrip && (
                <button
                  type="button"
                  onClick={() => onEditTrip(trip)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    background: 'rgba(255, 255, 255, 0.92)',
                    color: '#0F1E36',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                  }}
                  title="Edit Trip & Manage Friends"
                >
                  <Pencil size={15} />
                </button>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: 'rgba(255, 255, 255, 0.92)',
                  color: '#0F1E36',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                }}
                title="Upload Photo from Mobile Gallery"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />

              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete "${trip.title}" and its tickets?`)) {
                    onDeleteTrip(trip._id || trip.id);
                    onClose();
                  }
                }}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                }}
                title="Delete Trip"
              >
                <Trash2 size={16} />
              </button>

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: 'rgba(255, 255, 255, 0.92)',
                  color: '#0F1E36',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Bottom Info: Title + Location & Timeline Date in simple white font (NO BADGE) */}
          <div>
            <h1
              style={{
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1.2,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                margin: '0 0 6px',
              }}
            >
              {trip.title}
            </h1>

            {/* Location followed by timeline date in simple white font */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 6,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 500,
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.7)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color="#2DD4BF" />
                <span>{trip.destination}</span>
              </div>

              {dateInfo.text && (
                <>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span>{dateInfo.text}</span>
                </>
              )}

              {trip.sharedWith && trip.sharedWith.length > 0 && (
                <>
                  <span style={{ opacity: 0.6 }}>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Users size={13} color="#2DD4BF" />
                    <span>{trip.sharedWith.length} {trip.sharedWith.length === 1 ? 'Friend' : 'Friends'}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          2. MAIN 3 BADGES BAR: TICKETS, ITINERARY, PACKING (NO COUNT IN BADGE)
          =================================================================== */}
      <div className="trip-main-badges-bar" role="tablist" aria-label="Main Trip Sections">
        {mainBadges.map((tab) => {
          const Icon = tab.icon;
          const active = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveMainTab(tab.id)}
              className={`trip-main-badge-btn ${active ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          3. SUB-BADGES ROW FOR TICKETS: FLIGHT, BUS, TRAIN, HOTEL
          (Visible whenever the main Tickets badge is active)
          =================================================================== */}
      {activeMainTab === 'tickets' && (
        <div className="ticket-sub-badges-scroll" role="tablist" aria-label="Ticket Categories">
          {ticketSubBadges.map((sub) => {
            const SubIcon = sub.icon;
            const active = ticketFilter === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTicketFilter(sub.id)}
                className="ticket-sub-badge-btn"
                style={{
                  background: active ? sub.activeBg : '#FFFFFF',
                  color: active ? '#FFFFFF' : 'var(--text-secondary)',
                  borderColor: active ? 'transparent' : '#E2E8F0',
                  boxShadow: active ? sub.activeShadow : '0 1px 3px rgba(15, 30, 54, 0.04)',
                }}
              >
                <SubIcon
                  size={14}
                  color={active ? '#FFFFFF' : sub.color}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ===================================================================
          4. SCROLLABLE CONTENT BODY
          =================================================================== */}
      <div className="fullscreen-trip-body">
        {/* ===================== TAB 1: TICKETS ===================== */}
        {activeMainTab === 'tickets' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                {ticketFilter === 'all'
                  ? `All Passes & Tickets (${tickets.length})`
                  : `${ticketFilter.charAt(0).toUpperCase() + ticketFilter.slice(1)} Passes (${filteredTickets.length})`}
              </span>

              <button
                type="button"
                onClick={() => onAddTicket(trip, getAddTicketType())}
                style={{
                  padding: '6px 12px',
                  borderRadius: 12,
                  background: 'var(--teal-ultralight)',
                  color: 'var(--teal-primary)',
                  border: '1px solid var(--teal-light)',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>{getAddTicketLabel()}</span>
              </button>
            </div>

            {filteredTickets.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                  borderRadius: 20,
                  border: '1.5px dashed var(--border-subtle)',
                  boxShadow: '0 2px 10px rgba(15, 30, 54, 0.03)',
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    background: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'var(--teal-primary)',
                  }}
                >
                  <Ticket size={24} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
                  No {ticketFilter === 'all' ? 'tickets' : `${ticketFilter} passes`} added yet
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px', maxWidth: 260, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                  Store your flight boarding pass, train ticket, bus ticket, or hotel reservation.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onAddTicket(trip, getAddTicketType())}
                  style={{ maxWidth: 200, margin: '0 auto', padding: '10px 16px', fontSize: 13 }}
                >
                  <Plus size={15} />
                  <span>{getAddTicketLabel()}</span>
                </button>
              </div>
            ) : (
              filteredTickets.map((tkt) => (
                <TicketCard
                  key={tkt._id || tkt.id}
                  ticket={tkt}
                  onDelete={onDeleteTicket}
                  onShowQR={onShowQR}
                />
              ))
            )}
          </div>
        )}

        {/* ===================== TAB 2: ITINERARY ===================== */}
        {activeMainTab === 'itinerary' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    background: 'var(--teal-ultralight)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(15, 30, 54, 0.05)',
                    color: 'var(--teal-primary)',
                  }}
                >
                  <CalendarCheck size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Day-by-Day Timeline ({itineraryItems.length})
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddEvent(!showAddEvent)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 12,
                  background: 'var(--teal-ultralight)',
                  color: 'var(--teal-primary)',
                  border: '1px solid var(--teal-light)',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
                <span>{showAddEvent ? 'Cancel' : 'Add Activity'}</span>
              </button>
            </div>

            {/* Inline Add Event Form */}
            {showAddEvent && (
              <form
                onSubmit={handleAddItinerary}
                style={{
                  background: '#FFFFFF',
                  padding: 16,
                  borderRadius: 16,
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 16,
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 10 }}>
                  Add New Travel Activity
                </div>
                <div className="form-group">
                  <label className="form-label">Activity Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scuba diving, Sunrise hike, Museum visit"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="form-group">
                    <label className="form-label">Day Number</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={eventDay}
                      onChange={(e) => setEventDay(e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Location (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Pangong Tso Lake or Cafe de Flore"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="form-input"
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: 6 }}>
                  Save to Schedule
                </button>
              </form>
            )}

            {/* Day Filter Chips */}
            {itineraryDays.length > 1 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter('all')}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: 11.5,
                    fontWeight: 700,
                    background: selectedDayFilter === 'all' ? 'var(--teal-primary)' : '#FFFFFF',
                    color: selectedDayFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer',
                  }}
                >
                  All Days
                </button>
                {itineraryDays.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDayFilter(String(d))}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 14,
                      fontSize: 11.5,
                      fontWeight: 700,
                      background: selectedDayFilter === String(d) ? 'var(--teal-primary)' : '#FFFFFF',
                      color: selectedDayFilter === String(d) ? '#FFFFFF' : 'var(--text-secondary)',
                      border: '1px solid #E2E8F0',
                      cursor: 'pointer',
                    }}
                  >
                    Day {d}
                  </button>
                ))}
              </div>
            )}

            {filteredItinerary.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                  borderRadius: 20,
                  border: '1.5px dashed var(--border-subtle)',
                  boxShadow: '0 2px 10px rgba(15, 30, 54, 0.03)',
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    background: 'var(--teal-ultralight)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: 'var(--teal-primary)',
                  }}
                >
                  <CalendarCheck size={24} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 4px' }}>
                  No activities planned yet
                </p>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '0 0 16px', maxWidth: 260, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                  Add your morning sightseeing, evening walks, reservations, and tour timings.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowAddEvent(true)}
                  style={{ maxWidth: 200, margin: '0 auto', padding: '10px 16px', fontSize: 13 }}
                >
                  <Plus size={15} />
                  <span>Add First Activity</span>
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                {/* Vertical Timeline track */}
                <div
                  style={{
                    position: 'absolute',
                    left: 6,
                    top: 10,
                    bottom: 10,
                    width: 2,
                    background: 'var(--border-subtle)',
                  }}
                />
                {filteredItinerary.map((event, idx) => (
                  <div
                    key={event.id || idx}
                    style={{
                      position: 'relative',
                      marginBottom: 14,
                      background: '#FFFFFF',
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1px solid var(--border-subtle)',
                      boxShadow: '0 2px 6px rgba(15, 30, 54, 0.03)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: -18,
                        top: 16,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: 'var(--teal-primary)',
                        border: '2px solid #FFFFFF',
                        boxShadow: '0 0 0 2px var(--teal-light)',
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: 6,
                          background: 'var(--teal-ultralight)',
                          color: 'var(--teal-primary)',
                        }}
                      >
                        Day {event.day} • {event.time || 'Anytime'}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)', marginTop: 4 }}>
                      {event.title}
                    </div>
                    {event.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 12, marginTop: 2 }}>
                        <MapPin size={12} color="var(--text-muted)" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.notes && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                        {event.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: PACKING ===================== */}
        {activeMainTab === 'packing' && (
          <div>
            {/* Packing Progress Card */}
            <div
              style={{
                background: '#FFFFFF',
                padding: 16,
                borderRadius: 16,
                border: '1px solid var(--border-subtle)',
                marginBottom: 14,
                boxShadow: '0 2px 6px rgba(15, 30, 54, 0.03)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Luggage size={16} color="#0284C7" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                    My Luggage Checklist
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#0284C7',
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      padding: '2px 7px',
                      borderRadius: 10,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                    }}
                    title="This packing checklist is personal to you and cannot be viewed or edited by friends on this trip."
                  >
                    <Lock size={10} />
                    <span>Personal</span>
                  </span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0284C7' }}>
                  {packedCount} of {packingList.length} Packed ({packingPercent}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 7, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${packingPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Add item form (simple, clean input + only + icon button) */}
            <form onSubmit={handleAddPacking} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                type="text"
                placeholder="Add an item to pack (e.g. Passport, Power bank)..."
                value={newPackingText}
                onChange={(e) => setNewPackingText(e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '10px 14px', fontSize: 13, borderRadius: 12 }}
              />
              <button
                type="submit"
                className="btn-primary"
                title="Add item"
                aria-label="Add item"
                style={{
                  width: 42,
                  height: 42,
                  padding: 0,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <Plus size={20} strokeWidth={2.4} />
              </button>
            </form>

            {/* Checklist rows */}
            {packingList.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1.5px dashed var(--border-subtle)',
                }}
              >
                <Luggage size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                  No packing items yet
                </p>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Type an item name above and tap + to start your checklist.
                </p>
              </div>
            ) : (
              packingList.map((item) => {
                const itemId = item.id || item._id;
                const isEditing = editingPackingId === itemId;

                return (
                  <div
                    key={itemId}
                    className={`packing-item-row ${item.packed ? 'packed' : ''}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: '#FFFFFF',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: 8,
                      transition: 'all 0.15s ease',
                      gap: 10,
                    }}
                  >
                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveEditPacking(itemId, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingPackingText}
                          onChange={(e) => setEditingPackingText(e.target.value)}
                          autoFocus
                          className="form-input"
                          style={{ flex: 1, padding: '7px 12px', fontSize: 13, borderRadius: 8 }}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') handleCancelEditPacking(e);
                          }}
                        />
                        <button
                          type="submit"
                          title="Save changes"
                          style={{
                            background: '#0284C7',
                            border: 'none',
                            color: '#FFFFFF',
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={15} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditPacking}
                          title="Cancel edit"
                          style={{
                            background: '#F1F5F9',
                            border: 'none',
                            color: '#64748B',
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={15} strokeWidth={2.5} />
                        </button>
                      </form>
                    ) : (
                      <>
                        {/* Checkbox & Item Label */}
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}
                          onClick={() => handlePackingToggle(itemId, item.packed)}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              border: item.packed ? '1.5px solid #0284C7' : '1.5px solid #CBD5E1',
                              background: item.packed ? '#0284C7' : '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFFFFF',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {item.packed && <Check size={13} strokeWidth={3} />}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: item.packed ? 500 : 600,
                              color: item.packed ? 'var(--text-muted)' : 'var(--text-main)',
                              textDecoration: item.packed ? 'line-through' : 'none',
                              wordBreak: 'break-word',
                            }}
                          >
                            {item.item}
                          </span>
                        </div>

                        {/* Action buttons: Edit & Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={(e) => handleStartEditPacking(item, e)}
                            title="Edit item"
                            aria-label={`Edit ${item.item}`}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#64748B',
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease, color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F1F5F9';
                              e.currentTarget.style.color = '#0284C7';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#64748B';
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePacking(itemId, e)}
                            title="Delete item"
                            aria-label={`Delete ${item.item}`}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#94A3B8',
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease, color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#FEE2E2';
                              e.currentTarget.style.color = '#EF4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = '#94A3B8';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
