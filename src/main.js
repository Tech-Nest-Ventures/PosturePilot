const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Allow camera access
    },
    titleBarStyle: 'default',
    resizable: true,
    show: false
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Data storage paths
const getDataPath = () => path.join(app.getPath('userData'), 'posture-data');
const getBaselinePath = () => path.join(getDataPath(), 'baseline.json');
const getLogsPath = () => path.join(getDataPath(), 'posture-logs.json');

// Ensure data directory exists
const ensureDataDirectory = async () => {
  try {
    await fs.mkdir(getDataPath(), { recursive: true });
  } catch (error) {
    console.error('Failed to create data directory:', error);
  }
};

// IPC handlers for posture monitoring
ipcMain.handle('save-baseline-data', async (event, data) => {
  try {
    await ensureDataDirectory();
    await fs.writeFile(getBaselinePath(), JSON.stringify(data, null, 2));
    console.log('Baseline data saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to save baseline data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-baseline-data', async () => {
  try {
    const data = await fs.readFile(getBaselinePath(), 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No baseline data found or error reading:', error.message);
    return null;
  }
});

ipcMain.handle('save-posture-log', async (event, data) => {
  try {
    await ensureDataDirectory();
    let logs = [];
    
    // Try to read existing logs
    try {
      const existingData = await fs.readFile(getLogsPath(), 'utf8');
      logs = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist, start with empty array
      logs = [];
    }
    
    // Add new log entry
    logs.push(data);
    
    // Keep only last 1000 entries to prevent file from growing too large
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    await fs.writeFile(getLogsPath(), JSON.stringify(logs, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Failed to save posture log:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-notification', async (event, { title, body, type }) => {
  try {
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: title || 'PosturePilot',
        body: body || 'Posture alert!',
        icon: path.join(__dirname, 'icon.png') // Optional: add an icon
      });
      
      notification.show();
      return { success: true };
    } else {
      console.log('Notifications not supported');
      return { success: false, error: 'Notifications not supported' };
    }
  } catch (error) {
    console.error('Failed to show notification:', error);
    return { success: false, error: error.message };
  }
});