const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('request', request => {
    if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      console.log('API Call:', request.url());
    }
  });

  console.log('Navigating to SOOP Live post...');
  await page.goto('https://www.sooplive.com/station/chaenna02/post/196058089', { waitUntil: 'networkidle' });
  
  // Wait a bit more for all APIs
  await page.waitForTimeout(5000);

  await browser.close();
})();