# 创建应用图标

为了让应用看起来更专业，需要创建以下图标文件：

## 所需图标

1. 为macOS创建一个ICNS图标文件：
   - `src/assets/icon.icns`
   - 尺寸要求：最大尺寸为1024x1024像素，ICNS格式包含多种尺寸

2. 为Windows创建一个ICO图标文件：
   - `src/assets/icon.ico`
   - 尺寸要求：通常包含多种尺寸，常见的有16x16, 32x32, 48x48, 256x256像素

3. 为应用内部UI创建一个PNG图标：
   - `src/assets/tiny-icon.png`
   - 尺寸建议：128x128或256x256像素

## 创建方法

### 方法1：使用在线工具

1. 首先创建一个高质量的1024x1024像素的PNG图标
2. 使用在线工具如[iConvert](https://iconverticons.com/)或[Icon Kitchen](https://icon.kitchen/)转换成所需格式

### 方法2：使用electron-icon-builder

如果你喜欢自动化流程，可以使用`electron-icon-builder`包：

1. 安装依赖：
   ```bash
   npm install --save-dev electron-icon-builder
   ```

2. 在package.json中添加脚本：
   ```json
   "scripts": {
     "generate-icons": "electron-icon-builder --input=./src/assets/icon.png --output=./src/assets"
   }
   ```

3. 将一个高质量的PNG图标保存为`src/assets/icon.png`（至少1024x1024像素）

4. 运行图标生成脚本：
   ```bash
   npm run generate-icons
   ```

## 图标设计建议

设计应用图标时的一些小技巧：

- 保持简单，使用简洁的形状和有限的颜色
- 确保在小尺寸下仍然清晰可辨
- 使用与应用主题相匹配的颜色
- 为TinyPNG应用，可以使用小象的形象或有压缩含义的图形元素
- 避免使用过多的细节和纹理，以保证在各种尺寸下看起来都很好 