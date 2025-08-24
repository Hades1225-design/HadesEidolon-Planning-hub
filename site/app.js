// site/app.js (main) — 初始化修正 + 韌性選取器 + 首次即顯示
(function () {
  // ====== 設定 ======
  // 預設讀取站內 JSON，適合 GitHub Pages（避免跨域）
  const INDEX_URL = "../public/index.json";
  // 若你想固定讀取 ci/update-index 分支的 RAW，改用下行：
  // const INDEX_URL = "https://raw.githubusercontent.com/Hades1225-design/HadesEidolon-Planning-hub/refs/heads/ci/update-index/public/index.json";

  // ====== 狀態 ======
  let DATA = [];
  let VIEW = "list"; // 會在 DOM ready 時依實際頁籤覆寫

  // ====== 工具 ======
  const esc = (s) =>
    (s || "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m]));

  const statusClass = (s) => (s ? `badge status-${s}` : "badge");
  const riskClass = (r) => (r ? `badge risk-${r}` : "badge");

  // DOM 參照（延後到 DOMContentLoaded 取得）
  let $ = null;
  let listEl, boardEl;
  let qEl, statusEl, areaEl, prioEl;
  let summaryStatus, summaryDonut;
  let viewListBtn, viewBoardBtn;

  function safeQueryAll() {
    $ = (sel) => document.querySelector(sel);

    // 容器（相容多種命名）
    listEl = document.querySelector(
      '#list, #list-view, [data-pane="list"], [data-view="list"], [aria-labelledby="tab-list"], #pane-list'
    );
    boardEl = document.querySelector(
      '#board, #board-view, [data-pane="board"], [data-view="board"], [aria-labelledby="tab-board"], #pane-board'
    );

    // 篩選器
    qEl = $("#q");
    statusEl = $("#status");
    areaEl = $("#area");
    prioEl = $("#priority");

    // 統計
    summaryStatus = document.querySelector(
      '#summary-status, [data-summary="status"]'
    );
    summaryDonut = document.querySelector(
      '#summary-donut, [data-summary="donut"]'
    );

    // 分頁按鈕（支援 aria-controls / href / data-view）
    const pickTabBtn = (forView) =>
      document.querySelector(
        `#view-${forView}, [data-view="${forView}"], [aria-controls="${forView}"], a[href="#${forView}"], button[href="#${forView}"]`
      );
    viewListBtn = pickTabBtn("list");
    viewBoardBtn = pickTabBtn("board");
  }

  // ====== 資料載入 ======
  async function load() {
    try {
      const res = await fetch(INDEX_URL, { cache: "no-store" });
      const json = await res.json();
      DATA = json.items || [];
      render(); // 抓到資料後重渲染
    } catch (e) {
      console.error("載入 index.json 失敗:", e);
      if (listEl) {
        listEl.innerHTML =
          '<div class="error">讀取 public/index.json 失敗，請確認部署路徑。</div>';
      }
    }
  }

  // ====== 篩選 + 渲染 ======
  function getFilters() {
    const q = (qEl?.value || "").toLowerCase().trim();
    const status = statusEl?.value || "";
    const area = areaEl?.value || "";
    const prio = prioEl?.value || "";
    return { q, status, area, prio };
  }

  function applyFilters(items) {
    const { q, status, area, prio } = getFilters();
    return items.filter((it) => {
      if (status && it.status !== status) return false;
      if (area && it.area !== area) return false;
      if (prio && it.priority !== prio) return false;
      if (q) {
        const hay = [
          it.title,
          it.area,
          it.priority,
          it.status,
          (it.tags || []).join(","),
          it.preview || "",
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderSummary(items) {
    if (!summaryStatus || !summaryDonut) return;
    const counts = { inbox: 0, ongoing: 0, done: 0 };
    items.forEach((it) => {
      if (counts[it.status] !== undefined) counts[it.status]++;
    });

    summaryStatus.innerHTML = `
      <span class="mr-2">規劃中: ${counts.inbox}</span>
      <span class="mr-2">進行中: ${counts.ongoing}</span>
      <span>已完成: ${counts.done}</span>
    `;

    const total = Math.max(1, items.length);
    const R = 40,
      C = 50,
      dash = 2 * Math.PI * R;
    const seg = (n) => 2 * Math.PI * R * (n / total);
    const dInbox = seg(counts.inbox),
      dOng = seg(counts.ongoing),
      dDone = seg(counts.done);

    summaryDonut.innerHTML = `
      <svg viewBox="0 0 ${C * 2} ${C * 2}" width="112" height="112" role="img" aria-label="計畫狀態圓環圖">
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dash}" class="donut-bg"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dInbox} ${dash - dInbox}" class="donut-inbox"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dOng} ${dash - dOng}" class="donut-ongoing" transform="rotate(120, ${C}, ${C})"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dDone} ${dash - dDone}" class="donut-done" transform="rotate(240, ${C}, ${C})"></circle>
      </svg>
      <div class="donut-total">${items.length}</div>
    `;
  }

  function card(it) {
    const tags = (it.tags || [])
      .map((t) => `<span class="tag">${esc(t)}</span>`)
      .join("");
    const meta = [
      `<span class="${statusClass(it.status)}">${esc(it.status || "")}</span>`,
      `<span class="${riskClass(it.risk)}">${
        it.risk ? `risk:${esc(it.risk)}` : ""
      }</span>`,
      `<span class="badge">${esc(it.area || "")}</span>`,
      `<span class="badge">${esc(it.priority || "")}</span>`,
      it.owner ? `<span class="badge">owner:${esc(it.owner)}</span>` : "",
      it.due ? `<span class="badge">due:${esc(it.due)}</span>` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const progBar = Number.isInteger(it.progress)
      ? `<div class="progress"><div class="bar" style="width:${it.progress}%;"></div><span class="pct">${it.progress}%</span></div>`
      : "";

    return `
      <article class="card">
        <h3 class="title">${esc(it.title)}</h3>
        <div class="meta">${meta}</div>
        <div class="tags">${tags}</div>
        ${progBar}
        <p class="preview">${esc((it.preview || "").slice(0, 180))}</p>
        <div class="card-actions">
          <a class="btn btn-sm" href="${esc(it.url || "#")}" target="_blank" rel="noopener">檢視原始檔</a>
        </div>
      </article>
    `;
  }

  function renderList(items) {
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = '<div class="empty">沒有符合條件的計劃。</div>';
      return;
    }
    listEl.innerHTML = items.map(card).join("");
  }

  function renderBoard(items) {
    if (!boardEl) return;
    // 支援欄位容器 class="col" data-col="inbox|ongoing|done" 裡的 .col-body
    boardEl.querySelectorAll(".col-body").forEach((n) => (n.innerHTML = ""));
    const cols = { inbox: [], ongoing: [], done: [] };
    items.forEach((it) => (cols[it.status] || cols.inbox).push(it));
    ["inbox", "ongoing", "done"].forEach((k) => {
      const wrap = boardEl.querySelector(`.col[data-col="${k}"] .col-body`);
      if (wrap) wrap.innerHTML = cols[k].map(card).join("");
    });
  }

  function render() {
    const filtered = applyFilters(DATA);
    renderSummary(filtered);

    // 若只有單一容器存在，直接渲染該容器
    if (listEl && !boardEl) {
      listEl?.classList.remove("hidden");
      listEl?.removeAttribute("aria-hidden");
      renderList(filtered);
      return;
    }
    if (boardEl && !listEl) {
      boardEl?.classList.remove("hidden");
      boardEl?.removeAttribute("aria-hidden");
      renderBoard(filtered);
      return;
    }

    // 兩種容器皆存在時，依 VIEW 切換
    if (VIEW === "list") {
      listEl?.classList.remove("hidden");
      listEl?.removeAttribute("aria-hidden");
      boardEl?.classList.add("hidden");
      boardEl?.setAttribute("aria-hidden", "true");
      renderList(filtered);
      viewListBtn?.classList.add("active");
      viewBoardBtn?.classList.remove("active");
    } else {
      listEl?.classList.add("hidden");
      listEl?.setAttribute("aria-hidden", "true");
      boardEl?.classList.remove("hidden");
      boardEl?.removeAttribute("aria-hidden");
      renderBoard(filtered);
      viewBoardBtn?.classList.add("active");
      viewListBtn?.classList.remove("active");
    }
  }

  // ====== 啟動：等 DOM ready，再做所有事 ======
  document.addEventListener("DOMContentLoaded", () => {
    // 1) 抓節點
    safeQueryAll();

    // 1.1 同步初始 VIEW（網址 hash 或 DOM 標記）
    const hash = (location.hash || "").replace("#", "");
    if (hash === "board" || hash === "list") VIEW = hash;

    const domActiveIsBoard =
      viewBoardBtn?.classList?.contains("active") ||
      viewBoardBtn?.getAttribute?.("aria-selected") === "true" ||
      viewBoardBtn?.getAttribute?.("aria-pressed") === "true" ||
      viewBoardBtn?.getAttribute?.("aria-controls") === "board";
    const domActiveIsList =
      viewListBtn?.classList?.contains("active") ||
      viewListBtn?.getAttribute?.("aria-selected") === "true" ||
      viewListBtn?.getAttribute?.("aria-pressed") === "true" ||
      viewListBtn?.getAttribute?.("aria-controls") === "list";
    if (domActiveIsBoard) VIEW = "board";
    if (domActiveIsList) VIEW = "list";

    // 2) 綁事件（可選鏈避免無節點報錯）
    qEl?.addEventListener("input", render);
    statusEl?.addEventListener("change", render);
    areaEl?.addEventListener("change", render);
    prioEl?.addEventListener("change", render);

    viewListBtn?.addEventListener("click", () => {
      VIEW = "list";
      history.replaceState(null, "", "#list");
      render();
    });
    viewBoardBtn?.addEventListener("click", () => {
      VIEW = "board";
      history.replaceState(null, "", "#board");
      render();
    });

    // 3) 先渲染一次（校正顯示/隱藏與 active 樣式）
    render();

    // 4) 再載資料（抓到後會再 render 一次）
    load();
  });
})();
