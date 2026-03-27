import {
  Container,
  VStack,
  Heading,
  Box,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  HStack,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputRightElement,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Avatar,
  Text,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { userAPI } from "../../../api";

const AddUserPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    epfNumber: "",
    password: "",
    firstName: "",
    lastName: "",
    division: "",
    role: "WORKER",
    isActive: true,
    privilege: 5
  });


  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? e.target.checked : 
             name === 'privilege' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare payload with type conversions
      const payload = { ...formData };
      if (payload.epfNumber) payload.epfNumber = parseInt(payload.epfNumber);
      if (payload.privilege) payload.privilege = parseInt(payload.privilege);
      // isActive already boolean

      const result = await userAPI.create(payload);

      const createdUserId =
        result?.data?.id ||
        result?.data?.data?.id ||
        result?.id;

      if (profileImageFile && createdUserId) {
        try {
          await userAPI.uploadImage(createdUserId, profileImageFile);
        } catch (uploadError) {
          toast({
            title: "User created",
            description: "User was created, but profile image upload failed.",
            status: "warning",
            duration: 4000,
            isClosable: true,
          });
        }
      }

      toast({
        title: "Success",
        description: "User created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/register/users");
    } catch (err) {
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Profile image must be 5MB or smaller.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  return (
  <Container maxW="800px" py={0.1}>
    <VStack spacing={4} align="stretch">
      {/* Breadcrumb Navigation */}
      <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/register" color="blue.500">
            Register
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/register/users" color="blue.500">
            Users
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color="purple.500" fontWeight="bold" fontSize="x-large">
            New User
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" p={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>

              

              {/* Username and Email */}
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Username</FormLabel>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter unique username"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </FormControl>
              </HStack>

              {/* EPF Number and Password */}
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>EPF Number</FormLabel>
                  <NumberInput>
                    <NumberInputField
                      name="epfNumber"
                      value={formData.epfNumber}
                      onChange={handleChange}
                      placeholder="Enter EPF number"
                    />
                  </NumberInput>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                    />
                    <InputRightElement>
                      <Button
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        size="sm"
                      >
                        {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
              </HStack>

              {/* Name Fields */}
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                </FormControl>
              </HStack>

              {/* <HStack spacing={4} w="full" align="center">
                <Avatar
                  size="lg"
                  name={`${formData.firstName} ${formData.lastName}`}
                  src={profileImagePreview || undefined}
                />
                <VStack align="start" spacing={2} w="full">
                  <FormControl>
                    <FormLabel mb={1}>Profile Image (Optional)</FormLabel>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      p={1}
                    />
                    <Text fontSize="xs" color="gray.500">
                      JPG, PNG, or WebP. Max 5MB.
                    </Text>
                  </FormControl>
                </VStack>
              </HStack> */}

              {/* Division and Role */}
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Division</FormLabel>
                  <Select
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    placeholder="Select division"
                  >
                    <option value="Project">Project</option>

                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="WORKER">Worker</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="HEAD">Head</option>
                    <option value="DEPUTY_HEAD">Deputy Head</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="CHIEF_ENGINEER">Chief Engineer</option>
                    <option value="ENGINEER">Engineer</option>
                    <option value="ASSISTANT_ENGINEER">Assistant Engineer</option>
                    <option value="TECHNICAL_OFFICER">Technical Officer</option>
                    <option value="SECRETARY">Secretary</option>
                    <option value="TRAINEE">Trainee</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </FormControl>
              </HStack>

              {/* Privilege and Status */}
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Privilege Level</FormLabel>
                  <Select
                    name="privilege"
                    value={formData.privilege}
                    onChange={handleChange}
                    placeholder="Select privilege level"
                  >
                    <option value={1}>L1 - System Admin</option>
                    <option value={2}>L2 - Operation Viewer</option>
                    <option value={3}>L3 - Operation Manager</option>
                    <option value={4}>L4 - Registration Manager</option>
                    <option value={5}>L5 - Job Cost Manager</option>
                    <option value={6}>L6 - Labor Cost Manager</option>
                    <option value={7}>L7 - Material Cost Manager</option>
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="isActive"
                    value={formData.isActive}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      isActive: e.target.value === 'true'
                    }))}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </Select>
                </FormControl>
              </HStack>
               <HStack spacing={4} w="full" align="center">
                <Avatar
                  size="lg"
                  name={`${formData.firstName} ${formData.lastName}`}
                  src={profileImagePreview || undefined}
                />
                <VStack align="start" spacing={2} w="full">
                  <FormControl>
                    <FormLabel mb={1}>Profile Image (Optional)</FormLabel>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      p={1}
                    />
                    <Text fontSize="xs" color="gray.500">
                      JPG, PNG, or WebP. Max 5MB.
                    </Text>
                  </FormControl>
                </VStack>
              </HStack>

              {/* Submit Buttons */}
              <HStack spacing={4} w="full" pt={4}>
                <Button
                  type="submit"
                  colorScheme="purple"
                  isLoading={loading}
                  loadingText="Creating..."
                  flex={1}
                >
                  Create User
                </Button>
                <Link to="/register/users">
                  <Button variant="outline" flex={1}>
                    Cancel
                  </Button>
                </Link>
              </HStack>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  );
};

export default AddUserPage;