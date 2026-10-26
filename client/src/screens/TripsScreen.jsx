import React, { useState } from 'react';
import { Compass, Plus, Sparkles, Search, CheckCircle2, Calendar } from 'lucide-react';
import TripCard from '../components/TripCard';

export default function TripsScreen({
  trips = [],
  tickets = [],
  onSelectTrip,
  onOpenAddTrip,
  onEditTrip,
  onOpenAuth,
  user,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('upcoming'); // 'upcoming' | 'completed'

  // Helper to determine if trip is completed
  const isTripCompleted = (trip) => {
    if (trip.status === 'completed') return true;
    if (!trip.endDate) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(trip.endDate);
    end.setHours(23, 59, 59, 999);
    return end < now;
  };

  // Group trips into upcoming and completed
  const upcomingTrips = trips.filter((t) => !isTripCompleted(t));
  const completedTrips = trips.filter((t) => isTripCompleted(t));

  const currentList = statusFilter === 'upcoming' ? upcomingTrips : completedTrips;

  // Filter with search query
  const filteredTrips = currentList.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.destination && t.destination.toLowerCase().includes(q)) ||
      (t.country && t.country.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Greetings banner without total trips badge */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F1E36 0%, #1E293B 100%)',
          borderRadius: 22,
          padding: '20px 20px 18px',
          color: '#FFFFFF',
          marginBottom: 16,
          boxShadow: '0 8px 24px rgba(15, 30, 54, 0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -20,
            bottom: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13,148,136,0.3) 0%, rgba(13,148,136,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Sparkles size={14} color="#2DD4BF" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2DD4BF', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Mobile Travel Nest
          </span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 21, fontWeight: 800, margin: '2px 0 6px' }}>
          {user ? `Hi, ${user.name.split(' ')[0]}!` : 'Welcome to TripNest'}
        </h2>
        <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
          Keep every boarding pass, hotel stay, and itinerary organized in one place.
        </p>
      </div>

      {/* Filter Tabs: Upcoming Trips vs Completed Trips (Simple, No Box) */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          borderBottom: '1.5px solid var(--border-subtle)',
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => setStatusFilter('upcoming')}
          style={{
            padding: '8px 0 10px',
            fontSize: 14,
            fontWeight: statusFilter === 'upcoming' ? 700 : 500,
            color: statusFilter === 'upcoming' ? 'var(--teal-primary)' : 'var(--text-secondary)',
            borderBottom: statusFilter === 'upcoming' ? '2.5px solid var(--teal-primary)' : '2.5px solid transparent',
            marginBottom: -1.5,
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color 0.15s ease',
          }}
        >
          <span>Upcoming Trips</span>
          <span style={{ fontSize: 12, opacity: statusFilter === 'upcoming' ? 1 : 0.65 }}>
            ({upcomingTrips.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          style={{
            padding: '8px 0 10px',
            fontSize: 14,
            fontWeight: statusFilter === 'completed' ? 700 : 500,
            color: statusFilter === 'completed' ? 'var(--teal-primary)' : 'var(--text-secondary)',
            borderBottom: statusFilter === 'completed' ? '2.5px solid var(--teal-primary)' : '2.5px solid transparent',
            marginBottom: -1.5,
            background: 'transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color 0.15s ease',
          }}
        >
          <span>Completed Trips</span>
          <span style={{ fontSize: 12, opacity: statusFilter === 'completed' ? 1 : 0.65 }}>
            ({completedTrips.length})
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          placeholder={`Search ${statusFilter} trips...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingLeft: 36, paddingRight: 12, height: 42, fontSize: 13, borderRadius: 14 }}
        />
      </div>

      {/* Trips List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            {statusFilter === 'upcoming' ? 'Upcoming & Active Journeys' : 'Past Travel Memories'}
          </h3>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
            {filteredTrips.length} {filteredTrips.length === 1 ? 'Trip' : 'Trips'}
          </span>
        </div>

        {filteredTrips.length === 0 ? (
          <div
            style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px dashed var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <Compass size={38} color="var(--teal-primary)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              {search
                ? 'No trips match your search'
                : statusFilter === 'upcoming'
                  ? 'No Upcoming Trips'
                  : 'No Completed Trips Yet'}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 16 }}>
              {search
                ? 'Try searching for another destination or keyword.'
                : statusFilter === 'upcoming'
                  ? 'Ready for your next getaway? Plan a trip and watch it countdown here.'
                  : 'When your trips conclude, your travel history and past passes will be saved here.'}
            </p>
            {statusFilter === 'upcoming' && (
              <button
                type="button"
                className="btn-primary"
                onClick={onOpenAddTrip}
                style={{ maxWidth: 200, margin: '0 auto', fontSize: 13 }}
              >
                <Plus size={16} />
                <span>Plan Your Next Trip</span>
              </button>
            )}
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <TripCard
              key={trip._id || trip.id}
              trip={trip}
              onClick={() => onSelectTrip(trip)}
              onEdit={onEditTrip}
            />
          ))
        )}
      </div>
      {/* Floating Action Button (+ in bottom right) to Open Add Trip Modal */}
      <button
        type="button"
        onClick={onOpenAddTrip}
        title="Add New Trip"
        aria-label="Add New Trip"
        style={{
          position: 'fixed',
          right: 22,
          bottom: 'calc(var(--nav-height) + 20px)',
          width: 54,
          height: 54,
          borderRadius: 27,
          background: 'linear-gradient(135deg, var(--teal-primary) 0%, var(--sage-accent) 100%)',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px var(--teal-glow), 0 4px 10px rgba(15, 30, 54, 0.15)',
          border: '2.5px solid #FFFFFF',
          cursor: 'pointer',
          zIndex: 40,
          transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 148, 136, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px var(--teal-glow), 0 4px 10px rgba(15, 30, 54, 0.15)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.94)';
        }}
      >
        <Plus size={26} strokeWidth={2.6} />
      </button>
    </div>
  );
}
