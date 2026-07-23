/* 扫雷 — 经典 Windows 扫雷, 完整可玩 */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
.app-ms-wrap { padding: 8px; background: #c0c0c0; height: 100%; display: flex; flex-direction: column; gap: 8px; align-items: center; }
.app-ms-hud { display: flex; justify-content: space-between; align-items: center; width: 100%; background: #c0c0c0; border: 3px inset #fff; padding: 4px 8px; }
.app-ms-lcd { font-family: "Courier New", monospace; font-weight: bold; font-size: 22px; color: #f00; background: #000; padding: 0 6px; min-width: 54px; text-align: center; letter-spacing: 2px; }
.app-ms-face { width: 34px; height: 34px; font-size: 22px; cursor: pointer; background: #c0c0c0; border: 3px outset #fff; display: flex; align-items: center; justify-content: center; flex: none; }
.app-ms-face:active { border-style: inset; }
.app-ms-board { display: grid; gap: 0; background: #808080; border: 3px inset #fff; width: fit-content; user-select: none; overflow: auto; max-width: 100%; }
.app-ms-cell { width: var(--cell, 22px); height: var(--cell, 22px); font-size: calc(var(--cell, 22px) * 0.62); font-weight: bold; display: flex; align-items: center; justify-content: center; cursor: pointer; background: #c0c0c0; border: 2px outset #fff; font-family: Tahoma, sans-serif; flex: none; }
.app-ms-cell.open { border: 1px solid #808080; background: #bdbdbd; cursor: default; }
.app-ms-cell.boom { background: #f00; }
.app-ms-cell.n1 { color: #0000ff; } .app-ms-cell.n2 { color: #008000; }
.app-ms-cell.n3 { color: #ff0000; } .app-ms-cell.n4 { color: #000080; }
.app-ms-cell.n5 { color: #800000; } .app-ms-cell.n6 { color: #008080; }
.app-ms-cell.n7 { color: #000; }    .app-ms-cell.n8 { color: #808080; }
`;
  document.head.appendChild(style);

  const LEVELS = {
    beginner: { name: '初级(B)', w: 9, h: 9, mines: 10 },
    intermediate: { name: '中级(I)', w: 16, h: 16, mines: 40 },
    expert: { name: '高级(E)', w: 30, h: 16, mines: 99 },
  };
  let level = 'beginner';
  let single = null;

  function open() {
    if (single && !single.closed) { single.focus(); return; }
    single = XP.createWindow({ title: '扫雷', icon: '💣', width: 240, height: 340, onClose: () => { single = null; } });
    const w = single;
    let board, mineSet, flagSet, openSet, started, over, timer, elapsed, remain;

    const wrap = XP.el('div', { class: 'app-ms-wrap' });
    const lcdMines = XP.el('div', { class: 'app-ms-lcd', text: '010' });
    const face = XP.el('div', { class: 'app-ms-face', text: '🙂', title: '重新开始' });
    const lcdTime = XP.el('div', { class: 'app-ms-lcd', text: '000' });
    const hud = XP.el('div', { class: 'app-ms-hud' }, [lcdMines, face, lcdTime]);
    const boardEl = XP.el('div', { class: 'app-ms-board' });
    wrap.appendChild(XP.el('div', { class: 'xp-menubar' }, [
      XP.el('span', { text: '游戏(G)', onclick: () => newGame() }),
      XP.el('span', { text: '帮助(H)', onclick: () => XP.notify('扫雷帮助', '左键翻开格子, 右键插旗标记地雷。\n数字表示周围 8 格中的地雷数。\n找出所有安全格即获胜!') }),
    ]));
    wrap.appendChild(hud);
    wrap.appendChild(boardEl);
    w.body.style.padding = '0';
    w.body.appendChild(wrap);

    const diffBar = XP.el('div', { class: 'xp-toolbar' },
      Object.keys(LEVELS).map(k => XP.el('div', { class: 'xp-tool-btn', text: LEVELS[k].name, onclick: () => { level = k; newGame(); } })));
    wrap.insertBefore(diffBar, hud);

    face.addEventListener('click', () => newGame());

    function newGame() {
      const lv = LEVELS[level];
      board = Array.from({ length: lv.h }, () => new Array(lv.w).fill(0));
      mineSet = new Set(); flagSet = new Set(); openSet = new Set();
      started = false; over = false; elapsed = 0; remain = lv.mines;
      clearInterval(timer);
      lcdTime.textContent = '000';
      face.textContent = '🙂';
      lcdMines.textContent = String(remain).padStart(3, '0');
      boardEl.style.gridTemplateColumns = 'repeat(' + lv.w + ', var(--cell, 22px))';
      boardEl.innerHTML = '';
      for (let y = 0; y < lv.h; y++) for (let x = 0; x < lv.w; x++) {
        const cell = XP.el('div', { class: 'app-ms-cell', 'data-x': x, 'data-y': y });
        cell.addEventListener('click', () => reveal(x, y, cell));
        cell.addEventListener('contextmenu', e => { e.preventDefault(); flag(x, y, cell); });
        boardEl.appendChild(cell);
      }
      // 仅切换难度时自适应窗口; 之后窗口可自由缩放, 格子随窗口大小调整
      if (newGame._autoSize !== false) {
        const W = lv.w * 22 + 40, H = lv.h * 22 + 130;
        w.el.style.width = W + 'px';
        w.el.style.height = H + 'px';
      }
      fitCell();
    }
    // 根据窗口大小计算格子尺寸 (最小 14px)
    function fitCell() {
      const lv = LEVELS[level];
      const bodyW = w.body.clientWidth - 24, bodyH = w.body.clientHeight - 120;
      const cell = Math.max(14, Math.floor(Math.min(bodyW / lv.w, bodyH / lv.h)));
      boardEl.style.setProperty('--cell', cell + 'px');
    }
    w.on('resize', () => { newGame._autoSize = false; fitCell(); });
    function idx(x, y) { return y * LEVELS[level].w + x; }
    function placeMines(safeX, safeY) {
      const lv = LEVELS[level];
      const safe = new Set();
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = safeX + dx, ny = safeY + dy;
        if (nx >= 0 && nx < lv.w && ny >= 0 && ny < lv.h) safe.add(idx(nx, ny));
      }
      while (mineSet.size < lv.mines) {
        const i = Math.floor(Math.random() * lv.w * lv.h);
        if (!safe.has(i)) mineSet.add(i);
      }
      mineSet.forEach(i => {
        const mx = i % lv.w, my = (i / lv.w) | 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = mx + dx, ny = my + dy;
          if (nx >= 0 && nx < lv.w && ny >= 0 && ny < lv.h && !mineSet.has(idx(nx, ny))) board[ny][nx]++;
        }
      });
    }
    function startTimer() {
      started = true;
      timer = setInterval(() => { elapsed++; lcdTime.textContent = String(Math.min(elapsed, 999)).padStart(3, '0'); }, 1000);
    }
    function cellEl(x, y) { return boardEl.children[idx(x, y)]; }
    function reveal(x, y, cell) {
      if (over) return;
      const lv = LEVELS[level];
      const i = idx(x, y);
      if (openSet.has(i) || flagSet.has(i)) return;
      if (!started) { placeMines(x, y); startTimer(); }
      if (mineSet.has(i)) { lose(x, y); return; }
      flood(x, y);
      if (openSet.size === lv.w * lv.h - lv.mines) win();
    }
    function flood(x, y) {
      const lv = LEVELS[level];
      const stack = [[x, y]];
      while (stack.length) {
        const [cx, cy] = stack.pop();
        const i = idx(cx, cy);
        if (openSet.has(i) || flagSet.has(i)) continue;
        openSet.add(i);
        const c = cellEl(cx, cy);
        c.classList.add('open');
        const n = board[cy][cx];
        if (n > 0) { c.textContent = n; c.classList.add('n' + n); continue; }
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < lv.w && ny >= 0 && ny < lv.h && !openSet.has(idx(nx, ny))) stack.push([nx, ny]);
        }
      }
    }
    function flag(x, y, cell) {
      if (over) return;
      const i = idx(x, y);
      if (openSet.has(i)) return;
      if (flagSet.has(i)) { flagSet.delete(i); cell.textContent = ''; remain++; }
      else { if (remain <= 0) return; flagSet.add(i); cell.textContent = '🚩'; remain--; }
      lcdMines.textContent = String(remain).padStart(3, '0');
    }
    function lose(bx, by) {
      over = true; clearInterval(timer); face.textContent = '😵'; XP.sound('error');
      mineSet.forEach(i => {
        const x = i % LEVELS[level].w, y = (i / LEVELS[level].w) | 0;
        const c = cellEl(x, y); c.classList.add('open'); c.textContent = '💣';
        if (x === bx && y === by) c.classList.add('boom');
      });
      flagSet.forEach(i => { if (!mineSet.has(i)) { const c = boardEl.children[i]; c.classList.add('open'); c.textContent = '❌'; } });
    }
    function win() {
      over = true; clearInterval(timer); face.textContent = '😎'; XP.sound('tada');
      mineSet.forEach(i => { boardEl.children[i].textContent = '🚩'; });
      lcdMines.textContent = '000';
      setTimeout(() => XP.notify('扫雷', '🎉 恭喜你赢了! 用时 ' + elapsed + ' 秒 (' + LEVELS[level].name.replace(/\(.*/, '') + ')'), 100);
    }
    w.on('close', () => clearInterval(timer));
    newGame();
    return w;
  }

  XP.registerApp({ id: 'minesweeper', name: '扫雷', icon: '💣', open });
})();
