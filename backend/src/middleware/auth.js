/**
 * CENTRALIZED AUTHENTICATION MIDDLEWARE
 * This is the single source of truth for auth middleware.
 * authMiddleware.js re-exports these for backward compatibility.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Authenticate using JWT
 * Attaches full User object to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId || decoded.id || decoded._id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach user with all necessary properties
    req.user = user.toObject();
    req.user._id = user._id;
    req.user.id = user._id;
    req.user.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Middleware: Authorize by role
 * Must be called after authenticate()
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
