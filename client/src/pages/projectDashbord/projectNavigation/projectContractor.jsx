import { useState, useEffect } from "react";
import {
    Box,
    Heading,
    Text,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    VStack,
    HStack,
    Spinner,
    Alert,
    AlertIcon,
    Flex,
    Icon,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
} from "@chakra-ui/react";
import { FiBriefcase, FiPhone, FiMail, FiMapPin, FiUsers } from "react-icons/fi";
import { contractorAPI } from "../../../api/contractors.js";

export default function ProjectContractor() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contractors, setContractors] = useState([]);

    useEffect(() => {
        fetchContractors();
    }, []);

    const fetchContractors = async () => {
        try {
            setLoading(true);
            const response = await contractorAPI.getAll();

            let contractorsList = [];
            if (response?.data?.contractors) contractorsList = response.data.contractors;
            else if (response?.data && Array.isArray(response.data)) contractorsList = response.data;
            else if (Array.isArray(response)) contractorsList = response;

            setContractors(contractorsList);
        } catch (err) {
            console.error("Error fetching contractors:", err);
            setError("Failed to load contractors");
        } finally {
            setLoading(false);
        }
    };

    const activeContractors = contractors.filter(c => c.isActive).length;
    const inactiveContractors = contractors.filter(c => !c.isActive).length;

    if (loading) {
        return (
            <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="300px">
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>Loading contractors...</Text>
                </VStack>
            </Box>
        );
    }

    return (
        <Box p={6} overflow="auto" bg="gray.50">
            {/* Header */}
            <Box mb={6}>
                <Heading size="lg">Contractor Details</Heading>
                <Text mt={2} color="gray.600">
                    List of all contractors assigned to projects
                </Text>
            </Box>

            {error && (
                <Alert status="error" mb={4} borderRadius="md">
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* Stats */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Box p={4} bg="blue.50" borderRadius="lg" borderWidth={1} borderColor="blue.200">
                    <Flex align="center" gap={3}>
                        <Icon as={FiUsers} boxSize={6} color="blue.600" />
                        <Box>
                            <Text fontSize="sm" color="gray.600">Total Contractors</Text>
                            <Heading size="lg" color="blue.600">{contractors.length}</Heading>
                        </Box>
                    </Flex>
                </Box>
                <Box p={4} bg="green.50" borderRadius="lg" borderWidth={1} borderColor="green.200">
                    <Flex align="center" gap={3}>
                        <Icon as={FiBriefcase} boxSize={6} color="green.600" />
                        <Box>
                            <Text fontSize="sm" color="gray.600">Active</Text>
                            <Heading size="lg" color="green.600">{activeContractors}</Heading>
                        </Box>
                    </Flex>
                </Box>
                <Box p={4} bg="red.50" borderRadius="lg" borderWidth={1} borderColor="red.200">
                    <Flex align="center" gap={3}>
                        <Icon as={FiBriefcase} boxSize={6} color="red.600" />
                        <Box>
                            <Text fontSize="sm" color="gray.600">Inactive</Text>
                            <Heading size="lg" color="red.600">{inactiveContractors}</Heading>
                        </Box>
                    </Flex>
                </Box>
            </SimpleGrid>

            {/* Contractors Table */}
            <Box bg="white" p={6} borderRadius="xl" borderWidth={1} borderColor="gray.100" overflowX="auto">
                <Heading size="md" mb={4}>👷 All Contractors</Heading>
                <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                        <Tr>
                            <Th>#</Th>
                            <Th>Company Name</Th>
                            <Th>Contact Person</Th>
                            <Th>Reg No</Th>
                            <Th>Specialization</Th>
                            <Th>Phone</Th>
                            <Th>Email</Th>
                            <Th>Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {contractors.length > 0 ? (
                            contractors.map((contractor, idx) => (
                                <Tr key={contractor.id} _hover={{ bg: "gray.50" }}>
                                    <Td>{idx + 1}</Td>
                                    <Td>{contractor.companyName}</Td>
                                    <Td>{contractor.contactPerson}</Td>
                                    <Td>{contractor.registrationNo}</Td>
                                    <Td>{contractor.specialization || "General"}</Td>
                                    <Td>
                                        <HStack spacing={1}>
                                            <FiPhone size={12} />
                                            <Text fontSize="sm">{contractor.phone}</Text>
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <HStack spacing={1}>
                                            <FiMail size={12} />
                                            <Text fontSize="sm">{contractor.email || "N/A"}</Text>
                                        </HStack>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={contractor.isActive ? "green" : "red"} borderRadius="full" px={2}>
                                            {contractor.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </Td>
                                </Tr>
                            ))
                        ) : (
                            <Tr>
                                <Td colSpan={9} textAlign="center" py={8}>
                                    <Text color="gray.500">No contractors found</Text>
                                </Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );
}