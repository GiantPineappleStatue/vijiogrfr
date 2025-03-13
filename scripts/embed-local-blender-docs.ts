#!/usr/bin/env ts-node
/**
 * Blender Local Documentation Embedding Script
 *
 * This script processes the local Blender HTML documentation and extracts
 * only essential knowledge about how to use Blender, filtering out legal content,
 * installation guides, and other non-essential information.
 *
 * Uses Mozilla's Readability library for optimal content extraction.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { program } from 'commander';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

// Define interfaces
interface DocumentationItem {
  id: string;
  title: string;
  content: string;
  source: string; // Changed from 'blender' to string type to allow 'afterEffects' too
  path: string;
  embedding?: number[];
}

// Define which directories contain essential usage information
const ESSENTIAL_DIRECTORIES = [
  'animation',
  'compositing',
  'editors',
  'grease_pencil',
  'interface',
  'modeling',
  'movie_clip',
  'physics',
  'render',
  'scene_layout',
  'sculpt_paint',
  'video_editing',
  'addons',       // Include addon docs
  'files',        // Include file handling docs
  'advanced'      // Include advanced features
];

// Terms that indicate sections to skip
const SKIP_TERMS = [
  'license', 'copyright', 'install', 'download',
  'trademark', 'legal', 'credits'
];

// Parse command line arguments
program
  .option('--api-key <key>', 'OpenAI API Key')
  .option('--docs-dir <path>', 'Path to local Blender documentation', './scripts/blender_manual_v430_en.html')
  .option('--output <path>', 'Output directory for embeddings', './assets/embeddings')
  .option('--max-pages <number>', 'Maximum number of pages to process', '1000')
  .option('--chunk-size <number>', 'Maximum characters per chunk', '8000')
  .option('--debug', 'Enable debug mode to save extracted content to files')
  .option('--skip-after-effects', 'Temporarily skip After Effects embeddings when merging')
  .parse(process.argv);

const options = program.opts();

// Get API key from command line arguments or environment variables
const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
const docsDir = options.docsDir;
const maxPages = parseInt(options.maxPages, 10);
const chunkSize = parseInt(options.chunkSize, 10);
const debugMode = options.debug || false;

// Create output directory if it doesn't exist
const outputDir = options.output;
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create debug directory if in debug mode
const debugDir = path.join(outputDir, 'debug');
if (debugMode && !fs.existsSync(debugDir)) {
  fs.mkdirSync(debugDir, { recursive: true });
}

// Validate options
if (!apiKey) {
  console.error('Error: OpenAI API Key is required. Use --api-key=YOUR_KEY or set OPENAI_API_KEY environment variable');
  process.exit(1);
}

if (!fs.existsSync(docsDir)) {
  console.error(`Error: Documentation directory not found at ${docsDir}`);
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

// Store documentation items
const documentationItems: DocumentationItem[] = [];

// Helper function to preprocess text
function preprocessText(text: string): string {
  if (!text) return '';

  // Remove excessive whitespace (multiple spaces, tabs)
  let processed = text.replace(/\s+/g, ' ');

  // Preserve sentence breaks with newlines
  processed = processed.replace(/\.\s+/g, '.\n');

  // Clean up any strange characters but keep useful punctuation
  processed = processed.replace(/[^\w\s.,?!:;\-()[\]{}'"]/g, ' ');

  // Remove duplicate newlines
  processed = processed.replace(/\n{3,}/g, '\n\n');

  return processed.trim();
}

// Generate embedding using OpenAI API
async function generateEmbedding(text: string, maxRetries = 5): Promise<number[]> {
  let retries = 0;

  while (retries <= maxRetries) {
    try {
      // Ensure we don't exceed token limit
      const truncatedText = text.slice(0, 32000);

      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: truncatedText,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      retries++;
      console.error(`Error generating embedding (attempt ${retries}/${maxRetries + 1}):`, error.message);

      // Handle rate limits with exponential backoff
      if (error.status === 429 || (error.message && error.message.includes('rate limit'))) {
        const retryAfter = error.response?.headers?.['retry-after'] || Math.pow(2, retries);
        console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      // Handle server errors with backoff
      if (error.status >= 500 && error.status < 600) {
        const backoff = Math.pow(2, retries);
        console.log(`Server error. Retrying after ${backoff} seconds...`);
        await new Promise(resolve => setTimeout(resolve, backoff * 1000));
        continue;
      }

      // If we've exhausted retries or it's a non-retriable error, throw
      if (retries > maxRetries) {
        throw error;
      }

      // Other errors, wait briefly and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Failed to generate embedding after ${maxRetries + 1} attempts`);
}

// Check if a path or title should be skipped
function shouldSkipContent(filePath: string, title: string): boolean {
  // Skip content based on directory or terms in title or path
  const lowerPath = filePath.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Skip obvious non-content files
  if (lowerPath.includes('/genindex.html') ||
      lowerPath.includes('/search.html') ||
      lowerPath.includes('/404.html')) {
    return true;
  }

  // Skip by keywords that would indicate legal/non-essential content
  if (SKIP_TERMS.some(term => lowerTitle.includes(term) ||
                      lowerPath.includes(`/${term}/`) ||
                      lowerPath.includes(`/${term}.html`))) {
    return true;
  }

  // Include index.html files (they contain summary information)
  if (lowerPath.endsWith('index.html')) {
    return false;
  }

  // Include content from essential directories
  return !ESSENTIAL_DIRECTORIES.some(dir => lowerPath.includes(`/${dir}/`));
}

// Split content into reasonable chunks
function splitContentIntoChunks(content: string, title: string, path: string): DocumentationItem[] {
  const chunks: DocumentationItem[] = [];

  if (!content || content.length <= chunkSize) {
    // If content is small enough or empty, keep it as one item
    chunks.push({
      id: uuidv4(),
      title,
      content: content || `No extractable content found for ${title}`,
      source: 'blender',
      path,
    });
  } else {
    // Split content into chunks of approximately chunkSize characters
    // Try to split at paragraph boundaries where possible
    let remainingContent = content;
    let chunkIndex = 0;

    while (remainingContent.length > 0) {
      const chunkEnd = Math.min(chunkSize, remainingContent.length);

      // Find paragraph break near chunkSize if possible
      let breakPoint = remainingContent.lastIndexOf('\n\n', chunkEnd);
      if (breakPoint < chunkSize / 2) {
        // If no good paragraph break, try sentence break
        breakPoint = remainingContent.lastIndexOf('. ', chunkEnd);
        if (breakPoint < chunkSize / 2) {
          // If no good sentence break, just use chunkSize
          breakPoint = chunkEnd;
        } else {
          // Include the period and space in the current chunk
          breakPoint += 2;
        }
      }

      const chunkContent = remainingContent.substring(0, breakPoint);
      remainingContent = remainingContent.substring(breakPoint);

      chunks.push({
        id: uuidv4(),
        title: `${title} (Part ${chunkIndex + 1})`,
        content: chunkContent,
        source: 'blender',
        path,
      });

      chunkIndex++;
    }
  }

  return chunks;
}

// Extract content from an HTML file using Readability
function extractContentFromHtml(filePath: string): { title: string; content: string } | null {
  try {
    // Read the HTML file
    const html = fs.readFileSync(filePath, 'utf8');

    // Create a DOM from the HTML
    const dom = new JSDOM(html, { url: `file://${filePath}` });

    // Use Readability to extract the main content
    const reader = new Readability(dom.window.document, {
      // Options to control article extraction
      charThreshold: 20, // Be more lenient about what's considered content
      classesToPreserve: ['section', 'document'], // Keep these classes in the output
    });

    // Extract the article
    const article = reader.parse();

    if (!article) {
      console.log(`Readability couldn't extract content from ${filePath}`);
      return null;
    }

    // Get the title and clean it up
    let title = article.title || '';

    // Remove " — Blender Manual" and similar suffixes from the title
    title = title.replace(/\s*[-–—]\s*Blender.*Manual.*$/i, '').trim();

    // If title is empty, use the filename
    if (!title) {
      title = path.basename(filePath, '.html').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    // Skip if title contains terms indicating non-essential content
    if (shouldSkipContent(filePath, title)) {
      return null;
    }

    // Get the extracted content and clean it up
    let content = article.content || '';

    // Clean up HTML tags
    // First, format headers properly
    content = content
      .replace(/<h1>(.*?)<\/h1>/gi, '\n# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '\n## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '\n### $1\n\n')
      .replace(/<h4>(.*?)<\/h4>/gi, '\n#### $1\n\n')
      .replace(/<h5>(.*?)<\/h5>/gi, '\n##### $1\n\n')
      .replace(/<h6>(.*?)<\/h6>/gi, '\n###### $1\n\n');

    // Format lists
    content = content
      .replace(/<li>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<ul>|<\/ul>|<ol>|<\/ol>/gi, '\n')
      .replace(/<dt>(.*?)<\/dt>\s*<dd>(.*?)<\/dd>/gi, '$1: $2\n\n');

    // Format paragraphs
    content = content
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n');

    // Remove remaining HTML tags
    content = content
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');

    // Clean up content
    content = preprocessText(content);

    // Debug: save extracted content to file
    if (debugMode) {
      const debugFilePath = path.join(debugDir, path.basename(filePath) + '.txt');
      fs.writeFileSync(debugFilePath, `TITLE: ${title}\n\nCONTENT:\n${content}`);
    }

    // Check minimum content length
    if (content.length < 100) {
      console.log(`Skipping ${filePath} - Content too short (${content.length} chars)`);
      return null;
    }

    return { title, content };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return null;
  }
}

// Recursively scan directory for HTML files
async function scanDirectory(dirPath: string, processedCount = 0): Promise<number> {
  if (processedCount >= maxPages) {
    return processedCount;
  }

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    if (processedCount >= maxPages) {
      break;
    }

    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      // Skip directories starting with underscore (usually system files)
      if (!item.startsWith('_')) {
        processedCount = await scanDirectory(itemPath, processedCount);
      }
    } else if (stats.isFile() && item.endsWith('.html') && !item.match(/genindex|search|404/)) {
      console.log(`Processing [${processedCount + 1}/${maxPages}]: ${itemPath}`);

      const extractedContent = extractContentFromHtml(itemPath);
      if (extractedContent) {
        const { title, content } = extractedContent;
        console.log(`Extracted content from "${title}" (${content.length} chars)`);

        // Split content into chunks if necessary
        const chunks = splitContentIntoChunks(content, title, itemPath);
        console.log(`Split into ${chunks.length} chunks`);

        for (const chunk of chunks) {
          try {
            console.log(`Generating embedding for "${chunk.title}"`);
            const embedding = await generateEmbedding(chunk.content);
            chunk.embedding = embedding;
            documentationItems.push(chunk);
            console.log(`Successfully generated embedding for "${chunk.title}"`);

            // Save progress periodically
            if (documentationItems.length % 10 === 0) {
              const tempOutputFile = path.join(outputDir, 'blender_docs_temp.json');
              fs.writeFileSync(tempOutputFile, JSON.stringify(documentationItems, null, 2));
              console.log(`Progress saved: ${documentationItems.length} items so far`);
            }
          } catch (error) {
            console.error(`Failed to generate embedding for "${chunk.title}":`, error);
          }

          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } else {
        console.log(`No content extracted from ${itemPath}`);
      }

      processedCount++;
    }
  }

  return processedCount;
}

// Main function
async function main() {
  try {
    console.log(`Starting processing of local Blender documentation from ${docsDir}`);
    console.log(`Maximum pages: ${maxPages}, Chunk size: ${chunkSize} characters`);
    console.log(`Debug mode: ${debugMode ? 'enabled' : 'disabled'}`);
    console.log(`After Effects embeddings: ${options.skipAfterEffects ? 'disabled' : 'enabled'}`);

    const processedCount = await scanDirectory(docsDir);

    console.log(`Processed ${processedCount} HTML files`);
    console.log(`Generated ${documentationItems.length} documentation items`);

    // Determine if we need to merge with existing embedding file
    let existingItems: DocumentationItem[] = [];
    const outputFile = path.join(outputDir, 'docs.json');

    if (fs.existsSync(outputFile)) {
      console.log('Found existing embeddings file, merging with new items...');
      const existingData = fs.readFileSync(outputFile, 'utf8');
      existingItems = JSON.parse(existingData);

      // Filter based on the skip flag
      if (options.skipAfterEffects) {
        console.log('Skipping After Effects embeddings as requested');
        existingItems = existingItems.filter(item => item.source !== 'afterEffects');
      } else {
        // Filter out existing Blender items to replace them
        existingItems = existingItems.filter(item => item.source !== 'blender');
      }
    }

    // Combine existing items with new Blender items
    const finalItems = [...existingItems, ...documentationItems];

    // Save to final output file
    fs.writeFileSync(outputFile, JSON.stringify(finalItems, null, 2));

    console.log(`Successfully saved ${finalItems.length} documentation items (${documentationItems.length} Blender + ${existingItems.length} others) to ${outputFile}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
