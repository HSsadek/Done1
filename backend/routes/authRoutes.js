const express = require('express');
const router = express.Router();
const { register, login, getProfile, searchUsers, getAllUsers, updateProfile, forgotPassword, resetPasswordRequest, resetPassword, resetAllPasswords } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/search', protect, searchUsers);
router.get('/users', protect, getAllUsers);
router.post('/reset-password-request', resetPasswordRequest);
router.post('/reset-password', resetPassword);
router.post('/reset-all-passwords', resetAllPasswords);

module.exports = router;
