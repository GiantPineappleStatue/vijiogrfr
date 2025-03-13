const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Ensure OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY not found in environment variables or .env file');
  process.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Search function using embeddings
async function searchDocumentation(query, documentationItems, limit = 3) {
  // Generate embedding for query
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });
  const queryEmbedding = response.data[0].embedding;

  // Calculate similarity scores
  const results = documentationItems
    .filter(item => item.embedding && item.embedding.length > 0)
    .map(item => ({
      item,
      score: cosineSimilarity(queryEmbedding, item.embedding)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}

async function main() {
  try {
    // Load embeddings file
    const embeddingsPath = path.join(__dirname, '..', 'assets', 'embeddings', 'docs.json');
    const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));

    console.log(`Loaded ${embeddings.length} embeddings`);
    console.log(`Blender items: ${embeddings.filter(item => item.source === 'blender').length}`);
    console.log(`After Effects items: ${embeddings.filter(item => item.source === 'afterEffects').length}`);

    // Test queries
    const queries = [
      'How do I rig a character in Blender?',
      'What are Bendy Bones in Blender?',
      'How to animate an armature in Blender?',
      'Using IK constraints in Blender',
      'Creating splines in Blender'
    ];

    for (const query of queries) {
      console.log(`\n\nTESTING QUERY: "${query}"`);

      // Search for similar items
      const results = await searchDocumentation(query, embeddings, 3);

      // Display results
      console.log('Top 3 results:');
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.item.title} (${result.item.source}) - Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`   Path: ${result.item.path}`);
        // Show a snippet of content
        const contentSnippet = result.item.content.length > 300
          ? `${result.item.content.substring(0, 300)}...`
          : result.item.content;
        console.log(`   Content snippet: ${contentSnippet}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
