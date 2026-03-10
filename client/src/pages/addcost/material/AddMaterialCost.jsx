import {
  Container,
  VStack,
  Heading,
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  HStack,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Text,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Flex,
  Badge,
  InputGroup,
  InputLeftElement,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  Spacer,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { materialOrderAPI, jobAPI, materialAPI, materialOrderAssignmentAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";
import { FiTrash2, FiPlus, FiSearch } from "react-icons/fi";

const AddMaterialCostPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Color mode values
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const tableBg = useColorModeValue("gray.50", "gray.700");
  const summaryBg = useColorModeValue("gray.50", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  // Form data state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    jobId: "",
    code: "",
    type: "",
    description: ""
  });

  // Initialize data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Filter materials based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.description && material.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredMaterials(filtered);
    }
  }, [searchTerm, materials]);

  // Fetch initial data (jobs and materials)
  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [jobsResponse, materialsResponse] = await Promise.all([
        jobAPI.getAll(),
        materialAPI.getAll()
      ]);
      
      // Handle different response structures for jobs
      let jobsData = [];
      if (jobsResponse && Array.isArray(jobsResponse)) {
        jobsData = jobsResponse;
      } else if (jobsResponse && jobsResponse.data && Array.isArray(jobsResponse.data)) {
        jobsData = jobsResponse.data;
      }
      
      // Filter jobs to show only ONGOING status
      const ongoingJobs = jobsData.filter(job => job.status === 'ONGOING');
      
      // Handle materials response
      let materialsData = [];
      if (materialsResponse && Array.isArray(materialsResponse)) {
        materialsData = materialsResponse;
      } else if (materialsResponse && materialsResponse.data && Array.isArray(materialsResponse.data)) {
        materialsData = materialsResponse.data;
      } else if (materialsResponse && materialsResponse.data && materialsResponse.data.materials && Array.isArray(materialsResponse.data.materials)) {
        materialsData = materialsResponse.data.materials;
      }
      
      setJobs(ongoingJobs);
      setMaterials(materialsData);
      setFilteredMaterials(materialsData);
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError("Failed to load initial data");
      setJobs([]);
      setMaterials([]);
      setFilteredMaterials([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add material to selected list
  const handleAddMaterial = (material) => {
    // Check if material is already selected
    const exists = selectedMaterials.find(m => m.id === material.id);
    if (exists) {
      toast({
        title: 'Material Already Added',
        description: `${material.name} is already in your selection`,
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const newSelectedMaterial = {
      id: material.id,
      name: material.name,
      description: material.description,
      uom: material.uom,
      unitPrice: material.unitPrice || 0,
      quantity: 1
    };

    setSelectedMaterials(prev => [...prev, newSelectedMaterial]);
    
    toast({
      title: 'Material Added',
      description: `${material.name} added to selection`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Remove material from selected list
  const handleRemoveMaterial = (materialId) => {
    setSelectedMaterials(prev => prev.filter(m => m.id !== materialId));
    
    toast({
      title: 'Material Removed',
      description: 'Material removed from selection',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  // Update selected material quantity
  const handleQuantityChange = (materialId, quantity) => {
    setSelectedMaterials(prev =>
      prev.map(material =>
        material.id === materialId
          ? { ...material, quantity: parseFloat(quantity) || 0 }
          : material
      )
    );
  };

  // Update selected material unit price
  const handleUnitPriceChange = (materialId, unitPrice) => {
    setSelectedMaterials(prev =>
      prev.map(material =>
        material.id === materialId
          ? { ...material, unitPrice: parseFloat(unitPrice) || 0 }
          : material
      )
    );
  };

  // Calculate subtotal for a material
  const calculateSubtotal = (material) => {
    return (material.quantity * material.unitPrice) || 0;
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    return selectedMaterials.reduce((total, material) => {
      return total + calculateSubtotal(material);
    }, 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form fields
      if (!formData.date || !formData.jobId || !formData.code || !formData.type) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      // Validate selected materials
      if (selectedMaterials.length === 0) {
        setError("Please select at least one material");
        setLoading(false);
        return;
      }

      // Validate material quantities and prices
      const invalidMaterials = selectedMaterials.filter(m => m.quantity <= 0 || m.unitPrice <= 0);
      if (invalidMaterials.length > 0) {
        setError("All selected materials must have valid quantity and unit price greater than 0");
        setLoading(false);
        return;
      }

      const totalCost = calculateTotalCost();

      // Prepare material order data
      const materialOrderData = {
        jobId: parseInt(formData.jobId),
        date: formData.date,
        type: formData.type,
        code: formData.code,
        description: formData.description || "",
        cost: totalCost,
        createdById: user?.id || 1,
        updatedById: user?.id || 1
      };
      
      // Create material order
      const materialOrderResponse = await materialOrderAPI.create(materialOrderData);
      const createdMaterialOrder = materialOrderResponse.data;

      // Prepare material assignments data
      const materialAssignments = selectedMaterials.map(material => ({
        materialOrderId: createdMaterialOrder.id,
        materialId: material.id,
        quantity: material.quantity,
        unitPrice: material.unitPrice,
        totalPrice: calculateSubtotal(material)
      }));

      // Create material assignments
      await materialOrderAssignmentAPI.createMultiple(materialAssignments);

      toast({
        title: 'Success',
        description: `Material order created successfully with ${selectedMaterials.length} materials assigned. Total cost: LKR ${totalCost.toFixed(2)}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Navigate back to material cost list
      navigate('/addcost/material');
      
    } catch (err) {
      console.error("Error creating material order:", err.response?.data || err);
      setError(err.response?.data?.message || "Failed to create material order");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Box h="100vh" display="flex" flexDirection="column">
        {/* Fixed Header */}
        <Box bg={bg} borderBottom="1px" borderColor={borderColor} py={4} px={6} shadow="sm">
          <Container maxW="1200px">
            <Heading size="lg" color="orange.500">Add Material Cost</Heading>
          </Container>
        </Box>
        
        {/* Loading Content */}
        <Box flex="1" overflowY="auto" bg={useColorModeValue("gray.50", "gray.900")} display="flex" alignItems="center" justifyContent="center">
          <VStack spacing={4}>
            <Text>Loading form data...</Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box h="85vh" display="flex" flexDirection="column">
      {/* Scrollable Content Area */}
      <Box flex="1" overflowY="auto" bg={useColorModeValue("gray.50", "gray.900")}>
        <Container maxW="1200px" py={4}>
          <form id="materialOrderForm" onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <Box bg={bg} borderBottom="1px" borderColor={borderColor} py={2} px={6} shadow="sm">
                <Container maxW="1200px">
                  <VStack spacing={4} align="stretch">
                    {/* Breadcrumb Navigation */}
                    <Breadcrumb fontSize="sm" color="gray.600">
                      <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/addcost" color="blue.500">
                          Add Cost
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/addcost/material" color="blue.500">
                          Material Cost Records
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink color="orange.500" fontWeight="bold" fontSize="x-large">
                          New Material Cost Record
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </Breadcrumb>         
                    {error && (
                      <Alert status="error" variant="left-accent">
                        <AlertIcon />
                        {error}
                      </Alert>
                    )}
                  </VStack>
                </Container>
              </Box>
              {/* Material Order Details Card */}
              <Card bg={cardBg} shadow="md" borderRadius="lg">
                <CardHeader pb={2} borderBottom="1px" borderColor={borderColor}>
                  <Heading size="md">Material Order Details</Heading>
                </CardHeader>
                <CardBody pt={4}>
                  {/* Order Details Section */}
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Date</FormLabel>
                        <Input
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Job</FormLabel>
                        <Select
                          name="jobId"
                          value={formData.jobId}
                          onChange={handleChange}
                          placeholder="Select job"
                        >
                          {Array.isArray(jobs) && jobs.map((job) => (
                            <option key={job.id} value={job.id}>
                              {job.jobNumber} - {job.title}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Order Number</FormLabel>
                        <Input
                          name="code"
                          value={formData.code}
                          onChange={handleChange}
                          placeholder="Enter order/invoice number"
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Order Type</FormLabel>
                        <Select
                          name="type"
                          value={formData.type}
                          onChange={handleChange}
                          placeholder="Select order type"
                        >
                          <option value="MR">Material Request (MR)</option>
                          <option value="PR">Purchase Request (PR)</option>
                          <option value="PO">Purchase Order (PO)</option>
                          <option value="GRN">Goods Received Note (GRN)</option>
                          <option value="STORE">Store Issue (STORE)</option>
                          <option value="OTHER">Other (OTHER)</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Enter detailed description"
                          rows={3}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>

              {/* Material Selection Card */}
              <Card bg={cardBg} shadow="md" borderRadius="lg">
                <CardHeader pb={2} borderBottom="1px" borderColor={borderColor}>
                  <Heading size="md">Material Selection</Heading>
                </CardHeader>
                <CardBody pt={4}>
                  <VStack spacing={4} align="stretch">
                    {/* Available Materials Card */}
                    <Card variant="outline">
                      <CardHeader p={3} bg={useColorModeValue("gray.50", "gray.700")} borderTopRadius="md">
                        <VStack spacing={3} align="stretch">
                          <Flex justify="space-between" align="center">
                            <Heading size="sm">Available Materials</Heading>
                            <Badge>{filteredMaterials.length} items</Badge>
                          </Flex>
                          <InputGroup size="sm">
                            <InputLeftElement pointerEvents="none">
                              <FiSearch color="gray.300" />
                            </InputLeftElement>
                            <Input
                              placeholder="Search materials..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              borderRadius="md"
                            />
                          </InputGroup>
                        </VStack>
                      </CardHeader>
                      <CardBody p={0}>
                        <Box maxH="300px" overflowY="auto">
                          <Table variant="simple" size="sm">
                            <Thead bg={tableBg} position="sticky" top={0} zIndex={1}>
                              <Tr>
                                <Th>Name</Th>
                                <Th>Description</Th>
                                <Th>UOM</Th>
                                <Th>Unit Price</Th>
                                <Th width="60px">Action</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {filteredMaterials.length > 0 ? (
                                filteredMaterials.map((material) => (
                                  <Tr key={material.id} _hover={{ bg: hoverBg }}>
                                    <Td>
                                      <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                                        {material.name}
                                      </Text>
                                    </Td>
                                    <Td>
                                      <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                        {material.description || '-'}
                                      </Text>
                                    </Td>
                                    <Td>{material.uom}</Td>
                                    <Td>LKR {material.unitPrice?.toFixed(2) || '0.00'}</Td>
                                    <Td>
                                      <IconButton
                                        icon={<FiPlus />}
                                        size="sm"
                                        colorScheme="blue"
                                        variant="ghost"
                                        onClick={() => handleAddMaterial(material)}
                                        aria-label="Add material"
                                        isDisabled={selectedMaterials.some(m => m.id === material.id)}
                                      />
                                    </Td>
                                  </Tr>
                                ))
                              ) : (
                                <Tr>
                                  <Td colSpan={5} textAlign="center" py={4}>
                                    <Text color="gray.500">
                                      {searchTerm ? 'No materials match your search' : 'No materials available'}
                                    </Text>
                                  </Td>
                                </Tr>
                              )}
                            </Tbody>
                          </Table>
                        </Box>
                      </CardBody>
                    </Card>

                    {/* Selected Materials Card */}
                    <Card variant="outline">
                      <CardHeader p={3} bg={useColorModeValue("gray.50", "gray.700")} borderTopRadius="md">
                        <Flex justify="space-between" align="center">
                          <Heading size="sm">Selected Materials</Heading>
                          <Badge colorScheme={selectedMaterials.length > 0 ? "green" : "gray"}>
                            {selectedMaterials.length} items
                          </Badge>
                        </Flex>
                      </CardHeader>
                      <CardBody p={0}>
                        {selectedMaterials.length === 0 ? (
                          <Flex h="200px" align="center" justify="center" p={4}>
                            <Text color="gray.500" textAlign="center">
                              No materials selected. Use the + button to add materials.
                            </Text>
                          </Flex>
                        ) : (
                          <VStack spacing={0} h="100%" divider={<Divider />}>
                            <Box maxH="250px" w="100%" overflowY="auto">
                              <Table variant="simple" size="sm">
                                <Thead bg={tableBg} position="sticky" top={0} zIndex={1}>
                                  <Tr>
                                    <Th>Name</Th>
                                    <Th>UOM</Th>
                                    <Th>Unit Price</Th>
                                    <Th>Quantity</Th>
                                    <Th>Subtotal</Th>
                                    <Th width="60px">Action</Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {selectedMaterials.map((material) => (
                                    <Tr key={material.id} _hover={{ bg: hoverBg }}>
                                      <Td>
                                        <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                                          {material.name}
                                        </Text>
                                      </Td>
                                      <Td>{material.uom}</Td>
                                      <Td>
                                        <NumberInput
                                          size="xs"
                                          min={0.01}
                                          precision={2}
                                          value={material.unitPrice}
                                          onChange={(valueAsString) => 
                                            handleUnitPriceChange(material.id, valueAsString)
                                          }
                                          width="90px"
                                        >
                                          <NumberInputField />
                                          <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                          </NumberInputStepper>
                                        </NumberInput>
                                      </Td>
                                      <Td>
                                        <NumberInput
                                          size="xs"
                                          min={0.01}
                                          precision={2}
                                          value={material.quantity}
                                          onChange={(valueAsString) => 
                                            handleQuantityChange(material.id, valueAsString)
                                          }
                                          width="70px"
                                        >
                                          <NumberInputField />
                                          <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                          </NumberInputStepper>
                                        </NumberInput>
                                      </Td>
                                      <Td>
                                        <Text fontWeight="medium" fontSize="sm">
                                          LKR {calculateSubtotal(material).toFixed(2)}
                                        </Text>
                                      </Td>
                                      <Td>
                                        <IconButton
                                          icon={<FiTrash2 />}
                                          size="sm"
                                          colorScheme="red"
                                          variant="ghost"
                                          onClick={() => handleRemoveMaterial(material.id)}
                                          aria-label="Remove material"
                                        />
                                      </Td>
                                    </Tr>
                                  ))}
                                </Tbody>
                              </Table>
                            </Box>

                            {/* Total Cost Summary */}
                            <Box p={3} bg={summaryBg} w="100%" borderBottomRadius="md">
                              <Flex justify="space-between" align="center">
                                <Text fontSize="sm" fontWeight="medium">
                                  Total Materials: {selectedMaterials.length}
                                </Text>
                                <Text fontSize="md" fontWeight="bold" color="green.500">
                                  Total Cost: LKR {calculateTotalCost().toFixed(2)}
                                </Text>
                              </Flex>
                            </Box>
                          </VStack>
                        )}
                      </CardBody>
                    </Card>
                  </VStack>
                </CardBody>
              </Card>

              {/* Action Buttons - Fixed at Bottom */}
              <Card bg={cardBg} shadow="md" borderRadius="lg" bottom={0} zIndex={2}>
                <CardBody py={3}>
                  <HStack spacing={4} justify="flex-end">
                    <Link to="/addcost/material">
                      <Button variant="outline" size="md">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      colorScheme="orange"
                      isLoading={loading}
                      loadingText="Creating Order..."
                      size="md"
                      width={{ base: "full", md: "auto" }}
                      isDisabled={selectedMaterials.length === 0}
                    >
                      Create Material Order
                    </Button>
                  </HStack>
                </CardBody>
              </Card>
            </VStack>
          </form>
        </Container>
      </Box>
    </Box>
  );
};

export default AddMaterialCostPage;