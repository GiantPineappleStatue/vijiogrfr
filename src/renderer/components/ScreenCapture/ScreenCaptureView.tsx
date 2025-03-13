import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAvailableSources,
  selectIsCapturing,
  selectScreenshotData,
  selectSelectedSourceId,
  setAvailableSources,
  setCapturing,
  setScreenshotData,
  setSelectedSourceId,
  setOcrText,
  setOcrInProgress,
  setAnalysisResults,
  selectOcrText,
  selectOcrInProgress,
  selectAnalysisResults,
} from '../../features/screenCapture/screenCaptureSlice';
import './ScreenCaptureView.css';

// Define types
interface Source {
  id: string;
  name: string;
  thumbnail: string;
}

interface CaptureResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

interface OcrResult {
  text: string;
  confidence: number;
  words: Array<{ text: string; confidence: number }>;
}

interface AnalysisResult {
  detectedTools: string[];
  activePanels: string[];
  selectedObjects: string[];
  properties: Record<string, any>;
}

const ScreenCaptureView: React.FC = () => {
  const dispatch = useDispatch();
  const isCapturing = useSelector(selectIsCapturing);
  const availableSources = useSelector(selectAvailableSources);
  const selectedSourceId = useSelector(selectSelectedSourceId);
  const screenshotData = useSelector(selectScreenshotData);
  const ocrText = useSelector(selectOcrText);
  const ocrInProgress = useSelector(selectOcrInProgress);
  const analysisResults = useSelector(selectAnalysisResults);
  const [error, setError] = useState<string | null>(null);
  const [autoCapture, setAutoCapture] = useState<boolean>(false);
  const [captureInterval, setCaptureInterval] = useState<number | null>(null);

  // Load available sources on component mount
  useEffect(() => {
    const loadSources = async () => {
      try {
        const sources = await window.electron.ipcRenderer.invoke('get-sources') as Source[];
        dispatch(setAvailableSources(sources));

        // Auto-select Blender or After Effects window if available
        const blenderSource = sources.find((source) =>
          source.name.toLowerCase().includes('blender')
        );
        const aeSource = sources.find((source) =>
          source.name.toLowerCase().includes('after effects')
        );

        if (blenderSource) {
          dispatch(setSelectedSourceId(blenderSource.id));
        } else if (aeSource) {
          dispatch(setSelectedSourceId(aeSource.id));
        } else if (sources.length > 0) {
          dispatch(setSelectedSourceId(sources[0].id));
        }
      } catch (err) {
        setError('Failed to load screen sources');
        console.error(err);
      }
    };

    loadSources();
  }, [dispatch]);

  // Process screenshot when it changes
  useEffect(() => {
    if (screenshotData) {
      analyzeScreenshot(screenshotData);
    }
  }, [screenshotData]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (captureInterval) {
        clearInterval(captureInterval);
      }
    };
  }, [captureInterval]);

  // Handle auto-capture toggle
  const toggleAutoCapture = () => {
    if (autoCapture) {
      // Turn off auto-capture
      if (captureInterval) {
        clearInterval(captureInterval);
        setCaptureInterval(null);
      }
      setAutoCapture(false);
    } else {
      // Turn on auto-capture
      if (!selectedSourceId) {
        setError('Please select a window to capture');
        return;
      }

      const interval = window.setInterval(() => {
        captureScreen();
      }, 2000); // Capture every 2 seconds

      setCaptureInterval(interval as unknown as number);
      setAutoCapture(true);
    }
  };

  // Handle source selection
  const handleSourceSelect = (sourceId: string) => {
    dispatch(setSelectedSourceId(sourceId));
  };

  // Capture screenshot
  const captureScreen = async () => {
    if (!selectedSourceId) {
      setError('Please select a window to capture');
      return;
    }

    try {
      dispatch(setCapturing(true));

      // Capture the selected screen
      const captureResult = await window.electron.ipcRenderer.invoke('capture-screen', selectedSourceId) as CaptureResult;

      if (captureResult.success && captureResult.dataUrl) {
        dispatch(setScreenshotData(captureResult.dataUrl));
      } else {
        setError(captureResult.error || 'Failed to capture screen');
      }

      dispatch(setCapturing(false));
    } catch (err) {
      setError('Failed to capture screen');
      console.error(err);
      dispatch(setCapturing(false));
    }
  };

  // Analyze screenshot
  const analyzeScreenshot = async (imageData: string) => {
    try {
      // Start OCR process
      dispatch(setOcrInProgress(true));

      // Perform OCR on the image
      const ocrResult = await window.electron.ipcRenderer.invoke('perform-ocr', imageData) as OcrResult;
      dispatch(setOcrText(ocrResult.text));

      // Analyze the image for UI elements
      const analysisResult = await window.electron.ipcRenderer.invoke('analyze-image', imageData) as AnalysisResult;
      dispatch(setAnalysisResults(analysisResult));

      // Send to AI for analysis
      window.electron.ipcRenderer.sendMessage('query-ai-stream', {
        messageId: Date.now().toString(),
        screenshotData: imageData,
        messages: [
          {
            role: 'user',
            content: 'Analyze this Blender screenshot and tell me what I\'m looking at. What tools are active? What objects are selected? What panel is open?'
          }
        ],
        context: {
          activeTool: analysisResult.detectedTools[0] || null,
          activePanel: analysisResult.activePanels[0] || null,
          selectedObjects: analysisResult.selectedObjects,
          timelineState: null,
          viewportMode: null
        }
      });

      dispatch(setOcrInProgress(false));
    } catch (err) {
      console.error('Error analyzing screenshot:', err);
      dispatch(setOcrInProgress(false));
    }
  };

  // Handle capture button click
  const handleCaptureClick = () => {
    captureScreen();
  };

  return (
    <div className="screen-capture-view">
      <h2>Screen Capture</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="source-selection">
        <h3>Select Window</h3>
        <div className="source-grid">
          {availableSources.map((source) => (
            <div
              key={source.id}
              className={`source-item ${selectedSourceId === source.id ? 'selected' : ''}`}
              onClick={() => handleSourceSelect(source.id)}
            >
              <img src={source.thumbnail} alt={source.name} />
              <div className="source-name">{source.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="capture-controls">
        <button
          className="capture-button"
          onClick={handleCaptureClick}
          disabled={isCapturing || !selectedSourceId}
        >
          {isCapturing ? 'Capturing...' : 'Capture Screen'}
        </button>

        <button
          className={`auto-capture-button ${autoCapture ? 'active' : ''}`}
          onClick={toggleAutoCapture}
          disabled={!selectedSourceId}
        >
          {autoCapture ? 'Stop Auto-Capture' : 'Start Auto-Capture'}
        </button>
      </div>

      {screenshotData && (
        <div className="screenshot-preview">
          <h3>Screenshot</h3>
          <img src={screenshotData} alt="Captured screenshot" />

          {ocrInProgress ? (
            <div className="analysis-loading">Analyzing screenshot...</div>
          ) : (
            <div className="analysis-results">
              {ocrText && (
                <div className="ocr-text">
                  <h4>Detected Text</h4>
                  <pre>{ocrText}</pre>
                </div>
              )}

              {analysisResults && analysisResults.detectedTools.length > 0 && (
                <div className="ui-analysis">
                  <h4>UI Analysis</h4>
                  <div className="analysis-item">
                    <strong>Detected Tools:</strong> {analysisResults.detectedTools.join(', ')}
                  </div>
                  <div className="analysis-item">
                    <strong>Active Panels:</strong> {analysisResults.activePanels.join(', ')}
                  </div>
                  <div className="analysis-item">
                    <strong>Selected Objects:</strong> {analysisResults.selectedObjects.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScreenCaptureView;
