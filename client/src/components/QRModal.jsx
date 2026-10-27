import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
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

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(Number((prev - 0.25).toFixed(2)), 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleToggleZoom = () => {
    setZoomLevel((prev) => (prev > 1 ? 1 : 1.5));
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

          {/* Action controls on header right: Zoom In/Out, Maximize Modal, Close */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Zoom In & Out Controls */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: '#F1F5F9',
                padding: '3px 6px',
                borderRadius: 10,
                border: '1px solid #E2E8F0',
              }}
            >
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: zoomLevel <= 0.5 ? '#94A3B8' : '#0F1E36',
                  cursor: zoomLevel <= 0.5 ? 'default' : 'pointer',
                  background: 'none',
                  border: 'none',
                }}
                title="Zoom Out (-)"
              >
                <ZoomOut size={15} />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#0F1E36',
                  padding: '2px 6px',
                  borderRadius: 6,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  minWidth: 44,
                  textAlign: 'center',
                }}
                title="Click to Reset Zoom (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.5}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: zoomLevel >= 2.5 ? '#94A3B8' : '#0F1E36',
                  cursor: zoomLevel >= 2.5 ? 'default' : 'pointer',
                  background: 'none',
                  border: 'none',
                }}
                title="Zoom In (+)"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Whole Modal Zoom / Maximize Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: isMaximized ? '#E2E8F0' : '#F1F5F9',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0F1E36',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={isMaximized ? 'Zoom out modal to normal size' : 'Zoom in whole modal to fullscreen'}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
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
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Document Viewer */}
        <div
          style={{
            padding: isMaximized ? '8px' : '12px',
            overflow: 'auto',
            flex: 1,
            background: '#F1F5F9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            onDoubleClick={handleToggleZoom}
            style={{
              flex: 1,
              width: '100%',
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {isPdf ? (
              /* PDF Viewer Container */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: isMaximized ? '86vh' : 540,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  boxShadow: '0 4px 16px rgba(15, 30, 54, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <object
                  data={blobUrl || file?.dataUrl}
                  type="application/pdf"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: isMaximized ? '86vh' : 540,
                    border: 'none',
                    flex: 1,
                  }}
                >
                  <iframe
                    src={blobUrl || file?.dataUrl}
                    title="Uploaded Ticket PDF"
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: isMaximized ? '86vh' : 540,
                      border: 'none',
                    }}
                  />
                </object>
              </div>
            ) : (
              /* Image / SVG Viewer Container */
              <div
                style={{
                  flex: 1,
                  width: '100%',
                  minHeight: isMaximized ? '86vh' : 480,
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: '#0F1E36',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16,
                  boxShadow: '0 4px 20px rgba(15, 30, 54, 0.15)',
                }}
              >
                <img
                  src={blobUrl || file?.dataUrl}
                  alt={file?.name || 'Uploaded Ticket'}
                  onClick={handleToggleZoom}
                  style={{
                    maxWidth: '100%',
                    maxHeight: isMaximized ? '86vh' : '74vh',
                    objectFit: 'contain',
                    borderRadius: 10,
                    cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                  }}
                  title="Click or double-click to zoom in / zoom out"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
