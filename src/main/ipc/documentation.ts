import { ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';

// Store documentation data
interface DocumentationItem {
  id: string;
  title: string;
  content: string;
  source: 'blender' | 'afterEffects';
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
async function loadDocumentation(embeddingsPath: string): Promise<void> {
  try {
    // Check if embeddings file exists
    if (!fs.existsSync(embeddingsPath)) {
      throw new Error(`Embeddings file not found at ${embeddingsPath}`);
    }

    // Load documentation items with embeddings
    const docsPath = path.join(embeddingsPath, 'docs.json');
    if (fs.existsSync(docsPath)) {
      const docsData = fs.readFileSync(docsPath, 'utf-8');
      documentationItems = JSON.parse(docsData);
    }

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
async function searchDocumentation(
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
    async (_event: IpcMainInvokeEvent, embeddingsPath: string) => {
      try {
        await loadDocumentation(embeddingsPath);
        return { success: true, count: documentationItems.length };
      } catch (error) {
        console.error('Error loading documentation:', error);
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
        const results = await searchDocumentation(query, apiKey, limit);
        return results;
      } catch (error) {
        console.error('Error searching documentation:', error);
        throw error;
      }
    }
  );
}
