import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  useToast,
  SimpleGrid,
  useColorModeValue,
  HStack,
  Tag,
  Flex,
  Button,
  Spinner,
  VStack,
  Card,
  CardBody,
  CardHeader
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronRightIcon } from '@chakra-ui/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dashboardAPI } from '../../../api';
import CostTable from '../../../components/CostTable';
import SummaryCard from '../../../components/SummaryCard';

const TotalCostPage = () => {
  // State variables
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
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Handle page change for pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    // Calculate the data to display for this page
    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageData = allCostData.slice(startIndex, endIndex);
    
    setCostData(pageData);
  };

  // Fetch total cost data
  useEffect(() => {
    fetchTotalCosts();
    fetchMonthlyTrends();
  }, []);

  const fetchMonthlyTrends = async () => {
    try {
      const trends = [];
      const today = new Date();
      
      // Get last 12 months of total costs
      for (let i = 11; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = (month.getMonth() + 1).toString().padStart(2, '0');
        const yearStr = month.getFullYear().toString();
        
        try {
          const monthlyData = await dashboardAPI.getMonthlyCosts(yearStr, monthStr);
          const totalCost = monthlyData.totals?.totalCost || 0;
          
          trends.push({
            month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            totalCost: totalCost
          });
        } catch (err) {
          trends.push({
            month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            totalCost: 0
          });
        }
      }
      
      setMonthlyTrends(trends);
    } catch (err) {
      console.error('Error fetching monthly trends:', err);
    }
  };

  const fetchTotalCosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await dashboardAPI.getTotalCosts();
      
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

    } catch (err) {
      console.error("Error fetching total costs:", err);
      setError("Failed to fetch total cost data. Please try again.");
      setCostData([]);
      setAllCostData([]);
      setTotalPages(1);
      toast({
        title: "Error",
        description: "Could not load total cost data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>

      {/* Page Header */}
      <Heading size="lg" mb={2} color="purple.600">Total Project Costs</Heading>
      <Text color="gray.500" mb={2}>
        Cumulative costs across all jobs up to {currentDate}
      </Text>
      
      <HStack spacing={2} mb={6} flexWrap="wrap">
        <Tag colorScheme="blue" size="md">All Time</Tag>
        <Tag colorScheme="purple" size="md">{allCostData.length} Jobs</Tag>
      </HStack>

      {/* Cost Summary Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6 }} mb={8}>
        <SummaryCard 
          title="Total Labor Cost" 
          amount={totals.laborCost} 
          type="labor" 
          period="total" 
        />
        
        <SummaryCard 
          title="Total Material Cost" 
          amount={totals.materialCost} 
          type="material" 
          period="total" 
        />
        
        <SummaryCard 
          title="Total Project Cost" 
          amount={totals.totalCost} 
          type="total" 
          period="total" 
        />
      </SimpleGrid>

      {/* Charts Section */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 4, md: 6 }} mb={8}>
        {/* Cost Distribution Pie Chart */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Total Cost Distribution</Heading>
            <Text fontSize="sm" color="gray.600">Labor vs Material cost breakdown</Text>
          </CardHeader>
          <CardBody>
            <Box height={{ base: "250px", md: "300px" }}>
              {totals.totalCost > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Labor Cost', value: totals.laborCost, color: '#3182CE' },
                        { name: 'Material Cost', value: totals.materialCost, color: '#38A169' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Labor Cost', value: totals.laborCost, color: '#3182CE' },
                        { name: 'Material Cost', value: totals.materialCost, color: '#38A169' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <VStack justify="center" height="100%">
                  <Text color="gray.500">No cost data available</Text>
                </VStack>
              )}
            </Box>
          </CardBody>
        </Card>

        {/* Monthly Total Cost Trends */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <VStack align="start" spacing={2}>
              <Heading size="md">Monthly Total Cost Trends</Heading>
              <Text fontSize="sm" color="gray.600">Last 12 months total cost progression</Text>
            </VStack>
          </CardHeader>
          <CardBody>
            <Box height={{ base: "250px", md: "300px" }}>
              {monthlyTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Total Cost']} />
                    <Line 
                      type="monotone" 
                      dataKey="totalCost" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      dot={{ fill: '#8B5CF6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <VStack justify="center" height="100%">
                  <Text color="gray.500">No trend data available</Text>
                </VStack>
              )}
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Cost Table */}
      <CostTable 
        data={costData}
        mode="total"
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
    </Box>
  );
};

export default TotalCostPage;
