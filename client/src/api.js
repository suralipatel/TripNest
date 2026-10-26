// TripNest API Client
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.port === '5173'
    ? '/api'
    : window.location.origin.includes('localhost')
      ? 'http://localhost:5000/api'
      : '/api');

function getAuthHeader() {
  const token = localStorage.getItem('tripnest_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth
  async signup(userData) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async demoLogin() {
    const res = await fetch(`${API_BASE}/auth/demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Trips
  async getTrips() {
    const res = await fetch(`${API_BASE}/trips`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async getTrip(id) {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createTrip(tripData) {
    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(tripData),
    });
    return handleResponse(res);
  },

  async updateTrip(id, tripData) {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(tripData),
    });
    return handleResponse(res);
  },

  async deleteTrip(id) {
    const res = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async addPackingItem(tripId, item, category) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/packing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ item, category }),
    });
    return handleResponse(res);
  },

  async togglePackingItem(tripId, itemId, packed) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/packing/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ packed }),
    });
    return handleResponse(res);
  },

  async editPackingItem(tripId, itemId, item) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/packing/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ item }),
    });
    return handleResponse(res);
  },

  async deletePackingItem(tripId, itemId) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/packing/${itemId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });
    return handleResponse(res);
  },

  async addItineraryEvent(tripId, eventData) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/itinerary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(eventData),
    });
    return handleResponse(res);
  },

  // Tickets
  async getTickets(filters = {}) {
    const query = new URLSearchParams();
    if (filters.tripId) query.append('tripId', filters.tripId);
    if (filters.ticketType) query.append('ticketType', filters.ticketType);

    const res = await fetch(`${API_BASE}/tickets?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createTicket(ticketData) {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(ticketData),
    });
    return handleResponse(res);
  },

  async updateTicket(id, ticketData) {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(ticketData),
    });
    return handleResponse(res);
  },

  async deleteTicket(id) {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Health
  async checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },
};
