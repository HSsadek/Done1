const mongoose = require('mongoose');
const Project = require('../models/Project');
const Task = require('../models/Task');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Tüm projelerin durumunu güncelle
const updateAllProjectStatuses = async () => {
    try {
        console.log('Proje durumları güncelleniyor...');
        
        const projects = await Project.find({});
        
        for (const project of projects) {
            const tasks = await Task.find({ project: project._id });
            
            let newStatus = 'Not Started';
            
            if (tasks.length === 0) {
                newStatus = 'Not Started';
            } else {
                const completedTasks = tasks.filter(task => task.status === 'Tamamlandı');
                const inProgressTasks = tasks.filter(task => 
                    task.status === 'Devam Etmekte' || task.status === 'Test Edilecek'
                );
                
                if (completedTasks.length === tasks.length) {
                    newStatus = 'Completed';
                } else if (inProgressTasks.length > 0 || completedTasks.length > 0) {
                    newStatus = 'In Progress';
                } else {
                    newStatus = 'Not Started';
                }
            }
            
            if (project.status !== newStatus) {
                project.status = newStatus;
                await project.save();
                console.log(`Proje "${project.title}" durumu "${newStatus}" olarak güncellendi`);
            }
        }
        
        console.log('Tüm proje durumları güncellendi!');
        process.exit(0);
    } catch (error) {
        console.error('Hata:', error);
        process.exit(1);
    }
};

updateAllProjectStatuses();