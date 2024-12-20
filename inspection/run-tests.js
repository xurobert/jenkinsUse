import createTestCafe from 'testcafe';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
    let testcafe = null;

    try {
        // 创建 TestCafe 实例
        testcafe = await createTestCafe('localhost');
        const runner = testcafe.createRunner();

        // 配置测试运行
        const failedCount = await runner
            .src([
                path.join(__dirname, 'inspection_online_cms.js'),
                path.join(__dirname, 'inspection_online_oms.js'),
                path.join(__dirname, 'inspection_online_oms_att.js'),
                path.join(__dirname, 'inspection_online_oms_rec.js'),
                path.join(__dirname, 'inspection_online_oms_salary.js'),
                path.join(__dirname, 'inspection_online_oms_task.js')
            ])
            .browsers('chrome:headless')
            .concurrency(1)  // 一次运行一个测试
            .screenshots({
                path: 'screenshots',
                takeOnFails: true,
                fullPage: true,
                pathPattern: '${DATE}/${TIME}/${BROWSER}/${TEST_INDEX}/${FILE_INDEX}_${FILE_NAME}'
            })
            .run({
                skipJsErrors: true,
                quarantineMode: false,
                selectorTimeout: 50000,
                assertionTimeout: 50000,
                pageLoadTimeout: 50000,
            });

        console.log('测试完成，失败数量:', failedCount);

        if (failedCount > 0) {
            process.exit(1);
        }
    } catch (error) {
        console.error('运行测试时出错:', error);
        process.exit(1);
    } finally {
        if (testcafe) {
            await testcafe.close();
        }
    }
}

// 在 runTests 函数开始处添加
const testFiles = [
    'inspection_online_cms.js',
    'inspection_online_oms.js',
    'inspection_online_oms_att.js',
    'inspection_online_oms_rec.js',
    'inspection_online_oms_salary.js',
    'inspection_online_oms_task.js'
];

testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    console.log(`检查文件 ${file}: ${fs.existsSync(filePath) ? '存在' : '不存在'}`);
});

// 运行测试
runTests(); 