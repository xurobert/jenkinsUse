/**
 * OMS系统APP测试脚本
 * 集成API测试和Airtest自动化测试
 */

import { rolesConfig } from './roleConfig.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

// 将exec转换为Promise形式
const execPromise = promisify(exec);

/**
 * 系统登录
 * @returns {Promise<Object>} 登录响应数据，包含 accessToken
 */
async function login() {
    try {
        const url = 'https://test-api.axzo.cn/pudge/webApi/oauth/login';
        
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'content-type': 'application/x-www-form-urlencoded'
        };

        const params = new URLSearchParams({
            'grant_type': 'phone',
            'phoneNumber': '13980697275',
            'password': 'Aa776655',
            'terminal': 'plat'
        });

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
 * 更新角色权限
 * @param {string} accessToken - 登录获取的访问令牌
 * @param {number} featureId - 功能ID
 * @param {string} roleType - 角色类型
 */
async function upsertRolePermission(accessToken, featureId, roleType = 'zongbao') {
    try {
        const url = 'https://test-api.axzo.cn/yoke/webApi/oms/rolePermission/role/feature/relation/upsert';
        
        const headers = {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'authorization': `Bearer ${accessToken}`,
            'content-type': 'application/json;charset=UTF-8'
        };

        const roles = rolesConfig[roleType];
        if (!roles) {
            throw new Error(`未找到角色配置: ${roleType}`);
        }

        const requestData = {
            "featureId": featureId,
            "roleIds": null,
            "authType": 1,
            "featureType": 3,
            "terminal": "NT_CMP_APP_GENERAL",
            "roleIdStrList": null,
            "roles": roles
        };

        console.log('请求URL:', url);
        console.log('请求Headers:', headers);
        console.log('请求Body:', JSON.stringify(requestData, null, 2));

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
 * 执行Airtest自动化测试
 * @param {string} scriptPath - Airtest脚本路径
 * @param {Object} options - 测试配置选项
 * @param {Object} testParams - 传递给Airtest脚本的参数
 */
async function runAirtestTest(scriptPath, options = {}, testParams = {}) {
    try {
        const airtestPath = path.resolve(scriptPath);
        const logDir = path.resolve('./log');

        // 将参数转换为命令行参数格式
        const paramsString = Object.entries(testParams)
            .map(([key, value]) => `--args "${key}=${value}"`)
            .join(' ');

        // 构建完整的命令，包含参数
        const command = `python -m airtest run ${airtestPath} `
            + `--log ${logDir} `
            + `--device Android:///${options.deviceId || ''} `
            + `--recording ${options.recording || false} `
            + paramsString;  // 添加参数

        console.log('执行Airtest命令:', command);

        const { stdout, stderr } = await execPromise(command);
        
        if (stdout) console.log('Airtest输出:', stdout);
        if (stderr) console.error('Airtest错误:', stderr);

        const reportCommand = `python -m airtest report ${airtestPath} --log_root ${logDir} --outfile ${logDir}/report.html`;
        await execPromise(reportCommand);
        
        console.log('Airtest测试完成，报告已生成');

    } catch (error) {
        console.error('Airtest测试执行失败:', error);
        throw error;
    }
}

/**
 * 主程序入口
 */
async function main() {
    try {
        // 1. 执行API测试
        console.log('开始API测试流程...');
        const loginData = await login();
        
        if (loginData && loginData.data && loginData.data.accessToken) {
            console.log('登录成功，开始更新权限...');
            const result = await upsertRolePermission(
                loginData.data.accessToken,
                102659,
                'zongbao'
            );
            console.log('权限更新完成，结果：', result);

            // 2. 执行Airtest自动化测试，传入参数
            console.log('开始执行Airtest自动化测试...');
            await runAirtestTest(
                './test_cases/oms_test.air',
                {
                    deviceId: 'your_device_id',
                    recording: true
                },
                {
                    // 传递给Airtest脚本的参数
                    token: loginData.data.accessToken,
                    userId: '90003999',
                    roleType: 'zongbao',
                    // 可以添加更多参数...
                }
            );
            
        } else {
            console.error('登录响应中没有accessToken:', loginData);
        }
    } catch (error) {
        console.error('执行过程出错：', error);
        process.exit(1);
    }
}

// 执行主程序
main().catch(error => {
    console.error('程序执行失败：', error);
    process.exit(1);
}); 