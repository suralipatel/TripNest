import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './api';
import Header from './components/Header';
import Navbar from './components/Navbar';
import TripsScreen from './screens/TripsScreen';
import TicketsScreen from './screens/TicketsScreen';
import ItineraryScreen from './screens/ItineraryScreen';
import ProfileScreen from './screens/ProfileScreen';
import TripDetailModal from './components/TripDetailModal';
import AddTripModal from './components/AddTripModal';
import AddTicketModal from './components/AddTicketModal';
import QuickAddMenu from './components/QuickAddMenu';
import QRModal from './components/QRModal';
import AuthModal from './components/AuthModal';
import WelcomeScreen from './screens/WelcomeScreen';
import { Smartphone, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const { user, token, demoLogin, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'tickets' | 'itinerary' | 'profile'
  const [trips, setTrips] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [initialTripForTicket, setInitialTripForTicket] = useState(null);
  const [initialTicketType, setInitialTicketType] = useState('flight');
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [qrModalTicket, setQrModalTicket] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load trips and tickets
  const loadAppData = async () => {
    if (!token) {
      setTrips([]);
      setTickets([]);
      return;
    }
    setLoadingData(true);
    try {
      const [tripsRes, ticketsRes] = await Promise.all([
        api.getTrips(),
        api.getTickets(),
      ]);
      if (tripsRes.success) setTrips(tripsRes.data || []);
      if (ticketsRes.success) setTickets(ticketsRes.data || []);

      // If a trip is currently open in detail modal, refresh it
      if (selectedTrip) {
        const updatedSelected = (tripsRes.data || []).find(
          (t) => (t._id || t.id) === (selectedTrip._id || selectedTrip.id)
        );
        if (updatedSelected) setSelectedTrip(updatedSelected);
      }
    } catch (err) {
      console.warn('Error fetching data:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, [token]);

  // Trip handlers
  const handleSaveTrip = async (tripData, tripId) => {
    try {
      if (tripId) {
        const res = await api.updateTrip(tripId, tripData);
        if (res.success) {
          showToast('✈️ Trip details & friends updated!');
          loadAppData();
          setEditingTrip(null);
        }
      } else {
        const res = await api.createTrip(tripData);
        if (res.success) {
          showToast('✈️ Trip planned successfully!');
          loadAppData();
          try {
            confetti({
              particleCount: 35,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#0D9488', '#2DD4BF', '#F59E0B'],
            });
          } catch {}
        }
      }
    } catch (err) {
      alert((tripId ? 'Error updating trip: ' : 'Error creating trip: ') + err.message);
    }
  };

  const handleOpenAddTrip = async () => {
    if (!user) {
      try {
        await demoLogin();
      } catch {}
    }
    setEditingTrip(null);
    setShowAddTripModal(true);
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setShowAddTripModal(true);
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      const res = await api.deleteTrip(tripId);
      if (res.success) {
        showToast('Trip removed from your nest.');
        setSelectedTrip(null);
        loadAppData();
      }
    } catch (err) {
      alert('Error deleting trip: ' + err.message);
    }
  };

  const handleUpdateTripCover = async (tripId, coverImage) => {
    try {
      const res = await api.updateTrip(tripId, { coverImage });
      if (res.success) {
        showToast('📷 Trip photo updated from gallery!');
        loadAppData();
        setSelectedTrip((prev) => (prev ? { ...prev, coverImage } : null));
      }
    } catch (err) {
      alert('Error updating photo: ' + err.message);
    }
  };

  // Ticket handlers
  const handleSaveTicket = async (ticketData) => {
    try {
      const res = await api.createTicket(ticketData);
      if (res.success) {
        showToast('🎟️ Pass saved to your digital wallet!');
        loadAppData();
        try {
          confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#0D9488', '#2DD4BF'],
          });
        } catch {}
      }
    } catch (err) {
      alert('Error adding ticket: ' + err.message);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      const res = await api.deleteTicket(ticketId);
      if (res.success) {
        showToast('Pass deleted.');
        loadAppData();
      }
    } catch (err) {
      alert('Error deleting ticket: ' + err.message);
    }
  };

  // Packing list handlers
  const handleTogglePacking = async (tripId, itemId, packed) => {
    // Optimistic UI update
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if ((t._id || t.id) === tripId) {
          const updatedPacking = (t.packingList || []).map((p) => {
            if (p.id === itemId || p._id === itemId) return { ...p, packed };
            return p;
          });
          const updatedTrip = { ...t, packingList: updatedPacking };
          if (selectedTrip && (selectedTrip._id || selectedTrip.id) === tripId) {
            setSelectedTrip(updatedTrip);
          }
          return updatedTrip;
        }
        return t;
      })
    );

    try {
      await api.togglePackingItem(tripId, itemId, packed);
    } catch (err) {
      console.error('Failed to sync packing toggle:', err);
      loadAppData();
    }
  };

  const handleAddPackingItem = async (tripId, item, category) => {
    try {
      const res = await api.addPackingItem(tripId, item, category || 'General');
      if (res.success) {
        showToast('Item added to packing checklist.');
        loadAppData();
      }
    } catch (err) {
      alert('Error adding packing item: ' + err.message);
    }
  };

  const handleEditPackingItem = async (tripId, itemId, newText) => {
    // Optimistic UI update
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if ((t._id || t.id) === tripId) {
          const updatedPacking = (t.packingList || []).map((p) => {
            if (p.id === itemId || p._id === itemId) return { ...p, item: newText };
            return p;
          });
          const updatedTrip = { ...t, packingList: updatedPacking };
          if (selectedTrip && (selectedTrip._id || selectedTrip.id) === tripId) {
            setSelectedTrip(updatedTrip);
          }
          return updatedTrip;
        }
        return t;
      })
    );

    try {
      await api.editPackingItem(tripId, itemId, newText);
      showToast('Packing item updated.');
    } catch (err) {
      console.error('Failed to edit packing item:', err);
      loadAppData();
    }
  };

  const handleDeletePackingItem = async (tripId, itemId) => {
    // Optimistic UI update
    setTrips((prevTrips) =>
      prevTrips.map((t) => {
        if ((t._id || t.id) === tripId) {
          const updatedPacking = (t.packingList || []).filter((p) => p.id !== itemId && p._id !== itemId);
          const updatedTrip = { ...t, packingList: updatedPacking };
          if (selectedTrip && (selectedTrip._id || selectedTrip.id) === tripId) {
            setSelectedTrip(updatedTrip);
          }
          return updatedTrip;
        }
        return t;
      })
    );

    try {
      await api.deletePackingItem(tripId, itemId);
      showToast('Item removed from packing list.');
    } catch (err) {
      console.error('Failed to delete packing item:', err);
      loadAppData();
    }
  };

  const handleAddItineraryItem = async (tripId, eventData) => {
    try {
      const res = await api.addItineraryEvent(tripId, eventData);
      if (res.success) {
        showToast('Activity added to your itinerary!');
        loadAppData();
      }
    } catch (err) {
      alert('Error adding activity: ' + err.message);
    }
  };

  // Quick Add handler
  const handleQuickAddOption = (option) => {
    setShowQuickAddMenu(false);
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (option === 'trip') {
      setEditingTrip(null);
      setShowAddTripModal(true);
    } else if (option === 'ticket') {
      setInitialTripForTicket(null);
      setInitialTicketType('flight');
      setShowAddTicketModal(true);
    }
  };

  const openAddTicketForTrip = (trip, defaultType = 'flight') => {
    setInitialTripForTicket(trip);
    setInitialTicketType(defaultType);
    setShowAddTicketModal(true);
  };

  // If verifying token on initial load, show sleek loader
  if (authLoading && !user) {
    return (
      <div className="app-viewport-wrapper">
        <div className="mobile-app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FAF8F5' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, var(--teal-primary) 0%, var(--sage-accent) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px var(--teal-glow)',
              }}
            >
              <Compass size={30} strokeWidth={2.3} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-main)' }}>
              TripNest
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Opening your travel nest...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, render Welcome Screen with onboarding
  if (!user) {
    return (
      <div className="app-viewport-wrapper">
        <div className="mobile-app-container" style={{ background: '#FAF8F5', minHeight: '100vh' }}>
          <WelcomeScreen onAuthenticated={loadAppData} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport-wrapper">
      <div className="mobile-app-container">
        {/* Top Notch Mockup on larger screens */}
        <div className="mobile-notch-bar">
          <span>9:41</span>
          <div className="mobile-notch-pill" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>5G</span>
            <span>100%</span>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="toast-floating">
            {toast.type === 'error' ? (
              <AlertCircle size={17} color="#EF4444" />
            ) : (
              <CheckCircle2 size={17} color="#2DD4BF" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Mobile Header Bar */}
        <Header
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenProfile={() => setActiveTab('profile')}
        />

        {/* Main Scrollable Screen Content */}
        <main className="mobile-screen-content">
          {activeTab === 'trips' && (
            <TripsScreen
              trips={trips}
              tickets={tickets}
              onSelectTrip={(trip) => setSelectedTrip(trip)}
              onOpenAddTrip={handleOpenAddTrip}
              onEditTrip={handleEditTrip}
              onOpenAuth={() => setShowAuthModal(true)}
              user={user}
            />
          )}

          {activeTab === 'tickets' && (
            <TicketsScreen
              tickets={tickets}
              onOpenAddTicket={() => {
                if (!user) setShowAuthModal(true);
                else {
                  setInitialTripForTicket(null);
                  setShowAddTicketModal(true);
                }
              }}
              onDeleteTicket={handleDeleteTicket}
              onShowQR={(tkt) => setQrModalTicket(tkt)}
            />
          )}

          {activeTab === 'itinerary' && (
            <ItineraryScreen
              trips={trips}
              tickets={tickets}
              onSelectTrip={(trip) => setSelectedTrip(trip)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              trips={trips}
              tickets={tickets}
              onOpenAuth={() => setShowAuthModal(true)}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          ticketCount={tickets.length}
          onQuickAdd={handleOpenAddTrip}
        />

        {/* ================= MODALS ================= */}

        {/* 1. Quick Add Chooser Sheet */}
        {showQuickAddMenu && (
          <QuickAddMenu
            onClose={() => setShowQuickAddMenu(false)}
            onSelectOption={handleQuickAddOption}
          />
        )}

        {/* 2. Add New Trip / Edit Trip Modal */}
        {showAddTripModal && (
          <AddTripModal
            key={editingTrip?._id || editingTrip?.id || 'new-trip'}
            tripToEdit={editingTrip}
            onClose={() => {
              setShowAddTripModal(false);
              setEditingTrip(null);
            }}
            onSave={handleSaveTrip}
          />
        )}

        {/* 3. Add Ticket / Boarding Pass Modal */}
        {showAddTicketModal && (
          <AddTicketModal
            trips={trips}
            initialTrip={initialTripForTicket}
            initialType={initialTicketType}
            onClose={() => setShowAddTicketModal(false)}
            onSave={handleSaveTicket}
          />
        )}

        {/* 4. Trip Details Bottom Sheet */}
        {selectedTrip && (
          <TripDetailModal
            trip={selectedTrip}
            tickets={tickets.filter(
              (t) => t.tripId === (selectedTrip._id || selectedTrip.id)
            )}
            onClose={() => setSelectedTrip(null)}
            onAddTicket={openAddTicketForTrip}
            onDeleteTicket={handleDeleteTicket}
            onShowQR={(tkt) => setQrModalTicket(tkt)}
            onTogglePacking={handleTogglePacking}
            onAddPackingItem={handleAddPackingItem}
            onEditPackingItem={handleEditPackingItem}
            onDeletePackingItem={handleDeletePackingItem}
            onAddItineraryItem={handleAddItineraryItem}
            onDeleteTrip={handleDeleteTrip}
            onUpdateCoverImage={handleUpdateTripCover}
            onEditTrip={handleEditTrip}
          />
        )}

        {/* 5. Full Screen QR / Document Ticket Modal */}
        {qrModalTicket && (
          <QRModal
            ticket={qrModalTicket}
            onClose={() => setQrModalTicket(null)}
            onTicketUpdated={(updatedTkt) => {
              setTickets((prev) =>
                prev.map((t) => ((t._id || t.id) === (updatedTkt._id || updatedTkt.id) ? updatedTkt : t))
              );
              setQrModalTicket(updatedTkt);
            }}
          />
        )}

        {/* 6. Sign In / Register Auth Modal */}
        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    </div>
  );
}
