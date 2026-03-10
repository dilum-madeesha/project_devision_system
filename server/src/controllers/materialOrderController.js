import MaterialOrderService from '../services/materialOrderService.js';

class MaterialOrderController {
  static async create(req, res) {
    try {
      // Add user ID from authenticated user
      const data = {
        ...req.body,
        createdById: req.user.id,
        updatedById: req.user.id
      };

      const materialOrder = await MaterialOrderService.create(data);
      res.status(201).json({ success: true, data: materialOrder });
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

      const materialOrder = await MaterialOrderService.update(req.params.id, data);
      res.json({ success: true, data: materialOrder });
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
      const materialOrders = await MaterialOrderService.getAll(req.query);
      res.json({ success: true, data: materialOrders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const materialOrder = await MaterialOrderService.getById(req.params.id);
      if (!materialOrder) {
        return res.status(404).json({ success: false, message: 'Material order not found' });
      }
      res.json({ success: true, data: materialOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req, res) {
    try {
      await MaterialOrderService.delete(req.params.id);
      res.json({ success: true, message: 'Material order deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByJobId(req, res) {
    try {
      const materialOrders = await MaterialOrderService.getByJobId(req.params.jobId);
      res.json({ success: true, data: materialOrders });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByDate(req, res) {
    try {
      const { date } = req.params;
      console.log(`Getting material orders for date: ${date}`);
      const materialOrders = await MaterialOrderService.getByDate(date);
      console.log(`Found ${materialOrders.length} material orders for date: ${date}`);
      res.json({ success: true, data: materialOrders });
    } catch (error) {
      console.error('Error in getByDate:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      console.log(`Getting material orders for date range: ${startDate} to ${endDate}`);
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: 'Both startDate and endDate are required' 
        });
      }
      
      const materialOrders = await MaterialOrderService.getByDateRange(startDate, endDate);
      console.log(`Found ${materialOrders.length} material orders for date range: ${startDate} to ${endDate}`);
      res.json({ success: true, data: materialOrders });
    } catch (error) {
      console.error('Error in getByDateRange:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default MaterialOrderController;
