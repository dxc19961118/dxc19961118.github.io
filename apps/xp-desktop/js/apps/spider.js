/* 蜘蛛纸牌 — 经典 Windows Spider Solitaire, 完整可玩
   结构: 纯逻辑核心(Core, 无 DOM 依赖, 可在 node 下独立测试) + UI 层。 */
(function () {
  'use strict';

  /* ==================== 纯逻辑核心 ==================== */
  const SUITS = ['♠', '♥', '♦', '♣']; // 0黑桃 1红桃 2方块 3梅花
  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // 两副牌共 104 张: 单花色=8副黑桃 / 双花色=黑桃红桃各4副 / 四花色=各2副
  function makeDeck(nSuits) {
    const copies = 8 / nSuits;
    const deck = [];
    for (let s = 0; s < nSuits; s++)
      for (let c = 0; c < copies; c++)
        for (let r = 1; r <= 13; r++) deck.push({ s: s, r: r, f: 0 });
    return deck;
  }
  function shuffle(a, rng) {
    rng = rng || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // 初始发牌: 前4列各6张, 后6列各5张, 仅每列顶牌明牌; 牌堆剩50张
  function newGameState(nSuits, rng) {
    const deck = shuffle(makeDeck(nSuits), rng);
    const cols = [];
    for (let i = 0; i < 10; i++) cols.push([]);
    let p = 0;
    for (let i = 0; i < 10; i++) {
      const n = i < 4 ? 6 : 5;
      for (let k = 0; k < n; k++) cols[i].push(deck[p++]);
      cols[i][cols[i].length - 1].f = 1;
    }
    return {
      cols: cols, stock: deck.slice(p),
      score: 500, moves: 0, done: 0, found: [], elapsed: 0, suits: nSuits,
    };
  }
  function cloneState(st) {
    const cp = function (cards) { return cards.map(function (k) { return { s: k.s, r: k.r, f: k.f }; }); };
    return {
      cols: st.cols.map(cp), stock: cp(st.stock),
      score: st.score, moves: st.moves, done: st.done,
      found: st.found.slice(), elapsed: st.elapsed, suits: st.suits,
    };
  }
  // 从 idx 到列底是否构成"同花色连续降序"的可移动序列
  function isMovable(col, idx) {
    if (idx < 0 || idx >= col.length || !col[idx].f) return false;
    for (let i = idx; i < col.length - 1; i++) {
      if (!col[i + 1].f) return false;
      if (col[i].s !== col[i + 1].s) return false;
      if (col[i].r !== col[i + 1].r + 1) return false;
    }
    return true;
  }
  // 落点规则: 空列任意放; 否则目标顶牌点数 = 移动序列首牌 + 1(不看花色)
  function canMove(st, f, idx, t) {
    if (f === t || f < 0 || t < 0 || f > 9 || t > 9) return false;
    const from = st.cols[f], to = st.cols[t];
    if (!isMovable(from, idx)) return false;
    if (!to.length) return true;
    return to[to.length - 1].r === from[idx].r + 1;
  }
  function flipTop(col) {
    if (col.length && !col[col.length - 1].f) col[col.length - 1].f = 1;
  }
  // 收走列顶同花色 K..A 完整序列(可连续收多组); 返回收走组数
  function collect(st) {
    let n = 0;
    for (let c = 0; c < 10; c++) {
      const col = st.cols[c];
      let again = true;
      while (again && col.length >= 13) {
        again = false;
        const base = col.length - 13;
        let ok = col[base].f && col[base].r === 13;
        for (let i = 1; ok && i < 13; i++) {
          const k = col[base + i];
          if (!k.f || k.s !== col[base].s || k.r !== 13 - i) ok = false;
        }
        if (ok) {
          st.found.push(col[base].s);
          col.splice(base, 13);
          st.done++; st.score += 100; n++;
          flipTop(col);
          again = true;
        }
      }
    }
    return n;
  }
  function applyMove(st, f, idx, t) {
    if (!canMove(st, f, idx, t)) return false;
    const moving = st.cols[f].splice(idx);
    for (let i = 0; i < moving.length; i++) st.cols[t].push(moving[i]);
    flipTop(st.cols[f]);
    st.score--; st.moves++;
    collect(st);
    return true;
  }
  // 发牌: 每列 1 张明牌; 牌堆不足或有空列则失败(不改状态)
  function deal(st) {
    if (st.stock.length < 10) return false;
    for (let i = 0; i < 10; i++) if (!st.cols[i].length) return false;
    for (let i = 0; i < 10; i++) {
      const k = st.stock.pop();
      k.f = 1;
      st.cols[i].push(k);
    }
    st.moves++;
    collect(st);
    return true;
  }
  function movableStarts(st, f) {
    const col = st.cols[f], res = [];
    for (let i = 0; i < col.length; i++) if (isMovable(col, i)) res.push(i);
    return res;
  }
  // 候选移动评分: 优先同花色落点 > 非空落点 > 能翻暗牌
  function scoreCand(st, f, idx, t) {
    const from = st.cols[f], to = st.cols[t];
    let sc = 0;
    if (to.length) {
      sc += 5;
      if (to[to.length - 1].s === from[idx].s) sc += 10;
    }
    if (idx > 0 && !from[idx - 1].f) sc += 3;
    sc += (from.length - idx) / 100;
    return sc;
  }
  function bestTarget(st, f, idx) {
    let best = -1, bs = -1;
    for (let t = 0; t < 10; t++) {
      if (!canMove(st, f, idx, t)) continue;
      const sc = scoreCand(st, f, idx, t);
      if (sc > bs) { bs = sc; best = t; }
    }
    return best;
  }
  function findHint(st) {
    let best = null, bs = -1;
    for (let f = 0; f < 10; f++) {
      const starts = movableStarts(st, f);
      for (let s = 0; s < starts.length; s++) {
        const idx = starts[s];
        const t = bestTarget(st, f, idx);
        if (t < 0) continue;
        if (idx === 0 && !st.cols[t].length) continue; // 整列搬到空列, 无意义
        const sc = scoreCand(st, f, idx, t);
        if (sc > bs) { bs = sc; best = { f: f, idx: idx, t: t }; }
      }
    }
    return best;
  }

  const Core = {
    SUITS: SUITS, RANKS: RANKS,
    makeDeck: makeDeck, newGameState: newGameState, cloneState: cloneState,
    isMovable: isMovable, canMove: canMove, applyMove: applyMove,
    deal: deal, collect: collect, movableStarts: movableStarts,
    bestTarget: bestTarget, findHint: findHint,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core;
  if (typeof document === 'undefined' || typeof XP === 'undefined') return;

  /* ==================== 样式注入 ==================== */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
.app-sp-wrap { height: 100%; display: flex; flex-direction: column; background: #ece9d8; }
.app-sp-sep { width: 1px; height: 18px; background: #c8c4b4; margin: 0 3px; }
.app-sp-difflbl { font-size: 12px; color: #333; padding: 0 2px; }
.app-sp-diff { height: 22px; padding: 1px 2px; }
.xp-tool-btn.disabled { opacity: .4; pointer-events: none; }
.app-sp-board {
  flex: 1; position: relative; overflow: hidden; touch-action: none;
  background: radial-gradient(130% 110% at 50% -10%, #24a058 0%, #157a3f 55%, #0b5a2a 100%);
}
.app-sp-card {
  position: absolute; background: #fdfdfd; border: 1px solid #4a4a4a; border-radius: 6px;
  color: #111; overflow: hidden; box-shadow: 1px 1px 2px rgba(0,0,0,.35);
}
.app-sp-card.red { color: #d00; }
.app-sp-card.back {
  border-color: #0a1f5c;
  background:
    radial-gradient(circle at 3px 3px, rgba(255,255,255,.28) 0 1.5px, transparent 2px) 0 0 / 9px 9px,
    linear-gradient(135deg, #2b5cd9 0%, #173a9e 100%);
  box-shadow: inset 0 0 0 2px #fff, inset 0 0 0 4px #1b3fa8, 1px 1px 2px rgba(0,0,0,.4);
}
.app-sp-corner {
  position: absolute; top: 2px; left: 3px; text-align: center;
  line-height: 1.02; font-weight: bold;
}
.app-sp-corner.bot { top: auto; left: auto; bottom: 2px; right: 3px; transform: rotate(180deg); }
.app-sp-pip { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.app-sp-colslot {
  position: absolute; border: 2px dashed rgba(255,255,255,.3); border-radius: 6px;
}
.app-sp-stock { position: absolute; cursor: pointer; }
.app-sp-stock.empty { cursor: default; }
.app-sp-stock-badge {
  position: absolute; right: -6px; bottom: -6px; z-index: 2;
  background: #c8102e; color: #fff; border: 1px solid #fff; border-radius: 9px;
  font-size: 10px; line-height: 14px; padding: 0 5px; font-weight: bold;
}
.app-sp-fslot {
  position: absolute; border: 2px dashed rgba(255,255,255,.3); border-radius: 5px;
  display: flex; align-items: center; justify-content: center; color: #111; font-weight: bold;
}
.app-sp-fslot.filled { border: 1px solid #eee; background: rgba(255,255,255,.95); box-shadow: 1px 1px 2px rgba(0,0,0,.35); }
.app-sp-fslot.red { color: #d00; }
.app-sp-drag { position: fixed; z-index: 99999; pointer-events: none; }
.app-sp-drag .app-sp-card { box-shadow: 2px 3px 8px rgba(0,0,0,.5); }
.app-sp-hide { opacity: .28; }
.app-sp-dropok { outline: 2px solid #ffd23f; outline-offset: 1px; }
.app-sp-drophover { outline: 3px solid #9bff5b; outline-offset: 1px; }
.app-sp-hint-dst { outline: 3px solid #ff8c00; outline-offset: 1px; }
.app-sp-hint-src { animation: app-sp-hintpulse .55s ease-in-out infinite alternate; }
@keyframes app-sp-hintpulse {
  from { box-shadow: 0 0 3px 1px #ffd23f; }
  to { box-shadow: 0 0 9px 3px #ff8c00; }
}
.app-sp-shake { animation: app-sp-shakek .3s; }
@keyframes app-sp-shakek {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
.app-sp-win {
  position: absolute; inset: 0; z-index: 60;
  background: rgba(0,35,15,.55);
  display: flex; align-items: center; justify-content: center;
}
.app-sp-fw { position: absolute; inset: 0; }
.app-sp-winmsg {
  position: relative; background: #ffffe1; border: 2px solid #000; border-radius: 8px;
  padding: 16px 30px; text-align: center; box-shadow: 3px 3px 14px rgba(0,0,0,.55);
}
.app-sp-wintitle { font-size: 22px; font-weight: bold; color: #c8102e; margin-bottom: 8px; }
`;
  document.head.appendChild(styleEl);

  /* ==================== UI ==================== */
  const DIFFS = [
    { k: 1, short: '简单', label: '简单(单花色)' },
    { k: 2, short: '中等', label: '中等(双花色)' },
    { k: 4, short: '困难', label: '困难(四花色)' },
  ];
  const PAD = 10, GAP = 8;
  let single = null;

  function open() {
    if (single && !single.closed) { single.focus(); return; }
    const w = single = XP.createWindow({
      title: '蜘蛛纸牌', icon: '🕷️', width: 900, height: 640, onClose: cleanup,
    });
    w.body.style.padding = '0';
    w.body.style.overflow = 'hidden';

    let diff = 1;
    try { diff = parseInt(localStorage.getItem('winxp_spider_diff'), 10) || 1; } catch (e) {}
    if (diff !== 1 && diff !== 2 && diff !== 4) diff = 1;

    let st = null, history = [], drag = null, won = false, closed = false;
    let hintTimer = null, rafId = 0, M = null;

    /* ---------- DOM ---------- */
    const btnNew = XP.el('div', { class: 'xp-tool-btn', title: '重新开局', html: '🆕 新游戏' });
    const diffSel = XP.el('select', { class: 'xp-input app-sp-diff', title: '选择难度(切换将重新开局)' },
      DIFFS.map(function (d) { return XP.el('option', { value: d.k, text: d.label }); }));
    diffSel.value = String(diff);
    const btnUndo = XP.el('div', { class: 'xp-tool-btn', title: '撤销上一步(含发牌)', html: '↩️ 撤销' });
    const btnHint = XP.el('div', { class: 'xp-tool-btn', title: '提示一个可行移动', html: '💡 提示' });
    const toolbar = XP.el('div', { class: 'xp-toolbar' }, [
      btnNew,
      XP.el('div', { class: 'app-sp-sep' }),
      XP.el('span', { class: 'app-sp-difflbl', text: '难度:' }),
      diffSel,
      XP.el('div', { class: 'app-sp-sep' }),
      btnUndo, btnHint,
    ]);
    const board = XP.el('div', { class: 'app-sp-board' });
    const sbScore = XP.el('span', { class: 'sb-cell' });
    const sbMoves = XP.el('span', { class: 'sb-cell' });
    const sbDone = XP.el('span', { class: 'sb-cell' });
    const sbTime = XP.el('span', { class: 'sb-cell' });
    const sbDiff = XP.el('span', { class: 'sb-cell' });
    const status = XP.el('div', { class: 'xp-statusbar' }, [sbScore, sbMoves, sbDone, sbTime, sbDiff]);
    w.body.appendChild(XP.el('div', { class: 'app-sp-wrap' }, [toolbar, board, status]));

    /* ---------- 事件 ---------- */
    btnNew.addEventListener('click', function () { newGame(false); });
    btnUndo.addEventListener('click', undo);
    btnHint.addEventListener('click', showHint);
    diffSel.addEventListener('change', onDiffChange);
    board.addEventListener('pointerdown', onPointerDown);
    board.addEventListener('dblclick', onDblClick);
    window.addEventListener('blur', endDrag);
    w.on('resize', function () { if (!closed && st) render(); });

    const clock = setInterval(function () {
      if (closed || won || !st) return;
      st.elapsed++;
      sbTime.textContent = '用时: ' + fmtTime(st.elapsed);
    }, 1000);

    newGame(true);

    /* ---------- 渲染 ---------- */
    function fmtTime(s) {
      return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }
    function diffShort() {
      for (let i = 0; i < DIFFS.length; i++) if (DIFFS[i].k === diff) return DIFFS[i].short;
      return '';
    }
    function computeMetrics() {
      const bw = board.clientWidth, bh = board.clientHeight;
      if (!bw || !bh) return null;
      let cw = Math.floor((bw - 2 * PAD - 9 * GAP) / 10);
      cw = Math.max(34, Math.min(92, cw));
      const ch = Math.round(cw * 1.4);
      const y0 = PAD + ch + 12;
      const availH = Math.max(ch + 40, bh - y0 - PAD);
      const usedW = 10 * cw + 9 * GAP;
      const offX = PAD + Math.max(0, Math.floor((bw - 2 * PAD - usedW) / 2));
      const colX = [];
      for (let i = 0; i < 10; i++) colX.push(offX + i * (cw + GAP));
      const gDown = Math.max(3, Math.round(ch * 0.1));
      let gUp = Math.round(ch * 0.26);
      // 最长列装不下时压缩明牌间距
      for (let c = 0; c < 10; c++) {
        const col = st.cols[c];
        let downs = 0;
        for (let i = 0; i < col.length; i++) if (!col[i].f) downs++;
        const ups = col.length - downs;
        if (ups > 1 && ch + downs * gDown + (ups - 1) * gUp > availH) {
          const fit = Math.floor((availH - ch - downs * gDown) / (ups - 1));
          gUp = Math.min(gUp, Math.max(7, fit));
        }
      }
      return { cw: cw, ch: ch, y0: y0, colX: colX, gDown: gDown, gUp: gUp, bw: bw, bh: bh };
    }
    function cardEl(k, c, i) {
      if (!k.f) return XP.el('div', { class: 'app-sp-card back', 'data-col': c, 'data-idx': i });
      const red = k.s === 1 || k.s === 2;
      const fs = Math.max(8, Math.round(M.cw * 0.21));
      const pip = Math.round(M.cw * 0.46);
      return XP.el('div', {
        class: 'app-sp-card' + (red ? ' red' : ''),
        'data-col': c, 'data-idx': i,
        style: { fontSize: fs + 'px' },
      }, [
        XP.el('div', { class: 'app-sp-corner', html: RANKS[k.r] + '<br>' + SUITS[k.s] }),
        XP.el('div', { class: 'app-sp-pip', style: { fontSize: pip + 'px' }, text: SUITS[k.s] }),
        XP.el('div', { class: 'app-sp-corner bot', html: RANKS[k.r] + '<br>' + SUITS[k.s] }),
      ]);
    }
    function render() {
      M = computeMetrics();
      if (!M) return;
      board.innerHTML = '';
      const cw = M.cw, ch = M.ch;
      // 牌堆(左上)
      const deals = st.stock.length / 10;
      const stockEl = XP.el('div', {
        class: 'app-sp-stock' + (deals ? '' : ' empty'),
        style: { left: M.colX[0] + 'px', top: PAD + 'px', width: cw + 'px', height: ch + 'px' },
        title: deals ? '点击发牌(剩余 ' + deals + ' 次)' : '牌堆已空',
        onclick: doDeal,
      });
      if (deals) {
        stockEl.appendChild(XP.el('div', { class: 'app-sp-card back', style: { left: '0px', top: '0px', width: '100%', height: '100%' } }));
        stockEl.appendChild(XP.el('div', { class: 'app-sp-stock-badge', text: '×' + deals }));
      } else {
        stockEl.appendChild(XP.el('div', { class: 'app-sp-colslot', style: { left: '0px', top: '0px', width: '100%', height: '100%' } }));
      }
      board.appendChild(stockEl);
      // 收牌区(右上, 8 格小图标)
      const slotW = Math.max(22, Math.round(cw * 0.5));
      const slotH = Math.round(slotW * 1.36);
      const slotTop = PAD + Math.round((ch - slotH) / 2);
      for (let i = 0; i < 8; i++) {
        const filled = i < st.found.length;
        const slot = XP.el('div', {
          class: 'app-sp-fslot' + (filled ? ' filled' : ''),
          style: {
            left: (M.bw - PAD - (8 - i) * (slotW + 4)) + 'px',
            top: slotTop + 'px', width: slotW + 'px', height: slotH + 'px',
            fontSize: Math.round(slotW * 0.55) + 'px',
          },
          title: filled ? '已完成第 ' + (i + 1) + ' 组' : '收牌区',
        });
        if (filled) {
          const s = st.found[i];
          slot.textContent = SUITS[s];
          if (s === 1 || s === 2) slot.classList.add('red');
        }
        board.appendChild(slot);
      }
      // 10 列
      for (let c = 0; c < 10; c++) {
        const col = st.cols[c], x = M.colX[c];
        if (!col.length) {
          board.appendChild(XP.el('div', {
            class: 'app-sp-colslot', 'data-col': c,
            style: { left: x + 'px', top: M.y0 + 'px', width: cw + 'px', height: ch + 'px' },
          }));
          continue;
        }
        let y = M.y0;
        for (let i = 0; i < col.length; i++) {
          const e = cardEl(col[i], c, i);
          e.style.left = x + 'px';
          e.style.top = y + 'px';
          e.style.width = cw + 'px';
          e.style.height = ch + 'px';
          board.appendChild(e);
          y += col[i].f ? M.gUp : M.gDown;
        }
      }
      updateStatus();
    }
    function updateStatus() {
      sbScore.textContent = '分数: ' + st.score;
      sbMoves.textContent = '步数: ' + st.moves;
      sbDone.textContent = '已完成: ' + st.done + '/8';
      sbTime.textContent = '用时: ' + fmtTime(st.elapsed);
      sbDiff.textContent = '难度: ' + diffShort();
      btnUndo.classList.toggle('disabled', !history.length);
    }

    /* ---------- 游戏流程 ---------- */
    function newGame(skipConfirm) {
      if (!skipConfirm && st && st.moves > 0 && !won) {
        if (!confirm('当前游戏尚未结束, 确定要重新开局吗?')) return;
      }
      endDrag(); cancelHint(); removeWinOverlay();
      st = Core.newGameState(diff);
      history = [];
      won = false;
      render();
      XP.sound('click');
    }
    function onDiffChange() {
      const v = parseInt(diffSel.value, 10);
      if (v === diff) return;
      if (st && st.moves > 0 && !won && !confirm('切换难度将重新开局, 确定吗?')) {
        diffSel.value = String(diff);
        return;
      }
      diff = v;
      try { localStorage.setItem('winxp_spider_diff', String(diff)); } catch (e) {}
      newGame(true);
    }
    function pushHist() {
      history.push(Core.cloneState(st));
      if (history.length > 300) history.shift();
    }
    function undo() {
      if (!history.length || drag) return;
      cancelHint();
      st = history.pop();
      if (won) { won = false; removeWinOverlay(); }
      render();
      XP.sound('click');
    }
    function doDeal() {
      if (won || drag) return;
      cancelHint();
      if (st.stock.length < 10) { XP.sound('error'); XP.notify('蜘蛛纸牌', '牌堆已空, 无法发牌'); return; }
      for (let i = 0; i < 10; i++) {
        if (!st.cols[i].length) {
          XP.sound('error');
          shakeStock();
          XP.notify('蜘蛛纸牌', '发牌前所有列都必须有牌!');
          return;
        }
      }
      pushHist();
      Core.deal(st);
      afterChange();
    }
    function doMove(f, idx, t) {
      pushHist();
      Core.applyMove(st, f, idx, t);
      afterChange();
    }
    function afterChange() {
      render();
      XP.sound('click');
      if (st.done >= 8 && !won) { won = true; showWin(); }
    }

    /* ---------- 拖拽 ---------- */
    function cardAt(c, i) {
      return board.querySelector('.app-sp-card[data-col="' + c + '"][data-idx="' + i + '"]');
    }
    function unhideAll() {
      board.querySelectorAll('.app-sp-hide').forEach(function (e) { e.classList.remove('app-sp-hide'); });
    }
    function buildLayer(f, idx) {
      const col = st.cols[f];
      const layer = XP.el('div', { class: 'app-sp-drag', style: { width: M.cw + 'px' } });
      let y = 0;
      for (let i = idx; i < col.length; i++) {
        const e = cardEl(col[i], -1, -1);
        e.style.left = '0px';
        e.style.top = y + 'px';
        e.style.width = M.cw + 'px';
        e.style.height = M.ch + 'px';
        layer.appendChild(e);
        y += M.gUp;
      }
      layer.style.height = (y - M.gUp + M.ch) + 'px';
      return layer;
    }
    function dropTarget(cx, cy) {
      if (!M) return -1;
      const rect = board.getBoundingClientRect();
      if (cy < rect.top + M.y0 - M.ch * 0.5 || cy > rect.bottom + 20) return -1;
      const x = cx - rect.left;
      let best = -1, bd = 1e9;
      for (let i = 0; i < 10; i++) {
        const d = Math.abs(x - (M.colX[i] + M.cw / 2));
        if (d < bd) { bd = d; best = i; }
      }
      return bd <= M.cw * 0.85 ? best : -1;
    }
    function targetEl(t) {
      const col = st.cols[t];
      if (col.length) return cardAt(t, col.length - 1);
      return board.querySelector('.app-sp-colslot[data-col="' + t + '"]');
    }
    function markLegalTargets(f, idx) {
      for (let t = 0; t < 10; t++) {
        if (t === f || !Core.canMove(st, f, idx, t)) continue;
        const e = targetEl(t);
        if (e) e.classList.add('app-sp-dropok');
      }
    }
    function hoverTarget(cx, cy) {
      board.querySelectorAll('.app-sp-drophover').forEach(function (e) { e.classList.remove('app-sp-drophover'); });
      if (!drag) return;
      const t = dropTarget(cx, cy);
      if (t < 0 || t === drag.f || !Core.canMove(st, drag.f, drag.idx, t)) return;
      const e = targetEl(t);
      if (e) e.classList.add('app-sp-drophover');
    }
    function clearTargetMarks() {
      board.querySelectorAll('.app-sp-dropok,.app-sp-drophover').forEach(function (e) {
        e.classList.remove('app-sp-dropok');
        e.classList.remove('app-sp-drophover');
      });
    }
    function snapBack(layer, f, idx) {
      const src = cardAt(f, idx);
      if (!src) { layer.remove(); unhideAll(); return; }
      const r = src.getBoundingClientRect();
      layer.style.transition = 'left .12s ease, top .12s ease';
      layer.style.left = r.left + 'px';
      layer.style.top = r.top + 'px';
      setTimeout(function () { layer.remove(); unhideAll(); }, 140);
    }
    function onPointerDown(e) {
      if (won || e.button > 0) return;
      if (drag) { endDrag(); return; }
      const ce = e.target.closest('.app-sp-card');
      if (!ce || !board.contains(ce)) return;
      if (ce.classList.contains('back')) return;
      const f = +ce.dataset.col, idx = +ce.dataset.idx;
      if (isNaN(f) || f < 0 || idx < 0) return;
      const col = st.cols[f];
      if (!col || !Core.isMovable(col, idx)) return;
      cancelHint();
      const sx = e.clientX, sy = e.clientY;
      const cr = ce.getBoundingClientRect();
      const grabX = sx - cr.left, grabY = sy - cr.top;
      drag = { f: f, idx: idx, layer: null, started: false, mv: mv, up: up };
      document.addEventListener('pointermove', mv);
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);

      function mv(ev) {
        const d = drag;
        if (!d) return;
        if (!d.started) {
          if (Math.abs(ev.clientX - sx) < 4 && Math.abs(ev.clientY - sy) < 4) return;
          d.started = true;
          d.layer = buildLayer(f, idx);
          document.body.appendChild(d.layer);
          for (let i = idx; i < col.length; i++) {
            const e2 = cardAt(f, i);
            if (e2) e2.classList.add('app-sp-hide');
          }
          markLegalTargets(f, idx);
        }
        d.layer.style.left = (ev.clientX - grabX) + 'px';
        d.layer.style.top = (ev.clientY - grabY) + 'px';
        hoverTarget(ev.clientX, ev.clientY);
      }
      function up(ev) {
        const d = drag;
        if (!d) return;
        document.removeEventListener('pointermove', mv);
        document.removeEventListener('pointerup', up);
        document.removeEventListener('pointercancel', up);
        drag = null;
        if (!d.started) return;
        clearTargetMarks();
        if (ev.type === 'pointercancel') { d.layer.remove(); unhideAll(); return; }
        const t = dropTarget(ev.clientX, ev.clientY);
        if (t >= 0 && t !== f && Core.canMove(st, f, idx, t)) {
          d.layer.remove();
          doMove(f, idx, t);
        } else {
          snapBack(d.layer, f, idx); // 非法落点弹回
        }
      }
    }
    function endDrag() {
      if (!drag) return;
      const d = drag;
      drag = null;
      document.removeEventListener('pointermove', d.mv);
      document.removeEventListener('pointerup', d.up);
      document.removeEventListener('pointercancel', d.up);
      if (d.layer) d.layer.remove();
      unhideAll();
      clearTargetMarks();
    }

    /* ---------- 双击自动移动 ---------- */
    function onDblClick(e) {
      if (won || drag) return;
      const ce = e.target.closest('.app-sp-card');
      if (!ce || !board.contains(ce)) return;
      if (ce.classList.contains('back')) return;
      const f = +ce.dataset.col, idx = +ce.dataset.idx;
      if (isNaN(f) || f < 0 || idx < 0) return;
      cancelHint();
      if (!Core.isMovable(st.cols[f], idx)) { XP.sound('error'); return; }
      const t = Core.bestTarget(st, f, idx);
      if (t < 0) { XP.sound('error'); w.shake(); return; }
      doMove(f, idx, t);
    }

    /* ---------- 提示 ---------- */
    function showHint() {
      if (won || drag) return;
      cancelHint();
      const h = Core.findHint(st);
      if (!h) {
        XP.sound('error');
        XP.notify('蜘蛛纸牌', st.stock.length >= 10 ? '无可行移动, 请发牌' : '无可行移动了');
        return;
      }
      for (let i = h.idx; i < st.cols[h.f].length; i++) {
        const e = cardAt(h.f, i);
        if (e) e.classList.add('app-sp-hint-src');
      }
      const te = targetEl(h.t);
      if (te) te.classList.add('app-sp-hint-dst');
      XP.sound('ding');
      hintTimer = setTimeout(cancelHint, 1800);
    }
    function cancelHint() {
      if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
      board.querySelectorAll('.app-sp-hint-src,.app-sp-hint-dst').forEach(function (e) {
        e.classList.remove('app-sp-hint-src');
        e.classList.remove('app-sp-hint-dst');
      });
    }
    function shakeStock() {
      const e = board.querySelector('.app-sp-stock');
      if (!e) return;
      e.classList.remove('app-sp-shake');
      void e.offsetWidth;
      e.classList.add('app-sp-shake');
    }

    /* ---------- 胜利烟花 ---------- */
    function showWin() {
      XP.sound('tada');
      const t = st.elapsed;
      const ov = XP.el('div', { class: 'app-sp-win' });
      const cv = XP.el('canvas', { class: 'app-sp-fw' });
      const msg = XP.el('div', { class: 'app-sp-winmsg' }, [
        XP.el('div', { class: 'app-sp-wintitle', text: '🎉 你赢了! 🎉' }),
        XP.el('div', { text: '用时 ' + Math.floor(t / 60) + ' 分 ' + (t % 60) + ' 秒, 得分 ' + st.score }),
        XP.el('button', { class: 'xp-btn', style: { marginTop: '12px' }, text: '再来一局', onclick: function () { newGame(true); } }),
      ]);
      ov.appendChild(cv);
      ov.appendChild(msg);
      board.appendChild(ov);
      cv.width = board.clientWidth;
      cv.height = board.clientHeight;
      const ctx = cv.getContext('2d');
      const parts = [];
      function burst() {
        const x = Math.random() * cv.width;
        const y = Math.random() * cv.height * 0.55 + cv.height * 0.08;
        const hue = Math.floor(Math.random() * 360);
        for (let i = 0; i < 40; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1.5 + Math.random() * 3.5;
          parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, hue: hue });
        }
      }
      let frame = 0;
      function loop() {
        if (closed || !won) return;
        ctx.clearRect(0, 0, cv.width, cv.height);
        if (frame % 22 === 0) burst();
        frame++;
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.x += p.vx; p.y += p.vy; p.vy += 0.045; p.life -= 0.011;
          if (p.life <= 0) { parts.splice(i, 1); continue; }
          ctx.globalAlpha = p.life;
          ctx.fillStyle = 'hsl(' + p.hue + ',90%,62%)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        rafId = requestAnimationFrame(loop);
      }
      rafId = requestAnimationFrame(loop);
    }
    function removeWinOverlay() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      const ov = board.querySelector('.app-sp-win');
      if (ov) ov.remove();
    }

    /* ---------- 清理 ---------- */
    function cleanup() {
      closed = true;
      clearInterval(clock);
      cancelHint();
      endDrag();
      removeWinOverlay();
      window.removeEventListener('blur', endDrag);
      single = null;
    }
  }

  XP.registerApp({ id: 'spider', name: '蜘蛛纸牌', icon: '🕷️', open: open });
})();
