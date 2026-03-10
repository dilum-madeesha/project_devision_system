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
  SimpleGrid,
  Alert,
  AlertIcon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
  Stack,
} from "@chakra-ui/react";
import { contractorAPI } from "../../../api/contractors.js";

export default function AddContractor() {
  const navigate = useNavigate();

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

      setTimeout(() => {
        navigate("/projectregister/contractors");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add contractor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="5xl" mx="auto" py={4}>
      {/* Breadcrumb */}
      <Breadcrumb mb={4}>
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

      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="lg" p={6}>
        <Heading size="md" mb={6}>
          Add Contractor
        </Heading>

        <form onSubmit={handleSubmit}>
          <Stack spacing={6}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Company Name</FormLabel>
                <Input name="companyName" value={formData.companyName} onChange={handleChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Register Number</FormLabel>
                <Input name="registrationNo" value={formData.registrationNo} onChange={handleChange} />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Contact Number</FormLabel>
                <Input name="phone" value={formData.phone} onChange={handleChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Company Email</FormLabel>
                <Input name="email" value={formData.email} onChange={handleChange} />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Company Address</FormLabel>
                <Input name="address" value={formData.address} onChange={handleChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Person in Charge</FormLabel>
                <Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Specialization</FormLabel>
                <Input name="specialization" value={formData.specialization} onChange={handleChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Experience Years</FormLabel>
                <Input name="experienceYears" value={formData.experienceYears} onChange={handleChange} />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <FormControl>
                <FormLabel>Branches</FormLabel>
                <Input name="branches" value={formData.branches} onChange={handleChange} />
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select name="status" value={formData.status} onChange={handleChange}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea name="description" value={formData.description} onChange={handleChange} />
            </FormControl>

            <SimpleGrid columns={2} spacing={4}>
              <Button colorScheme="purple" type="submit" isLoading={loading}>
                Add Contractor
              </Button>
              <Button variant="outline" onClick={() => navigate("/projectregister/contractors")}>
                Cancel
              </Button>
            </SimpleGrid>
          </Stack>
        </form>
      </Box>
    </Box>
  );
}
