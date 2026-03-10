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
import { FiBriefcase, FiUsers, FiUserPlus, FiPackage } from "react-icons/fi";
import { useAuth } from '../../contexts/AuthContext';
import { PermissionCheck, DisabledAction } from '../../components/PermissionGuard';
// import ParticleCanvas from "../../components/animation";

const RegisterPage = () => {
  const { user, canAccessRegister, can, FEATURES } = useAuth();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const registerOptions = [
    {
      title: "Register Job",
      description: "Add new jobs and manage job information",
      icon: FiBriefcase,
      path: "/register/jobs",
      color: "green",
      registerType: "jobs"
    },
    {
      title: "Register Labor",
      description: "Add new labor and manage labor information",
      icon: FiUsers,
      path: "/register/labors",
      color: "blue",
      registerType: "labors"
    },
    {
      title: "Register Material",
      description: "Add new materials and manage material inventory",
      icon: FiPackage,
      path: "/register/materials",
      color: "orange",
      registerType: "materials"
    },
    {
      title: "Register User",
      description: "Add new users and manage system access",
      icon: FiUserPlus,
      path: "/register/users",
      color: "purple",
      registerType: "users"
    }
  ];

  return (
    <Container maxW="1400px" py={8}>
      
      
      <VStack spacing={8}>
        <VStack spacing={4} textAlign="center">
          <Heading size="lg">Registration Center</Heading>
          <Text color="gray.600">
           Welcome back, {user?.firstName || 'User'}. Choose what you want to register in the system
          </Text>
        </VStack>
        

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={6} w="full">
          {registerOptions.map((option, index) => {
            const hasAccess = canAccessRegister(option.registerType);
            const canPerformActions = can(FEATURES.ACTIONS_REGISTER);
            
            return (
              <Box key={index}>
                
                {hasAccess ? (
                  <Link to={option.path}>
                    <Box
                      bg={bg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="lg"
                      p={6}
                      textAlign="center"
                      cursor="pointer"
                      transition="all 0.2s"
                      h="280px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      _hover={{
                        transform: "translateY(-4px)",
                        shadow: "lg",
                        borderColor: `${option.color}.500`
                      }}
                    >
                      
                      <VStack spacing={4} h="full" justify="space-between">
                        <VStack spacing={4}>
                          <Icon
                            as={option.icon}
                            boxSize={12}
                            color={`${option.color}.500`}
                          />
                          <Heading size="md" minH="60px" display="flex" alignItems="center">
                            {option.title}
                          </Heading>
                          <Text color="gray.600" fontSize="sm" minH="40px">
                            {option.description}
                          </Text>
                        </VStack>
                        <DisabledAction requiredFeatures={[FEATURES.ACTIONS_REGISTER]}>
                          <Button
                            colorScheme={option.color}
                            size="sm"
                            w="full"
                            mt="auto"
                          >
                            {canPerformActions ? 'Register' : 'View Only'}
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
                      borderWidth="1px"
                      borderColor="gray.300"
                      borderRadius="lg"
                      p={6}
                      textAlign="center"
                      h="280px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      opacity={0.5}
                      cursor="not-allowed"
                    >
                      <VStack spacing={4} h="full" justify="space-between">
                        <VStack spacing={4}>
                          <Icon
                            as={option.icon}
                            boxSize={12}
                            color="gray.400"
                          />
                          <Heading size="md" minH="60px" display="flex" alignItems="center" color="gray.500">
                            {option.title}
                          </Heading>
                          <Text color="gray.400" fontSize="sm" minH="40px">
                            {option.description}
                          </Text>
                        </VStack>
                        <Button
                          colorScheme="gray"
                          size="sm"
                          w="full"
                          mt="auto"
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
      </VStack>
    </Container>
  );
};

export default RegisterPage;