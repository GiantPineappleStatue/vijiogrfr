import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentSearchQuery,
  selectIsEmbeddingLoaded,
  selectIsLoading,
  selectSearchResults,
  selectSelectedDocItem,
  setLoading,
  setSearchQuery,
  setSearchResults,
  setSelectedDocItem,
  setError,
  setEmbeddingLoaded,
  SearchResult,
  DocumentationItem,
} from '../../features/documentation/documentationSlice';
import { selectOpenAiApiKey } from '../../features/settings/settingsSlice';
import './DocumentationView.css';

const DocumentationView: React.FC = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);
  const isEmbeddingLoaded = useSelector(selectIsEmbeddingLoaded);
  const currentSearchQuery = useSelector(selectCurrentSearchQuery);
  const searchResults = useSelector(selectSearchResults);
  const selectedDocItem = useSelector(selectSelectedDocItem);
  const apiKey = useSelector(selectOpenAiApiKey);

  const [searchInput, setSearchInput] = useState('');
  const [allDocuments, setAllDocuments] = useState<DocumentationItem[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Load embeddings on component mount
  useEffect(() => {
    const loadEmbeddings = async () => {
      try {
        setIsLoadingDocuments(true);
        // First, get the settings to retrieve the embeddingsPath
        const settings = await window.electron.ipcRenderer.invoke('load-settings') as any;
        const embeddingsPath = settings?.embeddingsPath;

        console.log('Using embeddings path:', embeddingsPath);

        // Use type assertion to bypass TypeScript channel checking
        const result = await (window.electron.ipcRenderer.invoke as any)('load-documentation', embeddingsPath);
        dispatch(setEmbeddingLoaded(true));

        // Fetch all documents for initial display
        const allDocs = await (window.electron.ipcRenderer.invoke as any)('get-all-documents');
        setAllDocuments(allDocs);
      } catch (error) {
        console.error('Error loading documentation:', error);
        dispatch(setError('Failed to load documentation'));
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    if (!isEmbeddingLoaded) {
      loadEmbeddings();
    }
  }, [dispatch, isEmbeddingLoaded]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchInput.trim()) return;
    if (!apiKey) {
      dispatch(setError('Please set your OpenAI API key in Settings'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setSearchQuery(searchInput));

    try {
      // Use type assertion to bypass TypeScript channel checking
      const results = await (window.electron.ipcRenderer.invoke as any)(
        'search-documentation',
        {
          query: searchInput,
          apiKey,
          limit: 10,
        }
      ) as SearchResult[];

      dispatch(setSearchResults(results));

      // Auto-select first result if available
      if (results && results.length > 0) {
        dispatch(setSelectedDocItem(results[0].item));
      }
    } catch (error) {
      console.error('Error searching documentation:', error);
      dispatch(setError('Failed to search documentation'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleResultClick = (item: DocumentationItem) => {
    dispatch(setSelectedDocItem(item));
  };

  // Determine what to show in the results panel
  const renderResultsList = () => {
    if (isLoading || isLoadingDocuments) {
      return <div className="loading">Loading...</div>;
    }

    if (currentSearchQuery && searchResults.length > 0) {
      // Show search results
      return (
        <>
          <h3>
            Results for "{currentSearchQuery}"
            <span className="result-count">
              ({searchResults.length} {searchResults.length === 1 ? 'result' : 'results'})
            </span>
          </h3>
          <ul className="result-list">
            {searchResults.map((result) => (
              <li
                key={result.item.id}
                className={`result-item ${
                  selectedDocItem?.id === result.item.id ? 'selected' : ''
                }`}
                onClick={() => handleResultClick(result.item)}
              >
                <div className="result-title">{result.item.title}</div>
                <div className="result-source">
                  {result.item.source === 'blender' ? 'Blender' : 'After Effects'}
                </div>
                <div className="result-score">
                  {Math.round(result.score * 100)}% match
                </div>
              </li>
            ))}
          </ul>
        </>
      );
    } else if (currentSearchQuery) {
      // Show "no results" message
      return <div className="no-results">No results found</div>;
    } else if (allDocuments.length > 0) {
      // Show all documents when no search has been performed
      return (
        <>
          <h3>All Available Documentation</h3>
          <ul className="result-list">
            {allDocuments.map((item) => (
              <li
                key={item.id}
                className={`result-item ${
                  selectedDocItem?.id === item.id ? 'selected' : ''
                }`}
                onClick={() => handleResultClick(item)}
              >
                <div className="result-title">{item.title}</div>
                <div className="result-source">
                  {item.source === 'blender' ? 'Blender' : 'After Effects'}
                </div>
              </li>
            ))}
          </ul>
        </>
      );
    }

    return null;
  };

  return (
    <div className="documentation-view">
      <div className="search-panel">
        <h2>Documentation Search</h2>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Blender or After Effects documentation..."
            disabled={isLoading || !apiKey}
          />
          <button type="submit" disabled={isLoading || !searchInput.trim() || !apiKey}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {!apiKey && (
          <div className="api-key-warning">
            Please set your OpenAI API key in Settings
          </div>
        )}

        <div className="search-results">
          {renderResultsList()}
        </div>
      </div>

      <div className="content-panel">
        {selectedDocItem ? (
          <div className="doc-content">
            <h2 className="doc-title">{selectedDocItem.title}</h2>
            <div className="doc-source">
              Source: {selectedDocItem.source === 'blender' ? 'Blender' : 'After Effects'} Documentation
            </div>
            <div className="doc-path">{selectedDocItem.path}</div>
            <div className="doc-text">{selectedDocItem.content}</div>
          </div>
        ) : (
          <div className="empty-state">
            <h3>Documentation Viewer</h3>
            <p>Search for Blender or After Effects documentation to view it here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentationView;
