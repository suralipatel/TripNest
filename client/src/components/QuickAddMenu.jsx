import React from 'react';
import { X, Compass, Ticket, Sparkles } from 'lucide-react';

export default function QuickAddMenu({ onClose, onSelectOption }) {
  return (
    <div className="bottom-sheet-backdrop" onClick={onClose} style={{ zIndex: 115 }}>
      <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        <div className="sheet-header">
          <h3 className="sheet-title">Create in TripNest</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="sheet-body" style={{ padding: '16px 20px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              type="button"
              onClick={() => onSelectOption('trip')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 18px',
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1.5px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-subtle)',
                textAlign: 'left',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--teal-primary), var(--sage-accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px var(--teal-glow)',
                }}
              >
                <Compass size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                  Plan a New Trip
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Set destination, travel dates, packing checklist, and daily plans.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSelectOption('ticket')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '16px 18px',
                borderRadius: 16,
                background: '#FFFFFF',
                border: '1.5px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-subtle)',
                textAlign: 'left',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #059669, #0D9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                }}
              >
                <Ticket size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>
                  Add Ticket or Boarding Pass
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Store flight passes, Shinkansen / Eurostar trains, hotels & QR codes.
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
