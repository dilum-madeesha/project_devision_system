import prisma from '../config/database.js';

class ContractorService {
  // Create new contractor
  static async create(data) {
    // Check for unique registration number
    if (data.registrationNo) {
      const exists = await prisma.contractor.findUnique({
        where: { registrationNo: data.registrationNo }
      });
      if (exists) {
        throw new Error('Registration Number already exists');
      }
    }

    return prisma.contractor.create({ data });
  }

  // Update contractor
  static async update(id, data) {
    const existingContractor = await prisma.contractor.findUnique({
      where: { id: Number(id) }
    });

    if (!existingContractor) {
      throw new Error('Contractor not found');
    }

    // Check for unique registration number if changed
    if (data.registrationNo && data.registrationNo !== existingContractor.registrationNo) {
      const exists = await prisma.contractor.findFirst({
        where: { 
          registrationNo: data.registrationNo,
          NOT: { id: Number(id) }
        }
      });
      if (exists) {
        throw new Error('Registration Number already exists');
      }
    }

    return prisma.contractor.update({
      where: { id: Number(id) },
      data
    });
  }

  // Get all contractors
  static async getAll(params = {}) {
    const { limit = 100, offset = 0 } = params;
    return prisma.contractor.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get contractor by ID
  static async getById(id) {
    return prisma.contractor.findUnique({ where: { id: Number(id) } });
  }

  // Delete contractor
  static async delete(id) {
    const existingContractor = await prisma.contractor.findUnique({
      where: { id: Number(id) }
    });

    if (!existingContractor) {
      throw new Error('Contractor not found');
    }

    return prisma.contractor.delete({
      where: { id: Number(id) }
    });
  }
}

export default ContractorService;
