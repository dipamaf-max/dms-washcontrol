import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StationProvider } from './context/StationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { StationsPage } from './pages/StationsPage';
import { CustomersPage } from './pages/CustomersPage';
import { VehiclesPage } from './pages/VehiclesPage';
import { WashOrdersPage } from './pages/WashOrdersPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { InventoryPage } from './pages/InventoryPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SubscriptionPage } from './pages/SubscriptionPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StationProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/stations" element={<StationsPage />} />
                <Route path="/wash-orders" element={<WashOrdersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/vehicles" element={<VehiclesPage />} />
                <Route path="/employees" element={<EmployeesPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
              </Route>
            </Route>
          </Routes>
        </StationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
