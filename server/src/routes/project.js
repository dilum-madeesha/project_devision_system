import { Router } from 'express';
import ProjectController from '../controllers/projectController.js';
import { authenticate, requirePrivilege, BACKEND_FEATURES } from '../middleware/privilegeAuth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const router = Router();

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads/project-images');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Determine if Cloudinary is configured (non-empty vars)
const usingCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storage;
if (usingCloudinary) {
  // keep upload in memory for direct cloud upload
  storage = multer.memoryStorage();
} else {
  // local disk storage under uploads/project-images/:projectId
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const projectId = req.params.projectId;
      const projectDir = path.join(uploadsDir, projectId.toString());
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      cb(null, projectDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.get('/cloud-test', async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      message: 'Cloudinary connected successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
});

// Create new project
router.post('/', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_CREATE), ProjectController.create);

// Get all projects
router.get('/', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_READ), ProjectController.getAll);

// Get projects by status
router.get('/status/:status', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_READ), ProjectController.getByStatus);

// Get project by ID
router.get('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_READ), ProjectController.getById);

// Update project by ID
router.put('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_UPDATE), ProjectController.update);

// Update project progress
router.patch('/:id/progress', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_UPDATE), ProjectController.updateProgress);

// Delete project by ID
router.delete('/:id', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_DELETE), ProjectController.delete);

// Assign officer to project
router.post('/:projectId/officers', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_UPDATE), ProjectController.assignOfficer);

// Remove officer from project
router.delete('/:projectId/officers/:officerId', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_UPDATE), ProjectController.removeOfficer);

// Upload project images
router.post('/:projectId/images', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_UPDATE), (req, res, next) => {
  // Debug check: verify Cloudinary status
  if (usingCloudinary) {
    console.log("✅ Cloudinary ENABLED");
  } else {
    console.log("❌ Cloudinary DISABLED - using local storage");
  }
  next();
}, upload.array('images', 10), (err, req, res, next) => {
  // multer error handler
  if (err) {
    console.error('[project.js] Multer error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
}, ProjectController.uploadImages);

// Get project images
router.get('/:projectId/images', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_READ), ProjectController.getImages);

// Delete project image
router.delete('/:projectId/images/:imageFilename', authenticate, requirePrivilege(BACKEND_FEATURES.PROJECT_UPDATE), ProjectController.deleteImage);

console.log("Using Cloudinary:", usingCloudinary);

export default router;
