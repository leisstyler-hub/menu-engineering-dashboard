import test from 'node:test';
import assert from 'node:assert/strict';
import {guideRows, GUIDE_COLUMNS} from '../../src/features/ssmt/ssmtPriceGuide.js';
import {buildSsmtWorkspaceRecord,workspaceFromRecord} from '../../src/features/ssmt/ssmtWorkspaceStorage.js';

test('source guide retains source order, explicit missing prices and CAD through shared storage',()=>{
 const book=[{id:'last',sourceGuide:{sourceRow:73,sourceName:'Standard Baked Good',prices:{SEA:2.5,Canada:null}}},
 {id:'legacy',category:'Retained'}, {id:'first',sourceGuide:{sourceRow:19,sourceName:'Fresh Five',prices:{SEA:5,Canada:5}}}];
 const record=buildSsmtWorkspaceRecord({priceBook:book});
 const rows=guideRows(workspaceFromRecord(record).priceBook);
 assert.deepEqual(rows.map(r=>r.id),['first','last']);
 assert.equal(rows[1].sourceGuide.prices.Canada,null);
 assert.deepEqual(GUIDE_COLUMNS,['Tier 1','SEA','BOS','WAS','SJC','BWI','DEN','IAD','SAN','SNA','Tier 2','AUS','BNA','Tier 3','Canada']);
 assert.deepEqual(book[0].sourceGuide.prices,{SEA:2.5,Canada:null});
});
