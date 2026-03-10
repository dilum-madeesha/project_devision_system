import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Badge,
  Divider,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react';
import { FiEdit2, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../api';
import { getPrivilegeLevelName } from '../../utils/permissions';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // UI colors
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  
  // Form state
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setEditData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      }));
    }
  }, [user]);
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!editData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!editData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    // If password fields are filled, validate them
    if (editData.currentPassword || editData.newPassword || editData.confirmPassword) {
      if (!editData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      
      if (!editData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (editData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters';
      }
      
      if (editData.newPassword !== editData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Update profile (name fields)
      const profileData = {
        firstName: editData.firstName,
        lastName: editData.lastName
      };
      
      const profileResponse = await authAPI.updateProfile(profileData);
      
      // Update password if provided
      if (editData.currentPassword && editData.newPassword) {
        await authAPI.changePassword({
          currentPassword: editData.currentPassword,
          newPassword: editData.newPassword
        });
      }
      
      // Update user in context
      if (updateUser) {
        updateUser(profileResponse.data);
      }
      
      // Clear password fields
      setEditData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update Failed',
        description: error.response?.data?.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel edit
  const handleCancel = () => {
    setEditData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({});
    onClose();
  };
  
  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'MANAGER': return 'orange';
      case 'USER': return 'blue';
      default: return 'gray';
    }
  };
  
  // Get privilege color
  const getPrivilegeColor = (privilege) => {
    switch (privilege) {
      case 1: return 'purple'; // L1 - System Admin
      case 2: return 'blue';   // L2 - Operation Viewer
      case 3: return 'green';  // L3 - Operation Manager
      case 4: return 'orange'; // L4 - Registration Manager
      case 5: return 'teal';   // L5 - Job Cost Manager
      case 6: return 'cyan';   // L6 - Labor Cost Manager
      case 7: return 'pink';   // L7 - Material Cost Manager
      default: return 'gray';
    }
  };
  
  if (!user) {
    return (
      <Container maxW="1200px" py={8}>
        <Center>
          <Spinner size="xl" />
        </Center>
      </Container>
    );
  }
  
  return (
    <Container maxW="800px" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Page Header */}
        <Box>
          <Heading size="lg" mb={2}>User Profile</Heading>
          <Text color="gray.600">View and manage your profile information</Text>
        </Box>
        
        {/* Profile Card */}
        <Card bg={bg} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={6} align="stretch">
              {/* Header with Edit Button */}
              <HStack justify="space-between" align="start">
                <VStack align="start" spacing={1}>
                  <Heading size="md">{user.firstName} {user.lastName}</Heading>
                </VStack>
                <Button
                  leftIcon={<FiEdit2 />}
                  colorScheme="blue"
                  size="sm"
                  onClick={onOpen}
                >
                  Edit Profile
                </Button>
              </HStack>
              
              <Divider />
              
              {/* Profile Information */}
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    First Name :
                  </Text>
                  <Text fontSize="md" flex="1" textAlign="left" ml={4}>
                    {user.firstName}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    Last Name :
                  </Text>
                  <Text fontSize="md" flex="1" textAlign="left" ml={4}>
                    {user.lastName}
                  </Text>
                </HStack>
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    Username:
                  </Text>
                  <Text fontSize="md" flex="1" textAlign="left" ml={4}>
                    {user.username}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    Email :
                  </Text>
                  <Text fontSize="md" flex="1" textAlign="left" ml={4}>
                    {user.email}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    EPF Number :
                  </Text>
                  <Text fontSize="md" flex="1" textAlign="left" ml={4}>
                    {user.epfNumber}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    Division :
                  </Text>
                  <Text fontSize="md" flex="1" textAlign="left" ml={4}>
                    {user.division}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    Role :
                  </Text>
                  <HStack flex="1" ml={4}>
                    <Badge colorScheme={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </HStack>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    Privilege Level :
                  </Text>
                  <HStack flex="1" ml={4}>
                    <Badge colorScheme={getPrivilegeColor(user.privilege)} variant="subtle">
                      {getPrivilegeLevelName(user.privilege)}
                    </Badge>
                  </HStack>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" fontWeight="medium" color="gray.500" minW="100px">
                    Status :
                  </Text>
                  <HStack flex="1" ml={4}>
                    <Badge colorScheme={user.isActive ? 'green' : 'red'} size="sm">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Edit Profile Modal */}
        <Modal isOpen={isOpen} onClose={handleCancel} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Profile</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                {/* Name Fields */}
                <FormControl isInvalid={!!errors.firstName}>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    value={editData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                  <FormErrorMessage>{errors.firstName}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.lastName}>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    value={editData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                  <FormErrorMessage>{errors.lastName}</FormErrorMessage>
                </FormControl>
                
                <Divider />
                
                {/* Password Change Section */}
                <Text fontSize="md" fontWeight="medium" color="gray.600">
                  Change Password (Optional)
                </Text>
                
                <FormControl isInvalid={!!errors.currentPassword}>
                  <FormLabel>Current Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={editData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        icon={showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.newPassword}>
                  <FormLabel>New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={editData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        icon={showNewPassword ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.confirmPassword}>
                  <FormLabel>Confirm New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={editData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        icon={showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        variant="ghost"
                        size="sm"
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                </FormControl>
              </VStack>
            </ModalBody>
            
            <ModalFooter>
              <HStack spacing={3}>
                <Button variant="ghost" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSubmit}
                  isLoading={loading}
                  loadingText="Updating..."
                >
                  Update Profile
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default ProfilePage;
