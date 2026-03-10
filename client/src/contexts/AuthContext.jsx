import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../api';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getPrivilegeLevelName,
  canAccessRegisterPage,
  canAccessAddCostPage,
  canAccessReportPage,
  FEATURES 
} from '../utils/permissions';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);
          
          // Check if the user account is still active by verifying with the server
          try {
            const response = await authAPI.getCurrentUser();
            if (response.success && response.data) {
              if (!response.data.isActive) {
                // User has been deactivated
                console.log('User account has been deactivated');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                dispatch({ 
                  type: AUTH_ACTIONS.LOGIN_FAILURE,
                  payload: { message: 'Account is deactivated. Please contact administrator.' } 
                });
                return;
              }
              
              // Update user data with latest from server
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: { user: response.data, token },
              });
            } else {
              throw new Error('Failed to validate user status');
            }
          } catch (apiError) {
            console.error('Error checking user status:', apiError);
            // Still allow login with cached data if server check fails
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user: parsedUser, token },
            });
          }
        } catch (error) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    };
    
    checkAuth();
    
    // Set up periodic status check for active sessions (every 5 minutes)
    const statusCheckInterval = setInterval(async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          // Only process if we have a successful response with user data
          if (response && response.success && response.data) {
            if (!response.data.isActive) {
              // User has been deactivated, force logout
              console.log('User account has been deactivated');
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
              alert('Your account has been deactivated. Please contact administrator.');
              window.location.href = '/login';
            }
          }
        } catch (error) {
          // Log but don't crash - session check failures are non-critical
          console.warn('Warning during periodic status check:', error?.message);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(statusCheckInterval);
  }, []);

  // Login function - memoized to prevent re-renders
  const login = useCallback(async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        // Support multiple possible API shapes: { data: { data: { user, token } } }
        // or { data: { user, token } } or { data: userObject, token: ... }
        const payload = response?.data?.data ?? response?.data ?? {};

        const user = payload.user ?? (typeof payload === 'object' && Object.keys(payload).length ? payload : null);
        const token = payload.token ?? response?.data?.token ?? null;

        if (!user || !token) {
          throw new Error('Invalid login response from server');
        }

        // Store tokens and user in localStorage
        localStorage.setItem('authToken', token);
        // extract refresh token from whichever layer it appears in
        // (previous logic accidentally looked one level too deep)
        const refreshTokenFromPayload =
          payload.refreshToken || response?.data?.refreshToken || null;
        if (refreshTokenFromPayload) {
          localStorage.setItem('refreshToken', refreshTokenFromPayload);
        } else {
          // if the server didn't return one we don't want to keep an old value
          localStorage.removeItem('refreshToken');
        }
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token },
        });

        return { success: true, user };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.message || 'Login failed';
      const errors = error.response?.data?.errors || {};
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { message: errorMessage, errors },
      });
      
      return { success: false, error: { message: errorMessage, errors } };
    }
  }, []);

  // Logout function - memoized to prevent re-renders
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, []);

  // Clear error function - memoized to prevent re-renders
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Update user function - memoized to prevent re-renders
  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  // Privilege-based permission helpers
  const can = useCallback((feature) => {
    return hasPermission(state.user?.privilege, feature);
  }, [state.user]);

  const canAny = useCallback((features) => {
    return hasAnyPermission(state.user?.privilege, features);
  }, [state.user]);

  const canAll = useCallback((features) => {
    return hasAllPermissions(state.user?.privilege, features);
  }, [state.user]);

  const canAccessRegister = useCallback((registerType) => {
    return canAccessRegisterPage(state.user?.privilege, registerType);
  }, [state.user]);

  const canAccessAddCost = useCallback((costType) => {
    return canAccessAddCostPage(state.user?.privilege, costType);
  }, [state.user]);

  const canAccessReport = useCallback((reportType) => {
    return canAccessReportPage(state.user?.privilege, reportType);
  }, [state.user]);

  const getPrivilegeName = useCallback(() => {
    return getPrivilegeLevelName(state.user?.privilege);
  }, [state.user]);

  const value = {
    ...state,
    login,
    logout,
    clearError,
    updateUser,
    // Privilege-based helpers
    can,
    canAny,
    canAll,
    canAccessRegister,
    canAccessAddCost,
    canAccessReport,
    getPrivilegeName,
    // Expose features for easy access
    FEATURES,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
