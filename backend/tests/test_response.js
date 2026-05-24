const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('api-channel.sooplive.com')) {
      console.log('API Response:', url);
      try {
        const text = await response.text();
        console.log('Body snippet:', text.substring(0, 500));
      } catch (e) {
        console.log('Could not read body');
      }
    }
  });

  console.log('Navigating to SOOP Live post...');
  await page.goto('https://www.sooplive.com/station/chaenna02/post/196058089', { waitUntil: 'networkidle' });
  
  // Scroll down to trigger comment loading if lazy
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(5000);

  await browser.close();
})();