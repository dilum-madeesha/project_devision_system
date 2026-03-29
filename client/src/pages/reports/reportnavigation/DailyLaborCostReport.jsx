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
} from '@chakra-ui/react';
import { FiCalendar, FiEye, FiDownload, FiFileText } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportsAPI, jobAPI } from '../../../api';

const DailyLaborCostReport = () => {
  // State variables
  const [selectedDate, setSelectedDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  // Auto-fetch report data when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchReportData();
    } else {
      setReportData([]);
      setError(null);
    }
  }, [selectedDate]);

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
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
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

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch labor cost data for the selected date
      const response = await reportsAPI.getDailyLaborCostReport(selectedDate);
      let allLaborCosts = [];
      
      if (response && Array.isArray(response)) {
        allLaborCosts = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allLaborCosts = response.data;
      }
      
      // IMPORTANT FIX: Explicitly filter by the date field to ensure we're only getting records
      // with work dates on the selected date, not createdAt dates
      allLaborCosts = allLaborCosts.filter(cost => {
        const costDateStr = new Date(cost.date).toISOString().split('T')[0];
        return costDateStr === selectedDate;
      });
      
      let filteredData = allLaborCosts;

      // Fetch job details for all unique job IDs
      const uniqueJobIds = [...new Set(filteredData.map(cost => cost.jobId))];
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
      const enrichedData = filteredData.map(cost => ({
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

  // Calculate cost summary data
  const calculateCostSummary = () => {
    return reportData.map(cost => {
      let regularCost = 0;
      let otCost = 0;
      let weekendCost = 0;

      if (cost.laborAssignments && Array.isArray(cost.laborAssignments)) {
        cost.laborAssignments.forEach(assignment => {
          // Use the pre-calculated costs from the database instead of recalculating
          regularCost += parseFloat(assignment.regularCost) || 0;
          otCost += parseFloat(assignment.otCost) || 0;
          weekendCost += parseFloat(assignment.weekendPayCost) || 0;
        });
      }

      return {
        jobId: cost.job?.jobNumber || 'N/A',
        jobName: cost.job?.title || 'N/A',
        division: cost.job?.reqDepartment || 'N/A',
        regularCost,
        otCost,
        weekendCost,
        totalCost: parseFloat(cost.cost) || 0
      };
    });
  };

  // Calculate labor work summary by trade
  const calculateLaborWorkSummary = () => {
    const jobSummary = {};

    reportData.forEach(cost => {
      const jobId = cost.job?.jobNumber || 'N/A';
      const jobName = cost.job?.title || 'N/A';

      if (!jobSummary[jobId]) {
        jobSummary[jobId] = {
          jobId,
          jobName,
          trades: {}
        };
        
        // Initialize all trade types
        tradeTypes.forEach(trade => {
          jobSummary[jobId].trades[trade] = 0;
        });
        jobSummary[jobId].trades['Total'] = 0;
      }

      if (cost.laborAssignments && Array.isArray(cost.laborAssignments)) {
        cost.laborAssignments.forEach(assignment => {
          const totalHours = (parseFloat(assignment.regularHours) || 0) + (parseFloat(assignment.otHours) || 0);
          const tradeType = assignment.labor?.trade || 'Other';
          
          if (jobSummary[jobId].trades.hasOwnProperty(tradeType)) {
            jobSummary[jobId].trades[tradeType] += totalHours;
          } else {
            jobSummary[jobId].trades['Other'] += totalHours;
          }
          
          jobSummary[jobId].trades['Total'] += totalHours;
        });
      }
    });

    return Object.values(jobSummary);
  };

  // Download PDF functionality
  const handleDownloadPDF = () => {
    if (!selectedDate || reportData.length === 0) {
      toast({
        title: "No Report Data",
        description: "Please select a date with available data before downloading PDF",
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
      doc.text('Daily Labor Cost Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(formatDate(selectedDate), pageWidth / 2, yPosition, { align: 'center' });
      
      if (isWeekend(selectedDate)) {
        yPosition += 7;
        doc.setFontSize(12);
        doc.setTextColor(255, 140, 0); // Orange color
        doc.text(`${isSaturday(selectedDate) ? 'Saturday' : 'Sunday'} - Weekend`, pageWidth / 2, yPosition, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Reset to black
      }

      yPosition += 20;

      // Cost Summary Table
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Cost Summary', 14, yPosition);
      yPosition += 10;

      const costSummaryData = calculateCostSummary();
      
      if (costSummaryData.length > 0) {
        const costHeaders = ['Job ID', 'Job Name', 'Division', 'Day/Regular Cost', 'OT Cost'];
        if (isWeekend(selectedDate)) {
          costHeaders.push('Weekend Cost');
        }
        costHeaders.push('Total');

        const costRows = costSummaryData.map(row => {
          const rowData = [
            row.jobId,
            row.jobName,
            row.division,
            formatCurrency(row.regularCost),
            formatCurrency(row.otCost)
          ];
          if (isWeekend(selectedDate)) {
            rowData.push(formatCurrency(row.weekendCost));
          }
          rowData.push(formatCurrency(row.totalCost));
          return rowData;
        });

        // Add totals row
        const totalRegular = costSummaryData.reduce((sum, row) => sum + row.regularCost, 0);
        const totalOT = costSummaryData.reduce((sum, row) => sum + row.otCost, 0);
        const totalWeekend = costSummaryData.reduce((sum, row) => sum + row.weekendCost, 0);
        const grandTotal = costSummaryData.reduce((sum, row) => sum + row.totalCost, 0);

        const totalsRow = ['', '', 'Total:', formatCurrency(totalRegular), formatCurrency(totalOT)];
        if (isWeekend(selectedDate)) {
          totalsRow.push(formatCurrency(totalWeekend));
        }
        totalsRow.push(formatCurrency(grandTotal));
        
        costRows.push(totalsRow);

        autoTable(doc, {
          startY: yPosition,
          head: [costHeaders],
          body: costRows,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: isWeekend(selectedDate) ? { halign: 'right' } : { halign: 'right' },
            6: isWeekend(selectedDate) ? { halign: 'right' } : undefined
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
      doc.text('Labor Work Summary (Working Hours by Trade)', 14, yPosition);
      yPosition += 10;

      const laborWorkSummaryData = calculateLaborWorkSummary();
      
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
          styles: { fontSize: 8, cellPadding: 2 },
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
      const fileName = `Daily_Labor_Cost_Report_${selectedDate}.pdf`;
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

  const costSummaryData = reportData.length > 0 ? calculateCostSummary() : [];
  const laborWorkSummaryData = reportData.length > 0 ? calculateLaborWorkSummary() : [];

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <div>
          <Heading size="lg" mb={2} color="teal.600">Daily Labor Cost Report</Heading>
          <Text color="gray.500" mb={4}>
            Generate daily labor cost reports with detailed cost and work hour breakdowns
          </Text>
        </div>

        {/* Date Selection and Controls */}
        <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Report Controls</Heading>
              
              <HStack spacing={4} align="end" flexWrap="wrap">
                <FormControl maxW="200px">
                  <FormLabel htmlFor="dailyLaborCostReportDate" fontSize="sm">Select Date</FormLabel>
                  <Input
                    id="dailyLaborCostReportDate"
                    name="dailyLaborCostReportDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    size="sm"
                  />
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
              <Text mt={4} color="gray.500">Generating report...</Text>
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
        {selectedDate && reportData.length === 0 && !loading && !error && (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">No Data Found</Text>
              <Text fontSize="sm">No daily labor cost data found for {formatDate(selectedDate)}.</Text>
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
                  <Heading size="lg" mb={2}>Daily Labor Cost Report</Heading>
                  <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                    {formatDate(selectedDate)}
                  </Text>
                  {isWeekend(selectedDate) && (
                    <Badge colorScheme="orange" mt={2}>
                      {isSaturday(selectedDate) ? 'Saturday' : 'Sunday'} - Weekend
                    </Badge>
                  )}
                </Box>

                <Divider />

                {/* Cost Summary Table */}
                <Box>
                  <Heading size="md" mb={4}>Cost Summary</Heading>
                  
                  {costSummaryData.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>Job ID</Th>
                            <Th>Job Name</Th>
                            <Th>Division</Th>
                            <Th isNumeric>Day/Regular Cost</Th>
                            <Th isNumeric>OT Cost</Th>
                            {isWeekend(selectedDate) && <Th isNumeric>Weekend Cost</Th>}
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
                              <Td isNumeric>{formatCurrency(row.regularCost)}</Td>
                              <Td isNumeric>{formatCurrency(row.otCost)}</Td>
                              {isWeekend(selectedDate) && (
                                <Td isNumeric>{formatCurrency(row.weekendCost)}</Td>
                              )}
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
                              {formatCurrency(
                                costSummaryData.reduce((sum, row) => sum + row.regularCost, 0)
                              )}
                            </Td>
                            <Td isNumeric fontWeight="bold">
                              {formatCurrency(
                                costSummaryData.reduce((sum, row) => sum + row.otCost, 0)
                              )}
                            </Td>
                            {isWeekend(selectedDate) && (
                              <Td isNumeric fontWeight="bold">
                                {formatCurrency(
                                  costSummaryData.reduce((sum, row) => sum + row.weekendCost, 0)
                                )}
                              </Td>
                            )}
                            <Td isNumeric fontWeight="bold" color="blue.600">
                              {formatCurrency(
                                costSummaryData.reduce((sum, row) => sum + row.totalCost, 0)
                              )}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Center py={10}>
                      <VStack>
                        <Icon as={FiFileText} boxSize={12} color="gray.400" />
                        <Text color="gray.500">No labor cost data found for this date</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>

                <Divider />

                {/* Labor Work Summary Table */}
                <Box>
                  <Heading size="md" mb={4}>Labor Work Summary (Working Hours by Trade)</Heading>
                  
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
                        <Text color="gray.500">No labor work data found for this date</Text>
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

        {/* No Date Selected Message */}
        {!selectedDate && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiCalendar} boxSize={16} color="gray.400" />
              <Heading size="md" color="gray.500">Select a Date</Heading>
              <Text color="gray.400" textAlign="center">
                Choose a date and click "View Report" to generate the daily labor cost report
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default DailyLaborCostReport;