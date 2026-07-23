/* ============================================================
   千千静听 (TTPlayer) — 2005 年经典播放器复刻
   · 优先播放 assets/audio/ 下的真实音频文件(Kevin MacLeod, CC-BY)
   · HTMLAudioElement → MediaElementSource → AnalyserNode 真实频谱
   · 文件缺失/加载失败时自动回退内置 WebAudio 合成引擎(按种子生成旋律)
   · 频谱数据持续全 0(file:// 下取不到数据)时自动切换仿真频谱
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 歌曲列表 ---------------- */
  const SONGS = [
    { artist: '光良',        title: '童话',           dur: 245, src: 'assets/audio/01.mp3', real: 'At Rest',                  vocal: true }, // 4:05
    { artist: 'S.H.E',       title: 'Super Star',     dur: 194, src: 'assets/audio/02.mp3', real: 'Monkeys Spinning Monkeys', vocal: true }, // 3:14
    { artist: '任贤齐',      title: '对面的女孩看过来', dur: 190, src: 'assets/audio/03.mp3', real: '原唱完整版 · 网易云音乐', vocal: true }, // 3:10
    { artist: '香香',        title: '老鼠爱大米',     dur: 212, src: 'assets/audio/04.mp3', real: 'Carefree',                 vocal: true }, // 3:32
    { artist: '庞龙',        title: '两只蝴蝶',       dur: 263, src: 'assets/audio/05.mp3', real: 'Dreamy Flashback',         vocal: true }, // 4:23
    { artist: '周传雄',      title: '黄昏',           dur: 183, src: 'assets/audio/06.mp3', real: '原唱完整版 · 网易云音乐', vocal: true }, // 3:03
    { artist: '黄品源',      title: '小薇',           dur: 197, src: 'assets/audio/07.mp3', real: '原唱完整版 · 网易云音乐', vocal: true }, // 3:17
    { artist: '梁静茹',      title: '宁夏',           dur: 209, src: 'assets/audio/08.mp3', real: 'Deliberate Thought',         vocal: true }, // 3:29
    { artist: '刘德华',      title: '忘情水',         dur: 212, src: 'assets/audio/09.mp3', real: '原唱完整版 · 网易云音乐', vocal: true }, // 3:32
  ];
  const LOOP_LABELS = ['🔁 顺序播放', '🔂 单曲循环', '🔀 随机播放'];
  const STEPS = 32; // 每循环 32 个 16 分音符(2 小节)

  /* ---------------- 伪歌词素材 ---------------- */
  const LRC_A = ['♪ 啦啦啦 啦啦啦 ♪', '♪ 啦啦啦 啦啦 啦啦啦 ♪', 'oh~ yeah~ oh~ yeah~',
    'baby baby 哦~ baby', 'woo~ 哦哦~ yeah~', 'na na na na na na',
    '♪ 啦 啦啦 啦啦啦 ♪', 'oh~ 哦~ yeah~ 耶~', '嗯嗯~ 哦哦~ 耶~', '啦啦啦啦 啦啦啦啦'];
  const LRC_B = ['想你 哦~ 想你', '爱你 啦啦 爱你', '星星 月亮 啦啦啦', '风轻轻 哦~ 吹过',
    '等待 哦~ 等待', '回忆 啦啦 回忆', '寂寞 哦~ 寂寞', '幸福 啦啦 幸福啦',
    '梦见你 哦~ 梦见你', '牵着手 啦啦啦'];

  /* ---------------- 工具 ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  }

  /* ---------------- 每首歌的音乐生成(种子决定) ---------------- */
  const SCALES = [
    [0, 2, 4, 5, 7, 9, 11],   // 大调
    [0, 2, 3, 5, 7, 8, 10],   // 自然小调
    [0, 2, 4, 7, 9],          // 五声大调
    [0, 3, 5, 7, 10],         // 五声小调
    [0, 2, 3, 5, 7, 9, 10],   // 多利亚
    [0, 2, 4, 5, 7, 9, 10],   // 混合利底亚
  ];
  const ROOTS = [55.00, 58.27, 61.74, 65.41, 73.42, 82.41]; // A1~E2
  const PROGS = [[0, 5, 3, 4], [0, 4, 5, 3], [0, 3, 4, 0], [0, 5, 4, 3],
    [0, 2, 4, 5], [0, 4, 0, 5], [0, 3, 5, 4]];

  function genMusic(idx) {
    const rnd = mulberry32(((idx + 1) * 2654435761) >>> 0);
    const pick = a => a[Math.floor(rnd() * a.length)];
    const mus = {
      bpm: 80 + Math.floor(rnd() * 51),                 // 80~130
      scale: pick(SCALES),
      root: pick(ROOTS),
      leadWave: rnd() < 0.5 ? 'square' : 'triangle',
      bassWave: rnd() < 0.5 ? 'sine' : 'triangle',
      prog: pick(PROGS),
      bassPulse: rnd() < 0.5,
      hatEvery: rnd() < 0.5 ? 2 : 4,
      mel: [], kick: [], snare: [],
    };
    // 主旋律: 随机游走 + 倾向和弦音
    let deg = 5 + Math.floor(rnd() * 5);
    const density = 0.5 + rnd() * 0.35;
    for (let s = 0; s < STEPS; s++) {
      const strong = s % 4 === 0;
      const p = strong ? 0.92 : density * (s % 2 ? 0.6 : 1);
      if (rnd() < p) {
        let d;
        if (rnd() < 0.5) d = mus.prog[Math.floor(s / 8) % 4] + pick([0, 2, 4, 7]);
        else { deg += Math.floor(rnd() * 5) - 2; deg = Math.max(-2, Math.min(14, deg)); d = deg; }
        deg = d;
        mus.mel[s] = { deg: d, oct: rnd() < 0.12 ? 4 : 3, len: rnd() < 0.25 ? 2 : 1 };
      } else mus.mel[s] = null;
    }
    // 鼓点型
    for (let s = 0; s < STEPS; s++) {
      if (s % 8 === 0 || (s % 16 === 6 && rnd() < 0.35) || (s % 16 === 14 && rnd() < 0.35)) mus.kick.push(s);
      if (s % 8 === 4 || (s % 16 === 15 && rnd() < 0.2)) mus.snare.push(s);
    }
    return mus;
  }
  function music(i) { if (!SONGS[i]._m) SONGS[i]._m = genMusic(i); return SONGS[i]._m; }

  function degSemi(scale, deg) {
    const n = scale.length, o = Math.floor(deg / n);
    return scale[deg - o * n] + 12 * o;
  }
  function mfreq(mus, deg, oct) {
    return mus.root * Math.pow(2, (degSemi(mus.scale, deg) + 12 * oct) / 12);
  }

  /* ---------------- 伪歌词生成 ---------------- */
  function lyrics(i) {
    if (!SONGS[i]._l) {
      const rnd = mulberry32(((i + 7) * 2246822519) >>> 0);
      const n = 6 + Math.floor(rnd() * 5), arr = [];
      for (let k = 0; k < n; k++) {
        if (k === 2) arr.push('《' + SONGS[i].title + '》 啦啦啦~');
        else arr.push(rnd() < 0.5 ? LRC_A[Math.floor(rnd() * LRC_A.length)] : LRC_B[Math.floor(rnd() * LRC_B.length)]);
      }
      SONGS[i]._l = arr;
    }
    return SONGS[i]._l;
  }

  /* ---------------- 真实 LRC 歌词(assets/audio/NN.lrc) ---------------- */
  // 解析标准 LRC: [mm:ss.xx]文本; 一行可含多个时间戳; [ti:][ar:] 等无时间戳的元数据行与空歌词行忽略
  function parseLrc(text) {
    const out = [], re = /\[(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?\]/g;
    String(text).split(/\r?\n/).forEach(line => {
      let m, last = 0; const times = [];
      re.lastIndex = 0;
      while ((m = re.exec(line))) {
        times.push(parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + (m[3] ? parseFloat('0.' + m[3]) : 0));
        last = re.lastIndex;
      }
      if (!times.length) return;                          // 元数据行等: 无时间戳
      const txt = line.slice(last).replace(/\s+$/, '');
      if (!txt) return;                                   // 空歌词行
      times.forEach(t => out.push({ time: t, text: txt }));
    });
    out.sort((a, b) => a.time - b.time);
    return out;
  }
  // 二分查找: 最后一个 time <= p 的行下标, 全在 p 之后则 -1
  function lrcIndexAt(arr, p) {
    let lo = 0, hi = arr.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid].time <= p) { ans = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return ans;
  }
  // 拉取并解析当前曲目的 LRC; 结果缓存到 SONGS[i] 上, 失败静默回退伪歌词
  function fetchLrc(i) {
    const s = SONGS[i];
    if (s._lrc || s._lrcBad || typeof fetch !== 'function' || !/^https?:$/.test(location.protocol)) return;
    if (lrcCtl) {
      if (lrcCtlFor === i) return;                        // 同曲已在拉取中
      try { lrcCtl.abort(); } catch (e) {} lrcCtl = null; // 切歌: 取消上一曲的请求
    }
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    lrcCtl = ctl; lrcCtlFor = i;
    fetch('assets/audio/' + String(i + 1).padStart(2, '0') + '.lrc', ctl ? { signal: ctl.signal } : undefined)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(txt => {
        const arr = parseLrc(txt);
        if (arr.length) { s._lrc = arr; if (cur === i && win) buildLrc(); } // 仍停在该曲 → 换成真歌词
        else s._lrcBad = true;                          // 解析为空 → 伪歌词
      })
      .catch(err => {
        if (ctl && ctl.signal.aborted) return;            // 被切歌取消: 不标记, 下次重试
        s._lrcBad = true;                                 // file:// / 缺失 / 解析失败 → 伪歌词
      })
      .then(() => { if (lrcCtl === ctl) { lrcCtl = null; lrcCtlFor = -1; } });
  }

  /* ---------------- 状态 ---------------- */
  let win = null;
  let ctx = null, master = null, analyser = null, leadFilter = null, noiseBuf = null, freqData = null;
  let audioEl = null, mediaSrc = null;        // 真实音频: 每窗口一个 Audio 元素 + MediaElementSource
  let mode = 'real';                          // 'real' = 真实音频, 'synth' = 合成回退
  let realDur = null;                         // 真实时长(loadedmetadata 后更新)
  let cur = 0, sel = 0;
  let playing = false, startPos = 0, startCtx = 0, nextTime = 0;
  let loopMode = 0, showLrc = true, volume = 0.55;
  let schedTimer = null, rafId = null, lrcCur = -1, hintTimer = null;
  let lrcCtl = null, lrcCtlFor = -1;            // 进行中的 LRC 请求(用于切歌/关窗取消)
  let zeroFrames = 0, nzFrames = 0, simMode = false, simT = 0; // 频谱全 0 检测 / 仿真频谱
  const barVals = new Array(16).fill(0);
  const BASE_INFO = '192kbps  44.1kHz  立体声';

  // DOM 引用
  let titleInner, infoEl, timeEl, bars = [], plItems = [], lrcPanel, lrcInner, lrcLines = [];
  let btnPlay, btnPause, btnLoop, btnLrc, volTxt, progSl, volSl;

  /* ---------------- 音频引擎 ---------------- */
  function ensureCtx() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = volume;
      analyser = ctx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.7;
      leadFilter = ctx.createBiquadFilter(); leadFilter.type = 'lowpass'; leadFilter.frequency.value = 4000;
      master.connect(analyser); analyser.connect(ctx.destination); leadFilter.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      freqData = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) { ctx = null; return false; }
    // 真实音频接入音频图(每个元素只能 createMediaElementSource 一次)
    if (audioEl && !mediaSrc) {
      try { mediaSrc = ctx.createMediaElementSource(audioEl); mediaSrc.connect(master); }
      catch (e) { mediaSrc = null; } // 失败则元素直连扬声器, 频谱走仿真回退
    }
    return true;
  }

  function vLead(freq, t, dur) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = music(cur).leadWave; o.frequency.setValueAtTime(freq, t);
    const pk = 0.14;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pk, t + 0.015);
    g.gain.exponentialRampToValueAtTime(pk * 0.55, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(leadFilter);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function vBass(freq, t, dur) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = music(cur).bassWave; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function vKick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.2);
  }
  function vSnare(t) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    n.connect(f); f.connect(g); g.connect(master);
    n.start(t); n.stop(t + 0.2);
  }
  function vHat(t, vol) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(f); f.connect(g); g.connect(master);
    n.start(t); n.stop(t + 0.06);
  }

  function scheduleStep(mus, s, t, sd) {
    const m = mus.mel[s];
    if (m) vLead(mfreq(mus, m.deg, m.oct), t, sd * m.len * 0.95);
    if (s % 8 === 0 || (mus.bassPulse && s % 4 === 2))
      vBass(mfreq(mus, mus.prog[Math.floor(s / 8) % 4], 1), t, sd * (mus.bassPulse ? 1.9 : 7.4));
    if (mus.kick.indexOf(s) >= 0) vKick(t);
    if (mus.snare.indexOf(s) >= 0) vSnare(t);
    if (s % mus.hatEvery === 0) vHat(t, s % 4 === 0 ? 0.13 : 0.07);
  }

  // lookahead 调度器: 每 25ms 检查, 提前 120ms 排音符, 无缝循环(仅合成回退路径)
  function tick() {
    if (!playing || !ctx || mode !== 'synth') return;
    let guard = 0;
    while (playing && mode === 'synth' && nextTime < ctx.currentTime + 0.12 && guard++ < 300) {
      const mus = music(cur);
      const sd = 60 / mus.bpm / 4;
      const st = startPos + (nextTime - startCtx);
      if (st >= SONGS[cur].dur) { onSongEnd(); continue; }
      const loopDur = STEPS * sd;
      let ph = st % loopDur; if (ph < 0) ph += loopDur;
      scheduleStep(mus, Math.round(ph / sd) % STEPS, nextTime, sd);
      nextTime += sd;
    }
  }

  function curDur() { return (mode === 'real' && realDur) ? realDur : SONGS[cur].dur; }
  function posNow() {
    if (mode === 'real') return audioEl ? (audioEl.currentTime || 0) : 0;
    return (playing && ctx)
      ? Math.min(SONGS[cur].dur, startPos + ctx.currentTime - startCtx)
      : startPos;
  }

  /* ---------------- 播放控制 ---------------- */
  // 合成引擎启动(真实音频不可用时的回退路径)
  function startSynth(pos) {
    mode = 'synth';
    startPos = Math.max(0, Math.min(pos || 0, SONGS[cur].dur - 0.05));
    if (ctx) { startCtx = ctx.currentTime; nextTime = startCtx + 0.02; }
    simMode = false; zeroFrames = 0; nzFrames = 0;
  }
  // 真实音频加载失败 → 回退合成引擎(对该文件永久生效)
  function fallbackSynth() {
    SONGS[cur]._bad = true;
    const pos = audioEl ? (audioEl.currentTime || 0) : 0;
    if (audioEl) { try { audioEl.removeAttribute('src'); audioEl.load(); } catch (e) {} }
    if (playing) startSynth(pos); else mode = 'synth';
    setHint('synth');
  }
  // 播放真实音频
  function tryRealPlay() {
    if (!audioEl || SONGS[cur]._bad) { startSynth(startPos); return; }
    mode = 'real';
    if (ctx && ctx.state === 'suspended') ctx.resume();
    setHint('real');
    let pr;
    try { pr = audioEl.play(); } catch (e) { fallbackSynth(); return; }
    if (pr && pr.catch) pr.catch(err => {
      // AbortError = 被切歌/新加载打断, 属正常, 不误判为文件损坏
      if (mode === 'real' && playing && err && err.name !== 'AbortError') fallbackSynth();
    });
  }

  function doPlay() {
    if (!ensureCtx()) { XP.notify('千千静听', '您的浏览器不支持 WebAudio，无法播放。'); return; }
    if (ctx.state === 'suspended') ctx.resume();
    if (playing) return;
    playing = true;
    if (mode === 'real') tryRealPlay(); else startSynth(startPos);
    refreshTransport();
  }
  function doPause() {
    if (!playing) return;
    startPos = posNow(); playing = false;
    if (audioEl) audioEl.pause();
    if (mode === 'synth' && ctx && ctx.state === 'running') ctx.suspend();
    refreshTransport();
  }
  function doStop() {
    playing = false; startPos = 0;
    if (audioEl) { audioEl.pause(); try { audioEl.currentTime = 0; } catch (e) {} }
    if (mode === 'synth' && ctx && ctx.state === 'running') ctx.suspend();
    setHint(null);
    refreshTransport();
  }
  function doSeek(frac) {
    frac = Math.max(0, Math.min(0.9999, frac));
    if (mode === 'real') {
      // realDur 未就绪(元数据加载中)时先用列表标注时长, 保证切歌后立即可拖
      const d = realDur || SONGS[cur].dur;
      if (audioEl && d) { try { audioEl.currentTime = frac * d; } catch (e) {} }
      return;
    }
    startPos = frac * SONGS[cur].dur;
    if (playing && ctx) { startCtx = ctx.currentTime; nextTime = startCtx + 0.02; }
  }
  function loadSong(i, keepPlay) {
    cur = ((i % SONGS.length) + SONGS.length) % SONGS.length;
    sel = cur; startPos = 0; realDur = null;
    zeroFrames = 0; nzFrames = 0;
    const go = playing && keepPlay;
    if (audioEl) { try { audioEl.pause(); } catch (e) {} }
    if (SONGS[cur]._bad) {                          // 该文件已知不可用 → 直接合成
      if (audioEl) { try { audioEl.removeAttribute('src'); } catch (e) {} }
      mode = 'synth'; simMode = false;
      if (go) startSynth(0);
    } else {
      mode = 'real';
      if (audioEl) { audioEl.loop = (loopMode === 1); audioEl.src = SONGS[cur].src; }
      if (go) tryRealPlay();
    }
    refreshSongUI();
  }
  function onSongEnd() {
    if (loopMode === 1) loadSong(cur, true);                        // 单曲循环(合成路径用; 真实音频靠 audio.loop)
    else if (loopMode === 2) {                                      // 随机
      let n = cur;
      while (n === cur && SONGS.length > 1) n = Math.floor(Math.random() * SONGS.length);
      loadSong(n, true);
    } else loadSong(cur + 1, true);                                 // 顺序(到末尾回到第一首)
  }
  function playIndex(i) {
    if (!ensureCtx()) { XP.notify('千千静听', '您的浏览器不支持 WebAudio，无法播放。'); return; }
    if (ctx.state === 'suspended') ctx.resume();
    playing = true;
    loadSong(i, true);
    refreshTransport();
  }

  /* ---------------- LCD 音质提示 ---------------- */
  function setHint(kind) {
    if (!infoEl) return;
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    if (kind === 'real') infoEl.textContent = BASE_INFO + '  (高品质)';
    else if (kind === 'synth') {                                  // 短暂提示后恢复
      infoEl.textContent = BASE_INFO + '  (合成音)';
      hintTimer = setTimeout(() => { hintTimer = null; if (infoEl) infoEl.textContent = BASE_INFO; }, 3500);
    } else infoEl.textContent = BASE_INFO;
  }

  /* ---------------- UI 刷新 ---------------- */
  function refreshTransport() {
    if (!btnPlay) return;
    btnPlay.classList.toggle('on', playing);
    btnPause.classList.toggle('on', !playing && startPos > 0);
  }
  function refreshPlSel() {
    plItems.forEach((it, k) => {
      it.classList.toggle('cur', k === cur);
      it.classList.toggle('sel', k === sel);
    });
  }
  function refreshSongUI() {
    const s = SONGS[cur];
    titleInner.textContent = s.artist + ' - ' + s.title;
    titleInner.style.animation = 'none'; void titleInner.offsetWidth; titleInner.style.animation = '';
    refreshPlSel();
    buildLrc();
    if (win) win.setTitle('千千静听 - ' + s.title);
  }
  function buildLrc() {
    lrcInner.innerHTML = ''; lrcLines = []; lrcCur = -1;
    const data = SONGS[cur]._lrc;
    const texts = data ? data.map(o => o.text) : lyrics(cur); // 真歌词未就绪 → 伪歌词
    texts.forEach(t => {
      const d = XP.el('div', { class: 'app-ttp-lrc-line', text: t });
      lrcInner.appendChild(d); lrcLines.push(d);
    });
    if (!data) fetchLrc(cur);                                 // 异步拉真歌词, 到位后自动重建
    lrcInner.style.transform = 'translateY(0)';
  }
  function updateLrc(p, d) {
    const L = lrcLines.length; if (!L || !d) return;
    const data = SONGS[cur]._lrc;
    let idx;
    if (data && data.length === L) idx = lrcIndexAt(data, p); // 真歌词: 按时间二分定位
    else { idx = Math.floor(p / d * L); if (idx >= L) idx = L - 1; } // 伪歌词: 均摊
    if (idx === lrcCur) return;
    if (lrcLines[lrcCur]) lrcLines[lrcCur].classList.remove('cur');
    if (idx >= 0 && lrcLines[idx]) lrcLines[idx].classList.add('cur');
    lrcCur = idx;
    const h = lrcPanel.clientHeight;
    lrcInner.style.transform = 'translateY(' + (idx < 0 ? 0 : Math.round(h / 2 - 10 - idx * 20)) + 'px)';
  }

  /* ---------------- 渲染循环: 时间/进度/频谱/歌词 ---------------- */
  function frame() {
    if (!win) return;
    const p = posNow(), d = curDur();
    timeEl.textContent = fmt(p) + ' / ' + fmt(d);
    if (!progSl.isDrag()) progSl.apply(d ? Math.min(1, p / d) : 0);
    if (ctx && playing) {
      analyser.getByteFrequencyData(freqData);
      if (mode === 'real') {
        // 真实音频: 检测频谱是否持续全 0(file:// 下个别浏览器取不到数据), 带迟滞防闪烁
        let sum = 0;
        for (let i = 0; i < freqData.length; i++) sum += freqData[i];
        if (sum === 0) { zeroFrames++; nzFrames = 0; if (zeroFrames >= 30) simMode = true; }
        else { nzFrames++; zeroFrames = 0; if (simMode && nzFrames >= 15) simMode = false; }
      } else { simMode = false; zeroFrames = 0; nzFrames = 0; }
      if (simMode) {
        // 仿真频谱: 正弦 + 随机模拟跳动的柱子
        simT += 0.14;
        for (let i = 0; i < 16; i++) {
          const v = (0.25 + 0.55 * Math.abs(Math.sin(simT * (0.7 + i * 0.11) + i * 0.8))) * (0.75 + 0.25 * Math.random());
          barVals[i] = Math.max(v, barVals[i] * 0.8);
        }
      } else {
        for (let i = 0; i < 16; i++) {
          const v = freqData[1 + Math.round(i * 1.5)] / 255;
          barVals[i] = Math.max(v, barVals[i] * 0.8);
        }
      }
    } else {
      for (let i = 0; i < 16; i++) barVals[i] *= 0.85;
    }
    for (let i = 0; i < 16; i++) bars[i].style.height = Math.max(3, barVals[i] * 100) + '%';
    if (showLrc) updateLrc(p, d);
    rafId = requestAnimationFrame(frame);
  }

  /* ---------------- 滑杆组件 ---------------- */
  function makeSlider(onInput) {
    const fill = XP.el('div', { class: 'app-ttp-sl-fill' });
    const thumb = XP.el('div', { class: 'app-ttp-sl-thumb' });
    const track = XP.el('div', { class: 'app-ttp-sl' }, [fill, thumb]);
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
    return { track, apply, isDrag: () => drag };
  }

  /* ---------------- 构建界面 ---------------- */
  function mkBtn(label, tip, fn, wide) {
    return XP.el('button', { class: 'app-ttp-btn' + (wide ? ' wide' : ''), title: tip, text: label, onClick: fn });
  }

  function buildUI(body) {
    body.style.padding = '0'; body.style.overflow = 'hidden';
    const root = XP.el('div', { class: 'app-ttp-root' });

    // LCD 显示屏
    titleInner = XP.el('span', { class: 'app-ttp-title-inner' });
    bars = [];
    const spec = XP.el('div', { class: 'app-ttp-spec' });
    for (let i = 0; i < 16; i++) { const b = XP.el('div', { class: 'app-ttp-bar' }); spec.appendChild(b); bars.push(b); }
    timeEl = XP.el('span', { text: '00:00 / 00:00' });
    infoEl = XP.el('span', { text: BASE_INFO });
    root.appendChild(XP.el('div', { class: 'app-ttp-lcd' }, [
      XP.el('div', { class: 'app-ttp-title' }, [titleInner]),
      spec,
      XP.el('div', { class: 'app-ttp-info' }, [timeEl, infoEl]),
    ]));

    // 进度滑杆
    progSl = makeSlider(f => doSeek(f));
    root.appendChild(XP.el('div', { class: 'app-ttp-row' }, [progSl.track]));

    // 控制按钮
    btnPlay = mkBtn('▶', '播放', doPlay);
    btnPause = mkBtn('⏸', '暂停', doPause);
    btnLoop = mkBtn(LOOP_LABELS[loopMode], '循环模式', () => {
      loopMode = (loopMode + 1) % 3;
      btnLoop.textContent = LOOP_LABELS[loopMode];
      if (audioEl) audioEl.loop = (loopMode === 1); // 真实音频单曲循环
    }, true);
    btnLrc = mkBtn('📜 歌词', '歌词开关', () => {
      showLrc = !showLrc;
      lrcPanel.style.display = showLrc ? '' : 'none';
      btnLrc.classList.toggle('on', showLrc);
    }, true);
    btnLrc.classList.add('on');
    root.appendChild(XP.el('div', { class: 'app-ttp-row' }, [
      mkBtn('⏮', '上一曲', () => loadSong(cur - 1, true)),
      btnPlay,
      btnPause,
      mkBtn('⏹', '停止', doStop),
      mkBtn('⏭', '下一曲', () => loadSong(cur + 1, true)),
      XP.el('div', { class: 'app-ttp-spacer' }),
      btnLoop, btnLrc,
    ]));

    // 播放列表 + 歌词面板
    const pl = XP.el('div', { class: 'app-ttp-pl xp-scroll' });
    plItems = [];
    SONGS.forEach((s, i) => {
      const item = XP.el('div', { class: 'app-ttp-pl-item', text: (i + 1) + '. ' + s.artist + ' - ' + s.title + ' (' + fmt(s.dur) + ')' });
      item.title = (s.vocal ? '原唱完整版 · 网易云音乐' : '原曲: ' + s.real + ' · Kevin MacLeod (CC-BY 3.0)') + ' —— 单击播放';
      item.addEventListener('click', () => { sel = i; refreshPlSel(); playIndex(i); });   // 单击即播放
      item.addEventListener('dblclick', () => playIndex(i));
      pl.appendChild(item); plItems.push(item);
    });
    lrcInner = XP.el('div', { class: 'app-ttp-lrc-inner' });
    lrcPanel = XP.el('div', { class: 'app-ttp-lrc' }, [lrcInner]);
    root.appendChild(XP.el('div', { class: 'app-ttp-main' }, [pl, lrcPanel]));

    // 音量
    volSl = makeSlider(f => {
      volume = f;
      if (master) master.gain.value = f;
      volTxt.textContent = Math.round(f * 100) + '%';
    });
    volSl.apply(volume);
    volTxt = XP.el('span', { class: 'app-ttp-vol-txt', text: Math.round(volume * 100) + '%' });
    root.appendChild(XP.el('div', { class: 'app-ttp-row' }, [
      XP.el('span', { text: '🔊' }), volSl.track, volTxt,
    ]));

    body.appendChild(root);
    refreshSongUI(); refreshTransport();
  }

  /* ---------------- CSS 注入 ---------------- */
  let cssDone = false;
  function injectCSS() {
    if (cssDone) return; cssDone = true;
    const st = document.createElement('style');
    st.textContent = `
.app-ttp-root{height:100%;display:flex;flex-direction:column;gap:5px;padding:6px;background:linear-gradient(180deg,#3a3a3a,#2b2b2b);color:#ddd;font-size:12px;overflow:hidden;}
.app-ttp-lcd{background:#0d1f0d;border:2px inset #111;border-radius:4px;padding:6px 8px;box-shadow:inset 0 0 8px #000;flex:none;}
.app-ttp-title{height:20px;overflow:hidden;position:relative;border-bottom:1px solid #143014;}
.app-ttp-title-inner{position:absolute;white-space:nowrap;color:#39ff14;font-family:"Courier New",monospace;font-size:14px;font-weight:bold;text-shadow:0 0 6px #39ff14;animation:app-ttp-mar 8s linear infinite;}
@keyframes app-ttp-mar{from{left:100%;}to{left:-100%;}}
.app-ttp-spec{height:56px;display:flex;align-items:flex-end;gap:2px;padding:4px 0;}
.app-ttp-bar{flex:1;height:3%;background:linear-gradient(0deg,#00cc44 0%,#00cc44 65%,#c8d400 80%,#ff5533 100%);border-radius:1px 1px 0 0;}
.app-ttp-info{display:flex;justify-content:space-between;color:#39ff14;font-family:"Courier New",monospace;font-size:11px;opacity:.9;}
.app-ttp-row{display:flex;align-items:center;gap:6px;flex:none;}
.app-ttp-btn{min-width:30px;height:26px;padding:0 6px;border-radius:4px;border:1px solid #111;background:linear-gradient(180deg,#5a5a5a,#3c3c3c);color:#eee;font-size:13px;cursor:pointer;box-shadow:inset 0 1px 0 #777;}
.app-ttp-btn:hover{filter:brightness(1.2);}
.app-ttp-btn:active,.app-ttp-btn.on{background:linear-gradient(180deg,#2f2f2f,#4a4a4a);color:#39ff14;box-shadow:inset 0 1px 3px #000;}
.app-ttp-btn.wide{font-size:11px;min-width:78px;}
.app-ttp-spacer{flex:1;}
.app-ttp-sl{position:relative;flex:1;height:8px;padding:7px 0;margin:-7px 0;border-radius:4px;background:#161616;border:1px solid #000;box-shadow:inset 0 1px 2px #000;cursor:pointer;background-clip:content-box;}
.app-ttp-sl-fill{position:absolute;left:0;top:7px;bottom:7px;width:0%;border-radius:4px;background:linear-gradient(90deg,#0a6,#3f6);}
.app-ttp-sl-thumb{position:absolute;top:50%;left:0%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#aaa 60%,#666);border:1px solid #222;}
.app-ttp-main{flex:1;display:flex;gap:6px;min-height:0;}
.app-ttp-pl{flex:1.1;background:#111;border:1px solid #000;border-radius:3px;overflow:auto;color:#cfcfcf;font-size:12px;}
.app-ttp-pl-item{padding:3px 6px;cursor:default;white-space:nowrap;}
.app-ttp-pl-item:hover{background:#2a3a2a;}
.app-ttp-pl-item.sel{outline:1px dotted #888;outline-offset:-1px;}
.app-ttp-pl-item.cur{background:#145a14;color:#9fff9f;font-weight:bold;}
.app-ttp-lrc{flex:1;background:#0d1f0d;border:1px solid #000;border-radius:3px;overflow:hidden;position:relative;text-align:center;}
.app-ttp-lrc-inner{transition:transform .3s ease;padding-top:4px;}
.app-ttp-lrc-line{height:20px;line-height:20px;color:#2e7d2e;white-space:nowrap;font-size:12px;}
.app-ttp-lrc-line.cur{color:#39ff14;font-weight:bold;text-shadow:0 0 5px #39ff14;}
.app-ttp-vol-txt{min-width:32px;text-align:right;color:#bbb;font-size:11px;}
`;
    document.head.appendChild(st);
  }

  /* ---------------- 打开/关闭 ---------------- */
  function cleanup() {
    playing = false;
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    if (lrcCtl) { try { lrcCtl.abort(); } catch (e) {} lrcCtl = null; lrcCtlFor = -1; } // 取消进行中的歌词请求
    if (audioEl) {                                // 停播并释放音频元素(下次打开时新建)
      const a = audioEl; audioEl = null;
      try { a.pause(); a.removeAttribute('src'); a.load(); } catch (e) {}
    }
    mediaSrc = null;
    if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; }
    master = analyser = leadFilter = noiseBuf = freqData = null;
    realDur = null; simMode = false; zeroFrames = 0; nzFrames = 0;
    win = null;
  }

  function open() {
    if (win && !win.closed) { win.restore(); win.focus(); return; }
    injectCSS();
    win = XP.createWindow({ title: '千千静听', icon: '🎧', width: 480, height: 420, resizable: false });
    // 真实音频元素: 每个窗口生命周期一个(避免 MediaElementSource 重复绑定)
    const ae = new Audio();
    audioEl = ae;
    ae.preload = 'auto';
    ae.addEventListener('loadedmetadata', () => {
      realDur = (isFinite(ae.duration) && ae.duration > 0) ? ae.duration : null;
      if (realDur && SONGS[cur]._bad) SONGS[cur]._bad = false;   // 成功加载即解除误判标记
    });
    ae.addEventListener('ended', () => {          // 单曲循环由 audio.loop 处理, 其余模式在此切歌
      if (audioEl === ae && mode === 'real' && playing) onSongEnd();
    });
    ae.addEventListener('error', () => {          // 文件缺失/加载失败 → 合成回退
      if (audioEl === ae && mode === 'real') fallbackSynth();
    });
    buildUI(win.body);
    loadSong(cur, false);                         // 载入当前曲目的音频地址
    win.on('close', cleanup);
    schedTimer = setInterval(tick, 25);
    rafId = requestAnimationFrame(frame);
  }

  XP.registerApp({ id: 'ttplayer', name: '千千静听', icon: '🎧', open });
})();
