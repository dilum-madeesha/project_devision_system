import { validateJob } from '../utils/validators.js';
import prisma from '../config/database.js';
import JobService from '../services/jobService.js';

class JobController {
  static async createJob(req, res) {
    try {
      const job = await JobService.createJob(req.body, req.user.id);
      res.status(201).json({ success: true, data: job });
    } catch (error) {
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({ success: false, errors: validationErrors });
      } catch {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  static async updateJob(req, res) {
    try {
      const job = await JobService.updateJob(req.params.id, req.body);
      res.json({ success: true, data: job });
    } catch (error) {
      try {
        const validationErrors = JSON.parse(error.message);
        return res.status(400).json({ success: false, errors: validationErrors });
      } catch {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }

  static async getAllJobs(req, res) {
    try {
      const jobs = await JobService.getAllJobs();
      res.json({ success: true, data: jobs });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getJobById(req, res) {
    try {
      const job = await JobService.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      res.json({ success: true, data: job });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteJob(req, res) {
    try {
      await JobService.deleteJob(req.params.id);
      res.json({ success: true, message: 'Job deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default JobController;
