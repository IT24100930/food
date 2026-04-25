const express = require('express');
const router  = express.Router();
const { getMenuItems, getMenuItem, createMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability, getMenuAnalytics } = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.get('/',            getMenuItems);
router.get('/analytics',   protect, authorize('Admin','Staff'), getMenuAnalytics);
router.get('/:id',         getMenuItem);
router.post('/',           protect, authorize('Admin','Staff'), upload.single('image'), createMenuItem);
router.put('/:id',         protect, authorize('Admin','Staff'), upload.single('image'), updateMenuItem);
router.delete('/:id',      protect, authorize('Admin'), deleteMenuItem);
router.patch('/:id/availability', protect, authorize('Admin','Staff'), toggleAvailability);

module.exports = router;
