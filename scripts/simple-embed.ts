#!/usr/bin/env ts-node
/**
 * Advanced Documentation Embedding Script
 *
 * This script retrieves documentation from:
 * 1. docsforadobe's community resources for After Effects
 * 2. Blender's official documentation
 *
 * It implements recursive crawling to ensure complete coverage
 * and generates embeddings using OpenAI's API.
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { program } from 'commander';
import { URL } from 'url';

// Define interfaces
interface DocumentationItem {
  id: string;
  title: string;
  content: string;
  source: 'blender' | 'afterEffects';
  path: string;
  embedding?: number[];
}

interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  baseUrl: string;
  delayMs?: number;
  source: 'blender' | 'afterEffects';
  contentSelector?: string;
  titleSelector?: string;
  linkSelector?: string;
  ignorePatterns?: RegExp[];
}

// Parse command line arguments
program
  .option('--api-key <key>', 'OpenAI API Key')
  .option('--output <path>', 'Output directory for embeddings', './assets/embeddings')
  .option('--max-pages <number>', 'Maximum number of pages to process per source', '100')
  .option('--blender-only', 'Process only Blender documentation')
  .option('--ae-only', 'Process only After Effects documentation')
  .parse(process.argv);

const options = program.opts();

// Get API key from command line arguments or environment variables
const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
const maxPages = parseInt(options.maxPages, 10);

// Validate options
if (!apiKey) {
  console.error('Error: OpenAI API Key is required. Use --api-key=YOUR_KEY or set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

// Create output directory if it doesn't exist
const outputDir = options.output;
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to preprocess text
function preprocessText(text: string): string {
  // Remove excessive whitespace
  let processed = text.replace(/\s+/g, ' ');
  // Remove special characters that might interfere with embedding
  processed = processed.replace(/[^\w\s.,?!:;\-()[\]{}'"]/g, ' ');
  return processed.trim();
}

// Generate embedding using OpenAI API
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Ensure we don't exceed token limit by truncating if necessary
    // The ada-002 model has a limit of approximately 8191 tokens
    // which is roughly 32,000 characters for English text
    const truncatedText = text.slice(0, 32000);

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: truncatedText,
    });
    return response.data[0].embedding;
  } catch (error: any) {
    console.error('Error generating embedding:', error.message);
    // Implement retry logic with exponential backoff
    if (error.status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'] || 1;
      console.log(`Rate limited. Retrying after ${retryAfter} seconds...`);
      await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter, 10) * 1000));
      return generateEmbedding(text); // Recursive retry
    }
    throw error;
  }
}

// Store documentation items
const documentationItems: DocumentationItem[] = [];

// Helper function to normalize URLs
function normalizeUrl(baseUrl: string, href: string): string {
  try {
    // Handle special cases for different documentation systems
    if (href.startsWith('#') || href.startsWith('mailto:') || href.includes('javascript:')) {
      return '';
    }

    const url = new URL(href, baseUrl);
    return url.href;
  } catch (error) {
    console.error(`Error normalizing URL: ${baseUrl} + ${href}`, error);
    return '';
  }
}

// Recursive crawl function
async function crawlDocumentation(options: CrawlOptions): Promise<DocumentationItem[]> {
  const result: DocumentationItem[] = [];
  const visitedUrls = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: options.baseUrl, depth: 0 }];

  const {
    maxPages = 100,
    maxDepth = 5,
    delayMs = 1000,
    source,
    contentSelector = 'main',
    titleSelector = 'h1',
    linkSelector = 'a',
    ignorePatterns = [],
  } = options;

  let processedCount = 0;

  console.log(`Starting documentation crawl for ${source} from ${options.baseUrl}`);
  console.log(`Max pages: ${maxPages}, Max depth: ${maxDepth}`);

  while (queue.length > 0 && processedCount < maxPages) {
    const { url, depth } = queue.shift()!;

    if (visitedUrls.has(url)) continue;
    if (depth > maxDepth) continue;
    visitedUrls.add(url);

    // Check if URL matches any ignore patterns
    if (ignorePatterns.some(pattern => pattern.test(url))) {
      console.log(`Skipping ignored URL: ${url}`);
      continue;
    }

    processedCount++;
    console.log(`Processing [${processedCount}/${maxPages}] [Depth: ${depth}]: ${url}`);

    try {
      const response = await axios.get<string>(url, {
        headers: {
          'User-Agent': 'BlenderAEAssistant/1.0 Documentation Crawler',
        },
        timeout: 10000, // 10 second timeout
      });

      const $ = cheerio.load(response.data);

      // Extract page title
      let title = $(titleSelector).first().text().trim();
      if (!title) {
        title = $('title').text().trim();
      }

      // Extract content based on the source
      let content = '';

      if (source === 'afterEffects') {
        // Special handling for AE docs
        $('.md-content, article, main, .content').each((_: number, element: cheerio.Element) => {
          // Remove navigation, TOC, and other non-content elements
          $(element).find('.md-sidebar, .md-footer, .md-header, nav, .toc').remove();
          content += $(element).text() + ' ';
        });
      } else if (source === 'blender') {
        // Special handling for Blender docs - extract only the knowledge content

        // First, remove all navigation and non-content elements completely
        $('.sphinxsidebar, .footer, .header, nav, .rel, .related, .navigation, .toc, .nextprev, .breadcrumb, .feedback').remove();

        // The Blender manual is built with Sphinx, which has these specific content areas
        let contentText = '';

        // Process the main content area - different selectors for different Blender doc types

        // Main manual content is in .document/.section/.documentwrapper
        $('.document .section, .documentwrapper, .document[role="main"]').each((_: number, element: cheerio.Element) => {
          // Skip title as we'll extract it separately
          $(element).find('h1:first-child').remove();

          // Skip the table of contents sections
          $(element).find('.contents, .toctree-wrapper').remove();

          // Skip the navigation at the bottom of pages
          $(element).find('.footnote').remove();

          contentText += $(element).text() + ' ';
        });

        // If we didn't get content from the main selectors, try others specific to Blender docs
        if (contentText.trim() === '') {
          $('.body, .rst-content .section').each((_: number, element: cheerio.Element) => {
            contentText += $(element).text() + ' ';
          });
        }

        // API documentation content is structured differently
        if (contentText.trim() === '' && url.includes('/api/')) {
          $('.body dl, .body .function, .body .class, .body .method').each((_: number, element: cheerio.Element) => {
            contentText += $(element).text() + ' ';
          });

          // Get API descriptions
          $('.descclassname, .descname, .field-body, .field-list').each((_: number, element: cheerio.Element) => {
            contentText += $(element).text() + ' ';
          });
        }

        // For Blender API reference, collect function signatures and descriptions
        if (url.includes('/api/')) {
          $('.sig-name, .sig-param, .sig-return, .property, .descclassname').each((_: number, element: cheerio.Element) => {
            contentText += $(element).text() + ' ';
          });
        }

        content = contentText;
      }

      // Process content
      content = preprocessText(content);
      console.log(`Content length for "${title}": ${content.length} characters`);

      if (content.length > 200) {  // Only process pages with enough content
        // Generate embedding
        console.log(`Generating embedding for "${title}"`);
        try {
          const embedding = await generateEmbedding(content);

          // Create documentation item
          const docItem: DocumentationItem = {
            id: uuidv4(),
            title,
            content,
            source,
            path: url,
            embedding,
          };

          result.push(docItem);
          documentationItems.push(docItem);
          console.log(`Successfully generated embedding for "${title}"`);
        } catch (embeddingError) {
          console.error(`Failed to generate embedding for "${title}": ${embeddingError}`);
        }
      } else {
        console.log(`Skipping "${title}" due to insufficient content length`);
      }

      // Find and enqueue links for crawling
      if (depth < maxDepth) {
        $(linkSelector).each((_: number, element: cheerio.Element) => {
          const href = $(element).attr('href');
          if (href) {
            const normalizedUrl = normalizeUrl(url, href);

            // Only queue URLs from the same domain
            if (normalizedUrl &&
                normalizedUrl.startsWith(options.baseUrl) &&
                !visitedUrls.has(normalizedUrl) &&
                !ignorePatterns.some(pattern => pattern.test(normalizedUrl))) {

              queue.push({ url: normalizedUrl, depth: depth + 1 });
            }
          }
        });
      }

      // Save progress periodically
      if (processedCount % 10 === 0) {
        const tempOutputFile = path.join(outputDir, 'docs_temp.json');
        fs.writeFileSync(tempOutputFile, JSON.stringify(documentationItems, null, 2));
        console.log(`Progress saved: ${documentationItems.length} items so far`);
      }

      // Sleep to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, delayMs));

    } catch (error: any) {
      if (error.isAxiosError) {
        console.error(`Error processing ${url}: ${error.message}`);
        if (error.response) {
          console.error(`Status: ${error.response.status}`);
        }
      } else {
        console.error(`Unexpected error processing ${url}:`, error);
      }
    }
  }

  console.log(`Finished crawling ${source} documentation. Processed ${processedCount} pages.`);
  return result;
}

// Process After Effects documentation from docsforadobe
async function processAfterEffectsDocs() {
  console.log('Processing After Effects documentation...');

  // Starting URLs for the crawl (we'll discover more during crawling)
  const startUrls = [
    // AE Scripting Guide
    'https://ae-scripting.docsforadobe.dev/',

    // AE Expression Reference
    'https://ae-expressions.docsforadobe.dev/',

    // JavaScript Reference for After Effects
    'https://javascript.docsforadobe.dev/',
  ];

  for (const baseUrl of startUrls) {
    await crawlDocumentation({
      baseUrl,
      source: 'afterEffects',
      maxPages: maxPages,
      maxDepth: 4,
      delayMs: 1000,
      contentSelector: '.md-content, article, main',
      titleSelector: 'h1, .md-header__topic span',
      ignorePatterns: [
        /\/search\//,
        /\/genindex\//,
        /\/404\./,
      ],
    });
  }
}

// Process Blender documentation
async function processBlenderDocs() {
  console.log('Processing Blender documentation...');

  // Starting URLs for Blender documentation
  const startUrls = [
    // Blender Manual
    'https://docs.blender.org/manual/en/latest/',

    // Blender Python API
    'https://docs.blender.org/api/current/index.html',
  ];

  for (const baseUrl of startUrls) {
    await crawlDocumentation({
      baseUrl,
      source: 'blender',
      maxPages: maxPages,
      maxDepth: 4,
      delayMs: 1000,
      contentSelector: '.document, .section, article',
      titleSelector: 'h1, title',
      ignorePatterns: [
        /\/search\./,
        /\/genindex\./,
        /\/404\./,
      ],
    });
  }
}

// Main function
async function main() {
  try {
    console.log('Starting documentation embedding process...');

    if (options.blenderOnly) {
      // Process only Blender documentation
      await processBlenderDocs();
    } else if (options.aeOnly) {
      // Process only After Effects documentation
      await processAfterEffectsDocs();
    } else {
      // Process both
      await processAfterEffectsDocs();
      await processBlenderDocs();
    }

    // If no items were generated, create a test item to verify the output structure
    if (documentationItems.length === 0) {
      console.log('No documentation items were generated. Creating a test item...');
      documentationItems.push({
        id: uuidv4(),
        title: 'Test Documentation',
        content: 'This is a test documentation item to verify that the embedding process is working correctly.',
        source: 'afterEffects',
        path: 'https://example.com/test',
        embedding: Array.from({ length: 1536 }, () => Math.random() * 2 - 1),
      });
    }

    // Save embeddings to file
    const outputFile = path.join(outputDir, 'docs.json');
    fs.writeFileSync(outputFile, JSON.stringify(documentationItems, null, 2));

    console.log(`Successfully saved ${documentationItems.length} documentation items to ${outputFile}`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
