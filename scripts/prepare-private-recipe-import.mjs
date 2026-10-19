// Local preparation only: never contacts Supabase. Input/output must stay outside Git/public assets.
import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import { resolve, relative, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { portionWeightOz } from '../src/features/menu-engineering/weighPayModel.js';
const [input, sourcePdf, output] = process.argv.slice(2);
if (!input || !sourcePdf || !output) throw new Error('Usage: node scripts/prepare-private-recipe-import.mjs <reviewed.json> <source.pdf> <private-output.sql>');
const repo = realpathSync(new URL('..', import.meta.url));
const insideRepo = path => { const canonical=path===output?resolve(realpathSync(dirname(resolve(path))),basename(path)):realpathSync(path); const rel=relative(repo,canonical); return !rel.startsWith('..') && !rel.includes(':'); };
if ([input,sourcePdf,output].some(insideRepo)) throw new Error('Private files must remain outside this repository.');
const data=JSON.parse(readFileSync(input,'utf8'));
if (data.concept !== 'AMZ: Andes' || !data.importedByVerifiedIdentity || !Array.isArray(data.variants) || !data.variants.length) throw new Error('Reviewed Andes variants and importing identity required.');
const sha=createHash('sha256').update(readFileSync(sourcePdf)).digest('hex');
if(data.source_sha256!==sha)throw new Error('Reviewed source hash does not match the supplied PDF.');
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const ids=new Set();
for(const v of data.variants){
 if(typeof v.mrn!=='string'||!v.mrn||!v.variant_key||ids.has(v.variant_key)||!v.recipe_name||!v.serving_size_text||!v.source_pages?.every(p=>Number.isInteger(p)&&p>0)||!v.source_pages.length)throw new Error('Missing provenance/identity or duplicate variant.');
 if(v.reconciliation_status!=='validated'||typeof v.serving_cost!=='number'||!Number.isFinite(v.serving_cost)||v.serving_cost<0)throw new Error('Serving basis and cost must be reviewed.');
 if(v.serving_mass_oz!=null && (!(v.serving_mass_oz>0)||!Number.isFinite(v.serving_mass_oz)))throw new Error('Invalid mass.');
 const parsed=portionWeightOz({portion:v.serving_size_text});
 if(v.serving_mass_oz!=null && parsed!=null && Math.abs(parsed-v.serving_mass_oz)>.001)throw new Error('Serving mass conflicts with stated size.');
 ids.add(v.variant_key);
}
for(const v of data.variants){
 const positions=new Set();
 for(const c of v.components||[]){
  if(c.requires_review)throw new Error('Component reconciliation is incomplete.');
  if(typeof c.component_mrn!=='string'||!c.component_name||!c.source_quantity_text||!Number.isInteger(c.source_page)||!v.source_pages.includes(c.source_page)||!Number.isInteger(c.position)||positions.has(c.position))throw new Error('Component identity, usage or page provenance needs review.');
  positions.add(c.position);
  if(c.child_variant_key&&(!ids.has(c.child_variant_key)||c.child_variant_key===v.variant_key))throw new Error('Missing or self-referencing child variant.');
 }
}

const payload=quote(JSON.stringify(data));
const delimiter='$import_'+createHash('sha256').update(payload).digest('hex').slice(0,20)+'$';
const sql=`-- PRIVATE. Reviewed import preparation only; inactive by default.\n-- Source SHA-256: ${sha}\nbegin;\ndo ${delimiter}\ndeclare batch uuid; rec jsonb; parent_id uuid; child_id uuid; edge jsonb;\nbegin\ninsert into culinary_private.recipe_import_batches(source_sha256,source_file_name,concept,imported_by_verified_identity) values (${quote(sha)},${quote('Andes recipe source.pdf')},'AMZ: Andes',${quote(data.importedByVerifiedIdentity)}) returning id into batch;\nfor rec in select * from jsonb_array_elements(${payload}::jsonb->'variants') loop\ninsert into culinary_private.recipe_variants(batch_id,mrn,recipe_name,revision_label,category,variant_key,serving_size_text,serving_mass_oz,serving_cost,batch_servings,source_pages,reconciliation_status,private_source_payload) values (batch,rec->>'mrn',rec->>'recipe_name',rec->>'revision_label',coalesce(rec->>'category',''),rec->>'variant_key',rec->>'serving_size_text',(rec->>'serving_mass_oz')::numeric,(rec->>'serving_cost')::numeric,(rec->>'batch_servings')::numeric,array(select jsonb_array_elements_text(rec->'source_pages')::integer),'validated',coalesce(rec->'private_source_payload','{}'::jsonb));\nend loop;\nfor rec in select * from jsonb_array_elements(${payload}::jsonb->'variants') loop\nselect id into parent_id from culinary_private.recipe_variants where batch_id=batch and variant_key=rec->>'variant_key';\nfor edge in select * from jsonb_array_elements(coalesce(rec->'components','[]'::jsonb)) loop\nselect id into child_id from culinary_private.recipe_variants where batch_id=batch and variant_key=edge->>'child_variant_key';\ninsert into culinary_private.recipe_components(parent_variant_id,child_variant_id,component_mrn,component_name,source_quantity_text,source_page,position) values(parent_id,child_id,edge->>'component_mrn',edge->>'component_name',edge->>'source_quantity_text',(edge->>'source_page')::integer,(edge->>'position')::integer);\nend loop; end loop;\nend ${delimiter};\ncommit;\n`;
writeFileSync(output,sql,{flag:'wx'});
console.log('Prepared an inactive private batch locally. No database connection or operational writes.');
