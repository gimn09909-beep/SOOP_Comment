const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForSelector('input[placeholder="게시물 주소 입력"]');

  // Check if dark mode toggle works
  const html = page.locator('html');
  console.log('Initial HTML classes:', await html.getAttribute('class'));
  
  await page.click('button[title="Dark Mode"]');
  await page.waitForTimeout(500);
  console.log('HTML classes after toggle:', await html.getAttribute('class'));

  await browser.close();
  process.exit(0);
})();