import React from 'react';
import {
  Plane,
  Train,
  Bus,
  Building2,
  Ticket as TicketIcon,
  Car,
  Ship,
  Trash2,
  MapPin,
} from 'lucide-react';

export default function TicketCard({ ticket, onDelete, onShowQR }) {
  const getIcon = (type, size = 16) => {
    switch (type) {
      case 'flight':
        return <Plane size={size} style={{ transform: 'rotate(90deg)' }} />;
      case 'train':
        return <Train size={size} />;
      case 'bus':
        return <Bus size={size} />;
      case 'hotel':
        return <Building2 size={size} />;
      case 'event':
        return <TicketIcon size={size} />;
      case 'car_rental':
        return <Car size={size} />;
      case 'ferry':
        return <Ship size={size} />;
      default:
        return <TicketIcon size={size} />;
    }
  };

  const formatTimeOnly = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) {
        if (/^\d{1,2}:\d{2}/.test(isoStr)) return isoStr;
        return '';
      }
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  const formatTicketDate = (isoStr) => {
    if (!isoStr) return 'Date TBD';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return isoStr;
    }
  };

  const getDepartureTime = (t) => {
    if (t.departureDateTime) {
      const ft = formatTimeOnly(t.departureDateTime);
      if (ft) return ft;
    }
    if (t.departureTime) return t.departureTime;
    return t.ticketType === 'hotel' ? '03:00 PM' : '10:30 AM';
  };

  const getArrivalTime = (t) => {
    if (t.arrivalDateTime) {
      const ft = formatTimeOnly(t.arrivalDateTime);
      if (ft) return ft;
    }
    if (t.arrivalTime) return t.arrivalTime;
    if (t.ticketType === 'hotel') return '11:00 AM';
    if (t.departureDateTime) {
      try {
        const d = new Date(t.departureDateTime);
        if (!isNaN(d.getTime())) {
          const offsetHours = t.ticketType === 'flight' ? 4 : t.ticketType === 'bus' ? 4 : 3;
          const arrD = new Date(d.getTime() + offsetHours * 60 * 60 * 1000);
          return arrD.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        }
      } catch (e) {}
    }
    return '02:30 PM';
  };

  const isHotel = ticket.ticketType === 'hotel';
  const depTime = getDepartureTime(ticket);
  const arrTime = getArrivalTime(ticket);
  const dateStr = formatTicketDate(ticket.departureDateTime);

  const getFlightNumber = (t) => {
    if (!t) return 'Flight';
    const match = (t.title || '').match(/\b([A-Z0-9]{2}[ -]?\d{2,4})\b/i);
    if (match) return match[1].toUpperCase();
    if (t.referenceNumber) {
      const refMatch = t.referenceNumber.match(/\b([A-Z0-9]{2}[ -]?\d{2,4})\b/i);
      if (refMatch) return refMatch[1].toUpperCase();
      return t.referenceNumber;
    }
    return t.referenceNumber || t.title;
  };

  const getFlightCompany = (t) => {
    if (t.provider) return t.provider;
    const lower = (t.title || '').toLowerCase();
    if (lower.includes('japan airlines') || lower.includes('jal')) return 'Japan Airlines';
    if (lower.includes('air india')) return 'Air India';
    if (lower.includes('indigo')) return 'IndiGo';
    if (lower.includes('singapore airlines') || lower.includes('sq')) return 'Singapore Airlines';
    if (lower.includes('emirates')) return 'Emirates';
    if (lower.includes('vistara')) return 'Vistara';
    if (lower.includes('spicejet')) return 'SpiceJet';
    return t.title ? t.title.split(' ').slice(0, 2).join(' ') : 'Airline';
  };

  const getPnrNumber = (t) => {
    if (!t) return '';
    const raw = t.referenceNumber || t.pnr || '2918471049';
    return String(raw).replace(/^PNR[-:\s]*/i, '').trim();
  };

  const getSeatNumber = (t) => {
    return t.seat || 'Assigned';
  };

  const getTicketLocationQuery = (t, point = 'origin') => {
    if (!t) return 'Airport';

    // 1. Hotels: hotel name/title is the physical destination
    if (t.ticketType === 'hotel') {
      const hotelName = t.title || t.provider || 'Hotel';
      return hotelName.replace(/check-in[:\s]*[\d:]+/i, '').trim() || 'Hotel';
    }

    // 2. Flights, Trains, Buses:
    let loc = '';
    if (point === 'destination') {
      loc = t.destinationAirport || t.destinationName || t.destinationCode || t.title || '';
    } else {
      loc = t.originAirport || t.originName || t.originCode || t.destinationName || t.title || '';
    }

    // Fallback if placeholder
    if (/check-in|check-out/i.test(loc)) {
      loc = t.destinationName || t.title || '';
    }

    // Enhance query for Google Maps accuracy
    if (t.ticketType === 'flight') {
      if (!/airport|aerodrome|terminal/i.test(loc)) {
        loc = `${loc} Airport`;
      }
    } else if (t.ticketType === 'train') {
      if (!/station|railway|junction|terminal|cantt/i.test(loc)) {
        loc = `${loc} Railway Station`;
      }
    } else if (t.ticketType === 'bus') {
      if (!/bus|isbt|stand|station|stop/i.test(loc)) {
        loc = `${loc} Bus Station`;
      }
    }

    return loc.trim();
  };

  const handleLocationClick = (e, point = 'origin') => {
    e.stopPropagation();
    const query = getTicketLocationQuery(ticket, point);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="ticket-card">

      {/* 1. Top Header: Airline & PNR in simple font (NO PILL), Filled Orange Location Icon on right */}
      <div className="ticket-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <span
            style={{
              color: ticket.ticketType === 'train' ? '#059669' : ticket.ticketType === 'bus' ? '#D97706' : ticket.ticketType === 'hotel' ? '#2563EB' : '#0D9488',
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {getIcon(ticket.ticketType, 16)}
          </span>

          {/* Simple font: Airline & PNR value directly, with NO pill and no 'PNR' text */}
          {ticket.ticketType === 'flight' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{getFlightCompany(ticket)} {getFlightNumber(ticket) ? `(${getFlightNumber(ticket)})` : ''}</span>
              <span style={{ color: '#94A3B8', fontWeight: 500 }}>•</span>
              <span style={{ color: '#64748B', fontWeight: 500 }}>{getPnrNumber(ticket)}</span>
            </div>
          ) : (ticket.ticketType === 'train' || ticket.ticketType === 'bus') ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{ticket.provider || (ticket.ticketType === 'train' ? 'Train' : 'Bus')}</span>
              <span style={{ color: '#94A3B8', fontWeight: 500 }}>•</span>
              <span style={{ color: '#64748B', fontWeight: 500 }}>{getPnrNumber(ticket)}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{ticket.provider || ticket.title}</span>
              <span style={{ color: '#94A3B8', fontWeight: 500 }}>•</span>
              <span style={{ color: '#64748B', fontWeight: 500 }}>{getPnrNumber(ticket)}</span>
            </div>
          )}
        </div>

        {/* Location Pin Icon: redirects to Google Maps for ticket location */}
        <button
          type="button"
          onClick={(e) => handleLocationClick(e, 'origin')}
          title={`Open ${getTicketLocationQuery(ticket, 'origin')} in Google Maps`}
          aria-label={`Open ${getTicketLocationQuery(ticket, 'origin')} in Google Maps`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            background: 'none',
            border: 'none',
            padding: 4,
            borderRadius: 8,
            transition: 'transform 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15)';
            e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C7.58172 2 4 5.58172 4 10C4 15.25 12 22 12 22C12 22 20 15.25 20 10C20 5.58172 16.4183 2 12 2ZM12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10C15 11.6569 13.6569 13 12 13Z"
              fill="#F97316"
            />
          </svg>
        </button>
      </div>

      {/* 2. Route Display: Big Departure Time under Origin, Big Arrival Time under Destination,
          Vehicle Icon on line & Green Date Pill cleanly separated underneath */}
      <div className="ticket-route">
        <div
          className="route-point"
          onClick={(e) => !isHotel && handleLocationClick(e, 'origin')}
          title={!isHotel ? `Open ${ticket.originName || 'Departure'} on Google Maps` : undefined}
          style={{ cursor: !isHotel ? 'pointer' : 'default' }}
        >
          <span className="airport-code">{ticket.originCode || (isHotel ? 'IN' : 'DEP')}</span>
          <span className="airport-city">{ticket.originName || (isHotel ? 'Check-in' : 'Departure')}</span>
          <span className="route-time">{depTime}</span>
        </div>

        <div className="route-flight-path">
          <div className="path-line-container">
            <div className="path-line" />
            <div className="path-icon">{getIcon(ticket.ticketType, 15)}</div>
          </div>
          <div className="route-date-pill">
            {dateStr}
          </div>
        </div>

        <div
          className="route-point right"
          onClick={(e) => !isHotel && handleLocationClick(e, 'destination')}
          title={!isHotel ? `Open ${ticket.destinationName || 'Arrival'} on Google Maps` : undefined}
          style={{ cursor: !isHotel ? 'pointer' : 'default' }}
        >
          <span className="airport-code">{ticket.destinationCode || (isHotel ? 'OUT' : 'ARR')}</span>
          <span className="airport-city">{ticket.destinationName || (isHotel ? 'Check-out' : 'Arrival')}</span>
          <span className="route-time">{arrTime}</span>
        </div>
      </div>

      {/* 3. Authentic Ticket Perforation with Left & Right Cutout Notches */}
      <div className="ticket-perforation">
        <div className="ticket-notch notch-left" />
        <div className="ticket-tear-line" />
        <div className="ticket-notch notch-right" />
      </div>

      {/* 4. Bottom Ticket Stub: Mini Barcode & Seat info on left, View Ticket button on right */}
      <div className="ticket-stub-footer">
        {/* Left Side: Mini Barcode & Seat info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Authentic Mini Barcode pattern */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              height: 18,
              opacity: 0.45,
            }}
            title="Ticket Security Barcode"
          >
            <span style={{ width: 2, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 1, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 3, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 1, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 2, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 4, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 1, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 3, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 2, height: 16, background: '#1E293B', display: 'inline-block' }} />
            <span style={{ width: 1, height: 16, background: '#1E293B', display: 'inline-block' }} />
          </div>

          {/* Seat Info with matching label and value color */}
          {ticket.seat ? (
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: 12 }}>
              <span>Seat:</span>{' '}
              <span>{getSeatNumber(ticket)}</span>
            </span>
          ) : ticket.gate ? (
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: 12 }}>
              <span>Gate:</span>{' '}
              <span>{ticket.gate}</span>
            </span>
          ) : (
            <span style={{ color: '#64748B', fontWeight: 600, fontSize: 12 }}>
              <span>Seat: Assigned</span>
            </span>
          )}
        </div>

        {/* Right Side: Small View Ticket Button */}
        <button
          type="button"
          className="view-ticket-small-btn"
          onClick={() => onShowQR && onShowQR(ticket)}
          title="View Ticket"
          style={{ flexShrink: 0 }}
        >
          <TicketIcon size={14} />
          <span>View Ticket</span>
        </button>
      </div>
    </div>
  );
}
