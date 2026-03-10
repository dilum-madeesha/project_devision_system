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
  FiPackage, 
  FiSearch, 
  FiCalendar, 
  FiHash, 
  FiDollarSign, 
  FiEye, 
  FiFilter, 
  FiXCircle 
} from 'react-icons/fi';
import { materialOrderAPI, materialOrderAssignmentAPI } from '../../../api';
import { useAuth } from '../../../contexts/AuthContext';

const MaterialCostPage = () => {
  // State variables
  const [materialCosts, setMaterialCosts] = useState([]);
  const [allMaterialCosts, setAllMaterialCosts] = useState([]);
  const [filteredMaterialCosts, setFilteredMaterialCosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10; // Number of records per page
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMaterialOrder, setSelectedMaterialOrder] = useState(null);
  const [materialAssignments, setMaterialAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Summary statistics
  const [summary, setSummary] = useState({
    totalMaterialCosts: 0,
    totalOrders: 0,
    totalMaterials: 0,
    avgOrderValue: 0
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

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: "orange",
      APPROVED: "blue",
      ORDERED: "purple",
      RECEIVED: "green",
      CANCELLED: "red"
    };
    return statusColors[status] || "gray";
  };

  const getTypeColor = (type) => {
    const typeColors = {
      MR: "blue",
      PR: "purple",
      PO: "teal",
      STORE: "green",
      OTHER: "orange"
    };
    return typeColors[type] || "gray";
  };

  // Fetch material costs when component mounts
  useEffect(() => {
    fetchMaterialCosts();
  }, []);

  // Apply filters whenever filter values or allMaterialCosts change
  useEffect(() => {
    applyFilters();
  }, [dateFilter, jobFilter, typeFilter, allMaterialCosts]);
  const fetchMaterialCosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call API to get material costs
      const response = await materialOrderAPI.getAll(1, 1000); // Get all records
      
      let allData = [];
      if (response && Array.isArray(response)) {
        allData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allData = response.data;
      } else if (response && response.data && response.data.materialOrders) {
        allData = response.data.materialOrders;
      } else if (response && response.materialOrders) {
        allData = response.materialOrders;
      }
      
      // Store all data for filtering
      setAllMaterialCosts(allData);
      setFilteredMaterialCosts(allData);
      
      // Calculate pagination
      const totalCount = allData.length;
      const calculatedTotalPages = Math.ceil(totalCount / recordsPerPage);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      
      // Set initial page data (first page)
      const initialPageData = allData.slice(0, recordsPerPage);
      setMaterialCosts(initialPageData);
      
      // Update summary statistics
      updateSummaryStatistics(allData);
      
    } catch (err) {
      console.error("Error fetching material costs:", err);
      setError(err.message || "Failed to fetch material costs");
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to fetch material costs",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allMaterialCosts];

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(material => {
        const materialDate = new Date(material.date).toISOString().split('T')[0];
        return materialDate === dateFilter;
      });
    }

    // Apply job filter
    if (jobFilter) {
      const searchTerm = jobFilter.toLowerCase();
      filtered = filtered.filter(material => {
        const jobNumber = (material.job?.jobNumber || '').toLowerCase();
        const jobTitle = (material.job?.title || '').toLowerCase();
        return jobNumber.includes(searchTerm) || jobTitle.includes(searchTerm);
      });
    }

    // Apply type filter
    if (typeFilter) {
      filtered = filtered.filter(material => {
        return material.type === typeFilter;
      });
    }

    setFilteredMaterialCosts(filtered);
    
    // Calculate total pages
    const calculatedTotalPages = Math.ceil(filtered.length / recordsPerPage);
    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
    
    // Reset to page 1 when filters change and update the displayed data
    setCurrentPage(1);
    
    // Set current page data (first page of filtered results)
    const startIndex = 0;
    const endIndex = Math.min(recordsPerPage, filtered.length);
    setMaterialCosts(filtered.slice(startIndex, endIndex));

    // Update summary statistics
    updateSummaryStatistics(filtered);
  };

  const clearFilters = () => {
    setDateFilter('');
    setJobFilter('');
    setTypeFilter('');
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // Calculate the data to display for this page
    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = filteredMaterialCosts.slice(startIndex, endIndex);
    
    setMaterialCosts(pageData);
  };

  const updateSummaryStatistics = (data) => {
    // Calculate summary statistics from the data
    let totalMaterialCosts = 0;
    let totalMaterials = 0;

    data.forEach(material => {
      totalMaterialCosts += parseFloat(material.cost) || 0;
      
      // Count materials from assignments if available
      if (material.materialAssignments && Array.isArray(material.materialAssignments)) {
        totalMaterials += material.materialAssignments.length;
      }
    });

    const totalOrders = data.length;
    const avgOrderValue = totalOrders > 0 ? totalMaterialCosts / totalOrders : 0;

    setSummary({
      totalMaterialCosts,
      totalOrders,
      totalMaterials,
      avgOrderValue
    });
  };

  const handleViewDetails = async (materialOrder) => {
    try {
      setSelectedMaterialOrder(materialOrder);
      setAssignmentsLoading(true);
      onOpen();
      
      // Fetch material assignments
      const response = await materialOrderAssignmentAPI.getByMaterialOrderId(materialOrder.id);
      let assignments = [];
      
      if (response && Array.isArray(response)) {
        assignments = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        assignments = response.data;
      } else if (response && response.data && response.data.assignments) {
        assignments = response.data.assignments;
      }
      
      setMaterialAssignments(assignments);
    } catch (err) {
      console.error("Error fetching material assignments:", err);
      toast({
        title: "Error",
        description: "Failed to fetch material assignment details",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setMaterialAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={6}>
    
    <VStack spacing={6} align="stretch">
      <div>
      <Heading size="lg" mb={2} color="orange.600">Material Cost Analysis</Heading>
            <Text color="gray.500" mb={4}>
              Track and analyze all material expenditures across projects 
            </Text>
      </div>
      {/* Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
        <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <StatLabel fontSize="sm">Total Material Cost</StatLabel>
          <StatNumber color="orange.500" fontSize="2xl">
            {formatCurrency(summary.totalMaterialCosts)}
          </StatNumber>
          <StatHelpText fontSize="xs">
            <FiDollarSign style={{ display: 'inline' }} /> All Orders
          </StatHelpText>
        </Stat>
        
        <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <StatLabel fontSize="sm">Total Orders</StatLabel>
          <StatNumber color="blue.500" fontSize="2xl">
            {summary.totalOrders}
          </StatNumber>
          <StatHelpText fontSize="xs">
            <FiPackage style={{ display: 'inline' }} /> Material Orders
          </StatHelpText>
        </Stat>
        
        <Stat bg={bg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="sm">
          <StatLabel fontSize="sm">Avg. Order Value</StatLabel>
          <StatNumber color="purple.500" fontSize="2xl">
            {formatCurrency(summary.avgOrderValue)}
          </StatNumber>
          <StatHelpText fontSize="xs">
            <FiDollarSign style={{ display: 'inline' }} /> Per Order
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
          <Heading size="md">Material Cost Records</Heading>
          
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
            
            <Input 
              as="select"
              size="sm"
              w={{ base: "full", md: "120px" }}
              placeholder="Filter by type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="MR">MR</option>
              <option value="PR">PR</option>
              <option value="PO">PO</option>
              <option value="STORE">STORE</option>
              <option value="OTHER">OTHER</option>
            </Input>
            
            {(dateFilter || jobFilter || typeFilter) && (
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
        
        {/* Material Cost Table */}
        {loading ? (
          <Center py={10}>
            <VStack>
              <Spinner size="xl" color="orange.500" />
              <Text mt={4} color="gray.500">Loading material cost data...</Text>
            </VStack>
          </Center>
        ) : error ? (
          <Center py={10}>
            <VStack>
              <Icon as={FiXCircle} boxSize={10} color="red.500" />
              <Text mt={2} color="red.500" fontWeight="medium">{error}</Text>
              <Button size="sm" onClick={fetchMaterialCosts} mt={4}>
                Try Again
              </Button>
            </VStack>
          </Center>
        ) : materialCosts.length > 0 ? (
          <TableContainer whiteSpace="normal" overflowX="auto">
            <Table variant="simple" size="sm" layout="fixed">
              <Thead bg={useColorModeValue("orange.50", "gray.900")}>
                <Tr>
                  <Th width="100px">Date</Th>
                  <Th width="120px">Job</Th>
                  <Th width="60px">Type</Th>
                  <Th width="100px">Order Number</Th>
                  <Th width="120px">Description</Th>
                  <Th isNumeric width="100px">Cost</Th>
                  <Th width="80px">Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {materialCosts.map((material) => (
                  <Tr key={material.id}>
                    <Td py={2} px={2} maxW="100px">
                      <Text fontSize="sm">{formatDate(material.date)}</Text>
                    </Td>
                    <Td py={2} px={2} maxW="120px">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" fontSize="xs" noOfLines={1}>{material.job?.jobNumber || 'N/A'}</Text>
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>{material.job?.title || 'N/A'}</Text>
                      </VStack>
                    </Td>
                    <Td py={2} px={1}>
                      <Badge colorScheme={getTypeColor(material.type)} size="sm" fontSize="xs">
                        {material.type || 'N/A'}
                      </Badge>
                    </Td>
                    <Td py={2} px={2} maxW="100px">
                      <Tooltip label={material.code || 'No order number'} hasArrow placement="top">
                        <Text noOfLines={1} fontWeight="medium" fontSize="xs">
                          {material.code || 'N/A'}
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td py={2} px={2} maxW="120px">
                      <Tooltip label={material.description || 'No description'} hasArrow placement="top">
                        <Text noOfLines={1} fontSize="xs">
                          {material.description || 'No description'}
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td isNumeric py={2} px={2} fontWeight="bold" fontSize="sm">{formatCurrency(material.cost)}</Td>
                    <Td py={2} px={1}>
                      <Button 
                        size="xs" 
                        colorScheme="orange" 
                        leftIcon={<FiEye />} 
                        onClick={() => handleViewDetails(material)}
                        fontSize="xs"
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
              <Icon as={FiPackage} boxSize={12} color="gray.400" />
              <Text mt={2} color="gray.500" fontWeight="medium">No material cost records found</Text>
              <Text fontSize="sm" color="gray.400">
                {(dateFilter || jobFilter || typeFilter) ? 
                  "Try adjusting or clearing your filters" : 
                  "No material cost data is available"}
              </Text>
            </VStack>
          </Center>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && filteredMaterialCosts.length > 0 && (
          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify="space-between" 
            align={{ base: "stretch", md: "center" }}
            mt={4}
            gap={3}
          >
            <Text fontSize="sm" color="gray.600">
              Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, filteredMaterialCosts.length)} of {filteredMaterialCosts.length} records
            </Text>
            
            <HStack spacing={2}>
              <Button 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)} 
                isDisabled={currentPage === 1 || loading}
                colorScheme="orange"
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
                colorScheme="orange"
                variant="outline"
              >
                Next
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>

      {/* Material Assignment Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Material Order Details
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {assignmentsLoading ? (
              <Center py={8}>
                <Spinner size="lg" />
              </Center>
            ) : selectedMaterialOrder ? (
              <VStack spacing={4} align="stretch">
                {/* Order Information */}
                <Box>
                  <Heading size="sm" mb={3}>Order Summary</Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                    <Stat size="sm">
                      <StatLabel fontSize="xs">Job</StatLabel>
                      <StatNumber fontSize="md">{selectedMaterialOrder.job?.jobNumber || 'N/A'}</StatNumber>
                      <StatHelpText fontSize="xs" mt={0}>{selectedMaterialOrder.job?.title || 'N/A'}</StatHelpText>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel fontSize="xs">Date</StatLabel>
                      <StatNumber fontSize="md">{formatDate(selectedMaterialOrder.date)}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel fontSize="xs">Total Cost</StatLabel>
                      <StatNumber fontSize="md" color="orange.600">{formatCurrency(selectedMaterialOrder.cost)}</StatNumber>
                    </Stat>
                  </SimpleGrid>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} mt={3}>
                    <Box>
                      <FormLabel fontSize="xs" fontWeight="medium" mb={1}>Order Number</FormLabel>
                      <Text bg="gray.50" p={2} borderRadius="md" fontSize="sm">
                        {selectedMaterialOrder.code}
                      </Text>
                    </Box>
                    <Box>
                      <FormLabel fontSize="xs" fontWeight="medium" mb={1}>Type</FormLabel>
                      <Badge colorScheme={getTypeColor(selectedMaterialOrder.type)} size="sm">
                        {selectedMaterialOrder.type}
                      </Badge>
                    </Box>
                  </SimpleGrid>
                  
                  {selectedMaterialOrder.description && (
                    <Box mt={3}>
                      <FormLabel fontSize="xs" fontWeight="medium" mb={1}>Description</FormLabel>
                      <Text bg="gray.50" p={2} borderRadius="md" fontSize="sm">
                        {selectedMaterialOrder.description}
                      </Text>
                    </Box>
                  )}
                </Box>
                
                <Divider />
                
                {/* Material Assignments */}
                <Box>
                  <Heading size="sm" mb={3}>Material Assignments</Heading>
                  
                  {materialAssignments.length > 0 ? (
                    <TableContainer maxH="400px" overflowY="auto">
                      <Table variant="simple" size="sm">
                        <Thead position="sticky" top={0} bg="white" zIndex={1}>
                          <Tr>
                            <Th>Material Name</Th>
                            <Th>Description</Th>
                            <Th>UOM</Th>
                            <Th isNumeric>Unit Price</Th>
                            <Th isNumeric>Quantity</Th>
                            <Th isNumeric>Total Price</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {materialAssignments.map((assignment) => (
                            <Tr key={assignment.id}>
                              <Td fontWeight="medium">
                                {assignment.material?.name || 'N/A'}
                              </Td>
                              <Td>{assignment.material?.description || 'N/A'}</Td>
                              <Td>
                                <Badge colorScheme="blue" variant="subtle">
                                  {assignment.material?.uom || 'N/A'}
                                </Badge>
                              </Td>
                              <Td isNumeric>{formatCurrency(assignment.unitPrice || 0)}</Td>
                              <Td isNumeric>{assignment.quantity || 0}</Td>
                              <Td isNumeric fontWeight="bold">
                                {formatCurrency(assignment.totalPrice || 0)}
                              </Td>
                            </Tr>
                          ))}
                          
                          {/* Summary Row */}
                          <Tr bg="orange.50">
                            <Td colSpan={4} textAlign="right" fontWeight="bold">
                              Total:
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {materialAssignments.reduce((sum, a) => sum + (parseFloat(a.quantity) || 0), 0).toFixed(2)}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(materialAssignments.reduce((sum, a) => sum + (parseFloat(a.totalPrice) || 0), 0))}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box textAlign="center" py={8} bg="gray.50" borderRadius="md">
                      <Icon as={FiPackage} boxSize={8} color="gray.400" mb={2} />
                      <Text color="gray.500">No material assignments found for this order</Text>
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
            <Button colorScheme="orange" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>

  </Container>
);
};

export default MaterialCostPage;
