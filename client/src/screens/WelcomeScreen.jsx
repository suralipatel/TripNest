import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Sparkles,
  Plane,
  CheckCircle2,
  Luggage,
  Users,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

export default function WelcomeScreen({ onAuthenticated }) {
  const { login, signup, demoLogin, dbMode } = useAuth();

  // 'welcome' | 'signup' | 'login'
  const [view, setView] = useState('welcome');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup({ name: name.trim(), email: email.trim(), password, currency: 'INR' });
      if (onAuthenticated) onAuthenticated();
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      if (onAuthenticated) onAuthenticated();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      if (onAuthenticated) onAuthenticated();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        background: '#FAF8F5',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 0 40px rgba(15, 30, 54, 0.08)',
      }}
    >
      {/* =========================================================================
          VIEW 1: WELCOME SCREEN (Main Hero & Action Picker)
          ========================================================================= */}
      {view === 'welcome' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            padding: '36px 24px 28px',
            boxSizing: 'border-box',
            justifyContent: 'space-between',
          }}
        >
          {/* Top Brand Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, var(--teal-primary) 0%, var(--sage-accent) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 6px 18px var(--teal-glow)',
                  }}
                >
                  <Compass size={24} strokeWidth={2.3} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                      TripNest
                    </h1>
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
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Every trip. Every ticket. One place.
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#0F766E',
                  background: '#F0FDFA',
                  border: '1px solid #CCFBF1',
                  padding: '4px 8px',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                <span>Ready</span>
              </div>
            </div>

            {/* Hero Visual Card */}
            <div
              style={{
                background: 'linear-gradient(145deg, #0F1E36 0%, #1A2E4C 100%)',
                borderRadius: 24,
                padding: '26px 22px 22px',
                color: '#FFFFFF',
                marginBottom: 20,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 12px 32px rgba(15, 30, 54, 0.2)',
              }}
            >
              {/* Decorative radial glows */}
              <div
                style={{
                  position: 'absolute',
                  right: -30,
                  top: -30,
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(13,148,136,0.35) 0%, rgba(13,148,136,0) 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: -20,
                  bottom: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0) 70%)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: 20, marginBottom: 12 }}>
                <Sparkles size={13} color="#2DD4BF" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2DD4BF', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Smart Travel Pocket
                </span>
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 26,
                  fontWeight: 800,
                  margin: '0 0 10px',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                }}
              >
                Welcome to <span style={{ color: '#2DD4BF' }}>TripNest</span>
              </h2>

              <p style={{ fontSize: 13.5, color: '#94A3B8', margin: '0 0 18px', lineHeight: 1.5 }}>
                Your private mobile nest for flights, train tickets, hotel stays, itineraries, and friends.
              </p>

              {/* Feature Pills Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '9px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Plane size={15} color="#2DD4BF" />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#E2E8F0' }}>Boarding Passes</span>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '9px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <MapPin size={15} color="#FBBF24" />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#E2E8F0' }}>Live Itinerary</span>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '9px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Luggage size={15} color="#34D399" />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#E2E8F0' }}>Packing Checklist</span>
                </div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    padding: '9px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Users size={15} color="#A78BFA" />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#E2E8F0' }}>Travel Friends</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Primary Sign Up Button */}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setView('signup');
              }}
              style={{
                width: '100%',
                padding: '15px 20px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, var(--teal-primary) 0%, var(--sage-accent) 100%)',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 22px var(--teal-glow), 0 3px 8px rgba(15, 30, 54, 0.12)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(13, 148, 136, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 22px var(--teal-glow), 0 3px 8px rgba(15, 30, 54, 0.12)';
              }}
            >
              <span>Create Free Account</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>

            {/* Secondary Log In Button */}
            <button
              type="button"
              onClick={() => {
                resetForm();
                setView('login');
              }}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 16,
                background: '#FFFFFF',
                color: 'var(--text-main)',
                fontSize: 14.5,
                fontWeight: 700,
                border: '1.5px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(15, 30, 54, 0.04)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--teal-primary)';
                e.currentTarget.style.color = 'var(--teal-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              <User size={17} />
              <span>Sign In to Existing Account</span>
            </button>

            {/* Quick 1-Click Demo Login */}
            <button
              type="button"
              onClick={handleDemoClick}
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 14,
                background: '#F0FDFA',
                border: '1.5px dashed var(--teal-primary)',
                color: 'var(--teal-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={15} />
              <span>{loading ? 'Opening Demo...' : '✦ Try Instant Demo (Alex Morgan)'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ShieldCheck size={13} color="#10B981" />
                <span>Persistent storage • Auto-login enabled</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: SIGN UP SCREEN (Dedicated Form Screen)
          ========================================================================= */}
      {view === 'signup' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            padding: '24px 22px 28px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setView('welcome');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: 'var(--text-secondary)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setView('login');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign In Instead
            </button>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: '#F0FDFA',
                color: 'var(--teal-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                border: '1.5px solid #CCFBF1',
              }}
            >
              <User size={22} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
              Create Your Account
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Join TripNest to organize all your flights, tickets, and trips in one digital nest.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <div>{error}</div>
              {error.toLowerCase().includes('already exists') && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setView('login');
                  }}
                  style={{
                    marginTop: 8,
                    background: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Switch to Sign In</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  required
                  placeholder="e.g. Surali Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40, height: 44, borderRadius: 12, background: '#FFFFFF' }}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="traveler@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40, height: 44, borderRadius: 12, background: '#FFFFFF' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                Password * (min 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40, height: 44, borderRadius: 12, background: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 20 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: 48,
                  fontSize: 15,
                  fontWeight: 800,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <span>Creating your nest...</span>
                ) : (
                  <>
                    <span>Create Account & Get Started</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setView('login');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--teal-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Log In
                  </button>
                </span>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: LOG IN SCREEN (Dedicated Form Screen)
          ========================================================================= */}
      {view === 'login' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            padding: '24px 22px 28px',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setView('welcome');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 20,
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: 'var(--text-secondary)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError('');
                setView('signup');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal-primary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: '#F0FDFA',
                color: 'var(--teal-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                border: '1.5px solid #CCFBF1',
              }}
            >
              <Lock size={20} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Sign in with your email to access your trips, boarding passes, and travel companions.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              <div>{error}</div>
              {error.toLowerCase().includes('no account found') && (
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setView('signup');
                  }}
                  style={{
                    marginTop: 8,
                    background: '#0D9488',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>Sign Up Now</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder="traveler@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40, height: 44, borderRadius: 12, background: '#FFFFFF' }}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: 12 }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: 40, height: 44, borderRadius: 12, background: '#FFFFFF' }}
                />
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 20 }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: 48,
                  fontSize: 15,
                  fontWeight: 800,
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In to Your Nest</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setView('signup');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--teal-primary)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    Create Account
                  </button>
                </span>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
