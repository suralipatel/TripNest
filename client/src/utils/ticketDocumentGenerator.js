// Ticket Document Generator
// Generates high-fidelity, authentic visual ticket documents (Boarding Passes & E-Tickets)
// for any ticket that does not yet have an uploaded PDF/image file.

export function generateTicketDocumentSvg(ticket) {
  const type = ticket.ticketType || 'flight';
  const title = ticket.title || 'Boarding Pass';
  const provider = ticket.provider || (type === 'flight' ? 'Airline Express' : type === 'train' ? 'Indian Railways' : 'Express Bus');
  const pnr = (ticket.referenceNumber || ticket.pnr || '2918471049').replace(/^PNR[-:\s]*/i, '');
  const passenger = ticket.passengerName || 'Alex Morgan';
  const seat = ticket.seat || '14A';
  const gate = ticket.gate || (type === 'flight' ? 'Gate 18, T3' : 'Platform 2');
  const classType = ticket.classType || 'Economy';
  const originCode = ticket.originCode || (type === 'hotel' ? 'IN' : 'DEL');
  const originName = ticket.originName || 'New Delhi';
  const destCode = ticket.destinationCode || (type === 'hotel' ? 'OUT' : 'BOM');
  const destName = ticket.destinationName || 'Mumbai';
  const depTime = ticket.departureDateTime ? ticket.departureDateTime.slice(11, 16) || '10:30' : '10:30';
  const arrTime = ticket.arrivalDateTime ? ticket.arrivalDateTime.slice(11, 16) || '13:00' : '13:00';
  const dateStr = ticket.departureDateTime ? ticket.departureDateTime.slice(0, 10) : '2026-11-12';

  const themeColor = type === 'train' ? '#059669' : type === 'bus' ? '#D97706' : type === 'hotel' ? '#2563EB' : '#0D9488';
  const typeLabel = type === 'flight' ? 'OFFICIAL BOARDING PASS' : type === 'train' ? 'E-RAILWAY TICKET' : type === 'bus' ? 'INTERCITY BUS PASS' : 'HOTEL VOUCHER';

  // Build high-res SVG document (920 x 480)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="480" viewBox="0 0 920 480" style="background:#F8FAFC; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${themeColor}"/>
      <stop offset="100%" stop-color="#0F1E36"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0F1E36" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Card Background -->
  <rect x="20" y="20" width="880" height="440" rx="20" fill="#FFFFFF" filter="url(#shadow)" stroke="#E2E8F0" stroke-width="1.5"/>

  <!-- Top Banner -->
  <path d="M 20 40 Q 20 20 40 20 L 880 20 Q 900 20 900 40 L 900 95 L 20 95 Z" fill="url(#headerGrad)"/>

  <!-- Top Banner Content -->
  <text x="50" y="52" fill="#FFFFFF" font-size="12" font-weight="700" letter-spacing="2" opacity="0.85">${typeLabel}</text>
  <text x="50" y="78" fill="#FFFFFF" font-size="20" font-weight="800">${provider.toUpperCase()} • ${title}</text>
  <text x="870" y="60" text-anchor="end" fill="#FFFFFF" font-size="11" font-weight="600" opacity="0.8">CONFIRMATION / PNR</text>
  <text x="870" y="82" text-anchor="end" fill="#FFFFFF" font-size="18" font-weight="800" font-family="monospace">${pnr}</text>

  <!-- Route Big Display -->
  <g transform="translate(50, 130)">
    <!-- Origin -->
    <text x="0" y="42" fill="#0F1E36" font-size="44" font-weight="900" letter-spacing="-1">${originCode}</text>
    <text x="0" y="68" fill="#64748B" font-size="14" font-weight="600">${originName}</text>
    <text x="0" y="92" fill="${themeColor}" font-size="18" font-weight="700">DEP ${depTime}</text>

    <!-- Center Line & Icon -->
    <path d="M 180 32 L 400 32" stroke="#CBD5E1" stroke-width="2.5" stroke-dasharray="6,6"/>
    <circle cx="290" cy="32" r="16" fill="${themeColor}"/>
    <polygon points="286,26 298,32 286,38" fill="#FFFFFF"/>
    <rect x="230" y="54" width="120" height="24" rx="12" fill="#ECFDF5" stroke="#A7F3D0"/>
    <text x="290" y="70" text-anchor="middle" fill="#059669" font-size="11.5" font-weight="700">${dateStr}</text>

    <!-- Destination -->
    <text x="450" y="42" fill="#0F1E36" font-size="44" font-weight="900" letter-spacing="-1">${destCode}</text>
    <text x="450" y="68" fill="#64748B" font-size="14" font-weight="600">${destName}</text>
    <text x="450" y="92" fill="${themeColor}" font-size="18" font-weight="700">ARR ${arrTime}</text>
  </g>

  <!-- Perforated Tear Line -->
  <line x1="620" y1="95" x2="620" y2="460" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="8,8"/>
  <circle cx="620" cy="95" r="10" fill="#F8FAFC"/>
  <circle cx="620" cy="460" r="10" fill="#F8FAFC"/>

  <!-- Passenger & Booking Details (Left Side Bottom) -->
  <g transform="translate(50, 270)">
    <!-- Passenger -->
    <text x="0" y="16" fill="#94A3B8" font-size="11" font-weight="700" letter-spacing="1">PASSENGER NAME</text>
    <text x="0" y="40" fill="#0F1E36" font-size="18" font-weight="800">${passenger.toUpperCase()}</text>

    <!-- Seat -->
    <text x="220" y="16" fill="#94A3B8" font-size="11" font-weight="700" letter-spacing="1">SEAT / BERTH</text>
    <text x="220" y="40" fill="#0F1E36" font-size="20" font-weight="900">${seat}</text>

    <!-- Gate / Platform -->
    <text x="360" y="16" fill="#94A3B8" font-size="11" font-weight="700" letter-spacing="1">GATE / PLATFORM</text>
    <text x="360" y="40" fill="#0F1E36" font-size="18" font-weight="800">${gate}</text>

    <!-- Class -->
    <text x="490" y="16" fill="#94A3B8" font-size="11" font-weight="700" letter-spacing="1">CLASS</text>
    <text x="490" y="40" fill="#0F1E36" font-size="18" font-weight="800">${classType}</text>

    <!-- Barcode Strip -->
    <g transform="translate(0, 75)">
      <rect x="0" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="8" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="14" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="24" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="30" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="42" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="50" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="56" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="68" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="76" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="86" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="92" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="104" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="112" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="122" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="128" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="138" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="146" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="158" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="164" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="174" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="182" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="194" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="202" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="208" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="220" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="228" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="238" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="244" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="256" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="264" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="274" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="280" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="290" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="298" y="0" width="8" height="42" fill="#0F1E36"/>
      <rect x="310" y="0" width="2" height="42" fill="#0F1E36"/>
      <rect x="316" y="0" width="6" height="42" fill="#0F1E36"/>
      <rect x="326" y="0" width="4" height="42" fill="#0F1E36"/>
      <rect x="334" y="0" width="8" height="42" fill="#0F1E36"/>
      <text x="0" y="58" fill="#64748B" font-size="10" font-family="monospace">SECURE BARCODE • BOARDING PASS VERIFIED • TRIPNEST</text>
    </g>
  </g>

  <!-- Boarding Stub (Right Side) -->
  <g transform="translate(645, 120)">
    <text x="0" y="16" fill="#94A3B8" font-size="10" font-weight="700" letter-spacing="1">PASSENGER</text>
    <text x="0" y="34" fill="#0F1E36" font-size="14" font-weight="800">${passenger}</text>

    <text x="0" y="65" fill="#94A3B8" font-size="10" font-weight="700" letter-spacing="1">ROUTE</text>
    <text x="0" y="83" fill="#0F1E36" font-size="15" font-weight="800">${originCode} ➔ ${destCode}</text>

    <text x="0" y="115" fill="#94A3B8" font-size="10" font-weight="700" letter-spacing="1">DATE &amp; TIME</text>
    <text x="0" y="133" fill="#0F1E36" font-size="13" font-weight="700">${dateStr} • ${depTime}</text>

    <text x="0" y="165" fill="#94A3B8" font-size="10" font-weight="700" letter-spacing="1">SEAT</text>
    <text x="0" y="190" fill="${themeColor}" font-size="24" font-weight="900">${seat}</text>

    <!-- Simulated QR Code -->
    <g transform="translate(140, 195)">
      <rect x="0" y="0" width="84" height="84" rx="8" fill="#0F1E36"/>
      <!-- QR Pattern -->
      <rect x="6" y="6" width="24" height="24" rx="4" fill="#FFFFFF"/>
      <rect x="11" y="11" width="14" height="14" fill="#0F1E36"/>
      <rect x="54" y="6" width="24" height="24" rx="4" fill="#FFFFFF"/>
      <rect x="59" y="11" width="14" height="14" fill="#0F1E36"/>
      <rect x="6" y="54" width="24" height="24" rx="4" fill="#FFFFFF"/>
      <rect x="11" y="59" width="14" height="14" fill="#0F1E36"/>
      <rect x="36" y="14" width="10" height="10" fill="#FFFFFF"/>
      <rect x="36" y="36" width="12" height="12" fill="#FFFFFF"/>
      <rect x="54" y="36" width="10" height="10" fill="#FFFFFF"/>
      <rect x="14" y="36" width="10" height="10" fill="#FFFFFF"/>
      <rect x="36" y="58" width="10" height="10" fill="#FFFFFF"/>
      <rect x="54" y="58" width="24" height="10" fill="#FFFFFF"/>
    </g>
    <text x="182" y="295" text-anchor="middle" fill="#64748B" font-size="9" font-weight="700">SCAN AT GATE</text>
  </g>
</svg>`;

  return {
    name: `${(ticket.title || 'Official_Ticket').replace(/[^a-zA-Z0-9_-]/g, '_')}_Pass.svg`,
    type: 'image',
    size: 45,
    dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
  };
}

export function ensureTicketFile(ticket) {
  if (ticket?.ticketFile && ticket.ticketFile.dataUrl) {
    // If it's a corrupt dummy PDF, replace it with SVG
    if (ticket.ticketFile.dataUrl.includes('JVBERi0xLjQKJcTl8uXrCg==') || ticket.ticketFile.size < 2) {
      return generateTicketDocumentSvg(ticket);
    }
    return ticket.ticketFile;
  }
  return generateTicketDocumentSvg(ticket);
}

export function dataUrlToBlobUrl(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.startsWith('blob:')) return dataUrl;
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return dataUrl;

    const match = parts[0].match(/:(.*?);/);
    const mimeType = match ? match[1] : 'application/octet-stream';
    const isBase64 = parts[0].includes('base64');

    if (isBase64) {
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mimeType });
      return URL.createObjectURL(blob);
    } else {
      const decoded = decodeURIComponent(parts[1]);
      const blob = new Blob([decoded], { type: mimeType });
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('Could not convert dataUrl to blob', err);
    return dataUrl;
  }
}
