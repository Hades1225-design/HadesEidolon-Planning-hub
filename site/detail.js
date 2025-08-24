(function(){
  const REPO_RAW_BASE = 'https://raw.githubusercontent.com/Hades1225-design/HadesEidolon-Planning-hub/refs/heads/main/';
  const REPO_EDIT_BASE = 'https://github.com/Hades1225-design/HadesEidolon-Planning-hub/edit/main/';

  const qs = new URLSearchParams(location.search);
  const mdPath = qs.get('path');

  const $title = document.getElementById('title');
  const $chips = document.getElementById('chips');
  const $content = document.getElementById('content');
  const $err = document.getElementById('error');
  const $path = document.getElementById('path');
  const $edit = document.getElementById('editLink');

  function esc(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m])); }

  function parseFrontmatter(src){
    // 只處理最上方一個簡單 YAML frontmatter 區塊
    const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!m) return {meta:{}, body:src};
    const meta = {};
    m[1].split(/\n/).forEach(line=>{
      const i = line.indexOf(':');
      if (i>0) meta[line.slice(0,i).trim()] = line.slice(i+1).trim();
    });
    return {meta, body: src.slice(m[0].length)};
  }

  function chip(k,v,cls=''){
    if (!v) return '';
    return `<span class="chip ${cls}">${esc(k)}: ${esc(v)}</span>`;
  }

  async function main(){
    if (!mdPath){
      $err.style.display='block';
      $err.innerHTML = '缺少參數 `?path=...`；例如：<code>?path=plans/ongoing/planning-hub-meta.md</code>';
      return;
    }

    $path.textContent = mdPath;
    $edit.href = REPO_EDIT_BASE + mdPath;

    const url = REPO_RAW_BASE + mdPath;
    try{
      const res = await fetch(url, { cache:'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      const {meta, body} = parseFrontmatter(raw);

      $title.textContent = meta.title || mdPath.split('/').pop();
      $chips.innerHTML = [
        chip('status', meta.status),
        chip('priority', meta.priority),
        chip('area', meta.area),
        chip('risk', meta.risk),
        chip('progress', meta.progress),
        chip('owner', meta.owner),
        chip('due', meta.due)
      ].join('');

      // 渲染 Markdown
      const html = marked.parse(body, { mangle:false, headerIds:true });
      $content.innerHTML = DOMPurify.sanitize(html);
    } catch(err){
      console.error(err);
      $err.style.display='block';
      $err.innerHTML = `讀取失敗：${esc(String(err))}<br>原始檔：<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`;
    }
  }

  document.addEventListener('DOMContentLoaded', main);
})();
