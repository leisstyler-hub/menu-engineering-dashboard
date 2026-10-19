import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'wp-import-synthetic-'));
const source=join(dir,'source.pdf');writeFileSync(source,'Synthetic test source only');
const sha=createHash('sha256').update(readFileSync(source)).digest('hex');
const input=join(dir,'reviewed.json');
const data={concept:'AMZ: Andes',source_sha256:sha,importedByVerifiedIdentity:'synthetic-reviewer',variants:[{variant_key:'rice',mrn:'0001.0100',recipe_name:'Synthetic Rice',serving_size_text:'4 oz',serving_mass_oz:4,serving_cost:0,source_pages:[1],reconciliation_status:'validated',components:[]}]};
function run(value,name){writeFileSync(input,JSON.stringify(value));const output=join(dir,name+'.sql');const result=spawnSync(process.execPath,[new URL('./prepare-private-recipe-import.mjs',import.meta.url).pathname.replace(/^\/(?=[A-Za-z]:)/,''),input,source,output],{encoding:'utf8'});return {result,output};}
let {result,output}=run(data,'valid');assert.equal(result.status,0,result.stderr);let sql=readFileSync(output,'utf8');assert.ok(sql.includes('0001.0100'));assert.ok(sql.includes(sha));assert.ok(!sql.includes('is_active=true'));assert.match(sql,/begin;/);
for(const [name,value] of [['unreviewed',{...data,variants:[{...data.variants[0],reconciliation_status:'needs-review'}]}],['wrong-source',{...data,source_sha256:'bad'}],['numeric-mrn',{...data,variants:[{...data.variants[0],mrn:1.01}]}],['wrong-mass',{...data,variants:[{...data.variants[0],serving_mass_oz:8}]}]]){const check=run(value,name);assert.notEqual(check.result.status,0);assert.equal(existsSync(check.output),false);}
console.log('Inactive import preparation, exact MRN, source hash binding and rejection of unreviewed/conflicting inputs passed.');
