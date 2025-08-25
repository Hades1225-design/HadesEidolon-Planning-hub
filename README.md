# HadesEidolon-Planning-hub

以 Markdown 為核心的計劃中樞，含自動化與可視化網站。

[![Deploy Planning Site](https://img.shields.io/github/actions/workflow/status/Hades1225-design/HadesEidolon-Planning-hub/deploy-pages.yml?branch=main&label=pages)](https://github.com/Hades1225-design/HadesEidolon-Planning-hub/actions/workflows/deploy-pages.yml)
[![Build index.json](https://img.shields.io/github/actions/workflow/status/Hades1225-design/HadesEidolon-Planning-hub/build-index.yml?branch=main&label=index)](https://github.com/Hades1225-design/HadesEidolon-Planning-hub/actions/workflows/build-index.yml)
[![Website](https://img.shields.io/website?url=https://Hades1225-design.github.io/HadesEidolon-Planning-hub/site/)](https://Hades1225-design.github.io/HadesEidolon-Planning-hub/site/)

## 使用
1. 在 `plans/inbox/` 新增計劃（可用 `plans/templates/_PLAN_TEMPLATE.md`）。
2. 本地或 CI 執行：`python scripts/build_index.py` → 生成/更新 `public/index.json`。
3. 推送到 GitHub（會觸發 Actions）：
   - `build-index.yml`：建立/更新 PR 以提交 `public/index.json`
   - `deploy-pages.yml`：部署 `site/` + `public/` 到 GitHub Pages

發布的頁面網址：**https://Hades1225-design.github.io/HadesEidolon-Planning-hub/site/**

---

## 結構
```
plans/
  inbox/
  ongoing/
  done/
  templates/_PLAN_TEMPLATE.md
docs/
  decisions/_ADR_TEMPLATE.md
  blueprints/_BLUEPRINT_TEMPLATE.md
  research/_RESEARCH_TEMPLATE.md
public/                # 由腳本/CI 產生 index.json
schemas/
  plan.schema.json
  index.schema.json
scripts/
  build_index.py
site/
  index.html
  app.js
  styles.css
.github/workflows/
  build-index.yml
  deploy-pages.yml
```
