const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams allows access to parent router params
const { 
    getProjectTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// Tüm rotalar için authentication gerekli
router.use(protect);

router.route('/')
    .get(getProjectTasks)
    .post(createTask);

router.route('/:taskId')
    .get(getTask)
    .put(updateTask)
    .delete(deleteTask);

module.exports = router;
