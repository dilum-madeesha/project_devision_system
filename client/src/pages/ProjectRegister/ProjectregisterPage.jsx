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
  Tooltip,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiUsers, FiUserPlus, FiPackage } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";
import {
  PermissionCheck,
  DisabledAction,
} from "../../components/PermissionGuard";

const RegisterPage = () => {
  const { user, canAccessRegister, can, FEATURES } = useAuth();

  // Page-level colors
  const pageBg = useColorModeValue("gray.100", "gray.900");
  const cardTextColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  const registerOptions = [
    {
      title: "Register Agreement",
      description: "Add new agreements and manage agreement information",
      icon: FiBriefcase,
      path: "/projectRegister/agreements",
      color: "green",
      registerType: "jobs",
    },
    {
      title: "Register Officers",
      description: "Add new officers and manage officer information",
      icon: FiUsers,
      path: "/projectRegister/officers",
      color: "blue",
      registerType: "labors",
    },
    {
      title: "Register Contractors",
      description: "Add new Contractors and manage contractor information",
      icon: FiPackage,
      path: "/projectregister/contractors",
      color: "purple",
      registerType: "materials",
    }
  ];

  const canPerformActions = can(FEATURES.ACTIONS_REGISTER);

  return (
    <Box bg={pageBg} minH="100vh" py={8}>
      <Container maxW="1400px">
        <VStack spacing={8}>
          <VStack spacing={4} textAlign="center">
            <Heading size="lg">Registration Center</Heading>
            <Text color={mutedTextColor}>
              Welcome back, {user?.firstName || "User"}. Choose what you want
              to register in the system
            </Text>
          </VStack>

          <SimpleGrid
            columns={{ base: 1, sm: 2, lg: 3 }}
            spacing={6}
            w="full"
          >
            {registerOptions.map((option, index) => {
              const hasAccess = canAccessRegister(option.registerType);

              if (hasAccess) {
                return (
                  <Box key={index}>
                    <Link to={option.path}>
                      <Box
                        bg={`${option.color}.50`}
                        borderWidth="1px"
                        borderColor={`${option.color}.100`}
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
                          bg: `${option.color}.100`,
                          borderColor: `${option.color}.500`,
                        }}
                      >
                        <VStack spacing={4} h="full" justify="space-between">
                          <VStack spacing={4}>
                            <Icon
                              as={option.icon}
                              boxSize={12}
                              color={`${option.color}.500`}
                            />
                            <Heading
                              size="md"
                              minH="60px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color={cardTextColor}
                            >
                              {option.title}
                            </Heading>
                            <Text
                              color={mutedTextColor}
                              fontSize="sm"
                              minH="40px"
                            >
                              {option.description}
                            </Text>
                          </VStack>

                          <DisabledAction
                            requiredFeatures={[FEATURES.ACTIONS_REGISTER]}
                          >
                            <Button
                              colorScheme={option.color}
                              size="sm"
                              w="full"
                              mt="auto"
                            >
                              {canPerformActions ? "Register" : "View Only"}
                            </Button>
                          </DisabledAction>
                        </VStack>
                      </Box>
                    </Link>
                  </Box>
                );
              }

              // No access: gray, disabled card
              return (
                <Box key={index}>
                  <Tooltip
                    label={`Access restricted. You don't have permission to access ${option.title.toLowerCase()}.`}
                    hasArrow
                  >
                    <Box
                      bg={useColorModeValue("gray.50", "gray.800")}
                      borderWidth="1px"
                      borderColor={useColorModeValue("gray.300", "gray.600")}
                      borderRadius="lg"
                      p={6}
                      textAlign="center"
                      h="280px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      opacity={0.7}
                      cursor="not-allowed"
                    >
                      <VStack spacing={4} h="full" justify="space-between">
                        <VStack spacing={4}>
                          <Icon
                            as={option.icon}
                            boxSize={12}
                            color={useColorModeValue(
                              "gray.400",
                              "gray.500"
                            )}
                          />
                          <Heading
                            size="md"
                            minH="60px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color={useColorModeValue(
                              "gray.500",
                              "gray.300"
                            )}
                          >
                            {option.title}
                          </Heading>
                          <Text
                            color={useColorModeValue(
                              "gray.400",
                              "gray.500"
                            )}
                            fontSize="sm"
                            minH="40px"
                          >
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
                </Box>
              );
            })}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default RegisterPage;