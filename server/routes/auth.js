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

    // Check if user exists (case-insensitive & trimmed)
    let existing = null;
    if (isMongoConnected) {
      existing = await UserModel.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
    } else {
      existing = localStore.findOne('users', (u) => (u.email || '').toLowerCase().trim() === normalizedEmail);
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email already exists. Please sign in instead.',
      });
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
        friends: [],
      });
      user = await newUser.save();
    } else {
      user = localStore.insert('users', {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        homeAirport: homeAirport || '',
        currency: currency || 'INR',
        friends: [],
      });
    }

    const userId = user._id.toString();

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
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
        friends: user.friends || [],
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
      user = await UserModel.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
    } else {
      user = localStore.findOne('users', (u) => (u.email || '').toLowerCase().trim() === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'No account found with this email. Please check your email or sign up.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_PASSWORD',
        message: 'Incorrect password. Please try again.',
      });
    }

    const userId = user._id.toString();

    const token = jwt.sign(
      { userId, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
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
        friends: user.friends || [],
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

// GET /api/auth/check-friend?email=...
router.get('/check-friend', authenticateToken, async (req, res) => {
  try {
    const rawEmail = req.query.email;
    if (!rawEmail) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
    }
    const searchEmail = rawEmail.trim().toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase().trim();

    if (searchEmail === userEmail) {
      return res.json({
        success: true,
        isSelf: true,
        registered: false,
        message: 'This is your own email address.',
      });
    }

    const { isMongoConnected } = getMongoStatus();
    let friendUser = null;
    if (isMongoConnected) {
      friendUser = await UserModel.findOne({
        email: { $regex: new RegExp(`^${searchEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      }).select('name email');
    } else {
      friendUser = localStore.findOne('users', (u) => (u.email || '').toLowerCase().trim() === searchEmail);
    }

    if (friendUser) {
      return res.json({
        success: true,
        registered: true,
        user: {
          name: friendUser.name,
          email: friendUser.email,
        },
      });
    } else {
      return res.json({
        success: true,
        registered: false,
        message: `No registered TripNest account found for "${searchEmail}".`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

    let friends = Array.isArray(user.friends) ? user.friends : [];
    // Seed demo friends only for demo user if empty
    if (friends.length === 0 && user.email === 'alex.traveler@tripnest.com') {
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

    if (!email) {
      return res.status(400).json({ success: false, message: "Friend's email address is required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const userEmail = (req.user.email || '').toLowerCase().trim();

    // 1. Cannot add self
    if (trimmedEmail === userEmail) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own email address as a friend.',
      });
    }

    const { isMongoConnected } = getMongoStatus();

    // 2. CRITICAL: Verify friend has a registered account on TripNest
    let friendUser = null;
    if (isMongoConnected) {
      friendUser = await UserModel.findOne({
        email: { $regex: new RegExp(`^${trimmedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      }).select('-password');
    } else {
      friendUser = localStore.findOne('users', (u) => (u.email || '').toLowerCase().trim() === trimmedEmail);
    }

    if (!friendUser) {
      return res.status(404).json({
        success: false,
        code: 'USER_NOT_REGISTERED',
        message: `No TripNest account found for "${trimmedEmail}". Only friends who already have an account on this website can be added to your travel group. Ask your friend to sign up on TripNest first!`,
      });
    }

    // 3. Find current user
    let user;
    if (isMongoConnected) {
      user = await UserModel.findById(userId);
    } else {
      user = localStore.findOne('users', (u) => u._id === userId);
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let friends = Array.isArray(user.friends) ? [...user.friends] : [];

    // 4. Check if already added
    if (friends.some((f) => (f.email || '').toLowerCase().trim() === trimmedEmail)) {
      return res.status(409).json({
        success: false,
        message: `${friendUser.name || 'This friend'} (${trimmedEmail}) is already in your friends list.`,
      });
    }

    // Use registered user's official name, or fallback to provided name
    const finalFriendName = friendUser.name || (name && name.trim()) || trimmedEmail.split('@')[0];
    const newFriend = {
      name: finalFriendName,
      email: friendUser.email.toLowerCase().trim(),
    };
    friends.push(newFriend);

    if (isMongoConnected) {
      user.friends = friends;
      await user.save();
    } else {
      localStore.update('users', (u) => u._id === userId, { friends });
    }

    res.status(201).json({
      success: true,
      message: `Verified! ${finalFriendName} has an active TripNest account and was added to your friends.`,
      data: friends,
      friend: newFriend,
    });
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

    let friends = Array.isArray(user.friends) ? [...user.friends] : [];
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

