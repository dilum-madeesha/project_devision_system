import api from './config.js';

export const projectAPI = {
  // Get all projects
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/projects', { params });
      return response.data;
    } catch (error) {
      console.error('Get Projects API Error:', error);
      throw error;
    }
  },

  // Get project by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Project by ID API Error:', error);
      throw error;
    }
  },

  // Get projects by status
  getByStatus: async (status) => {
    try {
      const response = await api.get(`/projects/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Get Projects by Status API Error:', error);
      throw error;
    }
  },

  // Create a new project
  create: async (projectData) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Create Project API Error:', error);
      throw error;
    }
  },

  // Update an existing project
  update: async (id, projectData) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data;
    } catch (error) {
      console.error('Update Project API Error:', error);
      throw error;
    }
  },

  // Update project progress
  updateProgress: async (id, completedPercent) => {
    try {
      const response = await api.patch(`/projects/${id}/progress`, { completedPercent });
      return response.data;
    } catch (error) {
      console.error('Update Project Progress API Error:', error);
      throw error;
    }
  },

  // Delete a project
  delete: async (id) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Project API Error:', error);
      throw error;
    }
  },

  // Assign officer to project
  assignOfficer: async (projectId, officerId, role) => {
    try {
      const response = await api.post(`/projects/${projectId}/officers`, { officerId, role });
      return response.data;
    } catch (error) {
      console.error('Assign Officer API Error:', error);
      throw error;
    }
  },

  // Remove officer from project
  removeOfficer: async (projectId, officerId, role) => {
    try {
      const response = await api.delete(`/projects/${projectId}/officers/${officerId}`, { data: { role } });
      return response.data;
    } catch (error) {
      console.error('Remove Officer API Error:', error);
      throw error;
    }
  },

  // Upload project images
  uploadImages: async (projectId, formData) => {
    try {
      // explicitly let axios set multipart boundaries
      const response = await api.post(
        `/projects/${projectId}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      // show any server-provided message for debugging
      console.error(
        'Upload Project Images API Error:',
        error.response?.data || error.message || error
      );
      throw error;
    }
  },

  // Get project images
  getImages: async (projectId) => {
    try {
      const response = await api.get(`/projects/${projectId}/images`);
      return response.data;
    } catch (error) {
      console.error('Get Project Images API Error:', error);
      throw error;
    }
  },

  // Delete project image
  deleteImage: async (projectId, imageFilename) => {
    try {
      const encodedFilename = encodeURIComponent(imageFilename);
      const response = await api.delete(`/projects/${projectId}/images/${encodedFilename}`);
      return response.data;
    } catch (error) {
      console.error('Delete Project Image API Error:', error);
      throw error;
    }
  },
};
