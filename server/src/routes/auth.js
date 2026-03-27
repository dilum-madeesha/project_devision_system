import { Router } from 'express';
const router = Router();
import AuthController  from '../controllers/authController.js';
const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUser,
  deleteUser,
  uploadProfileImage,
  deleteProfileImage,
  uploadUserImage,
  deleteUserImage,
} = AuthController;
import UserController from '../controllers/userController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { verifyToken } from '../utils/auth.js';
import prisma from '../config/database.js';
import multer from 'multer';

const userImageStorage = multer.memoryStorage();

const userImageUpload = multer({
  storage: userImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Optional authentication middleware - doesn't fail if no token provided
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      // Load full profile from DB so session checks return complete user details.
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          epfNumber: true,
          firstName: true,
          lastName: true,
          division: true,
          role: true,
          privilege: true,
          isActive: true,
          profileImageUrl: true,
          createdAt: true,
          lastLogin: true
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }
    // If no token, just continue without setting req.user
    next();
  } catch (error) {
    // If token exists but is invalid, still continue (graceful degradation)
    next();
  }
};


// Public routes (with rate limiting)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);

// Check session endpoint - works with optional authentication
router.get('/check-session', optionalAuthenticate, (req, res) => {
  if (req.user) {
    return res.json({
      success: true,
      authenticated: true,
      data: req.user
    });
  }
  
  return res.json({
    success: true,
    authenticated: false,
    data: null,
    message: 'No active session'
  });
});

// Protected routes (require authentication)
router.use(authenticate); // All routes below require authentication

router.post('/logout', logout);
router.get('/me', getProfile); // Endpoint for checking current user status
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/profile/image', userImageUpload.single('image'), uploadProfileImage);
router.delete('/profile/image', deleteProfileImage);

// User management routes (privilege-based)
router.post('/users', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_CREATE), UserController.create);
router.get('/users', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_READ), getAllUsers);
router.get('/users/:id', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_READ), getUserById);

// User management write operations
router.put('/users/:id/status', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_UPDATE), updateUserStatus);
router.put('/users/:id', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_UPDATE), updateUser);
router.delete('/users/:id', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_DELETE), deleteUser);
router.post('/users/:id/image', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_UPDATE), userImageUpload.single('image'), uploadUserImage);
router.delete('/users/:id/image', requirePrivilege(BACKEND_FEATURES.REGISTER_USERS_UPDATE), deleteUserImage);

export default router;
