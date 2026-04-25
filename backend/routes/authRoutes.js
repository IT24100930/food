// ─── authRoutes.js ─────────────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const { register, login, verifyEmail, forgotPassword, resetPassword, getMe, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',          register);
router.post('/login',             login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password',   forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me',                 protect, getMe);
router.put('/change-password',    protect, changePassword);

module.exports = router;
