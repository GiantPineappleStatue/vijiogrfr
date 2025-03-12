import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectSettings,
  updateSettings,
} from '../../features/settings/settingsSlice';
import { setApiKey } from '../../features/aiAssistant/aiAssistantSlice';
import './SettingsView.css';

const SettingsView: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);

  const [formState, setFormState] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update form state when settings change
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormState((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save settings to main process
      await window.electron.ipcRenderer.invoke('save-settings', formState);

      // Update Redux store
      dispatch(updateSettings(formState));

      // Sync OpenAI API key with AI Assistant
      dispatch(setApiKey(formState.openAiApiKey));

      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings',
      });
    } finally {
      setIsSaving(false);

      // Clear success message after 3 seconds
      if (saveMessage?.type === 'success') {
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
      }
    }
  };

  return (
    <div className="settings-view">
      <h2>Settings</h2>

      {saveMessage && (
        <div className={`message ${saveMessage.type}`}>
          {saveMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              name="theme"
              value={formState.theme}
              onChange={handleInputChange}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>Application</h3>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="alwaysOnTop"
                checked={formState.alwaysOnTop}
                onChange={handleInputChange}
              />
              Always on top
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="minimizeToTray"
                checked={formState.minimizeToTray}
                onChange={handleInputChange}
              />
              Minimize to tray
            </label>
          </div>

          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="startAtLogin"
                checked={formState.startAtLogin}
                onChange={handleInputChange}
              />
              Start at login
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="captureHotkey">Capture Hotkey</label>
            <input
              type="text"
              id="captureHotkey"
              name="captureHotkey"
              value={formState.captureHotkey}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>OCR Settings</h3>
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="autoOcr"
                checked={formState.autoOcr}
                onChange={handleInputChange}
              />
              Automatically perform OCR on screenshots
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="ocrLanguage">OCR Language</label>
            <select
              id="ocrLanguage"
              name="ocrLanguage"
              value={formState.ocrLanguage}
              onChange={handleInputChange}
            >
              <option value="eng">English</option>
              <option value="fra">French</option>
              <option value="deu">German</option>
              <option value="spa">Spanish</option>
              <option value="ita">Italian</option>
              <option value="jpn">Japanese</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3>API Keys</h3>
          <div className="form-group">
            <label htmlFor="openAiApiKey">OpenAI API Key</label>
            <input
              type="password"
              id="openAiApiKey"
              name="openAiApiKey"
              value={formState.openAiApiKey}
              onChange={handleInputChange}
              placeholder="sk-..."
            />
            <small>Required for AI assistant and documentation search</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>Paths</h3>
          <div className="form-group">
            <label htmlFor="embeddingsPath">Embeddings Path</label>
            <input
              type="text"
              id="embeddingsPath"
              name="embeddingsPath"
              value={formState.embeddingsPath}
              onChange={handleInputChange}
            />
            <small>Directory where documentation embeddings are stored</small>
          </div>

          <div className="form-group">
            <label htmlFor="blenderPath">Blender Executable Path</label>
            <input
              type="text"
              id="blenderPath"
              name="blenderPath"
              value={formState.blenderPath}
              onChange={handleInputChange}
              placeholder="Optional"
            />
          </div>

          <div className="form-group">
            <label htmlFor="afterEffectsPath">After Effects Executable Path</label>
            <input
              type="text"
              id="afterEffectsPath"
              name="afterEffectsPath"
              value={formState.afterEffectsPath}
              onChange={handleInputChange}
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;
