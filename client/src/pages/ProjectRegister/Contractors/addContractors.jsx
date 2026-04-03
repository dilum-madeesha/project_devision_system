import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
  Stack,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { contractorAPI } from "../../../api/contractors.js";

export default function AddContractor() {
  const navigate = useNavigate();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("#ede9fe", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");

  const [formData, setFormData] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    registrationNo: "",
    specialization: "",
    experienceYears: "",
    branches: "",
    status: "ACTIVE",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.companyName || !formData.contactPerson || !formData.phone || !formData.registrationNo) {
      setError("Please fill required fields: Person in Charge, Contact Number, Register Number");
      setLoading(false);
      return;
    }

    try {
      await contractorAPI.createContractor({
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        registrationNo: formData.registrationNo,
        isActive: formData.status === "ACTIVE",
        specialization: formData.specialization || null,
        experienceYears: formData.experienceYears ? Number(formData.experienceYears) : null,
        branches: formData.branches || null,
        description: formData.description || null,
      });

      setSuccess("Contractor added successfully!");

      setFormData({
        companyName: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        registrationNo: "",
        specialization: "",
        experienceYears: "",
        branches: "",
        status: "ACTIVE",
        description: "",
      });

      navigate("/projectregister/contractors");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add contractor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="5xl" mx="auto" py={4}>
      {/* Breadcrumb */}
      <Breadcrumb mb={4}  color="purple.600">
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/projectregister">
            Register
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/projectregister/contractors">
            Contractors
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink fontWeight="bold" color="purple.600">
            New Contractor
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {success && (
        <Alert status="success" mb={4}>
          <AlertIcon />
          {success}
        </Alert>
      )}

      <Box bg={bg} border="1px solid" borderColor={borderColor} borderRadius="lg" boxShadow="md">
        {/* Card Header */}
        {/* <Box bg={headerBg} p={6} borderBottom="1px solid" borderColor={borderColor} borderTopRadius="lg">
          <Heading size="md" color="purple.600" fontWeight="bold">
            Add Contractor
          </Heading>
        </Box> */}

        {/* Card Body */}
        <Box p={6}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={6}>
            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input name="companyName" value={formData.companyName} placeholder="Enter company name" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Register Number</FormLabel>
                  <Input name="registrationNo" value={formData.registrationNo} placeholder="Enter registration number" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>
            </Grid>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Contact Number</FormLabel>
                  <Input name="phone" value={formData.phone} placeholder="Enter contact number" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Company Email</FormLabel>
                  <Input name="email" value={formData.email} placeholder="Enter company email" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>
            </Grid>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <FormControl>
                  <FormLabel>Company Address</FormLabel>
                  <Input name="address" value={formData.address} placeholder="Enter company address" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Person in Charge</FormLabel>
                  <Input name="contactPerson" value={formData.contactPerson} placeholder="Enter person in charge" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>
            </Grid>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <FormControl>
                  <FormLabel>Specialization</FormLabel>
                  <Input name="specialization" value={formData.specialization} placeholder="Enter specialization" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Experience Years</FormLabel>
                  <Input name="experienceYears" value={formData.experienceYears} placeholder="Enter experience years" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>
            </Grid>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
              <GridItem>
                <FormControl>
                  <FormLabel>Branches</FormLabel>
                  <Input name="branches" value={formData.branches} placeholder="Enter branches" onChange={handleChange} borderColor={borderColor} />
                </FormControl>
              </GridItem>

              <GridItem>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select name="status" value={formData.status} onChange={handleChange} borderColor={borderColor}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea name="description" value={formData.description} placeholder="Enter description" onChange={handleChange} borderColor={borderColor} />
            </FormControl>

            <Flex gap={4}>
              <Button colorScheme="purple" type="submit" isLoading={loading} flex={1}>
                Add Contractor
              </Button>
              <Button variant="outline" onClick={() => navigate("/projectregister/contractors")} flex={1}>
                Cancel
              </Button>
            </Flex>
          </Stack>
        </form>
        </Box>
      </Box>
    </Box>
  );
}
