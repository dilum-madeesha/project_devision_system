import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MaterialOrderAssignmentService = {
  // Create multiple material order assignments in a transaction
  async createMultiple(materialOrderAssignments) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const createdAssignments = [];
        
        for (const assignment of materialOrderAssignments) {
          const createdAssignment = await tx.materialOrderAssignment.create({
            data: {
              materialOrderId: assignment.materialOrderId,
              materialId: assignment.materialId,
              quantity: assignment.quantity,
              unitPrice: assignment.unitPrice,
              totalPrice: assignment.totalPrice
            },
            include: {
              material: true,
              materialOrder: {
                include: {
                  job: true
                }
              }
            }
          });
          createdAssignments.push(createdAssignment);
        }
        
        return createdAssignments;
      });
      
      return result;
    } catch (error) {
      console.error('Error creating material order assignments:', error);
      throw error;
    }
  },

  // Get all assignments for a specific material order
  async getByMaterialOrderId(materialOrderId) {
    try {
      const assignments = await prisma.materialOrderAssignment.findMany({
        where: {
          materialOrderId: parseInt(materialOrderId)
        },
        include: {
          material: true,
          materialOrder: {
            include: {
              job: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      return assignments;
    } catch (error) {
      console.error('Error fetching material order assignments:', error);
      throw error;
    }
  },

  // Get all assignments for a specific job and date
  async getByJobAndDate(jobId, date) {
    try {
      const assignments = await prisma.materialOrderAssignment.findMany({
        where: {
          materialOrder: {
            jobId: parseInt(jobId),
            date: new Date(date)
          }
        },
        include: {
          material: true,
          materialOrder: {
            include: {
              job: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      return assignments;
    } catch (error) {
      console.error('Error fetching material order assignments by job and date:', error);
      throw error;
    }
  },

  // Get all assignments for a specific material
  async getByMaterialId(materialId) {
    try {
      const assignments = await prisma.materialOrderAssignment.findMany({
        where: {
          materialId: parseInt(materialId)
        },
        include: {
          material: true,
          materialOrder: {
            include: {
              job: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return assignments;
    } catch (error) {
      console.error('Error fetching material order assignments by material:', error);
      throw error;
    }
  },

  // Update an assignment
  async updateById(id, updateData) {
    try {
      const updatedAssignment = await prisma.materialOrderAssignment.update({
        where: {
          id: parseInt(id)
        },
        data: {
          quantity: updateData.quantity,
          unitPrice: updateData.unitPrice,
          totalPrice: updateData.totalPrice
        },
        include: {
          material: true,
          materialOrder: {
            include: {
              job: true
            }
          }
        }
      });
      
      return updatedAssignment;
    } catch (error) {
      console.error('Error updating material order assignment:', error);
      throw error;
    }
  },

  // Delete an assignment
  async deleteById(id) {
    try {
      const deletedAssignment = await prisma.materialOrderAssignment.delete({
        where: {
          id: parseInt(id)
        },
        include: {
          material: true,
          materialOrder: true
        }
      });
      
      return deletedAssignment;
    } catch (error) {
      console.error('Error deleting material order assignment:', error);
      throw error;
    }
  },

  // Get assignment by ID
  async getById(id) {
    try {
      const assignment = await prisma.materialOrderAssignment.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          material: true,
          materialOrder: {
            include: {
              job: true
            }
          }
        }
      });
      
      return assignment;
    } catch (error) {
      console.error('Error fetching material order assignment:', error);
      throw error;
    }
  },

  // Get summary statistics for a material order
  async getSummaryByMaterialOrderId(materialOrderId) {
    try {
      const assignments = await prisma.materialOrderAssignment.findMany({
        where: {
          materialOrderId: parseInt(materialOrderId)
        },
        include: {
          material: true
        }
      });

      const summary = {
        totalMaterials: assignments.length,
        totalQuantity: assignments.reduce((sum, assignment) => sum + assignment.quantity, 0),
        totalCost: assignments.reduce((sum, assignment) => sum + assignment.totalPrice, 0),
        materials: assignments.map(assignment => ({
          materialId: assignment.materialId,
          materialName: assignment.material.name,
          uom: assignment.material.uom,
          quantity: assignment.quantity,
          unitPrice: assignment.unitPrice,
          totalPrice: assignment.totalPrice
        }))
      };

      return summary;
    } catch (error) {
      console.error('Error generating material order assignment summary:', error);
      throw error;
    }
  }
};

export default MaterialOrderAssignmentService;
