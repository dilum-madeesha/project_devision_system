import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { officerAPI } from "../../../api/officers.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";

import {
  Box,
  Stack,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Button,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
} from "@chakra-ui/react";

const AddOfficerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    officerNo: "",
    fullName: "",
    email: "",
    contactNumber: "",
    designation: "",
    division: "",
    qualification: "",
    status: true,
    experience: 0,
    createdById: user?.id,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (e) => {
    setFormData((prev) => ({ ...prev, status: e.target.value === "true" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      !formData.officerNo ||
      !formData.fullName ||
      !formData.email ||
      !formData.contactNumber ||
      !formData.designation ||
      !formData.division ||
      !formData.qualification
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        experience: parseInt(formData.experience) || 0,
        status: formData.status === true,
        createdById: user?.id || 1,
      };

      await officerAPI.create(submitData);
      navigate("/projectregister/officers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create officer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" p={4}>
      <Stack spacing={4}>

        {/* Breadcrumb */}
        <Breadcrumb fontSize="sm">
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/projectregister">
              Register
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/projectregister/officers">
              Officer List
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <Heading size="sm">New Officer</Heading>
          </BreadcrumbItem>
        </Breadcrumb>

        {/* Error */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Card */}
        <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>

              <FormControl isRequired>
                <FormLabel>EPF / Officer No</FormLabel>
                <Input
                  name="officerNo"
                  value={formData.officerNo}
                  onChange={handleChange}
                  placeholder="Enter EPF number"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </FormControl>

              <Flex gap={4} flexWrap="wrap">
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Contact Number</FormLabel>
                  <Input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                  />
                </FormControl>
              </Flex>

              <Flex gap={4} flexWrap="wrap">
                <FormControl isRequired>
                  <FormLabel>Designation</FormLabel>
                  <Select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                  >
                    <option value="">Select designation</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Technical Officer">Technical Officer</option>
                    <option value="Secretary">Secretary</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Division</FormLabel>
                  <Select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                  >
                    <option value="">Select division</option>
                    <option value="Project">Project</option>
                    <option value="Civil">Civil</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Administration">Administration</option>
                    <option value="Other">Other</option>
                  </Select>
                </FormControl>
              </Flex>

              <FormControl isRequired>
                <FormLabel>Qualification</FormLabel>
                <Select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                >
                  <option value="">Select qualification</option>
                  <option value="PhD">PhD</option>
                  <option value="Masters">Masters</option>
                  <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                  <option value="HND">HND</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Other">Other</option>
                </Select>
              </FormControl>

              <Flex gap={4} flexWrap="wrap">
                <FormControl>
                  <FormLabel>Experience (Years)</FormLabel>
                  <NumberInput
                    min={0}
                    value={formData.experience}
                    onChange={(value) =>
                      setFormData((prev) => ({ ...prev, experience: value }))
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={formData.status ? "true" : "false"}
                    onChange={handleStatusChange}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </FormControl>
              </Flex>

              <Flex gap={4}>
                <Button
                  colorScheme="blue"
                  type="submit"
                  isLoading={loading}
                  flex={1}
                >
                  Create Officer
                </Button>
                <Button
                  as={RouterLink}
                  to="/projectregister/officers"
                  variant="outline"
                  flex={1}
                >
                  Cancel
                </Button>
              </Flex>

            </Stack>
          </form>
        </Box>

      </Stack>
    </Box>
  );
};

export default AddOfficerPage;
