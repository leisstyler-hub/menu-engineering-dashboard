import html
import json
import re
import sys
import zipfile
from collections import Counter, defaultdict

ROW_RE = re.compile(rb"<row\b[^>]*>.*?</row>", re.S)
CELL_RE = re.compile(rb'<c\b[^>]*\br="([A-Z]+)\d+"[^>]*>(.*?)</c>', re.S)
TEXT_RE = re.compile(rb"<t(?:\s[^>]*)?>(.*?)</t>", re.S)


def text(cell):
    match = TEXT_RE.search(cell)
    return html.unescape(match.group(1).decode("utf-8")).strip() if match else None


def row_values(row):
    values = {}
    for column, cell in CELL_RE.findall(row):
        if column in (b"G", b"N", b"O"):
            values[column.decode()] = text(cell)
    return values


def clean_mrn(value):
    return str(value or "").lstrip("'").strip()


if __name__ == "__main__":
    catalog = json.loads(open(sys.argv[1], encoding="utf-8").read())["items"]
    breakdown = defaultdict(lambda: Counter())
    with zipfile.ZipFile(sys.argv[2]) as archive:
        for index in range(1, 7):
            for row in ROW_RE.findall(archive.read(f"xl/worksheets/sheet{index}.xml"))[1:]:
                values = row_values(row)
                mrn = clean_mrn(values.get("G"))
                code = values.get("O")
                try:
                    cost = float(str(values.get("N") or "").replace("$", "").replace(",", ""))
                except ValueError:
                    continue
                if mrn and code:
                    breakdown[mrn][code] += cost
    catalog_mrns = {clean_mrn(item.get("mrn")) for item in catalog}
    matched = catalog_mrns & set(breakdown)
    print(json.dumps({
        "catalog_items": len(catalog),
        "catalog_unique_mrns": len(catalog_mrns),
        "recipe_mrns_in_costing": len(breakdown),
        "matched_catalog_mrns": len(matched),
        "unmatched_catalog_mrns": len(catalog_mrns - set(breakdown)),
        "matched_item_rows": sum(1 for item in catalog if clean_mrn(item.get('mrn')) in breakdown),
        "sample_breakdown": {mrn: dict(breakdown[mrn]) for mrn in sorted(matched)[:5]},
        "unmatched_examples": [item for item in catalog if clean_mrn(item.get('mrn')) not in breakdown][:10],
    }, indent=2))
