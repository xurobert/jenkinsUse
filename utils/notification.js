import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// 钉钉机器人配置
const DINGTALK_WEBHOOK = "https://oapi.dingtalk.com/robot/send?access_token=7306de9f80aa250d9f0bd2943aacc51aabd3e0e02e69cd7bd0d903fe3a2c8eac";

// ImgBB API密钥
const IMGBB_API_KEY = '27b58186ff94a19c7af7933993f0d1eb';

// 上传图片到ImgBB - 使用 FormData 方式
export async function uploadToImgBB(imagePath) {
    try {
        console.log(`开始上传图片: ${imagePath}`);
        
        // 检查文件是否存在
        if (!fs.existsSync(imagePath)) {
            throw new Error(`文件不存在: ${imagePath}`);
        }

        // 创建 FormData 实例
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));

        // 发送请求
        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );

        if (!response.data?.data?.url) {
            throw new Error('ImgBB 返回的数据格式不正确');
        }

        console.log('图片上传成功，URL:', response.data.data.url);
        return response.data.data.url;
    } catch (error) {
        console.error('上传图片到ImgBB失败:', error.message);
        if (error.response) {
            console.error('ImgBB API 响应:', error.response.data);
        }
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
                const url = await uploadToImgBB(path);
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