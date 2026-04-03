import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Grid,
  GridItem,
  Progress,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Spinner,
  VStack,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

import { MdNotificationsActive, MdFileDownloadDone, MdPendingActions } from "react-icons/md";
import { IoCloudDone } from "react-icons/io5";
import { projectAPI } from "../../../api/projects.js";

export default function ProjectStatus() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedCardType, setSelectedCardType] = useState("attention");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getAll();
      
      let projectsList = [];
      if (response?.data?.projects) projectsList = response.data.projects;
      else if (response?.data && Array.isArray(response.data)) projectsList = response.data;
      else if (Array.isArray(response)) projectsList = response;

      // Apply status rules to projects
      const processedProjects = projectsList.map(project => ({
        ...project,
        calculatedStatus: calculateProjectStatus(project),
        priority: calculatePriority(project)
      }));

      setProjects(processedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to load projects");
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

  // Calculate priority based on progress and deadline
  const calculatePriority = (project) => {
    const progress = project.completedPercent || 0;
    const endDate = project.endDate ? new Date(project.endDate) : null;
    const today = new Date();
    
    if (endDate) {
      const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) return "Critical";
      if (daysRemaining <= 5 && progress < 80) return "Critical";
      if (daysRemaining <= 10 && progress < 60) return "High";
      if (daysRemaining <= 20 && progress < 40) return "Medium";
    }
    
    if (progress < 30) return "High";
    return "Low";
  };

  const getProjectsByType = (type) => {
    switch (type) {
      case "attention":
        return projects.filter((p) => p.calculatedStatus === "Attention" || p.calculatedStatus === "Delayed" || p.priority === "Critical");
      case "delay":
        return projects.filter((p) => p.calculatedStatus === "Delayed");
      case "Doing":
        return projects.filter((p) => p.calculatedStatus === "Doing");
      case "Completed":
        return projects.filter((p) => p.calculatedStatus === "Completed");
      default:
        return projects;
    }
  };

  const projectsToDisplay = getProjectsByType(selectedCardType);

  const cards = [
    { type: "Completed", icon: <MdFileDownloadDone />, title: "Completed Projects", value: getProjectsByType("Completed").length, color: "purple" },
    { type: "Doing", icon: <MdPendingActions />, title: "Doing Projects", value: getProjectsByType("Doing").length, color: "blue" },
    { type: "attention", icon: <MdNotificationsActive />, title: "Attention Projects", value: getProjectsByType("attention").length, color: "red" },
    { type: "delay", icon: <IoCloudDone />, title: "Delayed Projects", value: getProjectsByType("delay").length, color: "orange" },
  ];

  const avgProgress =
    projectsToDisplay.length > 0
      ? Math.round(projectsToDisplay.reduce((sum, p) => sum + (p.completedPercent || 0), 0) / projectsToDisplay.length)
      : 0;

  const criticalCount = projectsToDisplay.filter((p) => p.priority === "Critical").length;

  const getStatusColor = (status) => {
    switch(status) {
      case "Completed": return "green";
      case "Doing": return "blue";
      case "Attention": return "orange";
      case "Delayed": return "red";
      default: return "gray";
    }
  };

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="300px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading projects...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={6} overflow="auto" bg="gray.50">
      {/* Header */}
      <Box mb={8}>
        <Heading size="lg">Project Status</Heading>
        <Text mt={2} color="gray.600">
          Projects that need your immediate focus and action.
        </Text>
      </Box>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} mb={8}>
        {cards.map((card) => (
          <Box
            key={card.type}
            p={6}
            borderRadius="2xl"
            borderWidth={1}
            borderColor={selectedCardType === card.type ? `${card.color}.400` : `${card.color}.200`}
            bg={selectedCardType === card.type ? `${card.color}.100` : `${card.color}.50`}
            cursor="pointer"
            onClick={() => setSelectedCardType(card.type)}
            transition="all 0.3s"
          >
            <Flex align="center" justify="space-between">
              <Flex gap={4} align="center">
                <Box fontSize="2xl" color={`${card.color}.600`}>
                  {card.icon}
                </Box>
                <Box>
                  <Text fontSize="lg" fontWeight="semibold">
                    {card.title}
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color={`${card.color}.600`}>
                    {card.value} items
                  </Text>
                </Box>
              </Flex>
            </Flex>
            <Text mt={3} fontSize="sm" color="gray.600">
              {selectedCardType === card.type ? "✓ Selected" : "Click to view"}
            </Text>
          </Box>
        ))}
      </Grid>

      {/* Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={6}>
        <Box p={4} bg="blue.50" borderRadius="lg" borderWidth={1} borderColor="blue.200">
          <Text fontSize="sm" color="gray.600">
            Total Projects
          </Text>
          <Heading size="lg" color="blue.600">
            {projectsToDisplay.length}
          </Heading>
        </Box>
        <Box p={4} bg="orange.50" borderRadius="lg" borderWidth={1} borderColor="orange.200">
          <Text fontSize="sm" color="gray.600">
            Critical Priority
          </Text>
          <Heading size="lg" color="orange.600">
            {criticalCount}
          </Heading>
        </Box>
        <Box p={4} bg="green.50" borderRadius="lg" borderWidth={1} borderColor="green.200">
          <Text fontSize="sm" color="gray.600">
            Avg Progress
          </Text>
          <Heading size="lg" color="green.600">
            {avgProgress}%
          </Heading>
        </Box>
      </Grid>

      {/* Projects Table */}
      <Box bg="white" p={6} borderRadius="2xl" borderWidth={1} borderColor="gray.100" overflowX="auto">
        <Heading size="md" mb={6}>
          {selectedCardType === "attention" && "🚨 Projects Needing Attention"}
          {selectedCardType === "delay" && "⏱️ Delayed Projects"}
          {selectedCardType === "Doing" && "🛠️ Doing Projects"}
          {selectedCardType === "Completed" && "✅ Completed Projects"}
        </Heading>

        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th>Project ID</Th>
              <Th>Project Name</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Progress</Th>
              <Th>Start Date</Th>
              <Th>End Date</Th>
            </Tr>
          </Thead>
          <Tbody>
            {projectsToDisplay.length > 0 ? (
              projectsToDisplay.map((project) => (
                <Tr key={project.id} _hover={{ bg: "gray.50" }}>
                  <Td fontWeight="medium">{project.projectId}</Td>
                  <Td>{project.projectName}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        project.priority === "Critical"
                          ? "red"
                          : project.priority === "High"
                          ? "orange"
                          : project.priority === "Medium"
                          ? "yellow"
                          : "green"
                      }
                      px={2}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                    >
                      {project.priority}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(project.calculatedStatus)}
                      px={2}
                      py={1}
                      borderRadius="full"
                      fontSize="xs"
                    >
                      {project.calculatedStatus}
                    </Badge>
                  </Td>
                  <Td>
                    <Flex align="center" gap={2}>
                      <Progress
                        value={project.completedPercent || 0}
                        size="sm"
                        colorScheme={getStatusColor(project.calculatedStatus)}
                        w="60px"
                        borderRadius="full"
                      />
                      <Text fontSize="xs">{project.completedPercent || 0}%</Text>
                    </Flex>
                  </Td>
                  <Td fontSize="sm">{project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}</Td>
                  <Td fontSize="sm">{project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A"}</Td>
                </Tr>
              ))
            ) : (
              <Tr>
                <Td colSpan={7} textAlign="center" py={6} color="gray.500">
                  ✅ No projects in this category
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
    </Box>
  );
}
