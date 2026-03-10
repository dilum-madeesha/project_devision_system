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
  FiCalendar,
  FiTrendingUp,
  FiBarChart2,
  FiClock,
  FiBriefcase,
  FiUsers,
  FiPackage,
  FiClipboard,
} from 'react-icons/fi';

const ReportsSideBar = ({ activePage }) => {
  const navigate = useNavigate();
  const { can, FEATURES } = useAuth();

  const sidebarBg = useColorModeValue("gray.50", "gray.700");
  const activeBg = useColorModeValue("blue.100", "blue.900");
  const activeColor = useColorModeValue("blue.600", "blue.400");
  const defaultColor = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("gray.100", "gray.600");

  const navigationItems = [
    { key: 'daily-labor-cost', label: 'Daily Labor Cost', path: '/reports/daily-labor-cost', icon: FiCalendar, feature: FEATURES.REPORTS_VIEW_ALL },
    { key: 'weekly-labor-cost', label: 'Weekly Labor Cost', path: '/reports/weekly-labor-cost', icon: FiBarChart2, feature: FEATURES.REPORTS_VIEW_ALL },
    { key: 'monthly-labor-cost', label: 'Monthly Labor Cost', path: '/reports/monthly-labor-cost', icon: FiTrendingUp, feature: FEATURES.REPORTS_VIEW_ALL },
    { key: 'yearly-labor-cost', label: 'Yearly Labor Cost', path: '/reports/yearly-labor-cost', icon: FiClock, feature: FEATURES.REPORTS_VIEW_ALL },
    { key: 'monthly-material-cost', label: 'Monthly Material Cost', path: '/reports/monthly-material-cost', icon: FiPackage, feature: FEATURES.REPORTS_MATERIAL },
    { key: 'yearly-material-cost', label: 'Yearly Material Cost', path: '/reports/yearly-material-cost', icon: FiPackage, feature: FEATURES.REPORTS_MATERIAL },
    { key: 'job-total-cost', label: 'Job Total Cost', path: '/reports/job-total-cost', icon: FiBriefcase, feature: FEATURES.REPORTS_JOB_TOTAL_COST },
    { key: 'labor-report', label: 'Labor Report', path: '/reports/labor-report', icon: FiUsers, feature: FEATURES.REPORTS_LABOR },
    { key: 'daily-labor-assignment', label: 'Labor Distribution', path: '/reports/daily-labor-assignment', icon: FiClipboard, feature: FEATURES.REPORTS_LABOR_DISTRIBUTION }
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

export default ReportsSideBar;