import { Selector } from 'testcafe';

fixture `New Fixture`
    .page `https://test-cms.axzo.cn/`;

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


https://oapi.dingtalk.com/robot/send?access_token=7306de9f80aa250d9f0bd2943aacc51aabd3e0e02e69cd7bd0d903fe3a2c8eac