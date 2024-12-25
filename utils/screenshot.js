import fs from 'fs';
import path from 'path';
const OSS = require('ali-oss');

// 阿里云 OSS 配置
const client = new OSS({
  region: 'your-region', // 例如 'oss-cn-hangzhou'
  accessKeyId: 'your-access-key-id',
  accessKeySecret: 'your-access-key-secret',
  bucket: 'your-bucket-name'
});

// NAS 共享目录路径
const nasPath = '/path/to/your/nas/directory';

// 上传文件的函数
async function uploadToOSS(filePath) {
    try {
        const result = await client.put('your-upload-path/' + filePath, filePath);
        console.log('上传成功：', result.url);
        return result.url; // 返回文件的 URL
    } catch (err) {
        console.error('上传失败：', err);
    }
}

// 上传文件的函数
async function uploadToNAS(filePath) {
    const destinationPath = path.join(nasPath, path.basename(filePath));
    try {
        // 复制文件到 NAS
        fs.copyFileSync(filePath, destinationPath);
        console.log('上传成功：', destinationPath);
        return destinationPath; // 返回文件的路径
    } catch (err) {
        console.error('上传失败：', err);
    }
}

// 创建目录的函数
export function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 初始化截图目录
export function initScreenshotDir(systemName) {
    const date = new Date();
    const formatDate = date.toISOString().split('T')[0];
    const dateDir = formatDate;
    const systemDir = systemName;
    const screenshotDir = path.join('screenshots', dateDir, systemDir);
    
    // 确保目录存在
    ensureDirectoryExists('screenshots');
    ensureDirectoryExists(path.join('screenshots', dateDir));
    ensureDirectoryExists(path.join('screenshots', dateDir, systemDir));

    return { dateDir, systemDir, screenshotDir };
}

// 截图并验证
export async function takeAndVerifyScreenshot(t, fileName, dateDir, systemDir) {
    const fullPath = path.join('screenshots', dateDir, systemDir, `${fileName}.png`);
    
    try {
        await t.takeScreenshot({
            pathPattern: `${dateDir}/${systemDir}/${fileName}.png`
        });
        
        if (fs.existsSync(fullPath)) {
            console.log(`截图已保存: ${fullPath}`);
            return true;
        } else {
            console.error(`截图未能保存: ${fullPath}`);
            return false;
        }
    } catch (error) {
        console.error(`截图过程出错:`, error);
        return false;
    }
} 