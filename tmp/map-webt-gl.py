import html
import json
import re
import sys
import unicodedata
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl


ROW_RE = re.compile(rb"<row\b[^>]*>.*?</row>", re.S)
ROW_NUMBER_RE = re.compile(rb'(<row\b[^>]*\br=")(\d+)(")')
CELL_RE = re.compile(rb'<c\b[^>]*\br="([A-Z]+)\d+"[^>]*>(.*?)</c>', re.S)
TEXT_RE = re.compile(rb"<t(?:\s[^>]*)?>(.*?)</t>", re.S)
O_CELL_RE = re.compile(rb'<c\b[^>]*\br="O\d+"[^>]*>.*?</c>', re.S)
STOPWORDS = {"and", "with", "for", "of", "the", "a", "an", "brand", "food", "foods", "style", "natural", "organic"}

GL = {
    "produce": "4111012",
    "beverage": "4112002",
    "meat": "4111003",
    "seafood": "4111004",
    "grocery": "4111005",
    "dairy": "4111006",
    "frozen": "4111009",
    "bakery": "4111010",
    "prepared": "4111011",
}


def normalize(value):
    value = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode("ascii").lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def content_tokens(value):
    return {token for token in normalize(value).split() if token not in STOPWORDS and len(token) > 1}


def cell_text(cell_xml):
    match = TEXT_RE.search(cell_xml)
    return html.unescape(match.group(1).decode("utf-8")).strip() if match else None


def row_values(row):
    values = {}
    for column, cell in CELL_RE.findall(row):
        if column in (b"A", b"B"):
            values[column.decode()] = cell_text(cell)
    return values


def load_reference(mapping_path):
    workbook = openpyxl.load_workbook(mapping_path, read_only=True, data_only=True)
    sheet = workbook["G-L Mapping"]
    exact = defaultdict(set)
    entries = []
    for name, code, *_ in sheet.iter_rows(min_row=5, values_only=True):
        key = normalize(name)
        if key and code:
            exact[key].add(str(code))
            tokens = content_tokens(name)
            if len(tokens) >= 2:
                entries.append((key, tokens, str(code)))
    return exact, entries


def choose_reference_code(name, exact, entries):
    norm = normalize(name)
    direct = exact.get(norm, set())
    if len(direct) == 1:
        return next(iter(direct)), "reference_exact"

    name_tokens = content_tokens(name)
    candidates = []
    for phrase, tokens, code in entries:
        if phrase in norm or tokens.issubset(name_tokens):
            candidates.append((len(tokens), len(phrase), code))
    if not candidates:
        return None, None
    candidates.sort(reverse=True)
    highest = candidates[0][:2]
    codes = {code for token_count, phrase_length, code in candidates if (token_count, phrase_length) == highest}
    if len(codes) == 1:
        return codes.pop(), "reference_phrase"
    return None, None


def has_any(name, patterns):
    return any(re.search(pattern, name) for pattern in patterns)


def classify(name, exact, entries):
    code, basis = choose_reference_code(name, exact, entries)
    if code:
        return code, basis
    value = normalize(name)

    # Direct protein takes precedence over storage state: the approved rules keep
    # all seafood in Seafood and all non-seafood protein in Meat/Poultry.
    if has_any(value, [r"\b(salmon|tuna|cod|halibut|tilapia|trout|bass|mahi|snapper|sole|catfish|sardine|anchov|shrimp|prawn|crab|lobster|clam|mussel|oyster|scallop|squid|calamari|octopus|caviar|roe)\b"]) and not has_any(value, [r"\bfish sauce\b", r"\boyster sauce\b"]):
        return GL["seafood"], "rule_seafood"
    if has_any(value, [r"\b(soup|samosa|empanada|lumpia|spring roll|egg roll|ready made|prepared|value added)\b"]):
        return GL["prepared"], "rule_prepared"
    if has_any(value, [r"\b(chicken|turkey|beef|pork|lamb|veal|duck|bison|venison|goat|sausage|bacon|ham|prosciutto|pepperoni|salami|meatball)\b"]):
        return GL["meat"], "rule_meat"
    if has_any(value, [r"\bfrozen\b", r"\bfries\b", r"\btater tots?\b", r"\bice cream\b", r"\bsorbet\b", r"\bcookie dough\b"]):
        return GL["frozen"], "rule_frozen"
    if has_any(value, [r"\b(dairy free|non dairy|cashewmilk|almondmilk|oatmilk|coconut based)\b"]):
        return GL["grocery"], "rule_non_dairy_grocery"
    if has_any(value, [r"\b(milk|cheese|yogurt|butter|cream|half and half|whey|buttermilk|sour cream|kefir|ricotta|mascarpone)\b"]):
        return GL["dairy"], "rule_dairy"
    if has_any(value, [r"\b(tea|coffee|chai)\b"]):
        return GL["grocery"], "rule_tea_coffee_grocery"
    if not has_any(value, [r"\b(tea|coffee|chai)\b"]) and has_any(value, [r"\b(sparkling water|soda|cola|pop|energy drink|red bull|monster|fountain)\b"]):
        return GL["beverage"], "rule_beverage"
    if has_any(value, [r"\b(bread|bun|roll|tortilla|wrap|naan|pita|flatbread|croissant|bagel|pastry|muffin|cake|cookie|dough|brioche|focaccia|ciabatta)\b"]):
        return GL["bakery"], "rule_bakery"
    if has_any(value, [r"\b(tofu|avocado|apple|apricot|artichoke|arugula|asparagus|banana|basil|bean sprout|beet|bell pepper|berry|bok choy|broccoli|cabbage|carrot|cauliflower|celery|chard|cherry|cilantro|corn on|cucumber|dill|eggplant|fennel|garlic|ginger|grape|grapefruit|green bean|herb|jalapeno|kale|kiwi|leek|lemon|lettuce|lime|mango|melon|mint|mushroom|nectarine|onion|orange|parsley|parsnip|peach|pear|pepper fresh|pineapple|plantain|plum|pomegranate|potato fresh|radish|raspberry|rosemary|sage|salad|scallion|shallot|spinach|squash|strawberr|sweet potato|thyme|tomato|watercress|watermelon|zucchini|juice)\b"]):
        return GL["produce"], "rule_produce"
    return GL["grocery"], "rule_grocery_default"


def build_mrn_map(snapshot_path, mapping_path):
    exact, entries = load_reference(mapping_path)
    names_by_mrn = defaultdict(Counter)
    with zipfile.ZipFile(snapshot_path) as archive:
        for index in range(1, 7):
            for row in ROW_RE.findall(archive.read(f"xl/worksheets/sheet{index}.xml"))[1:]:
                values = row_values(row)
                if values.get("A") and values.get("B"):
                    names_by_mrn[values["A"]][values["B"]] += 1
    mrn_map = {}
    for mrn, names in names_by_mrn.items():
        name = names.most_common(1)[0][0]
        mrn_map[mrn] = (*classify(name, exact, entries), name)
    return mrn_map


def report(snapshot_path, mapping_path):
    mrn_map = build_mrn_map(snapshot_path, mapping_path)
    codes = Counter(code for code, _, _ in mrn_map.values())
    bases = Counter(basis for _, basis, _ in mrn_map.values())
    samples = defaultdict(list)
    for mrn, (code, basis, name) in mrn_map.items():
        if len(samples[code]) < 8:
            samples[code].append({"mrn": mrn, "ingredient": name, "basis": basis})
    print(json.dumps({"unique_mrns": len(mrn_map), "codes": codes, "bases": bases, "samples_by_code": samples}, indent=2))


def header_style(row):
    match = re.search(rb'<c\b[^>]*\br="N1"([^>]*)>', row)
    if not match:
        return b""
    style = re.search(rb'\ss="[^"]+"', match.group(1))
    return style.group(0) if style else b""


def add_gl_column(sheet_data, mrn_map):
    result = bytearray()
    cursor = 0
    unmapped_rows = 0
    code_counts = Counter()
    for position, match in enumerate(ROW_RE.finditer(sheet_data), 1):
        result.extend(sheet_data[cursor:match.start()])
        row = match.group(0)
        row_number_match = ROW_NUMBER_RE.search(row)
        row_number = int(row_number_match.group(2)) if row_number_match else position
        if row_number == 1:
            cell = b'<c r="O1"' + header_style(row) + b' t="inlineStr"><is><t>S4 G/L Code</t></is></c>'
        else:
            values = row_values(row)
            mapped = mrn_map.get(values.get("A"))
            if mapped is None:
                # Valid cost rows without a usable MRN/name are retained and given
                # the approved pantry default so every row receives one S4 code.
                code = GL["grocery"]
                unmapped_rows += 1
            else:
                code = mapped[0]
            code_counts[code] += 1
            cell = f'<c r="O{row_number}" t="inlineStr"><is><t>{code}</t></is></c>'.encode()
        result.extend(row[:-6])
        result.extend(cell)
        result.extend(b"</row>")
        cursor = match.end()
    result.extend(sheet_data[cursor:])
    return bytes(result), unmapped_rows, code_counts


def write_mapped_workbook(input_path, mapping_path, output_path):
    mrn_map = build_mrn_map(input_path, mapping_path)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    summary = []
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(output_path, "w", allowZip64=True) as target:
        for info in source.infolist():
            data = source.read(info.filename)
            if re.fullmatch(r"xl/worksheets/sheet[1-6]\.xml", info.filename):
                data, unmapped_rows, code_counts = add_gl_column(data, mrn_map)
                summary.append({"worksheet_xml": info.filename, "rows_without_mrn_mapping": unmapped_rows, "code_counts": code_counts})
            target.writestr(info, data, compress_type=info.compress_type)
    print(json.dumps(summary, indent=2))


def verify_mapped_workbook(input_path, mapping_path, output_path):
    approved_codes = set(GL.values())
    mrn_map = build_mrn_map(input_path, mapping_path)
    summary = []
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(output_path, "r") as output:
        for index in range(1, 7):
            name = f"xl/worksheets/sheet{index}.xml"
            original_rows = ROW_RE.findall(source.read(name))
            mapped_rows = ROW_RE.findall(output.read(name))
            if len(original_rows) != len(mapped_rows):
                raise AssertionError(f"Row count changed in {name}")
            codes_by_mrn = defaultdict(set)
            for row_number, (original, mapped) in enumerate(zip(original_rows, mapped_rows), 1):
                without_code = O_CELL_RE.sub(b"", mapped)
                if without_code != original:
                    raise AssertionError(f"Unexpected source-cell change in {name} row {row_number}")
                code_match = re.search(rb'<c\b[^>]*\br="O\d+"[^>]*>.*?<t(?:\s[^>]*)?>(.*?)</t>.*?</c>', mapped, re.S)
                if row_number == 1:
                    if not code_match or html.unescape(code_match.group(1).decode()) != "S4 G/L Code":
                        raise AssertionError(f"Missing S4 header in {name}")
                    continue
                if not code_match:
                    raise AssertionError(f"Missing S4 code in {name} row {row_number}")
                code = html.unescape(code_match.group(1).decode())
                if code not in approved_codes:
                    raise AssertionError(f"Invalid S4 code {code} in {name} row {row_number}")
                values = row_values(original)
                if values.get("A") in mrn_map:
                    expected = mrn_map[values["A"]][0]
                    if code != expected:
                        raise AssertionError(f"MRN code mismatch in {name} row {row_number}")
                    codes_by_mrn[values["A"]].add(code)
            if any(len(codes) != 1 for codes in codes_by_mrn.values()):
                raise AssertionError(f"Inconsistent MRN mapping in {name}")
            summary.append({"worksheet_xml": name, "rows_checked": len(mapped_rows) - 1, "mapped_mrns": len(codes_by_mrn)})
        if output.read("xl/worksheets/sheet7.xml") != source.read("xl/worksheets/sheet7.xml"):
            raise AssertionError("Unexpected change to _Source Map")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    if len(sys.argv) == 3:
        report(sys.argv[1], sys.argv[2])
    elif len(sys.argv) == 5 and sys.argv[1] == "--write":
        write_mapped_workbook(sys.argv[2], sys.argv[3], sys.argv[4])
    elif len(sys.argv) == 5 and sys.argv[1] == "--verify":
        verify_mapped_workbook(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        raise SystemExit("Usage: map-webt-gl.py snapshot.xlsx reviewed_mapping.xlsx")
