const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/project-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const createAdmin = async () => {
    try {
        const adminUser = await User.create({
            name: "Admin User",
            email: "admin@example.com",
            password: "admin123",
            role: "admin"
        });

        console.log('Admin user created successfully:', adminUser);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        mongoose.connection.close();
    }
};

createAdmin();
