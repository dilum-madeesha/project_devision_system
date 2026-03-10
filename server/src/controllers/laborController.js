import LaborService from '../services/laborService.js';

class LaborController {
  static async register(req, res) {
    try {
      const labor = await LaborService.register(req.body);
      res.status(201).json({ success: true, data: labor });
    } catch (error) {
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({ success: false, errors: validationErrors });
      } catch {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  static async update(req, res) {
    try {
      const labor = await LaborService.update(req.params.id, req.body);
      res.json({ success: true, data: labor });
    } catch (error) {
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({ success: false, errors: validationErrors });
      } catch {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  static async getAllLabors(req, res) {
    try {
      const labors = await LaborService.getAllLabors();
      res.json({ success: true, data: labors });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getLaborById(req, res) {
    try {
      const labor = await LaborService.getLaborById(req.params.id);
      if (!labor) {
        return res.status(404).json({ success: false, message: 'Labor not found' });
      }
      res.json({ success: true, data: labor });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteLabor(req, res) {
    try {
      await LaborService.deleteLabor(req.params.id);
      res.json({ success: true, message: 'Labor deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default LaborController;
