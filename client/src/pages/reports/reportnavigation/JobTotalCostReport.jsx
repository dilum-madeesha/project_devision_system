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
import { FiBriefcase, FiDownload, FiFileText, FiCalendar, FiUser, FiDollarSign } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportsAPI, jobAPI, dailyLaborCostAPI, materialOrderAPI } from '../../../api';

const JobTotalCostReport = () => {
  // State variables
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [jobDetails, setJobDetails] = useState(null);
  const [laborData, setLaborData] = useState([]);
  const [materialData, setMaterialData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableHeaderBg = useColorModeValue("gray.50", "gray.900");
  const toast = useToast();

  // Fetch all jobs on component mount
  useEffect(() => {
    fetchJobs();
  }, []);

  // Apply filters whenever filter values change
  useEffect(() => {
    applyFilters();
  }, [departmentFilter, statusFilter, jobs]);

  // Fetch job details and cost data when job is selected
  useEffect(() => {
    if (selectedJobId) {
      fetchJobTotalCostData();
    } else {
      setJobDetails(null);
      setLaborData([]);
      setMaterialData([]);
      setError(null);
    }
  }, [selectedJobId]);

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

  // Fetch all jobs for selection dropdown
  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll();
      let jobsData = [];
      
      if (response && Array.isArray(response)) {
        jobsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (response && response.jobs && Array.isArray(response.jobs)) {
        jobsData = response.jobs;
      }
      
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      setFilteredJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      toast({
        title: "Error fetching jobs",
        description: "Failed to load job list",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Apply filters to jobs list
  const applyFilters = () => {
    let filtered = [...jobs];

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(job => job.reqDepartment === departmentFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    setFilteredJobs(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setDepartmentFilter('');
    setStatusFilter('');
    setSelectedJobId('');
    setJobDetails(null);
    setLaborData([]);
    setMaterialData([]);
    setError(null);
  };

  // Handle job selection
  const handleJobSelect = async (jobId) => {
    setSelectedJobId(jobId);
    if (!jobId) {
      setJobDetails(null);
      setLaborData([]);
      setMaterialData([]);
      setError(null);
      return;
    }
  };

  // Fetch job total cost data
  const fetchJobTotalCostData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching job cost data for job ID: ${selectedJobId}`);

      // Fetch job details
      const jobResponse = await jobAPI.getById(selectedJobId);
      const jobData = jobResponse.data || jobResponse;
      setJobDetails(jobData);

      console.log('Job details fetched:', jobData);

      // Fetch labor costs for the job (same approach as JobCostPage)
      const laborResponse = await dailyLaborCostAPI.getAll(1, 1000);
      let allLaborCosts = [];
      
      if (laborResponse && Array.isArray(laborResponse)) {
        allLaborCosts = laborResponse;
      } else if (laborResponse && laborResponse.data && Array.isArray(laborResponse.data)) {
        allLaborCosts = laborResponse.data;
      }
      
      // Filter labor costs for selected job
      const jobLaborCosts = allLaborCosts.filter(cost => cost.job?.id === parseInt(selectedJobId));
      
      console.log(`Filtered labor costs: ${jobLaborCosts.length} records for job ${selectedJobId}`);
      
      // Fetch material costs for the job (same approach as JobCostPage)
      const materialResponse = await materialOrderAPI.getAll(1, 1000);
      let allMaterialCosts = [];
      
      if (materialResponse && Array.isArray(materialResponse)) {
        allMaterialCosts = materialResponse;
      } else if (materialResponse && materialResponse.data && Array.isArray(materialResponse.data)) {
        allMaterialCosts = materialResponse.data;
      }
      
      // Filter material costs for selected job
      const jobMaterialCosts = allMaterialCosts.filter(cost => cost.job?.id === parseInt(selectedJobId));
      
      console.log(`Filtered material costs: ${jobMaterialCosts.length} records for job ${selectedJobId}`);
      
      setLaborData(jobLaborCosts);
      setMaterialData(jobMaterialCosts);

      console.log(`Job Total Cost Report: Job ${selectedJobId} - Labor: ${jobLaborCosts.length}, Materials: ${jobMaterialCosts.length}`);
      
    } catch (err) {
      console.error("Error fetching job total cost data:", err);
      setError(err.message || "Failed to fetch job total cost data");
      toast({
        title: "Error fetching data",
        description: err.message || "Failed to fetch job total cost data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate cost overview
  const calculateCostOverview = () => {
    const totalLaborCost = Array.isArray(laborData) ? 
      laborData.reduce((sum, labor) => sum + (parseFloat(labor.cost) || 0), 0) : 0;
    const totalMaterialCost = Array.isArray(materialData) ? 
      materialData.reduce((sum, material) => sum + (parseFloat(material.cost) || 0), 0) : 0;
    const totalCost = totalLaborCost + totalMaterialCost;

    return {
      totalLaborCost,
      totalMaterialCost,
      totalCost
    };
  };

  // Calculate labor cost overview
  const calculateLaborCostOverview = () => {
    let regularCost = 0;
    let otCost = 0;
    let weekendCost = 0;

    // Ensure laborData is an array before iterating
    if (Array.isArray(laborData) && laborData.length > 0) {
      laborData.forEach(labor => {
        // Check if laborAssignments exist (same as JobCostPage)
        if (labor.laborAssignments && Array.isArray(labor.laborAssignments)) {
          labor.laborAssignments.forEach(assignment => {
            regularCost += parseFloat(assignment.regularCost) || 0;
            otCost += parseFloat(assignment.otCost) || 0;
            weekendCost += parseFloat(assignment.weekendPayCost) || 0;
          });
        }
      });
    }

    return {
      regularCost,
      otCost,
      weekendCost,
      totalLaborCost: regularCost + otCost + weekendCost
    };
  };

  // Calculate working hours by trade
  const calculateWorkingHoursByTrade = () => {
    const tradeMap = new Map();

    // Ensure laborData is an array before iterating
    if (Array.isArray(laborData) && laborData.length > 0) {
      laborData.forEach(labor => {
        // Check if laborAssignments exist (same as JobCostPage)
        if (labor.laborAssignments && Array.isArray(labor.laborAssignments)) {
          labor.laborAssignments.forEach(assignment => {
            const trade = assignment.labor?.trade || 'Unknown Trade';
            const regularHours = parseFloat(assignment.regularHours) || 0;
            const otHours = parseFloat(assignment.otHours) || 0;
            const weekendHours = parseFloat(assignment.weekendHours) || 0;

            if (!tradeMap.has(trade)) {
              tradeMap.set(trade, {
                trade,
                regularHours: 0,
                otHours: 0,
                weekendHours: 0,
                totalHours: 0
              });
            }

            const tradeData = tradeMap.get(trade);
            tradeData.regularHours += regularHours;
            tradeData.otHours += otHours;
            tradeData.weekendHours += weekendHours;
            tradeData.totalHours += regularHours + otHours + weekendHours;
          });
        }
      });
    }

    return Array.from(tradeMap.values());
  };

  // Get worked labors list (aggregated by labor)
  const getWorkedLaborsList = () => {
    const laborMap = new Map();
    
    // Ensure laborData is an array before mapping
    if (!Array.isArray(laborData)) {
      return [];
    }
    
    laborData.forEach(labor => {
      // Check if laborAssignments exist (same as JobCostPage)
      if (labor.laborAssignments && Array.isArray(labor.laborAssignments)) {
        labor.laborAssignments.forEach(assignment => {
          const laborId = assignment.labor?.id || `unknown-${Math.random()}`;
          const laborName = `${assignment.labor?.firstName || ''} ${assignment.labor?.lastName || ''}`.trim() || 'Unknown Labor';
          const trade = assignment.labor?.trade || 'Unknown Trade';
          
          const regularHours = parseFloat(assignment.regularHours) || 0;
          const otHours = parseFloat(assignment.otHours) || 0;
          const weekendHours = parseFloat(assignment.weekendHours) || 0;
          const totalCost = parseFloat(assignment.totalCost) || 0;
          
          if (!laborMap.has(laborId)) {
            laborMap.set(laborId, {
              laborName: laborName,
              trade: trade,
              regularHours: 0,
              otHours: 0,
              weekendHours: 0,
              totalHours: 0,
              cost: 0
            });
          }
          
          const laborEntry = laborMap.get(laborId);
          laborEntry.regularHours += regularHours;
          laborEntry.otHours += otHours;
          laborEntry.weekendHours += weekendHours;
          laborEntry.totalHours += regularHours + otHours + weekendHours;
          laborEntry.cost += totalCost;
        });
      }
    });
    
    return Array.from(laborMap.values());
  };

  // Export to PDF function
  const exportToPDF = () => {
    if (!jobDetails) {
      toast({
        title: "No Data",
        description: "Please select a job to export",
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
      doc.text("Job Total Cost Report", pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Job Details Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Job Information", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Job Details Table
      const jobDetailsData = [
        ['Job ID', jobDetails.jobNumber || 'N/A', 'Job Name', jobDetails.title || 'N/A'],
        ['Division', jobDetails.reqDepartment || 'N/A', 'Project Code', jobDetails.projectCode || 'N/A'],
        ['Budget Allocation', formatCurrency(jobDetails.budgetAllocation || 0), 'Status', jobDetails.status || 'N/A'],
        ['Start Date', formatDate(jobDetails.startDate), 'End Date', formatDate(jobDetails.endDate)],
        ['Assigned Officer', jobDetails.assignOfficer || 'N/A', 'Requested Date', formatDate(jobDetails.reqDate)]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: jobDetailsData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: [240, 240, 240] },
          2: { fontStyle: 'bold', fillColor: [240, 240, 240] }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Cost Overview Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Cost Overview", margin, yPosition);
      yPosition += 10;

      const costOverview = calculateCostOverview();
      const costOverviewData = [
        ['Total Labor Cost', formatCurrency(costOverview.totalLaborCost)],
        ['Total Material Cost', formatCurrency(costOverview.totalMaterialCost)],
        ['Total Job Cost', formatCurrency(costOverview.totalCost)]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Cost Type', 'Amount']],
        body: costOverviewData,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Labor Cost Details Section
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Labor Cost Details", margin, yPosition);
      yPosition += 10;

      const laborCostOverview = calculateLaborCostOverview();
      const laborOverviewData = [
        ['Regular Cost', formatCurrency(laborCostOverview.regularCost)],
        ['Overtime Cost', formatCurrency(laborCostOverview.otCost)],
        ['Weekend Cost', formatCurrency(laborCostOverview.weekendCost)],
        ['Total Labor Cost', formatCurrency(laborCostOverview.totalLaborCost)]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Cost Type', 'Amount']],
        body: laborOverviewData,
        theme: 'striped',
        headStyles: { fillColor: [40, 167, 69] },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Working Hours by Trade
      const workingHoursByTrade = calculateWorkingHoursByTrade();
      if (workingHoursByTrade.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Working Hours by Trade", margin, yPosition);
        yPosition += 8;

        const tradeHoursData = workingHoursByTrade.map(trade => [
          trade.trade,
          trade.regularHours.toFixed(1) + 'h',
          trade.otHours.toFixed(1) + 'h',
          trade.weekendHours.toFixed(1) + 'h',
          trade.totalHours.toFixed(1) + 'h'
        ]);

        // Add totals row
        const totalRegular = workingHoursByTrade.reduce((sum, trade) => sum + trade.regularHours, 0);
        const totalOT = workingHoursByTrade.reduce((sum, trade) => sum + trade.otHours, 0);
        const totalWeekend = workingHoursByTrade.reduce((sum, trade) => sum + trade.weekendHours, 0);
        const totalHours = workingHoursByTrade.reduce((sum, trade) => sum + trade.totalHours, 0);

        tradeHoursData.push([
          'TOTAL',
          totalRegular.toFixed(1) + 'h',
          totalOT.toFixed(1) + 'h',
          totalWeekend.toFixed(1) + 'h',
          totalHours.toFixed(1) + 'h'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Trade', 'Regular Hours', 'OT Hours', 'Weekend Hours', 'Total Hours']],
          body: tradeHoursData,
          theme: 'striped',
          headStyles: { fillColor: [23, 162, 184] },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center', fontStyle: 'bold' }
          },
          didParseCell: function (data) {
            // Style the total row
            if (data.row.index === tradeHoursData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [220, 220, 220];
            }
          },
          margin: { left: margin, right: margin }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Worked Labors List Section
      const workedLaborsList = getWorkedLaborsList();
      if (workedLaborsList.length > 0) {
        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Worked Labors List", margin, yPosition);
        yPosition += 8;

        const laborListData = workedLaborsList.map(labor => [
          labor.laborName,
          labor.trade,
          labor.regularHours.toFixed(1) + 'h',
          labor.otHours.toFixed(1) + 'h',
          labor.weekendHours.toFixed(1) + 'h',
          labor.totalHours.toFixed(1) + 'h',
          formatCurrency(labor.cost)
        ]);

        // Add totals row
        const totalRegularHours = workedLaborsList.reduce((sum, labor) => sum + labor.regularHours, 0);
        const totalOTHours = workedLaborsList.reduce((sum, labor) => sum + labor.otHours, 0);
        const totalWeekendHours = workedLaborsList.reduce((sum, labor) => sum + labor.weekendHours, 0);
        const totalHours = workedLaborsList.reduce((sum, labor) => sum + labor.totalHours, 0);
        const totalCost = workedLaborsList.reduce((sum, labor) => sum + labor.cost, 0);

        laborListData.push([
          'TOTAL',
          '',
          totalRegularHours.toFixed(1) + 'h',
          totalOTHours.toFixed(1) + 'h',
          totalWeekendHours.toFixed(1) + 'h',
          totalHours.toFixed(1) + 'h',
          formatCurrency(totalCost)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Labor Name', 'Trade', 'Regular Hours', 'OT Hours', 'Weekend Hours', 'Total Hours', 'Cost']],
          body: laborListData,
          theme: 'striped',
          headStyles: { fillColor: [255, 159, 64] },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 25 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', cellWidth: 20 },
            5: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
            6: { halign: 'right', cellWidth: 25 }
          },
          didParseCell: function (data) {
            // Style the total row
            if (data.row.index === laborListData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [220, 220, 220];
            }
          },
          margin: { left: margin, right: margin }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Material Cost Details Section
      if (Array.isArray(materialData) && materialData.length > 0) {
        if (yPosition > 180) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Material Cost Details", margin, yPosition);
        yPosition += 10;

        const materialDetailsData = materialData.map(material => [
          formatDate(material.date),
          material.code || 'N/A',
          material.type || 'N/A',
          material.description || 'N/A',
          formatCurrency(material.cost)
        ]);

        // Add total row
        const totalMaterialCost = materialData.reduce((sum, material) => sum + (parseFloat(material.cost) || 0), 0);
        materialDetailsData.push([
          '', '', '', 'TOTAL', formatCurrency(totalMaterialCost)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Order Number', 'Type', 'Description', 'Cost']],
          body: materialDetailsData,
          theme: 'striped',
          headStyles: { fillColor: [156, 39, 176] },
          styles: { fontSize: 9, cellPadding: 3 },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 30 },
            2: { cellWidth: 25 },
            3: { cellWidth: 60 },
            4: { halign: 'right' }
          },
          didParseCell: function (data) {
            // Style the total row
            if (data.row.index === materialDetailsData.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [220, 220, 220];
            }
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
        "• This report summarizes total costs for the selected job with detailed breakdowns.",
        "• Values may have slight variations. These are approximate values.",
        "• This document is for project division internal use only.",
        "• This document cannot be used as an official document."
      ];

      notes.forEach(note => {
        doc.text(note, margin + 5, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

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
      const fileName = `Job_Total_Cost_Report_${jobDetails.jobNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF Generated",
        description: "Job total cost report has been downloaded successfully",
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

  const laborCostOverview = jobDetails ? calculateLaborCostOverview() : { regularCost: 0, otCost: 0, weekendCost: 0, totalLaborCost: 0 };
  const workingHoursByTrade = jobDetails ? calculateWorkingHoursByTrade() : [];
  const workedLaborsList = jobDetails ? getWorkedLaborsList() : [];
  const costOverview = jobDetails ? calculateCostOverview() : { totalLaborCost: 0, totalMaterialCost: 0, totalCost: 0 };

  // Get unique departments and statuses for filters
  const uniqueDepartments = [...new Set(jobs.map(job => job.reqDepartment).filter(Boolean))];
  const uniqueStatuses = [...new Set(jobs.map(job => job.status).filter(Boolean))];

  return (
    <Box w="100%" px={{ base: 2, md: 4, lg: 6 }} py={{ base: 4, md: 6 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <div>
          <Heading size="lg" mb={2} color="teal.600">Job Total Cost Report</Heading>
          <Text color="gray.500" mb={4}>
            Generate comprehensive job cost reports with detailed breakdowns
          </Text>
        </div>

        {/* Job Selection Controls */}
        <Box bg={bg} p={{ base: 3, md: 4 }} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>Report Controls</Heading>
          
          {/* Filters */}
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3}>
              <FormControl>
                <FormLabel htmlFor="jobTotalCostDepartmentFilter" fontSize="sm">Department</FormLabel>
                <Select
                  id="jobTotalCostDepartmentFilter"
                  name="jobTotalCostDepartmentFilter"
                  size="sm"
                  placeholder="All Departments"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="jobTotalCostStatusFilter" fontSize="sm">Status</FormLabel>
                <Select
                  id="jobTotalCostStatusFilter"
                  name="jobTotalCostStatusFilter"
                  size="sm"
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="jobTotalCostJobSelect" fontSize="sm">Select Job</FormLabel>
                <Select
                  id="jobTotalCostJobSelect"
                  name="jobTotalCostJobSelect"
                  size="sm"
                  placeholder="Choose a job..."
                  value={selectedJobId}
                  onChange={(e) => handleJobSelect(e.target.value)}
                >
                  {filteredJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.jobNumber} - {job.title}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl>
                <Text fontSize="sm" fontWeight="medium">Actions</Text>
                <HStack spacing={2}>
                  <Button
                    leftIcon={<FiDownload />}
                    colorScheme="green"
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    isDisabled={!jobDetails || loading}
                    flex="1"
                  >
                    Download PDF
                  </Button>
                  {(departmentFilter || statusFilter || selectedJobId) && (
                    <Button
                      leftIcon={<FiFileText />}
                      variant="outline"
                      colorScheme="gray"
                      size="sm"
                      onClick={clearFilters}
                    >
                      Clear
                    </Button>
                  )}
                </HStack>
              </FormControl>
            </SimpleGrid>
          </VStack>
        </Box>

        {/* Loading State */}
        {loading && (
          <Center py={10}>
            <VStack>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color="gray.500">Loading job cost data...</Text>
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

        {/* Job Details Section */}
        {jobDetails && !loading && (
          <Card bg={bg} borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Job Information Header */}
                <Box textAlign="center">
                  <Heading size="lg" mb={2}>Job Details Report</Heading>
                  <Text fontSize="lg" fontWeight="semibold" color="blue.600">
                    {jobDetails.jobNumber} - {jobDetails.title}
                  </Text>
                  <Badge colorScheme="green" mt={2} size="lg">
                    {jobDetails.status || 'Active'}
                  </Badge>
                </Box>

                <Divider />

                {/* 1. Job Details Table */}
                <Box>
                  <Heading size="md" mb={4}>Job Information</Heading>
                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Tbody>
                        <Tr>
                          <Td fontWeight="bold" w="200px">Job ID</Td>
                          <Td>{jobDetails.jobNumber}</Td>
                          <Td fontWeight="bold" w="200px">Job Name</Td>
                          <Td>{jobDetails.title}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Division</Td>
                          <Td>
                            <Badge colorScheme="blue" size="sm">
                              {jobDetails.reqDepartment || 'N/A'}
                            </Badge>
                          </Td>
                          <Td fontWeight="bold">Project Code</Td>
                          <Td>{jobDetails.projectCode || 'N/A'}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Budget Allocation</Td>
                          <Td color="green.600" fontWeight="medium">
                            {formatCurrency(jobDetails.budgetAllocation || 0)}
                          </Td>
                          <Td fontWeight="bold">Requested Date</Td>
                          <Td>{formatDate(jobDetails.reqDate)}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Start Date</Td>
                          <Td>{formatDate(jobDetails.startDate)}</Td>
                          <Td fontWeight="bold">End Date</Td>
                          <Td>{formatDate(jobDetails.endDate)}</Td>
                        </Tr>
                        <Tr>
                          <Td fontWeight="bold">Assigned Officer</Td>
                          <Td>{jobDetails.assignOfficer || 'N/A'}</Td>
                          <Td fontWeight="bold">Status</Td>
                          <Td>
                            <Badge 
                              colorScheme={
                                jobDetails.status === 'Completed' ? 'green' :
                                jobDetails.status === 'In Progress' ? 'blue' :
                                jobDetails.status === 'On Hold' ? 'yellow' : 'gray'
                              }
                              size="sm"
                            >
                              {jobDetails.status || 'Active'}
                            </Badge>
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>

                <Divider />

                {/* 2. Cost Overview */}
                <Box>
                  <Heading size="md" mb={4}>Cost Overview</Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                    <Stat textAlign="center" p={4} bg="blue.50" borderRadius="md">
                      <StatLabel>Total Labor Cost</StatLabel>
                      <StatNumber fontSize="xl" color="blue.600">
                        {formatCurrency(costOverview.totalLaborCost)}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={4} bg="purple.50" borderRadius="md">
                      <StatLabel>Total Material Cost</StatLabel>
                      <StatNumber fontSize="xl" color="purple.600">
                        {formatCurrency(costOverview.totalMaterialCost)}
                      </StatNumber>
                    </Stat>
                    <Stat textAlign="center" p={4} bg="green.50" borderRadius="md">
                      <StatLabel>Total Cost</StatLabel>
                      <StatNumber fontSize="xl" color="green.600">
                        {formatCurrency(costOverview.totalCost)}
                      </StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>

                <Divider />

                {/* 3. Labor Cost Details */}
                <Box>
                  <Heading size="md" mb={4}>Labor Cost Details</Heading>
                  
                  {/* 3.1 Labor Cost Overview */}
                  <Box mb={6}>
                    <Heading size="sm" mb={3}>Labor Cost Overview</Heading>
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                      <Stat textAlign="center" p={3} bg="green.50" borderRadius="md" borderWidth="1px" borderColor="green.200">
                        <StatLabel fontSize="xs">Regular Cost</StatLabel>
                        <StatNumber fontSize="md" color="green.600">
                          {formatCurrency(laborCostOverview.regularCost)}
                        </StatNumber>
                      </Stat>
                      <Stat textAlign="center" p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                        <StatLabel fontSize="xs">OT Cost</StatLabel>
                        <StatNumber fontSize="md" color="blue.600">
                          {formatCurrency(laborCostOverview.otCost)}
                        </StatNumber>
                      </Stat>
                      <Stat textAlign="center" p={3} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
                        <StatLabel fontSize="xs">Weekend Cost</StatLabel>
                        <StatNumber fontSize="md" color="purple.600">
                          {formatCurrency(laborCostOverview.weekendCost)}
                        </StatNumber>
                      </Stat>
                      <Stat textAlign="center" p={3} bg="orange.50" borderRadius="md" borderWidth="1px" borderColor="orange.200">
                        <StatLabel fontSize="xs">Total Labor Cost</StatLabel>
                        <StatNumber fontSize="md" color="orange.600">
                          {formatCurrency(laborCostOverview.totalLaborCost)}
                        </StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </Box>

                  {/* 3.2 Working Hours by Trade & Worked Labors List (Side by Side Grid) */}
                  <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6}>
                    {/* Left Side: Working Hours by Trade */}
                    <GridItem>
                      <Heading size="sm" mb={3}>Working Hours by Trade</Heading>
                      {workingHoursByTrade.length > 0 ? (
                        <TableContainer>
                          <Table variant="simple" size="sm">
                            <Thead bg={tableHeaderBg}>
                              <Tr>
                                <Th>Trade</Th>
                                <Th isNumeric>Regular</Th>
                                <Th isNumeric>OT</Th>
                                <Th isNumeric>Total</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {workingHoursByTrade.map((trade, index) => (
                                <Tr key={index}>
                                  <Td>
                                    <Badge colorScheme="blue" size="sm">
                                      {trade.trade}
                                    </Badge>
                                  </Td>
                                  <Td isNumeric>{trade.regularHours.toFixed(1)}h</Td>
                                  <Td isNumeric>{trade.otHours.toFixed(1)}h</Td>
                                  <Td isNumeric fontWeight="bold">{trade.totalHours.toFixed(1)}h</Td>
                                </Tr>
                              ))}
                              {/* Total Row */}
                              <Tr bg="blue.50">
                                <Td fontWeight="bold">Total:</Td>
                                <Td isNumeric fontWeight="bold">
                                  {workingHoursByTrade.reduce((sum, trade) => sum + trade.regularHours, 0).toFixed(1)}h
                                </Td>
                                <Td isNumeric fontWeight="bold">
                                  {workingHoursByTrade.reduce((sum, trade) => sum + trade.otHours, 0).toFixed(1)}h
                                </Td>
                                <Td isNumeric fontWeight="bold" color="blue.600">
                                  {workingHoursByTrade.reduce((sum, trade) => sum + trade.totalHours, 0).toFixed(1)}h
                                </Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Center py={10}>
                          <VStack>
                            <Icon as={FiUser} boxSize={8} color="gray.400" />
                            <Text color="gray.500" fontSize="sm">No labor hours data found</Text>
                          </VStack>
                        </Center>
                      )}
                    </GridItem>

                    {/* Right Side: Quick Labor Summary */}
                    <GridItem>
                      <Heading size="sm" mb={3}>Labor Summary Statistics</Heading>
                      <VStack spacing={3} align="stretch">
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text fontSize="xs" color="gray.600">Total Workers</Text>
                          <Text fontSize="lg" fontWeight="bold" color="gray.800">
                            {workedLaborsList.length}
                          </Text>
                        </Box>
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text fontSize="xs" color="gray.600">Total Working Hours</Text>
                          <Text fontSize="lg" fontWeight="bold" color="gray.800">
                            {workedLaborsList.reduce((sum, labor) => sum + labor.totalHours, 0).toFixed(1)}h
                          </Text>
                        </Box>
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text fontSize="xs" color="gray.600">Average Hours per Worker</Text>
                          <Text fontSize="lg" fontWeight="bold" color="gray.800">
                            {workedLaborsList.length > 0 ? 
                              (workedLaborsList.reduce((sum, labor) => sum + labor.totalHours, 0) / workedLaborsList.length).toFixed(1) 
                              : '0.0'}h
                          </Text>
                        </Box>
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text fontSize="xs" color="gray.600">Total Trades</Text>
                          <Text fontSize="lg" fontWeight="bold" color="gray.800">
                            {workingHoursByTrade.length}
                          </Text>
                        </Box>
                      </VStack>
                    </GridItem>
                  </Grid>

                  {/* 3.3 Worked Labors List */}
                  <Box mt={6}>
                    <Heading size="sm" mb={3}>Worked Labors List</Heading>
                    {workedLaborsList.length > 0 ? (
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead bg={tableHeaderBg}>
                            <Tr>
                              <Th>Labor Name</Th>
                              <Th>Trade</Th>
                              <Th isNumeric>Regular Hours</Th>
                              <Th isNumeric>OT Hours</Th>
                              <Th isNumeric>Total Hours</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {workedLaborsList.map((labor, index) => (
                              <Tr key={index}>
                                <Td fontWeight="medium">{labor.laborName}</Td>
                                <Td>
                                  <Badge colorScheme="cyan" size="sm">
                                    {labor.trade}
                                  </Badge>
                                </Td>
                                <Td isNumeric>{labor.regularHours.toFixed(1)}h</Td>
                                <Td isNumeric>{labor.otHours.toFixed(1)}h</Td>
                                <Td isNumeric fontWeight="bold">{labor.totalHours.toFixed(1)}h</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Center py={10}>
                        <VStack>
                          <Icon as={FiUser} boxSize={12} color="gray.400" />
                          <Text color="gray.500">No labor data found for this job</Text>
                        </VStack>
                      </Center>
                    )}
                  </Box>
                </Box>

                <Divider />

                {/* 4. Material Cost Details */}
                <Box>
                  <Heading size="md" mb={4}>Material Cost Details</Heading>
                  
                  {Array.isArray(materialData) && materialData.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead bg={tableHeaderBg}>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Order Number</Th>
                            <Th>Type</Th>
                            <Th>Description</Th>
                            <Th isNumeric>Cost</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {materialData.map((material, index) => (
                            <Tr key={index}>
                              <Td fontWeight="medium">
                                {formatDate(material.date)}
                              </Td>
                              <Td>{material.code || 'N/A'}</Td>
                              <Td>
                                <Badge colorScheme="purple" size="sm">
                                  {material.type || 'N/A'}
                                </Badge>
                              </Td>
                              <Td>{material.description || 'N/A'}</Td>
                              <Td isNumeric fontWeight="medium">
                                {formatCurrency(material.cost)}
                              </Td>
                            </Tr>
                          ))}
                          
                          {/* Total Row */}
                          <Tr bg="purple.50">
                            <Td colSpan={4} fontWeight="bold" textAlign="right">
                              Total Material Cost:
                            </Td>
                            <Td isNumeric fontWeight="bold" color="purple.600">
                              {formatCurrency(materialData.reduce((sum, material) => sum + (parseFloat(material.cost) || 0), 0))}
                            </Td>
                          </Tr>
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Center py={10}>
                      <VStack>
                        <Icon as={FiFileText} boxSize={12} color="gray.400" />
                        <Text color="gray.500">No material orders found for this job</Text>
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

        {/* No Job Selected Message */}
        {!selectedJobId && !loading && (
          <Center py={20}>
            <VStack spacing={4}>
              <Icon as={FiBriefcase} boxSize={16} color="gray.400" />
              <Heading size="md" color="gray.500">Select a Job</Heading>
              <Text color="gray.400" textAlign="center">
                Choose a job from the dropdown to generate the total cost report
              </Text>
            </VStack>
          </Center>
        )}
      </VStack>
    </Box>
  );
};

export default JobTotalCostReport;
