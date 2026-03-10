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
  FiEye,
  FiFileText,
  FiBarChart2,
  FiUsers,
  FiCheckCircle,
  FiGrid,
  FiShield,
  FiTrendingUp,
  FiDatabase,
  FiSettings
} from 'react-icons/fi';

const AboutProjectViewerPage = () => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  const sections = [
    {
      title: 'Project Explorer',
      icon: FiEye,
      color: 'teal',
      description: 'Browse and inspect projects in read‑only mode',
      features: [
        'Search by project ID or name',
        'View project details and status',
        'See associated agreement/contractor information',
        'Assigned officers and roles',
        'Progress overview and key dates'
      ]
    },
    {
      title: 'Reports',
      icon: FiFileText,
      color: 'purple',
      description: 'Generate and download project reports',
      features: [
        'Project summary PDF export',
        'Officer assignment listings',
        'Cost and status reports',
        'Filter by date and status',
        'Export in multiple formats'
      ]
    },
    {
      title: 'Dashboard',
      icon: FiBarChart2,
      color: 'blue',
      description: 'High‑level project metrics at a glance',
      features: [
        'Status distribution across projects',
        'Recent activity and updates',
        'Visual indicators for completion',
        'Quick links to frequently accessed projects'
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
          <Heading size="2xl" color="teal.600" mb={4}>
            Project Viewer
          </Heading>
          <Text fontSize="lg" color={textColor} maxW="800px" mx="auto">
            A dedicated interface for viewing project information, status updates, and
            related reports without modifying underlying data.
          </Text>
        </Box>

        <Divider />

        {/* Modules */}
        <Box>
          <Heading size="lg" mb={6} color="gray.700">
            <HStack spacing={3}>
              <Icon as={FiGrid} color="teal.500" />
              <Text>Sections</Text>
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
              <Icon as={FiShield} color="teal.500" />
              <Text>Access Levels</Text>
            </HStack>
          </Heading>
          <Text mb={6} color={textColor}>
            The project viewer supports role‑based permissions to ensure users only
            see data they're authorized to view.
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
                <Icon as={FiDatabase} boxSize={8} color="teal.500" mb={4} />
                <Heading size="md" mb={2}>Read‑Only Data</Heading>
                <Text fontSize="sm" color={textColor}>
                  Protect underlying records by restricting edits through this viewer.
                </Text>
              </CardBody>
            </Card>

            <Card bg={bg} borderColor={borderColor} borderWidth="1px">
              <CardBody textAlign="center">
                <Icon as={FiSettings} boxSize={8} color="purple.500" mb={4} />
                <Heading size="md" mb={2}>Custom Filters</Heading>
                <Text fontSize="sm" color={textColor}>
                  Narrow down projects using status, dates, or identifiers.
                </Text>
              </CardBody>
            </Card>

            <Card bg={bg} borderColor={borderColor} borderWidth="1px">
              <CardBody textAlign="center">
                <Icon as={FiFileText} boxSize={8} color="orange.500" mb={4} />
                <Heading size="md" mb={2}>Exportable Reports</Heading>
                <Text fontSize="sm" color={textColor}>
                  Download project summaries and officer assignments with ease.
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>

        {/* Footer */}
        <Box textAlign="center" pt={8}>
          <Text fontSize="sm" color={textColor}>
            For assistance with the project viewer, contact your system administrator.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default AboutProjectViewerPage;
