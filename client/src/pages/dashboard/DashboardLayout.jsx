import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import SideBar from '../../components/SideBar';
import { PermissionGuard } from '../../components/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = () => {
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { FEATURES } = useAuth();

  // Map routes to sidebar keys
  const getActivePageFromRoute = (pathname) => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/dashboard/daily') return 'daily';
    if (pathname === '/dashboard/weekly') return 'weekly';
    if (pathname === '/dashboard/monthly') return 'monthly';
    if (pathname === '/dashboard/yearly') return 'yearly';
    if (pathname === '/dashboard/totalcost') return 'total';
    if (pathname === '/dashboard/job-cost') return 'jobcost';
    if (pathname === '/dashboard/labor-cost') return 'laborcost';
    if (pathname === '/dashboard/material-cost') return 'materialcost';
    if (pathname === '/dashboard/reports') return 'reports';
    return 'dashboard';
  };

  const activePage = getActivePageFromRoute(location.pathname);

  return (
    <Box w="100%" h="100vh" overflow="hidden" px={{ base: 2, md: 4, lg: 6 }} py={4}>
      <Flex 
        direction={{ base: "column", lg: "row" }}
        gap={{ base: 2, md: 3, lg: 4 }}
        w="100%"
        mx="auto"
        h="100%"
      >
        {/* Side Navigation */}
        <Box 
          w={{ base: "100%", lg: "250px" }}
          flexShrink={0}
          order={{ base: 1, lg: 0 }}
        >
          <SideBar activePage={activePage} />
        </Box>

        {/* Main Content Area */}
        <Box
          flex="1"
          bg={bgColor}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          p={0}
          overflow="auto"
          w="100%"
          minW={0} // Allow flex shrinking
          maxH={{ lg: "620px" }}
          order={{ base: 2, lg: 1 }}
          sx={{
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <PermissionGuard
            requiredFeatures={[FEATURES.DASHBOARD_VIEW]}
            fallback={null}
            showFallback={true}
          >
            <Outlet />
          </PermissionGuard>
        </Box>
      </Flex>
    </Box>
  );
};

export default DashboardLayout;


