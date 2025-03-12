import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMessage,
  selectApiKey,
  selectIsLoading,
  selectMessages,
  setLoading,
  setError,
} from '../../features/aiAssistant/aiAssistantSlice';
import {
  selectScreenshotData,
} from '../../features/screenCapture/screenCaptureSlice';
import { v4 as uuidv4 } from 'uuid';
import './AIAssistantView.css';

const AIAssistantView: React.FC = () => {
  const dispatch = useDispatch();
  const apiKey = useSelector(selectApiKey);
  const messages = useSelector(selectMessages);
  const isLoading = useSelector(selectIsLoading);
  const screenshotData = useSelector(selectScreenshotData);

  const [input, setInput] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;
    if (!apiKey) {
      dispatch(setError('Please set your OpenAI API key in Settings'));
      return;
    }

    // Add user message to state
    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content: input,
      timestamp: Date.now(),
    };
    dispatch(addMessage(userMessage));
    setInput('');

    // Set loading state
    dispatch(setLoading(true));

    try {
      // Prepare context data
      const context = {
        activeTool: 'Blender 3D View',
        activePanel: 'Properties',
        selectedObjects: ['Cube'],
        timelineState: null,
        viewportMode: 'Object Mode',
      };

      // Query AI
      const response = await window.electron.ipcRenderer.invoke('query-ai', {
        apiKey,
        messages: [...messages, userMessage],
        context,
        screenshotData: includeScreenshot ? screenshotData : undefined,
      }) as { content: string; model: string };

      // Add AI response to state
      dispatch(
        addMessage({
          id: uuidv4(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error('Error querying AI:', error);
      dispatch(setError('Failed to get response from AI'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="ai-assistant-view">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>AI Assistant</h3>
            <p>Ask questions about Blender or After Effects</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className="message-content">{message.content}</div>
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-container" onSubmit={handleSubmit}>
        <div className="screenshot-toggle">
          <label>
            <input
              type="checkbox"
              checked={includeScreenshot}
              onChange={() => setIncludeScreenshot(!includeScreenshot)}
              disabled={!screenshotData}
            />
            Include screenshot
          </label>
        </div>

        <div className="input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Blender or After Effects..."
            disabled={isLoading || !apiKey}
          />
          <button type="submit" disabled={isLoading || !input.trim() || !apiKey}>
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>

        {!apiKey && (
          <div className="api-key-warning">
            Please set your OpenAI API key in Settings
          </div>
        )}
      </form>
    </div>
  );
};

export default AIAssistantView;
