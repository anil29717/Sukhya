import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { PatientResponse, UserProfile } from '@/api/types';

interface AuthState {
  user: UserProfile | null;
  patient: PatientResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activePatientId: number | null;
  activePatientName: string | null;
}

const initialState: AuthState = {
  user: null,
  patient: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  activePatientId: null,
  activePatientName: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (
      state,
      action: PayloadAction<{ user: UserProfile; token: string; patient?: PatientResponse | null }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.patient !== undefined) {
        state.patient = action.payload.patient;
        if (action.payload.patient) {
          state.activePatientId = action.payload.patient.id;
          state.activePatientName = action.payload.patient.user.full_name;
        }
      }
    },
    setPatient: (state, action: PayloadAction<PatientResponse | null>) => {
      state.patient = action.payload;
      if (action.payload) {
        state.activePatientId = action.payload.id;
        state.activePatientName = action.payload.user.full_name;
      }
    },
    setActivePatient: (
      state,
      action: PayloadAction<{ patientId: number; displayName: string }>
    ) => {
      state.activePatientId = action.payload.patientId;
      state.activePatientName = action.payload.displayName;
    },
    clearAuth: (state) => {
      state.user = null;
      state.patient = null;
      state.token = null;
      state.isAuthenticated = false;
      state.activePatientId = null;
      state.activePatientName = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, setPatient, setActivePatient, clearAuth, setLoading } = authSlice.actions;
export default authSlice.reducer;
