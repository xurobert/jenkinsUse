import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ossClient } from '../config/oss.config.js';

// 钉钉机器人配置
// const DINGTALK_WEBHOOK = "";

const DINGTALK_WEBHOOK = "https://oapi.dingtalk.com/robot/send?access_token=7306de9f80aa250d9f0bd2943aacc51aabd3e0e02e69cd7bd0d903fe3a2c8eac";

// 添加上传到OSS的函数
async function uploadToOSS(filePath) {
  try {
    const timestamp = Date.now();
    const fileExt = path.extname(filePath);
    const fileNameWithoutExt = path.basename(filePath, fileExt);
    
    // 只修改 OSS 上的文件名，不改变本地文件
    const ossFileName = `screenshots/${fileNameWithoutExt}_${timestamp}${fileExt}`;
    
    // 上传时使用新的 ossFileName，但读取原始 filePath
    const result = await ossClient.put(ossFileName, filePath);
    console.log('OSS上传成功，URL:', result.url);
    return result.url;
  } catch (error) {
    console.error('上传到OSS失败:', error);
    throw error;
  }
}

// 发送文本消息到钉钉
export async function sendMessageToDingTalk(message) {
    try {
        await axios.post(DINGTALK_WEBHOOK, {
            msgtype: "text",
            text: {
                content: message
            }
        });
        console.log('消息发送成功');
    } catch (error) {
        console.error('发送消息失败:', error);
    }
}

// 发送多张图片到钉钉
export async function sendImagesToDingTalk(images, title, t) {
    try {
        console.log(`开始处理多张图片`);
        
        // 检查文件
        for (const img of images) {
            const path = img.path || img.fullPath;
            if (!fs.existsSync(path)) {
                throw new Error(`文件不存在: ${path}`);
            }
            const stats = fs.statSync(path);
            console.log(`文件 ${path} 大小: ${stats.size} bytes`);
            if (stats.size === 0) {
                throw new Error(`文件大小为0: ${path}`);
            }
        }

        // 上传所有图片并获取URL
        const imageUrls = await Promise.all(
            images.map(async img => {
                const path = img.path || img.fullPath;
                const url = await uploadToOSS(path);
                return { name: img.name, url };
            })
        );
        
        // 构建markdown文本
        const imagesMarkdown = imageUrls
            .map(img => `![${img.name}](${img.url})`)
            .join('\n');
        
        // 发送合并后的消息
        const response = await axios.post(DINGTALK_WEBHOOK, {
            msgtype: "markdown",
            markdown: {
                title: title,
                text: `### ${title}\n${imagesMarkdown}`
            }
        });
        
        console.log(`钉钉响应状态: ${response.status}`);
        
    } catch (error) {
        console.error(`发送截图失败:`, error);
        throw error;
    }
} 