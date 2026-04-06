const express = require('express');
const {
  register,
  login,
  googleTokenLogin,
  getCurrentUser,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google/token', googleTokenLogin);
router.get('/me', requireAuth, getCurrentUser);

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
