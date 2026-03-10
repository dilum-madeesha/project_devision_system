import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Input,
  Text,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  Container,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink
} from '@chakra-ui/react';
import { DownloadIcon, AttachmentIcon } from '@chakra-ui/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { FEATURES } from '../../../utils/permissions';

function AddMaterialExcel() {
  const [file, setFile] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const toast = useToast();
  const { can } = useAuth();
  const navigate = useNavigate();
  
  // Check if user has permission using privilege-based access control
  const canUpload = can(FEATURES.REGISTER_MATERIALS);

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && 
          selectedFile.type !== 'application/vnd.ms-excel') {
        toast({
          title: 'Invalid file type',
          description: 'Please select an Excel file (.xlsx or .xls)',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    }
  };

  // Parse Excel file
  const parseExcelFile = (file) => {
    setIsLoading(true);
    setValidationErrors([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform data
        const validatedMaterials = validateMaterials(jsonData);
        setMaterials(validatedMaterials.valid);
        setValidationErrors(validatedMaterials.errors);
        
        setIsLoading(false);
      } catch (error) {
        toast({
          title: 'Error parsing file',
          description: 'Unable to parse Excel file. Please check the format.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Validate parsed materials
  const validateMaterials = (data) => {
    const valid = [];
    const errors = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel rows start at 1 and we have a header
      // const material = {
      //   name: row.name || row.Name || '',
      //   description: row.description || row.Description || '',
      //   uom: row.uom || row.UOM || row['Unit of Measurement'] || '', edited ithis
      //   unitPrice: parseFloat(row.unitPrice || row['Unit Price'] || row.price || 0)
      // };
      const rawPrice = row.unitPrice || row['Unit Price'] || row.price || '';
      let unitPrice = parseFloat(rawPrice);
      if (isNaN(unitPrice)) unitPrice = 0; // allow blank price in Excel and default to 0
      const material = {
        name: row.name || row.Name || '',
        description: row.description || row.Description || '',
        uom: row.uom || row.UOM || row['Unit of Measurement'] || '',
        unitPrice
      };

      const rowErrors = [];
      
      if (!material.name.trim()) {
        rowErrors.push(`Row ${rowNumber}: Name is required`);
      }
      if (!material.uom.trim()) {
        rowErrors.push(`Row ${rowNumber}: UOM is required`);
      }
      if (material.unitPrice < 0) {
        rowErrors.push(`Row ${rowNumber}: Unit price must be a non-negative number`);
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        valid.push(material);
      }
    });

    return { valid, errors };
  };

  // Upload materials to backend
  const handleUpload = async () => {
    if (materials.length === 0) {
      toast({
        title: 'No materials to upload',
        description: 'Please select a valid Excel file with materials data.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post(
        'http://localhost:5000/api/materials/bulk',
        { materials },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      toast({
        title: 'Success',
        description: `${materials.length} materials uploaded successfully!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset form
      setFile(null);
      setMaterials([]);
      setValidationErrors([]);
      document.getElementById('file-input').value = '';
      
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.message || 'Failed to upload materials',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      {
        name: 'Steel Rod',
        description: '10mm steel reinforcement rod',
        uom: 'kg',
        unitPrice: 150.00
      },
      {
        name: 'Cement',
        description: 'Portland cement 50kg bag',
        uom: 'bag',
        unitPrice: 1200.00
      },
      {
        name: 'Bricks',
        description: 'Standard red bricks',
        uom: 'piece',
        unitPrice: 5.00
      },
      {
        name: 'Sand',
        description: 'Fine river sand',
        uom: 'ton',
        unitPrice: 500.00
      },
      {
        name: 'Paint',
        description: 'White emulsion paint 20L',
        uom: 'bucket',
        unitPrice: 250.00
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Materials');
    XLSX.writeFile(workbook, 'materials_template.xlsx');
  };

  // Redirect if user doesn't have permission
  if (!canUpload) {
    return (
      <Container maxW="800px" py={8}>
        <Alert status="error">
          <AlertIcon />
          Access denied. You need L4 Registration Manager, L5 Job Cost Manager, or higher privilege to upload materials.
        </Alert>
      </Container>
    );
  }

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
          <BreadcrumbLink as={Link} to="/register/materials" color="blue.500">
            Materials
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink color="orange.500" fontWeight="bold" fontSize="x-large">
            Upload New Excel File
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* File Upload Section */}
            <Box>
              <HStack spacing={4} mb={4}>
                <Button
                  leftIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  variant="outline"
                  colorScheme="blue"
                >
                  Download Template
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Download the Excel template with sample data format
                </Text>
              </HStack>
              
              <Input
                id="file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                p={1}
              />
              <Text fontSize="sm" color="gray.600" mt={2}>
                Select an Excel file (.xlsx or .xls) with columns: name, description, uom, unitPrice (optional)
              </Text>
            </Box>

            {/* Loading Spinner */}
            {isLoading && (
              <HStack justify="center">
                <Spinner />
                <Text>Parsing Excel file...</Text>
              </HStack>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Validation Errors:</Text>
                  {validationErrors.map((error, index) => (
                    <Text key={index} fontSize="sm">{error}</Text>
                  ))}
                </Box>
              </Alert>
            )}

            {/* Materials Preview */}
            {materials.length > 0 && (
              <Box>
                <Heading size="md" mb={4}>
                  Materials Preview ({materials.length} items)
                </Heading>
                <TableContainer>
                  <Table variant="striped" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Description</Th>
                        <Th>UOM</Th>
                        <Th isNumeric>Unit Price</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {materials.slice(0, 10).map((material, index) => (
                        <Tr key={index}>
                          <Td>{material.name}</Td>
                          <Td>{material.description}</Td>
                          <Td>{material.uom}</Td>
                          <Td isNumeric>{material.unitPrice.toFixed(2)}</Td>
                        </Tr>
                      ))}
                      {materials.length > 10 && (
                        <Tr>
                          <Td colSpan={4} textAlign="center" fontStyle="italic">
                            ... and {materials.length - 10} more items
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>

                <Divider my={4} />

                {/* Upload Button */}
                <HStack justify="center">
                  <Button
                    colorScheme="green"
                    size="lg"
                    leftIcon={<AttachmentIcon />}
                    onClick={handleUpload}
                    isLoading={isUploading}
                    loadingText="Uploading..."
                    isDisabled={materials.length === 0}
                  >
                    Upload {materials.length} Materials
                  </Button>
                </HStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  </Container>
  );
}

export default AddMaterialExcel;