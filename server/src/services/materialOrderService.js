import prisma from '../config/database.js';
import { validateMaterialOrder } from '../utils/validators.js';

class MaterialOrderService {
  static async create(data) {
    const validation = validateMaterialOrder(data);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Check for duplicate code for the same job and date
    const existing = await prisma.materialOrder.findFirst({
      where: {
        jobId: data.jobId,
        date: new Date(data.date),
        code: data.code
      }
    });

    if (existing) {
      throw new Error(JSON.stringify({ 
        code: 'A material order with this code already exists for this job and date'
      }));
    }

    // Parse date string into a proper Date object
    const formattedData = {
      ...data,
      date: new Date(data.date)
    };

    return prisma.materialOrder.create({
      data: formattedData,
      include: {
        job: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        materialAssignments: {
          include: {
            material: true
          }
        }
      }
    });
  }

  static async update(id, data) {
    // Get the current record
    const currentRecord = await prisma.materialOrder.findUnique({
      where: { id: Number(id) }
    });

    if (!currentRecord) {
      throw new Error(JSON.stringify({ id: 'Material order record not found' }));
    }

    // Don't allow changes to jobId and date
    if (data.jobId !== undefined && Number(data.jobId) !== Number(currentRecord.jobId)) {
      throw new Error(JSON.stringify({
        jobId: 'Cannot change jobId on existing material order'
      }));
    }

    if (data.date !== undefined && 
        new Date(data.date).toISOString().split('T')[0] !== 
        new Date(currentRecord.date).toISOString().split('T')[0]) {
      throw new Error(JSON.stringify({
        date: 'Cannot change date on existing material order'
      }));
    }

    // Merge current data with update data for validation
    const completeData = {
      ...currentRecord,
      ...data
    };

    const validation = validateMaterialOrder(completeData);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // If code is changing, check for duplicate with current jobId and date
    if (data.code !== undefined && data.code !== currentRecord.code) {
      const existing = await prisma.materialOrder.findFirst({
        where: {
          jobId: currentRecord.jobId,
          date: currentRecord.date,
          code: data.code,
          NOT: { id: Number(id) }
        }
      });

      if (existing) {
        throw new Error(JSON.stringify({ 
          code: 'A material order with this code already exists for this job and date'
        }));
      }
    }

    // Parse date string into a proper Date object if provided
    const formattedData = {};
    
    // Ensure we keep original jobId and date
    formattedData.jobId = currentRecord.jobId;
    formattedData.date = currentRecord.date;
    
    // Only allow updates to these fields
    if (data.type !== undefined) formattedData.type = data.type;
    if (data.code !== undefined) formattedData.code = data.code;
    if (data.description !== undefined) formattedData.description = data.description;
    if (data.cost !== undefined) formattedData.cost = Number(data.cost);
    if (data.updatedById !== undefined) formattedData.updatedById = Number(data.updatedById);

    return prisma.materialOrder.update({
      where: { id: Number(id) },
      data: formattedData,
      include: {
        job: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        materialAssignments: {
          include: {
            material: true
          }
        }
      }
    });
  }

  static async getAll(filters = {}) {
    const { jobId, type, startDate, endDate } = filters;
    
    const where = {};
    
    if (jobId) {
      where.jobId = Number(jobId);
    }
    
    if (type) {
      where.type = type;
    }
    
    if (startDate) {
      where.date = {
        ...where.date,
        gte: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.date = {
        ...where.date,
        lte: new Date(endDate)
      };
    }
    
    return prisma.materialOrder.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
            projectCode: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  static async getById(id) {
    return prisma.materialOrder.findUnique({
      where: { id: Number(id) },
      include: {
        job: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        materialAssignments: {
          include: {
            material: true
          }
        }
      }
    });
  }

  static async delete(id) {
    // Use transaction to ensure both tables are updated correctly
    return prisma.$transaction(async (tx) => {
      // First, delete all related material order assignments
      await tx.materialOrderAssignment.deleteMany({
        where: { materialOrderId: Number(id) }
      });

      // Then delete the material order record
      return tx.materialOrder.delete({
        where: { id: Number(id) }
      });
    });
  }

  static async getByJobId(jobId) {
    return prisma.materialOrder.findMany({
      where: { jobId: Number(jobId) },
      orderBy: {
        date: 'desc'
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
            projectCode: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        materialAssignments: {
          include: {
            material: true
          }
        }
      }
    });
  }

  static async getByDate(dateStr) {
    // Parse date string into a Date object
    const inputDate = new Date(dateStr);
    
    // Set to start of the day (midnight)
    const startDate = new Date(inputDate);
    startDate.setHours(0, 0, 0, 0);
    
    // Set to end of the day (23:59:59.999)
    const endDate = new Date(inputDate);
    endDate.setHours(23, 59, 59, 999);
    
    return prisma.materialOrder.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        job: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        materialAssignments: {
          include: {
            material: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }
  
  static async getByDateRange(startDateStr, endDateStr) {
    // Parse date strings into Date objects
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0); // Set to start of the day
    
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999); // Set to end of the day
    
    return prisma.materialOrder.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        job: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        materialAssignments: {
          include: {
            material: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }
}

export default MaterialOrderService;
