// API Service - Centralized API client for all backend requests
import axios from 'axios';

// Get API base URL from environment variable
// Default: http://localhost:3000/api/v1 (local development)
// Production URL: https://api.medora.dev/api/v1
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.medora.dev/api/v1';

function normalizeApiBaseUrl(url) {
  if (!url) return url;
  const trimmed = url.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
  return `${trimmed}/api/v1`;
}

const API_BASE_URL = normalizeApiBaseUrl(rawBaseUrl);

// Always log the API URL being used (for debugging)
console.log('🚀 [API Service] Using API URL:', API_BASE_URL);
console.log('🔧 [API Service] Environment variable VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

// Error tracking for summary (development only)
const errorTracker = {
  errors: [],
  maxErrors: 50, // Keep last 50 errors
  addError: function(errorInfo) {
    this.errors.push({
      ...errorInfo,
      timestamp: new Date().toISOString(),
    });
    if (this.errors.length > this.maxErrors) {
      this.errors.shift(); // Remove oldest
    }
  },
  getSummary: function() {
    const summary = {
      total: this.errors.length,
      byStatus: {},
      byEndpoint: {},
      dataIntegrityErrors: [],
      databaseConnectionErrors: [],
      recentErrors: this.errors.slice(-10), // Last 10 errors
    };
    
    this.errors.forEach(err => {
      // Count by status
      summary.byStatus[err.status] = (summary.byStatus[err.status] || 0) + 1;
      
      // Count by endpoint
      summary.byEndpoint[err.url] = (summary.byEndpoint[err.url] || 0) + 1;
      
      // Track data integrity errors
      if (err.isDataIntegrityError) {
        summary.dataIntegrityErrors.push({
          endpoint: err.url,
          message: err.message,
          timestamp: err.timestamp,
        });
      }
      
      // Track database connection errors
      if (err.isDatabaseConnectionError) {
        summary.databaseConnectionErrors.push({
          endpoint: err.url,
          message: err.message,
          timestamp: err.timestamp,
        });
      }
    });
    
    return summary;
  },
  printSummary: function() {
    const summary = this.getSummary();
    console.group('%c📊 API Error Summary', 'color: blue; font-weight: bold; font-size: 14px;');
    console.log(`Total Errors: ${summary.total}`);
    console.log('Errors by Status:', summary.byStatus);
    console.log('Errors by Endpoint:', summary.byEndpoint);
    
    if (summary.databaseConnectionErrors.length > 0) {
      console.error(
        '%c🔴 Database Connection Errors Found:',
        'color: white; font-weight: bold; background: #d32f2f; padding: 4px;',
        summary.databaseConnectionErrors
      );
    }
    
    if (summary.dataIntegrityErrors.length > 0) {
      console.warn(
        '%c⚠️ Data Integrity Errors Found:',
        'color: red; font-weight: bold;',
        summary.dataIntegrityErrors
      );
    }
    
    console.log('Recent Errors:', summary.recentErrors);
    console.groupEnd();
  }
};

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

// Log API configuration on startup (only in development)
if (import.meta.env.DEV) {
  console.log('[API Service] Configuration:', {
    baseURL: API_BASE_URL,
    envVar: import.meta.env.VITE_API_BASE_URL || 'not set (using default)',
    timeout: '30000ms',
  });
  
  // Make error tracker available globally for debugging
  window.apiErrorTracker = errorTracker;
  console.log('💡 Tip: Type "apiErrorTracker.printSummary()" in console to see error summary');
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medora_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Log warning if no token for protected endpoints (except login/register)
      if (!config.url?.includes('/user/signin') && !config.url?.includes('/user/add')) {
        console.warn(`[API] Request to ${config.url} made without authentication token`);
      }
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Backend returns { success: true, ...data }
    return response.data;
  },
  (error) => {
      // Handle error responses
      if (error.response) {
        // Server responded with error status
        const { data, status, config } = error.response;
        const rawErrorMessage = data?.error || data?.message || `Server error (${status})`;
        const url = config?.url || 'unknown';
        const method = config?.method?.toUpperCase() || 'UNKNOWN';
        
        // Sanitize error message for display (remove sensitive connection details)
        const errorMessage = sanitizeErrorMessage(rawErrorMessage);
        const errorLower = errorMessage.toLowerCase();
        
        // Enhanced error logging with prominent backend error message
      
      // Detect database connection errors
      const isDatabaseConnectionError = status === 500 && (
        errorLower.includes('econnrefused') ||
        errorLower.includes('connection refused') ||
        errorLower.includes('connect econnrefused') ||
        errorLower.includes('cannot connect') ||
        errorLower.includes('database connection') ||
        errorLower.includes('mysql') && errorLower.includes('refused')
      );
      
      // Detect data integrity errors
      const isDataIntegrityError = status === 500 && !isDatabaseConnectionError && (
        errorLower.includes('not associated') || 
        errorLower.includes('foreign key') ||
        errorLower.includes('constraint') ||
        errorLower.includes('relationship') ||
        errorLower.includes('reference') ||
        errorLower.includes('cannot find')
      );
      
      // Determine error type with priority
      let errorType;
      if (isDatabaseConnectionError) {
        errorType = '🔴 DATABASE CONNECTION ERROR';
      } else if (isDataIntegrityError) {
        errorType = '⚠️ DATA INTEGRITY ERROR';
      } else {
        errorType = `HTTP ${status}`;
      }
      
      // Track error for summary (use sanitized message for display, raw for dev tracking)
      if (import.meta.env.DEV) {
        errorTracker.addError({
          status,
          method,
          url,
          message: errorMessage, // Sanitized for display
          rawMessage: rawErrorMessage, // Keep original for dev debugging
          isDataIntegrityError,
          isDatabaseConnectionError,
        });
      }
      
      // Determine color based on error type
      let errorColor;
      if (isDatabaseConnectionError) {
        errorColor = 'color: red; font-weight: bold; font-size: 14px; background: #ffe6e6;';
      } else if (isDataIntegrityError) {
        errorColor = 'color: red; font-weight: bold; font-size: 14px;';
      } else {
        errorColor = 'color: orange; font-weight: bold;';
      }
      
      // Log error message prominently as a string first (immediately visible)
      console.error(
        `%c[API Error] ${errorType} - ${method} ${url}`,
        errorColor,
        `\n❌ Backend Error: "${errorMessage}"`
      );
      
      // Then log detailed object
      let detailedErrorType;
      if (isDatabaseConnectionError) {
        detailedErrorType = '🔴 Database Connection Issue';
      } else if (isDataIntegrityError) {
        detailedErrorType = '⚠️ Data Integrity Issue';
      } else {
        detailedErrorType = 'Server Error';
      }
      
      console.error('Error Details:', {
        status,
        method,
        url,
        backendErrorMessage: errorMessage,
        errorType: detailedErrorType,
        responseData: data,
        fullError: error.response,
      });
      
      // Handle 401 Unauthorized - Clear token and redirect to login
      if (status === 401) {
        console.warn('[Auth] Unauthorized - clearing session');
        localStorage.removeItem('medora_token');
        localStorage.removeItem('medora_user');
        localStorage.removeItem('medora_role');
        // Optionally redirect to login
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
      
      // Handle 404 Not Found
      if (status === 404) {
        console.error(`[API Error] Endpoint not found: ${method} ${url}`);
      }
      
      // Handle 500 Internal Server Error with specific guidance
      if (status === 500) {
        if (isDatabaseConnectionError) {
          console.error(
            '%c🔴 CRITICAL: DATABASE CONNECTION ERROR',
            'color: white; font-weight: bold; font-size: 14px; background: #d32f2f; padding: 8px; border-radius: 4px;',
            '\n📋 Issue: Backend cannot connect to MySQL database',
            `\n🔍 Error: "${errorMessage}"`,
            '\n💡 Root Cause: MySQL database server is not accessible (may be temporarily down)',
            '\n🔧 Possible Causes:',
            '   1. Database server is temporarily down or restarting',
            '   2. Network connectivity issues between backend and database',
            '   3. Database server overloaded or unresponsive',
            '   4. Firewall/security group blocking connection',
            '\n📝 This is a backend infrastructure issue - database server needs to be checked/restarted'
          );
        } else if (isDataIntegrityError) {
          console.warn(
            '%c⚠️ DATA INTEGRITY ERROR DETECTED',
            'color: red; font-weight: bold; font-size: 14px; background: #ffe6e6; padding: 4px;',
            '\n📋 Issue: Database relationship problem in backend',
            `\n🔍 Error: "${errorMessage}"`,
            '\n💡 Action Required: Backend team needs to fix database relationships',
            '\n📝 This is NOT a frontend code issue - backend database needs cleanup'
          );
        } else {
          console.warn(
            '%c⚠️ Backend Server Error',
            'color: orange; font-weight: bold;',
            `\n🔍 Error: "${errorMessage}"`,
            '\n💡 Check backend server logs for details'
          );
        }
      }
      
      return Promise.reject({
        message: errorMessage, // Sanitized message
        rawMessage: import.meta.env.DEV ? rawErrorMessage : undefined, // Original only in dev
        status,
        data: data,
        url: url,
        method: method,
      });
    } else if (error.request) {
      // Request made but no response received
      const url = error.config?.url || 'unknown';
      console.error(`[Network Error] No response received for ${url}`, {
        message: 'Network error. Please check your connection.',
        hint: 'Possible causes: CORS issue, server down, network connectivity problem',
        baseURL: API_BASE_URL,
      });
      
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
        url: url,
      });
    } else {
      // Something else happened
      console.error('[API Error] Unexpected error:', error);
      return Promise.reject({
        message: error.message || 'An unexpected error occurred',
        status: 0,
        originalError: error,
      });
    }
  }
);

// Generic CRUD methods
export const apiService = {
  // GET request
  get: async (endpoint, config = {}) => {
    try {
      const response = await apiClient.get(endpoint, config);
      // Backend returns { success: true, data: [...] } or { success: true, ...data }
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // POST request
  post: async (endpoint, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(endpoint, data, config);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // PUT request
  put: async (endpoint, data = {}, config = {}) => {
    try {
      const response = await apiClient.put(endpoint, data, config);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint, config = {}) => {
    try {
      const response = await apiClient.delete(endpoint, config);
      return response.data || response;
    } catch (error) {
      throw error;
    }
  },
};

// Entity-specific API methods
export const entityApi = {
  // Generic CRUD for any entity
  list: (entity) => apiService.get(`/${entity}/list`),
  getById: (entity, id) => apiService.get(`/${entity}/list/${id}`),
  create: (entity, data) => apiService.post(`/${entity}/add`, data),
  update: (entity, id, data) => apiService.put(`/${entity}/update/${id}`, data),
  delete: (entity, id) => apiService.delete(`/${entity}/delete/${id}`),
};

export default apiService;
