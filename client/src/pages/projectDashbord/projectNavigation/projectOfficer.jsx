import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  Heading,
  VStack,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Alert,
  AlertIcon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  HStack,
  Avatar,
  useColorModeValue,
} from "@chakra-ui/react";
import { Search, Users, UserCheck, Briefcase, Phone, Mail } from "lucide-react";
import { officerAPI } from "../../../api";

export default function ProjectOfficer() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDesignation, setFilterDesignation] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const cardBg = useColorModeValue("white", "gray.700");

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const response = await officerAPI.getAll();
      let officersList = [];
      if (response?.data?.officers && Array.isArray(response.data.officers)) {
        officersList = response.data.officers;
      } else if (response?.officers && Array.isArray(response.officers)) {
        officersList = response.officers;
      } else if (response?.data && Array.isArray(response.data)) {
        officersList = response.data;
      } else if (Array.isArray(response)) {
        officersList = response;
      }

      // Normalize fields used across screens so dashboard renders consistently.
      const normalizedOfficers = officersList.map((officer) => ({
        ...officer,
        name:
          officer.name ||
          officer.fullName ||
          `${officer.firstName || ""} ${officer.lastName || ""}`.trim() ||
          "N/A",
        phone: officer.phone || officer.contactNumber || "",
        status:
          typeof officer.status === "boolean"
            ? officer.status
            : officer.isActive ?? true,
      }));

      setOfficers(normalizedOfficers);
      setError(null);
    } catch (err) {
      console.error("Error fetching officers:", err);
      setError("Failed to load officers");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalOfficers = officers.length;
  const engineerCount = officers.filter(o => o.designation === "Engineer").length;
  const technicalOfficerCount = officers.filter(o => o.designation === "Technical Officer").length;
  const secretaryCount = officers.filter(o => o.designation === "Secretary").length;

  // Filter officers
  const filteredOfficers = officers.filter((officer) => {
    const matchesSearch =
      officer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDesignation =
      filterDesignation === "All" || officer.designation === filterDesignation;
    const matchesStatus =
      filterStatus === "All" || (filterStatus === "Active" ? officer.status === true : officer.status === false);
    return matchesSearch && matchesDesignation && matchesStatus;
  });

  const getDesignationColor = (designation) => {
    switch (designation) {
      case "Engineer":
        return "blue";
      case "Technical Officer":
        return "green";
      case "Secretary":
        return "purple";
      default:
        return "gray";
    }
  };

  const statsCards = [
    {
      icon: <Users size={24} />,
      title: "Total Officers",
      value: totalOfficers,
      color1: "#10b981",
      color2: "#059669",
    },
    {
      icon: <Briefcase size={24} />,
      title: "Engineers",
      value: engineerCount,
      color1: "#3b82f6",
      color2: "#06b6d4",
    },
    {
      icon: <UserCheck size={24} />,
      title: "Technical Officers",
      value: technicalOfficerCount,
      color1: "#a855f7",
      color2: "#ec4899",
    },
    {
      icon: <UserCheck size={24} />,
      title: "Secretaries",
      value: secretaryCount,
      color1: "#f97316",
      color2: "#fbbf24",
    },
  ];

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      {/* Header */}
      <Box mb={6}>
        <Heading size="lg" mb={2}>
          Project Officers
        </Heading>
        <Text color="gray.600">Manage and view all project officers</Text>
      </Box>

      {/* Statistics Cards */}
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
        gap={4}
        mb={6}
      >
        {statsCards.map((card, idx) => (
          <Box
            key={idx}
            bg={cardBg}
            rounded="2xl"
            p={6}
            shadow="md"
            border="1px"
            borderColor="gray.100"
          >
            <Flex align="center">
              <Box
                w={12}
                h={12}
                rounded="xl"
                bgGradient={`linear(to-br, ${card.color1}, ${card.color2})`}
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                mr={4}
              >
                {card.icon}
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="gray.600">
                  {card.title}
                </Text>
                <Heading size="lg">{card.value}</Heading>
              </VStack>
            </Flex>
          </Box>
        ))}
      </Grid>

      {/* Filters */}
      <Box bg={cardBg} rounded="xl" p={4} shadow="md" mb={6}>
        <HStack spacing={4} flexWrap="wrap">
          <InputGroup maxW="300px">
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search officers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select
            maxW="200px"
            value={filterDesignation}
            onChange={(e) => setFilterDesignation(e.target.value)}
          >
            <option value="All">All Designations</option>
            <option value="Engineer">Engineer</option>
            <option value="Technical Officer">Technical Officer</option>
            <option value="Secretary">Secretary</option>
          </Select>
          <Select
            maxW="200px"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </HStack>
      </Box>

      {/* Officers Table */}
      <Box bg={cardBg} rounded="xl" shadow="md" overflow="hidden">
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Officer Name</Th>
                <Th>Designation</Th>
                <Th>Email</Th>
                <Th>Contact No</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOfficers.length > 0 ? (
                filteredOfficers.map((officer, index) => (
                  <Tr key={officer.id || index} _hover={{ bg: "gray.50" }}>

                    {/* Officer Name */}
                    <Td>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={officer.name} />
                        <Text fontWeight="medium">{officer.name}</Text>
                      </HStack>
                    </Td>

                    {/* Designation */}
                    <Td>
                      <Badge colorScheme={getDesignationColor(officer.designation)}>
                        {officer.designation}
                      </Badge>
                    </Td>

                    {/* Email */}
                    <Td>
                      <HStack fontSize="sm" color="gray.600">
                        <Mail size={14} />
                        <Text>{officer.email || "N/A"}</Text>
                      </HStack>
                    </Td>

                    {/* Contact Number */}
                    <Td>
                      <HStack fontSize="sm" color="gray.600">
                        <Phone size={14} />
                        <Text>{officer.phone || "N/A"}</Text>
                      </HStack>
                    </Td>

                    {/* Status */}
                    <Td>
                      <Badge colorScheme={officer.status ? "green" : "red"}>
                        {officer.status ? "Active" : "Inactive"}
                      </Badge>
                    </Td>

                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={8}>
                    <Text color="gray.500">No officers found</Text>
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
}