/* ============================================================
   Windows XP 怀旧模拟器 — 核心: 启动/登录/桌面/任务栏/开始菜单/窗口管理/音效/虚拟文件系统
   ============================================================
   应用开发接口 (供 js/apps/*.js 使用):

   XP.registerApp({ id, name, icon, desktop, open })
     id: 唯一标识; name: 中文名称; icon: 图标(emoji 或 HTML 字符串);
     desktop: 是否在桌面显示图标(默认 true); open: 打开应用的函数。

   XP.createWindow({ title, icon, width, height, resizable, x, y, onClose })
     返回 win 对象: { el, body, setTitle(t), close(), focus(), minimize(), restore(), shake(), on(evt, cb) }
     body 是内容容器 DOM; 'resize' 事件在窗口尺寸变化时触发。

   XP.notify(title, text)                 右下角气泡通知
   XP.sound(name)                         音效: 'ding'|'error'|'notify'|'click'|'startup'|'tada'
   XP.trayAdd(iconHTML, tooltip, onClick) 添加托盘图标, 返回 remove() 函数
   XP.fs                                  虚拟文件系统:
       list(path)  -> [{name, type:'dir'|'file'}]    例: XP.fs.list('C:\\')
       read(path)  -> string | null
       write(path, content)                          例: 'C:\\我的文档\\a.txt'
       exists(path) -> bool
   XP.el(tag, props, children)            DOM 辅助: props 支持 class/html/text/style/onClick 等
   XP.openApp(id)                         按 id 打开已注册应用
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- DOM 辅助 ---------------- */
  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null) continue;
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    }
    if (children != null) (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  /* ---------------- 音效 (WebAudio 合成) ---------------- */
  let audioCtx = null, muted = false;
  function ac() {
    if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    return audioCtx;
  }
  function tone(freq, start, dur, type, gain) {
    const ctx = ac(); if (!ctx || muted) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(start); o.stop(start + dur + 0.03);
  }
  const SOUNDS = {
    ding:    () => { const t = ac().currentTime; tone(660, t, 0.14, 'sine', 0.14); },
    error:   () => { const t = ac().currentTime; tone(196, t, 0.28, 'square', 0.07); },
    notify:  () => { const t = ac().currentTime; tone(880, t, 0.1, 'sine', 0.14); tone(1175, t + 0.11, 0.16, 'sine', 0.14); },
    click:   () => { const t = ac().currentTime; tone(1400, t, 0.025, 'square', 0.025); },
    startup: () => { const t = ac().currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.17, 0.4, 'triangle', 0.1)); },
    tada:    () => { const t = ac().currentTime; [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.28, 'square', 0.05)); },
  };
  function sound(name) { try { (SOUNDS[name] || SOUNDS.ding)(); } catch (e) {} }

  /* ---------------- 虚拟文件系统 (localStorage 持久化) ---------------- */
  const FS_KEY = 'winxp2005_fs';
  const FS_DEFAULT = {
    'C:\\': { type: 'dir', children: ['我的文档', 'Program Files', 'WINDOWS'] },
    'C:\\我的文档': { type: 'dir', children: ['欢迎.txt', '心情日记.txt', '我的音乐', '图片收藏'] },
    'C:\\我的文档\\欢迎.txt': { type: 'file', content: '欢迎使用 Windows XP 怀旧模拟器！\r\n\r\n这里复刻了 2005 年前后的中文互联网:\r\n  · QQ2005 — 聊天、抖窗口、发表情\r\n  · Internet Explorer 6 — 逛 hao123、上百度、看新浪\r\n  · 千千静听 — 听 2005 年的流行歌\r\n  · 问道 — 回合制网游\r\n  · 侠盗飞车:罪恶都市 — 开车兜风\r\n\r\n双击桌面图标即可启动。玩得开心！' },
    'C:\\我的文档\\心情日记.txt': { type: 'file', content: '2005年6月18日 晴\r\n\r\n今天网吧通宵，QQ升到一个太阳了，开心。\r\n问道里抓到了一只满成长的宝宝。\r\n晚上去听了《童话》，光良唱得真好。' },
    'C:\\我的文档\\我的音乐': { type: 'dir', children: ['童话.mp3', '江南.mp3', '十年.mp3'] },
    'C:\\我的文档\\我的音乐\\童话.mp3': { type: 'file', content: '[音频文件] 光良 - 童话 (可用千千静听播放)' },
    'C:\\我的文档\\我的音乐\\江南.mp3': { type: 'file', content: '[音频文件] 林俊杰 - 江南 (可用千千静听播放)' },
    'C:\\我的文档\\我的音乐\\十年.mp3': { type: 'file', content: '[音频文件] 陈奕迅 - 十年 (可用千千静听播放)' },
    'C:\\我的文档\\图片收藏': { type: 'dir', children: [] },
    'C:\\Program Files': { type: 'dir', children: ['Tencent', 'TTPlayer', 'Internet Explorer'] },
    'C:\\Program Files\\Tencent': { type: 'dir', children: ['QQ2005.exe'] },
    'C:\\Program Files\\Tencent\\QQ2005.exe': { type: 'file', content: '[可执行文件]' },
    'C:\\Program Files\\TTPlayer': { type: 'dir', children: ['TTPlayer.exe'] },
    'C:\\Program Files\\TTPlayer\\TTPlayer.exe': { type: 'file', content: '[可执行文件]' },
    'C:\\Program Files\\Internet Explorer': { type: 'dir', children: ['iexplore.exe'] },
    'C:\\Program Files\\Internet Explorer\\iexplore.exe': { type: 'file', content: '[可执行文件]' },
    'C:\\WINDOWS': { type: 'dir', children: ['system32', 'notepad.exe'] },
    'C:\\WINDOWS\\system32': { type: 'dir', children: ['drivers', 'config'] },
    'C:\\WINDOWS\\system32\\drivers': { type: 'dir', children: [] },
    'C:\\WINDOWS\\system32\\config': { type: 'dir', children: [] },
    'C:\\WINDOWS\\notepad.exe': { type: 'file', content: '[可执行文件]' },
    'D:\\': { type: 'dir', children: ['游戏', '电影'] },
    'D:\\游戏': { type: 'dir', children: ['问道', '侠盗飞车罪恶都市'] },
    'D:\\游戏\\问道': { type: 'dir', children: ['问道.exe', '说明.txt'] },
    'D:\\游戏\\问道\\问道.exe': { type: 'file', content: '[可执行文件]' },
    'D:\\游戏\\问道\\说明.txt': { type: 'file', content: '问道 v1.38 客户端\r\n方向键移动，踩草地会遇敌。\r\n战斗中可选择 攻击/法术/逃跑。\r\n找城里的药店老板可以免费回血。' },
    'D:\\游戏\\侠盗飞车罪恶都市': { type: 'dir', children: ['gta-vc.exe'] },
    'D:\\游戏\\侠盗飞车罪恶都市\\gta-vc.exe': { type: 'file', content: '[可执行文件]' },
    'D:\\电影': { type: 'dir', children: [] },
  };
  let fsData;
  try { fsData = JSON.parse(localStorage.getItem(FS_KEY)) || FS_DEFAULT; }
  catch (e) { fsData = FS_DEFAULT; }
  function fsSave() { try { localStorage.setItem(FS_KEY, JSON.stringify(fsData)); } catch (e) {} }
  function fsNorm(p) {
    p = String(p).replace(/\//g, '\\');
    if (/^[A-Za-z]:\\*$/.test(p)) return p[0].toUpperCase() + ':\\';
    return p.replace(/\\+$/, '');
  }
  const FS = {
    list(path) {
      const base = fsNorm(path);
      const node = fsData[base];
      if (!node || node.type !== 'dir') return [];
      const prefix = base.replace(/\\$/, '');
      return node.children.map(name => {
        const child = fsData[prefix + '\\' + name];
        return { name, type: child ? child.type : 'file' };
      });
    },
    read(path) { const n = fsData[fsNorm(path)]; return n && n.type === 'file' ? n.content : null; },
    exists(path) { return !!fsData[fsNorm(path)]; },
    write(path, content) {
      const p = fsNorm(path);
      const idx = p.lastIndexOf('\\');
      const dir = p.slice(0, idx), name = p.slice(idx + 1);
      const dirNode = fsData[dir];
      if (!dirNode || dirNode.type !== 'dir') return false;
      fsData[p] = { type: 'file', content: String(content) };
      if (!dirNode.children.includes(name)) dirNode.children.push(name);
      fsSave();
      return true;
    },
    remove(path) {
      const p = fsNorm(path);
      const idx = p.lastIndexOf('\\');
      const dir = p.slice(0, idx), name = p.slice(idx + 1);
      const node = fsData[p];
      if (!node) return false;
      // 移入回收站 (保留内容, 可还原)
      if (node.type === 'file') trashData.push({ name: name, orig: dir, content: node.content });
      delete fsData[p];
      if (fsData[dir]) fsData[dir].children = fsData[dir].children.filter(c => c !== name);
      fsSave(); trashSave();
      return true;
    },
    /* ---------------- 回收站 ---------------- */
    trashList() { return trashData.slice(); },
    trashRestore(i) {
      const it = trashData[i];
      if (!it) return false;
      const dirNode = fsData[it.orig];
      if (dirNode && dirNode.type === 'dir') {
        fsData[it.orig + '\\' + it.name] = { type: 'file', content: it.content };
        if (!dirNode.children.includes(it.name)) dirNode.children.push(it.name);
        trashData.splice(i, 1);
        fsSave(); trashSave();
        return true;
      }
      return false;
    },
    trashDelete(i) { if (trashData[i]) { trashData.splice(i, 1); trashSave(); return true; } return false; },
    trashEmpty() { trashData = []; trashSave(); },
  };

  /* ---------------- 回收站数据 (localStorage 持久化) ---------------- */
  const TRASH_KEY = 'winxp2005_trash';
  let trashData;
  try {
    trashData = JSON.parse(localStorage.getItem(TRASH_KEY));
    if (!Array.isArray(trashData)) throw 0;
  } catch (e) {
    trashData = [
      { name: '旧照片.bmp', orig: 'C:\\我的文档\\图片收藏', content: '[已删除的图片]' },
      { name: '聊天记录.txt', orig: 'C:\\我的文档', content: '轻舞飞扬: 在吗?\r\n痞子蔡: 在的, 网吧见!' },
      { name: '辞职信(最终版)(真的).doc', orig: 'C:\\我的文档', content: '[文档已损坏]' },
    ];
  }
  function trashSave() { try { localStorage.setItem(TRASH_KEY, JSON.stringify(trashData)); } catch (e) {} }

  /* ---------------- 应用注册表 ---------------- */
  const apps = {};
  const appOrder = [];
  // 应用图标: 真实原版图标(从真实 XP shell32.dll/winmine.exe/mspaint.exe 提取,
  // 及官方 logo 抠图), 由图标搜集流程逐张验证; 1em 随上下文字号缩放
  function iconImg(n) { return '<img src="assets/img/icons/' + n + '.png" style="width:1em;height:1em;vertical-align:-0.12em" alt="">'; }
  const ICON_SVG = {
    computer: iconImg('my-computer'), docs: iconImg('my-documents'), recycle: iconImg('recycle-bin'),
    notepad: iconImg('notepad'), minesweeper: iconImg('minesweeper'), paint: iconImg('mspaint'),
    qq: iconImg('qq2005'), ie: iconImg('ie6'), ttplayer: iconImg('ttplayer'),
    wendao: iconImg('wendao'), vicecity: iconImg('gta-vicecity'),
    controlpanel: iconImg('control-panel'), rising: iconImg('rising'),
    powershell: iconImg('powershell'),
    ra2: iconImg('ra2'),
    kys: iconImg('kys'),
  };
  function registerApp(def) {
    if (!def || !def.id || apps[def.id]) return;
    if (ICON_SVG[def.id]) def.icon = ICON_SVG[def.id];
    apps[def.id] = def;
    appOrder.push(def.id);
    renderIcons();
  }
  function openApp(id) {
    const app = apps[id];
    if (app && typeof app.open === 'function') { sound('click'); app.open(); }
  }

  /* ---------------- 桌面图标 (可拖拽排序, localStorage 持久化) ---------------- */
  const iconsEl = document.getElementById('icons');
  let selectedIcon = null;
  const ICON_ORDER_KEY = 'winxp_icons_order';
  function loadIconOrder() {
    const isDesktopApp = id => apps[id] && apps[id].desktop !== false;
    try {
      const saved = JSON.parse(localStorage.getItem(ICON_ORDER_KEY) || 'null');
      if (Array.isArray(saved)) {
        const valid = saved.filter(isDesktopApp);
        appOrder.forEach(id => { if (!valid.includes(id) && isDesktopApp(id)) valid.push(id); });
        return valid;
      }
    } catch (e) {}
    return appOrder.filter(isDesktopApp);
  }
  function saveIconOrder(order) {
    try { localStorage.setItem(ICON_ORDER_KEY, JSON.stringify(order)); } catch (e) {}
  }
  function gridMetrics() {
    const H = window.innerHeight - 46;
    const cellW = 88, cellH = 78;
    return { cellW, cellH, rows: Math.max(1, Math.floor(H / cellH)) };
  }
  function slotPos(i, m) { const col = Math.floor(i / m.rows), row = i % m.rows; return { x: col * m.cellW, y: row * m.cellH }; }
  function renderIcons() {
    if (!iconsEl) return;
    iconsEl.innerHTML = '';
    const m = gridMetrics();
    const order = loadIconOrder();
    order.forEach((id, i) => {
      const app = apps[id];
      if (!app || app.desktop === false) return;
      const pos = slotPos(i, m);
      const icon = el('div', { class: 'xp-icon', title: app.name, style: { position: 'absolute', left: pos.x + 'px', top: pos.y + 'px' }, 'data-id': id }, [
        el('div', { class: 'ico', html: app.icon || '❔' }),
        el('div', { class: 'lbl', text: app.name }),
      ]);
      icon.addEventListener('click', e => {
        e.stopPropagation();
        if (selectedIcon) selectedIcon.classList.remove('sel');
        selectedIcon = icon; icon.classList.add('sel');
      });
      icon.addEventListener('dblclick', () => { if (!icon._dragged) openApp(id); });
      enableIconDrag(icon, id);
      iconsEl.appendChild(icon);
    });
  }
  function enableIconDrag(icon, id) {
    icon.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const sx = e.clientX, sy = e.clientY;
      const ox = icon.offsetLeft, oy = icon.offsetTop;
      let dragging = false;
      const m = gridMetrics();
      const move = ev => {
        if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
        if (!dragging) {
          dragging = true; icon._dragged = true;
          icon.style.zIndex = 4000; icon.style.opacity = '0.75'; icon.style.pointerEvents = 'none';
        }
        icon.style.left = (ox + ev.clientX - sx) + 'px';
        icon.style.top = (oy + ev.clientY - sy) + 'px';
      };
      const up = ev => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        if (!dragging) return;
        // 计算最近槽位并重排
        const col = Math.max(0, Math.round((ev.clientX - 8 - 40) / m.cellW));
        const row = Math.max(0, Math.min(m.rows - 1, Math.round((ev.clientY - 8 - 36) / m.cellH)));
        const order = loadIconOrder();
        const from = order.indexOf(id);
        order.splice(from, 1);
        let to = Math.min(order.length, col * m.rows + row);
        order.splice(to, 0, id);
        saveIconOrder(order);
        setTimeout(() => { icon._dragged = false; renderIcons(); }, 0);
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }
  document.getElementById('desktop').addEventListener('click', () => {
    if (selectedIcon) { selectedIcon.classList.remove('sel'); selectedIcon = null; }
    closeStartMenu();
  });

  /* ---------------- 窗口管理 ---------------- */
  const windowsEl = document.getElementById('windows');
  const taskButtonsEl = document.getElementById('taskButtons');
  let zTop = 100, winSeq = 0;
  const openWindows = [];

  function createWindow(opts) {
    opts = opts || {};
    const id = 'win-' + (++winSeq);
    const body = el('div', { class: 'xp-window-body' });
    const titleText = el('div', { class: 'xp-title-text', text: opts.title || '窗口' });
    const btnMin = el('button', { class: 'xp-tb-btn', title: '最小化', text: '—' });
    const btnMax = el('button', { class: 'xp-tb-btn', title: '最大化', text: '▢' });
    const btnClose = el('button', { class: 'xp-tb-btn close', title: '关闭', text: '✕' });
    const win = el('div', { class: 'xp-window', id }, [
      el('div', { class: 'xp-titlebar' }, [
        el('span', { class: 'xp-title-icon', html: opts.icon || '🪟' }),
        titleText,
        el('div', { class: 'xp-title-btns' }, [btnMin, btnMax, btnClose]),
      ]),
      body,
    ]);
    const W = Math.min(opts.width || 640, window.innerWidth - 20);
    const H = Math.min(opts.height || 460, window.innerHeight - 50);
    win.style.width = W + 'px';
    win.style.height = H + 'px';
    win.style.left = (opts.x != null ? opts.x : Math.max(10, (window.innerWidth - W) / 2 - 60 + (winSeq % 6) * 28)) + 'px';
    win.style.top = (opts.y != null ? opts.y : Math.max(8, (window.innerHeight - H) / 2 - 50 + (winSeq % 6) * 24)) + 'px';
    windowsEl.appendChild(win);

    // 任务栏按钮
    const taskBtn = el('button', { class: 'task-btn', title: opts.title || '' }, [
      el('span', { class: 'tb-ico', html: opts.icon || '🪟' }),
      el('span', { class: 'tb-txt', text: opts.title || '窗口' }),
    ]);
    taskButtonsEl.appendChild(taskBtn);

    const listeners = {};
    const api = {
      el: win, body,
      setTitle(t) { titleText.textContent = t; taskBtn.querySelector('.tb-txt').textContent = t; taskBtn.title = t; },
      close() { doClose(); },
      focus() { doFocus(); },
      minimize() { doMin(); },
      restore() { doRestore(); },
      shake() { win.classList.remove('shake'); void win.offsetWidth; win.classList.add('shake'); },
      flash(ms) {   // 任务栏按钮闪烁 (经典 QQ 来消息效果), 聚焦窗口自动停止
        taskBtn.classList.add('flash');
        clearTimeout(flashTimer);
        flashTimer = setTimeout(() => taskBtn.classList.remove('flash'), ms || 8000);
      },
      on(evt, cb) { (listeners[evt] = listeners[evt] || []).push(cb); },
      emit(evt, arg) { (listeners[evt] || []).forEach(cb => { try { cb(arg); } catch (e) { console.error(e); } }); },
      get closed() { return closed; },
    };
    let closed = false, maximized = false, savedRect = null, flashTimer = null;

    function doFocus() {
      zTop += 1; win.style.zIndex = zTop;
      openWindows.forEach(w => { w.el.classList.add('inactive'); w._taskBtn.classList.remove('active'); });
      win.classList.remove('inactive'); taskBtn.classList.add('active');
      taskBtn.classList.remove('flash'); clearTimeout(flashTimer);
    }
    function doMin() { win.style.display = 'none'; taskBtn.classList.remove('active'); }
    function doRestore() { win.style.display = 'flex'; doFocus(); }
    function doClose() {
      if (closed) return; closed = true;
      api.emit('close');
      win.remove(); taskBtn.remove();
      const i = openWindows.indexOf(api); if (i >= 0) openWindows.splice(i, 1);
      if (typeof opts.onClose === 'function') { try { opts.onClose(); } catch (e) {} }
    }
    api._taskBtn = taskBtn;
    openWindows.push(api);

    win.addEventListener('pointerdown', doFocus, true);
    taskBtn.addEventListener('click', () => { win.style.display === 'none' ? doRestore() : (win.classList.contains('inactive') ? doFocus() : doMin()); });
    btnClose.addEventListener('click', e => { e.stopPropagation(); doClose(); });
    btnMin.addEventListener('click', e => { e.stopPropagation(); doMin(); });
    btnMax.addEventListener('click', e => { e.stopPropagation(); toggleMax(); });
    win.querySelector('.xp-titlebar').addEventListener('dblclick', toggleMax);

    function toggleMax() {
      if (opts.resizable === false) return;
      if (!maximized) {
        savedRect = { left: win.style.left, top: win.style.top, width: win.style.width, height: win.style.height };
        win.style.left = '0px'; win.style.top = '0px';
        win.style.width = '100%'; win.style.height = '100%';
        win.classList.add('maxed'); maximized = true;
      } else {
        Object.assign(win.style, savedRect);
        win.classList.remove('maxed'); maximized = false;
      }
      api.emit('resize');
    }

    // 拖动
    const titlebar = win.querySelector('.xp-titlebar');
    titlebar.addEventListener('pointerdown', e => {
      if (e.target.closest('.xp-tb-btn') || maximized) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, ox = win.offsetLeft, oy = win.offsetTop;
      titlebar.setPointerCapture(e.pointerId);
      const move = ev => {
        const nx = Math.min(Math.max(-W + 80, ox + ev.clientX - sx), window.innerWidth - 80);
        const ny = Math.min(Math.max(0, oy + ev.clientY - sy), window.innerHeight - 60);
        win.style.left = nx + 'px'; win.style.top = ny + 'px';
      };
      const up = () => { titlebar.removeEventListener('pointermove', move); titlebar.removeEventListener('pointerup', up); };
      titlebar.addEventListener('pointermove', move);
      titlebar.addEventListener('pointerup', up);
    });

    // 缩放
    if (opts.resizable !== false) {
      const handle = el('div', { class: 'xp-resize' });
      win.appendChild(handle);
      handle.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const sx = e.clientX, sy = e.clientY, ow = win.offsetWidth, oh = win.offsetHeight;
        handle.setPointerCapture(e.pointerId);
        const move = ev => {
          win.style.width = Math.max(240, ow + ev.clientX - sx) + 'px';
          win.style.height = Math.max(120, oh + ev.clientY - sy) + 'px';
          api.emit('resize');
        };
        const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
      });
    }

    doFocus();
    return api;
  }

  /* ---------------- 开始菜单 ---------------- */
  const startMenu = document.getElementById('startMenu');
  const startBtn = document.getElementById('startBtn');
  let startOpen = false;

  function renderStartMenu() {
    const pinned = document.getElementById('smPinned');
    const right = document.getElementById('smRight');
    pinned.innerHTML = ''; right.innerHTML = '';
    // 左侧: 已注册应用(桌面软件)
    appOrder.forEach(id => {
      const app = apps[id];
      if (app.desktop === false) return;
      pinned.appendChild(el('div', { class: 'sm-item', onclick: () => { openApp(id); closeStartMenu(); } }, [
        el('span', { class: 'ico', html: app.icon || '❔' }),
        el('span', { text: app.name }),
      ]));
    });
    // 右侧: 系统位置
    const rightItems = [
      { icon: '📁', name: '我的文档', act: () => openApp('docs') },
      { icon: '🖼️', name: '图片收藏', act: () => openApp('docs') },
      { icon: '🎵', name: '我的音乐', act: () => openApp('docs') },
      { icon: '💻', name: '我的电脑', act: () => openApp('computer') },
      { icon: '🌐', name: '网上邻居', act: () => notify('网上邻居', '整个网络: 未找到其他计算机。\n(毕竟这是 2005 年的单机模拟器)') },
      { icon: '⚙️', name: '控制面板', act: () => openApp('controlpanel') },
      { icon: '🖨️', name: '打印机和传真', act: () => notify('打印机和传真', '未安装打印机。') },
      { icon: '❓', name: '帮助和支持', act: () => notify('帮助和支持', '遇到问题? 双击桌面图标开始玩吧!') },
      { icon: '🔍', name: '搜索', act: () => notify('搜索', '你想找什么呢? 试试打开「我的电脑」。') },
      { icon: '🏃', name: '运行…', act: () => openRunDialog() },
    ];
    rightItems.forEach(it => {
      right.appendChild(el('div', { class: 'sm-item', onclick: () => { it.act(); closeStartMenu(); } }, [
        el('span', { class: 'ico', html: it.icon }),
        el('span', { text: it.name }),
      ]));
    });
  }
  function openRunDialog() {
    const w = createWindow({ title: '运行', icon: '🏃', width: 380, height: 150, resizable: false });
    const input = el('input', { class: 'xp-input', style: { width: '100%', marginTop: '6px' }, placeholder: '例如: notepad' });
    w.body.style.padding = '12px';
    w.body.appendChild(el('div', { text: '请键入程序、文件夹、文档或 Internet 资源的名称，Windows 将为您打开它。' }));
    w.body.appendChild(el('div', { style: { marginTop: '10px' } }, [el('label', { text: '打开(O): ' }), input]));
    const row = el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '14px' } });
    const ok = el('button', { class: 'xp-btn', text: '确定' });
    ok.addEventListener('click', () => {
      const v = input.value.trim().toLowerCase();
      const map = { notepad: 'notepad', 'notepad.exe': 'notepad', mspaint: 'paint', 'mspaint.exe': 'paint', iexplore: 'ie', 'iexplore.exe': 'ie', qq: 'qq', winmine: 'minesweeper', 'winmine.exe': 'minesweeper' };
      if (map[v]) { openApp(map[v]); w.close(); }
      else { sound('error'); alert('找不到文件 "' + input.value + '" (或它的组件之一)。请确定路径和文件名是否正确。'); }
    });
    const cancel = el('button', { class: 'xp-btn', text: '取消' });
    cancel.addEventListener('click', () => w.close());
    row.appendChild(ok); row.appendChild(cancel);
    w.body.appendChild(row);
    input.focus();
  }
  function toggleStartMenu() {
    startOpen = !startOpen;
    startMenu.classList.toggle('hidden', !startOpen);
    startBtn.classList.toggle('active', startOpen);
    if (startOpen) renderStartMenu();
  }
  function closeStartMenu() {
    if (!startOpen) return;
    startOpen = false; startMenu.classList.add('hidden'); startBtn.classList.remove('active');
  }
  startBtn.addEventListener('click', e => { e.stopPropagation(); toggleStartMenu(); });
  startMenu.addEventListener('click', e => e.stopPropagation());
  document.getElementById('smLogoff').addEventListener('click', () => {
    closeStartMenu();
    document.getElementById('desktop').classList.add('hidden');
    document.getElementById('login').classList.remove('hidden');
  });
  document.getElementById('smShutdown').addEventListener('click', () => {
    closeStartMenu();
    const sd = document.getElementById('shutdown');
    sd.classList.remove('hidden', 'off');
    sd.querySelector('.shutdown-text').textContent = '正在保存设置…';
    try { const a = new Audio('assets/audio/xp-shutdown.mp3'); a.volume = 0.85; a.play().catch(() => sound('tada')); } catch (e) { sound('tada'); }
    setTimeout(() => {
      sd.classList.add('off');
      sd.querySelector('.shutdown-text').textContent = '您现在可以安全地关闭计算机了。';
      const btn = el('button', { class: 'restart-btn', text: '重新启动' });
      btn.addEventListener('click', () => location.reload());
      sd.appendChild(btn);
    }, 2200);
  });

  /* ---------------- 托盘 / 时钟 / 通知 ---------------- */
  const trayIcons = document.getElementById('trayIcons');
  function trayAdd(iconHTML, tooltip, onClick) {
    const s = el('span', { html: iconHTML, title: tooltip || '' });
    if (onClick) s.addEventListener('click', onClick);
    trayIcons.appendChild(s);
    const remove = function () { s.remove(); };
    remove.el = s;   // 暴露元素供闪烁等操作
    return remove;
  }
  trayAdd('🔊', '音量', () => {
    muted = !muted;
    notify('音量', muted ? '已静音 🔇' : '已取消静音 🔊');
  });
  trayAdd('🖧', '本地连接', () => notify('本地连接', '状态: 已连接上\n速度: 100.0 Mbps\n发送: 1,024,888 字节\n收到: 8,192,666 字节'));

  function updateClock() {
    const d = new Date();
    const clock = document.getElementById('clock');
    clock.innerHTML = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') +
      '<br><span style="font-size:9px;opacity:.85">2005/' + (d.getMonth() + 1) + '/' + d.getDate() + '</span>';
    clock.title = '2005年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  }
  setInterval(updateClock, 1000); updateClock();

  let balloonTimer = null;
  function notify(title, text) {
    document.querySelectorAll('.xp-balloon').forEach(b => b.remove());
    const b = el('div', { class: 'xp-balloon' }, [
      el('span', { class: 'bl-close', text: '✕', onclick: () => b.remove() }),
      el('div', { class: 'bl-title', text: title }),
      el('div', { style: { whiteSpace: 'pre-line' }, text: text }),
    ]);
    document.getElementById('desktop').appendChild(b);
    clearTimeout(balloonTimer);
    balloonTimer = setTimeout(() => b.remove(), 5000);
  }

  /* ---------------- 桌面右键菜单 ---------------- */
  const desktopEl = document.getElementById('desktop');
  desktopEl.addEventListener('contextmenu', e => {
    if (e.target.closest('.xp-window') || e.target.closest('.taskbar') || e.target.closest('.start-menu')) return;
    e.preventDefault();
    document.querySelectorAll('.ctx-menu').forEach(m => m.remove());
    const menu = el('div', { class: 'ctx-menu', style: { left: e.clientX + 'px', top: e.clientY + 'px' } }, [
      el('div', { class: 'cm-item', text: '排列图标', onclick: () => menu.remove() }),
      el('div', { class: 'cm-item', text: '刷新', onclick: () => {
        renderIcons();
        // 图标闪烁一下, 还原 XP 刷新效果
        document.querySelectorAll('.xp-icon').forEach(ic => { ic.classList.remove('flicker'); void ic.offsetWidth; ic.classList.add('flicker'); });
        menu.remove();
      } }),
      el('div', { class: 'cm-sep' }),
      el('div', { class: 'cm-item', text: '新建文本文档', onclick: () => { FS.write('C:\\我的文档\\新建文本文档.txt', ''); notify('桌面', '已保存到「我的文档」'); menu.remove(); } }),
      el('div', { class: 'cm-sep' }),
      el('div', { class: 'cm-item', text: '属性', onclick: () => { openDisplayProps(); menu.remove(); } }),
    ]);
    desktopEl.appendChild(menu);
    setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
  });

  function openDisplayProps() {
    const w = createWindow({ title: '显示 属性', icon: '🖥️', width: 420, height: 330, resizable: false });
    w.body.style.padding = '10px';
    w.body.appendChild(el('div', { class: 'xp-tabbar' }, [
      el('div', { class: 'xp-tab', text: '主题' }),
      el('div', { class: 'xp-tab sel', text: '桌面' }),
      el('div', { class: 'xp-tab', text: '外观' }),
      el('div', { class: 'xp-tab', text: '设置' }),
    ]));
    w.body.appendChild(el('div', { style: { margin: '12px 4px 6px' }, text: '背景(K):' }));
    const list = el('div', { class: 'xp-listbox', style: { height: '130px', margin: '0 4px' } });
    const walls = [
      { name: 'Bliss (真实照片)', cls: '' },
      { name: 'Bliss (经典渐变)', cls: 'wall-css' },
      { name: '经典蓝', cls: 'wall-blue' },
      { name: '翡翠绿', cls: 'wall-green' },
      { name: 'Windows 经典', cls: 'wall-tea' },
    ];
    walls.forEach((wl, i) => {
      const item = el('div', { class: 'lb-item' + (i === 0 ? ' sel' : ''), text: wl.name });
      item.addEventListener('click', () => {
        list.querySelectorAll('.lb-item').forEach(x => x.classList.remove('sel'));
        item.classList.add('sel');
      });
      list.appendChild(item);
    });
    w.body.appendChild(list);
    const row = el('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '14px' } });
    const ok = el('button', { class: 'xp-btn', text: '确定' });
    ok.addEventListener('click', () => {
      const selIdx = [...list.querySelectorAll('.lb-item')].findIndex(x => x.classList.contains('sel'));
      const cls = (walls[selIdx] && walls[selIdx].cls) || '';
      desktopEl.className = 'desktop' + (cls ? ' ' + cls : '');
      try { localStorage.setItem('winxp_wall', cls); } catch (e) {}
      w.close();
    });
    const cancel = el('button', { class: 'xp-btn', text: '取消' });
    cancel.addEventListener('click', () => w.close());
    row.appendChild(ok); row.appendChild(cancel);
    w.body.appendChild(row);
  }

  /* ---------------- 屏保 (闲置 3 分钟自动播放, 任意输入退出) ---------------- */
  const SS_IDLE_MS = 180000;
  let ssTimer = null, ssActive = false, ssBroken = false;
  const ssVideo = el('video', { src: 'assets/img/screensaver-hill.mp4', loop: '', muted: '', playsinline: '', preload: 'auto' });
  ssVideo.addEventListener('error', () => { ssBroken = true; });
  const ssEl = el('div', { class: 'screensaver hidden' }, [
    ssVideo,
    el('div', { class: 'ss-tip', text: '移动鼠标或按任意键退出屏保' }),
  ]);
  document.body.appendChild(ssEl);
  function ssActivate() {
    if (ssBroken || ssActive) return;
    if (desktopEl.classList.contains('hidden')) return;
    ssActive = true;
    ssEl.classList.remove('hidden');
    try { ssVideo.currentTime = 0; ssVideo.play().catch(() => {}); } catch (e) {}
  }
  function ssReset() {
    if (ssActive) { ssActive = false; ssEl.classList.add('hidden'); try { ssVideo.pause(); } catch (e) {} }
    clearTimeout(ssTimer);
    ssTimer = setTimeout(ssActivate, SS_IDLE_MS);
  }
  ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'pointerdown'].forEach(ev =>
    document.addEventListener(ev, ssReset, { passive: true }));
  ssReset();

  /* ---------------- 启动流程 ---------------- */
  function boot() {
    try {
      const savedWall = localStorage.getItem('winxp_wall');
      if (savedWall) desktopEl.classList.add(savedWall);
    } catch (e) {}
    setTimeout(() => {
      document.getElementById('boot').classList.add('hidden');
      document.getElementById('login').classList.remove('hidden');
    }, 2600);
  }
  document.getElementById('loginUser').addEventListener('click', () => {
    // 优先播放真实 XP 开机声, 失败回退合成音
    let played = false;
    try {
      const a = new Audio('assets/audio/xp-startup.mp3');
      a.volume = 0.85;
      a.play().then(() => { played = true; }).catch(() => { if (!played) sound('startup'); });
      setTimeout(() => { if (!played) sound('startup'); }, 300);
    } catch (e) { sound('startup'); }
    document.getElementById('login').classList.add('hidden');
    desktopEl.classList.remove('hidden');
    setTimeout(() => notify('Windows XP', '欢迎回来，Administrator！\n双击桌面图标开始使用。'), 800);
  });

  /* ---------------- 导出 API ---------------- */
  window.XP = {
    el, sound, notify, trayAdd,
    registerApp, openApp, createWindow,
    fs: FS,
    get apps() { return apps; },
    setMuted(v) { muted = !!v; },
    isMuted() { return muted; },
    screensaverTest: ssActivate,
  };

  boot();
})();
