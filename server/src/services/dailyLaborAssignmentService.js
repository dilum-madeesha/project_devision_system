import prisma from '../config/database.js';

class DailyLaborAssignmentService {
  // Get assignment by ID
  static async getById(id) {
    return prisma.dailyLaborAssignment.findUnique({
      where: { id: Number(id) },
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
        },
        dailyLaborCost: {
          select: {
            id: true,
            date: true,
            cost: true,
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true
              }
            }
          }
        }
      }
    });
  }

  // Update assignment by ID
  static async updateById(id, updateData) {
    // Calculate costs based on updated data
    const assignment = await prisma.dailyLaborAssignment.findUnique({
      where: { id: Number(id) },
      include: {
        labor: true,
        dailyLaborCost: true
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Calculate regular hours based on time in/out selection (same logic as AddLaborCost)
    let regularHours = 0;
    const timeIn = updateData.timeIn || assignment.timeIn;
    const timeOut = updateData.timeOut || assignment.timeOut;
    
    if (timeIn === "morning" && timeOut === "evening") {
      regularHours = 8; // Full day
    } else if (timeIn === "morning" && timeOut === "afternoon") {
      regularHours = 4; // Morning shift
    } else if (timeIn === "afternoon" && timeOut === "evening") {
      regularHours = 4; // Afternoon shift
    }

    // Calculate costs based on the time and hours
    const otHours = updateData.otHours || assignment.otHours;
    const regularCost = (regularHours / 8) * assignment.labor.dayPay;
    const otCost = otHours * assignment.labor.otPay;
    
    // Calculate weekend pay cost if applicable
    const hasWeekendPay = updateData.hasWeekendPay !== undefined ? updateData.hasWeekendPay : assignment.hasWeekendPay;
    let weekendPayCost = 0;
    
    if (hasWeekendPay && assignment.labor.weekendPay) {
      const assignmentDate = assignment.dailyLaborCost.date;
      const dayOfWeek = new Date(assignmentDate).getDay(); // 0 = Sunday, 6 = Saturday
      
      if (dayOfWeek === 6) { // Saturday - half weekend pay
        weekendPayCost = assignment.labor.weekendPay * 0.5;
      } else if (dayOfWeek === 0) { // Sunday - full weekend pay
        weekendPayCost = assignment.labor.weekendPay;
      }
    }
    
    const totalCost = regularCost + otCost + weekendPayCost;

    // Update the assignment (include regularHours in the update)
    const updatedAssignment = await prisma.dailyLaborAssignment.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        regularHours, // Set calculated regularHours
        regularCost,
        otCost,
        hasWeekendPay,
        weekendPayCost,
        totalCost
      },
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
        },
        dailyLaborCost: {
          select: {
            id: true,
            date: true,
            cost: true,
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true
              }
            }
          }
        }
      }
    });

    // Recalculate the total cost for the daily labor cost
    const allAssignments = await prisma.dailyLaborAssignment.findMany({
      where: { dailyLaborCostId: assignment.dailyLaborCostId }
    });

    // Only sum other assignments, then add the new value for the edited one
    const newTotalCost = allAssignments.reduce((sum, assign) => {
      if (assign.id === Number(id)) {
        return sum; // skip the old value for the edited assignment
      }
      return sum + assign.totalCost;
    }, 0) + totalCost;

    // Update the daily labor cost total
    await prisma.dailyLaborCost.update({
      where: { id: assignment.dailyLaborCostId },
      data: { cost: newTotalCost }
    });

    return updatedAssignment;
  }

  // Get all assignments for a specific daily labor cost
  static async getByDailyLaborCostId(dailyLaborCostId) {
    return prisma.dailyLaborAssignment.findMany({
      where: { dailyLaborCostId: Number(dailyLaborCostId) },
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
        },
        dailyLaborCost: {
          select: {
            id: true,
            date: true,
            cost: true,
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true
              }
            }
          }
        }
      }
    });
  }

  // Get all assignments for a specific labor
  static async getByLaborId(laborId) {
    return prisma.dailyLaborAssignment.findMany({
      where: { laborId: Number(laborId) },
      include: {
        dailyLaborCost: {
          select: {
            id: true,
            date: true,
            cost: true,
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true
              }
            }
          }
        },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  // Get assignments for a specific date range
  static async getByDateRange(startDate, endDate) {
    return prisma.dailyLaborAssignment.findMany({
      where: {
        dailyLaborCost: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      },
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
        },
        dailyLaborCost: {
          select: {
            id: true,
            date: true,
            cost: true,
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          dailyLaborCost: {
            date: 'desc'
          }
        },
        {
          labor: {
            firstName: 'asc'
          }
        }
      ]
    });
  }

  // Get labor assignments for a specific job
  static async getByJobId(jobId) {
    return prisma.dailyLaborAssignment.findMany({
      where: {
        dailyLaborCost: {
          jobId: Number(jobId)
        }
      },
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
        },
        dailyLaborCost: {
          select: {
            id: true,
            date: true,
            cost: true,
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        {
          dailyLaborCost: {
            date: 'desc'
          }
        },
        {
          labor: {
            firstName: 'asc'
          }
        }
      ]
    });
  }

  // Get labor work summary for reporting
  static async getLaborWorkSummary(laborId, startDate, endDate) {
    const assignments = await prisma.dailyLaborAssignment.findMany({
      where: {
        laborId: Number(laborId),
        dailyLaborCost: {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      },
      include: {
        dailyLaborCost: {
          select: {
            id: true,
            date: true,
            job: {
              select: {
                id: true,
                jobNumber: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        dailyLaborCost: {
          date: 'desc'
        }
      }
    });

    // Calculate summary statistics
    const summary = {
      totalDaysWorked: assignments.length,
      totalRegularHours: assignments.reduce((sum, a) => sum + a.regularHours, 0),
      totalOtHours: assignments.reduce((sum, a) => sum + a.otHours, 0),
      totalRegularCost: assignments.reduce((sum, a) => sum + a.regularCost, 0),
      totalOtCost: assignments.reduce((sum, a) => sum + a.otCost, 0),
      totalCost: assignments.reduce((sum, a) => sum + a.totalCost, 0),
      assignments: assignments
    };

    return summary;
  }
}

export default DailyLaborAssignmentService;
