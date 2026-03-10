import {
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Box,
  Button,
  Icon,
  useColorModeValue,
  Tooltip
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiUsers, FiPackage } from "react-icons/fi";
import { useAuth } from '../../contexts/AuthContext';
import { DisabledAction } from '../../components/PermissionGuard';

const AddCostPage = () => {
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const { user, canAccessAddCost, can, FEATURES } = useAuth();

  const costOptions = [
    {
      title: "Add Labor Cost",
      description: "Manage daily labor costs and work records",
      icon: FiUsers,
      path: "/addcost/labor",
      color: "blue",
      costType: "labor"
    },
    {
      title: "Add Material Cost",
      description: "Manage material orders and procurement costs",
      icon: FiPackage,
      path: "/addcost/material",
      color: "orange",
      costType: "material"
    }
  ];

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8}>
        <VStack spacing={4} textAlign="center">
          <Heading size="lg">Cost Management Center</Heading>
          <Text color="gray.600" maxW="600px">
            Welcome back, {user?.firstName || 'User'}. Manage and track all project costs.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full" maxW="800px">
          {costOptions.map((option, index) => {
            const hasAccess = canAccessAddCost(option.costType);
            const canPerformActions = can(FEATURES.ACTIONS_ADD_COST);
            
            return (
              <Box key={index}>
                {hasAccess ? (
                  <Link to={option.path}>
                    <Box
                      bg={bg}
                      borderWidth="2px"
                      borderColor={borderColor}
                      borderRadius="xl"
                      p={8}
                      textAlign="center"
                      cursor="pointer"
                      transition="all 0.3s"
                      h="320px"
                      _hover={{
                        transform: "translateY(-8px)",
                        shadow: "xl",
                        borderColor: `${option.color}.500`,
                        bg: `${option.color}.50`
                      }}
                    >
                      <VStack spacing={6}>
                        <Box
                          bg={`${option.color}.100`}
                          p={4}
                          borderRadius="full"
                          transition="all 0.3s"
                          _groupHover={{
                            bg: `${option.color}.200`
                          }}
                        >
                          <Icon
                            as={option.icon}
                            boxSize={12}
                            color={`${option.color}.600`}
                          />
                        </Box>
                        
                        <VStack spacing={3}>
                          <Heading size="md" color={`${option.color}.700`}>
                            {option.title}
                          </Heading>
                          <Text color="gray.600" fontSize="sm" lineHeight="1.6">
                            {option.description}
                          </Text>
                        </VStack>
                        
                        <DisabledAction requiredFeatures={[FEATURES.ACTIONS_ADD_COST]}>
                          <Button
                            colorScheme={option.color}
                            size="md"
                            w="full"
                            mt={4}
                          >
                            {canPerformActions ? 'Add Record' : 'View Only'}
                          </Button>
                        </DisabledAction>
                      </VStack>
                    </Box>
                  </Link>
                ) : (
                  <Tooltip 
                    label={`Access restricted. You don't have permission to access ${option.title.toLowerCase()}.`}
                    hasArrow
                  >
                    <Box
                      bg={bg}
                      borderWidth="2px"
                      borderColor="gray.300"
                      borderRadius="xl"
                      p={8}
                      textAlign="center"
                      h="320px"
                      opacity={0.5}
                      cursor="not-allowed"
                    >
                      <VStack spacing={6}>
                        <Box
                          bg="gray.100"
                          p={4}
                          borderRadius="full"
                        >
                          <Icon
                            as={option.icon}
                            boxSize={12}
                            color="gray.400"
                          />
                        </Box>
                        
                        <VStack spacing={3}>
                          <Heading size="md" color="gray.500">
                            {option.title}
                          </Heading>
                          <Text color="gray.400" fontSize="sm" lineHeight="1.6">
                            {option.description}
                          </Text>
                        </VStack>
                        
                        <Button
                          colorScheme="gray"
                          size="md"
                          w="full"
                          mt={4}
                          isDisabled
                        >
                          Restricted
                        </Button>
                      </VStack>
                    </Box>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Quick Stats Section */}
        {/* <Box
          bg={bg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          p={6}
          w="full"
          maxW="800px"
        >
          <Heading size="sm" mb={4} textAlign="center">Cost Tracking Overview</Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">0</Text>
              <Text fontSize="sm" color="gray.600">Labor Records</Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">0</Text>
              <Text fontSize="sm" color="gray.600">Material Orders</Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">LKR 0</Text>
              <Text fontSize="sm" color="gray.600">Total Labor Cost</Text>
            </VStack>
            <VStack>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">LKR 0</Text>
              <Text fontSize="sm" color="gray.600">Total Material Cost</Text>
            </VStack>
          </SimpleGrid>
        </Box> */}
      </VStack>
    </Container>
  );
};

export default AddCostPage;