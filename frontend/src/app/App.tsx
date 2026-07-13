import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const StudentCourses = lazy(() => import('./pages/student/Courses'));
const StudentProblems = lazy(() => import('./pages/student/Problems'));
const StudentAnalytics = lazy(() => import('./pages/student/Analytics'));
const StudentTests = lazy(() => import('./pages/student/Tests'));
const StudentLearning = lazy(() => import('./pages/student/Learning'));
const StudentAssignments = lazy(() => import('./pages/student/Assignments'));
const MCQTestList = lazy(() => import('./pages/student/MCQTestList'));
const MCQTestRunner = lazy(() => import('./pages/student/MCQTestRunner'));
const CodingTestRunner = lazy(() => import('./pages/student/CodingTestRunner'));
const TheoryTestRunner = lazy(() => import('./pages/student/TheoryTestRunner'));
const ProblemSolver = lazy(() => import('./pages/student/ProblemSolver'));
const CourseDetail = lazy(() => import('./pages/student/CourseDetail'));
const StudentJobs = lazy(() => import('./pages/student/Jobs'));
const FacultyDashboard = lazy(() => import('./pages/faculty/Dashboard'));

const FacultyTests = lazy(() => import('./pages/faculty/FacultyTests'));
const FacultyAssignments = lazy(() => import('./pages/faculty/FacultyAssignments'));
const FacultyReports = lazy(() => import('./pages/faculty/FacultyReports'));
const FacultyActivity = lazy(() => import('./pages/faculty/FacultyActivity'));
const FacultyPermissions = lazy(() => import('./pages/faculty/Permissions'));
const ContentHub = lazy(() => import('./pages/faculty/ContentHub'));
const TestBuilderPage = lazy(() => import('./pages/faculty/TestBuilderPage'));
const LiveClassesManager = lazy(() => import('./pages/faculty/LiveClassesManager'));
const LiveClassroomPage = lazy(() => import('../features/live-classroom/pages/LiveClassroomPage'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Students = lazy(() => import('./pages/admin/Students'));
const AddStudent = lazy(() => import('./pages/admin/AddStudent'));
const BulkUpload = lazy(() => import('./pages/admin/BulkUpload'));
const Faculty = lazy(() => import('./pages/admin/Faculty'));
const AddFaculty = lazy(() => import('./pages/admin/AddFaculty'));
const Companies = lazy(() => import('./pages/admin/Companies'));
const Placements = lazy(() => import('./pages/admin/Placements'));
const AddPlacement = lazy(() => import('./pages/admin/AddPlacement'));
const ManageRoles = lazy(() => import('./pages/admin/ManageRoles'));
const CompanyDashboard = lazy(() => import('./pages/company/Dashboard'));


const FacultyLayout = lazy(() => import('./components/faculty/FacultyLayout'));

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute requiredFeature="dashboard">
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student/courses" element={
            <ProtectedRoute requiredFeature="courses">
              <StudentCourses />
            </ProtectedRoute>
          } />
          <Route path="/student/courses/:courseId" element={
            <ProtectedRoute requiredFeature="courses">
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/student/problems" element={
            <ProtectedRoute requiredFeature="problems">
              <StudentProblems />
            </ProtectedRoute>
          } />
          <Route path="/student/problems/:id" element={
            <ProtectedRoute requiredFeature="problems">
              <ProblemSolver />
            </ProtectedRoute>
          } />
          <Route path="/student/problem/:id" element={
            <ProtectedRoute requiredFeature="problems">
              <ProblemSolver />
            </ProtectedRoute>
          } />
          <Route path="/student/analytics" element={
            <ProtectedRoute requiredFeature="reports">
              <StudentAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/student/tests" element={
            <ProtectedRoute requiredFeature="tests">
              <StudentTests />
            </ProtectedRoute>
          } />
          <Route path="/student/tests/mcq" element={
            <ProtectedRoute requiredFeature="tests">
              <MCQTestList />
            </ProtectedRoute>
          } />
          <Route path="/student/tests/mcq/:testId" element={
            <ProtectedRoute requiredFeature="tests">
              <MCQTestRunner />
            </ProtectedRoute>
          } />
          <Route path="/student/tests/coding/:testId" element={
            <ProtectedRoute requiredFeature="tests">
              <CodingTestRunner />
            </ProtectedRoute>
          } />
          <Route path="/student/tests/theory/:testId" element={
            <ProtectedRoute requiredFeature="tests">
              <TheoryTestRunner />
            </ProtectedRoute>
          } />
          <Route path="/student/learning" element={
            <ProtectedRoute requiredFeature="learning">
              <StudentLearning />
            </ProtectedRoute>
          } />
          <Route path="/student/assignments" element={
            <ProtectedRoute requiredFeature="assignments">
              <StudentAssignments />
            </ProtectedRoute>
          } />
          <Route path="/student/placements" element={
            <ProtectedRoute requiredFeature="placements">
              <StudentJobs />
            </ProtectedRoute>
          } />


          {/* Faculty Routes */}
          <Route path="/faculty/*" element={
            <FacultyLayout>
              <Routes>
                <Route path="dashboard" element={<FacultyDashboard />} />
                <Route path="tests" element={<FacultyTests />} />
                <Route path="tests/:testId/builder" element={<TestBuilderPage />} />
                <Route path="assignments" element={<FacultyAssignments />} />
                <Route path="reports" element={<FacultyReports />} />
                <Route path="activity" element={<FacultyActivity />} />
                <Route path="permissions" element={<FacultyPermissions />} />
                <Route path="content" element={<ContentHub />} />
                <Route path="live-classes" element={<LiveClassesManager />} />
              </Routes>
            </FacultyLayout>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />

          {/* Admin - Students */}
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/students/add" element={<AddStudent />} />
          <Route path="/admin/students/bulk-upload" element={<BulkUpload />} />

          {/* Admin - Faculty */}
          <Route path="/admin/faculty" element={<Faculty />} />
          <Route path="/admin/faculty/add" element={<AddFaculty />} />

          {/* Admin - Companies & Placements */}
          <Route path="/admin/companies" element={<Companies />} />
          <Route path="/admin/placements" element={<Placements />} />
          <Route path="/admin/placements/add" element={<AddPlacement />} />
          <Route path="/admin/system/roles" element={<ManageRoles />} />


          {/* Company Routes */}

          <Route path="/company/dashboard" element={<CompanyDashboard />} />

          {/* Universal Live Classroom Route */}
          <Route path="/live-class/:roomId" element={<LiveClassroomPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
