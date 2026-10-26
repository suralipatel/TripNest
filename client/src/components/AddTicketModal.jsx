import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Plane,
  Train,
  Bus,
  Building2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Tag,
  User,
  ShieldCheck,
  AlertCircle,
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

  // Selected Category
  const [ticketType, setTicketType] = useState(initialType || 'flight');
  // Uploaded File
  const [ticketFile, setTicketFile] = useState(null); // { dataUrl, name, type, size }

  // Editable Form Fields (auto-populated by AI document parser)
  const [formData, setFormData] = useState({
    title: '',
    provider: '',
    referenceNumber: '',
    originName: '',
    originCode: '',
    destinationName: '',
    destinationCode: '',
    departureDate: '',
    departureTime: '10:30',
    arrivalDate: '',
    arrivalTime: '13:00',
    passengerName: '',
    seat: '',
    gate: '',
    terminal: '',
    classType: 'Economy',
  });

  const [extractedFromDoc, setExtractedFromDoc] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize defaults based on active trip
  useEffect(() => {
    if (!ticketFile && !extractedFromDoc) {
      const defaultDate = activeTrip?.startDate
        ? activeTrip.startDate.slice(0, 10)
        : new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);

      const destName = activeTrip?.destination ? activeTrip.destination.split(',')[0].trim() : '';

      setFormData((prev) => ({
        ...prev,
        departureDate: prev.departureDate || defaultDate,
        arrivalDate: prev.arrivalDate || defaultDate,
        destinationName: prev.destinationName || destName,
        destinationCode: prev.destinationCode || (destName ? destName.substring(0, 3).toUpperCase() : ''),
        originName: prev.originName || (destName ? 'Current City' : ''),
        classType: ticketType === 'train' ? '3rd AC' : 'Economy',
      }));
    }
  }, [ticketType, activeTrip, ticketFile, extractedFromDoc]);

  // Handle file processing & extraction
  const processFile = async (file, type = ticketType) => {
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

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

      try {
        // Run deep document text & OCR extraction
        const parsed = await parseTicketDocument(file, type, activeTrip);

        // Populate all editable fields with real extracted information
        const depDate = parsed.departureDateTime ? parsed.departureDateTime.slice(0, 10) : '';
        const depTime = parsed.departureDateTime ? parsed.departureDateTime.slice(11, 16) : '10:30';
        const arrDate = parsed.arrivalDateTime ? parsed.arrivalDateTime.slice(0, 10) : depDate;
        const arrTime = parsed.arrivalDateTime ? parsed.arrivalDateTime.slice(11, 16) : '13:00';

        if (parsed.ticketType && parsed.ticketType !== ticketType) {
          setTicketType(parsed.ticketType);
        }

        setFormData({
          title: parsed.title || '',
          provider: parsed.provider || '',
          referenceNumber: parsed.referenceNumber || '',
          originName: parsed.originName || '',
          originCode: parsed.originCode || '',
          destinationName: parsed.destinationName || '',
          destinationCode: parsed.destinationCode || '',
          departureDate: depDate,
          departureTime: depTime,
          arrivalDate: arrDate,
          arrivalTime: arrTime,
          passengerName: parsed.passengerName || '',
          seat: parsed.seat || '',
          gate: parsed.gate || '',
          terminal: parsed.terminal || '',
          classType: parsed.classType || 'Economy',
        });

        setExtractedFromDoc(true);
      } catch (err) {
        console.error('Extraction error:', err);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Auto compute codes if name changes
      ...(field === 'originName' && !prev.originCode
        ? { originCode: value.slice(0, 3).toUpperCase() }
        : {}),
      ...(field === 'destinationName' && !prev.destinationCode
        ? { destinationCode: value.slice(0, 3).toUpperCase() }
        : {}),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const depDateTime = formData.departureDate
        ? `${formData.departureDate}T${formData.departureTime || '00:00'}`
        : new Date().toISOString().slice(0, 16);

      const arrDateTime = formData.arrivalDate
        ? `${formData.arrivalDate}T${formData.arrivalTime || '00:00'}`
        : depDateTime;

      const ticketPayload = {
        tripId: activeTrip ? activeTrip._id || activeTrip.id : '',
        tripTitle: activeTrip ? activeTrip.title : '',
        ticketType,
        title: formData.title || `${ticketType.toUpperCase()} Booking`,
        provider: formData.provider,
        referenceNumber: formData.referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        originName: formData.originName || 'Departure Hub',
        originCode: formData.originCode || (formData.originName ? formData.originName.slice(0, 3).toUpperCase() : 'DEP'),
        destinationName: formData.destinationName || 'Arrival Destination',
        destinationCode: formData.destinationCode || (formData.destinationName ? formData.destinationName.slice(0, 3).toUpperCase() : 'ARR'),
        departureDateTime: depDateTime,
        arrivalDateTime: arrDateTime,
        passengerName: formData.passengerName,
        seat: formData.seat,
        gate: formData.gate,
        terminal: formData.terminal,
        classType: formData.classType,
        price: 0,
        currency: 'INR',
        notes: ticketFile ? `Uploaded: ${ticketFile.name}` : 'Saved to wallet',
      };

      const fileToSave = ticketFile || ensureTicketFile(ticketPayload);
      ticketPayload.ticketFile = fileToSave;

      await onSave(ticketPayload);
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
          width: '94%',
          maxWidth: 500,
          borderRadius: 24,
          background: '#FFFFFF',
          boxShadow: '0 25px 70px rgba(15, 30, 54, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
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
              <CurrentIcon size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Upload & Add Ticket
              </h2>
              <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: 0 }}>
                Upload any ticket file to extract date, time & route automatically
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            style={{ width: 32, height: 32 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Active Trip Context Chip */}
          {activeTrip && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 12px',
                borderRadius: 10,
                background: '#F0FDFA',
                border: '1px solid #CCFBF1',
                marginBottom: 14,
                fontSize: 12,
                color: '#0F766E',
                fontWeight: 600,
              }}
            >
              <span>Linking to Trip:</span>
              <span style={{ fontWeight: 800, color: '#0D9488' }}>{activeTrip.title}</span>
            </div>
          )}

          {/* 1. Category Switcher */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Ticket Category
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 6,
                padding: 4,
                background: '#F1F5F9',
                borderRadius: 14,
              }}
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = ticketType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setTicketType(cat.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      padding: '8px 4px',
                      borderRadius: 10,
                      background: isSelected ? '#FFFFFF' : 'transparent',
                      color: isSelected ? cat.color : '#64748B',
                      boxShadow: isSelected ? '0 2px 8px rgba(15, 30, 54, 0.08)' : 'none',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: 11.5,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={16} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Drag & Drop Ticket Upload Zone */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Upload Ticket Document (PDF or Image)
              </label>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 800,
                  color: '#0D9488',
                  background: '#F0FDFA',
                  padding: '2px 7px',
                  borderRadius: 6,
                }}
              >
                <Sparkles size={11} /> Auto-Extraction
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processFile(e.target.files[0]);
                }
              }}
              style={{ display: 'none' }}
            />

            {!ticketFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '22px 16px',
                  borderRadius: 16,
                  border: `2px dashed ${dragActive ? '#0D9488' : '#CBD5E1'}`,
                  background: dragActive ? '#F0FDFA' : '#F8FAFC',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#E2E8F0',
                    color: '#0D9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 8px',
                  }}
                >
                  <Upload size={22} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                  Tap to upload ticket or drag & drop here
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Airline boarding pass, IRCTC ticket, redBus, hotel booking (PDF, JPG, PNG)
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#F0FDFA',
                  borderRadius: 14,
                  border: '1.5px solid #99F6E4',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={20} color="#0D9488" />
                  <div style={{ textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ticketFile.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#0D9488', fontWeight: 600 }}>
                      {ticketFile.type.toUpperCase()} • {ticketFile.size} KB • Ready
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 8,
                      background: '#FFFFFF',
                      border: '1px solid #CCFBF1',
                      color: '#0D9488',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTicketFile(null);
                      setExtractedFromDoc(false);
                    }}
                    style={{
                      padding: '5px 7px',
                      borderRadius: 8,
                      background: '#FEE2E2',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                    }}
                    title="Remove File"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SCANNING LOADER */}
          {scanning && (
            <div
              style={{
                padding: '14px',
                borderRadius: 14,
                background: '#F0FDFA',
                border: '1.5px solid #99F6E4',
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#0D9488', fontWeight: 800, fontSize: 13 }}>
                <Sparkles size={16} className="animate-spin" />
                <span>Reading ticket & extracting details with AI...</span>
              </div>
              <p style={{ fontSize: 11, color: '#0F766E', margin: '4px 0 0' }}>
                Extracting dates, departure & arrival times, route locations, and PNR...
              </p>
            </div>
          )}

          {/* EXTRACTION SUCCESS BANNER */}
          {extractedFromDoc && !scanning && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 12,
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                marginBottom: 14,
                fontSize: 12,
                color: '#065F46',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
              <span>Details extracted! Review and edit any field below:</span>
            </div>
          )}

          {/* 3. EDITABLE EXTRACTED DETAILS FORM */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Title / Flight or Train Name */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {ticketType === 'flight' ? 'Flight / Airline Name' : ticketType === 'train' ? 'Train Name & Number' : ticketType === 'bus' ? 'Bus Operator' : 'Hotel Name'}
              </label>
              <input
                type="text"
                placeholder={ticketType === 'flight' ? 'e.g. IndiGo 6E 2134' : ticketType === 'train' ? 'e.g. 12431 Rajdhani Express' : 'Service Title'}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="form-input"
                style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 12px' }}
              />
            </div>

            {/* Route: From & To */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  From (Origin)
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi (DEL)"
                  value={formData.originName}
                  onChange={(e) => handleInputChange('originName', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  To (Destination)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai (BOM)"
                  value={formData.destinationName}
                  onChange={(e) => handleInputChange('destinationName', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 12px' }}
                />
              </div>
            </div>

            {/* Departure Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Departure Date
                </label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Departure Time
                </label>
                <input
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => handleInputChange('departureTime', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 10px' }}
                />
              </div>
            </div>

            {/* Arrival Date & Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Arrival Date
                </label>
                <input
                  type="date"
                  value={formData.arrivalDate}
                  onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Arrival Time
                </label>
                <input
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => handleInputChange('arrivalTime', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 10px' }}
                />
              </div>
            </div>

            {/* PNR / Booking Ref & Seat / Berth */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  PNR / Booking Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Y7KR2P or 2918471049"
                  value={formData.referenceNumber}
                  onChange={(e) => handleInputChange('referenceNumber', e.target.value.toUpperCase())}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 12px', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Seat / Berth / Room
                </label>
                <input
                  type="text"
                  placeholder="e.g. 14A or Coach B2, 24"
                  value={formData.seat}
                  onChange={(e) => handleInputChange('seat', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 12px' }}
                />
              </div>
            </div>

            {/* Passenger Name & Gate */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Passenger / Guest Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Passenger Name"
                  value={formData.passengerName}
                  onChange={(e) => handleInputChange('passengerName', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Gate / Platform
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gate 4 or Platform 1"
                  value={formData.gate}
                  onChange={(e) => handleInputChange('gate', e.target.value)}
                  className="form-input"
                  style={{ width: '100%', height: 40, fontSize: 13, borderRadius: 10, padding: '0 12px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Footer Save Button */}
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
