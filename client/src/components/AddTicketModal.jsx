import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plane,
  Train,
  Bus,
  Building2,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Trash2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { parseTicketDocument } from '../utils/ticketParser';
import { ensureTicketFile } from '../utils/ticketDocumentGenerator';

export default function AddTicketModal({
  trips = [],
  initialTrip = null,
  initialType = 'flight',
  onClose,
  onSave,
}) {
  const activeTrip = initialTrip || trips[0] || null;

  // ONLY 2 USER FIELDS:
  // 1. Ticket Type
  const [ticketType, setTicketType] = useState(initialType || 'flight');
  // 2. Upload File
  const [ticketFile, setTicketFile] = useState(null); // { dataUrl, name, type, size }

  // Extracted details (automatically populated from uploaded file or smart defaults)
  const [extractedData, setExtractedData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-initialize extracted data for the selected ticket type if no file uploaded yet
  useEffect(() => {
    let active = true;
    if (!ticketFile) {
      parseTicketDocument(null, ticketType, activeTrip).then((res) => {
        if (active) {
          setExtractedData(res);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [ticketType, activeTrip, ticketFile]);

  const processFile = async (file, type = ticketType) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      alert('Please upload a valid PDF document or image file (PNG, JPG, WebP).');
      return;
    }

    setScanning(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileData = {
        dataUrl: e.target.result,
        name: file.name,
        type: isPdf ? 'pdf' : 'image',
        size: Math.round(file.size / 1024),
      };
      setTicketFile(fileData);

      // Automatically extract ticket data from document
      try {
        const parsed = await parseTicketDocument(file, type, activeTrip);
        // Include attached file in parsed payload
        parsed.ticketFile = fileData;
        setExtractedData(parsed);
      } catch (err) {
        console.error('Extraction error:', err);
      } finally {
        setTimeout(() => setScanning(false), 450);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to test with sample ticket document
  const handleSampleTicket = async (sampleType) => {
    setTicketType(sampleType);
    setScanning(true);

    // Create a mock sample file
    const sampleFileName =
      sampleType === 'flight'
        ? 'AirIndia_BoardingPass_DEL_BOM.pdf'
        : sampleType === 'train'
        ? 'IRCTC_E-Ticket_12431_Rajdhani.pdf'
        : sampleType === 'bus'
        ? 'IntrCity_SmartBus_Ticket.pdf'
        : 'Hotel_Booking_Confirmation.pdf';

    const mockFile = new File(['%PDF-1.4 Mock Ticket Content'], sampleFileName, { type: 'application/pdf' });

    // Use a clean mock ticket dataUrl
    const sampleDataUrl = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg==';

    const fileData = {
      dataUrl: sampleDataUrl,
      name: sampleFileName,
      type: 'pdf',
      size: 145,
    };
    setTicketFile(fileData);

    try {
      const parsed = await parseTicketDocument(mockFile, sampleType, activeTrip);
      parsed.ticketFile = fileData;
      setExtractedData(parsed);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setScanning(false), 500);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalData = extractedData || (await parseTicketDocument(null, ticketType, activeTrip));
      const fileToSave = ticketFile || finalData.ticketFile || ensureTicketFile({ ...finalData, ticketType });
      await onSave({
        tripId: activeTrip ? (activeTrip._id || activeTrip.id) : '',
        tripTitle: activeTrip ? activeTrip.title : '',
        ...finalData,
        ticketType,
        ticketFile: fileToSave,
      });
      onClose();
    } catch (err) {
      alert('Error saving ticket: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { id: 'flight', label: 'Flight', icon: Plane, color: '#0D9488' },
    { id: 'train', label: 'Train', icon: Train, color: '#059669' },
    { id: 'bus', label: 'Bus', icon: Bus, color: '#D97706' },
    { id: 'hotel', label: 'Hotel', icon: Building2, color: '#2563EB' },
  ];

  const currentCategory = categories.find((c) => c.id === ticketType) || categories[0];
  const CurrentIcon = currentCategory.icon;

  return (
    <div className="center-popup-backdrop" onClick={onClose} style={{ zIndex: 160 }}>
      <div
        className="center-popup-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '92%',
          maxWidth: 480,
          borderRadius: 24,
          background: '#FFFFFF',
          boxShadow: '0 25px 70px rgba(15, 30, 54, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${currentCategory.color}15`,
                color: currentCategory.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CurrentIcon size={20} strokeWidth={2.4} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Add Ticket to Wallet
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Upload ticket file to auto-extract all details
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              background: '#F1F5F9',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div style={{ padding: '18px 20px 20px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {/* FIELD 1: TICKET TYPE SELECTOR */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11.5,
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              1. Select Ticket Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = ticketType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setTicketType(cat.id);
                      if (ticketFile) {
                        // Re-process with new type
                        processFile(ticketFile, cat.id);
                      }
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 5,
                      padding: '10px 4px',
                      borderRadius: 14,
                      border: active ? `2px solid ${cat.color}` : '1.5px solid #E2E8F0',
                      background: active ? `${cat.color}12` : '#FFFFFF',
                      color: active ? cat.color : '#64748B',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                    <span style={{ fontSize: 11.5, fontWeight: active ? 800 : 600 }}>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* FIELD 2: UPLOAD TICKET FILE */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  margin: 0,
                }}
              >
                2. Upload Ticket (PDF or Image)
              </label>
              <span style={{ fontSize: 10.5, color: '#0D9488', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sparkles size={11} /> Auto-Extraction
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processFile(f);
              }}
            />

            {/* Upload Drag/Drop Box */}
            {!ticketFile ? (
              <div
                className={`ticket-file-upload-zone ${dragActive ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) processFile(f);
                }}
                style={{ padding: '24px 16px', background: '#F8FAFC' }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    background: 'rgba(13, 148, 136, 0.1)',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <UploadCloud size={22} strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)', marginBottom: 3 }}>
                  Click or Drag & Drop Ticket File
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto' }}>
                  Supports PDF boarding pass, train ticket, bus ticket, or screenshot (PNG, JPG)
                </div>
              </div>
            ) : (
              /* Uploaded file preview strip */
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 14,
                  background: '#F0FDFA',
                  border: '1.5px solid #99F6E4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                  {ticketFile.type === 'pdf' ? (
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: '#FEE2E2',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={20} />
                    </div>
                  ) : (
                    <img
                      src={ticketFile.dataUrl}
                      alt="Thumbnail"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        objectFit: 'cover',
                        border: '1px solid #CBD5E1',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 220,
                      }}
                    >
                      {ticketFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600 }}>
                      {ticketFile.type.toUpperCase()} • {ticketFile.size} KB • Ready
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTicketFile(null);
                    setExtractedData(null);
                  }}
                  style={{
                    padding: '6px',
                    borderRadius: 8,
                    background: '#FEE2E2',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Remove File"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Quick One-Click Sample Presets */}
          {!ticketFile && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                ⚡ Or Try With 1-Click Sample File:
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                <button
                  type="button"
                  onClick={() => handleSampleTicket('flight')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: '#F0FDFA',
                    color: '#0D9488',
                    border: '1px solid #99F6E4',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✈️ Air India E-Ticket
                </button>
                <button
                  type="button"
                  onClick={() => handleSampleTicket('train')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🚆 IRCTC Rajdhani Ticket
                </button>
                <button
                  type="button"
                  onClick={() => handleSampleTicket('bus')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    background: '#FFFBEB',
                    color: '#D97706',
                    border: '1px solid #FDE68A',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🚌 IntrCity Volvo Ticket
                </button>
              </div>
            </div>
          )}

          {/* SCANNING / ANALYZING STATE */}
          {scanning && (
            <div
              style={{
                padding: '16px',
                borderRadius: 14,
                background: '#F0FDFA',
                border: '1.5px solid #99F6E4',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0D9488', fontWeight: 800, fontSize: 13 }}>
                <Sparkles size={16} className="animate-spin" />
                <span>AI Scanner extracting ticket data from document...</span>
              </div>
              <p style={{ fontSize: 11, color: '#0F766E', margin: '4px 0 0' }}>
                Fetching PNR, carrier number, route, departure & arrival times...
              </p>
            </div>
          )}

          {/* AUTO-EXTRACTED TICKET DETAILS PREVIEW CARD */}
          {extractedData && !scanning && (
            <div
              style={{
                padding: '14px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                border: '1.5px solid #CBD5E1',
                marginBottom: 16,
                boxShadow: '0 2px 8px rgba(15, 30, 54, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ECFDF5',
                    padding: '3px 8px',
                    borderRadius: 8,
                  }}
                >
                  <CheckCircle2 size={13} color="#059669" />
                  Auto-Extracted from File
                </span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#64748B' }}>
                  {extractedData.referenceNumber}
                </span>
              </div>

              {/* Service title */}
              <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
                {extractedData.title}
              </div>

              {/* Route */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                <span>{extractedData.originCode} ({extractedData.originName})</span>
                <ArrowRight size={14} color="#0D9488" />
                <span>{extractedData.destinationCode} ({extractedData.destinationName})</span>
              </div>

              {/* Timings, Seat, Class */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 11.5, color: '#64748B', paddingTop: 6, borderTop: '1px solid #E2E8F0' }}>
                <span>🕒 <b>Time:</b> {extractedData.departureDateTime?.slice(11, 16) || '10:15'}</span>
                <span>💺 <b>Seat:</b> {extractedData.seat}</span>
                <span>🚪 <b>Gate:</b> {extractedData.gate}</span>
                <span>🎫 <b>Class:</b> {extractedData.classType}</span>
              </div>
            </div>
          )}
        </div>

        {/* PINNED FOOTER: Save Ticket to Wallet Button (Always 100% Visible & Prominent) */}
        <div
          style={{
            padding: '14px 20px 16px',
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            flexShrink: 0,
            boxShadow: '0 -4px 14px rgba(15, 30, 54, 0.04)',
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              boxShadow: '0 4px 16px rgba(13, 148, 136, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            <ShieldCheck size={19} />
            <span>{saving ? 'Saving to Wallet...' : 'Save Ticket to Wallet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
