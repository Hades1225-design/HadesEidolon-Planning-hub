---
id: plan-2025-08-28-reorder-ui
title: Reorder 系統優化與架構確認
area: web
priority: P1
status: ongoing # inbox | ongoing | done
owner: Hades
progress: 70
risk: medium
tags: [reorder, ui, json, github-pages]
links:
  - https://hades1225-design.github.io/HadesEidolon/site/reorder/index.html
created: 2025-08-26
updated: 2025-08-28
---

## 目標
重構 `/site/reorder` 下的整體架構，確保 **多 JSON 編輯**、**即時同步**、**多端體驗一致**。

## 任務
- [x] 改用 **Cloudflare Worker** 提交 JSON，即時更新，不再等待 GitHub Actions
- [x] `index.js` → 採用絕對時間，排序與標色邏輯統一
- [x] `app-time.js` → 嚴格 24 小時制，套用 -12 小時自動判定日期
- [x] `app-names.js` → 儲存只更新名字與順序，不更動時間
- [x] `common.js` → 讀檔改為直接 `/public/*.json`，加 `?ts=` 避快取
- [ ] 手機自適應版面（未完成）
- [ ] API 優化：直接使用 Worker 回傳最後更新時間（避免額外 GitHub API）
- [ ] 規劃多 JSON 版本管理

## 風險
- **中**：GitHub Pages 快取仍存在，雖然避免了 JSON 快取，但 HTML / JS 仍需版本標記
- **低**：Cloudflare Worker 配額需監控

## 下一步
- [ ] 完成 RWD 手機版調整
- [ ] 補充文件：寫明 `/site/reorder` 下所有 JS 相依性
- [ ] 研究 Worker 直接回傳最新 commit 時間，減少 API request