# Tiny 图片压缩工具

一个基于 Electron 的图片压缩桌面应用程序，使用 TinyPNG API 进行高质量图片压缩。

## 功能特性

- 支持压缩 JPG, PNG, GIF, WEBP 等格式的图片
- 使用 TinyPNG API 进行专业级图片压缩，保持高质量的同时大幅减小文件体积
- 可以直接拖放图片到应用程序窗口进行压缩
- 支持批量处理多个图片文件
- 可选择生成新的压缩图片或替换原文件
- 显示压缩前后的文件大小和压缩率
- 支持 macOS 和 Windows 系统

## 使用说明

1. 首次使用时，需要在顶部输入 TinyPNG API 密钥（可从[TinyPNG 开发者页面](https://tinypng.com/developers)获取）
2. 选择是否生成新的压缩图片文件（不勾选则会替换原文件）
3. 通过拖放图片到窗口或点击"选择图片"按钮添加要压缩的图片
4. 等待压缩完成，查看结果报告

## 开发相关

### 安装依赖

```bash
npm install
```

### 运行开发环境

```bash
npm run dev
```

### 构建应用

对于 macOS:

```bash
npm run build:mac
```

对于 Windows:

```bash
npm run build:win
```

## 项目结构

```
tiny-image-compressor/
├── src/
│   ├── main/          # 主进程代码
│   │   └── main.ts    # 主进程入口点
│   ├── renderer/      # 渲染进程代码
│   │   ├── css/       # 样式文件
│   │   ├── js/        # 渲染进程脚本
│   │   └── index.html # 主界面HTML
│   ├── assets/        # 图标和资源
│   └── preload.ts     # 预加载脚本
├── dist/              # 编译后的代码
├── release/           # 打包后的应用
└── package.json       # 项目配置
```

## 技术栈

- Electron
- TypeScript
- TinyPNG API

## 许可证

MIT
