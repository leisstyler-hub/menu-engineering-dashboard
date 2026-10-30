import {readFileSync,writeFileSync} from 'node:fs';
import evidence from '../src/data/wpProfileEvidence.json' with {type:'json'};
import {profileFor} from '../src/features/menu-engineering/wpSmartModel.js';
import {panReadyMenu} from '../src/features/menu-engineering/panReadyModel.js';

const [snapshotPath,outputPath]=process.argv.slice(2);
if(!snapshotPath||!outputPath)throw new Error('Usage: node scripts/prepare-wp-profile-manifest.mjs <read-only-catalog.json> <new-output.json>');
const snapshot=JSON.parse(readFileSync(snapshotPath,'utf8'));
if(!snapshot.source?.startsWith('supabase-recipe-items')||!Array.isArray(snapshot.rows))throw new Error('Trusted assembled read-view snapshot required; this is not a physical database backup');
const normalize=x=>String(x||'').trim().toLowerCase().replace(/\s+/g,' ');
const identity=(menu,mrn,portion)=>JSON.stringify([normalize(menu),String(mrn),normalize(portion)]);
const existing=new Map();
const incomingCounts=new Map();
for(const r of evidence.records){const key=identity(r.menu,r.mrn,r.portion);incomingCounts.set(key,(incomingCounts.get(key)||0)+1);}
for(const r of snapshot.rows){const key=identity(r.menu,r.mrn,r.portion);if(!existing.has(key))existing.set(key,[]);existing.get(key).push(r);}
const profiles=evidence.records.map(r=>{
 const matches=existing.get(identity(r.menu,r.mrn,r.portion))||[];
 const incomingCount=incomingCounts.get(identity(r.menu,r.mrn,r.portion));
 const exact=matches.length===1&&incomingCount===1;
 const classified=panReadyMenu({concept:r.menu,recipes:[{id:'candidate',mrn:r.mrn,name:r.name,portion:r.portion,cost:null,massOz:null,components:[],topLevel:true}]},11.2);
 const p=profileFor({name:r.name,mrn:r.mrn,portion:r.portion,menus:[r.menu],category:classified.items[0]?.category||'Unknown'});
 const values=list=>list.length?list:['Unknown'];
 return {profileVersion:1,identity:{itemKey:exact?matches[0].item_key:null,mrn:r.mrn,rawMrn:r.rawMrn,portion:r.portion,menu:r.menu},
  identityStatus:exact?'Exact assembled-view match':matches.length||incomingCount>1?'Ambiguous source/current identity':'Candidate identity; reconcile before write',
  reviewStatus:'Proposed',servicePlacement:values(p.placements),cuisineMoniker:values(p.cuisines),culinaryRole:p.role,
  seasonality:values(p.seasons),flavor:values(p.flavors),texture:values(p.textures),premiumHighlight:p.premium?'Yes':'Unknown',
  provenance:{sourceFile:evidence.sourceFile,sourceSha256:evidence.sourceSha256,basis:p.basis,reviewer:null,reviewedAt:null},
  persistenceStatus:'Not written to Supabase'};
});
const manifest={schemaVersion:1,state:'DRY RUN; no writes; proposed classifications require review',sourceSha256:evidence.sourceSha256,
 limits:'Current rows are an assembled API view; identity matches are candidates, not proof of physical item ownership or a recovery backup. No deletions, visibility changes, source-cost changes or MRN rewrites are proposed here.',profiles};
writeFileSync(outputPath,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({profiles:profiles.length,exactMatches:profiles.filter(p=>p.identityStatus==='Exact assembled-view match').length,output:outputPath,state:manifest.state}));
