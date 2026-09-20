import html
import json
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict

import openpyxl


ROW_RE = re.compile(rb"<row\b[^>]*>.*?</row>", re.S)
CELL_RE = re.compile(rb'<c\b[^>]*\br="([A-Z]+)\d+"[^>]*>(.*?)</c>', re.S)
TEXT_RE = re.compile(rb"<t(?:\s[^>]*)?>(.*?)</t>", re.S)


def cell_text(cell_xml):
    match = TEXT_RE.search(cell_xml)
    return html.unescape(match.group(1).decode("utf-8")).strip() if match else None


def normalize(value):
    if not value:
        return ""
    value = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii").lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def load_mapping(path):
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook["G-L Mapping"]
    mapping = defaultdict(set)
    for name, code, *_ in sheet.iter_rows(min_row=5, values_only=True):
        key = normalize(name)
        if key and code:
            mapping[key].add(str(code))
    return mapping


def load_snapshot(path):
    result = defaultdict(Counter)
    with zipfile.ZipFile(path) as archive:
        for index in range(1, 7):
            rows = ROW_RE.findall(archive.read(f"xl/worksheets/sheet{index}.xml"))
            for row in rows[1:]:
                values = {}
                for column, cell in CELL_RE.findall(row):
                    if column in (b"A", b"B"):
                        values[column.decode()] = cell_text(cell)
                mrn = values.get("A")
                name = values.get("B")
                if mrn and name:
                    result[mrn][name] += 1
    return result


if __name__ == "__main__":
    ingredient_map = load_mapping(sys.argv[1])
    snapshot = load_snapshot(sys.argv[2])
    exact = 0
    conflicts = []
    missing = []
    for mrn, names in snapshot.items():
        keys = {normalize(name) for name in names}
        codes = set().union(*(ingredient_map.get(key, set()) for key in keys))
        if len(codes) == 1:
            exact += 1
        elif len(codes) > 1:
            conflicts.append((mrn, dict(names), sorted(codes)))
        else:
            missing.append((mrn, dict(names)))
    print(json.dumps({
        "unique_ingredient_mrns": len(snapshot),
        "unique_mapping_names": len(ingredient_map),
        "exact_single_code_mrns": exact,
        "conflicting_exact_code_mrns": len(conflicts),
        "unmatched_mrns": len(missing),
        "unmatched_examples": missing[:20],
        "conflict_examples": conflicts[:10],
    }, indent=2))
