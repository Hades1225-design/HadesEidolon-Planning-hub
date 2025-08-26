#!/usr/bin/env python3
import os, json, re, datetime

# 專案根目錄
ROOT = os.path.dirname(os.path.dirname(__file__))
PLANS_DIR = os.path.join(ROOT, "plans")
PUBLIC_DIR = os.path.join(ROOT, "public")
INDEX_PATH = os.path.join(PUBLIC_DIR, "index.json")

# -----------------------------
# 解析 Markdown Front Matter
# -----------------------------
def parse_markdown(path):
    """解析每個 .md 檔案，回傳 front matter、內文、預覽、標題清單"""
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

# -----------------------------
# 處理數字欄位 (progress)
# -----------------------------
def parse_int(x):
    try:
        return int(str(x))
    except:
        return None

# -----------------------------
# 收集所有計劃卡片與 area
# -----------------------------
def collect():
    items = []
    area_counter = {}

    # 支援 plans/ 與 plans/inbox, ongoing, done 三種結構
    for sub in ["", "inbox", "ongoing", "done"]:
        d = os.path.join(PLANS_DIR, sub) if sub else PLANS_DIR
        if not os.path.isdir(d):
            continue
        for fn in os.listdir(d):
            if fn.startswith(".") or not fn.endswith(".md"):
                continue
            p = os.path.join(d, fn)
            fm, body, preview, heads = parse_markdown(p)

            # 收集 area
            area = fm.get("area", "").strip()
            if area:
                area_counter[area] = area_counter.get(area, 0) + 1

            relpath = os.path.relpath(p, ROOT).replace("\\", "/")
            items.append({
                "id": fm.get("id",""),
                "title": fm.get("title",""),
                "area": area,
                "priority": fm.get("priority",""),
                "status": fm.get("status",""),
                "owner": fm.get("owner"),
                "progress": parse_int(fm.get("progress")),
                "risk": fm.get("risk"),
                "due": fm.get("due"),
                "tags": [],  # 已移除 tags 自動收集
                "links": [],
                "path": relpath,
                "created": fm.get("created",""),
                "updated": fm.get("updated",""),
                "preview": preview,
                "headings": heads
            })

    # 依狀態 → 優先度 → 更新時間排序
    prio_order = {"P0": 0, "P1": 1, "P2": 2}
    status_order = {"inbox": 0, "ongoing": 1, "done": 2}
    items.sort(key=lambda x: (
        status_order.get(x.get("status"), 9),
        prio_order.get(x.get("priority"), 9),
        x.get("updated", "")
    ))

    # 回傳 items 與所有唯一的 area
    return items, sorted(area_counter.keys())

# -----------------------------
# 寫出 index.json
# -----------------------------
def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)
    items, areas = collect()
    index = {
        "version": "2.0.0",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "items": items,
        "areas": areas  # 新增所有唯一的 area 清單
    }

    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"Wrote {INDEX_PATH} with {len(items)} items, {len(areas)} unique areas.")

if __name__ == "__main__":
    main()