/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { registerIpcHandlers } from './ipc';
import fs from 'fs';
import { settingsStore } from './ipc/settings';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch((err: Error) => {
      console.log('Error installing extensions:', err);
      // Continue anyway
      return null;
    });
};

const createWindow = async () => {
  // Comment out extension installation to avoid CRX errors
  // if (isDebug) {
  //   await installExtensions();
  // }

  // Register IPC handlers
  registerIpcHandlers();

  // Check for and setup embeddings
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  // Check if the embeddings exist in the user data directory
  const userDataEmbeddingsPath = path.join(app.getPath('userData'), 'embeddings', 'docs.json');
  // Check if our alternative embeddings exist in the assets directory
  const assetsEmbeddingsPath = path.join(RESOURCES_PATH, 'embeddings', 'docs.json');

  // Check for existing embeddings and set the path in settings
  if (fs.existsSync(userDataEmbeddingsPath)) {
    console.log('Using embeddings from user data directory');
    // Use the user data directory embeddings
    // @ts-ignore - Ignore type issues with electron-store
    settingsStore.set('embeddingsPath', path.join(app.getPath('userData'), 'embeddings'));
  } else if (fs.existsSync(assetsEmbeddingsPath)) {
    console.log('Using embeddings from assets directory');
    // Use the assets directory embeddings
    // @ts-ignore - Ignore type issues with electron-store
    settingsStore.set('embeddingsPath', path.join(RESOURCES_PATH, 'embeddings'));
  } else {
    console.log('No embeddings found. Using default embeddings path.');
    // Use the default embeddings path (user data directory)
    // @ts-ignore - Ignore type issues with electron-store
    settingsStore.set('embeddingsPath', path.join(app.getPath('userData'), 'embeddings'));
    // Create the directory if it doesn't exist
    if (!fs.existsSync(path.join(app.getPath('userData'), 'embeddings'))) {
      fs.mkdirSync(path.join(app.getPath('userData'), 'embeddings'), { recursive: true });
    }
  }

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
