import {
  Box,
  VStack,
  Heading,
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
  Radio,
  Spinner,
  SimpleGrid,
  Image as ChakraImage,
  IconButton,
  AspectRatio,
  Container,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { agreementAPI } from "../../../api/agreements.js";
import { contractorAPI } from "../../../api/contractors.js";
import { officerAPI } from "../../../api/officers.js";
import { projectAPI } from "../../../api/projects.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { FiUser, FiCalendar, FiCheckSquare, FiX, FiCamera, FiBriefcase, FiAlertCircle } from "react-icons/fi";

const activities = [
  { id: 1, icon: "📝", action: "Feasibility Study", other: "Assess project viability, technical feasibility, economic analysis, risk assessment." },
  { id: 2, icon: "📋", action: "Requirement Analysis", other: "Gather and document project requirements, stakeholder analysis, functional specifications." },
  { id: 3, icon: "📐", action: "Planning and Design", other: "Develop project plans, architectural design, technical specifications, resource planning." },
  { id: 4, icon: "💰", action: "Budgeting and Cost Estimation", other: "Prepare detailed budget, cost breakdown, financial planning, funding arrangements." },
  { id: 5, icon: "🛒", action: "Procurement", other: "Tendering process, vendor selection, contract negotiations, material procurement." },
  { id: 6, icon: "🏗️", action: "Execution and Quality Control", other: "Project implementation, construction work, quality assurance, progress monitoring." },
  { id: 7, icon: "📊", action: "Monitoring and Evaluation", other: "Performance tracking, milestone reviews, risk monitoring, progress evaluation." },
  { id: 8, icon: "🔧", action: "Testing and Commissioning", other: "System testing, commissioning activities, final inspections, performance verification." },
  { id: 9, icon: "🎉", action: "Handover", other: "Project handover, documentation delivery, training, final acceptance." },
  { id: 10, icon: "🛠️", action: "Maintenance", other: "Post-handover support, warranty management, ongoing maintenance, defect resolution." },
];

export default function ProjectSetup() {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: projectId } = useParams();
  const isEditMode = !!projectId;

  // ── Theme colors ─────────────────────────────────────────────
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const headerBg = useColorModeValue("#FFF8F0", "gray.700");
  const headerBorderColor = useColorModeValue("orange.200", "orange.700");
  const textColor = useColorModeValue("gray.500", "gray.400");
  // ─────────────────────────────────────────────────────────────

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedActivities, setSelectedActivities] = useState([]);

  // expense tracking
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [newExpense, setNewExpense] = useState("");

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
    secretaryId: "",
  });

  // ── Derived officer lists ─────────────────────────────────────
  const engineers = officers.filter(o => o.designation?.toLowerCase() === "engineer");
  const technicalOfficers = officers.filter(o => o.designation?.toLowerCase() === "technical officer");
  const secretaries = officers.filter(o => o.designation?.toLowerCase() === "secretary");

  // ── Data loading ──────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
    if (isEditMode && projectId) loadProjectData();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [agreementsRes, contractorsRes, officersRes] = await Promise.all([
        agreementAPI.getAll(),
        contractorAPI.getAll(),
        officerAPI.getAll(),
      ]);

      // Agreements
      let agreementsList = [];
      if (agreementsRes?.data && Array.isArray(agreementsRes.data)) agreementsList = agreementsRes.data;
      else if (Array.isArray(agreementsRes)) agreementsList = agreementsRes;
      setAgreements(agreementsList.filter(a => a.status === "ACTIVE" || a.status === "PENDING"));

      // Contractors
      let contractorsList = [];
      if (contractorsRes?.data?.contractors && Array.isArray(contractorsRes.data.contractors)) contractorsList = contractorsRes.data.contractors;
      else if (contractorsRes?.data && Array.isArray(contractorsRes.data)) contractorsList = contractorsRes.data;
      else if (Array.isArray(contractorsRes)) contractorsList = contractorsRes;
      setContractors(contractorsList.filter(c => c.isActive !== false));

      // Officers
      let officersList = [];
      if (officersRes?.data?.officers && Array.isArray(officersRes.data.officers)) officersList = officersRes.data.officers;
      else if (officersRes?.data && Array.isArray(officersRes.data)) officersList = officersRes.data;
      else if (Array.isArray(officersRes)) officersList = officersRes;
      setOfficers(officersList.filter(o => o.status !== false));

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const loadProjectData = async () => {
    try {
      const response = await projectAPI.getById(projectId);
      const project = response?.data || response;

      setFormData({
        projectId: project.projectId || "",
        projectName: project.projectName || "",
        status: project.status || "PLANNING",
        description: project.description || "",
        startDate: project.startDate ? project.startDate.split("T")[0] : "",
        endDate: project.endDate ? project.endDate.split("T")[0] : "",
        agreementId: project.agreementId || "",
        contractorId: project.contractorId || "",
        engineerId: project.officerAssignments?.find(a => a.role === "ENGINEER")?.officerId || "",
        technicalOfficerId: project.officerAssignments?.find(a => a.role === "TECHNICAL_OFFICER")?.officerId || "",
        secretaryId: project.officerAssignments?.find(a => a.role === "SECRETARY")?.officerId || "",
        totalExpense: project.totalExpense || 0,
      });

      setExpenseEntries(project.expenseEntries || []);

      const count = Math.round((project.completedPercent || 0) / (100 / activities.length));
      setSelectedActivities(Array.from({ length: count }, (_, i) => i + 1));
    } catch (err) {
      console.error("Error loading project:", err);
      toast({ title: "Error", description: "Failed to load project data", status: "error", duration: 3000, isClosable: true });
    }
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleChange = (e) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCheckboxChange = (id) =>
    setSelectedActivities(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );

  const handleImageChange = (e) => {
    let files = Array.from(e.target.files);
    const remaining = 10 - selectedImages.length;

    if (files.length > remaining) {
      toast({ title: "Too many images", description: `You can only upload ${remaining} more file(s).`, status: "warning", duration: 3000, isClosable: true });
      files = files.slice(0, remaining);
    }

    const validFiles = [];
    files.forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file type", description: `${file.name} is not an image and will be skipped.`, status: "warning", duration: 3000, isClosable: true });
      } else if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${file.name} exceeds 10 MB and will be skipped.`, status: "warning", duration: 3000, isClosable: true });
      } else {
        validFiles.push(file);
      }
    });

    setSelectedImages(prev => [...prev, ...validFiles]);
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviews(prev => [...prev, reader.result]);
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
      const officerAssignments = [];
      if (formData.engineerId) officerAssignments.push({ officerId: parseInt(formData.engineerId), role: "ENGINEER" });
      if (formData.technicalOfficerId) officerAssignments.push({ officerId: parseInt(formData.technicalOfficerId), role: "TECHNICAL_OFFICER" });
      if (formData.secretaryId) officerAssignments.push({ officerId: parseInt(formData.secretaryId), role: "SECRETARY" });

      const submitData = {
        projectId: formData.projectId,
        projectName: formData.projectName,
        description: formData.description ||
          `Activities: ${selectedActivities.map(id => activities.find(a => a.id === id)?.action).join(", ")}`,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        agreementId: formData.agreementId || null,
        contractorId: formData.contractorId || null,
        createdById: user?.id || null,
        completedPercent: Math.round((selectedActivities.length / activities.length) * 100),
        officerAssignments,
        totalExpense: expenseEntries.reduce((a,b)=>a+b,0),
        expenseEntries,
      };

      if (isEditMode) {
        await projectAPI.update(projectId, submitData);
        toast({ title: "Project Updated", description: "Project updated successfully", status: "success", duration: 3000, isClosable: true });
      } else {
        const createResponse = await projectAPI.create(submitData);
        const newProjectId = createResponse.data?.id || createResponse?.id;

        if (selectedImages.length > 0 && newProjectId) {
          try {
            const fd = new FormData();
            selectedImages.forEach(file => fd.append("images", file));
            await projectAPI.uploadImages(newProjectId, fd);
          } catch (imgErr) {
            let msg = "Project created but some images failed to upload";
            if (imgErr.response?.data?.message) msg += `: ${imgErr.response.data.message}`;
            toast({ title: "Warning", description: msg, status: "warning", duration: 4000, isClosable: true });
          }
        }
        toast({ title: "Project Created", description: "Project saved successfully", status: "success", duration: 3000, isClosable: true });
      }

      navigate("/createproject/collectProject/list");
    } catch (err) {
      console.error("Error saving project:", err);
      setError(err.response?.data?.message || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading screen ────────────────────────────────────────────
  if (loadingData) {
    return (
      <Box h="100vh" display="flex" alignItems="center" justifyContent="center" bg={pageBg}>
        <VStack spacing={4}>
          <Spinner size="xl" color="orange.400" />
          <Text color="orange.400" fontWeight="medium">Loading data...</Text>
        </VStack>
      </Box>
    );
  }

  // ── Shared style helpers ──────────────────────────────────────
  const cardProps = {
    bg,
    shadow: "sm",
    border: "1px solid",
    borderColor,
    borderRadius: "lg",
  };

  const cardHeaderProps = {
    bg: headerBg,
    borderBottom: "2px solid",
    borderColor: headerBorderColor,
    borderTopRadius: "lg",
    py: 3,
    px: 5,
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <Box w="100%" minH="calc(100vh - 64px)" px={{ base: 2, md: 4, lg: 6 }} py={6} bg={pageBg}>
      <Container maxW="900px">
        <form onSubmit={handleSubmit}>
          <Box maxH="calc(100vh - 150px)" overflowY="auto" p={6} bg={bg} border="1px solid" borderColor={borderColor} borderRadius="lg">
            <VStack spacing={5} align="stretch">

              {/* Breadcrumb */}
              <Breadcrumb fontSize="sm" separator="/">
                <BreadcrumbItem>
                  <BreadcrumbLink as={Link} to="/createProject" color="orange.500">
                    Projects
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbItem>
                  <BreadcrumbLink as={Link} to="/createproject/collectProject/list" color="orange.500">
                    Project List
                  </BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbItem isCurrentPage>
                  <BreadcrumbLink color="orange.500" size="sm" fontWeight="bold">
                    {isEditMode ? "Edit Project" : "Create New Project"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Breadcrumb>

              {/* Page title */}
              <Box>
                <Heading size="lg" color="orange.500" fontWeight="bold" letterSpacing="tight">
                  {isEditMode ? "Edit Project" : "Create New Project"}
                </Heading>
                <Text color="gray.500" fontSize="sm" mt={1}>
                  {isEditMode
                    ? "Update project details and assignments"
                    : "Fill in the details to set up a new project"}
                </Text>
              </Box>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {/* ── Project Details ── */}
              <Card {...cardProps}>
                <CardHeader {...cardHeaderProps}>
                  <Flex align="center" gap={2}>
                    <Box color="orange.400"><FiCalendar /></Box>
                    <Heading size="sm" color="orange.600" fontWeight="bold">Project Details</Heading>
                  </Flex>
                </CardHeader>
                <CardBody px={5} py={5}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Project ID</FormLabel>
                        <Input name="projectId" value={formData.projectId} onChange={handleChange}
                          placeholder="e.g., PRJ-001" focusBorderColor="orange.400"
                          borderColor={borderColor} _hover={{ borderColor: "orange.300" }} />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Project Name</FormLabel>
                        <Input name="projectName" value={formData.projectName} onChange={handleChange}
                          placeholder="Enter project name" focusBorderColor="orange.400"
                          borderColor={borderColor} _hover={{ borderColor: "orange.300" }} />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Status</FormLabel>
                        <Select name="status" value={formData.status} onChange={handleChange}
                          focusBorderColor="orange.400" borderColor={borderColor} _hover={{ borderColor: "orange.300" }}>
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
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Description</FormLabel>
                        <Input name="description" value={formData.description} onChange={handleChange}
                          placeholder="Enter description" focusBorderColor="orange.400"
                          borderColor={borderColor} _hover={{ borderColor: "orange.300" }} />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Start Date</FormLabel>
                        <Input name="startDate" type="date" value={formData.startDate} onChange={handleChange}
                          focusBorderColor="orange.400" borderColor={borderColor} _hover={{ borderColor: "orange.300" }} />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">End Date</FormLabel>
                        <Input name="endDate" type="date" value={formData.endDate} onChange={handleChange}
                          focusBorderColor="orange.400" borderColor={borderColor} _hover={{ borderColor: "orange.300" }} />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </CardBody>
              </Card>

              {/* ── Project Activities ── */}
              <Card {...cardProps}>
                <CardHeader {...cardHeaderProps}>
                  <Flex align="center" gap={2}>
                    <Box color="orange.400"><FiCheckSquare /></Box>
                    <Heading size="sm" color="orange.600" fontWeight="bold">Project Activities</Heading>
                    <Badge ml={2} colorScheme="orange" borderRadius="full" px={2}>
                      {selectedActivities.length} selected
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody px={5} py={4}>
                  <Grid templateColumns="1fr" gap={3}>
                    {activities.map(activity => (
                      <GridItem key={activity.id}>
                        <Flex
                          gap={3} align="flex-start" p={3} borderRadius="md"
                          border="1px solid"
                          borderColor={selectedActivities.includes(activity.id) ? "orange.300" : borderColor}
                          bg={selectedActivities.includes(activity.id) ? "orange.50" : "transparent"}
                          _hover={{ borderColor: "orange.200", bg: "orange.50" }}
                          transition="all 0.15s" cursor="pointer"
                          onClick={() => handleCheckboxChange(activity.id)}
                        >
                          <Checkbox
                            isChecked={selectedActivities.includes(activity.id)}
                            onChange={() => { }}
                            colorScheme="orange" mt={0.5} pointerEvents="none"
                          />
                          <Box>
                            <Text fontWeight="semibold" fontSize="sm">{activity.icon} {activity.action}</Text>
                            <Text fontSize="xs" color={textColor} mt={0.5}>{activity.other}</Text>
                          </Box>
                        </Flex>
                      </GridItem>
                    ))}
                  </Grid>
                </CardBody>
              </Card>

              {/* ── Financials: Expense ── */}
      
              <Card {...cardProps}>
                <CardHeader {...cardHeaderProps}>
                  <Flex align="center" gap={2}>
                    <Box color="orange.400"><FiAlertCircle /></Box>
                    <Heading size="sm" color="orange.600" fontWeight="bold">Project Expense</Heading>
                    <Text ml="auto" fontSize="sm" fontWeight="semibold">
                      Total: Rs. {expenseEntries.reduce((a,b)=>a+b,0).toLocaleString()}
                    </Text>
                  </Flex>
                </CardHeader>
                <CardBody px={5} py={4}>
                  <HStack spacing={2} mb={3}>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={newExpense}
                      onChange={e => setNewExpense(e.target.value)}
                      flex="1"
                    />
                    <Button size="sm" colorScheme="orange" onClick={() => {
                      const val = parseFloat(newExpense);
                      if (!isNaN(val)) {
                        setExpenseEntries(prev => [...prev, val]);
                        setNewExpense("");
                      }
                    }}>
                      Add
                    </Button>
                  </HStack>
                  {expenseEntries.length > 0 && (
                    <VStack align="start" spacing={1}>
                      {expenseEntries.map((v,i) => (
                        <HStack key={i} spacing={2}>
                          <Text fontSize="sm">- Rs. {v.toLocaleString()}</Text>
                          <IconButton
                            size="xs"
                            aria-label="Remove"
                            icon={<FiX />}
                            onClick={() => setExpenseEntries(prev => prev.filter((_, idx) => idx !== i))}
                          />
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </CardBody>
              </Card>

              {/* ── Select Agreement ── */}
              <Card {...cardProps}>
                <CardHeader {...cardHeaderProps}>
                  <Flex align="center" gap={2}>
                    <Box color="orange.400"><FiCheckSquare /></Box>
                    <Heading size="sm" color="orange.600" fontWeight="bold">Select Agreement</Heading>
                    {formData.agreementId && (
                      <Badge ml={2} colorScheme="green" borderRadius="full" px={2}>Selected</Badge>
                    )}
                  </Flex>
                </CardHeader>
                <CardBody px={5} py={4}>
                  <Grid templateColumns="1fr" gap={3}>
                    {agreements.length === 0 ? (
                      <Text fontSize="sm" color={textColor}>No active agreements found.</Text>
                    ) : agreements.map((agreement) => (
                      <GridItem key={agreement.id}>
                        <Flex
                          gap={3} align="flex-start" p={3} borderRadius="md"
                          border="1px solid"
                          borderColor={formData.agreementId === agreement.id ? "orange.300" : borderColor}
                          bg={formData.agreementId === agreement.id ? "orange.50" : "transparent"}
                          _hover={{ borderColor: "orange.200", bg: "orange.50" }}
                          transition="all 0.15s" cursor="pointer"
                          onClick={() => setFormData(prev => ({ ...prev, agreementId: agreement.id }))}
                        >
                          <Radio
                            isChecked={formData.agreementId === agreement.id}
                            onChange={() => { }} colorScheme="orange" mt={0.5} pointerEvents="none"
                          />
                          <Box>
                            <Text fontWeight="semibold" fontSize="sm">
                              {agreement.agreementNo} — {agreement.projectName}&nbsp;|&nbsp;Rs.{agreement.agreementSum?.toLocaleString()}
                            </Text>
                            <Text fontSize="xs" color={textColor} mt={0.5}>
                              Period: {agreement.periodDays} days&nbsp;|&nbsp;
                              Start: {agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : "N/A"}&nbsp;|&nbsp;
                              End: {agreement.completionDate ? new Date(agreement.completionDate).toLocaleDateString() : "N/A"}
                            </Text>
                            <Badge mt={1} borderRadius="full" px={2} fontSize="xs"
                              colorScheme={agreement.status === "ACTIVE" ? "green" : agreement.status === "PENDING" ? "yellow" : "red"}>
                              {agreement.status}
                            </Badge>
                          </Box>
                        </Flex>
                      </GridItem>
                    ))}
                  </Grid>
                </CardBody>
              </Card>

              {/* ── Select Contractor ── */}
              <Card {...cardProps}>
                <CardHeader {...cardHeaderProps}>
                  <Flex align="center" gap={2}>
                    <Box color="orange.400"><FiUser /></Box>
                    <Heading size="sm" color="orange.600" fontWeight="bold">Select Contractor</Heading>
                    {formData.contractorId && (
                      <Badge ml={2} colorScheme="green" borderRadius="full" px={2}>Selected</Badge>
                    )}
                  </Flex>
                </CardHeader>
                <CardBody px={5} py={4}>
                  <Grid templateColumns="1fr" gap={3}>
                    {contractors.length === 0 ? (
                      <Text fontSize="sm" color={textColor}>No active contractors found.</Text>
                    ) : contractors.map((contractor) => (
                      <GridItem key={contractor.id}>
                        <Flex
                          gap={3} align="flex-start" p={3} borderRadius="md"
                          border="1px solid"
                          borderColor={formData.contractorId === contractor.id ? "orange.300" : borderColor}
                          bg={formData.contractorId === contractor.id ? "orange.50" : "transparent"}
                          _hover={{ borderColor: "orange.200", bg: "orange.50" }}
                          transition="all 0.15s" cursor="pointer"
                          onClick={() => setFormData(prev => ({ ...prev, contractorId: contractor.id }))}
                        >
                          <Radio
                            isChecked={formData.contractorId === contractor.id}
                            onChange={() => { }} colorScheme="orange" mt={0.5} pointerEvents="none"
                          />
                          <Box>
                            <Text fontWeight="semibold" fontSize="sm">
                              {contractor.companyName}
                            </Text>
                            <Text fontSize="xs" color={textColor} mt={0.5}>
                              Reg No: {contractor.registrationNo}&nbsp;|&nbsp;Specialization: {contractor.specialization}
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                              Contact: {contractor.phone}&nbsp;|&nbsp;{contractor.email}
                            </Text>
                            <Badge mt={1} borderRadius="full" px={2} fontSize="xs"
                              colorScheme={contractor.isActive ? "green" : "red"}>
                              {contractor.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </Box>
                        </Flex>
                      </GridItem>
                    ))}
                  </Grid>
                </CardBody>
              </Card>

              {/* ── Assign Officers ── */}
              <Card {...cardProps}>
                <CardHeader {...cardHeaderProps}>
                  <Flex align="center" gap={2}>
                    <Box color="orange.400"><FiUser /></Box>
                    <Heading size="sm" color="orange.600" fontWeight="bold">Assign Officers</Heading>
                  </Flex>
                </CardHeader>
                <CardBody px={5} py={5}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Engineer</FormLabel>
                        <Select placeholder="Select Engineer" name="engineerId" value={formData.engineerId}
                          onChange={handleChange} focusBorderColor="orange.400"
                          borderColor={borderColor} _hover={{ borderColor: "orange.300" }}>
                          {engineers.map(e => (
                            <option key={e.id} value={e.id}>{e.officerNo} - {e.fullName} ({e.division})</option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Technical Officer</FormLabel>
                        <Select placeholder="Select Technical Officer" name="technicalOfficerId" value={formData.technicalOfficerId}
                          onChange={handleChange} focusBorderColor="orange.400"
                          borderColor={borderColor} _hover={{ borderColor: "orange.300" }}>
                          {technicalOfficers.map(o => (
                            <option key={o.id} value={o.id}>{o.officerNo} - {o.fullName} ({o.division})</option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">Secretary</FormLabel>
                        <Select placeholder="Select Secretary" name="secretaryId" value={formData.secretaryId}
                          onChange={handleChange} focusBorderColor="orange.400"
                          borderColor={borderColor} _hover={{ borderColor: "orange.300" }}>
                          {secretaries.map(s => (
                            <option key={s.id} value={s.id}>{s.officerNo} - {s.fullName} ({s.division})</option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                  </Grid>
                </CardBody>
              </Card>

              {/* ── Project Images ── */}
              <Card {...cardProps}>
                <CardHeader {...cardHeaderProps}>
                  <Flex align="center" gap={2}>
                    <Box color="orange.400"><FiCamera /></Box>
                    <Heading size="sm" color="orange.600" fontWeight="bold">Project Images</Heading>
                    <Badge ml={2} colorScheme="orange" borderRadius="full" px={2}>
                      {selectedImages.length} selected
                    </Badge>
                  </Flex>
                </CardHeader>
                <CardBody px={5} py={5}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold" color="gray.600">
                        Upload Pictures (Optional)
                      </FormLabel>
                      <Input id="image-upload" type="file" accept="image/*" multiple
                        onChange={handleImageChange} display="none" />
                      <Button as="label" htmlFor="image-upload" variant="outline" cursor="pointer"
                        leftIcon={<FiCamera />} w="full" borderColor="orange.300" color="orange.500"
                        _hover={{ bg: "orange.50", borderColor: "orange.400" }}>
                        Choose Images
                      </Button>
                      <Text fontSize="xs" color={textColor} mt={2}>
                        Allowed: JPG, PNG, WebP. Max 10 MB each. You can select multiple files at once.
                      </Text>
                    </FormControl>

                    {imagePreviews.length > 0 && (
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm" mb={3} color="gray.600">
                          Selected Images Preview
                        </Text>
                        <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                          {imagePreviews.map((preview, index) => (
                            <Box key={index} position="relative" borderWidth="1px"
                              borderColor={borderColor} borderRadius="lg" overflow="hidden">
                              <AspectRatio ratio={1}>
                                <ChakraImage src={preview} alt={`Preview ${index}`} objectFit="cover" />
                              </AspectRatio>
                              <IconButton icon={<FiX />} size="sm" colorScheme="red"
                                position="absolute" top={1} right={1}
                                onClick={() => removeImage(index)} aria-label="Remove image" />
                            </Box>
                          ))}
                        </SimpleGrid>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Box>

          {/* ── Action Buttons ── */}
          <HStack justify="flex-end" spacing={3} pb={4}>
            <Link to="/createProject">
              <Button variant="outline" borderColor="gray.300" color="gray.600" _hover={{ bg: "gray.50" }}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              bg="orange.400" color="white"
              _hover={{ bg: "orange.500" }} _active={{ bg: "orange.600" }}
              isLoading={loading}
              loadingText={isEditMode ? "Updating..." : "Creating..."}
              fontWeight="semibold" px={6} shadow="md"
            >
              {isEditMode ? "Update Project" : "Create Project"}
            </Button>
          </HStack>

        </form>
      </Container>
    </Box>
  );
}