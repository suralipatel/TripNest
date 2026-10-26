import express from 'express';
import { TripModel } from '../models/Trip.js';
import { TicketModel } from '../models/Ticket.js';
import { localStore, getMongoStatus } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();

// Apply auth to all trip endpoints
router.use(authenticateToken);

// Helper to filter packing list so each friend/traveler has their own individual checklist
function filterTripForUser(rawTrip, currentUserId) {
  if (!rawTrip) return rawTrip;
  const tripObj = rawTrip.toObject ? rawTrip.toObject() : { ...rawTrip };
  const isOwner = tripObj.userId === currentUserId;
  const allPacking = Array.isArray(tripObj.packingList) ? tripObj.packingList : [];

  // An item belongs to current user if item.userId matches, or if legacy item without userId and user is owner
  tripObj.packingList = allPacking.filter((p) => {
    if (p.userId) return p.userId === currentUserId;
    return isOwner;
  });

  return tripObj;
}

// GET /api/trips - All trips for authenticated user (owned or shared)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const { isMongoConnected } = getMongoStatus();

    let trips;
    if (isMongoConnected) {
      trips = await TripModel.find({
        $or: [{ userId }, { 'sharedWith.email': userEmail }],
      }).sort({ startDate: 1 });
      trips = trips.map((t) => filterTripForUser(t, userId));
    } else {
      trips = localStore.find('trips', (t) => {
        if (t.userId === userId) return true;
        return (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      trips.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
      trips = trips.map((t) => filterTripForUser(t, userId));
    }

    res.json({ success: true, count: trips.length, data: trips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/trips/:id - Single trip with its tickets (owned or shared)
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const tripId = req.params.id;
    const { isMongoConnected } = getMongoStatus();

    let trip;
    let tickets;

    if (isMongoConnected) {
      trip = await TripModel.findOne({
        _id: tripId,
        $or: [{ userId }, { 'sharedWith.email': userEmail }],
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      tickets = await TicketModel.find({ tripId }).sort({ departureDateTime: 1 });
    } else {
      trip = localStore.findOne('trips', (t) => {
        if (t._id !== tripId && t.id !== tripId) return false;
        return t.userId === userId || (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      tickets = localStore.find('tickets', (t) => t.tripId === tripId);
      tickets.sort((a, b) => (a.departureDateTime || '').localeCompare(b.departureDateTime || ''));
    }

    res.json({ success: true, data: filterTripForUser(trip, userId), tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trips - Create new trip (with optional sharedWith friends)
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      destination,
      country,
      startDate,
      endDate,
      coverImage,
      themeColor,
      budget,
      notes,
      sharedWith,
    } = req.body;

    if (!title || !destination || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, destination, start date, and end date are required.',
      });
    }

    const { isMongoConnected } = getMongoStatus();

    // Intelligent default image matcher based on destination category
    const resolveDefaultTripImage = (dest = '') => {
      const d = dest.toLowerCase();
      if (/ladakh|leh|himalaya|manali|shimla|kashmir|sikkim|spiti|alps|switzerland|mountain|hill|trek|peak|snow/i.test(d)) {
        return 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80'; // Mountains
      }
      if (/goa|maldives|bali|phuket|hawaii|andaman|pondicherry|beach|ocean|sea|island|coast/i.test(d)) {
        return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'; // Ocean
      }
      if (/jaipur|udaipur|rajasthan|agra|varanasi|delhi|rome|kyoto|palace|fort|heritage|temple/i.test(d)) {
        return 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80'; // Heritage
      }
      if (/mumbai|bangalore|tokyo|new york|london|paris|dubai|singapore|city|skyline/i.test(d)) {
        return 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80'; // City
      }
      if (/kerala|munnar|coorg|ooty|nature|forest|lake|garden|green/i.test(d)) {
        return 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80'; // Nature
      }
      return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'; // Universal scenic
    };

    let image = coverImage || resolveDefaultTripImage(destination + ' ' + title);
    if (image && typeof image === 'string' && image.startsWith('data:image/')) {
      const uploadRes = await uploadToCloudinary(image, 'tripnest/covers');
      image = uploadRes.url;
    }

    const newTripData = {
      userId,
      title: title.trim(),
      destination: destination.trim(),
      country: country ? country.trim() : '',
      startDate,
      endDate,
      coverImage: image,
      themeColor: themeColor || '#0D9488',
      status: 'upcoming',
      budget: budget || { total: 0, spent: 0, currency: 'INR' },
      notes: notes || '',
      sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
      sharedBy: req.user.name || 'Friend',

      packingList: [
        { id: 'pk_' + Math.random().toString(36).substring(2, 7), userId, item: 'Passport & Travel ID', packed: false, category: 'Documents' },
        { id: 'pk_' + Math.random().toString(36).substring(2, 7), userId, item: 'Phone Charger & Power Bank', packed: false, category: 'Electronics' },
      ],
      itinerary: [],
    };

    let savedTrip;
    if (isMongoConnected) {
      const trip = new TripModel(newTripData);
      savedTrip = await trip.save();
    } else {
      savedTrip = localStore.insert('trips', newTripData);
    }

    res.status(201).json({ success: true, message: 'Trip created successfully!', data: filterTripForUser(savedTrip, userId) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/trips/:id - Update trip details and friends
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const tripId = req.params.id;
    const updateFields = { ...req.body };
    const { isMongoConnected } = getMongoStatus();

    if (updateFields.coverImage && typeof updateFields.coverImage === 'string' && updateFields.coverImage.startsWith('data:image/')) {
      const uploadRes = await uploadToCloudinary(updateFields.coverImage, 'tripnest/covers');
      updateFields.coverImage = uploadRes.url;
    }

    let updated;
    if (isMongoConnected) {
      const existing = await TripModel.findOne({
        _id: tripId,
        $or: [{ userId }, { 'sharedWith.email': userEmail }],
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Trip not found or unauthorized.' });
      }
      updated = await TripModel.findByIdAndUpdate(tripId, updateFields, { new: true });
    } else {
      const existing = localStore.findOne('trips', (t) => {
        if (t._id !== tripId && t.id !== tripId) return false;
        return t.userId === userId || (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Trip not found or unauthorized.' });
      }
      updated = localStore.update('trips', (t) => t._id === tripId || t.id === tripId, updateFields);
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    res.json({ success: true, message: 'Trip updated successfully!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/trips/:id - Delete trip and its tickets
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const tripId = req.params.id;
    const { isMongoConnected } = getMongoStatus();

    if (isMongoConnected) {
      await TripModel.deleteOne({ _id: tripId, userId });
      await TicketModel.deleteMany({ tripId, userId });
    } else {
      localStore.delete('trips', (t) => (t._id === tripId || t.id === tripId) && t.userId === userId);
      localStore.delete('tickets', (t) => t.tripId === tripId && t.userId === userId);
    }

    res.json({ success: true, message: 'Trip and associated tickets deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trips/:id/packing - Add packing item (private to current user)
router.post('/:id/packing', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const tripId = req.params.id;
    const { item, category } = req.body;

    if (!item) return res.status(400).json({ success: false, message: 'Item name is required' });

    const newItem = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId,
      item: item.trim(),
      category: category || 'General',
      packed: false,
    };

    const { isMongoConnected } = getMongoStatus();
    let trip;

    if (isMongoConnected) {
      trip = await TripModel.findOne({
        _id: tripId,
        $or: [{ userId }, { 'sharedWith.email': userEmail }],
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      trip.packingList.push(newItem);
      await trip.save();
    } else {
      trip = localStore.findOne('trips', (t) => {
        if (t._id !== tripId && t.id !== tripId) return false;
        return t.userId === userId || (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      const packingList = [...(trip.packingList || []), newItem];
      trip = localStore.update('trips', (t) => (t._id === tripId || t.id === tripId), { packingList });
    }

    res.json({ success: true, data: newItem, trip: filterTripForUser(trip, userId) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/trips/:id/packing/:itemId - Toggle or update packing item (only owner of the item can edit)
router.patch('/:id/packing/:itemId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const { id: tripId, itemId } = req.params;
    const { packed, item } = req.body;
    const { isMongoConnected } = getMongoStatus();

    let trip;
    if (isMongoConnected) {
      trip = await TripModel.findOne({
        _id: tripId,
        $or: [{ userId }, { 'sharedWith.email': userEmail }],
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      const isOwner = trip.userId === userId;
      const target = trip.packingList.find((p) => p.id === itemId || p._id?.toString() === itemId);
      if (!target) return res.status(404).json({ success: false, message: 'Item not found in checklist' });
      if (target.userId ? target.userId !== userId : !isOwner) {
        return res.status(403).json({ success: false, message: 'You can only edit your own packing list' });
      }
      if (packed !== undefined) target.packed = packed;
      if (item !== undefined && item.trim()) target.item = item.trim();
      await trip.save();
    } else {
      trip = localStore.findOne('trips', (t) => {
        if (t._id !== tripId && t.id !== tripId) return false;
        return t.userId === userId || (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      const isOwner = trip.userId === userId;
      const target = (trip.packingList || []).find((p) => p.id === itemId || p._id === itemId);
      if (!target) return res.status(404).json({ success: false, message: 'Item not found in checklist' });
      if (target.userId ? target.userId !== userId : !isOwner) {
        return res.status(403).json({ success: false, message: 'You can only edit your own packing list' });
      }
      const updatedList = (trip.packingList || []).map((p) => {
        if (p.id === itemId || p._id === itemId) {
          return {
            ...p,
            ...(packed !== undefined ? { packed } : {}),
            ...(item !== undefined && item.trim() ? { item: item.trim() } : {}),
          };
        }
        return p;
      });
      trip = localStore.update('trips', (t) => (t._id === tripId || t.id === tripId), { packingList: updatedList });
    }

    res.json({ success: true, trip: filterTripForUser(trip, userId) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/trips/:id/packing/:itemId - Delete packing item (only owner of the item can delete)
router.delete('/:id/packing/:itemId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const { id: tripId, itemId } = req.params;
    const { isMongoConnected } = getMongoStatus();

    let trip;
    if (isMongoConnected) {
      trip = await TripModel.findOne({
        _id: tripId,
        $or: [{ userId }, { 'sharedWith.email': userEmail }],
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      const isOwner = trip.userId === userId;
      const target = trip.packingList.find((p) => p.id === itemId || p._id?.toString() === itemId);
      if (!target) return res.status(404).json({ success: false, message: 'Item not found' });
      if (target.userId ? target.userId !== userId : !isOwner) {
        return res.status(403).json({ success: false, message: 'You can only delete your own packing items' });
      }
      trip.packingList = trip.packingList.filter((p) => p.id !== itemId && p._id?.toString() !== itemId);
      await trip.save();
    } else {
      trip = localStore.findOne('trips', (t) => {
        if (t._id !== tripId && t.id !== tripId) return false;
        return t.userId === userId || (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      const isOwner = trip.userId === userId;
      const target = (trip.packingList || []).find((p) => p.id === itemId || p._id === itemId);
      if (!target) return res.status(404).json({ success: false, message: 'Item not found' });
      if (target.userId ? target.userId !== userId : !isOwner) {
        return res.status(403).json({ success: false, message: 'You can only delete your own packing items' });
      }
      const updatedList = (trip.packingList || []).filter((p) => p.id !== itemId && p._id !== itemId);
      trip = localStore.update('trips', (t) => (t._id === tripId || t.id === tripId), { packingList: updatedList });
    }

    res.json({ success: true, trip: filterTripForUser(trip, userId) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/trips/:id/itinerary - Add itinerary item
router.post('/:id/itinerary', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const tripId = req.params.id;
    const { title, day, date, time, location, type, notes } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'Event title is required' });

    const newEvent = {
      id: 'it_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      day: Number(day) || 1,
      date: date || '',
      time: time || '09:00',
      location: location || '',
      type: type || 'activity',
      notes: notes || '',
    };

    const { isMongoConnected } = getMongoStatus();
    let trip;

    if (isMongoConnected) {
      trip = await TripModel.findOne({
        _id: tripId,
        $or: [{ userId }, { 'sharedWith.email': userEmail }],
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      trip.itinerary.push(newEvent);
      await trip.save();
    } else {
      trip = localStore.findOne('trips', (t) => {
        if (t._id !== tripId && t.id !== tripId) return false;
        return t.userId === userId || (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      if (!trip) return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
      const itinerary = [...(trip.itinerary || []), newEvent];
      trip = localStore.update('trips', (t) => (t._id === tripId || t.id === tripId), { itinerary });
    }

    res.json({ success: true, data: newEvent, trip });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
