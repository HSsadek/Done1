const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Register user
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });
        
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Geçersiz e-posta veya şifre' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    console.log('Profil getirildi:', user);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Update name and profileImage if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.profileImage) user.profileImage = req.body.profileImage;
    await user.save();
    console.log('Profil güncellendi:', user);
    res.json({ message: 'Profil güncellendi', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('name email') // Sadece name ve email bilgilerini döndür
            .sort({ name: 1 }); // İsimlere göre alfabetik sırala
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Şifre sıfırlama isteği (e-posta ile token gönder)
exports.resetPasswordRequest = async (req, res) => {
    try {
        console.log('Şifre sıfırlama isteği alındı:', req.body);
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'E-posta adresi gereklidir.' });
        }
        const user = await User.findOne({ email });
        console.log('Kullanıcı bulundu mu?', user);
        if (!user) {
            return res.status(404).json({ message: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.' });
        }
        // Token üret
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 dakika geçerli
        await user.save();
        // E-posta gönder (dummy veya gerçek)
        const resetUrl = `http://localhost:5500/web/reset-password.html?token=${resetToken}`;
        // Burada gerçek bir e-posta servisiyle gönderebilirsin
        // Şimdilik sadece response olarak dönüyoruz
        // await sendResetEmail(user.email, resetUrl);
        return res.json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', resetUrl });
    } catch (error) {
        console.error('Şifre sıfırlama isteği sırasında hata:', error);
        res.status(500).json({ message: error.message });
    }
};

// Şifre sıfırlama (token ile yeni şifre belirle)
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token ve yeni şifre gereklidir.' });
        }
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.' });
        }
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Şifreniz başarıyla güncellendi.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        // Hem 'query' hem 'search' parametresini destekle
        const searchQuery = req.query.query || req.query.search;
        if (!searchQuery) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } }
            ]
        }).select('username name email');

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
