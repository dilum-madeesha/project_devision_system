import {
  Container,
  VStack,
  Heading,
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  HStack,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { jobAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";

const AddJobPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const [formData, setFormData] = useState({
    jobNumber: "",
    title: "",
    description: "",
    status: "NOT_STARTED",
    startDate: "",
    endDate: "",
    reqDepartment: "",
    reqDate: "",
    projectCode: "",
    budgetAllocation: "",
    assignOfficer: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.jobNumber || !formData.title || !formData.status ||
          !formData.startDate || !formData.reqDepartment || !formData.reqDate ||
          !formData.projectCode || !formData.assignOfficer) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }
      
      // Format dates properly for the API
      const formatDate = (dateString) => {
        if (!dateString) return null;
        // Create a date object and format in ISO string
        return new Date(dateString).toISOString();
      };
      
      const submitData = {
        ...formData,
        startDate: formatDate(formData.startDate),
        endDate: formData.endDate ? formatDate(formData.endDate) : null,
        reqDate: formatDate(formData.reqDate),
        budgetAllocation: formData.budgetAllocation ? parseFloat(formData.budgetAllocation) : null,
        createdById: user?.id || 1, // Use logged in user ID or fallback to 1
      };
      
      // Log the data being sent for debugging
      console.log("Submitting job data:", submitData);
      
      const response = await jobAPI.create(submitData);
      console.log("Job creation response:", response);
      
      toast({
        title: "Success",
        description: "Job created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/register/jobs");
    } catch (err) {
      console.error("Error creating job:", err.response?.data || err);
      setError(err.response?.data?.message || "Failed to create job");
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
          <BreadcrumbLink as={Link} to="/register/jobs" color="blue.500">
            Job List
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color="green.500" fontWeight="bold" fontSize="x-large">
            New Job
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
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Job Number</FormLabel>
                  <Input
                    name="jobNumber"
                    value={formData.jobNumber}
                    onChange={handleChange}
                    placeholder="Enter job number"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Budget Code</FormLabel>
                  <Input
                    name="projectCode"
                    value={formData.projectCode}
                    onChange={handleChange}
                    placeholder="Enter budget code"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Budget Allocation</FormLabel>
                  <Input
                    name="budgetAllocation"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.budgetAllocation}
                    onChange={handleChange}
                    placeholder="Enter allocated budget"
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Job Title</FormLabel>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter job title"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter job description"
                  rows={3}
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Requesting Division</FormLabel>
                  {/* <Input
                    name="reqDepartment"
                    value={formData.reqDepartment}
                    onChange={handleChange}
                    placeholder="Enter department"
                  /> */}
                  <Select
                    name="reqDepartment"
                    value={formData.reqDepartment}
                    onChange={handleChange}
                    placeholder="Select division"
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
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Assign Officer</FormLabel>
                  <Input
                    name="assignOfficer"
                    value={formData.assignOfficer}
                    onChange={handleChange}
                    placeholder="Enter officer name"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Request Date</FormLabel>
                  <Input
                    name="reqDate"
                    type="date"
                    value={formData.reqDate}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </Select>
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full" pt={4}>
                <Button
                  type="submit"
                  colorScheme="green"
                  isLoading={loading}
                  loadingText="Creating..."
                  flex={1}
                >
                  Create Job
                </Button>
                <Link to="/register/jobs">
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

export default AddJobPage;