import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  Text,
  useColorModeValue,
  Badge,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  Flex,
  Heading,
  Button,
} from '@chakra-ui/react';

/**
 * CostTable component for displaying cost data in various formats
 */
const CostTable = ({
  data = [],
  mode = 'daily', // daily, weekly, monthly, yearly, total
  isLoading = false,
  error = null,
  totals = { laborCost: 0, materialCost: 0, totalCost: 0 },
  onView = null // New prop for view functionality
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.600');
  const totalRowBg = useColorModeValue('blue.50', 'blue.900');
  
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="blue.500"
          size="xl"
        />
      </Center>
    );
  }
  
  if (error) {
    return (
      <Alert
        status="error"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
        borderRadius="md"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Error Loading Cost Data
        </AlertTitle>
        <Text>{error}</Text>
      </Alert>
    );
  }
  
  if (data.length === 0) {
    return (
      <Alert
        status="info"
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
        borderRadius="md"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          No cost data found
        </AlertTitle>
        <Text>Try selecting a different date range or check if costs have been recorded.</Text>
      </Alert>
    );
  }

  // Format number as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  const handleView = (item) => {
    // Call the onView prop if provided, otherwise log
    if (onView) {
      onView(item);
    } else {
      console.log("View cost item:", item);
    }
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden"
      shadow="sm"
    >
      <Box p={4}>
        <Heading size="md" mb={4}>
          {mode === 'daily' && 'Daily Cost Breakdown'}
          {mode === 'weekly' && 'Weekly Cost Breakdown'}
          {mode === 'monthly' && 'Monthly Cost Breakdown'}
          {mode === 'yearly' && 'Yearly Cost Breakdown'}
          {mode === 'total' && 'Total Cost Breakdown'}
        </Heading>
      </Box>

      <Box overflowX="auto">
        <Table variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              <Th>Job Number</Th>
              <Th>Job Title</Th>
              <Th isNumeric>Labor Cost</Th>
              <Th isNumeric>Material Cost</Th>
              <Th isNumeric>Total Job Cost</Th>
              {onView && <Th>Action</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item, index) => (
              <Tr key={item.id || index}>
                <Td fontWeight="medium">{item.jobNumber || item.job?.jobNumber || '-'}</Td>
                <Td>{item.title || item.job?.title || '-'}</Td>
                <Td isNumeric>{formatCurrency(item.laborCost || 0)}</Td>
                <Td isNumeric>{formatCurrency(item.materialCost || 0)}</Td>
                <Td isNumeric fontWeight="bold">{formatCurrency((item.laborCost || 0) + (item.materialCost || 0))}</Td>
                <Td>
                  {onView && (
                    <Button size="sm" colorScheme="green" onClick={() => handleView(item)}>
                      View
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
          <Tfoot bg={totalRowBg}>
            <Tr>
              <Td colSpan={2} fontWeight="bold">TOTALS</Td>
              <Td isNumeric fontWeight="bold">{formatCurrency(totals.laborCost)}</Td>
              <Td isNumeric fontWeight="bold">{formatCurrency(totals.materialCost)}</Td>
              <Td isNumeric fontWeight="bold">{formatCurrency(totals.totalCost)}</Td>
              {onView && <Td></Td>}
            </Tr>
          </Tfoot>
        </Table>
      </Box>
    </Box>
  );
};

export default CostTable;
