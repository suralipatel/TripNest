import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { TripModel } from '../models/Trip.js';
import { TicketModel } from '../models/Ticket.js';
import { localStore, getMongoStatus } from '../db.js';
import { getInitialDemoData } from '../services/seedData.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'tripnest_super_secret_jwt_key_2026_travel_nest_secure';

// Helper to seed trips and tickets for a user if they have none
async function seedUserContentIfNeeded(userId, userName) {
  const { isMongoConnected } = getMongoStatus();
  if (isMongoConnected) {
    const existingCount = await TripModel.countDocuments({ userId });
    if (existingCount === 0) {
      const { trips, tickets } = getInitialDemoData(userId, userName);
      await TripModel.insertMany(trips);
      await TicketModel.insertMany(tickets);
    }
  } else {
    const userTrips = localStore.find('trips', (t) => t.userId === userId);
    if (userTrips.length === 0) {
      const { trips, tickets } = getInitialDemoData(userId, userName);
      trips.forEach((t) => localStore.insert('trips', t));
      tickets.forEach((t) => localStore.insert('tickets', t));
    }
  }
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, homeAirport, currency } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { isMongoConnected } = getMongoStatus();

    // Check if user exists
    if (isMongoConnected) {
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
    } else {
      const existing = localStore.findOne('users', (u) => u.email === normalizedEmail);
      if (existing) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (isMongoConnected) {
      const newUser = new UserModel({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        homeAirport: homeAirport || '',
        currency: currency || 'INR',
      });
      user = await newUser.save();
    } else {
      user = localStore.insert('users', {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        homeAirport: homeAirport || '',
        currency: currency || 'INR',
      });
    }

    const userId = user._id.toString();

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to TripNest.',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        homeAirport: user.homeAirport,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup: ' + error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { isMongoConnected } = getMongoStatus();

    let user;
    if (isMongoConnected) {
      user = await UserModel.findOne({ email: normalizedEmail });
    } else {
      user = localStore.findOne('users', (u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const userId = user._id.toString();

    const token = jwt.sign(
      { userId, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        homeAirport: user.homeAirport || '',
        currency: user.currency || 'INR',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login: ' + error.message });
  }
});

// POST /api/auth/demo (One-click instant login)
router.post('/demo', async (req, res) => {
  try {
    const demoEmail = 'alex.traveler@tripnest.com';
    const demoName = 'Alex Morgan';
    const { isMongoConnected } = getMongoStatus();

    let user;
    if (isMongoConnected) {
      user = await UserModel.findOne({ email: demoEmail });
      if (!user) {
        const hashedPassword = await bcrypt.hash('tripnest2026', 10);
        user = await UserModel.create({
          name: demoName,
          email: demoEmail,
          password: hashedPassword,
          homeAirport: '',
          currency: 'INR',
        });
      }
    } else {
      user = localStore.findOne('users', (u) => u.email === demoEmail);
      if (!user) {
        const hashedPassword = await bcrypt.hash('tripnest2026', 10);
        user = localStore.insert('users', {
          name: demoName,
          email: demoEmail,
          password: hashedPassword,
          homeAirport: '',
          currency: 'INR',
        });
      }
    }

    const userId = user._id.toString();
    await seedUserContentIfNeeded(userId, demoName);

    const token = jwt.sign(
      { userId, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Signed in as Demo Traveler!',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        homeAirport: user.homeAirport || '',
        currency: user.currency || 'INR',
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ success: false, message: 'Error signing in as demo user.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { isMongoConnected } = getMongoStatus();

    let user;
    if (isMongoConnected) {
      user = await UserModel.findById(userId).select('-password');
    } else {
      user = localStore.findOne('users', (u) => u._id === userId);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        friends: user.friends || [],
      },
      databaseMode: getMongoStatus(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const DEFAULT_FRIENDS = [
  { name: 'Priya Patel', email: 'priya@tripnest.in' },
  { name: 'Rohan Mehta', email: 'rohan@tripnest.in' },
  { name: 'Aarav Sharma', email: 'aarav@tripnest.in' },
];

// GET /api/auth/friends
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { isMongoConnected } = getMongoStatus();

    let user;
    if (isMongoConnected) {
      user = await UserModel.findById(userId);
    } else {
      user = localStore.findOne('users', (u) => u._id === userId);
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let friends = user.friends;
    if (!friends || friends.length === 0) {
      friends = DEFAULT_FRIENDS;
      if (isMongoConnected) {
        user.friends = friends;
        await user.save();
      } else {
        localStore.update('users', (u) => u._id === userId, { friends });
      }
    }

    res.json({ success: true, data: friends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/friends
router.post('/friends', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Friend name and email are required' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const { isMongoConnected } = getMongoStatus();
    let user;
    if (isMongoConnected) {
      user = await UserModel.findById(userId);
    } else {
      user = localStore.findOne('users', (u) => u._id === userId);
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let friends = Array.isArray(user.friends) && user.friends.length > 0 ? [...user.friends] : [...DEFAULT_FRIENDS];

    if (friends.some((f) => (f.email || '').toLowerCase().trim() === trimmedEmail)) {
      return res.status(409).json({ success: false, message: 'Friend with this email already exists' });
    }

    const newFriend = { name: trimmedName, email: trimmedEmail };
    friends.push(newFriend);

    if (isMongoConnected) {
      user.friends = friends;
      await user.save();
    } else {
      localStore.update('users', (u) => u._id === userId, { friends });
    }

    res.status(201).json({ success: true, message: 'Friend added!', data: friends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/auth/friends/:email
router.delete('/friends/:email', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const emailToRemove = decodeURIComponent(req.params.email).toLowerCase().trim();

    const { isMongoConnected } = getMongoStatus();
    let user;
    if (isMongoConnected) {
      user = await UserModel.findById(userId);
    } else {
      user = localStore.findOne('users', (u) => u._id === userId);
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let friends = Array.isArray(user.friends) && user.friends.length > 0 ? [...user.friends] : [...DEFAULT_FRIENDS];
    friends = friends.filter((f) => (f.email || '').toLowerCase().trim() !== emailToRemove);

    if (isMongoConnected) {
      user.friends = friends;
      await user.save();
    } else {
      localStore.update('users', (u) => u._id === userId, { friends });
    }

    res.json({ success: true, message: 'Friend removed', data: friends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
