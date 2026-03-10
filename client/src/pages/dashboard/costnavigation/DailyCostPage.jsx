import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  SimpleGrid,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { FiEye, FiClock, FiDollarSign, FiPackage, FiHash } from 'react-icons/fi';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { dashboardAPI, dailyLaborAssignmentAPI, materialOrderAssignmentAPI } from '../../../api';
import DateSelector from '../../../components/DateSelector';
import CostTable from '../../../components/CostTable';
import SummaryCard from '../../../components/SummaryCard';

const DailyCostPage = () => {
  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // State variables
  const [date, setDate] = useState(today);
  const [costData, setCostData] = useState([]);
  const [totals, setTotals] = useState({
    laborCost: 0,
    materialCost: 0,
    totalCost: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state for view functionality
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCostItem, setSelectedCostItem] = useState(null);
  const [laborAssignments, setLaborAssignments] = useState([]);
  const [materialAssignments, setMaterialAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch daily cost data
  useEffect(() => {
    fetchDailyCosts();
  }, [date]); // Add date dependency to automatically fetch when date changes

  const fetchDailyCosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await dashboardAPI.getDailyCosts(date);
      setCostData(response.data || []);
      setTotals(response.totals || {
        laborCost: 0,
        materialCost: 0,
        totalCost: 0
      });

    } catch (err) {
      console.error("Error fetching daily costs:", err);
      setError("Failed to fetch cost data. Please try again.");
      toast({
        title: "Error",
        description: "Could not load cost data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = ({ date: newDate }) => {
    setDate(newDate);
    // No need for manual fetch since useEffect will handle it
  };

  const handleViewDetails = async (costItem) => {
    try {
      setSelectedCostItem(costItem);
      setAssignmentsLoading(true);
      onOpen();
      
      // Fetch labor assignments for all labor cost IDs
      let laborData = [];
      if (costItem.dailyLaborCostIds && costItem.dailyLaborCostIds.length > 0) {
        try {
          const laborPromises = costItem.dailyLaborCostIds.map(id => 
            dailyLaborAssignmentAPI.getByDailyLaborCostId(id)
          );
          const laborResponses = await Promise.all(laborPromises);
          
          laborResponses.forEach(laborResponse => {
            let responseData = [];
            if (laborResponse && Array.isArray(laborResponse)) {
              responseData = laborResponse;
            } else if (laborResponse && laborResponse.data && Array.isArray(laborResponse.data)) {
              responseData = laborResponse.data;
            } else if (laborResponse && laborResponse.assignments && Array.isArray(laborResponse.assignments)) {
              responseData = laborResponse.assignments;
            }
            
            laborData = [...laborData, ...responseData];
          });
        } catch (err) {
          console.error("Error fetching labor assignments:", err);
        }
      }
      
      // Fetch material assignments for all material order IDs
      let materialData = [];
      if (costItem.materialOrderIds && costItem.materialOrderIds.length > 0) {
        try {
          const materialPromises = costItem.materialOrderIds.map(id => 
            materialOrderAssignmentAPI.getByMaterialOrderId(id)
          );
          const materialResponses = await Promise.all(materialPromises);
          
          materialResponses.forEach(materialResponse => {
            let responseData = [];
            if (materialResponse && Array.isArray(materialResponse)) {
              responseData = materialResponse;
            } else if (materialResponse && materialResponse.data && Array.isArray(materialResponse.data)) {
              responseData = materialResponse.data;
            } else if (materialResponse && materialResponse.assignments && Array.isArray(materialResponse.assignments)) {
              responseData = materialResponse.assignments;
            }
            
            materialData = [...materialData, ...responseData];
          });
        } catch (err) {
          console.error("Error fetching material assignments:", err);
        }
      }
      
      setLaborAssignments(laborData);
      setMaterialAssignments(materialData);
    } catch (err) {
      console.error("Error fetching assignment details:", err);
      toast({
        title: "Error",
        description: "Failed to fetch assignment details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatTimeSlot = (timeSlot) => {
    const timeSlots = {
      morning: "8:30 AM",
      afternoon: "12:30 PM",
      evening: "4:30 PM"
    };
    return timeSlots[timeSlot] || timeSlot;
  };

  const getWorkingHours = (timeIn, timeOut) => {
    if (timeIn === "morning" && timeOut === "evening") return "8 hours";
    if (timeIn === "morning" && timeOut === "afternoon") return "4 hours";
    if (timeIn === "afternoon" && timeOut === "evening") return "4 hours";
    return "Unknown";
  };

  const calculateLaborSummary = (assignments) => {
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
        totalRegularHours: summary.totalRegularHours + (assignment.hoursWorked || assignment.regularHours || 0),
        totalOtHours: summary.totalOtHours + (assignment.overtimeHours || assignment.otHours || 0),
        totalWeekendPayCost: summary.totalWeekendPayCost + (assignment.weekendPayCost || 0),
        totalCost: summary.totalCost + (assignment.totalAmount || assignment.totalCost || 0)
      };
    }, { totalLabors: 0, totalRegularHours: 0, totalOtHours: 0, totalWeekendPayCost: 0, totalCost: 0 });
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

  const calculateMaterialSummary = (assignments) => {
    if (!Array.isArray(assignments)) return { totalMaterials: 0, totalQuantity: 0, totalCost: 0 };
    
    return assignments.reduce((summary, assignment) => {
      return {
        totalMaterials: summary.totalMaterials + 1,
        totalQuantity: summary.totalQuantity + (assignment.quantityUsed || assignment.quantity || 0),
        totalCost: summary.totalCost + (assignment.totalAmount || assignment.totalPrice || 0)
      };
    }, { totalMaterials: 0, totalQuantity: 0, totalCost: 0 });
  };

  // Prepare pie chart data
  const preparePieChartData = (costType) => {
    if (!Array.isArray(costData) || costData.length === 0) return [];
    
    return costData
      .map(item => {
        const jobNumber = item.jobNumber || item.job?.jobNumber || 'N/A';
        const jobTitle = item.title || item.job?.title || 'N/A';
        const displayName = jobTitle !== 'N/A' ? `${jobTitle} (${jobNumber})` : jobNumber;
        
        return {
          name: displayName,
          value: costType === 'labor' ? (item.laborCost || 0) :
                 costType === 'material' ? (item.materialCost || 0) :
                 (item.laborCost || 0) + (item.materialCost || 0),
          jobTitle: jobTitle,
          jobNumber: jobNumber
        };
      })
      .filter(item => item.value > 0); // Only include jobs with cost > 0
  };

  // Color palette for pie charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#FFC658', '#8DD1E1', '#D084D0', '#FFB347',
    '#87CEEB', '#DDA0DD', '#98FB98', '#F0E68C', '#FF6347'
  ];

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

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>

      {/* Page Header */}
      <Heading size="lg" mb={2} color="cyan.600" >Daily Cost Overview</Heading>
      <Text color="gray.500" mb={4}>
        View cost breakdown for {date}
      </Text>

      {/* Date Selector */}
      <Box mb={4} w={{ base: "100%", sm: "350px" }}>
        <DateSelector
          mode="daily"
          date={date}
          onChange={handleDateChange}
        />
      </Box>

      {/* Cost Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }} mb={4}>
        <SummaryCard 
          title="Labor Cost" 
          amount={totals.laborCost} 
          type="labor" 
          period="daily" 
        />
        
        <SummaryCard 
          title="Material Cost" 
          amount={totals.materialCost} 
          type="material" 
          period="daily" 
        />
        
        <SummaryCard 
          title="Total Cost" 
          amount={totals.totalCost} 
          type="total" 
          period="daily" 
        />
      </SimpleGrid>

      {/* Cost Table */}
      <CostTable 
        data={costData}
        mode="daily"
        isLoading={isLoading}
        error={error}
        totals={totals}
        onView={handleViewDetails}
      />

      {/* Cost Distribution Pie Charts */}
      {costData.length > 0 && (
        <Box mt={8}>
          <Heading size="md" mb={2} >
            Daily Cost Distribution by Jobs
          </Heading>
          <Text color="gray.500" mb={6} >
            Visual breakdown of how costs are distributed across different jobs for {date}
          </Text>

          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
            {/* Labor Cost Distribution Pie Chart */}
            <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={6}>
              <VStack spacing={4}>
                <Heading size="md" color="blue.600" textAlign="center">
                  Labor Cost Distribution
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Total: {formatCurrency(totals.laborCost)}
                </Text>
                <Box h="450px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePieChartData('labor')}
                        cx="50%"
                        cy="35%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePieChartData('labor').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={150}
                        wrapperStyle={{
                          paddingTop: '1px',
                          fontSize: '12px',
                          lineHeight: '16px'
                        }}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontSize: '12px' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </VStack>
            </Box>

            {/* Material Cost Distribution Pie Chart */}
            <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={6}>
              <VStack spacing={4}>
                <Heading size="md" color="green.600" textAlign="center">
                  Material Cost Distribution
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Total: {formatCurrency(totals.materialCost)}
                </Text>
                <Box h="450px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePieChartData('material')}
                        cx="50%"
                        cy="35%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePieChartData('material').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={150}
                        wrapperStyle={{
                          paddingTop: '1px',
                          fontSize: '12px',
                          lineHeight: '16px'
                        }}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontSize: '12px' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </VStack>
            </Box>

            {/* Total Cost Distribution Pie Chart */}
            <Box bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={6}>
              <VStack spacing={4}>
                <Heading size="md" color="purple.600" textAlign="center">
                  Total Cost Distribution
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Total: {formatCurrency(totals.totalCost)}
                </Text>
                <Box h="450px" w="100%">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={preparePieChartData('total')}
                        cx="50%"
                        cy="35%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {preparePieChartData('total').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={150}
                        wrapperStyle={{
                          paddingTop: '1px',
                          fontSize: '12px',
                          lineHeight: '16px'
                        }}
                        formatter={(value, entry) => (
                          <span style={{ color: entry.color, fontSize: '12px' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </VStack>
            </Box>
          </SimpleGrid>
        </Box>
      )}

      {/* No Data Message for Charts */}
      {costData.length === 0 && !isLoading && (
        <Box mt={8} textAlign="center" py={8}>
          <Alert status="info" maxW="md" mx="auto">
            <AlertIcon />
            <VStack spacing={2} align="start">
              <Text fontWeight="medium">No cost data available for charts</Text>
              <Text fontSize="sm">
                Select a date with cost data to view the distribution charts.
              </Text>
            </VStack>
          </Alert>
        </Box>
      )}

      {/* View Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Daily Cost Details - {selectedCostItem?.jobNumber || selectedCostItem?.job?.jobNumber || 'N/A'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {assignmentsLoading ? (
              <Center py={8}>
                <Spinner size="lg" />
              </Center>
            ) : (
              <VStack spacing={6} align="stretch">
                {/* Job Summary */}
                {selectedCostItem && (
                  <Box>
                    <Heading size="md" mb={4}>Job Summary</Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Stat>
                        <StatLabel>Job Number</StatLabel>
                        <StatNumber fontSize="lg">{selectedCostItem.jobNumber || selectedCostItem.job?.jobNumber || 'N/A'}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Job Title</StatLabel>
                        <StatNumber fontSize="lg">{selectedCostItem.title || selectedCostItem.job?.title || 'N/A'}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Date</StatLabel>
                        <StatNumber fontSize="lg">{date}</StatNumber>
                        {isWeekend(date) && (
                          <StatHelpText color="orange.500">
                            {isSaturday(date) ? 'Saturday' : 'Sunday'} (Weekend)
                          </StatHelpText>
                        )}
                      </Stat>
                    </SimpleGrid>
                    
                    <SimpleGrid columns={{ base: 1, md: isWeekend(date) && calculateLaborSummary(laborAssignments).totalWeekendPayCost > 0 ? 4 : 3 }} spacing={4} mt={4}>
                      <Stat>
                        <StatLabel>Labor Cost</StatLabel>
                        <StatNumber color="blue.600">Rs. {(selectedCostItem.laborCost || 0).toFixed(2)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel>Material Cost</StatLabel>
                        <StatNumber color="green.600">Rs. {(selectedCostItem.materialCost || 0).toFixed(2)}</StatNumber>
                      </Stat>
                      {isWeekend(date) && calculateLaborSummary(laborAssignments).totalWeekendPayCost > 0 && (
                        <Stat>
                          <StatLabel>Weekend Pay</StatLabel>
                          <StatNumber color="orange.600">Rs. {calculateLaborSummary(laborAssignments).totalWeekendPayCost.toFixed(2)}</StatNumber>
                          <StatHelpText>{getWeekendPayLabel(date)}</StatHelpText>
                        </Stat>
                      )}
                      <Stat>
                        <StatLabel>Total Cost</StatLabel>
                        <StatNumber color="purple.600">Rs. {((selectedCostItem.laborCost || 0) + (selectedCostItem.materialCost || 0)).toFixed(2)}</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </Box>
                )}

                <Divider />

                {/* Labor Assignments */}
                <Box>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Labor Assignments</Heading>
                    <Badge colorScheme="blue" variant="subtle">
                      {laborAssignments.length} Assignments
                    </Badge>
                  </HStack>

                  {/* Summary Cards */}
                  {laborAssignments.length > 0 && (
                    <SimpleGrid columns={{ base: 2, md: isWeekend(date) ? 5 : 4 }} spacing={2} bg="gray.50" p={2} borderRadius="md" mb={4}>
                      <Stat size="sm" p={1}>
                        <StatLabel fontSize="xs">Total Workers</StatLabel>
                        <StatNumber fontSize="lg">{calculateLaborSummary(laborAssignments).totalLabors}</StatNumber>
                        <StatHelpText fontSize="xs" mt={0}>
                          <FiEye style={{ display: 'inline', marginRight: '2px' }} />
                          Assigned
                        </StatHelpText>
                      </Stat>
                      <Stat size="sm" p={1}>
                        <StatLabel fontSize="xs">Regular Hours</StatLabel>
                        <StatNumber fontSize="lg">{calculateLaborSummary(laborAssignments).totalRegularHours}</StatNumber>
                        <StatHelpText fontSize="xs" mt={0}>
                          <FiClock style={{ display: 'inline', marginRight: '2px' }} />
                          Total
                        </StatHelpText>
                      </Stat>
                      <Stat size="sm" p={1}>
                        <StatLabel fontSize="xs">OT Hours</StatLabel>
                        <StatNumber fontSize="lg">{calculateLaborSummary(laborAssignments).totalOtHours}</StatNumber>
                        <StatHelpText fontSize="xs" mt={0}>
                          <FiClock style={{ display: 'inline', marginRight: '2px' }} />
                          Overtime
                        </StatHelpText>
                      </Stat>
                      {isWeekend(date) && (
                        <Stat size="sm" p={1}>
                          <StatLabel fontSize="xs">Weekend Pay</StatLabel>
                          <StatNumber fontSize="lg">{formatCurrency(calculateLaborSummary(laborAssignments).totalWeekendPayCost)}</StatNumber>
                          <StatHelpText fontSize="xs" mt={0}>
                            <FiDollarSign style={{ display: 'inline', marginRight: '2px' }} />
                            {getWeekendPayLabel(date)}
                          </StatHelpText>
                        </Stat>
                      )}
                      <Stat size="sm" p={1}>
                        <StatLabel fontSize="xs">Total Cost</StatLabel>
                        <StatNumber fontSize="lg">{formatCurrency(calculateLaborSummary(laborAssignments).totalCost)}</StatNumber>
                        <StatHelpText fontSize="xs" mt={0}>
                          <FiDollarSign style={{ display: 'inline', marginRight: '2px' }} />
                          Calculated
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  )}
                  
                  {laborAssignments.length > 0 ? (
                    <Box>
                      <Heading size="xs" mb={2}>Labor Assignments</Heading>
                      <TableContainer whiteSpace="normal" maxH="400px" overflowY="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                        <Table variant="simple" size="xs" colorScheme="blue" layout="fixed">
                          <Thead position="sticky" top={0} bg="white" zIndex={1}>
                            <Tr>
                              <Th py={1} px={1} fontSize="xs">EPF No.</Th>
                              <Th py={1} px={1} fontSize="xs">Worker Name</Th>
                              <Th py={1} px={1} fontSize="xs">Trade</Th>
                              <Th py={1} px={1} fontSize="xs">Time In</Th>
                              <Th py={1} px={1} fontSize="xs">Time Out</Th>
                              <Th py={1} px={1} fontSize="xs">Hours</Th>
                              <Th py={1} px={1} fontSize="xs">OT Hrs</Th>
                              <Th py={1} px={1} fontSize="xs">Reg. Cost</Th>
                              <Th py={1} px={1} fontSize="xs">OT Cost</Th>
                              {isWeekend(date) && (
                                <Th py={1} px={1} fontSize="xs">
                                  Additional
                                  <Text fontSize="2xs" color="gray.500">
                                    ({isSaturday(date) ? "Half" : "Full"})
                                  </Text>
                                </Th>
                              )}
                              <Th py={1} px={1} fontSize="xs">Total Cost</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {laborAssignments.map((assignment, index) => (
                              <Tr key={assignment.id || index}>
                                <Td py={1} px={1} fontWeight="medium">{assignment.labor?.epfNumber || assignment.epfNumber || 'N/A'}</Td>
                                <Td py={1} px={1}>{assignment.labor?.firstName} {assignment.labor?.lastName}</Td>
                                <Td py={1} px={1}>
                                  <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                                    {assignment.labor?.trade || assignment.designation || 'N/A'}
                                  </Badge>
                                </Td>
                                <Td py={1} px={1} fontSize="sm">{formatTimeSlot(assignment.timeIn)}</Td>
                                <Td py={1} px={1} fontSize="sm">{formatTimeSlot(assignment.timeOut)}</Td>
                                <Td py={1} px={1} fontSize="sm">{getWorkingHours(assignment.timeIn, assignment.timeOut)}</Td>
                                <Td py={1} px={1} fontSize="sm">{assignment.overtimeHours || assignment.otHours || 0}</Td>
                                <Td py={1} px={1} fontSize="sm">{formatCurrency(assignment.regularCost || 0)}</Td>
                                <Td py={1} px={1} fontSize="sm">{formatCurrency(assignment.otCost || 0)}</Td>
                                {isWeekend(date) && (
                                  <Td py={1} px={1} fontSize="sm">
                                    {assignment.hasWeekendPay ? (
                                      <Text fontWeight="medium" color="orange.600">
                                        {formatCurrency(assignment.weekendPayCost || 0)}
                                      </Text>
                                    ) : (
                                      <Text fontSize="xs" color="gray.400">N/A</Text>
                                    )}
                                  </Td>
                                )}
                                <Td py={1} px={1} fontWeight="bold" fontSize="sm">{formatCurrency(assignment.totalAmount || assignment.totalCost || 0)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                      <VStack spacing={2}>
                        <Heading size="xs" color="gray.500">No labor assignments found</Heading>
                        <Text fontSize="sm" color="gray.400">
                          This job doesn't have detailed labor assignments for this date.
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          This might be an older record created before the assignment tracking was implemented.
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </Box>

                <Divider />

                {/* Material Assignments */}
                <Box>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Material Assignments</Heading>
                    <Badge colorScheme="green" variant="subtle">
                      {materialAssignments.length} Assignments
                    </Badge>
                  </HStack>

                  {/* Summary Cards */}
                  {materialAssignments.length > 0 && (
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2} bg="gray.50" p={2} borderRadius="md" mb={4}>
                      <Stat size="sm" p={1}>
                        <StatLabel fontSize="xs">Total Materials</StatLabel>
                        <StatNumber fontSize="lg">{calculateMaterialSummary(materialAssignments).totalMaterials}</StatNumber>
                        <StatHelpText fontSize="xs" mt={0}>
                          <FiPackage style={{ display: 'inline', marginRight: '2px' }} />
                          Items
                        </StatHelpText>
                      </Stat>
                      <Stat size="sm" p={1}>
                        <StatLabel fontSize="xs">Total Quantity</StatLabel>
                        <StatNumber fontSize="lg">{calculateMaterialSummary(materialAssignments).totalQuantity.toFixed(2)}</StatNumber>
                        <StatHelpText fontSize="xs" mt={0}>
                          <FiHash style={{ display: 'inline', marginRight: '2px' }} />
                          Units
                        </StatHelpText>
                      </Stat>
                      <Stat size="sm" p={1}>
                        <StatLabel fontSize="xs">Total Cost</StatLabel>
                        <StatNumber fontSize="lg">{formatCurrency(calculateMaterialSummary(materialAssignments).totalCost)}</StatNumber>
                        <StatHelpText fontSize="xs" mt={0}>
                          <FiDollarSign style={{ display: 'inline', marginRight: '2px' }} />
                          Calculated
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  )}
                  
                  {materialAssignments.length > 0 ? (
                    <Box>
                      <Heading size="xs" mb={2}>Material Assignments</Heading>
                      <TableContainer whiteSpace="normal" maxH="400px" overflowY="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                        <Table variant="simple" size="xs" colorScheme="green" layout="fixed">
                          <Thead position="sticky" top={0} bg="white" zIndex={1}>
                            <Tr>
                              <Th py={1} px={1} fontSize="xs">Material Name</Th>
                              <Th py={1} px={1} fontSize="xs">Material Code</Th>
                              <Th py={1} px={1} fontSize="xs">Description</Th>
                              <Th py={1} px={1} fontSize="xs">UOM</Th>
                              <Th py={1} px={1} fontSize="xs">Unit Price</Th>
                              <Th py={1} px={1} fontSize="xs">Quantity</Th>
                              <Th py={1} px={1} fontSize="xs">Total Price</Th>
                              <Th py={1} px={1} fontSize="xs">Usage Date</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {materialAssignments.map((assignment, index) => (
                              <Tr key={assignment.id || index}>
                                <Td py={1} px={1} fontWeight="medium">{assignment.material?.name || assignment.materialName || 'N/A'}</Td>
                                <Td py={1} px={1}>{assignment.material?.materialCode || assignment.materialCode || 'N/A'}</Td>
                                <Td py={1} px={1} fontSize="sm">{assignment.material?.description || 'N/A'}</Td>
                                <Td py={1} px={1}>
                                  <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                                    {assignment.material?.unit || assignment.material?.uom || assignment.unit || 'N/A'}
                                  </Badge>
                                </Td>
                                <Td py={1} px={1} fontSize="sm">{formatCurrency(assignment.unitPrice || 0)}</Td>
                                <Td py={1} px={1} fontSize="sm">{assignment.quantityUsed || assignment.quantity || 0}</Td>
                                <Td py={1} px={1} fontWeight="bold" fontSize="sm">{formatCurrency(assignment.totalAmount || assignment.totalPrice || 0)}</Td>
                                <Td py={1} px={1} fontSize="sm">{assignment.usageDate ? new Date(assignment.usageDate).toLocaleDateString() : 'N/A'}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                      <VStack spacing={2}>
                        <Heading size="xs" color="gray.500">No material assignments found</Heading>
                        <Text fontSize="sm" color="gray.400">
                          This job doesn't have detailed material assignments for this date.
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          This might be an older record created before the assignment tracking was implemented.
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DailyCostPage;
