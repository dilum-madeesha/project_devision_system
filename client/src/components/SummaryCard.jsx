import React from 'react';
import {
  Box,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  HStack,
  VStack,
  useColorModeValue,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FiDollarSign, FiUsers, FiPackage, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

/**
 * Summary Card component for displaying cost summaries
 */
const SummaryCard = ({
  title,
  amount,
  comparison,
  type = 'total', // total, labor, material
  period = 'daily',
  percentChange = 0,
  isLoading = false,
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');
  
  let icon;
  let colorScheme;
  
  switch(type) {
    case 'labor':
      icon = FiUsers;
      colorScheme = 'blue';
      break;
    case 'material':
      icon = FiPackage;
      colorScheme = 'green';
      break;
    default:
      icon = FiDollarSign;
      colorScheme = 'purple';
  }

  // Format amount as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box
      bg={bgColor}
      p={2}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      transition="transform 0.3s"
      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
    >
      <HStack spacing={4} align="flex-start">
        <Box
          p={2}
          borderRadius="md"
          bg={`${colorScheme}.100`}
          color={`${colorScheme}.500`}
        >
          <Icon as={icon} boxSize={6} />
        </Box>
        
        <VStack align="start" spacing={1} flex={1}>
          <Heading size="sm" color={textColor}>
            {title || `${period.charAt(0).toUpperCase() + period.slice(1)} ${type.charAt(0).toUpperCase() + type.slice(1)} Cost`}
          </Heading>
          
          <Stat>
            <StatNumber fontSize="xl" fontWeight="bold">
              {formatCurrency(amount || 0)}
            </StatNumber>
            
            {comparison && percentChange !== 0 && (
              <StatHelpText>
                <StatArrow type={percentChange >= 0 ? 'increase' : 'decrease'} />
                {Math.abs(percentChange)}% {comparison}
              </StatHelpText>
            )}
          </Stat>
        </VStack>
      </HStack>
    </Box>
  );
};

export default SummaryCard;
