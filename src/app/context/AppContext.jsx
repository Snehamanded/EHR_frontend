import { createContext, useContext, useReducer, useEffect } from 'react';
import dataService from '../services/dataService';

// Initial state
const initialState = {
  currentUser: null,
  selectedRole: null,
  patients: [],
  appointments: [],
  reports: [],
  labTests: [],
  labOrders: [],
  prescriptions: [],
  medicines: [],
  pharmacyOrders: [],
  tasks: [],
  vitals: [],
  dischargeSummaries: [],
  notifications: [],
  dietPlans: [],
  symptomAnalyses: [],
  loading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CURRENT_USER: 'SET_CURRENT_USER',
  SET_SELECTED_ROLE: 'SET_SELECTED_ROLE',
  LOAD_DATA: 'LOAD_DATA',
  ADD_ITEM: 'ADD_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  DELETE_ITEM: 'DELETE_ITEM',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    
    case ActionTypes.SET_CURRENT_USER:
      return { ...state, currentUser: action.payload };
    
    case ActionTypes.SET_SELECTED_ROLE:
      return { ...state, selectedRole: action.payload };
    
    case ActionTypes.LOAD_DATA:
      return { 
        ...state, 
        [action.entity]: action.payload,
        loading: false,
        error: null 
      };
    
    case ActionTypes.ADD_ITEM:
      return {
        ...state,
        [action.entity]: [...state[action.entity], action.payload],
      };
    
    case ActionTypes.UPDATE_ITEM:
      return {
        ...state,
        [action.entity]: state[action.entity].map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    
    case ActionTypes.DELETE_ITEM:
      return {
        ...state,
        [action.entity]: state[action.entity].filter(item => item.id !== action.id),
      };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const actions = {
    setLoading: (loading) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    },

    setCurrentUser: (user) => {
      dispatch({ type: ActionTypes.SET_CURRENT_USER, payload: user });
    },

    setSelectedRole: (role) => {
      dispatch({ type: ActionTypes.SET_SELECTED_ROLE, payload: role });
    },

    loadData: async (entity) => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        const data = await dataService.getAll(entity);
        dispatch({ type: ActionTypes.LOAD_DATA, entity, payload: data });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message || 'Failed to load data' });
      }
    },

    loadAllData: async () => {
      try {
        dispatch({ type: ActionTypes.SET_LOADING, payload: true });
        
        const entities = [
          'patients', 'appointments', 'reports', 'labTests', 'labOrders',
          'prescriptions', 'medicines', 'pharmacyOrders', 'tasks', 'vitals',
          'dischargeSummaries', 'notifications', 'dietPlans', 'symptomAnalyses'
        ];

        // Load all entities in parallel for better performance
        const dataPromises = entities.map(entity => 
          dataService.getAll(entity).catch(error => {
            console.error(`Error loading ${entity}:`, error);
            return []; // Return empty array on error
          })
        );

        const results = await Promise.all(dataPromises);
        
        // Dispatch each entity's data
        entities.forEach((entity, index) => {
          dispatch({ type: ActionTypes.LOAD_DATA, entity, payload: results[index] });
        });
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message || 'Failed to load data' });
      }
    },

    addItem: async (entity, item) => {
      try {
        dataService.validateEntity(entity, item);
        const newItem = await dataService.create(entity, item);
        dispatch({ type: ActionTypes.ADD_ITEM, entity, payload: newItem });
        return newItem;
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message || 'Failed to create item' });
        throw error;
      }
    },

    updateItem: async (entity, id, updates) => {
      try {
        const updatedItem = await dataService.update(entity, id, updates);
        if (updatedItem) {
          dispatch({ type: ActionTypes.UPDATE_ITEM, entity, payload: updatedItem });
          return updatedItem;
        }
        throw new Error('Item not found');
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message || 'Failed to update item' });
        throw error;
      }
    },

    deleteItem: async (entity, id) => {
      try {
        const deletedItem = await dataService.delete(entity, id);
        if (deletedItem) {
          dispatch({ type: ActionTypes.DELETE_ITEM, entity, id });
          return deletedItem;
        }
        throw new Error('Item not found');
      } catch (error) {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error.message || 'Failed to delete item' });
        throw error;
      }
    },

    // Specific helper methods (now async)
    getPatientsByDoctor: async (doctorId) => {
      return await dataService.getPatientsByDoctor(doctorId);
    },

    getAppointmentsByPatient: async (patientId) => {
      return await dataService.getAppointmentsByPatient(patientId);
    },

    getAppointmentsByDoctor: async (doctorId) => {
      return await dataService.getAppointmentsByDoctor(doctorId);
    },

    getTasksByAssignee: async (userId) => {
      return await dataService.getTasksByAssignee(userId);
    },

    getPrescriptionsByPatient: async (patientId) => {
      return await dataService.getPrescriptionsByPatient(patientId);
    },

    getNotificationsByUser: async (userId) => {
      return await dataService.getNotificationsByUser(userId);
    },

    getUnreadNotifications: async (userId) => {
      return await dataService.getUnreadNotifications(userId);
    },

    markNotificationAsRead: async (notificationId) => {
      return await dataService.markNotificationAsRead(notificationId);
    },

    searchPatients: async (query) => {
      return await dataService.searchPatients(query);
    },

    getStats: async () => {
      return await dataService.getStats();
    },

    // Patient-specific helper methods
    getPatientIdByUserId: async (userId) => {
      return await dataService.getPatientIdByUserId(userId);
    },

    getPatientByUserId: async (userId) => {
      return await dataService.getPatientByUserId(userId);
    },

    getDocumentsByPatient: async (patientId) => {
      return await dataService.getDocumentsByPatient(patientId);
    },

    getLabOrdersByPatient: async (patientId) => {
      return await dataService.getLabOrdersByPatient(patientId);
    },

    getDietPlanByPatient: async (patientId) => {
      return await dataService.getDietPlanByPatient(patientId);
    },

    getSymptomAnalysesByPatient: async (patientId) => {
      return await dataService.getSymptomAnalysesByPatient(patientId);
    },
  };

  // Load initial data
  useEffect(() => {
    actions.loadAllData();
  }, []);

  const value = {
    ...state,
    ...actions,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;