import {
  Container,
  VStack,
  Heading,
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  HStack,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  FormErrorMessage,
  Text,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ChevronRightIcon } from "@chakra-ui/icons";
import { materialAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";
import { FEATURES } from "../../../utils/permissions";

const AddMaterialPage = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For edit mode
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    uom: "",
    unitPrice: ""
  });

  // Check if user has permission using privilege-based access control
  const { can } = useAuth();
  const canCreateEdit = can(FEATURES.REGISTER_MATERIALS);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchMaterial();
    }
  }, [id]);

  const fetchMaterial = async () => {
    try {
      setLoading(true);
      const response = await materialAPI.getById(id);
      if (response && response.success && response.data) {
        const material = response.data;
        setFormData({
          name: material.name || "",
          description: material.description || "",
          uom: material.uom || "",
          unitPrice: material.unitPrice?.toString() || ""
        });
      }
    } catch (err) {
      console.error("Error fetching material:", err);
      setError(err.response?.data?.message || "Failed to fetch material details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Material name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Material name must be at least 2 characters long";
    }

    if (!formData.uom.trim()) {
      newErrors.uom = "Unit of measurement is required";
    }

    if (!formData.unitPrice.trim()) {
      newErrors.unitPrice = "Unit price is required";
    } else {
      const price = parseFloat(formData.unitPrice);
      if (isNaN(price) || price < 0) {
        newErrors.unitPrice = "Unit price must be a valid positive number";
      }
    }

    if (formData.description && formData.description.trim().length > 0 && formData.description.trim().length < 3) {
      newErrors.description = "Description must be at least 3 characters long if provided";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        uom: formData.uom.trim(),
        unitPrice: parseFloat(formData.unitPrice)
      };

      console.log("Submitting material data:", submitData);

      let response;
      if (isEditMode) {
        response = await materialAPI.update(id, submitData);
      } else {
        response = await materialAPI.create(submitData);
      }

      console.log("Material operation response:", response);

      toast({
        title: "Success",
        description: `Material ${isEditMode ? 'updated' : 'created'} successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/register/materials");
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} material:`, err);
      
      // Handle validation errors from server
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} material`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect if user doesn't have permission
  if (!canCreateEdit) {
    return (
      <Container maxW="800px" py={8}>
        <Alert status="error">
          <AlertIcon />
          Access denied. You need L4 Registration Manager, L5 Job Cost Manager, or higher privilege to {isEditMode ? 'edit' : 'create'} materials.
        </Alert>
      </Container>
    );
  }

  if (isEditMode && loading && !formData.name) {
    return (
      <Container maxW="800px" py={8}>
        <VStack spacing={6}>
          <Text>Loading material details...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="800px" py={0.1}>
      <VStack spacing={2} align="stretch">
        {/* Breadcrumb Navigation */}
        <Breadcrumb fontSize="sm" alignSelf="flex-start">
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/register" color="blue.500">
              Register
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/register/materials" color="blue.500">
              Materials
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink color="orange.500" fontWeight="bold" fontSize="x-large">
              New Material
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {/* Material Name */}
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel>Material Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter material name"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              {/* Description */}
              <FormControl isInvalid={!!errors.description}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter material description (optional)"
                  rows={3}
                />
                <FormErrorMessage>{errors.description}</FormErrorMessage>
              </FormControl>

              <HStack spacing={4} w="full">
                {/* Unit of Measurement */}
                <FormControl isRequired isInvalid={!!errors.uom}>
                  <FormLabel>Unit of Measurement (UOM)</FormLabel>
                  <Input
                    name="uom"
                    value={formData.uom}
                    onChange={handleChange}
                    placeholder="e.g., kg, m, pieces, liters"
                  />
                  <FormErrorMessage>{errors.uom}</FormErrorMessage>
                </FormControl>

                {/* Unit Price */}
                <FormControl isRequired isInvalid={!!errors.unitPrice}>
                  <FormLabel>Unit Price ($)</FormLabel>
                  <Input
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={handleChange}
                    placeholder="Enter unit price"
                  />
                  <FormErrorMessage>{errors.unitPrice}</FormErrorMessage>
                </FormControl>
              </HStack>

              {/* Action Buttons */}
              <HStack spacing={4} w="full" pt={4}>
                <Button
                  type="submit"
                  colorScheme="orange"
                  isLoading={loading}
                  loadingText={isEditMode ? "Updating..." : "Creating..."}
                  flex={1}
                >
                  {isEditMode ? 'Update Material' : 'Create Material'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/register/materials")}
                  flex={1}
                >
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </form>
        </Box>

        {/* Form Guidelines */}
        <Box bg="blue.50" borderRadius="md" p={4}>
          <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={2}>
            Guidelines for Material Registration:
          </Text>
          <VStack align="start" fontSize="sm" color="blue.600" spacing={1}>
            <Text>• Use clear, descriptive names for materials</Text>
            <Text>• Specify the correct unit of measurement (UOM)</Text>
            <Text>• Enter accurate unit prices for cost calculations</Text>
            <Text>• Include relevant descriptions for better identification</Text>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default AddMaterialPage;
