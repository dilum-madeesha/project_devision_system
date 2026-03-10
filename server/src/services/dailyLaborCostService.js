import prisma from '../config/database.js';
import { validateDailyLaborCost } from '../utils/validators.js';

class DailyLaborCostService {
  static async create(data) {
    const validation = validateDailyLaborCost(data);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Check for duplicate entry (same job and date)
    const existing = await prisma.dailyLaborCost.findFirst({
      where: {
        jobId: data.jobId,
        date: new Date(data.date)
      }
    });

    if (existing) {
      throw new Error(JSON.stringify({ 
        date: 'A labor cost entry already exists for this job and date'
      }));
    }

    // Parse date string into a proper Date object
    const formattedData = {
      jobId: data.jobId,
      date: new Date(data.date),
      cost: data.cost,
      description: data.description,
      createdById: data.createdById,
      updatedById: data.updatedById
    };

    // Use transaction to create daily labor cost and assignments
    return await prisma.$transaction(async (tx) => {
      // Create the daily labor cost record
      const dailyLaborCost = await tx.dailyLaborCost.create({
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
          }
        }
      });

      // Create labor assignments if provided
      if (data.laborAssignments && Array.isArray(data.laborAssignments)) {
        const assignmentPromises = data.laborAssignments.map(assignment => {
          return tx.dailyLaborAssignment.create({
            data: {
              dailyLaborCostId: dailyLaborCost.id,
              laborId: assignment.laborId,
              timeIn: assignment.timeIn,
              timeOut: assignment.timeOut,
              otHours: assignment.otHours || 0,
              regularHours: assignment.regularHours || 0,
              regularCost: assignment.regularCost || 0,
              otCost: assignment.otCost || 0,
              hasWeekendPay: assignment.hasWeekendPay || false,
              weekendPayCost: assignment.weekendPayCost || 0,
              totalCost: assignment.totalCost || 0
            }
          });
        });

        await Promise.all(assignmentPromises);
      }

      // Return the complete record with assignments
      return await tx.dailyLaborCost.findUnique({
        where: { id: dailyLaborCost.id },
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
          laborAssignments: {
            include: {
              labor: {
                select: {
                  id: true,
                  epfNumber: true,
                  firstName: true,
                  lastName: true,
                  trade: true,
                  dayPay: true,
                  otPay: true,
                  weekendPay: true
                }
              }
            }
          }
        }
      });
    });
  }

  static async update(id, data) {
    // For update operations, we need to validate only the fields being updated
    // First get the current record to have complete data for validation
    const currentRecord = await prisma.dailyLaborCost.findUnique({
      where: { id: Number(id) }
    });

    if (!currentRecord) {
      throw new Error(JSON.stringify({ id: 'Daily labor cost record not found' }));
    }

    // Merge current data with update data for validation
    const completeData = {
      ...currentRecord,
      ...data
    };

    const validation = validateDailyLaborCost(completeData);
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
      const date = data.date !== undefined ? new Date(data.date) : new Date(currentRecord.date);
      
      const existing = await prisma.dailyLaborCost.findFirst({
        where: {
          jobId: jobId,
          date: date,
          NOT: { id: Number(id) }
        }
      });

      if (existing) {
        throw new Error(JSON.stringify({ 
          date: 'A labor cost entry already exists for this job and date'
        }));
      }
    }

    // Parse date string into a proper Date object if provided
    const formattedData = {};
    
    if (data.jobId !== undefined) formattedData.jobId = Number(data.jobId);
    if (data.date !== undefined) formattedData.date = new Date(data.date);
    if (data.cost !== undefined) formattedData.cost = Number(data.cost);
    if (data.description !== undefined) formattedData.description = data.description;
    if (data.createdById !== undefined) formattedData.createdById = Number(data.createdById);
    if (data.updatedById !== undefined) formattedData.updatedById = Number(data.updatedById);

    return await prisma.$transaction(async (tx) => {
      // Update the daily labor cost record
      const updatedRecord = await tx.dailyLaborCost.update({
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
          }
        }
      });

      // Update labor assignments if provided
      if (data.laborAssignments && Array.isArray(data.laborAssignments)) {
        // Delete existing assignments
        await tx.dailyLaborAssignment.deleteMany({
          where: { dailyLaborCostId: Number(id) }
        });

        // Create new assignments
        const assignmentPromises = data.laborAssignments.map(assignment => {
          return tx.dailyLaborAssignment.create({
            data: {
              dailyLaborCostId: Number(id),
              laborId: assignment.laborId,
              timeIn: assignment.timeIn,
              timeOut: assignment.timeOut,
              otHours: assignment.otHours || 0,
              regularHours: assignment.regularHours || 0,
              regularCost: assignment.regularCost || 0,
              otCost: assignment.otCost || 0,
              hasWeekendPay: assignment.hasWeekendPay || false,
              weekendPayCost: assignment.weekendPayCost || 0,
              totalCost: assignment.totalCost || 0
            }
          });
        });

        await Promise.all(assignmentPromises);
      }

      // Return the complete updated record with assignments
      return await tx.dailyLaborCost.findUnique({
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
          laborAssignments: {
            include: {
              labor: {
                select: {
                  id: true,
                  epfNumber: true,
                  firstName: true,
                  lastName: true,
                  trade: true,
                  dayPay: true,
                  otPay: true,
                  weekendPay: true
                }
              }
            }
          }
        }
      });
    });
  }

  static async getAll(filters = {}) {
    const { jobId, startDate, endDate } = filters;
    
    const where = {};
    
    if (jobId) {
      where.jobId = Number(jobId);
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
    
    return prisma.dailyLaborCost.findMany({
      where,
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
        laborAssignments: {
          include: {
            labor: {
              select: {
                id: true,
                epfNumber: true,
                firstName: true,
                lastName: true,
                trade: true,
                dayPay: true,
                otPay: true,
                  weekendPay: true
              }
            }
          }
        }
      }
    });
  }

  static async getById(id) {
    return prisma.dailyLaborCost.findUnique({
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
        laborAssignments: {
          include: {
            labor: {
              select: {
                id: true,
                epfNumber: true,
                firstName: true,
                lastName: true,
                trade: true,
                dayPay: true,
                otPay: true,
                  weekendPay: true
              }
            }
          }
        }
      }
    });
  }

  static async delete(id) {
    // Use transaction to ensure both tables are updated correctly
    return prisma.$transaction(async (tx) => {
      // First, delete all related labor assignments
      await tx.dailyLaborAssignment.deleteMany({
        where: { dailyLaborCostId: Number(id) }
      });

      // Then delete the daily labor cost record
      return tx.dailyLaborCost.delete({
        where: { id: Number(id) }
      });
    });
  }

  static async getByJobId(jobId) {
    return prisma.dailyLaborCost.findMany({
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
        laborAssignments: {
          include: {
            labor: {
              select: {
                id: true,
                epfNumber: true,
                firstName: true,
                lastName: true,
                trade: true,
                dayPay: true,
                otPay: true,
                  weekendPay: true
              }
            }
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
    
    return prisma.dailyLaborCost.findMany({
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
        laborAssignments: {
          include: {
            labor: {
              select: {
                id: true,
                epfNumber: true,
                firstName: true,
                lastName: true,
                trade: true,
                dayPay: true,
                otPay: true,
                  weekendPay: true
              }
            }
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
    
    return prisma.dailyLaborCost.findMany({
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
        laborAssignments: {
          include: {
            labor: {
              select: {
                id: true,
                epfNumber: true,
                firstName: true,
                lastName: true,
                trade: true,
                dayPay: true,
                otPay: true,
                  weekendPay: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
  }
}

export default DailyLaborCostService;
