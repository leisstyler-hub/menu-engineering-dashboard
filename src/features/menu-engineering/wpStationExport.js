import * as XLSX from 'xlsx';
import {profileFor} from './wpSmartModel.js';

export function buildStationWorkbook(projection, {rate, sellThrough, trusted}) {
  const workbook = XLSX.utils.book_new();
  const rows = projection.rows.map(row => ({
    Food: row.food?.name || row.name, MRN: String(row.food?.mrn || row.mrn || ''),
    'Source menus': row.food?.menus?.join('; ') || row.menus?.join('; ') || 'Source no longer available',
    Category: row.food?.category || '', 'Planned finished lb': row.pounds ?? 'Invalid quantity',
    'Estimated cost per lb': row.cost!=null&&row.pounds>0?row.cost/row.pounds:'Unresolved',
    'Planned food cost': row.cost ?? 'Incomplete', 'Service review': row.food?.serviceReasons?.join('; ') || '',
    'Information needed':row.estimate?.reason||row.food?.informationReasons?.join('; ')||(row.cost==null?'Trusted compatible evidence and positive quantity required':''),
    'Approximate weight':row.estimate||row.food?.weightApproximate?'Yes':'No',
    'Cost source':row.estimate?'Menu Item Index source-file estimate':row.food?.costBasis||'', 'Weight source':row.estimate?'Menu Item Index portion weight and reference pan':row.food?.weightSource||'',
    'Pan size (4-inch deep)':row.panSize||'',
    'Total pans to prepare':row.totalPans??'',
    'Estimated source servings':row.servings??'Unavailable',
    'Estimate basis':row.estimate?.basis||row.estimate?.reason||'',
    'Source file SHA256':row.estimate?.sourceSha256||'',
    'LOCK ITEM FROM SUGGESTIONS':row.locked?'Yes':'No',
    'Tags':row.food?Object.values((({placements,role,cuisines,flavors,textures,seasons})=>({placements,role,cuisines,flavors,textures,seasons}))(profileFor(row.food))).flat().join('; '):'',
    'Profile status':row.food?profileFor(row.food).reviewStatus:'Needs review',
    'Pan assumptions':'4-inch: full 14.2 qt; half 6.7 qt; bullet approximated as 1/6-size 1.8 qt; 80% usable fill',
    'Premium placement advice':row.food&&profileFor(row.food).premium?'Consider end of guest path after foundations/sides; suitable holding required':''

  }));
  const items = XLSX.utils.json_to_sheet(rows);
  items['!cols'] = [{wch:48},{wch:25},{wch:55},{wch:22},{wch:22},{wch:18},{wch:22},{wch:60},{wch:65},{wch:20},{wch:40},{wch:45}];
  items['!autofilter'] = {ref:items['!ref'] || 'A1:L1'};
  XLSX.utils.book_append_sheet(workbook, items, 'Station selections');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
    {Metric:'Exported at',Value:new Date().toISOString()},
    {Metric:'Data status',Value:trusted?'Shared source evidence':'Reference only; costs incomplete'},
    {Metric:'Price per lb',Value:rate ?? 'Invalid price'},
    {Metric:'Sell-through percent',Value:sellThrough},
    {Metric:'Finished pounds',Value:projection.pounds ?? 'Incomplete'},
    {Metric:'Planned food cost',Value:projection.cost ?? 'Incomplete'},
    {Metric:'Projected sales',Value:projection.sales ?? 'Incomplete'},
    {Metric:'Projected FC fraction',Value:projection.foodCost ?? 'Incomplete'},
    {Metric:'Remaining for labor & other costs',Value:projection.contribution ?? 'Incomplete'},
    {Metric:'Limits',Value:'Session scenario; cost includes unsold food. Remaining amount is projected sales minus all planned food cost, before labor, overhead and tax. Service review remains required.'}
  ]), 'Projection');
  workbook.Sheets.Projection['!cols']=[{wch:28},{wch:110}];
  return workbook;
}

export function downloadStationWorkbook(projection, options) {
  XLSX.writeFile(buildStationWorkbook(projection, options), 'wp-station-selections.xlsx');
}
