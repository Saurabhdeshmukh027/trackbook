import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Eagerly loaded (needed immediately)
import LoadingScreen from '../components/LoadingScreen';

// Lazy-loaded pages — only downloaded when the route is visited
const LandingPage = lazy(() => import('../pages/LandingPage'));
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const PendingApproval = lazy(() => import('../pages/PendingApproval'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Customers = lazy(() => import('../pages/Customers'));
const AddCustomer = lazy(() => import('../pages/AddCustomer'));
const EditCustomer = lazy(() => import('../pages/EditCustomer'));
const CustomerProfile = lazy(() => import('../pages/CustomerProfile'));
const DueList = null; // removed
const Payments = null; // removed
const RecordPayment = lazy(() => import('../pages/RecordPayment'));
const PaymentHistory = lazy(() => import('../pages/PaymentHistory'));
const MealPause = lazy(() => import('../pages/MealPause'));
const MealPauseCustomer = lazy(() => import('../pages/MealPauseCustomer'));
const Settings = lazy(() => import('../pages/Settings'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));

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
      <Suspense fallback={<LoadingScreen />}>
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
          <Route path="/meal-pause" element={<BusinessRoute><MealPause /></BusinessRoute>} />
          <Route path="/settings" element={<BusinessRoute><Settings /></BusinessRoute>} />

          {/* Default */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
