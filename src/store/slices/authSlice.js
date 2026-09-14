// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { fetchCsrfCookie, setAuthIdentity } from '../../services/api';

const resolveAuth = (data) => ({
  user: data?.user || null,
  role: data?.role || data?.user?.role || null,
  token: data?.token || null,
});

// ===== LOGIN USER =====
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // Real API login only (MySQL-backed session via Laravel Sanctum).
      await fetchCsrfCookie();
      const response = await api.post('/auth/login', credentials);
      return resolveAuth(response.data);
    } catch (error) {
      console.error('❌ Login error:', error);
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
      await fetchCsrfCookie();
      const response = await api.post('/auth/register', userData);
      return resolveAuth(response.data);
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
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore network errors - local logout still proceeds
  }

  setAuthIdentity(null);

  return {};
});

// ===== RESTORE SESSION (cookies) =====
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return resolveAuth(response.data);
    } catch (error) {
      return rejectWithValue(
        error.response?.status ||
          error.message ||
          'Session check failed'
      );
    }
  }
);

// ===== INITIAL STATE =====
const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  status: 'checking',
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
      setAuthIdentity(state.user);
    },
    setSession: (state, action) => {
      const { user, role, token } = action.payload || {};
      state.user = user ?? state.user;
      state.role = role ?? user?.role ?? state.role;
      state.token = token ?? state.token;
      state.isAuthenticated = true;
      state.status = 'authenticated';
      setAuthIdentity(state.user);
    },
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.status = 'guest';
      setAuthIdentity(null);
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
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.status = 'authenticated';
        state.error = null;
        setAuthIdentity(state.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.status = 'guest';
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.error = action.payload || 'Login failed';
        setAuthIdentity(null);
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.status = 'authenticated';
        state.error = null;
        setAuthIdentity(state.user);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.status = 'guest';
        state.error = action.payload || 'Registration failed';
        setAuthIdentity(null);
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
        state.status = 'guest';
        state.error = null;
        window.dispatchEvent(new CustomEvent('session:ended'));
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.status = 'guest';
        window.dispatchEvent(new CustomEvent('session:ended'));
      })
      .addCase(fetchMe.pending, (state) => {
        state.status = 'checking';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.isAuthenticated = true;
        state.error = null;
        setAuthIdentity(state.user);
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = 'guest';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = null;
        setAuthIdentity(null);
      });
  },
});

export const { clearError, updateUser, setSession, clearSession } = authSlice.actions;
export default authSlice.reducer;