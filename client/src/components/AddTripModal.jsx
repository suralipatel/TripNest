import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Camera, RotateCcw, Check, Users, Plus, Pencil, Search } from 'lucide-react';
import { api } from '../api';

// Intelligent cover image matcher based on destination/city keywords
function getDefaultTripImage(destination = '') {
  const d = destination.toLowerCase().trim();

  // 1. Mountains / High Altitude / Snow (Ladakh, Manali, Kashmir, etc.)
  if (
    /ladakh|leh|himalaya|manali|shimla|kashmir|sikkim|spiti|alps|switzerland|mountain|hill|trek|peak|snow|valle/i.test(d)
  ) {
    return {
      url: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
      tag: '🏔️ Mountain Landscape',
    };
  }

  // 2. Beach / Ocean / Coastal / Tropical (Goa, Maldives, Bali, Andaman, etc.)
  if (
    /goa|maldives|bali|phuket|hawaii|andaman|pondicherry|gokarna|beach|ocean|sea|island|coast|coastal|water/i.test(d)
  ) {
    return {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      tag: '🏖️ Ocean & Beach',
    };
  }

  // 3. Heritage / Royal / Historic / Temples (Jaipur, Udaipur, Agra, Rome, etc.)
  if (
    /jaipur|udaipur|rajasthan|agra|varanasi|amritsar|hampi|delhi|kyoto|rome|athens|palace|fort|heritage|temple/i.test(d)
  ) {
    return {
      url: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
      tag: '🏰 Heritage & Culture',
    };
  }

  // 4. Urban / Skyline / Modern Metropolis (Mumbai, Tokyo, New York, Dubai, etc.)
  if (
    /mumbai|bangalore|bengaluru|tokyo|new york|nyc|london|paris|dubai|singapore|chicago|city|skyline|urban/i.test(d)
  ) {
    return {
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
      tag: '🏙️ City Skyline',
    };
  }

  // 5. Nature / Forest / Tea Valleys / Backwaters (Kerala, Coorg, Munnar, etc.)
  if (
    /kerala|munnar|coorg|ooty|wayanad|assam|darjeeling|nature|forest|lake|garden|green|river/i.test(d)
  ) {
    return {
      url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
      tag: '🌿 Nature & Valleys',
    };
  }

  // Fallback: rotating universal travel landscape
  const universalPresets = [
    {
      url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
      tag: '🌄 Scenic Landscape',
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      tag: '🏖️ Coastal Vista',
    },
    {
      url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
      tag: '🏙️ City Lights',
    },
  ];

  let hash = 0;
  for (let i = 0; i < d.length; i++) hash = (hash << 5) - hash + d.charCodeAt(i);
  return universalPresets[Math.abs(hash) % universalPresets.length];
}

// Compress and optimize mobile gallery images for fast upload and storage
function compressImageFile(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddTripModal({ onClose, onSave, tripToEdit = null }) {
  const isEditMode = Boolean(tripToEdit);

  const [destination, setDestination] = useState(tripToEdit?.destination || '');
  const [title, setTitle] = useState(tripToEdit?.title || '');
  const [country, setCountry] = useState(tripToEdit?.country || '');
  const [startDate, setStartDate] = useState(
    tripToEdit?.startDate ? tripToEdit.startDate.slice(0, 10) : ''
  );
  const [endDate, setEndDate] = useState(
    tripToEdit?.endDate ? tripToEdit.endDate.slice(0, 10) : ''
  );
  const [budgetTotal, setBudgetTotal] = useState(
    tripToEdit?.budget?.total !== undefined ? String(tripToEdit.budget.total) : ''
  );
  const [notes, setNotes] = useState(tripToEdit?.notes || '');
  const [loading, setLoading] = useState(false);
  const [customImage, setCustomImage] = useState(tripToEdit?.coverImage || null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-detect default theme image based on typed destination
  const matchedDefaultImage = getDefaultTripImage(destination || title || 'travel');
  const activeCoverUrl = customImage || matchedDefaultImage.url;

  const handleDestinationChange = (e) => {
    const val = e.target.value;
    setDestination(val);
    if (!title || title.startsWith('Trip to')) {
      setTitle(val ? `Trip to ${val.trim()}` : '');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setCustomImage(compressedDataUrl);
    } catch (err) {
      alert('Could not process photo: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Friends & Collaborators state
  const [friends, setFriends] = useState(
    (tripToEdit?.sharedWith || []).map((f) => ({
      name: f.name || '',
      email: (f.email || '').toLowerCase().trim(),
      role: f.role || 'viewer',
    }))
  );

  const [savedFriends, setSavedFriends] = useState(() => {
    try {
      const cached = localStorage.getItem('tripnest_friends');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { name: 'Priya Patel', email: 'priya@tripnest.in' },
      { name: 'Rohan Mehta', email: 'rohan@tripnest.in' },
      { name: 'Aarav Sharma', email: 'aarav@tripnest.in' },
    ];
  });

  const [showQuickAddFriend, setShowQuickAddFriend] = useState(false);
  const [quickFriendName, setQuickFriendName] = useState('');
  const [quickFriendEmail, setQuickFriendEmail] = useState('');
  const [quickFriendError, setQuickFriendError] = useState('');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');

  const displayFriends = savedFriends.filter((f) => {
    if (!friendSearchQuery.trim()) return true;
    const q = friendSearchQuery.toLowerCase().trim();
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q))
    );
  });

  // Fetch saved travel friends from backend
  useEffect(() => {
    async function loadSavedFriends() {
      try {
        const res = await api.getFriends();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setSavedFriends(res.data);
          localStorage.setItem('tripnest_friends', JSON.stringify(res.data));
        }
      } catch (err) {
        // Fallback to cached friends is already set
      }
    }
    loadSavedFriends();
  }, []);

  const isFriendSelected = (friendEmail) => {
    const target = (friendEmail || '').toLowerCase().trim();
    return friends.some((f) => (f.email || '').toLowerCase().trim() === target);
  };

  const handleToggleFriend = (friend) => {
    const targetEmail = (friend.email || '').toLowerCase().trim();
    if (isFriendSelected(targetEmail)) {
      setFriends(friends.filter((f) => (f.email || '').toLowerCase().trim() !== targetEmail));
    } else {
      setFriends([
        ...friends,
        {
          name: friend.name || targetEmail.split('@')[0],
          email: targetEmail,
          role: 'viewer',
          addedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleQuickAddFriend = async (e) => {
    if (e) e.preventDefault();
    setQuickFriendError('');
    const name = quickFriendName.trim();
    const email = quickFriendEmail.trim().toLowerCase();

    if (!name) {
      setQuickFriendError("Please enter friend's name.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setQuickFriendError('Please enter a valid email address.');
      return;
    }
    if (savedFriends.some((f) => (f.email || '').toLowerCase().trim() === email)) {
      setQuickFriendError('This friend is already in your friends list.');
      return;
    }

    const newFriend = { name, email };
    const updatedSaved = [...savedFriends, newFriend];
    setSavedFriends(updatedSaved);
    localStorage.setItem('tripnest_friends', JSON.stringify(updatedSaved));

    // Automatically select for this trip
    if (!friends.some((f) => (f.email || '').toLowerCase().trim() === email)) {
      setFriends([
        ...friends,
        { name, email, role: 'viewer', addedAt: new Date().toISOString() },
      ]);
    }

    setQuickFriendName('');
    setQuickFriendEmail('');
    setShowQuickAddFriend(false);

    try {
      await api.addFriend(newFriend);
    } catch (err) {
      console.warn('Could not sync friend to backend:', err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!destination || !startDate || !endDate) return;

    setLoading(true);
    try {
      const finalTitle = title.trim() || `Trip to ${destination.trim()}`;
      await onSave(
        {
          title: finalTitle,
          destination: destination.trim(),
          country: country.trim() || '',
          startDate,
          endDate,
          coverImage: activeCoverUrl,
          budget: {
            total: Number(budgetTotal) || 0,
            spent: tripToEdit?.budget?.spent || 0,
            currency: 'INR',
          },
          notes,
          sharedWith: friends,
        },
        tripToEdit?._id || tripToEdit?.id
      );
      onClose();
    } catch (err) {
      alert((isEditMode ? 'Error updating trip: ' : 'Error creating trip: ') + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bottom-sheet-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        <div className="sheet-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isEditMode ? (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: 'var(--teal-ultralight)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pencil size={17} color="var(--teal-primary)" />
              </div>
            ) : (
              <span style={{ fontSize: 20 }}>✈️</span>
            )}
            <h3 className="sheet-title">{isEditMode ? 'Edit Trip Details' : 'Plan New Trip'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="sheet-body">
          {/* Cover Photo Preview Banner with Gallery Upload Trigger */}
          <div
            style={{
              position: 'relative',
              height: 120,
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 14,
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-subtle)',
            }}
          >
            <img
              src={activeCoverUrl}
              alt="Trip Cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(15,30,54,0.75) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '10px 12px',
              }}
            >
              {/* Top Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    background: 'rgba(15, 30, 54, 0.7)',
                    backdropFilter: 'blur(4px)',
                    padding: '3px 8px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Sparkles size={11} color="#2DD4BF" />
                  <span>{customImage ? 'Custom Gallery Photo' : `Default: ${matchedDefaultImage.tag}`}</span>
                </span>

                {customImage && (
                  <button
                    type="button"
                    onClick={() => setCustomImage(null)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 8,
                      background: 'rgba(255,255,255,0.85)',
                      color: 'var(--text-main)',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RotateCcw size={11} />
                    <span>Revert to Auto</span>
                  </button>
                )}
              </div>

              {/* Bottom Upload Button on Preview */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)',
                    color: 'var(--text-main)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <Camera size={14} color="var(--teal-primary)" />
                  <span>{uploadingImage ? 'Processing...' : customImage ? 'Change Gallery Photo' : 'Upload from Mobile Gallery'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hidden file input for Mobile Photo Gallery / Camera */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Destination City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ladakh, Goa, Tokyo..."
                  value={destination}
                  onChange={handleDestinationChange}
                  className="form-input"
                  autoFocus={!isEditMode}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. India"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Trip Title</label>
              <input
                type="text"
                placeholder="e.g. Trip to Ladakh"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group" style={{ minWidth: 0, width: '100%' }}>
              <label className="form-label">Departure Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
              />
            </div>
            <div className="form-group" style={{ minWidth: 0, width: '100%' }}>
              <label className="form-label">Return Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                style={{ width: '100%', maxWidth: '100%', minWidth: 0, boxSizing: 'border-box' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Budget (₹ INR)</label>
              <input
                type="number"
                placeholder="e.g. 45000"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Travel Companions / Friends Section */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '14px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Users size={16} color="var(--teal-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                    Share Trip with Friends
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {friends.length > 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--teal-primary)',
                        background: 'var(--teal-ultralight)',
                        padding: '2px 8px',
                        borderRadius: 12,
                      }}
                    >
                      {friends.length} Selected
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickAddFriend(!showQuickAddFriend);
                      setQuickFriendError('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: 20,
                      background: showQuickAddFriend ? '#E2E8F0' : 'var(--teal-ultralight)',
                      border: '1.5px solid var(--teal-light, #99F6E4)',
                      color: showQuickAddFriend ? 'var(--text-secondary)' : 'var(--teal-primary)',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 3px rgba(15, 30, 54, 0.05)',
                    }}
                  >
                    <Plus size={14} strokeWidth={2.6} />
                    <span>{showQuickAddFriend ? 'Cancel' : 'Add Friend'}</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Add Friend Section Container with Internal Close Button & Full Width Fields */}
              {showQuickAddFriend && (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid var(--teal-light, #99F6E4)',
                    borderRadius: 14,
                    padding: '14px',
                    marginBottom: 12,
                    boxShadow: '0 4px 14px rgba(13, 148, 136, 0.08)',
                    position: 'relative',
                  }}
                >
                  {/* Header fitted inside the section container */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                      paddingBottom: 8,
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={15} strokeWidth={2.6} color="var(--teal-primary)" />
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
                        Add Friend
                      </span>
                    </div>

                    {/* Close button fitted INSIDE the section container */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddFriend(false);
                        setQuickFriendError('');
                      }}
                      title="Close"
                      aria-label="Close"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        background: '#F1F5F9',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E2E8F0';
                        e.currentTarget.style.color = '#0F1E36';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#F1F5F9';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Both Fields in Full Width */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                        Friend's Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maya Verma"
                        value={quickFriendName}
                        onChange={(e) => {
                          setQuickFriendName(e.target.value);
                          if (quickFriendError) setQuickFriendError('');
                        }}
                        className="form-input"
                        style={{ width: '100%', height: 38, fontSize: 13, borderRadius: 10, boxSizing: 'border-box' }}
                        autoFocus
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. maya@tripnest.in"
                        value={quickFriendEmail}
                        onChange={(e) => {
                          setQuickFriendEmail(e.target.value);
                          if (quickFriendError) setQuickFriendError('');
                        }}
                        className="form-input"
                        style={{ width: '100%', height: 38, fontSize: 13, borderRadius: 10, boxSizing: 'border-box' }}
                      />
                    </div>

                    {quickFriendError && (
                      <div style={{ color: '#EF4444', fontSize: 11.5, fontWeight: 600 }}>
                        {quickFriendError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleQuickAddFriend}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        height: 38,
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      <Check size={16} strokeWidth={2.5} />
                      <span>Add & Select Friend</span>
                    </button>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                Select friends by name to share this trip, boarding passes, and itinerary with them:
              </p>

              {/* Quick Search bar if there are 6 or more friends */}
              {savedFriends.length >= 6 && (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search
                    size={13}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search friends by name or email..."
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      height: 32,
                      paddingLeft: 30,
                      paddingRight: 10,
                      borderRadius: 12,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      fontSize: 12,
                      color: 'var(--text-main)',
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Friends selectable chips */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 8,
                  maxHeight: 140,
                  overflowY: 'auto',
                  padding: '2px 2px 4px',
                  scrollbarWidth: 'thin',
                }}
              >
                {displayFriends.map((f) => {
                  const selected = isFriendSelected(f.email);
                  return (
                    <button
                      key={f.email}
                      type="button"
                      onClick={() => handleToggleFriend(f)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 12px 6px 8px',
                        borderRadius: 24,
                        background: selected ? 'var(--teal-ultralight)' : '#FFFFFF',
                        border: selected ? '1.5px solid var(--teal-primary)' : '1.5px solid #CBD5E1',
                        color: selected ? 'var(--teal-primary)' : 'var(--text-main)',
                        boxShadow: selected ? '0 2px 6px var(--teal-glow)' : '0 1px 3px rgba(15, 30, 54, 0.04)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Avatar Circle with initials / check */}
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          background: selected ? 'var(--teal-primary)' : '#E2E8F0',
                          color: selected ? '#FFFFFF' : 'var(--text-secondary)',
                          fontSize: 10.5,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {selected ? (
                          <Check size={13} strokeWidth={3} />
                        ) : (
                          (f.name || f.email || 'F').charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Friend Name */}
                      <span style={{ fontSize: 12.5, fontWeight: selected ? 800 : 600 }}>
                        {f.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selection Status Summary with Avatar Stack (Supports 20+ friends gracefully) */}
              <div
                style={{
                  fontSize: 11.5,
                  color: friends.length > 0 ? 'var(--teal-primary)' : 'var(--text-muted)',
                  marginTop: 6,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {friends.length > 0 ? (
                  <>
                    {/* Overlapping mini avatar stack */}
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {friends.slice(0, 4).map((f, i) => (
                        <div
                          key={f.email}
                          title={f.name || f.email}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            background: 'linear-gradient(135deg, var(--teal-primary) 0%, #2DD4BF 100%)',
                            color: '#FFFFFF',
                            fontSize: 9.5,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #FFFFFF',
                            marginLeft: i > 0 ? -6 : 0,
                            boxShadow: '0 1px 3px rgba(15, 30, 54, 0.1)',
                          }}
                        >
                          {(f.name || f.email || 'F').charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {friends.length > 4 && (
                        <div
                          title={friends.slice(4).map((f) => f.name).join(', ')}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            background: '#0F1E36',
                            color: '#FFFFFF',
                            fontSize: 9,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #FFFFFF',
                            marginLeft: -6,
                            boxShadow: '0 1px 3px rgba(15, 30, 54, 0.1)',
                          }}
                        >
                          +{friends.length - 4}
                        </div>
                      )}
                    </div>

                    <span>
                      {friends.length === 1 && `Shared with ${friends[0].name}`}
                      {friends.length === 2 && `Shared with ${friends[0].name} & ${friends[1].name}`}
                      {friends.length === 3 && `Shared with ${friends[0].name}, ${friends[1].name} & ${friends[2].name}`}
                      {friends.length > 3 &&
                        `Shared with ${friends[0].name}, ${friends[1].name} +${friends.length - 2} more`}
                    </span>
                  </>
                ) : (
                  <span>🔒 Private trip (only you can view)</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Trip Notes / Reminders (Optional)</label>
              <textarea
                rows={2}
                placeholder="Hotel booking info, inner line permits, packing notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-textarea"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8 }}>
              <span>
                {loading
                  ? isEditMode
                    ? 'Saving Changes...'
                    : 'Creating Trip...'
                  : isEditMode
                    ? 'Save Trip Changes'
                    : 'Save Trip to Nest'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
