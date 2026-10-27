import express from 'express';
import { TicketModel } from '../models/Ticket.js';
import { TripModel } from '../models/Trip.js';
import { localStore, getMongoStatus } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { extractTicketWithGemini, getGeminiApiKey } from '../services/geminiTicketExtractor.js';

const router = express.Router();

router.use(authenticateToken);

// POST /api/tickets/extract-document - Extract ticket details from PDF/Image using Gemini Flash Multimodal AI
router.post('/extract-document', async (req, res) => {
  try {
    const { fileDataUrl, fileName, mimeType, activeTrip, ticketType } = req.body;

    if (!fileDataUrl) {
      return res.status(400).json({ success: false, message: 'No file data received for extraction.' });
    }

    const extracted = await extractTicketWithGemini({
      fileDataUrl,
      fileName,
      mimeType,
      activeTrip,
      ticketTypeHint: ticketType,
    });

    res.json({ success: true, data: extracted });
  } catch (err) {
    console.error('Gemini extraction error in route:', err.message);
    const hasKey = Boolean(getGeminiApiKey());
    const isMissingKey = !hasKey || err.message.includes('GEMINI_API_KEY is not configured');
    res.status(isMissingKey ? 400 : 500).json({
      success: false,
      code: isMissingKey ? 'MISSING_GEMINI_KEY' : 'EXTRACTION_FAILED',
      message: err.message || 'Failed to extract ticket details with Gemini AI',
    });
  }
});

// GET /api/tickets - List all tickets for current user (owned or shared trips)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const { tripId, ticketType } = req.query;
    const { isMongoConnected } = getMongoStatus();

    let accessibleTripIds = [];
    if (isMongoConnected) {
      const trips = await TripModel.find(
        { $or: [{ userId }, { 'sharedWith.email': userEmail }] },
        '_id'
      );
      accessibleTripIds = trips.map((t) => t._id.toString());
    } else {
      const trips = localStore.find('trips', (t) => {
        if (t.userId === userId) return true;
        return (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      accessibleTripIds = trips.map((t) => (t._id || t.id).toString());
    }

    let tickets;
    if (isMongoConnected) {
      const query = {
        $or: [
          { userId },
          { tripId: { $in: accessibleTripIds } },
        ],
      };
      if (tripId) query.tripId = tripId;
      if (ticketType && ticketType !== 'all') query.ticketType = ticketType;
      tickets = await TicketModel.find(query).sort({ departureDateTime: 1 });
    } else {
      tickets = localStore.find('tickets', (t) => {
        const hasAccess = t.userId === userId || accessibleTripIds.includes(String(t.tripId));
        if (!hasAccess) return false;
        if (tripId && t.tripId !== tripId) return false;
        if (ticketType && ticketType !== 'all' && t.ticketType !== ticketType) return false;
        return true;
      });
      tickets.sort((a, b) => (a.departureDateTime || '').localeCompare(b.departureDateTime || ''));
    }

    res.json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/tickets/:id - Single ticket
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const { id } = req.params;
    const { isMongoConnected } = getMongoStatus();

    let accessibleTripIds = [];
    if (isMongoConnected) {
      const trips = await TripModel.find(
        { $or: [{ userId }, { 'sharedWith.email': userEmail }] },
        '_id'
      );
      accessibleTripIds = trips.map((t) => t._id.toString());
    } else {
      const trips = localStore.find('trips', (t) => {
        if (t.userId === userId) return true;
        return (t.sharedWith || []).some((s) => (s.email || '').toLowerCase().trim() === userEmail);
      });
      accessibleTripIds = trips.map((t) => (t._id || t.id).toString());
    }

    let ticket;
    if (isMongoConnected) {
      ticket = await TicketModel.findOne({
        _id: id,
        $or: [{ userId }, { tripId: { $in: accessibleTripIds } }],
      });
    } else {
      ticket = localStore.findOne('tickets', (t) => {
        if (t._id !== id && t.id !== id) return false;
        return t.userId === userId || accessibleTripIds.includes(String(t.tripId));
      });
    }

    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/tickets - Create ticket
router.post('/', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      tripId,
      tripTitle,
      ticketType,
      title,
      provider,
      referenceNumber,
      originName,
      originCode,
      departureDateTime,
      destinationName,
      destinationCode,
      arrivalDateTime,
      passengerName,
      seat,
      gate,
      terminal,
      classType,
      price,
      currency,
      notes,
      accentColor,
      ticketFile,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Ticket title is required' });
    }

    const { isMongoConnected } = getMongoStatus();

    // Color accents based on ticket type
    const defaultColorMap = {
      flight: '#0D9488', // Teal
      train: '#059669', // Emerald
      hotel: '#2563EB', // Blue
      bus: '#D97706', // Amber
      event: '#D97706', // Amber
      car_rental: '#7C3AED', // Purple
      ferry: '#0284C7', // Sky
      other: '#4B5563', // Slate
    };

    // Auto-generate realistic barcode & QR data
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrData = `TN-${ticketType ? ticketType.toUpperCase() : 'TKT'}-${referenceNumber || randomCode}-${originCode || 'ORG'}-${destinationCode || 'DST'}-${Date.now()}`;
    const barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    // If ticket file has inline base64 dataUrl, upload to Cloudinary if configured
    let processedFile = ticketFile || null;
    if (processedFile && processedFile.dataUrl) {
      const uploadRes = await uploadToCloudinary(processedFile.dataUrl, 'tripnest/tickets');
      processedFile = {
        ...processedFile,
        dataUrl: uploadRes.url,
      };
    }

    const ticketData = {
      userId,
      tripId: tripId || '',
      tripTitle: tripTitle || '',
      ticketType: ticketType || 'flight',
      title: title.trim(),
      provider: provider ? provider.trim() : '',
      referenceNumber: referenceNumber ? referenceNumber.trim() : `TN-${randomCode}`,
      originName: originName || '',
      originCode: (originCode || '').toUpperCase().trim(),
      departureDateTime: departureDateTime || new Date().toISOString().slice(0, 16),
      destinationName: destinationName || '',
      destinationCode: (destinationCode || '').toUpperCase().trim(),
      arrivalDateTime: arrivalDateTime || '',
      passengerName: passengerName || req.user.name || 'Traveler',
      seat: seat || '',
      gate: gate || '',
      terminal: terminal || '',
      classType: classType || 'Standard',
      isConnectingFlight: Boolean(req.body.isConnectingFlight),
      layoverInfo: req.body.layoverInfo || '',
      legs: Array.isArray(req.body.legs) ? req.body.legs : [],
      qrCodeData: qrData,
      barcodeValue: barcode,
      status: 'confirmed',
      price: Number(price) || 0,
      currency: currency || 'INR',
      notes: notes || '',
      accentColor: accentColor || defaultColorMap[ticketType] || '#0D9488',
      ticketFile: processedFile,
    };

    let saved;
    if (isMongoConnected) {
      const doc = new TicketModel(ticketData);
      saved = await doc.save();
    } else {
      saved = localStore.insert('tickets', ticketData);
    }

    res.status(201).json({ success: true, message: 'Ticket added to your wallet!', data: saved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/tickets/:id - Update ticket
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = { ...req.body };
    const { isMongoConnected } = getMongoStatus();

    // If updating ticketFile with base64 dataUrl, upload to Cloudinary if configured
    if (updateData.ticketFile && updateData.ticketFile.dataUrl) {
      const uploadRes = await uploadToCloudinary(updateData.ticketFile.dataUrl, 'tripnest/tickets');
      updateData.ticketFile = {
        ...updateData.ticketFile,
        dataUrl: uploadRes.url,
      };
    }

    let updated;
    if (isMongoConnected) {
      updated = await TicketModel.findOneAndUpdate({ _id: id, userId }, updateData, { new: true });
    } else {
      updated = localStore.update('tickets', (t) => (t._id === id || t.id === id) && t.userId === userId, updateData);
    }

    if (!updated) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.json({ success: true, message: 'Ticket updated successfully!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { isMongoConnected } = getMongoStatus();

    if (isMongoConnected) {
      await TicketModel.deleteOne({ _id: id, userId });
    } else {
      localStore.delete('tickets', (t) => (t._id === id || t.id === id) && t.userId === userId);
    }

    res.json({ success: true, message: 'Ticket removed from your wallet.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
