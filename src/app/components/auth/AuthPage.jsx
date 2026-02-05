import { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { RoleSelector } from './RoleSelector';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ApiErrorDisplay } from '@/app/components/common/ApiErrorDisplay';

export function AuthPage({ onAuthenticated }) {
  const [currentView, setCurrentView] = useState('roleSelector'); // 'roleSelector', 'login', 'register'
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setCurrentView('login');
    setError(null);
    setSuccessMessage(null);
  };

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Import authService to use real API
      const authService = (await import('@/app/services/authService')).default;
      
      // Call login API
      const { user, role } = await authService.login(credentials, selectedRole);
      
      // Login successful - redirect to dashboard
      onAuthenticated(user, role);
    } catch (err) {
      console.error('Login error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Import authService to use real API
      const authService = (await import('@/app/services/authService')).default;
      
      // Call registration API
      const result = await authService.register(userData, selectedRole);
      
      // Registration successful - redirect to login page with success message
      setSuccessMessage(result.message || 'Registration successful! Please login to continue.');
      setError(null);
      setCurrentView('login');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
    setError(null);
    setSuccessMessage(null);
  };

  const handleBackToRoleSelector = () => {
    setCurrentView('roleSelector');
    setSelectedRole(null);
    setError(null);
    setSuccessMessage(null);
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      patient: 'Patient',
      doctor: 'Doctor',
      staff: 'Staff',
      lab: 'Laboratory',
      pharmacy: 'Pharmacy',
      receptionist: 'Receptionist',
      admin: 'Administrator'
    };
    return roleNames[role] || 'User';
  };

  if (currentView === 'roleSelector') {
    return (
      <AuthLayout 
        title="Unified Electronic Health Record System"
        subtitle="Connecting patients, doctors, staff, laboratories, pharmacies, and administrators"
        wide={true}
      >
        <RoleSelector onRoleSelect={handleRoleSelect} />
      </AuthLayout>
    );
  }

  if (currentView === 'login') {
    return (
      <AuthLayout 
        title={`${getRoleDisplayName(selectedRole)} Login`}
        subtitle="Sign in to access your dashboard"
      >
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="mb-4">
            <ApiErrorDisplay error={error} onRetry={handleRetry} />
          </div>
        )}
        <LoginForm
          role={selectedRole}
          onLogin={handleLogin}
          onSwitchToRegister={handleSwitchToRegister}
          loading={loading}
          error={null} // We're handling errors above now
        />
        <div className="mt-4 text-center">
          <button
            onClick={handleBackToRoleSelector}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Choose a different role
          </button>
        </div>
      </AuthLayout>
    );
  }

  if (currentView === 'register') {
    return (
      <AuthLayout 
        title={`${getRoleDisplayName(selectedRole)} Registration`}
        subtitle="Create your account to get started"
      >
        {error && (
          <div className="mb-4">
            <ApiErrorDisplay error={error} onRetry={handleRetry} />
          </div>
        )}
        <RegisterForm
          role={selectedRole}
          onRegister={handleRegister}
          onSwitchToLogin={handleSwitchToLogin}
          loading={loading}
          error={null} // We're handling errors above now
        />
        <div className="mt-4 text-center">
          <button
            onClick={handleBackToRoleSelector}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            ← Choose a different role
          </button>
        </div>
      </AuthLayout>
    );
  }

  return null;
}