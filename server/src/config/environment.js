import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_here';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
export const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX) || 1000;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const COOKIE_SECRET = process.env.COOKIE_SECRET || 'your_cookie_secret_here';