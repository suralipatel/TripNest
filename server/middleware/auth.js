import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tripnest_super_secret_jwt_key_2026_travel_nest_secure';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
    }
    req.user = decoded; // { userId, email, name }
    next();
  });
}
