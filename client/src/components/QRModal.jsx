import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ensureTicketFile, dataUrlToBlobUrl } from '../utils/ticketDocumentGenerator';

export default function QRModal({ ticket, onClose }) {
  if (!ticket) return null;

  const [currentTicket] = useState(ticket);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);

  // Ensure there is always a valid document (user uploaded file or authentic ticket document)
  const file = useMemo(() => ensureTicketFile(currentTicket), [currentTicket]);

  const isPdf = Boolean(
    file?.type === 'pdf' ||
    file?.name?.toLowerCase().endsWith('.pdf') ||
    (file?.dataUrl && file.dataUrl.startsWith('data:application/pdf'))
  );

  // Convert dataUrl to a trusted blob URL so Chrome and Edge render PDFs and images natively
  const blobUrl = useMemo(() => {
    if (!file?.dataUrl) return null;
    return dataUrlToBlobUrl(file.dataUrl);
  }, [file?.dataUrl]);

  // Clean up blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const handleToggleZoom = (e) => {
    if (e && e.target && e.target.closest('button')) return;
    setZoomLevel((prev) => (prev > 1 ? 1 : 1.85));
  };

  return (
    <div
      className="center-popup-backdrop"
      onClick={onClose}
      style={{
        zIndex: 160,
        padding: isMaximized ? 0 : undefined,
      }}
    >
      <div
        className="center-popup-modal wide-viewer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMaximized ? '100vw' : '96%',
          maxWidth: isMaximized ? '100vw' : 860,
          height: isMaximized ? '100vh' : '92vh',
          maxHeight: isMaximized ? '100vh' : '94vh',
          borderRadius: isMaximized ? 0 : 24,
          background: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMaximized ? 'none' : '0 25px 75px rgba(15, 30, 54, 0.35)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Top Header Bar */}
        <div
          style={{
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            flexShrink: 0,
            gap: 12,
          }}
        >
          {/* Document Title & Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: isPdf ? '#FEF2F2' : '#F0FDFA',
                color: isPdf ? '#EF4444' : '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPdf ? <FileText size={18} strokeWidth={2.4} /> : <ImageIcon size={18} strokeWidth={2.4} />}
            </div>
            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: '#0F1E36',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {file?.name || currentTicket.title || 'Ticket Document'}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{currentTicket.title}</span>
                {file?.size ? <span>• {file.size} KB</span> : null}
              </div>
            </div>
          </div>

          {/* Action controls on header right: Clean Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: '#F1F5F9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Close"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Main Document Viewer */}
        <div
          onClick={handleToggleZoom}
          style={{
            position: 'relative',
            overflow: 'auto',
            flex: 1,
            background: '#0F1E36',
            display: 'flex',
            alignItems: zoomLevel > 1 ? 'flex-start' : 'center',
            justifyContent: zoomLevel > 1 ? 'flex-start' : 'center',
            padding: zoomLevel > 1 ? '24px 20px' : '16px',
            cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
            WebkitOverflowScrolling: 'touch',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              margin: 'auto',
              width: zoomLevel > 1 ? '185%' : '100%',
              maxWidth: zoomLevel > 1 ? 'none' : '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
            }}
          >
            {isPdf ? (
              /* PDF Viewer Container */
              <div
                style={{
                  width: '100%',
                  minHeight: zoomLevel > 1 ? '120vh' : 540,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                }}
              >
                <object
                  data={blobUrl || file?.dataUrl}
                  type="application/pdf"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: zoomLevel > 1 ? '120vh' : 540,
                    border: 'none',
                  }}
                >
                  <iframe
                    src={blobUrl || file?.dataUrl}
                    title="Uploaded Ticket PDF"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: zoomLevel > 1 ? '120vh' : 540,
                      border: 'none',
                    }}
                  />
                </object>
              </div>
            ) : (
              /* Image / SVG Viewer Container */
              <img
                src={blobUrl || file?.dataUrl}
                alt={file?.name || 'Uploaded Ticket'}
                style={{
                  width: zoomLevel > 1 ? '100%' : 'auto',
                  maxWidth: zoomLevel > 1 ? 'none' : '100%',
                  maxHeight: zoomLevel > 1 ? 'none' : '76vh',
                  objectFit: 'contain',
                  borderRadius: 12,
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
                  cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  display: 'block',
                }}
              />
            )}
          </div>

          {/* Floating Click-to-Zoom Pill */}
          <div
            style={{
              position: 'fixed',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 30, 54, 0.92)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              padding: '7px 18px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
              pointerEvents: 'none',
              zIndex: 30,
              letterSpacing: '0.2px',
            }}
          >
            {zoomLevel > 1 ? (
              <>
                <ZoomOut size={14} color="#38BDF8" />
                <span>Tap screen to zoom out</span>
              </>
            ) : (
              <>
                <ZoomIn size={14} color="#38BDF8" />
                <span>Tap screen to zoom in</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
