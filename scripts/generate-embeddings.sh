#!/bin/bash
# Script to generate embeddings using API key from .env file

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Check if OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
  echo "Error: OPENAI_API_KEY is not set. Please set it in your .env file or environment."
  exit 1
fi

# Define paths
ASSETS_DIR="./assets/embeddings"
USER_DATA_DIR="$HOME/.blenderae-assistant"
EMBEDDINGS_FILE="docs.json"
ASSETS_EMBEDDINGS_PATH="$ASSETS_DIR/$EMBEDDINGS_FILE"
USER_DATA_EMBEDDINGS_PATH="$USER_DATA_DIR/$EMBEDDINGS_FILE"

# Create directories if they don't exist
mkdir -p "$ASSETS_DIR"
mkdir -p "$USER_DATA_DIR"

# Check if embeddings already exist in either location
if [ -f "$ASSETS_EMBEDDINGS_PATH" ] || [ -f "$USER_DATA_EMBEDDINGS_PATH" ]; then
  echo "Embeddings already exist. Skipping embedding generation."

  # If embeddings exist in assets but not in user data, copy them
  if [ -f "$ASSETS_EMBEDDINGS_PATH" ] && [ ! -f "$USER_DATA_EMBEDDINGS_PATH" ]; then
    echo "Copying embeddings from assets to user data directory..."
    cp "$ASSETS_EMBEDDINGS_PATH" "$USER_DATA_EMBEDDINGS_PATH"
  fi

  exit 0
fi

echo "Generating documentation embeddings..."

# Run the embedding script
npx ts-node scripts/embed-documentation.ts --api-key "$OPENAI_API_KEY" --output "$ASSETS_EMBEDDINGS_PATH"

# Check if embedding was successful
if [ $? -eq 0 ] && [ -f "$ASSETS_EMBEDDINGS_PATH" ]; then
  echo "Embeddings generated successfully at $ASSETS_EMBEDDINGS_PATH"

  # Copy to user data directory
  echo "Copying embeddings to user data directory..."
  cp "$ASSETS_EMBEDDINGS_PATH" "$USER_DATA_EMBEDDINGS_PATH"

  echo "Embedding process completed."
else
  echo "Error: Failed to generate embeddings."
  exit 1
fi
