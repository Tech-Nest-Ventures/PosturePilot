const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveBaselineData: (data) => ipcRenderer.invoke('save-baseline-data', data),
  getBaselineData: () => ipcRenderer.invoke('get-baseline-data'),
  savePostureLog: (data) => ipcRenderer.invoke('save-posture-log', data),
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  updateTrayIcon: (status) => ipcRenderer.invoke('update-tray-icon', status),
  // Authentication API
  setAuthToken: (token) => ipcRenderer.invoke('set-auth-token', token),
  getAuthToken: () => ipcRenderer.invoke('get-auth-token'),
  removeAuthToken: () => ipcRenderer.invoke('remove-auth-token'),
  // System events
  onSystemResume: (callback) => {
    ipcRenderer.on('system-resume', callback);
    // Return cleanup function
    return () => ipcRenderer.removeAllListeners('system-resume');
  },
  // Quit app events
  onAppQuitRequested: (callback) => {
    ipcRenderer.on('app-quit-requested', callback);
    // Return cleanup function
    return () => ipcRenderer.removeAllListeners('app-quit-requested');
  },
  // Build info for MAS detection - Electron automatically sets process.mas in MAS builds
  isMas: typeof process !== 'undefined' ? !!process.mas : false
});