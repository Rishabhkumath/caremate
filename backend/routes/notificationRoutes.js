const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.use(protect);

router.get('/', notificationController.getNotifications);
router.get('/unread/count', notificationController.getUnreadCount);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/archive', notificationController.archiveNotification);
router.delete('/:id', notificationController.deleteNotification);

// Admin only
router.post('/create', notificationController.createNotification);

module.exports = router;