const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 2000 });
  
  console.log('Navigating...');
  await page.goto('https://www.sooplive.com/station/chaenna02/post/196058089', { waitUntil: 'networkidle' });
  
  console.log('Scrolling...');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  console.log('Screenshot saved to screenshot.png');

  await browser.close();
})();