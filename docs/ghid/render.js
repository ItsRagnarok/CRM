// HTML → PDF (A4, antet și numere de pagină).
// node render.js                                   → ghid.html → ElectroField-ghid.pdf
// node render.js <intrare.html> <ieșire.pdf> "<titlu antet>" "<ediția>"
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const input = process.argv[2] && process.argv[2].endsWith('.html') ? process.argv[2] : 'ghid.html';
  const out = process.argv[2] && process.argv[2].endsWith('.html') ? process.argv[3] : (process.argv[2] || path.join(__dirname, 'ElectroField-ghid.pdf'));
  const title = process.argv[4] || 'Ghidul platformei';
  const ed = process.argv[5] || '26 noiembrie 2026';
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.join(__dirname, input), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({
    path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font:7px Inter,sans-serif;color:#8a9386;padding:0 16mm;display:flex;justify-content:space-between"><span>ElectroField · ${title}</span><span>Ediția ${ed}</span></div>`,
    footerTemplate: '<div style="width:100%;font:7.5px Inter,sans-serif;color:#8a9386;padding:0 16mm;text-align:right"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  });
  await b.close();
  console.log('PDF:', out);
})();
