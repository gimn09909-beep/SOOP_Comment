const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to legacy URL...');
  await page.goto('https://bj.afreecatv.com/chaenna02/post/196058089', { waitUntil: 'networkidle' });
  
  console.log('Final URL:', page.url());
  console.log('Title:', await page.title());

  await browser.close();
})();