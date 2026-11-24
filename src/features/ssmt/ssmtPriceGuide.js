export const GUIDE_COLUMNS = ['Tier 1','SEA','BOS','WAS','SJC','BWI','DEN','IAD','SAN','SNA','Tier 2','AUS','BNA','Tier 3','Canada'];

// Source values belong to the shared price rows, never a bundled price fallback.
export function guideRows(priceBook = []) {
  return priceBook.filter(row => row.sourceGuide?.range === 'E:S' || row.sourceGuide?.sourceRow)
    .sort((a,b) => a.sourceGuide.sourceRow - b.sourceGuide.sourceRow);
}
