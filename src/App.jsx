import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import SelectProvince from './pages/encoder/SelectProvince';
import EncoderLogin from './pages/encoder/EncoderLogin';
import EncoderRegister from './pages/encoder/EncoderRegister';
import Dashboard from './pages/Dashboard';
import EncodedFormsPage from './pages/EncodedFormsPage';
import IndividualFormsPage from './pages/IndividualFormsPage';
import FCAFormsPage from './pages/FCAFormsPage';
import IndividualForm from './pages/entry/IndividualForm';
import FCAForm from './pages/entry/FCAForm';
import SystemLogsPage from './pages/admin/SystemLogsPage';

function PrivateRoute({ children, adminOnly, encoderOnly }) {
  const { user, userProfile, loading } = useAuth();
  // Show loading until auth is resolved (avoids errors on refresh when auth state is rehydrating)
  if (loading || (user && userProfile === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F8ED]">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#84BC40]/30 border-t-[#84BC40] rounded-full animate-spin mb-4" />
          <p className="text-[#8D4A25] font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && userProfile?.role !== 'admin') return <Navigate to="/" replace />;
  if (encoderOnly && userProfile?.role !== 'encoder') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/encoder/select-province" element={<SelectProvince />} />
      <Route path="/encoder/:province/login" element={<EncoderLogin />} />
      <Route path="/encoder/:province/register" element={<EncoderRegister />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/encoded-forms"
        element={
          <PrivateRoute>
            <EncodedFormsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/individual-forms"
        element={
          <PrivateRoute>
            <IndividualFormsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/fca-forms"
        element={
          <PrivateRoute>
            <FCAFormsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/system-logs"
        element={
          <PrivateRoute adminOnly>
            <SystemLogsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/entry/individual"
        element={
          <PrivateRoute encoderOnly>
            <IndividualForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/entry/individual/:id/edit"
        element={
          <PrivateRoute>
            <IndividualForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/entry/fca"
        element={
          <PrivateRoute encoderOnly>
            <FCAForm />
          </PrivateRoute>
        }
      />
      <Route
        path="/entry/fca/:id/edit"
        element={
          <PrivateRoute>
            <FCAForm />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
