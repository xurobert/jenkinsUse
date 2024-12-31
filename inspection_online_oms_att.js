import { Selector } from 'testcafe';
import path from 'path';
import fs from 'fs';
import { sendImagesToDingTalk } from './utils/notification';

// 添加 fixture 声明
fixture(`OMS系统考勤巡检`)
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
        .click(Selector('div').withText('考勤报表').nth(6))
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
            name: '项目考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_WorkspaceAttendance'),
            fileName: 'workspace_stats_att'  // 移除 .png 后缀
        },
        {
            name: '工程考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_UnitAttendance'),
            fileName: 'project_stats_att'  // 移除 .png 后缀
        },
        {
            name: '单位考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_UnitAttendance'),
            fileName: 'unit_stats_att'
        },
        {
            name: '班组考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_TeamAttendance'),
            fileName: 'team_stats_att'
        },
        {
            name: '小组考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_GroupAttendance'),
            fileName: 'group_stats_att'
        },
        {
            name: '工人考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_WorkerAttendance'),
            fileName: 'worker_details'
        }
    ].map(screenshot => ({
        ...screenshot,
        fullPath: path.join('screenshots', dateDir, systemDir, `${screenshot.fileName}.png`)
    }));

    let screenshotsTaken = []; // 用于存储已截图的文件信息

    // 截图操作
    for (const screenshot of reportScreenshots) {
        console.log(`准备检查: ${screenshot.name}`);
        
        try {
            await t
                .click(screenshot.selector)
                .wait(10000);
                
            let noDataExists = await Selector('#report-center-table td').withText('暂无数据').exists;

            if (noDataExists) {
                // 点击查询按钮并等待
                try {
                    await t
                        .click(Selector('button').withText('查 询'))
                        .wait(10000);  // 等待10秒
    
                    // 再次检查是否存在"暂无数据"
                    noDataExists = await Selector('#report-center-table td')
                        .withText('暂无数据')
                        .exists;
                    
                    console.log(`${screenshot.name} 查询后状态: ${noDataExists ? '仍无数据' : '已有数据'}`);
                } catch (error) {
                    console.error('点击查询按钮失败:', error);
                }
            }
            
            if (noDataExists) {
                console.log(`${screenshot.name} 暂无数据，开始截图`);
                
                const screenshotPath = `screenshots/${dateDir}/oms/${screenshot.fileName}.png`;
                await t.takeScreenshot({
                    path: path.join('screenshots', dateDir, systemDir, `${screenshot.fileName}.png`),
                    fullPage: true
                });
                
                console.log(`截图已保存: ${screenshotPath}`);
                screenshotsTaken.push({
                    path: screenshotPath,
                    name: screenshot.name
                });
            } else {
                console.log(`${screenshot.name} 有数据，跳过截图`);
            }
            
        } catch (error) {
            console.error(`处理过程出错: ${error}`);
        }
    }

    // 在发送钉钉消息之前添加判断
    if (screenshotsTaken.length === 0) {
        // 如果没有截图，发送巡检通过的消息
        try {
            await sendImagesToDingTalk([], `${formatDate} OMS系统考勤数据巡检通过，所有页面均有数据。`, t);
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
                `${formatDate} OMS系统考勤数据巡检发现以下页面暂无数据：\n${
                    screenshotsTaken.map(s => s.name).join('\n')
                }`, 
                t
            );
        } catch (error) {
            console.error('发送到钉钉失败:', error);
        }
    }
});
