const {chromium}=require('playwright');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{const root=path.resolve(__dirname,'..');const browser=await chromium.launch({channel:process.env.OASIS_BROWSER_CHANNEL||'msedge',headless:true});try{fs.mkdirSync(path.join(root,'docs'),{recursive:true});for(const [name,width,height] of [['desktop',1280,1100],['mobile',390,1000],['tablet',820,1180]]){const page=await browser.newPage({viewport:{width,height},timezoneId:'Europe/Paris'});await page.route('https://**/*',r=>r.abort());await page.goto(pathToFileURL(path.join(root,'examples/demo.html')).href);await page.locator('oasis-flightradar-card').waitFor();await page.screenshot({path:path.join(root,'docs',name+'.png'),fullPage:true});await page.close();}}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
