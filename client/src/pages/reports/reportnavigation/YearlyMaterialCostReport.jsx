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
} from '@chakra-ui/react';
import { FiCalendar, FiDownload, FiFileText, FiPackage } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportsAPI, jobAPI } from '../../../api';

const YearlyMaterialCostReport = () => {
  // Get current year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // State variables
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  // Auto-fetch report data when year changes
  useEffect(() => {
    if (selectedYear) {
      fetchReportData();
    } else {
      setReportData([]);
      setError(null);
    }
  }, [selectedYear]);

  // Helper functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Fetch report data for the selected year
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate start and end dates for the year
      const year = parseInt(selectedYear);
      
      // Start date: January 1st of the selected year
      const startDate = new Date(year, 0, 1);
      
      // End date: December 31st of the selected year
      const endDate = new Date(year, 11, 31);
      
      // Format dates as YYYY-MM-DD using local date methods to avoid timezone issues
      const formattedStartDate = startDate.getFullYear() + '-' + 
        String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(startDate.getDate()).padStart(2, '0');
      
      const formattedEndDate = endDate.getFullYear() + '-' + 
        String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(endDate.getDate()).padStart(2, '0');

      console.log(`Yearly Material Report Date Range: ${formattedStartDate} to ${formattedEndDate}`);

      // Fetch all material cost data for the date range
      const response = await reportsAPI.getYearlyMaterialCostReport(formattedStartDate, formattedEndDate);
      
      let allMaterialCosts = [];
      
      if (response && Array.isArray(response)) {
        allMaterialCosts = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        allMaterialCosts = response.data;
      }

      console.log(`Yearly Material Report: Found ${allMaterialCosts.length} records for ${selectedYear}`);

      // Fetch job details for all unique job IDs
      const uniqueJobIds = [...new Set(allMaterialCosts.map(order => order.jobId))];
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
      const enrichedData = allMaterialCosts.map(order => ({
        ...order,
        job: {
          ...order.job,
          ...jobDetailsMap.get(order.jobId)
        }
      }));
      
      setReportData(enrichedData);
      
    } catch (err) {
      console.error("Error fetching yearly material report data:", err);
      setError(err.message || "Failed to fetch yearly material report data");
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to fetch yearly material report data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate yearly material cost summary data (Table 1: Job-wise totals)
  const calculateYearlyCostSummary = () => {
    const jobMap = new Map();
    
    reportData.forEach(order => {
      const jobId = order.job?.jobNumber || order.jobId;
      
      if (!jobMap.has(jobId)) {
        jobMap.set(jobId, {
          jobId: jobId,
          jobName: order.job?.title || 'Unknown Job',
          division: order.job?.reqDepartment || 'N/A',
          totalCost: 0
        });
      }
      
      const jobSummary = jobMap.get(jobId);
      jobSummary.totalCost += parseFloat(order.cost) || 0;
    });
    
    return Array.from(jobMap.values());
  };

  // Get all material orders for detailed table (Table 2: All material orders)
  const getMaterialOrdersData = () => {
    return reportData.map(order => ({
      jobId: order.job?.jobNumber || order.jobId,
      jobName: order.job?.title || 'Unknown Job',
      type: order.type || 'N/A',
      orderNumber: order.code || 'N/A',
      cost: parseFloat(order.cost) || 0,
      date: order.date || 'N/A'
    }));
  };

  // Download PDF functionality
  const handleDownloadPDF = () => {
    if (!selectedYear || reportData.length === 0) {
      toast({
        title: "No Report Data",
        description: "Please select a year with available data before downloading PDF",
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
      doc.text('Yearly Material Cost Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont(undefined, 'normal');
      doc.text(`Year: ${selectedYear}`, pageWidth / 2, yPosition, { align: 'center' });

      yPosition += 20;

      // Cost Summary Table
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Yearly Cost Summary', 14, yPosition);
      yPosition += 10;

      const costSummaryData = calculateYearlyCostSummary();
      
      if (costSummaryData.length > 0) {
        const costHeaders = ['Job ID', 'Job Name', 'Division', 'Total Cost'];

        const costRows = costSummaryData.map(row => [
          row.jobId,
          row.jobName,
          row.division,
          formatCurrency(row.totalCost)
        ]);

        // Add totals row
        const grandTotal = costSummaryData.reduce((sum, row) => sum + row.totalCost, 0);
        const totalsRow = ['', '', 'Total:', formatCurrency(grandTotal)];
        costRows.push(totalsRow);

        autoTable(doc, {
          startY: yPosition,
          head: [costHeaders],
          body: costRows,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            3: { halign: 'right' }
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

      // Material Orders Table
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Material Orders', 14, yPosition);
      yPosition += 10;

      const materialOrdersData = getMaterialOrdersData();
      
      if (materialOrdersData.length > 0) {
        const orderHeaders = ['Date', 'Job ID', 'Job Name', 'Type', 'Order Number', 'Cost'];
        const orderRows = materialOrdersData.map(row => [
          new Date(row.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }),
          row.jobId,
          row.jobName,
          row.type,
          row.orderNumber,
          formatCurrency(row.cost)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [orderHeaders],
          body: orderRows,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            5: { halign: 'right' }
          }
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
        '• This report summarizes material costs for the entire year.',
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
      const fileName = `Yearly_Material_Cost_Report_${selectedYear}.pdf`;
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

  const costSummaryData = reportData.length > 0 ? calculateYearlyCostSummary() : [];
  const materialOrdersData = reportData.length > 0 ? getMaterialOrdersData() : [];

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
          <Heading size="lg" mb={2} color="teal.600">Yearly Material Cost Report</Heading>
          <Text color="gray.500" mb={4}>
            Generate yearly material cost reports with detailed order analysis
          </Text>
        </div>

        {/* Year Selection and Controls */}
        <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Report Controls</Heading>
              
              <HStack spacing={4} align="end" flexWrap="wrap">
                <FormControl maxW="120px">
                  <FormLabel htmlFor="yearlyMaterialCostYear" fontSize="sm">Year</FormLabel>
                  <Select
                    id="yearlyMaterialCostYear"
                    name="yearlyMaterialCostYear"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    size="sm"
                  >
                    {yearOptions.map(year => (
                      <option key={year} value={year.toString()}>{year}</option>
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
              <Text mt={4} color="gray.500">Generating yearly material report...</Text>
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
        {selectedYear && reportData.length === 0 && !loading && !error && (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">No Data Found</Text>
              <Text fontSize="sm">No material cost data found for year {selectedYear}.</Text>
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
                  <Heading size="lg" mb={2}>Yearly Material Cost Report</Heading>
                  <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                    Year: {selectedYear}
                  </Text>
                  <Badge colorScheme="blue" mt={2}>
                    {reportData.length} material orders processed
                  </Badge>
                </Box>

                <Divider />

                {/* Summary Card */}
                <SimpleGrid columns={{ base: 1, md: 1 }} spacing={4}>
                  <Stat textAlign="center">
                    <StatLabel>Total Material Cost</StatLabel>
                    <StatNumber fontSize="2xl" color="green.600">
                      {formatCurrency(costSummaryData.reduce((sum, row) => sum + row.totalCost, 0))}
                    </StatNumber>
                  </Stat>
                </SimpleGrid>

                <Divider />

                {/* Table 1: Yearly Cost Summary (Job-wise totals) */}
                <Box>
                  <Heading size="md" mb={4}>Yearly Cost Summary</Heading>
                  
                  {costSummaryData.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>Job ID</Th>
                            <Th>Job Name</Th>
                            <Th>Division</Th>
                            <Th isNumeric>Total Cost</Th>
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
                        <Text color="gray.500">No material cost data found for this year</Text>
                      </VStack>
                    </Center>
                  )}
                </Box>

                <Divider />

                {/* Table 2: Material Orders (All material orders with details) */}
                <Box>
                  <Heading size="md" mb={4}>Material Orders</Heading>
                  
                  {materialOrdersData.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Job ID</Th>
                            <Th>Job Name</Th>
                            <Th>Type</Th>
                            <Th>Order Number</Th>
                            <Th isNumeric>Cost</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {materialOrdersData.map((row, index) => (
                            <Tr key={index}>
                              <Td fontWeight="medium">
                                {new Date(row.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}
                              </Td>
                              <Td fontWeight="medium">{row.jobId}</Td>
                              <Td>{row.jobName}</Td>
                              <Td>
                                <Badge colorScheme="purple" size="sm">
                                  {row.type}
                                </Badge>
                              </Td>
                              <Td>{row.orderNumber}</Td>
                              <Td isNumeric fontWeight="medium">
                                {formatCurrency(row.cost)}
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
                        <Text color="gray.500">No material orders found for this year</Text>
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
                      • This report summarizes material costs for the entire year.
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

        {/* No Year Selected Message */}
        {!selectedYear && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiCalendar} boxSize={16} color="gray.400" />
              <Heading size="md" color="gray.500">Select a Year</Heading>
              <Text color="gray.400" textAlign="center">
                Choose a year to generate the yearly material cost report
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default YearlyMaterialCostReport;
