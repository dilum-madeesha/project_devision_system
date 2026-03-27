import {
    Container,
    VStack,
    Heading,
    Box,
    FormControl,
    FormLabel,
    Input,
    Button,
    HStack,
    useColorModeValue,
    useToast,
    Alert,
    AlertIcon,
    NumberInput,
    NumberInputField,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    Select,
    Grid,
    GridItem,
    Flex,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { agreementAPI } from "../../../api/agreements.js";

const AddAgreement = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const bg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const headerBg = useColorModeValue("#dcfce7", "gray.700");
    const textColor = useColorModeValue("gray.600", "gray.400");

    const [formData, setFormData] = useState({
        agreementNo: "",
        agreementID: "",
        projectName: "",
        agreementSum: "",
        vat: "",
        periodDays: "",
        awardDate: "",
        startDate: "",
        completionDate: "",
        status: "ACTIVE",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleNumberChange = (name, valueAsString) => {
        setFormData((prev) => ({
            ...prev,
            [name]: valueAsString,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.agreementNo || !formData.projectName || !formData.agreementSum) {
            setError("Please fill in all required fields (Agreement No, Project Name, Agreement Sum)");
            setLoading(false);
            return;
        }

        try {
            const submitData = {
                agreementNo: formData.agreementNo,
                agreementID: formData.agreementID || null,
                projectName: formData.projectName,
                agreementSum: parseFloat(formData.agreementSum),
                vat: formData.vat ? parseFloat(formData.vat) : 0,
                periodDays: formData.periodDays ? parseInt(formData.periodDays, 10) : null,
                awardDate: formData.awardDate ? new Date(formData.awardDate).toISOString() : null,
                startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
                completionDate: formData.completionDate ? new Date(formData.completionDate).toISOString() : null,
                status: formData.status,
            };

            await agreementAPI.create(submitData);

            toast({
                title: "Success",
                description: "Agreement created successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            navigate("/projectregister/agreements");
        } catch (err) {
            console.error("Agreement creation error:", err);
            setError(
                err.response?.data?.message || "Failed to create agreement"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxW="1000px" py={0.1}>
            <VStack spacing={4} align="stretch">
                {/* Breadcrumb */}
                <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
                    <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/projectregister" color="green.500">
                            Register
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbLink as={Link} to="/projectregister/agreements" color="green.500">
                            Project Agreements
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>
                        <BreadcrumbLink
                            color="green.500"
                            fontWeight="bold"
                            fontSize="x-large"
                        >
                            New Agreement
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                </Breadcrumb>

                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error}
                    </Alert>
                )}

                <Box
                    bg={bg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    boxShadow="md"
                >
                    {/* Card Header */}
                    {/* <Box bg={headerBg} p={6} borderBottom="1px solid" borderColor={borderColor} borderTopRadius="lg">
                        <Heading size="md" color="green.600" fontWeight="bold">
                            New Agreement
                        </Heading>
                    </Box> */}

                    {/* Card Body */}
                    <Box p={6}>
                    <form onSubmit={handleSubmit}>
                        <VStack spacing={6}>
                            {/* Agreement No */}
                            <FormControl isRequired>
                                <FormLabel>Agreement No</FormLabel>
                                <Input
                                    name="agreementNo"
                                    value={formData.agreementNo}
                                    onChange={handleChange}
                                    placeholder="Enter agreement number (e.g., AGR-001)"
                                    borderColor={borderColor}
                                />
                            </FormControl>

                            {/* Agreement ID */}
                            <FormControl>
                                <FormLabel>Agreement ID (Optional)</FormLabel>
                                <Input
                                    name="agreementID"
                                    value={formData.agreementID}
                                    onChange={handleChange}
                                    placeholder="Enter agreement ID"
                                    borderColor={borderColor}
                                />
                            </FormControl>

                            {/* Project Name */}
                            <FormControl isRequired>
                                <FormLabel>Project Name</FormLabel>
                                <Input
                                    name="projectName"
                                    value={formData.projectName}
                                    onChange={handleChange}
                                    placeholder="Enter project name"
                                    borderColor={borderColor}
                                />
                            </FormControl>

                            {/* Agreement Sum + VAT */}
                            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} w="full">
                                <GridItem>
                                    <FormControl isRequired>
                                        <FormLabel>Agreement Sum (Rs.)</FormLabel>
                                        <NumberInput
                                            min={0}
                                            precision={2}
                                            value={formData.agreementSum}
                                            onChange={(valueAsString) =>
                                                handleNumberChange("agreementSum", valueAsString)
                                            }
                                        >
                                            <NumberInputField placeholder="Enter agreement sum" borderColor={borderColor} />
                                        </NumberInput>
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel>VAT (%)</FormLabel>
                                        <NumberInput
                                            min={0}
                                            precision={2}
                                            value={formData.vat}
                                            onChange={(valueAsString) =>
                                                handleNumberChange("vat", valueAsString)
                                            }
                                        >
                                            <NumberInputField placeholder="Enter VAT percentage" borderColor={borderColor} />
                                        </NumberInput>
                                    </FormControl>
                                </GridItem>
                            </Grid>

                            {/* Period Days */}
                            <FormControl w="full">
                                <FormLabel>Period (days)</FormLabel>
                                <NumberInput
                                    min={0}
                                    value={formData.periodDays}
                                    onChange={(valueAsString) =>
                                        handleNumberChange("periodDays", valueAsString)
                                    }
                                >
                                    <NumberInputField placeholder="Enter period in days" borderColor={borderColor} />
                                </NumberInput>
                            </FormControl>

                            {/* Dates */}
                            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} w="full">
                                <GridItem>
                                    <FormControl>
                                        <FormLabel>Award Date</FormLabel>
                                        <Input
                                            type="date"
                                            name="awardDate"
                                            value={formData.awardDate}
                                            onChange={handleChange}
                                            borderColor={borderColor}
                                        />
                                    </FormControl>
                                </GridItem>
                                <GridItem>
                                    <FormControl>
                                        <FormLabel>Start Date</FormLabel>
                                        <Input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            borderColor={borderColor}
                                        />
                                    </FormControl>
                                </GridItem>
                            </Grid>

                            <FormControl w="full">
                                <FormLabel>Completion Date</FormLabel>
                                <Input
                                    type="date"
                                    name="completionDate"
                                    value={formData.completionDate}
                                    onChange={handleChange}
                                    borderColor={borderColor}
                                />
                            </FormControl>
                            {/* Status Field */}
                            <FormControl w="full">
                                <FormLabel>Status</FormLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    borderColor={borderColor}
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </Select>
                            </FormControl>

                            {/* Buttons */}
                            <Flex gap={4} w="full" pt={4}>
                                <Button
                                    type="submit"
                                    colorScheme="green"
                                    isLoading={loading}
                                    loadingText="Creating..."
                                    flex={1}
                                >
                                    Create Agreement
                                </Button>
                                <Link to="/projectregister/agreements">
                                    <Button variant="outline" flex={1}>
                                        Cancel
                                    </Button>
                                </Link>
                            </Flex>
                        </VStack>
                    </form>
                    </Box>
                </Box>
            </VStack>
        </Container>
    );
};

export default AddAgreement;