# -*- encoding=utf8 -*-
from airtest.core.api import *
from poco.drivers.android.uiautomation import AndroidUiautomationPoco
import sys
import json

# 获取命令行参数
def get_params():
    params = {}
    for arg in sys.argv:
        if '=' in arg:
            key, value = arg.split('=', 1)
            params[key] = value
    return params

# 初始化
auto_setup(__file__)
poco = AndroidUiautomationPoco(use_airtest_input=True)

try:
    # 获取参数
    params = get_params()
    token = params.get('token', '')
    user_id = params.get('userId', '')
    role_type = params.get('roleType', '')
    
    print(f"收到参数: token={token}, userId={user_id}, roleType={role_type}")

    # 启动应用
    start_app("com.your.app.package")
    sleep(3)
    
    # 使用参数进行测试
    if role_type == 'zongbao':
        # 总包特定的测试步骤
        print("执行总包测试流程")
        # ... 测试代码 ...
    elif role_type == 'fenbao':
        # 分包特定的测试步骤
        print("执行分包测试流程")
        # ... 测试代码 ...
    
    # 可以使用token进行API调用
    # 可以使用userId进行用户相关操作
    
    print("测试执行成功")
    
except Exception as e:
    print("测试执行失败:", str(e))
    raise
    
finally:
    stop_app("com.your.app.package") 