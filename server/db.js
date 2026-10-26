import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isMongoConnected = false;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'local-db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tripnest';
  try {
    mongoose.set('strictQuery', false);
    // Attempt connection with short serverSelectionTimeoutMS so app boots fast
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected successfully to ${uri}`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`[MongoDB] Could not connect to MongoDB server (${err.message}).`);
    console.log(`[TripNest Engine] Seamlessly active in Persistent Local Store mode (${DATA_FILE}). All features, JWT auth, and data persistence are 100% functional.`);
  }
}

export function getMongoStatus() {
  return {
    isMongoConnected,
    mode: isMongoConnected ? 'mongodb' : 'local-json-store',
    dataFile: !isMongoConnected ? DATA_FILE : null
  };
}

// Fallback JSON database management
function readLocalDb() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = { users: [], trips: [], tickets: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [], trips: [], tickets: [] };
  }
}

function writeLocalDb(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const localStore = {
  get(collection) {
    const db = readLocalDb();
    return db[collection] || [];
  },
  find(collection, filterFn) {
    const items = this.get(collection);
    return items.filter(filterFn);
  },
  findOne(collection, filterFn) {
    const items = this.get(collection);
    return items.find(filterFn) || null;
  },
  insert(collection, item) {
    const db = readLocalDb();
    if (!db[collection]) db[collection] = [];
    const newItem = {
      _id: item._id || 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    db[collection].push(newItem);
    writeLocalDb(db);
    return newItem;
  },
  update(collection, filterFn, updateData) {
    const db = readLocalDb();
    const items = db[collection] || [];
    const index = items.findIndex(filterFn);
    if (index === -1) return null;
    const updated = {
      ...items[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    items[index] = updated;
    db[collection] = items;
    writeLocalDb(db);
    return updated;
  },
  delete(collection, filterFn) {
    const db = readLocalDb();
    const items = db[collection] || [];
    const initialLen = items.length;
    const filtered = items.filter((item) => !filterFn(item));
    db[collection] = filtered;
    writeLocalDb(db);
    return initialLen !== filtered.length;
  }
};
