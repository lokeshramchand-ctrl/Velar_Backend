const express = require('express');
const {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
} = require('../controllers/authController');

const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// ================= AUTH =================
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// ================= USER =================
router.get('/me', requireAuth, getCurrentUser);

module.exports = router;