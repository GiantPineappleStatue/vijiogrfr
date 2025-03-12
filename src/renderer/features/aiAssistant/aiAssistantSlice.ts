import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store/types';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface AIAssistantState {
  apiKey: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  context: {
    activeTool: string | null;
    activePanel: string | null;
    selectedObjects: string[];
    timelineState: string | null;
    viewportMode: string | null;
  };
}

const initialState: AIAssistantState = {
  apiKey: null,
  messages: [],
  isLoading: false,
  error: null,
  context: {
    activeTool: null,
    activePanel: null,
    selectedObjects: [],
    timelineState: null,
    viewportMode: null,
  },
};

export const aiAssistantSlice = createSlice({
  name: 'aiAssistant',
  initialState,
  reducers: {
    setApiKey: (state, action: PayloadAction<string | null>) => {
      state.apiKey = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        id: string;
        content: string;
      }>
    ) => {
      const { id, content } = action.payload;
      const message = state.messages.find((msg) => msg.id === id);
      if (message) {
        message.content = content;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setContext: (
      state,
      action: PayloadAction<
        Partial<{
          activeTool: string | null;
          activePanel: string | null;
          selectedObjects: string[];
          timelineState: string | null;
          viewportMode: string | null;
        }>
      >
    ) => {
      state.context = { ...state.context, ...action.payload };
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const {
  setApiKey,
  addMessage,
  updateMessage,
  setLoading,
  setError,
  setContext,
  clearMessages,
} = aiAssistantSlice.actions;

// Selectors
export const selectApiKey = (state: RootState) => state.aiAssistant.apiKey;
export const selectMessages = (state: RootState) => state.aiAssistant.messages;
export const selectIsLoading = (state: RootState) => state.aiAssistant.isLoading;
export const selectError = (state: RootState) => state.aiAssistant.error;
export const selectContext = (state: RootState) => state.aiAssistant.context;

export default aiAssistantSlice.reducer;
