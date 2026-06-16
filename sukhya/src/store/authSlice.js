import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuthenticated: false,
  role: null,           // 'patient' | 'doctor' | null
  user: null,           // UserResponse object
  isApproved: false,    // for doctors
  savedRole: null,      // persisted role from AsyncStorage
  isLoading: true,      // true while checking stored tokens on app start
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action) => {
      state.isAuthenticated = true;
      state.role = action.payload.role;
      state.user = action.payload.user;
      state.isApproved = action.payload.isApproved ?? true;
      state.isLoading = false;
    },
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.role = null;
      state.user = null;
      state.isApproved = false;
      state.isLoading = false;
      // savedRole is intentionally preserved
    },
    setSavedRole: (state, action) => {
      state.savedRole = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setAuth, clearAuth, setSavedRole, setLoading, setUser } = authSlice.actions;
export default authSlice.reducer;
