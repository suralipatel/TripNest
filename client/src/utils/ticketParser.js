// Intelligent Ticket & Document Parser for TripNest
// Uses pdfjs-dist for digital PDF documents and tesseract.js for image OCR.
// Extracts Location, Date, Time, PNR, Flight/Train/Bus numbers, Passenger, and Seat.

import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF worker configuration fallback:', e);
  }
}

// Common Airport IATA Codes with City Names
const AIRPORTS = {
  DEL: 'New Delhi (DEL)',
  BOM: 'Mumbai (BOM)',
  BLR: 'Bengaluru (BLR)',
  HYD: 'Hyderabad (HYD)',
  MAA: 'Chennai (MAA)',
  CCU: 'Kolkata (CCU)',
  AMD: 'Ahmedabad (AMD)',
  STV: 'Surat (STV)',
  GOI: 'Goa Dabolim (GOI)',
  GOX: 'Goa Mopa (GOX)',
  PNQ: 'Pune (PNQ)',
  COK: 'Kochi (COK)',
  JAI: 'Jaipur (JAI)',
  LKO: 'Lucknow (LKO)',
  SXR: 'Srinagar (SXR)',
  IXC: 'Chandigarh (IXC)',
  DXB: 'Dubai (DXB)',
  LHR: 'London Heathrow (LHR)',
  LGW: 'London Gatwick (LGW)',
  JFK: 'New York JFK (JFK)',
  SIN: 'Singapore Changi (SIN)',
  BKK: 'Bangkok Suvarnabhumi (BKK)',
  HND: 'Tokyo Haneda (HND)',
  NRT: 'Tokyo Narita (NRT)',
  CDG: 'Paris Charles de Gaulle (CDG)',
  FRA: 'Frankfurt (FRA)',
};

// Common Indian & International City Names
const CITY_NAMES = [
  'Delhi', 'New Delhi', 'Mumbai', 'Bombay', 'Bengaluru', 'Bangalore', 'Hyderabad',
  'Chennai', 'Madras', 'Kolkata', 'Calcutta', 'Ahmedabad', 'Surat', 'Pune', 'Jaipur',
  'Lucknow', 'Goa', 'Kochi', 'Cochin', 'Chandigarh', 'Indore', 'Bhopal', 'Vadodara',
  'Nagpur', 'Varanasi', 'Amritsar', 'Agra', 'Udaipur', 'Manali', 'Shimla', 'Dehradun',
  'Tokyo', 'Kyoto', 'Osaka', 'London', 'Paris', 'New York', 'Singapore', 'Dubai',
  'Bangkok', 'Amsterdam', 'Rome', 'Barcelona', 'Berlin', 'Sydney', 'Toronto',
];

// Major Airline Code Mapping
const AIRLINE_CODES = {
  '6E': 'IndiGo',
  AI: 'Air India',
  UK: 'Vistara',
  SG: 'SpiceJet',
  QP: 'Akasa Air',
  IX: 'Air India Express',
  G8: 'Go First',
  EK: 'Emirates',
  QR: 'Qatar Airways',
  SQ: 'Singapore Airlines',
  EY: 'Etihad Airways',
  LH: 'Lufthansa',
  BA: 'British Airways',
  AF: 'Air France',
  KL: 'KLM',
  TK: 'Turkish Airlines',
  TG: 'Thai Airways',
  MH: 'Malaysia Airlines',
  CX: 'Cathay Pacific',
  AA: 'American Airlines',
  UA: 'United Airlines',
  DL: 'Delta Air Lines',
};

/**
 * Extract readable text from an uploaded file (PDF or Image)
 */
export async function extractRawTextFromFile(file) {
  if (!file) return '';

  const fileName = (file.name || '').toLowerCase();
  const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
  const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff)$/i.test(fileName);

  // 1. PDF Document Parsing using PDF.js
  if (isPdf) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });
      const pdfDoc = await loadingTask.promise;
      let fullText = '';

      const maxPages = Math.min(pdfDoc.numPages, 4);
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => item.str || '')
          .join(' ');
        fullText += `\n--- Page ${i} ---\n` + pageText;
      }

      if (fullText.trim().length > 20) {
        return fullText;
      }
    } catch (pdfErr) {
      console.warn('PDF.js text extraction failed, trying binary fallback:', pdfErr);
    }

    // Binary regex fallback for simple uncompressed PDFs
    try {
      const buffer = await file.arrayBuffer();
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const decoded = textDecoder.decode(buffer);
      const cleaned = decoded.replace(/[^\x20-\x7E\n]/g, ' ');
      if (cleaned.length > 30) return cleaned;
    } catch (e) {
      console.warn('Binary PDF fallback failed:', e);
    }
  }

  // 2. Image OCR using Tesseract.js
  if (isImage) {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();
      if (ret?.data?.text && ret.data.text.trim().length > 10) {
        return ret.data.text;
      }
    } catch (ocrErr) {
      console.warn('Tesseract OCR extraction failed:', ocrErr);
    }
  }

  return '';
}

/**
 * Intelligent parser that extracts Date, Time, Location, PNR, Flight/Train, Seat, etc.
 */
export async function parseTicketDocument(file, selectedType = 'flight', trip = null) {
  let rawText = '';
  if (file) {
    try {
      rawText = await extractRawTextFromFile(file);
    } catch (e) {
      console.warn('Error reading raw text from file:', e);
    }
  }

  const fileName = (file?.name || '').toLowerCase();
  const searchCorpus = `${fileName}\n${rawText}`;
  const searchLower = searchCorpus.toLowerCase();

  // 1. Detect Category / Ticket Type
  let detectedType = selectedType || 'flight';
  if (
    searchLower.includes('train') ||
    searchLower.includes('irctc') ||
    searchLower.includes('railway') ||
    searchLower.includes('pnr status') ||
    searchLower.includes('berth') ||
    searchLower.includes('coach')
  ) {
    detectedType = 'train';
  } else if (
    searchLower.includes('bus') ||
    searchLower.includes('redbus') ||
    searchLower.includes('intrcity') ||
    searchLower.includes('zingbus') ||
    searchLower.includes('volvo') ||
    searchLower.includes('boarding point')
  ) {
    detectedType = 'bus';
  } else if (
    searchLower.includes('hotel') ||
    searchLower.includes('resort') ||
    searchLower.includes('check-in') ||
    searchLower.includes('check-out') ||
    searchLower.includes('booking.com') ||
    searchLower.includes('room type')
  ) {
    detectedType = 'hotel';
  } else if (
    searchLower.includes('flight') ||
    searchLower.includes('boarding pass') ||
    searchLower.includes('airline') ||
    searchLower.includes('gate') ||
    searchLower.includes('terminal') ||
    searchLower.includes('seat')
  ) {
    detectedType = 'flight';
  }

  // 2. Extract PNR / Booking Reference / Ticket Number
  let referenceNumber = '';
  const pnrRegexes = [
    /(?:pnr|booking\s*(?:ref|reference|id)?|ticket\s*(?:no|number)?|confirmation\s*(?:code|no)?)[:\s#\-]*([A-Za-z0-9]{6,12})\b/i,
    /\b([A-Z0-9]{6})\b/g, // 6-character alphanumeric airline PNR (e.g. Y7KR2P)
    /\b(\d{10})\b/g, // IRCTC 10-digit PNR
  ];

  for (const regex of pnrRegexes) {
    const match = rawText.match(regex);
    if (match) {
      const candidate = (match[1] || match[0]).trim().toUpperCase();
      // Avoid matching common words
      if (!['FLIGHT', 'TICKET', 'NUMBER', 'TERMIN', 'PASSEN', 'SECTOR'].includes(candidate)) {
        referenceNumber = candidate;
        break;
      }
    }
  }

  // Do NOT invent fake random PNR if none found - keep empty for user to fill
  // referenceNumber stays empty if not detected

  // 3. Extract Locations (Origin & Destination)
  let originName = '';
  let originCode = '';
  let destinationName = '';
  let destinationCode = '';

  const invalidPlaceWords = new Set([
    'point', 'points', 'grade', 'boarding', 'dropping', 'departure', 'arrival', 'date', 'time',
    'name', 'student', 'certificate', 'university', 'college', 'school', 'institute', 'department',
    'course', 'signature', 'verified', 'status', 'total', 'marks', 'score', 'credit', 'credits',
    'flight', 'train', 'ticket', 'passenger', 'number', 'address', 'details', 'notice', 'award',
    'hub', 'city', 'state', 'country', 'male', 'female', 'gender', 'age', 'year', 'month'
  ]);

  const isValidPlace = (txt) => {
    if (!txt) return false;
    const clean = txt.trim().toLowerCase();
    if (clean.length < 3 || clean.length > 25) return false;
    if (invalidPlaceWords.has(clean)) return false;
    return true;
  };

  // Look for route patterns like "From: Mumbai To: Delhi"
  const fromToMatch = rawText.match(/\b(?:from|origin|departure\s*city|boarding\s*(?:point|at))\s*[:\-]*\s*([A-Za-z\s]{3,20}?)\s+(?:to|destination|arrival\s*city|dropping\s*(?:point|at))\s*[:\-]*\s*([A-Za-z\s]{3,20})\b/i);
  if (fromToMatch) {
    const c1 = fromToMatch[1].trim();
    const c2 = fromToMatch[2].trim();
    if (isValidPlace(c1) && isValidPlace(c2)) {
      originName = c1;
      destinationName = c2;
    }
  }

  // Check for 3-letter IATA airport codes in the text
  const foundCodes = [];
  for (const [code, fullName] of Object.entries(AIRPORTS)) {
    const codeRegex = new RegExp(`\\b${code}\\b`, 'i');
    if (codeRegex.test(rawText)) {
      foundCodes.push({ code, fullName });
    }
  }

  if (foundCodes.length >= 2) {
    originCode = foundCodes[0].code;
    originName = foundCodes[0].fullName;
    destinationCode = foundCodes[1].code;
    destinationName = foundCodes[1].fullName;
  } else if (foundCodes.length === 1) {
    destinationCode = foundCodes[0].code;
    destinationName = foundCodes[0].fullName;
  }

  // Search for known City Names if origin or destination is still empty
  if (!originName || !destinationName) {
    const foundCities = [];
    for (const city of CITY_NAMES) {
      const cityRegex = new RegExp(`\\b${city}\\b`, 'i');
      if (cityRegex.test(rawText)) {
        foundCities.push(city);
      }
    }
    if (foundCities.length >= 2) {
      if (!originName) originName = foundCities[0];
      if (!destinationName) destinationName = foundCities[1];
    } else if (foundCities.length === 1 && !destinationName) {
      destinationName = foundCities[0];
    }
  }

  // Fallback to active trip destination if destination not found
  if (!destinationName && trip?.destination) {
    const cleanDest = trip.destination.split(',')[0].trim();
    destinationName = cleanDest;
    destinationCode = cleanDest.substring(0, 3).toUpperCase();
  }

  if (originName && !originCode) {
    originCode = originName.substring(0, 3).toUpperCase();
  }
  if (destinationName && !destinationCode) {
    destinationCode = destinationName.substring(0, 3).toUpperCase();
  }

  // 4. Extract Travel Date & Time
  let extractedDate = null;
  let extractedTime = null;

  // Search for date patterns: "28 Oct 2026", "28/10/2026", "2026-10-28", "28-Oct-26"
  const datePatterns = [
    /\b(\d{1,2})[\s\-\/](Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-\/](\d{2,4})\b/i,
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})[,\s]+(\d{2,4})\b/i,
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,
    /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
  ];

  for (const pat of datePatterns) {
    const m = rawText.match(pat);
    if (m) {
      try {
        const parsedD = new Date(m[0]);
        if (!isNaN(parsedD.getTime())) {
          extractedDate = parsedD;
          break;
        }
      } catch (e) {}
    }
  }

  // Search for time patterns: "14:30", "02:30 PM", "09:15 AM", "10:15"
  const timeRegex = /\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\s*(am|pm)?\b/i;
  const timeMatch = rawText.match(timeRegex);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2];
    const meridiem = (timeMatch[3] || '').toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    extractedTime = `${String(hour).padStart(2, '0')}:${minute}`;
  }

  // Construct Departure Date & Time ISO strings
  const baseDate = extractedDate || (trip?.startDate ? new Date(trip.startDate) : new Date(Date.now() + 86400000 * 2));
  const timeStr = extractedTime || (detectedType === 'train' ? '09:15' : detectedType === 'bus' ? '21:30' : '10:30');
  const [h, min] = timeStr.split(':');
  baseDate.setHours(parseInt(h, 10), parseInt(min, 10), 0, 0);

  const departureDateTime = `${baseDate.toISOString().slice(0, 10)}T${timeStr}`;

  // Estimate Arrival Time (+2.5h for flight, +6h for train, +8h for bus)
  const durationHours = detectedType === 'flight' ? 2.5 : detectedType === 'train' ? 6 : detectedType === 'bus' ? 8 : 24;
  const arrivalDate = new Date(baseDate.getTime() + durationHours * 3600 * 1000);
  const arrTimeStr = `${String(arrivalDate.getHours()).padStart(2, '0')}:${String(arrivalDate.getMinutes()).padStart(2, '0')}`;
  const arrivalDateTime = `${arrivalDate.toISOString().slice(0, 10)}T${arrTimeStr}`;

  // 5. Extract Title / Airline / Train / Bus / Service Number
  let title = '';
  let provider = '';

  if (detectedType === 'flight') {
    // Look for Flight Numbers like "6E 2134", "AI 802", "UK 945"
    const flightMatch = rawText.match(/\b(6E|AI|UK|SG|QP|IX|EK|QR|SQ|LH|BA|AF|AA|UA|DL)[-\s]?(\d{2,4})\b/i);
    if (flightMatch) {
      const code = flightMatch[1].toUpperCase();
      const num = flightMatch[2];
      provider = AIRLINE_CODES[code] || 'Airlines';
      title = `${provider} ${code} ${num}`;
    } else {
      title = destinationName ? `Flight to ${destinationName.split(' ')[0]}` : 'Flight Ticket';
      provider = '';
    }
  } else if (detectedType === 'train') {
    // Look for 5 digit train numbers
    const trainMatch = rawText.match(/\b(\d{5})\b/);
    const trainNameMatch = rawText.match(/\b(Rajdhani|Shatabdi|Vande Bharat|Express|Duronto|Mail|Superfast)\b/i);
    const tNum = trainMatch ? trainMatch[1] : '';
    const tName = trainNameMatch ? trainNameMatch[1] : 'Express';
    title = tNum ? `${tNum} ${tName}` : `${tName} Train`;
    provider = 'Indian Railways (IRCTC)';
  } else if (detectedType === 'bus') {
    const busMatch = rawText.match(/\b(IntrCity|Zingbus|FlixBus|redBus|KSRTC|GSRTC|MSRTC|Volvo|Neeta|SRS|VRL)\b/i);
    provider = busMatch ? busMatch[1] : '';
    title = provider ? `${provider} Bus` : 'Bus Ticket';
  } else {
    // Hotel
    const hotelMatch = rawText.match(/(?:hotel|resort|inn|palace|suites)[:\s]*([A-Za-z\s]{3,30})/i);
    title = hotelMatch ? hotelMatch[1].trim() : (destinationName ? `Hotel in ${destinationName.split(' ')[0]}` : 'Hotel Booking');
    provider = hotelMatch ? hotelMatch[1].trim() : '';
  }

  // 6. Extract Seat / Berth
  let seat = '';
  const seatMatch = rawText.match(/(?:seat|berth|room)[:\s#]*([A-Za-z0-9\s\-]{1,12})\b/i);
  if (seatMatch) {
    seat = seatMatch[1].trim();
  } else if (detectedType === 'flight') {
    const flightSeatMatch = rawText.match(/\b([0-4]?\d[A-F])\b/);
    seat = flightSeatMatch ? flightSeatMatch[1] : '';
  }

  // 7. Extract Gate & Terminal
  let gate = '';
  const gateMatch = rawText.match(/(?:gate)[:\s#]*([A-Za-z0-9]+)\b/i);
  if (gateMatch) gate = `Gate ${gateMatch[1].toUpperCase()}`;

  let terminal = '';
  const termMatch = rawText.match(/(?:terminal|t)[:\s#]*([0-9A-Za-z]+)\b/i);
  if (termMatch) terminal = `T${termMatch[1].toUpperCase()}`;

  // 8. Extract Passenger Name
  let passengerName = '';
  const paxMatch = rawText.match(/(?:passenger(?:\s*name)?|pax|guest|name)[:\s]*([A-Za-z\s]{3,25})(?:\n|\s{2,}|$)/i);
  if (paxMatch) {
    passengerName = paxMatch[1].trim();
  }

  // Detect whether document actually contains travel-related context
  const travelKeywords = [
    'flight', 'boarding pass', 'airline', 'airways', 'indigo', 'air india', 'spicejet', 'vistara',
    'train', 'irctc', 'railway', 'berth', 'coach', 'pnr',
    'bus', 'redbus', 'volvo', 'passenger', 'ticket', 'departure', 'arrival', 'seat',
    'check-in', 'checkout', 'hotel', 'resort', 'booking.com', 'reservation', 'fare'
  ];
  const isLikelyTicket = travelKeywords.some((kw) => searchLower.includes(kw));

  return {
    isLikelyTicket,
    ticketType: detectedType,
    title,
    provider,
    referenceNumber,
    originName,
    originCode,
    destinationName,
    destinationCode,
    departureDateTime,
    arrivalDateTime,
    passengerName: passengerName || '',
    seat,
    gate: gate || (terminal ? `${terminal}` : ''),
    terminal: terminal || '',
    classType: detectedType === 'train' ? '3rd AC' : 'Economy',
    price: 0,
    currency: 'INR',
    notes: isLikelyTicket
      ? `Extracted from ${file?.name || 'document'}.`
      : `Extracted from ${file?.name || 'document'}. (Please verify details as this document may not be a travel ticket)`,
  };
}
