import express, { json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { FRONTEND_URL, NODE_ENV } from './config/environment.js';

// import express from "express";

// Import middleware
import { generalLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/job.js';
import laborRoutes from './routes/labor.js';
import materialRoutes from './routes/material.js';
import dailyLaborCostRoutes from './routes/dailyLaborCost.js';
import dailyLaborAssignmentRoutes from './routes/dailyLaborAssignment.js';
import materialOrderRoutes from './routes/materialOrder.js';
import materialOrderAssignmentRoutes from './routes/materialOrderAssignment.js';
import dailyJobCostRoutes from './routes/dailyJobCost.js';
import agreementRoutes from './routes/agreement.js';
import contractorRoutes from './routes/contractor.js';
import officerRoutes from './routes/officer.js';
import projectRoutes from './routes/project.js';


const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost origins
    if (NODE_ENV === 'development') {
      const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
      if (isLocalhost) {
        return callback(null, true);
      }
    }
    
    // Production allowed origins
    const allowedOrigins = [
      FRONTEND_URL, 
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://localhost:5173', // Vite default port
      'http://localhost:5174', // Alternative Vite port
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS rejected origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Enable cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(generalLimiter);

// Static file serving for project images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});
// API routes
app.use('/api/auth', authRoutes);

app.use('/api/jobs', jobRoutes);
app.use('/api/labors', laborRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/daily-labor-costs', dailyLaborCostRoutes);
app.use('/api/daily-labor-assignments', dailyLaborAssignmentRoutes);
app.use('/api/material-orders', materialOrderRoutes);
app.use('/api/material-order-assignments', materialOrderAssignmentRoutes);
app.use('/api/daily-job-costs', dailyJobCostRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/contractors', contractorRoutes);
app.use('/api/officers', officerRoutes);
app.use('/api/projects', projectRoutes);

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;