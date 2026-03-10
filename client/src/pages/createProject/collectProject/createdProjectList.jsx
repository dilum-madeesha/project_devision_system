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
    StatHelpText,
    useToast,
    Input,
    IconButton,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    FormControl,
    FormLabel,
    Select,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    Textarea,
    Tooltip,
    Checkbox,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEye, FiClock, FiDollarSign, FiX, FiEdit, FiTrash2 } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { dailyLaborCostAPI, dailyLaborAssignmentAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";

const CreateNewProject = () => {
    const [laborCosts, setLaborCosts] = useState([]);
    const [allLaborCosts, setAllLaborCosts] = useState([]);
    const [filteredLaborCosts, setFilteredLaborCosts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const recordsPerPage = 8;
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isAdmin = user?.role === 'admin'; // Check if the user is an admin
    const bg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const toast = useToast();

    // Filter states
    const [dateFilter, setDateFilter] = useState('');
    const [jobFilter, setJobFilter] = useState('');

    // Modal state
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedLaborCost, setSelectedLaborCost] = useState(null);
    const [laborAssignments, setLaborAssignments] = useState([]);
    const [assignmentsLoading, setAssignmentsLoading] = useState(false);

    // Edit modal state
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const [editingLaborCost, setEditingLaborCost] = useState(null);
    const [editingAssignments, setEditingAssignments] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    // Delete confirmation state
    const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const [deletingLaborCost, setDeletingLaborCost] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const cancelRef = useRef();

    useEffect(() => {
        fetchLaborCosts();
    }, []);

    // Apply filters whenever filter values or allLaborCosts change
    useEffect(() => {
        applyFilters();
    }, [dateFilter, jobFilter, allLaborCosts]);

    const applyFilters = () => {
        let filtered = [...allLaborCosts];

        // Apply date filter
        if (dateFilter) {
            filtered = filtered.filter(labor => {
                const laborDate = new Date(labor.date).toISOString().split('T')[0];
                return laborDate === dateFilter;
            });
        }

        // Apply job filter (search in both job number and job title)
        if (jobFilter) {
            const searchTerm = jobFilter.toLowerCase();
            filtered = filtered.filter(labor => {
                const jobNumber = (labor.job?.jobNumber || '').toLowerCase();
                const jobTitle = (labor.job?.title || '').toLowerCase();
                return jobNumber.includes(searchTerm) || jobTitle.includes(searchTerm);
            });
        }

        setFilteredLaborCosts(filtered);

        // Reset pagination when filters change
        const newTotalPages = Math.ceil(filtered.length / recordsPerPage);
        setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
        setCurrentPage(1);

        // Set current page data
        const startIndex = 0;
        const endIndex = Math.min(recordsPerPage, filtered.length);
        setLaborCosts(filtered.slice(startIndex, endIndex));
    };

    const clearFilters = () => {
        setDateFilter('');
        setJobFilter('');
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);

        // Calculate the data to display for this page from filtered data
        const startIndex = (page - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const pageData = filteredLaborCosts.slice(startIndex, endIndex);

        setLaborCosts(pageData);
    };

    // Helper function to check if record can be edited/deleted (within 30 days of creation)
    const canEditOrDelete = (laborCost) => {
        const currentDate = new Date();
        const createdDate = new Date(laborCost.createdAt || laborCost.date);
        const timeDifference = currentDate - createdDate;
        const daysDifference = timeDifference / (1000 * 3600 * 24); // Convert milliseconds to days
        return daysDifference <= 30;
    };

    const fetchLaborCosts = async (page = 1) => {
        try {
            setLoading(true);

            // Get total count first to set up pagination correctly
            let totalCount = 0;
            let allData = [];

            // Try to get all records first to have accurate count
            if (page === 1) {
                try {
                    const allResponse = await dailyLaborCostAPI.getAll(1, 1000); // Get all records in one go

                    if (allResponse && Array.isArray(allResponse)) {
                        totalCount = allResponse.length;
                        allData = allResponse;
                    } else if (allResponse && allResponse.data && Array.isArray(allResponse.data)) {
                        totalCount = allResponse.data.length;
                        allData = allResponse.data;
                    } else if (allResponse && allResponse.data && allResponse.data.dailyLaborCosts) {
                        totalCount = allResponse.data.dailyLaborCosts.length;
                        allData = allResponse.data.dailyLaborCosts;
                    } else if (allResponse && allResponse.laborCosts) {
                        totalCount = allResponse.laborCosts.length;
                        allData = allResponse.laborCosts;
                    }

                    // Filter records to show only within 365 days from current date
                    const currentDate = new Date();
                    const oneYearAgo = new Date();
                    oneYearAgo.setDate(currentDate.getDate() - 365);

                    const filteredByDate = allData.filter(laborCost => {
                        const createdDate = new Date(laborCost.createdAt || laborCost.date);
                        return createdDate >= oneYearAgo;
                    });

                    // Store filtered data for client-side pagination
                    setAllLaborCosts(filteredByDate);
                    setFilteredLaborCosts(filteredByDate); // Initialize filtered data

                    // Calculate start and end for current page
                    const startIndex = (page - 1) * recordsPerPage;
                    const endIndex = Math.min(startIndex + recordsPerPage, allData.length);

                    // Set current page data
                    setLaborCosts(filteredByDate.slice(startIndex, endIndex));

                    // Calculate total pages based on filtered data
                    totalCount = filteredByDate.length;
                    const calculatedTotalPages = Math.ceil(totalCount / recordsPerPage);
                    setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
                    setCurrentPage(page);

                    console.log("Total records:", totalCount);
                    console.log("Total pages:", Math.ceil(totalCount / recordsPerPage));

                    // Exit early since we loaded all data
                    setLoading(false);
                    return;
                } catch (err) {
                    // If bulk loading fails, continue with paginated approach
                    console.error("Failed to load all records at once, falling back to pagination:", err);
                }
            }

            // If we're here, either we're not on page 1 or the bulk loading failed
            const response = await dailyLaborCostAPI.getAll(page, recordsPerPage);
            console.log("Labor costs API response:", response); // Debug log

            // Handle different response structures
            let costsData = [];

            if (response && Array.isArray(response)) {
                costsData = response;
                // If we don't have a total count from earlier
                if (totalCount === 0) {
                    // This is a guess - assume at least one more page if we got full results
                    totalCount = (page - 1) * recordsPerPage + costsData.length;
                    if (costsData.length === recordsPerPage) totalCount += 1;
                }
            } else if (response && response.data && response.data.dailyLaborCosts && Array.isArray(response.data.dailyLaborCosts)) {
                // Handle nested structure with pagination: {success: true, data: {dailyLaborCosts: [...], pagination: {...}}}
                costsData = response.data.dailyLaborCosts;
                totalCount = response.data.pagination?.total || response.data.totalCount ||
                    ((page - 1) * recordsPerPage + costsData.length);
            } else if (response && response.data && Array.isArray(response.data)) {
                // Data property is an array
                costsData = response.data;
                totalCount = response.pagination?.total || response.totalCount ||
                    ((page - 1) * recordsPerPage + costsData.length);
            } else if (response && response.laborCosts && Array.isArray(response.laborCosts)) {
                // Named property
                costsData = response.laborCosts;
                totalCount = response.pagination?.total || response.totalCount ||
                    ((page - 1) * recordsPerPage + costsData.length);
            }

            console.log("Processed labor costs data:", costsData); // Debug log

            // Set current page data
            setLaborCosts(costsData);

            // Update all costs collection
            if (allData.length > 0) {
                // We already have all data
                setAllLaborCosts(allData);
                setFilteredLaborCosts(allData); // Initialize filtered data
            } else {
                // Update incrementally
                setAllLaborCosts(prev => {
                    const newAllCosts = [...prev];
                    const startIndex = (page - 1) * recordsPerPage;
                    costsData.forEach((cost, idx) => {
                        newAllCosts[startIndex + idx] = cost;
                    });
                    return newAllCosts;
                });
            }

            // Calculate total pages
            const calculatedTotalPages = Math.ceil(totalCount / recordsPerPage);
            setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);
            setCurrentPage(page);

            console.log("Total count:", totalCount);
            console.log("Total pages:", calculatedTotalPages);
        } catch (err) {
            setError("Failed to fetch labor costs");
            console.error("Error fetching labor costs:", err);
            setLaborCosts([]); // Ensure laborCosts is always an array
            // Don't clear allLaborCosts to preserve any data we might have
            // Only set totalPages to 1 if we're on page 1
            if (page === 1) {
                setAllLaborCosts([]);
                setTotalPages(1);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewLaborAssignments = async (laborCost) => {
        try {
            setSelectedLaborCost(laborCost);
            setAssignmentsLoading(true);
            onOpen();

            const response = await dailyLaborAssignmentAPI.getByDailyLaborCostId(laborCost.id);
            console.log("Labor assignments response:", response);

            // Handle different response structures
            let assignmentsData = [];
            if (response && Array.isArray(response)) {
                assignmentsData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                assignmentsData = response.data;
            } else if (response && response.assignments && Array.isArray(response.assignments)) {
                assignmentsData = response.assignments;
            }

            console.log("Processed assignments data:", assignmentsData);
            setLaborAssignments(assignmentsData);
        } catch (err) {
            console.error("Error fetching labor assignments:", err);
            toast({
                title: "Error",
                description: "Failed to fetch labor assignment details",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            setLaborAssignments([]);
        } finally {
            setAssignmentsLoading(false);
        }
    };

    const handleEditLaborCost = async (laborCost) => {
        try {
            setEditingLaborCost({ ...laborCost });
            setEditLoading(true);
            onEditOpen();

            const response = await dailyLaborAssignmentAPI.getByDailyLaborCostId(laborCost.id);
            console.log("Edit labor assignments response:", response);

            // Handle different response structures
            let assignmentsData = [];
            if (response && Array.isArray(response)) {
                assignmentsData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                assignmentsData = response.data;
            } else if (response && response.assignments && Array.isArray(response.assignments)) {
                assignmentsData = response.assignments;
            }

            console.log("Processed edit assignments data:", assignmentsData);

            // Debug: Log the initial data to see what values we're getting
            assignmentsData.forEach((assignment, index) => {
                console.log(`Initial assignment ${index}:`, {
                    id: assignment.id,
                    regularHours: assignment.regularHours,
                    otHours: assignment.otHours,
                    regularCost: assignment.regularCost,
                    otCost: assignment.otCost,
                    totalCost: assignment.totalCost,
                    dayPay: assignment.labor?.dayPay,
                    otPay: assignment.labor?.otPay,
                    laborName: `${assignment.labor?.firstName} ${assignment.labor?.lastName}`
                });

                // Recalculate costs to ensure they're correct (ignore database values)
                // Calculate regular hours based on time in/out selection (same logic as AddLaborCost)
                let calculatedRegularHours = 0;
                if (assignment.timeIn === "morning" && assignment.timeOut === "evening") {
                    calculatedRegularHours = 8; // Full day
                } else if (assignment.timeIn === "morning" && assignment.timeOut === "afternoon") {
                    calculatedRegularHours = 4; // Morning shift
                } else if (assignment.timeIn === "afternoon" && assignment.timeOut === "evening") {
                    calculatedRegularHours = 4; // Afternoon shift
                }

                const otHours = parseFloat(assignment.otHours) || 0;
                const dayPay = parseFloat(assignment.labor?.dayPay) || 0;
                const otPay = parseFloat(assignment.labor?.otPay) || 0;

                // Use the same calculation formula as AddLaborCost
                const calculatedRegularCost = (calculatedRegularHours / 8) * dayPay;
                const calculatedOtCost = otHours * otPay;
                const calculatedTotalCost = calculatedRegularCost + calculatedOtCost;

                console.log(`Recalculated assignment ${index}:`, {
                    timeIn: assignment.timeIn,
                    timeOut: assignment.timeOut,
                    calculatedRegularHours,
                    originalRegularHours: assignment.regularHours,
                    calculatedRegularCost,
                    calculatedOtCost,
                    calculatedTotalCost,
                    databaseTotalCost: assignment.totalCost
                });

                // Override with calculated values
                assignment.regularHours = calculatedRegularHours;
                assignment.regularCost = calculatedRegularCost;
                assignment.otCost = calculatedOtCost;
                assignment.totalCost = calculatedTotalCost;
            });

            setEditingAssignments([...assignmentsData]);
        } catch (err) {
            console.error("Error fetching labor assignments for edit:", err);
            toast({
                title: "Error",
                description: "Failed to fetch labor assignment details for editing",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            setEditingAssignments([]);
        } finally {
            setEditLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            setEditLoading(true);

            // Calculate total cost using Number to ensure numeric addition
            const totalCost = editingAssignments.reduce((sum, assignment) => {
                // Ensure we're working with numbers
                return sum + (Number(assignment.totalCost) || 0);
            }, 0);

            console.log("Total cost calculated for save:", totalCost);
            console.log("Individual costs:", editingAssignments.map(a => a.totalCost));

            // Update daily labor cost with new total cost
            const updatedLaborCost = {
                ...editingLaborCost,
                cost: totalCost
            };

            // Update the daily labor cost
            await dailyLaborCostAPI.update(editingLaborCost.id, {
                description: updatedLaborCost.description,
                cost: totalCost
            });

            // Update each assignment
            for (const assignment of editingAssignments) {
                await dailyLaborAssignmentAPI.updateById(assignment.id, {
                    timeIn: assignment.timeIn,
                    timeOut: assignment.timeOut,
                    regularHours: parseFloat(assignment.regularHours) || 0,
                    otHours: parseFloat(assignment.otHours) || 0,
                    // Include cost values for complete data
                    regularCost: Number(assignment.regularCost) || 0,
                    otCost: Number(assignment.otCost) || 0,
                    hasWeekendPay: assignment.hasWeekendPay || false,
                    weekendPayCost: Number(assignment.weekendPayCost) || 0,
                    totalCost: Number(assignment.totalCost) || 0
                });
            }

            toast({
                title: "Success",
                description: "Labor cost updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Refresh the data
            await fetchLaborCosts();
            onEditClose();
        } catch (err) {
            console.error("Error updating labor cost:", err);
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to update labor cost",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteLaborCost = (laborCost) => {
        setDeletingLaborCost(laborCost);
        onDeleteOpen();
    };

    const handleConfirmDelete = async () => {
        if (!deletingLaborCost) return;

        try {
            setDeleteLoading(true);

            await dailyLaborCostAPI.delete(deletingLaborCost.id);

            toast({
                title: "Success",
                description: "Labor cost record deleted successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Refresh the data
            await fetchLaborCosts();
            onDeleteClose();
            setDeletingLaborCost(null);
        } catch (err) {
            console.error("Error deleting labor cost:", err);
            toast({
                title: "Error",
                description: err.response?.data?.message || "Failed to delete labor cost record",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleCancelDelete = () => {
        onDeleteClose();
        setDeletingLaborCost(null);
    };

    const handleAssignmentChange = (index, field, value) => {
        const updatedAssignments = [...editingAssignments];
        updatedAssignments[index] = {
            ...updatedAssignments[index],
            [field]: value
        };

        // Recalculate costs when time, OT hours, or weekend pay change
        if (field === 'timeIn' || field === 'timeOut' || field === 'otHours' || field === 'hasWeekendPay') {
            const assignment = updatedAssignments[index];

            // Calculate regular hours based on time in/out selection (same logic as AddLaborCost)
            let regularHours = 0;
            if (assignment.timeIn === "morning" && assignment.timeOut === "evening") {
                regularHours = 8; // Full day
            } else if (assignment.timeIn === "morning" && assignment.timeOut === "afternoon") {
                regularHours = 4; // Morning shift
            } else if (assignment.timeIn === "afternoon" && assignment.timeOut === "evening") {
                regularHours = 4; // Afternoon shift
            }

            const otHours = parseFloat(assignment.otHours) || 0;
            const dayPay = parseFloat(assignment.labor?.dayPay) || 0;
            const otPay = parseFloat(assignment.labor?.otPay) || 0;
            const weekendPay = parseFloat(assignment.labor?.weekendPay) || 0;

            // Calculate costs using the same formula as AddLaborCost
            const regularCost = (regularHours / 8) * dayPay;
            const otCost = otHours * otPay;

            // Calculate weekend pay cost if applicable
            let weekendPayCost = 0;
            const hasWeekendPay = assignment.hasWeekendPay || false;
            if (hasWeekendPay && weekendPay > 0 && editingLaborCost?.date) {
                if (isSaturday(editingLaborCost.date)) {
                    weekendPayCost = weekendPay * 0.5; // Half weekend pay for Saturday
                } else if (isSunday(editingLaborCost.date)) {
                    weekendPayCost = weekendPay; // Full weekend pay for Sunday
                }
            }

            // Store as numbers and update all calculated fields
            assignment.regularHours = regularHours;
            assignment.regularCost = regularCost;
            assignment.otCost = otCost;
            assignment.hasWeekendPay = hasWeekendPay;
            assignment.weekendPayCost = weekendPayCost;
            assignment.totalCost = 
            regularCost + otCost + weekendPayCost;

            console.log(`Updated assignment ${index}:`, {
                timeIn: assignment.timeIn,
                timeOut: assignment.timeOut,
                regularHours,
                otHours,
                dayPay,
                otPay,
                regularCost,
                otCost,
                total: assignment.totalCost
            });
        }

        setEditingAssignments(updatedAssignments);
    };

    const getStatusColor = (status) => {
        const statusColors = {
            NOT_STARTED: "gray",
            ONGOING: "blue",
            COMPLETED: "green",
            ON_HOLD: "orange",
            CANCELLED: "red"
        };
        return statusColors[status] || "gray";
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatTimeSlot = (timeSlot) => {
        const timeSlots = {
            morning: "8:30 AM",
            afternoon: "12:30 PM",
            evening: "4:30 PM"
        };
        return timeSlots[timeSlot] || timeSlot;
    };

    const getWorkingHours = (timeIn, timeOut) => {
        if (timeIn === "morning" && timeOut === "evening") return "8 hours";
        if (timeIn === "morning" && timeOut === "afternoon") return "4 hours";
        if (timeIn === "afternoon" && timeOut === "evening") return "4 hours";
        return "Unknown";
    };

    const calculateSummary = (assignments) => {
        if (!Array.isArray(assignments)) return {
            totalLabors: 0,
            totalRegularHours: 0,
            totalOtHours: 0,
            totalWeekendPayCost: 0,
            totalCost: 0
        };

        return assignments.reduce((summary, assignment) => {
            return {
                totalLabors: summary.totalLabors + 1,
                totalRegularHours: summary.totalRegularHours + (assignment.regularHours || 0),
                totalOtHours: summary.totalOtHours + (assignment.otHours || 0),
                totalWeekendPayCost: summary.totalWeekendPayCost + (assignment.weekendPayCost || 0),
                totalCost: summary.totalCost + (assignment.totalCost || 0)
            };
        }, {
            totalLabors: 0,
            totalRegularHours: 0,
            totalOtHours: 0,
            totalWeekendPayCost: 0,
            totalCost: 0
        });
    };

    // Helper function to determine if a date is Saturday or Sunday
    const isWeekend = (dateString) => {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
        return dayOfWeek === 0 || dayOfWeek === 6;
    };

    // Helper function to determine if date is Saturday
    const isSaturday = (dateString) => {
        const date = new Date(dateString);
        return date.getDay() === 6;
    };

    // Helper function to determine if date is Sunday
    const isSunday = (dateString) => {
        const date = new Date(dateString);
        return date.getDay() === 0;
    };

    // Helper function to get weekend pay label
    const getWeekendPayLabel = (dateString) => {
        if (isSaturday(dateString)) return "Half Weekend Pay";
        if (isSunday(dateString)) return "Full Weekend Pay";
        return "Weekend Pay";
    };

    if (loading && laborCosts.length === 0) {
        return (
            <Container maxW="1200px" py={8}>
                <VStack spacing={4}>
                    <Spinner size="xl" />
                    <Heading size="md">Loading labor costs...</Heading>
                </VStack>
            </Container>
        );
    }

    return (
        <Container maxW="1300px" py={0.1}>
            <VStack spacing={2} align="stretch">
                {/* Breadcrumb Navigation */}
                <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
                    <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/CreateProject" color="blue.500">
                            Project
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink color="blue.500" fontWeight="bold" fontSize="x-large">
                            Project Records
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>
                <HStack justify="space-between">
                    <Text color="gray.600">All projects list records</Text>
                    <Link to="/createproject/collectProject/new">
                        <Button leftIcon={<FiPlus />} colorScheme="blue">
                            Add New Labor Cost
                        </Button>
                    </Link>
                </HStack>

                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                {/* Filter and Pagination Controls */}
                <Box py={2} px={4} borderBottomWidth="2px" borderBottomColor={borderColor}>
                    <Flex
                        direction={{ base: "column", lg: "row" }}
                        justify="space-between"
                        align={{ base: "stretch", lg: "center" }}
                        gap={3}
                    >
                        {/* Filter Controls */}
                        <HStack spacing={2} flex={1}>
                            <Input
                                placeholder="Search by job number or name"
                                value={jobFilter}
                                onChange={(e) => setJobFilter(e.target.value)}
                                size="sm"
                                maxW="300px"
                            />
                            <Input
                                placeholder="Filter by date (YYYY-MM-DD)"
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                size="sm"
                                maxW="150px"
                            />
                            {(dateFilter || jobFilter) && (
                                <IconButton
                                    icon={<FiX />}
                                    size="sm"
                                    onClick={clearFilters}
                                    aria-label="Clear filters"
                                    colorScheme="gray"
                                    variant="outline"
                                />
                            )}
                        </HStack>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <Flex align="center" gap={4}>
                                <Text fontSize="sm" px={4} color="gray.600" whiteSpace="nowrap">
                                    {laborCosts.length > 0 ? (
                                        <>
                                            Showing {(currentPage - 1) * recordsPerPage + 1} to {(currentPage - 1) * recordsPerPage + laborCosts.length} of {filteredLaborCosts.length} records
                                            {(dateFilter || jobFilter) && ` (filtered from ${allLaborCosts.length} total)`}
                                        </>
                                    ) : (
                                        <>No records to display</>
                                    )}
                                </Text>
                                <HStack spacing={2}>
                                    <Button
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        isDisabled={currentPage === 1 || loading}
                                        colorScheme="blue"
                                        variant="outline"
                                        leftIcon={loading ? <Spinner size="xs" /> : undefined}
                                    >
                                        Previous
                                    </Button>
                                    <Text fontSize="sm" px={2}>
                                        Page {currentPage} of {totalPages}
                                    </Text>
                                    <Button
                                        size="sm"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        isDisabled={currentPage === totalPages || loading}
                                        colorScheme="blue"
                                        variant="outline"
                                        rightIcon={loading ? <Spinner size="xs" /> : undefined}
                                    >
                                        Next
                                    </Button>
                                </HStack>
                            </Flex>
                        )}
                    </Flex>
                </Box>

                {/* Labor Cost table */}
                <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
                    <TableContainer whiteSpace="normal">
                        <Table variant="simple" size="sm" layout="fixed">
                            <Thead backgroundColor={"blue.50"} >
                                <Tr>
                                    <Th>ID</Th>
                                    <Th>Project</Th>
                                    <Th>Cont/direct</Th>
                                    <Th>Engineer</Th>
                                    <Th>Technical O</Th>
                                    <Th>Secretary</Th>
                                    <Th>Start Date</Th>
                                    <Th>End Date</Th>
                                    <Th>Completion</Th>
                                    <Th isNumeric>Actions</Th>
                                    
                                </Tr>
                            </Thead>
                            <Tbody>
                                {Array.isArray(laborCosts) && laborCosts.map((cost) => (
                                    <Tr key={cost.id}>
                                        <Td py={2} px={2}>{formatDate(cost.date)}</Td>
                                        <Td py={2} px={2} fontWeight="medium">{cost.job?.jobNumber || 'N/A'}</Td>
                                        <Td py={2} px={2}>{cost.job?.title || 'N/A'}</Td>
                                        <Td py={2} px={2} maxW="250px" isTruncated>{cost.description || 'N/A'}</Td>
                                        <Td py={2} px={4} fontWeight="medium">{formatCurrency(cost.cost)}</Td>
                                        <Td py={2} px={1}>
                                            <Button
                                                size="2xs"
                                                variant="outline"
                                                colorScheme="green"
                                                p={1}
                                                onClick={() => handleViewLaborAssignments(cost)}
                                            >
                                                View
                                            </Button>
                                        </Td>
                                        <Td py={2} px={1}>
                                            <HStack spacing={4}>
                                                <Button
                                                    size="2xs"
                                                    leftIcon={<FiEdit />}
                                                    variant="outline"
                                                    colorScheme="blue"
                                                    p={1}
                                                    onClick={() => handleEditLaborCost(cost)}
                                                    isDisabled={!canEditOrDelete(cost)}
                                                    title={!canEditOrDelete(cost) ? "Can only edit records within 30 days of creation" : "Edit labor cost"}
                                                >
                                                </Button>
                                                <Button
                                                    size="2xs"
                                                    leftIcon={<FiTrash2 />}
                                                    variant="outline"
                                                    colorScheme="red"
                                                    p={1}
                                                    onClick={() => handleDeleteLaborCost(cost)}
                                                    isDisabled={!canEditOrDelete(cost)}
                                                    title={!canEditOrDelete(cost) ? "Can only delete records within 30 days of creation" : "Delete labor cost"}
                                                >
                                                </Button>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TableContainer>
                </Box>

                {allLaborCosts.length === 0 && !loading && (
                    <Box textAlign="center" py={12}>
                        <VStack spacing={4}>
                            <Heading size="sm" color="gray.500">No labor costs found</Heading>
                            <Text color="gray.400">Start tracking your labor costs to see them here</Text>
                            <Link to="/createproject/collectProject/new">
                                <Button colorScheme="blue">
                                    Add Your First Labor Cost
                                </Button>
                            </Link>
                        </VStack>
                    </Box>
                )}

                {/* Edit Labor Cost Modal */}
                <Modal isOpen={isEditOpen} onClose={onEditClose} size="6xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader py={3}>
                            <VStack spacing={1} align="start">
                                <HStack spacing={2} align="center">
                                    <Heading size="md">Edit Labor Cost</Heading>
                                    {editingLaborCost && (
                                        <Tooltip
                                            label={
                                                <VStack align="start" spacing={1} fontSize="xs">
                                                    <Text fontWeight="bold">Record Information</Text>
                                                    <Text>
                                                        Created by: {editingLaborCost.createdBy ?
                                                            `${editingLaborCost.createdBy.firstName} ${editingLaborCost.createdBy.lastName}` :
                                                            'Unknown'
                                                        }
                                                    </Text>
                                                    <Text>Created: {editingLaborCost.createdAt ? formatDate(editingLaborCost.createdAt) : 'Unknown'}</Text>
                                                    <Text>
                                                        Updated by: {editingLaborCost.updatedBy ?
                                                            `${editingLaborCost.updatedBy.firstName} ${editingLaborCost.updatedBy.lastName}` :
                                                            'Unknown'
                                                        }
                                                    </Text>
                                                    <Text>Updated: {editingLaborCost.updatedAt ? formatDate(editingLaborCost.updatedAt) : 'Unknown'}</Text>
                                                </VStack>
                                            }
                                            placement="top"
                                            hasArrow
                                        >
                                            <Text
                                                fontSize="xs"
                                                color="blue.500"
                                                cursor="help"
                                                textDecoration="underline"
                                                textDecorationStyle="dotted"
                                            >
                                                (Record Info)
                                            </Text>
                                        </Tooltip>
                                    )}
                                </HStack>
                                {editingLaborCost && (
                                    <Text fontSize="xs" color="gray.600">
                                        Job: {editingLaborCost.job?.jobNumber} - {editingLaborCost.job?.title} | Date: {formatDate(editingLaborCost.date)}
                                    </Text>
                                )}
                            </VStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody py={2}>
                            {editLoading ? (
                                <Box textAlign="center" py={6}>
                                    <Spinner size="lg" />
                                    <Text mt={2} fontSize="sm">Loading labor details...</Text>
                                </Box>
                            ) : (
                                <VStack spacing={4} align="stretch">
                                    {/* Labor Cost Details */}
                                    <Box>
                                        <Heading size="sm" mb={2}>Labor Cost Details</Heading>
                                        <FormControl>
                                            <FormLabel fontSize="sm" mb={1}>Description</FormLabel>
                                            <Textarea
                                                value={editingLaborCost?.description || ''}
                                                onChange={(e) => setEditingLaborCost(prev => ({
                                                    ...prev,
                                                    description: e.target.value
                                                }))}
                                                placeholder="Labor cost description..."
                                                rows={2}
                                                size="sm"
                                            />
                                        </FormControl>
                                    </Box>

                                    <Divider my={2} />

                                    {/* Labor Assignments */}
                                    <Box>
                                        <Heading size="sm" mb={2}>Labor Assignments</Heading>
                                        {editingAssignments.length > 0 ? (
                                            <TableContainer maxH="300px" overflowY="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                                                <Table variant="simple" size="xs" colorScheme="blue" layout="fixed">
                                                    <Thead position="sticky" top={0} bg="white" zIndex={1}>
                                                        <Tr>
                                                            <Th py={1} px={1} fontSize="xs">Worker</Th>
                                                            <Th py={1} px={1} fontSize="xs">Trade</Th>
                                                            <Th py={1} px={1} fontSize="xs">Time In</Th>
                                                            <Th py={1} px={1} fontSize="xs">Time Out</Th>
                                                            <Th py={1} px={1} fontSize="xs">OT Hours</Th>
                                                            {isWeekend(editingLaborCost?.date) && (
                                                                <Th py={1} px={1} fontSize="xs">
                                                                    Additional
                                                                    <Text fontSize="2xs" color="gray.500">
                                                                        ({isSaturday(editingLaborCost?.date) ? "Half" : "Full"})
                                                                    </Text>
                                                                </Th>
                                                            )}
                                                            <Th py={1} px={1} fontSize="xs">Total Cost</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {editingAssignments.map((assignment, index) => (
                                                            <Tr key={assignment.id}>
                                                                <Td py={1} px={1}>
                                                                    <VStack align="start" spacing={0}>
                                                                        <Text fontWeight="medium" fontSize="xs">{assignment.labor?.firstName} {assignment.labor?.lastName}</Text>
                                                                        <Text fontSize="2xs" color="gray.600">EPF: {assignment.labor?.epfNumber}</Text>
                                                                    </VStack>
                                                                </Td>
                                                                <Td py={1} px={1}>
                                                                    <Badge colorScheme="blue" size="xs" fontSize="2xs">
                                                                        {assignment.labor?.trade}
                                                                    </Badge>
                                                                </Td>
                                                                <Td py={1} px={1}>
                                                                    <Select
                                                                        value={assignment.timeIn}
                                                                        onChange={(e) => handleAssignmentChange(index, 'timeIn', e.target.value)}
                                                                        size="xs"
                                                                        fontSize="xs"
                                                                    >
                                                                        <option value="morning">Morning (8:30 AM)</option>
                                                                        <option value="afternoon">Afternoon (12:30 PM)</option>
                                                                    </Select>
                                                                </Td>
                                                                <Td py={1} px={1}>
                                                                    <Select
                                                                        value={assignment.timeOut}
                                                                        onChange={(e) => handleAssignmentChange(index, 'timeOut', e.target.value)}
                                                                        size="xs"
                                                                        fontSize="xs"
                                                                    >
                                                                        <option value="afternoon">Afternoon (12:30 PM)</option>
                                                                        <option value="evening">Evening (4:30 PM)</option>
                                                                    </Select>
                                                                </Td>
                                                                <Td py={1} px={1}>
                                                                    <NumberInput
                                                                        value={assignment.otHours}
                                                                        onChange={(valueString) => handleAssignmentChange(index, 'otHours', valueString)}
                                                                        min={0}
                                                                        max={12}
                                                                        precision={2}
                                                                        size="xs"
                                                                        maxW="80px"
                                                                    >
                                                                        <NumberInputField fontSize="xs" py={1} />
                                                                        <NumberInputStepper>
                                                                            <NumberIncrementStepper />
                                                                            <NumberDecrementStepper />
                                                                        </NumberInputStepper>
                                                                    </NumberInput>
                                                                </Td>
                                                                {isWeekend(editingLaborCost?.date) && (
                                                                    <Td py={1} px={1}>
                                                                        <Checkbox
                                                                            isChecked={assignment.hasWeekendPay || false}
                                                                            onChange={(e) => handleAssignmentChange(index, 'hasWeekendPay', e.target.checked)}
                                                                            colorScheme="blue"
                                                                            size="sm"
                                                                        >
                                                                            <Text fontSize="2xs" ml={1}>
                                                                                {isSaturday(editingLaborCost?.date) && "Half"}
                                                                                {isSunday(editingLaborCost?.date) && "Full"}
                                                                            </Text>
                                                                        </Checkbox>
                                                                    </Td>
                                                                )}
                                                                <Td py={1} px={1}>
                                                                    <Text fontWeight="bold" fontSize="xs" color="green.600">
                                                                        {formatCurrency(assignment.totalCost || 0)}
                                                                    </Text>
                                                                </Td>
                                                            </Tr>
                                                        ))}
                                                        <Tr bg="blue.50">
                                                            <Td colSpan={isWeekend(editingLaborCost?.date) ? 6 : 5} textAlign="right" py={1} px={1}>
                                                                <Text fontWeight="bold" fontSize="xs">Total Labor Cost:</Text>
                                                            </Td>
                                                            <Td py={1} px={1}>
                                                                <Text fontWeight="bold" fontSize="sm" color="green.600">
                                                                    {formatCurrency(editingAssignments.reduce((sum, assignment) =>
                                                                        // Use Number instead of parseFloat for more robust conversion
                                                                        sum + (Number(assignment.totalCost) || 0), 0
                                                                    ))}
                                                                </Text>
                                                            </Td>
                                                        </Tr>
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        ) : (
                                            <Text color="gray.500" fontSize="sm">No labor assignments found</Text>
                                        )}
                                    </Box>
                                </VStack>
                            )}
                        </ModalBody>
                        <ModalFooter py={3}>
                            <Button variant="ghost" mr={3} onClick={onEditClose} size="sm">
                                Cancel
                            </Button>
                            <Button
                                colorScheme="blue"
                                onClick={handleSaveEdit}
                                isLoading={editLoading}
                                loadingText="Saving..."
                                size="sm"
                            >
                                Save Changes
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Labor Assignments Modal */}
                <Modal isOpen={isOpen} onClose={onClose} size="6xl">
                    <ModalOverlay />
                    <ModalContent>
                        <ModalHeader py={3}>
                            <VStack align="start" spacing={1}>
                                <HStack spacing={2} align="center">
                                    <Heading size="sm">Labor Assignment Details</Heading>
                                    {selectedLaborCost && (
                                        <Tooltip
                                            label={
                                                <VStack align="start" spacing={1} fontSize="xs">
                                                    <Text fontWeight="bold">Record Information</Text>
                                                    <Text>
                                                        Created by: {selectedLaborCost.createdBy ?
                                                            `${selectedLaborCost.createdBy.firstName} ${selectedLaborCost.createdBy.lastName}` :
                                                            'Unknown'
                                                        }
                                                    </Text>
                                                    <Text>Created: {selectedLaborCost.createdAt ? formatDate(selectedLaborCost.createdAt) : 'Unknown'}</Text>
                                                    <Text>
                                                        Updated by: {selectedLaborCost.updatedBy ?
                                                            `${selectedLaborCost.updatedBy.firstName} ${selectedLaborCost.updatedBy.lastName}` :
                                                            'Unknown'
                                                        }
                                                    </Text>
                                                    <Text>Updated: {selectedLaborCost.updatedAt ? formatDate(selectedLaborCost.updatedAt) : 'Unknown'}</Text>
                                                </VStack>
                                            }
                                            placement="top"
                                            hasArrow
                                        >
                                            <Text
                                                fontSize="xs"
                                                color="blue.500"
                                                cursor="help"
                                                textDecoration="underline"
                                                textDecorationStyle="dotted"
                                            >
                                                (Record Info)
                                            </Text>
                                        </Tooltip>
                                    )}
                                </HStack>
                                {selectedLaborCost && (
                                    <HStack spacing={3} flexWrap="wrap" fontSize="sm">
                                        <Text color="gray.600">
                                            <strong>Job:</strong> {selectedLaborCost.job?.jobNumber} - {selectedLaborCost.job?.title}
                                        </Text>
                                        <Text color="gray.600">
                                            <strong>Date:</strong> {formatDate(selectedLaborCost.date)}
                                        </Text>
                                        <Text color="gray.600">
                                            <strong>Total Cost:</strong> {formatCurrency(selectedLaborCost.cost)}
                                        </Text>
                                    </HStack>
                                )}
                            </VStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pt={2} pb={3}>
                            {assignmentsLoading ? (
                                <Box textAlign="center" py={4}>
                                    <Spinner size="md" />
                                    <Text mt={2} fontSize="sm">Loading labor assignments...</Text>
                                </Box>
                            ) : (
                                <VStack spacing={3} align="stretch">
                                    {/* Summary Cards */}
                                    {laborAssignments.length > 0 && (
                                        <SimpleGrid columns={{ base: 2, md: isWeekend(selectedLaborCost?.date) ? 5 : 4 }} spacing={2} bg="gray.50" p={2} borderRadius="md">
                                            <Stat size="sm" p={1}>
                                                <StatLabel fontSize="xs">Total Workers</StatLabel>
                                                <StatNumber fontSize="lg">{calculateSummary(laborAssignments).totalLabors}</StatNumber>
                                                <StatHelpText fontSize="xs" mt={0}>
                                                    <FiEye style={{ display: 'inline', marginRight: '2px' }} />
                                                    Assigned
                                                </StatHelpText>
                                            </Stat>
                                            <Stat size="sm" p={1}>
                                                <StatLabel fontSize="xs">Regular Hours</StatLabel>
                                                <StatNumber fontSize="lg">{calculateSummary(laborAssignments).totalRegularHours}</StatNumber>
                                                <StatHelpText fontSize="xs" mt={0}>
                                                    <FiClock style={{ display: 'inline', marginRight: '2px' }} />
                                                    Total
                                                </StatHelpText>
                                            </Stat>
                                            <Stat size="sm" p={1}>
                                                <StatLabel fontSize="xs">OT Hours</StatLabel>
                                                <StatNumber fontSize="lg">{calculateSummary(laborAssignments).totalOtHours}</StatNumber>
                                                <StatHelpText fontSize="xs" mt={0}>
                                                    <FiClock style={{ display: 'inline', marginRight: '2px' }} />
                                                    Overtime
                                                </StatHelpText>
                                            </Stat>
                                            {isWeekend(selectedLaborCost?.date) && (
                                                <Stat size="sm" p={1}>
                                                    <StatLabel fontSize="xs">Weekend Pay</StatLabel>
                                                    <StatNumber fontSize="lg">{formatCurrency(calculateSummary(laborAssignments).totalWeekendPayCost)}</StatNumber>
                                                    <StatHelpText fontSize="xs" mt={0}>
                                                        <FiDollarSign style={{ display: 'inline', marginRight: '2px' }} />
                                                        {getWeekendPayLabel(selectedLaborCost?.date)}
                                                    </StatHelpText>
                                                </Stat>
                                            )}
                                            <Stat size="sm" p={1}>
                                                <StatLabel fontSize="xs">Total Cost</StatLabel>
                                                <StatNumber fontSize="lg">{formatCurrency(calculateSummary(laborAssignments).totalCost)}</StatNumber>
                                                <StatHelpText fontSize="xs" mt={0}>
                                                    <FiDollarSign style={{ display: 'inline', marginRight: '2px' }} />
                                                    Calculated
                                                </StatHelpText>
                                            </Stat>
                                        </SimpleGrid>
                                    )}

                                    <Divider my={1} />

                                    {/* Labor Assignments Table */}
                                    {laborAssignments.length > 0 ? (
                                        <Box>
                                            <Heading size="xs" mb={2}>Labor Assignments</Heading>
                                            <TableContainer whiteSpace="normal" maxH="400px" overflowY="auto" borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                                                <Table variant="simple" size="xs" colorScheme="blue" layout="fixed">
                                                    <Thead position="sticky" top={0} bg="white" zIndex={1}>
                                                        <Tr>
                                                            <Th py={1} px={1} fontSize="xs">EPF No.</Th>
                                                            <Th py={1} px={1} fontSize="xs">Worker Name</Th>
                                                            <Th py={1} px={1} fontSize="xs">Trade</Th>
                                                            <Th py={1} px={1} fontSize="xs">Time In</Th>
                                                            <Th py={1} px={1} fontSize="xs">Time Out</Th>
                                                            <Th py={1} px={1} fontSize="xs">Hours</Th>
                                                            <Th py={1} px={1} fontSize="xs">OT Hrs</Th>
                                                            <Th py={1} px={1} fontSize="xs">Reg. Cost</Th>
                                                            <Th py={1} px={1} fontSize="xs">OT Cost</Th>
                                                            {isWeekend(selectedLaborCost?.date) && (
                                                                <Th py={1} px={1} fontSize="xs">
                                                                    Additional
                                                                    <Text fontSize="2xs" color="gray.500">
                                                                        ({isSaturday(selectedLaborCost?.date) ? "Half" : "Full"})
                                                                    </Text>
                                                                </Th>
                                                            )}
                                                            <Th py={1} px={1} fontSize="xs">Total Cost</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {laborAssignments.map((assignment) => (
                                                            <Tr key={assignment.id}>
                                                                <Td py={1} px={1} fontWeight="medium">{assignment.labor?.epfNumber}</Td>
                                                                <Td py={1} px={1}>{assignment.labor?.firstName} {assignment.labor?.lastName}</Td>
                                                                <Td py={1} px={1}>
                                                                    <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                                                                        {assignment.labor?.trade}
                                                                    </Badge>
                                                                </Td>
                                                                <Td py={1} px={1} fontSize="sm">{formatTimeSlot(assignment.timeIn)}</Td>
                                                                <Td py={1} px={1} fontSize="sm">{formatTimeSlot(assignment.timeOut)}</Td>
                                                                <Td py={1} px={1} fontSize="sm">{getWorkingHours(assignment.timeIn, assignment.timeOut)}</Td>
                                                                <Td py={1} px={1} fontSize="sm">{assignment.otHours || 0}</Td>
                                                                <Td py={1} px={1} fontSize="sm">{formatCurrency(assignment.regularCost || 0)}</Td>
                                                                <Td py={1} px={1} fontSize="sm">{formatCurrency(assignment.otCost || 0)}</Td>
                                                                {isWeekend(selectedLaborCost?.date) && (
                                                                    <Td py={1} px={1} fontSize="sm">
                                                                        {assignment.hasWeekendPay ? (
                                                                            <VStack spacing={0} align="center">
                                                                                <Text fontSize="sm" fontWeight="medium" color="orange.600">
                                                                                    {formatCurrency(assignment.weekendPayCost || 0)}
                                                                                </Text>
                                                                            </VStack>
                                                                        ) : (
                                                                            <Text fontSize="xs" color="gray.400">
                                                                                N/A
                                                                            </Text>
                                                                        )}
                                                                    </Td>
                                                                )}
                                                                <Td py={1} px={1} fontWeight="bold" fontSize="sm">{formatCurrency(assignment.totalCost || 0)}</Td>
                                                            </Tr>
                                                        ))}
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    ) : (
                                        <Box textAlign="center" py={4} borderWidth="1px" borderColor="gray.200" borderRadius="md" bg="gray.50">
                                            <VStack spacing={2}>
                                                <Heading size="xs" color="gray.500">No labor assignments found</Heading>
                                                <Text fontSize="sm" color="gray.400">
                                                    This labor cost record doesn't have detailed labor assignments.
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    This might be an older record created before the assignment tracking was implemented.
                                                </Text>
                                            </VStack>
                                        </Box>
                                    )}
                                </VStack>
                            )}
                        </ModalBody>
                        <ModalFooter py={2}>
                            <Button colorScheme="blue" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Delete Confirmation Dialog */}
                <AlertDialog
                    isOpen={isDeleteOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={handleCancelDelete}
                >
                    <AlertDialogOverlay>
                        <AlertDialogContent>
                            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                Delete Labor Cost Record
                            </AlertDialogHeader>

                            <AlertDialogBody>
                                {deletingLaborCost && (
                                    <VStack align="start" spacing={2}>
                                        <Text>
                                            Are you sure you want to delete this labor cost record? This action cannot be undone.
                                        </Text>
                                        <Box p={3} bg="gray.50" borderRadius="md" w="100%">
                                            <Text fontSize="sm" fontWeight="medium">
                                                <strong>Job:</strong> {deletingLaborCost.job?.jobNumber} - {deletingLaborCost.job?.title}
                                            </Text>
                                            <Text fontSize="sm">
                                                <strong>Date:</strong> {formatDate(deletingLaborCost.date)}
                                            </Text>
                                            <Text fontSize="sm">
                                                <strong>Cost:</strong> {formatCurrency(deletingLaborCost.cost)}
                                            </Text>
                                            <Text fontSize="sm" color="gray.600">
                                                <strong>Description:</strong> {deletingLaborCost.description || 'No description'}
                                            </Text>
                                        </Box>
                                        <Text fontSize="sm" color="red.600" fontWeight="medium">
                                            ⚠️ This will also delete all related labor assignment records.
                                        </Text>
                                    </VStack>
                                )}
                            </AlertDialogBody>

                            <AlertDialogFooter>
                                <Button ref={cancelRef} onClick={handleCancelDelete} size="sm">
                                    Cancel
                                </Button>
                                <Button
                                    colorScheme="red"
                                    onClick={handleConfirmDelete}
                                    ml={3}
                                    size="sm"
                                    isLoading={deleteLoading}
                                    loadingText="Deleting..."
                                >
                                    Delete
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialogOverlay>
                </AlertDialog>
            </VStack>
        </Container>
    );
};

export default CreateNewProject;