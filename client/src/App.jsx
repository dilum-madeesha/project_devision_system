import { Box, useColorModeValue } from "@chakra-ui/react";
import "./index.css";


// import { Route, Routes } from "react-router-dom";

import SummeryPage from "./pages/dashboard/costnavigation/SummeryPage";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DailyCostPage from "./pages/dashboard/costnavigation/DailyCostPage";
import WeeklyCostPage from "./pages/dashboard/costnavigation/WeeklyCostPage";
import MonthlyCostPage from "./pages/dashboard/costnavigation/MonthlyCostPage";
import YearlyCostPage from "./pages/dashboard/costnavigation/YearlyCostPage";
import JobCostPage from "./pages/dashboard/costnavigation/JobCostPage";
import LaborCostPage from "./pages/dashboard/costnavigation/LaborCostPage";
import MaterialCostPage from "./pages/dashboard/costnavigation/MaterialCostPage";
import TotalCostPage from "./pages/dashboard/costnavigation/TotalCostPage";

import LoginPage from "./pages/LoginPage";
import CostNavbar from "./components/CostNavbar.jsx";
import ProjectNavbar from "./components/ProjectNavbar.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import { PermissionGuard } from "./components/PermissionGuard";
import { useAuth } from "./contexts/AuthContext";
import ProfilePage from "./pages/profile/ProfilePage";

// Register Pages
import RegisterPage from "./pages/register/RegisterPage";
import JobList from "./pages/register/jobs/JobList";
import AddJob from "./pages/register/jobs/AddJob";
import LaborList from "./pages/register/labors/LaborList";
import AddLabor from "./pages/register/labors/AddLabor";
import MaterialList from "./pages/register/material/MaterialList";
import AddMaterial from "./pages/register/material/AddMaterial";
import UserList from "./pages/register/users/UserList";
import AddUser from "./pages/register/users/AddUser";

// Add Cost Pages
import AddcostPage from "./pages/addcost/AddcostPage";
import LaborCostList from "./pages/addcost/labor/LaborCostList";
import AddLaborCost from "./pages/addcost/labor/AddLaborCost";
import MaterialCostList from "./pages/addcost/material/MaterialCostList";
import AddMaterialCost from "./pages/addcost/material/AddMaterialCost";
import AddMaterialExcel from "./pages/register/material/AddMaterialExcel";

// Reports Pages
import ReportsLayout from "./pages/reports/ReportsLayout";
import DailyLaborCostReport from './pages/reports/reportnavigation/DailyLaborCostReport';
import WeeklyLaborCostReport from './pages/reports/reportnavigation/WeeklyLaborCostReport';
import MonthlyLaborCostReport from './pages/reports/reportnavigation/MonthlyLaborCostReport';
import YearlyLaborCostReport from './pages/reports/reportnavigation/YearlyLaborCostReport';
import MonthlyMaterialCostReport from './pages/reports/reportnavigation/MonthlyMaterialCostReport';
import YearlyMaterialCostReport from './pages/reports/reportnavigation/YearlyMaterialCostReport';
import JobTotalCostReport from './pages/reports/reportnavigation/JobTotalCostReport';
import LaborReport from './pages/reports/reportnavigation/LaborReport';
import DailyLaborAssignment from './pages/reports/reportnavigation/DailyLaborAssignment';
import DefaultReportsPage from './components/DefaultReportsPage';
import AboutSystemPage from './pages/AboutSystemPage';
import AboutProjectViewerPage from './pages/AboutProjectViewerPage';

import SystemSelection from "./pages/SystemSelection";
import { Route, Routes, useLocation } from "react-router-dom";

// PROJECT VIEWER SYSTEM PAGES
import ProjectRegisterPage from "./pages/ProjectRegister/ProjectregisterPage";
import AgreementList from "./pages/ProjectRegister/Agreement/agreementList.jsx";
import AgreementAdd from "./pages/ProjectRegister/Agreement/addAgreement.jsx";

import OfficerListPage from "./pages/ProjectRegister/Officers/officerList.jsx";
import AddOfficerPage from "./pages/ProjectRegister/Officers/addOfficers.jsx";

import ContractorList from "./pages/ProjectRegister/Contractors/contractorList.jsx";
import AddContractor from "./pages/ProjectRegister/Contractors/addContractors.jsx";

import CreateProject from "./pages/createProject/createProject.jsx";
import CreateNewProject from "./pages/createProject/collectProject/createNewProject.jsx";
import CreatedProjectList from "./pages/createProject/collectProject/createdProjectList.jsx";
import ProjectList from "./pages/createProject/collectProject/projectList.jsx";

import ProjectReports from "./pages/projectReport/projectReport.jsx";

import ProjectDashbord from "./pages/projectDashbord/projectDashbord.jsx";
import ProjectSummery from "./pages/projectDashbord/projectNavigation/projectSummery.jsx";
import ProjectOverview from "./pages/projectDashbord/projectNavigation/projectOverview.jsx";
import ProjectStatus from "./pages/projectDashbord/projectNavigation/projectStatus.jsx";
import ProjectOfficer from "./pages/projectDashbord/projectNavigation/projectOfficer.jsx";
import ProjectContractor from "./pages/projectDashbord/projectNavigation/projectContractor.jsx";
import ProjectPictures from "./pages/projectDashbord/projectNavigation/projectPictures.jsx";





function App() {
	const { isAuthenticated, FEATURES } = useAuth();


	const location = useLocation();

	const hideNavbarRoutes = ["/systems"]; // pages where navbar should NOT show
	const shouldShowNavbar = isAuthenticated && !hideNavbarRoutes.includes(location.pathname);

	const selectedSystem = localStorage.getItem("selectedSystem");

	return (
		<Box minH={"100vh"} bg={useColorModeValue("gray.100", "gray.900")}>
			{/* Only show Navbar if user is authenticated */}

			{shouldShowNavbar && selectedSystem === "cost" && <CostNavbar />}
			{shouldShowNavbar && selectedSystem === "project" && <ProjectNavbar />}


			<Box pt={isAuthenticated ? 4 : 0}>
				<Routes>

					{/* Public Routes */}
					<Route path='/' element={<LoginPage />} />
					<Route path='/login' element={<LoginPage />} />

					{/* Protected Routes */}
					<Route
						path="/systems"
						element={
							<ProtectedRoute>
								<SystemSelection />
							</ProtectedRoute>
						}
					/>

					<Route
						path="/project-viewer"
						element={
							<ProtectedRoute>
								<AboutProjectViewerPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/dashboard'
						element={
							<ProtectedRoute>
								<DashboardLayout />
							</ProtectedRoute>
						}
					>
						<Route index element={<SummeryPage />} />
						<Route path="daily" element={<DailyCostPage />} />
						<Route path="weekly" element={<WeeklyCostPage />} />
						<Route path="monthly" element={<MonthlyCostPage />} />
						<Route path="yearly" element={<YearlyCostPage />} />
						<Route path="totalcost" element={<TotalCostPage />} />
						<Route path="job-cost" element={<JobCostPage />} />
						<Route path="labor-cost" element={<LaborCostPage />} />
						<Route path="material-cost" element={<MaterialCostPage />} />
					</Route>

					{/* Register Module Routes */}
					<Route
						path='/register'
						element={
							<ProtectedRoute>
								<RegisterPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/jobs'
						element={
							<ProtectedRoute>
								<JobList />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/jobs/add'
						element={
							<ProtectedRoute>
								<AddJob />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/labors'
						element={
							<ProtectedRoute>
								<LaborList />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/labors/add'
						element={
							<ProtectedRoute>
								<AddLabor />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/materials'
						element={
							<ProtectedRoute>
								<MaterialList />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/materials/add'
						element={
							<ProtectedRoute>
								<AddMaterial />
							</ProtectedRoute>
						}
					/>
					<Route
						path='register/materials/addexcel'
						element={
							<ProtectedRoute>
								<AddMaterialExcel />
							</ProtectedRoute>
						}
					/>
					register/materials/addexcel
					<Route
						path='/register/materials/edit/:id'
						element={
							<ProtectedRoute>
								<AddMaterial />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/users'
						element={
							<ProtectedRoute>
								<PermissionGuard
									requiredFeatures={[FEATURES.REGISTER_USERS]}
									fallbackMessage="You don't have permission to access user management. Contact your administrator."
								>
									<UserList />
								</PermissionGuard>
							</ProtectedRoute>
						}
					/>
					<Route
						path='/register/users/add'
						element={
							<ProtectedRoute>
								<PermissionGuard
									requiredFeatures={[FEATURES.REGISTER_USERS]}
									fallbackMessage="You don't have permission to add users. Contact your administrator."
								>
									<AddUser />
								</PermissionGuard>
							</ProtectedRoute>
						}
					/>

					{/* Add Cost Module Routes */}
					<Route
						path='/addcost'
						element={
							<ProtectedRoute>
								<AddcostPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/addcost/labor'
						element={
							<ProtectedRoute>
								<LaborCostList />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/addcost/labor/add'
						element={
							<ProtectedRoute>
								<AddLaborCost />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/addcost/material'
						element={
							<ProtectedRoute>
								<MaterialCostList />
							</ProtectedRoute>
						}
					/>
					<Route
						path='/addcost/material/add'
						element={
							<ProtectedRoute>
								<AddMaterialCost />
							</ProtectedRoute>
						}
					/>

					{/* Reports Routes with Sidebar Layout */}
					<Route
						path='/reports'
						element={
							<ProtectedRoute>
								<ReportsLayout />
							</ProtectedRoute>
						}
					>
						<Route index element={<DefaultReportsPage />} />
						<Route path="daily-labor-cost" element={<DailyLaborCostReport />} />
						<Route path="weekly-labor-cost" element={<WeeklyLaborCostReport />} />
						<Route path="monthly-labor-cost" element={<MonthlyLaborCostReport />} />
						<Route path="yearly-labor-cost" element={<YearlyLaborCostReport />} />
						<Route path="monthly-material-cost" element={<MonthlyMaterialCostReport />} />
						<Route path="yearly-material-cost" element={<YearlyMaterialCostReport />} />
						<Route path="job-total-cost" element={<JobTotalCostReport />} />
						<Route path="labor-report" element={<LaborReport />} />
						<Route path="daily-labor-assignment" element={<DailyLaborAssignment />} />

					</Route>

					<Route
						path="/profile"
						element={
							<ProtectedRoute>
								<ProfilePage />
							</ProtectedRoute>
						}
					/>

					{/* About System Page - Accessible to all authenticated users */}
					<Route
						path="/about"
						element={
							<ProtectedRoute>
								<AboutSystemPage />
							</ProtectedRoute>
						}
					/>

					{/* this is the project wiver code */}
					<Route path="/ProjectRegister" element={<ProjectRegisterPage />} />

					<Route path="/projectregister/agreements" element={<AgreementList />} />
					<Route path="/projectregister/agreements/add" element={<AgreementAdd />} />

					<Route path="/projectRegister/officers" element={<OfficerListPage />} />
					<Route path="/projectRegister/officers/add" element={<AddOfficerPage />} />

					<Route path="/projectregister/contractors" element={<ContractorList />} />
					<Route path="/projectregister/contractors/add" element={<AddContractor />} />

					<Route path="/createproject" element={<CreateProject />} />

					<Route path="/createproject/collectProject/list" element={<ProjectList />} />
					<Route path="/createproject/projects" element={<ProjectList />} />

					<Route path="/createproject/collectProject/new" element={<CreateNewProject />} />
				<Route path="/createproject/collectProject/edit/:id" element={<CreateNewProject />} />
					<Route path="/projectreports" element={<ProjectReports />} />

					<Route path="/projectdashbord" element={<ProjectDashbord />} >
						<Route index element={<ProjectSummery />} />
						{/* <Route path="projectOverview" element={<ProjectOverview />} /> */}
						<Route path="projectOverview" element={<ProjectOverview />} />
						<Route path="projectStatus" element={<ProjectStatus />} />
						<Route path="officer" element={<ProjectOfficer />} />
						<Route path="contractCompany" element={<ProjectContractor />} />
					<Route path="pictures" element={<ProjectPictures />} />
				</Route>
				</Routes>
			</Box>
		</Box>
	);
}

export default App;