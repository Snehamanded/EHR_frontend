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
      // Try to call signin endpoint first
      let response;
      try {
        response = await apiService.post('/user/signin', {
          email: credentials.email,
          password: credentials.password,
        });
      } catch (error) {
        // If signin endpoint doesn't exist (404), try fallback authentication
        if (error.status === 404) {
          console.warn('🔄 Signin endpoint not available, trying fallback authentication...');
          return await this.fallbackLogin(credentials, role);
        } else {
          // For other errors (500, network, etc.), throw the original error
          throw error;
        }
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

  // Fallback authentication method (temporary workaround)
  async fallbackLogin(credentials, role) {
    try {
      console.log('🔄 Using fallback authentication method...');
      
      // Try to get user list and find matching user
      const usersResponse = await apiService.get('/user/list');
      
      if (!usersResponse.success || !usersResponse.data) {
        throw new Error('Unable to fetch user list for authentication');
      }
      
      // Find user by email
      const user = usersResponse.data.find(u => 
        u.email && u.email.toLowerCase() === credentials.email.toLowerCase()
      );
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Note: In a real app, you would verify the password hash
      // For demo purposes, we'll accept any password for existing users
      console.warn('⚠️ Using demo authentication - password not verified');
      
      const mappedUser = this.mapBackendUserToFrontend(user, role);
      
      // Fetch additional profile data based on role
      if (role === 'patient') {
        try {
          const dataService = (await import('./dataService')).default;
          const patient = await dataService.getPatientByUserId(user.id);
          if (patient) {
            mappedUser.patientId = patient.id;
            mappedUser.patient = patient;
            mappedUser.dateOfBirth = patient.dateOfBirth || mappedUser.dateOfBirth;
            mappedUser.gender = patient.gender || mappedUser.gender;
            mappedUser.phone = patient.contactNumber || mappedUser.phone;
            mappedUser.address = patient.address;
            mappedUser.emergencyContact = patient.emergencyContact;
            mappedUser.insuranceRecord = patient.insuranceRecord;
            mappedUser.patientType = patient.type;
          }
        } catch (err) {
          console.warn('Could not fetch patient profile:', err);
        }
      }

      if (role === 'doctor') {
        try {
          const dataService = (await import('./dataService')).default;
          const doctor = await dataService.getDoctorByUserId(user.id);
          if (doctor) {
            mappedUser.doctorId = doctor.id;
            mappedUser.doctor = doctor;
            mappedUser.specialization = doctor.specialization || mappedUser.specialization;
            mappedUser.licenseNumber = doctor.licenseNumber || mappedUser.licenseNumber;
            mappedUser.phone = doctor.phone || mappedUser.phone;
          }
        } catch (err) {
          console.warn('Could not fetch doctor profile:', err);
        }
      }
      
      this.currentUser = mappedUser;
      this.isAuthenticated = true;
      
      // Generate a demo token (in real app, this would come from backend)
      const demoToken = `demo_token_${user.id}_${Date.now()}`;
      localStorage.setItem('medora_token', demoToken);
      
      // Store user data
      localStorage.setItem('medora_user', JSON.stringify(mappedUser));
      localStorage.setItem('medora_role', role);
      
      console.log('✅ Fallback authentication successful');
      return { user: mappedUser, role };
      
    } catch (error) {
      console.error('Fallback authentication failed:', error);
      throw new Error(error.message || 'Authentication failed');
    }
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;