import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Compass, Sparkles, User, Database } from 'lucide-react';

export default function Header({ onOpenAuth, onOpenProfile }) {
  const { user, dbMode } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'TN';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="mobile-app-header">
      <div className="brand-badge">
        <div className="brand-icon-wrapper">
          <Compass size={22} strokeWidth={2.3} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <h1 className="brand-title">TripNest</h1>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 6,
                background: '#CCFBF1',
                color: '#0F766E',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              App
            </span>
          </div>
          <div className="brand-tagline">Every trip. Every ticket. One place.</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user ? (
          <button
            type="button"
            className="header-user-avatar"
            onClick={onOpenProfile}
            title={`${user.name} (${user.email})`}
          >
            {getInitials(user.name)}
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              padding: '7px 14px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, var(--teal-primary), var(--sage-accent))',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 3px 10px rgba(13, 148, 136, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <User size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
