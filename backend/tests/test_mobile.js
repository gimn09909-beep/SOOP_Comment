const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to mobile URL...');
  await page.goto('https://m.sooplive.com/station/chaenna02/post/196058089', { waitUntil: 'networkidle' });
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api')) {
      console.log('Mobile API:', url);
    }
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(5000);

  await browser.close();
})();