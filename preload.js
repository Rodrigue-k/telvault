const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('telvault', {
  win: {
    minimize: () => invoke('win:minimize'),
    maximize: () => invoke('win:maximize'),
    close: () => invoke('win:close'),
    isMaximized: () => invoke('win:isMaximized'),
  },
  auth: {
    status: () => invoke('auth:status'),
    startQrLogin: () => invoke('auth:startQrLogin'),
    getQrLoginStatus: () => invoke('auth:getQrLoginStatus'),
    cancelQrLogin: () => invoke('auth:cancelQrLogin'),
    submitQrPassword: (payload) => invoke('auth:submitQrPassword', payload),
    sendCode: (payload) => invoke('auth:sendCode', payload),
    signIn: (payload) => invoke('auth:signIn', payload),
    logout: () => invoke('auth:logout'),
  },
  files: {
    selectFolder: () => invoke('files:selectFolder'),
    diff: (projectId) => invoke('files:diff', projectId),
  },
  projects: {
    list: () => invoke('projects:list'),
    get: (id) => invoke('projects:get', id),
    create: (payload) => invoke('projects:create', payload),
    watchStatuses: () => invoke('projects:watchStatuses'),
    watchStatus: (projectId) => invoke('projects:watchStatus', projectId),
    onWatchStatusChanged: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on('projects:watchStatusChanged', listener);
      return () => ipcRenderer.removeListener('projects:watchStatusChanged', listener);
    },
  },
  versions: {
    list: (projectId) => ipcRenderer.invoke('versions:list', projectId),
    commit: (payload) => ipcRenderer.invoke('versions:commit', payload),
    download: (payload) => ipcRenderer.invoke('versions:download', payload),
    onUploadProgress: (callback) => {
      const handler = (_event, payload) => callback(payload);
      ipcRenderer.on('versions:uploadProgress', handler);
      return () => ipcRenderer.removeListener('versions:uploadProgress', handler);
    },
  },
  sync: {
    onStatus: (callback) => {
      const handler = (_event, payload) => callback(payload);
      ipcRenderer.on('sync:status', handler);
      return () => ipcRenderer.removeListener('sync:status', handler);
    }
  }
});
