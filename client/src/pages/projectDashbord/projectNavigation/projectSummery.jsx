import React, { useState, useEffect } from "react";
import {
    Box, Grid, GridItem, Flex, Text, Heading, VStack, HStack, Button, Progress, Badge, Link,
    Table, Thead, Tbody, Tr, Th, Td, TableContainer, Spinner, Alert, AlertIcon,
    Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Divider, SimpleGrid,
    Card, CardHeader, CardBody, Icon, useColorModeValue
} from "@chakra-ui/react";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Users, CheckCircle, AlertTriangle, Clock, Activity } from "lucide-react";
import { AiFillCreditCard } from "react-icons/ai";
import { MdNotificationsActive, MdAttachMoney, MdTrendingUp } from "react-icons/md";
import { IoCloudDone } from "react-icons/io5";
import { HiOutlineWifi } from "react-icons/hi";
import { FiUsers, FiClipboard, FiBriefcase, FiCheckSquare, FiAlertCircle, FiClock, FiActivity } from "react-icons/fi";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';

import { projectAPI } from "../../../api/projects.js";
import { contractorAPI } from "../../../api/contractors.js";
import { agreementAPI } from "../../../api/agreements.js";
import { useAuth } from "../../../contexts/AuthContext.jsx";

export default function Projectsummery() {
    const { user } = useAuth();
    const bg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [contractors, setContractors] = useState([]);
    const [agreements, setAgreements] = useState([]);

    // Fetch data
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [projectsRes, contractorsRes, agreementsRes] = await Promise.all([
                projectAPI.getAll(),
                contractorAPI.getAll(),
                agreementAPI.getAll()
            ]);

            // Parse projects
            let projectsList = [];
            if (projectsRes?.data?.projects) projectsList = projectsRes.data.projects;
            else if (projectsRes?.data && Array.isArray(projectsRes.data)) projectsList = projectsRes.data;
            else if (Array.isArray(projectsRes)) projectsList = projectsRes;

            // Parse contractors
            let contractorsList = [];
            if (contractorsRes?.data?.contractors) contractorsList = contractorsRes.data.contractors;
            else if (contractorsRes?.data && Array.isArray(contractorsRes.data)) contractorsList = contractorsRes.data;
            else if (Array.isArray(contractorsRes)) contractorsList = contractorsRes;

            // Parse agreements
            let agreementsList = [];
            if (agreementsRes?.data && Array.isArray(agreementsRes.data)) agreementsList = agreementsRes.data;
            else if (Array.isArray(agreementsRes)) agreementsList = agreementsRes;

            // Apply status rules to projects
            const processedProjects = projectsList.map(project => ({
                ...project,
                calculatedStatus: calculateProjectStatus(project)
            }));

            setProjects(processedProjects);
            setContractors(contractorsList);
            setAgreements(agreementsList);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    // Calculate project status based on rules
    const calculateProjectStatus = (project) => {
        const progress = project.completedPercent || 0;
        const endDate = project.endDate ? new Date(project.endDate) : null;
        const today = new Date();

        // Rule 1: If progress is 100%, status = "Completed"
        if (progress >= 100) {
            return "Completed";
        }

        // Rule 2: If deadline has passed and progress < 100%, status = "Delayed"
        if (endDate && endDate < today && progress < 100) {
            return "Delayed";
        }

        // Rule 3: If deadline is near (< 10 days) and progress < 100%, status = "Attention"
        if (endDate) {
            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            if (daysRemaining <= 10 && daysRemaining >= 0 && progress < 100) {
                return "Attention";
            }
        }

        // Rule 4: Otherwise, status = "Doing"
        return "Doing";
    };

    // Calculate statistics
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.calculatedStatus === "Completed").length;
    const activeProjects = projects.filter(p => p.calculatedStatus === "Doing").length;
    const delayedProjects = projects.filter(p => p.calculatedStatus === "Delayed").length;
    const attentionProjects = projects.filter(p => p.calculatedStatus === "Attention").length;

    // Financial calculations from agreements
    const totalAgreementSum = agreements.reduce((sum, a) => sum + (a.agreementSum || 0), 0);
    const totalVat = agreements.reduce((sum, a) => sum + (a.vat || 0), 0);
    const totalRevenue = totalAgreementSum;
    const totalExpenses = totalAgreementSum * 0.7; // Estimated 70% of agreement as expenses
    const totalProfit = totalRevenue - totalExpenses;

    // Project overview cycle data (pie chart)
    const projectCycleData = [
        { name: "Completed", value: completedProjects, color: "#10b981" },
        { name: "Doing", value: activeProjects, color: "#3b82f6" },
        { name: "Attention", value: attentionProjects, color: "#f59e0b" },
        { name: "Delayed", value: delayedProjects, color: "#ef4444" },
    ].filter(item => item.value > 0);

    // Revenue overview data (monthly)
    const revenueData = [
        { month: "Jan", revenue: totalRevenue * 0.08, expenses: totalExpenses * 0.08 },
        { month: "Feb", revenue: totalRevenue * 0.09, expenses: totalExpenses * 0.09 },
        { month: "Mar", revenue: totalRevenue * 0.07, expenses: totalExpenses * 0.07 },
        { month: "Apr", revenue: totalRevenue * 0.1, expenses: totalExpenses * 0.1 },
        { month: "May", revenue: totalRevenue * 0.08, expenses: totalExpenses * 0.08 },
        { month: "Jun", revenue: totalRevenue * 0.09, expenses: totalExpenses * 0.09 },
        { month: "Jul", revenue: totalRevenue * 0.11, expenses: totalExpenses * 0.11 },
        { month: "Aug", revenue: totalRevenue * 0.1, expenses: totalExpenses * 0.1 },
        { month: "Sep", revenue: totalRevenue * 0.08, expenses: totalExpenses * 0.08 },
        { month: "Oct", revenue: totalRevenue * 0.07, expenses: totalExpenses * 0.07 },
        { month: "Nov", revenue: totalRevenue * 0.06, expenses: totalExpenses * 0.06 },
        { month: "Dec", revenue: totalRevenue * 0.07, expenses: totalExpenses * 0.07 },
    ];

    // Work steps/activities
    const workSteps = [
        { icon: "📦", step: "1. Planning & Feasibility", description: "Identify needs, budget estimation, site selection, feasibility study", status: "info" },
        { icon: "✅", step: "2. Design & Documentation", description: "Architectural, structural, electrical designs, BOQ, approvals", status: "info" },
        { icon: "👤", step: "3. Tendering & Contracting", description: "Tender documents, invite contractors, evaluate bids, sign contract", status: "info" },
        { icon: "🏗️", step: "4. Construction", description: "Foundation, superstructure, roofing, electrical, plumbing, finishing", status: "info" },
        { icon: "📊", step: "5. Monitoring & Quality Control", description: "Site supervision, quality checks, safety, progress control", status: "info" },
        { icon: "🔧", step: "6. Testing & Commissioning", description: "Electrical, plumbing, equipment testing, final inspections", status: "info" },
        { icon: "🎉", step: "7. Handover & Completion", description: "Final inspection, snag list, handover, occupancy certificate", status: "info" },
        { icon: "🔧", step: "8. Maintenance", description: "Defect liability period, repairs, regular maintenance", status: "info" },
    ];

    // Status badge color helper
    const getStatusColor = (status) => {
        switch (status) {
            case "Completed": return "green";
            case "Doing": return "blue";
            case "Attention": return "orange";
            case "Delayed": return "red";
            default: return "gray";
        }
    };

    // Stats cards data
    const statsCards = [
        { icon: FiClipboard, title: "Total Projects", value: totalProjects, color: "#10b981", bgColor: "green" },
        { icon: FiActivity, title: "Active Projects", value: activeProjects, color: "#3b82f6", bgColor: "blue" },
        { icon: FiCheckSquare, title: "Completed", value: completedProjects, color: "#a855f7", bgColor: "purple" },
        { icon: FiClock, title: "Delayed", value: delayedProjects, color: "#ef4444", bgColor: "red" },
    ];

    const financialCards = [
        { icon: MdAttachMoney, title: "Total Revenue", value: totalRevenue, color: "#10b981", prefix: "Rs." },
        { icon: AiFillCreditCard, title: "Total Expenses", value: totalExpenses, color: "#f59e0b", prefix: "Rs." },
        { icon: MdTrendingUp, title: "Total Profit", value: totalProfit, color: "#3b82f6", prefix: "Rs." },
    ];

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

    if (loading) {
        return (
            <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="400px">
                <VStack spacing={4}>
                    <Spinner size="xl" color="blue.500" />
                    <Text>Loading dashboard data...</Text>
                </VStack>
            </Box>
        );
    }

    return (
        <Box p={6} bg="gray.50" minH="100vh" overflowY="auto">
            {/* Header */}
            <Box mb={6}>
                <Heading size="lg" mb={2}>Project Summary Dashboard</Heading>
                <Text color="gray.600">Welcome back, {user?.firstName || "User"}! Here's your project overview.</Text>
            </Box>

            {error && (
                <Alert status="error" mb={4} borderRadius="md">
                    <AlertIcon />
                    {error}
                </Alert>
            )}

            {/* ==================== PROJECT STATISTICS ==================== */}
            <Box mb={6}>
                <Heading size="md" mb={4}>📊 Project Statistics</Heading>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
                    {statsCards.map((card, idx) => (
                        <Box key={idx} bg="white" rounded="xl" p={5} shadow="sm" border="1px" borderColor="gray.100">
                            <Flex align="center" mb={3}>
                                <Box w={12} h={12} rounded="lg" bg={`${card.bgColor}.100`} display="flex" alignItems="center" justifyContent="center" mr={4}>
                                    <Icon as={card.icon} boxSize={6} color={`${card.bgColor}.600`} />
                                </Box>
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" color="gray.500">{card.title}</Text>
                                    <Heading size="lg">{card.value}</Heading>
                                </VStack>
                            </Flex>
                            <Flex align="center" gap={2}>
                                <TrendingUp size={14} color={card.color} />
                                <Text fontSize="xs" color="gray.500">Updated just now</Text>
                            </Flex>
                        </Box>
                    ))}
                </Grid>
            </Box>

            {/* ==================== FINANCIAL OVERVIEW ==================== */}
            <Box mb={6}>
                <Heading size="md" mb={4}>💰 Financial Overview</Heading>
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
                    {financialCards.map((card, idx) => (
                        <Box key={idx} bg="white" rounded="xl" p={5} shadow="sm" border="1px" borderColor="gray.100">
                            <Flex align="center" mb={3}>
                                <Box w={12} h={12} rounded="lg" bg={`${card.color}20`} display="flex" alignItems="center" justifyContent="center" mr={4}>
                                    <Icon as={card.icon} boxSize={6} color={card.color} />
                                </Box>
                                <VStack align="start" spacing={0}>
                                    <Text fontSize="sm" color="gray.500">{card.title}</Text>
                                    <Heading size="md">{card.prefix}{card.value.toLocaleString()}</Heading>
                                </VStack>
                            </Flex>
                            <Progress value={idx === 2 ? 100 : (idx === 0 ? 100 : 70)} colorScheme={idx === 2 ? "green" : (idx === 0 ? "blue" : "orange")} size="sm" borderRadius="full" />
                        </Box>
                    ))}
                </Grid>
            </Box>

            {/* ==================== REVENUE OVERVIEW & PROJECT CYCLE ==================== */}
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6} mb={6}>
                {/* Revenue Overview */}
                <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px" borderColor="gray.100">
                    <Heading size="md" mb={2}>📈 Revenue Overview</Heading>
                    <Text fontSize="sm" color="gray.500" mb={4}>Monthly revenue and expenses breakdown</Text>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                            <Tooltip formatter={(value) => `Rs.${value.toLocaleString()}`} />
                            <Legend />
                            <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Revenue" />
                            <Area type="monotone" dataKey="expenses" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Expenses" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Box>

                {/* Project Overview Cycle */}
                <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px" borderColor="gray.100">
                    <Heading size="md" mb={2}>🔄 Project Overview Cycle</Heading>
                    <Text fontSize="sm" color="gray.500" mb={4}>Distribution by status</Text>
                    {projectCycleData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={projectCycleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {projectCycleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <Box textAlign="center" py={10}>
                            <Text color="gray.500">No project data available</Text>
                        </Box>
                    )}
                </Box>
            </Grid>

            {/* ==================== PROJECT TABLE ==================== */}
            <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px" borderColor="gray.100" mb={6}>
                <Heading size="md" mb={4}>📋 Project Table</Heading>
                <TableContainer>
                    <Table size="sm" variant="simple">
                        <Thead bg="gray.50">
                            <Tr>
                                <Th>Project ID</Th>
                                <Th>Project Name</Th>
                                <Th>Start Date</Th>
                                <Th>End Date</Th>
                                <Th>Budget</Th>
                                <Th>Progress</Th>
                                <Th>Status</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {projects.length > 0 ? projects.map((project) => (
                                <Tr key={project.id} _hover={{ bg: "gray.50" }}>
                                    <Td fontWeight="medium">{project.projectId}</Td>
                                    <Td>{project.projectName}</Td>
                                    <Td>{project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}</Td>
                                    <Td>{project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A"}</Td>
                                    <Td>Rs.{(project.agreement?.agreementSum || 0).toLocaleString()}</Td>
                                    <Td>
                                        <Flex align="center" gap={2}>
                                            <Progress value={project.completedPercent || 0} size="sm" colorScheme={getStatusColor(project.calculatedStatus)} w="60px" borderRadius="full" />
                                            <Text fontSize="xs">{project.completedPercent || 0}%</Text>
                                        </Flex>
                                    </Td>
                                    <Td>
                                        <Badge colorScheme={getStatusColor(project.calculatedStatus)} borderRadius="full" px={2}>
                                            {project.calculatedStatus}
                                        </Badge>
                                    </Td>
                                </Tr>
                            )) : (
                                <Tr>
                                    <Td colSpan={7} textAlign="center" py={8}>
                                        <Text color="gray.500">No projects found</Text>
                                    </Td>
                                </Tr>
                            )}
                        </Tbody>
                    </Table>
                </TableContainer>
            </Box>

            {/* ==================== CONTRACTORS & WORK STEPS ==================== */}
            <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px" borderColor="gray.100" mb={6}>
                <Heading size="md" mb={4}>📝 Project Work Progress Steps</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {workSteps.map((step, idx) => (
                        <Flex
                            key={idx}
                            p={3}
                            bg={idx < 3 ? "green.50" : idx < 6 ? "blue.50" : "gray.50"}
                            rounded="lg"
                            align="start"
                            gap={3}
                        >
                            <Text fontSize="xl">{step.icon}</Text>

                            <VStack align="start" spacing={0} flex={1}>
                                <Text fontWeight="medium" fontSize="sm">
                                    {step.step}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                    {step.description}
                                </Text>
                            </VStack>

                            <Badge
                                colorScheme={idx < 3 ? "green" : idx < 6 ? "blue" : "gray"}
                                fontSize="xs"
                            >
                                {idx < 3 ? "Completed" : idx < 6 ? "Ongoing" : "Pending"}
                            </Badge>
                        </Flex>
                    ))}
                </SimpleGrid>
            </Box>

            {/* ==================== PROJECT STATUS RULES SUMMARY ==================== */}
            <Box bg="white" rounded="xl" p={5} shadow="sm" border="1px" borderColor="gray.100">
                <Heading size="md" mb={4}>📜 Project Status Rules</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Box p={4} bg="green.50" rounded="lg" borderLeft="4px" borderColor="green.500">
                        <HStack mb={2}>
                            <CheckCircle size={18} color="#10b981" />
                            <Text fontWeight="bold" color="green.700">Completed</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">Progress = 100%</Text>
                    </Box>
                    <Box p={4} bg="red.50" rounded="lg" borderLeft="4px" borderColor="red.500">
                        <HStack mb={2}>
                            <AlertTriangle size={18} color="#ef4444" />
                            <Text fontWeight="bold" color="red.700">Delayed</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">End date passed & progress {"<"} 100%</Text>
                    </Box>
                    <Box p={4} bg="orange.50" rounded="lg" borderLeft="4px" borderColor="orange.500">
                        <HStack mb={2}>
                            <AlertTriangle size={18} color="#f59e0b" />
                            <Text fontWeight="bold" color="orange.700">Attention</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">{"<"} 10 days remaining & progress {"<"} 100%</Text>
                    </Box>
                    <Box p={4} bg="blue.50" rounded="lg" borderLeft="4px" borderColor="blue.500">
                        <HStack mb={2}>
                            <Activity size={18} color="#3b82f6" />
                            <Text fontWeight="bold" color="blue.700">Doing</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">Active work in progress</Text>
                    </Box>
                </SimpleGrid>
            </Box>
        </Box>
    );
}
