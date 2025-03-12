import { ipcMain, desktopCapturer, IpcMainInvokeEvent } from 'electron';
import { createWorker } from 'tesseract.js';

// Initialize Tesseract worker
let ocrWorker: any = null;

async function initOcrWorker(language = 'eng'): Promise<any> {
  if (ocrWorker) {
    return ocrWorker;
  }

  ocrWorker = await createWorker(language);
  return ocrWorker;
}

export function registerScreenCaptureHandlers(): void {
  // Get available screen capture sources
  ipcMain.handle('get-sources', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 150, height: 150 },
        fetchWindowIcons: true,
      });

      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
      }));
    } catch (error) {
      console.error('Error getting screen sources:', error);
      throw error;
    }
  });

  // Perform OCR on an image
  ipcMain.handle(
    'perform-ocr',
    async (_event: IpcMainInvokeEvent, imageData: string, language = 'eng') => {
      try {
        const worker = await initOcrWorker(language);
        const result = await worker.recognize(imageData);
        return {
          text: result.data.text,
          confidence: result.data.confidence,
          // Return words if available, otherwise empty array
          words: result.data.words || [],
        };
      } catch (error) {
        console.error('Error performing OCR:', error);
        throw error;
      }
    }
  );

  // Analyze image for UI elements (placeholder for more advanced analysis)
  ipcMain.handle(
    'analyze-image',
    async (_event: IpcMainInvokeEvent, imageData: string) => {
      try {
        // This is a placeholder for more advanced image analysis
        // In a real implementation, this would use computer vision to detect UI elements

        // For now, return a mock result
        return {
          detectedTools: ['Select', 'Move', 'Rotate'],
          activePanels: ['Properties', 'Timeline'],
          selectedObjects: ['Cube.001'],
          properties: {
            location: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
          },
        };
      } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
      }
    }
  );
}
