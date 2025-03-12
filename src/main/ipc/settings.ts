import { ipcMain, IpcMainInvokeEvent, app } from 'electron';
import path from 'path';
import fs from 'fs';
import Store from 'electron-store';

// Define settings schema
interface SettingsSchema {
  theme: 'light' | 'dark' | 'system';
  alwaysOnTop: boolean;
  minimizeToTray: boolean;
  startAtLogin: boolean;
  captureHotkey: string;
  autoOcr: boolean;
  ocrLanguage: string;
  openAiApiKey: string;
  embeddingsPath: string;
  blenderPath: string;
  afterEffectsPath: string;
}

// Create settings store with default values
const defaultSettings: SettingsSchema = {
  theme: 'system',
  alwaysOnTop: false,
  minimizeToTray: true,
  startAtLogin: false,
  captureHotkey: 'CommandOrControl+Shift+A',
  autoOcr: true,
  ocrLanguage: 'eng',
  openAiApiKey: '',
  embeddingsPath: path.join(app.getPath('userData'), 'embeddings'),
  blenderPath: '',
  afterEffectsPath: '',
};

// Create settings store
// @ts-ignore - Ignore type issues with electron-store
const settingsStore = new Store({
  name: 'settings',
  defaults: defaultSettings,
});

export function registerSettingsHandlers(): void {
  // Save settings
  ipcMain.handle(
    'save-settings',
    async (_event: IpcMainInvokeEvent, settings: Partial<SettingsSchema>) => {
      try {
        console.log('Saving settings:', settings);

        // Update settings
        Object.entries(settings).forEach(([key, value]) => {
          // @ts-ignore - Ignore type issues with electron-store
          settingsStore.set(key, value);
        });

        // Create embeddings directory if it doesn't exist
        if (settings.embeddingsPath) {
          if (!fs.existsSync(settings.embeddingsPath)) {
            fs.mkdirSync(settings.embeddingsPath, { recursive: true });
          }
        }

        // Handle auto-start setting
        if (settings.startAtLogin !== undefined) {
          try {
            app.setLoginItemSettings({
              openAtLogin: settings.startAtLogin,
              openAsHidden: settings.minimizeToTray || false,
            });
          } catch (err) {
            console.error('Error setting login item:', err);
            // Don't fail the whole settings save because of this
          }
        }

        // Log current stored settings
        // @ts-ignore - Ignore type issues with electron-store
        console.log('Current stored settings:', settingsStore.store);

        return { success: true };
      } catch (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
    }
  );

  // Load settings
  ipcMain.handle('load-settings', async () => {
    try {
      // @ts-ignore - Ignore type issues with electron-store
      const settings = settingsStore.store;
      console.log('Loading settings:', settings);
      return settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  });
}

// Export settings store for use in other modules
export { settingsStore };
