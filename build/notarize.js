const { notarize } = require('electron-notarize');
const { build } = require('../package.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // 仅在macOS平台上执行公证
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // 检查是否设置了必要的环境变量
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.log('跳过公证步骤。要启用公证，请设置 APPLE_ID 和 APPLE_ID_PASSWORD 环境变量。');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`正在对应用程序进行公证：${appName}`);

  try {
    await notarize({
      appBundleId: build.appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
    });
    
    console.log(`公证成功完成：${appName}`);
  } catch (error) {
    console.error('公证过程失败:', error);
    throw error;
  }
}; 