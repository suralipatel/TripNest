import React, { useState } from 'react';
import {
  Ticket as TicketIcon,
  Plane,
  Train,
  Building2,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import TicketCard from '../components/TicketCard';

export default function TicketsScreen({
  tickets = [],
  onOpenAddTicket,
  onDeleteTicket,
  onShowQR,
}) {
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  const filterOptions = [
    { id: 'all', label: 'All Passes', icon: TicketIcon },
    { id: 'flight', label: 'Flights', icon: Plane },
    { id: 'train', label: 'Trains', icon: Train },
    { id: 'hotel', label: 'Stays', icon: Building2 },
    { id: 'event', label: 'Events', icon: Sparkles },
  ];

  const filteredTickets = tickets.filter((t) => {
    if (filterType !== 'all' && t.ticketType !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = t.title && t.title.toLowerCase().includes(q);
      const matchProvider = t.provider && t.provider.toLowerCase().includes(q);
      const matchRef = t.referenceNumber && t.referenceNumber.toLowerCase().includes(q);
      const matchOrigin = (t.originCode && t.originCode.toLowerCase().includes(q)) || (t.originName && t.originName.toLowerCase().includes(q));
      const matchDest = (t.destinationCode && t.destinationCode.toLowerCase().includes(q)) || (t.destinationName && t.destinationName.toLowerCase().includes(q));
      return matchTitle || matchProvider || matchRef || matchOrigin || matchDest;
    }
    return true;
  });

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Wallet Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Boarding Passes & Tickets
          </h2>
          <p style={{ fontSize: 12, color: 'var(--teal-primary)', fontWeight: 600, margin: '2px 0 0' }}>
            Every ticket in your digital pocket.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddTicket}
          style={{
            padding: '8px 14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, var(--teal-primary), var(--sage-accent))',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 4px 12px var(--teal-glow)',
          }}
        >
          <Plus size={15} />
          <span>Add Pass</span>
        </button>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
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
          placeholder="Search by flight number, airline, or city code (JFK, HND)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="form-input"
          style={{ paddingLeft: 36, paddingRight: 12, height: 40, fontSize: 13, borderRadius: 12 }}
        />
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12 }}>
        {filterOptions.map((opt) => {
          const Icon = opt.icon;
          const active = filterType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setFilterType(opt.id)}
              style={{
                flexShrink: 0,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: active ? 'var(--text-main)' : '#FFFFFF',
                color: active ? '#FFFFFF' : 'var(--text-secondary)',
                border: active ? 'none' : '1px solid var(--border-subtle)',
                boxShadow: active ? '0 2px 8px rgba(15,30,54,0.15)' : 'var(--shadow-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={13} color={active ? '#2DD4BF' : 'currentColor'} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Passes List */}
      <div>
        {filteredTickets.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1.5px dashed var(--border-subtle)',
              marginTop: 10,
            }}
          >
            <TicketIcon size={38} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
            <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              No passes found
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, marginBottom: 16 }}>
              {search || filterType !== 'all'
                ? 'Try clearing your search or category filter.'
                : 'Add your first airline boarding pass, train ticket, or hotel reservation.'}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={onOpenAddTicket}
              style={{ maxWidth: 190, margin: '0 auto', fontSize: 13 }}
            >
              <Plus size={15} />
              <span>Add Your First Ticket</span>
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
    </div>
  );
}
