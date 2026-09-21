import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, RoleRoute } from './assets/components/RouteGuard';
import MainLayout from './assets/components/Layout/MainLayout';
import SmeDashboard from './pages/SmeDashboard';
import SmeAdvisor from './pages/SmeAdvisor';
import BankOfficerDashboard from './pages/BankOfficerDashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import TechAdvisor from './pages/TechAdvisor';
import BusinessStartAdvisor from './pages/BusinessStartAdvisor';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PilotRestrictedPage from './pages/PilotRestrictedPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import SmeMonitoring from './pages/SmeMonitoring';
import OpportunityPublisher from './pages/OpportunityPublisher';
import OpportunityHub from './pages/OpportunityHub';
import Expenses from './pages/Expenses';
import BusinessActivities from './pages/BusinessActivities';
import BankerApplications from './pages/BankerApplications';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import ElevataBotPage from './pages/ElevataBotPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import SmeTrainingManager from './pages/SmeTrainingManager';
import BankerTrainingManager from './pages/BankerTrainingManager';

function App() {
  return (
    <AuthProvider>
      <AppContextProvider>
        <Router>
          <Routes>
            {/* Public authentication screens */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected application layout */}
            <Route element={<PrivateRoute />}>
              <Route path="/pilot-restricted" element={<PilotRestrictedPage />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<SmeDashboard />} />
                <Route path="profile" element={<BusinessProfilePage />} />
                <Route path="opportunity-hub" element={<OpportunityHub />} />
                <Route path="trainings" element={<SmeTrainingManager />} />
                <Route path="training-manager" element={<SmeTrainingManager />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="activities" element={<BusinessActivities />} />
                <Route path="business-activities" element={<BusinessActivities />} />
                <Route path="sales" element={<BusinessActivities defaultTab="sales" />} />
                <Route path="expenses" element={<BusinessActivities defaultTab="cash_out" />} />
                <Route path="reports" element={<Reports />} />
                <Route path="advisor" element={<SmeAdvisor />} />
                <Route path="tech-advisor" element={<TechAdvisor />} />
                <Route path="business-advisor" element={<BusinessStartAdvisor />} />
                <Route path="ai-bot" element={<ElevataBotPage />} />

                {/* Restricted banker route - gate to ADMIN/FI users */}
                <Route element={<RoleRoute allowedRoles={['ADMIN', 'FINANCIAL_INSTITUTION']} />}>
                  <Route path="banker" element={<BankOfficerDashboard />} />
                  <Route path="banker/publisher" element={<OpportunityPublisher />} />
                  <Route path="banker/trainings" element={<BankerTrainingManager />} />
                  <Route path="banker/training-manager" element={<BankerTrainingManager />} />
                  <Route path="banker/applications" element={<BankerApplications />} />
                  <Route path="banker/monitoring" element={<SmeMonitoring />} />
                </Route>

                {/* Restricted Admin user and category management */}
                <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                  <Route path="admin/users" element={<AdminUsersPage />} />
                  <Route path="admin/categories" element={<AdminCategoriesPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </Router>
      </AppContextProvider>
    </AuthProvider>
  );
}

export default App;