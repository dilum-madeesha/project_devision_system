import UserService from '../services/userService.js';

class UserController {
  // Create new user (no file upload)
  static async create(req, res) {
    try {
      let userData = req.body;
      // convert types
      if (userData.epfNumber) userData.epfNumber = parseInt(userData.epfNumber);
      if (userData.privilege) userData.privilege = parseInt(userData.privilege);
      if (userData.isActive !== undefined) userData.isActive =
        userData.isActive === 'true' || userData.isActive === true;

      const user = await UserService.createUser(userData);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get all users
  static async getAll(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user by ID
  static async getById(req, res) {
    try {
      const user = await UserService.getUserById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update user (no file)
  static async update(req, res) {
    try {
      let userData = req.body;
      if (userData.epfNumber) userData.epfNumber = parseInt(userData.epfNumber);
      if (userData.privilege) userData.privilege = parseInt(userData.privilege);
      if (userData.isActive !== undefined) userData.isActive =
        userData.isActive === 'true' || userData.isActive === true;

      const user = await UserService.updateUser(req.params.id, userData);
      res.json({ success: true, message: 'User updated successfully', data: user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Delete user
  static async delete(req, res) {
    try {
      await UserService.deleteUser(req.params.id);
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

export default UserController;
