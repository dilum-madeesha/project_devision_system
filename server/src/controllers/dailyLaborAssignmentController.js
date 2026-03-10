import DailyLaborAssignmentService from '../services/dailyLaborAssignmentService.js';

class DailyLaborAssignmentController {
  // Get assignment by ID
  static async getById(req, res) {
    try {
      const assignment = await DailyLaborAssignmentService.getById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ success: false, message: 'Assignment not found' });
      }
      res.json({ success: true, data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Update assignment by ID
  static async updateById(req, res) {
    try {
      const assignment = await DailyLaborAssignmentService.updateById(req.params.id, req.body);
      res.json({ success: true, data: assignment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get assignments for a specific daily labor cost
  static async getByDailyLaborCostId(req, res) {
    try {
      const assignments = await DailyLaborAssignmentService.getByDailyLaborCostId(req.params.dailyLaborCostId);
      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get assignments for a specific labor
  static async getByLaborId(req, res) {
    try {
      const assignments = await DailyLaborAssignmentService.getByLaborId(req.params.laborId);
      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get assignments for a specific job
  static async getByJobId(req, res) {
    try {
      const assignments = await DailyLaborAssignmentService.getByJobId(req.params.jobId);
      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get assignments for a date range
  static async getByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'startDate and endDate query parameters are required' 
        });
      }

      const assignments = await DailyLaborAssignmentService.getByDateRange(startDate, endDate);
      res.json({ success: true, data: assignments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get labor work summary
  static async getLaborWorkSummary(req, res) {
    try {
      const { laborId } = req.params;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'startDate and endDate query parameters are required' 
        });
      }

      const summary = await DailyLaborAssignmentService.getLaborWorkSummary(laborId, startDate, endDate);
      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default DailyLaborAssignmentController;
