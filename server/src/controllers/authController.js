import AuthService from '../services/authService.js';

class AuthController {
  // Register new user
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      // Handle validation errors
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      } catch {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
  }

  // Login user
  static async login(req, res, next) {
    console.log('DEBUG: /login route hit. Request body:', req.body); //debugging
    try {
      const result = await AuthService.login(req.body);
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      // Also return the refresh token in payload (cookie is set as well) so clients
      // that prefer localStorage can save it and avoid blind refresh attempts.
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.tokens.token,
          refreshToken: result.tokens.refreshToken
        }
      });
    } catch (error) {
      // Handle validation errors
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      } catch {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
    }
  }

  // Refresh token
  static async refreshToken(req, res, next) {
    try {
      // prefer cookie token for backward compatibility but body is fine
      const cookieToken = req.cookies.refreshToken;
      const bodyToken = req.body.refreshToken;
      const refreshToken = cookieToken || bodyToken;
      
      console.log('DEBUG authController.refreshToken - token sources', {
        cookie: !!cookieToken,
        body: !!bodyToken
      });

      if (!refreshToken) {
        console.log('DEBUG authController.refreshToken - no token in cookies or body');
        return res.status(401).json({
          success: false,
          message: 'Refresh token not provided'
        });
      }

      const result = await AuthService.refreshToken(refreshToken);
      
      // Set new refresh token as httpOnly cookie
      // send refresh token as an httpOnly cookie and also include it
      // in the response body so JS clients can store a copy if they need to
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.tokens.token,
          refreshToken: result.tokens.refreshToken // new field
        }
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  // Logout
  static async logout(req, res) {
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }

  // Get current user profile
  static async getProfile(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update current user profile
  static async updateProfile(req, res, next) {
    try {
      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { password, role, isActive, ...updateData } = req.body;
      
      const user = await AuthService.updateProfile(req.user.id, updateData);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Change password
  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all users
  static async getAllUsers(req, res, next) {
    try {
      const filters = {
        role: req.query.role,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 100 
      };
//edited teh 10 to 100 users
      const result = await AuthService.getAllUsers(filters);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user role/status
  static async updateUserStatus(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      const { role, isActive } = req.body;

      // Prevent admin from deactivating themselves
      if (userId === req.user.id && isActive === false) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      const updateData = {};
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      const user = await AuthService.updateUserStatus(userId, updateData);
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user by ID (Manager/Admin only)
  static async getUserById(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      const user = await AuthService.getProfile(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user
  static async updateUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      const updateData = { ...req.body };



      const user = await AuthService.updateUser(userId, updateData);
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async uploadProfileImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded'
        });
      }

      const user = await AuthService.uploadUserProfileImage(req.user.id, req.file);

      res.json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteProfileImage(req, res) {
    try {
      const user = await AuthService.deleteUserProfileImage(req.user.id);

      res.json({
        success: true,
        message: 'Profile image deleted successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async uploadUserImage(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!Number.isFinite(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file uploaded'
        });
      }

      const user = await AuthService.uploadUserProfileImage(userId, req.file);

      res.json({
        success: true,
        message: 'User image uploaded successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async deleteUserImage(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!Number.isFinite(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }

      const user = await AuthService.deleteUserProfileImage(userId);

      res.json({
        success: true,
        message: 'User image deleted successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete user
  static async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id);
      await AuthService.deleteUser(userId);
      
      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

export default AuthController;