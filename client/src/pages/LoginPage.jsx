
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  VStack,
  Divider,
  Icon,
  Flex,
  Spinner,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { FiUser, FiLock } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ParticleCanvas from "../components/animation";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    identifier: '', // This will be username or email
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  // Color mode values
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const pageBg = useColorModeValue('#eef2f7', 'gray.900');

  // Remove scrollbar from body when this page mounts
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Redirect if already authenticated using same logic as handleSubmit
  const routeForPrivilege = (userPrivilege) => {
    // privilege numbers defined server‑side with 1=system admin, 2=viewer etc.
    if (userPrivilege === 5 || userPrivilege === 6 || userPrivilege === 7) {
      return '/addcost';
    }
    if (userPrivilege === 4) {
      return '/register';
    }
    // default for L1/L2/L3 (and any unrecognised value): show system
    // selection so the user can pick cost/project before proceeding.
    return '/systems';
  };

  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(routeForPrivilege(user?.privilege));
    }
  }, [isAuthenticated, navigate]);


  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Username or email is required';
    } else if (formData.identifier.includes('@')) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.identifier)) {
        newErrors.identifier = 'Please enter a valid email address';
      }
    } else {
      // Username validation
      if (formData.identifier.length < 3) {
        newErrors.identifier = 'Username must be at least 3 characters long';
      } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.identifier)) {
        newErrors.identifier = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) {
      clearError();
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({}); // Clear previous errors
    clearError(); // Clear auth context errors
    
    // Prepare login data based on whether identifier is email or username
    const loginData = {
      password: formData.password,
    };
    
    // Check if identifier is email or username
    const isEmail = formData.identifier.includes('@');
    if (isEmail) {
      loginData.email = formData.identifier;
    } else {
      loginData.username = formData.identifier;
    }
    
    try {
      const result = await login(loginData);
      
      if (result.success) {
        // Redirect based on user privilege level
        const userPrivilege = result.user?.privilege;
        
        navigate(routeForPrivilege(userPrivilege));
      } else {
        // Handle specific error cases
        const errorMessage = result.error?.message || error?.message || 'Login failed';
        
        // Map common error messages to user-friendly ones
        let userFriendlyMessage = errorMessage;
        let fieldErrors = {};
        
        if (errorMessage.toLowerCase().includes('invalid credentials') || 
            errorMessage.toLowerCase().includes('invalid username') ||
            errorMessage.toLowerCase().includes('user not found')) {
          fieldErrors.identifier = isEmail ? 
            'No account found with this email address' : 
            'Username not found';
        } else if (errorMessage.toLowerCase().includes('invalid password') ||
                   errorMessage.toLowerCase().includes('incorrect password')) {
          fieldErrors.password = 'Incorrect password. Please try again.';
        } else if (errorMessage.toLowerCase().includes('account locked') ||
                   errorMessage.toLowerCase().includes('account disabled')) {
          userFriendlyMessage = 'Your account has been disabled. Please contact administrator.';
        } else if (errorMessage.toLowerCase().includes('too many attempts')) {
          userFriendlyMessage = 'Too many failed login attempts. Please try again later.';
        } else if (errorMessage.toLowerCase().includes('network') ||
                   errorMessage.toLowerCase().includes('connection')) {
          userFriendlyMessage = 'Unable to connect to server. Please check your internet connection and try again.';
        } else if (result.error?.errors) {
          // Handle server validation errors
          fieldErrors = result.error.errors;
        }
        
        setErrors(fieldErrors);
        
        // If there are field-specific errors, don't show general error
        if (Object.keys(fieldErrors).length === 0) {
          // Update the auth context error with user-friendly message
          // This will display in the alert at the top
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({});
      // This will be handled by the auth context and displayed in the alert
    }
    
    setIsSubmitting(false);
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      w="100vw"
      h="100vh"
      bg={pageBg}
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <ParticleCanvas />

      <Container maxW="lg" position="relative" zIndex={1} px={{ base: '4', sm: '8' }}>
      
        <Stack spacing="8">
          <Stack spacing="6">
            <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
              <Heading size={{ base: 'md', md: 'lg' }}>
                LOGIN SYSTEM
              </Heading>
              <Text color={textColor}>
                Projects Division
              </Text>
            </Stack>
          </Stack>
        
        <Box
          py={{ base: '0', sm: '8' }}
          px={{ base: '4', sm: '10' }}
          bg={bg}
          boxShadow={{ base: 'none', sm: 'md' }}
          borderRadius={{ base: 'none', sm: 'xl' }}
          border={{ base: 'none', sm: '1px solid' }}
          borderColor={borderColor}
        >
          
          <form onSubmit={handleSubmit}>
            <Stack spacing="6">
              {/* General Error Alert */}
              {error && error.message && Object.keys(errors).length === 0 && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">Login Failed</Text>
                    <Text fontSize="sm" mt={1}>
                      {error.message.includes('Cannot connect to server') ? 
                        'Unable to connect to server. Using demo mode - try username: demo, password: demo123' :
                        error.message.includes('invalid credentials') || error.message.includes('Invalid username') ?
                        'Invalid username or password. Please check your credentials and try again.' :
                        error.message
                      }
                    </Text>
                  </Box>
                </Alert>
              )}
              
              {/* Success Alert for Demo Mode */}
              {error && error.message && error.message.includes('demo mode') && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="medium">Demo Mode Active</Text>
                    <Text fontSize="sm" mt={1}>
                      Server unavailable. Use <strong>username: demo</strong> and <strong>password: demo123</strong> to access the demo.
                    </Text>
                  </Box>
                </Alert>
              )}
              
              <Stack spacing="5">
                {/* Username/Email Field */}
                <FormControl isInvalid={errors.identifier}>
                  <FormLabel htmlFor="identifier">Username or Email</FormLabel>
                  <InputGroup>
                    <Input
                      id="identifier"
                      name="identifier"
                      type="text"
                      value={formData.identifier}
                      onChange={handleChange}
                      placeholder="Enter your username or email"
                      focusBorderColor="blue.500"
                      errorBorderColor="red.500"
                      borderColor={errors.identifier ? 'red.500' : undefined}
                    />
                    <InputRightElement>
                      <Icon as={FiUser} color={errors.identifier ? "red.500" : "gray.400"} />
                    </InputRightElement>
                  </InputGroup>
                  {errors.identifier && (
                    <Alert status="error" mt={2} borderRadius="md" py={2}>
                      <AlertIcon boxSize={4} />
                      <Text fontSize="sm">
                        {errors.identifier}
                      </Text>
                    </Alert>
                  )}
                </FormControl>

                {/* Password Field */}
                <FormControl isInvalid={errors.password}>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <InputGroup>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      focusBorderColor="blue.500"
                      errorBorderColor="red.500"
                      borderColor={errors.password ? 'red.500' : undefined}
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        size="sm"
                        color={errors.password ? "red.500" : undefined}
                      >
                        {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  {errors.password && (
                    <Alert status="error" mt={2} borderRadius="md" py={2}>
                      <AlertIcon boxSize={4} />
                      <Text fontSize="sm">
                        {errors.password}
                      </Text>
                    </Alert>
                  )}
                </FormControl>
              </Stack>

              {/* Submit Button */}
              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                fontSize="md"
                isLoading={isSubmitting}
                loadingText="Signing in..."
                disabled={isSubmitting}
              >
                Sign In
              </Button>
            </Stack>
          </form>
          
          {/* Demo Mode and Help Section */}
          <Divider my={6} />
          <VStack spacing={4}>
            {/* Help text */}
            <Text fontSize="xs" color={textColor} textAlign="center">
              Having trouble logging in? Check your username/email and password, or contact your administrator.
            </Text>
          </VStack>
        </Box>
      </Stack>
    </Container>
    </Box>
  );
};

export default LoginPage;