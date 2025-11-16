const { app, BrowserWindow, ipcMain, Notification, Tray, nativeImage, Menu } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 850,
    height: 500,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Allow camera access
    },
    titleBarStyle: 'default',
    resizable: true,
    show: false,
    // Allow app to show notifications even when window is hidden
    skipTaskbar: false
  });
  
  // Prevent app from sleeping when window is hidden (for background monitoring)
  mainWindow.on('hide', () => {
    // Keep app active in background
    app.dock?.setBadge?.('');
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Move window off-screen instead of minimizing/hiding to keep camera active
  // This keeps the window "visible" to the browser so video doesn't pause
  function moveWindowOffScreen() {
    const { screen } = require('electron');
    const displays = screen.getAllDisplays();
    // Move to a position off-screen (negative coordinates)
    // This keeps window "visible" but out of view
    mainWindow.setPosition(-2000, -2000);
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    console.log('Window moved off-screen to keep camera active');
  }
  
  function restoreWindowPosition() {
    // Restore to center of primary display
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    mainWindow.setPosition(
      Math.floor((width - 850) / 2),
      Math.floor((height - 500) / 2)
    );
    mainWindow.setVisibleOnAllWorkspaces(false);
    console.log('Window position restored');
  }
  
  // On macOS, move window off-screen instead of closing when user clicks close button
  // This keeps the window "visible" so camera doesn't pause
  mainWindow.on('close', (event) => {
    if (process.platform === 'darwin') {
      event.preventDefault();
      // Move off-screen instead of hiding/minimizing
      moveWindowOffScreen();
    }
  });
  
  // Handle minimize event - move off-screen instead to keep camera running
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    // Move off-screen instead of minimizing
    moveWindowOffScreen();
  });
  
  // Keep window active even when not focused (for background monitoring)
  mainWindow.on('blur', () => {
    // Window lost focus but keep running
    // Camera and notifications will continue to work
  });
  
  // Prevent window from being hidden (which would pause camera)
  mainWindow.on('hide', (event) => {
    event.preventDefault();
    // Move off-screen instead of hiding
    moveWindowOffScreen();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// Create colored tray icon
function createTrayIcon(color) {
  try {
    // Create a simple colored circle icon
    // macOS menu bar icons work best at 22px (retina) or 16px (non-retina)
    // We'll use 22px for better visibility
    const iconSize = 22;
    const buffer = Buffer.alloc(iconSize * iconSize * 4); // RGBA
    
    // Determine icon color based on status - use brighter colors for better visibility
    let r, g, b;
    if (color === 'green' || color === 'good') {
      r = 34; g = 197; b = 94; // Bright green
    } else if (color === 'red' || color === 'bad' || color === 'warning') {
      r = 239; g = 68; b = 68; // Bright red
    } else {
      r = 156; g = 163; b = 175; // Gray (default/unknown)
    }
    
    // Draw a filled circle - make it more visible
    const centerX = iconSize / 2;
    const centerY = iconSize / 2;
    const radius = iconSize / 2 - 1; // Larger radius for better visibility
    
    for (let y = 0; y < iconSize; y++) {
      for (let x = 0; x < iconSize; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const index = (y * iconSize + x) * 4;
        if (distance <= radius) {
          buffer[index] = r;     // R
          buffer[index + 1] = g; // G
          buffer[index + 2] = b; // B
          buffer[index + 3] = 255; // A (fully opaque)
        } else {
          buffer[index] = 0;     // R
          buffer[index + 1] = 0; // G
          buffer[index + 2] = 0; // B
          buffer[index + 3] = 0; // A (transparent)
        }
      }
    }
    
    const image = nativeImage.createFromBuffer(buffer, { width: iconSize, height: iconSize });
    
    // On macOS, explicitly set NOT as template to keep colors visible
    if (process.platform === 'darwin') {
      image.setTemplateImage(false); // Keep colors visible (not monochrome template)
    }
    
    // Verify the image was created correctly
    if (image.isEmpty()) {
      console.error('Created tray icon is empty, trying fallback');
      // Try fallback: use the app icon
      const fallbackPath = path.join(__dirname, 'src', 'assets', 'icon.png');
      try {
        const fallback = nativeImage.createFromPath(fallbackPath);
        if (!fallback.isEmpty()) {
          console.log('Using fallback icon from file');
          return fallback;
        }
      } catch (err) {
        console.error('Failed to load fallback icon:', err);
      }
      return nativeImage.createEmpty();
    }
    
    console.log(`Tray icon created successfully (${color}, size: ${iconSize}x${iconSize})`);
    return image;
  } catch (error) {
    console.error('Error creating tray icon:', error);
    // Try fallback: use the app icon
    const fallbackPath = path.join(__dirname, 'src', 'assets', 'icon.png');
    try {
      return nativeImage.createFromPath(fallbackPath);
    } catch (err) {
      console.error('Failed to load fallback icon:', err);
      return nativeImage.createEmpty();
    }
  }
}

function createTray() {
  try {
    // Create initial tray icon (gray/default)
    const icon = createTrayIcon('gray');
    
    if (!icon || icon.isEmpty()) {
      console.error('Failed to create tray icon - icon is empty');
      return;
    }
    
    tray = new Tray(icon);
    console.log('Tray icon created successfully');
    
    // Set tooltip
    tray.setToolTip('PosturePilot - Posture Monitor');
    
    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show PosturePilot',
        click: () => {
          if (mainWindow) {
            const { screen } = require('electron');
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height } = primaryDisplay.workAreaSize;
            mainWindow.setPosition(
              Math.floor((width - 850) / 2),
              Math.floor((height - 500) / 2)
            );
            mainWindow.setVisibleOnAllWorkspaces(false);
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Hide to Background',
        click: () => {
          if (mainWindow) {
            // Move off-screen to keep camera active
            mainWindow.setPosition(-2000, -2000);
            mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
          }
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);
    
    tray.setContextMenu(contextMenu);
    
    // Click to toggle window visibility (move off-screen/restore)
    tray.on('click', () => {
      if (mainWindow) {
        const bounds = mainWindow.getBounds();
        // Check if window is off-screen (negative coordinates)
        if (bounds.x < -1000 || bounds.y < -1000) {
          // Restore window to visible position
          const { screen } = require('electron');
          const primaryDisplay = screen.getPrimaryDisplay();
          const { width, height } = primaryDisplay.workAreaSize;
          mainWindow.setPosition(
            Math.floor((width - 850) / 2),
            Math.floor((height - 500) / 2)
          );
          mainWindow.setVisibleOnAllWorkspaces(false);
          mainWindow.show();
          mainWindow.focus();
        } else {
          // Move window off-screen (keeps camera active)
          mainWindow.setPosition(-2000, -2000);
          mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
        }
      }
    });
    
    console.log('Tray setup complete');
  } catch (error) {
    console.error('Error creating tray:', error);
  }
}

app.whenReady().then(() => {
  createWindow();
  
  // Create tray immediately - essential for app functionality
  // Use a small delay to ensure app is fully initialized
  setTimeout(() => {
    try {
      createTray();
      console.log('Tray creation attempted');
    } catch (error) {
      console.error('Failed to create tray:', error);
    }
  }, 200);
  
  // Note: Electron's Notification API doesn't require explicit permission request
  // macOS will prompt automatically on first notification if needed
  // Notifications should work by default in Electron
});

app.on('window-all-closed', () => {
  // Don't quit on macOS - keep the app running in the menu bar
  // This allows notifications to work even when window is closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent app from sleeping when running in background (macOS)
if (process.platform === 'darwin') {
  // Keep app active for background monitoring
  app.dock?.setBadge?.('');
  
  // Ensure app can receive notifications when in background
  app.on('before-quit', (event) => {
    // Allow quit if explicitly requested
  });
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Data storage paths
const getDataPath = () => path.join(app.getPath('userData'), 'posture-data');
const getBaselinePath = () => path.join(getDataPath(), 'baseline.json');
const getLogsPath = () => path.join(getDataPath(), 'posture-logs.json');
const getAuthTokenPath = () => path.join(app.getPath('userData'), 'auth-token.json');

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
    if (!Notification.isSupported()) {
      console.log('Notifications not supported');
      return { success: false, error: 'Notifications not supported' };
    }
    
    // Electron's Notification API works differently than browser API
    // Just create and show - macOS will handle permissions automatically
    const notification = new Notification({
      title: title || 'PosturePilot',
      body: body || 'Posture alert!',
      icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
      silent: false
    });
    
    // Show notification
    notification.show();
    console.log('Notification shown:', title, body);
    
    // Handle click to bring app to front
    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to show notification:', error);
    return { success: false, error: error.message };
  }
});

// IPC handler to update tray icon based on posture status
ipcMain.handle('update-tray-icon', async (event, status) => {
  try {
    if (tray) {
      console.log('Updating tray icon with status:', status);
      // Map status to icon color
      let iconColor = 'gray'; // default
      if (status === 'good') {
        iconColor = 'green';
      } else if (status === 'bad' || status === 'warning') {
        iconColor = 'red';
      }
      
      const icon = createTrayIcon(iconColor);
      if (icon.isEmpty()) {
        console.error('Created icon is empty, cannot update tray');
        return { success: false, error: 'Icon is empty' };
      }
      
      tray.setImage(icon);
      console.log('Tray icon updated to:', iconColor);
      
      // Update tooltip with status
      const statusText = status === 'good' ? 'Good Posture' : 
                        status === 'bad' ? 'Bad Posture' : 
                        status === 'warning' ? 'Warning' : 'Unknown';
      tray.setToolTip(`PosturePilot - ${statusText}`);
      
      return { success: true };
    }
    console.error('Tray not initialized, cannot update icon');
    return { success: false, error: 'Tray not initialized' };
  } catch (error) {
    console.error('Failed to update tray icon:', error);
    return { success: false, error: error.message };
  }
});

// IPC handlers for authentication token storage
ipcMain.handle('set-auth-token', async (event, token) => {
  try {
    const tokenData = { token, timestamp: Date.now() };
    await fs.writeFile(getAuthTokenPath(), JSON.stringify(tokenData, null, 2));
    console.log('Auth token saved successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to save auth token:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-auth-token', async () => {
  try {
    const data = await fs.readFile(getAuthTokenPath(), 'utf8');
    const tokenData = JSON.parse(data);
    return tokenData.token;
  } catch (error) {
    console.log('No auth token found or error reading:', error.message);
    return null;
  }
});

ipcMain.handle('remove-auth-token', async () => {
  try {
    await fs.unlink(getAuthTokenPath());
    console.log('Auth token removed successfully');
    return { success: true };
  } catch (error) {
    // File might not exist, which is fine
    if (error.code !== 'ENOENT') {
      console.error('Failed to remove auth token:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }
});