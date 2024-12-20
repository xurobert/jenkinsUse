import { Selector } from 'testcafe';
import fs from 'fs';
import path from 'path';

// 读取配置文件
const checkpointConfigPath = path.join(__dirname, 'config', 'checkpoint.json');
const dataSourceConfigPath = path.join(__dirname, 'config', 'dataSource.json');

const readJsonFile = (filePath) => {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// 读取 checkpoint 和 dataSource 配置
const checkpointConfig = readJsonFile(checkpointConfigPath);
const dataSourceConfig = readJsonFile(dataSourceConfigPath);

// 定义测试套件
fixture `检查点验证`
    .page `https://test-cms.axzo.cn/`
    .skipJsErrors();

// 登录并验证检查点
for (const user of checkpointConfig.checkpointList) {
    test(`用户 ${user.phone} 登录并验证检查点`, async t => {
        // 登录操作
        const loginElements = {
            smsLoginButton: Selector('#app span').withText('短信登录'),
            phoneInput: Selector('#form_item_account'),
            getCodeButton: Selector('#app span').withText('获取验证码').nth(2),
            loginButton: Selector('#app button').withText('登录 / 注册'),
        };
    
        // 执行登录操作
        await t
            .maximizeWindow()
            .click(loginElements.smsLoginButton)
            .typeText(loginElements.phoneInput, user.phone)
            .click(loginElements.getCodeButton)
            .wait(1000)
            .click(loginElements.loginButton)
            .wait(5000);

        // 验证每个检查点
        for (const checkpoint of user.checkpointList) {
            const dataSourceItem = dataSourceConfig.checkpointList.find(item => item.name === checkpoint);
            if (dataSourceItem) {
                const selector = Selector(dataSourceItem.selector.base).withText(dataSourceItem.selector.withText).nth(dataSourceItem.selector.nth);
                const exists = await selector.exists;

                if (exists) {
                    console.log(`检查点 "${checkpoint}" 存在。`);
                } else {
                    console.error(`检查点 "${checkpoint}" 不存在。`);
                }

                // 如果需要点击，执行点击操作
                if (dataSourceItem.needClick) {
                    const clickSelector = Selector(dataSourceItem.needClick.selector.base);
                    await t.click(clickSelector);
                }
            } else {
                console.error(`未找到检查点 "${checkpoint}" 的数据源配置。`);
            }
        }
    });
} 