import prisma from '../config/database.js';

class AgreementService {
  // Create new agreement
  static async register(data) {
    // Transform data
    const transformedData = {
      agreementNo: data.agreementNo,
      agreementID: data.agreementID || null,
      projectName: data.projectName,
      agreementSum: parseFloat(data.agreementSum) || 0,
      vat: data.vat ? parseFloat(data.vat) : 0,
      periodDays: data.periodDays ? parseInt(data.periodDays) : null,
      awardDate: data.awardDate ? new Date(data.awardDate) : null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      completionDate: data.completionDate ? new Date(data.completionDate) : null,
      status: data.status || 'ACTIVE',
      description: data.description || null,
      createdById: data.createdById || null,
    };

    // Check for unique agreement number
    if (transformedData.agreementNo) {
      const exists = await prisma.agreement.findUnique({
        where: { agreementNo: transformedData.agreementNo }
      });
      if (exists) {
        throw new Error('Agreement Number already exists');
      }
    }

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
      ...(data.agreementNo && { agreementNo: data.agreementNo }),
      ...(data.agreementID && { agreementID: data.agreementID }),
      ...(data.projectName && { projectName: data.projectName }),
      ...(data.agreementSum !== undefined && { agreementSum: parseFloat(data.agreementSum) || 0 }),
      ...(data.vat !== undefined && { vat: parseFloat(data.vat) || 0 }),
      ...(data.periodDays !== undefined && { periodDays: data.periodDays ? parseInt(data.periodDays) : null }),
      ...(data.awardDate && { awardDate: new Date(data.awardDate) }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.completionDate && { completionDate: new Date(data.completionDate) }),
      ...(data.status && { status: data.status }),
      ...(data.description !== undefined && { description: data.description || null }),
    };

    // Check for unique agreement number if changed
    if (transformedData.agreementNo && transformedData.agreementNo !== existingAgreement.agreementNo) {
      const exists = await prisma.agreement.findFirst({
        where: { 
          agreementNo: transformedData.agreementNo,
          NOT: { id: Number(id) }
        }
      });
      if (exists) {
        throw new Error('Agreement Number already exists');
      }
    }

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
        `Cannot delete agreement "${existingAgreement.agreementNo}" because it is linked to the following project(s): ${projectNames}. Please remove or reassign these projects first.`
      );
    }

    return prisma.agreement.delete({
      where: { id: Number(id) }
    });
  }
}

export default AgreementService;
