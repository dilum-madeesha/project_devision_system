import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Container,
  useToast,
  SimpleGrid,
  useColorModeValue,
  VStack,
  Flex,
  HStack,
  Button,
  Spinner
} from '@chakra-ui/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { dashboardAPI } from '../../../api';
import DateSelector from '../../../components/DateSelector';
import CostTable from '../../../components/CostTable';
import SummaryCard from '../../../components/SummaryCard';

const YearlyCostPage = () => {
  // Get current year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // State variables
  const [year, setYear] = useState(currentYear.toString());
  const [costData, setCostData] = useState([]);
  const [allCostData, setAllCostData] = useState([]); // Store all data for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10; // Number of records per page
  const [totals, setTotals] = useState({
    laborCost: 0,
    materialCost: 0,
    totalCost: 0
  });
  const [period, setPeriod] = useState({
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
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

  // Prepare pie chart data
  const preparePieChartData = (type) => {
    if (!allCostData || allCostData.length === 0) return [];

    const dataMap = new Map();

    allCostData.forEach(record => {
      // Yearly data structure uses different field names
      const jobTitle = record.title || 'N/A';
      const jobNumber = record.jobNumber || record.id || 'N/A';
      const jobKey = jobTitle !== 'N/A' ? `${jobTitle} (${jobNumber})` : jobNumber;
      
      if (!dataMap.has(jobKey)) {
        dataMap.set(jobKey, {
          name: jobKey,
          laborCost: 0,
          materialCost: 0,
          totalCost: 0
        });
      }

      const existing = dataMap.get(jobKey);
      existing.laborCost += record.laborCost || 0;
      existing.materialCost += record.materialCost || 0;
      existing.totalCost += (record.laborCost || 0) + (record.materialCost || 0);
    });

    const chartData = Array.from(dataMap.values());

    // Return data based on type
    switch (type) {
      case 'labor':
        return chartData.map(item => ({
          name: item.name,
          value: item.laborCost
        })).filter(item => item.value > 0);
      case 'material':
        return chartData.map(item => ({
          name: item.name,
          value: item.materialCost
        })).filter(item => item.value > 0);
      case 'total':
        return chartData.map(item => ({
          name: item.name,
          value: item.totalCost
        })).filter(item => item.value > 0);
      default:
        return [];
    }
  };

  // Handle page change for pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // Calculate the data to display for this page
    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = allCostData.slice(startIndex, endIndex);
    
    setCostData(pageData);
  };

  // Fetch yearly cost data
  useEffect(() => {
    fetchYearlyCosts();
  }, [year]); // Add year dependency to automatically fetch when it changes

  const fetchYearlyCosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await dashboardAPI.getYearlyCosts(year);
      
      const allData = response.data || [];
      
      // Store all data for pagination
      setAllCostData(allData);
      
      // Calculate pagination
      const totalCount = allData.length;
      const calculatedTotalPages = Math.ceil(totalCount / recordsPerPage);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setCurrentPage(1); // Reset to first page
      
      // Set current page data (first page)
      const startIndex = 0;
      const endIndex = Math.min(recordsPerPage, allData.length);
      setCostData(allData.slice(startIndex, endIndex));
      
      setTotals(response.totals || {
        laborCost: 0,
        materialCost: 0,
        totalCost: 0
      });
      setPeriod(response.period || {
        startDate: '',
        endDate: ''
      });

    } catch (err) {
      console.error("Error fetching yearly costs:", err);
      setError("Failed to fetch yearly cost data. Please try again.");
      setCostData([]);
      setAllCostData([]);
      setTotalPages(1);
      toast({
        title: "Error",
        description: "Could not load yearly cost data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = ({ year: newYear }) => {
    if (newYear) setYear(newYear);
    // No need for manual fetch since useEffect will handle it
  };

  return (
    <Container maxW="container.xl" py={6}>

      {/* Page Header */}
      <Heading size="lg" mb={2} color="cyan.600">Yearly Cost Overview</Heading>
      <Text color="gray.500" mb={4}>
        View cost breakdown for {year} ({period.startDate} to {period.endDate})
      </Text>

      {/* Year Selector */}
      <Box mb={4} w={350}>
        <DateSelector
          mode="yearly"
          year={year}
          onChange={handleDateChange}
        />
      </Box>

      {/* Cost Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={4}>
        <SummaryCard 
          title={`${year} Labor Cost`} 
          amount={totals.laborCost} 
          type="labor" 
          period="yearly" 
        />
        
        <SummaryCard 
          title={`${year} Material Cost`} 
          amount={totals.materialCost} 
          type="material" 
          period="yearly" 
        />
        
        <SummaryCard 
          title={`${year} Total Cost`} 
          amount={totals.totalCost} 
          type="total" 
          period="yearly" 
        />
      </SimpleGrid>

      {/* Cost Table */}
      <CostTable 
        data={costData}
        mode="yearly"
        isLoading={isLoading}
        error={error}
        totals={totals}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && allCostData.length > 0 && (
        <Box mt={2} py={2} px={4} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg">
          <Flex 
            direction={{ base: "column", md: "row" }} 
            justify="space-between" 
            align={{ base: "stretch", md: "center" }}
            gap={3}
          >
            <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
              Showing {(currentPage - 1) * recordsPerPage + 1} to {Math.min(currentPage * recordsPerPage, allCostData.length)} of {allCostData.length} jobs
            </Text>
            
            <HStack spacing={2}>
              <Button 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)} 
                isDisabled={currentPage === 1 || isLoading}
                colorScheme="blue"
                variant="outline"
                leftIcon={isLoading ? <Spinner size="xs" /> : undefined}
              >
                Previous
              </Button>
              <Text fontSize="sm" px={2}>
                Page {currentPage} of {totalPages}
              </Text>
              <Button 
                size="sm" 
                onClick={() => handlePageChange(currentPage + 1)} 
                isDisabled={currentPage === totalPages || isLoading}
                colorScheme="blue"
                variant="outline"
                rightIcon={isLoading ? <Spinner size="xs" /> : undefined}
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </Box>
      )}

      {/* Cost Distribution Pie Charts */}
      {allCostData.length > 0 && !isLoading && (
        <Box mt={8}>
          <Heading size="md" mb={2}>
            Yearly Cost Distribution by Jobs
          </Heading>
          <Text color="gray.500" mb={6}>
            Visual breakdown of how costs are distributed across different jobs for {year}
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
                <Box h="600px" w="100%">
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
                        height={320}
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
                <Box h="600px" w="100%">
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
                        height={320}
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
                <Box h="600px" w="100%">
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
                        height={320}
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
      {allCostData.length === 0 && !isLoading && (
        <Box mt={8} textAlign="center" py={8}>
          <Text color="gray.500">
            No cost data available for {year} to display charts.
          </Text>
        </Box>
      )}
    </Container>
  );
};

export default YearlyCostPage;