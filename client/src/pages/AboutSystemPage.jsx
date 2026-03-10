import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Divider,
  Badge,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Icon
} from '@chakra-ui/react';
import { 
  FiBarChart2, 
  FiUsers, 
  FiDollarSign, 
  FiFileText, 
  FiShield, 
  FiDatabase,
  FiCheckCircle,
  FiSettings,
  FiTrendingUp,
  FiGrid
} from 'react-icons/fi';

const AboutSystemPage = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  const sections = [
    {
      title: "Dashboard",
      icon: FiBarChart2,
      color: "blue",
      description: "Real-time cost tracking and analytics",
      features: [
        "Daily, Weekly, Monthly, and Yearly cost summaries",
        "Job-wise cost breakdown",
        "Labor and Material cost analysis",
        "Interactive charts and visualizations",
        "Total cost overview across all projects"
      ]
    },
    {
      title: "Register Module",
      icon: FiUsers,
      color: "green",
      description: "Manage all system entities and users",
      features: [
        "Job registration and management",
        "Labor personnel registration",
        "Material catalog management",
        "User account management",
        "Excel import for bulk material registration"
      ]
    },
    {
      title: "Add Cost Module",
      icon: FiDollarSign,
      color: "orange",
      description: "Record daily labor and material expenses",
      features: [
        "Daily labor cost entry with assignment tracking",
        "Material cost recording with order details",
        "Automated cost calculations",
        "Creator and updater audit trail",
        "Real-time cost validation"
      ]
    },
    {
      title: "Reports System",
      icon: FiFileText,
      color: "purple",
      description: "Comprehensive reporting and analytics",
      features: [
        "Daily labor cost reports",
        "Weekly and monthly labor summaries",
        "Material cost analysis reports",
        "Job total cost reports",
        "Labor assignment tracking reports",
        "Export to PDF format"
      ]
    }
  ];

  const accessLevels = [
    { level: "L7 - Material Cost Manager", color: "gray", permissions: "Material cost access: add material cost, material register" },
    { level: "L6 - Labor Cost Manager", color: "green", permissions: "Labor cost access: add labor cost only" },
    { level: "L5 - Job Cost Manager", color: "purple", permissions: "Job cost access: add labor & material cost, labor & material register, job report, Labor Report & Labor Distribution" },
    { level: "L4 - Registration Manager", color: "blue", permissions: "Registration access: Job, labor, material register pages" },
    { level: "L3 - Operation Manager", color: "yellow", permissions: "Management access: Register, Dashboards, Reports" },
    { level: "L2 - Operation Viewer", color: "orange", permissions: "View Progress: Dashboards & Reports (read-only)" },
    { level: "L1 - System Admin", color: "red", permissions: "Full system access (no restrictions)" }
  ];

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="2xl" color="blue.600" mb={4}>
            Cost Tracking System
          </Heading>
          <Text fontSize="lg" color={textColor} maxW="800px" mx="auto">
            A comprehensive system for tracking and managing project costs, labor assignments, 
            and material expenses with role-based access control and detailed reporting capabilities.
          </Text>
        </Box>

        <Divider />

        {/* System Modules */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            <HStack spacing={3}>
              <Icon as={FiGrid} color="blue.500" />
              <Text>System Modules</Text>
            </HStack>
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {sections.map((section, index) => (
              <Card key={index} bg={bg} borderColor={borderColor} borderWidth="1px">
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={section.icon} boxSize={6} color={`${section.color}.500`} />
                    <VStack align="start" spacing={1}>
                      <Heading size="md" color={`${section.color}.600`}>
                        {section.title}
                      </Heading>
                      <Text fontSize="sm" color={textColor}>
                        {section.description}
                      </Text>
                    </VStack>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  <List spacing={2}>
                    {section.features.map((feature, featureIndex) => (
                      <ListItem key={featureIndex} fontSize="sm">
                        <ListIcon as={FiCheckCircle} color={`${section.color}.500`} />
                        {feature}
                      </ListItem>
                    ))}
                  </List>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        <Divider />

        {/* Access Control */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            <HStack spacing={3}>
              <Icon as={FiShield} color="blue.500" />
              <Text>Access Control</Text>
            </HStack>
          </Heading>
          <Text mb={6} color={textColor}>
            The system uses a privilege-based access control with 7 distinct levels, 
            each with specific permissions and capabilities:
          </Text>
          <VStack spacing={4} align="stretch">
            {accessLevels.map((level, index) => (
              <Card key={index} bg={bg} borderColor={borderColor} borderWidth="1px">
                <CardBody>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2}>
                      <Badge colorScheme={level.color} fontSize="sm" px={3} py={1}>
                        {level.level}
                      </Badge>
                      <Text fontSize="sm" color={textColor}>
                        {level.permissions}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>

        <Divider />

        {/* Key Features */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            <HStack spacing={3}>
              <Icon as={FiTrendingUp} color="green.500" />
              <Text>Key Features</Text>
            </HStack>
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card bg={bg} borderColor={borderColor} borderWidth="1px">
              <CardBody textAlign="center">
                <Icon as={FiDatabase} boxSize={8} color="blue.500" mb={4} />
                <Heading size="md" mb={2}>Audit Trail</Heading>
                <Text fontSize="sm" color={textColor}>
                  Complete tracking of who created and updated each record with timestamps
                </Text>
              </CardBody>
            </Card>
            
            <Card bg={bg} borderColor={borderColor} borderWidth="1px">
              <CardBody textAlign="center">
                <Icon as={FiSettings} boxSize={8} color="purple.500" mb={4} />
                <Heading size="md" mb={2}>Flexible Configuration</Heading>
                <Text fontSize="sm" color={textColor}>
                  Configurable privilege system with granular permission control
                </Text>
              </CardBody>
            </Card>
            
            <Card bg={bg} borderColor={borderColor} borderWidth="1px">
              <CardBody textAlign="center">
                <Icon as={FiFileText} boxSize={8} color="orange.500" mb={4} />
                <Heading size="md" mb={2}>Comprehensive Reporting</Heading>
                <Text fontSize="sm" color={textColor}>
                  Detailed reports with export capabilities in multiple formats
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Footer */}
        <Box textAlign="center" pt={8}>
          <Text fontSize="sm" color={textColor}>
            For technical support or questions about system functionality, 
            please contact your system administrator.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default AboutSystemPage;