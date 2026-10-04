// Contrôle de rendu local : données fictives, réseau et services HA interdits.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.OASIS_BROWSER_CHANNEL||'msedge'});
  try{
    for(const[language,width]of [['hu',390],['hi',820],['ar',1280],['ur',390],['zh-Hans',390],['bn',390]]){
      const page=await browser.newPage({viewport:{width,height:1000},timezoneId:'Europe/Paris'});
      await page.route('**/*',route=>route.abort());
      await page.setContent('<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:8px;background:#11110f"></body></html>');
      await page.addScriptTag({content:fs.readFileSync(path.join(root,'dist/oasis-flightradar-card.js'),'utf8')});
      await page.addScriptTag({content:fs.readFileSync(path.join(root,'tests/fixture.js'),'utf8')});
      await page.waitForFunction(()=>document.querySelector('oasis-flightradar-card')?._rendered);
      await page.evaluate(language=>{const card=document.querySelector('oasis-flightradar-card');card.hass={...mockHass,locale:{language}};},language);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,language+' : débordement de page');
      const output=path.resolve(root,'../Rapport/oasis-i18n-'+language+'-'+width+'.png');
      await page.screenshot({path:output,fullPage:true});
      await page.locator('oasis-fr24-internal-selector .launch').click();
      assert.equal(await page.locator('oasis-fr24-internal-selector dialog').evaluate(n=>n.getBoundingClientRect().right<=innerWidth),true);
      assert.equal(await page.evaluate(()=>mockCalls.length),0);
      await page.close();console.log(language+' : rendu '+width+'px vérifié ; '+output);
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
