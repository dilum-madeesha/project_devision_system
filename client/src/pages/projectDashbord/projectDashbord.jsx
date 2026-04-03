import { Box, Flex } from "@chakra-ui/react";
import { Outlet, useLocation } from "react-router-dom";
import ProjectDashbordSlideBar from "../../components/ProjectDashbordSlideBar";




export default function ProjectDashbord() {
  const location = useLocation();

  const getActivePageFromRoute = (pathname) => {
    if (pathname === "/projectdashbord") return "ProjectSummery";
    if (pathname.startsWith("/projectdashbord/projectStatus")) return "projectStatus";
    if (pathname.startsWith("/projectdashbord/officer")) return "officerman";
    if (pathname.startsWith("/projectdashbord/contractCompany")) return "contractors";
    if (pathname.startsWith("/projectdashbord/projectOverview")) return "projectOverview";
    if (pathname.startsWith("/projectdashbord/pictures")) return "pictures";
    return "ProjectSummery";
  };

  const activePage = getActivePageFromRoute(location.pathname);

  return (
    <Box w="100%" h="100vh" overflow="hidden" px={{ base: 2, md: 4, lg: 6 }} py={4}>
      {/* Flex container: Sidebar + Main */}

      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={{ base: 2, md: 3, lg: 4 }}
        w="100%"
        mx="auto"
        h="100%"
      >
        {/* Sidebar */}
        <Box
          flexShrink={0}
          w={{ base: "100%", lg: "250px" }}

        // order={{ base: 1, lg: 0 }}
        >
          <ProjectDashbordSlideBar activePage={activePage} />
        </Box>

        {/* Main Content */}
        <Box
          flex="1"
          bg="white"
          dark={{ bg: "gray.700" }}
          border="1px"
          borderColor="gray.200"
          _dark={{ borderColor: "gray.600" }}
          borderRadius="lg"
          overflowY="auto"
          minW="0"
          order={{ base: 2, lg: 1 }}
          maxH={{ lg: "620px" }}
          w="100%"
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
  );
}
