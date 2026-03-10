import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Center,
  Icon,
  Flex,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Spinner,
  useToast,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  FormControl,
  FormLabel,
  Divider,
  IconButton,
  Container,
  Tooltip,
  Select,
  Alert,
  AlertIcon,
  Progress
} from '@chakra-ui/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FiBriefcase,
  FiSearch, 
  FiCalendar, 
  FiUsers, 
  FiDollarSign, 
  FiEye, 
  FiFilter, 
  FiXCircle,
  FiPackage,
  FiClock,
  FiMapPin
} from 'react-icons/fi';
import { 
  jobAPI, 
  dailyLaborCostAPI, 
  materialOrderAPI,
  dailyLaborAssignmentAPI,
  materialOrderAssignmentAPI 
} from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

const JobCostPage = () => {
  // State variables
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [costsLoading, setCostsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  // Cost data
  const [laborCosts, setLaborCosts] = useState([]);
  const [materialCosts, setMaterialCosts] = useState([]);
  const [totalCosts, setTotalCosts] = useState([]);
  
  // Summary statistics
  const [summary, setSummary] = useState({
    totalLaborCost: 0,
    totalMaterialCost: 0,
    totalCost: 0,
    totalWorkers: 0,
    totalHours: 0,
    totalMaterials: 0
  });
  
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const toast = useToast();

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Color palette for pie charts
  const COLORS = ['#3182CE', '#ED8936']; // Blue for Labor, Orange for Material

  // Custom tooltip for pie charts
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" shadow="lg" border="1px" borderColor="gray.200">
          <Text fontWeight="bold" mb={1}>{data.name}</Text>
          <Text color={payload[0].color}>
            {`Cost: ${formatCurrency(data.value)}`}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {`Percentage: ${data.percentage}%`}
          </Text>
        </Box>
      );
    }
    return null;
  };

  // Custom label for pie charts
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const getStatusColor = (status) => {
    const statusColors = {
      NOT_STARTED: "gray",
      ONGOING: "blue", 
      COMPLETED: "green",
      ON_HOLD: "orange",
      CANCELLED: "red"
    };
    return statusColors[status] || "gray";
  };

  const getDepartmentColor = (department) => {
    const colors = {
      'Civil': 'blue',
      'Electrical': 'yellow',
      'Mechanical': 'green',
      'Plumbing': 'purple',
      'HVAC': 'teal',
      'Other': 'gray'
    };
    return colors[department] || 'gray';
  };

  // Fetch jobs when component mounts
  useEffect(() => {
    fetchJobs();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [departmentFilter, statusFilter, searchTerm, jobs]);

  // Fetch job costs when a job is selected
  useEffect(() => {
    if (selectedJob) {
      fetchJobCosts(selectedJob.id);
    }
  }, [selectedJob]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await jobAPI.getAll();
      let jobsData = [];
      
      if (response && Array.isArray(response)) {
        jobsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (response && response.jobs && Array.isArray(response.jobs)) {
        jobsData = response.jobs;
      }
      
      setJobs(jobsData);
      setFilteredJobs(jobsData);
      
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "Failed to fetch jobs");
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to fetch jobs",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(job => job.reqDepartment === departmentFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        (job.jobNumber && job.jobNumber.toLowerCase().includes(searchLower)) ||
        (job.title && job.title.toLowerCase().includes(searchLower)) ||
        (job.projectCode && job.projectCode.toLowerCase().includes(searchLower))
      );
    }

    setFilteredJobs(filtered);
  };

  const clearFilters = () => {
    setDepartmentFilter('');
    setStatusFilter('');
    setSearchTerm('');
    setSelectedJobId('');
    setSelectedJob(null);
  };

  const handleJobSelect = async (jobId) => {
    if (!jobId) {
      setSelectedJob(null);
      setSelectedJobId('');
      return;
    }

    const job = filteredJobs.find(j => j.id === parseInt(jobId));
    if (job) {
      setSelectedJob(job);
      setSelectedJobId(jobId);
    }
  };

  const fetchJobCosts = async (jobId) => {
    try {
      setCostsLoading(true);
      
      // Fetch labor costs for the job
      const laborResponse = await dailyLaborCostAPI.getAll(1, 1000);
      let allLaborCosts = [];
      
      if (laborResponse && Array.isArray(laborResponse)) {
        allLaborCosts = laborResponse;
      } else if (laborResponse && laborResponse.data && Array.isArray(laborResponse.data)) {
        allLaborCosts = laborResponse.data;
      }
      
      // Filter labor costs for selected job
      const jobLaborCosts = allLaborCosts.filter(cost => cost.job?.id === jobId);
      
      // Fetch material costs for the job
      const materialResponse = await materialOrderAPI.getAll(1, 1000);
      let allMaterialCosts = [];
      
      if (materialResponse && Array.isArray(materialResponse)) {
        allMaterialCosts = materialResponse;
      } else if (materialResponse && materialResponse.data && Array.isArray(materialResponse.data)) {
        allMaterialCosts = materialResponse.data;
      }
      
      // Filter material costs for selected job
      const jobMaterialCosts = allMaterialCosts.filter(cost => cost.job?.id === jobId);
      
      setLaborCosts(jobLaborCosts);
      setMaterialCosts(jobMaterialCosts);
      
      // Combine all costs for total costs table
      const combinedCosts = [
        ...jobLaborCosts.map(cost => ({ ...cost, type: 'Labor', category: 'Labor Cost' })),
        ...jobMaterialCosts.map(cost => ({ ...cost, type: 'Material', category: 'Material Cost' }))
      ];
      
      setTotalCosts(combinedCosts);
      
      // Calculate summary statistics
      calculateSummaryStatistics(jobLaborCosts, jobMaterialCosts);
      
    } catch (err) {
      console.error("Error fetching job costs:", err);
      toast({
        title: "Error fetching costs",
        description: "Failed to fetch cost data for the selected job",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCostsLoading(false);
    }
  };

  const calculateSummaryStatistics = (laborData, materialData) => {
    let totalLaborCost = 0;
    let totalMaterialCost = 0;
    let totalWorkers = 0;
    let totalHours = 0;
    let totalMaterials = 0;
    const uniqueWorkers = new Set();

    // Calculate labor statistics
    laborData.forEach(cost => {
      totalLaborCost += parseFloat(cost.cost) || 0;
      
      if (cost.laborAssignments && Array.isArray(cost.laborAssignments)) {
        cost.laborAssignments.forEach(assignment => {
          if (assignment.labor?.id) {
            uniqueWorkers.add(assignment.labor.id);
          }
          totalHours += parseFloat(assignment.regularHours) || 0;
          totalHours += parseFloat(assignment.otHours) || 0;
        });
      }
    });

    // Calculate material statistics
    materialData.forEach(cost => {
      totalMaterialCost += parseFloat(cost.cost) || 0;
      
      if (cost.materialAssignments && Array.isArray(cost.materialAssignments)) {
        totalMaterials += cost.materialAssignments.length;
      }
    });

    const totalCost = totalLaborCost + totalMaterialCost;

    setSummary({
      totalLaborCost,
      totalMaterialCost,
      totalCost,
      totalWorkers: uniqueWorkers.size,
      totalHours,
      totalMaterials
    });
  };

  // Get unique departments and statuses for filters
  const uniqueDepartments = [...new Set(jobs.map(job => job.reqDepartment).filter(Boolean))];
  const uniqueStatuses = [...new Set(jobs.map(job => job.status).filter(Boolean))];

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        <div>
          <Heading size="lg" mb={2} color="teal.600">Job Cost Analysis</Heading>
          <Text color="gray.500" mb={4}>
            View detailed cost information for the selected job 
          </Text>
        </div>

        {/* Job Selection Section */}
        <Box bg={bg} p={{ base: 3, md: 4 }} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>Select Job</Heading>
          
          {/* Filters */}
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm">Department</FormLabel>
                <Select
                  size="sm"
                  placeholder="All Departments"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel fontSize="sm">Status</FormLabel>
                <Select
                  size="sm"
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Select Job</FormLabel>
                <Select
                  size="sm"
                  placeholder="Choose a job..."
                  value={selectedJobId}
                  onChange={(e) => handleJobSelect(e.target.value)}
                >
                  {filteredJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.jobNumber} - {job.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>
            
            {(departmentFilter || statusFilter || searchTerm || selectedJobId) && (
              <Flex justify="flex-end">
                <Button
                  size="sm"
                  leftIcon={<FiXCircle />}
                  variant="outline"
                  colorScheme="gray"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </Flex>
            )}
          </VStack>
        </Box>

        {/* Selected Job Details */}
        {selectedJob && (
          <Box bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Heading size="md" mb={4}>Job Details</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Card size="sm">
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon as={FiBriefcase} color="teal.500" />
                      <Text fontWeight="bold" fontSize="sm">Job Information</Text>
                    </HStack>
                    <Text fontSize="xs"><strong>Job Number:</strong> {selectedJob.jobNumber}</Text>
                    <Text fontSize="xs"><strong>Title:</strong> {selectedJob.title}</Text>
                    <Text fontSize="xs"><strong>Project Code:</strong> {selectedJob.projectCode}</Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card size="sm">
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon as={FiMapPin} color="blue.500" />
                      <Text fontWeight="bold" fontSize="sm">Project Details</Text>
                    </HStack>
                    <Text fontSize="xs"><strong>Department:</strong> 
                      <Badge ml={2} colorScheme={getDepartmentColor(selectedJob.reqDepartment)} size="sm">
                        {selectedJob.reqDepartment}
                      </Badge>
                    </Text>
                    <Text fontSize="xs"><strong>Status:</strong> 
                      <Badge ml={2} colorScheme={getStatusColor(selectedJob.status)} size="sm">
                        {selectedJob.status}
                      </Badge>
                    </Text>
                    <Text fontSize="xs"><strong>Assigned Officer:</strong> {selectedJob.assignOfficer || 'N/A'}</Text>
                  </VStack>
                </CardBody>
              </Card>
              
              <Card size="sm">
                <CardBody>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Icon as={FiCalendar} color="purple.500" />
                      <Text fontWeight="bold" fontSize="sm">Timeline & Budget</Text>
                    </HStack>
                    <Text fontSize="xs"><strong>Start Date:</strong> {selectedJob.startDate ? formatDate(selectedJob.startDate) : 'N/A'}</Text>
                    <Text fontSize="xs"><strong>End Date:</strong> {selectedJob.endDate ? formatDate(selectedJob.endDate) : 'N/A'}</Text>
                    <Text fontSize="xs"><strong>Budget:</strong> {selectedJob.budgetAllocation ? formatCurrency(selectedJob.budgetAllocation) : 'N/A'}</Text>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
            
            {selectedJob.description && (
              <Box mt={4}>
                <Text fontWeight="bold" fontSize="sm" mb={2}>Description:</Text>
                <Text fontSize="sm" bg="gray.50" p={3} borderRadius="md">
                  {selectedJob.description}
                </Text>
              </Box>
            )}
          </Box>
        )}

        {/* Cost Summary Cards */}
        {selectedJob && (
          <>
            {costsLoading ? (
              <Center py={10}>
                <VStack>
                  <Spinner size="xl" color="teal.500" />
                  <Text mt={4} color="gray.500">Loading cost data...</Text>
                </VStack>
              </Center>
            ) : (
              <>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                    <StatLabel fontSize="sm">Total Job Cost</StatLabel>
                    <StatNumber color="teal.500" fontSize="2xl">
                      {formatCurrency(summary.totalCost)}
                    </StatNumber>
                    <StatHelpText fontSize="xs">
                      <FiDollarSign style={{ display: 'inline' }} /> Labor + Material
                    </StatHelpText>
                  </Stat>
                  
                  <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                    <StatLabel fontSize="sm">Labor Cost</StatLabel>
                    <StatNumber color="blue.500" fontSize="2xl">
                      {formatCurrency(summary.totalLaborCost)}
                    </StatNumber>
                    <StatHelpText fontSize="xs">
                      <FiUsers style={{ display: 'inline' }} /> {summary.totalWorkers} Workers, {summary.totalHours.toFixed(1)} Hours
                    </StatHelpText>
                  </Stat>
                  
                  <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
                    <StatLabel fontSize="sm">Material Cost</StatLabel>
                    <StatNumber color="orange.500" fontSize="2xl">
                      {formatCurrency(summary.totalMaterialCost)}
                    </StatNumber>
                    <StatHelpText fontSize="xs">
                      <FiPackage style={{ display: 'inline' }} /> {summary.totalMaterials} Materials
                    </StatHelpText>
                  </Stat>
                </SimpleGrid>

                {/* Cost Distribution Chart and Table */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4} templateColumns={{ lg: "1fr 2fr" }}>
                  {/* Total Cost Table */}
                <Box bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                  <Heading size="md" mb={4}>Cost Records</Heading>
                  
                  {totalCosts.length > 0 ? (
                    <TableContainer whiteSpace="normal" overflowX="auto">
                      <Table variant="simple" size="sm" layout="fixed">
                        <Thead bg={useColorModeValue("teal.50", "gray.900")}>
                          <Tr>
                            <Th width="100px">Type</Th>
                            <Th width="120px">Date</Th>
                            <Th width="200px">Description</Th>
                            <Th isNumeric width="300px">Cost</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {totalCosts.map((cost, index) => (
                            <Tr key={`${cost.type}-${cost.id}-${index}`}>
                              <Td>
                                <Badge 
                                  colorScheme={cost.type === 'Labor' ? 'blue' : 'orange'} 
                                  size="sm"
                                >
                                  {cost.type}
                                </Badge>
                              </Td>
                              <Td fontSize="sm">{formatDate(cost.date)}</Td>
                              <Td>
                                <Tooltip label={cost.description || `${cost.type} cost record`} hasArrow placement="top">
                                  <Text noOfLines={1} fontSize="sm">
                                    {cost.description || `${cost.type} cost record`}
                                  </Text>
                                </Tooltip>
                              </Td>
                              <Td isNumeric fontWeight="bold" fontSize="sm">
                                {formatCurrency(cost.cost)}
                              </Td>
                            </Tr>
                          ))}
                          
                          {/* Summary Row */}
                          <Tr bg="teal.50">
                            <Td colSpan={3} textAlign="right" fontWeight="bold">
                              Total Job Cost:
                            </Td>
                            <Td isNumeric fontWeight="bold" fontSize="lg" color="teal.600">
                              {formatCurrency(summary.totalCost)}
                            </Td>
                            <Td></Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Center py={8}>
                      <VStack>
                        <Icon as={FiDollarSign} boxSize={8} color="gray.400" />
                        <Text color="gray.500">No cost records found for this job</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>
                  {/* Cost Distribution Pie Chart */}
                  <Box bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
                    <Heading size="md" mb={4}>Cost Distribution</Heading>
                    
                    {(summary.totalLaborCost > 0 || summary.totalMaterialCost > 0) ? (
                      <VStack spacing={4}>
                        <Box height="300px" width="100%">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  {
                                    name: 'Labor Cost',
                                    value: summary.totalLaborCost,
                                    percentage: summary.totalCost > 0 ? ((summary.totalLaborCost / summary.totalCost) * 100).toFixed(1) : 0
                                  },
                                  {
                                    name: 'Material Cost',
                                    value: summary.totalMaterialCost,
                                    percentage: summary.totalCost > 0 ? ((summary.totalMaterialCost / summary.totalCost) * 100).toFixed(1) : 0
                                  }
                                ].filter(item => item.value > 0)}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomLabel}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {[
                                  {
                                    name: 'Labor Cost',
                                    value: summary.totalLaborCost,
                                    percentage: summary.totalCost > 0 ? ((summary.totalLaborCost / summary.totalCost) * 100).toFixed(1) : 0
                                  },
                                  {
                                    name: 'Material Cost',
                                    value: summary.totalMaterialCost,
                                    percentage: summary.totalCost > 0 ? ((summary.totalMaterialCost / summary.totalCost) * 100).toFixed(1) : 0
                                  }
                                ].filter(item => item.value > 0).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<PieTooltip />} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                        
                        {/* Cost Breakdown Summary */}
                        <VStack spacing={3} align="stretch" width="100%">
                        </VStack>
                      </VStack>
                    ) : (
                      <Center py={8}>
                        <VStack>
                          <Icon as={FiDollarSign} boxSize={8} color="gray.400" />
                          <Text color="gray.500">No cost data available</Text>
                        </VStack>
                      </Center>
                    )}
                  </Box>
                </SimpleGrid>
              </>
            )}
          </>
        )}

        {/* No Job Selected Message */}
        {!selectedJob && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiBriefcase} boxSize={16} color="gray.400" />
              <Heading size="md" color="gray.500">Select a Job</Heading>
              <Text color="gray.400" textAlign="center">
                Use the filters above to find and select a job to view its cost analysis
              </Text>
            </VStack>
          </Center>
        )}

        {/* Loading State */}
        {loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Spinner size="xl" color="teal.500" />
              <Text color="gray.500">Loading jobs...</Text>
            </VStack>
          </Center>
        )}

        {/* Error State */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>
    </Box>
  );
};

export default JobCostPage;

