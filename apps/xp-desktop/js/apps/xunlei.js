/* ============================================================
   迅雷影音 2005 — 经典深色皮肤视频播放器复刻
   · HTML5 <video> 真实播放 assets/img/ 下的本地 mp4 文件
   · 播放/暂停/停止/上下部/进度条(含缓冲+拖动预览)/音量/倍速/全屏/循环
   · 空格播放暂停, 左右方向键快进快退 5 秒, 播完自动连播
   · 个别文件缺失时显示「视频文件缺失或正在转码」, 其余影片不受影响
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 播放列表 ---------------- */
  const VIDEOS = [
    { name: '海浪日落.mp4',      src: 'assets/img/video-beach.mp4' },
    { name: '跳舞的企鹅.mp4',    src: 'assets/img/video-penguin.mp4' },
    { name: '霓虹城市.mp4',      src: 'assets/img/video-city.mp4' },
    { name: '草原白云(屏保).mp4', src: 'assets/img/screensaver-hill.mp4' },
  ];
  const RATES = [0.5, 1, 1.5, 2];

  /* ---------------- 工具 ---------------- */
  function fmt(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    sec = Math.floor(sec);
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  }
  // 播完后的目标: 下一部下标; 已到末部时, 循环开→0, 循环关→-1(停止)
  function nextIndex(c, len, lp) {
    if (c < 0 || len <= 0) return -1;
    if (c < len - 1) return c + 1;
    return lp ? 0 : -1;
  }
  function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }

  /* ---------------- 状态 ---------------- */
  let win = null, video = null, dead = false;
  let cur = -1, sel = 0;                 // cur: 正在播放/已载入的影片, -1 = 尚未载入
  let loop = false, rateIdx = 1, volume = 0.7, duration = 0;
  let rafId = null, fsHideTimer = null, progDrag = false;

  // DOM 引用
  let stage, splash, errEl, bufEl, fsBar, fsPlayBtn, fsTimeEl;
  let btnPlay, muteBtn, rateBtn, loopBtn, fsBtn, timeEl;
  let prog, progBuf, progFill, progThumb, progTip, volSl;
  let plItems = [];
  let plListEl = null, plHeadEl = null;

  /* ---------------- 播放列表项 ---------------- */
  function addPlItem(v) {
    let i = VIDEOS.indexOf(v);
    if (i < 0) { VIDEOS.push(v); i = VIDEOS.length - 1; }
    const flag = XP.el('span', { class: 'app-xl-pl-flag' });
    const item = XP.el('div', { class: 'app-xl-pl-item', title: '双击播放: ' + v.name }, [
      XP.el('span', { class: 'app-xl-pl-idx', text: String(i + 1) }),
      XP.el('span', { class: 'app-xl-pl-name', text: v.name }),
      flag,
    ]);
    item._flag = flag;
    item.addEventListener('click', () => { sel = i; refreshPlSel(); });
    item.addEventListener('dblclick', () => playIndex(i));
    if (plListEl) plListEl.appendChild(item);
    plItems.push(item);
    if (plHeadEl) plHeadEl.textContent = '播放列表 (' + VIDEOS.length + ')';
    return i;
  }

  /* ---------------- 播放控制 ---------------- */
  function refreshTransport() {
    if (!video) return;
    const on = !video.paused && !video.ended;
    btnPlay.textContent = on ? '⏸' : '▶';
    btnPlay.title = on ? '暂停 (空格)' : '播放 (空格)';
    if (fsPlayBtn) fsPlayBtn.textContent = on ? '⏸' : '▶';
  }
  function refreshPlSel() {
    plItems.forEach((it, k) => {
      it.classList.toggle('cur', k === cur);
      it.classList.toggle('sel', k === sel);
      it.classList.toggle('bad', !!VIDEOS[k]._bad);
      it._flag.textContent = k === cur ? '▶' : (VIDEOS[k]._bad ? '⚠' : '');
    });
  }
  function showError(v) { errEl.classList.toggle('hidden', !v); }

  // 载入并播放第 i 部(循环取模, 允许负数)
  function playIndex(i) {
    i = ((i % VIDEOS.length) + VIDEOS.length) % VIDEOS.length;
    cur = i; sel = i; duration = 0;
    splash.classList.add('hidden');
    showError(false);
    bufEl.classList.add('hidden');
    video.src = VIDEOS[i].src;
    video.playbackRate = RATES[rateIdx];
    refreshPlSel();
    if (win) win.setTitle('迅雷影音 - ' + VIDEOS[i].name);
    timeEl.textContent = '00:00 / 00:00';
    progSet(0); progBuf.style.width = '0%';
    let p;
    try { p = video.play(); } catch (e) { p = null; }
    if (p && p.catch) p.catch(() => refreshTransport()); // 载入失败由 error 事件兜底
    refreshTransport();
  }
  function togglePlay() {
    if (cur < 0) { playIndex(sel < 0 ? 0 : sel); return; }
    if (video.paused || video.ended) {
      let p;
      try { p = video.play(); } catch (e) { p = null; }
      if (p && p.catch) p.catch(() => refreshTransport());
    } else video.pause();
  }
  function doStop() {
    if (cur < 0) return;
    video.pause();
    try { video.currentTime = 0; } catch (e) {}
    refreshTransport();
  }
  function doPrev() {
    if (cur < 0) return;
    if (cur > 0) playIndex(cur - 1);
    else { try { video.currentTime = 0; } catch (e) {} }
  }
  function doNext() {
    if (cur < 0) return;
    const n = cur < VIDEOS.length - 1 ? cur + 1 : (loop ? 0 : -1);
    if (n >= 0) playIndex(n);
  }
  function seekDelta(d) {
    if (cur < 0) return;
    const t = (video.currentTime || 0) + d;
    try { video.currentTime = Math.max(0, duration ? Math.min(duration, t) : t); } catch (e) {}
  }
  function seekTo(f) {
    // duration 未就绪时尝试直接从元素取, 保证元数据加载前也可拖
    const d = duration || ((video && isFinite(video.duration) && video.duration > 0) ? video.duration : 0);
    if (!d) return;
    try { video.currentTime = Math.max(0, Math.min(d - 0.05, f * d)); } catch (e) {}
  }

  /* ---------------- 进度条 ---------------- */
  function progFrac(e) {
    const r = prog.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
  }
  function progSet(f) {
    progFill.style.width = (f * 100) + '%';
    progThumb.style.left = (f * 100) + '%';
  }
  function progShowTip(e, f) {
    const r = prog.getBoundingClientRect();
    progTip.textContent = fmt(f * duration);
    progTip.style.left = Math.max(0, Math.min(r.width, e.clientX - r.left)) + 'px';
    progTip.classList.remove('hidden');
  }
  function updateBuffer() {
    try {
      if (!duration || !video.buffered.length) { progBuf.style.width = '0%'; return; }
      const end = video.buffered.end(video.buffered.length - 1);
      progBuf.style.width = Math.min(100, end / duration * 100) + '%';
    } catch (e) {}
  }

  /* ---------------- 全屏 ---------------- */
  function toggleFS() {
    if (fsElement()) {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) { try { ex.call(document); } catch (e) {} }
      return;
    }
    const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (!req) { XP.notify('迅雷影音', '当前环境不支持全屏播放。'); return; }
    try {
      const r = req.call(stage);
      if (r && r.catch) r.catch(() => XP.notify('迅雷影音', '当前环境无法进入全屏。'));
    } catch (e) { XP.notify('迅雷影音', '当前环境无法进入全屏。'); }
  }
  function pokeFSBar() {
    fsBar.classList.add('show');
    stage.style.cursor = 'default';
    clearTimeout(fsHideTimer);
    fsHideTimer = setTimeout(() => {
      fsBar.classList.remove('show');
      stage.style.cursor = 'none';
    }, 2500);
  }
  function onFSChange() {
    if (dead) return;
    const on = fsElement() === stage;
    stage.classList.toggle('fs', on);
    fsBtn.textContent = on ? '退出全屏' : '全屏';
    if (on) pokeFSBar();
    else { fsBar.classList.remove('show'); stage.style.cursor = ''; clearTimeout(fsHideTimer); }
  }

  /* ---------------- 键盘快捷键 ---------------- */
  function onKey(e) {
    if (!win || win.closed || dead) return;
    if (win.el.classList.contains('inactive')) return;          // 仅当本窗口聚焦时响应
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seekDelta(-5); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seekDelta(5); }
  }

  /* ---------------- 渲染循环: 时间/进度 ---------------- */
  function frame() {
    if (!win || dead) return;
    const d = duration || 0;
    const t = cur >= 0 ? (video.currentTime || 0) : 0;
    timeEl.textContent = fmt(t) + ' / ' + fmt(d);
    if (!progDrag) progSet(d ? Math.min(1, t / d) : 0);
    if (fsTimeEl) fsTimeEl.textContent = fmt(t) + ' / ' + fmt(d);
    rafId = requestAnimationFrame(frame);
  }

  /* ---------------- 滑杆组件(音量) ---------------- */
  function makeSlider(onInput) {
    const fill = XP.el('div', { class: 'app-xl-sl-fill' });
    const thumb = XP.el('div', { class: 'app-xl-sl-thumb' });
    const track = XP.el('div', { class: 'app-xl-sl' }, [fill, thumb]);
    let drag = false;
    function apply(f) { fill.style.width = (f * 100) + '%'; thumb.style.left = (f * 100) + '%'; }
    function fromEvent(e) {
      const r = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
    }
    track.addEventListener('pointerdown', e => {
      e.preventDefault(); drag = true;
      try { track.setPointerCapture(e.pointerId); } catch (_) {}
      const f = fromEvent(e); apply(f); onInput(f);
    });
    track.addEventListener('pointermove', e => {
      if (!drag) return;
      const f = fromEvent(e); apply(f); onInput(f);
    });
    const up = () => { drag = false; };
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
    return { track, apply };
  }

  /* ---------------- 构建界面 ---------------- */
  function mkBtn(label, tip, fn) {
    return XP.el('button', { class: 'app-xl-btn', title: tip, text: label, onClick: fn });
  }

  function buildUI(body) {
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    const root = XP.el('div', { class: 'app-xl-root' });

    // 菜单栏(视觉复刻)
    root.appendChild(XP.el('div', { class: 'app-xl-menu' }, [
      XP.el('span', { text: '文件' }), XP.el('span', { text: '播放' }),
      XP.el('span', { text: '画面' }), XP.el('span', { text: '帮助' }),
    ]));

    // 主区: 视频舞台 + 播放列表
    video = XP.el('video', { class: 'app-xl-video', playsinline: '', preload: 'auto' });

    splash = XP.el('div', { class: 'app-xl-splash' }, [
      XP.el('div', { class: 'app-xl-bolt' }),
      XP.el('div', { class: 'app-xl-splash-title', text: '迅雷影音 2005' }),
      XP.el('div', { class: 'app-xl-splash-tip', text: '双击右侧列表开始播放' }),
    ]);
    errEl = XP.el('div', { class: 'app-xl-error hidden' }, [
      XP.el('div', { class: 'ic', text: '⚠' }),
      XP.el('div', { text: '视频文件缺失或正在转码' }),
      XP.el('div', { class: 'sub', text: '请尝试列表中的其他影片' }),
    ]);
    bufEl = XP.el('div', { class: 'app-xl-buf hidden', text: '正在缓冲…' });

    fsPlayBtn = XP.el('button', { class: 'app-xl-fs-btn', title: '播放/暂停', text: '▶', onClick: togglePlay });
    fsTimeEl = XP.el('span', { class: 'app-xl-fs-time', text: '00:00 / 00:00' });
    fsBar = XP.el('div', { class: 'app-xl-fsbar' }, [
      XP.el('button', { class: 'app-xl-fs-btn', title: '上一部', text: '⏮', onClick: doPrev }),
      fsPlayBtn,
      XP.el('button', { class: 'app-xl-fs-btn', title: '停止', text: '⏹', onClick: doStop }),
      XP.el('button', { class: 'app-xl-fs-btn', title: '下一部', text: '⏭', onClick: doNext }),
      fsTimeEl,
      XP.el('div', { class: 'app-xl-spacer' }),
      XP.el('button', { class: 'app-xl-fs-btn', title: '退出全屏 (Esc)', text: '退出全屏', onClick: toggleFS }),
    ]);

    stage = XP.el('div', { class: 'app-xl-stage' }, [video, splash, errEl, bufEl, fsBar]);
    stage.addEventListener('dblclick', toggleFS);
    stage.addEventListener('mousemove', () => { if (fsElement() === stage) pokeFSBar(); });

    plItems = [];
    const plList = XP.el('div', { class: 'app-xl-pl-list xp-scroll' });
    plListEl = plList;
    const plHead = XP.el('div', { class: 'app-xl-pl-head', text: '播放列表 (' + VIDEOS.length + ')' });
    plHeadEl = plHead;
    VIDEOS.forEach(v => addPlItem(v));
    const pl = XP.el('div', { class: 'app-xl-pl' }, [plHead, plList]);

    root.appendChild(XP.el('div', { class: 'app-xl-main' }, [stage, pl]));

    // 底部控制栏
    progBuf = XP.el('div', { class: 'app-xl-prog-buf' });
    progFill = XP.el('div', { class: 'app-xl-prog-fill' });
    progThumb = XP.el('div', { class: 'app-xl-prog-thumb' });
    progTip = XP.el('div', { class: 'app-xl-prog-tip hidden' });
    prog = XP.el('div', { class: 'app-xl-prog', title: '点击或拖动定位' }, [progBuf, progFill, progThumb, progTip]);
    prog.addEventListener('pointerdown', e => {
      e.preventDefault(); progDrag = true;
      try { prog.setPointerCapture(e.pointerId); } catch (_) {}
      const f = progFrac(e); progSet(f); progShowTip(e, f); seekTo(f);
    });
    prog.addEventListener('pointermove', e => {
      if (!progDrag) return;
      const f = progFrac(e); progSet(f); progShowTip(e, f); seekTo(f);
    });
    const progUp = () => { progDrag = false; progTip.classList.add('hidden'); };
    prog.addEventListener('pointerup', progUp);
    prog.addEventListener('pointercancel', progUp);

    btnPlay = mkBtn('▶', '播放 (空格)', togglePlay);
    timeEl = XP.el('span', { class: 'app-xl-time', text: '00:00 / 00:00' });

    muteBtn = mkBtn('🔊', '静音', () => {
      video.muted = !video.muted;
      muteBtn.textContent = video.muted ? '🔇' : '🔊';
      muteBtn.title = video.muted ? '取消静音' : '静音';
    });
    volSl = makeSlider(f => {
      volume = f;
      video.volume = f;
      if (f > 0 && video.muted) { video.muted = false; muteBtn.textContent = '🔊'; muteBtn.title = '静音'; }
    });
    volSl.apply(volume);

    rateBtn = mkBtn(RATES[rateIdx] + 'x', '播放速度', () => {
      rateIdx = (rateIdx + 1) % RATES.length;
      rateBtn.textContent = RATES[rateIdx] + 'x';
      video.playbackRate = RATES[rateIdx];
    });
    loopBtn = mkBtn('🔁 循环', '循环播放开关', () => {
      loop = !loop;
      loopBtn.classList.toggle('on', loop);
      loopBtn.title = loop ? '循环播放: 开' : '循环播放: 关';
    });
    fsBtn = mkBtn('全屏', '全屏播放', toggleFS);

    // 打开本地视频文件 (本次会话有效)
    const fileInput = XP.el('input', { type: 'file', accept: 'video/*,.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm', style: { display: 'none' } });
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const idx = addPlItem({ name: '📂 ' + f.name, src: url, local: true });
      XP.notify('迅雷影音', '已加载: ' + f.name + '\n(本次会话有效, 刷新后需重新添加)');
      playIndex(idx);
      fileInput.value = '';
    });
    const openBtn = mkBtn('📂 打开', '打开本地视频文件', () => fileInput.click());

    root.appendChild(XP.el('div', { class: 'app-xl-ctrl' }, [
      prog,
      XP.el('div', { class: 'app-xl-row' }, [
        mkBtn('⏮', '上一部', doPrev),
        btnPlay,
        mkBtn('⏹', '停止', doStop),
        mkBtn('⏭', '下一部', doNext),
        timeEl,
        XP.el('div', { class: 'app-xl-spacer' }),
        muteBtn, volSl.track,
        XP.el('div', { class: 'app-xl-sep' }),
        rateBtn, loopBtn, fsBtn, openBtn, fileInput,
      ]),
    ]));

    body.appendChild(root);
    refreshPlSel();
    refreshTransport();
  }

  /* ---------------- 视频事件 ---------------- */
  function bindVideo() {
    video.volume = volume;
    video.addEventListener('loadedmetadata', () => {
      duration = (isFinite(video.duration) && video.duration > 0) ? video.duration : 0;
      showError(false);
      bufEl.classList.add('hidden');
    });
    video.addEventListener('progress', updateBuffer);
    video.addEventListener('play', refreshTransport);
    video.addEventListener('pause', refreshTransport);
    video.addEventListener('ended', () => {
      if (dead) return;
      const n = nextIndex(cur, VIDEOS.length, loop);
      if (n >= 0) playIndex(n);                            // 自动连播下一部
      else refreshTransport();                             // 末部停止(按钮恢复 ▶)
    });
    video.addEventListener('error', () => {
      if (dead || cur < 0 || !video.getAttribute('src')) return;
      VIDEOS[cur]._bad = true;                             // 仅标记当前影片, 其余不受影响
      showError(true);
      bufEl.classList.add('hidden');
      refreshTransport();
      refreshPlSel();
    });
    video.addEventListener('waiting', () => { if (cur >= 0 && !video.ended) bufEl.classList.remove('hidden'); });
    video.addEventListener('stalled', () => { if (cur >= 0 && !video.ended) bufEl.classList.remove('hidden'); });
    video.addEventListener('playing', () => bufEl.classList.add('hidden'));
    video.addEventListener('canplay', () => bufEl.classList.add('hidden'));
    video.addEventListener('seeked', () => bufEl.classList.add('hidden'));
  }

  /* ---------------- CSS 注入 ---------------- */
  let cssDone = false;
  function injectCSS() {
    if (cssDone) return; cssDone = true;
    const st = document.createElement('style');
    st.textContent = `
.app-xl-root{height:100%;display:flex;flex-direction:column;background:linear-gradient(180deg,#262626,#141414);color:#cfcfcf;font-size:12px;overflow:hidden;}
.app-xl-menu{display:flex;flex:none;background:#202020;border-bottom:1px solid #000;padding:2px 4px;}
.app-xl-menu span{padding:2px 9px;cursor:default;color:#bbb;}
.app-xl-menu span:hover{background:#2e6fd8;color:#fff;}
.app-xl-main{flex:1;display:flex;min-height:0;}
.app-xl-stage{flex:1;position:relative;background:#000;overflow:hidden;min-width:0;}
.app-xl-stage:fullscreen{width:100%!important;height:100%!important;}
.app-xl-stage:-webkit-full-screen{width:100%!important;height:100%!important;}
.app-xl-video{width:100%;height:100%;object-fit:contain;display:block;background:#000;}
.app-xl-splash{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:radial-gradient(ellipse at 50% 40%,#123a6b 0%,#0a1f3c 45%,#050d1a 100%);z-index:2;}
.app-xl-bolt{width:84px;height:110px;background:linear-gradient(160deg,#bfe4ff,#3d9bff 45%,#0a4fc4);clip-path:polygon(58% 0,18% 56%,44% 56%,32% 100%,84% 38%,56% 38%);filter:drop-shadow(0 0 14px rgba(61,155,255,.9));}
.app-xl-splash-title{font-size:26px;font-weight:bold;letter-spacing:4px;color:#eaf4ff;text-shadow:0 0 12px rgba(61,155,255,.85);}
.app-xl-splash-tip{color:#8fb6e0;font-size:13px;letter-spacing:1px;}
.app-xl-error{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,.72);color:#ffd2d2;z-index:3;}
.app-xl-error .ic{font-size:40px;}
.app-xl-error .sub{color:#999;font-size:12px;}
.app-xl-buf{position:absolute;top:10px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.6);color:#cfe6ff;padding:3px 10px;border-radius:10px;font-size:12px;z-index:3;}
.app-xl-fsbar{position:absolute;left:0;right:0;bottom:0;display:none;align-items:center;gap:8px;padding:12px 14px;background:linear-gradient(0deg,rgba(0,0,0,.85),rgba(0,0,0,0));z-index:5;opacity:0;transition:opacity .3s;}
.app-xl-stage.fs .app-xl-fsbar{display:flex;pointer-events:none;}
.app-xl-stage.fs .app-xl-fsbar.show{opacity:1;pointer-events:auto;}
.app-xl-fs-btn{min-width:30px;height:26px;padding:0 7px;border-radius:4px;border:1px solid #000;background:linear-gradient(180deg,#525252,#333);color:#e6e6e6;font-size:13px;cursor:pointer;font-family:inherit;}
.app-xl-fs-btn:hover{filter:brightness(1.25);border-color:#2e6fd8;}
.app-xl-fs-time{color:#cfe6ff;font-family:"Courier New",monospace;font-size:12px;white-space:nowrap;}
.app-xl-pl{flex:none;width:180px;display:flex;flex-direction:column;background:#171717;border-left:1px solid #000;min-height:0;}
.app-xl-pl-head{flex:none;padding:6px 8px;font-weight:bold;color:#7fb4ff;border-bottom:1px solid #2a2a2a;background:#1d1d1d;}
.app-xl-pl-list{flex:1;overflow:auto;}
.app-xl-pl-item{display:flex;align-items:center;gap:6px;padding:5px 8px;cursor:default;border-bottom:1px solid #1e1e1e;}
.app-xl-pl-item:hover{background:#23364f;}
.app-xl-pl-item.sel{outline:1px dotted #6a8fc0;outline-offset:-1px;}
.app-xl-pl-item.cur{background:#0f3d7a;color:#fff;}
.app-xl-pl-item.bad{color:#777;}
.app-xl-pl-idx{flex:none;width:16px;color:#888;font-size:11px;text-align:right;}
.app-xl-pl-item.cur .app-xl-pl-idx{color:#9fc8ff;}
.app-xl-pl-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.app-xl-pl-flag{flex:none;width:14px;text-align:center;color:#ffd75f;font-size:11px;}
.app-xl-ctrl{flex:none;background:linear-gradient(180deg,#333,#1c1c1c);border-top:1px solid #000;padding:6px 8px;display:flex;flex-direction:column;gap:6px;}
.app-xl-prog{position:relative;height:10px;border-radius:5px;background:#0c0c0c;border:1px solid #000;box-shadow:inset 0 1px 2px #000;cursor:pointer;}
.app-xl-prog-buf{position:absolute;left:0;top:0;bottom:0;width:0%;border-radius:5px;background:#3a4a5c;}
.app-xl-prog-fill{position:absolute;left:0;top:0;bottom:0;width:0%;border-radius:5px;background:linear-gradient(90deg,#0a55c4,#3d9bff);}
.app-xl-prog-thumb{position:absolute;top:50%;left:0%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#9ec8ff 55%,#2a6fd0);border:1px solid #06244a;box-shadow:0 0 4px rgba(61,155,255,.8);}
.app-xl-prog-tip{position:absolute;bottom:16px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#cfe6ff;font-size:11px;padding:2px 6px;border-radius:3px;white-space:nowrap;pointer-events:none;font-family:"Courier New",monospace;}
.app-xl-row{display:flex;align-items:center;gap:6px;}
.app-xl-btn{min-width:32px;height:26px;padding:0 7px;border-radius:4px;border:1px solid #000;background:linear-gradient(180deg,#525252,#333);color:#e6e6e6;font-size:13px;cursor:pointer;box-shadow:inset 0 1px 0 #6e6e6e;font-family:inherit;}
.app-xl-btn:hover{filter:brightness(1.25);border-color:#2e6fd8;}
.app-xl-btn:active{background:linear-gradient(180deg,#2a2a2a,#3d3d3d);}
.app-xl-btn.on{background:linear-gradient(180deg,#2e6fd8,#1450b0);color:#fff;box-shadow:inset 0 1px 0 #7fb4ff;}
.app-xl-time{color:#7fd0ff;font-family:"Courier New",monospace;font-size:12px;white-space:nowrap;}
.app-xl-spacer{flex:1;}
.app-xl-sep{width:1px;height:20px;background:#444;margin:0 2px;}
.app-xl-sl{position:relative;width:84px;height:6px;flex:none;border-radius:3px;background:#0c0c0c;border:1px solid #000;cursor:pointer;}
.app-xl-sl-fill{position:absolute;left:0;top:0;bottom:0;width:70%;border-radius:3px;background:linear-gradient(90deg,#0a55c4,#3d9bff);}
.app-xl-sl-thumb{position:absolute;top:50%;left:70%;width:11px;height:11px;margin:-5.5px 0 0 -5.5px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#9ec8ff 55%,#2a6fd0);border:1px solid #06244a;}
.app-xl-pl-list::-webkit-scrollbar{width:14px;}
.app-xl-pl-list::-webkit-scrollbar-track{background:#101010;}
.app-xl-pl-list::-webkit-scrollbar-thumb{background:#333;border:1px solid #000;border-radius:2px;}
`;
    document.head.appendChild(st);
  }

  /* ---------------- 打开/关闭 ---------------- */
  function cleanup() {
    dead = true;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    clearTimeout(fsHideTimer);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('fullscreenchange', onFSChange);
    document.removeEventListener('webkitfullscreenchange', onFSChange);
    if (fsElement() === stage) {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      if (ex) { try { ex.call(document); } catch (e) {} }
    }
    if (video) {                                  // 停播并释放视频元素
      try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {}
      video = null;
    }
    win = null;
  }

  function open() {
    if (win && !win.closed) { win.restore(); win.focus(); return; }
    injectCSS();
    dead = false;
    cur = -1; sel = 0; duration = 0; progDrag = false;
    VIDEOS.forEach(v => { v._bad = false; });     // 重新打开时重试之前失败的文件
    win = XP.createWindow({ title: '迅雷影音', icon: '🎬', width: 800, height: 600 });
    buildUI(win.body);
    bindVideo();
    win.on('close', cleanup);
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('webkitfullscreenchange', onFSChange);
    rafId = requestAnimationFrame(frame);
  }

  XP.registerApp({ id: 'xunlei', name: '迅雷影音', icon: '🎬', open });
})();
