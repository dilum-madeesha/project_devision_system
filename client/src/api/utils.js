// Helper functions for common operations
export const apiHelpers = {
  // Format error messages for display
  formatErrorMessage: (error) => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },
};

// Error handling utilities
export const apiErrorUtils = {
  // Get validation errors from API response
  getValidationErrors: (error) => {
    return error?.response?.data?.errors || {};
  },
  
  // Check if error is a network error
  isNetworkError: (error) => {
    return error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';
  },
  
  // Check if error is a timeout error
  isTimeoutError: (error) => {
    return error?.code === 'ECONNABORTED';
  },
  
  // Check if error is an authentication error
  isAuthError: (error) => {
    return error?.response?.status === 401;
  },
  
  // Check if error is a validation error
  isValidationError: (error) => {
    return error?.response?.status === 400;
  },
  
  // Check if error is a not found error
  isNotFoundError: (error) => {
    return error?.response?.status === 404;
  },
  
  // Check if error is a server error
  isServerError: (error) => {
    return error?.response?.status >= 500;
  }
};
