import MaterialService from '../services/materialService.js';
import { hasPermission } from '../middleware/auth.js';

class MaterialController {
  // Create new material
  static async createMaterial(req, res, next) {
    try {
      const material = await MaterialService.createMaterial(req.body, req.user.id);

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: material,
      });
    } catch (error) {
      // Handle validation errors
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      } catch {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  // Get all materials with filtering, pagination
  static async getAllMaterials(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc',
      };

      const result = await MaterialService.getAllMaterials(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Get material by ID
  static async getMaterialById(req, res, next) {
    try {
      const material = await MaterialService.getMaterialById(req.params.id);

      res.json({
        success: true,
        data: material,
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Update material
  static async updateMaterial(req, res, next) {
    try {
      const material = await MaterialService.updateMaterial(
        req.params.id,
        req.body,
        req.user.id
      );

      res.json({
        success: true,
        message: 'Material updated successfully',
        data: material,
      });
    } catch (error) {
      // Handle validation errors
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      } catch {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }
  }

  // Delete material
  static async deleteMaterial(req, res, next) {
    try {
      await MaterialService.deleteMaterial(req.params.id);

      res.json({
        success: true,
        message: 'Material deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Search materials (for autocomplete/suggestions)
  static async searchMaterials(req, res, next) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search term must be at least 2 characters long',
        });
      }

      const materials = await MaterialService.searchMaterials(q.trim());

      res.json({
        success: true,
        data: materials,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  // Bulk create materials from Excel upload
  static async bulkCreateMaterials(req, res, next) {
    try {
      const { materials } = req.body;

      if (!materials || !Array.isArray(materials) || materials.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Materials array is required and cannot be empty',
        });
      }
// Edited
      // Validate each material
      const validationErrors = [];
      const validMaterials = [];

      materials.forEach((material, index) => {
        const errors = [];
        
        if (!material.name || typeof material.name !== 'string' || !material.name.trim()) {
          errors.push(`Material ${index + 1}: Name is required`);
        }
        if (!material.uom || typeof material.uom !== 'string' || !material.uom.trim()) {
          errors.push(`Material ${index + 1}: UOM is required`);
        }
        const price = parseFloat(material.unitPrice);
        if (!isNaN(price) && price < 0) {
          errors.push(`Material ${index + 1}: Unit price must be a non-negative number`);
        }

        if (errors.length > 0) {
          validationErrors.push(...errors);
        } else {
          validMaterials.push({
            name: material.name.trim(),
            description: material.description ? material.description.trim() : null,
            uom: material.uom.trim(),
            unitPrice: isNaN(price) ? 0 : price,
            createdById: req.user.id,
            updatedById: req.user.id,
          });
        }
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        });
      }
// Edited
      // Create materials in bulk
      const result = await MaterialService.bulkCreateMaterials(validMaterials);

      res.status(201).json({
        success: true,
        message: `${result.count} materials created successfully`,
        data: {
          count: result.count,
          created: result.materials,
        },
      });
    } catch (error) {
      // Handle duplicate key or other errors
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Some materials already exist. Please check for duplicates.',
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default MaterialController;
