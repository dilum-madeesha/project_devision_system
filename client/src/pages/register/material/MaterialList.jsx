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
  Box,
  Flex,
  HStack,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  Tooltip,
  Badge,
  Text,
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
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { materialAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";
import { FEATURES } from "../../../utils/permissions";

const MaterialListPage = () => {
  const [materials, setMaterials] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 8;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uomFilter, setUomFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Edit modal state
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    uom: '',
    unitPrice: 0
  });
  const [editLoading, setEditLoading] = useState(false);
  
  const cancelRef = useRef();
  const toast = useToast();
  const { user } = useAuth();

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Apply filters whenever filter values or allMaterials change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, uomFilter, priceRangeFilter, allMaterials]);

  const applyFilters = () => {
    let filtered = [...allMaterials];

    // Apply search filter (search in material name and description)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(material => {
        const name = (material.name || '').toLowerCase();
        const description = (material.description || '').toLowerCase();
        return name.includes(searchTermLower) || description.includes(searchTermLower);
      });
    }

    // Apply UOM filter
    if (uomFilter) {
      filtered = filtered.filter(material => material.uom === uomFilter);
    }

    // Apply price range filter
    if (priceRangeFilter) {
      filtered = filtered.filter(material => {
        const price = material.unitPrice;
        switch (priceRangeFilter) {
          case 'under-100':
            return price < 100;
          case '100-500':
            return price >= 100 && price < 500;
          case '500-1000':
            return price >= 500 && price < 1000;
          case 'over-1000':
            return price >= 1000;
          default:
            return true;
        }
      });
    }

    setFilteredMaterials(filtered);
    
    // Reset pagination when filters change
    const newTotalPages = Math.ceil(filtered.length / recordsPerPage);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
    setCurrentPage(1);
    
    // Set current page data
    const startIndex = 0;
    const endIndex = Math.min(recordsPerPage, filtered.length);
    setMaterials(filtered.slice(startIndex, endIndex));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setUomFilter('');
    setPriceRangeFilter('');
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const dataToUse = filteredMaterials.length > 0 ? filteredMaterials : allMaterials;
    
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, dataToUse.length);
    
    setMaterials(dataToUse.slice(startIndex, endIndex));
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      
      // Get all materials for client-side pagination and filtering
      const response = await materialAPI.getAll({ limit: 10000 }); // Get all materials this is the edited 
      console.log("Materials API response:", response);
      
      if (response && response.success && response.data) {
        const materialsData = response.data.materials || [];
        setAllMaterials(materialsData);
        setFilteredMaterials(materialsData);
        
        // Calculate total pages
        const newTotalPages = Math.ceil(materialsData.length / recordsPerPage);
        setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
        
        // Set current page data
        const startIndex = 0;
        const endIndex = Math.min(recordsPerPage, materialsData.length);
        setMaterials(materialsData.slice(startIndex, endIndex));
      } else {
        setMaterials([]);
        setAllMaterials([]);
        setFilteredMaterials([]);
      }
    } catch (err) {
      console.error("Error fetching materials:", err);
      setError(err.response?.data?.message || "Failed to fetch materials");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (material) => {
    setSelectedMaterial(material);
    onOpen();
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setEditFormData({
      name: material.name,
      description: material.description || '',
      uom: material.uom,
      unitPrice: material.unitPrice
    });
    onEditOpen();
  };

  const handleEditSubmit = async () => {
    if (!editingMaterial) return;

    setEditLoading(true);
    try {
      await materialAPI.update(editingMaterial.id, editFormData);
      toast({
        title: "Success",
        description: "Material updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchMaterials(); // Refresh the list
      onEditClose();
    } catch (err) {
      console.error("Error updating material:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update material",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMaterial) return;

    try {
      await materialAPI.delete(selectedMaterial.id);
      toast({
        title: "Success",
        description: "Material deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchMaterials(); // Refresh the list
    } catch (err) {
      console.error("Error deleting material:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete material",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onClose();
      setSelectedMaterial(null);
    }
  };

  const formatCurrency = (amount) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const { can } = useAuth();
  const canEdit = can(FEATURES.REGISTER_MATERIALS);
  const canDelete = user?.role === 'ADMIN'; // Keep delete as admin only for safety

  if (loading && materials.length === 0) {
    return (
      <Container maxW="1400px" py={8}>
        <VStack spacing={6}>
          <Box textAlign="center">
            <Spinner size="xl" />
            <Text mt={4}>Loading materials...</Text>
          </Box>
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
          <BreadcrumbLink color="orange.500" fontWeight="bold" fontSize="x-large">
            Material List
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
        {/* Header Section */}
      <HStack justify="space-between">
        <Text color="gray.600">Manage material inventory and pricing</Text>
        <HStack spacing={3}>
          <Link to="/register/materials/addexcel">
            <Button leftIcon={<FiUpload />} colorScheme="blue" variant="outline">
              Upload Excel
            </Button>
          </Link>
          <Link to="/register/materials/add">
            <Button leftIcon={<FiPlus />} colorScheme="blue">
              Add New Material
            </Button>
          </Link>
        </HStack>
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
                    placeholder="Search material name or description..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <Select
                    size="sm"
                    width="120px"
                    placeholder="All UOMs"
                    value={uomFilter}
                    onChange={(e) => setUomFilter(e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="m">m</option>
                    <option value="cm">cm</option>
                    <option value="mm">mm</option>
                    <option value="pcs">pcs</option>
                    <option value="box">box</option>
                    <option value="pack">pack</option>
                    <option value="roll">roll</option>
                    <option value="sheet">sheet</option>
                    <option value="bottle">bottle</option>
                    <option value="can">can</option>
                    <option value="bag">bag</option>
                  </Select>
                  <Select
                    size="sm"
                    width="150px"
                    placeholder="All Prices"
                    value={priceRangeFilter}
                    onChange={(e) => setPriceRangeFilter(e.target.value)}
                  >
                    <option value="under-100">Under LKR 100</option>
                    <option value="100-500">LKR 100-500</option>
                    <option value="500-1000">LKR 500-1,000</option>
                    <option value="over-1000">Over LKR 1,000</option>
                  </Select>
                  {(searchTerm || uomFilter || priceRangeFilter) && (
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
                    {materials.length > 0 ? (
                      <>
                        Showing {(currentPage - 1) * recordsPerPage + 1} to {(currentPage - 1) * recordsPerPage + materials.length} of {filteredMaterials.length > 0 ? filteredMaterials.length : allMaterials.length} records
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

        {/* Materials Table */}
        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <TableContainer whiteSpace="normal">
            <Table variant="simple" size="sm" layout="fixed">
              <Thead backgroundColor={"blue.50"}>
                <Tr>
                  <Th py={3} px={2} width="200px">Material Name</Th>
                  <Th py={3} px={2} width="200px">Description</Th>
                  <Th py={3} px={2} width="80px">UOM</Th>
                  <Th py={3} px={2} width="120px">Unit Price</Th>
                  <Th py={3} px={2} width="120px">Updated By</Th>
                  <Th py={3} px={2} width="100px">Updated On</Th>
                  {(canEdit || canDelete) && <Th py={3} px={2} width="120px">Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {Array.isArray(materials) && materials.map((material) => (
                  <Tr key={material.id}>
                    <Td py={2} px={2} fontWeight="medium">
                        {material.name}
                    </Td>
                    <Td py={2} px={2} maxW="250px" isTruncated>
                      {material.description || 'No description'}
                    </Td>
                    <Td py={2} px={2}>
                      <Badge colorScheme="blue" variant="subtle" size="sm">
                        {material.uom}
                      </Badge>
                    </Td>
                    <Td py={2} px={2} fontWeight="medium" color="green.600">
                      {formatCurrency(material.unitPrice)}
                    </Td>
                    <Td py={2} px={2} isTruncated>
                      {material.updatedBy 
                        ? `${material.updatedBy.firstName} ${material.updatedBy.lastName}`
                        : 'Unknown'
                      }
                    </Td>
                    <Td py={2} px={2}>
                        {formatDate(material.updatedAt)}
                    </Td>
                    {(canEdit || canDelete) && (
                    <Td py={2} px={1}>
                        <HStack spacing={4}>
                          {canEdit && (
                            <Tooltip label="Edit Material">
                              <Button
                                size="2xs"
                                leftIcon={<FiEdit2 />}
                                variant="outline"
                                colorScheme="blue"
                                p={1}
                                onClick={() => handleEditMaterial(material)}
                              />
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip label="Delete Material">
                              <Button
                                size="2xs"
                                leftIcon={<FiTrash2 />}
                                variant="outline"
                                colorScheme="red"
                                p={1}
                                onClick={() => handleDeleteClick(material)}
                              />
                            </Tooltip>
                          )}
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
        {Array.isArray(materials) && materials.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <Heading size="md" color="gray.500" mb={4}>
              {(searchTerm || uomFilter || priceRangeFilter) ? "No materials found" : "No materials found"}
            </Heading>
            {(searchTerm || uomFilter || priceRangeFilter) ? (
              <Text color="gray.500">
                No materials match your search criteria. Try adjusting your filters or search terms.
              </Text>
            ) : (
              <>
                <Text color="gray.500" mb={4}>
                  No materials have been registered yet.
                </Text>
                {canEdit && (
                  <Link to="/register/materials/add">
                    <Button colorScheme="blue">
                      Add Your First Material
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
            <ModalHeader>Edit Material</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Material Name</FormLabel>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter material name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter material description"
                    rows={3}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Unit of Measurement (UOM)</FormLabel>
                  <Select
                    value={editFormData.uom}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, uom: e.target.value }))}
                    placeholder="Select UOM"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="m">Meter (m)</option>
                    <option value="cm">Centimeter (cm)</option>
                    <option value="mm">Millimeter (mm)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                    <option value="roll">Roll</option>
                    <option value="sheet">Sheet</option>
                    <option value="bottle">Bottle</option>
                    <option value="can">Can</option>
                    <option value="bag">Bag</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Unit Price (LKR)</FormLabel>
                  <NumberInput
                    value={editFormData.unitPrice}
                    onChange={(_, valueAsNumber) => 
                      setEditFormData(prev => ({ ...prev, unitPrice: valueAsNumber || 0 }))
                    }
                    min={0}
                    precision={2}
                    step={0.01}
                  >
                    <NumberInputField placeholder="0.00" />
                  </NumberInput>
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
                Update Material
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Material
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete the material "{selectedMaterial?.name}"? 
                This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
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

export default MaterialListPage;
