import React, { useRef, useState, useEffect } from 'react';
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
  IconButton,
  Avatar,
} from '@chakra-ui/react';
import { FiEdit2, FiEye, FiEyeOff, FiTrash2, FiUpload } from 'react-icons/fi';
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
  const cardBg = useColorModeValue('gray.50', 'gray.750');
  
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
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);
  
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

  const profileImageSrc = authAPI.toImageSrc(user?.profileImageUrl);

  const handleSelectProfileImage = () => {
    fileInputRef.current?.click();
  };

  const handleProfileImageChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Profile image must be 5MB or smaller.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setImageLoading(true);
    try {
      const response = await authAPI.uploadProfileImage(selectedFile);
      if (response?.data && updateUser) {
        updateUser(response.data);
      }

      toast({
        title: 'Image updated',
        description: 'Your profile picture was updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to upload profile image.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setImageLoading(false);
      event.target.value = '';
    }
  };

  const handleDeleteProfileImage = async () => {
    setImageLoading(true);
    try {
      const response = await authAPI.deleteProfileImage();
      if (response?.data && updateUser) {
        updateUser(response.data);
      }

      toast({
        title: 'Image removed',
        description: 'Your profile picture was deleted.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.response?.data?.message || 'Failed to delete profile image.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setImageLoading(false);
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
    <Container maxW="960px" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Profile Card */}
        <Card bg={bg} borderColor={borderColor} borderWidth="1px" borderRadius="xl" overflow="hidden">
          <CardBody bg={cardBg}>
            <VStack spacing={5} align="stretch">
              {/* Header with name and edit action */}
              <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <Heading size="md">{user.firstName} {user.lastName}</Heading>
                <Button
                  leftIcon={<FiEdit2 />}
                  colorScheme="blue"
                  size="sm"
                  onClick={onOpen}
                >
                  Edit Profile
                </Button>
              </HStack>

              <Divider borderColor={borderColor} />

              {/* Main content area: details left and image/actions right */}
              <HStack
                align="start"
                spacing={8}
                flexDirection={{ base: 'column', md: 'row' }}
              >
                <VStack spacing={3} align="stretch" flex="1" w="full">
                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">First Name</Text>
                    <Text fontSize="md" fontWeight="semibold">{user.firstName}</Text>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">Last Name</Text>
                    <Text fontSize="md" fontWeight="semibold">{user.lastName}</Text>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">Username</Text>
                    <Text fontSize="md" fontWeight="semibold">{user.username}</Text>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">Email</Text>
                    <Text fontSize="md" fontWeight="semibold">{user.email}</Text>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">EPF Number</Text>
                    <Text fontSize="md" fontWeight="semibold">{user.epfNumber}</Text>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">Division</Text>
                    <Text fontSize="md" fontWeight="semibold">{user.division}</Text>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">Role</Text>
                    <Badge colorScheme={getRoleColor(user.role)} borderRadius="full" px={3} py={1}>
                      {user.role}
                    </Badge>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">Privilege</Text>
                    <Badge colorScheme={getPrivilegeColor(user.privilege)} variant="subtle" borderRadius="full" px={3} py={1}>
                      {getPrivilegeLevelName(user.privilege)}
                    </Badge>
                  </HStack>

                  <HStack align="start" spacing={4}>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.500" minW="120px">Status</Text>
                    <Badge colorScheme={user.isActive ? 'green' : 'red'} borderRadius="full" px={3} py={1}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                </VStack>

                <VStack align="center" spacing={3} w={{ base: 'full', md: '220px' }}>
                  <Avatar
                    size="2xl"
                    name={`${user.firstName} ${user.lastName}`}
                    src={profileImageSrc || undefined}
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<FiUpload />}
                    onClick={handleSelectProfileImage}
                    isLoading={imageLoading}
                    loadingText="Uploading"
                    w="full"
                  >
                    {profileImageSrc ? 'Replace Picture' : 'Add Picture'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    leftIcon={<FiTrash2 />}
                    onClick={handleDeleteProfileImage}
                    isDisabled={!profileImageSrc || imageLoading}
                    isLoading={imageLoading}
                    w="full"
                  >
                    Delete Picture
                  </Button>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    display="none"
                  />
                </VStack>
              </HStack>
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
