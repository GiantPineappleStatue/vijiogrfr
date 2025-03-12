#!/usr/bin/env ts-node
/**
 * Documentation Embedding Script
 *
 * This script crawls documentation for Blender and After Effects,
 * generates embeddings using OpenAI's API, and saves them to a file
 * that can be loaded by the application.
 *
 * Usage:
 *   ts-node scripts/embed-documentation.ts --api-key=YOUR_OPENAI_API_KEY --output=./path/to/output/dir
 *
 * Or with environment variables:
 *   OPENAI_API_KEY=your_key ts-node scripts/embed-documentation.ts --output=./path/to/output/dir
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import { program } from 'commander';
import { JSDOM } from 'jsdom';

// Define interfaces
interface DocumentationItem {
  id: string;
  title: string;
  content: string;
  source: 'blender' | 'afterEffects';
  path: string;
  embedding?: number[];
}

// Parse command line arguments
program
  .option('--api-key <key>', 'OpenAI API Key')
  .option('--output <path>', 'Output directory for embeddings', './embeddings')
  .option('--blender-only', 'Only process Blender documentation')
  .option('--ae-only', 'Only process After Effects documentation')
  .option('--limit <number>', 'Limit the number of pages to process per source', '100')
  .parse(process.argv);

const options = program.opts();

// Get settings from command line arguments or environment variables
const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
const blenderOnly = options.blenderOnly || process.env.BLENDER_ONLY === 'true';
const aeOnly = options.aeOnly || process.env.AE_ONLY === 'true';
const limit = parseInt(options.limit || process.env.EMBED_PAGE_LIMIT || '100', 10);

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

// Store documentation items
const documentationItems: DocumentationItem[] = [];

// Generate embedding for a text
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Preprocess text to make it more suitable for embeddings
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with a single space
    .replace(/(\r\n|\n|\r)/gm, ' ') // Replace newlines with spaces
    .trim();
}

// Process Blender documentation
async function processBlenderDocs() {
  console.log('Processing Blender documentation...');

  // Starting URLs for Blender documentation
  const blenderBaseUrl = 'https://docs.blender.org/manual/en/latest/';
  const startingUrls = [
    `${blenderBaseUrl}modeling/index.html`,
    `${blenderBaseUrl}animation/index.html`,
    `${blenderBaseUrl}render/index.html`,
    `${blenderBaseUrl}physics/index.html`,
    `${blenderBaseUrl}video_editing/index.html`,
  ];

  console.log(`Starting Blender documentation crawling with URLs:`, startingUrls);

  const visitedUrls = new Set<string>();
  const pagesToVisit = [...startingUrls];
  let processedCount = 0;
  let errorCount = 0;
  const maxErrors = 5;

  while (pagesToVisit.length > 0 && processedCount < limit && errorCount < maxErrors) {
    const url = pagesToVisit.shift();
    if (!url || visitedUrls.has(url)) continue;

    visitedUrls.add(url);
    processedCount++;

    try {
      console.log(`Processing ${processedCount}/${limit}: ${url}`);
      const response = await axios.get<string>(url);
      const $ = cheerio.load(response.data);

      // Extract content
      const title = $('h1').first().text().trim();
      let content = '';

      // Get main content
      $('.section').each((_: number, element: cheerio.Element) => {
        content += $(element).text() + ' ';
      });

      content = preprocessText(content);
      console.log(`Content length for ${title}: ${content.length} characters`);

      if (content.length > 100) {  // Only process pages with enough content
        // Generate embedding
        console.log(`Generating embedding for "${title}"`);
        const embedding = await generateEmbedding(content);

        // Create documentation item
        documentationItems.push({
          id: uuidv4(),
          title,
          content,
          source: 'blender',
          path: url.replace(blenderBaseUrl, ''),
          embedding,
        });
      }

      // Find new links to visit
      $('a').each((_: number, element: cheerio.Element) => {
        const href = $(element).attr('href');
        if (href && href.startsWith('.') && href.endsWith('.html')) {
          const newUrl = new URL(href, url).href;
          if (!visitedUrls.has(newUrl) && !pagesToVisit.includes(newUrl)) {
            pagesToVisit.push(newUrl);
          }
        }
      });

      // Sleep to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      errorCount++;

      if (errorCount >= maxErrors) {
        console.error(`Exceeded maximum number of errors (${maxErrors}). Stopping Blender processing.`);
      }
    }
  }

  console.log(`Processed ${processedCount} Blender documentation pages with ${errorCount} errors`);
}

// Process After Effects documentation
async function processAfterEffectsDocs() {
  console.log('Processing After Effects documentation...');

  // Starting URLs for After Effects documentation - updated with current URLs
  const aeBaseUrl = 'https://helpx.adobe.com/after-effects/using/';
  const startingUrls = [
    `${aeBaseUrl}effect-list.html`,
    `${aeBaseUrl}create-compositions.html`,
    `${aeBaseUrl}animation-basics.html`,
    `${aeBaseUrl}layer-properties.html`,
    `${aeBaseUrl}creating-layers.html`,
  ];

  // Add console logs to help with debugging
  console.log(`Starting After Effects documentation crawling with URLs:`, startingUrls);

  const visitedUrls = new Set<string>();
  const pagesToVisit = [...startingUrls];
  let processedCount = 0;

  // Add some error recovery - continue even if some pages fail
  let errorCount = 0;
  const maxErrors = 5;

  while (pagesToVisit.length > 0 && processedCount < limit && errorCount < maxErrors) {
    const url = pagesToVisit.shift();
    if (!url || visitedUrls.has(url)) continue;

    visitedUrls.add(url);
    processedCount++;

    try {
      console.log(`Processing ${processedCount}/${limit}: ${url}`);
      const response = await axios.get<string>(url);

      console.log(`Successfully fetched ${url}, status: ${response.status}`);

      // Use JSDOM for more complex HTML parsing
      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      // Extract content
      const title = document.querySelector('h1')?.textContent?.trim() || 'Untitled';

      // Try multiple selectors for content
      let mainContent = document.querySelector('.page-content') ||
                       document.querySelector('article') ||
                       document.querySelector('main');

      if (!mainContent) {
        console.log(`No main content found for ${url}, trying body`);
        mainContent = document.querySelector('body');
      }

      if (!mainContent) {
        console.log(`Warning: No content found for ${url}`);
        continue;
      }

      // Get text content from main content area
      let content = mainContent.textContent || '';
      content = preprocessText(content);

      console.log(`Content length for ${title}: ${content.length} characters`);

      if (content.length > 100) {  // Only process pages with enough content
        // Generate embedding
        console.log(`Generating embedding for "${title}"`);
        const embedding = await generateEmbedding(content);

        // Create documentation item
        documentationItems.push({
          id: uuidv4(),
          title,
          content,
          source: 'afterEffects',
          path: url.replace(aeBaseUrl, ''),
          embedding,
        });
      }

      // Find new links to visit
      const links = document.querySelectorAll('a');
      for (const link of Array.from(links)) {
        const href = link.getAttribute('href');
        if (href && href.includes('/after-effects/using/') && href.endsWith('.html')) {
          try {
            const newUrl = new URL(href, url).href;
            if (!visitedUrls.has(newUrl) && !pagesToVisit.includes(newUrl)) {
              pagesToVisit.push(newUrl);
            }
          } catch (e) {
            // Skip invalid URLs
          }
        }
      }

      // Sleep to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      errorCount++;

      if (errorCount >= maxErrors) {
        console.error(`Exceeded maximum number of errors (${maxErrors}). Stopping After Effects processing.`);
      }
    }
  }

  console.log(`Processed ${processedCount} After Effects documentation pages with ${errorCount} errors`);
}

// Main function
async function main() {
  try {
    // Process documentation based on options
    if (!aeOnly) {
      await processBlenderDocs();
    }

    if (!blenderOnly) {
      await processAfterEffectsDocs();
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
