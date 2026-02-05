import { useState, useEffect } from 'react';
import {
  PatientDashboard,
  DoctorDashboard,
  StaffDashboard,
  LabDashboard,
  PharmacyDashboard,
  ReceptionistDashboard,
  AdminDashboard,
} from '@/dashboards';
import { AppProvider, useApp } from '@/app/context/AppContext';
import { AuthPage } from '@/app/components/auth';
import { Button } from '@/app/components/ui/button';
import { LogOut } from 'lucide-react';
import authService from '@/app/services/authService';
import ErrorBoundary from '@/app/components/common/ErrorBoundary';
import { DebugPanel } from '@/app/components/debug/DebugPanel';
import { Toaster } from '@/app/components/ui/sonner';

function AppContent() {
  const { currentUser, selectedRole, setCurrentUser, setSelectedRole } = useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const session = authService.restoreSession();
    if (session) {
      setCurrentUser(session.user);
      setSelectedRole(session.role);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, [setCurrentUser, setSelectedRole]);

  const handleAuthenticated = (user, role) => {
    setCurrentUser(user);
    setSelectedRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setSelectedRole(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Show loading spinner while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Medora EHR...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if not authenticated
  if (!isAuthenticated || !selectedRole) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  // Render selected dashboard with logout button
  return (
    <ErrorBoundary>
      <div className="relative">
        <Toaster />
        {/* Logout Button - Fixed Position */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-white shadow-lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Render appropriate dashboard based on role */}
        {selectedRole === 'patient' && <PatientDashboard userId={currentUser?.id} />}
        {selectedRole === 'doctor' && <DoctorDashboard userId={currentUser?.id} />}
        {selectedRole === 'staff' && <StaffDashboard userId={currentUser?.id} />}
        {selectedRole === 'lab' && <LabDashboard userId={currentUser?.id} />}
        {selectedRole === 'pharmacy' && <PharmacyDashboard userId={currentUser?.id} />}
        {selectedRole === 'receptionist' && <ReceptionistDashboard userId={currentUser?.id} />}
        {selectedRole === 'admin' && <AdminDashboard userId={currentUser?.id} />}

        {/* Debug Panel (only in development) */}
        <DebugPanel />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
