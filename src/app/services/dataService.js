// Data service - Integrated with Medora Backend API
import { entityApi, apiService } from './apiService';

// Sanitize error messages to remove sensitive connection details
function sanitizeErrorMessage(errorMessage) {
  if (!errorMessage) return errorMessage;
  
  // Remove IP addresses and ports (e.g., 127.0.0.1:3306, localhost:3306)
  let sanitized = errorMessage
    .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/g, '[database server]')
    .replace(/localhost:\d+/gi, '[database server]')
    .replace(/127\.0\.0\.1:\d+/g, '[database server]')
    .replace(/:\d{4,5}/g, ''); // Remove standalone ports
  
  // Replace specific connection error patterns with generic messages
  if (sanitized.toLowerCase().includes('econnrefused') || 
      sanitized.toLowerCase().includes('connection refused')) {
    sanitized = 'Database connection refused - server is not accessible';
  }
  
  return sanitized;
}

// Map frontend entity names to backend API endpoints
const entityMap = {
  patients: 'patient',
  appointments: 'appointment',
  prescriptions: 'prescription',
  labOrders: 'laborder',
  labTests: 'laborder', // Lab tests might be part of lab orders
  medicines: 'medicine',
  pharmacyOrders: 'payment', // Pharmacy orders might be under payments
  tasks: 'activitylog', // Tasks might be activity logs
  vitals: 'medicalrecord', // Vitals might be medical records
  dischargeSummaries: 'medicalrecord', // Discharge summaries might be medical records
  notifications: 'notification',
  reports: 'document', // Reports might be documents
  dietPlans: 'medicalrecord', // Diet plans might be medical records
  symptomAnalyses: 'medicalrecord', // Symptom analyses might be medical records
  doctors: 'doctor',
  users: 'user',
  auditLogs: 'auditlog', // Audit logs
};

// Generic CRUD operations
class DataService {
  constructor() {
    // Keep a local cache for offline support (optional)
    this.cache = {};
  }

  // Get backend entity name from frontend entity name
  getBackendEntity(entity) {
    return entityMap[entity] || entity.toLowerCase();
  }

  // Generic CRUD methods
  async getAll(entity) {
    try {
      const backendEntity = this.getBackendEntity(entity);
      const endpoint = `/${backendEntity}/list`;
      
      console.log(`[DataService] Fetching ${entity} from ${endpoint}`);
      const response = await entityApi.list(backendEntity);
      
      // Backend returns { success: true, data: [...] }
      if (response.success && response.data) {
        // Transform backend data to frontend format if needed
        return this.transformData(entity, response.data);
      }
      
      // Some endpoints might return data directly
      return this.transformData(entity, response.data || response);
    } catch (error) {
      const backendEntity = this.getBackendEntity(entity);
      const endpoint = `/${backendEntity}/list`;
      
      // Extract backend error message if available
      const rawBackendError = error.data?.error || error.data?.message || error.message || 'Unknown error';
      // Sanitize error message for display (remove sensitive connection details)
      const backendError = sanitizeErrorMessage(rawBackendError);
      const errorLower = backendError?.toLowerCase() || '';
      
      // Detect database connection errors
      const isDatabaseConnectionError = errorLower.includes('econnrefused') ||
                                       errorLower.includes('connection refused') ||
                                       errorLower.includes('connect econnrefused') ||
                                       errorLower.includes('cannot connect') ||
                                       errorLower.includes('database connection') ||
                                       (errorLower.includes('mysql') && errorLower.includes('refused'));
      
      // Detect data integrity errors
      const isDataIntegrityError = !isDatabaseConnectionError && (
        errorLower.includes('not associated') || 
        errorLower.includes('foreign key') ||
        errorLower.includes('constraint') ||
        errorLower.includes('relationship') ||
        errorLower.includes('reference') ||
        errorLower.includes('cannot find')
      );
      
      // Log error prominently
      if (isDatabaseConnectionError) {
        console.error(
          `%c[DataService] 🔴 DATABASE CONNECTION ERROR fetching ${entity}`,
          'color: red; font-weight: bold; background: #ffe6e6; padding: 4px;',
          `\n📍 Endpoint: ${endpoint}`,
          `\n❌ Backend Error: "${backendError}"`,
          '\n💡 Backend MySQL database server is not accessible (may be temporarily down)'
        );
      } else if (isDataIntegrityError) {
        console.error(
          `%c[DataService] ⚠️ DATA INTEGRITY ERROR fetching ${entity}`,
          'color: red; font-weight: bold;',
          `\n📍 Endpoint: ${endpoint}`,
          `\n❌ Backend Error: "${backendError}"`,
          '\n💡 This is a backend database issue, not a frontend problem'
        );
      } else {
        console.error(
          `[DataService] Error fetching ${entity} (${endpoint}):`,
          `\n❌ Error: "${backendError}"`,
          `\n📍 Status: ${error.status}`
        );
      }
      
      // Log detailed error object
      let detailedErrorType;
      if (isDatabaseConnectionError) {
        detailedErrorType = '🔴 DATABASE CONNECTION ISSUE';
      } else if (isDataIntegrityError) {
        detailedErrorType = '⚠️ DATA INTEGRITY ISSUE';
      } else {
        detailedErrorType = 'API Error';
      }
      
      let actionMessage;
      if (isDatabaseConnectionError) {
        actionMessage = '🔴 Backend MySQL database server is not accessible (may be temporarily down). Contact backend team to check database server status.';
      } else if (isDataIntegrityError) {
        actionMessage = '⚠️ Backend database needs data cleanup. Contact backend team.';
      } else {
        actionMessage = 'Check backend server logs for details';
      }
      
      console.error('Full Error Details:', {
        entity,
        backendEntity,
        endpoint,
        status: error.status,
        backendError: backendError,
        errorType: detailedErrorType,
        error: {
          message: error.message,
          status: error.status,
          url: error.url,
          data: error.data,
        },
        action: actionMessage,
      });
      
      // Return empty array on error to prevent crashes
      return [];
    }
  }

  async getById(entity, id) {
    try {
      const backendEntity = this.getBackendEntity(entity);
      const response = await entityApi.getById(backendEntity, id);
      
      if (response.success) {
        return this.transformSingleItem(entity, response.data || response);
      }
      
      return this.transformSingleItem(entity, response);
    } catch (error) {
      console.error(`Error fetching ${entity} by id ${id}:`, error);
      return null;
    }
  }

  getByField(entity, field, value) {
    // Try backend filtering first, fallback to client-side if not supported
    const backendEntity = this.getBackendEntity(entity);
    
    // Map frontend field names to backend query parameter names
    const queryParamMap = {
      'patientId': 'patientId',
      'doctorId': 'doctorId',
      'userId': 'userId',
      'email': 'email',
      'status': 'status',
      'recordType': 'recordType',
      'isRead': 'isRead',
      'documentTypeId': 'documentTypeId',
      'uploadedBy': 'uploadedBy',
    };
    
    const queryParam = queryParamMap[field] || field;
    
    // Use backend filtering for supported entities and fields
    if (queryParamMap[field]) {
      try {
        return apiService.get(`/${backendEntity}/list?${queryParam}=${value}`).then(response => {
          if (response.success && response.data) {
            return this.transformData(entity, response.data);
          }
          return this.transformData(entity, response.data || response);
        }).catch(() => {
          // Fallback to client-side filtering if backend filtering fails
          return this.getAll(entity).then(items => 
            items.filter(item => item[field] === value)
          );
        });
      } catch (error) {
        // Fallback to client-side filtering
        return this.getAll(entity).then(items => 
          items.filter(item => item[field] === value)
        );
      }
    }
    
    // Client-side filter for unsupported fields
    return this.getAll(entity).then(items => 
      items.filter(item => item[field] === value)
    );
  }

  // Doctor profile helpers
  async getDoctorByUserId(userId) {
    try {
      const doctors = await this.getByField('doctors', 'userId', userId);
      return Array.isArray(doctors) ? (doctors[0] || null) : doctors;
    } catch (error) {
      console.error('Error getting doctor by userId:', error);
      return null;
    }
  }

  async create(entity, item) {
    try {
      const backendEntity = this.getBackendEntity(entity);
      const transformedItem = this.transformToBackendFormat(entity, item);
      const response = await entityApi.create(backendEntity, transformedItem);
      
      if (response.success) {
        return this.transformSingleItem(entity, response.data || response);
      }
      
      return this.transformSingleItem(entity, response);
    } catch (error) {
      console.error(`Error creating ${entity}:`, error);
      throw error;
    }
  }

  async update(entity, id, updates) {
    try {
      const backendEntity = this.getBackendEntity(entity);
      const transformedUpdates = this.transformToBackendFormat(entity, updates);
      const response = await entityApi.update(backendEntity, id, transformedUpdates);
      
      if (response.success) {
        return this.transformSingleItem(entity, response.data || response);
      }
      
      return this.transformSingleItem(entity, response);
    } catch (error) {
      console.error(`Error updating ${entity} ${id}:`, error);
      throw error;
    }
  }

  async delete(entity, id) {
    try {
      const backendEntity = this.getBackendEntity(entity);
      const response = await entityApi.delete(backendEntity, id);
      
      if (response.success) {
        return { id, deleted: true };
      }
      
      return { id, deleted: false };
    } catch (error) {
      console.error(`Error deleting ${entity} ${id}:`, error);
      throw error;
    }
  }

  // Transform backend data to frontend format
  transformData(entity, data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => this.transformSingleItem(entity, item));
  }

  // Transform single item from backend to frontend format
  transformSingleItem(entity, item) {
    if (!item) return null;

    // Basic transformation - keep most fields as-is
    // Add entity-specific transformations as needed
    const transformed = { ...item };

    // Common field mappings
    if (item.id) transformed.id = item.id.toString();
    if (item.createdAt) transformed.createdAt = item.createdAt;
    if (item.updatedAt) transformed.updatedAt = item.updatedAt;

    // Entity-specific transformations
    switch (entity) {
      case 'appointments':
        transformed.patientId = item.patientId?.toString();
        transformed.doctorId = item.doctorId?.toString();
        transformed.date = item.appointmentDate?.split('T')[0] || item.appointmentDate;
        transformed.time = item.appointmentDate?.split('T')[1]?.substring(0, 5) || item.appointmentTime;
        transformed.patientName = item.patient?.name || item.patientName;
        transformed.doctorName = item.doctor?.name || item.doctorName;
        transformed.department = item.doctor?.specialization || item.department;
        break;

      case 'patients':
        transformed.name = `${item.firstName || ''} ${item.lastName || ''}`.trim();
        transformed.phone = item.contactNumber || item.phone;
        break;

      case 'prescriptions':
        transformed.patientId = item.patientId?.toString();
        transformed.doctorId = item.doctorId?.toString();
        transformed.patientName = item.patient?.name || item.patientName;
        transformed.doctorName = item.doctor?.name || item.doctorName;
        break;

      case 'labOrders':
        transformed.patientId = item.patientId?.toString();
        transformed.testName = item.testName || item.labTest?.name;
        transformed.orderDate = item.orderDate || item.createdAt?.split('T')[0];
        break;

      case 'pharmacyOrders':
        transformed.patientId = item.patientId?.toString();
        transformed.orderDate = item.paymentDate?.split('T')[0] || item.createdAt?.split('T')[0];
        transformed.totalAmount = item.amount || 0;
        transformed.paymentStatus = item.status?.toLowerCase() === 'completed' ? 'paid' : 'pending';
        // Map payment status to order status
        const paymentStatus = item.status?.toLowerCase();
        if (paymentStatus === 'completed') {
          transformed.status = 'delivered';
        } else if (paymentStatus === 'pending') {
          transformed.status = 'pending';
        } else {
          transformed.status = paymentStatus || 'pending';
        }
        // Items would come from prescription or be empty array
        transformed.items = item.items || [];
        break;

      case 'medicines':
        transformed.stock = item.stockQuantity || item.stock || 0;
        transformed.price = item.price || 0;
        transformed.expiryDate = item.expiryDate;
        transformed.category = item.category || item.type;
        break;

      case 'tasks':
        // Transform ActivityLog to Task format
        transformed.title = item.action || item.title || 'Task';
        transformed.description = item.details?.description || item.description || item.details || '';
        transformed.status = item.details?.status || item.status || 'pending';
        transformed.priority = item.details?.priority || item.priority || 'medium';
        transformed.type = item.entity || item.type || 'general';
        transformed.assignedTo = item.details?.assignedTo || item.assignedTo || item.userId;
        transformed.dueDate = item.details?.dueDate || item.dueDate || item.timestamp?.split('T')[0];
        transformed.patientId = item.details?.patientId || item.patientId;
        transformed.completedAt = item.details?.completedAt || item.completedAt;
        transformed.notes = item.details?.notes || item.notes;
        break;

      case 'vitals':
        // Transform MedicalRecord with recordType='vitals' to Vitals format
        transformed.patientId = item.patientId?.toString();
        transformed.recordedAt = item.visitDate?.split('T')[0] || item.createdAt?.split('T')[0];

        // Safely parse description JSON (backend may contain plain text like "X-ray shows...")
        let vitalData = {};
        if (item.description) {
          if (typeof item.description === 'string') {
            const trimmed = item.description.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              try {
                vitalData = JSON.parse(trimmed);
              } catch (e) {
                // If parsing fails, fall back to empty object and avoid breaking UI
                console.warn('[DataService] Unable to parse vitals description as JSON. Using fallback.', {
                  descriptionSample: trimmed.slice(0, 100),
                });
                vitalData = {};
              }
            }
          } else if (typeof item.description === 'object') {
            vitalData = item.description;
          }
        }

        transformed.bloodPressure = vitalData.bloodPressure || 'N/A';
        transformed.heartRate = vitalData.heartRate || 'N/A';
        transformed.temperature = vitalData.temperature || 'N/A';
        transformed.oxygenSaturation = vitalData.oxygenSaturation || vitalData.spO2 || 'N/A';
        transformed.respiratoryRate = vitalData.respiratoryRate || 'N/A';
        transformed.weight = vitalData.weight || 'N/A';
        transformed.height = vitalData.height || 'N/A';
        break;

      case 'dischargeSummaries':
        // Transform MedicalRecord with recordType='dischargesummary' to DischargeSummary format
        transformed.patientId = item.patientId?.toString();
        transformed.admissionDate = item.details?.admissionDate || item.visitDate?.split('T')[0];
        transformed.dischargeDate = item.details?.dischargeDate || item.createdAt?.split('T')[0];
        transformed.status = item.details?.status || 'draft';
        transformed.primaryDiagnosis = item.details?.primaryDiagnosis || item.description || 'N/A';
        transformed.secondaryDiagnosis = item.details?.secondaryDiagnosis || [];
        transformed.procedures = item.details?.procedures || [];
        break;

      case 'reports':
        // Transform Document to Report format
        // Map relatedEntityId to patientId when relatedEntityType is 'Patient'
        if (item.relatedEntityType === 'Patient' && item.relatedEntityId) {
          transformed.patientId = item.relatedEntityId.toString();
        } else if (item.patientId) {
          transformed.patientId = item.patientId.toString();
        }
        // Map title to name for consistency
        transformed.name = item.title || item.name;
        // Map createdAt to date
        transformed.date = item.createdAt?.split('T')[0] || item.date;
        // Keep documentTypeId as-is
        transformed.documentTypeId = item.documentTypeId;
        // Keep fileUrl for viewing/downloading
        transformed.fileUrl = item.fileUrl;
        transformed.fileType = item.fileType;
        transformed.description = item.description;
        transformed.uploadedBy = item.uploadedBy;
        break;

      default:
        // Keep as-is for other entities
        break;
    }

    return transformed;
  }

  // Transform frontend data to backend format
  transformToBackendFormat(entity, item) {
    const transformed = { ...item };

    // Entity-specific transformations
    switch (entity) {
      case 'appointments':
        if (item.date && item.time) {
          transformed.appointmentDate = `${item.date}T${item.time}:00`;
        }
        break;

      case 'patients':
        if (item.name) {
          const nameParts = item.name.split(' ');
          transformed.firstName = nameParts[0] || item.firstName;
          transformed.lastName = nameParts.slice(1).join(' ') || item.lastName;
        }
        transformed.contactNumber = item.phone || item.contactNumber;
        break;

      default:
        // Keep as-is for other entities
        break;
    }

    return transformed;
  }

  // Specific methods for common operations

  // Patient methods
  async getPatientsByDoctor(doctorId) {
    try {
      const appointments = await this.getByField('appointments', 'doctorId', doctorId);
    const patientIds = [...new Set(appointments.map(apt => apt.patientId))];
      const patients = await Promise.all(
        patientIds.map(id => this.getById('patients', id))
      );
      return patients.filter(Boolean);
    } catch (error) {
      console.error('Error getting patients by doctor:', error);
      return [];
    }
  }

  // Get patientId from userId (strict ID-based via Patient.userId)
  async getPatientIdByUserId(userId) {
    try {
      const patients = await this.getByField('patients', 'userId', userId);
      const patient = Array.isArray(patients) ? patients[0] : patients;
      return patient?.id || null;
    } catch (error) {
      console.error('Error getting patientId from userId:', error);
      return null;
    }
  }

  // Get patient profile by userId (strict ID-based via Patient.userId)
  async getPatientByUserId(userId) {
    try {
      const patients = await this.getByField('patients', 'userId', userId);
      return Array.isArray(patients) ? (patients[0] || null) : patients;
    } catch (error) {
      console.error('Error getting patient by userId:', error);
      return null;
    }
  }

  // Appointment methods
  async getAppointmentsByDate(date) {
    return this.getByField('appointments', 'date', date);
  }

  async getAppointmentsByPatient(patientId) {
    // Use backend filtering with query parameter
    return this.getByField('appointments', 'patientId', patientId);
  }

  async getAppointmentsByDoctor(doctorId) {
    // Use backend filtering with query parameter
    return this.getByField('appointments', 'doctorId', doctorId);
  }

  // Doctor-scoped Patients
  async getPatientsByDoctor(doctorId) {
    try {
      const backendEntity = this.getBackendEntity('doctors'); // 'doctor'
      const response = await apiService.get(`/${backendEntity}/${doctorId}/patients`);
      if (response.success && response.data) {
        return this.transformData('patients', response.data);
      }
      return this.transformData('patients', response.data || response);
    } catch (error) {
      console.error('Error getting patients by doctor:', error);
      return [];
    }
  }

  // Task methods
  async getTasksByAssignee(userId) {
    try {
      // Fetch all activity logs (tasks) and filter by assignedTo in details
      const allTasks = await this.getAll('tasks');
      // Filter tasks where assignedTo matches userId (check both direct field and details JSON)
      return allTasks.filter(task => {
        const assignedTo = task.assignedTo || task.details?.assignedTo || task.userId;
        return assignedTo?.toString() === userId?.toString();
      });
    } catch (error) {
      console.error('Error getting tasks by assignee:', error);
      return [];
    }
  }

  async getTasksByAssigner(userId) {
    return this.getByField('tasks', 'assignedBy', userId);
  }

  // Lab methods
  async getLabOrdersByStatus(status) {
    return this.getByField('labOrders', 'status', status);
  }

  // Prescription methods
  async getPrescriptionsByPatient(patientId) {
    // Use backend filtering with query parameter
    return this.getByField('prescriptions', 'patientId', patientId);
  }

  async getPrescriptionsByDoctor(doctorId) {
    // Use backend filtering with query parameter
    return this.getByField('prescriptions', 'doctorId', doctorId);
  }

  // Document/Report methods
  async getDocumentsByPatient(patientId) {
    // Documents use relatedEntityId and relatedEntityType instead of patientId
    const backendEntity = this.getBackendEntity('reports'); // 'document'
    try {
      const response = await apiService.get(`/${backendEntity}/list?patientId=${patientId}`);
      if (response.success && response.data) {
        return this.transformData('reports', response.data);
      }
      return this.transformData('reports', response.data || response);
    } catch (error) {
      // Fallback to client-side filtering
      return this.getByField('reports', 'patientId', patientId);
    }
  }

  // Lab Order methods
  async getLabOrdersByPatient(patientId) {
    // Use backend filtering with query parameter
    return this.getByField('labOrders', 'patientId', patientId);
  }

  // Medical Record methods (for diet plans and symptom analyses)
  async getMedicalRecordsByPatient(patientId, recordType = null) {
    try {
      const backendEntity = this.getBackendEntity('vitals'); // 'medicalrecord'
      
      // Build query with both patientId and recordType if provided
      let query = `patientId=${patientId}`;
      if (recordType) {
        query += `&recordType=${recordType}`;
      }
      
      try {
        // Try backend filtering first
        const response = await apiService.get(`/${backendEntity}/list?${query}`);
        if (response.success && response.data) {
          return this.transformData('vitals', response.data);
        }
        return this.transformData('vitals', response.data || response);
      } catch (error) {
        // Fallback to client-side filtering
        const records = await this.getByField('vitals', 'patientId', patientId);
        if (recordType) {
          return records.filter(r => r.recordType === recordType || r.type === recordType);
        }
        return records;
      }
    } catch (error) {
      console.error('Error getting medical records by patient:', error);
      return [];
    }
  }

  async getDietPlanByPatient(patientId) {
    try {
      const records = await this.getMedicalRecordsByPatient(patientId, 'dietplan');
      return records[0] || null;
    } catch (error) {
      console.error('Error getting diet plan:', error);
      return null;
    }
  }

  async getSymptomAnalysesByPatient(patientId) {
    try {
      return await this.getMedicalRecordsByPatient(patientId, 'symptomanalysis');
    } catch (error) {
      console.error('Error getting symptom analyses:', error);
      return [];
    }
  }

  async getSymptomAnalysesByDoctor(doctorId) {
    try {
      const backendEntity = this.getBackendEntity('vitals'); // 'medicalrecord'
      const query = `doctorId=${doctorId}&recordType=symptomanalysis`;
      const response = await apiService.get(`/${backendEntity}/list?${query}`);
      if (response.success && response.data) {
        return this.transformData('symptomAnalyses', response.data);
      }
      return this.transformData('symptomAnalyses', response.data || response);
    } catch (error) {
      console.error('Error getting symptom analyses by doctor:', error);
      return [];
    }
  }

  // Doctor methods
  async getAllDoctors() {
    try {
      return await this.getAll('doctors');
    } catch (error) {
      console.error('Error getting all doctors:', error);
      return [];
    }
  }

  // Billing Record methods
  async getAllBillingRecords(filters = {}) {
    try {
      const { patientId, status, appointmentId } = filters;
      const queryParams = [];
      if (patientId) queryParams.push(`patientId=${patientId}`);
      if (status) queryParams.push(`status=${status}`);
      if (appointmentId) queryParams.push(`appointmentId=${appointmentId}`);
      
      const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const response = await apiService.get(`/billingrecord/list${query}`);
      
      if (response.success && response.data) {
        return response.data;
      }
      return response.data || [];
    } catch (error) {
      console.error('Error getting billing records:', error);
      return [];
    }
  }

  async getBillingRecordsByPatient(patientId) {
    try {
      return await this.getAllBillingRecords({ patientId });
    } catch (error) {
      console.error('Error getting billing records by patient:', error);
      return [];
    }
  }

  async addBillingRecord(data) {
    try {
      const response = await apiService.post('/billingrecord/add', data);
      return response.data || response;
    } catch (error) {
      console.error('Error adding billing record:', error);
      throw error;
    }
  }

  async updateBillingRecord(id, data) {
    try {
      const response = await apiService.put(`/billingrecord/update/${id}`, data);
      return response.data || response;
    } catch (error) {
      console.error('Error updating billing record:', error);
      throw error;
    }
  }

  // Notification methods
  async getNotificationsByUser(userId) {
    return this.getByField('notifications', 'userId', userId);
  }

  async getUnreadNotifications(userId) {
    const notifications = await this.getNotificationsByUser(userId);
    return notifications.filter(n => !n.read);
  }

  async markNotificationAsRead(notificationId) {
    return this.update('notifications', notificationId, { read: true });
  }

  // Statistics methods
  async getStats() {
    try {
      const [
        users,
        patients,
        appointments,
        prescriptions,
        labOrders,
        tasks,
      ] = await Promise.all([
        this.getAll('users'),
        this.getAll('patients'),
        this.getAll('appointments'),
        this.getAll('prescriptions'),
        this.getAll('labOrders'),
        this.getAll('tasks'),
      ]);

      return {
        totalUsers: users.length,
        totalPatients: patients.length,
        totalAppointments: appointments.length,
        totalPrescriptions: prescriptions.length,
        totalLabOrders: labOrders.length,
        totalTasks: tasks.length,
        pendingAppointments: appointments.filter(a => a.status === 'pending').length,
        completedAppointments: appointments.filter(a => a.status === 'completed').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
    return {
        totalUsers: 0,
        totalPatients: 0,
        totalAppointments: 0,
        totalPrescriptions: 0,
        totalLabOrders: 0,
        totalTasks: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        pendingTasks: 0,
        completedTasks: 0,
      };
    }
  }

  // Search methods
  async searchPatients(query) {
    try {
      const patients = await this.getAll('patients');
    const lowercaseQuery = query.toLowerCase();
      return patients.filter(patient => 
        patient.name?.toLowerCase().includes(lowercaseQuery) ||
        patient.email?.toLowerCase().includes(lowercaseQuery) ||
        patient.phone?.includes(query) ||
        patient.id?.toString().toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }

  async searchAppointments(query) {
    try {
      const appointments = await this.getAll('appointments');
    const lowercaseQuery = query.toLowerCase();
      return appointments.filter(appointment => 
        appointment.patientName?.toLowerCase().includes(lowercaseQuery) ||
        appointment.doctorName?.toLowerCase().includes(lowercaseQuery) ||
        appointment.department?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching appointments:', error);
      return [];
    }
  }

  // Bulk operations
  async bulkUpdateStatus(entity, ids, status) {
    try {
      const results = await Promise.all(
        ids.map(id => this.update(entity, id, { status }))
      );
      return results.filter(Boolean);
    } catch (error) {
      console.error(`Error bulk updating ${entity}:`, error);
      return [];
    }
  }

  // Data validation
  validateEntity(entity, data) {
    // Basic validation - can be extended
    const requiredFields = {
      patients: ['firstName', 'lastName', 'email', 'phone'],
      appointments: ['patientId', 'doctorId', 'appointmentDate'],
      prescriptions: ['patientId', 'doctorId'],
      tasks: ['assignedTo', 'title', 'description'],
    };

    if (requiredFields[entity]) {
      const missing = requiredFields[entity].filter(field => !data[field]);
      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }
    }
    return true;
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
