import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Calendar, Sparkles, Upload, Camera, RotateCcw, Check, Users, UserPlus, Pencil } from 'lucide-react';

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

  // Friends & Collaborators state
  const [friends, setFriends] = useState(
    (tripToEdit?.sharedWith || []).map((f) => ({
      name: f.name || '',
      email: (f.email || '').toLowerCase().trim(),
      role: f.role || 'viewer',
    }))
  );
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friendError, setFriendError] = useState('');

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

  // Add friend handler
  const handleAddFriend = (e) => {
    if (e) e.preventDefault();
    setFriendError('');
    const trimmedEmail = friendEmail.trim().toLowerCase();
    const trimmedName = friendName.trim() || trimmedEmail.split('@')[0];

    if (!trimmedEmail) {
      setFriendError('Please enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFriendError('Please enter a valid email address (e.g. name@gmail.com).');
      return;
    }
    if (friends.some((f) => (f.email || '').toLowerCase().trim() === trimmedEmail)) {
      setFriendError('This friend is already added to the trip.');
      return;
    }

    setFriends([
      ...friends,
      {
        name: trimmedName,
        email: trimmedEmail,
        role: 'viewer',
        addedAt: new Date().toISOString(),
      },
    ]);
    setFriendName('');
    setFriendEmail('');
  };

  // Remove friend handler
  const handleRemoveFriend = (emailToRemove) => {
    setFriends(
      friends.filter(
        (f) => (f.email || '').toLowerCase().trim() !== emailToRemove.toLowerCase().trim()
      )
    );
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Departure Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Return Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="form-input"
                />
              </div>
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
                padding: '14px 14px 12px',
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Users size={16} color="var(--teal-primary)" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                    Add Friends & Companions
                  </span>
                </div>
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
                    {friends.length} {friends.length === 1 ? 'Friend' : 'Friends'}
                  </span>
                )}
              </div>

              <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                Friends you add by email can view all tickets, boarding passes, and trip itinerary.
              </p>

              {/* Add Friend Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Friend's Name"
                    value={friendName}
                    onChange={(e) => {
                      setFriendName(e.target.value);
                      if (friendError) setFriendError('');
                    }}
                    className="form-input"
                    style={{ height: 38, fontSize: 12 }}
                  />
                  <input
                    type="email"
                    placeholder="Friend's Email"
                    value={friendEmail}
                    onChange={(e) => {
                      setFriendEmail(e.target.value);
                      if (friendError) setFriendError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFriend();
                      }
                    }}
                    className="form-input"
                    style={{ height: 38, fontSize: 12 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddFriend}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--teal-ultralight)',
                    border: '1px solid var(--teal-light)',
                    color: 'var(--teal-primary)',
                    padding: '7px 12px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UserPlus size={14} />
                  <span>+ Add Friend</span>
                </button>
              </div>

              {friendError && (
                <div style={{ color: '#EF4444', fontSize: 11.5, marginTop: 6, fontWeight: 600 }}>
                  {friendError}
                </div>
              )}

              {/* List of Added Friends */}
              {friends.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {friends.map((friend) => (
                    <div
                      key={friend.email}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: '6px 10px',
                        boxShadow: '0 1px 3px rgba(15, 30, 54, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, var(--teal-primary) 0%, #2DD4BF 100%)',
                            color: '#FFFFFF',
                            fontSize: 11,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {(friend.name || friend.email || 'F').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-main)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {friend.name || friend.email.split('@')[0]}
                          </div>
                          <div
                            style={{
                              fontSize: 10.5,
                              color: 'var(--text-muted)',
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
                        onClick={() => handleRemoveFriend(friend.email)}
                        title="Remove friend"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          marginLeft: 6,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#EF4444';
                          e.currentTarget.style.background = '#FEE2E2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
