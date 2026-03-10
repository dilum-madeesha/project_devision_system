import {
  Container,
  VStack,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Box,
  Flex,
  HStack,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Text
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { jobAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";

const JobListPage = () => {
  const [jobs, setJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 8;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState("");

  // Edit modal state
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingJob, setEditingJob] = useState(null);
  const [editFormData, setEditFormData] = useState({
    jobNumber: '',
    title: '',
    description: '',
    status: 'ONGOING',
    startDate: '',
    endDate: '',
    reqDepartment: '',
    reqDate: '',
    projectCode: '',
    budgetAllocation: 0,
    assignOfficer: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingJob, setDeletingJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const cancelRef = useRef();

  const toast = useToast();
  const { user } = useAuth();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchJobs();
  }, []);

  // Apply filters whenever filter values or allJobs change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, departmentFilter, statusFilter, dateRangeFilter, allJobs]);

  const applyFilters = () => {
    let filtered = [...allJobs];

    // Sort by latest first (using createdAt if available, otherwise startDate, then reqDate)
    filtered.sort((a, b) => {
      const getDateForSorting = (job) => {
        // Try to use createdAt first, then startDate, then reqDate as fallback
        return new Date(job.createdAt || job.startDate || job.reqDate || 0);
      };
      
      return getDateForSorting(b) - getDateForSorting(a); // Latest first (descending order)
    });

    // Apply search filter (search in job number, title, project code, officer)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(job => {
        const jobNumber = (job.jobNumber || '').toLowerCase();
        const title = (job.title || '').toLowerCase();
        const projectCode = (job.projectCode || '').toLowerCase();
        const assignOfficer = (job.assignOfficer || '').toLowerCase();
        return jobNumber.includes(searchTermLower) || 
               title.includes(searchTermLower) || 
               projectCode.includes(searchTermLower) ||
               assignOfficer.includes(searchTermLower);
      });
    }

    // Apply department filter
    if (departmentFilter) {
      filtered = filtered.filter(job => job.reqDepartment === departmentFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply date range filter (based on start date)
    if (dateRangeFilter) {
      const now = new Date();
      filtered = filtered.filter(job => {
        if (!job.startDate) return false;
        const startDate = new Date(job.startDate);
        const diffTime = now - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (dateRangeFilter) {
          case 'last-7-days':
            return diffDays <= 7 && diffDays >= 0;
          case 'last-30-days':
            return diffDays <= 30 && diffDays >= 0;
          case 'last-90-days':
            return diffDays <= 90 && diffDays >= 0;
          case 'this-year':
            return startDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    setFilteredJobs(filtered);
    
    // Reset pagination when filters change
    const newTotalPages = Math.ceil(filtered.length / recordsPerPage);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
    setCurrentPage(1);
    
    // Set current page data
    const startIndex = 0;
    const endIndex = Math.min(recordsPerPage, filtered.length);
    setJobs(filtered.slice(startIndex, endIndex));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDepartmentFilter('');
    setStatusFilter('');
    setDateRangeFilter('');
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const dataToUse = filteredJobs.length > 0 ? filteredJobs : allJobs;
    
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, dataToUse.length);
    
    setJobs(dataToUse.slice(startIndex, endIndex));
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getAll();
      
      // Handle different response structures
      let jobsData = [];
      if (response && Array.isArray(response)) {
        jobsData = response;
      } else if (response && response.data && response.data.jobs && Array.isArray(response.data.jobs)) {
        // Handle nested structure: {success: true, data: {jobs: [...], pagination: {...}}}
        jobsData = response.data.jobs;
      } else if (response && response.data && Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (response && response.jobs && Array.isArray(response.jobs)) {
        jobsData = response.jobs;
      }
      
      setAllJobs(jobsData);
      setFilteredJobs(jobsData);
      
      // Calculate total pages
      const newTotalPages = Math.ceil(jobsData.length / recordsPerPage);
      setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
      
      // Set current page data
      const startIndex = 0;
      const endIndex = Math.min(recordsPerPage, jobsData.length);
      setJobs(jobsData.slice(startIndex, endIndex));
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error("Error fetching jobs:", err);
      setJobs([]); // Ensure jobs is always an array
      setAllJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setEditFormData({
      jobNumber: job.jobNumber,
      title: job.title,
      description: job.description || '',
      status: job.status,
      startDate: job.startDate ? new Date(job.startDate).toISOString().split('T')[0] : '',
      endDate: job.endDate ? new Date(job.endDate).toISOString().split('T')[0] : '',
      reqDepartment: job.reqDepartment,
      reqDate: job.reqDate ? new Date(job.reqDate).toISOString().split('T')[0] : '',
      projectCode: job.projectCode,
      budgetAllocation: job.budgetAllocation || 0,
      assignOfficer: job.assignOfficer
    });
    onEditOpen();
  };

  const handleEditSubmit = async () => {
    if (!editingJob) return;

    setEditLoading(true);
    try {
      // Format dates to ISO string format for proper database storage
      const formattedData = {
        ...editFormData,
        startDate: editFormData.startDate ? new Date(editFormData.startDate + 'T00:00:00.000Z').toISOString() : null,
        endDate: editFormData.endDate ? new Date(editFormData.endDate + 'T00:00:00.000Z').toISOString() : null,
        reqDate: editFormData.reqDate ? new Date(editFormData.reqDate + 'T00:00:00.000Z').toISOString() : null,
        budgetAllocation: Number(editFormData.budgetAllocation)
      };

      // Remove empty string dates
      if (!editFormData.endDate) {
        delete formattedData.endDate;
      }

      await jobAPI.update(editingJob.id, formattedData);
      toast({
        title: "Success",
        description: "Job updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchJobs(); // Refresh the list
      onEditClose();
    } catch (err) {
      console.error("Error updating job:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update job",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteJob = (job) => {
    setDeletingJob(job);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingJob) return;

    setDeleteLoading(true);
    try {
      await jobAPI.delete(deletingJob.id);
      toast({
        title: "Success",
        description: "Job deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchJobs(); // Refresh the list
      onDeleteClose();
    } catch (err) {
      console.error("Error deleting job:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete job",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      NOT_STARTED: "gray",
      ONGOING: "blue",
      COMPLETED: "green",
      ON_HOLD: "orange",
      CANCELLED: "red"
    };
    return statusColors[status] || "gray";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';

  if (loading) {
    return (
      <Container maxW="1400px" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Heading size="md">Loading jobs...</Heading>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="1400px" py={0.1}>
      <VStack spacing={2} align="stretch">
        {/* Breadcrumb Navigation */}
      <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/register" color="blue.500">
            Register
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color="green.500" fontWeight="bold" fontSize="x-large">
            Job List
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <HStack justify="space-between">
        <Text color="gray.600">Manage project jobs and assignments</Text>
        <Link to="/register/jobs/add">
          <Button leftIcon={<FiPlus />} colorScheme="green">
            Add New Job
          </Button>
        </Link>
      </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Filters and Pagination Controls */}
          <Box py={2} px={4} borderBottomWidth="2px" borderBottomColor={borderColor}>
            <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={4}>
              {/* Filter Controls */}
              <HStack spacing={3} flexWrap="wrap">
                <HStack spacing={2}>
                  <Input
                    size="sm"
                    width="250px"
                    placeholder="Search job number, title, code, officer..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <Select
                    size="sm"
                    width="140px"
                    placeholder="All Departments"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <option value="Projects">Projects</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Human Resources">Human Resources</option> 
                    <option value="Finance">Finance</option>
                    <option value="Legal">Legal</option>
                    <option value="Airport Management">Airport Management</option>                   
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering (Maintenance)">Civil Engineering (Maintenance)</option>
                    <option value="Civil Engineering (P & D)">Civil Engineering (P & D)</option>
                    <option value="Electronics and Air Navigation Engineering">Electronics and Air Navigation Engineering</option>
                    <option value="Air Navigation Service">Air Navigation Service</option>
                    <option value="Security Services">Security Services</option>
                    <option value="Fire & Rescue Services">Fire & Rescue Services</option>
                    <option value="Medical">Medical</option>
                    <option value="Supply Chain Management">Supply Chain Management</option>
                    <option value="Commercial & Properties">Commercial & Properties</option>
                    <option value="Internal Audit & Quality Assurance">Internal Audit & Quality Assurance</option>
                    <option value="Civil Aviation Training">Civil Aviation Training</option>
                    <option value="Marketing and Corporate Communications">Marketing and Corporate Communications</option>
                    <option value="Strategic Management">Strategic Management</option>
                    <option value="Safety">Safety</option>
                    <option value="Aeronautical Information Management">Aeronautical Information Management</option>
                    <option value="Other">Other</option>
                  </Select>
                  <Select
                    size="sm"
                    width="130px"
                    placeholder="All Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                  <Select
                    size="sm"
                    width="140px"
                    placeholder="All Dates"
                    value={dateRangeFilter}
                    onChange={(e) => setDateRangeFilter(e.target.value)}
                  >
                    <option value="last-7-days">Last 7 Days</option>
                    <option value="last-30-days">Last 30 Days</option>
                    <option value="last-90-days">Last 90 Days</option>
                    <option value="this-year">This Year</option>
                  </Select>
                  {(searchTerm || departmentFilter || statusFilter || dateRangeFilter) && (
                    <IconButton
                      size="sm"
                      icon={<FiX />}
                      variant="ghost"
                      colorScheme="gray"
                      onClick={clearFilters}
                      aria-label="Clear filters"
                      title="Clear all filters"
                    />
                  )}
                </HStack>
              </HStack>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <HStack spacing={3}>
                  <Text fontSize="sm" px={4} color="gray.600">
                    {jobs.length > 0 ? (
                      <>
                        Showing {(currentPage - 1) * recordsPerPage + 1} to {(currentPage - 1) * recordsPerPage + jobs.length} of {filteredJobs.length > 0 ? filteredJobs.length : allJobs.length} records
                      </>
                    ) : (
                      <>No records to display</>
                    )}
                  </Text>
                  <HStack>
                    <Button 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      isDisabled={currentPage === 1 || loading}
                      colorScheme="green"
                      variant="outline"
                      leftIcon={loading ? <Spinner size="xs" /> : undefined}
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm" px={2}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Button 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      isDisabled={currentPage === totalPages || loading}
                      colorScheme="green"
                      variant="outline"
                      rightIcon={loading ? <Spinner size="xs" /> : undefined}
                    >
                      Next
                    </Button>
                  </HStack>
                </HStack>
              )}
            </Flex>
          </Box>
        
        {/* job table */}     
        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <TableContainer whiteSpace="normal">
            <Table variant="simple" size="sm" layout="fixed">
              <Thead backgroundColor={"blue.50"}>
                <Tr>
                  <Th py={3} px={2} width="100px">Job ID</Th>
                  <Th py={3} px={2} width="200px">Job Name</Th>
                  <Th py={3} px={2} width="120px">Department</Th>
                  <Th py={3} px={2} width="120px">Job Code</Th>
                  <Th py={3} px={2} width="140px">Budget</Th>
                  <Th py={3} px={2} width="100px">Open Date</Th>
                  <Th py={3} px={2} width="120px">Officer</Th>
                  <Th py={3} px={2} width="100px">Status</Th>
                  {(canEdit || canDelete) && <Th py={3} px={2} width="120px">Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {Array.isArray(jobs) && jobs.map((job) => (
                  <Tr key={job.id}>
                    <Td py={2} px={2} isTruncated>{job.jobNumber}</Td>
                    <Td py={2} px={2} isTruncated title={job.title}>{job.title}</Td>
                    <Td py={2} px={2} isTruncated>{job.reqDepartment}</Td>
                    <Td py={2} px={2} fontWeight="medium" isTruncated>{job.projectCode}</Td>
                    <Td py={2} px={2} fontWeight="medium" color="green.600">
                      {job.budgetAllocation 
                        ? formatCurrency(job.budgetAllocation)
                        : 'Not set'
                      }
                    </Td>
                    <Td py={2} px={2}>{formatDate(job.startDate)}</Td>
                    <Td py={2} px={2} isTruncated>{job.assignOfficer}</Td>
                    <Td py={2} px={2}>
                      <Badge colorScheme={getStatusColor(job.status)} size="sm">
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </Td>
                    {(canEdit) && (
                    <Td py={2} px={1}>
                        <HStack spacing={4}>
                          {canEdit && (
                            <Tooltip label="Edit Job">
                              <Button
                                size="2xs"
                                leftIcon={<FiEdit2 />}
                                variant="outline"
                                colorScheme="blue"
                                p={1}
                                onClick={() => handleEditJob(job)}
                              />
                            </Tooltip>
                          )}
                          {/* {canDelete && (
                            <Tooltip label="Delete Job">
                              <Button
                                size="2xs"
                                leftIcon={<FiTrash2 />}
                                variant="outline"
                                colorScheme="red"
                                p={1}
                                onClick={() => handleDeleteJob(job)}
                              />
                            </Tooltip>
                          )} */}
                        </HStack>
                    </Td>
                    )}
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {/* Empty State */}
        {Array.isArray(jobs) && jobs.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <Heading size="md" color="gray.500" mb={4}>
              {(searchTerm || departmentFilter || statusFilter || dateRangeFilter) ? "No jobs found" : "No jobs found"}
            </Heading>
            {(searchTerm || departmentFilter || statusFilter || dateRangeFilter) ? (
              <Text color="gray.500">
                No jobs match your search criteria. Try adjusting your filters or search terms.
              </Text>
            ) : (
              <>
                <Text color="gray.500" mb={4}>
                  No jobs have been registered yet.
                </Text>
                {canEdit && (
                  <Link to="/register/jobs/add">
                    <Button colorScheme="green">
                      Add Your First Job
                    </Button>
                  </Link>
                )}
              </>
            )}
          </Box>
        )}

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Job</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Job Number</FormLabel>
                    <Input
                      value={editFormData.jobNumber}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, jobNumber: e.target.value }))}
                      placeholder="Enter job number"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Project Code</FormLabel>
                    <Input
                      value={editFormData.projectCode}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, projectCode: e.target.value }))}
                      placeholder="Enter project code"
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Job Title</FormLabel>
                  <Input
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter job title"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter job description"
                    rows={3}
                  />
                </FormControl>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Department</FormLabel>
                    <Input
                      value={editFormData.reqDepartment}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, reqDepartment: e.target.value }))}
                      placeholder="Enter requesting department"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Assign Officer</FormLabel>
                    <Input
                      value={editFormData.assignOfficer}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, assignOfficer: e.target.value }))}
                      placeholder="Enter assigned officer"
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="ONGOING">Ongoing</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="CANCELLED">Cancelled</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Budget Allocation (LKR)</FormLabel>
                    <NumberInput
                      value={editFormData.budgetAllocation}
                      onChange={(_, valueAsNumber) => 
                        setEditFormData(prev => ({ ...prev, budgetAllocation: valueAsNumber || 0 }))
                      }
                      min={0}
                      precision={2}
                      step={0.01}
                    >
                      <NumberInputField placeholder="0.00" />
                    </NumberInput>
                  </FormControl>
                </HStack>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Start Date</FormLabel>
                    <Input
                      type="date"
                      value={editFormData.startDate}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>End Date</FormLabel>
                    <Input
                      type="date"
                      value={editFormData.endDate}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Request Date</FormLabel>
                  <Input
                    type="date"
                    value={editFormData.reqDate}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, reqDate: e.target.value }))}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleEditSubmit}
                isLoading={editLoading}
                loadingText="Updating..."
              >
                Update Job
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        {/* <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Job
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete job "{deletingJob?.jobNumber} - {deletingJob?.title}"? 
                This action cannot be undone and will also delete all related labor costs, material orders, and daily job costs.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteConfirm}
                  ml={3}
                  isLoading={deleteLoading}
                  loadingText="Deleting..."
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog> */}
      </VStack>
    </Container>
  );
};

export default JobListPage;