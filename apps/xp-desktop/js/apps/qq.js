/* ============================================================
   QQ2005 贺岁版 — 怀旧聊天模拟 (纯前端)
   功能: 登录窗口 / 主面板(好友·QQ群·最近联系人) / 聊天窗
        (表情·抖动窗口·大模型回复, 失败回退离线语料) /
        托盘图标 / 随机好友来消息
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 应用样式 (注入 <head>, 类名统一 app-qq- 前缀) ---------------- */
  const CSS = `
/* ---- 登录窗口 ---- */
.app-qq-banner{height:72px;background:linear-gradient(180deg,#66b2f5,#0a62c8);display:flex;align-items:center;gap:10px;padding:0 16px;color:#fff}
.app-qq-banner .ico{font-size:36px}
.app-qq-banner .t{font-size:19px;font-weight:bold;text-shadow:1px 1px 1px rgba(0,0,0,.4)}
.app-qq-banner .t small{display:block;font-size:11px;font-weight:normal;opacity:.9;text-shadow:none}
.app-qq-lform{padding:14px 18px 4px}
.app-qq-lrow{display:flex;align-items:center;margin-bottom:9px}
.app-qq-lrow>label{width:60px;font-size:12px;flex:none}
.app-qq-lrow .xp-input{flex:1;width:0}
.app-qq-ck{display:flex;gap:14px;margin:0 0 10px 60px;font-size:12px}
.app-qq-ck label{display:flex;align-items:center;gap:3px}
.app-qq-err{color:#d00000;font-size:11px;height:15px;margin:0 0 6px 60px}
.app-qq-login-btn{display:block;width:calc(100% - 36px);margin:0 18px;height:34px;font-size:15px;font-weight:bold;letter-spacing:4px;color:#fff;border:1px solid #084a9e;border-radius:4px;cursor:pointer;background:linear-gradient(180deg,#4ea4f0,#1164c4);font-family:inherit}
.app-qq-login-btn:hover{filter:brightness(1.08)}
.app-qq-login-btn:disabled{filter:grayscale(.5);cursor:default}
.app-qq-llinks{display:flex;justify-content:space-between;padding:10px 18px 0;font-size:11px}
.app-qq-llinks span{color:#0645ad;cursor:pointer;text-decoration:underline}
.app-qq-logging{height:200px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#0645ad}
/* ---- 主面板 ---- */
.app-qq-head{flex:none;background:linear-gradient(180deg,#6fb6f2,#2a78d2);color:#fff;padding:8px 10px;display:flex;gap:9px;align-items:center}
.app-qq-head .av{width:42px;height:42px;flex:none;font-size:30px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.6);border-radius:4px;display:flex;align-items:center;justify-content:center}
.app-qq-nick{font-size:13px;font-weight:bold}
.app-qq-sign{font-size:11px;opacity:.92;margin-top:2px}
.app-qq-st{display:inline-flex;align-items:center;gap:4px;font-size:11px;margin-top:4px;cursor:pointer;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.45);border-radius:9px;padding:0 7px}
.app-qq-st:hover{background:rgba(255,255,255,.32)}
.app-qq-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none}
.app-qq-tabs{flex:none}
.app-qq-tab{flex:1;overflow-y:auto;background:#fff}
.app-qq-gh{padding:5px 8px 3px;font-size:11px;color:#555;background:#f3f1e8;border-bottom:1px solid #e4e0d2}
.app-qq-fi{display:flex;gap:8px;padding:5px 8px;align-items:center;cursor:pointer}
.app-qq-fi:hover{background:#cfe0fa}
.app-qq-f-av{position:relative;width:34px;height:34px;flex:none;font-size:25px;display:flex;align-items:center;justify-content:center}
.app-qq-f-info{flex:1;min-width:0}
.app-qq-f-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.app-qq-f-name.on{color:#0645ad}
.app-qq-f-name.off{color:#999}
.app-qq-f-sign{font-size:10px;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.app-qq-unread{position:absolute;top:-3px;right:-3px;width:9px;height:9px;background:#e00;border:1px solid #fff;border-radius:50%}
.app-qq-empty{padding:24px 12px;text-align:center;color:#999;font-size:12px}
.app-qq-foot{flex:none;display:flex;justify-content:space-between;padding:5px 8px;border-top:1px solid #d8d4c4;background:#ece9d8}
/* ---- 聊天窗 ---- */
.app-qq-hist{flex:1;overflow-y:auto;background:#fff;padding:4px 0}
.app-qq-row{display:flex;padding:5px 8px}
.app-qq-row.me{justify-content:flex-end}
.app-qq-col{max-width:74%;display:flex;flex-direction:column}
.app-qq-row.me .app-qq-col{align-items:flex-end}
.app-qq-meta{font-size:10px;color:#999;margin:0 2px 2px}
.app-qq-bub{padding:5px 8px;border-radius:6px;border:1px solid #d3d3d3;background:#fff;line-height:1.5;word-break:break-all;user-select:text;white-space:pre-wrap}
.app-qq-row.me .app-qq-bub{background:#9dea68;border-color:#7ecf4a}
.app-qq-sys{text-align:center;color:#999;font-size:11px;padding:4px 8px}
.app-qq-input{flex:none;height:62px;width:100%;resize:none;border-left:none;border-right:none;border-bottom:none}
.app-qq-send-row{flex:none;display:flex;justify-content:flex-end;gap:6px;padding:5px 8px;border-top:1px solid #d8d4c4;background:#ece9d8}
/* ---- 弹层 (表情面板/菜单) ---- */
.app-qq-popup{position:fixed;z-index:8000;background:#fff;border:1px solid #aca899;box-shadow:2px 2px 6px rgba(0,0,0,.35);padding:2px;font-size:12px}
.app-qq-pop-item{padding:4px 18px;cursor:default;white-space:nowrap}
.app-qq-pop-item:hover{background:#316ac5;color:#fff}
.app-qq-emoji{display:grid;grid-template-columns:repeat(6,26px);gap:1px;padding:3px}
.app-qq-emoji span{font-size:16px;text-align:center;cursor:pointer;border:1px solid transparent;padding:2px 0}
.app-qq-emoji span:hover{border-color:#316ac5;background:#c1d2ee}
/* ---- 查找窗口 ---- */
.app-qq-find{padding:12px}
.app-qq-find-row{display:flex;gap:6px;align-items:center}
.app-qq-find-row .xp-input{flex:1}
.app-qq-find-res{margin-top:12px;font-size:12px;line-height:1.8}
/* ---- "对方正在输入" 状态行动画 ---- */
.app-qq-typing{color:#777;font-style:italic}
.app-qq-typing::after{content:'';animation:app-qq-typing-dots 1.4s steps(1,end) infinite}
@keyframes app-qq-typing-dots{0%{content:''}25%{content:'·'}50%{content:'··'}75%{content:'···'}}
/* ---- 头像图片 (主面板/登录横幅/聊天窗共用) ---- */
.app-qq-head .av,.app-qq-nick{cursor:pointer}
.app-qq-head .av img,.app-qq-banner .ico img,.app-qq-cav img{width:100%;height:100%;object-fit:cover;display:block}
.app-qq-banner .ico img{width:48px;height:48px;border-radius:4px}
/* ---- 等级图标 (昵称旁) ---- */
.app-qq-lv{display:inline-block;margin-left:6px;font-size:11px;cursor:pointer;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.45);border-radius:9px;padding:0 6px;vertical-align:1px}
.app-qq-lv:hover{background:rgba(255,255,255,.32)}
/* ---- 聊天窗气泡旁头像 ---- */
.app-qq-cav{width:30px;height:30px;flex:none;font-size:22px;display:flex;align-items:center;justify-content:center;background:#f0f0f0;border:1px solid #d3d3d3;border-radius:3px;overflow:hidden;margin-top:2px}
.app-qq-row.me .app-qq-cav{margin-left:6px}
.app-qq-row.other .app-qq-cav{margin-right:6px}
/* ---- 底部按钮 (5 个挤一行) ---- */
.app-qq-foot{gap:4px}
.app-qq-foot .xp-btn{flex:1;min-width:0;padding:2px 0;font-size:11px}
/* ---- 个人设置窗口 ---- */
.app-qq-set{padding:10px 12px;font-size:12px}
.app-qq-set h4{margin:4px 0 6px;font-size:12px;color:#0645ad}
.app-qq-avgrid{display:grid;grid-template-columns:repeat(7,48px);gap:6px;max-height:156px;overflow-y:auto;margin-bottom:6px}
.app-qq-avcell{width:48px;height:48px;border:2px solid #aca899;cursor:pointer;background:#fff;overflow:hidden;padding:0}
.app-qq-avcell:hover{border-color:#316ac5}
.app-qq-avcell.sel{border-color:#e60012;box-shadow:0 0 0 1px #e60012}
.app-qq-avcell img{width:100%;height:100%;object-fit:cover;display:block}
.app-qq-setrow{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.app-qq-setrow>label{width:64px;flex:none;text-align:right}
.app-qq-setrow.c3>label{width:auto}
.app-qq-setrow .xp-input{flex:1;width:0;min-width:0}
.app-qq-setbtns{display:flex;justify-content:flex-end;gap:8px;margin-top:4px}
/* ---- 等级详情窗口 ---- */
.app-qq-level{padding:14px 16px;font-size:12px;line-height:2}
.app-qq-level .lvbar{height:14px;border:1px solid #7f9db9;background:#fff;margin:4px 0 8px}
.app-qq-level .lvbar .in{height:100%;background:linear-gradient(90deg,#f5a623,#e60012)}
.app-qq-lvrule{margin-top:8px;padding:6px 8px;background:#f3f1e8;border:1px solid #e4e0d2;line-height:1.7;color:#555}
`;
  const styleEl = document.createElement('style');
  styleEl.id = 'app-qq-style';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------------- 数据 ---------------- */
  const STATUSES = [
    { k: 'online', label: '我在线上', color: '#3bb54a' },
    { k: 'qme',    label: 'Q我吧',   color: '#2a78d2' },
    { k: 'away',   label: '离开',    color: '#f5a623' },
    { k: 'hidden', label: '隐身',    color: '#9a9a9a' },
  ];
  const FRIENDS = [
    { id: 'f1', name: '轻舞飞扬',   avatar: '💃', st: 'online',  sign: '卖女孩的小火柴' },
    { id: 'f2', name: '痞子蔡',     avatar: '👓', st: 'online',  sign: '如果我有一千万' },
    { id: 'f3', name: '火星文达人', avatar: '🔥', st: 'away',    sign: '涐の漃寞伱卟嬞' },
    { id: 'f4', name: '蓝色理想',   avatar: '🌟', st: 'online',  sign: '夜空的星' },
    { id: 'f5', name: '轻功水上漂', avatar: '🏄', st: 'offline', sign: '' },
    { id: 'f6', name: '随风而去',   avatar: '🍃', st: 'offline', sign: '' },
  ];
  const GROUPS = [
    { id: 'g1', name: '高中同学群',     avatar: '🏫', members: ['班长-大壮', '学习委员-眼镜妹', '篮球小王子', '捣蛋鬼-阿黄'] },
    { id: 'g2', name: '问道·天墉城帮派', avatar: '⚔️', members: ['帮主·剑无痕', '长老·风清扬', '小虾米', '药师·百草'] },
  ];
  const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎',
                  '😍','😘','😜','😝','🤔','😐','😴','😭','😡','👍','🌹','☕'];
  const REPLIES = ['呵呵', '在忙，回头聊', '你是GG还是MM?', '886', '去踩空间啦~', '今天超女总决赛!',
                   '你QQ秀哪买的?', '在打游戏，等下说', '嗯嗯，然后呢', '先下了，我妈喊我吃饭',
                   '帮我挂下QQ，我要升太阳', '今晚网吧通宵不?', '你的签名好伤感哦', '加我校友录没?', '在听歌，《童话》真好听'];
  const OPENERS = ['在吗?', '在忙不?', '晚上去网吧不?', '帮我踩下空间~', '作业写完没?借我抄抄',
                   '在听什么歌?', '超女你支持谁?', '你的QQ秀好酷!'];

  /* ---------------- 个人资料 (localStorage 持久化) ---------------- */
  const PROFILE_KEY = 'winxp_qq_profile';
  // 可选头像: assets/img/avatars/av-01.png ~ av-20.png (2005 经典系统头像像素复刻)
  const AV_LIST = Array.from({ length: 20 }, (_, i) =>
    'assets/img/avatars/av-' + String(i + 1).padStart(2, '0') + '.png');
  const GENDERS = ['男', '女', '保密'];
  const AGES = Array.from({ length: 45 }, (_, i) => String(i + 16));
  const STARS = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
                 '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
  const DEFAULT_PROFILE = {
    avatar: AV_LIST[0], nick: '轻舞飞扬', sign: '我可以躲进你的身体♪',
    gender: '女', age: '22', star: '天秤座',
    level: 42, days: 1520, toNext: 38,   // 等级 42 = 🌞🌞🌙🌙⭐⭐, 活跃天数/升级剩余
  };
  function loadProfile() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') || {}; } catch (e) {}
    const p = {};
    for (const k in DEFAULT_PROFILE) p[k] = saved[k] != null ? saved[k] : DEFAULT_PROFILE[k];
    return p;
  }
  const profile = loadProfile();
  function saveProfile() {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
  }

  /* ---------------- 大模型人设 (失败/超时回退 REPLIES 语料池) ---------------- */
  const PERSONA_BASE = '现在是2005年，你正在用QQ和网友聊天。请用2005年中文网络聊天的风格回复：' +
    '简短口语化，1~3句话，可以用"呵呵""886""=。=""~^_^"等当时的网络用语和颜文字。' +
    '禁止使用markdown、列表，禁止长篇大论，不要加引号或解释，直接输出聊天内容。';
  const PERSONAS = {
    f1: PERSONA_BASE + ' 你是"轻舞飞扬"，2005年的女生网友，温柔但有点皮，喜欢聊小说《第一次的亲密接触》和超级女声。',
    f2: PERSONA_BASE + ' 你是"痞子蔡"，2005年的大学生网友，幽默带点小坏，爱用"如果我有一千万…"式的句式开玩笑。',
    f3: PERSONA_BASE + ' 你是"火星文达人"，只用火星文回复（涐、の、卟、④、╰☆ 等符号混搭），内容简短。',
    f4: PERSONA_BASE + ' 你是"蓝色理想"，文艺青年，说话带诗意，爱引用流行歌词（如《童话》《江南》）。',
  };
  const GROUP_PERSONAS = {
    '班长-大壮':     PERSONA_BASE + ' 你是高中同学群里的班长"大壮"，说话像发通知，正经又有点啰嗦，爱张罗同学聚会。',
    '学习委员-眼镜妹': PERSONA_BASE + ' 你是高中同学群里的学习委员"眼镜妹"，学霸，三句不离作业和考试。',
    '篮球小王子':    PERSONA_BASE + ' 你是高中同学群里的"篮球小王子"，网瘾少年，只聊游戏和篮球。',
    '捣蛋鬼-阿黄':    PERSONA_BASE + ' 你是高中同学群里的捣蛋鬼"阿黄"，话多爱起哄，喜欢开玩笑。',
    '帮主·剑无痕':   PERSONA_BASE + ' 你是网游《问道》"天墉城"帮派的帮主"剑无痕"，说话霸气，爱组织帮战和刷怪活动。',
    '长老·风清扬':   PERSONA_BASE + ' 你是网游《问道》"天墉城"帮派的长老"风清扬"，老玩家，稳重，爱讲游戏攻略。',
    '小虾米':       PERSONA_BASE + ' 你是网游《问道》"天墉城"帮派的新人"小虾米"，游戏小白，问题很多但很热情。',
    '药师·百草':     PERSONA_BASE + ' 你是网游《问道》"天墉城"帮派的药师"百草"，高冷，话很少，偶尔冒一句。',
  };
  function groupPersona(g, m) {
    return (GROUP_PERSONAS[m] || PERSONA_BASE) + ' 你正在QQ群「' + g.name + '」里和群友聊天，自然接话。';
  }

  /* ---------------- 全局状态 ---------------- */
  let loggedIn = false, loginWin = null, mainWin = null;
  let trayRemove = null, eventTimer = null;
  let mainEls = null;           // 主面板信息区 DOM {av, nick, sign, lv}, 关窗后置空
  const chatWins = {};          // id -> win (好友/群聊天窗, 单例)
  const unread = {};            // id -> [{name, text}]
  const dots = {};              // id -> 未读红点 DOM
  const avWraps = {};           // id -> 主面板头像容器 DOM
  let recents = [];             // 最近联系人 id 列表
  const self = { status: 'online' };

  /* ---------------- 小工具 ---------------- */
  const el = XP.el;
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  /* 经典 QQ 提示音: 消息=咳嗽声, 上线=敲门声 (真实音效, 失败回退合成音) */
  const SFX = { msg: 'assets/audio/qq-msg.mp3', online: 'assets/audio/qq-online.mp3' };
  function sfx(kind) {
    try {
      const a = new Audio(SFX[kind] || SFX.msg);
      a.volume = 0.9;
      a.play().catch(() => XP.sound('notify'));
    } catch (e) { XP.sound('notify'); }
  }
  /* 托盘图标闪烁 (经典来消息视觉提示) */
  let trayBlinkTimer = null;
  function trayBlink() {
    const trayEl = trayRemove && trayRemove.el;
    if (!trayEl) return;
    trayEl.classList.add('blink');
    clearTimeout(trayBlinkTimer);
    trayBlinkTimer = setTimeout(stopTrayBlink, 8000);
  }
  function stopTrayBlink() {
    clearTimeout(trayBlinkTimer);
    const trayEl = trayRemove && trayRemove.el;
    if (trayEl) trayEl.classList.remove('blink');
  }
  function now() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function stInfo(k) { return STATUSES.find(s => s.k === k) || STATUSES[0]; }
  function isOnline(f) { return f.st !== 'offline'; }
  function findTarget(id) {
    return FRIENDS.find(f => f.id === id) || GROUPS.find(g => g.id === id) || null;
  }
  function touchRecent(id) {
    recents = [id].concat(recents.filter(x => x !== id)).slice(0, 10);
  }

  /* ---------------- 头像/等级/个人资料工具 ---------------- */
  // 把当前头像画进容器: 有图片用 <img>, 加载失败或无设置回退 🐧
  function paintAvatar(node, px) {
    node.innerHTML = '';
    if (profile.avatar) {
      const img = el('img', { src: profile.avatar, alt: '头像' });
      if (px) { img.style.width = px + 'px'; img.style.height = px + 'px'; }
      img.addEventListener('error', () => { node.innerHTML = ''; node.textContent = '🐧'; });
      node.appendChild(img);
    } else {
      node.textContent = '🐧';
    }
  }
  // 等级 -> 太阳/月亮/星星 (16/4/1 级一个)
  function levelIcons() {
    const n = profile.level | 0;
    return '🌞'.repeat((n / 16) | 0) + '🌙'.repeat(((n % 16) / 4) | 0) + '⭐'.repeat(n % 4);
  }
  // 外部应用 (qmail/qpet 由其他文件注册, 未注册则提示)
  function openExtApp(id) {
    if (XP.apps && XP.apps[id]) XP.openApp(id);
    else XP.notify('提示', '功能加载中, 请稍后再试~');
  }
  // 个人设置保存后即时生效: 主面板 + 任务栏标题 + 各聊天窗我方头像
  function applyProfileLive() {
    if (mainWin && !mainWin.closed) {
      if (mainEls) {
        paintAvatar(mainEls.av);
        mainEls.nick.textContent = profile.nick;
        mainEls.sign.textContent = profile.sign;
      }
      mainWin.setTitle('QQ2005 - ' + profile.nick);
    }
    document.querySelectorAll('.app-qq-meav').forEach(n => paintAvatar(n));
  }

  /* ---------------- 大模型请求 (8 秒超时, 任何失败返回 null, 调用方回退语料) ---------------- */
  const API_URL = '/api/chat';
  const FETCH_TIMEOUT = 8000;
  function fetchReply(persona, messages, aborters) {
    return new Promise(resolve => {
      // [sitepub 公网版] 公网部署不接大模型, 直接使用离线语料池回复(老方法)
      resolve(null); return;
      // file:// 或老浏览器无 fetch/AbortController 时直接回退(避免 file:// CORS 报错)
      if (typeof fetch !== 'function' || typeof AbortController !== 'function' ||
          !/^https?:$/.test(location.protocol)) { resolve(null); return; }
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
      let settled = false;
      function done(v) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (aborters) aborters.delete(ctrl);
        resolve(v);
      }
      if (aborters) aborters.add(ctrl);   // 窗口关闭时统一 abort
      try {
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ persona: persona, messages: messages }),
          signal: ctrl.signal,
        }).then(res => {
          if (!res || !res.ok) throw new Error('http ' + (res && res.status));
          return res.json();
        }).then(data => {
          const r = data && typeof data.reply === 'string' ? data.reply.trim() : '';
          done(r || null);
        }).catch(() => done(null));
      } catch (e) { done(null); }
    });
  }

  /* ---------------- 弹层 (菜单/表情面板, 点外部自动关闭) ---------------- */
  let popups = [];
  function closePopups() {
    popups.forEach(p => { p.node.remove(); document.removeEventListener('pointerdown', p.h, true); });
    popups = [];
  }
  function popup(anchor, content, owner) {
    closePopups();
    const p = el('div', { class: 'app-qq-popup' }, [content]);
    document.body.appendChild(p);
    const r = anchor.getBoundingClientRect();
    let left = Math.min(r.left, window.innerWidth - p.offsetWidth - 4);
    let top = r.bottom + 3;
    if (top + p.offsetHeight > window.innerHeight - 34) top = r.top - p.offsetHeight - 3;
    p.style.left = Math.max(2, left) + 'px';
    p.style.top = Math.max(2, top) + 'px';
    const rec = { node: p, h: null };
    rec.h = e => { if (!p.contains(e.target)) closePopups(); };
    setTimeout(() => document.addEventListener('pointerdown', rec.h, true), 0);
    popups.push(rec);
    if (owner) owner.on('close', () => {
      popups = popups.filter(x => x !== rec);
      p.remove();
      document.removeEventListener('pointerdown', rec.h, true);
    });
    return p;
  }

  /* ---------------- 登录窗口 ---------------- */
  function openLogin() {
    const w = XP.createWindow({ title: 'QQ2005 用户登录', icon: '🐧', width: 320, height: 400, resizable: false });
    loginWin = w;
    let loginTimer = null;
    w.on('close', () => {
      if (loginTimer) { clearTimeout(loginTimer); loginTimer = null; }
      if (loginWin === w) loginWin = null;
    });

    const errEl = el('div', { class: 'app-qq-err' });
    const numInput = el('input', { class: 'xp-input', value: '10001', maxlength: '10' });
    const pwdInput = el('input', { class: 'xp-input', type: 'password', value: '888888' });
    const stSel = el('select', { class: 'xp-input' },
      STATUSES.map(s => el('option', { value: s.k, text: s.label })));
    const ckRem = el('input', { type: 'checkbox', checked: '' });
    const ckAuto = el('input', { type: 'checkbox' });

    const form = el('div', { class: 'app-qq-lform' }, [
      el('div', { class: 'app-qq-lrow' }, [el('label', { text: 'QQ号码:' }), numInput]),
      el('div', { class: 'app-qq-lrow' }, [el('label', { text: 'QQ密码:' }), pwdInput]),
      el('div', { class: 'app-qq-lrow' }, [el('label', { text: '登录状态:' }), stSel]),
      el('div', { class: 'app-qq-ck' }, [
        el('label', {}, [ckRem, '记住密码']),
        el('label', {}, [ckAuto, '自动登录']),
      ]),
    ]);

    const btn = el('button', { class: 'app-qq-login-btn', text: '登 录' });
    btn.addEventListener('click', doLogin);
    numInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    pwdInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

    const links = el('div', { class: 'app-qq-llinks' }, [
      el('span', { text: '忘了密码?', onClick: () => XP.notify('找回密码', '请回答密码保护问题…\n(离线模拟, 请直接输入 888888)') }),
      el('span', { text: '申请号码', onClick: () => XP.notify('申请号码', '免费申请通道维护中…\n(离线模拟, 直接用 10001 登录吧)') }),
    ]);

    const bannerIco = el('span', { class: 'ico' });
    paintAvatar(bannerIco);   // 横幅显示当前头像 (个人设置保存后, 下次打开登录窗即生效)
    w.body.appendChild(el('div', { class: 'app-qq-banner' }, [
      bannerIco,
      el('div', { class: 't' }, ['QQ2005 贺岁版', el('small', { text: 'Tencent 腾讯公司' })]),
    ]));
    w.body.appendChild(form);
    w.body.appendChild(errEl);
    w.body.appendChild(btn);
    w.body.appendChild(links);
    setTimeout(() => numInput.focus(), 50);

    function doLogin() {
      if (!numInput.value.trim()) {
        XP.sound('error');
        errEl.textContent = '请输入QQ号码!';
        numInput.focus();
        return;
      }
      errEl.textContent = '';
      btn.disabled = true;
      form.style.display = 'none';
      links.style.display = 'none';
      w.body.appendChild(el('div', { class: 'app-qq-logging', text: '正在登录…' }));
      self.status = stSel.value;
      loginTimer = setTimeout(() => {
        loginTimer = null;
        loggedIn = true;
        w.close();
        openMain();
        trayRemove = XP.trayAdd('<img src="assets/img/icons/qq2005.png" style="width:15px;height:15px;vertical-align:-2px" alt="QQ">', 'QQ2005', () => { if (mainWin) mainWin.restore(); stopTrayBlink(); });
        XP.notify('QQ2005', profile.nick + ' 登录成功');
        sfx('online');
      }, 1000);
    }
  }

  /* ---------------- 主面板 ---------------- */
  function openMain() {
    const w = XP.createWindow({ title: 'QQ2005 - ' + profile.nick, icon: '🐧', width: 280, height: 500 });
    mainWin = w;
    w.body.style.display = 'flex';
    w.body.style.flexDirection = 'column';
    w.body.style.overflow = 'hidden';

    /* ---- 在线状态 ---- */
    const stDot = el('span', { class: 'app-qq-dot' });
    const stText = el('span', {});
    function paintStatus() {
      const s = stInfo(self.status);
      stDot.style.background = s.color;
      stText.textContent = s.label;
    }
    paintStatus();
    const stEl = el('span', { class: 'app-qq-st', title: '点击更改状态' }, [stDot, stText]);
    stEl.addEventListener('click', () => showStatusMenu(stEl));

    /* ---- 个人信息区 (点头像/昵称打开个人设置, 点等级图标看等级详情) ---- */
    const avBox = el('div', { class: 'av', title: '点击修改个人设置' });
    paintAvatar(avBox);
    avBox.addEventListener('click', openSettings);
    const nickEl = el('span', { class: 'app-qq-nick', text: profile.nick, title: '点击修改个人设置' });
    nickEl.addEventListener('click', openSettings);
    const signEl = el('div', { class: 'app-qq-sign', text: profile.sign });
    const lvEl = el('span', { class: 'app-qq-lv', title: '点击查看等级详情', text: levelIcons() });
    lvEl.addEventListener('click', openLevel);
    mainEls = { av: avBox, nick: nickEl, sign: signEl, lv: lvEl };

    w.body.appendChild(el('div', { class: 'app-qq-head' }, [
      avBox,
      el('div', {}, [
        el('div', {}, [nickEl, lvEl]),
        signEl,
        stEl,
      ]),
    ]));

    /* ---- Tab 栏 ---- */
    const TAB_NAMES = ['好友', 'QQ群', '最近联系人'];
    let curTab = 0;
    const tabEls = TAB_NAMES.map((t, i) => el('div', { class: 'xp-tab' + (i === 0 ? ' sel' : ''), text: t }));
    w.body.appendChild(el('div', { class: 'xp-tabbar app-qq-tabs' }, tabEls));
    const content = el('div', { class: 'app-qq-tab' });
    w.body.appendChild(content);
    tabEls.forEach((te, i) => te.addEventListener('click', () => {
      curTab = i;
      tabEls.forEach((x, j) => x.classList.toggle('sel', i === j));
      renderTab();
    }));

    function renderTab() {
      content.innerHTML = '';
      if (curTab === 0) renderFriends();
      else if (curTab === 1) renderGroups();
      else renderRecents();
    }

    function friendItem(f) {
      const wrap = el('div', { class: 'app-qq-f-av', text: f.avatar });
      if (unread[f.id] && unread[f.id].length) attachDot(f.id, wrap);
      const item = el('div', { class: 'app-qq-fi' }, [
        wrap,
        el('div', { class: 'app-qq-f-info' }, [
          el('div', {
            class: 'app-qq-f-name ' + (isOnline(f) ? 'on' : 'off'),
            text: f.name + (f.st === 'away' ? ' (离开)' : ''),
          }),
          f.sign ? el('div', { class: 'app-qq-f-sign', text: f.sign }) : null,
        ]),
      ]);
      item._wrap = wrap;
      item.addEventListener('dblclick', () => openChat(f, 'friend'));
      return item;
    }

    function renderFriends() {
      content.appendChild(el('div', { class: 'app-qq-gh', text: '我的好友 (3/6)' }));
      FRIENDS.forEach(f => {
        const item = friendItem(f);
        avWraps[f.id] = item._wrap;
        content.appendChild(item);
      });
    }

    function renderGroups() {
      content.appendChild(el('div', { class: 'app-qq-gh', text: '我的群 (' + GROUPS.length + ')' }));
      GROUPS.forEach(g => {
        const item = el('div', { class: 'app-qq-fi' }, [
          el('div', { class: 'app-qq-f-av', text: g.avatar }),
          el('div', { class: 'app-qq-f-info' }, [
            el('div', { class: 'app-qq-f-name on', text: g.name }),
            el('div', { class: 'app-qq-f-sign', text: '群成员 ' + g.members.length + ' 人' }),
          ]),
        ]);
        item.addEventListener('dblclick', () => openChat(g, 'group'));
        content.appendChild(item);
      });
    }

    function renderRecents() {
      if (!recents.length) {
        content.appendChild(el('div', { class: 'app-qq-empty', text: '暂无最近联系人，快去和好友打个招呼吧~' }));
        return;
      }
      recents.forEach(id => {
        const t = findTarget(id);
        if (!t) return;
        const isGroup = !!t.members;
        const item = el('div', { class: 'app-qq-fi' }, [
          el('div', { class: 'app-qq-f-av', text: t.avatar }),
          el('div', { class: 'app-qq-f-info' }, [
            el('div', { class: 'app-qq-f-name on', text: t.name }),
            el('div', { class: 'app-qq-f-sign', text: isGroup ? '群聊' : (t.sign || '') }),
          ]),
        ]);
        item.addEventListener('dblclick', () => openChat(t, isGroup ? 'group' : 'friend'));
        content.appendChild(item);
      });
    }

    /* ---- 底部按钮 ---- */
    const btnFind = el('button', { class: 'xp-btn', text: '🔍 查找' });
    btnFind.addEventListener('click', openFind);
    const btnQzone = el('button', { class: 'xp-btn', text: '🌟 空间', title: '进入我的QQ空间' });
    btnQzone.addEventListener('click', () => XP.openApp('qzone'));
    const btnMail = el('button', { class: 'xp-btn', text: '📧 邮箱', title: 'QQ邮箱' });
    btnMail.addEventListener('click', () => openExtApp('qmail'));
    const btnPet = el('button', { class: 'xp-btn', text: '🐾 宠物', title: 'QQ宠物' });
    btnPet.addEventListener('click', () => openExtApp('qpet'));
    const btnMenu = el('button', { class: 'xp-btn', text: '≡ 菜单' });
    btnMenu.addEventListener('click', () => {
      const box = el('div', {}, [
        el('div', { class: 'app-qq-pop-item', text: '个人设置', onClick: () => { closePopups(); openSettings(); } }),
        el('div', { class: 'app-qq-pop-item', text: '更改状态', onClick: () => { closePopups(); showStatusMenu(btnMenu); } }),
        el('div', { class: 'app-qq-pop-item', text: '退出QQ', onClick: () => { closePopups(); w.close(); } }),
      ]);
      popup(btnMenu, box, w);
    });
    w.body.appendChild(el('div', { class: 'app-qq-foot' }, [btnFind, btnQzone, btnMail, btnPet, btnMenu]));

    function showStatusMenu(anchor) {
      const box = el('div', {}, STATUSES.map(s =>
        el('div', {
          class: 'app-qq-pop-item', text: s.label,
          onClick: () => { self.status = s.k; paintStatus(); closePopups(); },
        })));
      popup(anchor, box, w);
    }

    renderTab();
    scheduleEvent();

    /* ---- 退出: 清理定时器/聊天窗/托盘 ---- */
    w.on('close', () => {
      if (eventTimer) { clearTimeout(eventTimer); eventTimer = null; }
      Object.values(chatWins).forEach(cw => { if (!cw.closed) cw.close(); });
      if (trayRemove) { trayRemove(); trayRemove = null; }
      Object.keys(unread).forEach(k => delete unread[k]);
      Object.keys(dots).forEach(k => delete dots[k]);
      loggedIn = false;
      mainEls = null;
      if (mainWin === w) mainWin = null;
    });
  }

  /* ---------------- 未读红点 ---------------- */
  function attachDot(id, wrap) {
    if (dots[id]) dots[id].remove();
    const d = el('span', { class: 'app-qq-unread' });
    wrap.appendChild(d);
    dots[id] = d;
  }
  function showDot(id) {
    if (dots[id]) return;
    if (avWraps[id]) attachDot(id, avWraps[id]);
  }
  function clearDot(id) {
    if (dots[id]) { dots[id].remove(); delete dots[id]; }
  }

  /* ---------------- 查找窗口 (假) ---------------- */
  function openFind() {
    const w = XP.createWindow({ title: '查找/添加好友', icon: '🔍', width: 360, height: 230, resizable: false });
    const input = el('input', { class: 'xp-input', placeholder: '请输入对方QQ号码' });
    const res = el('div', { class: 'app-qq-find-res' });
    const btn = el('button', { class: 'xp-btn', text: '查 找' });
    btn.addEventListener('click', () => {
      const v = input.value.trim();
      res.innerHTML = '';
      if (!v) {
        XP.sound('error');
        res.appendChild(el('div', { style: { color: '#d00000' }, text: '请输入要查找的QQ号码!' }));
        return;
      }
      const addBtn = el('button', { class: 'xp-btn', text: '加为好友', style: { marginLeft: '8px' } });
      addBtn.addEventListener('click', () => XP.notify('添加好友', '请求已发送，等待对方验证…'));
      res.appendChild(el('div', {}, [
        el('span', { text: '🐧 缘分的天空 (' + v + ')  —  查找到 1 个用户' }),
        addBtn,
      ]));
    });
    w.body.appendChild(el('div', { class: 'app-qq-find' }, [
      el('div', { class: 'app-qq-find-row' }, [input, btn]),
      res,
    ]));
    setTimeout(() => input.focus(), 50);
  }

  /* ---------------- 个人设置窗口 (换头像/昵称/签名/性别/年龄/星座) ---------------- */
  let settingsWin = null;
  function openSettings() {
    if (settingsWin && !settingsWin.closed) { settingsWin.focus(); return; }
    const w = XP.createWindow({ title: '个人设置', icon: '👤', width: 420, height: 460, resizable: false });
    settingsWin = w;
    w.on('close', () => { if (settingsWin === w) settingsWin = null; });

    /* ---- 头像网格: 单击选中 ---- */
    let selAvatar = profile.avatar;
    const cells = [];
    function paintSel() {
      cells.forEach(c => c.classList.toggle('sel', c.dataset.av === selAvatar));
    }
    const grid = el('div', { class: 'app-qq-avgrid' }, AV_LIST.map(av => {
      const cell = el('div', { class: 'app-qq-avcell' + (av === selAvatar ? ' sel' : '') });
      cell.dataset.av = av;
      cell.appendChild(el('img', { src: av, alt: '' }));
      cell.addEventListener('click', () => { selAvatar = av; paintSel(); XP.sound('click'); });
      cells.push(cell);
      return cell;
    }));

    /* ---- 资料表单 ---- */
    function mkSelect(opts, val) {
      return el('select', { class: 'xp-input' }, opts.map(o => {
        const op = el('option', { value: o, text: o });
        if (o === val) op.selected = true;
        return op;
      }));
    }
    const nickInput = el('input', { class: 'xp-input', value: profile.nick, maxlength: '12' });
    const signInput = el('input', { class: 'xp-input', value: profile.sign, maxlength: '40' });
    const gSel = mkSelect(GENDERS, profile.gender);
    const aSel = mkSelect(AGES, profile.age);
    const sSel = mkSelect(STARS, profile.star);

    const btnOk = el('button', { class: 'xp-btn', text: '确定' });
    const btnCancel = el('button', { class: 'xp-btn', text: '取消' });
    btnCancel.addEventListener('click', () => w.close());
    btnOk.addEventListener('click', () => {
      profile.avatar = selAvatar;
      profile.nick = nickInput.value.trim() || DEFAULT_PROFILE.nick;
      profile.sign = signInput.value;
      profile.gender = gSel.value;
      profile.age = aSel.value;
      profile.star = sSel.value;
      saveProfile();
      applyProfileLive();
      XP.sound('ding');
      w.close();
    });

    w.body.appendChild(el('div', { class: 'app-qq-set' }, [
      el('h4', { text: '选择头像' }),
      grid,
      el('h4', { text: '基本资料' }),
      el('div', { class: 'app-qq-setrow' }, [el('label', { text: '昵称:' }), nickInput]),
      el('div', { class: 'app-qq-setrow' }, [el('label', { text: '个性签名:' }), signInput]),
      el('div', { class: 'app-qq-setrow c3' }, [
        el('label', { text: '性别:' }), gSel,
        el('label', { text: '年龄:' }), aSel,
        el('label', { text: '星座:' }), sSel,
      ]),
      el('div', { class: 'app-qq-setbtns' }, [btnOk, btnCancel]),
    ]));
  }

  /* ---------------- 等级详情窗口 ---------------- */
  let levelWin = null;
  function openLevel() {
    if (levelWin && !levelWin.closed) { levelWin.focus(); return; }
    const w = XP.createWindow({ title: '等级详情', icon: '🌞', width: 300, height: 270, resizable: false });
    levelWin = w;
    w.on('close', () => { if (levelWin === w) levelWin = null; });
    const pct = Math.max(2, Math.min(100,
      Math.round(profile.days / (profile.days + profile.toNext) * 100)));
    w.body.appendChild(el('div', { class: 'app-qq-level' }, [
      el('div', { html: '等级: <b>' + profile.level + '</b>  ' + levelIcons() }),
      el('div', { text: '活跃天数: ' + profile.days + ' 天' }),
      el('div', { text: '距离升级还需: ' + profile.toNext + ' 天' }),
      el('div', { class: 'lvbar' }, [el('div', { class: 'in', style: { width: pct + '%' } })]),
      el('div', { class: 'app-qq-lvrule', html:
        '等级规则:<br>🌞 1个太阳 = 16级<br>🌙 1个月亮 = 4级<br>⭐ 1颗星星 = 1级' +
        '<br>当天使用QQ满2小时记为1个活跃天数，天数达标即可升级。' }),
    ]));
  }

  /* ---------------- 聊天窗口 ---------------- */
  function openChat(target, kind) {
    const id = target.id;
    const exist = chatWins[id];
    if (exist && !exist.closed) { exist.focus(); return; }
    touchRecent(id);

    const w = XP.createWindow({
      title: kind === 'group' ? (target.name + ' - 群聊') : ('与 ' + target.name + ' 聊天中…'),
      icon: target.avatar || '🐧',
      width: 430, height: 380,
    });
    chatWins[id] = w;
    const timers = [];
    const aborters = new Set();   // 进行中的 fetch AbortController, 关窗时统一取消
    const history = [];           // 对话历史 {role, content}, 喂给模型(最近10条)
    function later(fn, ms) {
      const t = setTimeout(() => {
        const i = timers.indexOf(t);
        if (i >= 0) timers.splice(i, 1);
        fn();
      }, ms);
      timers.push(t);
    }

    w.body.style.display = 'flex';
    w.body.style.flexDirection = 'column';
    w.body.style.overflow = 'hidden';

    /* ---- 工具栏 ---- */
    const btnEmoji = el('span', { class: 'xp-tool-btn', html: '😀 表情' });
    const btnShake = el('span', { class: 'xp-tool-btn', html: '🪟 抖动窗口' });
    const btnFont  = el('span', { class: 'xp-tool-btn', html: '🔤 字体' });
    w.body.appendChild(el('div', { class: 'xp-toolbar', style: { flex: 'none' } }, [btnEmoji, btnShake, btnFont]));

    const hist = el('div', { class: 'app-qq-hist' });
    const input = el('textarea', { class: 'xp-textarea app-qq-input', placeholder: '请输入消息，回车发送…' });

    /* ---- 按钮行 ---- */
    const btnClose = el('button', { class: 'xp-btn', text: '关闭' });
    btnClose.addEventListener('click', () => w.close());
    const btnSend = el('button', { class: 'xp-btn', text: '发送(S)' });
    btnSend.addEventListener('click', send);

    w.body.appendChild(hist);
    w.body.appendChild(input);
    w.body.appendChild(el('div', { class: 'app-qq-send-row' }, [btnClose, btnSend]));

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    /* ---- 消息渲染 (气泡旁带头像: 我方=当前头像, 对方=好友/群 emoji) ---- */
    function scrollBottom() { hist.scrollTop = hist.scrollHeight; }
    function meAvatarNode() {
      const n = el('div', { class: 'app-qq-cav app-qq-meav' });
      paintAvatar(n);
      return n;
    }
    function otherAvatarNode() {
      return el('div', { class: 'app-qq-cav', text: target.avatar || '🐧' });
    }
    function addMsg(cls, name, text) {
      const col = el('div', { class: 'app-qq-col' }, [
        el('div', { class: 'app-qq-meta', text: name + '  ' + now() }),
        el('div', { class: 'app-qq-bub', text: text }),
      ]);
      const row = el('div', { class: 'app-qq-row ' + cls },
        cls === 'me' ? [col, meAvatarNode()] : [otherAvatarNode(), col]);
      row._col = col;
      hist.appendChild(row);
      scrollBottom();
    }
    const addMe = t => addMsg('me', profile.nick, t);
    const addOther = (n, t) => addMsg('other', n, t);
    function addSys(t) {
      hist.appendChild(el('div', { class: 'app-qq-sys', text: t }));
      scrollBottom();
    }
    // "对方正在输入…" 状态行: 每条用户消息一行, 回复到达后原地替换(乱序也不错位)
    function addTyping(name) {
      const col = el('div', { class: 'app-qq-col' }, [
        el('div', { class: 'app-qq-meta', text: name + '  ' + now() }),
        el('div', { class: 'app-qq-bub app-qq-typing', text: '对方正在输入' }),
      ]);
      const row = el('div', { class: 'app-qq-row other' }, [otherAvatarNode(), col]);
      row._col = col;
      hist.appendChild(row);
      scrollBottom();
      return row;
    }
    function replaceRow(row, name, text) {
      const col = el('div', { class: 'app-qq-col' }, [
        el('div', { class: 'app-qq-meta', text: name + '  ' + now() }),
        el('div', { class: 'app-qq-bub', text: text }),
      ]);
      row.replaceChild(col, row._col);   // 只换气泡列, 保留头像
      row._col = col;
      scrollBottom();
    }
    // 单个对象回复: 挂状态行 → 请求模型 → 替换为气泡; 失败/超时回退语料池
    function replyAs(name) {
      if (w.closed) return;
      const row = addTyping(name);
      const msgs = history.slice(-10);
      const persona = kind === 'group' ? groupPersona(target, name) : (PERSONAS[target.id] || PERSONA_BASE);
      fetchReply(persona, msgs, aborters).then(reply => {
        if (w.closed) return;
        const finalText = reply || pick(REPLIES);
        replaceRow(row, name, finalText);
        history.push({ role: 'assistant', content: kind === 'group' ? (name + ': ' + finalText) : finalText });
        sfx('msg');
        trayBlink();
        if (w.flash) w.flash();
      });
    }
    // 供随机事件从外部投递消息
    w._addIncoming = (n, t) => addOther(n, t);

    /* ---- 表情面板 (4x6) ---- */
    btnEmoji.addEventListener('click', () => {
      const grid = el('div', { class: 'app-qq-emoji' }, EMOJIS.map(em =>
        el('span', { text: em, onClick: () => { insertEmoji(em); closePopups(); } })));
      popup(btnEmoji, grid, w);
    });
    function insertEmoji(em) {
      const s = input.selectionStart != null ? input.selectionStart : input.value.length;
      const e = input.selectionEnd != null ? input.selectionEnd : s;
      input.value = input.value.slice(0, s) + em + input.value.slice(e);
      input.focus();
      input.selectionStart = input.selectionEnd = s + em.length;
    }

    /* ---- 抖动窗口 ---- */
    btnShake.addEventListener('click', () => {
      w.shake();
      addSys('* 你给 ' + target.name + ' 发送了一个抖动窗口 *');
      if (kind === 'friend' && !isOnline(target)) {
        addSys('对方不在线，将在对方上线后收到消息');
        return;
      }
      later(() => {
        if (w.closed) return;
        const who = kind === 'group' ? pick(target.members) : target.name;
        addOther(who, '别抖了! 在呢在呢');
        sfx('msg');
        trayBlink();
        if (w.flash) w.flash();
        // 可选: 模型再跟一条, 失败静默忽略
        const persona = kind === 'group' ? groupPersona(target, who) : PERSONAS[target.id];
        if (persona) {
          const msgs = history.slice(-9).concat([{ role: 'user', content: '（抖了抖你的窗口）' }]);
          fetchReply(persona, msgs, aborters).then(reply => {
            if (w.closed || !reply) return;
            addOther(who, reply);
            sfx('msg');
            trayBlink();
            if (w.flash) w.flash();
          });
        }
      }, 800 + Math.random() * 1000);
    });

    /* ---- 字体 (假按钮, 仅点击反馈) ---- */
    btnFont.addEventListener('click', () => XP.sound('click'));

    /* ---- 发送消息 ---- */
    function send() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addMe(text);
      history.push({ role: 'user', content: text });
      if (kind === 'group') {
        // 随机 1~3 个群成员回复, 每条间隔 0.5~1.5 秒出现
        const shuffled = target.members.slice().sort(() => Math.random() - 0.5);
        const n = 1 + ((Math.random() * 3) | 0);
        let delay = 0;
        shuffled.slice(0, n).forEach(m => {
          delay += 500 + Math.random() * 1000;
          later(() => replyAs(m), delay);
        });
      } else if (!isOnline(target)) {
        addSys('对方不在线，将在对方上线后收到消息');
      } else {
        replyAs(target.name);
      }
    }

    /* ---- 初始内容 + 未读消息投递 ---- */
    addSys(kind === 'group' ? '你加入了群聊，开始聊天吧~' : '你们现在可以开始聊天了。');
    if (unread[id]) {
      unread[id].forEach(m => addOther(m.name, m.text));
      delete unread[id];
    }
    clearDot(id);
    setTimeout(() => input.focus(), 50);

    /* ---- 关闭清理 ---- */
    w.on('close', () => {
      timers.forEach(clearTimeout);
      aborters.forEach(c => c.abort());   // 取消进行中的模型请求
      aborters.clear();
      delete chatWins[id];
    });
  }

  /* ---------------- 随机好友来消息 (登录后每 20~40 秒) ---------------- */
  function scheduleEvent() {
    if (eventTimer) clearTimeout(eventTimer);
    eventTimer = setTimeout(() => {
      eventTimer = null;
      if (loggedIn) fireEvent();
      if (loggedIn) scheduleEvent();
    }, 20000 + Math.random() * 20000);
  }
  function fireEvent() {
    const onlines = FRIENDS.filter(isOnline);
    if (!onlines.length) return;
    const f = pick(onlines);
    const msg = pick(OPENERS);
    const cw = chatWins[f.id];
    if (cw && !cw.closed) {
      cw._addIncoming(f.name, msg);
    } else {
      (unread[f.id] = unread[f.id] || []).push({ name: f.name, text: msg });
      showDot(f.id);
      XP.notify('QQ 消息', f.name + ': ' + msg);
    }
    sfx('msg');
    trayBlink();
    if (cw && cw.flash) cw.flash();
  }

  /* ---------------- 入口 (单例) ---------------- */
  function open() {
    if (loggedIn && mainWin) { mainWin.focus(); return; }
    if (loginWin && !loginWin.closed) { loginWin.focus(); return; }
    openLogin();
  }

  XP.registerApp({ id: 'qq', name: 'QQ2005', icon: '🐧', open });
})();
