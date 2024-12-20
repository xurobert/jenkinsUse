import { Selector } from 'testcafe';
import path from 'path';
import fs from 'fs';
import { sendImagesToDingTalk } from './utils/notification';

// 添加 fixture 声明
fixture(`OMS系统记工巡检`)
.page `https://oms.axzo.cn/`
.skipJsErrors();;

// 添加创建目录的函数
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

test('系统登录及页面截图测试', async t => {
    // 第一步：登录操作
    await t
        .maximizeWindow()  // 最大化窗口
        .typeText('.el-input__inner', '13980697275')
        .typeText(Selector('.el-input__inner').nth(1), 'Xu123456+')
        .click(Selector('button').withText('登录'))
        .wait(3000)
        .click(Selector('div').withText('数据中心').nth(5))
        .wait(3000)
        .click(Selector('div').withText('记工报表').nth(6))
        .switchToIframe('main .iframe')

    // 获取当前日期
    const date = new Date();
    const formatDate = date.toISOString().split('T')[0];

    // 设置截图目录结构
    const dateDir = formatDate;
    const systemDir = 'oms';
    
    // 确保目录存在
    ensureDirectoryExists('screenshots');
    ensureDirectoryExists(path.join('screenshots', dateDir));
    ensureDirectoryExists(path.join('screenshots', dateDir, systemDir));

    // 截图配置
    const reportScreenshots = [
        {
            name: '项目记工',
            selector: Selector('#rc-tabs-0-tab-Oms_reportCenter_workspace_record'),
            fileName: 'workspace_stats_rec'
        },
        {
            name: '工程记工',
            selector: Selector('#rc-tabs-0-tab-Oms_reportCenter_pro_record'),
            fileName: 'project_stats_rec'
        },
        {
            name: '单位记工',
            selector: Selector('#rc-tabs-0-tab-Oms_reportCenter_unit_record'),
            fileName: 'unit_stats_rec'
        },
        {
            name: '班组记工',
            selector: Selector('#rc-tabs-0-tab-Oms_reportCenter_team_record'),
            fileName: 'team_stats_rec'
        },
        {
            name: '小组记工',
            selector: Selector('#rc-tabs-0-tab-Oms_reportCenter_group_record'),
            fileName: 'group_stats_rec'
        },
        {
            name: '工人记工',
            selector: Selector('#rc-tabs-0-tab-Oms_reportCenter_worker_record'),
            fileName: 'worker_details_rec'
        }
    ].map(screenshot => ({
        ...screenshot,
        fullPath: path.join('screenshots', dateDir, systemDir, `${screenshot.fileName}.png`)
    }));

    // 截图操作
    for (const screenshot of reportScreenshots) {
        console.log(`准备截图: ${screenshot.fullPath}`);
        try {
            await t
                .click(screenshot.selector)
                .wait(7000);

            // 使用 pathPattern 保存截图
            await t.takeScreenshot({
                pathPattern: `${dateDir}/${systemDir}/${screenshot.fileName}.png`  // 使用 pathPattern
            });
            
            // 检查文件是否存在
            if (fs.existsSync(screenshot.fullPath)) {
                console.log(`截图已保存: ${screenshot.fullPath}`);
            } else {
                console.error(`截图未能保存: ${screenshot.fullPath}`);
            }
        } catch (error) {
            console.error(`截图过程出错:`, error);
        }
    }

    // 发送截图前检查文件
    const existingScreenshots = reportScreenshots.filter(screenshot => {
        const exists = fs.existsSync(screenshot.fullPath);
        if (!exists) {
            console.error(`文件不存在: ${screenshot.fullPath}`);
        }
        return exists;
    });

    if (existingScreenshots.length > 0) {
        const screenshotsToSend = existingScreenshots.map(screenshot => ({
            path: screenshot.fullPath,
            name: screenshot.name,
            uploadPath: screenshot.fullPath
        }));
        
        try {
            await sendImagesToDingTalk(screenshotsToSend, '记工报表巡检截图', t);
        } catch (error) {
            console.error('发送到钉钉失败:', error);
        }
    } else {
        console.error('没有找到任何有效的截图文件');
    }
});
