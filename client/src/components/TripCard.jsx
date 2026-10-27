import React from 'react';
import { MapPin, Plane, Calendar, CheckCircle2, MoreVertical, Users } from 'lucide-react';

function formatTripDates(startStr, endStr) {
  if (!startStr) return '';
  try {
    const s = new Date(startStr);
    if (isNaN(s.getTime())) return startStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sD = s.getDate();
    const sM = months[s.getMonth()];
    const sY = s.getFullYear();

    if (!endStr) return `${sD} ${sM} ${sY}`;
    const e = new Date(endStr);
    if (isNaN(e.getTime())) return `${sD} ${sM} ${sY}`;
    const eD = e.getDate();
    const eM = months[e.getMonth()];
    const eY = e.getFullYear();

    if (sY === eY && sM === eM) {
      return `${sD} – ${eD} ${sM} ${sY}`;
    } else if (sY === eY) {
      return `${sD} ${sM} – ${eD} ${eM} ${sY}`;
    }
    return `${sD} ${sM} ${sY} – ${eD} ${eM} ${eY}`;
  } catch {
    return startStr;
  }
}

function getTripDuration(startStr, endStr) {
  if (!startStr || !endStr) return null;
  try {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    return `${diff} Day${diff > 1 ? 's' : ''}`;
  } catch {
    return null;
  }
}

export default function TripCard({ trip, onClick, onEdit }) {
  const getCountdownInfo = (startDateStr, endDateStr) => {
    if (!startDateStr) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    const end = endDateStr ? new Date(endDateStr) : start;
    end.setHours(23, 59, 59, 999);

    const diffTime = start.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      return {
        label: `${diffDays} DAYS TO GO`,
        type: 'upcoming',
        dotColor: '#2DD4BF',
        glow: '0 0 8px rgba(45, 212, 191, 0.85)',
      };
    } else if (diffDays === 1) {
      return {
        label: 'DEPARTS TOMORROW',
        type: 'upcoming',
        dotColor: '#2DD4BF',
        glow: '0 0 8px rgba(45, 212, 191, 0.85)',
      };
    } else if (now <= end) {
      return {
        label: 'HAPPENING NOW',
        type: 'active',
        dotColor: '#10B981',
        glow: '0 0 8px rgba(16, 185, 129, 0.85)',
      };
    } else {
      return {
        label: 'COMPLETED',
        type: 'completed',
        dotColor: '#10B981',
        glow: 'none',
      };
    }
  };

  const countdown = getCountdownInfo(trip.startDate, trip.endDate);
  const isCompleted = countdown?.type === 'completed';
  const datesText = formatTripDates(trip.startDate, trip.endDate);
  const durationText = getTripDuration(trip.startDate, trip.endDate);

  return (
    <div
      className="trip-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick && onClick();
        }
      }}
      style={{
        cursor: 'pointer',
        borderRadius: 22,
        overflow: 'hidden',
        border: isCompleted ? '1px solid rgba(226, 232, 240, 0.9)' : '1px solid var(--border-subtle)',
        background: '#FFFFFF',
        boxShadow: isCompleted ? '0 4px 16px rgba(15, 30, 54, 0.04)' : '0 6px 20px rgba(15, 30, 54, 0.08)',
        marginBottom: 16,
        position: 'relative',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
      }}
    >
      {/* Hero Visual Container */}
      <div style={{ position: 'relative', height: isCompleted ? 175 : 195, overflow: 'hidden' }}>
        <img
          src={trip.coverImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'}
          alt={trip.destination || trip.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isCompleted ? 'saturate(0.85) contrast(1.02)' : 'none',
            transition: 'transform 0.35s ease',
          }}
          loading="lazy"
        />

        {/* Dynamic Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isCompleted
              ? 'linear-gradient(180deg, rgba(15, 30, 54, 0.35) 0%, rgba(15, 30, 54, 0.15) 30%, rgba(15, 30, 54, 0.88) 100%)'
              : 'linear-gradient(180deg, rgba(15, 30, 54, 0.3) 0%, rgba(15, 30, 54, 0.12) 35%, rgba(15, 30, 54, 0.86) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px 16px',
          }}
        >
          {/* Top Row: Status Badge & Country / Pill */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {isCompleted ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                  border: '1.5px solid rgba(255, 255, 255, 0.55)',
                  padding: '5px 12px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(6, 95, 70, 0.4)',
                }}
              >
                <CheckCircle2 size={13.5} color="#A7F3D0" strokeWidth={2.8} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.7px',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  COMPLETED
                </span>
              </div>
            ) : countdown ? (
              <div
                style={{
                  background: 'rgba(15, 30, 54, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  padding: '5px 12px',
                  borderRadius: 20,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                }}
              >
                <Plane size={13.5} color="#2DD4BF" strokeWidth={2.5} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.7px',
                    color: '#FFFFFF',
                    textTransform: 'uppercase',
                    textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {countdown.label}
                </span>
              </div>
            ) : <div />}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {trip.sharedWith && trip.sharedWith.length > 0 && (
                <span
                  title={`Shared with ${trip.sharedWith.length} friends`}
                  style={{
                    background: 'rgba(15, 30, 54, 0.45)',
                    border: '1px solid rgba(45, 212, 191, 0.45)',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                  }}
                >
                  <Users size={11} color="#2DD4BF" />
                  <span>{trip.sharedWith.length}</span>
                </span>
              )}

              {/* 3-dots Edit Button in Right Top Corner */}
              <button
                type="button"
                aria-label="Edit Trip"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit && onEdit(trip);
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit && onEdit(trip);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  background: 'rgba(15, 30, 54, 0.55)',
                  border: '1.5px solid rgba(255, 255, 255, 0.65)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
                  zIndex: 5,
                }}
                title="Edit Trip & Manage Friends"
              >
                <MoreVertical size={18} color="#FFFFFF" strokeWidth={2.4} />
              </button>
            </div>
          </div>

          {/* Bottom Area: Trip Title and Destination */}
          <div>
            <h3
              style={{
                color: '#FFFFFF',
                fontFamily: 'var(--font-heading)',
                fontSize: 19,
                fontWeight: 800,
                lineHeight: 1.25,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.55)',
                margin: '0 0 6px',
              }}
            >
              {trip.title}
            </h3>

            {/* Destination info row with Country */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <MapPin size={14} color="#FFFFFF" style={{ flexShrink: 0 }} />
                <span style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                  {trip.destination}
                </span>
              </div>

              {trip.country && !trip.destination?.toLowerCase().includes(trip.country.toLowerCase()) && (
                <>
                  <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 11 }}>•</span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      color: '#FFFFFF',
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.3px',
                      textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                    }}
                  >
                    {trip.country}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
