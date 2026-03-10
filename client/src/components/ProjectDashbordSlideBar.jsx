import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

import { MdDashboard, MdOfflinePin } from "react-icons/md";
import { GiPoliceOfficerHead } from "react-icons/gi";
import { HiBellAlert } from "react-icons/hi2";
import { LiaFileContractSolid } from "react-icons/lia";
import { FiImage } from "react-icons/fi";

const ProjectDashbordSlideBar = ({ activePage }) => {
  const navigate = useNavigate();

  const navigationItems = [
    { key: "ProjectSummery", label: "ProjectS Summery", path: "/projectdashbord", icon: MdDashboard },
    { key: "projectStatus", label: "Project Status", path: "/projectdashbord/projectStatus", icon: MdOfflinePin },
     { key: "projectOverview", label: "Project Overview", path: "/projectdashbord/projectOverview", icon: LiaFileContractSolid },
    { key: "officerman", label: "Officers", path: "/projectdashbord/officer", icon: GiPoliceOfficerHead },
    { key: "contractors", label: "Contractors", path: "/projectdashbord/contractCompany", icon: LiaFileContractSolid },
    { key: "pictures", label: "Pictures", path: "/projectdashbord/pictures", icon: FiImage },
  ];

  const can = (item) => true;
  const availableNavItems = navigationItems.filter(item => can(item));

  const activeBg = useColorModeValue("blue.100", "blue.900");
  const activeColor = useColorModeValue("blue.600", "blue.400");
  const defaultColor = useColorModeValue("gray.600", "gray.300");
  const hoverBg = useColorModeValue("gray.100", "gray.600");

  return (
    <Box
      w={{ base: "full", lg: "250px" }}
       h={{ lg: "620px" }}
      bg={useColorModeValue("gray.50", "gray.700")}
      p={3}
      borderRadius="md"
    >
      <VStack spacing={2} align="stretch">
        {availableNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.key;

          return (
            <Button
              key={item.key}
              leftIcon={<Icon />}
              justifyContent="flex-start"
              w="full"
              variant="ghost"
              bg={isActive ? activeBg : "transparent"}
              color={isActive ? activeColor : defaultColor}
              fontWeight={isActive ? "semibold" : "normal"}
              _hover={{ bg: hoverBg, color: activeColor }}
              onClick={() => navigate(item.path)}
            >
              <Text fontSize="sm">{item.label}</Text>
            </Button>
          );
        })}
      </VStack>
    </Box>
  );
};

export default ProjectDashbordSlideBar;
