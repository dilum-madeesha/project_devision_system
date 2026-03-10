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
  Text,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Input,
  Select,
  IconButton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tooltip
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEye, FiPackage, FiDollarSign, FiHash, FiX, FiEdit, FiTrash2 } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { materialOrderAPI, materialOrderAssignmentAPI } from "../../../api";

const MaterialCostListPage = () => {
  const [materialCosts, setMaterialCosts] = useState([]);
  const [allMaterialCosts, setAllMaterialCosts] = useState([]);
  const [filteredMaterialCosts, setFilteredMaterialCosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 8;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  // Filter states
  const [dateFilter, setDateFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedMaterialOrder, setSelectedMaterialOrder] = useState(null);
  const [materialAssignments, setMaterialAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Edit modal state
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editingAssignments, setEditingAssignments] = useState([]);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const cancelRef = useRef();

  useEffect(() => {
    fetchMaterialCosts();
  }, []);

  // Apply filters whenever filter values or allMaterialCosts change
  useEffect(() => {
    applyFilters();
  }, [dateFilter, jobFilter, allMaterialCosts]);

  const applyFilters = () => {
    let filtered = [...allMaterialCosts];

    // Apply date filter
    if (dateFilter) {
      filtered = filtered.filter(material => {
        const materialDate = new Date(material.date).toISOString().split('T')[0];
        return materialDate === dateFilter;
      });
    }

    // Apply job filter (search in both job number and job title)
    if (jobFilter) {
      const searchTerm = jobFilter.toLowerCase();
      filtered = filtered.filter(material => {
        const jobNumber = (material.job?.jobNumber || '').toLowerCase();
        const jobTitle = (material.job?.title || '').toLowerCase();
        return jobNumber.includes(searchTerm) || jobTitle.includes(searchTerm);
      });
    }

    setFilteredMaterialCosts(filtered);
    
    // Reset pagination when filters change
    const newTotalPages = Math.ceil(filtered.length / recordsPerPage);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
    setCurrentPage(1);
    
    // Set current page data
    const startIndex = 0;
    const endIndex = Math.min(recordsPerPage, filtered.length);
    setMaterialCosts(filtered.slice(startIndex, endIndex));
  };

  const clearFilters = () => {
    setDateFilter('');
    setJobFilter('');
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const dataToUse = filteredMaterialCosts.length > 0 ? filteredMaterialCosts : allMaterialCosts;
    console.log(`Changing to page ${newPage}, dataToUse.length: ${dataToUse.length}, need: ${newPage * recordsPerPage}`);
    
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, dataToUse.length);
    console.log(`Slicing from ${startIndex} to ${endIndex}`);
    
    setMaterialCosts(dataToUse.slice(startIndex, endIndex));
  };

  const fetchMaterialCosts = async (page = 1) => {
    try {
      setLoading(true);
      
      // Get total count first to set up pagination correctly
      let totalCount = 0;
      let allData = [];
      
      // Try to get all records first to have accurate count
      if (page === 1) {
        try {
          const allResponse = await materialOrderAPI.getAll(1, 1000); // Get all records in one go
          
          if (allResponse && Array.isArray(allResponse)) {
            totalCount = allResponse.length;
            allData = allResponse;
          } else if (allResponse && allResponse.data && Array.isArray(allResponse.data)) {
            totalCount = allResponse.data.length;
            allData = allResponse.data;
          } else if (allResponse && allResponse.data && allResponse.data.materialOrders) {
            totalCount = allResponse.data.materialOrders.length;
            allData = allResponse.data.materialOrders;
          } else if (allResponse && allResponse.materialOrders) {
            totalCount = allResponse.materialOrders.length;
            allData = allResponse.materialOrders;
          }
          
          // Filter records to show only within 365 days from current date
          const currentDate = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setDate(currentDate.getDate() - 365);
          
          const filteredByDate = allData.filter(materialOrder => {
            const createdDate = new Date(materialOrder.createdAt || materialOrder.date);
            return createdDate >= oneYearAgo;
          });
          
          // Store filtered data for client-side pagination
          setAllMaterialCosts(filteredByDate);
          setFilteredMaterialCosts(filteredByDate);
          
          // Calculate start and end for current page
          const startIndex = (page - 1) * recordsPerPage;
          const endIndex = Math.min(startIndex + recordsPerPage, allData.length);
          
          // Set current page data
          setMaterialCosts(filteredByDate.slice(startIndex, endIndex));
          
          // Calculate total pages based on filtered data
          totalCount = filteredByDate.length;
          const calculatedTotalPages = Math.ceil(totalCount / recordsPerPage);
          setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
          setCurrentPage(page);
          
          console.log("Total records:", totalCount);
          console.log("Total pages:", Math.ceil(totalCount / recordsPerPage));
          
          // Exit early since we loaded all data
          setLoading(false);
          return;
        } catch (err) {
          // If bulk loading fails, continue with paginated approach
          console.error("Failed to load all records at once, falling back to pagination:", err);
        }
      }
      
      // If we're here, either we're not on page 1 or the bulk loading failed
      const response = await materialOrderAPI.getAll(page, recordsPerPage);
      console.log("Material costs API response:", response); // Debug log
      
      // Handle different response structures
      let costsData = [];
      
      if (response && Array.isArray(response)) {
        costsData = response;
        // If we don't have a total count from earlier
        if (totalCount === 0) {
          // This is a guess - assume at least one more page if we got full results
          totalCount = (page - 1) * recordsPerPage + costsData.length;
          if (costsData.length === recordsPerPage) totalCount += 1;
        }
      } else if (response && response.data && response.data.materialOrders && Array.isArray(response.data.materialOrders)) {
        // Handle nested structure with pagination: {success: true, data: {materialOrders: [...], pagination: {...}}}
        costsData = response.data.materialOrders;
        totalCount = response.data.pagination?.total || response.data.totalCount || 
                    ((page - 1) * recordsPerPage + costsData.length);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Data property is an array
        costsData = response.data;
        totalCount = response.pagination?.total || response.totalCount || 
                    ((page - 1) * recordsPerPage + costsData.length);
      } else if (response && response.materialCosts && Array.isArray(response.materialCosts)) {
        // Named property
        costsData = response.materialCosts;
        totalCount = response.pagination?.total || response.totalCount || 
                    ((page - 1) * recordsPerPage + costsData.length);
      }
      
      console.log("Processed material costs data:", costsData); // Debug log
      
      // Set current page data
      setMaterialCosts(costsData);
      
      // Update all costs collection
      if (allData.length > 0) {
        // We already have all data
        setAllMaterialCosts(allData);
      } else {
        // Update incrementally
        setAllMaterialCosts(prev => {
          const newAllCosts = [...prev];
          const startIndex = (page - 1) * recordsPerPage;
          costsData.forEach((cost, idx) => {
            newAllCosts[startIndex + idx] = cost;
          });
          return newAllCosts;
        });
      }
      
      // Calculate total pages
      const calculatedTotalPages = Math.ceil(totalCount / recordsPerPage);
      setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
      setCurrentPage(page);
      
      console.log("Total count:", totalCount);
      console.log("Total pages:", calculatedTotalPages);
    } catch (err) {
      setError("Failed to fetch material costs");
      console.error("Error fetching material costs:", err);
      setMaterialCosts([]); // Ensure materialCosts is always an array
      // Don't clear allMaterialCosts to preserve any data we might have
      // Only set totalPages to 1 if we're on page 1
      if (page === 1) {
        setAllMaterialCosts([]);
        setTotalPages(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewMaterialAssignments = async (materialOrder) => {
    try {
      setSelectedMaterialOrder(materialOrder);
      setAssignmentsLoading(true);
      onOpen();
      
      const response = await materialOrderAssignmentAPI.getByMaterialOrderId(materialOrder.id);
      console.log("Material assignments response:", response);
      
      // Handle different response structures
      let assignmentsData = [];
      if (response && Array.isArray(response)) {
        assignmentsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response && response.assignments && Array.isArray(response.assignments)) {
        assignmentsData = response.assignments;
      }
      
      console.log("Processed material assignments data:", assignmentsData);
      setMaterialAssignments(assignmentsData);
    } catch (err) {
      console.error("Error fetching material assignments:", err);
      toast({
        title: "Error",
        description: "Failed to fetch material assignment details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setMaterialAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleEditMaterial = async (materialOrder) => {
    try {
      setEditingMaterial({ ...materialOrder });
      setEditLoading(true);
      onEditOpen();
      
      const response = await materialOrderAssignmentAPI.getByMaterialOrderId(materialOrder.id);
      console.log("Edit material assignments response:", response);
      
      // Handle different response structures
      let assignmentsData = [];
      if (response && Array.isArray(response)) {
        assignmentsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response && response.assignments && Array.isArray(response.assignments)) {
        assignmentsData = response.assignments;
      }
      
      console.log("Processed edit assignments data:", assignmentsData);
      setEditingAssignments([...assignmentsData]);
    } catch (err) {
      console.error("Error fetching material assignments for edit:", err);
      toast({
        title: "Error",
        description: "Failed to fetch material assignment details for editing",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setEditingAssignments([]);
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);

      // Calculate total cost from assignments
      const totalCost = editingAssignments.reduce((sum, assignment) => {
        return sum + (parseFloat(assignment.totalPrice) || 0);
      }, 0);

      // Update material order with new total cost
      const updatedMaterialOrder = {
        ...editingMaterial,
        cost: totalCost
      };

      // Update the material order
      await materialOrderAPI.update(editingMaterial.id, {
        description: updatedMaterialOrder.description,
        cost: totalCost
      });

      // Update each assignment
      for (const assignment of editingAssignments) {
        await materialOrderAssignmentAPI.updateById(assignment.id, {
          quantity: parseFloat(assignment.quantity),
          unitPrice: parseFloat(assignment.unitPrice),
          totalPrice: parseFloat(assignment.totalPrice)
        });
      }

      toast({
        title: "Success",
        description: "Material order updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh the data
      await fetchMaterialCosts();
      onEditClose();
    } catch (err) {
      console.error("Error updating material order:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update material order",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMaterial = (materialOrder) => {
    setDeletingMaterial(materialOrder);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;

    try {
      setDeleteLoading(true);
      
      await materialOrderAPI.delete(deletingMaterial.id);
      
      toast({
        title: "Success",
        description: "Material order record deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Refresh the data
      await fetchMaterialCosts();
      onDeleteClose();
      setDeletingMaterial(null);
    } catch (err) {
      console.error("Error deleting material order:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete material order record",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    onDeleteClose();
    setDeletingMaterial(null);
  };

  const handleAssignmentChange = (index, field, value) => {
    const updatedAssignments = [...editingAssignments];
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      [field]: value
    };

    // Recalculate total price for this assignment
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = parseFloat(updatedAssignments[index].quantity) || 0;
      const unitPrice = parseFloat(updatedAssignments[index].unitPrice) || 0;
      updatedAssignments[index].totalPrice = (quantity * unitPrice).toFixed(2);
    }

    setEditingAssignments(updatedAssignments);
  };

  const calculateSummary = (assignments) => {
    if (!Array.isArray(assignments)) return { totalMaterials: 0, totalQuantity: 0, totalCost: 0 };
    
    return assignments.reduce((summary, assignment) => {
      return {
        totalMaterials: summary.totalMaterials + 1,
        totalQuantity: summary.totalQuantity + (assignment.quantity || 0),
        totalCost: summary.totalCost + (assignment.totalPrice || 0)
      };
    }, { totalMaterials: 0, totalQuantity: 0, totalCost: 0 });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: "orange",
      APPROVED: "blue",
      ORDERED: "purple",
      RECEIVED: "green",
      CANCELLED: "red"
    };
    return statusColors[status] || "gray";
  };

  const getTypeColor = (type) => {
    const typeColors = {
      MR: "blue",
      PR: "purple",
      PO: "teal",
      GRN: "cyan",
      STORE: "green",
      OTHER: "orange"
    };
    return typeColors[type] || "gray";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Helper function to check if record can be edited/deleted (within 30 days of creation)
  const canEditOrDelete = (materialOrder) => {
    const currentDate = new Date();
    const createdDate = new Date(materialOrder.createdAt || materialOrder.date);
    const timeDifference = currentDate - createdDate;
    const daysDifference = timeDifference / (1000 * 3600 * 24); // Convert milliseconds to days
    return daysDifference <= 30;
  };

  if (loading && materialCosts.length === 0) {
    return (
      <Container maxW="1200px" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Heading size="md">Loading material costs...</Heading>
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
            <BreadcrumbLink as={Link} to="/addcost" color="blue.500">
              Add Cost
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink color="orange.500" fontWeight="bold" fontSize="x-large">
              Material Cost Records
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <HStack justify="space-between">
            <Text color="gray.600">Track material orders and procurement costs</Text>
          <Link to="/addcost/material/add">
            <Button leftIcon={<FiPlus />} colorScheme="orange">
              Add New Material Cost
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
                      width="300px"
                      placeholder="Search job number or name..."
                      value={jobFilter}
                      onChange={(e) => setJobFilter(e.target.value)}
                    />
                    <Input
                      type="date"
                      size="sm"
                      width="150px"
                      placeholder="Filter by date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                    {(dateFilter || jobFilter) && (
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
                      {materialCosts.length > 0 ? (
                        <>
                          Showing {(currentPage - 1) * recordsPerPage + 1} to {(currentPage - 1) * recordsPerPage + materialCosts.length} of {filteredMaterialCosts.length > 0 ? filteredMaterialCosts.length : allMaterialCosts.length} records
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
                        colorScheme="orange"
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
                        colorScheme="orange"
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
          )
        {/* Material Cost table */}
        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <TableContainer whiteSpace="normal">
            <Table variant="simple" size="sm" layout="fixed" >
              <Thead backgroundColor={"orange.50"} >
                <Tr>
                  <Th py={3} px={2}>Date</Th>
                  <Th py={3} px={2}>Job Number</Th>
                  <Th py={3} px={2}>Job Title</Th>
                  <Th py={3} px={2} width="80px">Type</Th>
                  <Th py={3} px={2}>
                    <Tooltip label="Hover over order numbers to see creator/updater info" fontSize="xs">
                      Order Number ⓘ
                    </Tooltip>
                  </Th>
                  <Th py={3} px={3}>Cost (LKR)</Th>
                  <Th py={3} px={2} width="100px">Materials</Th>
                  <Th py={3} px={2} width="150px">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Array.isArray(materialCosts) && materialCosts.map((material) => (
                  <Tr key={material.id}>
                    <Td py={2} px={2}>{formatDate(material.date)}</Td>
                    <Td py={2} px={2} fontWeight="medium">{material.job?.jobNumber || 'N/A'}</Td>
                    <Td py={2} px={2} maxW="200px" isTruncated>{material.job?.title || 'N/A'}</Td>
                    <Td py={2} px={2}>
                      <Badge colorScheme={getTypeColor(material.type)} size="sm">
                        {material.type || 'N/A'}
                      </Badge>
                    </Td>
                    <Td py={2} px={2} fontWeight="medium">
                      <Tooltip 
                        label={
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs">
                              <strong>Created by:</strong> {material.createdBy ? 
                                `${material.createdBy.firstName} ${material.createdBy.lastName}` : 
                                'N/A'
                              }
                            </Text>
                            <Text fontSize="xs">
                              <strong>Created:</strong> {material.createdAt ? 
                                new Date(material.createdAt).toLocaleString() : 
                                'N/A'
                              }
                            </Text>
                            <Text fontSize="xs">
                              <strong>Updated by:</strong> {material.updatedBy ? 
                                `${material.updatedBy.firstName} ${material.updatedBy.lastName}` : 
                                'N/A'
                              }
                            </Text>
                            <Text fontSize="xs">
                              <strong>Updated:</strong> {material.updatedAt ? 
                                new Date(material.updatedAt).toLocaleString() : 
                                'N/A'
                              }
                            </Text>
                          </VStack>
                        }
                        placement="top"
                        hasArrow
                        bg="gray.900"
                        color="white"
                        fontSize="xs"
                      >
                        <Text cursor="help" textDecoration="underline dotted">
                          {material.code}
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td py={2} px={4} fontWeight="medium">{formatCurrency(material.cost)}</Td>
                    <Td py={2} px={1}>
                      <Button 
                        size="2xs" 
                        variant="outline" 
                        colorScheme="green"
                        p={1}
                        onClick={() => handleViewMaterialAssignments(material)}
                      >
                        View
                      </Button>
                    </Td>                   
                    <Td py={2} px={1}>
                      <HStack spacing={4}>
                        <Button 
                          size="2xs" 
                          leftIcon={<FiEdit />}
                          variant="outline" 
                          colorScheme="orange" 
                          p={1}
                          onClick={() => handleEditMaterial(material)}
                          isDisabled={!canEditOrDelete(material)}
                          title={!canEditOrDelete(material) ? "Can only edit records within 30 days of creation" : "Edit material cost"}
                        >
                        </Button>
                        <Button 
                          size="2xs" 
                          leftIcon={<FiTrash2 />}
                          variant="outline" 
                          colorScheme="red" 
                          p={1}
                          onClick={() => handleDeleteMaterial(material)}
                          isDisabled={!canEditOrDelete(material)}
                          title={!canEditOrDelete(material) ? "Can only delete records within 30 days of creation" : "Delete material cost"}
                        >
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

        </Box>
        {allMaterialCosts.length === 0 && !loading && (
          <Box textAlign="center" py={12}>
            <VStack spacing={4}>
              <Heading size="md" color="gray.500">No material costs found</Heading>
              <Text color="gray.400">Start tracking your material costs to see them here</Text>
              <Link to="/addcost/material/add">
                <Button colorScheme="orange">
                  Add Your First Material Cost
                </Button>
              </Link>
            </VStack>
          </Box>
        )}

        {/* Edit Material Order Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader py={3}>
              <VStack spacing={1} align="start">
                <Heading size="md">Edit Material Order</Heading>
                {editingMaterial && (
                  <>
                    <Text fontSize="xs" color="gray.600">
                      Order: {editingMaterial.code} | Job: {editingMaterial.job?.jobNumber} - {editingMaterial.job?.title} | Date: {formatDate(editingMaterial.date)}
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="gray.500">
                      <Text>
                        Created by: {editingMaterial.createdBy ? 
                          `${editingMaterial.createdBy.firstName} ${editingMaterial.createdBy.lastName}` : 
                          'N/A'
                        }
                      </Text>
                      <Text>
                        Last updated by: {editingMaterial.updatedBy ? 
                          `${editingMaterial.updatedBy.firstName} ${editingMaterial.updatedBy.lastName}` : 
                          'N/A'
                        }
                      </Text>
                    </HStack>
                  </>
                )}
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={2}>
              {editLoading ? (
                <Box textAlign="center" py={6}>
                  <Spinner size="lg" />
                  <Text mt={2} fontSize="sm">Loading material details...</Text>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {/* Material Order Details */}
                  <Box>
                    <Heading size="sm" mb={2}>Order Details</Heading>
                    <FormControl>
                      <FormLabel fontSize="sm" mb={1}>Description</FormLabel>
                      <Textarea
                        value={editingMaterial?.description || ''}
                        onChange={(e) => setEditingMaterial(prev => ({
                          ...prev,
                          description: e.target.value
                        }))}
                        placeholder="Order description..."
                        rows={2}
                        size="sm"
                      />
                    </FormControl>
                  </Box>

                  <Divider my={2} />

                  {/* Material Assignments*/}
                  <Box>
                    <Heading size="sm" mb={2}>Material Items</Heading>
                    {editingAssignments.length > 0 ? (
                      <TableContainer maxH="300px" overflowY="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                        <Table variant="simple" size="xs" colorScheme="orange" layout="fixed">
                          <Thead position="sticky" top={0} bg="white" zIndex={1}>
                            <Tr>
                              <Th py={1} px={1} fontSize="xs">Material Name</Th>
                              <Th py={1} px={1} fontSize="xs">UOM</Th>
                              <Th py={1} px={1} fontSize="xs">Unit Price</Th>
                              <Th py={1} px={1} fontSize="xs">Quantity</Th>
                              <Th py={1} px={1} fontSize="xs">Total Price</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {editingAssignments.map((assignment, index) => (
                              <Tr key={assignment.id}>
                                <Td py={1} px={1}>
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium" fontSize="xs">{assignment.material?.name}</Text>
                                    <Text fontSize="2xs" color="gray.600" noOfLines={1}>{assignment.material?.description}</Text>
                                  </VStack>
                                </Td>
                                <Td py={1} px={1}>
                                  <Badge colorScheme="blue" size="xs" fontSize="2xs">
                                    {assignment.material?.uom}
                                  </Badge>
                                </Td>
                                <Td py={1} px={1}>
                                  <NumberInput
                                    value={assignment.unitPrice}
                                    onChange={(valueString) => handleAssignmentChange(index, 'unitPrice', valueString)}
                                    min={0}
                                    precision={2}
                                    size="xs"
                                    maxW="120px"
                                  >
                                    <NumberInputField fontSize="xs" py={1} />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                </Td>
                                <Td py={1} px={1}>
                                  <NumberInput
                                    value={assignment.quantity}
                                    onChange={(valueString) => handleAssignmentChange(index, 'quantity', valueString)}
                                    min={0}
                                    precision={2}
                                    size="xs"
                                    maxW="80px"
                                  >
                                    <NumberInputField fontSize="xs" py={1} />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                </Td>
                                <Td py={1} px={1}>
                                  <Text fontWeight="bold" fontSize="xs" color="green.600">
                                    {formatCurrency(assignment.totalPrice || 0)}
                                  </Text>
                                </Td>
                              </Tr>
                            ))}
                            <Tr bg="orange.50">
                              <Td colSpan={4} textAlign="right" py={1} px={1}>
                                <Text fontWeight="bold" fontSize="xs">Total Order Cost:</Text>
                              </Td>
                              <Td py={1} px={1}>
                                <Text fontWeight="bold" fontSize="sm" color="green.600">
                                  {formatCurrency(editingAssignments.reduce((sum, assignment) => 
                                    sum + (parseFloat(assignment.totalPrice) || 0), 0
                                  ))}
                                </Text>
                              </Td>
                            </Tr>
                          </Tbody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Text color="gray.500" fontSize="sm">No material assignments found</Text>
                    )}
                  </Box>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter py={3}>
              <Button variant="ghost" mr={3} onClick={onEditClose} size="sm">
                Cancel
              </Button>
              <Button 
                colorScheme="orange" 
                onClick={handleSaveEdit}
                isLoading={editLoading}
                loadingText="Saving..."
                size="sm"
              >
                Save Changes
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Material Assignments Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <VStack align="start" spacing={2}>
                <Heading size="lg">Material Order Details</Heading>
                {selectedMaterialOrder && (
                  <>
                  <HStack spacing={8} align="start">
                    <VStack>
                    <Text fontSize="md" color="gray.600">
                      <strong>Date</strong>
                    </Text>
                      <Text fontSize="md" color="gray.600">
                       {formatDate(selectedMaterialOrder.date)}
                      </Text>
                    </VStack>
                    <VStack>
                    <Text fontSize="md" color="gray.600">
                      <strong>Job</strong>
                    </Text>
                      <Text fontSize="md" color="gray.600">
                       {selectedMaterialOrder.job?.jobNumber} - {selectedMaterialOrder.job?.title}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="md" color="gray.600">
                      <strong>Project Code</strong>
                    </Text>
                      <Text fontSize="md" color="gray.600">
                         {selectedMaterialOrder.job?.projectCode}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="md" color="gray.600">
                      <strong>Order Number</strong>
                      </Text>
                      <Text fontSize="md" color="gray.600">
                       {selectedMaterialOrder.code}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="md" color="gray.600">
                      <strong>Type</strong>
                      </Text>
                      <Text fontSize="md" color="gray.600">
                        {selectedMaterialOrder.type}
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="md" color="gray.600">
                        <strong>Description</strong>
                      </Text>
                      <Text fontSize="md" color="gray.600">
                        {selectedMaterialOrder.description}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  {/* Creator and Updater Information */}
                  <HStack spacing={8} align="start" mt={4}>
                    <VStack>
                      <Text fontSize="md" color="gray.600">
                        <strong>Created By</strong>
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {selectedMaterialOrder.createdBy ? 
                          `${selectedMaterialOrder.createdBy.firstName} ${selectedMaterialOrder.createdBy.lastName} (${selectedMaterialOrder.createdBy.username})` : 
                          'N/A'
                        }
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {selectedMaterialOrder.createdAt ? 
                          new Date(selectedMaterialOrder.createdAt).toLocaleString() : 
                          'N/A'
                        }
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="md" color="gray.600">
                        <strong>Last Updated By</strong>
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {selectedMaterialOrder.updatedBy ? 
                          `${selectedMaterialOrder.updatedBy.firstName} ${selectedMaterialOrder.updatedBy.lastName} (${selectedMaterialOrder.updatedBy.username})` : 
                          'N/A'
                        }
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {selectedMaterialOrder.updatedAt ? 
                          new Date(selectedMaterialOrder.updatedAt).toLocaleString() : 
                          'N/A'
                        }
                      </Text>
                    </VStack>
                  </HStack>
                  </>
                )}
              </VStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {assignmentsLoading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="xl" />
                  <Text mt={4}>Loading material assignments...</Text>
                </Box>
              ) : (
                <VStack spacing={6} align="stretch">
                  {/* Summary Cards */}
                  {materialAssignments.length > 0 && (
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                      <Stat>
                        <StatLabel>Total Materials</StatLabel>
                        <StatNumber>{calculateSummary(materialAssignments).totalMaterials}</StatNumber>
                        <StatHelpText>
                          <FiPackage style={{ display: 'inline', marginRight: '4px' }} />
                          Items
                        </StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Total Quantity</StatLabel>
                        <StatNumber>{calculateSummary(materialAssignments).totalQuantity.toFixed(2)}</StatNumber>
                        <StatHelpText>
                          <FiHash style={{ display: 'inline', marginRight: '4px' }} />
                          Units
                        </StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel>Total Cost</StatLabel>
                        <StatNumber>{formatCurrency(calculateSummary(materialAssignments).totalCost)}</StatNumber>
                        <StatHelpText>
                          <FiDollarSign style={{ display: 'inline', marginRight: '4px' }} />
                          Calculated
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  )}

                  <Divider />

                  {/* Material Assignments Table */}
                  {materialAssignments.length > 0 ? (
                    <Box>
                      <Heading size="md" mb={4}>Material Assignments</Heading>
                      <TableContainer>
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Material Name</Th>
                              <Th>Description</Th>
                              <Th>UOM</Th>
                              <Th>Unit Price</Th>
                              <Th>Quantity</Th>
                              <Th>Total Price</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {materialAssignments.map((assignment) => (
                              <Tr key={assignment.id}>
                                <Td fontWeight="medium">{assignment.material?.name || 'N/A'}</Td>
                                <Td>{assignment.material?.description || 'N/A'}</Td>
                                <Td>
                                  <Badge colorScheme="blue" variant="subtle">
                                    {assignment.material?.uom || 'N/A'}
                                  </Badge>
                                </Td>
                                <Td>{formatCurrency(assignment.unitPrice || 0)}</Td>
                                <Td>{assignment.quantity || 0}</Td>
                                <Td fontWeight="bold">{formatCurrency(assignment.totalPrice || 0)}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={8}>
                      <VStack spacing={4}>
                        <Heading size="md" color="gray.500">No material assignments found</Heading>
                        <Text color="gray.400">
                          This material order doesn't have detailed material assignments.
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          This might be an older record created before the assignment tracking was implemented.
                        </Text>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="orange" onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={handleCancelDelete}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Material Order Record
              </AlertDialogHeader>

              <AlertDialogBody>
                {deletingMaterial && (
                  <VStack align="start" spacing={2}>
                    <Text>
                      Are you sure you want to delete this material order record? This action cannot be undone.
                    </Text>
                    <Box p={3} bg="gray.50" borderRadius="md" w="100%">
                      <Text fontSize="sm" fontWeight="medium">
                        <strong>Job:</strong> {deletingMaterial.job?.jobNumber} - {deletingMaterial.job?.title}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Date:</strong> {formatDate(deletingMaterial.date)}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Type:</strong> {deletingMaterial.type}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Code:</strong> {deletingMaterial.code}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Cost:</strong> {formatCurrency(deletingMaterial.cost)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        <strong>Description:</strong> {deletingMaterial.description || 'No description'}
                      </Text>
                    </Box>
                    <Text fontSize="sm" color="red.600" fontWeight="medium">
                      ⚠️ This will also delete all related material assignment records.
                    </Text>
                  </VStack>
                )}
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={handleCancelDelete} size="sm">
                  Cancel
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleConfirmDelete}
                  ml={3}
                  size="sm"
                  isLoading={deleteLoading}
                  loadingText="Deleting..."
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default MaterialCostListPage;