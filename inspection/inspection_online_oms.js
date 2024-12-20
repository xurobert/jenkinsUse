const { Selector, fixture, test } = require('testcafe');
const path = require('path');
const fs = require('fs');
const { sendImagesToDingTalk } = require('./utils/notification');

// 确保创建目录的函数在 fixture 声明之前
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// fixture 声明必须在 test 之前，并且要确保它们之间没有其他代码干扰
fixture(`OMS系统人员报表自动化测试`)
    .page(`http://oms.axzo.cn`)
    .skipJsErrors();

// test 声明
test('系统登录及页面截图测试', async t => {
    // 第一步：登录操作
    await t
        .typeText('.el-input__inner', '13980697275')
        .typeText(Selector('.el-input__inner').nth(1), 'Xu123456+')
        .click(Selector('button').withText('登录'))
        .wait(3000)
        .click(Selector('div').withText('数据中心').nth(5))
        .wait(3000)
        .click(Selector('div').withText('人员报表').nth(6))
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
            name: '项目人员统计',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_WorkspacePersonCount'),
            fileName: 'workspace_stats_person'
        },
        {
            name: '工程人员统计',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_ProjectPersonCount'),
            fileName: 'project_stats_person'
        },
        {
            name: '单位人员统计',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_UnitPersonCount'),
            fileName: 'unit_stats_person'
        },
        {
            name: '班组人员统计',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_TeamPersonCount'),
            fileName: 'team_stats_person'
        },
        {
            name: '小组人员统计',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_GroupPersonCount'),
            fileName: 'group_stats_person'
        },
        {
            name: '工人信息明细',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_WorkerPersonCount'),
            fileName: 'worker_details_person'
        },
        {
            name: '工人属性统计',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_WorkerProperty'),
            fileName: 'worker_props_person'
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
        await sendImagesToDingTalk(screenshotsToSend, '人员报表巡检截图', t);
    } else {
        console.error('没有找到任何有效的截图文件');
    }
});
