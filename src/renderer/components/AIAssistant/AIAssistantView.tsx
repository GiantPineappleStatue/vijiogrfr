import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addMessage,
  selectApiKey,
  selectIsLoading,
  selectMessages,
  setLoading,
  setError,
  appendMessageContent,
  setMessageStreaming,
  setStreamingMessageId,
  selectStreamingMessageId,
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
  const streamingMessageId = useSelector(selectStreamingMessageId);

  const [input, setInput] = useState('');
  const [includeScreenshot, setIncludeScreenshot] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Set up listeners for streaming responses
    const handleResponseChunk = (...args: unknown[]) => {
      const data = args[0] as { id: string; content: string };
      dispatch(appendMessageContent({ id: data.id, content: data.content }));
    };

    const handleResponseComplete = (...args: unknown[]) => {
      const data = args[0] as { id: string; model: string };
      dispatch(setMessageStreaming({ id: data.id, isStreaming: false }));
      dispatch(setLoading(false));
    };

    const handleResponseError = (...args: unknown[]) => {
      const error = args[0] as string;
      dispatch(setError(error));
      dispatch(setLoading(false));

      // If we have a streaming message ID, mark it as not streaming
      if (streamingMessageId) {
        dispatch(setMessageStreaming({ id: streamingMessageId, isStreaming: false }));
        dispatch(setStreamingMessageId(null));
      }
    };

    // Add event listeners
    const removeChunkListener = window.electron.ipcRenderer.on('ai-response-chunk', handleResponseChunk);
    const removeCompleteListener = window.electron.ipcRenderer.on('ai-response-complete', handleResponseComplete);
    const removeErrorListener = window.electron.ipcRenderer.on('ai-response-error', handleResponseError);

    // Clean up event listeners
    return () => {
      removeChunkListener();
      removeCompleteListener();
      removeErrorListener();
    };
  }, [dispatch, streamingMessageId]);

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
      // Prepare context data for both Blender and After Effects
      const context = {
        activeTool: 'Blender and After Effects Assistant',
        activePanel: null,
        selectedObjects: [],
        timelineState: null,
        viewportMode: null,
      };

      // Create a new message ID for the assistant's response
      const assistantMessageId = uuidv4();

      // Add an empty assistant message that will be filled with streaming content
      dispatch(
        addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isStreaming: true,
        })
      );

      // Set the streaming message ID
      dispatch(setStreamingMessageId(assistantMessageId));

      // Query AI with streaming
      window.electron.ipcRenderer.invoke('query-ai-stream', {
        apiKey,
        messages: [...messages, userMessage],
        context,
        messageId: assistantMessageId,
        screenshotData: includeScreenshot ? screenshotData : undefined,
      });

    } catch (error) {
      console.error('Error querying AI:', error);
      dispatch(setError('Failed to get response from AI'));
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
              className={`message ${message.role === 'user' ? 'user' : 'assistant'} ${message.isStreaming ? 'streaming' : ''}`}
            >
              <div className="message-content">{message.content}</div>
              {message.isStreaming && (
                <div className="streaming-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
              <div className="message-timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
                {message.model && <span className="model-name">{message.model}</span>}
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
