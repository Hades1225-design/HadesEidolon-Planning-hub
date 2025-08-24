---
id: plan-2025-08-24-planning-hub
title: HadesEidolon-Planning-hub 專案建置與自動化
area: infra
priority: P0
status: ongoing
owner: Hades
progress: 45
risk: medium
tags: [meta, infra, automation, github, planning-hub]
links:
  - https://github.com/Hades1225-design/HadesEidolon-Planning-hub
  - https://Hades1225-design.github.io/HadesEidolon-Planning-hub/site/
created: 2025-08-24
updated: 2025-08-24
---

## 目標
打造一個以 Markdown 為核心的計劃中樞，支援：
- 自動索引 (`plans/*` → `public/index.json`)
- GitHub Actions 部署
- 可視化計劃網站
- 後續可擴充 ADR、進度分析、搜尋與詳情頁

## 里程碑
- ✅ 建立專案骨架、基本資料夾結構
- ✅ 設定 GitHub Actions，自動更新 `public/index.json`
- ✅ GitHub Pages 自動部署
- 🔄 計劃詳情頁 (即將開發)
- 🔲 進度分析 Dashboard
- 🔲 ADR 可視化整合

## 下一步
- 增加計劃詳情頁功能（Markdown 渲染）
- 增強進度統計、標籤與過濾
- ADR 文件同步到網站
