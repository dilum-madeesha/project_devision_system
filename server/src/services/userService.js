import prisma from '../config/database.js';
import { hashPassword } from '../utils/auth.js';

class UserService {
  static attachProfileImage(user) {
    if (!user) return null;
    return user;
  }

  static attachProfileImageToMany(users = []) {
    return users.map((user) => this.attachProfileImage(user));
  }

  // Create new user
  static async createUser(userData) {
    const {
      username,
      email,
      epfNumber,
      password,
      firstName,
      lastName,
      division,
      role,
      privilege,
      isActive
    } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
          { epfNumber: parseInt(epfNumber) }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new Error('Username already exists');
      }
      if (existingUser.email === email) {
        throw new Error('Email already exists');
      }
      if (existingUser.epfNumber === parseInt(epfNumber)) {
        throw new Error('EPF Number already exists');
      }
    }

    // hash the password before saving it
    const hashed = await hashPassword(password);
    const createdUser = await prisma.user.create({
      data: {
        username,
        email,
        epfNumber: parseInt(epfNumber),
        password: hashed,
        firstName,
        lastName,
        division,
        role: role || 'WORKER',
        privilege: parseInt(privilege) || 5,
        isActive: isActive !== undefined ? isActive : true
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
        updatedAt: true,
      }
    });

    return this.attachProfileImage(createdUser);
  }

  // Update user
  static async updateUser(userId, updateData) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check for unique constraints if email or username is being changed
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: updateData.email }
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: updateData.username }
      });
      if (existingUsername) {
        throw new Error('Username already exists');
      }
    }

    // prepare update payload and hash password if given
    const payload = {
      ...(updateData.username && { username: updateData.username }),
      ...(updateData.email && { email: updateData.email }),
      ...(updateData.firstName && { firstName: updateData.firstName }),
      ...(updateData.lastName && { lastName: updateData.lastName }),
      ...(updateData.division && { division: updateData.division }),
      ...(updateData.role && { role: updateData.role }),
      ...(updateData.privilege !== undefined && { privilege: parseInt(updateData.privilege) }),
      ...(updateData.isActive !== undefined && { isActive: updateData.isActive })
    };

    if (updateData.password) {
      payload.password = await hashPassword(updateData.password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: payload,
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
        updatedAt: true,
      }
    });

    return this.attachProfileImage(updatedUser);
  }

  // Get user by ID
  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
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

  // Get all users
  static async getAllUsers() {
    const users = await prisma.user.findMany({
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
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return this.attachProfileImageToMany(users);
  }

  // Delete user
  static async deleteUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return prisma.user.delete({
      where: { id: parseInt(userId) }
    });
  }
}

export default UserService;
