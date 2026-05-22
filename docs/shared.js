/* ============================================================
   数字积木大冒险 · 知识库公共脚本 shared.js
   - 侧栏当前页高亮
   - 跨页搜索（fetch 所有页 → 命中文件列表 + 摘要）
   - "/" 聚焦搜索，Esc 关闭
   ============================================================ */
(function () {
  // 所有可搜索页面（与卡片导航保持一致）
  const PAGES = [
    { file: 'overview.html',        title: '项目总览',        group: '概览' },
    { file: 'quick-start.html',     title: '快速开始',        group: '概览' },
    { file: 'tech.html',            title: '技术栈',          group: '概览' },
    { file: 'curriculum.html',      title: '三学科四模块体系', group: '学科与关卡' },
    { file: 'difficulty.html',      title: '数学关卡分类',     group: '学科与关卡' },
    { file: 'decompose-skill.html', title: '拆分技巧引导',     group: '学科与关卡' },
    { file: 'textbook.html',        title: '教材轴（跟课本学）', group: '学科与关卡' },
    { file: 'module-auth.html',     title: '登录 / 注册',     group: '业务模块' },
    { file: 'module-home.html',     title: '首页 / 学科选择',  group: '业务模块' },
    { file: 'module-stages.html',   title: '选关',            group: '业务模块' },
    { file: 'module-quiz.html',     title: '答题',            group: '业务模块' },
    { file: 'module-shop.html',     title: '商店',            group: '业务模块' },
    { file: 'module-pet.html',      title: '宠物之家',        group: '业务模块' },
    { file: 'data-model.html',      title: '数据模型',        group: '系统设计' },
    { file: 'shared-systems.html',  title: '共享系统',        group: '系统设计' },
    { file: 'assets.html',          title: '资源体系',        group: '系统设计' },
    { file: 'files.html',           title: '文件结构',        group: '系统设计' },
    { file: 'change-protocol.html', title: '变更协议',        group: '治理' },
    { file: 'changelog.html',       title: '沟通日志',        group: '治理' },
    { file: 'known-issues.html',    title: '已知问题',        group: '治理' },
  ];

  // ---- 侧栏当前页高亮 ----
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('aside.sidebar a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === here) a.classList.add('active');
  });

  // ---- 搜索 ----
  const input = document.getElementById('searchInput');
  if (!input) return;
  let box = document.querySelector('.search-results');
  if (!box) {
    box = document.createElement('div');
    box.className = 'search-results';
    input.parentElement.appendChild(box);
  }

  const cache = {}; // file -> plain text
  let timer = null;

  async function ensureLoaded() {
    await Promise.all(PAGES.map(async p => {
      if (cache[p.file] != null) return;
      try {
        const res = await fetch(p.file);
        const html = await res.text();
        const tmp = document.createElement('div');
        tmp.innerHTML = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
        cache[p.file] = (tmp.textContent || '').replace(/\s+/g, ' ').trim();
      } catch { cache[p.file] = ''; }
    }));
  }

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  function snippet(text, q) {
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return '';
    const start = Math.max(0, i - 30);
    const frag = text.slice(start, i + q.length + 50);
    const re = new RegExp(esc(q), 'ig');
    return (start > 0 ? '…' : '') + escapeHtml(frag).replace(re, m => `<mark>${m}</mark>`) + '…';
  }

  async function run(q) {
    if (!q.trim()) { box.classList.remove('open'); box.innerHTML = ''; return; }
    await ensureLoaded();
    const hits = [];
    for (const p of PAGES) {
      const text = cache[p.file] || '';
      const titleHit = p.title.toLowerCase().includes(q.toLowerCase());
      const bodyHit = text.toLowerCase().includes(q.toLowerCase());
      if (titleHit || bodyHit) {
        hits.push({ ...p, snip: bodyHit ? snippet(text, q) : '' });
      }
    }
    if (!hits.length) {
      box.innerHTML = '<div class="sr-empty">没有找到匹配内容</div>';
    } else {
      box.innerHTML = hits.map(h =>
        `<a href="${h.file}"><div class="sr-title">${h.group} · ${h.title}</div>${h.snip ? `<div class="sr-snippet">${h.snip}</div>` : ''}</a>`
      ).join('');
    }
    box.classList.add('open');
  }

  input.addEventListener('input', e => { clearTimeout(timer); timer = setTimeout(() => run(e.target.value), 150); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') { input.value = ''; box.classList.remove('open'); } });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); input.focus(); }
  });
  document.addEventListener('click', e => {
    if (!input.parentElement.contains(e.target)) box.classList.remove('open');
  });
})();
