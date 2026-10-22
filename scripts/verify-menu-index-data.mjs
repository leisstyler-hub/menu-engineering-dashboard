import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const manifest=JSON.parse(readFileSync('src/data/menuIndexManifest20261022.json','utf8'));
const key=r=>JSON.stringify([r.menu,r.mrn,r.portion,r.station,r.menuItemNotes,r.price]);
export function verifyIndexMenu(rows,menu) {
 const expected=manifest.memberships.filter(r=>!menu||r.menu===menu);const actual=rows.filter(r=>!menu||r.menu===menu);
 assert.equal(actual.length,expected.length,`${menu||'All menus'} membership count`);const byKey=new Map(actual.map(r=>[key(r),r]));assert.equal(byKey.size,actual.length,'Duplicate menu/recipe/portion/station');
 for(const e of expected){const a=byKey.get(key(e));assert.ok(a,`Missing source membership ${key(e)}`);for(const f of ['portionOz','price','trueCost'])assert.equal(a[f]??null,e[f]??null,`${key(e)} ${f}`);assert.equal(typeof a.mrn,'string');}
 console.log(`Approved October 22 index verified: ${expected.length} memberships for ${menu||'all menus'}.`);
}
if(process.argv[1]?.endsWith('verify-menu-index-data.mjs')){const d=JSON.parse(readFileSync(process.argv[2]||'src/data/menuItems.json','utf8'));verifyIndexMenu(d.rows||d)};
