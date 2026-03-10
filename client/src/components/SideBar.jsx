import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Button,
  Text,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import {
  FiHome,
  FiCalendar,
  FiTrendingUp,
  FiBarChart2,
  FiClock,
  FiDollarSign,
  FiBriefcase,
  FiUsers,
  FiPackage,
} from 'react-icons/fi';

const SideBar = ({ activePage }) => {
  const navigate = useNavigate();
  const { can, FEATURES } = useAuth();

  const sidebarBg = useColorModeValue("gray.50", "gray.700");
  const activeBg = useColorModeValue("blue.100", "blue.900");
  const activeColor = useColorModeValue("blue.600", "blue.400");
  const defaultColor = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("gray.100", "gray.600");

  const navigationItems = [
    { key: 'dashboard', label: 'Summery', path: '/dashboard', icon: FiHome, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'daily', label: 'Daily Cost', path: '/dashboard/daily', icon: FiCalendar, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'weekly', label: 'Weekly Cost', path: '/dashboard/weekly', icon: FiBarChart2, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'monthly', label: 'Monthly Cost', path: '/dashboard/monthly', icon: FiTrendingUp, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'yearly', label: 'Yearly Cost', path: '/dashboard/yearly', icon: FiClock, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'total', label: 'Total Cost', path: '/dashboard/totalcost', icon: FiDollarSign, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'jobcost', label: 'Job Cost', path: '/dashboard/job-cost', icon: FiBriefcase, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'laborcost', label: 'Labor Cost', path: '/dashboard/labor-cost', icon: FiUsers, feature: FEATURES.DASHBOARD_VIEW },
    { key: 'materialcost', label: 'Material Cost', path: '/dashboard/material-cost', icon: FiPackage, feature: FEATURES.DASHBOARD_VIEW },
  ];

  const availableNavItems = navigationItems.filter(item => can(item.feature));

  return (
    <Box
      w={{ base: "full", lg: "250px" }}
      h={{ lg: "620px" }}
      bg={sidebarBg}
      p={3}
      borderRadius="md"
    >
      <VStack spacing={2} align="stretch">
        {availableNavItems.map((item) => {
          const isActive = activePage === item.key;

          return (
            <Button
              key={item.key}
              leftIcon={<Icon as={item.icon} boxSize={5} />}
              justifyContent="flex-start"
              w="full"
              variant="ghost"
              bg={isActive ? activeBg : "transparent"}
              color={isActive ? activeColor : defaultColor}
              fontWeight={isActive ? "semibold" : "normal"}
              _hover={{ bg: hoverBg, color: activeColor }}
              onClick={() => navigate(item.path)}
              h="40px"
            >
              <Text fontSize="sm">{item.label}</Text>
            </Button>
          );
        })}
      </VStack>
    </Box>
  );
};

export default SideBar;