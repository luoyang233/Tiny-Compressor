const fs = require('fs');
const path = require('path');

// 递归创建目录
function mkdirRecursive(dir) {
  if (fs.existsSync(dir)) return;
  
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

// 递归复制目录
function copyDir(src, dest) {
  // 确保目标目录存在
  mkdirRecursive(dest);
  
  // 读取源目录中的所有文件和子目录
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // 如果是目录，递归复制
      copyDir(srcPath, destPath);
    } else {
      // 如果是文件，且不是TypeScript文件，直接复制
      if (!entry.name.endsWith('.ts')) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied: ${srcPath} -> ${destPath}`);
      }
    }
  }
}

// 复制renderer目录
copyDir('src/renderer', 'dist/renderer');

// 复制assets目录
if (fs.existsSync('src/assets')) {
  copyDir('src/assets', 'dist/assets');
}

console.log('Static files copied successfully.'); 