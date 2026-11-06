import {profileFor} from './wpSmartModel.js';
import {TACT_VOCABULARY} from './wpTactProfile.js';
const normalize=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');
const identityKey=row=>JSON.stringify([normalize(row.menu),String(row.mrn??''),normalize(row.portion)]);
const values=list=>list?.length?[...list]:['Unknown'];

// Companion to import review; never a database write or physical recovery backup.
export function buildProfileManifest(rows,{source,sourceSha256=null,currentRows=[]}={}) {
 if(!Array.isArray(rows))throw new Error('Incoming rows must be an array.');
 const counts=new Map(),current=new Map();
 for(const row of rows)counts.set(identityKey(row),(counts.get(identityKey(row))||0)+1);
 for(const row of currentRows){const key=identityKey(row);if(!current.has(key))current.set(key,[]);current.get(key).push(row);}
 const profiles=rows.map(row=>{
  const key=identityKey(row),matches=current.get(key)||[],mrn=String(row.mrn??'');
  const complete=Boolean(row.menu&&mrn&&row.portion),ambiguous=counts.get(key)>1||matches.length>1;
  const exact=complete&&!ambiguous&&matches.length===1;
  // A companion proposal cannot replace classifications on an exact current item.
  const existingProfile=exact?matches[0].culinaryProfile:null;
  const culinaryProfile=existingProfile??row.culinaryProfile;
  const conflicts=existingProfile&&row.culinaryProfile&&JSON.stringify(existingProfile)!==JSON.stringify(row.culinaryProfile)?['Incoming profile differs from current profile; current classifications preserved. Review required.']:[];
  const p=profileFor({...row,culinaryProfile,name:row.name??row.item,menus:row.menus||[row.menu],category:row.category||'Unknown'});
  return {profileVersion:2,identity:{itemKey:exact?(matches[0].item_key??matches[0].id??null):null,mrn,rawMrn:row.rawMrn??mrn,portion:row.portion??'',menu:row.menu??''},
   identityStatus:!complete?'Incomplete identity; reconcile before write':ambiguous?'Ambiguous source/current identity':exact?'Exact assembled-view match':'Candidate identity; reconcile before write',
   reviewStatus:p.reviewStatus,servicePlacement:values(p.placements),cuisineMoniker:values(p.cuisines),culinaryRole:p.role||'Unknown',
   seasonality:values(p.seasons),flavor:values(p.flavors),texture:values(p.textures),premiumHighlight:p.premium?'Yes':'Unknown',tact:p.tact,
   existingProfile:culinaryProfile?structuredClone(culinaryProfile):null,conflicts,
   provenance:{sourceRecord:source||'Unspecified incoming source',sourceSha256,basis:p.basis||'Existing reviewed profile; TACT reviewed separately'},
   persistenceStatus:'Not written to Supabase'};
 });
 const tact=Object.fromEntries(Object.keys(TACT_VOCABULARY).map(d=>[d,{
  proposed:profiles.filter(p=>p.tact[d].status==='Proposed').length,
  reviewed:profiles.filter(p=>p.tact[d].status==='Reviewed').length,
  needsReview:profiles.filter(p=>p.tact[d].status==='Needs review').length
 }]));
 return {schemaVersion:2,state:'DRY RUN; no writes; proposed classifications require review',source,sourceSha256,
  limits:'Assembled-view matches are not physical ownership or recovery proof. No deletions, cost changes, MRN rewrites or recipe publication.',
  summary:{rows:profiles.length,ambiguousIdentities:profiles.filter(p=>p.identityStatus.startsWith('Ambiguous')).length,tact},profiles};
}
