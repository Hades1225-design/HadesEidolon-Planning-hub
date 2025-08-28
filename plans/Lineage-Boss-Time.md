---
id: plan-2025-08-28-lineage-boss-time
title: 天堂 BOSS 時間管理系統
area: web
priority: P1
status: ongoing   # inbox | ongoing | done
owner: Hades
progress: 70
risk: medium
tags: [lineage, boss, time, reorder, json, github-pages]
links:
  - https://hades1225-design.github.io/HadesEidolon/site/reorder/index.html
created: 2025-08-26
updated: 2025-08-28
---

## 目標
開發並優化 **天堂 BOSS 時間管理系統**，用於快速管理各 BOSS 重生時間。  
提供 **JSON 多檔案讀寫**、**即時更新**、**手機版適配**，降低 GitHub Pages 部署延遲對使用體驗的影響。

## 任務
- [x] 改用 **Cloudflare Worker** 提交 JSON，即時更新
- [x] `index.js` → 採用絕對時間排序，卡片狀態顏色統一
- [x] `app-time.js` → 嚴格 24 小時制，套用 **-12 小時自動日期判定**
- [x] `app-names.js` → 僅更新名字與順序，不覆蓋時間
- [x] `common.js` → 改為直接讀取 `/public/*.json`，加 `?ts=` 避快取
- [ ] 新增手機版 RWD 自適應
- [ ] Worker API 優化：直接回傳最後更新時間，避免多餘的 GitHub API
- [ ] 多 JSON 支援：允許切換不同 BOSS 清單

## 風險
- **中**：GitHub Pages HTML / JS 靜態快取，需依靠版本標記避免過舊載入
- **低**：Cloudflare Worker 配額限制

## 下一步
- [ ] 完成 RWD 手機版調整
- [ ] 提供 `/site/reorder` 系統架構說明文件
- [ ] 加入 Worker commit 查詢功能，減少 API request