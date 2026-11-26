// ghid.html → ElectroField-ghid.pdf (A4, antet și numere de pagină)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, 'ghid.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const out = process.argv[2] || path.join(__dirname, 'ElectroField-ghid.pdf');
  await p.pdf({
    path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="width:100%;font:7px Inter,sans-serif;color:#8a9386;padding:0 16mm;display:flex;justify-content:space-between"><span>ElectroField · Ghidul platformei</span><span>Ediția 26 noiembrie 2026</span></div>',
    footerTemplate: '<div style="width:100%;font:7.5px Inter,sans-serif;color:#8a9386;padding:0 16mm;text-align:right"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  await b.close();
  console.log('PDF:', out);
})();
