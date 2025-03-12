# Blender & After Effects AI Assistant

An AI-powered desktop assistant for Blender and After Effects that provides instant answers to your questions about either software.

## Features

- Instant responses to questions about Blender and After Effects
- Answers based on embedded documentation for accurate information
- Support for including screenshots in your queries
- Streaming responses with live typing indicators
- Modern UI with dark mode support

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blender-ae-assistant.git
cd blender-ae-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Documentation Embeddings

The application requires documentation embeddings to provide accurate answers. These embeddings are generated during the build process and packaged with the application.

### Setting Up for Development

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit the `.env` file to add your OpenAI API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Generate embeddings:
```bash
# On macOS/Linux
./scripts/generate-embeddings.sh

# On Windows
scripts\generate-embeddings.bat
```

### Customizing Embeddings

You can customize the embedding process by setting the following environment variables in your `.env` file:

- `EMBED_PAGE_LIMIT`: Limit the number of pages to process per source (default: 100)
- `BLENDER_ONLY=true`: Process only Blender documentation
- `AE_ONLY=true`: Process only After Effects documentation

### Building the Application

When you build the application, embeddings will be automatically generated and packaged with the app:

```bash
npm run build
```

To package the application for distribution:

```bash
npm run package
```

## Development

### Project Structure

- `src/main` - Electron main process code
- `src/renderer` - React frontend code
- `src/renderer/components/AIAssistant` - AI Assistant component
- `scripts` - Utility scripts including documentation embedding

### Key Components

- `AIAssistantView.tsx` - The main AI Assistant UI component
- `aiAssistantSlice.ts` - Redux state management for the AI Assistant
- `aiAssistant.ts` - IPC handlers for AI communication
- `embed-documentation.ts` - Script for generating documentation embeddings

## License

MIT
