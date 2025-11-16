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
  removeAuthToken: () => ipcRenderer.invoke('remove-auth-token')
});