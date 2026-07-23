/* 画图 — 经典 MS Paint, 铅笔/直线/矩形/椭圆/橡皮/油漆桶, 可保存/打开 .bmp(实为 dataURL) */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
.app-pt-wrap { display: flex; flex-direction: column; height: 100%; background: #ece9d8; }
.app-pt-mid { flex: 1; display: flex; min-height: 0; }
.app-pt-tools { width: 52px; flex: none; background: #ece9d8; border-right: 1px solid #d0ccbc; padding: 4px; display: flex; flex-wrap: wrap; gap: 2px; align-content: flex-start; }
.app-pt-tool { width: 20px; height: 20px; font-size: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px solid transparent; border-radius: 2px; }
.app-pt-tool:hover { border-color: #316ac5; background: #c1d2ee; }
.app-pt-tool.sel { border-color: #316ac5; background: #a4bfe8; }
.app-pt-canvas-wrap { flex: 1; overflow: auto; background: #808080; padding: 6px; }
.app-pt-canvas { background: #fff; cursor: crosshair; display: block; box-shadow: 1px 1px 3px rgba(0,0,0,.4); }
.app-pt-colors { flex: none; display: flex; align-items: center; gap: 4px; padding: 4px 6px; border-top: 1px solid #d0ccbc; background: #ece9d8; flex-wrap: wrap; }
.app-pt-cur { width: 30px; height: 26px; border: 1px solid #7f7f7f; }
.app-pt-swatch { width: 16px; height: 16px; border: 1px solid #aca899; cursor: pointer; }
.app-pt-swatch:hover { transform: scale(1.15); }
.app-pt-sizes { display: flex; gap: 3px; margin-left: 10px; align-items: center; }
.app-pt-size { cursor: pointer; border: 1px solid transparent; padding: 2px 4px; font-size: 11px; }
.app-pt-size:hover, .app-pt-size.sel { border-color: #316ac5; background: #c1d2ee; }
`;
  document.head.appendChild(style);

  const COLORS = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8',
    '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0',
    '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'];
  const TOOLS = [
    { id: 'pencil', icon: '✏️', name: '铅笔' },
    { id: 'line', icon: '📏', name: '直线' },
    { id: 'rect', icon: '⬜', name: '矩形' },
    { id: 'ellipse', icon: '⭕', name: '椭圆' },
    { id: 'fill', icon: '🪣', name: '用颜色填充' },
    { id: 'eraser', icon: '🧽', name: '橡皮' },
  ];

  function openPaint(filePath) {
    const w = XP.createWindow({ title: '未命名 - 画图', icon: '🎨', width: 720, height: 520 });
    let path = filePath || null;
    let tool = 'pencil', color = '#000000', size = 2, dirty = false;

    const canvas = XP.el('canvas', { class: 'app-pt-canvas', width: 640, height: 400 });
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    const wrap = XP.el('div', { class: 'app-pt-wrap' });
    const menubar = XP.el('div', { class: 'xp-menubar' }, [
      XP.el('span', { text: '文件(F)', onclick: () => fileMenu() }),
      XP.el('span', { text: '图像(I)', onclick: () => { if (dirty && !confirm('放弃当前修改?')) return; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); dirty = false; } }),
      XP.el('span', { text: '帮助(H)', onclick: () => XP.notify('画图帮助', '选择左侧工具在画布上绘制。\n🪣 油漆桶可填充封闭区域。\n文件(F) → 保存 可将作品存到「我的文档」。') }),
    ]);
    wrap.appendChild(menubar);

    // 工具栏
    const toolsEl = XP.el('div', { class: 'app-pt-tools' });
    TOOLS.forEach(t => {
      const b = XP.el('div', { class: 'app-pt-tool' + (t.id === tool ? ' sel' : ''), html: t.icon, title: t.name });
      b.addEventListener('click', () => {
        tool = t.id;
        toolsEl.querySelectorAll('.app-pt-tool').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel');
      });
      toolsEl.appendChild(b);
    });

    const mid = XP.el('div', { class: 'app-pt-mid' }, [toolsEl, XP.el('div', { class: 'app-pt-canvas-wrap' }, [canvas])]);
    wrap.appendChild(mid);

    // 颜色条
    const cur = XP.el('div', { class: 'app-pt-cur', style: { background: color } });
    const colorsEl = XP.el('div', { class: 'app-pt-colors' }, [cur]);
    COLORS.forEach(c => colorsEl.appendChild(XP.el('div', { class: 'app-pt-swatch', style: { background: c }, onclick: () => { color = c; cur.style.background = c; } })));
    const sizesEl = XP.el('div', { class: 'app-pt-sizes' }, [XP.el('span', { text: '粗细:' })]);
    [1, 2, 4, 8].forEach(s => {
      const b = XP.el('div', { class: 'app-pt-size' + (s === size ? ' sel' : ''), text: '●'.repeat(1) + ' ' + s + 'px' });
      b.addEventListener('click', () => { size = s; sizesEl.querySelectorAll('.app-pt-size').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); });
      sizesEl.appendChild(b);
    });
    colorsEl.appendChild(sizesEl);
    wrap.appendChild(colorsEl);
    w.body.appendChild(wrap);

    function setTitle() { w.setTitle((path ? path.split('\\').pop() : '未命名') + ' - 画图'); }
    setTitle();

    /* ---------- 绘图逻辑 ---------- */
    let drawing = false, sx = 0, sy = 0, snapshot = null;
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)];
    }
    function strokeColor() { return tool === 'eraser' ? '#ffffff' : color; }
    canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const [x, y] = pos(e);
      if (tool === 'fill') { floodFill(x | 0, y | 0); dirty = true; return; }
      drawing = true; sx = x; sy = y;
      snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (tool === 'pencil' || tool === 'eraser') {
        ctx.strokeStyle = strokeColor(); ctx.lineWidth = tool === 'eraser' ? size * 4 : size; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y); ctx.stroke();
      }
      dirty = true;
    });
    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const [x, y] = pos(e);
      if (tool === 'pencil' || tool === 'eraser') {
        ctx.lineTo(x, y); ctx.stroke();
      } else {
        ctx.putImageData(snapshot, 0, 0);
        ctx.strokeStyle = strokeColor(); ctx.lineWidth = size; ctx.lineCap = 'butt';
        ctx.beginPath();
        if (tool === 'line') { ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke(); }
        else if (tool === 'rect') { ctx.strokeRect(Math.min(sx, x), Math.min(sy, y), Math.abs(x - sx), Math.abs(y - sy)); }
        else if (tool === 'ellipse') {
          ctx.ellipse((sx + x) / 2, (sy + y) / 2, Math.abs(x - sx) / 2, Math.abs(y - sy) / 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    });
    canvas.addEventListener('pointerup', () => { drawing = false; });
    canvas.addEventListener('pointercancel', () => { drawing = false; });

    function floodFill(px, py) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data, W = canvas.width, H = canvas.height;
      const ti = (py * W + px) * 4;
      const tr = d[ti], tg = d[ti + 1], tb = d[ti + 2];
      const fc = hex2rgb(color);
      if (tr === fc[0] && tg === fc[1] && tb === fc[2]) return;
      const match = i => Math.abs(d[i] - tr) < 16 && Math.abs(d[i + 1] - tg) < 16 && Math.abs(d[i + 2] - tb) < 16;
      const stack = [[px, py]];
      while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const i = (y * W + x) * 4;
        if (!match(i)) continue;
        d[i] = fc[0]; d[i + 1] = fc[1]; d[i + 2] = fc[2]; d[i + 3] = 255;
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      ctx.putImageData(img, 0, 0);
    }
    function hex2rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }

    /* ---------- 文件操作 ---------- */
    function fileMenu() {
      document.querySelectorAll('.app-np-drop').forEach(d => d.remove());
      const anchor = menubar.children[0];
      const drop = XP.el('div', { class: 'app-np-drop', style: { left: '2px', top: '24px' } });
      [['新建(N)', () => { if (dirty && !confirm('放弃当前修改?')) return; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); path = null; dirty = false; setTitle(); }],
       ['保存(S)', () => save()],
       ['另存为(A)…', () => saveAs()],
       ['退出(X)', () => w.close()],
      ].forEach(([label, act]) => {
        const it = XP.el('div', { class: 'it', text: label });
        it.addEventListener('click', () => { drop.remove(); act(); });
        drop.appendChild(it);
      });
      menubar.style.position = 'relative';
      menubar.appendChild(drop);
      setTimeout(() => document.addEventListener('click', () => drop.remove(), { once: true }), 0);
    }
    function save() {
      if (!path) return saveAs();
      XP.fs.write(path, canvas.toDataURL('image/png'));
      dirty = false; XP.notify('画图', '已保存: ' + path.split('\\').pop());
    }
    function saveAs() {
      const d = XP.createWindow({ title: '另存为', icon: '💾', width: 400, height: 170, resizable: false });
      d.body.style.padding = '12px';
      d.body.appendChild(XP.el('div', { text: '保存在(I): C:\\我的文档' }));
      const input = XP.el('input', { class: 'xp-input', style: { width: '100%', marginTop: '8px' }, value: '未命名.bmp' });
      d.body.appendChild(input);
      const ok = XP.el('button', { class: 'xp-btn', text: '保存(S)' });
      ok.addEventListener('click', () => {
        let name = input.value.trim() || '未命名.bmp';
        if (!/\.bmp$/i.test(name)) name += '.bmp';
        path = 'C:\\我的文档\\' + name;
        save(); setTitle(); d.close();
      });
      const cancel = XP.el('button', { class: 'xp-btn', text: '取消' });
      cancel.addEventListener('click', () => d.close());
      d.body.appendChild(XP.el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '14px' } }, [ok, cancel]));
      input.focus(); input.select();
    }

    // 打开已有 bmp(dataURL)
    if (path) {
      const data = XP.fs.read(path);
      if (data && data.startsWith('data:image')) {
        const im = new Image();
        im.onload = () => { ctx.drawImage(im, 0, 0); };
        im.src = data;
      }
    }
    return w;
  }

  window.XPPaint = { open: openPaint };
  XP.registerApp({ id: 'paint', name: '画图', icon: '🎨', open: () => openPaint(null) });
})();
