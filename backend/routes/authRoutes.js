const express = require('express');
const router = express.Router();
const { register, login, getProfile, searchUsers, getAllUsers, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/search', protect, searchUsers);
router.get('/users', protect, getAllUsers);

module.exports = router;
