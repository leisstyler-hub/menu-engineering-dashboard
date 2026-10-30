import * as XLSX from 'xlsx';
import {profileFor} from './wpSmartModel.js';

export function buildStationWorkbook(projection, {rate, sellThrough, trusted}) {
  const workbook = XLSX.utils.book_new();
  const rows = projection.rows.map(row => ({
    Food: row.food?.name || row.name, MRN: String(row.food?.mrn || row.mrn || ''),
    'Source menus': row.food?.menus?.join('; ') || row.menus?.join('; ') || 'Source no longer available',
    Category: row.food?.category || '', 'Planned finished lb': row.pounds ?? 'Invalid quantity',
    'Cost per lb': trusted && !row.food?.conflict ? row.food?.costPerLb ?? 'Unresolved' : 'Unresolved',
    'Planned food cost': row.cost ?? 'Incomplete', 'Service review': row.food?.serviceReasons?.join('; ') || '',
    'Information needed': row.food?.informationReasons?.join('; ') || (row.cost == null ? 'Trusted compatible evidence and positive quantity required' : ''),
    'Approximate weight': row.food?.weightApproximate ? 'Yes' : 'No',
    'Cost source': row.food?.costBasis || '', 'Weight source': row.food?.weightSource || '',
    'Quantity mode':row.quantityMode==='pan'?'Pans':'Manual finished pounds',
    'Pan size (4-inch deep)':row.quantityMode==='pan'?row.panSize:'',
    'Opening display pans':row.quantityMode==='pan'?row.openingPans:'',
    'Reserve / refill pans':row.quantityMode==='pan'?row.reservePans:'',
    'Total pans to prepare':row.quantityMode==='pan'&&row.pounds!=null?Number(row.openingPans)+Number(row.reservePans):'',
    'Measured finished lb per pan':row.quantityMode==='pan'?row.fillLb:'',
    'Service placement':row.placement||'Unconfirmed',
    'Placement chef confirmed':row.placementConfirmed?'Yes':'No',
    'Locked in smart builds':row.locked?'Yes':'No',
    'Proposed monikers':row.food?Object.values((({role,cuisines,flavors,textures,seasons})=>({role,cuisines,flavors,textures,seasons}))(profileFor(row.food))).flat().join('; '):'',
    'Profile status':'Proposed; chef review required',
    'Bullet footprint (full-pan spaces)':row.footprint||''
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
