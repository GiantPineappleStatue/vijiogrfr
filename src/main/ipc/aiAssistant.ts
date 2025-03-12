import { ipcMain, IpcMainInvokeEvent } from 'electron';
import OpenAI from 'openai';

// Store OpenAI client instances by API key
const openAIClients = new Map<string, OpenAI>();

// Get or create an OpenAI client for a given API key
function getOpenAIClient(apiKey: string): OpenAI {
  if (!openAIClients.has(apiKey)) {
    openAIClients.set(
      apiKey,
      new OpenAI({
        apiKey,
      })
    );
  }
  return openAIClients.get(apiKey)!;
}

export function registerAIAssistantHandlers(): void {
  // Query the AI assistant
  ipcMain.handle(
    'query-ai',
    async (
      _event: IpcMainInvokeEvent,
      {
        apiKey,
        messages,
        context,
        screenshotData,
      }: {
        apiKey: string;
        messages: Array<{
          role: 'user' | 'assistant' | 'system';
          content: string;
        }>;
        context: {
          activeTool: string | null;
          activePanel: string | null;
          selectedObjects: string[];
          timelineState: string | null;
          viewportMode: string | null;
        };
        screenshotData?: string;
      }
    ) => {
      try {
        if (!apiKey) {
          throw new Error('OpenAI API key is required');
        }

        const openai = getOpenAIClient(apiKey);

        // Prepare system message with context
        const systemMessage = {
          role: 'system' as const,
          content: `You are an AI assistant for ${
            context.activeTool?.includes('Blender') ? 'Blender' : 'After Effects'
          }.

Current context:
${context.activeTool ? `- Active tool: ${context.activeTool}` : ''}
${context.activePanel ? `- Active panel: ${context.activePanel}` : ''}
${
  context.selectedObjects.length > 0
    ? `- Selected objects: ${context.selectedObjects.join(', ')}`
    : ''
}
${context.timelineState ? `- Timeline state: ${context.timelineState}` : ''}
${context.viewportMode ? `- Viewport mode: ${context.viewportMode}` : ''}

Provide helpful, concise responses about how to use the software based on what the user is currently doing.`,
        };

        // Prepare messages array with system message first
        const messagesWithContext = [
          systemMessage,
          ...messages,
        ];

        // If screenshot is provided, we would use vision model
        if (screenshotData) {
          // For GPT-4 Vision
          const response = await openai.chat.completions.create({
            model: 'gpt-4-vision-preview',
            messages: [
              ...messagesWithContext,
              {
                role: 'user',
                content: [
                  { type: 'text', text: messages[messages.length - 1].content },
                  {
                    type: 'image_url',
                    image_url: {
                      url: screenshotData,
                    },
                  },
                ],
              },
            ],
            max_tokens: 1000,
          });

          return {
            content: response.choices[0].message.content,
            model: response.model,
          };
        } else {
          // For text-only queries
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: messagesWithContext,
            max_tokens: 1000,
          });

          return {
            content: response.choices[0].message.content,
            model: response.model,
          };
        }
      } catch (error) {
        console.error('Error querying AI:', error);
        throw error;
      }
    }
  );
}
