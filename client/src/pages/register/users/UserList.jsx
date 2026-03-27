import {
  Container,
  VStack,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Box,
  HStack,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Text,
  IconButton,
  Tooltip,
  useToast,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Avatar,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import { userAPI } from "../../../api";
import { useAuth } from "../../../contexts/AuthContext";

const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 8;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Edit modal state
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    epfNumber: '',
    firstName: '',
    lastName: '',
    division: '',
    role: 'WORKER',
    privilege: 5,
    isActive: true
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  // Delete confirmation state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const cancelRef = useRef();

  const toast = useToast();
  const { user } = useAuth();

  
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters whenever filter values or allUsers change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, roleFilter, divisionFilter, statusFilter, allUsers]);

  const applyFilters = () => {
    let filtered = [...allUsers];

    // Sort by earliest first (using createdAt if available, otherwise using ID as fallback)
    filtered.sort((a, b) => {
      const getDateForSorting = (user) => {
        // Try to use createdAt first, then fall back to ID for earliest registration
        return new Date(user.createdAt || 0).getTime() || user.id || 0;
      };
      
      return getDateForSorting(a) - getDateForSorting(b); // Earliest first (ascending order)
    });

    // Apply search filter (search in EPF, username, email, first name, last name)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => {
        const epfNumber = (user.epfNumber || '').toString().toLowerCase();
        const username = (user.username || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const firstName = (user.firstName || '').toLowerCase();
        const lastName = (user.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return epfNumber.includes(searchTermLower) || 
               username.includes(searchTermLower) || 
               email.includes(searchTermLower) ||
               firstName.includes(searchTermLower) ||
               lastName.includes(searchTermLower) ||
               fullName.includes(searchTermLower);
      });
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply division filter
    if (divisionFilter) {
      filtered = filtered.filter(user => user.division === divisionFilter);
    }

    // Apply status filter
    if (statusFilter) {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
    
    // Reset pagination when filters change
    const newTotalPages = Math.ceil(filtered.length / recordsPerPage);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
    setCurrentPage(1);
    
    // Set current page data
    const startIndex = 0;
    const endIndex = Math.min(recordsPerPage, filtered.length);
    setUsers(filtered.slice(startIndex, endIndex));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setDivisionFilter('');
    setStatusFilter('');
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    const dataToUse = filteredUsers.length > 0 ? filteredUsers : allUsers;
    
    setCurrentPage(newPage);
    const startIndex = (newPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, dataToUse.length);
    
    setUsers(dataToUse.slice(startIndex, endIndex));
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await userAPI.getAll();
      
      // Handle different response structures
      let usersData = [];
      if (response && Array.isArray(response)) {
        usersData = response;
      } else if (response && response.data && response.data.users && Array.isArray(response.data.users)) {
        // Handle nested structure: {success: true, data: {users: [...], pagination: {...}}}
        usersData = response.data.users;
      } else if (response && response.data && Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response && response.users && Array.isArray(response.users)) {
        usersData = response.users;
      }
      
      setAllUsers(usersData);
      setFilteredUsers(usersData);
      
      // Calculate total pages
      const newTotalPages = Math.ceil(usersData.length / recordsPerPage);
      setTotalPages(newTotalPages > 0 ? newTotalPages : 1);
      
      // Set current page data
      const startIndex = 0;
      const endIndex = Math.min(recordsPerPage, usersData.length);
      setUsers(usersData.slice(startIndex, endIndex));
    } catch (err) {
      console.error("Complete error object:", err);
      console.error("Error message:", err.message);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error code:", err.code);
      
      // Set user-friendly error message based on error type
      let errorMessage = "Failed to fetch users";
      
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        errorMessage = "Unable to connect to server. Please check your connection.";
      } else if (err.response?.status === 401) {
        errorMessage = "You are not authorized to view users. Please log in again.";
      } else if (err.response?.status === 403) {
        errorMessage = "You don't have permission to view users. Contact your administrator.";
      } else if (err.response?.status === 404) {
        errorMessage = "User service not found. Please contact technical support.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error occurred. Please try again later.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setUsers([]); // Ensure users is always an array
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      epfNumber: user.epfNumber ? user.epfNumber.toString() : '',
      firstName: user.firstName,
      lastName: user.lastName,
      division: user.division || '',
      role: user.role,
      privilege: user.privilege || 5,
      isActive: user.isActive
    });
    setEditImageFile(null);
    setRemoveCurrentImage(false);
    onEditOpen();
  };

  const handleEditImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Profile image must be 5MB or smaller.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setEditImageFile(file);
    setRemoveCurrentImage(false);
  };


  const handleEditSubmit = async () => {
    if (!editingUser) return;

    setEditLoading(true);
    try {
      // simply update with JSON
      await userAPI.update(editingUser.id, {
        ...editFormData,
        epfNumber: editFormData.epfNumber ? parseInt(editFormData.epfNumber) : undefined,
        privilege: editFormData.privilege ? parseInt(editFormData.privilege) : undefined
      });

      if (removeCurrentImage) {
        await userAPI.deleteImage(editingUser.id);
      } else if (editImageFile) {
        await userAPI.uploadImage(editingUser.id, editImageFile);
      }

      toast({
        title: "Success",
        description: "User updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchUsers(); // Refresh the list
      onEditClose();
      setEditImageFile(null);
      setRemoveCurrentImage(false);
    } catch (err) {
      console.error("Error updating user:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update user",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setDeleteLoading(true);
    try {
      await userAPI.delete(deletingUser.id);
      toast({
        title: "Success",
        description: "User deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      await fetchUsers(); // Refresh the list
      onDeleteClose();
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete user",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const roleColors = {
      ADMIN: "red",
      MANAGER: "purple",
      SUPERVISOR: "blue",
      WORKER: "green",
      HEAD: "teal",
      DEPUTY_HEAD: "cyan",
      PROJECT_MANAGER: "orange",
      CHIEF_ENGINEER: "yellow",
      ENGINEER: "pink",
      ASSISTANT_ENGINEER: "linkedin",
      TECHNICAL_OFFICER: "telegram",
      SECRETARY: "messenger",
      TRAINEE: "facebook",
      OTHER: "gray"
    };
    return roleColors[role] || "gray";
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canDelete = user?.role === 'ADMIN';

  if (loading) {
    return (
      <Container maxW="1400px" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Heading size="md">Loading users...</Heading>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="1400px" py={0.1}>
      <VStack spacing={2} align="stretch">
        {/* Breadcrumb Navigation */}
      <Breadcrumb fontSize="sm" color="gray.600" mb={0.1} py={0.2}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/register" color="blue.500">
            Register
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color="purple.500" fontWeight="bold" fontSize="x-large">
            User List
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      <HStack justify="space-between">
        <Text color="gray.600">Manage system users and access control</Text>
        <Link to="/register/users/add">
          <Button leftIcon={<FiPlus />} colorScheme="blue">
            Add New User
          </Button>
        </Link>
      </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Error Loading Users</Text>
              <Text fontSize="sm" mt={1}>{error}</Text>
              <Button 
                size="sm" 
                colorScheme="red" 
                variant="outline" 
                mt={2}
                onClick={fetchUsers}
              >
                Try Again
              </Button>
            </Box>
          </Alert>
        )}

        {/* Filters and Pagination Controls */}
        <Box py={2} px={4} borderBottomWidth="2px" borderBottomColor={borderColor}>
            <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={4}>
              {/* Filter Controls */}
              <HStack spacing={3} flexWrap="wrap">
                <HStack spacing={2}>
                  <Input
                    size="sm"
                    width="250px"
                    placeholder="Search EPF, username, email, name..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                  <Select
                    size="sm"
                    width="180px"
                    placeholder="All Roles"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="WORKER">Worker</option>
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
                  <Select
                    size="sm"
                    width="120px"
                    placeholder="All Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                  {(searchTerm || roleFilter || divisionFilter || statusFilter) && (
                    <IconButton
                      size="sm"
                      icon={<FiX />}
                      variant="ghost"
                      colorScheme="gray"
                      onClick={clearFilters}
                      aria-label="Clear filters"
                      title="Clear all filters"
                    />
                  )}
                </HStack>
              </HStack>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <HStack spacing={3}>
                  <Text fontSize="sm" px={4} color="gray.600">
                    {users.length > 0 ? (
                      <>
                        Showing {(currentPage - 1) * recordsPerPage + 1} to {(currentPage - 1) * recordsPerPage + users.length} of {filteredUsers.length > 0 ? filteredUsers.length : allUsers.length} records
                      </>
                    ) : (
                      <>No records to display</>
                    )}
                  </Text>
                  <HStack>
                    <Button 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      isDisabled={currentPage === 1 || loading}
                      colorScheme="purple"
                      variant="outline"
                      leftIcon={loading ? <Spinner size="xs" /> : undefined}
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm" px={2}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Button 
                      size="sm" 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      isDisabled={currentPage === totalPages || loading}
                      colorScheme="purple"
                      variant="outline"
                      rightIcon={loading ? <Spinner size="xs" /> : undefined}
                    >
                      Next
                    </Button>
                  </HStack>
                </HStack>
              )}
            </Flex>
          </Box>

        {/* users table */}
        <Box bg={bg} borderWidth="1px" borderColor={borderColor} borderRadius="lg" overflow="hidden">
          <TableContainer whiteSpace="normal">
            <Table variant="simple" size="sm" layout="fixed">
              <Thead backgroundColor={"blue.50"}>
                <Tr>
                  <Th py={3} px={2} width="60px">ID</Th>
                  <Th py={3} px={2} width="100px">EPF</Th>
                  <Th py={3} px={2} width="120px">Username</Th>
                  <Th py={3} px={2} width="180px">Email</Th>
                  <Th py={3} px={2} width="150px">Full Name</Th>
                  <Th py={3} px={2} width="120px">Division</Th>
                  <Th py={3} px={2} width="100px">Role</Th>
                  <Th py={3} px={2} width="80px">Privilege</Th>
                  <Th py={3} px={2} width="80px">Status</Th>
                  {(canEdit || canDelete) && <Th py={3} px={2} width="120px">Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {Array.isArray(users) && users.map((user,index) => (
                  <Tr key={user.id}>
                    <Td py={2} px={2} fontWeight="medium">{(currentPage - 1) * recordsPerPage + index + 1}</Td>
                    <Td py={2} px={2} fontWeight="medium">{user.epfNumber || 'N/A'}</Td>
                    <Td py={2} px={2} fontWeight="medium" isTruncated>{user.username}</Td>
                    <Td py={2} px={2} isTruncated title={user.email}>{user.email}</Td>
                    <Td py={2} px={2} isTruncated>{`${user.firstName || ''} ${user.lastName || ''}`.trim()}</Td>
                    <Td py={2} px={2} isTruncated>{user.division || 'N/A'}</Td>
                    <Td py={2} px={2}>
                      <Badge colorScheme={getRoleColor(user.role)} size="sm">
                        {user.role}
                      </Badge>
                    </Td>
                    <Td py={2} px={2}>
                      <Badge colorScheme="cyan" size="sm">
                        L{user.privilege || 1}
                      </Badge>
                    </Td>
                    <Td py={2} px={2}>
                      <Badge colorScheme={user.isActive ? "green" : "red"} size="sm">
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    {(canEdit) && (
                    <Td py={2} px={1}>
                        <HStack spacing={4}>
                          {canEdit && (
                            <Tooltip label="Edit User">
                              <Button
                                size="2xs"
                                leftIcon={<FiEdit2 />}
                                variant="outline"
                                colorScheme="blue"
                                p={1}
                                onClick={() => handleEditUser(user)}
                              />
                            </Tooltip>
                          )}
                          {/* {canDelete && (
                            <Tooltip label="Delete User">
                              <Button
                                size="2xs"
                                leftIcon={<FiTrash2 />}
                                variant="outline"
                                colorScheme="red"
                                p={1}
                                onClick={() => handleDeleteUser(user)}
                              />
                            </Tooltip>
                          )} */}
                        </HStack>
                    </Td>
                    )}
                  </Tr>
                  ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>

        {Array.isArray(users) && users.length === 0 && !loading && (
          <Box textAlign="center" py={8}>
            <Heading size="md" color="gray.500" mb={4}>
              {(searchTerm || roleFilter || divisionFilter || statusFilter) ? "No users found" : "No users found"}
            </Heading>
            {(searchTerm || roleFilter || divisionFilter || statusFilter) ? (
              <Text color="gray.500">
                No users match your search criteria. Try adjusting your filters or search terms.
              </Text>
            ) : (
              <>
                <Text color="gray.500" mb={4}>
                  No users have been registered yet.
                </Text>
                {canEdit && (
                  <Link to="/register/users/add">
                    <Button colorScheme="purple">
                      Add Your First User
                    </Button>
                  </Link>
                )}
              </>
            )}
          </Box>
        )}

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit User</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>

                <HStack w="100%" align="center" spacing={4}>
                  <Avatar
                    size="lg"
                    name={`${editingUser?.firstName || ''} ${editingUser?.lastName || ''}`.trim()}
                    src={removeCurrentImage ? undefined : userAPI.toImageSrc(editingUser?.profileImageUrl) || undefined}
                  />
                  <VStack align="start" spacing={2}>
                    <FormControl>
                      <FormLabel mb={1}>Profile Image</FormLabel>
                      <Input type="file" accept="image/*" onChange={handleEditImageChange} p={1} />
                    </FormControl>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => {
                        setRemoveCurrentImage(true);
                        setEditImageFile(null);
                      }}
                      isDisabled={!editingUser?.profileImageUrl}
                    >
                      Remove Current Image
                    </Button>
                  </VStack>
                </HStack>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Username</FormLabel>
                    <Input
                      value={editFormData.username}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter username"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>EPF Number</FormLabel>
                    <Input
                      value={editFormData.epfNumber}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, epfNumber: e.target.value }))}
                      placeholder="Enter EPF number"
                      type="number"
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email"
                    type="email"
                  />
                </FormControl>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      value={editFormData.firstName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="Enter first name"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Enter last name"
                    />
                  </FormControl>
                </HStack>

                <FormControl isRequired>
                  <FormLabel>Division</FormLabel>
                  <Input
                    value={editFormData.division}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, division: e.target.value }))}
                    placeholder="Enter division"
                  />
                </FormControl>

                <HStack spacing={4} width="100%">
                  <FormControl isRequired>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="WORKER">Worker</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                      <option value="HEAD">Head</option> {/*Adding the More options (2025.12.04)*/}
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

                  <FormControl isRequired>
                    <FormLabel>Privilege Level</FormLabel>
                    <Select
                      value={editFormData.privilege}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, privilege: parseInt(e.target.value) }))}
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
                </HStack>

                <HStack spacing={4} width="100%">
                  <FormControl display="flex" alignItems="center" mt={6}>
                    <FormLabel htmlFor="is-active" mb="0">
                      Active Status
                    </FormLabel>
                    <Switch
                      id="is-active"
                      isChecked={editFormData.isActive}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleEditSubmit}
                isLoading={editLoading}
                loadingText="Updating..."
              >
                Update User
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Dialog */}
        {/* <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete User
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure you want to delete user "{deletingUser?.firstName} {deletingUser?.lastName}" ({deletingUser?.username})? 
                This action cannot be undone and will remove their access to the system.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteConfirm}
                  ml={3}
                  isLoading={deleteLoading}
                  loadingText="Deleting..."
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog> */}
      </VStack>
    </Container>
  );
};

export default UserListPage;