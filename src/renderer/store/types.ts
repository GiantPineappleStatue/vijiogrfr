import { ScreenCaptureState } from '../features/screenCapture/screenCaptureSlice';
import { AIAssistantState } from '../features/aiAssistant/aiAssistantSlice';
import { SettingsState } from '../features/settings/settingsSlice';
import { DocumentationState } from '../features/documentation/documentationSlice';

export interface RootState {
  screenCapture: ScreenCaptureState;
  aiAssistant: AIAssistantState;
  settings: SettingsState;
  documentation: DocumentationState;
}
