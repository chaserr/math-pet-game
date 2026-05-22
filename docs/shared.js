/* ============================================================
   数字积木大冒险 · 知识库公共脚本 shared.js
   - 侧栏当前页高亮
   - 跨页搜索（fetch 所有页 → 命中文件列表 + 摘要）
   - "/" 聚焦搜索，Esc 关闭
   ------------------------------------------------------------
   v1.6 文档重构：所有页面（除 index.html）下沉到 5 个子目录。
   ROOT 自动判断：根目录 = ''；子目录 = '../'。
   ============================================================ */
(function () {
  // PAGES.file 一律相对 docs/ 根目录（带子目录前缀）
  const PAGES = [
    { file: 'overview/overview.html',        title: '项目总览',           group: '概览' },
    { file: 'overview/quick-start.html',     title: '快速开始',           group: '概览' },
    { file: 'overview/tech.html',            title: '技术栈',             group: '概览' },
    { file: 'curriculum/curriculum.html',    title: '三学科四模块体系',    group: '学科与关卡' },
    { file: 'curriculum/difficulty.html',    title: '数学关卡分类',        group: '学科与关卡' },
    { file: 'curriculum/decompose-skill.html', title: '拆分技巧引导',      group: '学科与关卡' },
    { file: 'curriculum/textbook.html',      title: '教材轴（跟课本学）',  group: '学科与关卡' },
    { file: 'modules/module-auth.html',      title: '登录 / 注册',        group: '业务模块' },
    { file: 'modules/module-home.html',      title: '首页 / 学科选择',     group: '业务模块' },
    { file: 'modules/module-stages.html',    title: '选关',               group: '业务模块' },
    { file: 'modules/module-quiz.html',      title: '答题',               group: '业务模块' },
    { file: 'modules/module-shop.html',      title: '商店',               group: '业务模块' },
    { file: 'modules/module-pet.html',       title: '宠物之家',           group: '业务模块' },
    { file: 'system/data-model.html',        title: '数据模型',           group: '系统设计' },
    { file: 'system/shared-systems.html',    title: '共享系统',           group: '系统设计' },
    { file: 'system/assets.html',            title: '资源体系',           group: '系统设计' },
    { file: 'system/files.html',             title: '文件结构',           group: '系统设计' },
    { file: 'governance/change-protocol.html', title: '变更协议',         group: '治理' },
    { file: 'governance/changelog.html',     title: '沟通日志',           group: '治理' },
    { file: 'governance/known-issues.html',  title: '已知问题',           group: '治理' },
    { file: 'governance/roadmap.html',       title: '占位 / 待补清单',    group: '治理' },
  ];

  // 判断当前页位置：只有 docs/index.html 在根；其余在 docs/<子目录>/<file>.html
  const here = location.pathname;
  const atRoot = /\/(?:index\.html)?$/.test(here);
  const ROOT = atRoot ? '' : '../';

  // ---- 侧栏当前页高亮：匹配后缀 ----
  document.querySelectorAll('aside.sidebar a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    // 去掉前面的 ../，拿到「相对 docs/ 根」的目标
    const target = href.replace(/^(?:\.\.\/)+/, '');
    if (here.endsWith('/' + target)) a.classList.add('active');
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
        const res = await fetch(ROOT + p.file);
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
        `<a href="${ROOT}${h.file}"><div class="sr-title">${h.group} · ${h.title}</div>${h.snip ? `<div class="sr-snippet">${h.snip}</div>` : ''}</a>`
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
