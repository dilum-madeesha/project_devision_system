import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Image as ChakraImage,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalCloseButton,
  Button,
  useDisclosure,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Select,
  Input,
  AspectRatio,
  IconButton,
  Card,
  CardBody,
  Badge,
  useToast
} from '@chakra-ui/react';
import { FiX, FiDownload } from 'react-icons/fi';
import { projectAPI } from '../../../api/projects.js';
import { useAuth } from '../../../contexts/AuthContext.jsx';
import api from '../../../api/config.js';

const ProjectPictures = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectImages, setProjectImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const serverBaseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
  const isAdmin = user?.privilege === 1;

  const getImageSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${serverBaseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Fetch all projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch project images when a project is selected
  useEffect(() => {
    if (selectedProject) {
      fetchProjectImages(selectedProject);
    } else {
      setProjectImages([]);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      const projectsList = response.data?.projects || response.projects || [];
      setProjects(projectsList);
      
      // Auto-select first project if available
      if (projectsList.length > 0 && !selectedProject) {
        setSelectedProject(projectsList[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectImages = async (projectId) => {
    try {
      setLoading(true);
      const response = await projectAPI.getImages(projectId);
      const images = response.data || response || [];
      setProjectImages(images);
    } catch (error) {
      console.error('Error fetching images:', error);
      setProjectImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (e) => {
    const projectId = parseInt(e.target.value);
    setSelectedProject(projectId);
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
    onOpen();
  };

  const downloadImage = (image) => {
    const link = document.createElement('a');
    link.href = getImageSrc(image.url);
    if (image.originalName) link.download = image.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageUpload = async (e) => {
    if (!isAdmin || !selectedProject) return;

    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 10 - projectImages.length;
    if (remaining <= 0) {
      toast({
        title: 'Image limit reached',
        description: 'This project already has the maximum of 10 images.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      e.target.value = '';
      return;
    }

    let uploadFiles = files;
    if (files.length > remaining) {
      uploadFiles = files.slice(0, remaining);
      toast({
        title: 'Too many images selected',
        description: `Only ${remaining} image(s) can be uploaded.`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }

    const validFiles = [];
    uploadFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 10 * 1024 * 1024) return;
      validFiles.push(file);
    });

    if (validFiles.length === 0) {
      toast({
        title: 'No valid images',
        description: 'Please select image files up to 10 MB each.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      validFiles.forEach((file) => fd.append('images', file));
      await projectAPI.uploadImages(selectedProject, fd);
      await fetchProjectImages(selectedProject);
      toast({
        title: 'Images uploaded',
        description: `${validFiles.length} image(s) uploaded successfully.`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to upload images.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (image) => {
    if (!isAdmin || !selectedProject || !image?.filename) return;

    try {
      setDeletingFilename(image.filename);
      await projectAPI.deleteImage(selectedProject, image.filename);
      setProjectImages((prev) => prev.filter((img) => img.filename !== image.filename));
      if (selectedImage?.filename === image.filename) onClose();
      toast({
        title: 'Image deleted',
        description: 'Project image deleted successfully.',
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Delete failed',
        description: error.response?.data?.message || 'Failed to delete image.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeletingFilename(null);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProject);

  return (
    <Box p={6} bg={bg} borderRadius="lg">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Project Pictures Gallery</Heading>
          <Text color={textColor}>View and manage project images</Text>
        </Box>

        {/* Project Selector */}
        <Card bg={bg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Text fontWeight="bold" fontSize="sm">Select Project</Text>
              <Select
                placeholder="Choose a project..."
                value={selectedProject || ''}
                onChange={handleProjectChange}
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.projectId} - {project.projectName}
                  </option>
                ))}
              </Select>
              
              {currentProject && (
                <Box>
                  <Badge colorScheme={currentProject.status?.toLowerCase() === 'completed' ? 'green' : 'blue'}>
                    {currentProject.status}
                  </Badge>
                  <Text fontSize="sm" color={textColor} mt={2}>
                    {currentProject.description}
                  </Text>
                </Box>
              )}

              {isAdmin && selectedProject && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>Upload Images (Admin only)</Text>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    size="sm"
                    isDisabled={uploading}
                  />
                  <Text fontSize="xs" color={textColor} mt={1}>
                    Max 10 images per project. JPG, PNG, WebP. 10 MB each.
                  </Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Images Display */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <Spinner size="lg" color="blue.500" />
          </Box>
        ) : projectImages && projectImages.length > 0 ? (
          <Box>
            <HStack spacing={2} mb={4}>
              <Heading size="md">Images ({projectImages.length})</Heading>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {projectImages.map((image, index) => (
                <Box
                  key={index}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  overflow="hidden"
                  bg={bg}
                  _hover={{ shadow: 'lg' }}
                  cursor="pointer"
                  transition="all 0.2s"
                >
                  {/* Image Container */}
                  <AspectRatio ratio={4 / 3} onClick={() => openImageModal(image)}>
                    <ChakraImage
                      src={getImageSrc(image.url)}
                      alt={image.originalName || `Project image ${index}`}
                      objectFit="cover"
                    />
                  </AspectRatio>

                  {/* Image Info */}
                  <Box p={3} borderTopWidth="1px" borderColor={borderColor}>
                    <Text fontSize="xs" color={textColor} mb={1}>
                      {image.originalName}
                    </Text>
                    <Text fontSize="xs" color={textColor} mb={3}>
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </Text>
                    
                    {/* Action Buttons */}
                    <HStack spacing={2}>
                      <Button
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        leftIcon={<FiDownload />}
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image);
                        }}
                        flex={1}
                      >
                        Download
                      </Button>
                      {isAdmin && (
                        <IconButton
                          size="xs"
                          colorScheme="red"
                          aria-label="Delete image"
                          icon={<FiX />}
                          isLoading={deletingFilename === image.filename}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(image);
                          }}
                        />
                      )}
                    </HStack>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        ) : (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text>
              {selectedProject
                ? 'No pictures uploaded for this project yet.'
                : 'Please select a project to view pictures.'}
            </Text>
          </Alert>
        )}
      </VStack>

      {/* Image Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg={bg} maxH="90vh">
          <ModalHeader>
            {selectedImage?.originalName || 'Project Image'}
          </ModalHeader>
          <ModalCloseButton />
          
          <Box maxH="70vh" overflow="auto" px={6} py={4}>
            {selectedImage && (
              <Box>
                <ChakraImage
                  src={getImageSrc(selectedImage.url)}
                  alt={selectedImage.originalName}
                  maxW="100%"
                  h="auto"
                  borderRadius="md"
                  mb={4}
                />
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" color={textColor}>
                    <strong>Uploaded:</strong> {new Date(selectedImage.uploadedAt).toLocaleString()}
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    <strong>File:</strong> {selectedImage.originalName}
                  </Text>
                  <Text fontSize="sm" color={textColor}>
                    <strong>Size:</strong> {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </VStack>
              </Box>
            )}
          </Box>

          <ModalFooter>
            <HStack spacing={2}>
              {selectedImage && (
                <Button
                  colorScheme="blue"
                  leftIcon={<FiDownload />}
                  onClick={() => downloadImage(selectedImage)}
                >
                  Download
                </Button>
              )}
              {isAdmin && selectedImage && (
                <Button
                  colorScheme="red"
                  leftIcon={<FiX />}
                  isLoading={deletingFilename === selectedImage.filename}
                  onClick={() => handleDeleteImage(selectedImage)}
                >
                  Delete
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProjectPictures;
