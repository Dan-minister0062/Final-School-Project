// src/hooks/useAuth.js
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  registerUser,
  logoutUser,
  clearError,
  updateUser as updateUserAction,
  demoLogin,
} from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, role, isAuthenticated, loading, error } = useSelector(
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

  // Direct demo login
  const loginWithDemo = (role) => {
    const demoAccounts = {
      admin: { 
        email: 'admin@madrasatulfathi.com', 
        role: 'admin', 
        name: 'Admin User',
        token: 'demo-token-' + Date.now(),
      },
      teacher: { 
        email: 'teacher@madrasatulfathi.com', 
        role: 'teacher', 
        name: 'Teacher User',
        token: 'demo-token-' + Date.now(),
      },
      parent: { 
        email: 'parent@madrasatulfathi.com', 
        role: 'parent', 
        name: 'Parent User',
        token: 'demo-token-' + Date.now(),
      },
      student: { 
        email: 'student@madrasatulfathi.com', 
        role: 'student', 
        name: 'Student User',
        token: 'demo-token-' + Date.now(),
      },
      // Add generic demo
      demo: { 
        email: 'demo@example.com', 
        role: 'admin', 
        name: 'Demo User',
        token: 'demo-token-' + Date.now(),
      },
    };
    
    const userData = demoAccounts[role];
    if (!userData) {
      return { success: false, error: 'Demo user not found' };
    }
    
    dispatch(demoLogin(userData));
    return { success: true, user: userData };
  };

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
    login,
    register,
    logout,
    updateUser,
    clearAuthError,
    loginWithDemo,
  };
};