import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Flex,
  Text,
  Heading,
  VStack,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Avatar,
  HStack,
  Progress,
} from "@chakra-ui/react";
import { TrendingUp, Calendar, DollarSign, Users, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { AiFillCreditCard } from "react-icons/ai";
import { MdNotificationsActive } from "react-icons/md";
import { IoCloudDone } from "react-icons/io5";
import { HiOutlineWifi } from "react-icons/hi";

import RevenueChart from "../../../components/revenueChart";
import SalesChart from "../../../components/salesChart";
import { projectAPI, contractorAPI } from "../../../api";

export default function Projectsum() {
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, contractorsRes] = await Promise.all([
        projectAPI.getAll(),
        contractorAPI.getAll(),
      ]);

      // Parse projects
      let projectsList = [];
      if (projectsRes?.data?.projects) {
        projectsList = projectsRes.data.projects;
      } else if (projectsRes?.data) {
        projectsList = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      } else if (Array.isArray(projectsRes)) {
        projectsList = projectsRes;
      }

      // Parse contractors
      let contractorsList = [];
      if (contractorsRes?.data?.contractors) {
        contractorsList = contractorsRes.data.contractors;
      } else if (contractorsRes?.data) {
        contractorsList = Array.isArray(contractorsRes.data) ? contractorsRes.data : [];
      } else if (Array.isArray(contractorsRes)) {
        contractorsList = contractorsRes;
      }

      setProjects(projectsList);
      setContractors(contractorsList);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate project status
  const calculateProjectStatus = (project) => {
    const progress = project.completedPercent || 0;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const today = new Date();

    if (progress >= 100) return "Completed";
    if (endDate && endDate < today && progress < 100) return "Delayed";
    if (endDate) {
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 10 && daysRemaining >= 0 && progress < 100) return "Attention";
    }
    return "Doing";
  };

  // Calculate statistics
  const totalProjects = projects.length;
  const completedProjects = projects.filter((p) => calculateProjectStatus(p) === "Completed").length;
  const activeProjects = projects.filter((p) => calculateProjectStatus(p) === "Doing").length;
  const delayedProjects = projects.filter((p) => calculateProjectStatus(p) === "Delayed").length;
  const attentionProjects = projects.filter((p) => calculateProjectStatus(p) === "Attention").length;

  // Calculate financials
  const totalExpenses = projects.reduce((sum, p) => sum + (parseFloat(p.totalExpense) || 0), 0);
  // totalRevenue and profit have been removed as per requirements

  const cards = [
    { icon: <AiFillCreditCard />, title: "Total Projects", value: totalProjects, color1: "#10b981", color2: "#059669" },
    { icon: <MdNotificationsActive />, title: "Active Projects", value: activeProjects + attentionProjects, color1: "#3b82f6", color2: "#06b6d4" },
    { icon: <IoCloudDone />, title: "Complete Projects", value: completedProjects, color1: "#a855f7", color2: "#ec4899" },
    { icon: <HiOutlineWifi />, title: "Delayed", value: delayedProjects, color1: "#f97316", color2: "#fbbf24" },
  ];

  // financeCards kept for future use; revenue/profit removed
  const financeCards = [
    { icon: <DollarSign size={24} />, title: "Total Expenses", value: totalExpenses, color1: "#a855f7", color2: "#ec4899" },
  ];

  // Chart data for project distribution
  const chartData = [
    { name: "Completed", value: completedProjects },
    { name: "Doing", value: activeProjects },
    { name: "Attention", value: attentionProjects },
    { name: "Delayed", value: delayedProjects },
  ];
  const chartColors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  const getStatusBadge = (status) => {
    const colors = {
      Completed: "green",
      Doing: "blue",
      Attention: "orange",
      Delayed: "red",
    };
    return <Badge colorScheme={colors[status] || "gray"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      {/* Header */}
      <Box mb={8}>
        <Heading size="xl" mb={2}>Each Project Overveiw</Heading>
        <Text color="gray.600">Welcome back! Here's what's happening today.</Text>
      </Box>

      {/* Top Cards */}
      {/* <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4} mb={6}>
        {cards.map((card, idx) => (
          <Box key={idx} bg="white" rounded="2xl" p={6} shadow="md" border="1px" borderColor="gray.100">
            <Flex align="center" mb={4}>
              <Box
                w={12} h={12} rounded="xl"
                bgGradient={`linear(to-br, ${card.color1}, ${card.color2})`}
                display="flex" alignItems="center" justifyContent="center" fontSize="2xl" color="white" mr={4}
              >
                {card.icon}
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="gray.600">{card.title}</Text>
                <Heading size="lg">{card.value}</Heading>
              </VStack>
            </Flex>
          </Box>
        ))}
      </Grid> */}

      {/* Financial Cards */}
      {/* <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
        {financeCards.map((card, idx) => (
          <Box key={idx} bg="white" rounded="2xl" p={6} shadow="md" border="1px" borderColor="gray.100">
            <Flex align="center" mb={4}>
              <Box
                w={12} h={12} rounded="xl"
                bgGradient={`linear(to-br, ${card.color1}, ${card.color2})`}
                display="flex" alignItems="center" justifyContent="center" color="white" mr={4}
              >
                {card.icon}
              </Box>
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" color="gray.600">{card.title}</Text>
                <Heading size="lg">Rs. {card.value.toLocaleString()}</Heading>
              </VStack>
            </Flex>
          </Box>
        ))}
      </Grid> */}

      {/* Charts Section */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6} mb={6}>
        <Box gridColumn={{ lg: "span 2" }} bg="white" rounded="2xl" p={6} shadow="md" border="1px" borderColor="gray.100">
          <Heading size="md" mb={2}>Revenue & Expenses by Project</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>Each project's revenue (agreement minus expense) and total expense</Text>
          <RevenueChart projects={projects} />
        </Box>

        <Box bg="white" rounded="2xl" p={6} shadow="md" border="1px" borderColor="gray.100">
          <Heading size="md" mb={2}>Project Overview Cycle</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>Project distribution by status</Text>
          <SalesChart data={chartData} colors={chartColors} />
        </Box>
      </Grid>

      {/* Projects Table & Contractors */}
      <Grid gap={6}>
        <Box bg="white" rounded="2xl" p={6} shadow="md" border="1px" borderColor="gray.100">
          <Heading size="md" mb={4}>Recent Projects</Heading>
          <Box overflowX="auto">
            <table style={{ width: "100%" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: "14px", color: "#718096" }}>
                    Project ID
                  </th>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: "14px", color: "#718096" }}>
                    Project Name
                  </th>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: "14px", color: "#718096" }}>
                    Agreement Sum
                  </th>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: "14px", color: "#718096" }}>
                    Expense
                  </th>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: "14px", color: "#718096" }}>
                    Revenue
                  </th>
                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: "14px", color: "#718096" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map((project, idx) => (
                  <tr key={project.id || idx} style={{ borderBottom: "1px solid #f7fafc" }}>

                    <td style={{ padding: "8px 16px", fontSize: "14px", fontWeight: "500" }}>
                      #{project.projectId || project.id}
                    </td>

                    <td style={{ padding: "8px 16px", fontSize: "14px", color: "#4a5568" }}>
                      {project.projectName || "Unnamed Project"}
                    </td>

                    {/* Agreement Sum */}
                    <td style={{ padding: "8px 16px", fontSize: "14px", color: "#10b981", fontWeight: "500" }}>
                      Rs. {(project.agreement?.agreementSum != null ? project.agreement.agreementSum : 0).toLocaleString()}
                    </td>

                    {/* Expense */}
                    <td style={{ padding: "8px 16px", fontSize: "14px", color: "#e53e3e", fontWeight: "500" }}>
                      Rs. {(project.totalExpense != null ? project.totalExpense : 0).toLocaleString()}
                    </td>

                    {/* Revenue (agreement minus expense) */}
                    <td style={{ padding: "8px 16px", fontSize: "14px", color: "#10b981", fontWeight: "500" }}>
                      Rs. {((project.agreement?.agreementSum || 0) - (project.totalExpense || 0)).toLocaleString()}
                    </td>

                    <td style={{ padding: "8px 16px" }}>
                      {getStatusBadge(calculateProjectStatus(project))}
                    </td>

                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#a0aec0" }}>
                      No projects found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Box>

        {/* Contractors */}
        {/* <Box bg="white" rounded="2xl" p={6} shadow="md" border="1px" borderColor="gray.100">
          <Heading size="md" mb={4}>Contractors</Heading>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Total: {contractors.length} contractors
          </Text>
          <VStack spacing={3} align="stretch">
            {contractors.slice(0, 5).map((contractor, idx) => (
              <Flex
                key={contractor.id || idx}
                p={3}
                bg="gray.50"
                rounded="lg"
                align="center"
                justify="space-between"
              >
                <HStack spacing={3}>
                  <Avatar size="sm" name={contractor.name} />
                  <Box>
                    <Text fontWeight="medium" fontSize="sm">
                      {contractor.name}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {contractor.sector || "General"}
                    </Text>
                  </Box>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {contractor.phone}
                </Text>
              </Flex>
            ))}
            {contractors.length === 0 && (
              <Text color="gray.500" textAlign="center" py={4}>
                No contractors found
              </Text>
            )}
          </VStack>
        </Box> */}
      </Grid>
    </Box>
  );
}
