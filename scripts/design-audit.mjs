import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.AUDIT_URL || 'https://pirata.app';
const dir = process.env.AUDIT_DIR || 'qa/audit-before';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${dir}/01-mobile-cruces.png`, fullPage: true });
console.log(await page.locator('body').innerText());
console.log(await page.locator('button').evaluateAll(els => els.map(e => ({text:e.textContent,label:e.getAttribute('aria-label')}))));
await writeFile(`${dir}/initial.txt`, await page.content());
for (const theme of ['light', 'dark']) {
  if (theme === 'dark') await page.getByRole('button', {name:'Activar tema oscuro'}).click();
  for (const vista of ['cruces', 'resultados', 'tablas', 'simular']) {
    await page.locator('.mobile-nav').getByRole('link', {name: {cruces:'Cruces',resultados:'Resultados',tablas:'Tablas',simular:'Simular'}[vista],exact:true}).click();
    await page.waitForTimeout(350);
    await page.screenshot({path:`${dir}/mobile-${vista}-${theme}.png`,fullPage:true});
    console.log(vista, theme, (await page.locator('main').innerText()).slice(0,1400));
    if (vista === 'tablas') {
      await page.getByRole('button',{name:'Anual',exact:true}).click();
      await page.screenshot({path:`${dir}/mobile-anual-${theme}.png`,fullPage:true});
      await page.getByRole('button',{name:'Estadísticas completas',exact:true}).click();
      await page.screenshot({path:`${dir}/mobile-anual-full-${theme}.png`,fullPage:true});
      console.log('table buttons', await page.locator('main button').allTextContents());
    }
  }
}
await page.setViewportSize({width:1440,height:1000});
await page.goto(`${base}/?vista=cruces`,{waitUntil:'networkidle'});
await page.screenshot({path:`${dir}/desktop-dark.png`,fullPage:true});
await page.getByRole('button',{name:'Activar tema claro'}).click();
await page.screenshot({path:`${dir}/desktop-light.png`,fullPage:true});
await page.evaluate(() => { Object.defineProperty(window, 'ClipboardItem', {value:undefined,configurable:true}); });
const download = page.waitForEvent('download');
await page.getByRole('button',{name:'Compartir llave',exact:true}).click();
await (await download).saveAs(`${dir}/share.png`);
await browser.close();
