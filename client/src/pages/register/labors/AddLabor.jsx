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
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink
  } from "@chakra-ui/react";
  import { useState } from "react";
  import { useNavigate, Link } from "react-router-dom";
  import { laborAPI } from "../../../api";
  import { useAuth } from "../../../contexts/AuthContext";

  const AddLaborPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { currentUser } = useAuth(); // Get current user from auth context

    const bg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    const [formData, setFormData] = useState({
      epfNumber: "",
      firstName: "",
      lastName: "",
      division: "",
      trade: "",
      payGrade: "",  // Add missing payGrade field
      dayPay: "",
      otPay: "",
      weekendPay: "", // New weekend pay field
      isActive: true,
      createdById: currentUser?.id, // Set createdById from auth context
    });

    const handleChange = (e) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? e.target.checked : value
      }));
    };

    const handleNumberChange = (name, valueAsString, valueAsNumber) => {
      setFormData(prev => ({
        ...prev,
        [name]: valueAsString
      }));
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.epfNumber || !formData.firstName || !formData.lastName ||
        !formData.division || !formData.trade || !formData.payGrade ||
        !formData.dayPay || !formData.otPay) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      try {
        // Convert string numbers to actual numbers and add createdById
        const submitData = {
          ...formData,
          epfNumber: parseInt(formData.epfNumber),
          dayPay: parseFloat(formData.dayPay),
          otPay: parseFloat(formData.otPay),
          // Set weekend pay to day pay if not provided or empty
          weekendPay: formData.weekendPay && formData.weekendPay !== ""
            ? parseFloat(formData.weekendPay)
            : parseFloat(formData.dayPay),
          createdById: user?.id || 1, // Use logged in user ID or fallback to 1
          isActive: formData.isActive === true // Ensure boolean not string
        };

        // Log the data being sent for debugging
        console.log("Submitting labor data:", submitData);

        const response = await laborAPI.create(submitData);
        console.log("Labor creation response:", response);

        toast({
          title: "Success",
          description: "Labor created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/register/labors");
      } catch (err) {
        console.error("Error creating labor:", err.response?.data || err);
        setError(err.response?.data?.message || "Failed to create labor");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Container maxW="800px" py={0.1}>
        <VStack spacing={4} align="stretch">
          {/* Breadcrumb Navigation */}
          <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/register" color="blue.500">
                Register
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbLink as={Link} to="/register/labors" color="blue.500">
                Labor List
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink color="blue.500" fontWeight="bold" fontSize="x-large">
                New Labor
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>



          {error && (
            <Alert status="error">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                {/* EPF Number */}
                <FormControl isRequired>
                  <FormLabel>EPF Number</FormLabel>
                  <NumberInput
                    min={0}
                    value={formData.epfNumber}
                    onChange={(valueAsString, valueAsNumber) => handleNumberChange('epfNumber', valueAsString, valueAsNumber)}
                  >
                    <NumberInputField
                      placeholder="Enter EPF number"
                    />
                  </NumberInput>
                </FormControl>

                {/* Name Fields */}
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Enter first name"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Enter last name"
                    />
                  </FormControl>
                </HStack>

                {/* Division and Trade */}
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Division</FormLabel>
                    <Select
                      name="division"
                      value={formData.division}
                      onChange={handleChange}
                      placeholder="Select division"
                    >
                      <option value="Project">Project</option>

                    </Select>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Trade</FormLabel>
                    <Select
                      name="trade"
                      value={formData.trade}
                      onChange={handleChange}
                      placeholder="Select trade"
                    >
                      <option value="Carpenter">Carpenter</option>
                      <option value="C/Helper">C/Helper</option>
                      <option value="Mason">Mason</option>
                      <option value="M/Helper">M/Helper</option>
                      <option value="Painter">Painter</option>
                      <option value="MDA(C.)">MDA(C.)</option> {/* Changed from P.K.S(LEO) */}
                      <option value="MDA">MDA</option> {/* Changed from P.K.S */}
                      <option value="Other">Other</option> {/* Keep Other */}
                    </Select>
                  </FormControl>
                </HStack>

                {/* Pay Grade */}
                <FormControl isRequired>
                  <FormLabel>Pay Grade</FormLabel>
                  <Select
                    name="payGrade"
                    value={formData.payGrade}
                    onChange={handleChange}
                    placeholder="Select pay grade"
                  >
                    <option value="s1">S1</option>
                    <option value="s2">S2</option>
                    <option value="s3">S3</option>
                    <option value="s4">S4</option>
                    <option value="s5">S5</option>
                  </Select>
                </FormControl>

                {/* Pay Information */}
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Day Pay (LKR)</FormLabel>
                    <NumberInput
                      min={0}
                      precision={2}
                      value={formData.dayPay}
                      onChange={(valueAsString, valueAsNumber) => handleNumberChange('dayPay', valueAsString, valueAsNumber)}
                    >
                      <NumberInputField placeholder="Enter day pay amount" />
                    </NumberInput>
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>OT Pay Rate (LKR)</FormLabel>
                    <NumberInput
                      min={0}
                      precision={2}
                      value={formData.otPay}
                      onChange={(valueAsString, valueAsNumber) => handleNumberChange('otPay', valueAsString, valueAsNumber)}
                    >
                      <NumberInputField placeholder="Enter OT pay rate" />
                    </NumberInput>
                  </FormControl>
                </HStack>

                {/* Weekend Pay */}
                <FormControl>
                  <FormLabel>
                    Weekend Pay (LKR)
                  </FormLabel>
                  <NumberInput
                    min={0}
                    precision={2}
                    value={formData.weekendPay}
                    onChange={(valueAsString, valueAsNumber) => handleNumberChange('weekendPay', valueAsString, valueAsNumber)}
                    placeholder={formData.dayPay ? `Default: ${formData.dayPay}` : "Will default to Day Pay"}
                  >
                    <NumberInputField placeholder={formData.dayPay ? `Default: ${formData.dayPay}` : "Will default to Day Pay"} />
                  </NumberInput>
                </FormControl>

                {/* Status */}
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="isActive"
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isActive: e.target.value === 'true'
                    }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormControl>

                {/* Submit Buttons */}
                <HStack spacing={4} w="full" pt={4}>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loading}
                    loadingText="Creating..."
                    flex={1}
                  >
                    Create Labor
                  </Button>
                  <Link to="/register/labors">
                    <Button variant="outline" flex={1}>
                      Cancel
                    </Button>
                  </Link>
                </HStack>
              </VStack>
            </form>
          </Box>
        </VStack>
      </Container>
    );
  };

  export default AddLaborPage;