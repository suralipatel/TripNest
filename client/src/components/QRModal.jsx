import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Download,
  UploadCloud,
} from 'lucide-react';
import { api } from '../api';
import { ensureTicketFile, dataUrlToBlobUrl } from '../utils/ticketDocumentGenerator';

export default function QRModal({ ticket, onClose, onTicketUpdated }) {
  if (!ticket) return null;

  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = async (uploadedFile) => {
    if (!uploadedFile) return;
    const isPdfFile = uploadedFile.type === 'application/pdf' || uploadedFile.name.toLowerCase().endsWith('.pdf');
    const isImageFile = uploadedFile.type.startsWith('image/') || /\.(png|jpe?g|webp|svg)$/i.test(uploadedFile.name);

    if (!isPdfFile && !isImageFile) {
      alert('Please upload a valid PDF document or image file (PNG, JPG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const newFileData = {
        dataUrl: e.target.result,
        name: uploadedFile.name,
        type: isPdfFile ? 'pdf' : 'image',
        size: Math.round(uploadedFile.size / 1024),
      };

      try {
        setUploading(true);
        const ticketId = currentTicket._id || currentTicket.id;
        const res = await api.updateTicket(ticketId, { ticketFile: newFileData });
        const updated = res.data || { ...currentTicket, ticketFile: newFileData };
        setCurrentTicket(updated);
        if (onTicketUpdated) onTicketUpdated(updated);
      } catch (err) {
        const updated = { ...currentTicket, ticketFile: newFileData };
        setCurrentTicket(updated);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(uploadedFile);
  };

  const openInNewTab = () => {
    const targetUrl = blobUrl || file?.dataUrl;
    if (!targetUrl) return;

    if (isPdf) {
      window.open(targetUrl, '_blank');
    } else {
      const w = window.open();
      if (w) {
        w.document.write(
          `<title>${file?.name || 'Uploaded Ticket'}</title><body style="margin:0; background:#0F1E36; display:flex; align-items:center; justify-content:center; min-height:100vh;"><img src="${targetUrl}" style="max-width:96%; max-height:96vh; border-radius:10px; box-shadow:0 12px 40px rgba(0,0,0,0.6);"/></body>`
        );
      }
    }
  };

  const downloadFile = () => {
    const targetUrl = blobUrl || file?.dataUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = file?.name || (isPdf ? 'ticket.pdf' : 'ticket.png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="center-popup-backdrop" onClick={onClose} style={{ zIndex: 160 }}>
      <div
        className="center-popup-modal wide-viewer"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '95%',
          maxWidth: 820,
          maxHeight: '94vh',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 24,
          background: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: '0 25px 75px rgba(15, 30, 54, 0.35)',
        }}
      >
        {/* Modal Top Header Bar */}
        <div
          style={{
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            background: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: isPdf ? '#FEF2F2' : '#F0FDFA',
                color: isPdf ? '#EF4444' : '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isPdf ? <FileText size={20} strokeWidth={2.4} /> : <ImageIcon size={20} strokeWidth={2.4} />}
            </div>
            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F1E36', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file?.name || currentTicket.title || 'Ticket Document'}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{currentTicket.title}</span>
                {file?.size ? <span>• {file.size} KB</span> : null}
              </div>
            </div>
          </div>

          {/* Action buttons on header right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Replace / Upload file button */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 9,
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                fontSize: 12,
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
              }}
              title="Replace or upload a new ticket document"
            >
              <UploadCloud size={14} color="#0D9488" />
              <span>{uploading ? 'Uploading...' : 'Replace'}</span>
            </button>

            <button
              type="button"
              onClick={openInNewTab}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 9,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                fontSize: 12,
                fontWeight: 700,
                color: '#1E293B',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Open full size in new browser tab"
            >
              <ExternalLink size={13} />
              <span>Open in New Tab</span>
            </button>

            <button
              type="button"
              onClick={downloadFile}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '7px 12px',
                borderRadius: 9,
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
              }}
              title="Download file"
            >
              <Download size={13} />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                background: '#F1F5F9',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                cursor: 'pointer',
                marginLeft: 4,
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
            padding: '12px',
            overflowY: 'auto',
            flex: 1,
            background: '#F1F5F9',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {isPdf ? (
              /* PDF Viewer Container */
              <div
                style={{
                  flex: 1,
                  minHeight: 480,
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
                    minHeight: 520,
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
                      minHeight: 520,
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
                  minHeight: 480,
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
                  onClick={openInNewTab}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '74vh',
                    objectFit: 'contain',
                    borderRadius: 10,
                    cursor: 'zoom-in',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                  }}
                  title="Click to open in full size"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
