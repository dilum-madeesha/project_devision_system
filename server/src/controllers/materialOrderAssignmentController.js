import MaterialOrderAssignmentService from '../services/materialOrderAssignmentService.js';

const MaterialOrderAssignmentController = {
  // Create multiple material order assignments
  async createMultiple(req, res) {
    try {
      const { materialOrderAssignments } = req.body;

      if (!Array.isArray(materialOrderAssignments) || materialOrderAssignments.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Material order assignments array is required and must not be empty'
        });
      }

      // Validate each assignment
      for (const assignment of materialOrderAssignments) {
        if (!assignment.materialOrderId || !assignment.materialId) {
          return res.status(400).json({
            success: false,
            message: 'Each assignment must have materialOrderId and materialId'
          });
        }

        if (!assignment.quantity || assignment.quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each assignment must have a valid quantity greater than 0'
          });
        }

        if (!assignment.unitPrice || assignment.unitPrice <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Each assignment must have a valid unit price greater than 0'
          });
        }

        // Calculate total price if not provided
        if (!assignment.totalPrice) {
          assignment.totalPrice = assignment.quantity * assignment.unitPrice;
        }
      }

      const createdAssignments = await MaterialOrderAssignmentService.createMultiple(materialOrderAssignments);

      res.status(201).json({
        success: true,
        message: 'Material order assignments created successfully',
        data: createdAssignments
      });
    } catch (error) {
      console.error('Error creating material order assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get assignments by material order ID
  async getByMaterialOrderId(req, res) {
    try {
      const { materialOrderId } = req.params;

      if (!materialOrderId || isNaN(materialOrderId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid material order ID is required'
        });
      }

      const assignments = await MaterialOrderAssignmentService.getByMaterialOrderId(materialOrderId);

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching material order assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get assignments by job and date
  async getByJobAndDate(req, res) {
    try {
      const { jobId, date } = req.query;

      if (!jobId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Job ID and date are required'
        });
      }

      const assignments = await MaterialOrderAssignmentService.getByJobAndDate(jobId, date);

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching material order assignments by job and date:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get assignments by material ID
  async getByMaterialId(req, res) {
    try {
      const { materialId } = req.params;

      if (!materialId || isNaN(materialId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid material ID is required'
        });
      }

      const assignments = await MaterialOrderAssignmentService.getByMaterialId(materialId);

      res.status(200).json({
        success: true,
        data: assignments
      });
    } catch (error) {
      console.error('Error fetching material order assignments by material:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get assignment by ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid assignment ID is required'
        });
      }

      const assignment = await MaterialOrderAssignmentService.getById(id);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Material order assignment not found'
        });
      }

      res.status(200).json({
        success: true,
        data: assignment
      });
    } catch (error) {
      console.error('Error fetching material order assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Update assignment
  async updateById(req, res) {
    try {
      const { id } = req.params;
      const { quantity, unitPrice } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid assignment ID is required'
        });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid quantity greater than 0 is required'
        });
      }

      if (!unitPrice || unitPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid unit price greater than 0 is required'
        });
      }

      const updateData = {
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(quantity) * parseFloat(unitPrice)
      };

      const updatedAssignment = await MaterialOrderAssignmentService.updateById(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Material order assignment updated successfully',
        data: updatedAssignment
      });
    } catch (error) {
      console.error('Error updating material order assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Delete assignment
  async deleteById(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'Valid assignment ID is required'
        });
      }

      const deletedAssignment = await MaterialOrderAssignmentService.deleteById(id);

      res.status(200).json({
        success: true,
        message: 'Material order assignment deleted successfully',
        data: deletedAssignment
      });
    } catch (error) {
      console.error('Error deleting material order assignment:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  // Get summary for a material order
  async getSummaryByMaterialOrderId(req, res) {
    try {
      const { materialOrderId } = req.params;

      if (!materialOrderId || isNaN(materialOrderId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid material order ID is required'
        });
      }

      const summary = await MaterialOrderAssignmentService.getSummaryByMaterialOrderId(materialOrderId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error generating material order assignment summary:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

export default MaterialOrderAssignmentController;
