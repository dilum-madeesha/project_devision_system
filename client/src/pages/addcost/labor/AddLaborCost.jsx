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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  IconButton,
  Flex,
  Radio,
  RadioGroup,
  Stack,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Divider,
  useBreakpointValue,
  Grid,
  GridItem,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { dailyLaborCostAPI, jobAPI, laborAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";
import { FiTrash2, FiUserPlus, FiUser, FiCalendar, FiDollarSign, FiClock } from "react-icons/fi";

const AddLaborCostPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [labors, setLabors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Responsive adjustments
  const isMobile = useBreakpointValue({ base: true, md: false });
  const tableSize = useBreakpointValue({ base: "sm", md: "md" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });

  // Color mode values
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("blue.50", "gray.700");
  const selectedBg = useColorModeValue("blue.50", "gray.600");
  const totalBg = useColorModeValue("blue.50", "blue.900");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    jobId: "",
    description: ""
  });

  const [selectedLabors, setSelectedLabors] = useState([]);
  const [selectedLaborIds, setSelectedLaborIds] = useState([]);

  // Helper function to determine if a date is Saturday or Sunday
  const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  // Helper function to determine if date is Saturday
  const isSaturday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 6;
  };

  // Helper function to determine if date is Sunday
  const isSunday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 0;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [jobsResponse, laborsResponse] = await Promise.all([
        jobAPI.getAll(),
        laborAPI.getAll()
      ]);
      
      // Handle different response structures for jobs
      let jobsData = [];
      if (jobsResponse && Array.isArray(jobsResponse)) {
        jobsData = jobsResponse;
      } else if (jobsResponse && jobsResponse.data && jobsResponse.data.jobs && Array.isArray(jobsResponse.data.jobs)) {
        jobsData = jobsResponse.data.jobs;
      } else if (jobsResponse && jobsResponse.data && Array.isArray(jobsResponse.data)) {
        jobsData = jobsResponse.data;
      } else if (jobsResponse && jobsResponse.jobs && Array.isArray(jobsResponse.jobs)) {
        jobsData = jobsResponse.jobs;
      }
      
      // Handle different response structures for labors
      let laborsData = [];
      if (laborsResponse && Array.isArray(laborsResponse)) {
        laborsData = laborsResponse;
      } else if (laborsResponse && laborsResponse.data && laborsResponse.data.labors && Array.isArray(laborsResponse.data.labors)) {
        laborsData = laborsResponse.data.labors;
      } else if (laborsResponse && laborsResponse.data && Array.isArray(laborsResponse.data)) {
        laborsData = laborsResponse.data;
      } else if (laborsResponse && laborsResponse.labors && Array.isArray(laborsResponse.labors)) {
        laborsData = laborsResponse.labors;
      }
      
      // Filter jobs to show only ONGOING status
      const ongoingJobs = jobsData.filter(job => job.status === 'ONGOING');
      
      // Filter only active labors
      const activeLabors = laborsData.filter(labor => labor.isActive !== false);
      
      setJobs(ongoingJobs);
      setLabors(activeLabors);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError("Failed to load initial data");
      setJobs([]);
      setLabors([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (name, valueAsString) => {
    setFormData(prev => ({
      ...prev,
      [name]: valueAsString
    }));
  };

  // Toggle labor selection in the checkbox list
  const toggleLaborSelection = (laborId) => {
    setSelectedLaborIds(prev => {
      if (prev.includes(laborId)) {
        return prev.filter(id => id !== laborId);
      } else {
        return [...prev, laborId];
      }
    });
  };

  // Add multiple selected labors to the list
  const handleAddMultipleLabors = () => {
    if (selectedLaborIds.length === 0) return;
    
    const laborsToAdd = selectedLaborIds.map(laborId => {
      const labor = labors.find(l => l.id === laborId);
      return labor;
    }).filter(labor => labor !== undefined);
    
    // Filter out labors that are already in the selected list
    const newLabors = laborsToAdd.filter(labor => 
      !selectedLabors.some(selected => selected.id === labor.id)
    );
    
    if (newLabors.length === 0) {
      toast({
        title: "No new labors to add",
        description: "All selected labors are already in the list",
        status: "info",
        duration: 3000
      });
      return;
    }
    
    if (newLabors.length < laborsToAdd.length) {
      toast({
        title: "Some labors skipped",
        description: `${laborsToAdd.length - newLabors.length} labors were already in the list`,
        status: "warning",
        duration: 3000
      });
    }
    
    // Add new labors with default time tracking fields
    const laborsWithDefaults = newLabors.map(labor => ({
      id: labor.id,
      epfNumber: labor.epfNumber,
      firstName: labor.firstName,
      lastName: labor.lastName,
      timeIn: "morning", // default to morning shift (8:30 AM)
      timeOut: "evening", // default to evening shift (4:30 PM)
      otHours: 0,
      hasWeekendPay: false // default to no weekend pay
    }));
    
    setSelectedLabors(prev => [...prev, ...laborsWithDefaults]);
    
    // Clear selections
    setSelectedLaborIds([]);
    
    toast({
      title: "Success",
      description: `${newLabors.length} labors added to the list`,
      status: "success",
      duration: 3000
    });
  };
  
  // Remove labor from the selected list
  const handleRemoveLabor = (laborId) => {
    setSelectedLabors(selectedLabors.filter(labor => labor.id !== laborId));
  };
  
  // Update labor time settings
  const handleLaborTimeUpdate = (laborId, field, value) => {
    setSelectedLabors(selectedLabors.map(labor => 
      labor.id === laborId ? { ...labor, [field]: value } : labor
    ));
  };
  
  // Calculate the total cost based on selected labors and time
  const calculateTotalCost = () => {
    if (selectedLabors.length === 0) return 0;
    
    return selectedLabors.reduce((total, selectedLabor) => {
      const labor = labors.find(l => l.id === selectedLabor.id);
      if (!labor) return total;
      
      let hoursWorked = 0;
      
      // Calculate regular hours based on time in/out selection
      if (selectedLabor.timeIn === "morning" && selectedLabor.timeOut === "evening") {
        hoursWorked = 8; // Full day
      } else if (selectedLabor.timeIn === "morning" && selectedLabor.timeOut === "afternoon") {
        hoursWorked = 4; // Morning shift
      } else if (selectedLabor.timeIn === "afternoon" && selectedLabor.timeOut === "evening") {
        hoursWorked = 4; // Afternoon shift
      }
      
      // Calculate cost with explicit number parsing
      const dayPay = parseFloat(labor.dayPay) || 0;
      const otPay = parseFloat(labor.otPay) || 0;
      const weekendPay = parseFloat(labor.weekendPay) || 0;
      const otHours = parseFloat(selectedLabor.otHours) || 0;
      
      const regularCost = (hoursWorked / 8) * dayPay;
      const otCost = otHours * otPay;
      
      // Calculate weekend pay if applicable and enabled
      let weekendPayCost = 0;
      if (selectedLabor.hasWeekendPay && weekendPay > 0) {
        if (isSaturday(formData.date)) {
          weekendPayCost = weekendPay * 0.5; // Half weekend pay for Saturday
        } else if (isSunday(formData.date)) {
          weekendPayCost = weekendPay; // Full weekend pay for Sunday
        }
      }
      
      return total + regularCost + otCost + weekendPayCost;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.date || !formData.jobId) {
        setError("Please select a date and job");
        setLoading(false);
        return;
      }

      // Validate that at least one labor is selected
      if (selectedLabors.length === 0) {
        setError("Please add at least one labor to the list");
        setLoading(false);
        return;
      }
      
      // Calculate labor assignments with detailed cost breakdown
      const laborAssignments = selectedLabors.map(selectedLabor => {
        const labor = labors.find(l => l.id === selectedLabor.id);
        if (!labor) return null;
        
        let regularHours = 0;
        
        // Calculate regular hours based on time in/out selection
        if (selectedLabor.timeIn === "morning" && selectedLabor.timeOut === "evening") {
          regularHours = 8; // Full day
        } else if (selectedLabor.timeIn === "morning" && selectedLabor.timeOut === "afternoon") {
          regularHours = 4; // Morning shift
        } else if (selectedLabor.timeIn === "afternoon" && selectedLabor.timeOut === "evening") {
          regularHours = 4; // Afternoon shift
        }
        
        // Calculate costs with explicit number parsing
        const dayPay = parseFloat(labor.dayPay) || 0;
        const otPay = parseFloat(labor.otPay) || 0;
        const weekendPay = parseFloat(labor.weekendPay) || 0;
        const otHours = parseFloat(selectedLabor.otHours) || 0;
        
        const regularCost = (regularHours / 8) * dayPay;
        const otCost = otHours * otPay;
        
        // Calculate weekend pay cost if applicable
        let weekendPayCost = 0;
        const hasWeekendPay = selectedLabor.hasWeekendPay || false;
        if (hasWeekendPay && weekendPay > 0) {
          if (isSaturday(formData.date)) {
            weekendPayCost = weekendPay * 0.5; // Half weekend pay for Saturday
          } else if (isSunday(formData.date)) {
            weekendPayCost = weekendPay; // Full weekend pay for Sunday
          }
        }
        
        const totalCost = regularCost + otCost + weekendPayCost;
        
        return {
          laborId: selectedLabor.id,
          timeIn: selectedLabor.timeIn,
          timeOut: selectedLabor.timeOut,
          otHours: otHours,
          regularHours: regularHours,
          regularCost: parseFloat(regularCost.toFixed(2)),
          otCost: parseFloat(otCost.toFixed(2)),
          hasWeekendPay: hasWeekendPay,
          weekendPayCost: parseFloat(weekendPayCost.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2))
        };
      }).filter(assignment => assignment !== null);
      
      // Calculate the total cost from all assignments
      const totalCost = laborAssignments.reduce((sum, assignment) => sum + assignment.totalCost, 0);
      
      // Ensure the total cost is a valid number
      if (!totalCost || isNaN(totalCost) || totalCost <= 0) {
        setError("Total cost calculation failed. Please check labor selections.");
        setLoading(false);
        return;
      }

      // Format data exactly matching the schema fields
      const submitData = {
        jobId: parseInt(formData.jobId),
        date: formData.date, // Format: "YYYY-MM-DD"
        cost: parseFloat(totalCost.toFixed(2)),
        description: formData.description || `Labor costs for ${selectedLabors.length} workers`,
        createdById: user?.id ? parseInt(user.id) : 1, // Ensure it's an integer
        updatedById: user?.id ? parseInt(user.id) : 1,  // Ensure it's an integer
        laborAssignments: laborAssignments // Include the detailed labor assignments
      };
      
      // Make API call with proper error handling
      try {
        const response = await dailyLaborCostAPI.create(submitData);
        
        toast({
          title: "Success",
          description: `Labor cost record created successfully for ${selectedLabors.length} workers`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/addcost/labor");
      } catch (apiError) {
        console.error("API Error Details:", apiError);
        
        // Extract detailed error messages from the response if available
        let errorMessage = "Failed to create labor cost record";
        
        if (apiError.response) {
          if (apiError.response.data && apiError.response.data.errors) {
            // Format validation errors for display
            const validationErrors = apiError.response.data.errors;
            errorMessage = Object.entries(validationErrors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join(', ');
          } else if (apiError.response.data && apiError.response.data.message) {
            errorMessage = apiError.response.data.message;
          }
        }
        
        setError(errorMessage);
      }
    } catch (err) {
      console.error("General error creating labor cost:", err);
      setError("An unexpected error occurred while processing your request");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box h="100vh" display="flex" flexDirection="column">
        {/* Fixed Header */}
        <Box bg={bg} borderBottom="1px" borderColor={borderColor} py={4} px={6} shadow="sm">
          <Container maxW="1200px">
            <Heading size="lg" color="blue.500">Add Labor Cost</Heading>
          </Container>
        </Box>
        
        {/* Loading Content */}
        <Box flex="1" overflowY="auto" bg={useColorModeValue("gray.50", "gray.900")} display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={4}>
            <Text>Loading form data...</Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box h="85vh" display="flex" flexDirection="column">
      {/* Fixed Header */}

      {/* Scrollable Content Area */}
      <Box flex="1" overflowY="auto" bg={useColorModeValue("gray.50", "gray.900")}>
        <Container maxW="1200px" py={6}>
          <form id="laborCostForm" onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <Box bg={bg} borderBottom="1px" borderColor={borderColor} py={2} px={6} shadow="sm">
                <Container maxW="1200px">
                  <VStack spacing={4} align="stretch">
                    {/* Breadcrumb Navigation */}
                    <Breadcrumb fontSize="sm" color="gray.600">
                      <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/addcost" color="blue.500">
                          Add Cost
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/addcost/labor" color="blue.500">
                          Labor Cost Records
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink color="blue.500" fontWeight="bold" fontSize="x-large">
                          New Labor Cost Record
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </Breadcrumb>
                    {error && (
                      <Alert status="error" variant="left-accent">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}
                  </VStack>
                </Container>
              </Box>
              {/* Job Details Card */}
              <Card bg={cardBg} shadow="md" borderRadius="lg">
                <CardHeader pb={2} borderBottom="1px" borderColor={borderColor} bg={headerBg}>
                  <Flex align="center">
                    <FiCalendar />
                    <Heading size="md" ml={2}>Job & Date Details</Heading>
                  </Flex>
                </CardHeader>
                <CardBody pt={4}>
                  <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Date</FormLabel>
                        <Input
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleChange}
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl isRequired>
                        <FormLabel>Job</FormLabel>
                        <Select
                          name="jobId"
                          value={formData.jobId}
                          onChange={handleChange}
                          placeholder="Select job"
                        >
                          {Array.isArray(jobs) && jobs.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.jobNumber} - {job.title}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Input
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Enter work description (optional)"
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </CardBody>
              </Card>

              {/* Labor Selection Card */}
              <Card bg={cardBg} shadow="md" borderRadius="lg">
                <CardHeader pb={2} borderBottom="1px" borderColor={borderColor} bg={headerBg}>
                  <Flex justify="space-between" align="center">
                    <Flex align="center">
                      <FiUser />
                      <Heading size="md" ml={2}>Labor Selection</Heading>
                    </Flex>
                    <Badge colorScheme="blue">{labors.length} Available</Badge>
                  </Flex>
                </CardHeader>
                <CardBody pt={4}>
                  {/* Labor Selection Controls */}
                  <VStack spacing={4} align="stretch">
                    <Flex 
                      justify="space-between" 
                      align="center" 
                      wrap="wrap"
                      gap={2}
                    >
                      <Text fontWeight="medium" fontSize="sm">
                        {selectedLaborIds.length} laborers selected
                      </Text>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const allLaborIds = labors.map(labor => labor.id);
                            setSelectedLaborIds(allLaborIds);
                          }}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLaborIds([])}
                        >
                          Clear
                        </Button>
                        <Button
                          leftIcon={<FiUserPlus />}
                          colorScheme="blue"
                          size="sm"
                          onClick={handleAddMultipleLabors}
                          isDisabled={selectedLaborIds.length === 0}
                        >
                          Add Selected ({selectedLaborIds.length})
                        </Button>
                      </HStack>
                    </Flex>

                    {/* Labor Selection List */}
                    <Box 
                      maxH="300px" 
                      overflowY="auto" 
                      borderWidth="1px" 
                      borderColor={borderColor} 
                      borderRadius="md"
                    >
                      {labors.length === 0 ? (
                        <Flex justify="center" align="center" h="100px">
                          <Text color="gray.500">No laborers available</Text>
                        </Flex>
                      ) : (
                        <Grid 
                          templateColumns={{ base: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" }}
                          gap={2}
                          p={2}
                        >
                          {labors.map(labor => (
                            <GridItem key={labor.id}>
                              <Box
                                p={3}
                                borderWidth="1px"
                                borderColor={selectedLaborIds.includes(labor.id) ? "blue.300" : borderColor}
                                borderRadius="md"
                                bg={selectedLaborIds.includes(labor.id) ? selectedBg : "transparent"}
                                _hover={{ bg: hoverBg }}
                                cursor="pointer"
                                onClick={() => toggleLaborSelection(labor.id)}
                                transition="all 0.2s"
                              >
                                <Flex justify="space-between" align="center">
                                  <VStack align="start" spacing={1}>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {labor.firstName} {labor.lastName}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      EPF: {labor.epfNumber} • {labor.trade || 'General'}
                                    </Text>
                                    <Text fontSize="xs" color="gray.500">
                                      LKR {labor.dayPay}/day • LKR {labor.otPay}/hr OT
                                    </Text>
                                  </VStack>
                                  <Checkbox
                                    isChecked={selectedLaborIds.includes(labor.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      toggleLaborSelection(labor.id);
                                    }}
                                    colorScheme="blue"
                                    size="lg"
                                  />
                                </Flex>
                              </Box>
                            </GridItem>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Selected Labors Card */}
              {selectedLabors.length > 0 && (
                <Card bg={cardBg} shadow="md" borderRadius="lg">
                  <CardHeader pb={2} borderBottom="1px" borderColor={borderColor} bg={headerBg}>
                    <Flex justify="space-between" align="center">
                      <Flex align="center">
                        <FiClock />
                        <Heading size="md" ml={2}>Time Management</Heading>
                      </Flex>
                      <Badge colorScheme="green">{selectedLabors.length} Selected</Badge>
                    </Flex>
                  </CardHeader>
                  <CardBody pt={4} px={{ base: 2, md: 4 }}>
                    <Box overflowX="auto">
                      <Table variant="simple" size={tableSize} colorScheme="blue">
                        <Thead bg={headerBg}>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Time In</Th>
                            <Th>Time Out</Th>
                            <Th>OT Hours</Th>
                            {isWeekend(formData.date) && (
                              <Th>
                                Additional
                                {isSaturday(formData.date) && (
                                  <Text fontSize="xs" color="gray.500">(Half Weekend Pay)</Text>
                                )}
                                {isSunday(formData.date) && (
                                  <Text fontSize="xs" color="gray.500">(Weekend Pay)</Text>
                                )}
                              </Th>
                            )}
                            <Th width="80px">Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedLabors.map((labor) => (
                            <Tr key={labor.id}>
                              <Td>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="medium" fontSize="sm">
                                    {`${labor.firstName} ${labor.lastName}`}
                                  </Text>
                                  <Text fontSize="xs" color="gray.500">
                                    EPF: {labor.epfNumber}
                                  </Text>
                                </VStack>
                              </Td>
                              <Td>
                                <RadioGroup
                                  value={labor.timeIn}
                                  onChange={(value) => handleLaborTimeUpdate(labor.id, 'timeIn', value)}
                                  size="sm"
                                >
                                  <Stack direction="column" spacing={1}>
                                    <Radio value="morning">8:30 AM</Radio>
                                    <Radio value="afternoon">12:30 PM</Radio>
                                  </Stack>
                                </RadioGroup>
                              </Td>
                              <Td>
                                <RadioGroup
                                  value={labor.timeOut}
                                  onChange={(value) => handleLaborTimeUpdate(labor.id, 'timeOut', value)}
                                  size="sm"
                                >
                                  <Stack direction="column" spacing={1}>
                                    <Radio value="afternoon">12:30 PM</Radio>
                                    <Radio value="evening">4:30 PM</Radio>
                                  </Stack>
                                </RadioGroup>
                              </Td>
                              <Td>
                                <NumberInput
                                  size="sm"
                                  min={0}
                                  max={12}
                                  precision={1}
                                  value={labor.otHours}
                                  onChange={(valueAsString) => {
                                    const numValue = parseFloat(valueAsString) || 0;
                                    handleLaborTimeUpdate(labor.id, 'otHours', numValue);
                                  }}
                                  width="70px"
                                >
                                  <NumberInputField />
                                  <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                  </NumberInputStepper>
                                </NumberInput>
                              </Td>
                              {isWeekend(formData.date) && (
                                <Td>
                                  <Checkbox
                                    isChecked={labor.hasWeekendPay || false}
                                    onChange={(e) => handleLaborTimeUpdate(labor.id, 'hasWeekendPay', e.target.checked)}
                                    colorScheme="blue"
                                    size="lg"
                                  >
                                    <Text fontSize="xs" ml={1}>
                                      {isSaturday(formData.date) && "Half Pay"}
                                      {isSunday(formData.date) && "Full Pay"}
                                    </Text>
                                  </Checkbox>
                                </Td>
                              )}
                              <Td>
                                <IconButton
                                  aria-label="Remove labor"
                                  icon={<FiTrash2 />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleRemoveLabor(labor.id)}
                                />
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>

                    {/* Total Cost Summary */}
                    <Box mt={4} p={4} bg={totalBg} borderRadius="md">
                      <Flex 
                        justify="space-between" 
                        align="center"
                        direction={{ base: "column", md: "row" }}
                        gap={{ base: 2, md: 0 }}
                      >
                        <HStack>
                          <FiDollarSign />
                          <Text fontWeight="medium">Total Labor Cost:</Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="lg" color="blue.600">
                          LKR {calculateTotalCost().toFixed(2)}
                        </Text>
                      </Flex>
                    </Box>
                  </CardBody>
                </Card>
              )}

              {/* Action Buttons - Fixed at Bottom */}
              <Card bg={cardBg} shadow="md" borderRadius="lg"  bottom={0} zIndex={2}>
                <CardBody py={3}>
                  <HStack spacing={4} justify="flex-end">
                    <Link to="/addcost/labor">
                      <Button variant="outline" size={buttonSize}>
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      isLoading={loading}
                      loadingText="Creating..."
                      size={buttonSize}
                      width={{ base: "full", md: "auto" }}
                      isDisabled={selectedLabors.length === 0}
                    >
                      Create Labor Cost Record
                    </Button>
                  </HStack>
                </CardBody>
              </Card>
            </VStack>
          </form>
        </Container>
      </Box>
    </Box>
  );
};

export default AddLaborCostPage;