const { chromium } = require('playwright');

// 定义要搜索的关键字数组
const searchKeywords = ['playwright', '爬虫','自动化'];
// const searchKeywords = ['playwright'];
// 主函数：遍历关键字并执行搜索播放逻辑
async function searchAndPlayVideos() {
    // 启动浏览器（headless: false 表示显示浏览器窗口，方便调试）

    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Windows示例，其他系统需修改

    const browser = await chromium.launch({
        headless: false,
        executablePath: chromePath, // 关键：指定系统Chrome路径 //Playwright 自带的 chromium 是纯净开源版，不含 H.264/AAC 专利解码器，所以 MP4、直播流直接黑屏？
        args: [
            //Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
            '--window-size=1280,720',
            '--disable-blink-features=AutomationControlled' // 规避自动化检测
        ]
    });
    const page = await browser.newPage();// 创建新页面
    await page.setViewportSize({ width: 1280, height: 720 });// 设置页面视图大小，模拟正常浏览器窗口
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    }); //隐藏
    try {
        // 遍历所有关键字
        for (const keyword of searchKeywords) {
            console.log(`\n开始搜索关键字：${keyword}`);
            // 1. 打开B站首页
            await page.goto('https://www.bilibili.com/', {
                // waitUntil: 'networkidle'  //等待页面网络活动达到 “空闲状态” 后再继续执行后续代码。
                waitUntil: 'domcontentloaded'  // DOM加载完成后即可操作，无需等待所有网络请求
            });
            await page.waitForSelector('.nav-search-input', { timeout: 5000 });
            await page.fill('.nav-search-input', keyword); //搜索
            // await page.click('.nav-search-btn'); //点击搜索

            // 3. 点击搜索按钮，同时监听新标签页（关键修复）
            console.log('点击搜索按钮，等待结果页...');
            const [searchResultPage] = await Promise.all([
                page.waitForEvent('popup'), // 等待新标签页弹出
                page.click('.nav-search-btn') // 触发搜索（会打开新页）
            ]);

            // 4. 在新标签页中等待视频列表加载
            await searchResultPage.waitForSelector('.bili-video-card', {
                timeout: 10000,
                state: 'visible'
            });
            console.log('搜索结果页加载完成，开始提取视频链接...');
            //这里会跳到新的标签页，下面的内容当然就搜不到了？看这里怎么改
            const videoLinks = await searchResultPage.$$eval(
                '.bili-video-card a[href*="video"]', // 直接定位视频链接元素
                (links) => links
                    .map(link => link.href) // 提取href
                    .filter(href => href.includes('bilibili.com/video/')) // 确保是视频链接
            );

            console.log(`关键字「${keyword}」找到 ${videoLinks.length} 个视频：`);
            videoLinks.forEach((link, index) => {
                console.log(`${index + 1}. ${link}`);
            });
            await searchResultPage.close();

        }
    } catch (err) {
        console.error('执行过程出错：', err);
    } finally {
        // 关闭浏览器
        // await browser.close();
    }
}

// 执行脚本
searchAndPlayVideos();