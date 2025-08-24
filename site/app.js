(function(){
  const $ = (s) => document.querySelector(s);
  const listEl = $('#list');
  const qEl = $('#q');
  const statusEl = $('#status');
  const areaEl = $('#area');
  const prioEl = $('#priority');
  const summaryStatus = $('#summary-status');
  const summaryDonut = $('#summary-donut');
  const viewListBtn = $('#view-list');
  const viewBoardBtn = $('#view-board');
  const boardEl = $('#board');

  let DATA = [];
  let VIEW = 'list';

  async function load() {
    try {
      const res = await fetch('../public/index.json', {cache: 'no-store'});
      const json = await res.json();
      DATA = json.items || [];
      render();
    } catch (e) {
      listEl.innerHTML = '<div class="empty">讀取 public/index.json 失敗，請確認部署路徑。</div>';
    }
  }

  function esc(s){return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
  const statusClass = s => s ? `badge status-${s}` : 'badge';
  const riskClass = r => r ? `badge risk-${r}` : 'badge';

  function filters(){
    const q = (qEl.value || '').toLowerCase().trim();
    const status = statusEl.value;
    const area = areaEl.value;
    const prio = prioEl.value;
    return {q,status,area,prio};
  }

  function applyFilters(items){
    const {q,status,area,prio} = filters();
    return items.filter(it => {
      if (status && it.status !== status) return false;
      if (area && it.area !== area) return false;
      if (prio && it.priority !== prio) return false;
      if (q) {
        const hay = [it.title, it.area, it.priority, it.status, (it.tags||[]).join(','), (it.preview||'')].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderSummary(items){
    const counts = {inbox:0, ongoing:0, done:0};
    items.forEach(it => { if (counts[it.status] !== undefined) counts[it.status]++; });
    summaryStatus.innerHTML = `
      <span class="badge status-inbox">規劃中: ${counts.inbox}</span>
      <span class="badge status-ongoing">進行中: ${counts.ongoing}</span>
      <span class="badge status-done">已完成: ${counts.done}</span>
    `;
    const total = Math.max(1, items.length);
    const seg = (n) => 2*Math.PI*40*(n/total);
    const C = 50, R = 40, dash = 2*Math.PI*R;
    const dInbox = seg(counts.inbox), dOng = seg(counts.ongoing), dDone = seg(counts.done);
    summaryDonut.innerHTML = `
      <svg width="110" height="110" viewBox="0 0 110 110" role="img">
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#f0f0f0" stroke-width="10"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#d9d9d9" stroke-width="10"
          stroke-dasharray="${dInbox} ${dash}" transform="rotate(-90 ${C} ${C})"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#ffd591" stroke-width="10"
          stroke-dasharray="${dOng} ${dash}" transform="rotate(${(dInbox/dash)*360-90} ${C} ${C})"></circle>
        <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#b7eb8f" stroke-width="10"
          stroke-dasharray="${dDone} ${dash}" transform="rotate(${((dInbox+dOng)/dash)*360-90} ${C} ${C})"></circle>
        <text x="${C}" y="${C+4}" text-anchor="middle" font-size="14">${items.length}</text>
      </svg>
    `;
  }

  function card(it){
    const tags = (it.tags||[]).map(t => `<span class="tag">${esc(t)}</span>`).join('');
    const meta = [
      `<span class="${statusClass(it.status)}">${esc(it.status||'')}</span>`,
      `<span class="badge">${esc(it.area||'')}</span>`,
      `<span class="badge">${esc(it.priority||'')}</span>`,
      it.owner ? `<span class="badge">owner:${esc(it.owner)}</span>` : '',
      it.due ? `<span class="badge">due:${esc(it.due)}</span>` : ''
    ].filter(Boolean).join(' ');

    const risk = it.risk ? `<span class="${riskClass(it.risk)}">risk:${esc(it.risk)}</span>` : '';
    const progBar = Number.isInteger(it.progress)
      ? `<div class="progress"><i style="width:${Math.min(100, Math.max(0, it.progress))}%"></i></div>` : '';

    return `<article class="card">
      <div class="row">
        <h3>${esc(it.title)}</h3>
        <span class="spacer"></span>
        ${risk}
      </div>
      <div class="meta">${meta}</div>
      <div class="tags">${tags}</div>
      ${progBar}
      <div class="preview">${esc((it.preview||'').slice(0,180))}</div>
      <a href="../${it.path}" target="_blank" rel="noopener">檢視原始檔</a>
    </article>`;
  }

  function renderList(items){
    if (!items.length) { listEl.innerHTML = '<div class="empty">沒有符合條件的計劃。</div>'; return; }
    listEl.innerHTML = items.map(card).join('');
  }

  function renderBoard(items){
    boardEl.querySelectorAll('.col-body').forEach(n => n.innerHTML = '');
    const cols = {inbox:[], ongoing:[], done:[]};
    items.forEach(it => (cols[it.status] || cols.inbox).push(it));
    ['inbox','ongoing','done'].forEach(k => {
      const wrap = boardEl.querySelector(`.col[data-col="${k}"] .col-body`);
      wrap.innerHTML = cols[k].map(card).join('');
    });
  }


  // 放在 app.js 裡（render 上方即可）
  function show(el){
    if (!el) return;
    el.style.display = '';       // 交給預設/外層排版
    el.classList.remove('hidden');
    el.setAttribute('aria-hidden', 'false');
  }
  function hide(el){
    if (!el) return;
    el.style.display = 'none';   // 強制隱藏
    el.classList.add('hidden');
    el.setAttribute('aria-hidden', 'true');
  }
  
  // 然後把 render 的切換改成用 show/hide
  function render(){
    const filtered = applyFilters(DATA);
    renderSummary(filtered);
  
    const showList  = VIEW === 'list';
    if (showList) {
      show(listEl);
      hide(boardEl);
      renderList(filtered);
    } else {
      hide(listEl);
      show(boardEl);
      renderBoard(filtered);
    }
  }

  qEl.addEventListener('input', render);
  statusEl.addEventListener('change', render);
  areaEl.addEventListener('change', render);
  prioEl.addEventListener('change', render);
  viewListBtn.addEventListener('click', () => { VIEW='list'; viewListBtn.classList.add('active'); viewBoardBtn.classList.remove('active'); render(); });
  viewBoardBtn.addEventListener('click', () => { VIEW='board'; viewBoardBtn.classList.add('active'); viewListBtn.classList.remove('active'); render(); });

  load();
})();
