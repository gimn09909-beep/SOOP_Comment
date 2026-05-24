const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const testUrl = 'https://www.sooplive.com/station/chaenna02/post/196058089';
  
  try {
    console.log('--- E2E Test Started ---');
    console.log('1. Navigating to http://localhost:5001');
    await page.goto('http://localhost:5001', { waitUntil: 'networkidle', timeout: 60000 });
    
    const title = await page.title();
    console.log(`Page Title: ${title}`);

    console.log('2. Entering SOOP URL');
    const input = page.locator('input[placeholder*="주소"], input[type="text"]');
    await input.waitFor({ state: 'visible' });
    await input.fill(testUrl);
    
    console.log('3. Clicking Fetch Button');
    // Using a more reliable text pattern and allowing for partial matches
    const fetchButton = page.locator('button:has-text("조회"), button:has-text("Ranking"), button:has(svg.lucide-trending-up)');
    await fetchButton.first().click();
    
    console.log('4. Waiting for loading state and data');
    // The skeleton loader might appear first.
    // We wait for the actual comment items which have '.group.flex'
    await page.waitForSelector('.group.flex', { timeout: 60000 });
    
    console.log('5. Verifying Comments');
    const count = await page.locator('.group.flex').count();
    console.log(`Comments found: ${count}`);
    
    if (count === 0) throw new Error('No comments rendered');

    console.log('6. Testing Search/Filter');
    // The search input in the header has placeholder "조회된 게시물 검색"
    const searchInput = page.locator('header input[placeholder*="검색"]');
    if (await searchInput.isVisible()) {
        await searchInput.fill('채나'); 
        await page.waitForTimeout(1000); 
        const filteredCount = await page.locator('.group.flex').count();
        console.log(`Filtered comments count: ${filteredCount}`);
    }

    console.log('--- E2E Test Passed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('--- E2E Test Failed ---');
    console.error(err);
    await page.screenshot({ path: 'e2e-failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
