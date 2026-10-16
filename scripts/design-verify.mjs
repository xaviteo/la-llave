import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.AUDIT_URL || 'http://localhost:8080';
const dir = process.env.AUDIT_DIR || 'qa/verification';
await mkdir(dir, {recursive:true});
const browser = await chromium.launch();
const checks = [];
const errors = [];
for (const width of [320, 360, 390, 768, 1024, 1440]) {
  const page = await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});
  assert.equal(await page.locator('.bracket-scroll').isVisible(), true, 'initial view must be the bracket');
  assert.equal(await page.locator('.colophon').innerText(), 'Creado por JJCAB');
  assert.notEqual(await page.locator('.share-llave').evaluate(el=>getComputedStyle(el,'::after').animationName), 'none');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('.share-llave').evaluate(el=>getComputedStyle(el,'::after').animationName), 'none');
  await page.emulateMedia({reducedMotion:'no-preference'});
  for (const theme of ['light','dark']) {
    if (theme === 'dark') await page.getByRole('button',{name:'Activar tema oscuro'}).click();
    for (const vista of ['cruces','resultados','tablas','simular']) {
      const nav = page.locator(width < 768 ? '.mobile-nav' : '.primary-nav');
      await nav.getByRole('link',{name:{cruces:'Cruces',resultados:'Resultados',tablas:'Tablas',simular:'Simular'}[vista],exact:true}).click();
      const sizes = await page.evaluate(() => {
        const a = document.querySelector('.wordmark').getBoundingClientRect();
        const b = document.querySelector('.header-tools').getBoundingClientRect();
        return {overflow: document.documentElement.scrollWidth > innerWidth,aligned:Math.abs((a.top+a.height/2)-(b.top+b.height/2))<2,overlap:a.right>b.left};
      });
      assert.equal(sizes.overflow,false,`${width}/${theme}/${vista} overflow`);
      assert.equal(sizes.aligned,true,`${width}/${theme} header wraps`);
      assert.equal(sizes.overlap,false,`${width}/${theme} header overlaps`);
      if (vista === 'tablas') {
        if(width<1200) await page.getByRole('button',{name:'Anual',exact:true}).click();
        await page.getByRole('button',{name:'Estadísticas completas',exact:true}).click();
        const table = page.locator('.annual-block .table-scroll');
        await table.evaluate(el=>{el.scrollLeft=el.scrollWidth});
        const cell = await table.locator('tbody .team-col-sticky').first().boundingBox();
        const box = await table.boundingBox();
        assert.ok(cell.width <= 205, `sticky column too wide: ${cell.width}`);
        const hasScroll = await table.evaluate(el=>el.scrollWidth>el.clientWidth);
        if(hasScroll) assert.ok(Math.abs(cell.x-box.x)<3, `${width}/${theme}: team column does not stick (${cell.x}, ${box.x})`);
        if(width===390) await page.screenshot({path:`${dir}/annual-scrolled-${theme}.png`});
      }
      if(width===390 && vista==='simular') {
        const inputs=page.locator('input.score-input');
        await inputs.nth(0).fill('2');
        await inputs.nth(1).fill('1');
        assert.ok((await page.locator('main').innerText()).includes(`1 de ${await inputs.count()/2} completados`));
        await inputs.nth(0).fill('');
        await inputs.nth(1).fill('');
      }
      checks.push({width,theme,vista,passed:true});
    }
  }
  await page.close();
}
assert.deepEqual(errors,[]);
await writeFile(`${dir}/checks.json`,JSON.stringify({base,checks,errors},null,2));
await browser.close();
console.log(`${checks.length} viewport/theme/view checks passed; table scroll and simulation passed; no page errors.`);
