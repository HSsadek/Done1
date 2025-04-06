const Project = require('../models/Project');

// Get all projects
exports.getProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('owner', 'name email')
            .populate('team', 'name email');
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
            .populate('team', 'name email');
        
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create project
exports.createProject = async (req, res) => {
    try {
        const { title, description, status, startDate, endDate, team } = req.body;

        const project = await Project.create({
            title,
            description,
            status,
            startDate,
            endDate,
            team,
            owner: req.user._id
        });

        const populatedProject = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('team', 'name email');

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
            .populate('team', 'name email');

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
