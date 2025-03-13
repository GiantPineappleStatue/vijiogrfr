#!/bin/bash

# Script to test the simple embedding script using API key from .env file

# Check if .env file exists
if [ -f .env ]; then
  # Read the .env file
  while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^#.*$ ]] && continue
    [[ -z "$line" ]] && continue

    # Export all variables from .env
    export "$line"
  done < .env

  echo "Environment variables loaded from .env file"
else
  echo "Warning: .env file not found. Make sure OPENAI_API_KEY is set in your environment."
fi

# Create assets/embeddings directory if it doesn't exist
mkdir -p ./assets/embeddings

# Run the embedding script
echo "Generating documentation embeddings using simplified script..."
npx ts-node scripts/simple-embed.ts --output=./assets/embeddings

# Check if the script succeeded
if [ $? -eq 0 ]; then
  echo "Documentation embeddings generated successfully in ./assets/embeddings"
else
  echo "Error generating documentation embeddings. Check your API key and try again."
  exit 1
fi
