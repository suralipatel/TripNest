# TripNest ✈️
> *Every trip. Every ticket. One place.*

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/suralipatel/TripNest)

**TripNest** is a modern, mobile-first travel companion and digital wallet web app designed to keep your journeys organized. Manage trip countdowns, boarding passes, train tickets, hotel stays, day-by-day itineraries, and private packing checklists—all accessible seamlessly from your phone, tablet, or desktop.

---

## 🌟 Key Features

### 🧳 Trip Management & Collaboration
- **Mobile-First Experience**: Designed with sleek glassmorphism, smooth animations, and responsive touch controls.
- **Trip Editing & 3-Dots Menu**: Easily edit trip destinations, dates, budgets, and notes directly from the top-right 3-dots icon on each trip card.
- **Invite Friends & Companions**: Share trips with friends by adding their name and email address. Invited friends can view:
  - All flight, train, bus, and hotel passes.
  - The shared day-by-day travel itinerary.
- **🔒 Individual Luggage Checklist**: Each traveler has their own private packing checklist. Companions packing for the same trip cannot see or edit your personal luggage items.
- **Live Countdowns & Badges**: Automatic journey countdowns (*"12 DAYS TO GO"*, *"DEPARTS TOMORROW"*, *"HAPPENING NOW"*, *"COMPLETED"*).

### 🎟️ Digital Wallet & Boarding Passes
- **Apple Wallet Style Passes**: Elegant ticket cards for Flights, Trains, Buses, and Hotels with departure/arrival times, seat, gate, terminal, and confirmation codes.
- **Full-Screen Pass & Document View**: Instant full-screen view of uploaded PDF e-tickets, image vouchers, or live scannable barcodes.
- **Gallery & Camera Uploads**: Custom cover photos and ticket documents compressed and optimized for mobile performance.

### 📅 Day-by-Day Itinerary Schedule
- Chronological timeline tracking activities, flights, check-ins, and reservations with day filter chips.

### 🔐 Authentication & Data Engine
- **Clean Account Onboarding**: New accounts start with a clean slate (zero unwanted default trips).
- **Dual Database Engine**:
  - **MongoDB Atlas** support via `MONGODB_URI`.
  - **Persistent Local Store Fallback**: Works immediately out of the box with zero external setup required!
- **Cloudinary Integration**: Cloud storage for uploaded ticket PDFs and trip cover images.

---

## 🏗️ Architecture & Project Structure

```text
TripNest/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/         # Modals, TripCard, TicketCard, Header, Navbar, etc.
│   │   ├── context/            # AuthContext (JWT session management)
│   │   ├── screens/            # Trips, Tickets, Itinerary, Profile screens
│   │   ├── api.js              # Centralized API service
│   │   ├── App.jsx             # Root mobile viewport and state
│   │   └── index.css           # Vanilla CSS design tokens & mobile styles
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js Express backend
│   ├── models/                 # Mongoose schemas (Trip, Ticket, User)
│   ├── routes/                 # Express API routes (auth, trips, tickets)
│   ├── middleware/             # JWT authentication middleware
│   ├── utils/                  # Cloudinary image & PDF upload handler
│   ├── db.js                   # Dual MongoDB Atlas + Local JSON database engine
│   ├── server.js               # Express entrypoint & static build server
│   ├── .env.example
│   └── package.json
├── package.json                # Root package with monorepo scripts
├── .gitignore                  # Git ignore rules for node_modules, .env, and local DB
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/TripNest.git
cd TripNest
```

### 2. Install all dependencies
```bash
npm run install:all
```
*(Or install manually: `npm install`, `cd client && npm install`, `cd server && npm install`)*

### 3. Start the application
In two separate terminals:

**Terminal 1 — Backend API Server:**
```bash
cd server
npm run dev
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
```
*Frontend runs on `http://localhost:5173`*

Open **`http://localhost:5173`** in your browser!

---

## ⚙️ Environment Variables

### Server (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `JWT_SECRET` | Secret key for JWT auth tokens | Any secure string |
| `MONGODB_URI` | *(Optional)* MongoDB Atlas connection string | Falls back to local JSON store |
| `CLOUDINARY_CLOUD_NAME` | *(Optional)* Cloudinary cloud name | Inline storage fallback |
| `CLOUDINARY_API_KEY` | *(Optional)* Cloudinary API key | Inline storage fallback |
| `CLOUDINARY_API_SECRET` | *(Optional)* Cloudinary API secret | Inline storage fallback |

### Client (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | *(Optional)* Full URL to deployed backend (e.g. `https://your-api.onrender.com/api`) | Empty / uses proxy or same domain |

---

## 🌐 Deployment Guide

### Option 1: Unified Full-Stack Deploy (Recommended for Render / Railway)
Deploy the entire application as a single web service:

1. **Build Command**:
   ```bash
   npm run install:all && npm run build
   ```
2. **Start Command**:
   ```bash
   npm start
   ```
3. Set your environment variables (`JWT_SECRET`, and optionally `MONGODB_URI` and `CLOUDINARY_*`).
The Express server will automatically serve both the `/api` routes and the compiled React production frontend from `client/dist`.

---

### Option 2: Split Deploy (Frontend on Vercel + Backend on Render)

#### Backend (Render / Railway):
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `node server.js`
- Set Environment Variables: `PORT`, `JWT_SECRET`, `MONGODB_URI`.
- Note your live API URL (e.g. `https://tripnest-api.onrender.com`).

#### Frontend (Vercel / Netlify):
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Set Environment Variable:
  - `VITE_API_URL`: `https://tripnest-api.onrender.com/api`

---

## 📦 How to Push to Your GitHub Repository

```bash
# 1. Initialize Git in the project root
git init

# 2. Stage all files (node_modules and .env are automatically ignored)
git add .

# 3. Create your initial commit
git commit -m "feat: complete TripNest mobile travel organizer"

# 4. Set the main branch
git branch -M main

# 5. Link to your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
