import DailyJobCostService from '../services/dailyJobCostService.js';

class DailyJobCostController {
  static async create(req, res) {
    try {
      const dailyJobCost = await DailyJobCostService.create(req.body);
      res.status(201).json({ success: true, data: dailyJobCost });
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
      const dailyJobCost = await DailyJobCostService.update(req.params.id, req.body);
      res.json({ success: true, data: dailyJobCost });
    } catch (error) {
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({ success: false, errors: validationErrors });
      } catch {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  static async getAll(req, res) {
    try {
      const dailyJobCosts = await DailyJobCostService.getAll();
      res.json({ success: true, data: dailyJobCosts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const dailyJobCost = await DailyJobCostService.getById(req.params.id);
      if (!dailyJobCost) {
        return res.status(404).json({ success: false, message: 'Daily job cost not found' });
      }
      res.json({ success: true, data: dailyJobCost });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await DailyJobCostService.delete(req.params.id);
      res.json({ success: true, message: 'Daily job cost deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByJobId(req, res) {
    try {
      const dailyJobCosts = await DailyJobCostService.getByJobId(req.params.jobId);
      res.json({ success: true, data: dailyJobCosts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async calculateForJob(req, res) {
    try {
      const { jobId, date } = req.params;
      const result = await DailyJobCostService.calculateAndUpdateForJob(jobId, date);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async refreshCosts(req, res) {
    try {
      const { jobId, date } = req.params;
      const result = await DailyJobCostService.refreshCostsFromTables(jobId, date);
      res.json({ 
        success: true, 
        message: 'Costs refreshed from related tables',
        data: result 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default DailyJobCostController;
