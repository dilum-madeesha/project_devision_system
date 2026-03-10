import prisma from '../config/database.js';
import { validateDailyJobCost } from '../utils/validators.js';

class DailyJobCostService {
  // Helper method to calculate costs from related tables
  static async calculateCostsForJobDate(jobId, date) {
    const jobIdNum = Number(jobId);
    const dateObj = new Date(date);
    
    // Get all labor costs for the job and date
    const laborCosts = await prisma.dailyLaborCost.findMany({
      where: {
        jobId: jobIdNum,
        date: dateObj
      }
    });
    
    // Get all material costs for the job and date
    const materialOrders = await prisma.materialOrder.findMany({
      where: {
        jobId: jobIdNum,
        date: dateObj
      }
    });
    
    // Calculate totals
    const laborCost = laborCosts.reduce((sum, item) => sum + item.cost, 0);
    const materialCost = materialOrders.reduce((sum, item) => sum + item.cost, 0);
    const totalCost = laborCost + materialCost;
    
    return { laborCost, materialCost, totalCost };
  }

  static async create(data) {
    const validation = validateDailyJobCost(data);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Check for duplicate entry (same job and date)
    const existing = await prisma.dailyJobCost.findFirst({
      where: {
        jobId: data.jobId,
        date: new Date(data.date)
      }
    });

    if (existing) {
      throw new Error(JSON.stringify({ 
        date: 'A daily job cost entry already exists for this job and date'
      }));
    }

    // Calculate costs from related tables if not provided
    const calculatedCosts = await this.calculateCostsForJobDate(data.jobId, data.date);
    
    // Parse date string into a proper Date object
    const formattedData = {
      jobId: data.jobId,
      date: new Date(data.date),
      laborCost: data.laborCost !== undefined ? data.laborCost : calculatedCosts.laborCost,
      materialCost: data.materialCost !== undefined ? data.materialCost : calculatedCosts.materialCost,
    };

    // Calculate total cost
    formattedData.totalCost = formattedData.laborCost + formattedData.materialCost;

    return prisma.dailyJobCost.create({
      data: formattedData,
      include: {
        job: true
      }
    });
  }

  static async update(id, data) {
    // Get the current record
    const currentRecord = await prisma.dailyJobCost.findUnique({
      where: { id: Number(id) }
    });

    if (!currentRecord) {
      throw new Error(JSON.stringify({ id: 'Daily job cost record not found' }));
    }

    // Merge current data with update data for validation
    const completeData = {
      ...currentRecord,
      ...data
    };

    const validation = validateDailyJobCost(completeData);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Check if unique constraint is changing (job and date combination)
    const isUniqueKeyChanging = 
      (data.jobId !== undefined && Number(data.jobId) !== Number(currentRecord.jobId)) ||
      (data.date !== undefined && 
       new Date(data.date).toISOString().split('T')[0] !== new Date(currentRecord.date).toISOString().split('T')[0]);

    // Only check for duplicates if the unique key is changing
    if (isUniqueKeyChanging) {
      const jobId = data.jobId !== undefined ? Number(data.jobId) : Number(currentRecord.jobId);
      const date = data.date !== undefined ? new Date(data.date) : currentRecord.date;
      
      const existing = await prisma.dailyJobCost.findFirst({
        where: {
          jobId: jobId,
          date: date,
          NOT: { id: Number(id) }
        }
      });

      if (existing) {
        throw new Error(JSON.stringify({ 
          date: 'A daily job cost entry already exists for this job and date'
        }));
      }
    }

    // Parse date string into a proper Date object if provided
    const formattedData = {};
    
    if (data.jobId !== undefined) formattedData.jobId = Number(data.jobId);
    if (data.date !== undefined) formattedData.date = new Date(data.date);
    if (data.laborCost !== undefined) formattedData.laborCost = Number(data.laborCost);
    if (data.materialCost !== undefined) formattedData.materialCost = Number(data.materialCost);

    // If laborCost or materialCost is being updated, recalculate totalCost
    if (data.laborCost !== undefined || data.materialCost !== undefined) {
      const finalLaborCost = data.laborCost !== undefined ? Number(data.laborCost) : currentRecord.laborCost;
      const finalMaterialCost = data.materialCost !== undefined ? Number(data.materialCost) : currentRecord.materialCost;
      formattedData.totalCost = finalLaborCost + finalMaterialCost;
    }

    return prisma.dailyJobCost.update({
      where: { id: Number(id) },
      data: formattedData,
      include: {
        job: true
      }
    });
  }

  static async getAll() {
    return prisma.dailyJobCost.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true
          }
        }
      }
    });
  }

  static async getById(id) {
    return prisma.dailyJobCost.findUnique({
      where: { id: Number(id) },
      include: {
        job: true
      }
    });
  }

  static async delete(id) {
    return prisma.dailyJobCost.delete({
      where: { id: Number(id) }
    });
  }

  static async getByJobId(jobId) {
    return prisma.dailyJobCost.findMany({
      where: { jobId: Number(jobId) },
      orderBy: {
        date: 'desc'
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true
          }
        }
      }
    });
  }

  static async calculateAndUpdateForJob(jobId, date) {
    // Calculate costs from related tables
    const costs = await this.calculateCostsForJobDate(jobId, date);
    
    // Convert jobId to number and date to Date object
    const jobIdNum = Number(jobId);
    const dateObj = new Date(date);
    
    // Update or create daily job cost
    const existingCost = await prisma.dailyJobCost.findFirst({
      where: {
        jobId: jobIdNum,
        date: dateObj
      }
    });
    
    if (existingCost) {
      return prisma.dailyJobCost.update({
        where: { id: existingCost.id },
        data: { 
          laborCost: costs.laborCost,
          materialCost: costs.materialCost,
          totalCost: costs.totalCost
        },
        include: { job: true }
      });
    } else {
      return prisma.dailyJobCost.create({
        data: {
          jobId: jobIdNum,
          date: dateObj,
          laborCost: costs.laborCost,
          materialCost: costs.materialCost,
          totalCost: costs.totalCost
        },
        include: { job: true }
      });
    }
  }

  // Method to refresh costs from related tables
  static async refreshCostsFromTables(jobId, date) {
    return this.calculateAndUpdateForJob(jobId, date);
  }
}

export default DailyJobCostService;
