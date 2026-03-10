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
    HStack,
    Spinner,
    Alert,
    AlertIcon,
    IconButton,
    Tooltip,
    useToast,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Select,
    Switch,
    Text,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    useDisclosure,
} from "@chakra-ui/react";

import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import { officerAPI } from "../../../api/officers.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";



const OfficerListPage = () => {
    const [officers, setOfficers] = useState([]);
    const [allOfficers, setAllOfficers] = useState([]);
    const [filteredOfficers, setFilteredOfficers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
const recordsPerPage = 8;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [editingOfficer, setEditingOfficer] = useState(null);
    const [editFormData, setEditFormData] = useState({
        officerNo: "",
        fullName: "",
        email: "",
        contactNumber: "",
        designation: "",
        division: "",
        qualification: "",
        status: true,
        experience: 0,
    });
    const [editLoading, setEditLoading] = useState(false);

    const toast = useToast();
    const { user } = useAuth();
    const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

    useEffect(() => {
        fetchOfficers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, statusFilter, allOfficers]);

    const fetchOfficers = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await officerAPI.getAll();

            let data = [];
            if (res && Array.isArray(res)) {
                data = res;
            } else if (res?.data && Array.isArray(res.data)) {
                data = res.data;
            } else if (res?.data?.officers && Array.isArray(res.data.officers)) {
                data = res.data.officers;
            } else if (res?.officers && Array.isArray(res.officers)) {
                data = res.officers;
            }

            setAllOfficers(data);
            setFilteredOfficers(data);
            const newTotalPages = Math.ceil(data.length / recordsPerPage) || 1;
            setTotalPages(newTotalPages);
            setCurrentPage(1);
            setOfficers(data.slice(0, recordsPerPage));
        } catch (err) {
            setError("Failed to fetch officers");
            setOfficers([]);
            setAllOfficers([]);
            setFilteredOfficers([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allOfficers];

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter((o) => {
                const fullName =
                    o.fullName ||
                    `${o.firstName || ""} ${o.lastName || ""}`.trim();
                return (
                    (o.officerNo || "").toLowerCase().includes(s) ||
                    (fullName || "").toLowerCase().includes(s) ||
                    (o.email || "").toLowerCase().includes(s) ||
                    (o.contactNumber || "").toLowerCase().includes(s) ||
                    (o.designation || "").toLowerCase().includes(s) ||
                    (o.division || "").toLowerCase().includes(s)
                );
            });
        }

        if (statusFilter) {
            const active = statusFilter === "active";
            filtered = filtered.filter((o) => {
                const statusValue =
                    typeof o.status === "boolean" ? o.status : o.isActive;
                return statusValue === active;
            });
        }

        setFilteredOfficers(filtered);

        const newTotalPages = Math.ceil(filtered.length / recordsPerPage) || 1;
        setTotalPages(newTotalPages);
        setCurrentPage(1);
        setOfficers(filtered.slice(0, recordsPerPage));
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;

        const dataToUse =
            filteredOfficers.length > 0 ? filteredOfficers : allOfficers;

        setCurrentPage(newPage);
        const startIndex = (newPage - 1) * recordsPerPage;
        const endIndex = Math.min(startIndex + recordsPerPage, dataToUse.length);

        setOfficers(dataToUse.slice(startIndex, endIndex));
    };

    const handleEditOfficer = (officer) => {
        setEditingOfficer(officer);
        setEditFormData({
            officerNo: officer.officerNo || "",
        fullName:
                officer.fullName ||
                `${officer.firstName || ""} ${officer.lastName || ""}`.trim(),
            email: officer.email || "",
            contactNumber: officer.contactNumber || "",
            designation: officer.designation || "",
            division: officer.division || "",
            qualification: officer.qualification || "",
            status:
                typeof officer.status === "boolean"
                    ? officer.status
                    : officer.isActive ?? true,
            experience: officer.experience ?? 0,
        });
        onOpen();
    };

    const handleEditSubmit = async () => {
        if (!editingOfficer) return;

        setEditLoading(true);
        try {
            await officerAPI.update(editingOfficer.id, editFormData);
            toast({ title: "Officer updated successfully", status: "success" });
            await fetchOfficers();
            onClose();
            setEditingOfficer(null);
        } catch (err) {
            toast({
                title: "Failed to update officer",
                description: err.response?.data?.message,
                status: "error",
            });
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) {
        return (
            <Container maxW="1400px" py={8}>
                <VStack spacing={4}>
                    <Spinner size="xl" />
                    <Heading size="md">Loading officers...</Heading>
                </VStack>
            </Container>
        );
    }

    return (
        <Container maxW="1300px" py={4}>
            <VStack align="stretch" spacing={4}>
                {/* Breadcrumb */}
                <Breadcrumb fontSize="sm" color="gray.600">
                    <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/projectRegister" color="blue.500">
                            Register
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink color="blue.500"
                            fontWeight="bold"
                            fontSize="x-medium"
                        >Officer List</BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>

                <HStack justify="space-between">
                    <Text color="gray.600">
                        Manage project officers and their details
                    </Text>
                    <Link to="/projectRegister/officers/add">
                        <Button leftIcon={<FiPlus />} colorScheme="blue">
                            Add New Officer
                        </Button>
                    </Link>
                </HStack>

                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                {/* Filters + pagination summary */}
                <HStack
                    justify="space-between"
                    align="center"
                    borderBottomWidth="1px"
                    borderColor="gray.200"
                    pb={2}
                    flexWrap="wrap"
                    gap={3}
                >
                    <HStack spacing={2}>
                        <Input
                            size="sm"
                            width="260px"
                            placeholder="Search EPF, name, email, division..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Select
                            size="sm"
                            width="140px"
                            placeholder="All Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </Select>
                        {(searchTerm || statusFilter) && (
                            <IconButton
                                size="sm"
                                icon={<FiX />}
                                aria-label="Clear filters"
                                onClick={clearFilters}
                            />
                        )}
                    </HStack>

                    {totalPages > 1 && (
                        <Text fontSize="sm" color="gray.600">
                            {officers.length > 0 ? (
                                <>
                                    Showing {(currentPage - 1) * recordsPerPage + 1} to{" "}
                                    {(currentPage - 1) * recordsPerPage + officers.length} of{" "}
                                    {filteredOfficers.length || allOfficers.length} records
                                </>
                            ) : (
                                "No records to display"
                            )}
                        </Text>
                    )}
                </HStack>

                {/* Table */}
                <TableContainer borderWidth="1px" borderRadius="lg">
                    <Table size="sm">
                        <Thead bg="blue.50">
                            <Tr>
                                <Th>No</Th>
                                <Th>EPF No</Th>
                                <Th>Full Name</Th>
                                <Th>Email</Th>
                                <Th>Contact</Th>
                                <Th>Designation</Th>
                                <Th>Division</Th>
                                <Th>Qualification</Th>
                                <Th>Experience</Th>
                                <Th>Status</Th>
                                {canEdit && <Th>Actions</Th>}
                            </Tr>
                        </Thead>
                        <Tbody>
                            {officers.map((o, index) => (
                                <Tr key={o.id}>
                                    <Td>
                                        {(currentPage - 1) * recordsPerPage + index + 1}
                                    </Td>
                                    <Td>{o.officerNo || "N/A"}</Td>
                                    <Td>
                                        {o.fullName ||
                                            `${o.firstName || ""} ${o.lastName || ""}`.trim() ||
                                            "N/A"}
                                    </Td>
                                    <Td>{o.email || "N/A"}</Td>
                                    <Td>{o.contactNumber || "N/A"}</Td>
                                    <Td>{o.designation || "N/A"}</Td>
                                    <Td>{o.division || "N/A"}</Td>
                                    <Td>{o.qualification || "N/A"}</Td>
                                    <Td>{o.experience ?? 0}</Td>
                                    <Td>
                                        <Badge
                                            colorScheme={
                                                (typeof o.status === "boolean"
                                                    ? o.status
                                                    : o.isActive) === true
                                                    ? "green"
                                                    : "red"
                                            }
                                        >
                                            {(typeof o.status === "boolean"
                                                ? o.status
                                                : o.isActive) === true
                                                ? "Active"
                                                : "Inactive"}
                                        </Badge>
                                    </Td>
                                    {canEdit && (
                                        <Td>
                                            <Tooltip label="Edit Officer">
                                                <Button
                                                    size="xs"
                                                    leftIcon={<FiEdit2 />}
                                                    variant="outline"
                                                    colorScheme="blue"
                                                    onClick={() => handleEditOfficer(o)}
                                                >
                                                    Edit
                                                </Button>
                                            </Tooltip>
                                        </Td>
                                    )}
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </TableContainer>

                {/* Empty state */}
                {officers.length === 0 && !loading && (
                    <Box textAlign="center" py={8}>
                        <Heading size="md" color="gray.500" mb={2}>
                            {searchTerm || statusFilter
                                ? "No officers found"
                                : "No officers found"}
                        </Heading>
                        <Text color="gray.500" mb={4}>
                            {searchTerm || statusFilter
                                ? "No officers match your search criteria. Try adjusting your filters or search terms."
                                : "No officers have been registered yet."}
                        </Text>
                        {canEdit && (
                            <Link to="/projectregister/officers/add">
                                <Button colorScheme="blue">Add Your First Officer</Button>
                            </Link>
                        )}
                    </Box>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <HStack justify="center" mt={2} spacing={4}>
                        <Button
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            isDisabled={currentPage === 1 || loading}
                            variant="outline"
                        >
                            Previous
                        </Button>
                        <Text fontSize="sm">
                            Page {currentPage} of {totalPages}
                        </Text>
                        <Button
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            isDisabled={currentPage === totalPages || loading}
                            variant="outline"
                        >
                            Next
                        </Button>
                    </HStack>
                )}

                {/* Edit Modal */}
                <Modal isOpen={isOpen} onClose={onClose}>
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Edit Officer</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={3} align="stretch">
                                <FormControl>
                                    <FormLabel>EPF / Officer No</FormLabel>
                                    <Input
                                        value={editFormData.officerNo}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                officerNo: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Full Name</FormLabel>
                                    <Input
                                        value={editFormData.fullName}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                fullName: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Email</FormLabel>
                                    <Input
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                email: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Contact Number</FormLabel>
                                    <Input
                                        value={editFormData.contactNumber}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                contactNumber: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Designation</FormLabel>
                                    <Select
                                        value={editFormData.designation}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                designation: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="">Select designation</option>
                                        <option value="Engineer">Engineer</option>
                                        <option value="Technical Officer">Technical Officer</option>
                                        <option value="Secretary">Secretary</option>
                                    </Select>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Division</FormLabel>
                                    <Input
                                        value={editFormData.division}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                division: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Qualification</FormLabel>
                                    <Input
                                        value={editFormData.qualification}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                qualification: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Experience (years)</FormLabel>
                                    <Input
                                        type="number"
                                        value={editFormData.experience}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                experience: Number(e.target.value) || 0,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl display="flex" alignItems="center">
                                    <FormLabel mb="0">Active</FormLabel>
                                    <Switch
                                        isChecked={!!editFormData.status}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                status: e.target.checked,
                                            }))
                                        }
                                    />
                                </FormControl>
                            </VStack>
                        </ModalBody>

                        <ModalFooter>
                            <Button mr={3} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={handleEditSubmit}
                                isLoading={editLoading}
                            >
                                Update
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Container>
    );
};

export default OfficerListPage;