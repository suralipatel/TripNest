import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tripId: {
      type: String,
      default: '',
      index: true,
    },
    tripTitle: {
      type: String,
      default: '',
    },
    ticketType: {
      type: String,
      enum: ['flight', 'train', 'hotel', 'event', 'car_rental', 'ferry', 'other'],
      default: 'flight',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      default: '',
    },
    referenceNumber: {
      type: String,
      default: '',
      trim: true,
    },
    // Departure / Start
    originName: {
      type: String,
      default: '',
    },
    originCode: {
      type: String,
      default: '', // JFK, NRT, etc.
    },
    departureDateTime: {
      type: String,
      default: '',
    },
    // Arrival / End
    destinationName: {
      type: String,
      default: '',
    },
    destinationCode: {
      type: String,
      default: '', // HND, KIX, etc.
    },
    arrivalDateTime: {
      type: String,
      default: '',
    },
    // Passenger & Seating info
    passengerName: {
      type: String,
      default: '',
    },
    seat: {
      type: String,
      default: '', // 14A, Car 4 Seat 12B
    },
    gate: {
      type: String,
      default: '',
    },
    terminal: {
      type: String,
      default: '',
    },
    classType: {
      type: String,
      default: 'Standard', // Economy, Business, First, Deluxe
    },
    // Codes
    qrCodeData: {
      type: String,
      default: '',
    },
    barcodeValue: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['confirmed', 'checked_in', 'boarding', 'completed'],
      default: 'confirmed',
    },
    price: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    notes: {
      type: String,
      default: '',
    },
    accentColor: {
      type: String,
      default: '#0D9488',
    },
    ticketFile: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

export const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', ticketSchema);
