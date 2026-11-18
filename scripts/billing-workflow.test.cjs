const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const ts=require('typescript');const path=require('node:path');
// Compile only TypeScript under this feature; no server or hosted credentials required.
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,filename);
const {preview,money}=require('../src/lib/billing/money.ts');
const {authorize,issueOblio,fiscalJson,safeOblioUrl,OblioError}=require('../src/lib/billing/oblio.ts');
const {invoicePdf}=require('../src/lib/billing/pdf.ts');
test('exact fiscal arithmetic: mockup, fractions, negative credit and large values',()=>{
 assert.deepEqual(preview([{quantity:'1',price:'850',vat:'21'},{quantity:'1',price:'100',vat:'21'}]),{subtotal:'950.00',vat:'199.50',total:'1149.50'});
 assert.deepEqual(preview([{quantity:'3',price:'0.335',vat:'21'}]),{subtotal:'1.01',vat:'0.21',total:'1.22'});
 assert.deepEqual(preview([{quantity:'-3',price:'0.335',vat:'21'}]),{subtotal:'-1.01',vat:'-0.21',total:'-1.22'});
 assert.equal(money('9999999999999999.99'),'9.999.999.999.999.999,99 lei');
 assert.throws(()=>preview([{quantity:'1',price:'NaN',vat:'21'}]));
});
test('Oblio protocol: form auth, exact JSON, refusal inside HTTP 200, safe links',async()=>{
 const original=global.fetch;let count=0;const payload={idempotencyKey:'fixed-request-key',products:[{name:'Montaj',price:'9999999999.9999',quantity:'0.1234',vatPercentage:'21.00',vatIncluded:0}]};
 try{
 global.fetch=async(url,init)=>{count++;assert.equal(url,'https://www.oblio.eu/api/authorize/token');assert.equal(init.headers['Content-Type'],'application/x-www-form-urlencoded');assert.equal(new URLSearchParams(init.body).get('client_secret'),'test-only-secret');return Response.json({access_token:'test-token'});};
 assert.equal(await authorize('test@example.ro','test-only-secret'),'test-token');
 assert.match(fiscalJson(payload),/"price":9999999999\.9999/);
 const bodies=[];global.fetch=async(url,init)=>{assert.equal(url,'https://www.oblio.eu/api/docs/invoice');bodies.push(init.body);return Response.json({status:200,data:{seriesName:'FCT',number:'0043',link:'https://www.oblio.eu/utils/show_file/?id=43'}});};
 assert.equal((await issueOblio('test-token','invoice',payload)).number,'0043');await issueOblio('test-token','invoice',payload);assert.equal(bodies[0],bodies[1]);
 global.fetch=async()=>Response.json({status:400,statusMessage:'Date incorecte'});
 await assert.rejects(issueOblio('test-token','invoice',payload),e=>e instanceof OblioError&&e.rejected);
 global.fetch=async()=>Response.json({status:400,statusMessage:'Duplicate idempotency key'});
 await assert.rejects(issueOblio('test-token','invoice',payload),e=>e instanceof OblioError&&!e.rejected&&e.uncertain);
 global.fetch=async()=>{throw new Error('network failure');};await assert.rejects(issueOblio('test-token','invoice',payload),e=>e.uncertain&&!e.rejected);
 assert.equal(count,1);assert.equal(safeOblioUrl('https://evil.test/utils/show_file/?id=1'),null);assert.equal(safeOblioUrl('javascript:alert(1)'),null);assert.equal(safeOblioUrl('https://www.oblio.eu@evil.test/utils/show_file/'),null);
 }finally{global.fetch=original;}
});
test('PDF includes Romanian fonts and paginates long invoices',async()=>{
 const d={document_type:'invoice',provider_series:'FCT',provider_number:'0043',issue_date:'2026-11-18',due_date:'2026-11-25',company:{name:'Emitent Știință SRL',cui:'RO123',address:'București'},client:{name:'Client Țară SRL',cui:'RO456',address:'Brașov'},lines:Array.from({length:60},(_,i)=>({name:'Montaj tablou electric și deplasare '+i,unit:'buc',quantity:'1.0000',unit_price:'100.0000',vat_rate:'21.00',net_amount:'100.00',vat_amount:'21.00'})),subtotal:'6000.00',vat_total:'1260.00',total:'7260.00'};
 const pdf=await invoicePdf(d);assert.equal(pdf.subarray(0,4).toString(),'%PDF');assert.ok(pdf.length>20000);fs.writeFileSync('/tmp/billing-unit-invoice.pdf',pdf);assert.ok((pdf.toString('latin1').match(/\/Type \/Page\b/g)||[]).length>=2);
});
