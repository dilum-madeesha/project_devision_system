import { 
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip
} from "@chakra-ui/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import { PermissionCheck, DisabledAction } from "./PermissionGuard";

const ProjectNavbar = () => {
  const { user, logout, can, canAny, FEATURES, getPrivilegeName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");

  // Function to check if a nav item is active
  const isActiveRoute = (path) => {
    if (path === '/ProjectDashbord') {
      return location.pathname === '/ProjectDashbord' || location.pathname.startsWith('/ProjectDashbord/');
    }
    if (path === '/ProjectRegister') {
      return location.pathname === '/ProjectRegister' || location.pathname.startsWith('/ProjectRegister/');
    }
    if (path === '/CreateProject') {
      return location.pathname === '/CreateProject' || location.pathname.startsWith('/CreateProject/');
    }
    return location.pathname === path;
  };

  // Function to get text color based on active state
  const getNavTextColor = (path) => {
    return isActiveRoute(path) ? "blue.600" : textColor;
  };

  // Function to get font weight based on active state
  const getNavFontWeight = (path) => {
    return isActiveRoute(path) ? "bold" : "medium";
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    onClose();
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleProjectSelect = () => {
    navigate('/systems');
  }

  return (
    <Box 
      bg={bg} 
      borderBottom="1px" 
      borderColor={borderColor} 
      py={4}
      position="sticky"
      top="0"
      zIndex="1000"
      shadow="sm"
    >
      <Container maxW="1400px">
        <Flex alignItems="center" justifyContent="space-between">
          {/* Left side - System Title */}
          <Link to="/project-viewer">
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color="blue.600"
              textTransform="uppercase"
              _hover={{ color: "blue.800", textDecoration: "underline" }}
              cursor="pointer"
              transition="all 0.2s"
            >
              Project Viewer System
            </Text>
          </Link>

          {/* Center - Navigation Links */}
          <HStack spacing={8} display={{ base: "none", md: "flex" }}>
            {/* Dashboard - Accessible by L1, L2, L3 */}
            <PermissionCheck
              requiredFeatures={[FEATURES.DASHBOARD_VIEW]}
              fallback={
                <DisabledAction requiredFeatures={[FEATURES.DASHBOARD_VIEW]}>
                  <Text
                    fontWeight={getNavFontWeight('/dashboard')}
                    color="gray.400"
                    cursor="not-allowed"
                    transition="all 0.2s"
                    pb={1}
                  >
                    DASHBOARD
                  </Text>
                </DisabledAction>
              }
            >
              <Link to="/ProjectDashbord">
                <Text
                  fontWeight={getNavFontWeight('/ProjectDashbord')}
                  color={getNavTextColor('/ProjectDashbord')}
                  _hover={{ color: "blue.600" }}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderBottom={isActiveRoute('/ProjectDashbord') ? "2px solid" : "2px solid transparent"}
                  borderColor={isActiveRoute('/ProjectDashbord') ? "blue.600" : "transparent"}
                  pb={1}
                >
                  DASHBOARD
                </Text>
              </Link>
            </PermissionCheck>

            {/* Reports - Show only for users with reports access */}
            <PermissionCheck
              requiredFeatures={[FEATURES.REPORTS_ACCESS]}
            >
              <Link to="/ProjectReports">
                <Text
                  fontWeight={getNavFontWeight('/ProjectReports')}
                  color={getNavTextColor('/ProjectReports')}
                  _hover={{ color: "blue.600" }}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderBottom={isActiveRoute('/ProjectReports') ? "2px solid" : "2px solid transparent"}
                  borderColor={isActiveRoute('/ProjectReports') ? "blue.600" : "transparent"}
                  pb={1}
                >
                  REPORTS
                </Text>
              </Link>
            </PermissionCheck>

            {/* Register - Show for everyone but disable actions based on privilege */}
            <Link to="/ProjectRegister">
              <Text
                fontWeight={getNavFontWeight('/ProjectRegister')}
                color={getNavTextColor('/ProjectRegister')}
                _hover={{ color: "blue.600" }}
                cursor="pointer"
                transition="all 0.2s"
                borderBottom={isActiveRoute('/ProjectRegister') ? "2px solid" : "2px solid transparent"}
                borderColor={isActiveRoute('/ProjectRegister') ? "blue.600" : "transparent"}
                pb={1}
              >
                REGISTER
              </Text>
            </Link>

            {/* Add Cost - Show for everyone but disable actions based on privilege */}
            <Link to="/CreateProject">
              <Text
                fontWeight={getNavFontWeight('/CreateProject')}
                color={getNavTextColor('/CreateProject')}
                _hover={{ color: "blue.600" }}
                cursor="pointer"
                transition="all 0.2s"
                borderBottom={isActiveRoute('/CreateProject') ? "2px solid" : "2px solid transparent"}
                borderColor={isActiveRoute('/CreateProject') ? "blue.600" : "transparent"}
                pb={1}
              >
                PROJECT
              </Text>
            </Link>
          </HStack>

          {/* Mobile Navigation */}
          <HStack spacing={4} display={{ base: "flex", md: "none" }}>
            <PermissionCheck
              requiredFeatures={[FEATURES.DASHBOARD_VIEW]}
              fallback={
                <DisabledAction requiredFeatures={[FEATURES.DASHBOARD_VIEW]}>
                  <Button 
                    variant="ghost"
                    colorScheme="gray"
                    size="sm"
                    isDisabled
                  >
                    Dashboard
                  </Button>
                </DisabledAction>
              }
            >
              <Link to="/ProjectDashbord">
                <Button 
                  variant={isActiveRoute('/ProjectDashbord') ? "solid" : "ghost"} 
                  colorScheme={isActiveRoute('/ProjectDashbord') ? "blue" : "gray"}
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
            </PermissionCheck>
            
            <PermissionCheck
              requiredFeatures={[FEATURES.REPORTS_ACCESS]}
            >
              <Link to="/ProjectReports">
                <Button 
                  variant={isActiveRoute('/ProjectReports') ? "solid" : "ghost"} 
                  colorScheme={isActiveRoute('/ProjectReports') ? "blue" : "gray"}
                  size="sm"
                >
                  Reports
                </Button>
              </Link>
            </PermissionCheck>
            
            <Link to="/ProjectRegister">
              <Button 
                variant={isActiveRoute('/ProjectRegister') ? "solid" : "ghost"} 
                colorScheme={isActiveRoute('/ProjectRegister') ? "blue" : "gray"}
                size="sm"
              >
                Register
              </Button>
            </Link>
            
            <Link to="/CreateProject">
              <Button 
                variant={isActiveRoute('/CreateProject') ? "solid" : "ghost"} 
                colorScheme={isActiveRoute('/CreateProject') ? "blue" : "gray"}
                size="sm"
              >
                Add Cost
              </Button>
            </Link>
          </HStack>

          {/* Right side - User Menu */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              size="sm"
            >
              <HStack spacing={2}>
                <Avatar 
                  size="sm" 
                  name={`${user?.firstName} ${user?.lastName}`}
                  bg="blue.500" 
                />
                <Box display={{ base: "none", lg: "block" }}>
                  <Text fontSize="sm" fontWeight="medium">
                    {user?.firstName} {user?.lastName}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />} onClick={handleProfileClick}>
                Profile
              </MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={handleProjectSelect}>
                Project Select
              </MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={onOpen}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Container>
      
      {/* Logout Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Logout</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to logout?
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              No
            </Button>
            <Button colorScheme="red" onClick={handleLogout}>
              Yes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ProjectNavbar;
