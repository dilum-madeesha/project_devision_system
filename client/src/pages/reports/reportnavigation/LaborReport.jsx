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
  useColorModeValue,
  Button,
  FormControl,
  FormLabel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  Divider,
  SimpleGrid,
  Select,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { FiUser, FiDownload, FiFileText, FiBriefcase, FiClock, FiCalendar } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { laborAPI, dailyLaborAssignmentAPI, jobAPI } from '../../../api';

const LaborReport = () => {
  // State variables
  const [selectedLaborId, setSelectedLaborId] = useState('');
  const [labors, setLabors] = useState([]);
  const [laborDetails, setLaborDetails] = useState(null);
  const [laborAssignments, setLaborAssignments] = useState([]);
  const [jobProjects, setJobProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  // Fetch all labors on component mount
  useEffect(() => {
    fetchLabors();
  }, []);

  // Fetch labor details and assignments when labor is selected
  useEffect(() => {
    if (selectedLaborId) {
      fetchLaborData();
    } else {
      setLaborDetails(null);
      setLaborAssignments([]);
      setJobProjects([]);
      setError(null);
    }
  }, [selectedLaborId]);

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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Fetch all labors for selection dropdown
  const fetchLabors = async () => {
    try {
      const response = await laborAPI.getAll();
      let laborsData = [];
      
      if (response && Array.isArray(response)) {
        laborsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        laborsData = response.data;
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        laborsData = response.data;
      }
      
      // Filter only active labors
      const activeLabors = laborsData.filter(labor => labor.isActive !== false);
      setLabors(activeLabors);
    } catch (err) {
      console.error("Error fetching labors:", err);
      toast({
        title: "Error fetching labors",
        description: "Failed to load labor list",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle labor selection
  const handleLaborSelect = async (laborId) => {
    setSelectedLaborId(laborId);
    if (!laborId) {
      setLaborDetails(null);
      setLaborAssignments([]);
      setJobProjects([]);
      setError(null);
      return;
    }
  };

  // Fetch labor data including details and assignments
  const fetchLaborData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch labor details
      const laborResponse = await laborAPI.getById(selectedLaborId);
      const laborData = laborResponse.data || laborResponse;
      setLaborDetails(laborData);

      // Fetch labor assignments (all assignments for this labor)
      const assignmentsResponse = await dailyLaborAssignmentAPI.getByLaborId(selectedLaborId);
      let allAssignments = [];
      
      if (assignmentsResponse && Array.isArray(assignmentsResponse)) {
        allAssignments = assignmentsResponse;
      } else if (assignmentsResponse && assignmentsResponse.data && Array.isArray(assignmentsResponse.data)) {
        allAssignments = assignmentsResponse.data;
      }
      
      setLaborAssignments(allAssignments);

      // Process assignments to get job projects data
      await processJobProjects(allAssignments);
      
    } catch (err) {
      console.error("Error fetching labor data:", err);
      setError(err.message || "Failed to fetch labor data");
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to fetch labor data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Process assignments to get job projects data
  const processJobProjects = async (assignments) => {
    const jobMap = new Map();
    
    // Group assignments by job
    assignments.forEach(assignment => {
      const job = assignment.dailyLaborCost?.job;
      if (!job) return;
      
      const jobId = job.id;
      const date = assignment.dailyLaborCost.date;
      
      if (!jobMap.has(jobId)) {
        jobMap.set(jobId, {
          jobId: job.jobNumber || jobId,
          jobName: job.title || 'Unknown Job',
          division: 'N/A', // Will be fetched from job details
          jobStatus: 'N/A', // Will be fetched from job details
          totalWorkedDays: new Set(),
          regularHours: 0,
          otHours: 0,
          weekendDays: new Set() // Use Set to track unique weekend dates
        });
      }
      
      const jobData = jobMap.get(jobId);
      
      // Add date to worked days set
      jobData.totalWorkedDays.add(date);
      
      // Add hours
      jobData.regularHours += parseFloat(assignment.regularHours) || 0;
      jobData.otHours += parseFloat(assignment.otHours) || 0;
      
      // Check if it's weekend work
      const workDate = new Date(date);
      const dayOfWeek = workDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        const weekendHours = parseFloat(assignment.weekendHours) || 0;
        const regularHours = parseFloat(assignment.regularHours) || 0;
        const otHours = parseFloat(assignment.otHours) || 0;
        
        // Count as weekend day if any hours were worked
        if (weekendHours > 0 || regularHours > 0 || otHours > 0) {
          jobData.weekendDays.add(date);
        }
      }
    });
    
    // Fetch job details for each unique job
    const jobProjects = [];
    for (const [jobId, jobData] of jobMap) {
      try {
        const jobResponse = await jobAPI.getById(jobId);
        const jobDetails = jobResponse.data || jobResponse;
        
        jobProjects.push({
          ...jobData,
          division: jobDetails.reqDepartment || 'N/A',
          jobStatus: jobDetails.status || 'N/A',
          totalWorkedDays: jobData.totalWorkedDays.size, // Convert Set to count
          weekendDays: jobData.weekendDays.size // Convert Set to count
        });
      } catch (jobError) {
        console.error(`Error fetching job ${jobId}:`, jobError);
        jobProjects.push({
          ...jobData,
          totalWorkedDays: jobData.totalWorkedDays.size,
          weekendDays: jobData.weekendDays.size
        });
      }
    }
    
    setJobProjects(jobProjects);
  };

  // Calculate overview statistics
  const calculateOverview = () => {
    if (!laborAssignments.length) {
      return {
        totalJobsWorked: 0,
        ongoingJobs: 0,
        completedJobs: 0,
        totalWorkedDays: 0,
        totalRegularHours: 0,
        totalOtHours: 0,
        totalWeekendDays: 0
      };
    }

    const uniqueJobs = new Set();
    const uniqueDates = new Set();
    const weekendDatesSet = new Set();
    let totalRegularHours = 0;
    let totalOtHours = 0;

    laborAssignments.forEach(assignment => {
      const job = assignment.dailyLaborCost?.job;
      if (job) {
        uniqueJobs.add(job.id);
      }
      
      const date = assignment.dailyLaborCost?.date;
      if (date) {
        uniqueDates.add(date);
        
        // Check if weekend work - check if it's Saturday (6) or Sunday (0)
        const workDate = new Date(date);
        const dayOfWeek = workDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          // Check if there are any weekend hours recorded for this assignment
          const weekendHours = parseFloat(assignment.weekendHours) || 0;
          const regularHours = parseFloat(assignment.regularHours) || 0;
          const otHours = parseFloat(assignment.otHours) || 0;
          
          // Count as weekend day if any hours were worked on weekend
          if (weekendHours > 0 || regularHours > 0 || otHours > 0) {
            weekendDatesSet.add(date);
          }
        }
      }
      
      totalRegularHours += parseFloat(assignment.regularHours) || 0;
      totalOtHours += parseFloat(assignment.otHours) || 0;
    });

    // Calculate job status counts from jobProjects
    let ongoingJobs = 0;
    let completedJobs = 0;
    
    
    jobProjects.forEach(job => {
      const status = job.jobStatus?.toString().toUpperCase().trim();
      
      // Match against the exact JobStatus enum values from the database
      if (status && (
        status === 'NOT_STARTED' ||
        status === 'ONGOING' ||
        status === 'ON_HOLD'
      )) {
        ongoingJobs++;
      } else if (status === 'COMPLETED') {
        completedJobs++;
      }
    });

    return {
      totalJobsWorked: uniqueJobs.size,
      ongoingJobs,
      completedJobs,
      totalWorkedDays: uniqueDates.size,
      totalRegularHours,
      totalOtHours,
      totalWeekendDays: weekendDatesSet.size
    };
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (!laborDetails) {
      toast({
        title: "No Data",
        description: "Please select a labor to export",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Labor Performance Report", pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Labor Details Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Labor Information", margin, yPosition);
      yPosition += 10;

      const laborDetailsData = [
        ['EPF Number', laborDetails.epfNumber || 'N/A', 'Full Name', `${laborDetails.firstName || ''} ${laborDetails.lastName || ''}`.trim()],
        ['Division', laborDetails.division || 'N/A', 'Trade', laborDetails.trade || 'N/A'],
        ['Pay Grade', laborDetails.payGrade || 'N/A', 'Status', laborDetails.isActive ? 'Active' : 'Inactive'],
        ['Day Pay', formatCurrency(laborDetails.dayPay || 0), 'OT Pay', formatCurrency(laborDetails.otPay || 0)],
        ['Weekend Pay', formatCurrency(laborDetails.weekendPay || 0), '', '']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: laborDetailsData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 240, 240] },
          2: { fontStyle: 'bold', fillColor: [240, 240, 240] }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Overview Section
      const overview = calculateOverview();
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Work Overview", margin, yPosition);
      yPosition += 10;

      const overviewData = [
        ['Total Jobs Worked', overview.totalJobsWorked.toString()],
        ['Ongoing Jobs', overview.ongoingJobs.toString()],
        ['Completed Jobs', overview.completedJobs.toString()],
        ['Total Worked Days', overview.totalWorkedDays.toString()],
        ['Total Regular Hours', overview.totalRegularHours.toFixed(1) + 'h'],
        ['Total OT Hours', overview.totalOtHours.toFixed(1) + 'h'],
        ['Weekend Days Worked', overview.totalWeekendDays.toString()]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: overviewData,
        theme: 'striped',
        headStyles: { fillColor: [52, 144, 220] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Project Contributions Table
      if (jobProjects.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Project Contributions", margin, yPosition);
        yPosition += 10;

        const projectData = jobProjects.map(project => [
          project.jobId,
          project.jobName,
          project.division,
          project.jobStatus,
          project.totalWorkedDays.toString(),
          project.regularHours.toFixed(1) + 'h',
          project.otHours.toFixed(1) + 'h',
          project.weekendDays.toString(),
          (project.regularHours + project.otHours).toFixed(1) + 'h'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Job ID', 'Job Name', 'Division', 'Status', 'Worked Days', 'Regular Hours', 'OT Hours', 'Weekend Days', 'Total Hours']],
          body: projectData,
          theme: 'striped',
          headStyles: { fillColor: [34, 139, 34] },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 35 },
            2: { cellWidth: 22 },
            3: { cellWidth: 18 },
            4: { halign: 'center', cellWidth: 18 },
            5: { halign: 'center', cellWidth: 18 },
            6: { halign: 'center', cellWidth: 18 },
            7: { halign: 'center', cellWidth: 15 },
            8: { halign: 'center', cellWidth: 18, fontStyle: 'bold' }
          },
          margin: { left: margin, right: margin }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Important Notes Section
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Important Notes", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const notes = [
        "• This report summarizes labor performance and project contributions.",
        "• Values may have slight variations. These are approximate values.",
        "• This document is for project division internal use only.",
        "• This document cannot be used as an official document."
      ];

      notes.forEach(note => {
        doc.text(note, margin + 5, yPosition);
        yPosition += 6;
      });

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `Labor_Report_${laborDetails.epfNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Generated",
        description: "Labor report has been downloaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF report",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const overview = laborDetails ? calculateOverview() : {
    totalJobsWorked: 0,
    ongoingJobs: 0,
    completedJobs: 0,
    totalWorkedDays: 0,
    totalRegularHours: 0,
    totalOtHours: 0,
    totalWeekendDays: 0
  };

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <div>
          <Heading size="lg" mb={2} color="teal.600">Labor Report</Heading>
          <Text color="gray.500" mb={4}>
            Generate comprehensive labor performance reports with project contributions
          </Text>
        </div>

        {/* Labor Selection Controls */}
        <Box bg={bg} p={{ base: 3, md: 4 }} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>Report Controls</Heading>
          
          <HStack spacing={4} align="end">
            <FormControl flex="2">
              <FormLabel fontSize="sm">Select Labor</FormLabel>
              <Select
                size="sm"
                placeholder="Choose a labor..."
                value={selectedLaborId}
                onChange={(e) => handleLaborSelect(e.target.value)}
              >
                {labors.map(labor => (
                  <option key={labor.id} value={labor.id}>
                    {labor.epfNumber} - {labor.firstName} {labor.lastName} ({labor.trade})
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl flex="1">
              <FormLabel fontSize="sm">Actions</FormLabel>
              <HStack spacing={2}>
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="green"
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  isDisabled={!laborDetails || loading}
                  flex="1"
                >
                  Download PDF
                </Button>
                {selectedLaborId && (
                  <Button
                    leftIcon={<FiFileText />}
                    variant="outline"
                    colorScheme="gray"
                    size="sm"
                    onClick={() => handleLaborSelect('')}
                  >
                    Clear
                  </Button>
                )}
              </HStack>
            </FormControl>
          </HStack>
        </Box>

        {/* Loading State */}
        {loading && (
          <Center py={10}>
            <VStack>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.500">Loading labor data...</Text>
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

        {/* Labor Report Content */}
        {laborDetails && !loading && (
          <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Labor Information Header */}
                <Box textAlign="center">
                  <Heading size="lg" mb={2}>Labor Performance Report</Heading>
                  <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                    {laborDetails.epfNumber} - {laborDetails.firstName} {laborDetails.lastName}
                  </Text>
                  <Badge colorScheme={laborDetails.isActive ? "green" : "red"} mt={2} size="lg">
                    {laborDetails.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Box>

                <Divider />

                {/* 1. Labor Details Table */}
                <Box>
                  <Heading size="md" mb={4}>Labor Information</Heading>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Tbody>
                        <Tr>
                          <Td fontWeight="bold" w="200px">EPF Number</Td>
                          <Td>{laborDetails.epfNumber}</Td>
                          <Td fontWeight="bold" w="200px">Full Name</Td>
                          <Td>{laborDetails.firstName} {laborDetails.lastName}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Division</Td>
                          <Td>
                            <Badge colorScheme="blue" size="sm">
                              {laborDetails.division || 'N/A'}
                            </Badge>
                          </Td>
                          <Td fontWeight="bold">Trade</Td>
                          <Td>
                            <Badge colorScheme="purple" size="sm">
                              {laborDetails.trade || 'N/A'}
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Pay Grade</Td>
                          <Td>{laborDetails.payGrade || 'N/A'}</Td>
                          <Td fontWeight="bold">Status</Td>
                          <Td>
                            <Badge 
                              colorScheme={laborDetails.isActive ? "green" : "red"} 
                              size="sm"
                            >
                              {laborDetails.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Day Pay(current)</Td>
                          <Td color="green.600" fontWeight="medium">
                            {formatCurrency(laborDetails.dayPay || 0)}
                          </Td>
                          <Td fontWeight="bold">OT Pay(current)</Td>
                          <Td color="blue.600" fontWeight="medium">
                            {formatCurrency(laborDetails.otPay || 0)}
                          </Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Weekend Pay(current)</Td>
                          <Td color="purple.600" fontWeight="medium">
                            {formatCurrency(laborDetails.weekendPay || 0)}
                          </Td>
                          <Td></Td>
                          <Td></Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* 2. Work Overview */}
                <Box>
                  <Heading size="md" mb={4}>Work Overview</Heading>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                    <Stat textAlign="center" p={4} bg="blue.50" borderRadius="md">
                      <StatLabel>Total Jobs Worked</StatLabel>
                      <StatNumber fontSize="xl" color="blue.600">
                        {overview.totalJobsWorked}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={4} bg="green.50" borderRadius="md">
                      <StatLabel>Ongoing Jobs</StatLabel>
                      <StatNumber fontSize="xl" color="green.600">
                        {overview.ongoingJobs}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={4} bg="purple.50" borderRadius="md">
                      <StatLabel>Completed Jobs</StatLabel>
                      <StatNumber fontSize="xl" color="purple.600">
                        {overview.completedJobs}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={4} bg="orange.50" borderRadius="md">
                      <StatLabel>Total Worked Days</StatLabel>
                      <StatNumber fontSize="xl" color="orange.600">
                        {overview.totalWorkedDays}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
                    <Stat textAlign="center" p={4} bg="teal.50" borderRadius="md">
                      <StatLabel>Total Regular Hours</StatLabel>
                      <StatNumber fontSize="xl" color="teal.600">
                        {overview.totalRegularHours.toFixed(1)}h
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={4} bg="cyan.50" borderRadius="md">
                      <StatLabel>Total OT Hours</StatLabel>
                      <StatNumber fontSize="xl" color="cyan.600">
                        {overview.totalOtHours.toFixed(1)}h
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={4} bg="pink.50" borderRadius="md">
                      <StatLabel>Weekend Days Worked</StatLabel>
                      <StatNumber fontSize="xl" color="pink.600">
                        {overview.totalWeekendDays}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* 3. Project Contributions Table */}
                <Box>
                  <Heading size="md" mb={4}>Project Contributions</Heading>
                  
                  {jobProjects.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>Job ID</Th>
                            <Th>Job Name</Th>
                            <Th>Division</Th>
                            <Th>Job Status</Th>
                            <Th isNumeric>Worked Days</Th>
                            <Th isNumeric>Reg. Hours</Th>
                            <Th isNumeric>OT Hours</Th>
                            <Th isNumeric>Weekend Days</Th>
                            <Th isNumeric>Total Hours</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {jobProjects.map((project, index) => (
                            <Tr key={index}>
                              <Td fontWeight="medium">{project.jobId}</Td>
                              <Td>{project.jobName}</Td>
                              <Td>
                                <Badge colorScheme="blue" size="sm">
                                  {project.division}
                                </Badge>
                              </Td>
                              <Td>
                                <Badge 
                                  colorScheme={
                                    project.jobStatus === 'COMPLETED' ? 'green' :
                                    project.jobStatus === 'ONGOING' ? 'blue' :
                                    project.jobStatus === 'NOT_STARTED' ? 'gray' :
                                    project.jobStatus === 'ON_HOLD' ? 'yellow' :
                                    project.jobStatus === 'CANCELLED' ? 'red' : 'gray'
                                  }
                                  size="sm"
                                >
                                  {project.jobStatus}
                                </Badge>
                              </Td>
                              <Td isNumeric fontWeight="bold">{project.totalWorkedDays}</Td>
                              <Td isNumeric>{project.regularHours.toFixed(1)}h</Td>
                              <Td isNumeric>{project.otHours.toFixed(1)}h</Td>
                              <Td isNumeric>{project.weekendDays}</Td>
                              <Td isNumeric fontWeight="bold" color="blue.600">
                                {(project.regularHours + project.otHours).toFixed(1)}h
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Center py={10}>
                      <VStack>
                        <Icon as={FiBriefcase} boxSize={12} color="gray.400" />
                        <Text color="gray.500">No project contributions found for this labor</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>

                <Divider />

                {/* Important Notes Section */}
                <Box bg="yellow.50" p={6} borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm" color="yellow.800" >Important Notes</Heading>
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="xs" color="yellow.700">
                        • This report summarizes labor performance and project contributions.
                      </Text>
                      <Text fontSize="xs" color="yellow.700">
                        • Values may have slight variations. These are approximate values.
                      </Text>
                      <Text fontSize="xs" color="yellow.700">
                        • This document is for project division internal use only.
                      </Text>
                      <Text fontSize="xs" color="yellow.700">
                        • This document cannot be used as an official document.
                      </Text>
                    </VStack>
                  </VStack>
                </Box>

              </VStack>
            </CardBody>
          </Card>
        )}

        {/* No Labor Selected Message */}
        {!selectedLaborId && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiUser} boxSize={16} color="gray.400" />
              <Heading size="md" color="gray.500">Select a Labor</Heading>
              <Text color="gray.400" textAlign="center">
                Choose a labor from the dropdown to generate the performance report
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default LaborReport;
