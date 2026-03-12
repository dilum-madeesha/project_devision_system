import prisma from '../config/database.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinary from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectService {
  // Create new project
  static async create(data) {
    const { officerAssignments, ...projectData } = data;

    // Check for unique project ID
    if (projectData.projectId) {
      const exists = await prisma.project.findUnique({
        where: { projectId: projectData.projectId }
      });
      if (exists) {
        throw new Error('Project ID already exists');
      }
    }

    // separate foreign key ids and build connect objects
    const {
      agreementId,
      contractorId,
      ...rest
    } = projectData;

    const relationConnects = {
      ...(agreementId != null && { agreement: { connect: { id: Number(agreementId) } } }),
      ...(contractorId != null && { contractor: { connect: { id: Number(contractorId) } } }),
    };

    // Create project with officer assignments
    return prisma.project.create({
      data: {
        ...rest,
        ...relationConnects,
        officerAssignments: officerAssignments ? {
          create: officerAssignments.map(assignment => ({
            officerId: assignment.officerId,
            role: assignment.role
          }))
        } : undefined
      },
      include: {
        agreement: true,
        contractor: true,
        officerAssignments: {
          include: {
            officer: true
          }
        }
      }
    });
  }

  // Update project
  static async update(id, data) {
    const { officerAssignments, ...projectData } = data;

    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) }
    });

    if (!existingProject) {
      throw new Error('Project not found');
    }

    // Check for unique project ID if changed
    if (projectData.projectId && projectData.projectId !== existingProject.projectId) {
      const exists = await prisma.project.findFirst({
        where: { 
          projectId: projectData.projectId,
          NOT: { id: Number(id) }
        }
      });
      if (exists) {
        throw new Error('Project ID already exists');
      }
    }

    // Update project and officer assignments in a transaction
    return prisma.$transaction(async (tx) => {
      // Delete existing officer assignments if new ones are provided
      if (officerAssignments) {
        await tx.projectOfficer.deleteMany({
          where: { projectId: Number(id) }
        });
      }

      // Update project with new officer assignments
      return tx.project.update({
        where: { id: Number(id) },
        data: (() => {
          // break out relation ids again for update
          const {
            agreementId,
            contractorId,
            ...restUpdate
          } = projectData;

          const updateData = {
            ...restUpdate,
            officerAssignments: officerAssignments ? {
              create: officerAssignments.map(assignment => ({
                officerId: assignment.officerId,
                role: assignment.role
              }))
            } : undefined
          };

          if (agreementId != null) {
            updateData.agreement = { connect: { id: Number(agreementId) } };
          }
          if (contractorId != null) {
            updateData.contractor = { connect: { id: Number(contractorId) } };
          }

          return updateData;
        })(),
        include: {
          agreement: true,
          contractor: true,
          officerAssignments: {
            include: {
              officer: true
            }
          }
        }
      });
    });
  }

  // Get all projects
  static async getAll(params = {}) {
    const { limit = 100, offset = 0, status } = params;
    
    const where = status ? { status } : {};
    
    return prisma.project.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        agreement: true,
        contractor: true,
        officerAssignments: {
          include: {
            officer: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Get project by ID
  static async getById(id) {
    return prisma.project.findUnique({ 
      where: { id: Number(id) },
      include: {
        agreement: true,
        contractor: true,
        officerAssignments: {
          include: {
            officer: true
          }
        }
      }
    });
  }

  // Delete project
  static async delete(id) {
    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) }
    });

    if (!existingProject) {
      throw new Error('Project not found');
    }

    // Delete project (officer assignments will cascade delete)
    return prisma.project.delete({
      where: { id: Number(id) }
    });
  }

  // Update project completed percentage
  static async updateProgress(id, completedPercent) {
    const existingProject = await prisma.project.findUnique({
      where: { id: Number(id) }
    });

    if (!existingProject) {
      throw new Error('Project not found');
    }

    return prisma.project.update({
      where: { id: Number(id) },
      data: { completedPercent: Math.min(100, Math.max(0, completedPercent)) }
    });
  }

  // Get projects by status
  static async getByStatus(status) {
    return prisma.project.findMany({
      where: { status },
      include: {
        agreement: true,
        contractor: true,
        officerAssignments: {
          include: {
            officer: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Assign officer to project
  static async assignOfficer(projectId, officerId, role) {
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const officer = await prisma.officer.findUnique({
      where: { id: Number(officerId) }
    });

    if (!officer) {
      throw new Error('Officer not found');
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.projectOfficer.findFirst({
      where: {
        projectId: Number(projectId),
        officerId: Number(officerId),
        role
      }
    });

    if (existingAssignment) {
      throw new Error('Officer already assigned to this project with this role');
    }

    return prisma.projectOfficer.create({
      data: {
        projectId: Number(projectId),
        officerId: Number(officerId),
        role
      },
      include: {
        officer: true
      }
    });
  }

  // Remove officer from project
  static async removeOfficer(projectId, officerId, role) {
    const assignment = await prisma.projectOfficer.findFirst({
      where: {
        projectId: Number(projectId),
        officerId: Number(officerId),
        role
      }
    });

    if (!assignment) {
      throw new Error('Officer assignment not found');
    }

    return prisma.projectOfficer.delete({
      where: { id: assignment.id }
    });
  }

  // Upload project images
  static async uploadImages(projectId, files) {
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const usingCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    try {
      console.log(`[uploadImages] Starting upload for project ${projectId}`);
      console.log(`[uploadImages] Using Cloudinary: ${usingCloudinary}`);
      console.log(`[uploadImages] Number of files: ${files.length}`);

      const newImages = [];

      // Helper function to handle Cloudinary upload_stream correctly
      const streamUpload = (file, uploadOptions) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (result) {
                console.log(`[streamUpload] Success: ${result.public_id}`);
                resolve(result);
              } else {
                console.error(`[streamUpload] Error: ${error.message}`);
                reject(error);
              }
            }
          );
          stream.end(file.buffer);
        });
      };

      for (const file of files) {
        console.log(`[uploadImages] Processing file: ${file.originalname}`);
        let record;

        if (usingCloudinary) {
          // upload file.buffer (multer memoryStorage) or file.path if disk
          const uploadOptions = {
            folder: `projects/${projectId}`,
            resource_type: 'image'
          };

          let data;
          if (file.buffer) {
            console.log(`[uploadImages] Using buffer upload for ${file.originalname}`);
            data = await streamUpload(file, uploadOptions);
          } else {
            console.log(`[uploadImages] Using path upload for ${file.originalname}`);
            data = await cloudinary.uploader.upload(file.path, uploadOptions);
          }

          // If disk storage and local file exists, remove it
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`[uploadImages] Deleted local file: ${file.path}`);
          }

          record = {
            url: data.secure_url,
            filename: data.public_id,
            uploadedAt: new Date().toISOString(),
            originalName: file.originalname,
            size: file.size,
            publicId: data.public_id
          };

          console.log(`[uploadImages] Cloudinary record: `, record);
        } else {
          // local storage (disk)
          record = {
            url: `/uploads/project-images/${projectId}/${file.filename}`,
            filename: file.filename,
            uploadedAt: new Date().toISOString(),
            originalName: file.originalname,
            size: file.size
          };

          console.log(`[uploadImages] Local record: `, record);
        }

        newImages.push(record);
      }

      console.log(`[uploadImages] All images uploaded:`, newImages);

      const existingImages = project.projectImages || [];
      const allImages = [...existingImages, ...newImages];

      await prisma.project.update({
        where: { id: Number(projectId) },
        data: { projectImages: allImages }
      });

      console.log(`[uploadImages] Database updated. Total images: ${allImages.length}`);
      return newImages;
    } catch (error) {
      console.error(`[uploadImages] Error: ${error.message}`, error);
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  // Get project images
  static async getImages(projectId) {
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project.projectImages || [];
  }

  // Delete project image
  static async deleteImage(projectId, imageFilename) {
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const images = project.projectImages || [];
    const imageToDelete = images.find(img => img.filename === imageFilename);

    if (!imageToDelete) {
      throw new Error('Image not found');
    }

    const usingCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (usingCloudinary && imageToDelete.publicId) {
      try {
        await cloudinary.uploader.destroy(imageToDelete.publicId);
      } catch (err) {
        console.error('Cloudinary deletion error:', err);
      }
    } else {
      // delete local file
      try {
        const uploadsDir = path.join(__dirname, '../../uploads/project-images', projectId.toString());
        const filePath = path.join(uploadsDir, imageFilename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        if (fs.existsSync(uploadsDir) && fs.readdirSync(uploadsDir).length === 0) {
          fs.rmdirSync(uploadsDir);
        }
      } catch (error) {
        console.error('Error deleting local image file:', error);
      }
    }

    const updatedImages = images.filter(img => img.filename !== imageFilename);

    return prisma.project.update({
      where: { id: Number(projectId) },
      data: {
        projectImages: updatedImages.length > 0 ? updatedImages : null
      }
    });
  }
}

export default ProjectService;
