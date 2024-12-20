
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
                    .typeText(loginElements.phoneInput, '15298004026')
                    .click(loginElements.getCodeButton)
                    .wait(1000)
                    .click(loginElements.loginButton)
                    .wait(5000);
                
                // 无需点击其他元素
                
                const elementToCheck = Selector('#main-content div').withText('发薪').nth(4);
                
                // 检查元素是否存在且是否显示
                const exists = await elementToCheck.exists;
                const isHidden = exists ? await elementToCheck.getStyleProperty('display') === 'none' : true;
                
                // 打印期望的显示结果
                console.log('期望的显示结果:', true);
                
                if (true) {
                    await t.expect(exists).ok('数据访问权限元素 发薪 应该存在，但未找到');
                    await t.expect(isHidden).notOk('数据访问权限元素 发薪 存在但被隐藏了');
                } else {
                    await t.expect(exists && !isHidden).notOk('数据访问权限元素 发薪 不应该可见，但是可见的');
                }
            });
        