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
            fileName: 'workspace_stats_rec'  // 移除 .png 后缀
        },
        {
            name: '工程记工',
            selector: Selector('#rc-tabs-0-tab-Oms_reportCenter_pro_record'),
            fileName: 'project_stats_rec'  // 移除 .png 后缀
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

    // 在 test 函数内，reportScreenshots 定义后添加
    let screenshotsTaken = []; // 用于存储已截图的文件信息

    // 修改截图操作部分
    for (const screenshot of reportScreenshots) {
        console.log(`准备检查: ${screenshot.name}`);
        try {
            await t
                .click(screenshot.selector)
                .wait(10000);  // 保持原有的等待时间

            // 检查是否存在"暂无数据"
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
                
                // 使用 pathPattern 选项
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
            await sendImagesToDingTalk([], `${formatDate} OMS系统记工数据巡检通过，所有页面均有数据。`, t);
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
                `${formatDate} OMS系统记工数据巡检发现以下页面暂无数据：\n${
                    screenshotsTaken.map(s => s.name).join('\n')
                }`, 
                t
            );
        } catch (error) {
            console.error('发送到钉钉失败:', error);
        }
    }
});
