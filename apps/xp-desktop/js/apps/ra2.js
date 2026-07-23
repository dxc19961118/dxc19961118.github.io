/* 红色警戒2 在线版 — iframe 内嵌 game.ra2web.com (同罪恶都市处理方式) */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = [
    '.app-ra2-focus{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#0b1020;color:#fff;text-align:center;text-shadow:0 0 10px #e03c3c,0 0 22px #a01010;letter-spacing:2px;}',
    '.app-ra2-focus .ico{font-size:44px;}',
    '.app-ra2-focus .t1{font-size:18px;font-weight:bold;}',
    '.app-ra2-focus .t2{font-size:12px;opacity:.85;letter-spacing:1px;}',
  ].join('\n');
  document.head.appendChild(style);

  const RA2_URL = 'https://game.ra2web.com/';
  let single = null;

  function open() {
    if (single && !single.closed) { single.focus(); return; }
    const win = XP.createWindow({
      title: '红色警戒2 (在线版)', icon: '🪖', width: 920, height: 660,
      onClose: () => { single = null; },
    });
    single = win;

    win.body.style.padding = '0';
    win.body.style.display = 'flex';
    win.body.style.flexDirection = 'column';
    win.body.style.background = '#0b1020';

    const iframe = XP.el('iframe', {
      src: RA2_URL, allowfullscreen: '',
      allow: 'autoplay; fullscreen; gamepad; clipboard-write',
      style: { width: '100%', height: '100%', border: '0', display: 'block', background: '#000' },
    });
    const loadingEl = XP.el('div', { class: 'app-ra2-focus' }, [
      XP.el('div', { class: 'ico', text: '🪖' }),
      XP.el('div', { class: 't1', text: '正在加载红色警戒2…' }),
      XP.el('div', { class: 't2', text: '首次进入需下载游戏资源, 请耐心等待; 若长时间黑屏请点工具栏「刷新」' }),
    ]);
    iframe.addEventListener('load', () => loadingEl.classList.add('hidden'));

    const toolbar = XP.el('div', { class: 'xp-toolbar', style: { flex: 'none' } }, [
      XP.el('span', { html: '🌐' }),
      XP.el('input', { class: 'xp-input', readonly: '', value: RA2_URL, style: { flex: '1', fontSize: '11px' } }),
      XP.el('div', { class: 'xp-tool-btn', html: '🔄 <span>刷新</span>', onclick: () => { loadingEl.classList.remove('hidden'); iframe.src = RA2_URL; } }),
      XP.el('div', { class: 'xp-tool-btn', html: '↗️ <span>新标签页打开</span>', onclick: () => window.open(RA2_URL, '_blank') }),
    ]);
    win.body.appendChild(toolbar);
    win.body.appendChild(XP.el('div', { style: { flex: '1', position: 'relative', minHeight: '0' } }, [iframe, loadingEl]));
    return win;
  }

  XP.registerApp({ id: 'ra2', name: '红色警戒2', icon: '🪖', open });
})();
