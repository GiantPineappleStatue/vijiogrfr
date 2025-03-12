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
  // Query the AI assistant (streaming version)
  ipcMain.handle(
    'query-ai-stream',
    async (
      event: IpcMainInvokeEvent,
      {
        apiKey,
        messages,
        context,
        messageId,
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
        messageId: string;
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
          content: `You are an AI assistant for both Blender and After Effects. You can answer questions about either software or both together.

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

Provide helpful, concise responses about how to use either software based on the user's question. Feel free to compare and contrast the software when appropriate.`,
        };

        // Prepare messages array with system message first
        const messagesWithContext = [
          systemMessage,
          ...messages,
        ];

        // If screenshot is provided, we would use vision model
        if (screenshotData) {
          // For GPT-4 Vision (note: streaming not fully supported with images yet in some clients)
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
            stream: true,
          });

          // Process the streaming response
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Send chunk to renderer process
              event.sender.send('ai-response-chunk', { id: messageId, content });
            }
          }

          // Send completion event
          event.sender.send('ai-response-complete', {
            id: messageId,
            model: 'gpt-4-vision-preview'
          });

          return { success: true };
        } else {
          // For text-only queries with streaming
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: messagesWithContext,
            max_tokens: 1000,
            stream: true,
          });

          // Process the streaming response
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Send chunk to renderer process
              event.sender.send('ai-response-chunk', { id: messageId, content });
            }
          }

          // Send completion event
          event.sender.send('ai-response-complete', {
            id: messageId,
            model: 'gpt-4-turbo'
          });

          return { success: true };
        }
      } catch (error) {
        console.error('Error querying AI stream:', error);
        // Send error to renderer
        event.sender.send('ai-response-error',
          error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
      }
    }
  );

  // Keep the old non-streaming method for backward compatibility
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
          content: `You are an AI assistant for both Blender and After Effects. You can answer questions about either software or both together.

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

Provide helpful, concise responses about how to use either software based on the user's question. Feel free to compare and contrast the software when appropriate.`,
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
