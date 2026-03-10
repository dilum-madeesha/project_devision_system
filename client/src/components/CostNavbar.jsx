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

const CostNavbar = () => {
  const { user, logout, can, canAny, FEATURES, getPrivilegeName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");

  // Function to check if a nav item is active
  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
    }
    if (path === '/register') {
      return location.pathname === '/register' || location.pathname.startsWith('/register/');
    }
    if (path === '/addcost') {
      return location.pathname === '/addcost' || location.pathname.startsWith('/addcost/');
    }
    if (path === '/reports') {
      return location.pathname === '/reports' || location.pathname.startsWith('/reports/');
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
          <Link to="/about">
            <Text
              fontSize={{ base: "lg", md: "xl" }}
              fontWeight="bold"
              color="blue.600"
              textTransform="uppercase"
              _hover={{ color: "blue.800", textDecoration: "underline" }}
              cursor="pointer"
              transition="all 0.2s"
            >
              Cost Tracking System
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
              <Link to="/dashboard">
                <Text
                  fontWeight={getNavFontWeight('/dashboard')}
                  color={getNavTextColor('/dashboard')}
                  _hover={{ color: "blue.600" }}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderBottom={isActiveRoute('/dashboard') ? "2px solid" : "2px solid transparent"}
                  borderColor={isActiveRoute('/dashboard') ? "blue.600" : "transparent"}
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
              <Link to="/reports">
                <Text
                  fontWeight={getNavFontWeight('/reports')}
                  color={getNavTextColor('/reports')}
                  _hover={{ color: "blue.600" }}
                  cursor="pointer"
                  transition="all 0.2s"
                  borderBottom={isActiveRoute('/reports') ? "2px solid" : "2px solid transparent"}
                  borderColor={isActiveRoute('/reports') ? "blue.600" : "transparent"}
                  pb={1}
                >
                  REPORTS
                </Text>
              </Link>
            </PermissionCheck>

            {/* Register - Show for everyone but disable actions based on privilege */}
            <Link to="/register">
              <Text
                fontWeight={getNavFontWeight('/register')}
                color={getNavTextColor('/register')}
                _hover={{ color: "blue.600" }}
                cursor="pointer"
                transition="all 0.2s"
                borderBottom={isActiveRoute('/register') ? "2px solid" : "2px solid transparent"}
                borderColor={isActiveRoute('/register') ? "blue.600" : "transparent"}
                pb={1}
              >
                REGISTER
              </Text>
            </Link>

            {/* Add Cost - Show for everyone but disable actions based on privilege */}
            <Link to="/addcost">
              <Text
                fontWeight={getNavFontWeight('/addcost')}
                color={getNavTextColor('/addcost')}
                _hover={{ color: "blue.600" }}
                cursor="pointer"
                transition="all 0.2s"
                borderBottom={isActiveRoute('/addcost') ? "2px solid" : "2px solid transparent"}
                borderColor={isActiveRoute('/addcost') ? "blue.600" : "transparent"}
                pb={1}
              >
                ADD COST
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
              <Link to="/dashboard">
                <Button 
                  variant={isActiveRoute('/dashboard') ? "solid" : "ghost"} 
                  colorScheme={isActiveRoute('/dashboard') ? "blue" : "gray"}
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
            </PermissionCheck>
            
            <PermissionCheck
              requiredFeatures={[FEATURES.REPORTS_ACCESS]}
            >
              <Link to="/reports">
                <Button 
                  variant={isActiveRoute('/reports') ? "solid" : "ghost"} 
                  colorScheme={isActiveRoute('/reports') ? "blue" : "gray"}
                  size="sm"
                >
                  Reports
                </Button>
              </Link>
            </PermissionCheck>
            
            <Link to="/register">
              <Button 
                variant={isActiveRoute('/register') ? "solid" : "ghost"} 
                colorScheme={isActiveRoute('/register') ? "blue" : "gray"}
                size="sm"
              >
                Register
              </Button>
            </Link>
            
            <Link to="/addcost">
              <Button 
                variant={isActiveRoute('/addcost') ? "solid" : "ghost"} 
                colorScheme={isActiveRoute('/addcost') ? "blue" : "gray"}
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
                Lrogout
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

export default CostNavbar;
