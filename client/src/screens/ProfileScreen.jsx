import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Plane,
  Database,
  Globe,
  LogOut,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Compass,
} from 'lucide-react';

export default function ProfileScreen({ trips = [], tickets = [], onOpenAuth }) {
  const { user, logout, demoLogin, dbMode } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'TN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Distinct countries visited/planned
  const countries = new Set();
  trips.forEach((t) => {
    if (t.country) countries.add(t.country);
  });

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* User Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 22,
          padding: 20,
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
          marginBottom: 18,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--teal-primary), var(--sage-accent))',
            color: '#FFFFFF',
            fontSize: 24,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            border: '3px solid #FFFFFF',
            boxShadow: '0 6px 18px var(--teal-glow)',
          }}
        >
          {user ? getInitials(user.name) : <User size={32} />}
        </div>

        <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-main)', margin: '0 0 2px' }}>
          {user ? user.name : 'Guest Traveler'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px' }}>
          {user ? user.email : 'Sign in to sync your trips and tickets across devices.'}
        </p>

        {/* 3 Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: '12px 6px',
            background: '#F8FAFC',
            borderRadius: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>TRIPS</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
              {trips.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>PASSES</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--teal-primary)', marginTop: 2 }}>
              {tickets.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>COUNTRIES</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#059669', marginTop: 2 }}>
              {countries.size}
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings / Preferences */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '14px 18px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: 18,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
          Travel Preferences
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plane size={16} color="var(--teal-primary)" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)' }}>Home Airport</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', background: '#F1F5F9', padding: '3px 8px', borderRadius: 8 }}>
            {user?.homeAirport || 'JFK'}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe size={16} color="var(--teal-primary)" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)' }}>Currency</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', background: '#F1F5F9', padding: '3px 8px', borderRadius: 8 }}>
            {user?.currency || 'INR'} (₹)
          </span>

        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={16} color="#059669" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-main)' }}>Data Storage</span>
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#059669',
              background: '#ECFDF5',
              padding: '3px 9px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span>{dbMode}</span>
          </span>
        </div>
      </div>

      {/* App & Tech Stack Info */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '14px 18px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: 18,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          TripNest Engine
        </h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
          <strong>Tagline:</strong> “Every trip. Every ticket. One place.”<br />
          <strong>Stack:</strong> React + Vite, Node.js + Express, MongoDB + Mongoose, Mobile-First CSS.
        </p>
      </div>

      {/* Auth action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!user ? (
          <button
            type="button"
            className="btn-primary"
            onClick={onOpenAuth}
          >
            <User size={16} />
            <span>Sign In or Register</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={demoLogin}
            >
              <Sparkles size={16} color="var(--teal-primary)" />
              <span>Reset & Reload Demo Traveler</span>
            </button>

            <button
              type="button"
              onClick={logout}
              style={{
                width: '100%',
                padding: '12px 18px',
                borderRadius: 14,
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: 14,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
