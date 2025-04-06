const express = require('express');
const router = express.Router();
const { 
    getProjects, 
    getProject, 
    createProject, 
    updateProject, 
    deleteProject 
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

// Tüm rotalar için authentication gerekli
router.use(protect);

router.route('/')
    .get(getProjects)
    .post(createProject);

router.route('/:id')
    .get(getProject)
    .put(updateProject)
    .delete(deleteProject);

module.exports = router;
