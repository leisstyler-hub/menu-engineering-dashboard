import decimal
import html
import json
import re
import sys
import zipfile
from pathlib import Path


ROW_RE = re.compile(rb"<row\b[^>]*>.*?</row>", re.S)
N_CELL_RE = re.compile(rb'<c\b[^>]*\br="N\d+"[^>]*>(.*?)</c>', re.S)
TEXT_RE = re.compile(rb"<t(?:\s[^>]*)?>(.*?)</t>", re.S)
ROW_NUMBER_RE = re.compile(rb'(<row\b[^>]*\br=")(\d+)(")')
CELL_REFERENCE_RE = re.compile(rb'(<c\b[^>]*\br=")([A-Z]+)(\d+)(")')
THRESHOLD = decimal.Decimal("0.01")


def parse_cost(row):
    cell = N_CELL_RE.search(row)
    if not cell:
        return None
    text = TEXT_RE.search(cell.group(1))
    if not text:
        return None
    raw = html.unescape(text.group(1).decode("utf-8")).strip()
    clean = raw.replace("$", "").replace(",", "").replace(" ", "").replace("\u00a0", "")
    if clean.startswith("(") and clean.endswith(")"):
        clean = f"-{clean[1:-1]}"
    try:
        return decimal.Decimal(clean), raw
    except decimal.InvalidOperation:
        return None


def is_valid_dollar_cost(row):
    parsed = parse_cost(row)
    if parsed is None:
        return False
    return "$" in parsed[1]


def inspect(input_path):
    with zipfile.ZipFile(input_path) as archive:
        result = []
        for index in range(1, 8):
            data = archive.read(f"xl/worksheets/sheet{index}.xml")
            rows = ROW_RE.findall(data)
            numeric = 0
            remove = []
            for position, row in enumerate(rows, 1):
                parsed = parse_cost(row)
                if parsed is None:
                    continue
                numeric += 1
                value, raw = parsed
                if value < THRESHOLD:
                    remove.append((position, raw))
            result.append({
                "sheet_index": index,
                "rows": len(rows),
                "numeric_column_n": numeric,
                "remove": len(remove),
                "examples": remove[:8],
                "features": {
                    "formulas": data.count(b"<f"),
                    "auto_filters": data.count(b"<autoFilter"),
                    "tables": data.count(b"<tablePart"),
                    "conditional_formats": data.count(b"<conditionalFormatting"),
                    "merged_ranges": data.count(b"<mergeCell"),
                    "data_validations": data.count(b"<dataValidations"),
                },
            })
    print(json.dumps(result, indent=2))


def shift_row_references(row, deleted_before):
    def shift_row(match):
        return match.group(1) + str(int(match.group(2)) - deleted_before).encode() + match.group(3)

    def shift_cell(match):
        return match.group(1) + match.group(2) + str(int(match.group(3)) - deleted_before).encode() + match.group(4)

    row = ROW_NUMBER_RE.sub(shift_row, row, count=1)
    return CELL_REFERENCE_RE.sub(shift_cell, row)


def filter_sheet(data, should_remove):
    result = bytearray()
    cursor = 0
    deleted = 0
    removed_values = []
    for match in ROW_RE.finditer(data):
        result.extend(data[cursor:match.start()])
        row = match.group(0)
        if should_remove(row):
            deleted += 1
            parsed = parse_cost(row)
            removed_values.append(parsed[1] if parsed is not None else None)
        else:
            result.extend(shift_row_references(row, deleted))
        cursor = match.end()
    result.extend(data[cursor:])
    return bytes(result), deleted, removed_values


def remove_subcent_cost(row):
    parsed = parse_cost(row)
    return parsed is not None and parsed[0] < THRESHOLD


def has_recipe_portion_cost_column(data):
    first_row = ROW_RE.search(data)
    return first_row is not None and b"Recipe Portion Cost" in first_row.group(0)


def remove_invalid_dollar_cost(row):
    row_number = ROW_NUMBER_RE.search(row)
    return row_number is not None and int(row_number.group(2)) > 1 and not is_valid_dollar_cost(row)


def filter_workbook(input_path, output_path):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    results = []
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(output_path, "w", allowZip64=True) as target:
        for info in source.infolist():
            data = source.read(info.filename)
            if re.fullmatch(r"xl/worksheets/sheet[1-7]\.xml", info.filename):
                filtered, deleted, values = filter_sheet(data, remove_subcent_cost)
                data = filtered
                results.append({"worksheet_xml": info.filename, "rows_removed": deleted, "removed_values": values})
            target.writestr(info, data, compress_type=info.compress_type)
    print(json.dumps(results, indent=2))


def verify(input_path, output_path):
    summary = []
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(output_path, "r") as output:
        for index in range(1, 8):
            name = f"xl/worksheets/sheet{index}.xml"
            expected, removed, _ = filter_sheet(source.read(name), remove_subcent_cost)
            actual = output.read(name)
            if expected != actual:
                raise AssertionError(f"Unexpected content change in {name}")
            rows = ROW_RE.findall(actual)
            for expected_row, row in enumerate(rows, 1):
                row_match = ROW_NUMBER_RE.search(row)
                if not row_match or int(row_match.group(2)) != expected_row:
                    raise AssertionError(f"Non-contiguous row numbering in {name} at {expected_row}")
                for cell in CELL_REFERENCE_RE.finditer(row):
                    if int(cell.group(3)) != expected_row:
                        raise AssertionError(f"Cell reference mismatch in {name} row {expected_row}")
            remaining = sum(1 for row in rows if (parsed := parse_cost(row)) is not None and parsed[0] < THRESHOLD)
            if remaining:
                raise AssertionError(f"Remaining sub-cent values in {name}: {remaining}")
            summary.append({"worksheet_xml": name, "rows_removed": removed, "remaining_sub_cent_rows": remaining})
    print(json.dumps(summary, indent=2))


def filter_invalid_costs(input_path, output_path):
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    results = []
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(output_path, "w", allowZip64=True) as target:
        for info in source.infolist():
            data = source.read(info.filename)
            if re.fullmatch(r"xl/worksheets/sheet[1-7]\.xml", info.filename) and has_recipe_portion_cost_column(data):
                filtered, deleted, values = filter_sheet(data, remove_invalid_dollar_cost)
                data = filtered
                results.append({"worksheet_xml": info.filename, "rows_removed": deleted, "removed_values": values[:8]})
            target.writestr(info, data, compress_type=info.compress_type)
    print(json.dumps(results, indent=2))


def verify_valid_costs(input_path, output_path):
    summary = []
    with zipfile.ZipFile(input_path, "r") as source, zipfile.ZipFile(output_path, "r") as output:
        for index in range(1, 8):
            name = f"xl/worksheets/sheet{index}.xml"
            source_data = source.read(name)
            actual = output.read(name)
            if has_recipe_portion_cost_column(source_data):
                expected, removed, _ = filter_sheet(source_data, remove_invalid_dollar_cost)
                if expected != actual:
                    raise AssertionError(f"Unexpected content change in {name}")
                rows = ROW_RE.findall(actual)
                for expected_row, row in enumerate(rows, 1):
                    row_match = ROW_NUMBER_RE.search(row)
                    if not row_match or int(row_match.group(2)) != expected_row:
                        raise AssertionError(f"Non-contiguous row numbering in {name} at {expected_row}")
                    for cell in CELL_REFERENCE_RE.finditer(row):
                        if int(cell.group(3)) != expected_row:
                            raise AssertionError(f"Cell reference mismatch in {name} row {expected_row}")
                remaining_invalid = sum(1 for row in rows[1:] if not is_valid_dollar_cost(row))
                if remaining_invalid:
                    raise AssertionError(f"Remaining invalid cost rows in {name}: {remaining_invalid}")
                summary.append({"worksheet_xml": name, "rows_removed": removed, "remaining_invalid_cost_rows": remaining_invalid})
            elif actual != source_data:
                raise AssertionError(f"Unexpected change to non-cost worksheet {name}")
            else:
                summary.append({"worksheet_xml": name, "rows_removed": 0, "preserved_non_cost_sheet": True})
    print(json.dumps(summary, indent=2))


def classify(input_path):
    with zipfile.ZipFile(input_path, "r") as archive:
        summary = []
        for index in range(1, 8):
            data = archive.read(f"xl/worksheets/sheet{index}.xml")
            rows = ROW_RE.findall(data)
            invalid = 0
            examples = []
            for position, row in enumerate(rows[1:], 2):
                if not is_valid_dollar_cost(row):
                    invalid += 1
                    parsed = parse_cost(row)
                    examples.append((position, parsed[1] if parsed else None))
            summary.append({"sheet_index": index, "invalid_or_blank_column_n": invalid, "examples": examples[:8]})
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    if len(sys.argv) == 3 and sys.argv[1] == "--classify":
        classify(sys.argv[2])
    elif len(sys.argv) == 2:
        inspect(sys.argv[1])
    elif len(sys.argv) == 3:
        filter_workbook(sys.argv[1], sys.argv[2])
    elif len(sys.argv) == 4 and sys.argv[1] == "--verify":
        verify(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 4 and sys.argv[1] == "--filter-invalid":
        filter_invalid_costs(sys.argv[2], sys.argv[3])
    elif len(sys.argv) == 4 and sys.argv[1] == "--verify-valid":
        verify_valid_costs(sys.argv[2], sys.argv[3])
    else:
        raise SystemExit("Usage: filter-price-rows.py input.xlsx [output.xlsx]")
