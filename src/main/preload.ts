import { contextBridge, ipcRenderer } from 'electron';

// 定义渲染进程可以调用的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 压缩图片
  compressImage: (filePath: string) => {
    return ipcRenderer.invoke('compress-image', filePath);
  },
  
  // API密钥相关
  saveApiKey: (apiKey: string) => {
    return ipcRenderer.invoke('save-api-key', apiKey);
  },
  getApiKey: () => {
    return ipcRenderer.invoke('get-api-key');
  },
  
  // 设置相关
  updateSettings: (settings: { createNew: boolean }) => {
    return ipcRenderer.invoke('update-settings', settings);
  },
  getSettings: () => {
    return ipcRenderer.invoke('get-settings');
  },
  
  // 文件对话框
  openFileDialog: () => {
    return ipcRenderer.invoke('open-file-dialog');
  }
}); 