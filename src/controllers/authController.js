const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const RefreshToken = require('../models/RefreshToken');

function buildAuthResponse(user, accessToken) {
  return {
    success: true,
    token: accessToken,
    user,
  };
}

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { displayName, password } = req.body;

    if (!displayName || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalized = displayName.trim().toLowerCase();

    const existing = await User.findByDisplayName(normalized);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.createLocalUser({
      displayName: normalized,
      passwordHash,
    });

    return res.status(201).json(await issueTokens(user));
  } catch (err) {
    return res.status(500).json({ error: 'Register failed', details: err.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { displayName, password } = req.body;

    if (!displayName || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const normalized = displayName.trim().toLowerCase();
    const userRow = await User.findByDisplayName(normalized);

    if (!userRow || !userRow.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, userRow.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = await User.findById(userRow.id);

    return res.json(await issueTokens(user));
  } catch (err) {
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

// ================= REFRESH =================
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const stored = await RefreshToken.find(refreshToken);
    if (!stored) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await User.findById(stored.userId);

    return res.json(await issueTokens(user));
  } catch (err) {
    return res.status(401).json({ error: 'Refresh failed', details: err.message });
  }
};

// ================= LOGOUT =================
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.delete(refreshToken);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Logout failed' });
  }
};

// ================= ME =================
exports.getCurrentUser = async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
};

// ================= TOKEN ISSUER =================
async function issueTokens(user) {
  const accessToken = signAccessToken({
    id: user.id,
    displayName: user.displayName,
  });

  const refreshToken = crypto.randomBytes(40).toString('hex');

  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  return {
    success: true,
    token: accessToken,
    refreshToken,
    user,
  };
}