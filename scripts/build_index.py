#!/usr/bin/env python3
import os, json, re, datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
PLANS_DIR = os.path.join(ROOT, "plans")
PUBLIC_DIR = os.path.join(ROOT, "public")
INDEX_PATH = os.path.join(PUBLIC_DIR, "index.json")

def parse_markdown(path):
    text = open(path, "r", encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        return {}, text, "", []
    fm_text, body = m.group(1), m.group(2)
    fm = {}
    for line in fm_text.splitlines():
        if ":" not in line: 
            continue
        key, val = line.split(":", 1)
        key = key.strip()
        val = val.strip().strip("'").strip('"')
        fm[key] = val
    preview = ""
    headings = []
    for ln in body.splitlines():
        if ln.startswith("#"):
            h = ln.strip("# ").strip()
            if h: headings.append(h)
        if not preview and ln.strip():
            preview = ln.strip()
    return fm, body, preview, headings

def parse_int(x):
    try:
        return int(str(x))
    except:
        return None

def collect():
    items = []
    for sub in ["inbox", "ongoing", "done"]:
        d = os.path.join(PLANS_DIR, sub)
        if not os.path.isdir(d): 
            continue
        for fn in os.listdir(d):
            if not fn.endswith(".md"): 
                continue
            p = os.path.join(d, fn)
            fm, body, preview, heads = parse_markdown(p)
            items.append({
                "id": fm.get("id",""),
                "title": fm.get("title",""),
                "area": fm.get("area",""),
                "priority": fm.get("priority",""),
                "status": fm.get("status",""),
                "owner": fm.get("owner"),
                "progress": parse_int(fm.get("progress")),
                "risk": fm.get("risk"),
                "due": fm.get("due"),
                "tags": [],
                "links": [],
                "path": os.path.relpath(p, ROOT).replace("\\","/"),
                "created": fm.get("created",""),
                "updated": fm.get("updated",""),
                "preview": preview,
                "headings": heads
            })
    prio_order = {"P0":0,"P1":1,"P2":2}
    status_order = {"inbox":0,"ongoing":1,"done":2}
    items.sort(key=lambda x: (status_order.get(x.get("status"),9),
                              prio_order.get(x.get("priority"),9),
                              x.get("updated","")))
    return items

def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    items = collect()
    index = {
        "version": "1.0.0",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "items": items
    }
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Wrote {INDEX_PATH} with {len(items)} items.")

if __name__ == "__main__":
    main()
