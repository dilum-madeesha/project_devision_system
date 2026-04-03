import {
    Container,
    VStack,
    Heading,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Badge,
    Box,
    Flex,
    HStack,
    useColorModeValue,
    Spinner,
    Alert,
    AlertIcon,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Divider,
    SimpleGrid,
    useToast,
    Input,
    IconButton,
    Select,
    Progress,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { projectAPI } from "../../../api/projects.js";
import { useAuth } from "../../../contexts/AuthContext";

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const bg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const bgContainer = useColorModeValue("gray.50", "gray.900");
    const tableHeaderBg = useColorModeValue("#FFF8F0", "gray.700");
    const headerBorderColor = useColorModeValue("orange.200", "orange.700");

    const recordsPerPage = 10;
    const toast = useToast();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const cancelRef = useRef();

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await projectAPI.getAll();
            let projectData = [];
            if (response?.data?.projects && Array.isArray(response.data.projects)) {
                projectData = response.data.projects;
            } else if (response?.data && Array.isArray(response.data)) {
                projectData = response.data;
            } else if (Array.isArray(response)) {
                projectData = response;
            }
            setProjects(projectData);
            setFilteredProjects(projectData);
        } catch (err) {
            console.error("Error fetching projects:", err);
            setError(err.message || "Failed to fetch projects");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        let filtered = [...projects];

        if (searchFilter) {
            const search = searchFilter.toLowerCase();
            filtered = filtered.filter(p =>
                p.projectId?.toLowerCase().includes(search) ||
                p.projectName?.toLowerCase().includes(search)
            );
        }

        if (statusFilter) {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        setFilteredProjects(filtered);
        setTotalPages(Math.ceil(filtered.length / recordsPerPage) || 1);
        setCurrentPage(1);
    }, [searchFilter, statusFilter, projects]);

    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    const handleViewProject = async (project) => {
        try {
            const response = await projectAPI.getById(project.id);
            setSelectedProject(response.data || response);
            onOpen();
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to load project details",
                status: "error",
                duration: 3000,
            });
        }
    };

    const handleDeleteClick = (project) => {
        setDeletingProject(project);
        onDeleteOpen();
    };

    const confirmDelete = async () => {
        if (!deletingProject) return;
        try {
            setDeleteLoading(true);
            await projectAPI.delete(deletingProject.id);
            toast({
                title: "Success",
                description: "Project deleted successfully",
                status: "success",
                duration: 3000,
            });
            fetchProjects();
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to delete project",
                status: "error",
                duration: 3000,
            });
        } finally {
            setDeleteLoading(false);
            onDeleteClose();
            setDeletingProject(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PLANNING': return 'blue';
            case 'IN_PROGRESS': return 'green';
            case 'ON_HOLD': return 'yellow';
            case 'COMPLETED': return 'purple';
            case 'CANCELLED': return 'red';
            default: return 'gray';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <Box minH="100vh" bg={bgContainer} display="flex" alignItems="center" justifyContent="center">
                <Spinner size="xl" color="orange.400" />
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg={bgContainer} py={8}>
            <Container maxW="container.xl">
                <VStack spacing={6} align="stretch">

                    {/* Breadcrumb */}
                    <HStack spacing={2} fontSize="sm" color="gray.500">
                        <Text
                            as={Link}
                            to="/projects"
                            color="yellow.500"
                            
                            
                        >
                            Projects
                        </Text>
                        <Text>/</Text>
                        <Text color="yellow.500" fontWeight="bold">Project List</Text>
                    </HStack>

                    {/* Page Header */}
                    <Flex justify="space-between" align="flex-start">
                        <Box>
                            
                            <Text color="gray.500" fontSize="sm" mt={1}>
                                Manage and track all your projects
                            </Text>
                        </Box>
                        <Link to="/createproject/collectProject/new">
                            <Button
                                leftIcon={<FiPlus />}
                                bg="yellow.400"
                                color="white"
                                _hover={{ bg: "yellow.500" }}
                                _active={{ bg: "yellow.600" }}
                                fontWeight="semibold"
                                px={5}
                                shadow="md"
                            >
                                Add New Project
                            </Button>
                        </Link>
                    </Flex>

                    {/* Filters */}
                    <HStack spacing={4}>
                        <Input
                            placeholder="Search Project ID or name..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            maxW="280px"
                            bg={bg}
                            borderColor={borderColor}
                            _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #ED8936" }}
                            fontSize="sm"
                        />
                        <Select
                            placeholder="All Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            maxW="180px"
                            bg={bg}
                            borderColor={borderColor}
                            _focus={{ borderColor: "yellow.400", boxShadow: "0 0 0 1px #ED8936" }}
                            fontSize="sm"
                        >
                            <option value="PLANNING">Planning</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </Select>
                        <Button
                            variant="outline"
                            borderColor={borderColor}
                            fontSize="sm"
                            bg="white"
                            onClick={() => { setSearchFilter(''); setStatusFilter(''); }}
                        >
                            Clear Filters
                        </Button>
                    </HStack>

                    {error && (
                        <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    {/* Table */}
                    <Box bg={bg} shadow="sm" borderRadius="lg" border="1px solid" borderColor={borderColor} overflow="hidden">
                        <TableContainer>
                            <Table variant="simple" size="sm">
                                <Thead>
                                    <Tr bg={tableHeaderBg} borderBottom="2px solid" borderColor={headerBorderColor}>
                                        <Th
                                            py={4}
                                            fontSize="xs"
                                            fontWeight="bold"
                                            letterSpacing="wider"
                                            color="gray.600"
                                            textTransform="uppercase"
                                        >
                                            Project ID
                                        </Th>
                                        <Th fontSize="xs" fontWeight="bold" letterSpacing="wider" color="gray.600" textTransform="uppercase">
                                            Project Name
                                        </Th>
                                        <Th fontSize="xs" fontWeight="bold" letterSpacing="wider" color="gray.600" textTransform="uppercase">
                                            Status
                                        </Th>
                                        <Th fontSize="xs" fontWeight="bold" letterSpacing="wider" color="gray.600" textTransform="uppercase">
                                            Progress
                                        </Th>
                                        <Th fontSize="xs" fontWeight="bold" letterSpacing="wider" color="gray.600" textTransform="uppercase">
                                            Start Date
                                        </Th>
                                        <Th fontSize="xs" fontWeight="bold" letterSpacing="wider" color="gray.600" textTransform="uppercase">
                                            End Date
                                        </Th>
                                        <Th fontSize="xs" fontWeight="bold" letterSpacing="wider" color="gray.600" textTransform="uppercase">
                                            Actions
                                        </Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {paginatedProjects.length === 0 ? (
                                        <Tr>
                                            <Td colSpan={7} textAlign="center" py={16}>
                                                <VStack spacing={3}>
                                                    <Text color="gray.400" fontWeight="semibold" fontSize="md">
                                                        No projects found
                                                    </Text>
                                                    <Text color="gray.400" fontSize="sm">
                                                        Start tracking your projects to see them here
                                                    </Text>
                                                    <Link to="/createproject/collectProject/new">
                                                        <Button
                                                            bg="yellow.400"
                                                            color="white"
                                                            _hover={{ bg: "yellow.500" }}
                                                            size="sm"
                                                            mt={2}
                                                        >
                                                            Add Your First Project
                                                        </Button>
                                                    </Link>
                                                </VStack>
                                            </Td>
                                        </Tr>
                                    ) : (
                                        paginatedProjects.map((project, idx) => (
                                            <Tr
                                                key={project.id}
                                                _hover={{ bg: "yellow.50" }}
                                                borderBottom="1px solid"
                                                borderColor={borderColor}
                                                bg={idx % 2 === 0 ? "white" : "gray.50"}
                                            >
                                                <Td fontWeight="semibold" color="gray.700" fontSize="sm" py={3}>
                                                    {project.projectId}
                                                </Td>
                                                <Td fontSize="sm" color="gray.700" py={3}>
                                                    {project.projectName}
                                                </Td>
                                                <Td py={3}>
                                                    <Badge
                                                        colorScheme={getStatusColor(project.status)}
                                                        borderRadius="full"
                                                        px={3}
                                                        py={0.5}
                                                        fontSize="xs"
                                                        fontWeight="medium"
                                                    >
                                                        {project.status?.replace('_', ' ')}
                                                    </Badge>
                                                </Td>
                                                <Td py={3}>
                                                    <HStack spacing={2}>
                                                        <Progress
                                                            value={project.completedPercent || 0}
                                                            size="sm"
                                                            colorScheme="yellow"
                                                            w="80px"
                                                            borderRadius="full"
                                                        />
                                                        <Text fontSize="xs" color="gray.600">
                                                            {project.completedPercent || 0}%
                                                        </Text>
                                                    </HStack>
                                                </Td>
                                                <Td fontSize="sm" color="gray.600" py={3}>
                                                    {formatDate(project.startDate)}
                                                </Td>
                                                <Td fontSize="sm" color="gray.600" py={3}>
                                                    {formatDate(project.endDate)}
                                                </Td>
                                                <Td py={3}>
                                                    <HStack spacing={1}>
                                                        <IconButton
                                                            icon={<FiEye />}
                                                            size="sm"
                                                            variant="ghost"
                                                            color="gray.500"
                                                            _hover={{ color: "blue.500", bg: "blue.50" }}
                                                            onClick={() => handleViewProject(project)}
                                                            aria-label="View"
                                                        />
                                                        <Link to={`/createproject/collectProject/edit/${project.id}`}>
                                                            <IconButton
                                                                icon={<FiEdit />}
                                                                size="sm"
                                                                variant="ghost"
                                                                color="gray.500"
                                                                _hover={{ color: "green.500", bg: "green.50" }}
                                                                aria-label="Edit"
                                                            />
                                                        </Link>
                                                        <IconButton
                                                            icon={<FiTrash2 />}
                                                            size="sm"
                                                            variant="ghost"
                                                            color="gray.500"
                                                            _hover={{ color: "red.500", bg: "red.50" }}
                                                            onClick={() => handleDeleteClick(project)}
                                                            aria-label="Delete"
                                                        />
                                                    </HStack>
                                                </Td>
                                            </Tr>
                                        ))
                                    )}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <HStack justify="center" spacing={2}>
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor="yellow.300"
                                color="yellow.500"
                                _hover={{ bg: "yellow.50" }}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                isDisabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Text fontSize="sm" color="gray.600">
                                Page {currentPage} of {totalPages}
                            </Text>
                            <Button
                                size="sm"
                                variant="outline"
                                borderColor="yellow.300"
                                color="yellow.500"
                                _hover={{ bg: "yellow.50" }}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                isDisabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </HStack>
                    )}
                </VStack>
            </Container>

            {/* View Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader
                        color="yellow.500"
                        borderBottom="1px solid"
                        borderColor="yellow.100"
                        fontWeight="bold"
                    >
                        Project Details
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={5}>
                        {selectedProject && (
                            <VStack align="stretch" spacing={4}>
                                <SimpleGrid columns={2} spacing={4}>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Project ID</Text>
                                        <Text fontWeight="semibold">{selectedProject.projectId}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Project Name</Text>
                                        <Text fontWeight="semibold">{selectedProject.projectName}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Status</Text>
                                        <Badge colorScheme={getStatusColor(selectedProject.status)} borderRadius="full" px={3}>
                                            {selectedProject.status?.replace('_', ' ')}
                                        </Badge>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Progress</Text>
                                        <HStack>
                                            <Progress
                                                value={selectedProject.completedPercent || 0}
                                                size="sm"
                                                colorScheme="yellow"
                                                w="100px"
                                                borderRadius="full"
                                            />
                                            <Text fontSize="sm">{selectedProject.completedPercent || 0}%</Text>
                                        </HStack>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Start Date</Text>
                                        <Text>{formatDate(selectedProject.startDate)}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>End Date</Text>
                                        <Text>{formatDate(selectedProject.endDate)}</Text>
                                    </Box>
                                </SimpleGrid>

                                <Divider />

                                {selectedProject.description && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Description</Text>
                                        <Text>{selectedProject.description}</Text>
                                    </Box>
                                )}

                                {selectedProject.agreement && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Agreement</Text>
                                        <Text>{selectedProject.agreement.agreementNo} - {selectedProject.agreement.projectName}</Text>
                                    </Box>
                                )}

                                {selectedProject.contractor && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={1}>Contractor</Text>
                                        <Text>{selectedProject.contractor.companyName}</Text>
                                        <Text fontSize="sm" color="gray.600">Reg No: {selectedProject.contractor.registrationNo}</Text>
                                        <Text fontSize="sm" color="gray.600">Phone: {selectedProject.contractor.phone}</Text>
                                    </Box>
                                )}

                                {selectedProject.officerAssignments?.length > 0 && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" fontSize="xs" textTransform="uppercase" mb={2}>Assigned Officers</Text>
                                        {selectedProject.officerAssignments.map((assignment, idx) => (
                                            <Badge key={idx} mr={2} mb={2} colorScheme="yellow" borderRadius="full" px={3}>
                                                {assignment.role}: {assignment.officer?.officerNo ? `${assignment.officer.officerNo} - ` : ""}{assignment.officer?.fullName}
                                            </Badge>
                                        ))}
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter borderTop="1px solid" borderColor="gray.100">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            borderColor="yellow.300"
                            color="yellow.500"
                            _hover={{ bg: "yellow.50" }}
                        >
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Delete Confirmation */}
            <AlertDialog
                isOpen={isDeleteOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDeleteClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader color="red.500" fontWeight="bold">
                            Delete Project
                        </AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete project "<strong>{deletingProject?.projectName}</strong>"? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteClose} variant="outline">
                                Cancel
                            </Button>
                            <Button
                                colorScheme="red"
                                onClick={confirmDelete}
                                ml={3}
                                isLoading={deleteLoading}
                            >
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export default ProjectList;