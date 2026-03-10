import ContractorService from '../services/contractorService.js';

class ContractorController {
  // Create new contractor
  static async create(req, res) {
    try {
      const contractor = await ContractorService.create(req.body);
      res.status(201).json({ success: true, data: contractor });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update contractor
  static async update(req, res) {
    try {
      const contractor = await ContractorService.update(req.params.id, req.body);
      res.json({ success: true, data: contractor });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get all contractors
  static async getAll(req, res) {
    try {
      const { limit, offset } = req.query;
      const contractors = await ContractorService.getAll({ 
        limit: limit ? parseInt(limit) : 100, 
        offset: offset ? parseInt(offset) : 0 
      });
      res.json({ success: true, data: { contractors } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get contractor by ID
  static async getById(req, res) {
    try {
      const contractor = await ContractorService.getById(req.params.id);
      if (!contractor) {
        return res.status(404).json({ success: false, message: 'Contractor not found' });
      }
      res.json({ success: true, data: contractor });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete contractor
  static async delete(req, res) {
    try {
      await ContractorService.delete(req.params.id);
      res.json({ success: true, message: 'Contractor deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default ContractorController;
