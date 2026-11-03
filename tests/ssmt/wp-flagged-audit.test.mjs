import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildFlaggedAuditRows,buildFlaggedAuditWorkbook} from '../../src/features/menu-engineering/wpFlaggedAudit.js';
import * as XLSX from 'xlsx';

test('audit preserves variants, exact MRNs, gaps and service versus financial flags',()=>{
 const food={name:'Roasted squash',mrn:'0001.20',portion:'1 each',cost:null,massOz:null,foodCost:null,informationReasons:['Conflicting portion evidence'],serviceReasons:[],category:'Vegetables'};
 const projections=[{menu:'One',items:[food,{...food,cost:9,massOz:4,foodCost:2,serviceReasons:['Culinary review']}],review:[{...food,mrn:'002',classificationReason:'Service category needs review'}],excluded:[{...food,mrn:'003',classificationReason:'Handheld excluded'}]}];
 const rows=buildFlaggedAuditRows(projections,{trusted:true});
 assert.equal(rows.length,4);assert.equal(rows[0].MRN,'0001.20');
 assert.match(rows[0]['Flags / information needed'],/cost|weight/i);
 assert.match(rows[0]['Flags / information needed'],/Conflicting portion evidence/);
 assert.match(rows[0]['Pan estimate gap'],/No exact Menu Item Index/);
 assert.match(rows[1]['Flags / information needed'],/40%/);
 assert.match(rows[1]['Service review'],/Culinary review/);
 assert.equal(rows[3]['Item disposition'],'Excluded from W&P');
 const book=buildFlaggedAuditWorkbook(projections,{trusted:false,source:'fallback',loadedAt:'2026-11-03'});
 assert.equal(book.Sheets['Flagged Item Audit'].A2.t,'s');
 assert.equal(XLSX.utils.sheet_to_json(book.Sheets['Flagged Item Audit'])[0].MRN,'0001.20');
 assert.match(XLSX.utils.sheet_to_json(book.Sheets['Audit context']).find(r=>r.Field==='Source status').Value,/Reference only/);
 assert.equal(food.cost,null);
});
