import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;
import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN, BCRYPT_ROUNDS } from '../config/environment.js';

class AuthUtils {
  // Hash password
  static async hashPassword(password) {
    return await hash(password, BCRYPT_ROUNDS);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(payload) {
    return sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Generate refresh token
  static generateRefreshToken(payload) {
    return sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      const decoded = verify(token, JWT_SECRET);
      
      // Check if the token contains isActive property and if the user is active
      if (decoded.hasOwnProperty('isActive') && !decoded.isActive) {
        throw new Error('Account is deactivated');
      }
      
      return decoded;
    } catch (error) {
      throw new Error(error.message || 'Invalid token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      return verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Generate tokens for user
  static generateTokens(user) {
    // Check if the user is active before generating tokens
    if (user.hasOwnProperty('isActive') && !user.isActive) {
      throw new Error('Account is deactivated');
    }

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      privilege: user.privilege,
      isActive: user.isActive
    };

    const token = AuthUtils.generateToken(payload);
    const refreshToken = AuthUtils.generateRefreshToken({ id: user.id });

    return { token, refreshToken };
  }
}

export default AuthUtils;
export const hashPassword = AuthUtils.hashPassword;
export const comparePassword = AuthUtils.comparePassword;
export const generateTokens = AuthUtils.generateTokens;
export const verifyRefreshToken = AuthUtils.verifyRefreshToken;
export const generateToken = AuthUtils.generateToken;
export const verifyToken = AuthUtils.verifyToken;