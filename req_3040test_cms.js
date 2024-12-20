import { Selector } from 'testcafe';
import * as fs from 'fs';
import * as path from 'path';

// 修改检查元素函数，不抛出错误
async function checkElementExists(selector, t, timeout = 10000) {
    try {
        await t.expect(selector.exists).ok({ timeout });
        return true;
    } catch (error) {
        console.log(`元素未找到: ${error.message}`);
        return false;
    }
}

const getConfigPath = () => {
    const args = process.argv;
    const configArgIndex = args.findIndex(arg => arg.startsWith('--config='));
    if (configArgIndex === -1) {
        return path.join(__dirname, 'config', 'elements.json');
    }
    return args[configArgIndex].split('=')[1];
};

const loadConfig = (configPath) => {
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error(`读取配置文件失败: ${error.message}`);
        throw error;
    }
};

const writeResultsToFile = (newResults, filePath) => {
    try {
        // 读取现有结果文件
        let existingResults = [];
        if (fs.existsSync(filePath)) {
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                existingResults = JSON.parse(fileContent);
            } catch (error) {
                console.log(`读取现有结果文件失败，将创建新文件: ${error.message}`);
            }
        }

        // 合并新旧结果
        const allResults = [
            ...existingResults,
            {
                testTime: new Date().toISOString(),
                results: newResults
            }
        ];

        // 写入合并后的结果
        fs.writeFileSync(filePath, JSON.stringify(allResults, null, 2), 'utf8');
        console.log(`结果已追加到文件: ${filePath}`);
    } catch (error) {
        console.error(`写入结果文件失败: ${error.message}`);
    }
};

// 定义测试套件
fixture `登录系统自动化测试`
    .page `https://test-cms.axzo.cn/`
    .skipJsErrors();

// 测试用例
test('系统登录', async t => {
    // 定义登录相关元素
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
        .typeText(loginElements.phoneInput, '15298004026')
        .click(loginElements.getCodeButton)
        .wait(1000)
        .click(loginElements.loginButton)
        .wait(5000);

    const configPath = getConfigPath();
    const config = loadConfig(configPath);
    
    const accessElementsToCheck = config.accessElements.map(element => ({
        selector: element.selector.map(selectorStr => {
            console.log('原始选择器字符串:', selectorStr);
            
            // 移除首尾的引号
            const cleanSelector = selectorStr.replace(/^['"]|['"]$/g, '');
            
            try {
                // 构造完整的选择器表达式
                const selectorExpression = `Selector${cleanSelector}`;
                console.log('处理后的选择器表达式:', selectorExpression);
                
                // 使用 Function 构造器来创建一个新的函数，该函数可以访问 Selector
                const createSelector = new Function('Selector', `return ${selectorExpression}`);
                
                // 执行函数并传入 Selector
                return createSelector(Selector);
            } catch (error) {
                console.error('选择器处理错误:', error);
                throw new Error(`选择器处理失败: ${cleanSelector}`);
            }
        }),
        description: element.description
    }));
    
    await t.wait(5000);
    
    const results = [];
    // 使用 for...of 循环确保按顺序执行
    for (const element of accessElementsToCheck) {
        for (const selector of element.selector) {
            const exists = await checkElementExists(selector, t);
            const result = {
                description: element.description,
                exists: exists,
                elementSelector: element.selector.toString()
            };
            results.push(result);
            console.log(`${element.description}: ${exists ? '存在' : '未找到'}`);
        }
    }
    
    // 写入结果到文件
    const resultsFilePath = path.join(__dirname, 'results.json');
    writeResultsToFile(results, resultsFilePath);
});

// 导出检查元素函数，以便其他测试文件使用
export { checkElementExists };
