import prisma from '../config/database.js';
import { validateJob } from '../utils/validators.js';

class JobService {
  static async createJob(data, userId) {
    const validation = validateJob(data);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }
    return prisma.job.create({
      data: {
        ...data,
        createdById: userId,
      },
    });
  }

  static async updateJob(id, data) {
    const validation = validateJob(data);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }
    return prisma.job.update({
      where: { id: Number(id) },
      data,
    });
  }

  static async getAllJobs() {
    return prisma.job.findMany();
  }

  static async getJobById(id) {
    return prisma.job.findUnique({ where: { id: Number(id) } });
  }

  static async deleteJob(id) {
    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id: Number(id) },
      include: {
        dailyLaborCosts: true,
        materialOrders: true,
        dailyJobCosts: true
      }
    });

    if (!existingJob) {
      throw new Error('Job not found');
    }

    // Check if job has any related data
    const hasLaborCosts = existingJob.dailyLaborCosts.length > 0;
    const hasMaterialOrders = existingJob.materialOrders.length > 0;
    const hasDailyJobCosts = existingJob.dailyJobCosts.length > 0;

    if (hasLaborCosts || hasMaterialOrders || hasDailyJobCosts) {
      const relatedData = [];
      if (hasLaborCosts) relatedData.push(`${existingJob.dailyLaborCosts.length} labor cost record(s)`);
      if (hasMaterialOrders) relatedData.push(`${existingJob.materialOrders.length} material order(s)`);
      if (hasDailyJobCosts) relatedData.push(`${existingJob.dailyJobCosts.length} daily job cost record(s)`);
      
      throw new Error(
        `Cannot delete job "${existingJob.jobNumber} - ${existingJob.title}" because it has related data: ${relatedData.join(', ')}. Please remove all related data first or contact an administrator for cascade deletion.`
      );
    }

    return prisma.job.delete({
      where: { id: Number(id) },
    });
  }
}

export default JobService;
