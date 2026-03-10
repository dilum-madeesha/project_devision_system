import prisma from '../config/database.js';
import { validateMaterial } from '../utils/validators.js';

class MaterialService {
  static async createMaterial(data, userId) {
    const validation = validateMaterial(data);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Convert unitPrice to float and default to 0 when not provided
    const parsedPrice = parseFloat(data.unitPrice);
    const materialData = {
      ...data,
      unitPrice: isNaN(parsedPrice) ? 0 : parsedPrice,
      createdById: userId,
      updatedById: userId,
    }; 

    return prisma.material.create({
      data: materialData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  static async updateMaterial(id, data, userId) {
    const validation = validateMaterial(data);
    if (!validation.isValid) {
      throw new Error(JSON.stringify(validation.errors));
    }

    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMaterial) {
      throw new Error('Material not found');
    }

    // Convert unitPrice to float and default to 0 when not provided
    const parsedPrice = parseFloat(data.unitPrice);
    const materialData = {
      ...data,
      unitPrice: isNaN(parsedPrice) ? 0 : parsedPrice,
      updatedById: userId,
    };

    return prisma.material.update({
      where: { id: Number(id) },
      data: materialData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  static async getAllMaterials(filters = {}) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where = {};

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { uom: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
      }),
      prisma.material.count({ where }),
    ]);

    return {
      materials,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getMaterialById(id) {
    const material = await prisma.material.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    if (!material) {
      throw new Error('Material not found');
    }

    return material;
  }

  static async deleteMaterial(id) {
    // Check if material exists
    const existingMaterial = await prisma.material.findUnique({
      where: { id: Number(id) },
    });

    if (!existingMaterial) {
      throw new Error('Material not found');
    }

    // Check if material is used in any material order assignments
    const materialAssignments = await prisma.materialOrderAssignment.findMany({
      where: { materialId: Number(id) },
      include: {
        materialOrder: {
          include: {
            job: {
              select: {
                jobNumber: true,
                title: true
              }
            }
          }
        }
      }
    });

    if (materialAssignments.length > 0) {
      const usedInJobs = materialAssignments
        .map(assignment => `${assignment.materialOrder.job.jobNumber} (${assignment.materialOrder.job.title})`)
        .join(', ');
      
      throw new Error(
        `Cannot delete material "${existingMaterial.name}" because it is being used in the following job(s): ${usedInJobs}. Please remove the material from these orders first.`
      );
    }

    return prisma.material.delete({
      where: { id: Number(id) },
    });
  }

  static async searchMaterials(searchTerm) {
    return prisma.material.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 10, // Limit to 10 results for search suggestions
      orderBy: { name: 'asc' },
    });
  }

  static async bulkCreateMaterials(materials) {
    try {
      // Use transaction to ensure all materials are created or none
      const result = await prisma.$transaction(async (prisma) => {
        const createdMaterials = await prisma.material.createMany({
          data: materials,
          skipDuplicates: true, // Skip materials that already exist
        });

        // Get the created materials with their full data
        const materialNames = materials.map(m => m.name);
        const fullMaterials = await prisma.material.findMany({
          where: {
            name: { in: materialNames },
          },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          count: createdMaterials.count,
          materials: fullMaterials,
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
}

export default MaterialService;
