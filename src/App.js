import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CheckIn from "./pages/Check-In";
import CheckInName from "./pages/CheckInName";
// import ReportsPage from "./pages/ReportsPage";
import AddUser from "./pages/AddUser";
import AddEvent from "./pages/AddEvent";
import SidebarLayout from "./components/SidebarLayout";
import Login from "./pages/Login";
import ExpressCheckIn from "./pages/ExpressCheckIn";
import ProtectedRoute from "./components/ProtectedRoute";
import ReportsMaster from "./pages/ReportsMaster";
import MasterListPage from "./pages/MasterListPage";
import EventListPage from "./pages/EventListPage";
import CheckInList from "./pages/CheckInList";
import ImportData from "./pages/ImportData";
import Footer from "./components/Footer";

const AppRoutes = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        {!isLoginPage && (
          <>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <Dashboard />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            {/* new */}
            <Route
              path="express-checkin"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <ExpressCheckIn />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/checkin"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <CheckIn />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/check-in-name"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <CheckInName />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkin-list"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <CheckInList />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/masterlist"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <MasterListPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/eventlist"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <EventListPage />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports-master"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <ReportsMaster />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-event"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <AddEvent />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/express"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <ExpressCheckIn />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-user"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <AddUser />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="import-data"
              element={
                <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
                  <SidebarLayout>
                    <ImportData />
                  </SidebarLayout>
                </ProtectedRoute>
              }
            />
          </>
        )}
      </Routes>
      {/* Only show footer if not on login page */}
      {!isLoginPage && <Footer />}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
