import DailyLaborCostService from '../services/dailyLaborCostService.js';

class DailyLaborCostController {
  static async create(req, res) {
    try {
      // Add user ID from authenticated user
      const data = {
        ...req.body,
        createdById: req.user.id,
        updatedById: req.user.id
      };

      const dailyLaborCost = await DailyLaborCostService.create(data);
      res.status(201).json({ success: true, data: dailyLaborCost });
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
      // Add user ID from authenticated user for update tracking
      const data = {
        ...req.body,
        updatedById: req.user.id
      };

      const dailyLaborCost = await DailyLaborCostService.update(req.params.id, data);
      res.json({ success: true, data: dailyLaborCost });
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
      const dailyLaborCosts = await DailyLaborCostService.getAll(req.query);
      res.json({ success: true, data: dailyLaborCosts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const dailyLaborCost = await DailyLaborCostService.getById(req.params.id);
      if (!dailyLaborCost) {
        return res.status(404).json({ success: false, message: 'Daily labor cost not found' });
      }
      res.json({ success: true, data: dailyLaborCost });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await DailyLaborCostService.delete(req.params.id);
      res.json({ success: true, message: 'Daily labor cost deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByJobId(req, res) {
    try {
      const dailyLaborCosts = await DailyLaborCostService.getByJobId(req.params.jobId);
      res.json({ success: true, data: dailyLaborCosts });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByDate(req, res) {
    try {
      const { date } = req.params;
      console.log(`Getting daily labor costs for date: ${date}`);
      const dailyLaborCosts = await DailyLaborCostService.getByDate(date);
      console.log(`Found ${dailyLaborCosts.length} daily labor costs for date: ${date}`);
      res.json({ success: true, data: dailyLaborCosts });
    } catch (error) {
      console.error('Error in getByDate:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      console.log(`Getting daily labor costs for date range: ${startDate} to ${endDate}`);
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Both startDate and endDate are required' 
        });
      }
      
      const dailyLaborCosts = await DailyLaborCostService.getByDateRange(startDate, endDate);
      console.log(`Found ${dailyLaborCosts.length} daily labor costs for date range: ${startDate} to ${endDate}`);
      res.json({ success: true, data: dailyLaborCosts });
    } catch (error) {
      console.error('Error in getByDateRange:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default DailyLaborCostController;
