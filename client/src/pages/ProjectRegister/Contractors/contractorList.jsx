import {
    Box,
    Flex,
    Text,
    Button,
    Input,
    Select,
    Table,
    TableContainer,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    IconButton,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalCloseButton,
    Textarea,
    VStack,
    Container,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Heading,
    Alert,
    AlertIcon,
    FormControl,
    FormLabel,
    useToast,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useState, useEffect } from "react";
import { contractorAPI } from "../../../api/contractors.js";
import { useAuth } from "../../../contexts/AuthContext";

export default function ContractorListPage() {
    const [contractors, setContractors] = useState([]);
    const [filteredContractors, setFilteredContractors] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [editingContractor, setEditingContractor] = useState(null);
    const [editFormData, setEditFormData] = useState({
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
    const [editLoading, setEditLoading] = useState(false);
    const toast = useToast();

    const { user } = useAuth();
    const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

    // Fetch contractors
    useEffect(() => {
        fetchContractors();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, statusFilter, contractors]);

    const fetchContractors = async () => {
        try {
            setLoading(true);
            const response = await contractorAPI.getAllContractors({ limit: 100 });
            const list = response.data?.contractors || response.data || [];
            setContractors(list);
        } catch (err) {
            setError("Failed to load contractors");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...contractors];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (c) =>
                    c.companyName?.toLowerCase().includes(s) ||
                    c.contactPerson?.toLowerCase().includes(s) ||
                    c.email?.toLowerCase().includes(s) ||
                    c.phone?.toLowerCase().includes(s)
            );
        }
        if (statusFilter) {
            const isActive = statusFilter === "active";
            filtered = filtered.filter((c) => c.isActive === isActive);
        }
        setFilteredContractors(filtered);
        setCurrentPage(1);
    };

    const paginatedContractors = filteredContractors.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );
    const totalPages = Math.ceil(filteredContractors.length / recordsPerPage);

    const handleEdit = (contractor) => {
        setEditingContractor(contractor);
        setEditFormData({
            companyName: contractor.companyName || "",
            contactPerson: contractor.contactPerson || "",
            phone: contractor.phone || "",
            email: contractor.email || "",
            address: contractor.address || "",
            registrationNo: contractor.registrationNo || "",
            specialization: contractor.specialization || "",
            experienceYears: contractor.experienceYears || "",
            branches: contractor.branches || "",
            status: contractor.isActive ? "ACTIVE" : "INACTIVE",
            description: contractor.description || "",
        });
    };

    const handleEditSubmit = async () => {
        setEditLoading(true);
        try {
            const updateData = {
                companyName: editFormData.companyName,
                contactPerson: editFormData.contactPerson,
                phone: editFormData.phone,
                email: editFormData.email || null,
                address: editFormData.address || null,
                registrationNo: editFormData.registrationNo,
                specialization: editFormData.specialization || null,
                experienceYears: editFormData.experienceYears ? parseInt(editFormData.experienceYears) : null,
                branches: editFormData.branches || null,
                description: editFormData.description || null,
                isActive: editFormData.status === "ACTIVE",
            };
            await contractorAPI.updateContractor(editingContractor.id, updateData);
            toast({
                title: "Success",
                description: "Contractor updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            fetchContractors();
            setEditingContractor(null);
        } catch (error) {
            console.error("Update failed:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update contractor",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete contractor?")) return;
        try {
            await contractorAPI.deleteContractor(id);
            fetchContractors();
        } catch {
            console.error("Delete failed");
        }
    };

    return (
        <Container maxW="1300px" py={2}>
            <VStack spacing={2} align="stretch">
                {/* Breadcrumb */}
                <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
                    <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/projectregister" color="orange.500">
                            Register
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink color="orange.500" fontWeight="bold" fontSize="medium">
                            Contractors
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>

                {/* Header */}
                <Flex justify="space-between" mb={4}>
                    <Box>
                        <Text color="gray.600" fontSize="x-large">Contractors List</Text>
                    </Box>
                    <Link to="/projectRegister/contractors/add">
                        <Button leftIcon={<FiPlus />} colorScheme="orange">
                            Add Contractor
                        </Button>
                    </Link>
                </Flex>

                {/* Error */}
                {/* {error && (
                    <Box p={4} borderWidth="1px" borderColor="red.300" bg="red.50" borderRadius="md">
                        <Text color="red.700" fontWeight="bold">Error Loading Contractors</Text>
                        <Text>{error}</Text>
                        <Button mt={2} size="sm" onClick={fetchContractors}>Try Again</Button>
                    </Box>
                )} */}
                {error && (
                                    <Alert status="error">
                                        <AlertIcon />
                                        {error}
                                    </Alert>
                                )}

                {/* Filters */}
                <Flex mb={4} gap={3} flexWrap="wrap">
                    <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        maxW="300px"
                    />
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        maxW="150px"
                    >
                        <option value="">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                    {(searchTerm || statusFilter) && (
                        <Button size="sm" variant="ghost" onClick={() => { setSearchTerm(""); setStatusFilter(""); }}>
                            Clear
                        </Button>
                    )}
                </Flex>

                {/* Table */}
                <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
                    <TableContainer>
                        <Table variant="simple" size="sm">
                            <Thead bg="orange.50">
                                <Tr>
                                    <Th>Company</Th>
                                    <Th>Contact</Th>
                                    <Th>Email</Th>
                                    <Th>Phone</Th>
                                    <Th>Register No</Th>
                                    <Th>Specialization</Th>
                                    <Th>Experience</Th>
                                    <Th>Branches</Th>
                                    <Th>Status</Th>
                                    <Th>Description</Th>
                                    {canEdit && <Th>Actions</Th>}
                                </Tr>
                            </Thead>
                            <Tbody>
                                {paginatedContractors.map((c) => (
                                    <Tr key={c.id}>
                                        <Td>{c.companyName}</Td>
                                        <Td>{c.contactPerson}</Td>
                                        <Td color="orange.500">{c.email}</Td>
                                        <Td>{c.phone}</Td>
                                        <Td>{c.registrationNo}</Td>
                                        <Td>{c.specialization}</Td>
                                        <Td>{c.experienceYears}</Td>
                                        <Td>{c.branches}</Td>
                                        <Td>
                                            <Badge colorScheme={c.isActive ? "green" : "red"}>
                                                {c.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </Td>
                                        <Td>{c.description}</Td>
                                        {canEdit && (
                                            <Td>
                                                <IconButton icon={<FiEdit2 />} mr={2} onClick={() => handleEdit(c)} />
                                                <IconButton icon={<FiTrash2 />} colorScheme="red" onClick={() => handleDelete(c.id)} />
                                            </Td>
                                        )}
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Empty state */}
                {Array.isArray(contractors) && contractors.length === 0 && !loading && (
                    <Box textAlign="center" py={8}>
                        <Heading size="md" color="gray.500" mb={4}>
                            {searchTerm || statusFilter
                                ? "No contractors match your search criteria"
                                : "No contractors have been registered yet"}
                        </Heading>
                        {searchTerm || statusFilter ? (
                <Text color="gray.500">
                  No contractors match your search criteria. Try
                  adjusting your filters or search terms.
                </Text>
              ) : (
                <>
                  <Text color="gray.500" mb={4}>
                    No contractors have been registered yet.
                  </Text>
                  {canEdit && (
                    <Link to="/projectregister/contractors/add">
                      <Button colorScheme="orange">
                        Add Your First Contractor
                      </Button>
                    </Link>
                  )}
                </>
              )}
                    </Box>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <Flex justify="center" mt={4} gap={3}>
                        <Button onClick={() => setCurrentPage(p => p - 1)} isDisabled={currentPage === 1}>Previous</Button>
                        <Text alignSelf="center">Page {currentPage} of {totalPages}</Text>
                        <Button onClick={() => setCurrentPage(p => p + 1)} isDisabled={currentPage === totalPages}>Next</Button>
                    </Flex>
                )}

                {/* Edit Modal */}
                <Modal isOpen={!!editingContractor} onClose={() => setEditingContractor(null)} size="lg">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Edit Contractor</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl>
                                    <FormLabel>Company Name</FormLabel>
                                    <Input
                                        placeholder="Company Name"
                                        value={editFormData.companyName}
                                        onChange={(e) => setEditFormData(p => ({ ...p, companyName: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Contact Person</FormLabel>
                                    <Input
                                        placeholder="Contact Person"
                                        value={editFormData.contactPerson}
                                        onChange={(e) => setEditFormData(p => ({ ...p, contactPerson: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Email</FormLabel>
                                    <Input
                                        type="email"
                                        placeholder="Email"
                                        value={editFormData.email}
                                        onChange={(e) => setEditFormData(p => ({ ...p, email: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Phone</FormLabel>
                                    <Input
                                        placeholder="Phone"
                                        value={editFormData.phone}
                                        onChange={(e) => setEditFormData(p => ({ ...p, phone: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Address</FormLabel>
                                    <Input
                                        placeholder="Address"
                                        value={editFormData.address}
                                        onChange={(e) => setEditFormData(p => ({ ...p, address: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Registration No</FormLabel>
                                    <Input
                                        placeholder="Registration No"
                                        value={editFormData.registrationNo}
                                        onChange={(e) => setEditFormData(p => ({ ...p, registrationNo: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Specialization</FormLabel>
                                    <Input
                                        placeholder="Specialization"
                                        value={editFormData.specialization}
                                        onChange={(e) => setEditFormData(p => ({ ...p, specialization: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Experience (Years)</FormLabel>
                                    <Input
                                        type="number"
                                        placeholder="Experience Years"
                                        value={editFormData.experienceYears}
                                        onChange={(e) => setEditFormData(p => ({ ...p, experienceYears: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Branches</FormLabel>
                                    <Input
                                        placeholder="Branches"
                                        value={editFormData.branches}
                                        onChange={(e) => setEditFormData(p => ({ ...p, branches: e.target.value }))}
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData(p => ({ ...p, status: e.target.value }))}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Description</FormLabel>
                                    <Textarea
                                        placeholder="Description"
                                        value={editFormData.description}
                                        onChange={(e) => setEditFormData(p => ({ ...p, description: e.target.value }))}
                                    />
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button mr={3} onClick={() => setEditingContractor(null)}>Cancel</Button>
                            <Button colorScheme="orange" onClick={handleEditSubmit} isLoading={editLoading}>Save</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Container>
    );
}
