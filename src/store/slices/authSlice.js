// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ===== DEMO ACCOUNTS =====
const DEMO_ACCOUNTS = {
  // Original demo accounts
  'admin@madrasatulfathi.com': { 
    role: 'admin', 
    name: 'Admin User',
    id: 'demo-admin-001',
    password: 'password123',
  },
  'teacher@madrasatulfathi.com': { 
    role: 'teacher', 
    name: 'Teacher User',
    id: 'demo-teacher-001',
    password: 'password123',
  },
  'parent@madrasatulfathi.com': { 
    role: 'parent', 
    name: 'Parent User',
    id: 'demo-parent-001',
    password: 'password123',
  },
  'student@madrasatulfathi.com': { 
    role: 'student', 
    name: 'Student User',
    id: 'demo-student-001',
    password: 'password123',
  },
  // Add generic demo account
  'demo@example.com': { 
    role: 'admin', 
    name: 'Demo User',
    id: 'demo-user-001',
    password: 'password123',
  },
};

// ===== CHECK IF DEMO CREDENTIALS =====
const isDemoCredentials = (email, password) => {
  const account = DEMO_ACCOUNTS[email];
  return account && account.password === password;
};

// ===== PERFORM DEMO LOGIN =====
const performDemoLogin = (email) => {
  const userData = DEMO_ACCOUNTS[email];
  if (!userData) return null;
  
  const user = {
    ...userData,
    email: email,
    token: 'demo-token-' + Date.now(),
  };
  
  localStorage.setItem('token', user.token);
  localStorage.setItem('role', user.role);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
  
  return { user, role: user.role, token: user.token };
};

// ===== LOGIN USER =====
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Check if this is a demo login attempt
      if (isDemoCredentials(credentials.email, credentials.password)) {
        console.log('🔐 Demo login detected, logging in locally...');
        const result = performDemoLogin(credentials.email);
        if (result) {
          return result;
        }
      }
      
      // If not demo or demo failed, try real API
      console.log('🔐 Attempting real API login...');
      const response = await api.post('/auth/login', credentials);
      const { token, user, role } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
      
      return { user, role, token };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // If API fails, try demo login as last resort
      if (isDemoCredentials(credentials.email, credentials.password)) {
        console.log('⚠️ API failed, but credentials match demo. Logging in locally...');
        const result = performDemoLogin(credentials.email);
        if (result) {
          return result;
        }
      }
      
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Login failed. Please check your credentials.'
      );
    }
  }
);

// ===== REGISTER USER =====
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user, role } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
      return { user, role, token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.errors ||
          error.response?.data?.message ||
          'Registration failed'
      );
    }
  }
);

// ===== LOGOUT USER =====
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  const token = localStorage.getItem('token');
  
  if (token && !token.startsWith('demo-')) {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore network errors - local logout still proceeds
    }
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
  
  return {};
});

// ===== INITIAL STATE =====
const initialState = {
  user: (() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('token') || null,
  role: localStorage.getItem('role') || null,
  isAuthenticated: localStorage.getItem('isAuthenticated') === 'true' || 
                    !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

// ===== SLICE =====
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    // Direct demo login
    demoLogin: (state, action) => {
      const { email, role, name, token } = action.payload;
      const user = { email, role, name, token, id: 'demo-' + Date.now() };
      state.user = user;
      state.role = role;
      state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAuthenticated', 'true');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = action.payload || 'Login failed';
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser, setAuthenticated, demoLogin } = authSlice.actions;
export default authSlice.reducer;