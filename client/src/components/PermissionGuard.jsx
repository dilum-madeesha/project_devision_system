import React from 'react';
import { Box, Text, VStack, Icon, Button } from '@chakra-ui/react';
import { FiLock, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component to show when user doesn't have permission
const UnauthorizedAccess = ({ message, showBackButton = true }) => {
  const navigate = useNavigate();
  const { getPrivilegeName } = useAuth();

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="center" 
      minHeight="60vh"
      textAlign="center"
      p={8}
    >
      <VStack spacing={6}>
        <Icon as={FiLock} boxSize={16} color="gray.400" />
        <VStack spacing={2}>
          <Text fontSize="xl" fontWeight="bold" color="gray.600">
            Access Restricted
          </Text>
          <Text color="gray.500" maxWidth="400px">
            {message || "You don't have sufficient privileges to access this resource."}
          </Text>
          <Text fontSize="sm" color="gray.400">
            Your current privilege level: {getPrivilegeName()}
          </Text>
        </VStack>
        {showBackButton && (
          <Button
            leftIcon={<FiArrowLeft />}
            variant="outline"
            colorScheme="blue"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        )}
      </VStack>
    </Box>
  );
};

// Higher-order component for route protection
export const PermissionGuard = ({ 
  children, 
  requiredFeature, 
  requiredFeatures, 
  requireAll = false,
  fallback,
  showFallback = true 
}) => {
  const { can, canAny, canAll } = useAuth();

  let hasAccess = false;

  if (requiredFeature) {
    hasAccess = can(requiredFeature);
  } else if (requiredFeatures && requiredFeatures.length > 0) {
    hasAccess = requireAll ? canAll(requiredFeatures) : canAny(requiredFeatures);
  } else {
    // No specific requirements, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showFallback) {
      return <UnauthorizedAccess />;
    }
    
    return null;
  }

  return children;
};

// Component to conditionally render based on permissions
export const PermissionCheck = ({ 
  children, 
  requiredFeature, 
  requiredFeatures, 
  requireAll = false,
  fallback = null 
}) => {
  const { can, canAny, canAll } = useAuth();

  let hasAccess = false;

  if (requiredFeature) {
    hasAccess = can(requiredFeature);
  } else if (requiredFeatures && requiredFeatures.length > 0) {
    hasAccess = requireAll ? canAll(requiredFeatures) : canAny(requiredFeatures);
  } else {
    hasAccess = true;
  }

  return hasAccess ? children : fallback;
};

// Component to show disabled state for restricted actions
export const DisabledAction = ({ 
  children, 
  requiredFeature, 
  requiredFeatures, 
  requireAll = false,
  tooltip 
}) => {
  const { can, canAny, canAll, getPrivilegeName } = useAuth();

  let hasAccess = false;

  if (requiredFeature) {
    hasAccess = can(requiredFeature);
  } else if (requiredFeatures && requiredFeatures.length > 0) {
    hasAccess = requireAll ? canAll(requiredFeatures) : canAny(requiredFeatures);
  } else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return React.cloneElement(children, {
      isDisabled: true,
      cursor: 'not-allowed',
      opacity: 0.6,
      title: tooltip || `Insufficient privileges. Required access level not met. (Current: ${getPrivilegeName()})`,
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }

  return children;
};

export default PermissionGuard;
