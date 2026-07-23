/* 记事本 — 经典 Windows 记事本, 支持打开/保存到虚拟文件系统 */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
.app-np-wrap { display: flex; flex-direction: column; height: 100%; }
.app-np-text {
  flex: 1; border: none; outline: none; resize: none; padding: 4px 6px;
  font-family: "Lucida Console", "Courier New", monospace; font-size: 13px;
  background: #fff; white-space: pre; overflow: auto; user-select: text; cursor: text;
}
.app-np-drop { position: absolute; z-index: 50; min-width: 180px; background: #fff; border: 1px solid #aca899; padding: 2px; box-shadow: 2px 2px 6px rgba(0,0,0,.35); }
.app-np-drop .it { padding: 4px 22px; cursor: default; white-space: nowrap; display: flex; justify-content: space-between; gap: 18px; }
.app-np-drop .it:hover { background: #316ac5; color: #fff; }
.app-np-drop .sep { height: 1px; background: #d0d0d0; margin: 2px 4px; }
.app-np-drop .it .hk { color: #888; }
.app-np-drop .it:hover .hk { color: #cfe0ff; }
`;
  document.head.appendChild(style);

  const DOCS = 'C:\\我的文档';

  function openNotepad(filePath) {
    const w = XP.createWindow({ title: '无标题 - 记事本', icon: '📝', width: 580, height: 420 });
    let path = filePath || null;
    let modified = false;

    const ta = XP.el('textarea', { class: 'app-np-text', spellcheck: 'false', wrap: 'off' });
    ta.value = path ? (XP.fs.read(path) || '') : '';
    ta.addEventListener('input', () => { modified = true; updateTitle(); });

    function updateTitle() {
      const name = path ? path.split('\\').pop() : '无标题';
      w.setTitle((modified ? '*' : '') + name + ' - 记事本');
    }
    function closeAllDrops() { w.body.querySelectorAll('.app-np-drop').forEach(d => d.remove()); }

    const wrap = XP.el('div', { class: 'app-np-wrap' });
    const menubar = XP.el('div', { class: 'xp-menubar', style: { position: 'relative' } });
    wrap.appendChild(menubar);
    wrap.appendChild(ta);
    w.body.appendChild(wrap);
    updateTitle();

    function dropdown(anchor, items) {
      closeAllDrops();
      const drop = XP.el('div', { class: 'app-np-drop', style: { left: anchor.offsetLeft + 'px', top: '24px' } });
      items.forEach(it => {
        if (it === '-') { drop.appendChild(XP.el('div', { class: 'sep' })); return; }
        const row = XP.el('div', { class: 'it' }, [XP.el('span', { text: it.label }), XP.el('span', { class: 'hk', text: it.hk || '' })]);
        row.addEventListener('click', () => { closeAllDrops(); it.act(); });
        drop.appendChild(row);
      });
      menubar.appendChild(drop);
      setTimeout(() => document.addEventListener('click', closeAllDrops, { once: true }), 0);
    }
    function addMenu(label, items) {
      const m = XP.el('span', { text: label });
      m.addEventListener('click', e => { e.stopPropagation(); dropdown(m, items); });
      menubar.appendChild(m);
    }

    function saveAs() {
      const d = XP.createWindow({ title: '另存为', icon: '💾', width: 400, height: 170, resizable: false });
      d.body.style.padding = '12px';
      d.body.appendChild(XP.el('div', { text: '保存在(I): ' + DOCS }));
      const input = XP.el('input', { class: 'xp-input', style: { width: '100%', marginTop: '8px' }, value: path ? path.split('\\').pop() : '新建文本文档.txt' });
      d.body.appendChild(input);
      const row = XP.el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '14px' } });
      const ok = XP.el('button', { class: 'xp-btn', text: '保存(S)' });
      ok.addEventListener('click', () => {
        let name = input.value.trim() || '新建文本文档.txt';
        if (!/\.txt$/i.test(name)) name += '.txt';
        path = DOCS + '\\' + name;
        XP.fs.write(path, ta.value);
        modified = false; updateTitle();
        d.close();
        XP.notify('记事本', '已保存到「我的文档」: ' + name);
      });
      const cancel = XP.el('button', { class: 'xp-btn', text: '取消' });
      cancel.addEventListener('click', () => d.close());
      row.appendChild(ok); row.appendChild(cancel);
      d.body.appendChild(row);
      input.focus(); input.select();
    }
    function save() { if (path) { XP.fs.write(path, ta.value); modified = false; updateTitle(); XP.notify('记事本', '已保存: ' + path.split('\\').pop()); } else saveAs(); }
    function openDialog() {
      const d = XP.createWindow({ title: '打开', icon: '📂', width: 420, height: 300, resizable: false });
      d.body.style.padding = '10px';
      d.body.appendChild(XP.el('div', { text: '查找范围(I): 我的文档' }));
      const list = XP.el('div', { class: 'xp-listbox', style: { height: '180px', marginTop: '6px' } });
      const files = XP.fs.list(DOCS).filter(f => f.type === 'file' && /\.txt$/i.test(f.name));
      if (!files.length) list.appendChild(XP.el('div', { class: 'lb-item', text: '(没有文本文件)' }));
      files.forEach(f => {
        const item = XP.el('div', { class: 'lb-item', text: '📝 ' + f.name });
        item.addEventListener('dblclick', () => {
          path = DOCS + '\\' + f.name;
          ta.value = XP.fs.read(path) || '';
          modified = false; updateTitle(); d.close();
        });
        list.appendChild(item);
      });
      d.body.appendChild(list);
      d.body.appendChild(XP.el('div', { style: { marginTop: '8px', color: '#666', fontSize: '11px' }, text: '提示: 双击文件名打开。也可以用「我的电脑」浏览更多文件。' }));
    }

    addMenu('文件(F)', [
      { label: '新建(N)', hk: 'Ctrl+N', act: () => { if (modified && !confirm('文本已被修改。\n是否放弃更改?')) return; path = null; ta.value = ''; modified = false; updateTitle(); } },
      { label: '打开(O)…', hk: 'Ctrl+O', act: openDialog },
      { label: '保存(S)', hk: 'Ctrl+S', act: save },
      { label: '另存为(A)…', act: saveAs },
      '-',
      { label: '退出(X)', act: () => w.close() },
    ]);
    addMenu('编辑(E)', [
      { label: '剪切(T)', hk: 'Ctrl+X', act: () => { ta.focus(); document.execCommand('cut'); } },
      { label: '复制(C)', hk: 'Ctrl+C', act: () => { ta.focus(); document.execCommand('copy'); } },
      { label: '粘贴(P)', hk: 'Ctrl+V', act: () => { ta.focus(); navigator.clipboard && navigator.clipboard.readText().then(t => { ta.setRangeText(t); modified = true; updateTitle(); }).catch(() => XP.notify('记事本', '无法访问剪贴板, 请使用 Ctrl+V 粘贴。')); } },
      { label: '删除(L)', hk: 'Del', act: () => { ta.setRangeText(''); modified = true; updateTitle(); } },
      '-',
      { label: '全选(A)', hk: 'Ctrl+A', act: () => ta.select() },
    ]);
    addMenu('格式(O)', [
      { label: '自动换行(W)', act: () => { ta.wrap = ta.wrap === 'off' ? 'soft' : 'off'; ta.style.whiteSpace = ta.wrap === 'off' ? 'pre' : 'pre-wrap'; XP.notify('格式', ta.wrap === 'off' ? '已关闭自动换行' : '已开启自动换行'); } },
      { label: '字体(F)…', act: () => {
        const d = XP.createWindow({ title: '字体', icon: '🔤', width: 380, height: 200, resizable: false });
        d.body.style.padding = '12px';
        d.body.appendChild(XP.el('div', { text: '字体(F):' }));
        const sel = XP.el('select', { class: 'xp-input', style: { width: '100%', marginTop: '4px' } },
          ['Lucida Console', 'Courier New', 'SimSun 宋体', 'Microsoft YaHei'].map(f => XP.el('option', { text: f })));
        d.body.appendChild(sel);
        d.body.appendChild(XP.el('div', { style: { marginTop: '8px' }, text: '大小(S):' }));
        const size = XP.el('select', { class: 'xp-input', style: { width: '100%', marginTop: '4px' } },
          ['小五 (9)', '五号 (10.5)', '小四 (12)', '四号 (14)'].map(s => XP.el('option', { text: s })));
        d.body.appendChild(size);
        const ok = XP.el('button', { class: 'xp-btn', text: '确定' });
        ok.addEventListener('click', () => {
          const sizes = ['9px', '10.5px', '12px', '14px'];
          ta.style.fontFamily = sel.value.includes('宋体') ? 'SimSun, serif' : sel.value.includes('YaHei') ? '"Microsoft YaHei", sans-serif' : '"' + sel.value + '", monospace';
          ta.style.fontSize = sizes[size.selectedIndex];
          d.close();
        });
        d.body.appendChild(XP.el('div', { style: { marginTop: '12px', textAlign: 'right' } }, [ok]));
      } },
    ]);
    addMenu('查看(V)', [{ label: '状态栏(S)', act: () => XP.notify('记事本', '状态栏已是最新款式 ✔') }]);
    addMenu('帮助(H)', [
      { label: '帮助主题(H)', act: () => XP.notify('记事本帮助', '直接打字就可以了, 这就是记事本的全部用法。') },
      { label: '关于记事本(A)', act: () => XP.notify('关于记事本', 'Windows XP 记事本\n版本 5.1 (内部版本 2600.xpsp)\n© 1981-2005 Microsoft Corp.\n(怀旧模拟版)') },
    ]);

    ta.addEventListener('keydown', e => {
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); openDialog(); }
    });
    ta.focus();
    return w;
  }

  window.XPNotepad = { open: openNotepad };
  XP.registerApp({ id: 'notepad', name: '记事本', icon: '📝', open: () => openNotepad(null) });
})();
