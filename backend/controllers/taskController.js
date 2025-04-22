const Task = require('../models/Task');
const Project = require('../models/Project');

// Get all tasks of a project
exports.getProjectTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single task
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId)
            .populate('assignedTo', 'name email')
            .populate('project', 'title');
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create task
exports.createTask = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if assigned user is in project team
        const assignedTo = req.body.assignedTo;
        if (!project.team.includes(assignedTo) && project.owner.toString() !== assignedTo) {
            return res.status(400).json({ 
                message: 'Task can only be assigned to project team members or owner' 
            });
        }

        const task = await Task.create({
            ...req.body,
            project: req.params.projectId
        });

        // Eğer atanan kullanıcı team'de yoksa, ekle
        if (!project.team.map(id => id.toString()).includes(assignedTo.toString()) && project.owner.toString() !== assignedTo.toString()) {
            project.team.push(assignedTo);
            await project.save();
        }

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('project', 'title');

        res.status(201).json(populatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const project = await Project.findById(task.project);
        
        // Check if user is project owner, admin, or the assigned person
        if (project.owner.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin' && 
            task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to update this task' });
        }

        // If changing assignment, check if new user is in project team
        if (req.body.assignedTo && 
            !project.team.includes(req.body.assignedTo) && 
            project.owner.toString() !== req.body.assignedTo) {
            return res.status(400).json({ 
                message: 'Task can only be assigned to project team members or owner' 
            });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.taskId,
            req.body,
            { new: true, runValidators: true }
        ).populate('assignedTo', 'name email')
         .populate('project', 'title');

        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const project = await Project.findById(task.project);
        
        // Check if user is project owner or admin
        if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to delete this task' });
        }

        await task.deleteOne();
        res.json({ message: 'Task removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
