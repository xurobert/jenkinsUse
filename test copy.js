import { Selector, RequestLogger } from 'testcafe';

fixture `New Fixture`
    .page `https://test-cms.axzo.cn/`;

// 定义API请求logger
const logger = RequestLogger(/\/yoke\/webApi\/cms\/workspace\/list\/cms\/index/, {
    logRequestHeaders: true,
    logRequestBody: true,
    logResponseHeaders: true,
    logResponseBody: true
});

test('New Test 3', async t => {
    await t
        .click(Selector('#app span').withText('短信登录'))    
        .typeText('#form_item_account', '13980697275')
        .click(Selector('#app span').withText('获取验证码').nth(2))
        .click(Selector('#app button').withText('登录 / 注册'))
        .takeScreenshot({
            path: 'reports/screenshots/login-page.png'
        })

        
    await t
        .expect(Selector('#main-content span').withText('近一年用工趋势'), {
            timeout: 5000  // 设置超时时间为5秒
        }).exists
        .hover(Selector('#main-content span').withText('近一年用工趋势')) // 使用断言验证元素是否存在
        .wait(10000)   
});

// 定义测试套件
fixture `CMS Workspace API Test`
    .requestHooks(logger);

test('Workspace List API Test', async t => {
    // 定义请求配置
    const requestOptions = {
        method: 'POST',
        url: 'https://test-api.axzo.cn/yoke/webApi/cms/workspace/list/cms/index',
        headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJsb2dpblR5cGUiOiJsb2dpbiIsImxvZ2luSWQiOiJOVF9DTVNfV0VCX0dFTkVSQUw6ODk2MDEiLCJyblN0ciI6InV1U2xpWTVBVE5BSkdGTmczNjlqNDZwR0pMV2JTazhNIn0.vnfdKkAVBRk6lS09fBBPqBpnxpkkiMGviiTygOxxrsw',
            'content-type': 'application/json;charset=UTF-8',
            'origin': 'https://test-cms.axzo.cn',
            'ouid': '21',
            'priority': 'u=1, i',
            'terminal': 'NT_CMS_WEB_ENT_ZB'
        },
        body: JSON.stringify({
            filterByCurPerson: false
        })
    };

    try {
        // 发送请求
        const response = await t.request(requestOptions);

        // 验证响应状态码
        await t.expect(response.status).eql(200, 'Response status should be 200');

        // 验证响应内容
        const responseBody = response.body;
        
        // 检查响应体是否为JSON格式
        await t.expect(typeof responseBody).eql('object', 'Response should be JSON');

        // 检查响应中的关键字段
        if (responseBody) {
            // 验证响应中的必要字段
            await t
                .expect(responseBody.hasOwnProperty('code')).ok('Response should have code field')
                .expect(responseBody.hasOwnProperty('data')).ok('Response should have data field')
                .expect(responseBody.hasOwnProperty('msg')).ok('Response should have msg field');

            // 验证响应码
            await t.expect(responseBody.code).eql(0, 'Response code should be 0');

            // 验证message字段
            await t.expect(responseBody.msg).eql('success', 'Message should be "success"');

            // 验证数据内容
            await t.expect(Array.isArray(responseBody.data)).ok('Data should be an array');
        }

        // 检查请求头
        const lastRequest = logger.requests[logger.requests.length - 1];
        if (lastRequest) {
            await t
                .expect(lastRequest.request.headers['content-type']).contains('application/json', 'Content-Type should be application/json')
                .expect(lastRequest.request.headers['authorization']).contains('Bearer', 'Authorization should contain Bearer token');

            // 打印完整的请求和响应日志
            console.log('Test Results:');
            console.log('-------------');
            console.log('Status Code:', response.status);
            console.log('Response Message:', responseBody.msg);
            console.log('Response Code:', responseBody.code);
            console.log('Data is Array:', Array.isArray(responseBody.data));
            console.log('-------------');
        }

    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    }
});

https://oapi.dingtalk.com/robot/send?access_token=7306de9f80aa250d9f0bd2943aacc51aabd3e0e02e69cd7bd0d903fe3a2c8eac