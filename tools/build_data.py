#!/usr/bin/env python3
"""
Optional helper: rebuilds data/inventory.js from the cabinet .docx files.

Usage:   python3 tools/build_data.py  path/to/folder_with_docx  data/inventory.js
Needs:   pip install python-docx

Each cabinet file (e.g. HC-06.docx) must contain one table:
  row 1 = cabinet name, row 2 = totals line, row 3 = header,
  then rows of: S.no | Name | Qty | Tags | Condition | Remarks
Summary.docx supplies the Info tab (date, managed by, rules).
"""
import sys, os, re, json, glob
from docx import Document

def rows_of(table):
    out = []
    for r in table.rows:
        seen, cells = [], []
        for c in r.cells:
            if c._tc in seen:
                continue
            seen.append(c._tc)
            cells.append(c.text.strip())
        out.append(cells)
    return out

def parse_cabinet(path):
    t = Document(path).tables[0]
    rows = rows_of(t)
    name = rows[0][0]
    items = []
    for r in rows[3:]:
        r = (r + [""] * 6)[:6]
        tags = [x.strip() for x in re.split(r"[;\n]", r[3]) if x.strip()]
        items.append({"n": r[0], "name": r[1], "qty": r[2], "tags": tags,
                      "condition": r[4], "remarks": r[5]})
    return name, items

def parse_summary(path):
    d = Document(path)
    rules = [re.sub(r"^\s*\d+\.\s*", "", p.text).strip() for p in d.paragraphs if p.text.strip()]
    meta = {}
    for r in rows_of(d.tables[1]):
        if len(r) >= 2:
            meta[r[0]] = r[1]
    return {"date": meta.get("Date of Inventory Management", ""),
            "managedBy": meta.get("Inventory Managed By", ""),
            "rules": rules}

def main(src, dst):
    cabinets = {}
    for f in sorted(glob.glob(os.path.join(src, "*.docx"))):
        if os.path.basename(f).lower().startswith("summary"):
            continue
        name, items = parse_cabinet(f)
        cabinets[name] = items
    summary = parse_summary(os.path.join(src, "Summary.docx"))
    # every cabinet on the map must exist, even if no list was supplied (e.g. LC-01)
    for n in ["LC-01","LC-02","LC-03","LC-04","LC-05","HC-06","HC-07","HC-08","HC-09","HC-10"]:
        cabinets.setdefault(n, [])
    cabinets = dict(sorted(cabinets.items(), key=lambda kv: (kv[0][:2] != "LC", kv[0])))
    # rules such as "all pens and markers are available in LC-02" become searchable notes
    notes = {}
    for rule in summary["rules"]:
        m = re.search(r"available in ([A-Z]{2}-\d+)", rule)
        if m:
            notes.setdefault(m.group(1), []).append(re.sub(r"^Note:\s*", "", rule))
    with open(dst, "w", encoding="utf-8") as fh:
        fh.write("// Auto-generated from the cabinet .docx files. Safe to edit by hand.\n")
        fh.write("window.INVENTORY = " + json.dumps({"summary": summary, "notes": notes, "cabinets": cabinets},
                 indent=2, ensure_ascii=False) + ";\n")
    print("Wrote", dst, "-", sum(len(v) for v in cabinets.values()), "items")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
