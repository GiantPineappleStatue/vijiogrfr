import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store/types';

export interface DocumentationItem {
  id: string;
  title: string;
  content: string;
  source: 'blender' | 'afterEffects';
  path: string;
  embedding?: number[];
}

export interface SearchResult {
  item: DocumentationItem;
  score: number;
}

export interface DocumentationState {
  isLoading: boolean;
  isEmbeddingLoaded: boolean;
  currentSearchQuery: string;
  searchResults: SearchResult[];
  selectedDocItem: DocumentationItem | null;
  error: string | null;
}

const initialState: DocumentationState = {
  isLoading: false,
  isEmbeddingLoaded: false,
  currentSearchQuery: '',
  searchResults: [],
  selectedDocItem: null,
  error: null,
};

export const documentationSlice = createSlice({
  name: 'documentation',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setEmbeddingLoaded: (state, action: PayloadAction<boolean>) => {
      state.isEmbeddingLoaded = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.currentSearchQuery = action.payload;
    },
    setSearchResults: (state, action: PayloadAction<SearchResult[]>) => {
      state.searchResults = action.payload;
    },
    setSelectedDocItem: (
      state,
      action: PayloadAction<DocumentationItem | null>
    ) => {
      state.selectedDocItem = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.currentSearchQuery = '';
    },
  },
});

export const {
  setLoading,
  setEmbeddingLoaded,
  setSearchQuery,
  setSearchResults,
  setSelectedDocItem,
  setError,
  clearSearchResults,
} = documentationSlice.actions;

// Selectors
export const selectIsLoading = (state: RootState) =>
  state.documentation.isLoading;
export const selectIsEmbeddingLoaded = (state: RootState) =>
  state.documentation.isEmbeddingLoaded;
export const selectCurrentSearchQuery = (state: RootState) =>
  state.documentation.currentSearchQuery;
export const selectSearchResults = (state: RootState) =>
  state.documentation.searchResults;
export const selectSelectedDocItem = (state: RootState) =>
  state.documentation.selectedDocItem;
export const selectError = (state: RootState) => state.documentation.error;

export default documentationSlice.reducer;
