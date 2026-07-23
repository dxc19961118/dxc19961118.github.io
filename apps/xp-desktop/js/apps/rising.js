/* 瑞星杀毒软件 2005 — 查杀病毒 / 监控中心 / 在线升级 / 工具箱 + 瑞星小狮子助手 */
(function () {
  'use strict';

  /* ---------------- 样式注入 (类名统一前缀 app-rs-) ---------------- */
  if (!document.getElementById('app-rs-style')) {
    const style = document.createElement('style');
    style.id = 'app-rs-style';
    style.textContent = `
.app-rs-wrap { display: flex; flex-direction: column; height: 100%; background: #fff; }
.app-rs-banner { flex: none; height: 56px; background: linear-gradient(180deg, #5aa8f8 0%, #2b7de0 45%, #1457b8 100%); display: flex; align-items: center; gap: 10px; padding: 0 14px; border-bottom: 2px solid #0a3d80; }
.app-rs-logo { font-size: 34px; filter: drop-shadow(1px 1px 1px rgba(0,0,0,.45)); }
.app-rs-bname { color: #fff; font-size: 17px; font-weight: bold; text-shadow: 1px 1px 1px rgba(0,0,0,.5); line-height: 1.2; }
.app-rs-bname small { display: block; font-size: 10px; font-weight: normal; color: #d6e8ff; }
.app-rs-main { flex: 1; display: flex; min-height: 0; }
.app-rs-nav { flex: none; width: 116px; background: linear-gradient(180deg, #eaf3ff, #cfe0f8); border-right: 1px solid #9dbede; padding: 8px 6px; display: flex; flex-direction: column; gap: 4px; }
.app-rs-navbtn { display: flex; align-items: center; gap: 6px; padding: 7px 6px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; color: #10305f; font-size: 12px; }
.app-rs-navbtn .ic { font-size: 16px; width: 20px; text-align: center; }
.app-rs-navbtn:hover { background: #bcd6f5; border-color: #7fa8d8; }
.app-rs-navbtn.sel { background: linear-gradient(180deg, #5a9cf0, #2f6fd0); color: #fff; border-color: #1f4f9f; font-weight: bold; }
.app-rs-content { flex: 1; position: relative; min-width: 0; background: #fff; }
.app-rs-page { position: absolute; inset: 0; overflow: auto; padding: 10px 12px; display: none; }
.app-rs-page.sel { display: block; }
.app-rs-h { color: #0a3d80; font-size: 13px; font-weight: bold; margin: 0 0 8px; border-bottom: 1px solid #d8e4f5; padding-bottom: 4px; }
.app-rs-opt { display: block; padding: 4px 2px; cursor: pointer; }
.app-rs-opt:hover { background: #eef5ff; }
.app-rs-opt input { vertical-align: -1px; }
.app-rs-drives { margin: 4px 0 2px 22px; display: flex; gap: 14px; flex-wrap: wrap; }
.app-rs-drives label { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.app-rs-scanctl { display: flex; align-items: center; gap: 8px; margin: 10px 0 8px; }
.app-rs-bigbtn { font-size: 14px; font-weight: bold; padding: 7px 24px; color: #fff; border: 1px solid #1c5e1c; border-radius: 5px; cursor: pointer; background: linear-gradient(180deg, #78c45e, #3e8e2e); box-shadow: inset 0 1px 0 rgba(255,255,255,.45); }
.app-rs-bigbtn:hover { filter: brightness(1.07); }
.app-rs-bigbtn:active { background: linear-gradient(180deg, #3e8e2e, #78c45e); }
.app-rs-bigbtn:disabled { background: linear-gradient(180deg, #d8d8d8, #bdbdbd); border-color: #999; color: #777; cursor: default; box-shadow: none; }
.app-rs-curfile { font-size: 11px; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 6px 0 4px; font-family: "Lucida Console", monospace; background: #f4f8ff; border: 1px solid #d8e4f5; padding: 2px 5px; }
.app-rs-stats { display: flex; gap: 14px; font-size: 11px; color: #333; margin: 5px 0; flex-wrap: wrap; }
.app-rs-stats b { color: #0a3d80; }
.app-rs-summary { border: 1px solid #c8d8a8; background: #f4fae8; border-radius: 4px; padding: 8px 10px; margin: 6px 0; font-size: 12px; line-height: 1.6; display: none; }
.app-rs-summary .t { font-weight: bold; color: #2e6b14; margin-bottom: 2px; }
.app-rs-summary.bad { border-color: #e0b0a0; background: #fdf0ea; }
.app-rs-summary.bad .t { color: #b03010; }
.app-rs-resh { font-size: 11px; color: #555; margin: 8px 0 3px; }
.app-rs-results { border: 1px solid #7f9db9; background: #fff; height: 110px; overflow: auto; }
.app-rs-resrow { display: flex; align-items: center; gap: 6px; padding: 3px 6px; border-bottom: 1px solid #f0f0f0; font-size: 11px; }
.app-rs-resrow .vn { color: #c00; font-weight: bold; white-space: nowrap; }
.app-rs-resrow .vp { color: #666; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: "Lucida Console", monospace; font-size: 10px; }
.app-rs-resrow .vs { white-space: nowrap; }
.app-rs-resrow.cleared .vn { color: #888; text-decoration: line-through; }
.app-rs-resrow.cleared .vs { color: #2a8a2a; font-weight: bold; }
.app-rs-monrow { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #e2e2e2; border-radius: 4px; margin-bottom: 6px; background: #fafcff; }
.app-rs-led { width: 11px; height: 11px; border-radius: 50%; background: #c0c0c0; box-shadow: inset 0 0 2px rgba(0,0,0,.5); flex: none; }
.app-rs-led.on { background: #38d838; box-shadow: 0 0 5px #38d838; }
.app-rs-moninfo { flex: 1; }
.app-rs-moninfo .nm { font-weight: bold; color: #10305f; }
.app-rs-moninfo .ds { font-size: 10.5px; color: #777; margin-top: 1px; }
.app-rs-upinfo { background: #f4f8ff; border: 1px solid #d8e4f5; border-radius: 4px; padding: 10px 12px; margin-bottom: 6px; line-height: 1.8; }
.app-rs-upbox { display: none; margin-top: 4px; }
.app-rs-upmsg { font-size: 11px; color: #444; margin: 5px 0; min-height: 14px; }
.app-rs-toolsec { border: 1px solid #d8e4f5; border-radius: 4px; padding: 8px 10px; margin-bottom: 10px; background: #fcfdff; }
.app-rs-toolsec .tt { font-weight: bold; color: #0a3d80; margin-bottom: 6px; }
.app-rs-toolsec .app-rs-results { height: 84px; }
.app-rs-lion { position: absolute; right: 12px; bottom: 12px; width: 52px; height: 52px; font-size: 42px; line-height: 52px; text-align: center; cursor: pointer; z-index: 30; border: 2px solid transparent; border-radius: 10px; filter: drop-shadow(1px 2px 2px rgba(0,0,0,.3)); }
.app-rs-lion.idle { animation: rs-breathe 2.8s ease-in-out infinite; }
.app-rs-lion.scan { animation: rs-scan 1s steps(2, end) infinite; }
.app-rs-lion.alert { border-color: #f00; background: rgba(255,0,0,.14); animation: rs-alert .35s ease-in-out infinite; }
.app-rs-lion.sleep, .app-rs-lion.doze { opacity: .92; }
.app-rs-lion.happy { animation: rs-happy .55s ease-in-out 3; }
.app-rs-zzz { position: absolute; top: -12px; right: -8px; font-size: 15px; display: none; }
.app-rs-lion.sleep .app-rs-zzz, .app-rs-lion.doze .app-rs-zzz { display: block; animation: rs-zzz 2.4s ease-in-out infinite; }
.app-rs-bubble { position: absolute; right: 72px; bottom: 26px; max-width: 180px; background: #ffffe1; border: 1px solid #8a8a6a; border-radius: 6px; padding: 6px 9px; font-size: 11px; z-index: 31; display: none; box-shadow: 2px 2px 6px rgba(0,0,0,.3); line-height: 1.5; }
.app-rs-bubble::after { content: ''; position: absolute; right: -7px; bottom: 10px; border: 6px solid transparent; border-left-color: #ffffe1; }
@keyframes rs-breathe { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes rs-scan { 0% { transform: scaleX(1); } 50% { transform: scaleX(-1); } 100% { transform: scaleX(1); } }
@keyframes rs-alert { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-12px) rotate(4deg); } }
@keyframes rs-happy { 0%,100% { transform: rotate(0) scale(1); } 25% { transform: rotate(-14deg) scale(1.12); } 75% { transform: rotate(14deg) scale(1.12); } }
@keyframes rs-zzz { 0% { transform: translate(0, 6px) scale(.6); opacity: 0; } 35% { opacity: 1; } 100% { transform: translate(10px, -14px) scale(1.15); opacity: 0; } }
`;
    document.head.appendChild(style);
  }

  /* ---------------- 静态数据 ---------------- */
  const ENGINE_VER = '17.28';
  const APP_VER = '17.28.10';
  const DB_DATE0 = '2005-06-18';

  const VIRUSES = [
    'Worm.Win32.Sasser.d 震荡波变种',
    'Trojan.QQPass.a QQ盗号木马',
    'Backdoor.GrayPigeon 灰鸽子',
    'Virus.Win32.CIH 幽灵',
    'Trojan.PSW.LMir.a 传奇木马',
    'Worm.MSN.Bropia.a MSN蠕虫',
  ];
  const VULNS = [
    { name: 'MS05-039', desc: '即插即用服务远程代码执行漏洞', lvl: '严重' },
    { name: 'MS04-011', desc: 'LSASS 缓冲区溢出漏洞', lvl: '严重' },
    { name: 'MS05-002', desc: '光标与图标格式处理漏洞', lvl: '重要' },
    { name: 'MS03-026', desc: 'RPC 接口缓冲区溢出漏洞', lvl: '严重' },
    { name: 'MS04-007', desc: 'ASN.1 库处理漏洞', lvl: '重要' },
  ];
  const MONS = [
    { key: 'file', name: '文件监控', desc: '实时监控文件的打开、复制与运行' },
    { key: 'mail', name: '邮件监控', desc: '扫描收发邮件中的病毒附件' },
    { key: 'web',  name: '网页监控', desc: '拦截网页中的恶意脚本与木马' },
    { key: 'reg',  name: '注册表监控', desc: '防止病毒改写系统注册表' },
  ];
  const LION_LINES = [
    '我是瑞星小狮子卡卡!',
    '记得每天升级病毒库哦!',
    '要我给你讲个冷笑话吗? 咳咳…',
    '有卡卡在, 病毒一个都跑不掉!',
    '上网要小心, 不要乱点陌生链接哦!',
  ];

  /* 跨打开保持的状态 */
  let dbDate = DB_DATE0;
  const quarantine = [];
  let inst = null;

  /* ---------------- 小工具 ---------------- */
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function nextDay(s) {
    const d = new Date(s + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* 遍历虚拟文件系统, 收集 roots 下的全部文件真实路径 */
  function walkFs(roots) {
    const files = [];
    const seen = {};
    const stack = roots.slice();
    while (stack.length) {
      const dir = stack.pop();
      if (seen[dir]) continue;
      seen[dir] = true;
      let entries = [];
      try { entries = XP.fs.list(dir) || []; } catch (e) {}
      const base = dir.replace(/\\+$/, '');
      entries.forEach(en => {
        const p = base + '\\' + en.name;
        if (en.type === 'dir') stack.push(p);
        else files.push(p);
      });
    }
    return files;
  }

  XP.registerApp({ id: 'rising', name: '瑞星杀毒软件', icon: '🦁', open });

  function open() {
    if (inst && !inst.win.closed) { inst.win.restore(); inst.win.focus(); return; }
    inst = createInstance();
  }

  /* ============================================================
     应用实例
     ============================================================ */
  function createInstance() {
    /* ---- 定时器统一管理 (关窗时全部清理) ---- */
    const timers = [];
    function T(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
    function I(fn, ms) { const id = setInterval(fn, ms); timers.push(id); return id; }
    function clearT(id) {
      if (id == null) return;
      clearTimeout(id); clearInterval(id);
      const i = timers.indexOf(id); if (i >= 0) timers.splice(i, 1);
    }
    function clearAllTimers() { timers.splice(0).forEach(id => { clearTimeout(id); clearInterval(id); }); }

    let removeTray = null;
    const win = XP.createWindow({
      title: '瑞星杀毒软件 2005', icon: '🦁', width: 640, height: 480, resizable: false,
      onClose: function () {
        clearAllTimers();
        scanState.active = false;
        if (removeTray) { try { removeTray(); } catch (e) {} removeTray = null; }
        inst = null;
      },
    });
    removeTray = XP.trayAdd('🦁', '瑞星杀毒软件 2005', () => { win.restore(); win.focus(); });

    /* ---- 界面骨架 ---- */
    const wrap = XP.el('div', { class: 'app-rs-wrap' });
    wrap.appendChild(XP.el('div', { class: 'app-rs-banner' }, [
      XP.el('div', { class: 'app-rs-logo', text: '🦁' }),
      XP.el('div', { class: 'app-rs-bname', html: '瑞星杀毒软件 2005版<small>版本 ' + APP_VER + ' · 瑞星小狮子卡卡为您护航</small>' }),
    ]));
    const nav = XP.el('div', { class: 'app-rs-nav' });
    const content = XP.el('div', { class: 'app-rs-content' });
    wrap.appendChild(XP.el('div', { class: 'app-rs-main' }, [nav, content]));
    const sbDb = XP.el('span', { text: '病毒库日期: ' + dbDate });
    const sbEng = XP.el('span', { class: 'sb-cell', text: '引擎版本: ' + ENGINE_VER });
    const sbMon = XP.el('span', { class: 'sb-cell' });
    wrap.appendChild(XP.el('div', { class: 'xp-statusbar' }, [sbDb, sbEng, sbMon]));
    win.body.appendChild(wrap);

    /* ---- 小狮子助手 ---- */
    const scanState = { active: false, paused: false, pauseAcc: 0, pauseAt: 0, finish: null };
    const monState = { file: true, mail: true, web: true, reg: true };

    const lion = XP.el('div', { class: 'app-rs-lion idle', title: '瑞星小狮子卡卡' }, [
      '🦁', XP.el('span', { class: 'app-rs-zzz', text: '💤' }),
    ]);
    const bubble = XP.el('div', { class: 'app-rs-bubble' });
    content.appendChild(bubble);
    content.appendChild(lion);

    let lionTemp = null, lionTempTimer = null, bubbleTimer = null, dozeTimer = null;
    function lionBaseState() {
      if (scanState.active) return 'scan';
      if (MONS.every(m => !monState[m.key])) return 'sleep';
      return 'idle';
    }
    function applyLion() { lion.className = 'app-rs-lion ' + (lionTemp || lionBaseState()); }
    function setLionTemp(st, ms) {
      lionTemp = st; applyLion();
      clearT(lionTempTimer); lionTempTimer = null;
      if (ms) lionTempTimer = T(() => { lionTemp = null; applyLion(); }, ms);
    }
    function lionSay(text, ms) {
      bubble.textContent = text;
      bubble.style.display = 'block';
      clearT(bubbleTimer);
      bubbleTimer = T(() => { bubble.style.display = 'none'; }, ms || 3600);
    }
    lion.addEventListener('click', () => {
      lionSay(LION_LINES[randInt(0, LION_LINES.length - 1)]);
      XP.sound('ding');
    });
    function scheduleDoze() {
      clearT(dozeTimer);
      dozeTimer = T(() => {
        if (!lionTemp && lionBaseState() === 'idle') setLionTemp('doze', 4200);
        scheduleDoze();
      }, randInt(25000, 45000));
    }

    /* ---- 导航与分页 ---- */
    const NAVS = [
      { id: 'scan', icon: '🔍', name: '查杀病毒' },
      { id: 'mon',  icon: '📡', name: '监控中心' },
      { id: 'up',   icon: '⬆️', name: '升级' },
      { id: 'tool', icon: '🧰', name: '工具' },
    ];
    const pages = {};
    NAVS.forEach((n, i) => {
      const btn = XP.el('div', { class: 'app-rs-navbtn' + (i === 0 ? ' sel' : '') }, [
        XP.el('span', { class: 'ic', text: n.icon }),
        XP.el('span', { text: n.name }),
      ]);
      btn.addEventListener('click', () => {
        nav.querySelectorAll('.app-rs-navbtn').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        Object.keys(pages).forEach(k => pages[k].classList.toggle('sel', k === n.id));
        XP.sound('click');
      });
      nav.appendChild(btn);
      pages[n.id] = XP.el('div', { class: 'app-rs-page' + (i === 0 ? ' sel' : '') });
      content.appendChild(pages[n.id]);
    });

    /* ============================================================
       查杀病毒
       ============================================================ */
    pages.scan.appendChild(XP.el('div', { class: 'app-rs-h', text: '查杀病毒' }));

    const modeWrap = XP.el('div', { class: 'xp-fieldset' });
    modeWrap.appendChild(XP.el('legend', { text: '选择扫描方式' }));
    const driveBox = XP.el('div', { class: 'app-rs-drives' });
    const driveChecks = [];
    ['C:\\', 'D:\\', 'E:\\', 'F:\\'].forEach(d => {
      if (!XP.fs.exists(d)) return;
      const cb = XP.el('input', { type: 'checkbox' });
      cb.value = d;
      cb.checked = (d === 'C:\\');
      cb.disabled = true;
      driveChecks.push(cb);
      driveBox.appendChild(XP.el('label', {}, [cb, XP.el('span', { text: '本地磁盘 (' + d + ')' })]));
    });
    [
      { v: 'quick',  t: '快速扫描', d: '仅扫描 C:\\WINDOWS 与 C:\\Program Files (推荐)' },
      { v: 'full',   t: '全盘扫描', d: '扫描所有磁盘分区的全部文件' },
      { v: 'custom', t: '自定义扫描', d: '手动勾选需要扫描的磁盘分区' },
    ].forEach((m, i) => {
      const r = XP.el('input', { type: 'radio', name: 'rs-mode', value: m.v });
      if (i === 0) r.checked = true;
      r.addEventListener('change', () => {
        driveChecks.forEach(cb => { cb.disabled = !(r.value === 'custom'); });
      });
      modeWrap.appendChild(XP.el('label', { class: 'app-rs-opt' }, [
        r,
        XP.el('b', { text: ' ' + m.t + ' ' }),
        XP.el('span', { style: { color: '#777', fontSize: '11px' }, text: m.d }),
      ]));
    });
    modeWrap.appendChild(driveBox);
    pages.scan.appendChild(modeWrap);

    const bigBtn = XP.el('button', { class: 'app-rs-bigbtn', text: '开始查杀' });
    const pauseBtn = XP.el('button', { class: 'xp-btn', text: '暂停' });
    const stopBtn = XP.el('button', { class: 'xp-btn', text: '停止' });
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
    pages.scan.appendChild(XP.el('div', { class: 'app-rs-scanctl' }, [bigBtn, pauseBtn, stopBtn]));

    const barFill = XP.el('div', { style: { width: '0%' } });
    pages.scan.appendChild(XP.el('div', { class: 'xp-progress' }, [barFill]));
    const curFile = XP.el('div', { class: 'app-rs-curfile', text: '准备就绪' });
    pages.scan.appendChild(curFile);
    const stScanned = XP.el('b', { text: '0' });
    const stFound = XP.el('b', { text: '0' });
    const stHandled = XP.el('b', { text: '0' });
    const stTime = XP.el('b', { text: '0.0 秒' });
    pages.scan.appendChild(XP.el('div', { class: 'app-rs-stats' }, [
      XP.el('span', {}, ['已扫描文件: ', stScanned]),
      XP.el('span', {}, ['发现病毒: ', stFound]),
      XP.el('span', {}, ['已处理: ', stHandled]),
      XP.el('span', {}, ['用时: ', stTime]),
    ]));

    const summary = XP.el('div', { class: 'app-rs-summary' });
    pages.scan.appendChild(summary);
    pages.scan.appendChild(XP.el('div', { class: 'app-rs-resh', text: '病毒查杀记录:' }));
    const resList = XP.el('div', { class: 'app-rs-results' });
    resList.appendChild(XP.el('div', { class: 'app-rs-resrow', style: { color: '#999', justifyContent: 'center' }, text: '暂无记录, 点击「开始查杀」进行扫描。' }));
    pages.scan.appendChild(resList);

    function startScan() {
      if (scanState.active) return;
      const modeEl = pages.scan.querySelector('input[name="rs-mode"]:checked');
      const mode = modeEl ? modeEl.value : 'quick';
      let roots;
      if (mode === 'quick') roots = ['C:\\WINDOWS', 'C:\\Program Files'];
      else if (mode === 'full') roots = ['C:\\', 'D:\\'];
      else roots = driveChecks.filter(cb => cb.checked && !cb.disabled).map(cb => cb.value);
      if (!roots.length) { lionSay('请至少勾选一个要扫描的磁盘分区!'); return; }
      const files = walkFs(roots);
      if (!files.length) { lionSay('扫描范围内没有找到文件。'); return; }

      /* 病毒触发点: 每 40~80 个文件触发一次, 最多 3 个 */
      const triggers = {};
      let n = randInt(40, 80), tc = 0;
      while (tc < 3 && n < files.length) { triggers[n] = true; n += randInt(40, 80); tc++; }

      let idx = 0, found = 0, handled = 0, scanTimer = null;
      const t0 = Date.now();
      scanState.active = true;
      scanState.paused = false;
      scanState.pauseAcc = 0;
      scanState.pauseAt = 0;
      bigBtn.disabled = true;
      pauseBtn.disabled = false;
      stopBtn.disabled = false;
      pauseBtn.textContent = '暂停';
      summary.style.display = 'none';
      resList.innerHTML = '';
      stScanned.textContent = '0';
      stFound.textContent = '0';
      stHandled.textContent = '0';
      stTime.textContent = '0.0 秒';
      barFill.style.width = '0%';
      applyLion();
      XP.sound('ding');

      function elapsed() {
        return Date.now() - t0 - scanState.pauseAcc - (scanState.paused ? Date.now() - scanState.pauseAt : 0);
      }
      function addVirus(path) {
        found++;
        stFound.textContent = String(found);
        XP.sound('error');
        win.shake();
        setLionTemp('alert', 2800);
        const v = VIRUSES[randInt(0, VIRUSES.length - 1)];
        const st = XP.el('span', { class: 'vs', text: '未处理' });
        const btn = XP.el('button', { class: 'xp-btn', style: { padding: '0 8px', minHeight: '18px', fontSize: '11px' }, text: '清除' });
        const row = XP.el('div', { class: 'app-rs-resrow' }, [
          XP.el('span', { class: 'vn', text: v }),
          XP.el('span', { class: 'vp', text: path, title: path }),
          st, btn,
        ]);
        btn.addEventListener('click', () => {
          if (row.classList.contains('cleared')) return;
          row.classList.add('cleared');
          st.textContent = '已清除';
          btn.disabled = true;
          btn.textContent = '已清除';
          handled++;
          stHandled.textContent = String(handled);
          quarantine.push({ name: v, path: path, date: dbDate });
          renderQuar();
          XP.sound('ding');
          if (!scanState.active && handled === found) {
            setLionTemp('happy', 3200);
            lionSay('病毒已全部清除, 您的计算机很安全!');
          }
        });
        resList.appendChild(row);
        resList.scrollTop = resList.scrollHeight;
      }
      function finish(stopped) {
        scanState.active = false;
        scanState.paused = false;
        clearT(scanTimer);
        scanTimer = null;
        scanState.finish = null;
        bigBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        if (!stopped) barFill.style.width = '100%';
        curFile.textContent = stopped ? '扫描已停止' : '扫描完成';
        applyLion();
        const secs = (elapsed() / 1000).toFixed(1);
        summary.className = 'app-rs-summary' + (found > 0 && handled < found ? ' bad' : '');
        summary.style.display = 'block';
        summary.innerHTML = '';
        summary.appendChild(XP.el('div', { class: 't', text: stopped ? '扫描已停止' : '扫描完成 — 查杀报告' }));
        ['扫描用时: ' + secs + ' 秒',
         '扫描文件: ' + idx + ' 个',
         '发现病毒: ' + found + ' 个',
         '已处理: ' + handled + ' 个',
        ].forEach(t => summary.appendChild(XP.el('div', { text: t })));
        if (!stopped && found === 0) {
          setLionTemp('happy', 3400);
          lionSay('扫描完成, 没有发现病毒。您的计算机很安全!');
          XP.sound('tada');
        } else if (!stopped && handled === found) {
          setLionTemp('happy', 3400);
          lionSay('所有威胁均已处理, 您的计算机很安全!');
          XP.sound('tada');
        } else if (!stopped) {
          lionSay('发现 ' + found + ' 个病毒, 请点击「清除」处理!');
        } else {
          lionSay('扫描已停止。');
        }
      }
      function step() {
        if (!scanState.active) return;
        if (scanState.paused) { scanTimer = T(step, 120); return; }
        if (idx >= files.length) { finish(false); return; }
        const path = files[idx];
        curFile.textContent = path;
        idx++;
        stScanned.textContent = String(idx);
        stTime.textContent = (elapsed() / 1000).toFixed(1) + ' 秒';
        barFill.style.width = Math.min(100, idx / files.length * 100).toFixed(1) + '%';
        if (triggers[idx - 1]) addVirus(path);
        scanTimer = T(step, randInt(30, 60));
      }

      scanState.finish = finish;
      scanTimer = T(step, 30);
    }

    bigBtn.addEventListener('click', startScan);
    pauseBtn.addEventListener('click', () => {
      if (!scanState.active) return;
      scanState.paused = !scanState.paused;
      pauseBtn.textContent = scanState.paused ? '继续' : '暂停';
      if (scanState.paused) {
        scanState.pauseAt = Date.now();
        curFile.textContent = '扫描已暂停';
      } else {
        scanState.pauseAcc += Date.now() - scanState.pauseAt;
      }
      XP.sound('click');
    });
    stopBtn.addEventListener('click', () => {
      if (!scanState.active || !scanState.finish) return;
      scanState.finish(true);
    });

    /* ============================================================
       监控中心
       ============================================================ */
    let patrolTimer = null;
    pages.mon.appendChild(XP.el('div', { class: 'app-rs-h', text: '监控中心' }));
    pages.mon.appendChild(XP.el('div', {
      style: { fontSize: '11px', color: '#777', marginBottom: '8px' },
      text: '实时监控系统各关键位置, 发现病毒立即拦截。建议全部开启。',
    }));
    MONS.forEach(m => {
      const led = XP.el('span', { class: 'app-rs-led on' });
      const btn = XP.el('button', { class: 'xp-btn', text: '关闭' });
      btn.addEventListener('click', () => {
        monState[m.key] = !monState[m.key];
        led.classList.toggle('on', monState[m.key]);
        btn.textContent = monState[m.key] ? '关闭' : '开启';
        XP.sound('click');
        updateMonStatus();
        if (m.key === 'file') schedulePatrol();
        if (MONS.every(x => !monState[x.key])) {
          lionTemp = null;
          clearT(lionTempTimer);
          lionTempTimer = null;
          lionSay('所有监控都关闭了, 卡卡有点困…');
        }
        applyLion();
      });
      pages.mon.appendChild(XP.el('div', { class: 'app-rs-monrow' }, [
        led,
        XP.el('div', { class: 'app-rs-moninfo' }, [
          XP.el('div', { class: 'nm', text: m.name }),
          XP.el('div', { class: 'ds', text: m.desc }),
        ]),
        btn,
      ]));
    });
    function updateMonStatus() {
      sbMon.textContent = '监控: ' + MONS.filter(m => monState[m.key]).length + '/4 项开启';
    }
    function schedulePatrol() {
      clearT(patrolTimer);
      patrolTimer = null;
      if (!monState.file) return;
      patrolTimer = T(() => {
        patrolTimer = null;
        XP.notify('瑞星小狮子', '小狮子为您巡逻中, 一切正常~');
        schedulePatrol();
      }, randInt(15000, 30000));
    }

    /* ============================================================
       在线升级
       ============================================================ */
    pages.up.appendChild(XP.el('div', { class: 'app-rs-h', text: '在线升级' }));
    const upInfo = XP.el('div', { class: 'app-rs-upinfo' });
    pages.up.appendChild(upInfo);
    function renderUpInfo() {
      upInfo.innerHTML = '';
      upInfo.appendChild(XP.el('div', { text: '当前版本: 瑞星杀毒软件 2005 版 (' + APP_VER + ')' }));
      upInfo.appendChild(XP.el('div', { text: '病毒库日期: ' + dbDate }));
      upInfo.appendChild(XP.el('div', { text: '升级方式: 智能升级 (通过瑞星升级服务器)' }));
    }
    const upBtn = XP.el('button', { class: 'app-rs-bigbtn', text: '立即升级' });
    pages.up.appendChild(XP.el('div', { class: 'app-rs-scanctl' }, [upBtn]));
    const upBar = XP.el('div', { style: { width: '0%' } });
    const upMsg = XP.el('div', { class: 'app-rs-upmsg' });
    const upBox = XP.el('div', { class: 'app-rs-upbox' }, [
      XP.el('div', { class: 'xp-progress' }, [upBar]), upMsg,
    ]);
    pages.up.appendChild(upBox);
    upBtn.addEventListener('click', () => {
      upBtn.disabled = true;
      upBox.style.display = 'block';
      upBar.style.width = '0%';
      const dur = randInt(3000, 6000);
      const t0 = Date.now();
      const msgs = [
        [0, '正在连接瑞星升级服务器…'],
        [0.25, '正在检查最新病毒库版本…'],
        [0.5, '正在下载升级文件…'],
        [0.8, '正在校验文件完整性…'],
      ];
      let mi = 0;
      upMsg.textContent = msgs[0][1];
      const iv = I(() => {
        const p = Math.min(1, (Date.now() - t0) / dur);
        upBar.style.width = (p * 100).toFixed(0) + '%';
        while (mi < msgs.length && p >= msgs[mi][0]) { upMsg.textContent = msgs[mi][1]; mi++; }
        if (p >= 1) {
          clearT(iv);
          upBtn.disabled = false;
          if (Math.random() < 0.7) {
            upMsg.textContent = '恭喜您, 已是最新版本, 无需升级。';
            lionSay('已经是最新版本啦, 卡卡很尽责哦!');
            XP.sound('ding');
          } else {
            dbDate = nextDay(dbDate);
            upMsg.textContent = '病毒库升级成功! 新增病毒定义 128 条。';
            sbDb.textContent = '病毒库日期: ' + dbDate;
            renderUpInfo();
            setLionTemp('happy', 3000);
            lionSay('病毒库升级成功! 新增病毒定义 128 条!');
            XP.sound('tada');
          }
        }
      }, 80);
    });

    /* ============================================================
       工具: 漏洞扫描 + 病毒隔离区
       ============================================================ */
    pages.tool.appendChild(XP.el('div', { class: 'app-rs-h', text: '工具' }));

    const vulnSec = XP.el('div', { class: 'app-rs-toolsec' });
    vulnSec.appendChild(XP.el('div', { class: 'tt', text: '系统漏洞扫描' }));
    const vulnBtn = XP.el('button', { class: 'xp-btn', text: '开始扫描' });
    const fixAllBtn = XP.el('button', { class: 'xp-btn', text: '一键修复' });
    fixAllBtn.disabled = true;
    vulnSec.appendChild(XP.el('div', { class: 'app-rs-scanctl', style: { margin: '4px 0' } }, [vulnBtn, fixAllBtn]));
    const vulnBar = XP.el('div', { style: { width: '0%' } });
    const vulnBarWrap = XP.el('div', { style: { display: 'none', marginBottom: '6px' } }, [
      XP.el('div', { class: 'xp-progress' }, [vulnBar]),
    ]);
    vulnSec.appendChild(vulnBarWrap);
    const vulnList = XP.el('div', { class: 'app-rs-results' });
    vulnList.appendChild(XP.el('div', { class: 'app-rs-resrow', style: { color: '#999', justifyContent: 'center' }, text: '尚未扫描。' }));
    vulnSec.appendChild(vulnList);
    pages.tool.appendChild(vulnSec);

    function fixVuln(row, st, fb) {
      fb.disabled = true;
      st.textContent = '正在修复…';
      T(() => {
        row.classList.add('cleared');
        st.textContent = '已修复 ✔';
        XP.sound('ding');
        if (!vulnList.querySelector('.app-rs-resrow:not(.cleared)')) {
          fixAllBtn.disabled = true;
          setLionTemp('happy', 2600);
          lionSay('所有漏洞已修复, 系统更安全了!');
        }
      }, randInt(700, 1400));
    }
    vulnBtn.addEventListener('click', () => {
      vulnBtn.disabled = true;
      fixAllBtn.disabled = true;
      vulnList.innerHTML = '';
      vulnBarWrap.style.display = 'block';
      vulnBar.style.width = '0%';
      const t0 = Date.now(), dur = randInt(1500, 2500);
      const iv = I(() => {
        const p = Math.min(1, (Date.now() - t0) / dur);
        vulnBar.style.width = (p * 100).toFixed(0) + '%';
        if (p >= 1) {
          clearT(iv);
          vulnBarWrap.style.display = 'none';
          vulnBtn.disabled = false;
          const pool = VULNS.slice();
          for (let i = pool.length - 1; i > 0; i--) {
            const j = randInt(0, i);
            const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
          }
          const found = pool.slice(0, randInt(2, 4));
          const fixBtns = [];
          found.forEach(v => {
            const st = XP.el('span', { class: 'vs', text: '未修复' });
            const fb = XP.el('button', { class: 'xp-btn', style: { padding: '0 8px', minHeight: '18px', fontSize: '11px' }, text: '修复' });
            const row = XP.el('div', { class: 'app-rs-resrow' }, [
              XP.el('span', { class: 'vn', style: { color: '#c0500a' }, text: v.name }),
              XP.el('span', { class: 'vp', text: v.desc }),
              XP.el('span', { class: 'vs', style: { color: '#c0500a', fontWeight: 'bold' }, text: v.lvl }),
              st, fb,
            ]);
            fb.addEventListener('click', () => fixVuln(row, st, fb));
            fixBtns.push(fb);
            vulnList.appendChild(row);
          });
          fixAllBtn.disabled = false;
          fixAllBtn.onclick = () => fixBtns.slice().forEach(b => { if (!b.disabled) b.click(); });
          lionSay('扫描完成, 发现 ' + found.length + ' 个系统漏洞, 建议立即修复!');
          XP.sound('error');
        }
      }, 80);
    });

    const quarSec = XP.el('div', { class: 'app-rs-toolsec' });
    quarSec.appendChild(XP.el('div', { class: 'tt', text: '病毒隔离区' }));
    const quarList = XP.el('div', { class: 'app-rs-results' });
    quarSec.appendChild(quarList);
    const quarClearBtn = XP.el('button', { class: 'xp-btn', text: '清空隔离区' });
    quarClearBtn.addEventListener('click', () => {
      quarantine.length = 0;
      renderQuar();
      lionSay('隔离区已清空。');
      XP.sound('click');
    });
    quarSec.appendChild(XP.el('div', { class: 'app-rs-scanctl', style: { margin: '6px 0 0' } }, [quarClearBtn]));
    pages.tool.appendChild(quarSec);

    function renderQuar() {
      quarList.innerHTML = '';
      if (!quarantine.length) {
        quarList.appendChild(XP.el('div', { class: 'app-rs-resrow', style: { color: '#999', justifyContent: 'center' }, text: '隔离区是空的。' }));
        return;
      }
      quarantine.forEach(q => {
        quarList.appendChild(XP.el('div', { class: 'app-rs-resrow' }, [
          XP.el('span', { class: 'vn', text: q.name }),
          XP.el('span', { class: 'vp', text: q.path, title: q.path }),
          XP.el('span', { class: 'vs', style: { color: '#777' }, text: '隔离于 ' + q.date }),
        ]));
      });
    }

    /* ---- 初始化 ---- */
    renderUpInfo();
    renderQuar();
    updateMonStatus();
    schedulePatrol();
    scheduleDoze();
    applyLion();
    lionSay('你好! 我是瑞星小狮子卡卡, 点击「开始查杀」给电脑做个体检吧!', 5000);

    return { win: win };
  }
})();
