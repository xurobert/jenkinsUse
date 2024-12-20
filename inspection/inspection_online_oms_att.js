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
    const baseScreenshotDir = path.join(process.cwd(), 'screenshots'); // 基础截图目录
    const dateDir = formatDate; // 当前日期目录
    const systemDir = 'oms'; // 系统目录
    
    // 确保目录存在
    ensureDirectoryExists(baseScreenshotDir);
    ensureDirectoryExists(path.join(baseScreenshotDir, dateDir));
    ensureDirectoryExists(path.join(baseScreenshotDir, dateDir, systemDir));

    // 截图配置
    const reportScreenshots = [
        {
            name: '项目考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_WorkspaceAttendance'),
            fileName: 'workspace_stats_att'
        },
        {
            name: '工程考勤',
            selector: Selector('#rc-tabs-0-tab-Oms_ReportCenter_AttendanceNew_UnitAttendance'),
            fileName: 'project_stats_att'
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
        fullPath: path.join(baseScreenshotDir, dateDir, systemDir, `${screenshot.fileName}.png`) // 设置完整路径
    }));

    // 截图操作
    for (const screenshot of reportScreenshots) {
        console.log(`准备截图: ${screenshot.fullPath}`);
        try {
            await t
                .wait(3000)  // 等待页面加载
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
        const screenshotsToSend = existingScreenshots.map(screenshot => {
            // 添加文件大小检查
            const stats = fs.statSync(screenshot.fullPath);
            console.log(`准备发送文件: ${screenshot.fullPath}, 大小: ${stats.size} bytes`);
            
            return {
                path: screenshot.fullPath,
                name: screenshot.name,
                uploadPath: screenshot.fullPath
            };
        });
        
        try {
            await sendImagesToDingTalk(screenshotsToSend, '考勤报表巡检截图', t);
        } catch (error) {
            console.error('发送到钉钉失败:', error);
        }
    } else {
        console.error('没有找到任何有效的截图文件');
    }
});
