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
    Stat,
    StatLabel,
    StatNumber,
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
import { FiPlus, FiEye, FiEdit, FiTrash2, FiSearch } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { projectAPI } from "../../../api/projects.js";
import { useAuth } from "../../../contexts/AuthContext";

const ProjectList = () => {
    // Hoist all hooks to the top - they must be called unconditionally
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
    
    // All color mode values must be called unconditionally at the top level
    const bg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const bgContainer = useColorModeValue("gray.50", "gray.900");
    const tableHeaderBg = useColorModeValue("gray.50", "gray.700");
    
    const recordsPerPage = 10;
    const { user } = useAuth();
    const toast = useToast();

    // View modal state
    const { isOpen, onOpen, onClose } = useDisclosure();
    
    // Delete confirmation state
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const cancelRef = useRef();

    // Fetch projects
    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await projectAPI.getAll();
            // Handle response format: { success: true, data: { projects: [] } }
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

    // Apply filters
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

    // Pagination
    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    // View project details
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

    // Delete project
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

    // Status badge color
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

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <Box minH="100vh" bg={bgContainer} display="flex" alignItems="center" justifyContent="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    return (
        <Box minH="100vh" bg={bgContainer} py={8}>
            <Container maxW="container.xl">
                <VStack spacing={6} align="stretch">
                    {/* Header */}
                    <Flex justify="space-between" align="center">
                        <Heading size="lg">Projects</Heading>
                        <Link to="/createproject/collectProject/new">
                            <Button leftIcon={<FiPlus />} colorScheme="blue">
                                Create Project
                            </Button>
                        </Link>
                    </Flex>

                    {/* Stats
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Stat bg={bg} p={4} borderRadius="md" shadow="sm">
                            <StatLabel>Total Projects</StatLabel>
                            <StatNumber>{projects.length}</StatNumber>
                        </Stat>
                        <Stat bg={bg} p={4} borderRadius="md" shadow="sm">
                            <StatLabel>In Progress</StatLabel>
                            <StatNumber>{projects.filter(p => p.status === 'IN_PROGRESS').length}</StatNumber>
                        </Stat>
                        <Stat bg={bg} p={4} borderRadius="md" shadow="sm">
                            <StatLabel>Completed</StatLabel>
                            <StatNumber>{projects.filter(p => p.status === 'COMPLETED').length}</StatNumber>
                        </Stat>
                        <Stat bg={bg} p={4} borderRadius="md" shadow="sm">
                            <StatLabel>On Hold</StatLabel>
                            <StatNumber>{projects.filter(p => p.status === 'ON_HOLD').length}</StatNumber>
                        </Stat>
                    </SimpleGrid> */}

                    {/* Filters */}
                    <HStack spacing={4} bg={bg} p={4} borderRadius="md" shadow="sm">
                        <Input
                            placeholder="Search by ID or name..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            maxW="300px"
                        />
                        <Select
                            placeholder="All Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            maxW="200px"
                        >
                            <option value="PLANNING">Planning</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="ON_HOLD">On Hold</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => { setSearchFilter(''); setStatusFilter(''); }}
                        >
                            Clear Filters
                        </Button>
                    </HStack>

                    {error && (
                        <Alert status="error">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    {/* Table */}
                    <Box bg={bg} shadow="md" borderRadius="lg" overflow="hidden">
                        <TableContainer>
                            <Table variant="simple">
                                <Thead bg={tableHeaderBg}>
                                    <Tr>
                                        <Th>Project ID</Th>
                                        <Th>Project Name</Th>
                                        <Th>Status</Th>
                                        <Th>Progress</Th>
                                        <Th>Start Date</Th>
                                        <Th>End Date</Th>
                                        <Th>Actions</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {paginatedProjects.length === 0 ? (
                                        <Tr>
                                            <Td colSpan={7} textAlign="center" py={8}>
                                                <Text color="gray.500">No projects found</Text>
                                            </Td>
                                        </Tr>
                                    ) : (
                                        paginatedProjects.map((project) => (
                                            <Tr key={project.id}>
                                                <Td fontWeight="bold">{project.projectId}</Td>
                                                <Td>{project.projectName}</Td>
                                                <Td>
                                                    <Badge colorScheme={getStatusColor(project.status)}>
                                                        {project.status?.replace('_', ' ')}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <Progress 
                                                            value={project.completedPercent || 0} 
                                                            size="sm" 
                                                            colorScheme="green"
                                                            w="100px"
                                                            borderRadius="full"
                                                        />
                                                        <Text fontSize="sm">{project.completedPercent || 0}%</Text>
                                                    </HStack>
                                                </Td>
                                                <Td>{formatDate(project.startDate)}</Td>
                                                <Td>{formatDate(project.endDate)}</Td>
                                                <Td>
                                                    <HStack spacing={2}>
                                                        <IconButton
                                                            icon={<FiEye />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="blue"
                                                            onClick={() => handleViewProject(project)}
                                                            aria-label="View"
                                                        />
                                                        <Link to={`/createproject/collectProject/edit/${project.id}`}>
                                                            <IconButton
                                                                icon={<FiEdit />}
                                                                size="sm"
                                                                variant="ghost"
                                                                colorScheme="green"
                                                                aria-label="Edit"
                                                            />
                                                        </Link>
                                                        <IconButton
                                                            icon={<FiTrash2 />}
                                                            size="sm"
                                                            variant="ghost"
                                                            colorScheme="red"
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
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                isDisabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Text>Page {currentPage} of {totalPages}</Text>
                            <Button
                                size="sm"
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
                    <ModalHeader>Project Details</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedProject && (
                            <VStack align="stretch" spacing={4}>
                                <SimpleGrid columns={2} spacing={4}>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Project ID</Text>
                                        <Text>{selectedProject.projectId}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Project Name</Text>
                                        <Text>{selectedProject.projectName}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Status</Text>
                                        <Badge colorScheme={getStatusColor(selectedProject.status)}>
                                            {selectedProject.status?.replace('_', ' ')}
                                        </Badge>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Progress</Text>
                                        <HStack>
                                            <Progress 
                                                value={selectedProject.completedPercent || 0} 
                                                size="sm" 
                                                colorScheme="green"
                                                w="100px"
                                                borderRadius="full"
                                            />
                                            <Text>{selectedProject.completedPercent || 0}%</Text>
                                        </HStack>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Start Date</Text>
                                        <Text>{formatDate(selectedProject.startDate)}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">End Date</Text>
                                        <Text>{formatDate(selectedProject.endDate)}</Text>
                                    </Box>
                                </SimpleGrid>
                                
                                <Divider />
                                
                                {selectedProject.description && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Description</Text>
                                        <Text>{selectedProject.description}</Text>
                                    </Box>
                                )}
                                
                                {selectedProject.agreement && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Agreement</Text>
                                        <Text>{selectedProject.agreement.agreementNo} - {selectedProject.agreement.projectName}</Text>
                                    </Box>
                                )}
                                
                                {selectedProject.contractor && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500">Contractor</Text>
                                        <Text>{selectedProject.contractor.companyNo} - {selectedProject.contractor.companyName}</Text>
                                        <Text fontSize="sm" color="gray.600">Reg No: {selectedProject.contractor.registrationNo}</Text>
                                        <Text fontSize="sm" color="gray.600">Phone: {selectedProject.contractor.phone}</Text>
                                    </Box>
                                )}
                                
                                {selectedProject.officerAssignments?.length > 0 && (
                                    <Box>
                                        <Text fontWeight="bold" color="gray.500" mb={2}>Assigned Officers</Text>
                                        {selectedProject.officerAssignments.map((assignment, idx) => (
                                            <Badge key={idx} mr={2} mb={2} colorScheme="blue">
                                                {assignment.role}: {assignment.officer?.officerNo ? `${assignment.officer.officerNo} - ` : ""}{assignment.officer?.fullName}
                                            </Badge>
                                        ))}
                                    </Box>
                                )}
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Close</Button>
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
                        <AlertDialogHeader>Delete Project</AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete project "{deletingProject?.projectName}"? This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteClose}>
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
