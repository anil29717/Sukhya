import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'system',      // 'light' | 'dark' | 'system'
  language: 'en',       // 'en' | 'hi' (hi = v2)
  onboardingComplete: false,
  patientOnboardingComplete: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
    },
    completeOnboarding: (state) => {
      state.onboardingComplete = true;
    },
    setPatientOnboardingComplete: (state, action) => {
      state.patientOnboardingComplete = action.payload;
    },
  },
});

export const { setTheme, setLanguage, completeOnboarding, setPatientOnboardingComplete } = settingsSlice.actions;
export default settingsSlice.reducer;