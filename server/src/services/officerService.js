import prisma from '../config/database.js';

class OfficerService {
  // Create new officer
  static async create(data) {
    // Check for unique email
    if (data.email) {
      const exists = await prisma.officer.findUnique({
        where: { email: data.email }
      });
      if (exists) {
        throw new Error('Email already exists');
      }
    }
    // Check for unique officer number
    if (data.officerNo) {
      const existsNo = await prisma.officer.findUnique({
        where: { officerNo: data.officerNo }
      });
      if (existsNo) {
        throw new Error('Officer number already exists');
      }
    }

    return prisma.officer.create({ data });
  }

  // Update officer
  static async update(id, data) {
    const existingOfficer = await prisma.officer.findUnique({
      where: { id: Number(id) }
    });

    if (!existingOfficer) {
      throw new Error('Officer not found');
    }

    // Check for unique email if changed
    if (data.email && data.email !== existingOfficer.email) {
      const exists = await prisma.officer.findFirst({
        where: { 
          email: data.email,
          NOT: { id: Number(id) }
        }
      });
      if (exists) {
        throw new Error('Email already exists');
      }
    }
    // Check for unique officer number if changed
    if (data.officerNo && data.officerNo !== existingOfficer.officerNo) {
      const existsNo = await prisma.officer.findFirst({
        where: {
          officerNo: data.officerNo,
          NOT: { id: Number(id) }
        }
      });
      if (existsNo) {
        throw new Error('Officer number already exists');
      }
    }

    return prisma.officer.update({
      where: { id: Number(id) },
      data
    });
  }

  // Get all officers
  static async getAll(params = {}) {
    const { limit = 100, offset = 0 } = params;
    return prisma.officer.findMany({
      take: limit,
      skip: offset,
      include: {
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                projectName: true,
                contractor: {
                  select: {
                    id: true,
                    companyName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get officer by ID
  static async getById(id) {
    return prisma.officer.findUnique({
      where: { id: Number(id) },
      include: {
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                projectName: true,
                contractor: {
                  select: {
                    id: true,
                    companyName: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  // Delete officer
  static async delete(id) {
    const existingOfficer = await prisma.officer.findUnique({
      where: { id: Number(id) }
    });

    if (!existingOfficer) {
      throw new Error('Officer not found');
    }

    return prisma.officer.delete({
      where: { id: Number(id) }
    });
  }
}

export default OfficerService;
