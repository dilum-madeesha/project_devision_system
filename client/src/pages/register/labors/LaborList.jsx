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
  Switch,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { laborAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";
import { hasPermission, FEATURES } from "../../../utils/permissions";

const LaborListPage = () => {
  const [labors, setLabors] = useState([]);
  const [allLabors, setAllLabors] = useState([]);
  const [filteredLabors, setFilteredLabors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 8;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [tradeFilter, setTradeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit modal state
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingLabor, setEditingLabor] = useState(null);
  const [editFormData, setEditFormData] = useState({
    epfNumber: '',
    firstName: '',
    lastName: '',
    division: '',
    trade: '',
    payGrade: '',
    dayPay: 0,
    otPay: 0,
    weekendPay: 0,
    isActive: true
  });
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingLabor, setDeletingLabor] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const cancelRef = useRef();

  const toast = useToast();
  const { user } = useAuth();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchLabors();
  }, []);

  // Apply filters whenever filter values or allLabors change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, divisionFilter, tradeFilter, statusFilter, allLabors]);

  const applyFilters = () => {
    let filtered = [...allLabors];

    // Apply search filter (search in EPF number, first name, last name)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(labor => {
        const epfNumber = (labor.epfNumber || '').toString().toLowerCase();
        const firstName = (labor.firstName || '').toLowerCase();
        const lastName = (labor.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return epfNumber.includes(searchTermLower) ||
          firstName.includes(searchTermLower) ||
          lastName.includes(searchTermLower) ||
          fullName.includes(searchTermLower);
      });
    }

    // Apply division filter
    if (divisionFilter) {
      filtered = filtered.filter(labor => labor.division === divisionFilter);
    }

    // Apply trade filter
    if (tradeFilter) {
      filtered = filtered.filter(labor => labor.trade === tradeFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(labor => {
        if (statusFilter === 'active') return labor.isActive === true;
        if (statusFilter === 'inactive') return labor.isActive === false;
        return true;
      });
    }

    setFilteredLabors(filtered);

    // Reset pagination when filters change
    const newTotalPages = Math.ceil(filtered.length / recordsPerPage);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
    setCurrentPage(1);

    // Set current page data
    const startIndex = 0;
    const endIndex = Math.min(recordsPerPage, filtered.length);
    setLabors(filtered.slice(startIndex, endIndex));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDivisionFilter('');
    setTradeFilter('');
    setStatusFilter('');
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;

    const dataToUse = filteredLabors.length > 0 ? filteredLabors : allLabors;

    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, dataToUse.length);

    setLabors(dataToUse.slice(startIndex, endIndex));
  };

  const fetchLabors = async () => {
    try {
      setLoading(true);
      const response = await laborAPI.getAll();

      // Handle different response structures
      let laborsData = [];
      if (response && Array.isArray(response)) {
        laborsData = response;
      } else if (response && response.data && response.data.labors && Array.isArray(response.data.labors)) {
        // Handle nested structure: {success: true, data: {labors: [...], pagination: {...}}}
        laborsData = response.data.labors;
      } else if (response && response.data && Array.isArray(response.data)) {
        laborsData = response.data;
      } else if (response && response.labors && Array.isArray(response.labors)) {
        laborsData = response.labors;
      }

      setAllLabors(laborsData);
      setFilteredLabors(laborsData);

      // Calculate total pages
      const newTotalPages = Math.ceil(laborsData.length / recordsPerPage);
      setTotalPages(newTotalPages > 0 ? newTotalPages : 1);

      // Set current page data
      const startIndex = 0;
      const endIndex = Math.min(recordsPerPage, laborsData.length);
      setLabors(laborsData.slice(startIndex, endIndex));
    } catch (err) {
      setError("Failed to fetch labors");
      console.error("Error fetching labors:", err);
      setLabors([]); // Ensure labors is always an array
      setAllLabors([]);
      setFilteredLabors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleEditLabor = (labor) => {
    setEditingLabor(labor);
    setEditFormData({
      epfNumber: labor.epfNumber,
      firstName: labor.firstName,
      lastName: labor.lastName,
      division: labor.division,
      trade: labor.trade,
      payGrade: labor.payGrade,
      dayPay: labor.dayPay,
      otPay: labor.otPay,
      weekendPay: labor.weekendPay ?? 0,  
      isActive: labor.isActive
    });
    onEditOpen();
  };

  const handleEditSubmit = async () => {
    if (!editingLabor) return;

    setEditLoading(true);
    try {
      // Ensure numeric fields are properly typed
      const formattedData = {
        ...editFormData,
        epfNumber: Number(editFormData.epfNumber),
        dayPay: Number(editFormData.dayPay),
        otPay: Number(editFormData.otPay),
        weekendPay: Number(editFormData.weekendPay)
      };

      await laborAPI.update(editingLabor.id, formattedData);
      toast({
        title: "Success",
        description: "Labor updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchLabors(); // Refresh the list
      onEditClose();
    } catch (err) {
      console.error("Error updating labor:", err);

      // Extract error message from response
      let errorMessage = "Failed to update labor";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        // Handle validation errors
        const errors = err.response.data.errors;
        errorMessage = Object.values(errors).join(', ');
      }

      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteLabor = (labor) => {
    setDeletingLabor(labor);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLabor) return;

    setDeleteLoading(true);
    try {
      await laborAPI.delete(deletingLabor.id);
      toast({
        title: "Success",
        description: "Labor deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchLabors(); // Refresh the list
      onDeleteClose();
    } catch (err) {
      console.error("Error deleting labor:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete labor",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const can = (feature) => hasPermission(user?.privilege, feature);
  const canEdit = can(FEATURES.REGISTER_LABOR);
  const canDelete = user?.role === 'ADMIN'; // Keep admin-only delete for now

  if (loading) {
    return (
      <Container maxW="1400px" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Heading size="md">Loading labors...</Heading>
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
            <BreadcrumbLink color="blue.500" fontWeight="bold" fontSize="x-large">
              Labor List
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <HStack justify="space-between">
          <Text color="gray.600">Manage workforce and labor rates</Text>
          <Link to="/register/labors/add">
            <Button leftIcon={<FiPlus />} colorScheme="blue">
              Add New Labor
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
                  placeholder="Search EPF, name..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Select
                  size="sm"
                  width="120px"
                  placeholder="All Trades"
                  value={tradeFilter}
                  onChange={(e) => setTradeFilter(e.target.value)}
                >
                  <option value="Carpenter">Carpenter</option>
                  <option value="C/Helper">C/Helper</option>
                  <option value="Mason">Mason</option>
                  <option value="M/Helper">M/Helper</option>
                  <option value="Painter">Painter</option>
                  <option value="MDA(C.)">MDA(C.)</option>
                  <option value="MDA">MDA</option>
                  <option value="Other">Other</option>
                </Select>
                <Select
                  size="sm"
                  width="120px"
                  placeholder="All Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
                {(searchTerm || divisionFilter || tradeFilter || statusFilter) && (
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
                  {labors.length > 0 ? (
                    <>
                      Showing {(currentPage - 1) * recordsPerPage + 1} to {(currentPage - 1) * recordsPerPage + labors.length} of {filteredLabors.length > 0 ? filteredLabors.length : allLabors.length} records
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
                    colorScheme="blue"
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
                    colorScheme="blue"
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
        {/* labor table */}
        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <TableContainer whiteSpace="normal">
            <Table variant="simple" size="sm" layout="fixed">
              <Thead backgroundColor={"blue.50"}>
                <Tr>
                  <Th py={3} px={2} width="80px">Emp Code</Th>
                  <Th py={3} px={2} width="100px">EPF Number</Th>
                  <Th py={3} px={2} width="180px">Employee Name</Th>
                  <Th py={3} px={2} width="120px">Department</Th>
                  <Th py={3} px={2} width="120px">Trade</Th>
                  <Th py={3} px={2} width="100px">Day Pay</Th>
                  <Th py={3} px={2} width="100px">OT Pay</Th>
                  <Th py={3} px={2} width="100px">Weekend Pay</Th>
                  <Th py={3} px={2} width="80px">Status</Th>
                  {(canEdit || canDelete) && <Th py={3} px={2} width="120px">Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {Array.isArray(labors) && labors.map((labor, index) => (
                  <Tr key={labor.id}>
                    <Td py={2} px={2} fontWeight="medium">{(currentPage - 1) * recordsPerPage + index + 1}</Td>{/*Exchange index+1 to labor.id 2025/12/17 */}
                    <Td py={2} px={2}>{labor.epfNumber}</Td>
                    <Td py={2} px={2} isTruncated>{`${labor.firstName} ${labor.lastName}`}</Td>
                    <Td py={2} px={2} isTruncated>{labor.division}</Td>
                    <Td py={2} px={2} isTruncated>{labor.trade}</Td>
                    <Td py={2} px={2} fontWeight="medium" color="green.600">{formatCurrency(labor.dayPay)}</Td>
                    <Td py={2} px={2} fontWeight="medium" color="green.600">{formatCurrency(labor.otPay)}</Td>
                    <Td py={2} px={2} fontWeight="medium" color="purple.600">{formatCurrency(labor.weekendPay )}</Td>
                    <Td py={2} px={2}>
                      <Badge colorScheme={labor.isActive ? "green" : "red"} size="sm">
                        {labor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    {(canEdit) && (
                      <Td py={2} px={1}>
                        <HStack spacing={4}>
                          {canEdit && (
                            <Tooltip label="Edit Labor">
                              <Button
                                size="2xs"
                                leftIcon={<FiEdit2 />}
                                variant="outline"
                                colorScheme="blue"
                                p={1}
                                onClick={() => handleEditLabor(labor)}
                              />
                            </Tooltip>
                          )}
                          {/* {canDelete && (
                            <Tooltip label="Delete Labor">
                              <Button
                                size="2xs"
                                leftIcon={<FiTrash2 />}
                                variant="outline"
                                colorScheme="red"
                                p={1}
                                onClick={() => handleDeleteLabor(labor)}
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
        {Array.isArray(labors) && labors.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <Heading size="md" color="gray.500" mb={4}>
              {(searchTerm || divisionFilter || tradeFilter || statusFilter) ? "No labors found" : "No labors found"}
            </Heading>
            {(searchTerm || divisionFilter || tradeFilter || statusFilter) ? (
              <Text color="gray.500">
                No labors match your search criteria. Try adjusting your filters or search terms.
              </Text>
            ) : (
              <>
                <Text color="gray.500" mb={4}>
                  No labors have been registered yet.
                </Text>
                {canEdit && (
                  <Link to="/register/labors/add">
                    <Button colorScheme="blue">
                      Add Your First Labor
                    </Button>
                  </Link>
                )}
              </>
            )}
          </Box>
        )}

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Labor</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>EPF Number</FormLabel>
                  <NumberInput
                    value={editFormData.epfNumber}
                    onChange={(_, valueAsNumber) =>
                      setEditFormData(prev => ({ ...prev, epfNumber: valueAsNumber || 0 }))
                    }
                    min={0}
                  >
                    <NumberInputField placeholder="Enter EPF number" />
                  </NumberInput>
                </FormControl>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Division</FormLabel>
                  <Input
                    value={editFormData.division}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, division: e.target.value }))}
                    placeholder="Enter division"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Trade</FormLabel>
                  <Input
                    value={editFormData.trade}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, trade: e.target.value }))}
                    placeholder="Enter trade"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Pay Grade</FormLabel>
                  <Input
                    value={editFormData.payGrade}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, payGrade: e.target.value }))}
                    placeholder="Enter pay grade"
                  />
                </FormControl>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Day Pay (LKR)</FormLabel>
                    <NumberInput
                      value={editFormData.dayPay}
                      onChange={(_, valueAsNumber) =>
                        setEditFormData(prev => ({ ...prev, dayPay: valueAsNumber || 0 }))
                      }
                      min={0}
                      precision={2}
                      step={0.01}
                    >
                      <NumberInputField placeholder="0.00" />
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>OT Pay (LKR)</FormLabel>
                    <NumberInput
                      value={editFormData.otPay}
                      onChange={(_, valueAsNumber) =>
                        setEditFormData(prev => ({ ...prev, otPay: valueAsNumber || 0 }))
                      }
                      min={0}
                      precision={2}
                      step={0.01}
                    >
                      <NumberInputField placeholder="0.00" />
                    </NumberInput>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>
                    Weekend Pay (LKR)
                    <Box as="span" color="gray.500" fontSize="sm" ml={2}>
                      (Optional - defaults to Day Pay)
                    </Box>
                  </FormLabel>
                  <NumberInput
                    value={editFormData.weekendPay}
                    onChange={(_, valueAsNumber) =>
                      setEditFormData(prev => ({ ...prev, weekendPay: valueAsNumber || 0 }))
                    }
                    min={0}
                    precision={2}
                    step={0.01}
                  >
                    <NumberInputField placeholder="0.00" />
                  </NumberInput>
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="is-active" mb="0">
                    Active Status
                  </FormLabel>
                  <Switch
                    id="is-active"
                    isChecked={editFormData.isActive}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
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
                Update Labor
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
                Delete Labor
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete "{deletingLabor?.firstName} {deletingLabor?.lastName}" (EPF: {deletingLabor?.epfNumber})? 
                This action cannot be undone.
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

export default LaborListPage;