import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  User,
  Users,
  UserPlus,
  Trash2,
  X,
  Check,
  LogOut,
  Sparkles,
} from 'lucide-react';

const DEFAULT_FRIENDS = [
  { name: 'Priya Patel', email: 'priya@tripnest.in' },
  { name: 'Rohan Mehta', email: 'rohan@tripnest.in' },
  { name: 'Aarav Sharma', email: 'aarav@tripnest.in' },
];

export default function ProfileScreen({ trips = [], tickets = [], onOpenAuth }) {
  const { user, logout, demoLogin } = useAuth();

  const [friends, setFriends] = useState(() => {
    try {
      const cached = localStorage.getItem('tripnest_friends');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [friendError, setFriendError] = useState('');
  const [friendLoading, setFriendLoading] = useState(false);

  // Fetch from backend and keep synced
  useEffect(() => {
    async function loadFriends() {
      try {
        const res = await api.getFriends();
        if (res.success && Array.isArray(res.data)) {
          setFriends(res.data);
          localStorage.setItem('tripnest_friends', JSON.stringify(res.data));
        }
      } catch (err) {
        console.warn('Could not fetch friends from API, using cached:', err.message);
      }
    }
    loadFriends();
  }, [user]);

  const getInitials = (name) => {
    if (!name) return 'TN';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarGradient = (str = '') => {
    const gradients = [
      'linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)',
      'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
      'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)',
      'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)',
      'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const handleAddFriend = async (e) => {
    if (e) e.preventDefault();
    setFriendError('');

    const trimmedName = newFriendName.trim();
    const trimmedEmail = newFriendEmail.trim().toLowerCase();

    if (!trimmedName) {
      setFriendError("Please enter your friend's name.");
      return;
    }
    if (!trimmedEmail) {
      setFriendError("Please enter your friend's email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFriendError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }
    if (user && (user.email || '').toLowerCase().trim() === trimmedEmail) {
      setFriendError('You cannot add your own email address as a friend.');
      return;
    }
    if (friends.some((f) => (f.email || '').toLowerCase().trim() === trimmedEmail)) {
      setFriendError('A friend with this email already exists in your list.');
      return;
    }

    setFriendLoading(true);
    try {
      const res = await api.addFriend({ name: trimmedName, email: trimmedEmail });
      if (res.success) {
        const addedFriend = res.friend || { name: trimmedName, email: trimmedEmail };
        const updated = res.data || [...friends, addedFriend];
        setFriends(updated);
        localStorage.setItem('tripnest_friends', JSON.stringify(updated));
        setNewFriendName('');
        setNewFriendEmail('');
        setShowAddForm(false);
      }
    } catch (err) {
      setFriendError(err.message || 'Could not add friend. Please make sure they have a TripNest account.');
    } finally {
      setFriendLoading(false);
    }
  };


  const handleDeleteFriend = async (emailToDelete) => {
    const updated = friends.filter(
      (f) => (f.email || '').toLowerCase().trim() !== emailToDelete.toLowerCase().trim()
    );
    setFriends(updated);
    localStorage.setItem('tripnest_friends', JSON.stringify(updated));

    try {
      await api.deleteFriend(emailToDelete);
    } catch (err) {
      console.warn('Could not sync friend deletion to backend:', err.message);
    }
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

      {/* Travel Friends Section */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '16px 18px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'var(--teal-ultralight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--teal-primary)',
                flexShrink: 0,
              }}
            >
              <Users size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3
                  style={{
                    fontSize: 14.5,
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Travel Friends
                </h3>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: 'var(--teal-primary)',
                    background: 'var(--teal-ultralight)',
                    padding: '2px 7px',
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                >
                  {friends.length}
                </span>
              </div>
              <p
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-secondary)',
                  margin: '1px 0 0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Select them by name when planning trips
              </p>
            </div>
          </div>

          {!showAddForm && (
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setFriendError('');
              }}
              title="Add Travel Friend"
              aria-label="Add Travel Friend"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'var(--teal-ultralight)',
                color: 'var(--teal-primary)',
                border: '1px solid var(--teal-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(13, 148, 136, 0.08)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--teal-primary)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--teal-ultralight)';
                e.currentTarget.style.color = 'var(--teal-primary)';
              }}
            >
              <UserPlus size={17} />
            </button>
          )}
        </div>

        {/* Add Friend Form (expandable) */}
        {showAddForm && (
          <form
            onSubmit={handleAddFriend}
            style={{
              background: '#F8FAFC',
              borderRadius: 14,
              padding: 14,
              border: '1px solid #E2E8F0',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserPlus size={14} color="var(--teal-primary)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                  Add a Travel Companion
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFriendError('');
                }}
                title="Cancel"
                aria-label="Cancel"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: '#E2E8F0',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEE2E2';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E2E8F0';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                placeholder="Friend's Full Name (e.g. Priya Patel)"
                value={newFriendName}
                onChange={(e) => {
                  setNewFriendName(e.target.value);
                  if (friendError) setFriendError('');
                }}
                autoFocus
                className="form-input"
                style={{ height: 38, fontSize: 13, background: '#FFFFFF' }}
              />
              <input
                type="email"
                placeholder="Friend's Email (e.g. priya@gmail.com)"
                value={newFriendEmail}
                onChange={(e) => {
                  setNewFriendEmail(e.target.value);
                  if (friendError) setFriendError('');
                }}
                className="form-input"
                style={{ height: 38, fontSize: 13, background: '#FFFFFF' }}
              />
              <p style={{ fontSize: 11, color: 'var(--teal-primary)', fontWeight: 600, margin: '2px 0 0' }}>
                💡 Your friend must have a registered TripNest account to be added.
              </p>
            </div>

            {friendError && (
              <div
                style={{
                  color: '#DC2626',
                  fontSize: 11.5,
                  marginTop: 6,
                  fontWeight: 600,
                  background: '#FEF2F2',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #FECACA',
                }}
              >
                {friendError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                type="submit"
                disabled={friendLoading}
                className="btn-primary"
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  opacity: friendLoading ? 0.75 : 1,
                }}
              >
                {friendLoading ? (
                  <span>Verifying account...</span>
                ) : (
                  <>
                    <Check size={13} strokeWidth={2.5} />
                    <span>Save Friend</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Friends List */}
        {friends.length === 0 ? (
          <div
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              background: '#F8FAFC',
              borderRadius: 14,
              border: '1.5px dashed #E2E8F0',
            }}
          >
            <Users size={28} color="var(--text-muted)" style={{ margin: '0 auto 6px' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', margin: '0 0 2px' }}>
              No Friends Added Yet
            </p>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
              Add friends above to easily share trips with them with a single click.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {friends.map((friend) => (
              <div
                key={friend.email}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      background: getAvatarGradient(friend.name || friend.email),
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(15, 30, 54, 0.08)',
                    }}
                  >
                    {getInitials(friend.name || friend.email)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {friend.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {friend.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteFriend(friend.email)}
                  title={`Remove ${friend.name}`}
                  aria-label={`Remove ${friend.name}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginLeft: 6,
                    transition: 'all 0.15s ease',
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
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
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
