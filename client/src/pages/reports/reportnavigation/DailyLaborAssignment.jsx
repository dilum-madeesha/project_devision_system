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
  Badge,
  Divider,
  Input,
} from '@chakra-ui/react';
import { FiClipboard, FiDownload, FiCalendar, FiUsers } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dailyLaborAssignmentAPI, laborAPI, jobAPI } from '../../../api';

const DailyLaborAssignment = () => {
  // State variables
  const [selectedDate, setSelectedDate] = useState('');
  const [laborAssignments, setLaborAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Fetch data when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchDailyAssignments();
    }
  }, [selectedDate]);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const timeMap = {
      'morning': '8:30 AM',
      'afternoon': '12:30 PM',
      'evening': '4:30 PM'
    };
    return timeMap[timeString] || timeString;
  };

  // Fetch daily labor assignments
  const fetchDailyAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch all active labors
      const allLaborsResponse = await laborAPI.getAll();
      const allLabors = allLaborsResponse.data || allLaborsResponse;

      // Filter only active labors and sort by registration order (laborId)
      const activeLabors = allLabors
        .filter(labor => labor.isActive)
        .sort((a, b) => a.id - b.id); // Sort by ID (registration order - old to new)

      // Ensure date is in correct format (YYYY-MM-DD)
      const formattedDate = selectedDate;

      // Get all assignments for the selected date using date range with same start and end date
      const response = await dailyLaborAssignmentAPI.getByDateRange(formattedDate, formattedDate);
      let assignments = [];
      
      if (response && Array.isArray(response)) {
        assignments = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        assignments = response.data;
      } else if (response && response.success && response.data && Array.isArray(response.data)) {
        assignments = response.data;
      }

      // Process assignments to get labor details and job information
      const processedAssignments = await processAllLaborsWithAssignments(activeLabors, assignments);
      setLaborAssignments(processedAssignments);

    } catch (err) {
      console.error("Error fetching daily assignments:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      setError(err.response?.data?.message || err.message || "Failed to fetch daily assignments");
      toast({
        title: "Error fetching data",
        description: err.response?.data?.message || err.message || "Failed to fetch daily assignments",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Process assignments to get complete labor and job information
  const processAssignments = async (assignments) => {
    const laborMap = new Map();

    // Group assignments by labor
    for (const assignment of assignments) {
      const laborId = assignment.laborId;
      const job = assignment.dailyLaborCost?.job;
      
      if (!laborId || !job) {
        continue;
      }

      if (!laborMap.has(laborId)) {
        try {
          // Fetch labor details
          const laborResponse = await laborAPI.getById(laborId);
          const laborData = laborResponse.data || laborResponse;

          laborMap.set(laborId, {
            laborId,
            epfNumber: laborData.epfNumber,
            fullName: `${laborData.firstName} ${laborData.lastName}`,
            trade: laborData.trade,
            division: laborData.division,
            isActive: laborData.isActive,
            morningShift: null,
            eveningShift: null,
            otJobs: [] // Array to store OT assignments with job info
          });
        } catch (error) {
          console.error(`Error fetching labor ${laborId}:`, error);
          continue;
        }
      }

      const laborData = laborMap.get(laborId);
      
      // Determine shift period based on timeIn/timeOut
      const timeIn = assignment.timeIn?.toLowerCase();
      const timeOut = assignment.timeOut?.toLowerCase();
      
      const jobInfo = {
        jobId: job.jobNumber || job.id,
        jobName: job.title,
        regularHours: assignment.regularHours || 0,
        otHours: assignment.otHours || 0
      };

      if (timeIn === 'morning' && timeOut === 'afternoon') {
        // Morning shift assignment
        laborData.morningShift = jobInfo;
      } else if (timeIn === 'afternoon' && timeOut === 'evening') {
        // Evening shift assignment
        laborData.eveningShift = jobInfo;
      } else if (timeIn === 'morning' && timeOut === 'evening') {
        // Full day assignment (morning to evening) - assign to both shifts
        laborData.morningShift = { ...jobInfo, regularHours: (jobInfo.regularHours / 2) || 4 };
        laborData.eveningShift = { ...jobInfo, regularHours: (jobInfo.regularHours / 2) || 4 };
      }

      // If there are OT hours, add to OT jobs array
      if (assignment.otHours && assignment.otHours > 0) {
        laborData.otJobs.push({
          jobId: job.jobNumber || job.id,
          jobName: job.title,
          otHours: assignment.otHours
        });
      }
    }

    const result = Array.from(laborMap.values())
      .filter(labor => labor.isActive) // Only show active labors
      .sort((a, b) => a.epfNumber - b.epfNumber);
    
    return result;
  };

  // Process all active labors and overlay assignment data
  const processAllLaborsWithAssignments = async (allActiveLabors, assignments) => {
    // Create assignment map by laborId for quick lookup
    const assignmentsByLabor = new Map();
    
    // Process assignments and group by laborId
    for (const assignment of assignments) {
      const laborId = assignment.laborId;
      const job = assignment.dailyLaborCost?.job;
      
      if (!laborId || !job) {
        continue;
      }

      if (!assignmentsByLabor.has(laborId)) {
        assignmentsByLabor.set(laborId, []);
      }
      
      assignmentsByLabor.get(laborId).push({
        assignment,
        job,
        timeIn: assignment.timeIn?.toLowerCase(),
        timeOut: assignment.timeOut?.toLowerCase(),
        regularHours: assignment.regularHours || 0,
        otHours: assignment.otHours || 0
      });
    }

    // Process all active labors
    const processedLabors = [];
    
    for (const labor of allActiveLabors) {
      const laborData = {
        laborId: labor.id,
        epfNumber: labor.epfNumber,
        fullName: `${labor.firstName} ${labor.lastName}`,
        trade: labor.trade,
        division: labor.division,
        isActive: labor.isActive,
        morningShift: null,
        eveningShift: null,
        otJobs: []
      };

      // Check if this labor has any assignments for the selected date
      const laborAssignments = assignmentsByLabor.get(labor.id) || [];

      // Process assignments for this labor
      for (const assignmentData of laborAssignments) {
        const { job, timeIn, timeOut, regularHours, otHours } = assignmentData;
        
        const jobInfo = {
          jobId: job.jobNumber || job.id,
          jobName: job.title,
          regularHours: regularHours,
          otHours: otHours
        };

        // Determine shift based on timeIn/timeOut
        if (timeIn === 'morning' && timeOut === 'afternoon') {
          // Morning shift assignment
          laborData.morningShift = jobInfo;
        } else if (timeIn === 'afternoon' && timeOut === 'evening') {
          // Evening shift assignment
          laborData.eveningShift = jobInfo;
        } else if (timeIn === 'morning' && timeOut === 'evening') {
          // Full day assignment (morning to evening) - assign to both shifts
          laborData.morningShift = { ...jobInfo, regularHours: (regularHours / 2) || 4 };
          laborData.eveningShift = { ...jobInfo, regularHours: (regularHours / 2) || 4 };
        }

        // Add OT hours if present
        if (otHours && otHours > 0) {
          laborData.otJobs.push({
            jobId: job.jobNumber || job.id,
            jobName: job.title,
            otHours: otHours
          });
        }
      }

      processedLabors.push(laborData);
    }

    return processedLabors;
  };

  // Handle date change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (!selectedDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a date to export",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Use landscape orientation for better space utilization
      const doc = new jsPDF('landscape');
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      let yPosition = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Labor Assignment Report", pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Date
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${formatDate(selectedDate)}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Summary
      doc.setFontSize(10);
      doc.text(`Total Active Labors: ${laborAssignments.length}`, margin, yPosition);
      const totalAssignments = laborAssignments.reduce((sum, labor) => {
        let assignments = 0;
        if (labor.morningShift) assignments++;
        if (labor.eveningShift) assignments++;
        assignments += labor.otJobs.length;
        return sum + assignments;
      }, 0);
      doc.text(`Total Job Assignments: ${totalAssignments}`, margin + 100, yPosition);
      yPosition += 15;

      // Prepare table data
      const tableData = [];
      
      laborAssignments.forEach(labor => {
        const morningShiftText = labor.morningShift 
          ? `${labor.morningShift.jobId} - ${labor.morningShift.jobName}`
          : 'No Assignment';
        
        const eveningShiftText = labor.eveningShift 
          ? `${labor.eveningShift.jobId} - ${labor.eveningShift.jobName}`
          : 'No Assignment';
        
        const otHoursText = labor.otJobs.length > 0
          ? labor.otJobs.map(ot => `${ot.otHours}h`).join(', ')
          : '-';
        
        const otShiftText = labor.otJobs.length > 0
          ? labor.otJobs.map(ot => `${ot.jobId} - ${ot.jobName}`).join('; ')
          : '-';

        tableData.push([
          labor.epfNumber,
          labor.fullName,
          labor.trade,
          morningShiftText,
          eveningShiftText,
          otShiftText,
          otHoursText,
        ]);
      });

      // Create table
      autoTable(doc, {
        startY: yPosition,
        head: [['EPF', 'Labor Name', 'Trade', 'Morning Shift', 'Evening Shift', 'OT Shift', 'OT Hours']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [52, 144, 220],
          fontSize: 9,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8, 
          cellPadding: 3,
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },  // EPF
          1: { cellWidth: 35, halign: 'left' },    // Name
          2: { cellWidth: 20, halign: 'center' },  // Trade
          3: { cellWidth: 45, halign: 'left' },    // Morning Shift
          4: { cellWidth: 45, halign: 'left' },    // Evening Shift
          5: { cellWidth: 25, halign: 'center' },  // OT Hours
          6: { cellWidth: 60, halign: 'left' }     // OT Shift
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Important Notes Section
      if (yPosition > 160) {
        doc.addPage('landscape');
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Important Notes", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const notes = [
        "• This report shows daily labor assignments for active workers only.",
        "• Morning shift: 8:30 AM - 12:30 PM, Evening shift: 12:30 PM - 4:30 PM",
        "• OT Hours are calculated beyond regular working hours.",
        "• This document is for project division internal use only."
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
      const fileName = `Daily_Labor_Assignment_${selectedDate}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Generated",
        description: "Daily labor assignment report has been downloaded successfully",
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

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <div>
          <Heading size="lg" mb={2} color="teal.600">Labor Distribution Report</Heading>
          <Text color="gray.500" mb={4}>
            View daily labor assignments with job allocations and shift details
          </Text>
        </div>

        {/* Date Selection and Controls */}
        <Box bg={bg} p={{ base: 3, md: 4 }} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>Report Controls</Heading>
          
          <HStack spacing={4} align="end">
            <FormControl flex="2">
              <FormLabel fontSize="sm">Select Date</FormLabel>
              <Input
                type="date"
                size="sm"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
              />
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
                  isDisabled={!selectedDate || loading}
                  flex="1"
                >
                  Download PDF
                </Button>
                <Button
                  leftIcon={<FiCalendar />}
                  variant="outline"
                  colorScheme="blue"
                  size="sm"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  isDisabled={loading}
                >
                  Today
                </Button>
              </HStack>
            </FormControl>
          </HStack>
        </Box>

        {/* Loading State */}
        {loading && (
          <Center py={10}>
            <VStack>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.500">Loading daily assignments...</Text>
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

        {/* Report Content */}
        {selectedDate && !loading && (
          <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Report Header */}
                <Box textAlign="center">
                  <Heading size="lg" mb={2}>Daily Labor Assignment Report</Heading>
                  <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                    {formatDate(selectedDate)}
                  </Text>
                  <HStack justify="center" mt={2} spacing={4}>
                    <Badge colorScheme="blue" size="lg">
                      {laborAssignments.length} Active Labors
                    </Badge>
                    <Badge colorScheme="green" size="lg">
                      {laborAssignments.reduce((sum, labor) => {
                        let assignments = 0;
                        if (labor.morningShift) assignments++;
                        if (labor.eveningShift) assignments++;
                        assignments += labor.otJobs.length;
                        return sum + assignments;
                      }, 0)} Total Assignments
                    </Badge>
                  </HStack>
                </Box>

                <Divider />

                {/* Labor Assignment Table */}
                <Box>
                  <Heading size="md" mb={4}>Labor Assignments</Heading>
                  
                  {laborAssignments.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>EPF Number</Th>
                            <Th>Labor Name</Th>
                            <Th>Trade</Th>
                            <Th>Morning Shift</Th>
                            <Th>Evening Shift</Th>
                            <Th>OT Shift</Th>
                            <Th>OT Hours</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {laborAssignments.map((labor, laborIndex) => (
                            <Tr key={laborIndex}>
                              <Td fontWeight="medium">{labor.epfNumber}</Td>
                              <Td>{labor.fullName}</Td>
                              <Td>
                                <Badge colorScheme="purple" size="sm">
                                  {labor.trade}
                                </Badge>
                              </Td>
                              <Td>
                                {labor.morningShift ? (
                                  <Text fontSize="sm">
                                    <Text as="span" fontWeight="bold" color="blue.600">
                                      {labor.morningShift.jobId}
                                    </Text>
                                    <br />
                                    {labor.morningShift.jobName}
                                  </Text>
                                ) : (
                                  <Badge colorScheme="gray" size="sm">
                                    No Assignment
                                  </Badge>
                                )}
                              </Td>
                              <Td>
                                {labor.eveningShift ? (
                                  <Text fontSize="sm">
                                    <Text as="span" fontWeight="bold" color="orange.600">
                                      {labor.eveningShift.jobId}
                                    </Text>
                                    <br />
                                    {labor.eveningShift.jobName}
                                  </Text>
                                ) : (
                                  <Badge colorScheme="gray" size="sm">
                                    No Assignment
                                  </Badge>
                                )}
                              </Td>
                              <Td>
                                {labor.otJobs.length > 0 ? (
                                  <VStack spacing={1} align="start">
                                    {labor.otJobs.map((otJob, otIndex) => (
                                      <Text key={otIndex} fontSize="sm">
                                        <Text as="span" fontWeight="bold" color="blue.600">
                                          {otJob.jobId}
                                        </Text>
                                        <br />
                                        {otJob.jobName}
                                      </Text>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text fontSize="sm" color="gray.500">-</Text>
                                )}
                              </Td>
                                                            <Td>
                                {labor.otJobs.length > 0 ? (
                                  <VStack spacing={1} align="start">
                                    {labor.otJobs.map((otJob, otIndex) => (
                                      <Text key={otIndex} fontSize="sm" fontWeight="bold" color="red.600">
                                        {otJob.otHours}h
                                      </Text>
                                    ))}
                                  </VStack>
                                ) : (
                                  <Text fontSize="sm" color="gray.500">-</Text>
                                )}
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
                        <Text color="gray.500">No labor assignments found for {formatDate(selectedDate)}</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>

                <Divider />

                {/* Important Notes Section */}
                <Box bg="yellow.50" p={6} borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                  <VStack spacing={4} align="stretch">
                    <Heading size="sm" color="yellow.800">Important Notes</Heading>
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="xs" color="yellow.700">
                        • This report shows daily labor assignments for active workers only.
                      </Text>
                      <Text fontSize="xs" color="yellow.700">
                        • Morning shift: 8:30 AM - 12:30 PM, Evening shift: 12:30 PM - 4:30 PM
                      </Text>
                      <Text fontSize="xs" color="yellow.700">
                        • OT Hours are calculated beyond regular working hours.
                      </Text>
                      <Text fontSize="xs" color="yellow.700">
                        • This document is for project division internal use only.
                      </Text>
                    </VStack>
                  </VStack>
                </Box>

              </VStack>
            </CardBody>
          </Card>
        )}

        {/* No Date Selected Message */}
        {!selectedDate && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiCalendar} boxSize={16} color="gray.400" />
              <Heading size="md" color="gray.500">Select a Date</Heading>
              <Text color="gray.400" textAlign="center">
                Choose a date to view daily labor assignments
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default DailyLaborAssignment;
