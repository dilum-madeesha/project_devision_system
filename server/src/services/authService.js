import prisma from '../config/database.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { hashPassword, generateTokens, comparePassword, verifyRefreshToken } from '../utils/auth.js';
import { validateRegistration, validateLogin } from '../utils/validators.js';
import cloudinary from '../config/cloudinary.js';
import { USER_IMAGES_DIR, ensureUserImagesDir, deleteUserImageFiles } from '../utils/userImage.js';

const isCloudinaryConfigured = () =>
  !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

const uploadBufferToCloudinary = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });

const getImageExtension = (file) => {
  const mimeType = file?.mimetype || '';

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';

  const originalName = file?.originalname || '';
  const ext = path.extname(originalName).replace('.', '').toLowerCase();
  return ext || 'jpg';
};

class AuthService {
  static attachProfileImage(user) {
    if (!user) return null;
    return user;
  }

  static attachProfileImageToMany(users = []) {
    return users.map((user) => this.attachProfileImage(user));
  }

  // Register new user
  static async register(userData) {
    // Validate input
    const validation = validateRegistration(userData);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: userData.username },
          { email: userData.email },
          { epfNumber: userData.epfNumber }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === userData.username) {
        throw new Error('Username already exists');
      }
      if (existingUser.email === userData.email) {
        throw new Error('Email already exists');
      }
      if (existingUser.epfNumber === userData.epfNumber) {
        throw new Error('EPF Number already exists');
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        epfNumber: userData.epfNumber,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        division: userData.division,
        role: userData.role || 'WORKER',
        // if caller forgot to send a privilege level default to lowest non‑admin level (viewer)
        // it should already have been validated by the registration validator above
        privilege: userData.privilege || 2
      },
      select: {
        id: true,
        username: true,
        email: true,
        epfNumber: true,
        firstName: true,
        lastName: true,
        division: true,
        role: true,
        isActive: true,
        privilege: true,
        profileImageUrl: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = generateTokens(user);

    return {
      user: this.attachProfileImage(user),
      tokens
    };
  }

  // Login user
  static async login(loginData) {
    // Validate input
    const validation = validateLogin(loginData);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Find user by username or email
    const searchTerm = loginData.username || loginData.email;
    console.log(`DEBUG authService.login - searching for user with identifier "${searchTerm}"`);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: searchTerm },
          { email: searchTerm }
        ]
      }
    });

    if (!user) {
      console.log('DEBUG authService.login - no user found');
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`DEBUG authService.login - user ${user.username} found but isActive=false`);
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await comparePassword(loginData.password, user.password);
    if (!isValidPassword) {
      console.log(`DEBUG authService.login - password mismatch for user ${user.username}`);
      throw new Error('Invalid credentials');
    }

    console.log(`DEBUG authService.login - authenticated user ${user.username} privilege=${user.privilege}`);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = generateTokens(userWithoutPassword);

    return {
      user: this.attachProfileImage(userWithoutPassword),
      tokens
    };
  }

  // Refresh token
  static async refreshToken(refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          privilege: true,
          isActive: true,
          profileImageUrl: true,
        }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const tokens = generateTokens(user);
      
      return {
        user: this.attachProfileImage(user),
        tokens
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Get user profile
  static async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      throw new Error('User not found');
    }

    return this.attachProfileImage(user);
  }

  // Update user profile
  static async updateProfile(userId, updateData) {
    // If email is being updated, check for duplicates
    if (updateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          NOT: { id: userId }
        }
      });
      if (existingUser) {
        throw new Error('Email already exists');
      }
    }
    // If username is being updated, check for duplicates
    if (updateData.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: updateData.username,
          NOT: { id: userId }
        }
      });
      if (existingUser) {
        throw new Error('Username already exists');
      }
    }
    // If epfNumber is being updated, check for duplicates
    if (updateData.epfNumber) {
      const existingUser = await prisma.user.findFirst({
        where: {
          epfNumber: updateData.epfNumber,
          NOT: { id: userId }
        }
      });
      if (existingUser) {
        throw new Error('EPF Number already exists');
      }
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        epfNumber: true,
        firstName: true,
        lastName: true,
        division: true,
        role: true,
        isActive: true,
        privilege: true,
        profileImageUrl: true,
        updatedAt: true
      }
    });
    return this.attachProfileImage(user);
  }

  // Change password
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new Error('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    return { message: 'Password updated successfully' };
  }

  // Get all users (Admin only)
  static async getAllUsers(filters = {}) {
    const { role, isActive, search, page = 1, limit = 10 } = filters;
    
    const where = {};
    
    if (role) where.role = role;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: this.attachProfileImageToMany(users),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update user role/status (Admin only)
  static async updateUserStatus(userId, updateData) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
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
        updatedAt: true
      }
    });

    return this.attachProfileImage(user);
  }

  // Update user (Admin/Manager only)
  static async updateUser(userId, userData) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // If updating email or username, check for conflicts
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      if (emailExists) {
        throw new Error('Email already exists');
      }
    }

    if (userData.username && userData.username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: userData.username }
      });
      if (usernameExists) {
        throw new Error('Username already exists');
      }
    }

    if (userData.epfNumber && parseInt(userData.epfNumber) !== existingUser.epfNumber) {
      const epfExists = await prisma.user.findFirst({
        where: { 
          epfNumber: parseInt(userData.epfNumber),
          NOT: { id: userId }
        }
      });
      if (epfExists) {
        throw new Error('EPF Number already exists');
      }
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...userData,
        epfNumber: userData.epfNumber ? parseInt(userData.epfNumber) : undefined,
        updatedAt: new Date()
      },
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
        updatedAt: true
      }
    });

    return this.attachProfileImage(user);
  }

  static async uploadUserProfileImage(userId, file) {
    const parsedUserId = parseInt(userId, 10);

    if (!Number.isFinite(parsedUserId)) {
      throw new Error('Invalid user ID');
    }

    if (!file?.buffer) {
      throw new Error('No image file uploaded');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: { id: true, profileImagePublicId: true },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (isCloudinaryConfigured()) {
      if (existingUser.profileImagePublicId) {
        try {
          await cloudinary.uploader.destroy(existingUser.profileImagePublicId);
        } catch (err) {
          console.error('Cloudinary delete existing profile image failed:', err?.message || err);
        }
      }

      if (existingUser.profileImageUrl?.startsWith('/uploads/user-images/')) {
        deleteUserImageFiles(parsedUserId);
      }

      const uploaded = await uploadBufferToCloudinary(file.buffer, 'cost-tracking/users');

      await prisma.user.update({
        where: { id: parsedUserId },
        data: {
          profileImageUrl: uploaded.secure_url,
          profileImagePublicId: uploaded.public_id,
          updatedAt: new Date(),
        },
      });
    } else {
      ensureUserImagesDir();
      deleteUserImageFiles(parsedUserId);

      const fileExtension = getImageExtension(file);
      const filename = `${parsedUserId}.${Date.now()}.${fileExtension}`;
      const destinationPath = path.join(USER_IMAGES_DIR, filename);

      fs.writeFileSync(destinationPath, file.buffer);

      await prisma.user.update({
        where: { id: parsedUserId },
        data: {
          profileImageUrl: `/uploads/user-images/${filename}`,
          profileImagePublicId: null,
          updatedAt: new Date(),
        },
      });
    }

    return this.getProfile(parsedUserId);
  }

  static async deleteUserProfileImage(userId) {
    const parsedUserId = parseInt(userId, 10);

    if (!Number.isFinite(parsedUserId)) {
      throw new Error('Invalid user ID');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: { id: true, profileImagePublicId: true },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (existingUser.profileImagePublicId && isCloudinaryConfigured()) {
      try {
        await cloudinary.uploader.destroy(existingUser.profileImagePublicId);
      } catch (err) {
        console.error('Cloudinary delete profile image failed:', err?.message || err);
      }
    }

    if (existingUser.profileImageUrl?.startsWith('/uploads/user-images/')) {
      deleteUserImageFiles(parsedUserId);
    }

    await prisma.user.update({
      where: { id: parsedUserId },
      data: {
        profileImageUrl: null,
        profileImagePublicId: null,
        updatedAt: new Date(),
      },
    });

    return this.getProfile(parsedUserId);
  }

  // Delete user (Admin only)
  static async deleteUser(userId) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        createdJobs: true,
        createdDailyLaborCosts: true,
        updatedDailyLaborCosts: true,
        createdMaterialOrders: true,
        updatedMaterialOrders: true,
        createdMaterials: true,
        updatedMaterials: true
      }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (existingUser.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(existingUser.profileImagePublicId);
      } catch (err) {
        console.error('Cloudinary delete on user remove failed:', err?.message || err);
      }
    }

    // Check if user has any related data
    const hasCreatedJobs = existingUser.createdJobs.length > 0;
    const hasLaborCosts = existingUser.createdDailyLaborCosts.length > 0 || existingUser.updatedDailyLaborCosts.length > 0;
    const hasMaterialOrders = existingUser.createdMaterialOrders.length > 0 || existingUser.updatedMaterialOrders.length > 0;
    const hasMaterials = existingUser.createdMaterials.length > 0 || existingUser.updatedMaterials.length > 0;

    if (hasCreatedJobs || hasLaborCosts || hasMaterialOrders || hasMaterials) {
      const relatedData = [];
      if (hasCreatedJobs) relatedData.push(`${existingUser.createdJobs.length} job(s)`);
      if (hasLaborCosts) relatedData.push(`labor cost records`);
      if (hasMaterialOrders) relatedData.push(`material order records`);
      if (hasMaterials) relatedData.push(`material records`);
      
      throw new Error(
        `Cannot delete user "${existingUser.firstName} ${existingUser.lastName}" because they have related data: ${relatedData.join(', ')}. Please reassign or remove related data first.`
      );
    }

    return prisma.user.delete({
      where: { id: userId }
    });
  }
}

export default AuthService;