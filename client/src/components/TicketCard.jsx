import React, { useState, useRef } from 'react';
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
  Clock,
} from 'lucide-react';

export default function TicketCard({ ticket, onDelete, onShowQR }) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalSwipeRef = useRef(null);
  const currentOffsetRef = useRef(0);
  const isMouseDownRef = useRef(false);

  const SNAP_THRESHOLD = 70; // px to reveal delete button
  const FULL_DELETE_THRESHOLD = 160; // px for direct swipe-to-delete

  const triggerDelete = () => {
    const id = ticket._id || ticket.id;
    if (onDelete && id) {
      setOffsetX(-400); // smooth slide-out animation
      setTimeout(() => {
        onDelete(id);
      }, 220);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    triggerDelete();
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentOffsetRef.current = offsetX;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;

    // Detect direction on first few movements
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 6 || Math.abs(diffY) > 6) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current === false) {
      return; // allow normal vertical page scrolling
    }

    if (isHorizontalSwipeRef.current === true) {
      let newOffset = currentOffsetRef.current + diffX;
      if (newOffset > 10) newOffset = 10;
      if (newOffset < -220) newOffset = -220;
      setOffsetX(newOffset);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (isHorizontalSwipeRef.current === true) {
      if (offsetX < -FULL_DELETE_THRESHOLD) {
        triggerDelete();
      } else if (offsetX < -SNAP_THRESHOLD) {
        setOffsetX(-90);
      } else {
        setOffsetX(0);
      }
    }
    isHorizontalSwipeRef.current = null;
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    isMouseDownRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentOffsetRef.current = offsetX;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current) return;
    const diffX = e.clientX - startXRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 5) {
        isHorizontalSwipeRef.current = true;
      }
    }

    if (isHorizontalSwipeRef.current === true) {
      let newOffset = currentOffsetRef.current + diffX;
      if (newOffset > 10) newOffset = 10;
      if (newOffset < -220) newOffset = -220;
      setOffsetX(newOffset);
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      handleTouchEnd();
    }
  };
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

  const formatHourMin = (timeStr) => {
    if (!timeStr) return '';
    const match = String(timeStr).match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const meridiem = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return `${String(h).padStart(2, '0')}:${m} ${meridiem}`;
    }
    return timeStr;
  };

  const getLayoverDisplay = (t) => {
    if (!t.legs || t.legs.length < 2) {
      return t.layoverInfo || 'Layover';
    }

    const leg1 = t.legs[0];
    const leg2 = t.legs[1];

    const layoverCode = leg1.destinationCode || leg2.originCode || 'Transfer';
    const rawCity = leg1.destinationName || leg2.originName || '';

    let durationText = '';
    const t1 = leg1.arrivalTime;
    const t2 = leg2.departureTime;

    if (t1 && t2) {
      const parseTimeToMins = (str) => {
        const m = String(str).match(/(\d{1,2}):(\d{2})/);
        return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
      };
      const m1 = parseTimeToMins(t1);
      const m2 = parseTimeToMins(t2);
      if (m1 !== null && m2 !== null) {
        let diff = m2 - m1;
        if (diff < 0) diff += 24 * 60;
        const h = Math.floor(diff / 60);
        const mins = diff % 60;
        durationText = `${h > 0 ? `${h}h ` : ''}${mins > 0 ? `${mins}m` : ''}`.trim();
      }
    }

    if (!durationText && t.layoverInfo) {
      const durMatch = t.layoverInfo.match(/(\d+\s*h(?:our)?s?(?:\s*\d+\s*m(?:in)?)?|\d+\s*m(?:in)?)/i);
      if (durMatch) {
        durationText = durMatch[0];
      }
    }

    let cleanCity = '';
    if (rawCity) {
      const first = rawCity.split(/[\s,]+/)[0].replace(/[^a-zA-Z]/g, '');
      if (first) {
        cleanCity = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
      }
    }
    const locationPart = cleanCity ? `${cleanCity} (${layoverCode})` : layoverCode;

    if (durationText) {
      return `${durationText} layover in ${locationPart}`;
    }
    return `Layover in ${locationPart}`;
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
    if (lower.includes('air India') || lower.includes('air india')) return 'Air India';
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

  const getSeatText = (t) => {
    if (t.legs && t.legs.length > 1) {
      const seats = t.legs.map((l) => l.seat).filter(Boolean);
      if (seats.length > 1) {
        return `Seats: ${seats.join(', ')}`;
      }
      if (seats.length === 1) {
        return `Seat: ${seats[0]}`;
      }
    }
    if (t.seat) {
      return `Seat: ${t.seat}`;
    }
    if (t.gate) {
      return `Gate: ${t.gate}`;
    }
    return `Seat: Assigned`;
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

  const handleLocationClick = (e, point = 'origin', customLoc = '') => {
    e.stopPropagation();
    let query = customLoc;
    if (!query) {
      query = getTicketLocationQuery(ticket, point);
    } else {
      if (ticket.ticketType === 'flight' && !/airport|aerodrome|terminal/i.test(query)) {
        query = `${query} Airport`;
      }
    }
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const hasConnecting = Boolean(ticket.isConnectingFlight || (ticket.legs && ticket.legs.length > 1));

  return (
    <div
      className="ticket-swipe-container"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 20,
        marginBottom: 18,
        userSelect: 'none',
      }}
    >
      {/* Background Delete Action revealed upon swiping left */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #F87171 0%, #EF4444 60%, #DC2626 100%)',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 22,
          zIndex: 1,
        }}
      >
        <button
          type="button"
          onClick={handleDeleteClick}
          aria-label="Delete ticket"
          title="Delete ticket"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '10px 14px',
            transform: `scale(${Math.min(1.15, Math.max(0.8, Math.abs(offsetX) / 90))})`,
            transition: 'transform 0.15s ease',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            }}
          >
            <Trash2 size={20} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.2px' }}>
            Delete
          </span>
        </button>
      </div>

      {/* Front Ticket Card */}
      <div
        className="ticket-card"
        style={{
          position: 'relative',
          zIndex: 2,
          marginBottom: 0,
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onClick={(e) => {
          if (offsetX !== 0) {
            e.stopPropagation();
            setOffsetX(0);
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >

      {/* 1. Top Header: Clean, modern airline header with NO PNR for flights */}
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

          {ticket.ticketType === 'flight' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span>{getFlightCompany(ticket)}</span>
              {hasConnecting ? (
                <>
                  <span style={{ color: '#CBD5E1' }}>•</span>
                  <span style={{ color: '#64748B', fontWeight: 500, fontSize: 12.5 }}>
                    Connecting ({ticket.legs?.length || 2} Flights)
                  </span>
                </>
              ) : (
                <>
                  {getFlightNumber(ticket) && (
                    <span style={{ color: '#64748B', fontWeight: 600 }}>({getFlightNumber(ticket)})</span>
                  )}
                  {ticket.classType && (
                    <>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ color: '#64748B', fontWeight: 500, fontSize: 12 }}>{ticket.classType}</span>
                    </>
                  )}
                </>
              )}
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

      {/* 2. Route Display:
          - If connecting flight: directly showcases both flights as main flights with layover time in between
          - If direct flight or train/bus/hotel: showcases single route point layout */}
      {hasConnecting && ticket.legs && ticket.legs.length > 1 ? (
        <div style={{ padding: '16px 20px 14px' }}>
          {ticket.legs.map((leg, idx) => (
            <React.Fragment key={idx}>
              {/* Interstitial Layover Bar in between the 2 flights */}
              {idx > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    margin: '14px 0',
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1, borderTop: '1px dashed #CBD5E1' }} />
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 12px',
                      borderRadius: 20,
                      background: '#FEF3C7',
                      border: '1px solid #FDE68A',
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: '#92400E',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Clock size={12} color="#D97706" />
                    <span>{getLayoverDisplay(ticket)}</span>
                  </div>
                  <div style={{ flex: 1, borderTop: '1px dashed #CBD5E1' }} />
                </div>
              )}

              {/* Main Flight Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                {/* Origin Point */}
                <div
                  className="route-point"
                  onClick={(e) => handleLocationClick(e, 'origin', leg.originCode || leg.originName)}
                  title={`Open ${leg.originName || leg.originCode} on Google Maps`}
                  style={{ cursor: 'pointer', minWidth: 70 }}
                >
                  <span className="airport-code" style={{ fontSize: 23, color: '#334155' }}>
                    {leg.originCode || (leg.originName ? leg.originName.slice(0, 3).toUpperCase() : 'DEP')}
                  </span>
                  <span className="airport-city" style={{ maxWidth: 100 }}>
                    {leg.originName || 'Departure'}
                  </span>
                  <span className="route-time" style={{ fontSize: 14 }}>
                    {formatHourMin(leg.departureTime) || depTime}
                  </span>
                </div>

                {/* Flight Path Center with Clean Flight Number, Plane Icon on Path & Date */}
                <div
                  className="route-flight-path"
                  style={{ padding: '0 8px', flex: 1, maxWidth: 190 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0D9488',
                        letterSpacing: '0.4px',
                      }}
                    >
                      {leg.flightNumber || `Flight ${idx + 1}`}
                    </span>
                    {leg.seat && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#64748B',
                        }}
                      >
                        • Seat {leg.seat}
                      </span>
                    )}
                  </div>

                  <div className="path-line-container" style={{ width: '100%', height: 16 }}>
                    <div className="path-line" />
                    <div
                      className="path-icon"
                      style={{
                        color: '#0D9488',
                        padding: '0 6px',
                        background: '#FFFFFF',
                      }}
                    >
                      <Plane size={13} style={{ transform: 'rotate(90deg)' }} />
                    </div>
                  </div>

                  <div className="route-date-pill" style={{ marginTop: 4 }}>
                    {idx === 0 ? dateStr : (leg.departureDate ? formatTicketDate(leg.departureDate) : dateStr)}
                  </div>
                </div>

                {/* Destination Point */}
                <div
                  className="route-point right"
                  onClick={(e) => handleLocationClick(e, 'destination', leg.destinationCode || leg.destinationName)}
                  title={`Open ${leg.destinationName || leg.destinationCode} on Google Maps`}
                  style={{ cursor: 'pointer', minWidth: 70 }}
                >
                  <span className="airport-code" style={{ fontSize: 23, color: '#334155' }}>
                    {leg.destinationCode || (leg.destinationName ? leg.destinationName.slice(0, 3).toUpperCase() : 'ARR')}
                  </span>
                  <span className="airport-city" style={{ maxWidth: 100 }}>
                    {leg.destinationName || 'Arrival'}
                  </span>
                  <span className="route-time" style={{ fontSize: 14 }}>
                    {formatHourMin(leg.arrivalTime) || arrTime}
                  </span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      ) : (
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
      )}

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

          {/* Seat Info */}
          <span style={{ color: '#64748B', fontWeight: 600, fontSize: 12 }}>
            {getSeatText(ticket)}
          </span>
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
  </div>
);
}
