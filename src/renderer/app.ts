// 类型定义
interface ElectronAPI {
  compressImage: (filePath: string) => Promise<CompressResult>;
  saveApiKey: (apiKey: string) => Promise<{ success: boolean }>;
  getApiKey: () => Promise<{ apiKey: string }>;
  updateSettings: (settings: { createNew: boolean }) => Promise<{ success: boolean }>;
  getSettings: () => Promise<{ createNew: boolean }>;
  openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
}

interface CompressResult {
  success: boolean;
  originalPath?: string;
  outputPath?: string;
  originalSize?: number;
  compressedSize?: number;
  compressionRate?: string;
  error?: string;
}

// 声明全局接口
interface Window {
  electronAPI: ElectronAPI;
}

// DOM元素
const apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
const saveApiKeyBtn = document.getElementById('save-api-key') as HTMLButtonElement;
const createNewCheckbox = document.getElementById('create-new') as HTMLInputElement;
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const resultsSection = document.getElementById('results-section') as HTMLElement;
const resultsList = document.getElementById('results-list') as HTMLElement;
const statusMessage = document.getElementById('status-message') as HTMLElement;
const settingsIcon = document.getElementById('settings-icon') as HTMLElement;
const settingsModal = document.getElementById('settings-modal') as HTMLElement;
const closeModal = document.getElementById('close-modal') as HTMLElement;
const appContainer = document.getElementById('app-container') as HTMLElement;
const folderIcon = document.getElementById('folder-icon') as HTMLElement;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 加载API密钥
  const { apiKey } = await window.electronAPI.getApiKey();
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  // 加载设置
  const { createNew } = await window.electronAPI.getSettings();
  createNewCheckbox.checked = createNew;

  // 注册事件监听器
  registerEventListeners();
});

// 注册事件监听器
function registerEventListeners(): void {
  // 文件夹图标点击事件
  folderIcon.addEventListener('click', selectFiles);

  // 拖放区域事件
  appContainer.addEventListener('dragover', handleDragOver);
  appContainer.addEventListener('dragleave', handleDragLeave);
  appContainer.addEventListener('drop', handleDrop);

  // 设置图标点击事件
  settingsIcon.addEventListener('click', openSettingsModal);

  // 关闭弹窗事件
  closeModal.addEventListener('click', closeSettingsModal);

  // 点击弹窗外部区域关闭弹窗
  settingsModal.addEventListener('click', e => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });
}

// 选择文件
async function selectFiles(): Promise<void> {
  try {
    const result = await window.electronAPI.openFileDialog();

    if (!result.canceled && result.filePaths.length > 0) {
      processFiles(result.filePaths);
    }
  } catch (error) {
    showStatus('选择文件时出错', 'error');
  }
}

// 处理拖放相关事件
function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add('active');
  // 如果结果已显示，添加一个视觉提示
  if (resultsSection.classList.contains('show')) {
    appContainer.classList.add('drag-over');
  }
}

function handleDragLeave(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('active');
  appContainer.classList.remove('drag-over');
}

function handleDrop(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove('active');
  appContainer.classList.remove('drag-over');

  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    // 在Electron环境中，File对象可能会被扩展，但TypeScript不认识这些扩展属性
    // 使用类型断言来解决
    interface FileWithPath extends File {
      path: string;
    }

    const files = Array.from(e.dataTransfer.files)
      .filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
      })
      .map(file => (file as FileWithPath).path); // 使用类型断言

    if (files.length > 0) {
      processFiles(files);
    } else {
      showStatus('没有可压缩的图片文件', 'warning');
    }
  }
}

// 处理文件
async function processFiles(filePaths: string[]): Promise<void> {
  // 显示结果区域，隐藏拖放区域
  dropZone.style.display = 'none';
  resultsSection.classList.add('show');

  showStatus(`正在处理 ${filePaths.length} 个文件...`, 'info');

  for (const filePath of filePaths) {
    // 创建结果项
    const resultItem = createResultItem(filePath);
    resultsList.append(resultItem);

    try {
      // 压缩图片
      const result = await window.electronAPI.compressImage(filePath);
      updateResultItem(resultItem, result);
    } catch (error) {
      updateResultItem(resultItem, {
        success: false,
        originalPath: filePath,
        error: '压缩过程中出错',
      });
    }
  }

  showStatus(`处理完成: ${filePaths.length} 个文件`, 'success');
}

// 创建结果项
function createResultItem(filePath: string): HTMLElement {
  const fileName = filePath.split(/[\/\\]/).pop() || '';

  const resultItem = document.createElement('div');
  resultItem.className = 'result-item';
  resultItem.innerHTML = `
    <img class="preview-image" src="${filePath}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🖼️</text></svg>'">
    <div class="result-content">
      <div class="file-name">${fileName}</div>
      <div class="file-details">
        <div class="loading"></div>
      </div>
      <div class="status">处理中...</div>
    </div>
  `;

  return resultItem;
}

// 更新结果项
function updateResultItem(resultItem: HTMLElement, result: CompressResult): void {
  const statusEl = resultItem.querySelector('.status') as HTMLElement;
  const fileDetails = resultItem.querySelector('.file-details') as HTMLElement;

  // 如果成功并且有输出路径，更新预览图像路径
  if (result.success && result.outputPath) {
    const previewImage = resultItem.querySelector('.preview-image') as HTMLImageElement;
    if (previewImage) {
      previewImage.src = result.outputPath;
    }
  }

  // 移除加载动画
  const loadingEl = resultItem.querySelector('.loading');
  if (loadingEl) {
    loadingEl.remove();
  }

  if (result.success) {
    statusEl.textContent = '成功';
    statusEl.className = 'status success';

    const originalSize = formatSize(result.originalSize || 0);
    const compressedSize = formatSize(result.compressedSize || 0);
    const fileName = result.originalPath ? result.originalPath.split(/[\/\\]/).pop() || '' : '';

    fileDetails.innerHTML = `
      <div class="detail file-size">
        ${originalSize} → ${compressedSize}
      </div>
      <div class="detail compression-rate">
        （${result.compressionRate}%）
      </div>
    `;
  } else {
    statusEl.textContent = '失败';
    statusEl.className = 'status error';

    fileDetails.innerHTML = `
      <div class="detail error-message">
        ${result.error || '未知错误'}
      </div>
    `;
  }
}

// 显示状态消息
function showStatus(message: string, type: 'success' | 'error' | 'warning' | 'info'): void {
  statusMessage.textContent = message;

  // 清除之前的类
  statusMessage.className = '';

  // 添加新类
  statusMessage.classList.add(type);

  // 如果是成功或错误消息，3秒后清除
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = '';
    }, 3000);
  }
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// 打开设置弹窗
function openSettingsModal(): void {
  settingsModal.classList.add('show');
}

// 保存所有设置
async function saveAllSettings(): Promise<void> {
  try {
    // 保存API密钥
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      await window.electronAPI.saveApiKey(apiKey);
    }

    // 保存其他设置
    await window.electronAPI.updateSettings({
      createNew: createNewCheckbox.checked,
    });
  } catch (error) {
    showStatus('保存设置时出错', 'error');
  }
}

// 关闭设置弹窗
function closeSettingsModal(): void {
  settingsModal.classList.remove('show');
  // 自动保存所有设置
  saveAllSettings();
}
