/**
 * OMS系统权限管理测试脚本
 * 用于测试登录和权限更新功能，以及UI自动化测试
 * 
 * 主要功能：
 * 1. 系统登录获取token
 * 2. 权限管理（清除/添加权限）
 * 3. UI自动化测试（检查元素可见性）
 * 4. 测试结果记录
 */

// UI测试配置
const uiTestConfig = {
    loginAccount: {
        phoneNumber: '15298004026',  // UI测试使用的手机号
        smsCode: '111111'            // 验证码
    },
    // 可以添加其他UI测试相关配置
    waitTime: {
        afterLogin: 5000,            // 登录后等待时间
        afterClick: 1000             // 点击后等待时间
    }
};

// 导入依赖
import { rolesConfig } from './roleConfig.js';
import pkg from 'testcafe';
import createTestCafe from 'testcafe';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { Selector } = pkg;

// 获取当前模块的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 系统登录函数
 * 通过API接口进行录，获取访问令牌
 * 
 * @returns {Promise<Object>} 登录响应数据，包含 accessToken
 * @throws {Error} 登录失败时抛出错误
 */
async function login() {
    try {
        const url = 'https://test-api.axzo.cn/pudge/webApi/oauth/login';
        
        // 设置请求头
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'content-type': 'application/x-www-form-urlencoded'
        };

        // 设置登录参数
        const params = new URLSearchParams({
            'grant_type': 'phone',
            'phoneNumber': '13980697275',  // 测试账号
            'password': 'Aa776655',        // 测试密码
            'terminal': 'plat'
        });

        // 发送登录请求
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: params
        });

        const data = await response.json();
        console.log('登录成功，返回数据：', data);
        return data;

    } catch (error) {
        console.error('登录失败：', error);
        throw error;
    }
}

/**
 * 更新角色权限函数
 * 通过API接口更新指定功能ID的角色权限
 * 
 * @param {string} accessToken - 登录获取的访问令牌
 * @param {number} featureId - 功能ID
 * @param {string} roleType - 角色类型，默认为'zongbao'
 * @returns {Promise<Object>} 权限更新响应数据
 * @throws {Error} 权限更新失败时抛出错误
 */
async function upsertRolePermission(accessToken, featureId, roleType = 'zongbao') {
    try {
        const url = 'https://test-api.axzo.cn/yoke/webApi/oms/rolePermission/role/feature/relation/upsert';
        
        // 设置请求头
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json;charset=UTF-8'
        };

        // 获取角色配置
        const roles = rolesConfig[roleType];
        if (!roles) {
            throw new Error(`未找到角色配置: ${roleType}`);
        }

        // 构建请求数据
        const requestData = {
            "featureId": featureId,
            "roleIds": null,
            "authType": 1,              // 授权类型
            "featureType": 3,           // 功能类型
            "terminal": "NT_CMP_APP_GENERAL",
            "roleIdStrList": null,
            "roles": roles
        };

        // 打印请求信息用于调试
        // console.log('请求URL:', url);
        // console.log('请求Headers:', headers);
        // console.log('请求Body:', JSON.stringify(requestData, null, 2));

        // 发送权限更新请求
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        console.log('权限更新成功，返回数据：', data);
        return data;

    } catch (error) {
        console.error('权限更新失败：', error);
        throw error;
    }
}

/**
 * 检查元素是否存在的辅助函数
 * 
 * @param {Selector} selector - TestCafe选择器
 * @param {TestController} t - TestCafe测试控制器
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>} 元素是否存在
 */
async function checkElementExists(selector, t, timeout = 5000) {
    try {
        await t.expect(selector.exists).ok({ timeout });
        return true;
    } catch (error) {
        console.log(`元素未找到: ${error.message}`);
        return false;
    }
}

/**
 * 获取配置文件路径
 * 支持通过命令行参数指定配置文件路径
 * 
 * @returns {string} 配置文件的完整路径
 */
const getConfigPath = () => {
    const args = process.argv;
    const configArgIndex = args.findIndex(arg => arg.startsWith('--config='));
    if (configArgIndex === -1) {
        return path.join(__dirname, 'config', 'elements.json');
    }
    return args[configArgIndex].split('=')[1];
};

/**
 * 加载配置文件
 * 读取并解析JSON配置文件
 * 
 * @param {string} configPath - 配置文件路径
 * @returns {Object} 解析后的配置对象
 * @throws {Error} 配置文件读取或解析失败时抛出错误
 */
const loadConfig = (configPath) => {
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error(`读取配置文件失败: ${error.message}`);
        throw error;
    }
};

/**
 * 写入测试结果到文件
 * 将测试结果按日期分组追加到JSON文件中
 * 
 * @param {Array} newResults - 新的测试结果数组
 * @param {string} filePath - 结果文件路径
 */
const writeResultsToFile = (newResults, filePath) => {
    try {
        let existingResults = {};
        const currentDate = new Date().toISOString().split('T')[0]; // 获取当前日期 YYYY-MM-DD
        
        // 读取现有结果
        if (fs.existsSync(filePath)) {
            try {
                const fileContent = fs.readFileSync(filePath, 'utf8');
                existingResults = JSON.parse(fileContent);
            } catch (error) {
                console.log(`读取现有结果文件失败，将创建新文件: ${error.message}`);
                existingResults = {};
            }
        }

        // 确保当前日期的数组存在
        if (!existingResults[currentDate]) {
            existingResults[currentDate] = [];
        }

        // 处理新的测试结果
        const processedResults = newResults.map(result => {
            const testsPassed = result.tests.every(test => {
                switch (test.type) {
                    case 'ui_test_no_permission':
                        return test.expectedVisible === false;
                    case 'ui_test_with_permission':
                        return test.expectedVisible === true;
                    case 'clear_permission':
                    case 'add_permission':
                        return test.result?.code === 200;
                    default:
                        return true;
                }
            });

            return {
                description: result.elementDescription,
                featureId: result.featureId,
                testTime: new Date().toISOString(),
                passed: testsPassed,
                details: result.tests.map(test => ({
                    type: test.type,
                    time: test.time,
                    expectedVisible: test.expectedVisible,
                    result: test.result || null
                }))
            };
        });

        // 创建本次测试批次的结果
        const batchResult = {
            batchId: Date.now().toString(),
            testTime: new Date().toISOString(),
            summary: {
                total: processedResults.length,
                passed: processedResults.filter(r => r.passed).length,
                failed: processedResults.filter(r => !r.passed).length
            },
            results: processedResults
        };

        // 添加到当前日期的结果数组中
        existingResults[currentDate].push(batchResult);

        // 写入文件
        fs.writeFileSync(filePath, JSON.stringify(existingResults, null, 2), 'utf8');
        
        // 打印测试摘要
        console.log('\n测试结果摘要:');
        console.log('----------------------------------------');
        console.log(`测试时间: ${batchResult.testTime}`);
        console.log(`总计测试: ${batchResult.summary.total}`);
        console.log(`通过: ${batchResult.summary.passed}`);
        console.log(`失败: ${batchResult.summary.failed}`);
        console.log('----------------------------------------\n');
        
        // 如果有失败的测试，打印详细信息
        const failedTests = processedResults.filter(r => !r.passed);
        if (failedTests.length > 0) {
            console.log('失败的测试详情:');
            failedTests.forEach(test => {
                console.log(`- ${test.description} (FeatureId: ${test.featureId})`);
            });
            console.log('');
        }

    } catch (error) {
        console.error(`写入结果文件失败: ${error.message}`);
        console.error(error.stack);
    }
};

/**
 * 执行UI测试
 */
async function runUITest(configPath, targetElement, shouldExist) {
    console.log('开始运行 UI 测试...');
    const testcafe = await createTestCafe('localhost');
    
    try {
        // 构建选择器的辅助函数
        const buildSelector = (selectorConfig) => {
            if (typeof selectorConfig === 'string') {
                return `Selector('${selectorConfig}')`;
            }
            
            let selector = `Selector('${selectorConfig.base}')`;
            if (selectorConfig.withText) {
                selector += `.withText('${selectorConfig.withText}')`;
            }
            if (typeof selectorConfig.nth === 'number') {
                selector += `.nth(${selectorConfig.nth})`;
            }
            return selector;
        };

        // 生成测试内容
        const testContent = `
            import { Selector } from 'testcafe';
            
            fixture('权限测试')
                .page('https://test-cms.axzo.cn/');
            
            test('测试元素访问权限', async t => {
                // 登录相关元素
                const loginElements = {
                    smsLoginButton: Selector('#app span').withText('短信登录'),
                    phoneInput: Selector('#form_item_account'),
                    getCodeButton: Selector('#app span').withText('获取验证码').nth(2),
                    loginButton: Selector('#app button').withText('登录 / 注册'),
                };

                await t
                    .maximizeWindow()
                    .click(loginElements.smsLoginButton)
                    .typeText(loginElements.phoneInput, '${uiTestConfig.loginAccount.phoneNumber}')
                    .click(loginElements.getCodeButton)
                    .wait(${uiTestConfig.waitTime.afterClick})
                    .click(loginElements.loginButton)
                    .wait(${uiTestConfig.waitTime.afterLogin});
                
                ${targetElement.needClick ? `
                    // 需要先点击其他元素
                    const clickElement = ${buildSelector(targetElement.needClick.selector)};
                    await t.expect(clickElement.exists).ok('点击目标元素不存在');
                    await t.click(clickElement).wait(1000);
                ` : '// 无需点击其他元素'}
                
                const elementToCheck = ${buildSelector(targetElement.selector)};
                
                // 检查元素是否存在且是否显示
                const exists = await elementToCheck.exists;
                const isHidden = exists ? await elementToCheck.getStyleProperty('display') === 'none' : true;
                
                // 打印期望的显示结果
                console.log('期望的显示结果:', ${shouldExist});
                
                if (${shouldExist}) {
                    await t.expect(exists).ok('${targetElement.description} 应该存在，但未找到');
                    await t.expect(isHidden).notOk('${targetElement.description} 存在但被隐藏了');
                } else {
                    await t.expect(exists && !isHidden).notOk('${targetElement.description} 不应该可见，但是可见的');
                }
            });
        `;

        // 创建临时测试文件
        const testFilePath = path.join(__dirname, 'temp-test.js');

        // 写入测试文件
        fs.writeFileSync(testFilePath, testContent, 'utf8');

        const runner = testcafe.createRunner();
        
        // 运行测试文件
        await runner
            .browsers(['chrome'])
            .src(testFilePath)
            .run();

        // 清理临时测试文件
        fs.unlinkSync(testFilePath);

    } finally {
        await testcafe.close();
    }
    console.log('UI 测试完成');
}

/**
 * 主程序入口
 * 执行完整的测试流程：
 * 1. 系统登录
 * 2. 遍历测试元素
 * 3. 执行权限测试
 * 4. 记录测试结果
 */
async function main() {
    console.log('开始执行主程序...');
    parseArgs();  // 解析命令行参数
    console.log(`UI测试使用手机号: ${uiTestConfig.loginAccount.phoneNumber}`);
    
    const testResults = [];  // 创建数组存储所有测试结果
    
    try {
        console.log('开始API测试流程...');
        const loginData = await login();
        
        if (loginData && loginData.data && loginData.data.accessToken) {
            console.log('登录成功，开始更新权限并测试...');
            const configPath = getConfigPath();
            console.log('配置文件路径:', configPath);
            const elements = loadConfig(configPath);
            
            for (const element of elements.accessElements) {
                const elementResults = {
                    elementDescription: element.description,
                    featureId: element.featureId,
                    tests: []
                };
                
                try {
                    // 清除权限测试
                    const clearResult = await upsertRolePermission(
                        loginData.data.accessToken,
                        element.featureId,
                        'clear'
                    );
                    elementResults.tests.push({
                        type: 'clear_permission',
                        time: new Date().toISOString(),
                        result: clearResult
                    });

                    // 无权限UI测试
                    await runUITest(configPath, element, false);
                    elementResults.tests.push({
                        type: 'ui_test_no_permission',
                        time: new Date().toISOString(),
                        expectedVisible: false
                    });

                    // 添加权限测试
                    const addResult = await upsertRolePermission(
                        loginData.data.accessToken,
                        element.featureId,
                        element.defaultRole
                    );
                    elementResults.tests.push({
                        type: 'add_permission',
                        time: new Date().toISOString(),
                        result: addResult
                    });

                    // 有权限UI测试
                    await runUITest(configPath, element, true);
                    elementResults.tests.push({
                        type: 'ui_test_with_permission',
                        time: new Date().toISOString(),
                        expectedVisible: true
                    });

                } catch (error) {
                    console.error(`测试元素失败: ${element.description}`, error);
                    elementResults.tests.push({
                        type: 'error',
                        time: new Date().toISOString(),
                        error: error.message
                    });
                }

                testResults.push(elementResults);
            }

            // 将结果写入文件
            const resultsPath = path.join(__dirname, 'test-results.json');
            writeResultsToFile(testResults, resultsPath);
            
        } else {
            console.error('登录响应中没有accessToken:', loginData);
            testResults.push({
                error: 'Login failed',
                loginData: loginData
            });
        }
    } catch (error) {
        console.error('执行过程出错：', error);
        testResults.push({
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString()
        });
    }
    console.log('主程序执行完毕。');
}

// 支持命令行参数覆盖配置
const parseArgs = () => {
    const args = process.argv.slice(2);
    args.forEach(arg => {
        if (arg.startsWith('--ui-phone=')) {
            uiTestConfig.loginAccount.phoneNumber = arg.split('=')[1];
        }
    });
};

// 启动主程序并处理错误
main().catch(error => {
    console.error('程序执行失败：', error);
    process.exit(1);
});

console.log('开始执行脚本...');
const configPath = getConfigPath();
console.log('使用的配置文件路径:', configPath);
