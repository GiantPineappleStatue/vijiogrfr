import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store/types';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  alwaysOnTop: boolean;
  minimizeToTray: boolean;
  startAtLogin: boolean;
  captureHotkey: string;
  autoOcr: boolean;
  ocrLanguage: string;
  openAiApiKey: string;
  embeddingsPath: string;
  blenderPath: string;
  afterEffectsPath: string;
}

const initialState: SettingsState = {
  theme: 'system',
  alwaysOnTop: false,
  minimizeToTray: true,
  startAtLogin: false,
  captureHotkey: 'CommandOrControl+Shift+A',
  autoOcr: true,
  ocrLanguage: 'eng',
  openAiApiKey: '',
  embeddingsPath: '',
  blenderPath: '',
  afterEffectsPath: '',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setAlwaysOnTop: (state, action: PayloadAction<boolean>) => {
      state.alwaysOnTop = action.payload;
    },
    setMinimizeToTray: (state, action: PayloadAction<boolean>) => {
      state.minimizeToTray = action.payload;
    },
    setStartAtLogin: (state, action: PayloadAction<boolean>) => {
      state.startAtLogin = action.payload;
    },
    setCaptureHotkey: (state, action: PayloadAction<string>) => {
      state.captureHotkey = action.payload;
    },
    setAutoOcr: (state, action: PayloadAction<boolean>) => {
      state.autoOcr = action.payload;
    },
    setOcrLanguage: (state, action: PayloadAction<string>) => {
      state.ocrLanguage = action.payload;
    },
    setOpenAiApiKey: (state, action: PayloadAction<string>) => {
      state.openAiApiKey = action.payload;
    },
    setEmbeddingsPath: (state, action: PayloadAction<string>) => {
      state.embeddingsPath = action.payload;
    },
    setBlenderPath: (state, action: PayloadAction<string>) => {
      state.blenderPath = action.payload;
    },
    setAfterEffectsPath: (state, action: PayloadAction<string>) => {
      state.afterEffectsPath = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setTheme,
  setAlwaysOnTop,
  setMinimizeToTray,
  setStartAtLogin,
  setCaptureHotkey,
  setAutoOcr,
  setOcrLanguage,
  setOpenAiApiKey,
  setEmbeddingsPath,
  setBlenderPath,
  setAfterEffectsPath,
  updateSettings,
} = settingsSlice.actions;

// Selectors
export const selectTheme = (state: RootState) => state.settings.theme;
export const selectAlwaysOnTop = (state: RootState) =>
  state.settings.alwaysOnTop;
export const selectMinimizeToTray = (state: RootState) =>
  state.settings.minimizeToTray;
export const selectStartAtLogin = (state: RootState) =>
  state.settings.startAtLogin;
export const selectCaptureHotkey = (state: RootState) =>
  state.settings.captureHotkey;
export const selectAutoOcr = (state: RootState) => state.settings.autoOcr;
export const selectOcrLanguage = (state: RootState) =>
  state.settings.ocrLanguage;
export const selectOpenAiApiKey = (state: RootState) =>
  state.settings.openAiApiKey;
export const selectEmbeddingsPath = (state: RootState) =>
  state.settings.embeddingsPath;
export const selectBlenderPath = (state: RootState) =>
  state.settings.blenderPath;
export const selectAfterEffectsPath = (state: RootState) =>
  state.settings.afterEffectsPath;
export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
