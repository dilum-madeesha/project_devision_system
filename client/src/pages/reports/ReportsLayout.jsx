import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import ReportsSideBar from '../../components/ReportsSideBar';
import { PermissionGuard } from '../../components/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';

const ReportsLayout = () => {
  const location = useLocation();
  const { FEATURES, user } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Map routes to sidebar keys
  const getActivePageFromRoute = (pathname) => {
    if (pathname === '/reports') {
      // Return different default based on user privilege
      return user?.privilege === 5 ? 'labor-report' : 'daily-labor-cost';
    }
    if (pathname === '/reports/daily-labor-cost') return 'daily-labor-cost';
    if (pathname === '/reports/weekly-labor-cost') return 'weekly-labor-cost';
    if (pathname === '/reports/monthly-labor-cost') return 'monthly-labor-cost';
    if (pathname === '/reports/yearly-labor-cost') return 'yearly-labor-cost';
    if (pathname === '/reports/monthly-material-cost') return 'monthly-material-cost';
    if (pathname === '/reports/yearly-material-cost') return 'yearly-material-cost';
    if (pathname === '/reports/job-total-cost') return 'job-total-cost';
    if (pathname === '/reports/labor-report') return 'labor-report';
    if (pathname === '/reports/daily-labor-assignment') return 'daily-labor-assignment';
    if (pathname === '/reports/custom-reports') return 'custom-reports';
    // Default fallback also based on privilege
    return user?.privilege === 5 ? 'labor-report' : 'daily-labor-cost';
  };

  const activePage = getActivePageFromRoute(location.pathname);

  return (
    <PermissionGuard
      requiredFeatures={[FEATURES.REPORTS_ACCESS]}
      fallbackMessage="You don't have permission to access the reports section."
    >
      <Box w="100%" h="100vh" overflow="hidden" px={{ base: 2, md: 4, lg: 6 }} py={1}>
        <Flex 
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 4, md: 6, lg: 4 }}
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
            <ReportsSideBar activePage={activePage} />
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
            <Outlet />
          </Box>
        </Flex>
      </Box>
    </PermissionGuard>
  );
};

export default ReportsLayout;
