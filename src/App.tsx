import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import MainLayout from './assets/components/Layout/MainLayout';
import SmeDashboard from './pages/SmeDashboard';
import SmeAdvisor from './pages/SmeAdvisor';
import BankOfficerDashboard from './pages/BankOfficerDashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import TechAdvisor from './pages/TechAdvisor';
import BusinessStartAdvisor from './pages/BusinessStartAdvisor';

function App() {
  return (
    <AppContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<SmeDashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales" element={<Sales />} />
            <Route path="reports" element={<Reports />} />
            <Route path="advisor" element={<SmeAdvisor />} />
            <Route path="tech-advisor" element={<TechAdvisor />} />
            <Route path="business-advisor" element={<BusinessStartAdvisor />} />
            <Route path="banker" element={<BankOfficerDashboard />} />
          </Route>
        </Routes>
      </Router>
    </AppContextProvider>
  );
}

export default App;