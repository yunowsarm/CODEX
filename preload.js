const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  chooseSaveDirectory: () => ipcRenderer.invoke('choose-save-directory'),
  saveMergedFile: (dir, filename, buffer) =>
    ipcRenderer.invoke('save-merged-file', dir, filename, buffer),
  openFolder: (dir) => ipcRenderer.invoke('open-folder', dir),
});
