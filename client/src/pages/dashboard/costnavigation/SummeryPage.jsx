import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Select,
  Icon,
  Flex,
  Card,
  CardBody,
  CardHeader,
  Divider
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  FiBriefcase, 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign, 
  FiUsers, 
  FiPackage,
  FiTrendingUp,
  FiCalendar
} from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dashboardAPI, jobAPI, dailyLaborCostAPI, materialOrderAPI } from '../../../api';

const SummaryPage = () => {
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyMetrics, setKeyMetrics] = useState({
    totalJobs: 0,
    completedJobs: 0,
    activeJobs: 0,
    totalCost: 0,
    totalLaborCost: 0,
    totalMaterialCost: 0
  });
  const [costDistribution, setCostDistribution] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentCosts, setRecentCosts] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState([]);
  const [jobStatusData, setJobStatusData] = useState([]);
  const [trendPeriod, setTrendPeriod] = useState('current'); // current, last6, last12

  // Colors and styling
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Pie chart colors
  const COLORS = ['#3182CE', '#38A169', '#E53E3E', '#D69E2E'];

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Parallel API calls for better performance
      await Promise.all([
        fetchKeyMetrics(),
        fetchCostDistribution(),
        fetchRecentActivity(),
        fetchMonthlyTrends(),
        fetchDailyTrends(),
        fetchWeeklyTrends(),
        fetchJobStatusOverview()
      ]);
      
    } catch (err) {
      console.error('Error fetching summary data:', err);
      setError('Failed to load summary data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchKeyMetrics = async () => {
    try {
      // Get all jobs for job counts
      const jobsResponse = await jobAPI.getAll();
      const jobs = jobsResponse.data || [];
      
      // Calculate job metrics
      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(job => job.status === 'COMPLETED').length;
      const activeJobs = jobs.filter(job => job.status === 'ONGOING').length;
      
      // Get last 365 days costs
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
      
      const [laborResponse, materialResponse] = await Promise.all([
        dailyLaborCostAPI.getByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        materialOrderAPI.getByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
      ]);
      
      const laborCosts = laborResponse.data || [];
      const materialCosts = materialResponse.data || [];
      
      const totalLaborCost = laborCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0);
      const totalMaterialCost = materialCosts.reduce((sum, cost) => sum + (parseFloat(cost.cost) || 0), 0);
      const totalCost = totalLaborCost + totalMaterialCost;
      
      setKeyMetrics({
        totalJobs,
        completedJobs,
        activeJobs,
        totalCost,
        totalLaborCost,
        totalMaterialCost
      });
    } catch (err) {
      console.error('Error fetching key metrics:', err);
    }
  };

  const fetchCostDistribution = async () => {
    try {
      // Use the same 365 days data from key metrics
      setCostDistribution([
        { name: 'Labor Cost', value: keyMetrics.totalLaborCost, color: '#3182CE' },
        { name: 'Material Cost', value: keyMetrics.totalMaterialCost, color: '#38A169' }
      ]);
    } catch (err) {
      console.error('Error fetching cost distribution:', err);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Get recent jobs (last 10)
      const jobsResponse = await jobAPI.getAll();
      const jobs = jobsResponse.data || [];
      const sortedJobs = jobs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentJobs(sortedJobs);
      
      // Get recent costs (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const [laborResponse, materialResponse] = await Promise.all([
        dailyLaborCostAPI.getByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        materialOrderAPI.getByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
      ]);
      
      const laborCosts = (laborResponse.data || []).map(cost => ({
        ...cost,
        type: 'Labor',
        amount: cost.cost
      }));
      
      const materialCosts = (materialResponse.data || []).map(cost => ({
        ...cost,
        type: 'Material',
        amount: cost.cost
      }));
      
      const allRecentCosts = [...laborCosts, ...materialCosts]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
        
      setRecentCosts(allRecentCosts);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
  };

  const fetchMonthlyTrends = async () => {
    try {
      const trends = [];
      const today = new Date();
      
      // Get last 12 months of labor costs
      for (let i = 11; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = (month.getMonth() + 1).toString().padStart(2, '0');
        const yearStr = month.getFullYear().toString();
        
        try {
          const monthlyData = await dashboardAPI.getMonthlyCosts(yearStr, monthStr);
          const totalLaborCost = monthlyData.totals?.laborCost || 0;
          
          trends.push({
            month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            laborCost: totalLaborCost
          });
        } catch (err) {
          console.log(`No data for ${yearStr}-${monthStr}`);
          trends.push({
            month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            laborCost: 0
          });
        }
      }
      
      setMonthlyTrends(trends);
    } catch (err) {
      console.error('Error fetching monthly trends:', err);
    }
  };

  const fetchDailyTrends = async () => {
    try {
      const trends = [];
      const today = new Date();
      
      // Get last 30 days of labor costs
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const dailyData = await dashboardAPI.getDailyCosts(dateStr);
          const totalLaborCost = dailyData.totals?.laborCost || 0;
          
          trends.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            laborCost: totalLaborCost
          });
        } catch (err) {
          console.log(`No data for ${dateStr}`);
          trends.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            laborCost: 0
          });
        }
      }
      
      setDailyTrends(trends);
    } catch (err) {
      console.error('Error fetching daily trends:', err);
    }
  };

  const fetchWeeklyTrends = async () => {
    try {
      const trends = [];
      const today = new Date();
      
      // Get last 12 weeks of labor costs
      for (let i = 11; i >= 0; i--) {
        const weekDate = new Date(today);
        weekDate.setDate(weekDate.getDate() - (i * 7));
        
        // Get ISO week number
        const tempDate = new Date(weekDate);
        tempDate.setHours(0, 0, 0, 0);
        tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
        const week1 = new Date(tempDate.getFullYear(), 0, 4);
        const weekNumber = 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        
        const yearStr = tempDate.getFullYear().toString();
        const weekStr = weekNumber.toString();
        
        try {
          const weeklyData = await dashboardAPI.getWeeklyCosts(yearStr, weekStr);
          const totalLaborCost = weeklyData.totals?.laborCost || 0;
          
          trends.push({
            week: `W${weekNumber} ${yearStr}`,
            laborCost: totalLaborCost
          });
        } catch (err) {
          console.log(`No data for week ${weekStr} of ${yearStr}`);
          trends.push({
            week: `W${weekNumber} ${yearStr}`,
            laborCost: 0
          });
        }
      }
      
      setWeeklyTrends(trends);
    } catch (err) {
      console.error('Error fetching weekly trends:', err);
    }
  };

  const fetchJobStatusOverview = async () => {
    try {
      const jobsResponse = await jobAPI.getAll();
      const jobs = jobsResponse.data || [];
      
      // Get latest 10 jobs with relevant info
      const jobStatusList = jobs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(job => ({
          id: job.id,
          jobNumber: job.jobNumber,
          title: job.title,
          status: job.status,
          startDate: job.startDate,
          endDate: job.endDate,
          reqDepartment: job.reqDepartment
        }));
        
      setJobStatusData(jobStatusList);
    } catch (err) {
      console.error('Error fetching job status overview:', err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'ONGOING': 'blue',
      'COMPLETED': 'green',
      'PENDING': 'yellow',
      'CANCELLED': 'red'
    };
    return statusColors[status] || 'gray';
  };

  if (loading) {
    return (
      <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Heading size="md">Loading summary...</Heading>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={8}>
        <Alert status="error">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">Error Loading Summary</Text>
            <Text fontSize="sm" mt={1}>{error}</Text>
            <Button 
              size="sm" 
              colorScheme="red" 
              variant="outline" 
              mt={2}
              onClick={fetchSummaryData}
            >
              Try Again
            </Button>
          </Box>
        </Alert>
      </Box>
    );
  }

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">

        {/* Header */}
        <VStack align="start" spacing={2}>
          <Heading size="lg" color="red.500">Overview</Heading>
          <Text color="gray.600">
            Comprehensive summary of Direct Labor Cost Tracking System performance
          </Text>
        </VStack>

        {/* Key Metrics Cards */}
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={{ base: 3, md: 4 }}>
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody p={{ base: 2, md: 3 }}>
              <VStack spacing={2} align="start">
                <HStack>
                  <Icon as={FiBriefcase} color="blue.500" boxSize={5} />
                  <Text fontSize="sm" color="gray.600">Total Jobs</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">{keyMetrics.totalJobs}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody p={2}>
              <VStack spacing={2} align="start">
                <HStack>
                  <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                  <Text fontSize="sm" color="gray.600">Completed</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">{keyMetrics.completedJobs}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody p={2}>
              <VStack spacing={2} align="start">
                <HStack>
                  <Icon as={FiClock} color="orange.500" boxSize={5} />
                  <Text fontSize="sm" color="gray.600">Active Jobs</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">{keyMetrics.activeJobs}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody p={2}>
              <VStack spacing={2} align="start">
                <HStack>
                  <Icon as={FiDollarSign} color="purple.500" boxSize={5} />
                  <Text fontSize="sm" color="gray.600">Total Cost (365d)</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">{formatCurrency(keyMetrics.totalCost)}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody p={2}>
              <VStack spacing={2} align="start">
                <HStack>
                  <Icon as={FiUsers} color="blue.500" boxSize={5} />
                  <Text fontSize="sm" color="gray.600">Labor Cost (365d)</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">{formatCurrency(keyMetrics.totalLaborCost)}</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardBody p={2}>
              <VStack spacing={2} align="start">
                <HStack>
                  <Icon as={FiPackage} color="green.500" boxSize={5} />
                  <Text fontSize="sm" color="gray.600">Material Cost (365d)</Text>
                </HStack>
                <Text fontSize="2xl" fontWeight="bold">{formatCurrency(keyMetrics.totalMaterialCost)}</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Middle Section: Cost Distribution and Trends */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Cost Distribution Pie Chart */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Cost Distribution (Last 365 Days)</Heading>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                {keyMetrics.totalCost > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Labor Cost', value: keyMetrics.totalLaborCost, color: '#3182CE' },
                          { name: 'Material Cost', value: keyMetrics.totalMaterialCost, color: '#38A169' }
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
                          { name: 'Labor Cost', value: keyMetrics.totalLaborCost, color: '#3182CE' },
                          { name: 'Material Cost', value: keyMetrics.totalMaterialCost, color: '#70cd63ff' }
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
          {/* Daily Labor Cost Trends (Last 30 Days) */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <VStack align="start" spacing={2}>
                <Heading size="md">Daily Labor Cost Trends</Heading>
                <Text fontSize="sm" color="gray.600">Last 30 days labor cost day by day</Text>
              </VStack>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                {dailyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        fontSize={11} 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={2}
                      />
                      <YAxis fontSize={12} tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Labor Cost']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="laborCost" 
                        stroke="#38A169" 
                        strokeWidth={2}
                        dot={{ fill: '#38A169', r: 3 }}
                        activeDot={{ r: 5, fill: '#38A169' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <VStack justify="center" height="100%">
                    <Text color="gray.500">No daily trend data available</Text>
                  </VStack>
                )}
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Middle Section 2: Daily and Weekly Labor Cost Trends */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Weekly Labor Cost Trends (Last 12 Weeks) */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <VStack align="start" spacing={2}>
                <Heading size="md">Weekly Labor Cost Trends</Heading>
                <Text fontSize="sm" color="gray.600">Last 12 weeks labor cost week by week</Text>
              </VStack>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                {weeklyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="week" 
                        fontSize={11} 
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis fontSize={12} tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(value), 'Labor Cost']}
                        labelFormatter={(label) => `Week: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="laborCost" 
                        stroke="#E53E3E" 
                        strokeWidth={2}
                        dot={{ fill: '#E53E3E', r: 3 }}
                        activeDot={{ r: 5, fill: '#E53E3E' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <VStack justify="center" height="100%">
                    <Text color="gray.500">No weekly trend data available</Text>
                  </VStack>
                )}
              </Box>
            </CardBody>
          </Card>

          {/* Monthly Labor Cost Trends */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <VStack align="start" spacing={2}>
                <Heading size="md">Monthly Labor Cost Trends</Heading>
                <Text fontSize="sm" color="gray.600">Last 12 months labor cost progression</Text>
              </VStack>
            </CardHeader>
            <CardBody>
              <Box height="300px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(value) => `LKR ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(value), 'Labor Cost']} />
                    <Line 
                      type="monotone" 
                      dataKey="laborCost" 
                      stroke="#3182CE" 
                      strokeWidth={2}
                      dot={{ fill: '#3182CE', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Bottom Section: Recent Activity and Job Status */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Jobs */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Recent Jobs</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <Box key={job.id} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{job.jobNumber}</Text>
                          <Text fontSize="sm" color="gray.600">{job.title}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {job.reqDepartment} • {formatDate(job.createdAt)}
                          </Text>
                        </VStack>
                        <Badge colorScheme={getStatusColor(job.status)}>
                          {job.status}
                        </Badge>
                      </HStack>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">No recent jobs</Text>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Recent Cost Entries */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Recent Cost Entries</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {recentCosts.length > 0 ? (
                  recentCosts.slice(0, 5).map((cost, index) => (
                    <Box key={index} p={3} borderWidth="1px" borderColor={borderColor} borderRadius="md">
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Badge colorScheme={cost.type === 'Labor' ? 'blue' : 'green'}>
                              {cost.type}
                            </Badge>
                            <Text fontSize="sm">{cost.job?.jobNumber || 'Unknown Job'}</Text>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{cost.job?.title || ''}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(cost.date)}
                          </Text>
                        </VStack>
                        <Text fontWeight="medium" color="green.500">
                          {formatCurrency(cost.amount)}
                        </Text>
                      </HStack>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" textAlign="center">No recent costs</Text>
                )}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Job Status Overview Table */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Job Status Overview</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Job Number</Th>
                    <Th>Title</Th>
                    <Th>Department</Th>
                    <Th>Status</Th>
                    <Th>Start Date</Th>
                    <Th>End Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {jobStatusData.length > 0 ? (
                    jobStatusData.map((job) => (
                      <Tr key={job.id}>
                        <Td fontWeight="medium">{job.jobNumber}</Td>
                        <Td>{job.title}</Td>
                        <Td>{job.reqDepartment}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </Td>
                        <Td>{formatDate(job.startDate)}</Td>
                        <Td>{job.endDate ? formatDate(job.endDate) : '-'}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={6} textAlign="center" color="gray.500">
                        No jobs available
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default SummaryPage;