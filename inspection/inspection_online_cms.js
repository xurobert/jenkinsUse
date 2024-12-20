import { Selector } from 'testcafe';
import path from 'path';
import fs from 'fs';
import { sendImagesToDingTalk } from './utils/notification';

// 添加创建目录的函数
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// 定义测试套件并设置基础URL
fixture `企业管理系统自动化测试`
    .page `https://cms.axzo.cn/`
    .skipJsErrors();

test('系统登录及页面截图测试', async t => {
    // 第一步：登录操作
    await t
        .maximizeWindow()  // 最大化窗口
        .click(Selector('#app span').withText('短信登录'))    
        .typeText('#form_item_account', '15298004026')  // 输入手机号
        .click(Selector('#app span').withText('获取验证码').nth(2))  // 获取验证码
        .click(Selector('#app button').withText('登录 / 注册'))  // 点击登录按钮

    // 获取当前日期
    const date = new Date();
    const formatDate = date.toISOString().split('T')[0];  // YYYY-MM-DD
    
    // 设置截图目录结构
    const dateDir = formatDate;
    const systemDir = 'cms';
    const screenshotDir = path.join('screenshots', dateDir, systemDir);
    
    // 确保目录存在
    ensureDirectoryExists('screenshots');
    ensureDirectoryExists(path.join('screenshots', dateDir));
    ensureDirectoryExists(path.join('screenshots', dateDir, systemDir));
    
    // 企业首页截图
    const enterpriseScreenshots = [
        {
            name: '企业首页-第一屏',
            fileName: 'enterprise_page_1',
            fullPath: path.join('screenshots', dateDir, systemDir, 'enterprise_page_1.png')
        },
        {
            name: '企业首页-第二屏',
            fileName: 'enterprise_page_2',
            fullPath: path.join('screenshots', dateDir, systemDir, 'enterprise_page_2.png')
        }
    ];

    // 项目首页截图
    const projectScreenshots = [
        {
            name: '项目首页-第一屏',
            fileName: 'project_page_1',
            fullPath: path.join('screenshots', dateDir, systemDir, 'project_page_1.png')
        },
        {
            name: '项目首页-第二屏',
            fileName: 'project_page_2',
            fullPath: path.join('screenshots', dateDir, systemDir, 'project_page_2.png')
        }
    ];

    // 企业首页截图操作
    await t
        .wait(5000)
        .takeScreenshot({
            pathPattern: `${dateDir}/${systemDir}/${enterpriseScreenshots[0].fileName}.png`
        })
        .pressKey('pagedown')
        .wait(2000)
        .takeScreenshot({
            pathPattern: `${dateDir}/${systemDir}/${enterpriseScreenshots[1].fileName}.png`
        });

    // 发送企业首页截图
    await sendImagesToDingTalk(enterpriseScreenshots, '企业首页巡检截图', t);

    // 项目首页截图操作
    await t
        .click('#project_9103')
        .expect(Selector('#app span').withText('项目首页').exists).ok('未找到项目首页元素', { 
            timeout: 5000 
        })
        .click(Selector('#app span').withText('项目首页'))
        .wait(5000)
        .takeScreenshot({
            pathPattern: `${dateDir}/${systemDir}/${projectScreenshots[0].fileName}.png`
        })
        .click(Selector('#main-content span').withText('人员统计'))
        .pressKey('pagedown')
        .wait(2000)
        .takeScreenshot({
            pathPattern: `${dateDir}/${systemDir}/${projectScreenshots[1].fileName}.png`
        });

    // 发送项目首页截图
    await sendImagesToDingTalk(projectScreenshots, '项目首页巡检截图', t);
});
