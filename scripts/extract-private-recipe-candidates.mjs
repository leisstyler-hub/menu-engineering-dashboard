// Extract candidates from local page-marked text. No network or database operations.
// All results require visual source review; never assign validated status automatically.
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {resolve,relative,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {portionWeightOz} from '../src/features/menu-engineering/weighPayModel.js';
const [textPath,pdfPath,outputPath]=process.argv.slice(2);
if(!textPath||!pdfPath||!outputPath)throw new Error('Usage: extract-private-recipe-candidates.mjs <page-text> <source-pdf> <private-output.json>');
const root=realpathSync(new URL('..',import.meta.url));
for(const path of [textPath,pdfPath,outputPath]){const canonical=path===outputPath?resolve(realpathSync(dirname(resolve(path))),basename(path)):realpathSync(path);const rel=relative(root,canonical);if(!rel.startsWith('..')&&!rel.includes(':'))throw new Error('Private files must remain outside this repository.');}
const text=readFileSync(textPath,'utf8');
const sourceSha256=createHash('sha256').update(readFileSync(pdfPath)).digest('hex');
const pages=[...text.matchAll(/(?:^|\n)PAGE (\d+)\n([\s\S]*?)(?=\nPAGE \d+\n|$)/g)];
const variants=[];let current=null;
for(const match of pages){
 const page=Number(match[1]);
 const body=match[2].replace(/^[\s\S]*?Page \d+ of \d+\s*/,'');
 const heading=body.match(/^([\s\S]*?)\(([\d.]+)\)\s*Revision Date:\s*([^\n]+)/);
 if(heading){
  current={variant_key:`page-${page}`,mrn:heading[2],recipe_name:heading[1].replace(/\s+/g,' ').trim(),revision_label:heading[3].trim(),source_pages:[],serving_pan:null,reconciliation_status:'needs-review',components:[],private_source_payload:{pages:[]}};
  variants.push(current);
 }
 if(!current)continue;
 current.source_pages.push(page);current.private_source_payload.pages.push({page,text:body});
 const portion=body.match(/Portion:\s*([^\n]+)/);
 if(portion){current.serving_size_text=portion[1].trim();current.serving_mass_oz=portionWeightOz({portion:current.serving_size_text});}
 const servings=body.match(/Step\s+Ingredients\s+([\d,.]+) Servings/);
 if(servings)current.batch_servings=Number(servings[1].replaceAll(',',''));
 const cost=body.match(/Cost per Serving:\s*([\d,.]+)/);
 if(cost)current.serving_cost=Number(cost[1].replaceAll(',',''));
 const method=body.match(/Step\s+Method\s+([\s\S]*?)(?:Cost per Serving:|$)/);
 if(method)current.private_source_payload.method=(current.private_source_payload.method||'')+method[1];
}
// Parent contexts distinguish repeated child servings; no ambiguous MRN-only linking.
for(const child of variants){
 const body=child.private_source_payload.pages[0].text;
 const usage=body.match(/Sub Recipe For\s+([\s\S]*?)\(([\d.]+)\)\s+([\d,.]+) Servings\s+([^\n]+(?:\n[^\n]+)?)/);
 if(!usage)continue;
 child.parent_context={parent_mrn:usage[2],parent_name:usage[1].replace(/\s+/g,' ').trim(),parent_batch_servings:Number(usage[3].replaceAll(',','')),quantity_text:usage[4].trim()};
 const parents=variants.filter(v=>v.mrn===usage[2]&&v.source_pages[0]<child.source_pages[0]);
 const parent=parents.at(-1);
 if(parent)parent.components.push({component_mrn:child.mrn,component_name:child.recipe_name,child_variant_key:child.variant_key,source_quantity_text:child.parent_context.quantity_text,source_page:parent.source_pages[0],position:parent.components.length+1,requires_review:true});
}
if(!variants.length)throw new Error('No recipe headings found; extraction format needs review.');
writeFileSync(outputPath,JSON.stringify({concept:'AMZ: Andes',source_sha256:sourceSha256,status:'unreviewed-candidates',variants},null,2),{flag:'wx'});
console.log('Private candidate file prepared locally; source, serving and component reconciliation is still required. Nothing imported or published.');
