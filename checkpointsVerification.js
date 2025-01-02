import { Selector } from 'testcafe';
import fs from 'fs';
import path from 'path';
import { sendMessageToDingTalk } from './utils/notification';

// 读取配置文件
const checkpointConfigPath = path.join(__dirname, 'config', 'checkpoint.json');
const dataSourceConfigPath = path.join(__dirname, 'config', 'dataSource.json');

const readJsonFile = (filePath) => {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// 读取 checkpoint 和 dataSource 配置
const checkpointConfig = readJsonFile(checkpointConfigPath);
const dataSourceConfig = readJsonFile(dataSourceConfigPath);

// 用于收集测试结果
let testResults = {
    passedCheckpoints: [],
    failedCheckpoints: [],
    startTime: '',
    endTime: ''
};

// 格式化消息
function formatMessage() {
    return `
### 大数据权限点巡检结果
#### 📅 执行时间
- 开始：${testResults.startTime}
- 结束：${testResults.endTime}

#### ✅ 通过的检查点 (${testResults.passedCheckpoints.length})
${testResults.passedCheckpoints.map(cp => `- ${cp.name}`).join('\n')}

#### ❌ 失败的检查点 (${testResults.failedCheckpoints.length})
${testResults.failedCheckpoints.map(cp => `- ${cp.name}: ${cp.error || '未通过'}`).join('\n')}

#### 📊 统计信息
- 总检查点: ${testResults.passedCheckpoints.length + testResults.failedCheckpoints.length}
- 通过率: ${((testResults.passedCheckpoints.length / (testResults.passedCheckpoints.length + testResults.failedCheckpoints.length)) * 100).toFixed(2)}%
    `;
}

// 定义测试套件
fixture `检查点验证`
    .page `https://cms.axzo.cn/`
    .skipJsErrors();

// 修改选择器构建逻辑
const buildSelector = (selectorConfig) => {
    let selector = Selector(selectorConfig.base);
    
    // 如果存在 withText，添加 withText 条件
    if (selectorConfig.withText) {
        selector = selector.withText(selectorConfig.withText);
    }
    
    // 如果存在 nth，添加 nth 条件
    if (typeof selectorConfig.nth === 'number') {
        selector = selector.nth(selectorConfig.nth);
    }
    
    return selector;
};

// 登录并验证检查点
for (const user of checkpointConfig.checkpointList) {
    test(`用户 ${user.phone} 登录并验证检查点`, async t => {
        testResults.startTime = new Date().toLocaleString();
        
        try {
            // 登录操作
            const loginElements = {
                smsLoginButton: Selector('#app span').withText('短信登录'),
                phoneInput: Selector('#form_item_account'),
                getCodeButton: Selector('#app span').withText('获取验证码').nth(2),
                loginButton: Selector('#app button').withText('登录 / 注册'),
                loginSuccess: Selector('div').withText('企业首页')
            };
        
            // 执行登录操作
            await t
                .maximizeWindow()
                .click(loginElements.smsLoginButton)
                .typeText(loginElements.phoneInput, user.phone)
                .click(loginElements.getCodeButton)
                .wait(1000)
                .click(loginElements.loginButton)
                .expect(loginElements.loginSuccess.exists).ok({ timeout: 10000 })
                .wait(1000);

            // 验证每个检查点
            for (const checkpoint of user.checkpointList) {
                const dataSourceItem = dataSourceConfig.checkpointList.find(item => item.name === checkpoint);
                if (dataSourceItem) {
                    try {
                        // 首先检查是否需要点击
                        if (dataSourceItem.needClick && dataSourceItem.needClick.selector) {
                            console.log(`准备点击元素: ${dataSourceItem.name}`);
                            const clickSelector = buildSelector(dataSourceItem.needClick.selector);
                            
                            try {
                                await t
                                    .expect(clickSelector.exists).ok({ timeout: 5000 })
                                    .click(clickSelector)
                                    .wait(2000);
                                console.log(`成功点击元素: ${dataSourceItem.name}`);
                            } catch (error) {
                                console.error(`点击元素失败: ${dataSourceItem.name}`, error);
                                throw error;
                            }
                        }

                        // 检查目标元素
                        const selector = buildSelector(dataSourceItem.selector);
                        await t.expect(selector.exists).ok({ 
                            timeout: 10000,
                            message: `等待元素 "${dataSourceItem.name}" 超时`
                        });

                        // 记录成功的检查点
                        testResults.passedCheckpoints.push({
                            name: dataSourceItem.name,
                            timestamp: new Date().toLocaleString()
                        });
                        console.log(`✅ 检查点 "${checkpoint}" 验证通过`);

                    } catch (error) {
                        // 记录失败的检查点
                        testResults.failedCheckpoints.push({
                            name: dataSourceItem.name,
                            error: error.message,
                            timestamp: new Date().toLocaleString()
                        });
                        console.error(`❌ 检查点 "${checkpoint}" 验证失败:`, error.message);
                    }
                } else {
                    console.error(`未找到检查点 "${checkpoint}" 的数据源配置。`);
                }
            }
        } catch (error) {
            console.error('测试执行出错:', error);
            testResults.failedCheckpoints.push({
                name: '测试执行',
                error: error.message,
                timestamp: new Date().toLocaleString()
            });
        }

        testResults.endTime = new Date().toLocaleString();
        
        const message = formatMessage();
        console.log('准备发送消息到钉钉:', message);
        
        // 发送结果到钉钉
        await sendMessageToDingTalk(message);
    });
} 