import {
    Container,
    VStack,
    HStack,
    Box,
    Text,
    Heading,
    Button,
    Input,
    Select,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Spinner,
    Badge,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    useToast,
    useColorModeValue,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Alert,
    AlertIcon,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiX } from "react-icons/fi";
import { useState, useEffect } from "react";
import { agreementAPI } from "../../../api/agreements.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";

const AgreementList = () => {
    const [agreements, setAgreements] = useState([]);
    const [allAgreements, setAllAgreements] = useState([]);
    const [filteredAgreements, setFilteredAgreements] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const recordsPerPage = 8;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const [editingAgreement, setEditingAgreement] = useState(null);
    const [editFormData, setEditFormData] = useState({
        agreementNo: "",
        agreementID: "",
        projectName: "",
        agreementSum: 0,
        vat: 0,
        periodDays: 0,
        awardDate: "",
        startDate: "",
        completionDate: "",
        status: "ACTIVE"
    });
    const [editLoading, setEditLoading] = useState(false);

    const toast = useToast();
    const { user } = useAuth();

    const bg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    const formatCurrency = (amount) =>
        `Rs. ${amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";

    useEffect(() => {
        fetchAgreements();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, statusFilter, allAgreements]);

    const showToast = (status, description) => {
        toast({
            status,
            description,
            duration: 3000,
            isClosable: true,
        });
    };

    const applyFilters = () => {
        let filtered = [...allAgreements];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter((agreement) => {
                const agreementNo = (agreement.agreementNo || "")
                    .toString()
                    .toLowerCase();
                const projectName = (agreement.projectName || "").toLowerCase();
                return (
                    agreementNo.includes(term) || projectName.includes(term)
                );
            });
        }

        // Apply status filter
        if (statusFilter) {
            filtered = filtered.filter(agreement => {
                if (statusFilter === 'active') return agreement.status === 'ACTIVE';
                if (statusFilter === 'completed') return agreement.status === 'COMPLETED';
                if (statusFilter === 'pending') return agreement.status === 'PENDING';
                return true;
            });
        }

        setFilteredAgreements(filtered);

        const newTotalPages = Math.ceil(filtered.length / recordsPerPage);
        setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
        setCurrentPage(1);

        setAgreements(filtered.slice(0, recordsPerPage));
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;

        const dataToUse =
            filteredAgreements.length > 0 ? filteredAgreements : allAgreements;

        setCurrentPage(newPage);
        const startIndex = (newPage - 1) * recordsPerPage;
        const endIndex = Math.min(startIndex + recordsPerPage, dataToUse.length);

        setAgreements(dataToUse.slice(startIndex, endIndex));
    };

    const fetchAgreements = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await agreementAPI.getAllAgreements();

            let agreementsData = [];
            if (Array.isArray(response)) agreementsData = response;
            else if (response?.data?.agreements)
                agreementsData = response.data.agreements;
            else if (Array.isArray(response?.data))
                agreementsData = response.data;
            else if (Array.isArray(response?.agreements))
                agreementsData = response.agreements;

            setAllAgreements(agreementsData);
            setFilteredAgreements(agreementsData);

            const newTotalPages = Math.ceil(
                agreementsData.length / recordsPerPage
            );
            setTotalPages(newTotalPages > 0 ? newTotalPages : 1);

            setAgreements(agreementsData.slice(0, recordsPerPage));
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to fetch agreements"
            );
            setAgreements([]);
            setAllAgreements([]);
            setFilteredAgreements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEditAgreement = (agreement) => {
        setEditingAgreement(agreement);
        setEditFormData({
            agreementNo: agreement.agreementNo || "",
            agreementID: agreement.agreementID || "",
            projectName: agreement.projectName || "",
            agreementSum: agreement.agreementSum || 0,
            vat: agreement.vat || 0,
            periodDays: agreement.periodDays || 0,
            awardDate: agreement.awardDate
                ? agreement.awardDate.split("T")[0]
                : "",
            startDate: agreement.startDate ? agreement.startDate.split("T")[0] : "",
            completionDate: agreement.completionDate
                ? agreement.completionDate.split("T")[0]
                : "",
            status: agreement.status || "ACTIVE"
        });
    };

    const handleEditSubmit = async () => {
        if (!editingAgreement) return;

        setEditLoading(true);
        try {
            const updateData = {
                agreementNo: editFormData.agreementNo,
                agreementID: editFormData.agreementID,
                projectName: editFormData.projectName,
                agreementSum: editFormData.agreementSum ? parseFloat(editFormData.agreementSum) : 0,
                vat: editFormData.vat ? parseFloat(editFormData.vat) : 0,
                periodDays: editFormData.periodDays ? parseInt(editFormData.periodDays) : null,
                awardDate: editFormData.awardDate || null,
                startDate: editFormData.startDate || null,
                completionDate: editFormData.completionDate || null,
                status: editFormData.status,
                description: editFormData.description || null,
            };
            
            await agreementAPI.updateAgreement(editingAgreement.id, updateData);
            showToast("success", "Agreement updated successfully");
            setEditingAgreement(null);
            await fetchAgreements();
        } catch (err) {
            console.error("Agreement update error:", err);
            showToast(
                "error",
                err.response?.data?.message || "Failed to update agreement"
            );
        } finally {
            setEditLoading(false);
        }
    };

    if (loading) {
        return (
            <Container maxW="1400px" py={8}>
                <VStack spacing={4}>
                    <Spinner size="xl" />
                    <Heading size="md">Loading agreements...</Heading>
                </VStack>
            </Container>
        );
    }

    return (
        <Container maxW="1300px" py={0.1}>
            <VStack spacing={2} align="stretch">
                {/* Breadcrumb */}
                <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
                    <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/projectregister" color="green.500">
                            Register
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink
                            color="green.500"
                            fontWeight="bold"
                            fontSize="x-medium"
                        >
                            Agreements
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>

                <HStack justify="space-between">

                    <Text color="gray.500" fontSize="x-large" > project agreement List</Text>
                    <Link to="/projectregister/agreements/add">
                        <Button leftIcon={<FiPlus />} colorScheme="green">
                            Add New Agreement
                        </Button>
                    </Link>
                </HStack>

                {/* {error && (
          <Box
            p={4}
            borderWidth="1px"
            borderColor="red.300"
            bg="red.50"
            borderRadius="md"
          >
            <Text color="red.700" fontWeight="bold">
              Error Loading Agreements
            </Text>
            <Text>{error}</Text>
            <Button mt={2} size="sm" onClick={fetchAgreements}>
              Try Again
            </Button>
          </Box>
        )} */}
                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                {/* Filters + Pagination summary (simpler than labor page) */}
                <Box
                    py={2}
                    px={4}
                    borderBottomWidth="2px"
                    borderBottomColor={borderColor}
                >
                    <HStack justify="space-between" align="center" flexWrap="wrap">
                        <HStack spacing={3} flexWrap="wrap">
                            <Input
                                size="sm"
                                width="260px"
                                placeholder="Search agreement ID, project name..."
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
                                <option value="completed">Completed</option>
                                <option value="pending">Pending</option>
                            </Select>
                            {(searchTerm || statusFilter) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    leftIcon={<FiX />}
                                    onClick={clearFilters}
                                >
                                    Clear
                                </Button>
                            )}
                        </HStack>

                        {totalPages > 1 && (
                            <Text fontSize="sm" color="gray.600">
                                {agreements.length > 0 ? (
                                    <>
                                        Showing{" "}
                                        {(currentPage - 1) * recordsPerPage + 1} to{" "}
                                        {(currentPage - 1) * recordsPerPage +
                                            agreements.length}{" "}
                                        of{" "}
                                        {filteredAgreements.length > 0
                                            ? filteredAgreements.length
                                            : allAgreements.length}{" "}
                                        records
                                    </>
                                ) : (
                                    <>No records to display</>
                                )}
                            </Text>
                        )}
                    </HStack>
                </Box>

                {/* Table */}
                <Box
                    bg={bg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    overflow="hidden"
                >
                    <TableContainer>
                        <Table variant="simple" size="sm">
                            <Thead bg="green.50">
                                <Tr>
                                    <Th>No</Th>
                                    <Th>Agreement No</Th>
                                    <Th>Project Name</Th>
                                    <Th>Agreement Sum</Th>
                                    <Th>VAT</Th>
                                    <Th>Period (days)</Th>
                                    <Th>Award Date</Th>
                                    <Th>Start Date</Th>
                                    <Th>Completion Date</Th>
                                    {statusFilter !== "" || true ? <Th>Status</Th> : null}
                                    {canEdit && <Th>Actions</Th>}
                                </Tr>
                            </Thead>
                            <Tbody>
                                {agreements.map((c, index) => (
                                    <Tr key={c.id}>
                                        <Td>
                                            {(currentPage - 1) * recordsPerPage + index + 1}
                                        </Td>
                                        <Td>{c.agreementNo || "N/A"}</Td>
                                        <Td>{c.projectName || "N/A"}</Td>
                                        <Td>
                                            {c.agreementSum
                                                ? formatCurrency(c.agreementSum)
                                                : "N/A"}
                                        </Td>
                                        <Td>
                                            {c.vat ? `${c.vat}%` : "N/A"}
                                        </Td>
                                        <Td>{c.periodDays || "N/A"}</Td>
                                        <Td>
                                            {c.awardDate
                                                ? new Date(
                                                    c.awardDate
                                                ).toLocaleDateString()
                                                : "N/A"}
                                        </Td>
                                        <Td>
                                            {c.startDate
                                                ? new Date(
                                                    c.startDate
                                                ).toLocaleDateString()
                                                : "N/A"}
                                        </Td>
                                        <Td>
                                            {c.completionDate
                                                ? new Date(
                                                    c.completionDate
                                                ).toLocaleDateString()
                                                : "N/A"}
                                        </Td>
                                        <Td>
                                            {c.status ? (
                                                <Badge
                                                    colorScheme={
                                                        c.status === "ACTIVE"
                                                            ? "green"
                                                            : c.status === "COMPLETED"
                                                                ? "purple"
                                                                : "orange"
                                                    }
                                                >
                                                    {c.status}
                                                </Badge>
                                            ) : (
                                                "-"
                                            )}
                                        </Td>
                                        {canEdit && (
                                            <Td>
                                                <Button
                                                    size="sm"
                                                    leftIcon={<FiEdit2 />}
                                                    variant="outline"
                                                    colorScheme="green"
                                                    onClick={() => handleEditAgreement(c)}
                                                >
                                                    Edit
                                                </Button>
                                            </Td>
                                        )}
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Empty state */}
                {Array.isArray(agreements) &&
                    agreements.length === 0 &&
                    !loading && (
                        <Box textAlign="center" py={8}>
                            <Heading size="md" color="gray.500" mb={4}>
                                {searchTerm || statusFilter
                                    ? "No agreements found"
                                    : "No agreements found"}
                            </Heading>
                            {searchTerm || statusFilter ? (
                                <Text color="gray.500">
                                    No agreements match your search criteria. Try
                                    adjusting your filters or search terms.
                                </Text>
                            ) : (
                                <>
                                    <Text color="gray.500" mb={4}>
                                        No agreements have been registered yet.
                                    </Text>
                                    {canEdit && (
                                        <Link to="/projectregister/agreements/add">
                                            <Button colorScheme="green">
                                                Add Your First Agreement
                                            </Button>
                                        </Link>
                                    )}
                                </>
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
                            colorScheme="green"
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
                            colorScheme="green"
                            variant="outline"
                        >
                            Next
                        </Button>
                    </HStack>
                )}

                {/* Edit Modal */}
                <Modal
                    isOpen={!!editingAgreement}
                    onClose={() => setEditingAgreement(null)}
                    size="lg"
                >
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader>Edit Agreement</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <VStack spacing={4}>
                                <FormControl isRequired>
                                    <FormLabel>Agreement No</FormLabel>
                                    <Input
                                        type="text"
                                        value={editFormData.agreementNo}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                agreementNo: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter agreement number"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Agreement ID</FormLabel>
                                    <Input
                                        type="text"
                                        value={editFormData.agreementID}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                agreementID: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter agreement ID"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Project Name</FormLabel>
                                    <Input
                                        type="text"
                                        value={editFormData.projectName}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                projectName: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter project name"
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Agreement Sum</FormLabel>
                                    <NumberInput
                                        value={editFormData.agreementSum}
                                        onChange={(_, valueAsNumber) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                agreementSum: valueAsNumber || 0,
                                            }))
                                        }
                                        min={0}
                                    >
                                        <NumberInputField placeholder="Enter agreement sum" />
                                    </NumberInput>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>VAT (%)</FormLabel>
                                    <NumberInput
                                        value={editFormData.vat}
                                        onChange={(_, valueAsNumber) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                vat: valueAsNumber || 0,
                                            }))
                                        }
                                        min={0}
                                        max={100}
                                    >
                                        <NumberInputField placeholder="Enter VAT percentage" />
                                    </NumberInput>
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Period (days)</FormLabel>
                                    <NumberInput
                                        value={editFormData.periodDays}
                                        onChange={(_, valueAsNumber) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                periodDays: valueAsNumber || 0,
                                            }))
                                        }
                                        min={0}
                                    >
                                        <NumberInputField placeholder="Enter period in days" />
                                    </NumberInput>
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Award Date</FormLabel>
                                    <Input
                                        type="date"
                                        value={editFormData.awardDate}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                awardDate: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Start Date</FormLabel>
                                    <Input
                                        type="date"
                                        value={editFormData.startDate}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                startDate: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl>
                                    <FormLabel>Completion Date</FormLabel>
                                    <Input
                                        type="date"
                                        value={editFormData.completionDate}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                completionDate: e.target.value,
                                            }))
                                        }
                                    />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Status</FormLabel>
                                    <Select
                                        value={editFormData.status}
                                        onChange={(e) =>
                                            setEditFormData((p) => ({
                                                ...p,
                                                status: e.target.value,
                                            }))
                                        }
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </Select>
                                </FormControl>
                            </VStack>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="ghost"
                                mr={3}
                                onClick={() => setEditingAgreement(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                colorScheme="green"
                                onClick={handleEditSubmit}
                                isLoading={editLoading}
                                loadingText="Updating..."
                            >
                                Update Agreement
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </VStack>
        </Container>
    );
};

export default AgreementList;