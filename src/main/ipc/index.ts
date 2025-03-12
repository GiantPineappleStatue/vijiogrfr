import { registerScreenCaptureHandlers } from './screenCapture';
import { registerAIAssistantHandlers } from './aiAssistant';
import { registerDocumentationHandlers } from './documentation';
import { registerSettingsHandlers } from './settings';

export function registerIpcHandlers(): void {
  registerScreenCaptureHandlers();
  registerAIAssistantHandlers();
  registerDocumentationHandlers();
  registerSettingsHandlers();
}
