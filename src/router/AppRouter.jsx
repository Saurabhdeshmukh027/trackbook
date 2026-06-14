import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import LandingPage from '../pages/LandingPage';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import PendingApproval from '../pages/PendingApproval';
import Dashboard from '../pages/Dashboard';
import Customers from '../pages/Customers';
import AddCustomer from '../pages/AddCustomer';
import EditCustomer from '../pages/EditCustomer';
import CustomerProfile from '../pages/CustomerProfile';
import DueList from '../pages/DueList';
import Payments from '../pages/Payments';
import RecordPayment from '../pages/RecordPayment';
import PaymentHistory from '../pages/PaymentHistory';
import MealPause from '../pages/MealPause';
import MealPauseCustomer from '../pages/MealPauseCustomer';
import Settings from '../pages/Settings';
import AdminDashboard from '../pages/admin/AdminDashboard';

// Components
import LoadingScreen from '../components/LoadingScreen';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const BusinessRoute = ({ children }) => {
  const { user, business, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!business) return <Navigate to="/login" replace />;
  if (business.status === 'pending') return <Navigate to="/pending" replace />;
  return children;
};

export default function AppRouter() {
  const { user, isAdmin, business, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={
          user
            ? isAdmin
              ? <Navigate to="/admin" replace />
              : business
                ? business.status === 'pending'
                  ? <Navigate to="/pending" replace />
                  : <Navigate to="/dashboard" replace />
                : <LandingPage />
            : <LandingPage />
        } />

        <Route path="/login" element={
          user
            ? isAdmin
              ? <Navigate to="/admin" replace />
              : business
                ? business.status === 'pending'
                  ? <Navigate to="/pending" replace />
                  : <Navigate to="/dashboard" replace />
                : <Login />
            : <Login />
        } />

        <Route path="/register" element={
          user ? <Navigate to="/dashboard" replace /> : <Register />
        } />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Pending */}
        <Route path="/pending" element={
          <PrivateRoute><PendingApproval /></PrivateRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />

        {/* Business routes */}
        <Route path="/dashboard" element={<BusinessRoute><Dashboard /></BusinessRoute>} />
        <Route path="/customers" element={<BusinessRoute><Customers /></BusinessRoute>} />
        <Route path="/customers/add" element={<BusinessRoute><AddCustomer /></BusinessRoute>} />
        <Route path="/customers/:id/edit" element={<BusinessRoute><EditCustomer /></BusinessRoute>} />
        <Route path="/customers/:id" element={<BusinessRoute><CustomerProfile /></BusinessRoute>} />
        <Route path="/customers/:id/pay" element={<BusinessRoute><RecordPayment /></BusinessRoute>} />
        <Route path="/customers/:id/payments" element={<BusinessRoute><PaymentHistory /></BusinessRoute>} />
        <Route path="/customers/:id/meal-pause" element={<BusinessRoute><MealPauseCustomer /></BusinessRoute>} />
        <Route path="/payments" element={<BusinessRoute><Payments /></BusinessRoute>} />
        <Route path="/due-list" element={<BusinessRoute><DueList /></BusinessRoute>} />
        <Route path="/meal-pause" element={<BusinessRoute><MealPause /></BusinessRoute>} />
        <Route path="/settings" element={<BusinessRoute><Settings /></BusinessRoute>} />

        {/* Default */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
