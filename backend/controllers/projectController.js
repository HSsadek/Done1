const Project = require('../models/Project');
const User = require('../models/User'); // Added User model for team validation

// Get all projects for the current user (owned or team member)
exports.getProjects = async (req, res) => {
    try {
        // Find projects where current user is either the owner or a team member
        const projects = await Project.find({
            $or: [
                { owner: req.user._id },  // User is the owner
                { team: req.user._id }     // User is a team member
            ]
        })
            .sort({ createdAt: -1 })
            .populate('owner', 'name email')
            .populate('team', 'name email profileImage')
            .populate({ path: 'tasks' }); // Görevleri de getir
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single project
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('team', 'name email profileImage')
            .populate({
                path: 'tasks',
                populate: {
                    path: 'assignedTo',
                    select: 'name email'
                }
            });
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get task statistics
        const taskStats = {
            total: project.tasks.length,
            completed: project.tasks.filter(task => task.status === 'Tamamlandı').length,
            inProgress: project.tasks.filter(task => task.status === 'Devam Etmekte').length,
            todo: project.tasks.filter(task => task.status === 'Yapılacak').length,
            testing: project.tasks.filter(task => task.status === 'Test Edilecek').length
        };
        
        const response = {
            ...project.toJSON(),
            taskStats
        };
        
        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create project
exports.createProject = async (req, res) => {
    try {
        const { title, description, status, startDate, endDate, team } = req.body;

        // Validate team members exist
        if (team && team.length > 0) {
            const teamMembers = await User.find({ _id: { $in: team } });
            if (teamMembers.length !== team.length) {
                return res.status(400).json({ message: 'One or more team members not found' });
            }
        }

        const project = await Project.create({
            title,
            description,
            status,
            startDate,
            endDate,
            team: team || [],
            owner: req.user._id
        });

        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('team', 'name email profileImage');

        res.status(201).json(populatedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const { title, description, status, startDate, endDate, team } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner or admin
        if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to update this project' });
        }

        project.title = title || project.title;
        project.description = description || project.description;
        project.status = status || project.status;
        project.startDate = startDate || project.startDate;
        project.endDate = endDate || project.endDate;
        project.team = team || project.team;

        await project.save();
        
        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('team', 'name email profileImage');

        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete project
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if user is owner or admin
        if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to delete this project' });
        }

        await project.deleteOne();
        res.json({ message: 'Project removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
