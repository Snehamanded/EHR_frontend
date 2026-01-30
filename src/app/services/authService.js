// Authentication service - Integrated with Medora Backend API
import apiService from './apiService';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Login user via API
  async login(credentials, role) {
    try {
      // Note: The backend may need a signin endpoint
      // For now, we'll use a workaround or you can add /user/signin route
      // Check if backend has /user/signin endpoint, otherwise we'll need to add it
      
      // Try to call signin endpoint first
      let response;
      try {
        response = await apiService.post('/user/signin', {
          email: credentials.email,
          password: credentials.password,
        });
      } catch (error) {
        // If signin endpoint doesn't exist, fall back to fetching user list
        // and matching credentials (not secure, but for development)
        console.warn('Signin endpoint not available, using fallback');
        throw new Error('Signin endpoint not configured. Please add /user/signin route to backend.');
      }

      if (response.success && response.user) {
        const user = this.mapBackendUserToFrontend(response.user, role);
        
        // If patient, fetch complete patient profile via userId (strict ID-based)
        if (role === 'patient') {
          try {
            const dataService = (await import('./dataService')).default;
            const patient = await dataService.getPatientByUserId(user.id);
            if (patient) {
              user.patientId = patient.id;
              user.patient = patient;
              // Merge patient data into user object for easy access
              user.dateOfBirth = patient.dateOfBirth || user.dateOfBirth;
              user.gender = patient.gender || user.gender;
              user.phone = patient.contactNumber || user.phone;
              user.address = patient.address;
              user.emergencyContact = patient.emergencyContact;
              user.insuranceRecord = patient.insuranceRecord;
              user.patientType = patient.type;
            }
          } catch (err) {
            console.warn('Could not fetch patient profile:', err);
            // Continue without patient profile data
          }
        }

        // If doctor, fetch doctor profile to resolve canonical doctorId (Doctor table id) via userId
        if (role === 'doctor') {
          try {
            const dataService = (await import('./dataService')).default;
            const doctor = await dataService.getDoctorByUserId(user.id);
            if (doctor) {
              user.doctorId = doctor.id;
              user.doctor = doctor;
              user.specialization = doctor.specialization || user.specialization;
              user.licenseNumber = doctor.licenseNumber || user.licenseNumber;
              user.phone = doctor.phone || user.phone;
            }
          } catch (err) {
            console.warn('Could not fetch doctor profile:', err);
          }
        }
        
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Store token if provided
        if (response.token) {
          localStorage.setItem('medora_token', response.token);
        }
        
        // Store user data
        localStorage.setItem('medora_user', JSON.stringify(user));
        localStorage.setItem('medora_role', role);
        
        return { user, role };
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  }

  // Register user via API
  async register(userData, role) {
    try {
      // Map role to userType
      const userTypeMap = {
        patient: 'Patient',
        doctor: 'Doctor',
        staff: 'Staff',
        lab: 'Lab',
        pharmacy: 'Pharmacy',
        receptionist: 'Receptionist',
        admin: 'Admin',
      };

      const registrationData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        mobile: userData.phone,
        userType: userTypeMap[role] || 'Patient',
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        // Doctor-specific fields (used when role === 'doctor')
        specialization: userData.specialization,
        licenseNumber: userData.licenseNumber,
      };

      const response = await apiService.post('/user/add', registrationData);

      if (response.success && response.user) {
        // Registration successful - DO NOT auto-login
        // Just return success, user will need to login separately
        return { success: true, message: 'Registration successful! Please login to continue.' };
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      console.error('[AuthService] Registration error:', {
        error: {
          message: error.message,
          status: error.status,
          url: error.url,
          data: error.data,
        },
        hint: error.status === 500
          ? 'Backend server error - check backend logs'
          : error.status === 0
          ? 'Network error - check server availability and CORS settings'
          : 'Check error details above',
      });
      throw new Error(error.message || 'Registration failed. Please try again.');
    }
  }

  // Map backend user object to frontend format
  mapBackendUserToFrontend(backendUser, role) {
    return {
      id: backendUser.id?.toString() || Date.now().toString(),
      role: role,
      name: `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim(),
      email: backendUser.email,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      phone: backendUser.phone || backendUser.mobile,
      department: backendUser.department,
      specialization: backendUser.specialization,
      licenseNumber: backendUser.licenseNumber,
      userTypeId: backendUser.userTypeId,
      isActive: !backendUser.isDeleted,
      createdAt: backendUser.createdAt,
    };
  }

  // Logout user
  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('medora_token');
    localStorage.removeItem('medora_user');
    localStorage.removeItem('medora_role');
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Restore session from localStorage
  restoreSession() {
    try {
      const storedUser = localStorage.getItem('medora_user');
      const storedRole = localStorage.getItem('medora_role');
      
      if (storedUser && storedRole) {
        this.currentUser = JSON.parse(storedUser);
        this.isAuthenticated = true;
        return { user: this.currentUser, role: storedRole };
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      this.logout();
    }
    return null;
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      const response = await apiService.put(`/user/update/${this.currentUser.id}`, updates);

      if (response.success) {
        this.currentUser = { ...this.currentUser, ...response };
        localStorage.setItem('medora_user', JSON.stringify(this.currentUser));
        return this.currentUser;
      } else {
        throw new Error(response.error || 'Update failed');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    }
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      const response = await apiService.put(`/user/update/${this.currentUser.id}`, {
        password: newPassword,
      });

      if (response.success) {
        return { success: true, message: 'Password changed successfully' };
      } else {
        throw new Error(response.error || 'Password change failed');
      }
    } catch (error) {
      console.error('Change password error:', error);
      throw new Error(error.message || 'Failed to change password');
    }
  }

  // Get user permissions based on role
  getUserPermissions(role) {
    const permissions = {
      patient: [
        'view_own_records',
        'book_appointments',
        'view_prescriptions',
        'view_lab_reports'
      ],
      doctor: [
        'view_all_patients',
        'create_prescriptions',
        'view_lab_reports',
        'create_appointments',
        'update_patient_records'
      ],
      staff: [
        'view_assigned_patients',
        'update_vitals',
        'manage_tasks',
        'create_discharge_summaries'
      ],
      lab: [
        'manage_lab_tests',
        'create_lab_reports',
        'view_lab_orders',
        'update_test_results'
      ],
      pharmacy: [
        'manage_medicines',
        'process_prescriptions',
        'manage_inventory',
        'create_pharmacy_orders'
      ],
      receptionist: [
        'manage_appointments',
        'view_patient_info',
        'handle_billing',
        'manage_patient_flow'
      ],
      admin: [
        'manage_users',
        'view_analytics',
        'system_configuration',
        'manage_all_data'
      ]
    };

    return permissions[role] || [];
  }

  // Check if user has specific permission
  hasPermission(permission) {
    if (!this.currentUser) return false;
    const userPermissions = this.getUserPermissions(this.currentUser.role);
    return userPermissions.includes(permission);
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;
