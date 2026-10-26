import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Compass, Plane, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const { login, signup, demoLogin, dbMode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup({ name, email, password, currency: 'INR' });
      }
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };


  const handleDemoClick = async () => {
    setError('');
    setLoading(true);
    try {
      await demoLogin();
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bottom-sheet-backdrop" onClick={onClose}>
      <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
        <div className="sheet-drag-handle" />

        <div className="sheet-header" style={{ padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0D9488 0%, #3E7B6C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 10px rgba(13, 148, 136, 0.25)',
              }}
            >
              <Compass size={20} />
            </div>
            <div>
              <h2 className="sheet-title" style={{ fontSize: 18, margin: 0 }}>
                {isLogin ? 'Welcome Back' : 'Join TripNest'}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--teal-primary)', fontWeight: 600, margin: 0 }}>
                Every trip. Every ticket. One place.
              </p>
            </div>
          </div>
        </div>

        <div className="sheet-body" style={{ padding: '16px 20px 24px' }}>
          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              background: '#F0EDE5',
              padding: 4,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: isLogin ? 'var(--text-main)' : 'var(--text-muted)',
                background: isLogin ? '#FFFFFF' : 'transparent',
                boxShadow: isLogin ? '0 2px 6px rgba(15,30,54,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: !isLogin ? 'var(--text-main)' : 'var(--text-muted)',
                background: !isLogin ? '#FFFFFF' : 'transparent',
                boxShadow: !isLogin ? '0 2px 6px rgba(15,30,54,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Button */}
          <button
            type="button"
            onClick={handleDemoClick}
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px 16px',
              borderRadius: 12,
              background: '#F0FDFA',
              border: '1.5px dashed var(--teal-primary)',
              color: 'var(--teal-primary)',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginBottom: 16,
              transition: 'background 0.15s ease',
            }}
          >
            <Sparkles size={16} />
            <span>Try 1-Click Demo (Alex Morgan)</span>
          </button>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
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
                    placeholder="e.g. Maya Lin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
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
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password {isLogin ? '' : '(min 6 chars)'}</label>
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
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <button

              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop: 8 }}
            >
              {loading ? (
                <span>Securing your nest...</span>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In to Your Nest' : 'Create Free Account'}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Database mode pill */}
          <div
            style={{
              marginTop: 18,
              textAlign: 'center',
              fontSize: 11,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block',
              }}
            />
            <span>Storage: {dbMode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
