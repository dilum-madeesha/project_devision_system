import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  HStack,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Container,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useToast,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { FiFileText, FiDownload, FiEye, FiEdit, FiUsers, FiClipboard, FiBriefcase } from "react-icons/fi";
import { useState, useEffect } from "react";
import { projectAPI } from "../../api/projects.js";
import { officerAPI } from "../../api/officers.js";
import { agreementAPI } from "../../api/agreements.js";
import { contractorAPI } from "../../api/contractors.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ProjectReports() {
  const { user } = useAuth();
  const toast = useToast();
  const mutedTextColor = useColorModeValue("gray.600", "gray.400");
  const bg = useColorModeValue("white", "gray.800");

  // State
  const [projects, setProjects] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // View Modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projectsRes, officersRes, agreementsRes, contractorsRes] = await Promise.all([
        projectAPI.getAll(),
        officerAPI.getAll(),
        agreementAPI.getAll(),
        contractorAPI.getAll()
      ]);

      // Parse projects
      let projectsList = [];
      if (projectsRes?.data?.projects) projectsList = projectsRes.data.projects;
      else if (projectsRes?.data && Array.isArray(projectsRes.data)) projectsList = projectsRes.data;
      else if (Array.isArray(projectsRes)) projectsList = projectsRes;
      setProjects(projectsList);

      // Parse officers
      let officersList = [];
      if (officersRes?.data?.officers) officersList = officersRes.data.officers;
      else if (officersRes?.data && Array.isArray(officersRes.data)) officersList = officersRes.data;
      else if (Array.isArray(officersRes)) officersList = officersRes;
      setOfficers(officersList);

      // Parse agreements
      let agreementsList = [];
      if (agreementsRes?.data && Array.isArray(agreementsRes.data)) agreementsList = agreementsRes.data;
      else if (Array.isArray(agreementsRes)) agreementsList = agreementsRes;
      setAgreements(agreementsList);

      // Parse contractors
      let contractorsList = [];
      if (contractorsRes?.data?.contractors) contractorsList = contractorsRes.data.contractors;
      else if (contractorsRes?.data && Array.isArray(contractorsRes.data)) contractorsList = contractorsRes.data;
      else if (Array.isArray(contractorsRes)) contractorsList = contractorsRes;
      setContractors(contractorsList);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchSearch = !search ||
      p.projectId?.toLowerCase().includes(search.toLowerCase()) ||
      p.projectName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // View project details
  const handleViewProject = async (project) => {
    try {
      const response = await projectAPI.getById(project.id);
      setSelectedProject(response?.data || response);
      onOpen();
    } catch (err) {
      toast({ title: "Error loading project details", status: "error", duration: 3000 });
    }
  };

  // Generate Project PDF
  const generateProjectPDF = (project) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Project Report", 105, 20, { align: "center" });

    // Project Info
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);

    const info = [
      ["Project ID", project.projectId || "N/A"],
      ["Project Name", project.projectName || "N/A"],
      ["Status", project.status || "N/A"],
      ["Description", project.description || "N/A"],
      ["Start Date", project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"],
      ["End Date", project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A"],
      ["Completion", `${project.completedPercent || 0}%`],
      ["Agreement", project.agreement?.agreementID || "N/A"],
      ["Contractor", project.contractor?.companyName || "N/A"],
    ];

    autoTable(doc, {
      startY: 35,
      head: [["Field", "Value"]],
      body: info,
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Agreement section
    doc.setFontSize(14);
    doc.text("Agreement Details", 14, doc.lastAutoTable.finalY + 15);

    const agreement = project.agreement;
    const agreementData = agreement
      ? [[
        agreement.agreementID || "N/A",
        agreement.agreementSum != null
          ? `Rs.${Number(agreement.agreementSum).toLocaleString()}`
          : "N/A",
        agreement.vat != null ? `${agreement.vat}%` : "N/A",
        agreement.periodDays != null ? String(agreement.periodDays) : "N/A",
        agreement.startDate ? new Date(agreement.startDate).toLocaleDateString() : "N/A",
        agreement.status || "N/A",
      ]]
      : [["N/A", "N/A", "N/A", "N/A", "N/A", "N/A"]];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Agreement ID", "Sum", "VAT", "Period", "Start Date", "Status"]],
      body: agreementData,
      theme: "striped",
      headStyles: { fillColor: [92, 184, 92] },
      styles: { fontSize: 9 },
    });

    // Officers section
    if (project.officerAssignments?.length > 0) {
      doc.setFontSize(14);
      doc.text("Assigned Officers", 14, doc.lastAutoTable.finalY + 15);

      const officerData = project.officerAssignments.map(a => [
        a.role || "N/A",
        a.officer?.officerNo || "N/A",
        a.officer?.fullName || "N/A",
        a.officer?.designation || "N/A",
        a.officer?.contactNumber || "N/A"
      ]);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Role", "EPF No", "Name", "Designation", "Contact"]],
        body: officerData,
        theme: "striped",
        headStyles: { fillColor: [92, 184, 92] },
      });
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

    return doc;
  };

  // Download Project PDF
  const handleDownloadProjectPDF = async (project) => {
    try {
      const response = await projectAPI.getById(project.id);
      const fullProject = response?.data || response;
      const doc = generateProjectPDF(fullProject);
      doc.save(`${fullProject.projectId || 'project'}-report.pdf`);
      toast({ title: "PDF downloaded successfully", status: "success", duration: 2000 });
    } catch (err) {
      toast({ title: "Error generating PDF", status: "error", duration: 3000 });
    }
  };

  // Open Project PDF in new tab
  const handleOpenProjectPDF = async (project) => {
    // Open a blank window immediately to avoid popup blockers
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      toast({ title: "Please allow popups to view the PDF", status: "warning", duration: 4000 });
      return;
    }

    try {
      const response = await projectAPI.getById(project.id);
      const fullProject = response?.data || response;
      const doc = generateProjectPDF(fullProject);
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      // Navigate the previously opened window to the blob URL
      newWindow.location.href = pdfUrl;
      // Revoke URL after a short delay to free memory
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 15000);
    } catch (err) {
      try { newWindow.close(); } catch (e) { }
      toast({ title: "Error opening PDF", status: "error", duration: 3000 });
    }
  };

  // Generate Officers Report PDF
  const generateOfficersReportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Officers Report", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Total Officers: ${officers.length}`, 105, 30, { align: "center" });

    const data = officers.map((o, i) => [
      i + 1,
      o.officerNo || "N/A",
      o.fullName || "N/A",
      o.designation || "N/A",
      o.division || "N/A",
      o.contactNumber || "N/A",
      o.email || "N/A",
      o.status ? "Active" : "Inactive"
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["#", "Officer No", "Name", "Designation", "Division", "Contact", "Email", "Status"]],
      body: data,
      theme: "striped",
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8 },
    });

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

    return doc;
  };

  // Generate Agreements Report PDF
  const generateAgreementsReportPDF = () => {
    const doc = new jsPDF("landscape");

    doc.setFontSize(20);
    doc.text("Agreements Report", 148, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Total Agreements: ${agreements.length}`, 148, 30, { align: "center" });

    const data = agreements.map((a, i) => [
      i + 1,
      a.agreementNo || "N/A",
      a.projectName || "N/A",
      a.agreementSum ? `Rs.${a.agreementSum.toLocaleString()}` : "N/A",
      a.periodDays || "N/A",
      a.startDate ? new Date(a.startDate).toLocaleDateString() : "N/A",
      a.completionDate ? new Date(a.completionDate).toLocaleDateString() : "N/A",
      a.status || "N/A"
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["#", "Agreement No", "Project Name", "Sum", "Period (Days)", "Start Date", "End Date", "Status"]],
      body: data,
      theme: "striped",
      headStyles: { fillColor: [92, 184, 92] },
      styles: { fontSize: 9 },
    });

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

    return doc;
  };

  // Generate Contractors Report PDF
  const generateContractorsReportPDF = () => {
    const doc = new jsPDF("landscape");

    doc.setFontSize(20);
    doc.text("Contractors Report", 148, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Total Contractors: ${contractors.length}`, 148, 30, { align: "center" });

    const data = contractors.map((c, i) => [
      i + 1,
      c.companyName || "N/A",
      c.contactPerson || "N/A",
      c.registrationNo || "N/A",
      c.specialization || "N/A",
      c.phone || "N/A",
      c.email || "N/A",
      c.isActive ? "Active" : "Inactive"
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["#", "Company Name", "Contact Person", "Reg No", "Specialization", "Phone", "Email", "Status"]],
      body: data,
      theme: "striped",
      headStyles: { fillColor: [217, 83, 79] },
      styles: { fontSize: 8 },
    });

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

    return doc;
  };

  // Handle report download
  const handleDownloadReport = (type) => {
    let doc;
    let filename;

    switch (type) {
      case "officers":
        doc = generateOfficersReportPDF();
        filename = "officers-report.pdf";
        break;
      case "agreements":
        doc = generateAgreementsReportPDF();
        filename = "agreements-report.pdf";
        break;
      case "contractors":
        doc = generateContractorsReportPDF();
        filename = "contractors-report.pdf";
        break;
      default:
        return;
    }

    doc.save(filename);
    toast({ title: "Report downloaded successfully", status: "success", duration: 2000 });
  };

  // Handle report open
  const handleOpenReport = (type) => {
    // Open a blank window immediately to avoid popup blockers
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      toast({ title: "Please allow popups to view the PDF", status: "warning", duration: 4000 });
      return;
    }

    try {
      let doc;
      switch (type) {
        case "officers":
          doc = generateOfficersReportPDF();
          break;
        case "agreements":
          doc = generateAgreementsReportPDF();
          break;
        case "contractors":
          doc = generateContractorsReportPDF();
          break;
        default:
          try { newWindow.close(); } catch (e) { }
          return;
      }

      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      newWindow.location.href = pdfUrl;
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 15000);
    } catch (err) {
      try { newWindow.close(); } catch (e) { }
      toast({ title: "Error opening PDF", status: "error", duration: 3000 });
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "PLANNING": return "blue";
      case "IN_PROGRESS": return "orange";
      case "COMPLETED": return "green";
      case "ON_HOLD": return "yellow";
      case "CANCELLED": return "red";
      default: return "gray";
    }
  };

  if (loading) {
    return (
      <Container maxW="1200px" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading reports...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="1400px" py={8}>
      {/* Header */}
      <Heading mb={2} textAlign="center">Projects Report Center</Heading>
      <Text color={mutedTextColor} mb={6} textAlign="center">
        Welcome back, {user?.firstName || "User"}. View and download project reports
      </Text>

      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      <Tabs variant="enclosed" colorScheme="blue" bg="gray.50" borderRadius="lg" p={6}>
        <TabList >
          <Tab
            bg="yellow.100"
            _selected={{ bg: "yellow.400", color: "white", borderColor: "yellow.200" }}
            _hover={{ bg: "yellow.400" }}
            fontWeight="600"
          >
            <FiClipboard style={{ marginRight: 8 }} /> Projects
          </Tab>

          <Tab
            bg="blue.100"
            _selected={{ bg: "blue.400", color: "white", borderColor: "blue.200" }}
            _hover={{ bg: "blue.500" }}
            fontWeight="600"
          >
            <FiUsers style={{ marginRight: 8 }} /> Officers
          </Tab>

          <Tab
            bg="green.100"
            _selected={{ bg: "green.400", color: "white", borderColor: "green.200" }}
            _hover={{ bg: "green.500" }}
            fontWeight="600"
          >
            <FiFileText style={{ marginRight: 8 }} /> Agreements
          </Tab>

          <Tab
            bg="purple.100"
            _selected={{ bg: "purple.400", color: "white", borderColor: "purple.200" }}
            _hover={{ bg: "purple.500" }}
            fontWeight="600"
          >
            <FiBriefcase style={{ marginRight: 8 }} /> Contractors
          </Tab>
        </TabList>

        <TabPanels>
          {/* ========== PROJECTS TAB ========== */}
          <TabPanel>
            <HStack mb={4} spacing={4}>
              <Input
                id="projectViewerSearch"
                name="projectViewerSearch"
                placeholder="Search by project ID or name..."
                value={search}
                bg="white"
                onChange={(e) => setSearch(e.target.value)}
                maxW="300px"
              />
              <Select
                id="projectViewerStatusFilter"
                name="projectViewerStatusFilter"
                placeholder="All Status"
                bg="white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="200px"
              >
                <option value="PLANNING">Planning</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              <Text color="gray.800" fontSize="sm">
                {filteredProjects.length} projects found
              </Text>
            </HStack>

            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={bg}>
              <TableContainer>
                <Table size="sm">
                  <Thead bg="blue.50">
                    <Tr>
                      <Th>Project ID</Th>
                      <Th>Project Name</Th>
                      <Th>Agreement No</Th>
                      <Th>Agreement Sum</Th>
                      <Th>Status</Th>
                      <Th>Start Date</Th>
                      <Th>End Date</Th>
                      <Th>Completion</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredProjects.map((p) => (
                      <Tr key={p.id}>
                        <Td fontWeight="medium">{p.projectId}</Td>
                        <Td>{p.projectName}</Td>
                        <Td>{p.agreement?.agreementID || "N/A"}</Td>
                        <Td>
                          {p.agreement?.agreementSum != null
                            ? `Rs.${Number(p.agreement.agreementSum).toLocaleString()}`
                            : "N/A"}
                        </Td>
                        
                        <Td>
                          <Badge colorScheme={getStatusColor(p.status)}>{p.status}</Badge>
                        </Td>
                        <Td>{p.startDate ? new Date(p.startDate).toLocaleDateString() : "N/A"}</Td>
                        <Td>{p.endDate ? new Date(p.endDate).toLocaleDateString() : "N/A"}</Td>
                        <Td>{p.completedPercent || 0}%</Td>
                        <Td>
                          <HStack spacing={1}>
                            <Button size="xs" colorScheme="blue" leftIcon={<FiEye />} onClick={() => handleViewProject(p)}>
                              View
                            </Button>
                            <Button size="xs" colorScheme="teal" leftIcon={<FiFileText />} onClick={() => handleOpenProjectPDF(p)}>
                              Open PDF
                            </Button>
                            <Button size="xs" colorScheme="green" leftIcon={<FiDownload />} onClick={() => handleDownloadProjectPDF(p)}>
                              Download
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              {filteredProjects.length === 0 && (
                <Box p={8} textAlign="center">
                  <Text color="gray.500">No projects found</Text>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* ========== OFFICERS TAB ========== */}
          <TabPanel>
            <HStack mb={4} justify="space-between">
              <Text fontWeight="medium" color="gray.500">
                Total Officers: {officers.length}
              </Text>
              <HStack>
                <Button colorScheme="blue" leftIcon={<FiFileText />} onClick={() => handleOpenReport("officers")}>
                  Open Report
                </Button>
                <Button colorScheme="green" leftIcon={<FiDownload />} onClick={() => handleDownloadReport("officers")}>
                  Download PDF
                </Button>
              </HStack>
            </HStack>

            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={bg}>
              <TableContainer>
                <Table size="sm">
                  <Thead bg="blue.50">
                    <Tr>
                      <Th>No</Th>
                      <Th>Officer No</Th>
                      <Th>Full Name</Th>
                      <Th>Designation</Th>
                      <Th>Division</Th>
                      <Th>Contact</Th>
                      <Th>Email</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {officers.map((o, i) => (
                      <Tr key={o.id}>
                        <Td>{i + 1}</Td>
                        <Td>{o.officerNo || "N/A"}</Td>
                        <Td fontWeight="medium">{o.fullName}</Td>
                        <Td>{o.designation}</Td>
                        <Td>{o.division}</Td>
                        <Td>{o.contactNumber}</Td>
                        <Td>{o.email}</Td>
                        <Td>
                          <Badge colorScheme={o.status ? "green" : "red"}>
                            {o.status ? "Active" : "Inactive"}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* ========== AGREEMENTS TAB ========== */}
          <TabPanel>
            <HStack mb={4} justify="space-between">
              <Text fontWeight="medium" color="gray.500">
                Total Agreements: {agreements.length}
              </Text>
              <HStack>
                <Button colorScheme="blue" leftIcon={<FiFileText />} onClick={() => handleOpenReport("agreements")}>
                  Open Report
                </Button>
                <Button colorScheme="green" leftIcon={<FiDownload />} onClick={() => handleDownloadReport("agreements")}>
                  Download PDF
                </Button>
              </HStack>
            </HStack>

            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={bg}>
              <TableContainer>
                <Table size="sm">
                  <Thead bg="green.50">
                    <Tr>
                      <Th>No</Th>
                      <Th>Agreement No</Th>
                      <Th>Agreement Sum</Th>
                      <Th>Period (Days)</Th>
                      <Th>Start Date</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {agreements.map((a, i) => (
                      <Tr key={a.id}>
                        <Td>{i + 1}</Td>
                        <Td fontWeight="medium">{a.agreementID}</Td>
                        <Td>Rs.{a.agreementSum?.toLocaleString()}</Td>
                        <Td>{a.periodDays}</Td>
                        <Td>{a.startDate ? new Date(a.startDate).toLocaleDateString() : "N/A"}</Td>
                        <Td>
                          <Badge colorScheme={a.status === "ACTIVE" ? "green" : a.status === "PENDING" ? "yellow" : "red"}>
                            {a.status}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* ========== CONTRACTORS TAB ========== */}
          <TabPanel>
            <HStack mb={4} justify="space-between">
              <Text fontWeight="medium" color="gray.500">Total Contractors: {contractors.length}</Text>
              <HStack>
                <Button colorScheme="blue" leftIcon={<FiFileText />} onClick={() => handleOpenReport("contractors")}>
                  Open Report
                </Button>
                <Button colorScheme="green" leftIcon={<FiDownload />} onClick={() => handleDownloadReport("contractors")}>
                  Download PDF
                </Button>
              </HStack>
            </HStack>

            <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg={bg}>
              <TableContainer>
                <Table size="sm">
                  <Thead bg="red.50">
                    <Tr>
                      <Th>No</Th>
                      <Th>Company Name</Th>
                      <Th>Contact Person</Th>
                      <Th>Registration No</Th>
                      <Th>Specialization</Th>
                      <Th>Phone</Th>
                      <Th>Email</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {contractors.map((c, i) => (
                      <Tr key={c.id}>
                        <Td>{i + 1}</Td>
                        <Td fontWeight="medium">{c.companyName}</Td>
                        <Td>{c.contactPerson}</Td>
                        <Td>{c.registrationNo}</Td>
                        <Td>{c.specialization}</Td>
                        <Td>{c.phone}</Td>
                        <Td>{c.email}</Td>
                        <Td>
                          <Badge colorScheme={c.isActive ? "green" : "red"}>
                            {c.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* ========== PROJECT VIEW MODAL ========== */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Project Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProject && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Stat>
                    <StatLabel>Project ID</StatLabel>
                    <StatNumber fontSize="md">{selectedProject.projectId}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Status</StatLabel>
                    <Badge colorScheme={getStatusColor(selectedProject.status)} fontSize="sm">
                      {selectedProject.status}
                    </Badge>
                  </Stat>
                </SimpleGrid>

                <Box>
                  <Text fontWeight="bold" mb={1}>Project Name</Text>
                  <Text>{selectedProject.projectName}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={1}>Description</Text>
                  <Text>{selectedProject.description || "N/A"}</Text>
                </Box>

                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={1}>Start Date</Text>
                    <Text>{selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : "N/A"}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>End Date</Text>
                    <Text>{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : "N/A"}</Text>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text fontWeight="bold" mb={1}>Completion</Text>
                  <Text>{selectedProject.completedPercent || 0}%</Text>
                </Box>

                <Divider />

                {selectedProject.agreement && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Agreement</Text>
                    <Text>ID: {selectedProject.agreement.agreementID}</Text>
                    <Text>Sum: Rs.{selectedProject.agreement.agreementSum?.toLocaleString()}</Text>
                  </Box>
                )}

                {selectedProject.contractor && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Contractor</Text>
                    <Text>{selectedProject.contractor.companyName}</Text>
                    <Text>Contact: {selectedProject.contractor.phone}</Text>
                  </Box>
                )}

                {selectedProject.officerAssignments?.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Assigned Officers</Text>
                    {selectedProject.officerAssignments.map((a, i) => (
                      <Box key={i} p={2} bg="gray.50" borderRadius="md" mb={2}>
                        <Text fontWeight="medium">{a.role}</Text>
                        <Text>{a.officer?.officerNo ? `${a.officer.officerNo} - ` : ""}{a.officer?.fullName} - {a.officer?.designation}</Text>
                        <Text fontSize="sm" color="gray.600">{a.officer?.contactNumber}</Text>
                      </Box>
                    ))}
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button colorScheme="teal" leftIcon={<FiFileText />} onClick={() => handleOpenProjectPDF(selectedProject)}>
                Open PDF
              </Button>
              <Button colorScheme="green" leftIcon={<FiDownload />} onClick={() => handleDownloadProjectPDF(selectedProject)}>
                Download PDF
              </Button>
              <Button onClick={onClose}>Close</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
