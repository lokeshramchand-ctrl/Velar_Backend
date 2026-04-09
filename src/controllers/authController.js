const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAuthToken } = require('../utils/jwt');

function buildAuthResponse(user) {
  const token = signAuthToken(user);

  return {
    success: true,
    token,
    user,
  };
}

exports.register = async (req, res) => {
  try {
    const { displayName, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.createLocalUser({
      displayName: displayName || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash,
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register user', details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRow = await User.findByEmail(normalizedEmail);

    if (!userRow || !userRow.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, userRow.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = await User.findById(userRow.id);
    return res.json(buildAuthResponse(user));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to log in', details: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};
