const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
// const User = require('../models/User');
// Helper function to generate JWT
const generateToken = (userId, role = 'PARTICIPANT') => {
  return jwt.sign(
    { userId, role, id: userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Register
const register = async (req, res) => {
  try {
    const { username, email, password, name, codeforcesUsername } = req.body;

    // Validate required fields
    if (!username || !email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: username, email, password, name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this username or email already exists'
      });
    }

    // Hash password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password,
      name,
      codeforcesUsername: codeforcesUsername || '',
      role: 'PARTICIPANT'
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Create audit log
    const auditLog = new AuditLog({
      action: 'USER_REGISTERED',
      description: `User ${username} registered`,
      admin: user._id,
      details: { username, email }
    });
    await auditLog.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Hello");
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // ✅ IMPORTANT: Select the password field explicitly
    // const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
const normalizedUsername = username.trim().toLowerCase();

console.log('LOGIN USERNAME:', normalizedUsername);

const user = await User.findOne({
  username: normalizedUsername
}).select('+password');

console.log('USER FOUND:', !!user);
if (!user) {
  console.log('LOGIN FAILED: user not found');

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
}

console.log('PASSWORD FIELD EXISTS:', !!user.password);
console.log(
  'PASSWORD HASH PREFIX:',
  user.password ? user.password.substring(0, 7) : 'NONE'
);

const isValidPassword = await user.comparePassword(password);
console.log('PASSWORD MATCH:', isValidPassword);

if (!isValidPassword) {
  console.log('LOGIN FAILED: password mismatch');

  return res.status(401).json({
    success: false,
    message: 'Invalid username or password'
  });
}
    // Generate token
    const token = generateToken(user._id, user.role);

    // Create audit log
    const auditLog = new AuditLog({
      action: 'USER_LOGIN',
      description: `User ${username} logged in`,
      admin: user._id,
      details: { username, timestamp: new Date().toISOString() }
    });
    await auditLog.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get current user (me)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    // Create audit log if user is authenticated
    if (req.user) {
      const auditLog = new AuditLog({
        action: 'USER_LOGOUT',
        description: `User ${req.user.username} logged out`,
        admin: req.user._id,
        details: { username: req.user.username }
      });
      await auditLog.save();
    }

    return res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout
};