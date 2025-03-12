import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store/types';

export interface ScreenCaptureState {
  isCapturing: boolean;
  screenshotData: string | null;
  selectedRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  availableSources: {
    id: string;
    name: string;
    thumbnail: string;
  }[];
  selectedSourceId: string | null;
  ocrText: string;
  ocrInProgress: boolean;
  analysisResults: {
    detectedTools: string[];
    activePanels: string[];
    selectedObjects: string[];
    properties: Record<string, any>;
  };
}

const initialState: ScreenCaptureState = {
  isCapturing: false,
  screenshotData: null,
  selectedRegion: null,
  availableSources: [],
  selectedSourceId: null,
  ocrText: '',
  ocrInProgress: false,
  analysisResults: {
    detectedTools: [],
    activePanels: [],
    selectedObjects: [],
    properties: {},
  },
};

export const screenCaptureSlice = createSlice({
  name: 'screenCapture',
  initialState,
  reducers: {
    setCapturing: (state, action: PayloadAction<boolean>) => {
      state.isCapturing = action.payload;
    },
    setScreenshotData: (state, action: PayloadAction<string | null>) => {
      state.screenshotData = action.payload;
    },
    setSelectedRegion: (
      state,
      action: PayloadAction<{
        x: number;
        y: number;
        width: number;
        height: number;
      } | null>
    ) => {
      state.selectedRegion = action.payload;
    },
    setAvailableSources: (
      state,
      action: PayloadAction<
        {
          id: string;
          name: string;
          thumbnail: string;
        }[]
      >
    ) => {
      state.availableSources = action.payload;
    },
    setSelectedSourceId: (state, action: PayloadAction<string | null>) => {
      state.selectedSourceId = action.payload;
    },
    setOcrText: (state, action: PayloadAction<string>) => {
      state.ocrText = action.payload;
    },
    setOcrInProgress: (state, action: PayloadAction<boolean>) => {
      state.ocrInProgress = action.payload;
    },
    setAnalysisResults: (
      state,
      action: PayloadAction<{
        detectedTools: string[];
        activePanels: string[];
        selectedObjects: string[];
        properties: Record<string, any>;
      }>
    ) => {
      state.analysisResults = action.payload;
    },
  },
});

export const {
  setCapturing,
  setScreenshotData,
  setSelectedRegion,
  setAvailableSources,
  setSelectedSourceId,
  setOcrText,
  setOcrInProgress,
  setAnalysisResults,
} = screenCaptureSlice.actions;

// Selectors
export const selectIsCapturing = (state: RootState) =>
  state.screenCapture.isCapturing;
export const selectScreenshotData = (state: RootState) =>
  state.screenCapture.screenshotData;
export const selectSelectedRegion = (state: RootState) =>
  state.screenCapture.selectedRegion;
export const selectAvailableSources = (state: RootState) =>
  state.screenCapture.availableSources;
export const selectSelectedSourceId = (state: RootState) =>
  state.screenCapture.selectedSourceId;
export const selectOcrText = (state: RootState) =>
  state.screenCapture.ocrText;
export const selectOcrInProgress = (state: RootState) =>
  state.screenCapture.ocrInProgress;
export const selectAnalysisResults = (state: RootState) =>
  state.screenCapture.analysisResults;

export default screenCaptureSlice.reducer;
