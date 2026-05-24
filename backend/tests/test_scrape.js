const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('Navigating to SOOP Live post...');
  await page.goto('https://www.sooplive.com/station/chaenna02/post/196058089');
  
  // Wait for comments to load
  console.log('Waiting for comments...');
  try {
    await page.waitForSelector('.comment_list', { timeout: 10000 });
  } catch (e) {
    console.log('Comment list selector not found, might be different class.');
  }

  // Take a snapshot of the DOM to analyze classes
  const content = await page.content();
  const fs = require('fs');
  fs.writeFileSync('page_source.html', content);
  console.log('Saved page source to page_source.html');

  await browser.close();
})();