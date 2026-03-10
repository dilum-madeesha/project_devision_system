  import prisma from '../config/database.js';
  import { validateLabor } from '../utils/validators.js';

  class LaborService {
    static async register(data) {
      const validation = validateLabor(data, false);
      if (!validation.isValid) {
        throw new Error(JSON.stringify(validation.errors));
      }

      // Check for EPF number uniqueness
      const epfExists = await prisma.labor.findUnique({
        where: { epfNumber: data.epfNumber }
      });
      if (epfExists) {
        throw new Error('EPF Number already exists');
      }

      // Set weekend pay to dayPay if not provided
      if (data.weekendPay === undefined || data.weekendPay === null) {
        data.weekendPay = data.dayPay;
      }

      return prisma.labor.create({ data });
    }

    static async update(id, data) {
      const validation = validateLabor(data, true);
      if (!validation.isValid) {
        throw new Error(JSON.stringify(validation.errors));
      }

      // Check if labor exists
      const existingLabor = await prisma.labor.findUnique({
        where: { id: Number(id) }
      });

      if (!existingLabor) {
        throw new Error('Labor not found');
      }

      // Check for EPF number uniqueness if it's being changed
      if (data.epfNumber && data.epfNumber !== existingLabor.epfNumber) {
        const epfExists = await prisma.labor.findFirst({
          where: { 
            epfNumber: data.epfNumber,
            NOT: { id: Number(id) }
          }
        });
        if (epfExists) {
          throw new Error('EPF Number already exists');
        }
      }

      // Set weekend pay to dayPay if not provided
      if (data.weekendPay === undefined || data.weekendPay === null) {
        data.weekendPay = data.dayPay;
      }

      return prisma.labor.update({ where: { id: Number(id) }, data });
    }

    static async getAllLabors() {
      return prisma.labor.findMany();
    }

    static async getLaborById(id) {
      return prisma.labor.findUnique({ where: { id: Number(id) } });
    }

    static async deleteLabor(id) {
      // Check if labor exists
      const existingLabor = await prisma.labor.findUnique({
        where: { id: Number(id) },
      });

      if (!existingLabor) {
        throw new Error('Labor not found');
      }

      // Check if labor is used in any daily labor assignments
      const laborAssignments = await prisma.dailyLaborAssignment.findMany({
        where: { laborId: Number(id) },
        include: {
          dailyLaborCost: {
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

      if (laborAssignments.length > 0) {
        const usedInJobs = laborAssignments
          .map(assignment => `${assignment.dailyLaborCost.job.jobNumber} (${assignment.dailyLaborCost.job.title})`)
          .join(', ');
        
        throw new Error(
          `Cannot delete labor "${existingLabor.firstName} ${existingLabor.lastName}" (EPF: ${existingLabor.epfNumber}) because they are assigned to the following job(s): ${usedInJobs}. Please remove the labor assignments first.`
        );
      }

      return prisma.labor.delete({
        where: { id: Number(id) },
      });
    }
  }

  export default LaborService;
