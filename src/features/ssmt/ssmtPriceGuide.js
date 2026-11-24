export const GUIDE_COLUMNS = ['Tier 1','SEA','BOS','WAS','SJC','BWI','DEN','IAD','SAN','SNA','Tier 2','AUS','BNA','Tier 3','Canada'];
export const isWorkbookPrice = row => row?.sourceGuide?.range === 'E:S';
export const isApprovedNoSidePrice = row => row?.sourceSchedule?.kind === 'approved-no-side'
  && /^[a-f0-9]{64}$/.test(row.sourceSchedule.approvalEventId || '')
  && Boolean(row.sourceSchedule.sourcePriceId);
export const isStarredPrice = row => isWorkbookPrice(row) || isApprovedNoSidePrice(row);
export const guideColumnLabel = column => {
  const index = GUIDE_COLUMNS.indexOf(column);
  return index < 0 ? column : `${String.fromCharCode(69 + index)} · ${column === 'Canada' ? 'Canada (CAD)' : column}`;
};

// Source values belong to the shared price rows, never a bundled price fallback.
export function guideRows(priceBook = []) {
  return priceBook.filter(row => row.sourceGuide?.range === 'E:S' || row.sourceGuide?.sourceRow)
    .sort((a,b) => a.sourceGuide.sourceRow - b.sourceGuide.sourceRow);
}
