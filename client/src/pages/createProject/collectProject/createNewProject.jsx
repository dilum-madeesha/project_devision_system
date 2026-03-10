import {
  Container,
  VStack,
  Heading,
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  HStack,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Text,
  Checkbox,
  Flex,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Grid,
  GridItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Radio,
  Spinner,
  SimpleGrid,
  Image as ChakraImage,
  IconButton,
  AspectRatio
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { agreementAPI } from "../../../api/agreements.js";
import { contractorAPI } from "../../../api/contractors.js";
import { officerAPI } from "../../../api/officers.js";
import { projectAPI } from "../../../api/projects.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";

import { FiUser, FiCalendar, FiCheckSquare, FiX, FiCamera } from "react-icons/fi";

const activities = [
  { id: 1, icon: "📦", action: "Planning & Feasibility", other: "Identify the need, Budget estimation, Site selection, Feasibility study, Initial drawings & concept design." },
  { id: 2, icon: "✅", action: "Design & Documentation", other: "Architectural design, Structural design, Electrical & plumbing design, BOQ, Authority approvals." },
  { id: 3, icon: "👤", action: "Tendering & Contracting", other: "Prepare tender documents, Invite contractors, Evaluate bids, Select contractor, Sign contract agreement." },
  { id: 4, icon: "💬", action: "Construction", other: "Foundation work, Superstructure, Roofing, Electrical & plumbing, Finishing." },
  { id: 5, icon: "📊", action: "Monitoring & Quality Control", other: "Site supervision, Quality checks, Safety, Progress & cost control." },
  { id: 6, icon: "📊", action: "Testing & Commissioning", other: "Electrical testing, Plumbing pressure testing, Final inspections." },
  { id: 7, icon: "📊", action: "Handover & Completion", other: "Snag list, Client handover, Occupancy certificate, Final payment." },
  { id: 8, icon: "📊", action: "Maintenance", other: "Defect liability period, Repairs, Regular maintenance." },
];

export default function ProjectSetup() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: projectId } = useParams(); // Get project ID from URL params
  const isEditMode = !!projectId;
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const pageBg = useColorModeValue("gray.50", "gray.900");

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [formData, setFormData] = useState({
    projectId: "",
    projectName: "",
    status: "PLANNING",
    description: "",
    startDate: "",
    endDate: "",
    agreementId: "",
    contractorId: "",
    engineerId: "",
    technicalOfficerId: "",
    secretaryId: ""
  });

  const [agreements, setAgreements] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [officers, setOfficers] = useState([]);

  // Filter officers by designation
  const engineers = officers.filter(o =>
    o.designation === 'Engineer' ||
    o.designation?.toLowerCase() === 'engineer'
  );
  const technicalOfficers = officers.filter(o =>
    o.designation === 'Technical Officer' ||
    o.designation?.toLowerCase() === 'technical officer'
  );
  const secretaries = officers.filter(o =>
    o.designation === 'Secretary' ||
    o.designation?.toLowerCase() === 'secretary'
  );

  // Load data from APIs
  useEffect(() => {
    fetchInitialData();
    if (isEditMode && projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      const response = await projectAPI.getById(projectId);
      const project = response?.data || response;

      setFormData({
        projectId: project.projectId || "",
        projectName: project.projectName || "",
        status: project.status || "PLANNING",
        description: project.description || "",
        startDate: project.startDate ? project.startDate.split('T')[0] : "",
        endDate: project.endDate ? project.endDate.split('T')[0] : "",
        agreementId: project.agreementId || "",
        contractorId: project.contractorId || "",
        engineerId: project.officerAssignments?.find(a => a.role === 'ENGINEER')?.officerId || "",
        technicalOfficerId: project.officerAssignments?.find(a => a.role === 'TECHNICAL_OFFICER')?.officerId || "",
        secretaryId: project.officerAssignments?.find(a => a.role === 'SECRETARY')?.officerId || ""
      });

      // Set selected activities based on completedPercent
      const activitiesCount = Math.round((project.completedPercent || 0) / (100 / activities.length));
      setSelectedActivities(Array.from({ length: activitiesCount }, (_, i) => i + 1));
    } catch (err) {
      console.error("Error loading project:", err);
      toast({
        title: "Error",
        description: "Failed to load project data",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [agreementsRes, contractorsRes, officersRes] = await Promise.all([
        agreementAPI.getAll(),
        contractorAPI.getAll(),
        officerAPI.getAll()
      ]);

      // Handle agreements response
      let agreementsList = [];
      if (agreementsRes?.data && Array.isArray(agreementsRes.data)) {
        agreementsList = agreementsRes.data;
      } else if (Array.isArray(agreementsRes)) {
        agreementsList = agreementsRes;
      }
      // Filter only active agreements
      setAgreements(agreementsList.filter(a => a.status === 'ACTIVE' || a.status === 'PENDING'));

      // Handle contractors response
      let contractorsList = [];
      if (contractorsRes?.data?.contractors && Array.isArray(contractorsRes.data.contractors)) {
        contractorsList = contractorsRes.data.contractors;
      } else if (contractorsRes?.data && Array.isArray(contractorsRes.data)) {
        contractorsList = contractorsRes.data;
      } else if (Array.isArray(contractorsRes)) {
        contractorsList = contractorsRes;
      }
      // Filter only active contractors
      setContractors(contractorsList.filter(c => c.isActive !== false));

      // Handle officers response
      let officersList = [];
      if (officersRes?.data?.officers && Array.isArray(officersRes.data.officers)) {
        officersList = officersRes.data.officers;
      } else if (officersRes?.data && Array.isArray(officersRes.data)) {
        officersList = officersRes.data;
      } else if (Array.isArray(officersRes)) {
        officersList = officersRes;
      }
      // Filter only active officers
      setOfficers(officersList.filter(o => o.status !== false));

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCheckboxChange = (id) => {
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e) => {
    let files = Array.from(e.target.files);

    // enforce max 10 images overall (multer limit)
    const remaining = 10 - selectedImages.length;
    if (files.length > remaining) {
      toast({
        title: 'Too many images',
        description: `You can only upload ${remaining} more file(s).`,
        status: 'warning',
        duration: 3000,
        isClosable: true
      });
      files = files.slice(0, remaining);
    }

    // filter to images and enforce 10MB limit (same as server)
    const validFiles = [];
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image and will be skipped.`,
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
      } else if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit and will be skipped.`,
          status: 'warning',
          duration: 3000,
          isClosable: true
        });
      } else {
        validFiles.push(file);
      }
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews for valid files
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.projectId || !formData.projectName) {
      setError("Project ID and Name are required");
      return;
    }

    setLoading(true);

    try {
      // Build officer assignments array
      const officerAssignments = [];
      if (formData.engineerId) {
        officerAssignments.push({ officerId: parseInt(formData.engineerId), role: 'ENGINEER' });
      }
      if (formData.technicalOfficerId) {
        officerAssignments.push({ officerId: parseInt(formData.technicalOfficerId), role: 'TECHNICAL_OFFICER' });
      }
      if (formData.secretaryId) {
        officerAssignments.push({ officerId: parseInt(formData.secretaryId), role: 'SECRETARY' });
      }

      const submitData = {
        projectId: formData.projectId,
        projectName: formData.projectName,
        description: formData.description || `Activities: ${selectedActivities.map(id => activities.find(a => a.id === id)?.action).join(', ')}`,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        agreementId: formData.agreementId || null,
        contractorId: formData.contractorId || null,
        createdById: user?.id || null,
        completedPercent: Math.round((selectedActivities.length / activities.length) * 100),
        officerAssignments
      };

      if (isEditMode) {
        // Update existing project
        await projectAPI.update(projectId, submitData);

        toast({
          title: "Project Updated",
          description: "Project and activities updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true
        });
      } else {
        // Create new project
        const createResponse = await projectAPI.create(submitData);
        const newProjectId = createResponse.data?.id || createResponse?.id;

        // Upload images if any selected
        if (selectedImages.length > 0 && newProjectId) {
          try {
            const formData = new FormData();
            selectedImages.forEach((file) => {
              formData.append('images', file);
            });

            await projectAPI.uploadImages(newProjectId, formData);
          } catch (imgErr) {
            console.error("Image upload error:", imgErr.response?.data || imgErr.message);
            // if server returned detailed message, include it in toast
            let msg = "Project created but some images failed to upload";
            if (imgErr.response?.data?.message) {
              msg += `: ${imgErr.response.data.message}`;
            }
            toast({
              title: "Warning",
              description: msg,
              status: "warning",
              duration: 4000,
              isClosable: true
            });
          }
        }

        toast({
          title: "Project Created",
          description: "Project and activities saved successfully",
          status: "success",
          duration: 3000,
          isClosable: true
        });
      }

      navigate("/createproject/collectProject/list");
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box h="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading data...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box h="100vh" bg={pageBg}>
      <Container maxW="1200px" py={6}>
        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">

            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbLink as={Link} to="/createProject">Project</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink fontWeight="bold">{isEditMode ? "Edit Project" : "Create Project"}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            {error && (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {/* Project Details */}
            <Card bg={bg} shadow="md">
              <CardHeader borderBottom="1px" borderColor={borderColor} bg={headerBg}>
                <Flex align="center">
                  <FiCalendar />
                  <Heading size="md" ml={2}>Project Details</Heading>
                </Flex>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel htmlFor="projectId">Project ID</FormLabel>
                      <Input
                        id="projectId"
                        name="projectId"
                        value={formData.projectId}
                        onChange={handleChange}
                        placeholder="e.g., PRJ-001"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel htmlFor="projectName">Project Name</FormLabel>
                      <Input
                        id="projectName"
                        name="projectName"
                        value={formData.projectName}
                        onChange={handleChange}
                        placeholder="Enter project name"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel htmlFor="status">Status</FormLabel>
                      <Select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="PLANNING">Planning</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="ON_HOLD">On Hold</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel htmlFor="description">Description</FormLabel>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Enter description"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel htmlFor="startDate">Start Date</FormLabel>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel htmlFor="endDate">End Date</FormLabel>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        value={formData.endDate}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>

            {/* Activities */}
            <Card shadow="md">
              <CardHeader borderBottom="1px" borderColor={borderColor}>
                <Flex align="center">
                  <FiCheckSquare />
                  <Heading size="md" ml={2}>Project Activities</Heading>
                  <Badge ml={4} colorScheme="blue">{selectedActivities.length} selected</Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <Grid templateColumns="1fr" gap={4}>
                  {activities.map(activity => (
                    <GridItem key={activity.id}>
                      <Flex gap={3} align="flex-start">
                        <Checkbox
                          isChecked={selectedActivities.includes(activity.id)}
                          onChange={() => handleCheckboxChange(activity.id)}
                        />
                        <Box>
                          <Text fontWeight="bold">{activity.icon} {activity.action}</Text>
                          <Text fontSize="sm" color="gray.500">{activity.other}</Text>
                        </Box>
                      </Flex>
                    </GridItem>
                  ))}
                </Grid>
              </CardBody>
            </Card>

            {/* Agreement */}
            <Card shadow="md">
              <CardHeader borderBottom="1px" borderColor={borderColor}>
                <Flex align="center">
                  <FiCheckSquare />
                  <Heading size="md" ml={2}>Select Agreement</Heading>
                  {formData.agreementId && <Badge ml={4} colorScheme="green">Selected</Badge>}
                </Flex>
              </CardHeader>
              <CardBody>
                <Grid templateColumns="1fr" gap={4}>
                  {agreements.map((agreement) => (
                    <GridItem key={agreement.id}>
                      <Flex gap={3} align="flex-start">
                        <Radio
                          name="agreementId"
                          value={agreement.id}
                          isChecked={formData.agreementId === agreement.id}
                          onChange={() => setFormData(prev => ({ ...prev, agreementId: agreement.id }))}
                        />
                        <Box>
                          <Text fontWeight="bold">
                            {agreement.agreementNo} - {agreement.projectName} | Sum: Rs.{agreement.agreementSum?.toLocaleString()}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Period: {agreement.periodDays} days | Start: {agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : 'N/A'} | End: {agreement.completionDate ? new Date(agreement.completionDate).toLocaleDateString() : 'N/A'}
                          </Text>
                          <Badge colorScheme={agreement.status === "ACTIVE" ? "green" : agreement.status === "PENDING" ? "yellow" : "red"}>{agreement.status}</Badge>
                        </Box>
                      </Flex>
                    </GridItem>
                  ))}
                </Grid>
              </CardBody>
            </Card>

            {/* Contractor */}
            <Card shadow="md">
              <CardHeader borderBottom="1px" borderColor={borderColor}>
                <Flex align="center">
                  <FiUser />
                  <Heading size="md" ml={2}>Select Contractor</Heading>
                  {formData.contractorId && <Badge ml={4} colorScheme="green">Selected</Badge>}
                </Flex>
              </CardHeader>
              <CardBody>
                <Grid templateColumns="1fr" gap={4}>
                  {contractors.map((contractor) => (
                    <GridItem key={contractor.id}>
                      <Flex gap={3} align="flex-start">
                        <Radio
                          name="contractorId"
                          value={contractor.id}
                          isChecked={formData.contractorId === contractor.id}
                          onChange={() => setFormData(prev => ({ ...prev, contractorId: contractor.id }))}
                        />
                        <Box>
                          <Text fontWeight="bold">{contractor.companyNo} - {contractor.companyName}</Text>
                          <Text fontSize="sm" color="gray.500">
                            Reg No: {contractor.registrationNo} | Specialization: {contractor.specialization}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            Contact: {contractor.phone} | Email: {contractor.email}
                          </Text>
                          <Badge colorScheme={contractor.isActive ? "green" : "red"}>{contractor.isActive ? "Active" : "Inactive"}</Badge>
                        </Box>
                      </Flex>
                    </GridItem>
                  ))}
                </Grid>
              </CardBody>
            </Card>

            {/* Officers */}
            <Card shadow="md" borderRadius="lg" mb={4}>
              <CardHeader borderBottom="1px" borderColor={borderColor}>
                <Flex align="center">
                  <FiUser />
                  <Heading size="md" ml={2}>Assign Officers</Heading>
                </Flex>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Engineer</FormLabel>
                      <Select
                        placeholder="Select Engineer"
                        name="engineerId"
                        value={formData.engineerId}
                        onChange={handleChange}
                      >
                        {engineers.map(engineer => (
                          <option key={engineer.id} value={engineer.id}>
                            {engineer.officerNo} - {engineer.fullName} ({engineer.division})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Technical Officer</FormLabel>
                      <Select
                        placeholder="Select Technical Officer"
                        name="technicalOfficerId"
                        value={formData.technicalOfficerId}
                        onChange={handleChange}
                      >
                        {technicalOfficers.map(officer => (
                          <option key={officer.id} value={officer.id}>
                            {officer.officerNo} - {officer.fullName} ({officer.division})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>

                  <GridItem>
                    <FormControl isRequired>
                      <FormLabel>Secretary</FormLabel>
                      <Select
                        placeholder="Select Secretary"
                        name="secretaryId"
                        value={formData.secretaryId}
                        onChange={handleChange}
                      >
                        {secretaries.map(secretary => (
                          <option key={secretary.id} value={secretary.id}>
                            {secretary.officerNo} - {secretary.fullName} ({secretary.division})
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>

            {/* Project Images */}
            <Card shadow="md" borderRadius="lg" mb={4}>
              <CardHeader borderBottom="1px" borderColor={borderColor}>
                <Flex align="center">
                  <FiCamera />
                  <Heading size="md" ml={2}>Project Images</Heading>
                  <Badge ml={4} colorScheme="blue">{selectedImages.length} selected</Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Image Upload Input */}
                  <FormControl>
                    <FormLabel htmlFor="image-upload">
                      Upload Pictures (Optional)
                    </FormLabel>

                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      display="none"
                    />

                    <Button
                      as="label"
                      htmlFor="image-upload"
                      colorScheme="teal"
                      variant="outline"
                      cursor="pointer"
                      leftIcon={<FiCamera />}
                      w="full"
                    >
                      Choose Images
                    </Button>

                    <Text fontSize="xs" color={textColor} mt={2}>
                      Allowed: JPG, PNG, WebP. Max 5MB each. You can select multiple files at once.
                    </Text>
                  </FormControl>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <Box>
                      <Heading size="sm" mb={4}>Selected Images Preview</Heading>
                      <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                        {imagePreviews.map((preview, index) => (
                          <Box
                            key={index}
                            position="relative"
                            borderWidth="1px"
                            borderColor={borderColor}
                            borderRadius="lg"
                            overflow="hidden"
                          >
                            <AspectRatio ratio={1}>
                              <ChakraImage
                                src={preview}
                                alt={`Preview ${index}`}
                                objectFit="cover"
                              />
                            </AspectRatio>
                            <IconButton
                              icon={<FiX />}
                              size="sm"
                              colorScheme="red"
                              position="absolute"
                              top={1}
                              right={1}
                              onClick={() => removeImage(index)}
                              aria-label="Remove image"
                            />
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
            <HStack justify="flex-end">
              <Link to="/createProject">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" colorScheme="blue" isLoading={loading}>
                {isEditMode ? "Update Project" : "Create Project"}
              </Button>
            </HStack>
          </VStack>
        </form>
      </Container>
    </Box>
  );
}
