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
  Tooltip
} from '@chakra-ui/react';
import { 
  FiUsers, 
  FiSearch, 
  FiCalendar, 
  FiClock, 
  FiDollarSign, 
  FiEye, 
  FiFilter, 
  FiXCircle 
} from 'react-icons/fi';
import { dailyLaborCostAPI, dailyLaborAssignmentAPI } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

const LaborCostPage = () => {
  // State variables
  const [laborCosts, setLaborCosts] = useState([]);
  const [allLaborCosts, setAllLaborCosts] = useState([]);
  const [filteredLaborCosts, setFilteredLaborCosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10; // Number of records per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');
  
  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLaborCost, setSelectedLaborCost] = useState(null);
  const [laborAssignments, setLaborAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Summary statistics
  const [summary, setSummary] = useState({
    totalLaborCosts: 0,
    totalWorkers: 0,
    totalHours: 0,
    avgHourlyRate: 0
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

  const formatTimeSlot = (timeSlot) => {
    const timeSlots = {
      'morning': '8:30 AM',
      'afternoon': '12:30 PM',
      'evening': '4:30 PM'
    };
    return timeSlots[timeSlot] || timeSlot;
  };

  // Fetch labor costs when component mounts
  useEffect(() => {
    fetchLaborCosts();
  }, []);

  // Apply filters whenever filter values or allLaborCosts change
  useEffect(() => {
    applyFilters();
  }, [dateFilter, jobFilter, workerFilter, allLaborCosts]);

  const fetchLaborCosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call API to get labor costs
      const response = await dailyLaborCostAPI.getAll(1, 1000); // Get all records
      
      let allData = [];
      if (response && Array.isArray(response)) {
        allData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allData = response.data;
      } else if (response && response.data && response.data.dailyLaborCosts) {
        allData = response.data.dailyLaborCosts;
      } else if (response && response.laborCosts) {
        allData = response.laborCosts;
      }
      
      // Store all data for filtering
      setAllLaborCosts(allData);
      setFilteredLaborCosts(allData);
      
      // Calculate pagination
      const totalCount = allData.length;
      const calculatedTotalPages = Math.ceil(totalCount / recordsPerPage);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      
      // Set initial page data (first page)
      const initialPageData = allData.slice(0, recordsPerPage);
      setLaborCosts(initialPageData);
      
      // Update summary statistics
      updateSummaryStatistics(allData);
      
    } catch (err) {
      console.error("Error fetching labor costs:", err);
      setError(err.message || "Failed to fetch labor costs");
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to fetch labor costs",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allLaborCosts];

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(cost => {
        const costDate = new Date(cost.date).toISOString().split('T')[0];
        return costDate === dateFilter;
      });
    }

    // Apply job filter
    if (jobFilter) {
      const searchTerm = jobFilter.toLowerCase();
      filtered = filtered.filter(cost => {
        const jobNumber = (cost.job?.jobNumber || '').toLowerCase();
        const jobTitle = (cost.job?.title || '').toLowerCase();
        return jobNumber.includes(searchTerm) || jobTitle.includes(searchTerm);
      });
    }

    // Apply worker filter
    if (workerFilter) {
      const searchTerm = workerFilter.toLowerCase();
      filtered = filtered.filter(cost => {
        // Check if we have labor assignments
        if (cost.laborAssignments && Array.isArray(cost.laborAssignments)) {
          return cost.laborAssignments.some(assignment => {
            const workerName = `${assignment.labor?.firstName || ''} ${assignment.labor?.lastName || ''}`.toLowerCase();
            const epfNumber = (assignment.labor?.epfNumber || '').toLowerCase();
            return workerName.includes(searchTerm) || epfNumber.includes(searchTerm);
          });
        }
        return false;
      });
    }

    setFilteredLaborCosts(filtered);
    
    // Calculate total pages
    const calculatedTotalPages = Math.ceil(filtered.length / recordsPerPage);
    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    
    // Reset to page 1 when filters change and update the displayed data
    setCurrentPage(1);
    
    // Set current page data (first page of filtered results)
    const startIndex = 0;
    const endIndex = Math.min(recordsPerPage, filtered.length);
    setLaborCosts(filtered.slice(startIndex, endIndex));

    // Update summary statistics
    updateSummaryStatistics(filtered);
  };

  const clearFilters = () => {
    setDateFilter('');
    setJobFilter('');
    setWorkerFilter('');
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // Calculate the data to display for this page
    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = filteredLaborCosts.slice(startIndex, endIndex);
    
    setLaborCosts(pageData);
  };

  const updateSummaryStatistics = (data) => {
    // Calculate summary statistics from the data
    let totalLaborCosts = 0;
    let totalRegularHours = 0;
    let totalOtHours = 0;
    let totalWeekendPayCost = 0;
    const uniqueWorkers = new Set();

    data.forEach(cost => {
      totalLaborCosts += parseFloat(cost.cost) || 0;
      
      // Check if we have labor assignments
      if (cost.laborAssignments && Array.isArray(cost.laborAssignments)) {
        cost.laborAssignments.forEach(assignment => {
          if (assignment.labor?.id) {
            uniqueWorkers.add(assignment.labor.id);
          }
          totalRegularHours += parseFloat(assignment.regularHours) || 0;
          totalOtHours += parseFloat(assignment.otHours) || 0;
          totalWeekendPayCost += parseFloat(assignment.weekendPayCost) || 0;
        });
      }
    });

    const totalHours = totalRegularHours + totalOtHours;
    const avgHourlyRate = totalHours > 0 ? totalLaborCosts / totalHours : 0;

    setSummary({
      totalLaborCosts,
      totalWorkers: uniqueWorkers.size,
      totalHours,
      avgHourlyRate,
      totalWeekendPayCost
    });
  };

  // Helper functions for weekend pay
  const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isSaturday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 6;
  };

  const isSunday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 0;
  };

  const getWeekendPayLabel = (dateString) => {
    if (isSaturday(dateString)) return "Half Weekend Pay";
    if (isSunday(dateString)) return "Full Weekend Pay";
    return "Weekend Pay";
  };

  const calculateModalSummary = (assignments) => {
    if (!Array.isArray(assignments)) return { 
      totalLabors: 0, 
      totalRegularHours: 0, 
      totalOtHours: 0, 
      totalWeekendPayCost: 0,
      totalCost: 0 
    };
    
    return assignments.reduce((summary, assignment) => {
      return {
        totalLabors: summary.totalLabors + 1,
        totalRegularHours: summary.totalRegularHours + (assignment.regularHours || 0),
        totalOtHours: summary.totalOtHours + (assignment.otHours || 0),
        totalWeekendPayCost: summary.totalWeekendPayCost + (assignment.weekendPayCost || 0),
        totalCost: summary.totalCost + (assignment.totalCost || 0)
      };
    }, { 
      totalLabors: 0, 
      totalRegularHours: 0, 
      totalOtHours: 0, 
      totalWeekendPayCost: 0,
      totalCost: 0 
    });
  };

  const handleViewDetails = async (laborCost) => {
    try {
      setSelectedLaborCost(laborCost);
      setAssignmentsLoading(true);
      onOpen();
      
      // Fetch labor assignments if they are not already included
      if (!laborCost.laborAssignments) {
        const response = await dailyLaborAssignmentAPI.getByDailyLaborCostId(laborCost.id);
        let assignments = [];
        
        if (response && Array.isArray(response)) {
          assignments = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          assignments = response.data;
        } else if (response && response.data && response.data.assignments) {
          assignments = response.data.assignments;
        }
        
        setLaborAssignments(assignments);
      } else {
        setLaborAssignments(laborCost.laborAssignments);
      }
    } catch (err) {
      console.error("Error fetching labor assignments:", err);
      toast({
        title: "Error",
        description: "Failed to fetch labor assignment details",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLaborAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
    
    <VStack spacing={6} align="stretch">
      <div>
      <Heading size="lg" mb={2} color="blue.600">Labor Cost Analysis</Heading>
            <Text color="gray.500" mb={4}>
              Track and analyze all labor expenditures across projects 
            </Text>
      </div>

      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: summary.totalWeekendPayCost > 0 ? 5 : 4 }} spacing={4} mb={6}>
        <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <StatLabel fontSize="sm">Total Labor Cost</StatLabel>
          <StatNumber color="blue.500" fontSize="2xl">
            {formatCurrency(summary.totalLaborCosts)}
          </StatNumber>
          <StatHelpText fontSize="xs">
            <FiDollarSign style={{ display: 'inline' }} /> All Assignments
          </StatHelpText>
        </Stat>
        
        <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <StatLabel fontSize="sm">Total Workers</StatLabel>
          <StatNumber color="green.500" fontSize="2xl">
            {summary.totalWorkers}
          </StatNumber>
          <StatHelpText fontSize="xs">
            <FiUsers style={{ display: 'inline' }} /> Unique Workers
          </StatHelpText>
        </Stat>
        
        <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <StatLabel fontSize="sm">Total Hours</StatLabel>
          <StatNumber color="purple.500" fontSize="2xl">
            {summary.totalHours.toFixed(1)}
          </StatNumber>
          <StatHelpText fontSize="xs">
            <FiClock style={{ display: 'inline' }} /> Regular + Overtime
          </StatHelpText>
        </Stat>
        
        {summary.totalWeekendPayCost > 0 && (
          <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
            <StatLabel fontSize="sm">Weekend Pay</StatLabel>
            <StatNumber color="orange.500" fontSize="2xl">
              {formatCurrency(summary.totalWeekendPayCost)}
            </StatNumber>
            <StatHelpText fontSize="xs">
              <FiDollarSign style={{ display: 'inline' }} /> Additional Cost
            </StatHelpText>
          </Stat>
        )}
        
        <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <StatLabel fontSize="sm">Avg. Hourly Rate</StatLabel>
          <StatNumber color="teal.500" fontSize="2xl">
            {formatCurrency(summary.avgHourlyRate)}
          </StatNumber>
          <StatHelpText fontSize="xs">
            <FiDollarSign style={{ display: 'inline' }} /> Per Hour
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      {/* Filter and Pagination Controls */}
      <Box bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} mb={4}>
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align={{ base: "stretch", md: "center" }}
          gap={3}
          mb={4}
        >
          <Heading size="md">Labor Cost Records</Heading>
          
          <HStack spacing={2}>
            <InputGroup size="sm" w={{ base: "full", md: "150px" }}>
              <InputLeftElement pointerEvents="none">
                <FiCalendar color="gray.300" />
              </InputLeftElement>
              <Input 
                placeholder="Filter by date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </InputGroup>
            
            <InputGroup size="sm" w={{ base: "full", md: "180px" }}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input 
                placeholder="Filter by job"
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
              />
            </InputGroup>
            
            {(dateFilter || jobFilter || workerFilter) && (
              <IconButton
                icon={<FiXCircle />}
                size="sm"
                aria-label="Clear filters"
                colorScheme="gray"
                variant="outline"
                onClick={clearFilters}
              />
            )}
          </HStack>
        </Flex>
        
        {/* Labor Cost Table */}
        {loading ? (
          <Center py={10}>
            <VStack>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.500">Loading labor cost data...</Text>
            </VStack>
          </Center>
        ) : error ? (
          <Center py={10}>
            <VStack>
              <Icon as={FiXCircle} boxSize={10} color="red.500" />
              <Text mt={2} color="red.500" fontWeight="medium">{error}</Text>
              <Button size="sm" onClick={fetchLaborCosts} mt={4}>
                Try Again
              </Button>
            </VStack>
          </Center>
        ) : laborCosts.length > 0 ? (
          <TableContainer whiteSpace="normal" overflowX="auto">
            <Table variant="simple" size="sm" layout="fixed">
              <Thead bg={useColorModeValue("gray.50", "gray.900")}>
                <Tr>
                  <Th>Date</Th>
                  <Th width="160px">Job</Th>
                  <Th width="150px">Description</Th>
                  <Th isNumeric width="100px">Workers</Th>
                  <Th isNumeric width="100px">Regular Hours</Th>
                  <Th isNumeric width="100px">OT Hours</Th>
                  <Th isNumeric>Total Cost</Th>
                  <Th>Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {laborCosts.map((cost) => (
                  <Tr key={cost.id}>
                    <Td>{formatDate(cost.date)}</Td>
                    <Td maxW="160px">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{cost.job?.jobNumber || 'N/A'}</Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>{cost.job?.title || 'N/A'}</Text>
                      </VStack>
                    </Td>
                    <Td py={2} px={2} maxW="150px">
                      <Tooltip label={cost.description || 'No description'} hasArrow placement="top">
                        <Text noOfLines={1}>
                          {cost.description || 'No description'}
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td isNumeric width="100px">
                      <Badge colorScheme="blue">
                        {(cost.laborAssignments && cost.laborAssignments.length) || '-'}
                      </Badge>
                    </Td>
                    <Td isNumeric width="100px" px={1}>
                      {cost.laborAssignments ? 
                        cost.laborAssignments.reduce((sum, a) => sum + (parseFloat(a.regularHours) || 0), 0).toFixed(1) : 
                        '-'}
                    </Td>
                    <Td isNumeric width="100px" px={1}>
                      {cost.laborAssignments ? 
                        cost.laborAssignments.reduce((sum, a) => sum + (parseFloat(a.otHours) || 0), 0).toFixed(1) : 
                        '-'}
                    </Td>
                    <Td isNumeric fontWeight="bold">{formatCurrency(cost.cost)}</Td>
                    <Td>
                      <Button 
                        size="xs" 
                        colorScheme="blue" 
                        leftIcon={<FiEye />} 
                        onClick={() => handleViewDetails(cost)}
                      >
                        View
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        ) : (
          <Center py={10}>
            <VStack>
              <Icon as={FiUsers} boxSize={12} color="gray.400" />
              <Text mt={2} color="gray.500" fontWeight="medium">No labor cost records found</Text>
              <Text fontSize="sm" color="gray.400">
                {(dateFilter || jobFilter || workerFilter) ? 
                  "Try adjusting or clearing your filters" : 
                  "No labor cost data is available"}
              </Text>
            </VStack>
          </Center>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && filteredLaborCosts.length > 0 && (
          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify="space-between" 
            align={{ base: "stretch", md: "center" }}
            mt={4}
            gap={3}
          >
            <Text fontSize="sm" color="gray.600">
              Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, filteredLaborCosts.length)} of {filteredLaborCosts.length} records
            </Text>
            
            <HStack spacing={2}>
              <Button 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)} 
                isDisabled={currentPage === 1 || loading}
                colorScheme="blue"
                variant="outline"
              >
                Previous
              </Button>
              <Text fontSize="sm" px={2}>
                Page {currentPage} of {totalPages}
              </Text>
              <Button 
                size="sm" 
                onClick={() => handlePageChange(currentPage + 1)} 
                isDisabled={currentPage === totalPages || loading}
                colorScheme="blue"
                variant="outline"
              >
                Next
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>

      {/* Labor Assignment Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Labor Cost Details
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {assignmentsLoading ? (
              <Center py={8}>
                <Spinner size="lg" />
              </Center>
            ) : selectedLaborCost ? (
              <VStack spacing={6} align="stretch">
                {/* Job and Date Information */}
                <Box>
                  <Heading size="md" mb={4}>Cost Summary</Heading>
                  <SimpleGrid columns={{ base: 1, md: isWeekend(selectedLaborCost?.date) ? 4 : 3 }} spacing={4}>
                    <Stat>
                      <StatLabel>Job</StatLabel>
                      <StatNumber fontSize="lg">{selectedLaborCost.job?.jobNumber || 'N/A'}</StatNumber>
                      <StatHelpText>{selectedLaborCost.job?.title || 'N/A'}</StatHelpText>
                    </Stat>
                    <Stat>
                      <StatLabel>Date</StatLabel>
                      <StatNumber fontSize="lg">{formatDate(selectedLaborCost.date)}</StatNumber>
                      {isWeekend(selectedLaborCost.date) && (
                        <StatHelpText color="orange.500">
                          {isSaturday(selectedLaborCost.date) ? 'Saturday' : 'Sunday'} (Weekend)
                        </StatHelpText>
                      )}
                    </Stat>
                    {isWeekend(selectedLaborCost?.date) && (
                      <Stat>
                        <StatLabel>Weekend Pay</StatLabel>
                        <StatNumber fontSize="lg" color="orange.600">
                          {formatCurrency(calculateModalSummary(laborAssignments).totalWeekendPayCost)}
                        </StatNumber>
                        <StatHelpText>
                          {getWeekendPayLabel(selectedLaborCost.date)}
                        </StatHelpText>
                      </Stat>
                    )}
                    <Stat>
                      <StatLabel>Total Cost</StatLabel>
                      <StatNumber fontSize="lg" color="blue.600">{formatCurrency(selectedLaborCost.cost)}</StatNumber>
                    </Stat>
                  </SimpleGrid>
                  
                  {selectedLaborCost.description && (
                    <Box mt={4}>
                      <FormLabel fontWeight="medium">Description</FormLabel>
                      <Text bg="gray.50" p={3} borderRadius="md">
                        {selectedLaborCost.description}
                      </Text>
                    </Box>
                  )}
                </Box>
                
                <Divider />
                
                {/* Labor Assignments */}
                <Box>
                  <Heading size="md" mb={4}>Labor Assignments</Heading>
                  
                  {laborAssignments.length > 0 ? (
                    <TableContainer maxH="400px" overflowY="auto">
                      <Table variant="simple" size="sm">
                        <Thead position="sticky" top={0} bg="white" zIndex={1}>
                          <Tr>
                            <Th>Worker</Th>
                            <Th>EPF Number</Th>
                            <Th>Time In</Th>
                            <Th>Time Out</Th>
                            <Th isNumeric width="80px">Regular Hours</Th>
                            <Th isNumeric width="70px">OT Hours</Th>
                            <Th isNumeric>Regular Cost</Th>
                            <Th isNumeric>OT Cost</Th>
                            {isWeekend(selectedLaborCost?.date) && (
                              <Th isNumeric>
                                Additional
                                <Text fontSize="xs" color="gray.500">
                                  ({isSaturday(selectedLaborCost?.date) ? "Half" : "Full"})
                                </Text>
                              </Th>
                            )}
                            <Th isNumeric>Total Cost</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {laborAssignments.map((assignment) => (
                            <Tr key={assignment.id}>
                              <Td fontWeight="medium">
                                {assignment.labor?.firstName || ''} {assignment.labor?.lastName || ''}
                              </Td>
                              <Td>{assignment.labor?.epfNumber || 'N/A'}</Td>
                              <Td>{formatTimeSlot(assignment.timeIn)}</Td>
                              <Td>{formatTimeSlot(assignment.timeOut)}</Td>
                              <Td isNumeric width="80px" px={1}>{assignment.regularHours || 0}</Td>
                              <Td isNumeric width="70px" px={1}>{assignment.otHours || 0}</Td>
                              <Td isNumeric>{formatCurrency(assignment.regularCost || 0)}</Td>
                              <Td isNumeric>{formatCurrency(assignment.otCost || 0)}</Td>
                              {isWeekend(selectedLaborCost?.date) && (
                                <Td isNumeric>
                                  {assignment.hasWeekendPay ? (
                                    <Text fontWeight="medium" color="orange.600">
                                      {formatCurrency(assignment.weekendPayCost || 0)}
                                    </Text>
                                  ) : (
                                    <Text fontSize="xs" color="gray.400">N/A</Text>
                                  )}
                                </Td>
                              )}
                              <Td isNumeric fontWeight="bold">
                                {formatCurrency(assignment.totalCost || 0)}
                              </Td>
                            </Tr>
                          ))}
                          
                          {/* Summary Row */}
                          <Tr bg="blue.50">
                            <Td colSpan={4} textAlign="right" fontWeight="bold">
                              Total:
                            </Td>
                            <Td isNumeric fontWeight="bold" width="80px" px={1}>
                              {laborAssignments.reduce((sum, a) => sum + (parseFloat(a.regularHours) || 0), 0).toFixed(1)}
                            </Td>
                            <Td isNumeric fontWeight="bold" width="70px" px={1}>
                              {laborAssignments.reduce((sum, a) => sum + (parseFloat(a.otHours) || 0), 0).toFixed(1)}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(laborAssignments.reduce((sum, a) => sum + (parseFloat(a.regularCost) || 0), 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(laborAssignments.reduce((sum, a) => sum + (parseFloat(a.otCost) || 0), 0))}
                            </Td>
                            {isWeekend(selectedLaborCost?.date) && (
                              <Td isNumeric fontWeight="bold">
                                {formatCurrency(laborAssignments.reduce((sum, a) => sum + (parseFloat(a.weekendPayCost) || 0), 0))}
                              </Td>
                            )}
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(laborAssignments.reduce((sum, a) => sum + (parseFloat(a.totalCost) || 0), 0))}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
                      <Icon as={FiUsers} boxSize={8} color="gray.400" mb={2} />
                      <Text color="gray.500">No labor assignments found for this cost record</Text>
                    </Box>
                  )}
                </Box>
              </VStack>
            ) : (
              <Center py={8}>
                <Text color="gray.500">No data available</Text>
              </Center>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>

  </Container>
);
};

export default LaborCostPage;
