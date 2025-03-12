import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateSettings, SettingsState } from '../../features/settings/settingsSlice';
import { setApiKey } from '../../features/aiAssistant/aiAssistantSlice';

const AppInitializer: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Loading settings at app startup...');
        const settings = await window.electron.ipcRenderer.invoke('load-settings') as Partial<SettingsState>;
        console.log('Loaded settings:', settings);

        // Update settings in Redux
        if (settings) {
          dispatch(updateSettings(settings));

          // Sync OpenAI API key with AI Assistant
          if (settings.openAiApiKey) {
            console.log('Syncing OpenAI API key with AI Assistant');
            dispatch(setApiKey(settings.openAiApiKey));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [dispatch]);

  // This component doesn't render anything
  return null;
};

export default AppInitializer;
