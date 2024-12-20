import fs from 'fs';
import path from 'path';

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