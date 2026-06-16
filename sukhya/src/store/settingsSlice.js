import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'system',      // 'light' | 'dark' | 'system'
  language: 'en',       // 'en' | 'hi' (hi = v2)
  onboardingComplete: false,
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
  },
});

export const { setTheme, setLanguage, completeOnboarding } = settingsSlice.actions;
export default settingsSlice.reducer;