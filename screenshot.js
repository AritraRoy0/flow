const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  
  await page.screenshot({ path: 'C:/Users/royma/AppData/Local/Temp/claude/c--Users-royma-flow/ddabe160-0b60-4bea-9370-2746c2a9fdfb/scratchpad/light-bw.png' });
  
  // Toggle to dark theme
  await page.click('button[aria-label="Toggle theme"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'C:/Users/royma/AppData/Local/Temp/claude/c--Users-royma-flow/ddabe160-0b60-4bea-9370-2746c2a9fdfb/scratchpad/dark-bw.png' });
  
  await browser.close();
  console.log('Screenshots taken');
})();
