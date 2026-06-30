import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Contracts from './pages/Contracts';
import ContractDetail from './pages/ContractDetail';
import Invoices from './pages/Invoices';
import Quotations from './pages/Quotations';
import Receipts from './pages/Receipts';
import DocumentDetail from './pages/DocumentDetail';
import Chat from './pages/Chat';
import SearchPage from './pages/SearchPage';
import Trash from './pages/Trash';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import { getDefaultRoute } from './utils/constants';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={getDefaultRoute(user.role)} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><Layout><Customers /></Layout></ProtectedRoute>} />
      <Route path="/customers/:id" element={<ProtectedRoute><Layout><CustomerDetail /></Layout></ProtectedRoute>} />
      <Route path="/contracts" element={<ProtectedRoute><Layout><Contracts /></Layout></ProtectedRoute>} />
      <Route path="/contracts/:id" element={<ProtectedRoute><Layout><ContractDetail /></Layout></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute><Layout><Invoices /></Layout></ProtectedRoute>} />
      <Route path="/quotations" element={<ProtectedRoute><Layout><Quotations /></Layout></ProtectedRoute>} />
      <Route path="/receipts" element={<ProtectedRoute><Layout><Receipts /></Layout></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Layout><Chat /></Layout></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><Layout><DocumentDetail /></Layout></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Layout><SearchPage /></Layout></ProtectedRoute>} />
      <Route path="/trash" element={<ProtectedRoute><Layout><Trash /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><Layout><Admin /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
