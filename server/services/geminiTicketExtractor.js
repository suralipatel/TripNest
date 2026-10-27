import { GoogleGenAI } from '@google/genai';

export function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    process.env.GEMINI ||
    process.env['Gemini Key'] ||
    process.env['Gemini_Key'] ||
    process.env['gemini_api_key'] ||
    process.env['gemini_key'] ||
    process.env.API_KEY ||
    ''
  ).trim();
}

/**
 * Intelligent Document & Ticket Extractor using Google Gemini Flash Multimodal AI
 */
export async function extractTicketWithGemini({
  fileDataUrl,
  fileName = 'ticket.pdf',
  mimeType = 'application/pdf',
  activeTrip = null,
  ticketTypeHint = '',
}) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in server environment variables. Please get a free API key from https://aistudio.google.com/');
  }

  if (!fileDataUrl) {
    throw new Error('No document file data provided.');
  }

  // Parse mime type and base64 payload from data URL
  let base64Data = fileDataUrl;
  let resolvedMime = mimeType;

  if (fileDataUrl.includes(';base64,')) {
    const parts = fileDataUrl.split(';base64,');
    const header = parts[0];
    base64Data = parts[1];
    if (header.includes(':')) {
      resolvedMime = header.split(':')[1].split(';')[0];
    }
  }

  // Supported MIME types for Gemini multimodal
  const supportedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

  // If data URL header did not provide a supported MIME type, derive from fileName
  if (!supportedMimes.includes(resolvedMime)) {
    const lowerName = (fileName || '').toLowerCase();
    if (lowerName.endsWith('.pdf')) {
      resolvedMime = 'application/pdf';
    } else if (lowerName.endsWith('.png')) {
      resolvedMime = 'image/png';
    } else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      resolvedMime = 'image/jpeg';
    } else if (lowerName.endsWith('.webp')) {
      resolvedMime = 'image/webp';
    } else {
      resolvedMime = 'application/pdf';
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `You are an expert travel ticket and booking document parser for TripNest.
Analyze the provided ticket/booking document (airline boarding pass, e-ticket receipt, IRCTC train ticket, bus booking, hotel confirmation, ferry, or car rental) and accurately extract the travel details.

Context:
- Suggested/Current Category: "${ticketTypeHint || 'flight'}"
- Associated Trip Destination (if any): "${activeTrip?.destination || ''}"
- Associated Trip Start Date: "${activeTrip?.startDate ? activeTrip.startDate.slice(0, 10) : ''}"

Strict Extraction Rules:
1. Extract REAL data visible in the document. Never invent or hallucinate random PNRs or numbers.
2. If a field is not present or cannot be determined, return an empty string "" (or 0 for price).
3. "ticketType" MUST be one of: "flight", "train", "bus", "hotel", "car_rental", "ferry", "event", or "other".
4. "departureDate" and "arrivalDate" must strictly be in "YYYY-MM-DD" format.
5. "departureTime" and "arrivalTime" must strictly be in 24-hour "HH:MM" format (e.g. "14:30", "09:15").
6. For hotel bookings: "departureDate" = Check-in date, "arrivalDate" = Check-out date, "destinationName" = Hotel City.
7. Connecting / Layover Flights:
   - If the ticket has connecting / layover flights (e.g. Flight 1: DEL -> BOM, then Flight 2: BOM -> GOI):
     * Set "isConnectingFlight": true.
     * "originName" and "originCode" MUST be the FIRST departure airport (e.g. DEL / New Delhi).
     * "destinationName" and "destinationCode" MUST be the FINAL arrival airport (e.g. GOI / Goa).
     * Set "layoverInfo" describing the layover (e.g. "2h 15m in Mumbai (BOM)").
     * Populate "legs" array with each flight segment in order:
       [
         {
           "legIndex": 1,
           "flightNumber": "6E 2134",
           "provider": "IndiGo",
           "originName": "New Delhi",
           "originCode": "DEL",
           "destinationName": "Mumbai",
           "destinationCode": "BOM",
           "departureDate": "2026-11-15",
           "departureTime": "08:30",
           "arrivalDate": "2026-11-15",
           "arrivalTime": "10:45",
           "seat": "14A",
           "terminal": "T3",
           "gate": "4"
         },
         {
           "legIndex": 2,
           "flightNumber": "6E 5678",
           "provider": "IndiGo",
           "originName": "Mumbai",
           "originCode": "BOM",
           "destinationName": "Goa",
           "destinationCode": "GOI",
           "departureDate": "2026-11-15",
           "departureTime": "13:00",
           "arrivalDate": "2026-11-15",
           "arrivalTime": "14:15",
           "seat": "18C",
           "terminal": "T2",
           "gate": "12"
         }
       ]
   - If it is a direct flight without layovers, set "isConnectingFlight": false, "layoverInfo": "", and "legs": [].
8. Return ONLY a single raw JSON object matching the schema below. No markdown fences, no explanations.

Expected JSON output format:
{
  "ticketType": "flight",
  "title": "IndiGo 6E 2134",
  "provider": "IndiGo",
  "referenceNumber": "Y7KR2P",
  "originName": "New Delhi",
  "originCode": "DEL",
  "destinationName": "Mumbai",
  "destinationCode": "BOM",
  "departureDate": "2026-10-28",
  "departureTime": "10:30",
  "arrivalDate": "2026-10-28",
  "arrivalTime": "12:45",
  "passengerName": "John Doe",
  "seat": "14A",
  "gate": "Gate 4",
  "terminal": "T3",
  "classType": "Economy",
  "isConnectingFlight": false,
  "layoverInfo": "",
  "legs": [],
  "price": 4500,
  "currency": "INR",
  "notes": "Cabin baggage 7kg included"
}`;

  // Models to attempt: fast and stable flash models (tested: gemini-3.5-flash-lite, gemini-3.8-flash)
  const modelsToTry = [
    process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
  ];

  let lastError = null;
  let rawResponseText = '';
  let successfulModel = '';

  for (const model of modelsToTry) {
    try {
      console.log(`[Gemini Extractor] Attempting extraction with model: ${model}...`);
      
      // 35s timeout per model attempt
      const generatePromise = ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: resolvedMime,
                  data: base64Data,
                },
              },
              {
                text: systemPrompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after 20s on ${model}`)), 20000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      rawResponseText = response?.text || '';
      if (rawResponseText) {
        successfulModel = model;
        console.log(`[Gemini Extractor] ✅ Extraction successful using: ${model}`);
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Extractor] Model ${model} failed (${err.message}). Trying next available model...`);
    }
  }

  if (!rawResponseText) {
    throw new Error(lastError ? `Gemini extraction failed: ${lastError.message}` : 'Empty response from Gemini AI');
  }

  // Parse JSON response safely
  let parsed;
  try {
    // Strip markdown code fences if model returned them
    const cleanedJson = rawResponseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleanedJson);
  } catch (parseErr) {
    console.error('Failed to parse Gemini JSON output:', rawResponseText);
    throw new Error('AI output was not in valid JSON format. Please try again.');
  }

  // Validate and sanitize returned fields
  const ticketType = ['flight', 'train', 'bus', 'hotel', 'car_rental', 'ferry', 'event', 'other'].includes(parsed.ticketType)
    ? parsed.ticketType
    : (ticketTypeHint || 'flight');

  // Format Departure & Arrival ISO strings for consistency
  const depDate = parsed.departureDate || (activeTrip?.startDate ? activeTrip.startDate.slice(0, 10) : '');
  const depTime = parsed.departureTime || '10:30';
  const arrDate = parsed.arrivalDate || depDate;
  const arrTime = parsed.arrivalTime || '13:00';

  const departureDateTime = depDate ? `${depDate}T${depTime}` : '';
  const arrivalDateTime = arrDate ? `${arrDate}T${arrTime}` : '';

  const isConnecting = Boolean(
    parsed.isConnectingFlight ||
    (Array.isArray(parsed.legs) && parsed.legs.length > 1)
  );
  const legs = Array.isArray(parsed.legs) ? parsed.legs : [];
  const layoverInfo = parsed.layoverInfo || '';

  return {
    success: true,
    aiModel: 'Gemini Flash',
    ticketType,
    title: parsed.title || '',
    provider: parsed.provider || '',
    referenceNumber: parsed.referenceNumber || '',
    originName: parsed.originName || '',
    originCode: (parsed.originCode || '').toUpperCase().trim(),
    destinationName: parsed.destinationName || '',
    destinationCode: (parsed.destinationCode || '').toUpperCase().trim(),
    departureDate: depDate,
    departureTime: depTime,
    departureDateTime,
    arrivalDate: arrDate,
    arrivalTime: arrTime,
    arrivalDateTime,
    passengerName: parsed.passengerName || '',
    seat: parsed.seat || '',
    gate: parsed.gate || '',
    terminal: parsed.terminal || '',
    classType: parsed.classType || (ticketType === 'train' ? '3rd AC' : 'Economy'),
    isConnectingFlight: isConnecting,
    layoverInfo,
    legs,
    price: Number(parsed.price) || 0,
    currency: parsed.currency || 'INR',
    notes: parsed.notes || `Extracted via Gemini AI from ${fileName}`,
  };
}
