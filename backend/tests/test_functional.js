const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to local site...');
    await page.goto('http://localhost:5173/');
    
    console.log('Typing URL...');
    await page.fill('input[type="text"]', 'https://www.sooplive.com/station/chaenna02/post/196058089');
    
    console.log('Clicking fetch button...');
    await page.click('button:has-text("조회하기")');
    
    console.log('Waiting for data to load...');
    // Wait for the comment row
    await page.waitForSelector('.group.flex', { timeout: 30000 });
    
    console.log('Verifying content...');
    const commentsCount = await page.locator('.group.flex').count();
    console.log(`Found ${commentsCount} comments.`);
    
    const hasImages = await page.locator('img[loading="lazy"]').count() > 0;
    console.log(`Has images: ${hasImages}`);

    if (commentsCount > 0 && hasImages) {
        console.log('SUCCESS: Application is working correctly!');
    } else {
        console.log('FAILURE: Data not found or incomplete.');
    }

  } catch (e) {
    console.error('Test failed:', e.message);
    const html = await page.content();
    console.log('Current HTML structure snippet:', html.substring(0, 1000));
  } finally {
    await browser.close();
  }
})();