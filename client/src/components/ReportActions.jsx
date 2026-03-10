import React from 'react';
import {
  Box,
  ButtonGroup,
  Button,
  IconButton,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  HStack,
  Text,
  Divider
} from '@chakra-ui/react';
import { FiPrinter, FiDownload, FiShare2, FiFile, FiFileText } from 'react-icons/fi';

/**
 * ReportActions component for handling report generation actions
 */
const ReportActions = ({
  onPrint,
  onExportPDF,
  onExportExcel,
  onEmailReport,
  isGenerating = false,
  reportType = 'summary' // summary, detailed, custom
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <HStack justify="space-between" align="center" mb={2}>
        <Text fontWeight="medium">Report Actions</Text>
      </HStack>
      <Divider mb={4} />
      
      <ButtonGroup variant="outline" spacing={4} width="100%">
        <Tooltip label="Print Report">
          <Button 
            leftIcon={<FiPrinter />}
            onClick={onPrint}
            isLoading={isGenerating}
            colorScheme="blue"
            flex={1}
          >
            Print
          </Button>
        </Tooltip>
        
        <Menu>
          <Tooltip label="Export Report">
            <MenuButton
              as={Button}
              rightIcon={<FiDownload />}
              colorScheme="green"
              flex={1}
              isLoading={isGenerating}
            >
              Export
            </MenuButton>
          </Tooltip>
          <MenuList>
            <MenuItem icon={<FiFileText />} onClick={onExportPDF}>
              Export as PDF
            </MenuItem>
            <MenuItem icon={<FiFile />} onClick={onExportExcel}>
              Export as Excel
            </MenuItem>
          </MenuList>
        </Menu>
        
        <Tooltip label="Share Report">
          <Button
            leftIcon={<FiShare2 />}
            onClick={onEmailReport}
            isLoading={isGenerating}
            colorScheme="purple"
            flex={1}
          >
            Email
          </Button>
        </Tooltip>
      </ButtonGroup>
    </Box>
  );
};

export default ReportActions;
