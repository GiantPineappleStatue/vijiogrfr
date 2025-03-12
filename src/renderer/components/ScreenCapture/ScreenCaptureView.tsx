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
} from '../../features/screenCapture/screenCaptureSlice';
import './ScreenCaptureView.css';

// Define source type
interface Source {
  id: string;
  name: string;
  thumbnail: string;
}

const ScreenCaptureView: React.FC = () => {
  const dispatch = useDispatch();
  const isCapturing = useSelector(selectIsCapturing);
  const availableSources = useSelector(selectAvailableSources);
  const selectedSourceId = useSelector(selectSelectedSourceId);
  const screenshotData = useSelector(selectScreenshotData);
  const [error, setError] = useState<string | null>(null);

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

  // Handle source selection
  const handleSourceSelect = (sourceId: string) => {
    dispatch(setSelectedSourceId(sourceId));
  };

  // Handle capture button click
  const handleCaptureClick = async () => {
    if (!selectedSourceId) {
      setError('Please select a window to capture');
      return;
    }

    try {
      dispatch(setCapturing(true));

      // In a real implementation, we would use desktopCapturer to capture the screen
      // For now, we'll just use a placeholder image
      const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

      // In the real app, we would capture the screen here
      // const stream = await navigator.mediaDevices.getUserMedia({
      //   audio: false,
      //   video: {
      //     mandatory: {
      //       chromeMediaSource: 'desktop',
      //       chromeMediaSourceId: selectedSourceId,
      //     }
      //   }
      // });

      // For now, just use the placeholder
      dispatch(setScreenshotData(placeholderImage));
      dispatch(setCapturing(false));
    } catch (err) {
      setError('Failed to capture screen');
      console.error(err);
      dispatch(setCapturing(false));
    }
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
      </div>

      {screenshotData && (
        <div className="screenshot-preview">
          <h3>Screenshot</h3>
          <img src={screenshotData} alt="Captured screenshot" />
        </div>
      )}
    </div>
  );
};

export default ScreenCaptureView;
