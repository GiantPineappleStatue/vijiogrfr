#!/bin/bash

# Advanced script to generate comprehensive documentation embeddings for both After Effects and Blender
# This script sources API keys from .env and provides configuration options

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

# Define parameters
MAX_PAGES=50  # Limit pages per source to control costs
ADDITIONAL_ARGS=""

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --blender-only)
      ADDITIONAL_ARGS="$ADDITIONAL_ARGS --blender-only"
      shift
      ;;
    --ae-only)
      ADDITIONAL_ARGS="$ADDITIONAL_ARGS --ae-only"
      shift
      ;;
    --max-pages=*)
      MAX_PAGES="${1#*=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Run the embedding script
echo "Generating comprehensive documentation embeddings..."
echo "Max pages per source: $MAX_PAGES"
echo "Additional arguments: $ADDITIONAL_ARGS"

npx ts-node scripts/simple-embed.ts --output=./assets/embeddings --max-pages=$MAX_PAGES $ADDITIONAL_ARGS

# Check if the script succeeded
if [ $? -eq 0 ]; then
  echo "Documentation embeddings generated successfully in ./assets/embeddings"

  # Check if the file exists and has content
  if [ -s "./assets/embeddings/docs.json" ]; then
    echo "Embeddings file has been created with content."
    echo "File size: $(wc -c < ./assets/embeddings/docs.json) bytes"

    # Also copy the embeddings to the user data directory for Electron to find
    USERDATA_DIR=""

    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      USERDATA_DIR="$HOME/Library/Application Support/BlenderAEAssistant/embeddings"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
      # Windows
      USERDATA_DIR="$APPDATA/BlenderAEAssistant/embeddings"
    else
      # Linux
      USERDATA_DIR="$HOME/.config/BlenderAEAssistant/embeddings"
    fi

    if [ ! -z "$USERDATA_DIR" ]; then
      mkdir -p "$USERDATA_DIR"
      echo "Copying embeddings to user data directory: $USERDATA_DIR"
      cp ./assets/embeddings/docs.json "$USERDATA_DIR/"
      echo "Embeddings copied successfully."
    else
      echo "Could not determine user data directory for your platform."
    fi

    # Count the number of items by source
    echo "Running stats on generated embeddings..."
    BLENDER_COUNT=$(grep -o '"source":"blender"' ./assets/embeddings/docs.json | wc -l)
    AE_COUNT=$(grep -o '"source":"afterEffects"' ./assets/embeddings/docs.json | wc -l)

    echo "-------------------------------------"
    echo "Embedding Statistics:"
    echo "After Effects Documentation: $AE_COUNT items"
    echo "Blender Documentation: $BLENDER_COUNT items"
    echo "Total: $((BLENDER_COUNT + AE_COUNT)) items"
    echo "-------------------------------------"
  else
    echo "Warning: Embeddings file exists but may be empty or invalid."
  fi
else
  echo "Error generating documentation embeddings. Check your API key and try again."
  exit 1
fi
