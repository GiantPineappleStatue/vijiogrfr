const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load embeddings file
const embeddingsPath = path.join(__dirname, '..', 'assets', 'embeddings', 'docs.json');
const embeddings = JSON.parse(fs.readFileSync(embeddingsPath, 'utf8'));

console.log(`Loaded ${embeddings.length} embeddings`);
console.log(`Blender items: ${embeddings.filter(item => item.source === 'blender').length}`);
console.log(`After Effects items: ${embeddings.filter(item => item.source === 'afterEffects').length}`);

// Pick a few Blender items to display content snippets
const blenderItems = embeddings.filter(item => item.source === 'blender');
const sampleItems = blenderItems.slice(0, 5);

console.log('\nSample Blender Documentation Items:');
sampleItems.forEach((item, index) => {
  console.log(`\n${index + 1}. ${item.title}`);
  console.log(`   Path: ${item.path}`);
  console.log(`   Content snippet (first 200 chars): ${item.content.substring(0, 200)}...`);
});

// Check if embeddings exist and are valid
const hasValidEmbeddings = embeddings.every(item =>
  item.embedding &&
  Array.isArray(item.embedding) &&
  item.embedding.length > 0 &&
  typeof item.embedding[0] === 'number'
);

console.log(`\nAll items have valid embeddings: ${hasValidEmbeddings}`);

// Print a random embedding vector sample to verify structure
const randomItem = embeddings[Math.floor(Math.random() * embeddings.length)];
if (randomItem.embedding) {
  console.log(`\nSample embedding vector (first 10 values of ${randomItem.embedding.length} total):`);
  console.log(randomItem.embedding.slice(0, 10));
}
