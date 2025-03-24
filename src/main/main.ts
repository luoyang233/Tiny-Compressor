import { app, BrowserWindow, ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import tinify from 'tinify';
import * as os from 'os';

// 定义存储的类型
interface StoreSchema {
  apiKey: string;
  createNew: boolean;
}

// 创建存储实例，用于保存用户的API密钥和设置
const store = new Store<StoreSchema>({
  defaults: {
    apiKey: '',
    createNew: true
  }
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    // 自定义窗口样式
    titleBarStyle: 'hidden',
    frame: false,
    backgroundColor: '#f8f9fa',
    show: false
  });

  // 加载应用的index.html
  const indexPath = path.join(__dirname, '../renderer/index.html');
  mainWindow.loadFile(indexPath);

  // 记录加载的路径，用于调试
  console.log('Loading index.html from:', indexPath);

  // 打开开发者工具
  if (process.argv.includes('--dev')) {
    // mainWindow.webContents.openDevTools();
  }

  // 在窗口准备好后再显示，避免白屏
  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 应用准备就绪后创建窗口
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，通常会重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 当所有窗口关闭时退出，除了在macOS上
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC事件处理
// 压缩图片
ipcMain.handle('compress-image', async (event: IpcMainInvokeEvent, filePath: string) => {
  try {
    const apiKey = store.get('apiKey');
    
    if (!apiKey) {
      return { success: false, error: 'API密钥未设置' };
    }
    
    tinify.key = apiKey;
    
    // 验证API密钥
    try {
      await tinify.validate();
    } catch (error) {
      return { success: false, error: 'API密钥无效' };
    }
    
    const createNew = store.get('createNew');
    const source = tinify.fromFile(filePath);
    
    // 获取文件信息
    const extname = path.extname(filePath);
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath, extname);
    
    let outputPath: string;
    let tempOutputPath: string;
    
    if (createNew) {
      // 创建新文件路径
      outputPath = path.join(dirname, `${basename}-compressed${extname}`);
      tempOutputPath = outputPath; // 如果创建新文件，无需临时文件
    } else {
      // 使用临时目录创建临时输出文件
      const tempDir = os.tmpdir();
      tempOutputPath = path.join(tempDir, `${basename}-temp-${Date.now()}${extname}`);
      outputPath = filePath; // 最终输出路径仍是原路径
    }
    
    // 压缩并保存图片到临时文件
    await source.toFile(tempOutputPath);
    
    // 获取压缩前后的文件大小
    const originalSize = fs.statSync(filePath).size;
    let compressedSize: number;
    
    // 如果是替换模式，先删除原文件，再写入新文件
    if (!createNew) {
      try {
        // 检查原文件是否存在
        if (fs.existsSync(outputPath)) {
          // 尝试删除原文件
          fs.unlinkSync(outputPath);
        }
        
        // 复制临时文件到原位置
        fs.copyFileSync(tempOutputPath, outputPath);
        
        // 删除临时文件
        fs.unlinkSync(tempOutputPath);
      } catch (copyError: any) {
        return { 
          success: false, 
          error: `无法替换原文件，可能是权限问题: ${copyError.message}。请尝试使用"生成新文件"选项或选择其他文件夹。` 
        };
      }
    }
    
    try {
      compressedSize = fs.statSync(outputPath).size;
    } catch (error) {
      // 如果无法获取压缩后文件大小（极少数情况），使用临时文件大小
      compressedSize = fs.statSync(tempOutputPath).size;
    }
    
    const compressionRate = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    
    return { 
      success: true, 
      originalPath: filePath,
      outputPath: outputPath,
      originalSize,
      compressedSize,
      compressionRate
    };
  } catch (error: any) {
    return { success: false, error: error.message || '压缩失败' };
  }
});

// 保存API密钥
ipcMain.handle('save-api-key', (event: IpcMainInvokeEvent, apiKey: string) => {
  store.set('apiKey', apiKey);
  return { success: true };
});

// 获取API密钥
ipcMain.handle('get-api-key', () => {
  return { apiKey: store.get('apiKey') };
});

// 更新设置
ipcMain.handle('update-settings', (event: IpcMainInvokeEvent, settings: { createNew: boolean }) => {
  store.set('createNew', settings.createNew);
  return { success: true };
});

// 获取设置
ipcMain.handle('get-settings', () => {
  return { createNew: store.get('createNew') };
});

// 打开文件对话框
ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return { canceled: true };
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
    ]
  });
  
  return result;
}); 