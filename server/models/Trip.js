import mongoose from 'mongoose';

const packingItemSchema = new mongoose.Schema({
  id: { type: String, default: () => Math.random().toString(36).substring(2, 9) },
  userId: { type: String, default: '' },
  item: { type: String, required: true },
  packed: { type: Boolean, default: false },
  category: { type: String, default: 'General' }, // Clothes, Documents, Electronics, Toiletries, Essentials
});

const itineraryItemSchema = new mongoose.Schema({
  id: { type: String, default: () => Math.random().toString(36).substring(2, 9) },
  day: { type: Number, default: 1 },
  date: { type: String }, // YYYY-MM-DD
  time: { type: String }, // HH:MM
  title: { type: String, required: true },
  location: { type: String, default: '' },
  type: { type: String, default: 'activity' }, // flight, hotel, meal, activity, transit
  notes: { type: String, default: '' },
});

const collaboratorSchema = new mongoose.Schema({
  id: { type: String, default: () => Math.random().toString(36).substring(2, 9) },
  email: { type: String, lowercase: true, trim: true, required: true },
  name: { type: String, default: '' },
  role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
  addedAt: { type: String, default: () => new Date().toISOString() },
});

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: '',
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    themeColor: {
      type: String,
      default: '#0D9488', // teal primary
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming',
    },
    budget: {
      total: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    notes: {
      type: String,
      default: '',
    },
    packingList: [packingItemSchema],
    itinerary: [itineraryItemSchema],
    sharedWith: [collaboratorSchema],
    sharedBy: {
      type: String,
      default: '', // Owner name
    },
  },
  { timestamps: true }
);

export const TripModel = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
