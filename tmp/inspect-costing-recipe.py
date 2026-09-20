import html
import re
import sys
import zipfile

ROW_RE = re.compile(rb"<row\b[^>]*>.*?</row>", re.S)
CELL_RE = re.compile(rb'<c\b[^>]*\br="([A-Z]+)\d+"[^>]*>(.*?)</c>', re.S)
TEXT_RE = re.compile(rb"<t(?:\s[^>]*)?>(.*?)</t>", re.S)


def text(cell):
    match = TEXT_RE.search(cell)
    return html.unescape(match.group(1).decode("utf-8")).strip() if match else None


def values(row):
    return {column.decode(): text(cell) for column, cell in CELL_RE.findall(row)}


target = sys.argv[2]
with zipfile.ZipFile(sys.argv[1]) as archive:
    found = []
    for index in range(1, 7):
        for row in ROW_RE.findall(archive.read(f"xl/worksheets/sheet{index}.xml"))[1:]:
            row_values = values(row)
            if str(row_values.get("G", "")).lstrip("'") == target:
                found.append((index, {key: row_values.get(key) for key in ("A", "B", "G", "H", "J", "K", "L", "M", "N", "O")}))
print("rows", len(found))
for item in found[:100]: print(item)
