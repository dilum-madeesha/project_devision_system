import prisma from '../config/database.js';

class AgreementService {
  // Create new agreement
  static async register(data) {
    // Transform data
    const transformedData = {
      agreementID: data.agreementID || null,
      agreementSum: parseFloat(data.agreementSum) || 0,
      vat: data.vat ? parseFloat(data.vat) : 0,
      periodDays: data.periodDays ? parseInt(data.periodDays) : null,
      awardDate: data.awardDate ? new Date(data.awardDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      status: data.status || 'ACTIVE',
      description: data.description || null,
      createdById: data.createdById || null,
    };

    // Check for unique agreement ID if provided
    if (transformedData.agreementID) {
      const existsId = await prisma.agreement.findUnique({
        where: { agreementID: transformedData.agreementID }
      });
      if (existsId) {
        throw new Error('Agreement ID already exists');
      }
    }

    return prisma.agreement.create({ data: transformedData });
  }

  // Update agreement
  static async update(id, data) {
    const existingAgreement = await prisma.agreement.findUnique({
      where: { id: Number(id) }
    });

    if (!existingAgreement) {
      throw new Error('Agreement not found');
    }

    // Transform data
    const transformedData = {
      ...(data.agreementID && { agreementID: data.agreementID }),
      ...(data.agreementSum !== undefined && { agreementSum: parseFloat(data.agreementSum) || 0 }),
      ...(data.vat !== undefined && { vat: parseFloat(data.vat) || 0 }),
      ...(data.periodDays !== undefined && { periodDays: data.periodDays ? parseInt(data.periodDays) : null }),
      ...(data.awardDate && { awardDate: new Date(data.awardDate) }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.status && { status: data.status }),
      ...(data.description !== undefined && { description: data.description || null }),
    };

    // Check for unique agreement ID if changed
    if (transformedData.agreementID && transformedData.agreementID !== existingAgreement.agreementID) {
      const existsId = await prisma.agreement.findFirst({
        where: { 
          agreementID: transformedData.agreementID,
          NOT: { id: Number(id) }
        }
      });
      if (existsId) {
        throw new Error('Agreement ID already exists');
      }
    }

    return prisma.agreement.update({
      where: { id: Number(id) },
      data: transformedData
    });
  }

  // Get all agreements
  static async getAllAgreements() {
    return prisma.agreement.findMany({
      include: {
        projects: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get agreement by ID
  static async getAgreementById(id) {
    return prisma.agreement.findUnique({ 
      where: { id: Number(id) },
      include: {
        projects: true
      }
    });
  }

  // Delete agreement
  static async deleteAgreement(id) {
    const existingAgreement = await prisma.agreement.findUnique({
      where: { id: Number(id) }
    });

    if (!existingAgreement) {
      throw new Error('Agreement not found');
    }

    // Check if agreement is used in any project
    const linkedProjects = await prisma.project.findMany({
      where: { agreementId: Number(id) }
    });

    if (linkedProjects.length > 0) {
      const projectNames = linkedProjects.map(p => p.projectName).join(', ');
      throw new Error(
        `Cannot delete agreement "${existingAgreement.agreementID || existingAgreement.id}" because it is linked to the following project(s): ${projectNames}. Please remove or reassign these projects first.`
      );
    }

    return prisma.agreement.delete({
      where: { id: Number(id) }
    });
  }
}

export default AgreementService;
