#!/bin/bash

# Script to process local Blender documentation and generate embeddings
# This focuses only on essential knowledge about using Blender

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
MAX_PAGES=5000  # Increased limit to ensure we get the entire manual
CHUNK_SIZE=8000  # Maximum characters per documentation chunk
DOCS_DIR="./scripts/blender_manual_v430_en.html"
SKIP_AFTER_EFFECTS=true  # Default to skipping After Effects for now

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --max-pages=*)
      MAX_PAGES="${1#*=}"
      shift
      ;;
    --chunk-size=*)
      CHUNK_SIZE="${1#*=}"
      shift
      ;;
    --docs-dir=*)
      DOCS_DIR="${1#*=}"
      shift
      ;;
    --include-after-effects)
      SKIP_AFTER_EFFECTS=false
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Run the embedding script
echo "Generating focused Blender documentation embeddings..."
echo "Using local documentation in: $DOCS_DIR"
echo "Max pages: $MAX_PAGES, Chunk size: $CHUNK_SIZE characters"
echo "Skip After Effects embeddings: $SKIP_AFTER_EFFECTS"

# Make the script executable
chmod +x scripts/embed-local-blender-docs.ts

# Build the command with appropriate flags
CMD="npx ts-node scripts/embed-local-blender-docs.ts --docs-dir=\"$DOCS_DIR\" --max-pages=\"$MAX_PAGES\" --chunk-size=\"$CHUNK_SIZE\" --output=\"./assets/embeddings\""

# Add skip-after-effects flag if true
if [ "$SKIP_AFTER_EFFECTS" = true ]; then
  CMD="$CMD --skip-after-effects"
fi

# Run the command
eval $CMD

# Check if the script succeeded
if [ $? -eq 0 ]; then
  echo "Blender documentation embeddings generated successfully in ./assets/embeddings"

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
    BLENDER_COUNT=$(jq '.[] | select(.source == "blender") | .id' ./assets/embeddings/docs.json | wc -l)
    AE_COUNT=$(jq '.[] | select(.source == "afterEffects") | .id' ./assets/embeddings/docs.json | wc -l)
    TOTAL_COUNT=$(jq '.[].id' ./assets/embeddings/docs.json | wc -l)
    echo "-------------------------------------"
    echo "Embedding Statistics:"
    printf "After Effects Documentation: %8d items\n" "$AE_COUNT"
    printf "Blender Documentation: %8d items\n" "$BLENDER_COUNT"
    printf "Total: %d items\n" "$TOTAL_COUNT"
    echo "-------------------------------------"

    # Verify counts match
    if [ "$TOTAL_COUNT" -ne "$(($BLENDER_COUNT + $AE_COUNT))" ]; then
      echo "Warning: Total count ($TOTAL_COUNT) doesn't match sum of Blender ($BLENDER_COUNT) and After Effects ($AE_COUNT) counts."
      echo "This could indicate items with incorrect source values or a calculation error."
    fi
  else
    echo "Warning: Embeddings file exists but may be empty or invalid."
  fi
else
  echo "Error generating Blender documentation embeddings. Check your API key and try again."
  exit 1
fi
