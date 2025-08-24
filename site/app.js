(function(){
  // ====== State ======
  let DATA = [];
  let VIEW = 'list'; // 預設顯示清單（將在 DOM ready 時依據實際 active tab 覆寫）

  // 預設讀取站內 index.json。若要固定讀取 ci/update-index 的 RAW，改用下行註解
  const INDEX_URL = '../public/index.json';
  // const INDEX_URL = 'https://raw.githubusercontent.com/Hades1225-design/HadesEidolon-Planning-hub/refs/heads/ci/update-index/public/index.json';

  // ====== Helpers ======
  const esc = (s) => (s || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const statusClass = s => s ? `badge status-${s}` : 'badge';
  const riskClass   = r => r ? `badge risk-${r}`   : 'badge';

  // 這些節點在 DOM 讀取完成後再抓
  let $ = null;
  let listEl, qEl, statusEl, areaEl, prioEl, summaryStatus, summaryDonut, viewListBtn, viewBoardBtn, boardEl;

  function safeQueryAll() {
    $ = (s) => document.querySelector(s);

    // 容器：盡量相容多種命名
    listEl = document.querySelector('#list, #list-view, [data-pane="list"], [data-view="list"], [aria-labelledby="tab-list"], [id="pane-list"]');
    boardEl = document.querySelector('#board, #board-view, [data-pane="board"], [data-view="board"], [aria-labelledby="tab-board"], [id="pane-board"]');

    // 篩選器
    qEl      = $('#q');
    statusEl = $('#status');
    areaEl   = $('#area');
    prioEl   = $('#priority');

    // 統計
    summaryStatus = document.querySelector('#summary-status, [data-summary="status"]');
    summaryDonut  = document.querySelector('#summary-donut,  [data-summary="donut"]');

    // 分頁按鈕（支援 aria-controls / href / data-view）
    const pickTabBtn = (forView) => (
      document.querySelector(
        `#view-${forView}, [data-view="${forView}"], [aria-controls="${forView}"], a[href="#${forView}"], button[href="#${forView}"]`
      )
    );
    viewListBtn  = pickTabBtn('list');
    viewBoardBtn = pickTabBtn('board');
  }

  // ====== Data load (方案 2 核心) ======
  async function initBoardData() {
    try {
      const res  = await fetch(INDEX_URL, { cache: 'no-store' });
      const json = await res.json();
      DATA = json.items || [];
      render();
    } catch (e) {
      if (listEl) {
        listEl.innerHTML = '<div class="error">讀取 public/index.json 失敗，請確認部署路徑。</div>';
      }
      console.error('載入 index.json 失敗: ', e);
    }
  }

  // ====== Filters & Render ======
  function filters(){
    const q = (qEl?.value || '').toLowerCase().trim();
    const status = statusEl?.value || '';
    const area   = areaEl?.value   || '';
    const prio   = prioEl?.value   || '';
    return { q, status, area, prio };
  }

  function applyFilters(items){
    const { q, status, area, prio } = filters();
    return items.filter(it => {
      if (status && it.status !== status) return false;
      if (area   && it.area   !== area)   return false;
      if (prio   && it.priority !== prio) return false;
      if (q) {
        const hay = [
          it.title, it.area, it.priority, it.status,
          (it.tags||[]).join(','), (it.preview||'')
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderSummary(items){
    if (!summaryStatus || !summaryDonut) return;
    const counts = { inbox:0, ongoing:0, done:0 };
    items.forEach(it => { if (counts[it.status] !== undefined) counts[it.status]++; });

    summaryStatus.innerHTML = `
      <span class="mr-2">規劃中: ${counts.inbox}</span>
      <span class="mr-2">進行中: ${counts.ongoing}</span>
      <span>已完成: ${counts.done}</span>
    `;

    const total = Math.max(1, items.length);
    const R = 40, C = 50, dash = 2*Math.PI*R;
    const seg = (n) => 2*Math.PI*R*(n/total);
    const dInbox = seg(counts.inbox), dOng = seg(counts.ongoing), dDone = seg(counts.done);

    summaryDonut.innerHTML = `
      <svg viewBox="0 0 ${C*2} ${C*2}" width="112" height="112" role="img" aria-label="計畫狀態圓環圖">
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dash}" class="donut-bg"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dInbox} ${dash - dInbox}" class="donut-inbox"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dOng} ${dash - dOng}" class="donut-ongoing" transform="rotate(120, ${C}, ${C})"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke-width="10" stroke-dasharray="${dDone} ${dash - dDone}" class="donut-done" transform="rotate(240, ${C}, ${C})"></circle>
      </svg>
      <div class="donut-total">${items.length}</div>
    `;
  }

  function card(it){
    const tags = (it.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('');
    const meta = [
      `<span class="${statusClass(it.status)}">${esc(it.status||'')}</span>`,
      `<span class="${riskClass(it.risk)}">${it.risk ? `risk:${esc(it.risk)}` : ''}</span>`,
      `<span class="badge">${esc(it.area||'')}</span>`,
      `<span class="badge">${esc(it.priority||'')}</span>`,
      it.owner ? `<span class="badge">owner:${esc(it.owner)}</span>` : '',
      it.due   ? `<span class="badge">due:${esc(it.due)}</span>`     : ''
    ].filter(Boolean).join(' ');

    const progBar = Number.isInteger(it.progress)
      ? `<div class="progress"><div class="bar" style="width:${it.progress}%;"></div><span class="pct">${it.progress}%</span></div>`
      : '';

    return `
      <article class="card">
        <h3 class="title">${esc(it.title)}</h3>
        <div class="meta">${meta}</div>
        <div class="tags">${tags}</div>
        ${progBar}
        <p class="preview">${esc((it.preview||'').slice(0,180))}</p>
        <div class="card-actions">
          <a class="btn btn-sm" href="${esc(it.url || '#')}" target="_blank" rel="noopener">檢視原始檔</a>
        </div>
      </article>
    `;
  }

  function renderList(items){
    if (!listEl) return;
    if (!items.length) {
      listEl.innerHTML = '<div class="empty">沒有符合條件的計劃。</div>';
      return;
    }
    listEl.innerHTML = items.map(card).join('');
  }

  function renderBoard(items){
    if (!boardEl) return;
    boardEl.querySelectorAll('.col-body').forEach(n => (n.innerHTML = ''));
    const cols = { inbox:[], ongoing:[], done:[] };
    items.forEach(it => (cols[it.status] || cols.inbox).push(it));
    ['inbox','ongoing','done'].forEach(k => {
      const wrap = boardEl.querySelector(`.col[data-col="${k}"] .col-body`);
      if (wrap) wrap.innerHTML = cols[k].map(card).join('');
    });
  }

  function render(){
    const filtered = applyFilters(DATA);
    renderSummary(filtered);

    // 若只有一種容器存在，就直接渲染該容器
    if (listEl && !boardEl) {
      listEl?.classList.remove('hidden');
      renderList(filtered);
      return;
    }
    if (boardEl && !listEl) {
      boardEl?.classList.remove('hidden');
      renderBoard(filtered);
      return;
    }

    // 兩種容器皆存在時，依 VIEW 切換
    if (VIEW === 'list') {
      listEl?.classList.remove('hidden');
      listEl?.removeAttribute('aria-hidden');
      boardEl?.classList.add('hidden');
      boardEl?.setAttribute('aria-hidden','true');
      renderList(filtered);
      viewListBtn?.classList.add('active');
      viewBoardBtn?.classList.remove('active');
    } else {
      listEl?.classList.add('hidden');
      listEl?.setAttribute('aria-hidden','true');
      boardEl?.classList.remove('hidden');
      boardEl?.removeAttribute('aria-hidden');
      renderBoard(filtered);
      viewBoardBtn?.classList.add('active');
      viewListBtn?.classList.remove('active');
    }
  } else {
      listEl?.classList.add('hidden');
      boardEl?.classList.remove('hidden');
      renderBoard(filtered);
      viewBoardBtn?.classList.add('active');
      viewListBtn?.classList.remove('active');
    }
  }

  // ====== Init (DOM ready 才做一切) ======
  document.addEventListener('DOMContentLoaded', () => {
    // 1) 先抓節點
    safeQueryAll();

    // 1.1 同步初始 VIEW：依據 DOM 上的 active 樣式或網址 hash
    const hash = (location.hash || '').replace('#','');
    if (hash === 'board' || hash === 'list') VIEW = hash;
    const domActiveIsBoard = viewBoardBtn?.classList?.contains('active')
      || viewBoardBtn?.getAttribute?.('aria-selected') === 'true'
      || viewBoardBtn?.getAttribute?.('aria-pressed') === 'true'
      || viewBoardBtn?.getAttribute?.('aria-controls') === 'board';
    const domActiveIsList  = viewListBtn?.classList?.contains('active')
      || viewListBtn?.getAttribute?.('aria-selected') === 'true'
      || viewListBtn?.getAttribute?.('aria-pressed') === 'true'
      || viewListBtn?.getAttribute?.('aria-controls') === 'list';
    if (domActiveIsBoard) VIEW = 'board';
    if (domActiveIsList)  VIEW = 'list';

    // 2) 綁事件
    qEl?.addEventListener('input', render);
    statusEl?.addEventListener('change', render);
    areaEl?.addEventListener('change', render);
    prioEl?.addEventListener('change', render);

    viewListBtn?.addEventListener('click', (e) => {
      VIEW = 'list';
      history.replaceState(null, '', '#list');
      render();
    });
    viewBoardBtn?.addEventListener('click', (e) => {
      VIEW = 'board';
      history.replaceState(null, '', '#board');
      render();
    });

    // 3) 先渲染一次（即使尚未有資料，避免初始 class 狀態不一致）
    render();

    // 4) 初始化資料（頁面打開就載入，不需要先點 Tab）。
    //    載入完成後會再 render 一次。
    initBoardData();
  });
})();
