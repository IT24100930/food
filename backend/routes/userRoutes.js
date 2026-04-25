const express = require('express');
const router  = express.Router();
const { getAllUsers, getUser, updateUserRole, toggleUserStatus, getTrustAnalytics, updateProfile, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.use(protect);

router.get('/',                   authorize('Admin'), getAllUsers);
router.get('/trust-analytics',    authorize('Admin'), getTrustAnalytics);
router.put('/profile',            upload.single('avatar'), updateProfile);
router.get('/:id',                authorize('Admin'), getUser);
router.put('/:id/role',           authorize('Admin'), updateUserRole);
router.put('/:id/toggle-status',  authorize('Admin'), toggleUserStatus);
router.delete('/:id',             authorize('Admin'), deleteUser);

module.exports = router;
