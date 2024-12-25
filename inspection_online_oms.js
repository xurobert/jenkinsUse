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
            fileName: 'workspace_stats_person'  // 移除 .png 后缀
        },
        {
            name: '工程人员统计',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_Person_ProjectPersonCount'),
            fileName: 'project_stats_person'  // 移除 .png 后缀
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

    // 在 reportScreenshots 定义后添加
    let screenshotsTaken = []; // 用于存储已截图的文件信息

    // 修改截图操作部分
    for (const screenshot of reportScreenshots) {
        console.log(`准备检查: ${screenshot.name}`);
        try {
            await t
                .click(screenshot.selector)
                .wait(10000);

            // 检查是否存在"暂无数据"
            const noDataExists = await Selector('#report-center-table td').withText('暂无数据').exists;
            
            if (noDataExists) {
                console.log(`${screenshot.name} 暂无数据，开始截图`);
                
                await t.takeScreenshot({
                    pathPattern: `${dateDir}/${systemDir}/${screenshot.fileName}.png`
                });
                
                if (fs.existsSync(screenshot.fullPath)) {
                    console.log(`截图已保存: ${screenshot.fullPath}`);
                    screenshotsTaken.push(screenshot);
                } else {
                    console.error(`截图未能保存: ${screenshot.fullPath}`);
                }
            } else {
                console.log(`${screenshot.name} 有数据，跳过截图`);
            }
        } catch (error) {
            console.error(`截图过程出错:`, error);
        }
    }

    // 修改发送消息部分
    if (screenshotsTaken.length === 0) {
        // 如果没有截图，发送巡检通过的消息
        try {
            await sendImagesToDingTalk([], `${formatDate} OMS系统人员数据巡检通过，所有页面均有数据。`, t);
            console.log('巡检通过，无需发送截图');
        } catch (error) {
            console.error('发送通过消息失败:', error);
        }
    } else {
        // 如果有截图，处理并发送
        const screenshotsToSend = screenshotsTaken.map(screenshot => {
            const stats = fs.statSync(screenshot.fullPath);
            console.log(`准备发送文件: ${screenshot.fullPath}, 大小: ${stats.size} bytes`);
            
            return {
                path: screenshot.fullPath,
                name: screenshot.name,
                uploadPath: screenshot.fullPath
            };
        });
        
        try {
            await sendImagesToDingTalk(
                screenshotsToSend, 
                `${formatDate} OMS系统人员数据巡检发现以下页面暂无数据：\n${
                    screenshotsTaken.map(s => s.name).join('\n')
                }`, 
                t
            );
        } catch (error) {
            console.error('发送到钉钉失败:', error);
        }
    }
    
});
