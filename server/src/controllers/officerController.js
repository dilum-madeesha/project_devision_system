import OfficerService from '../services/officerService.js';

class OfficerController {
  // Create new officer
  static async create(req, res) {
    try {
      const officer = await OfficerService.create(req.body);
      res.status(201).json({ success: true, data: officer });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update officer
  static async update(req, res) {
    try {
      const officer = await OfficerService.update(req.params.id, req.body);
      res.json({ success: true, data: officer });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get all officers
  static async getAll(req, res) {
    try {
      const { limit, offset } = req.query;
      const officers = await OfficerService.getAll({ 
        limit: limit ? parseInt(limit) : 100, 
        offset: offset ? parseInt(offset) : 0 
      });
      res.json({ success: true, data: { officers } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get officer by ID
  static async getById(req, res) {
    try {
      const officer = await OfficerService.getById(req.params.id);
      if (!officer) {
        return res.status(404).json({ success: false, message: 'Officer not found' });
      }
      res.json({ success: true, data: officer });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete officer
  static async delete(req, res) {
    try {
      await OfficerService.delete(req.params.id);
      res.json({ success: true, message: 'Officer deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default OfficerController;
