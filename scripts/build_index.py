#!/usr/bin/env python3
import os, json, re, datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
PLANS_DIR = os.path.join(ROOT, "plans")
PUBLIC_DIR = os.path.join(ROOT, "public")
INDEX_PATH = os.path.join(PUBLIC_DIR, "index.json")

def norm_tag(s: str) -> str:
    """標準化 tags：小寫、trim、空白轉-、只保留允許字元"""
    if not s:
        return ""
    s = s.strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9\-\_\:\.\u4e00-\u9fff]", "", s)
    return s

def parse_tags(fm):
    """只抓 Front Matter 的 tags 欄位"""
    tags = []
    raw = fm.get("tags")
    if raw:
        if isinstance(raw, str):
            candidates = re.split(r"[,\s]+", raw.strip("[]"))
        elif isinstance(raw, list):
            candidates = raw
        else:
            candidates = []
        tags = [norm_tag(t) for t in candidates if t]
    return tags

def parse_markdown(path):
    """解析 MD 檔案 Front Matter 與內文"""
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
            if h:
                headings.append(h)
        if not preview and ln.strip():
            preview = ln.strip()
    return fm, body, preview, headings

def parse_int(x):
    try:
        return int(str(x))
    except:
        return None

def collect():
    """收集所有 plans/*.md 並整理為 index.json"""
    items = []
    for sub in ["", "inbox", "ongoing", "done"]:
        d = os.path.join(PLANS_DIR, sub) if sub else PLANS_DIR
        if not os.path.isdir(d):
            continue
        for fn in os.listdir(d):
            if fn.startswith(".") or not fn.endswith(".md"):
                continue
            p = os.path.join(d, fn)
            fm, body, preview, heads = parse_markdown(p)
            relpath = os.path.relpath(p, ROOT).replace("\\", "/")
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
                "tags": parse_tags(fm),  # ✅ 僅使用 MD Front Matter 的 tags
                "links": [],
                "path": relpath,
                "created": fm.get("created",""),
                "updated": fm.get("updated",""),
                "preview": preview,
                "headings": heads
            })
    prio_order = {"P0":0, "P1":1, "P2":2}
    status_order = {"inbox":0, "ongoing":1, "done":2}
    items.sort(key=lambda x: (
        status_order.get(x.get("status"), 9),
        prio_order.get(x.get("priority"), 9),
        x.get("updated", "")
    ))
    return items

def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    items = collect()
    index = {
        "version": "1.0.1",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "items": items
    }
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Wrote {INDEX_PATH} with {len(items)} items.")

if __name__ == "__main__":
    main()