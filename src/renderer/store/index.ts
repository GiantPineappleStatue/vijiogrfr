import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Import reducers
import screenCaptureReducer from '../features/screenCapture/screenCaptureSlice';
import aiAssistantReducer from '../features/aiAssistant/aiAssistantSlice';
import settingsReducer from '../features/settings/settingsSlice';
import documentationReducer from '../features/documentation/documentationSlice';
import { RootState } from './types';

export const store = configureStore({
  reducer: {
    screenCapture: screenCaptureReducer,
    aiAssistant: aiAssistantReducer,
    settings: settingsReducer,
    documentation: documentationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in state
        ignoredActions: ['screenCapture/setScreenshotData'],
        ignoredPaths: ['screenCapture.screenshotData'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Optional, but required for refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch;

// Export the RootState type
export type { RootState };
