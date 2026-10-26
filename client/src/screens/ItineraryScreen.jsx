import React from 'react';
import { Calendar, Clock, MapPin, Plane, Train, Building2, Ticket, ArrowRight } from 'lucide-react';

export default function ItineraryScreen({ trips = [], tickets = [], onSelectTrip }) {
  // Aggregate all events
  const timelineEvents = [];

  // 1. Add tickets with departure times
  tickets.forEach((t) => {
    if (t.departureDateTime) {
      timelineEvents.push({
        id: 'tkt_' + (t._id || t.id),
        date: t.departureDateTime.split('T')[0],
        time: t.departureDateTime.split('T')[1] || '09:00',
        title: `${t.title} (${t.originCode || 'DEP'} → ${t.destinationCode || 'ARR'})`,
        subtitle: t.provider || 'Transit Pass',
        location: `${t.originName || ''} - Seat ${t.seat || 'Assigned'}`,
        type: t.ticketType || 'flight',
        tripTitle: t.tripTitle,
        tripId: t.tripId,
        rawTicket: t,
      });
    }
  });

  // 2. Add trip itinerary activities
  trips.forEach((trip) => {
    (trip.itinerary || []).forEach((item) => {
      timelineEvents.push({
        id: 'it_' + (item.id || Math.random()),
        date: item.date || trip.startDate,
        time: item.time || '10:00',
        title: item.title,
        subtitle: `Day ${item.day} • ${trip.title}`,
        location: item.location || trip.destination,
        type: item.type || 'activity',
        tripTitle: trip.title,
        tripId: trip._id || trip.id,
      });
    });
  });

  // Sort chronologically
  timelineEvents.sort((a, b) => {
    const dComp = (a.date || '').localeCompare(b.date || '');
    if (dComp !== 0) return dComp;
    return (a.time || '').localeCompare(b.time || '');
  });

  const getEventIcon = (type) => {
    switch (type) {
      case 'flight':
        return <Plane size={15} color="#0D9488" />;
      case 'train':
        return <Train size={15} color="#059669" />;
      case 'hotel':
        return <Building2 size={15} color="#2563EB" />;
      default:
        return <Clock size={15} color="#D97706" />;
    }
  };

  const formatDateHeader = (dStr) => {
    if (!dStr) return 'Upcoming';
    try {
      const d = new Date(dStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          Master Itinerary Schedule
        </h2>
        <p style={{ fontSize: 12, color: 'var(--teal-primary)', fontWeight: 600, margin: '2px 0 0' }}>
          Chronological timeline of all your flights, trains, hotels, and activities.
        </p>
      </div>

      {timelineEvents.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1.5px dashed var(--border-subtle)',
          }}
        >
          <Calendar size={38} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
          <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            No scheduled events yet
          </h4>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            As you add boarding passes and day-by-day activities to your trips, your complete travel timeline will appear here.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 18 }}>
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

          {timelineEvents.map((evt, idx) => (
            <div
              key={evt.id || idx}
              style={{
                position: 'relative',
                marginBottom: 16,
                background: '#FFFFFF',
                padding: '14px 16px',
                borderRadius: 16,
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-subtle)',
              }}
            >
              {/* Dot */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {getEventIcon(evt.type)}
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {formatDateHeader(evt.date)} • {evt.time}
                  </span>
                </div>

                {evt.tripTitle && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 6,
                      background: '#F0FDFA',
                      color: 'var(--teal-primary)',
                    }}
                  >
                    {evt.tripTitle.slice(0, 18)}
                  </span>
                )}
              </div>

              <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-main)', marginTop: 6 }}>
                {evt.title}
              </div>

              {evt.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12, marginTop: 4 }}>
                  <MapPin size={13} color="var(--text-muted)" />
                  <span>{evt.location}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
