// src/hooks/useAuth.js
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  logoutUser,
  clearError,
  updateUser as updateUserAction,
} from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, role, isAuthenticated, loading, error, status } = useSelector(
    (state) => state.auth
  );

  const login = async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      return { 
        success: true, 
        user: result.user,
        role: result.role,
        token: result.token 
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const result = await dispatch(registerUser(userData)).unwrap();
      return { 
        success: true, 
        data: result 
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { 
        success: false, 
        error: error || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { 
        success: false, 
        error: error || 'Logout failed. Please try again.' 
      };
    }
  };

  // Demo login removed: authentication is API-only (MySQL-backed).

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const updateUser = (partial) => {
    dispatch(updateUserAction(partial));
  };

  return {
    user,
    token,
    role,
    isAuthenticated,
    loading,
    error,
    status,
    login,
    register,
    logout,
    updateUser,
    clearAuthError,
  };
};