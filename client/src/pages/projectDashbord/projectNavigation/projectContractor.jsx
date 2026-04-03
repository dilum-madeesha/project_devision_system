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
    Input,
    InputGroup,
    InputLeftElement,
    Select,
} from "@chakra-ui/react";
import { FiBriefcase, FiPhone, FiMail, FiUsers, FiSearch } from "react-icons/fi";
import { contractorAPI } from "../../../api/contractors.js";

export default function ProjectContractor() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contractors, setContractors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [contractorFilter, setContractorFilter] = useState("All");
    const [projectFilter, setProjectFilter] = useState("All");

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

            const normalizedContractors = contractorsList.map((contractor) => ({
                ...contractor,
                projects: Array.isArray(contractor?.projects) ? contractor.projects : [],
                projectNames:
                    Array.from(
                        new Set(
                            (Array.isArray(contractor?.projects) ? contractor.projects : [])
                                .map((project) => project?.projectName)
                                .filter(Boolean)
                        )
                    ).join(", ") || "N/A",
            }));

            setContractors(normalizedContractors);
        } catch (err) {
            console.error("Error fetching contractors:", err);
            setError("Failed to load contractors");
        } finally {
            setLoading(false);
        }
    };

    const activeContractors = contractors.filter(c => c.isActive).length;
    const inactiveContractors = contractors.filter(c => !c.isActive).length;

    const contractorOptions = Array.from(
        new Set(contractors.map((contractor) => contractor.companyName).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const projectOptions = Array.from(
        new Set(
            contractors
                .flatMap((contractor) =>
                    (Array.isArray(contractor.projects) ? contractor.projects : [])
                        .map((project) => project?.projectName)
                        .filter(Boolean)
                )
        )
    ).sort((a, b) => a.localeCompare(b));

    const filteredContractors = contractors.filter((contractor) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            contractor.companyName?.toLowerCase().includes(term) ||
            contractor.projectNames?.toLowerCase().includes(term);

        const matchesContractor =
            contractorFilter === "All" || contractor.companyName === contractorFilter;

        const matchesProject =
            projectFilter === "All" ||
            (Array.isArray(contractor.projects)
                ? contractor.projects.some((project) => project?.projectName === projectFilter)
                : false);

        return matchesSearch && matchesContractor && matchesProject;
    });

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

            {/* Filters */}
            <Box bg="white" p={4} borderRadius="xl" borderWidth={1} borderColor="gray.100" mb={6}>
                <HStack spacing={4} flexWrap="wrap">
                    <InputGroup maxW="320px">
                        <InputLeftElement pointerEvents="none">
                            <FiSearch color="gray" />
                        </InputLeftElement>
                        <Input
                            id="projectContractorSearch"
                            name="projectContractorSearch"
                            placeholder="Search by contractor or project..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                    <Select
                        id="projectContractorNameFilter"
                        name="projectContractorNameFilter"
                        maxW="260px"
                        value={contractorFilter}
                        onChange={(e) => setContractorFilter(e.target.value)}
                    >
                        <option value="All">All Contractors</option>
                        {contractorOptions.map((contractorName) => (
                            <option key={contractorName} value={contractorName}>
                                {contractorName}
                            </option>
                        ))}
                    </Select>
                    <Select
                        id="projectContractorProjectFilter"
                        name="projectContractorProjectFilter"
                        maxW="260px"
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                    >
                        <option value="All">All Projects</option>
                        {projectOptions.map((projectName) => (
                            <option key={projectName} value={projectName}>
                                {projectName}
                            </option>
                        ))}
                    </Select>
                </HStack>
            </Box>

            {/* Contractors Table */}
            <Box bg="white" p={6} borderRadius="xl" borderWidth={1} borderColor="gray.100" overflowX="auto">
                <Heading size="md" mb={4}>👷 All Contractors</Heading>
                <Table variant="simple" size="sm">
                    <Thead bg="gray.50">
                        <Tr>
                            <Th>No</Th>
                            <Th>Company Name</Th>
                            <Th>Project Name</Th>
                            <Th>Contact Person</Th>
                            <Th>Reg No</Th>
                            <Th>Specialization</Th>
                            <Th>Phone</Th>
                            <Th>Email</Th>
                            <Th>Status</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredContractors.length > 0 ? (
                            filteredContractors.map((contractor, idx) => (
                                <Tr key={contractor.id} _hover={{ bg: "gray.50" }}>
                                    <Td>{idx + 1}</Td>
                                    <Td>{contractor.companyName}</Td>
                                    <Td>{contractor.projectNames}</Td>
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
                                <Td colSpan={10} textAlign="center" py={8}>
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