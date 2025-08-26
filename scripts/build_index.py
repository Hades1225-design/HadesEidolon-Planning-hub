#!/usr/bin/env python3
import os, json, re, datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
PLANS_DIR = os.path.join(ROOT, "plans")
PUBLIC_DIR = os.path.join(ROOT, "public")
INDEX_PATH = os.path.join(PUBLIC_DIR, "index.json")

# -----------------------------
# Tag 正規化與自動擷取
# -----------------------------
STOPWORDS_ZH = {"的", "與", "和"}
STOPWORDS_EN = {"the", "and", "for", "of", "to", "in", "on", "a", "an"}
STOPWORDS = STOPWORDS_ZH | STOPWORDS_EN

def norm_tag(s: str) -> str:
    """標準化：全小寫、trim、空白轉-、僅留 a-z0-9-_.: 與中日韓。"""
    if not s:
        return ""
    s = s.strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9\-\_\:\.\u4e00-\u9fff]", "", s)
    return s

def parse_tags_from_any(fm: dict, body: str, path: str, area: str, status: str, priority: str):
    tags = set()

    # 1) Front Matter 的 tags（逗號字串或 list）
    raw = fm.get("tags")
    if raw:
        if isinstance(raw, str):
            candidates = re.split(r"[,\s]+", raw.strip("[]"))
        elif isinstance(raw, list):
            candidates = raw
        else:
            candidates = []
        for t in candidates:
            t = norm_tag(t)
            if t and t not in STOPWORDS and len(t) > 1:
                tags.add(t)

    return sorted(tags)

# -----------------------------
# 解析 Markdown Front Matter
# -----------------------------
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

# -----------------------------
# 收集所有卡片 + 全域統計
# -----------------------------
def collect():
    items = []
    tag_counter = {}
    area_counter = {}

    # 根目錄 + 三資料夾並行
    for sub in ["", "inbox", "ongoing", "done"]:
        d = os.path.join(PLANS_DIR, sub) if sub else PLANS_DIR
        if not os.path.isdir(d):
            continue
        for fn in os.listdir(d):
            if fn.startswith(".") or not fn.endswith(".md"):
                continue
            p = os.path.join(d, fn)
            fm, body, preview, heads = parse_markdown(p)

            area = fm.get("area", "")
            status = fm.get("status", "")
            priority = fm.get("priority", "")
            relpath = os.path.relpath(p, ROOT).replace("\\", "/")

            # 自動擷取 tags
            tags = parse_tags_from_any(fm, body, relpath, area, status, priority)

            # 全域統計
            for t in tags:
                tag_counter[t] = tag_counter.get(t, 0) + 1
            if area:
                area_counter[area] = area_counter.get(area, 0) + 1

            items.append({
                "id": fm.get("id",""),
                "title": fm.get("title",""),
                "area": area,
                "priority": priority,
                "status": status,
                "owner": fm.get("owner"),
                "progress": parse_int(fm.get("progress")),
                "risk": fm.get("risk"),
                "due": fm.get("due"),
                "tags": tags,
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
    return items, tag_counter, area_counter

# -----------------------------
# 寫出 index.json
# -----------------------------
def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    items, tag_counter, area_counter = collect()
    index = {
        "version": "1.1.0",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "items": items,
        "tags_index": sorted(
            [{"tag": k, "count": v} for k, v in tag_counter.items()],
            key=lambda x: (-x["count"], x["tag"])
        ),
        "areas": sorted(
            [{"area": k, "count": v} for k, v in area_counter.items()],
            key=lambda x: (-x["count"], x["area"])
        )
    }
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Wrote {INDEX_PATH} with {len(items)} items, {len(tag_counter)} tags, {len(area_counter)} areas.")

if __name__ == "__main__":
    main()