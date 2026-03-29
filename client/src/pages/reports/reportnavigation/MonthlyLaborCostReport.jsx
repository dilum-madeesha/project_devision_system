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
  Input,
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
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  Badge,
  Divider,
  SimpleGrid,
  Select,
} from '@chakra-ui/react';
import { FiCalendar, FiDownload, FiFileText, FiTrendingUp } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportsAPI, jobAPI } from '../../../api';

const MonthlyLaborCostReport = () => {
  // Get current month and year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');

  // State variables
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  // Auto-fetch report data when month/year changes
  useEffect(() => {
    if (selectedYear && selectedMonth) {
      fetchReportData();
    } else {
      setReportData([]);
      setError(null);
    }
  }, [selectedYear, selectedMonth]);

  // Trade types for labor work summary
  const tradeTypes = [
    'Carpenter',
    'C/Helper',
    'Mason', 
    'M/Helper',
    'Painter',
    'P.K.S(LEO)',
    'P.K.S',
    'Other'
  ];

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (year, month) => {
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Fetch report data for the selected month
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate start and end dates for the month
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      
      // Start date: first day of the selected month
      const startDate = new Date(year, month - 1, 1);
      
      // End date: last day of the selected month
      // Use the next month's first day minus 1 day to get the last day of current month
      const endDate = new Date(year, month, 0);
      
      // Format dates as YYYY-MM-DD using local date methods to avoid timezone issues
      const formattedStartDate = startDate.getFullYear() + '-' + 
        String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(startDate.getDate()).padStart(2, '0');
      
      const formattedEndDate = endDate.getFullYear() + '-' + 
        String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(endDate.getDate()).padStart(2, '0');

      // Fetch all labor cost data for the date range
      const response = await reportsAPI.getMonthlyLaborCostReport(formattedStartDate, formattedEndDate);
      
      let allLaborCosts = [];
      
      if (response && Array.isArray(response)) {
        allLaborCosts = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allLaborCosts = response.data;
      }

      // Fetch job details for all unique job IDs
      const uniqueJobIds = [...new Set(allLaborCosts.map(cost => cost.jobId))];
      const jobDetailsMap = new Map();
      
      for (const jobId of uniqueJobIds) {
        try {
          const jobResponse = await jobAPI.getById(jobId);
          const jobData = jobResponse.data || jobResponse;
          if (jobData && jobData.id) {
            jobDetailsMap.set(jobId, jobData);
          }
        } catch (jobError) {
          console.error(`Error fetching job ${jobId}:`, jobError);
        }
      }

      // Merge job details with cost data
      const enrichedData = allLaborCosts.map(cost => ({
        ...cost,
        job: {
          ...cost.job,
          ...jobDetailsMap.get(cost.jobId)
        }
      }));
      
      setReportData(enrichedData);
      
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError(err.message || "Failed to fetch report data");
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to fetch report data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate monthly cost summary data
  const calculateMonthlyCostSummary = () => {
    const jobMap = new Map();
    
    reportData.forEach(cost => {
      const jobId = cost.job?.jobNumber || cost.jobId;
      
      if (!jobMap.has(jobId)) {
        jobMap.set(jobId, {
          jobId: jobId,
          jobName: cost.job?.title || 'Unknown Job',
          division: cost.job?.reqDepartment || 'N/A',
          totalDays: 0,
          regularCost: 0,
          otCost: 0,
          weekendCost: 0,
          totalCost: 0
        });
      }
      
      const jobSummary = jobMap.get(jobId);
      jobSummary.totalDays += 1;
      
      // Calculate costs from labor assignments
      if (cost.laborAssignments && cost.laborAssignments.length > 0) {
        cost.laborAssignments.forEach(assignment => {
          // Use pre-calculated costs from database instead of recalculating
          jobSummary.regularCost += parseFloat(assignment.regularCost) || 0;
          jobSummary.otCost += parseFloat(assignment.otCost) || 0;
          jobSummary.weekendCost += parseFloat(assignment.weekendPayCost) || 0;
        });
      }
      
      jobSummary.totalCost = jobSummary.regularCost + jobSummary.otCost + jobSummary.weekendCost;
    });
    
    return Array.from(jobMap.values());
  };

  // Calculate monthly labor work summary by trade
  const calculateMonthlyLaborWorkSummary = () => {
    const jobMap = new Map();

    reportData.forEach(cost => {
      const jobId = cost.job?.jobNumber || cost.jobId;
      const jobName = cost.job?.title || 'Unknown Job';

      if (!jobMap.has(jobId)) {
        jobMap.set(jobId, {
          jobId,
          jobName,
          trades: {}
        });
        
        // Initialize all trade types
        tradeTypes.forEach(trade => {
          jobMap.get(jobId).trades[trade] = 0;
        });
        jobMap.get(jobId).trades['Total'] = 0;
      }

      if (cost.laborAssignments && Array.isArray(cost.laborAssignments)) {
        cost.laborAssignments.forEach(assignment => {
          const totalHours = (parseFloat(assignment.regularHours) || 0) + (parseFloat(assignment.otHours) || 0);
          const tradeType = assignment.labor?.trade || 'Other';
          
          const jobSummary = jobMap.get(jobId);
          if (jobSummary.trades.hasOwnProperty(tradeType)) {
            jobSummary.trades[tradeType] += totalHours;
          } else {
            jobSummary.trades['Other'] += totalHours;
          }
          
          jobSummary.trades['Total'] += totalHours;
        });
      }
    });

    return Array.from(jobMap.values());
  };

  // Download PDF functionality
  const handleDownloadPDF = () => {
    if (!selectedYear || !selectedMonth || reportData.length === 0) {
      toast({
        title: "No Report Data",
        description: "Please select a month with available data before downloading PDF",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Report Header
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Monthly Labor Cost Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(formatDate(selectedYear, selectedMonth), pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;

      // Cost Summary Table
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Monthly Cost Summary', 14, yPosition);
      yPosition += 10;

      const costSummaryData = calculateMonthlyCostSummary();
      
      if (costSummaryData.length > 0) {
        const costHeaders = ['Job ID', 'Job Name', 'Division', 'Days', 'Regular Cost', 'OT Cost', 'Weekend Cost', 'Total'];

        const costRows = costSummaryData.map(row => [
          row.jobId,
          row.jobName,
          row.division,
          row.totalDays,
          formatCurrency(row.regularCost),
          formatCurrency(row.otCost),
          formatCurrency(row.weekendCost),
          formatCurrency(row.totalCost)
        ]);

        // Add totals row
        const totalDays = costSummaryData.reduce((sum, row) => sum + row.totalDays, 0);
        const totalRegular = costSummaryData.reduce((sum, row) => sum + row.regularCost, 0);
        const totalOT = costSummaryData.reduce((sum, row) => sum + row.otCost, 0);
        const totalWeekend = costSummaryData.reduce((sum, row) => sum + row.weekendCost, 0);
        const grandTotal = costSummaryData.reduce((sum, row) => sum + row.totalCost, 0);

        const totalsRow = ['', '', 'Total:', totalDays, formatCurrency(totalRegular), formatCurrency(totalOT), formatCurrency(totalWeekend), formatCurrency(grandTotal)];
        costRows.push(totalsRow);

        autoTable(doc, {
          startY: yPosition,
          head: [costHeaders],
          body: costRows,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' }
          },
          didParseCell: function (data) {
            if (data.row.index === costRows.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [240, 248, 255];
            }
          }
        });

        yPosition = doc.lastAutoTable.finalY + 20;
      }

      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = 20;
      }

      // Labor Work Summary Table
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Monthly Labor Work Summary (Working Hours by Trade)', 14, yPosition);
      yPosition += 10;

      const laborWorkSummaryData = calculateMonthlyLaborWorkSummary();
      
      if (laborWorkSummaryData.length > 0) {
        const laborHeaders = ['Job ID', 'Job Name', ...tradeTypes, 'Total'];
        const laborRows = laborWorkSummaryData.map(row => [
          row.jobId,
          row.jobName,
          ...tradeTypes.map(trade => row.trades[trade] > 0 ? row.trades[trade].toFixed(1) : '-'),
          row.trades['Total'] > 0 ? row.trades['Total'].toFixed(1) : '-'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [laborHeaders],
          body: laborRows,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 7, cellPadding: 2 },
          columnStyles: Object.fromEntries(
            tradeTypes.map((_, index) => [index + 2, { halign: 'right' }]).concat([[tradeTypes.length + 2, { halign: 'right', fontStyle: 'bold' }]])
          )
        });

        yPosition = doc.lastAutoTable.finalY + 20;
      }

      // Check if we need a new page for notes
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Report Notes
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Important Notes:', 14, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const notes = [
        '• This report summarizes labor costs for the entire month.',
        '• Values may have slight variations. These are approximate values.',
        '• This document is for project division internal use only.',
        '• This document cannot be used as an official document.'
      ];

      notes.forEach(note => {
        doc.text(note, 14, yPosition);
        yPosition += 5;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, pageHeight - 10);
      doc.text('Cost Tracking System', pageWidth - 14, pageHeight - 10, { align: 'right' });

      // Save the PDF
      const fileName = `Monthly_Labor_Cost_Report_${selectedYear}_${selectedMonth.padStart(2, '0')}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Downloaded",
        description: `Report saved as ${fileName}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating the PDF file",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const costSummaryData = reportData.length > 0 ? calculateMonthlyCostSummary() : [];
  const laborWorkSummaryData = reportData.length > 0 ? calculateMonthlyLaborWorkSummary() : [];

  // Generate year options (current year and 5 years back)
  const yearOptions = [];
  for (let i = 0; i < 6; i++) {
    yearOptions.push(currentYear - i);
  }

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <div>
          <Heading size="lg" mb={2} color="teal.600">Monthly Labor Cost Report</Heading>
          <Text color="gray.500" mb={4}>
            Generate monthly labor cost reports with detailed cost and work hour breakdowns
          </Text>
        </div>

        {/* Month/Year Selection and Controls */}
        <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Report Controls</Heading>
              
              <HStack spacing={4} align="end" flexWrap="wrap">
                <FormControl maxW="120px">
                  <FormLabel htmlFor="monthlyLaborCostYear" fontSize="sm">Year</FormLabel>
                  <Select
                    id="monthlyLaborCostYear"
                    name="monthlyLaborCostYear"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    size="sm"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl maxW="150px">
                  <FormLabel htmlFor="monthlyLaborCostMonth" fontSize="sm">Month</FormLabel>
                  <Select
                    id="monthlyLaborCostMonth"
                    name="monthlyLaborCostMonth"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    size="sm"
                  >
                    {monthNames.map((month, index) => (
                      <option key={index + 1} value={(index + 1).toString().padStart(2, '0')}>
                        {month}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  leftIcon={<FiDownload />}
                  colorScheme="green"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  isDisabled={reportData.length === 0 || loading}
                >
                  Download PDF
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Loading State */}
        {loading && (
          <Center py={10}>
            <VStack>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.500">Generating monthly report...</Text>
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

        {/* No Data State */}
        {selectedYear && selectedMonth && reportData.length === 0 && !loading && !error && (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">No Data Found</Text>
              <Text fontSize="sm">No labor cost data found for {formatDate(selectedYear, selectedMonth)}.</Text>
            </Box>
          </Alert>
        )}

        {/* Report Content */}
        {reportData.length > 0 && !loading && (
          <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Report Header */}
                <Box textAlign="center">
                  <Heading size="lg" mb={2}>Monthly Labor Cost Report</Heading>
                  <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                    {formatDate(selectedYear, selectedMonth)}
                  </Text>
                  <Badge colorScheme="blue" mt={2}>
                    {reportData.length} cost entries processed
                  </Badge>
                </Box>

                <Divider />

                {/* Summary Cards */}
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                  <Stat>
                    <StatLabel>Total Regular Cost</StatLabel>
                    <StatNumber fontSize="lg" color="green.600">
                      {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.regularCost, 0))}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Total OT Cost</StatLabel>
                    <StatNumber fontSize="lg" color="orange.600">
                      {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.otCost, 0))}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Total Weekend Cost</StatLabel>
                    <StatNumber fontSize="lg" color="purple.600">
                      {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.weekendCost, 0))}
                    </StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Grand Total</StatLabel>
                    <StatNumber fontSize="lg" color="blue.600">
                      {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.totalCost, 0))}
                    </StatNumber>
                  </Stat>
                </SimpleGrid>

                <Divider />

                {/* Monthly Cost Summary Table */}
                <Box>
                  <Heading size="md" mb={4}>Monthly Cost Summary</Heading>
                  
                  {costSummaryData.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>Job ID</Th>
                            <Th>Job Name</Th>
                            <Th>Division</Th>
                            <Th isNumeric>Total Days</Th>
                            <Th isNumeric>Regular Cost</Th>
                            <Th isNumeric>OT Cost</Th>
                            <Th isNumeric>Weekend Cost</Th>
                            <Th isNumeric>Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {costSummaryData.map((row, index) => (
                            <Tr key={index}>
                              <Td fontWeight="medium">{row.jobId}</Td>
                              <Td>{row.jobName}</Td>
                              <Td>
                                <Badge colorScheme="blue" size="sm">
                                  {row.division}
                                </Badge>
                              </Td>
                              <Td isNumeric>{row.totalDays}</Td>
                              <Td isNumeric>{formatCurrency(row.regularCost)}</Td>
                              <Td isNumeric>{formatCurrency(row.otCost)}</Td>
                              <Td isNumeric>{formatCurrency(row.weekendCost)}</Td>
                              <Td isNumeric fontWeight="bold">
                                {formatCurrency(row.totalCost)}
                              </Td>
                            </Tr>
                          ))}
                          
                          {/* Total Row */}
                          <Tr bg="blue.50">
                            <Td colSpan={3} fontWeight="bold" textAlign="right">
                              Total:
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {costSummaryData.reduce((sum, row) => sum + row.totalDays, 0)}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.regularCost, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.otCost, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.weekendCost, 0))}
                            </Td>
                            <Td isNumeric fontWeight="bold" color="blue.600">
                              {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.totalCost, 0))}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Center py={10}>
                      <VStack>
                        <Icon as={FiFileText} boxSize={12} color="gray.400" />
                        <Text color="gray.500">No labor cost data found for this month</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>

                <Divider />

                {/* Labor Work Summary Table */}
                <Box>
                  <Heading size="md" mb={4}>Monthly Labor Work Summary (Working Hours by Trade)</Heading>
                  
                  {laborWorkSummaryData.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>Job ID</Th>
                            <Th>Job Name</Th>
                            {tradeTypes.map(trade => (
                              <Th key={trade} isNumeric>{trade}</Th>
                            ))}
                            <Th isNumeric fontWeight="bold">Total</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {laborWorkSummaryData.map((row, index) => (
                            <Tr key={index}>
                              <Td fontWeight="medium">{row.jobId}</Td>
                              <Td>{row.jobName}</Td>
                              {tradeTypes.map(trade => (
                                <Td key={trade} isNumeric>
                                  {row.trades[trade] > 0 ? row.trades[trade].toFixed(1) : '-'}
                                </Td>
                              ))}
                              <Td isNumeric fontWeight="bold">
                                {row.trades['Total'] > 0 ? row.trades['Total'].toFixed(1) : '-'}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Center py={10}>
                      <VStack>
                        <Icon as={FiFileText} boxSize={12} color="gray.400" />
                        <Text color="gray.500">No labor work data found for this month</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>

                <Divider />

                {/* Report Notes */}
                <Box bg="yellow.50" p={4} borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                  <VStack spacing={2} align="start">
                    <Text fontSize="sm" fontWeight="bold" color="yellow.800">
                      Important Notes:
                    </Text>
                    <Text fontSize="xs" color="yellow.700">
                      • This report summarizes labor costs for the entire month.
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
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* No Month Selected Message */}
        {!selectedYear && !selectedMonth && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiCalendar} boxSize={16} color="gray.400" />
              <Heading size="md" color="gray.500">Select a Month</Heading>
              <Text color="gray.400" textAlign="center">
                Choose a month and year to generate the monthly labor cost report
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default MonthlyLaborCostReport;
