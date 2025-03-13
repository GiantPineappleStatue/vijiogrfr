import { ipcMain, IpcMainInvokeEvent } from 'electron';
import OpenAI from 'openai';
import { searchDocumentation } from './documentation';

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

// Create system message with context and documentation
async function createSystemMessage(context: any, query: string, apiKey: string) {
  // First, try to find relevant documentation
  let documentationContext = '';
  try {
    // Search for relevant documentation (limit to top 3 results)
    const docResults = await searchDocumentation(query, apiKey, 3);

    if (docResults && docResults.length > 0) {
      // Format documentation references
      documentationContext = `\nRelevant documentation:\n`;

      docResults.forEach((result: { item: { title: string; source: string; content: string } }, index: number) => {
        documentationContext += `\n[Doc ${index + 1}] ${result.item.title} (${result.item.source}):\n${result.item.content.substring(0, 800)}${result.item.content.length > 800 ? '...' : ''}\n`;
      });
    }
  } catch (error) {
    console.error('Error retrieving documentation for AI context:', error);
    // Continue without documentation if there's an error
  }

  // Prepare system message with context and documentation
  return {
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
${documentationContext}

Provide helpful, concise responses about how to use either software based on the user's question and the documentation provided. Feel free to compare and contrast the software when appropriate.

If the documentation above is relevant to the question, incorporate that information in your response, but make it conversational and helpful rather than just repeating text.`,
  };
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

        // Get the latest user query
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        const userQuery = lastUserMessage ? lastUserMessage.content : '';

        // Create system message with context and documentation
        const systemMessage = await createSystemMessage(context, userQuery, apiKey);

        // Prepare messages array with system message first
        const messagesWithContext = [
          systemMessage,
          ...messages,
        ];

        // If screenshot is provided, we would use vision model
        if (screenshotData) {
          // For GPT-4 Vision (note: streaming not fully supported with images yet in some clients)
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
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
            model: 'gpt-4-turbo'
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

        // Get the latest user query
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
        const userQuery = lastUserMessage ? lastUserMessage.content : '';

        // Create system message with context and documentation
        const systemMessage = await createSystemMessage(context, userQuery, apiKey);

        // Prepare messages array with system message first
        const messagesWithContext = [
          systemMessage,
          ...messages,
        ];

        // If screenshot is provided, we would use vision model
        if (screenshotData) {
          // For GPT-4 Vision
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
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
