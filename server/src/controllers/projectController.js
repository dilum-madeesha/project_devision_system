import ProjectService from '../services/projectService.js';

class ProjectController {
  // Create new project
  static async create(req, res) {
    try {
      const project = await ProjectService.create(req.body);
      res.status(201).json({ success: true, data: project });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update project
  static async update(req, res) {
    try {
      const project = await ProjectService.update(req.params.id, req.body);
      res.json({ success: true, data: project });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get all projects
  static async getAll(req, res) {
    try {
      const { limit, offset, status } = req.query;
      const projects = await ProjectService.getAll({ 
        limit: limit ? parseInt(limit) : 100, 
        offset: offset ? parseInt(offset) : 0,
        status
      });
      res.json({ success: true, data: { projects } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get project by ID
  static async getById(req, res) {
    try {
      const project = await ProjectService.getById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
      res.json({ success: true, data: project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Delete project
  static async delete(req, res) {
    try {
      await ProjectService.delete(req.params.id);
      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Update project progress
  static async updateProgress(req, res) {
    try {
      const { completedPercent } = req.body;
      const project = await ProjectService.updateProgress(req.params.id, completedPercent);
      res.json({ success: true, data: project });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get projects by status
  static async getByStatus(req, res) {
    try {
      const { status } = req.params;
      const projects = await ProjectService.getByStatus(status);
      res.json({ success: true, data: { projects } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Assign officer to project
  static async assignOfficer(req, res) {
    try {
      const { projectId } = req.params;
      const { officerId, role } = req.body;
      const assignment = await ProjectService.assignOfficer(projectId, officerId, role);
      res.status(201).json({ success: true, data: assignment });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Remove officer from project
  static async removeOfficer(req, res) {
    try {
      const { projectId, officerId } = req.params;
      const { role } = req.body;
      await ProjectService.removeOfficer(projectId, officerId, role);
      res.json({ success: true, message: 'Officer removed from project successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Upload project images
  static async uploadImages(req, res) {
    try {
      const { projectId } = req.params;

      
      
      console.log(`[uploadImages Controller] Request received for project ${projectId}`);
      console.log(`[uploadImages Controller] Files:`, req.files);
      console.log(`[uploadImages Controller] Headers:`, req.headers);

      
      if (!req.files || req.files.length === 0) {
        console.error('[uploadImages Controller] No files uploaded');
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      console.log(`[uploadImages Controller] Received ${req.files.length} files for project ${projectId}`);

      const uploadedImages = await ProjectService.uploadImages(projectId, req.files);
      
      console.log("[uploadImages Controller] Response:", uploadedImages);

      res.status(201).json({ success: true, message: 'Images uploaded successfully', data: uploadedImages });
    } catch (error) {
      console.error("[uploadImages Controller] Error:", error.message);
      console.error("[uploadImages Controller] Error Stack:", error.stack);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Get project images
  static async getImages(req, res) {
    try {
      const { projectId } = req.params;
      const images = await ProjectService.getImages(projectId);
      res.json({ success: true, data: images });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Delete project image
  static async deleteImage(req, res) {
    try {
      const { projectId, imageFilename } = req.params;
      await ProjectService.deleteImage(projectId, imageFilename);
      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}


export default ProjectController;
