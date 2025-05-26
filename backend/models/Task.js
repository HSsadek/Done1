const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Task description is required']
    },
    status: {
        type: String,
        enum: ['Yapılacak', 'Devam Etmekte', 'Test Edilecek', 'Tamamlandı'],
        default: 'Yapılacak'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task must be assigned to a team member']
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    dueDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', taskSchema);
