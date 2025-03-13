import { ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import { settingsStore } from '../ipc/settings';

// Store documentation data
interface DocumentationItem {
  id: string;
  title: string;
  content: string;
  source: string;
  path: string;
  embedding?: number[];
}

let documentationItems: DocumentationItem[] = [];
let openAIClient: OpenAI | null = null;

// Initialize OpenAI client
function initOpenAI(apiKey: string): OpenAI {
  if (!openAIClient && apiKey) {
    openAIClient = new OpenAI({
      apiKey,
    });
  }
  return openAIClient!;
}

// Load documentation from disk
async function loadDocumentation(embeddingsPath?: string): Promise<void> {
  try {
    // Get embeddings path from settings if not provided
    // @ts-ignore - Ignore type issues with electron-store
    const storeData = settingsStore.store as Record<string, any>;
    const actualPath = embeddingsPath || storeData.embeddingsPath;

    if (!actualPath) {
      throw new Error('Embeddings path not configured in settings');
    }

    console.log(`Loading documentation from: ${actualPath}`);

    // Check if embeddings file exists
    const docsPath = path.join(actualPath, 'docs.json');
    if (!fs.existsSync(docsPath)) {
      throw new Error(`Embeddings file not found at ${docsPath}`);
    }

    // Load documentation items with embeddings
    const docsData = fs.readFileSync(docsPath, 'utf-8');
    documentationItems = JSON.parse(docsData);
    console.log(`Loaded ${documentationItems.length} documentation items`);

    return;
  } catch (error) {
    console.error('Error loading documentation:', error);
    throw error;
  }
}

// Generate embeddings for a query
async function generateEmbedding(
  query: string,
  apiKey: string
): Promise<number[]> {
  try {
    const openai = initOpenAI(apiKey);
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search documentation using vector similarity
export async function searchDocumentation(
  query: string,
  apiKey: string,
  limit = 5
): Promise<Array<{ item: DocumentationItem; score: number }>> {
  try {
    if (documentationItems.length === 0) {
      throw new Error('Documentation not loaded');
    }

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query, apiKey);

    // Calculate similarity scores
    const results = documentationItems
      .filter(item => item.embedding && item.embedding.length > 0)
      .map(item => ({
        item,
        score: cosineSimilarity(queryEmbedding, item.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('Error searching documentation:', error);
    throw error;
  }
}

export function registerDocumentationHandlers(): void {
  // Load documentation
  ipcMain.handle(
    'load-documentation',
    async (_event: IpcMainInvokeEvent, providedPath?: string) => {
      try {
        await loadDocumentation(providedPath);
        return { success: true, count: documentationItems.length };
      } catch (error) {
        console.error('Error loading documentation:', error);
        throw error;
      }
    }
  );

  // Get all documents
  ipcMain.handle(
    'get-all-documents',
    async (_event: IpcMainInvokeEvent) => {
      try {
        if (documentationItems.length === 0) {
          // Try to load documentation if not already loaded
          try {
            await loadDocumentation();
          } catch (loadError) {
            console.error('Failed to load documentation on demand:', loadError);
            throw new Error('Documentation not loaded and auto-load failed');
          }
        }
        return documentationItems;
      } catch (error) {
        console.error('Error getting all documents:', error);
        throw error;
      }
    }
  );

  // Search documentation
  ipcMain.handle(
    'search-documentation',
    async (
      _event: IpcMainInvokeEvent,
      { query, apiKey, limit = 5 }: { query: string; apiKey: string; limit?: number }
    ) => {
      try {
        if (documentationItems.length === 0) {
          // Try to load documentation if not already loaded
          try {
            await loadDocumentation();
          } catch (loadError) {
            console.error('Failed to load documentation on demand:', loadError);
            throw new Error('Documentation not loaded and auto-load failed');
          }
        }

        const results = await searchDocumentation(query, apiKey, limit);
        return results;
      } catch (error) {
        console.error('Error searching documentation:', error);
        throw error;
      }
    }
  );
}
