/* ============================================================
   QQ宠物 — 2005 经典桌面企鹅 · 豪华升级版 (纯前端, 从 QQ 面板「宠物」按钮召唤)
   形象: 多姿态 sprite(待机/走路/开心/吃饭/睡觉/生病) + 等级进化
        (Lv1-4 幼年 / Lv5-9 青年 / Lv10+ 成年·企鹅贵族), 体型随等级变大,
        图片加载失败自动回退 qq2005 图标 → emoji 🐧
   交互: 拖拽移动 / 点击 / 抚摸(来回摸头涨心情经验·冒爱心) / 右键菜单 /
        玩球(拖球扔出·宠物追球捡回) / 双击跳舞(摇摆+音符) / 聊天(可选
        /api/chat, 离线关键词回复) / hover 状态面板
   系统: 四维衰减(离线按真实时间折算) / 元宝货币 / 商店 / 背包(食物·
        清洁·药品分物品效果) / 打工(工种·冷却) / 学习(学历·每日限次) /
        旅游(离开 60 秒·回来带礼物) / 生病吃药 / 冷落惩罚(10 分钟无互动)
        / 等级特权(Lv3 学习·Lv5 旅游·Lv10 进化) / localStorage 持久化
        (key: winxp_qpet_v1, 兼容旧存档字段) / 注销暂停 / 退出彻底清理
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 应用样式 (注入 <head>, 类名统一 app-qp- 前缀) ---------------- */
  const CSS = `
.app-qp-layer{position:absolute;inset:0;z-index:4500;pointer-events:none;overflow:hidden}
.app-qp-pet{position:absolute;width:90px;pointer-events:auto;cursor:grab;user-select:none;touch-action:none}
.app-qp-pet.dragging{cursor:grabbing}
.app-qp-flip{transition:transform .25s}
.app-qp-flip.left{transform:scaleX(-1)}
.app-qp-wrap{animation:app-qp-breathe 2.6s ease-in-out infinite;transform-origin:bottom center;text-align:center}
.app-qp-wrap.walk{animation:app-qp-walk .4s ease-in-out infinite}
.app-qp-wrap.jump{animation:app-qp-jump .55s ease-out 1}
.app-qp-wrap.talk{animation:app-qp-talk .6s ease-in-out infinite}
.app-qp-wrap.look{animation:app-qp-look 1.2s ease-in-out 1}
.app-qp-wrap.dance{animation:app-qp-dance .55s ease-in-out 4}
.app-qp-wrap.work{animation:app-qp-work .55s ease-in-out infinite}
.app-qp-wrap.study{animation:app-qp-breathe 1.6s ease-in-out infinite}
.app-qp-wrap.sleep{animation:none;transform:rotate(82deg) translate(8px,14px);transition:transform .6s}
.app-qp-wrap.sick{animation:none;transform:rotate(82deg) translate(8px,14px);filter:grayscale(.55) brightness(.96);transition:transform .6s}
.app-qp-face{width:90px;height:90px;object-fit:contain;display:block;pointer-events:none;
  filter:drop-shadow(2px 3px 3px rgba(0,0,0,.35))}
.app-qp-emoji{font-size:68px;line-height:90px;text-align:center}
.app-qp-tool{position:absolute;left:50%;top:-24px;transform:translateX(-50%);font-size:24px;z-index:2;
  pointer-events:none;display:none;filter:drop-shadow(1px 1px 1px rgba(0,0,0,.4))}
.app-qp-tool.swing{animation:app-qp-tool 1s ease-in-out infinite}
.app-qp-bubble{position:absolute;left:50%;bottom:96px;transform:translateX(-50%);max-width:190px;min-width:60px;
  background:#fff;border:2px solid #4a9fe0;border-radius:10px;padding:4px 9px;font-size:12px;line-height:1.4;
  color:#333;white-space:normal;word-break:break-all;text-align:center;box-shadow:1px 2px 5px rgba(0,0,0,.25);z-index:3}
.app-qp-bubble::after{content:'';position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);
  border:5px solid transparent;border-top-color:#4a9fe0}
.app-qp-bubble::before{content:'';position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);z-index:1;
  border:4px solid transparent;border-top-color:#fff}
.app-qp-alert{position:absolute;right:2px;top:-6px;font-size:22px;z-index:2;animation:app-qp-alert 1s ease-in-out infinite;
  filter:drop-shadow(1px 1px 1px rgba(0,0,0,.4))}
.app-qp-menubtn{position:absolute;left:2px;top:-4px;width:18px;height:18px;border-radius:50%;z-index:2;
  background:linear-gradient(180deg,#fff,#d7e6f7);border:1px solid #4a9fe0;color:#245b8c;font-size:12px;line-height:16px;
  text-align:center;cursor:pointer;opacity:0;transition:opacity .15s;box-shadow:1px 1px 3px rgba(0,0,0,.3)}
.app-qp-pet:hover .app-qp-menubtn{opacity:1}
.app-qp-bars{margin:2px auto 0;width:74px;background:rgba(255,255,255,.75);border:1px solid rgba(0,0,0,.35);
  border-radius:4px;padding:2px 3px;display:flex;flex-direction:column;gap:1px}
.app-qp-bar{height:4px;border-radius:2px;background:rgba(0,0,0,.18);overflow:hidden}
.app-qp-bar>i{display:block;height:100%;border-radius:2px;transition:width .5s}
.app-qp-panel{position:absolute;left:50%;bottom:116px;transform:translateX(-50%);width:172px;z-index:4;
  background:#fffbe8;border:1px solid #b8a76a;border-radius:6px;padding:7px 9px;font-size:11px;color:#4a3f1d;
  box-shadow:2px 3px 8px rgba(0,0,0,.3);line-height:1.5}
.app-qp-panel .pn-t{font-weight:bold;color:#245b8c;margin-bottom:3px;font-size:12px}
.app-qp-panel .pn-row{display:flex;align-items:center;gap:4px;margin:2px 0}
.app-qp-panel .pn-row span{width:30px;flex:none}
.app-qp-panel .pn-bar{flex:1;height:6px;background:#e3dcc2;border-radius:3px;overflow:hidden}
.app-qp-panel .pn-bar>i{display:block;height:100%}
.app-qp-panel .pn-v{width:26px;text-align:right;flex:none;color:#7a6d3d}
.app-qp-menu{position:absolute;z-index:5;min-width:140px;pointer-events:auto;
  background:#fff;border:1px solid #7f9db9;box-shadow:2px 3px 8px rgba(0,0,0,.35);padding:2px 0;font-size:12px}
.app-qp-menu .mi{padding:4px 14px 4px 10px;cursor:default;white-space:nowrap;color:#000}
.app-qp-menu .mi:hover{background:#316ac5;color:#fff}
.app-qp-menu .mi.dis{color:#aca899;cursor:default}
.app-qp-menu .mi.dis:hover{background:#fff;color:#aca899}
.app-qp-menu .mi .ar{float:right;margin-left:10px;color:#888}
.app-qp-menu .mi:hover .ar{color:#fff}
.app-qp-menu .sep{height:1px;background:#d6d3c6;margin:2px 0}
.app-qp-float{position:absolute;font-size:20px;pointer-events:none;z-index:6;animation:app-qp-float 1.3s ease-out forwards}
.app-qp-ball{position:absolute;font-size:28px;z-index:3;pointer-events:auto;cursor:grab;user-select:none;
  touch-action:none;transition:left .5s ease-out,top .5s ease-out;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.35))}
.app-qp-ball.drag{cursor:grabbing;transition:none}
/* ---- 聊天面板 ---- */
.app-qp-chat{position:absolute;left:50%;bottom:116px;transform:translateX(-50%);width:212px;z-index:4;
  background:#fffbe8;border:1px solid #b8a76a;border-radius:6px;box-shadow:2px 3px 8px rgba(0,0,0,.3);
  font-size:12px;color:#4a3f1d;overflow:hidden;pointer-events:auto}
.app-qp-chat .ct-t{background:#e8e0c0;padding:3px 8px;font-weight:bold;color:#245b8c;display:flex;justify-content:space-between}
.app-qp-chat .ct-x{cursor:pointer;color:#a33;padding:0 2px}
.app-qp-chat .ct-lines{max-height:120px;overflow-y:auto;padding:5px 8px;line-height:1.5;word-break:break-all}
.app-qp-chat .ct-lines .u{color:#245b8c}
.app-qp-chat .ct-lines .p{color:#a04}
.app-qp-chat .ct-in{display:flex;border-top:1px solid #d8d0b0}
.app-qp-chat .ct-in input{flex:1;border:0;padding:4px 6px;font-size:12px;outline:none;background:#fff;min-width:0}
.app-qp-chat .ct-in button{border:0;border-left:1px solid #d8d0b0;background:#e8e0c0;padding:0 8px;cursor:pointer;font-size:12px;color:#245b8c}
/* ---- 商店窗口 ---- */
.app-qp-shop{padding:8px 10px;font-size:12px;background:#ece9d8;height:100%;overflow:auto;color:#333}
.app-qp-shop .sh-top{display:flex;justify-content:space-between;align-items:center;background:#fffbe8;
  border:1px solid #b8a76a;border-radius:4px;padding:4px 8px;margin-bottom:6px;font-weight:bold;color:#a06010}
.app-qp-shop .sh-cat{font-weight:bold;color:#245b8c;margin:7px 0 3px;border-bottom:1px solid #c8c4b0;padding-bottom:2px}
.app-qp-shop .sh-row{display:flex;align-items:center;gap:6px;padding:3px 2px}
.app-qp-shop .sh-row:hover{background:#ddd8c4}
.app-qp-shop .sh-row .nm{flex:1}
.app-qp-shop .sh-row .nm small{color:#888;font-size:10px;margin-left:4px}
.app-qp-shop .sh-row .pr{color:#a06010;width:56px;text-align:right;flex:none}
.app-qp-shop .sh-row button{border:1px solid #7f9db9;background:linear-gradient(180deg,#fff,#d7e6f7);
  border-radius:3px;padding:1px 10px;font-size:11px;cursor:pointer;color:#245b8c}
.app-qp-shop .sh-row button:active{background:#c5d8ee}
/* ---- 状态窗口 ---- */
.app-qp-statwin{padding:10px 12px;font-size:12px;background:#ece9d8;height:100%;overflow:auto}
.app-qp-statwin .sw-head{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.app-qp-statwin .sw-head .emo{font-size:34px}
.app-qp-statwin .sw-head .nm{font-size:14px;font-weight:bold;color:#245b8c}
.app-qp-statwin .sw-head .lv{color:#7a6d3d;font-size:11px;margin-top:2px}
.app-qp-statwin .sw-row{display:flex;align-items:center;gap:6px;margin:6px 0}
.app-qp-statwin .sw-row .lb{width:44px;flex:none}
.app-qp-statwin .sw-bar{flex:1;height:12px;border:1px solid #7f9db9;background:#fff;border-radius:2px;overflow:hidden}
.app-qp-statwin .sw-bar>i{display:block;height:100%;transition:width .5s}
.app-qp-statwin .sw-v{width:34px;text-align:right;flex:none;color:#555}
.app-qp-statwin .sw-foot{margin-top:10px;padding-top:7px;border-top:1px solid #d0ccbc;color:#555;line-height:1.7}
@keyframes app-qp-breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.03)}}
@keyframes app-qp-walk{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-4px) rotate(4deg)}}
@keyframes app-qp-jump{0%{transform:translateY(0) scale(1,1)}20%{transform:translateY(4px) scale(1.08,.9)}
  45%{transform:translateY(-30px) scale(.96,1.05)}70%{transform:translateY(0) scale(1.05,.95)}100%{transform:translateY(0) scale(1,1)}}
@keyframes app-qp-talk{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes app-qp-look{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
@keyframes app-qp-dance{0%,100%{transform:rotate(0) translateY(0)}25%{transform:rotate(-14deg) translateY(-6px)}75%{transform:rotate(14deg) translateY(-6px)}}
@keyframes app-qp-work{0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(-13deg) translateY(4px)}}
@keyframes app-qp-tool{0%,100%{transform:translateX(-50%) rotate(-20deg)}50%{transform:translateX(-50%) rotate(20deg)}}
@keyframes app-qp-alert{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-4px) scale(1.15)}}
@keyframes app-qp-float{0%{transform:translateY(0) scale(.8);opacity:0}20%{opacity:1}100%{transform:translateY(-64px) scale(1.2);opacity:0}}
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------------- 常量与台词 ---------------- */
  const STORE_KEY = 'winxp_qpet_v1';
  const PET_NAME = 'Q宠宝贝';
  const DECAY_MS = 30000;          // 每 30 秒衰减一次
  const NEGLECT_MS = 600000;       // 10 分钟无互动 → 冷落惩罚
  const WORK_CD_MS = 180000;       // 打工完成后冷却 3 分钟
  const TRAVEL_MS = 60000;         // 旅游时长 60 秒
  const BALL_BASE = 3;             // 每日玩球基础次数
  const STUDY_LIMIT = 2;           // 每日学习次数
  const CHAT_PERSONA = '你是用户的QQ宠物企鹅，生活在2005年。撒娇可爱，自称"人家"或"偶"，爱用"~"和"!"。每次回复1-2句简短口语。';

  const LINES_NORMAL = ['主人，我饿了~', '陪我玩嘛！', '今天超女总决赛！', 'zzz…', '主人最好啦~',
    '好无聊啊…', '我们去宠物社区玩吧！', '我想吃冰淇淋🍦', '喵喵？不对，我是企鹅', '努力工作，也要记得休息哦~'];
  const LINES_CLICK = ['哈哈，好痒~', '耶！主人摸我啦！', '再点一下嘛~', '爱你哟，主人！', '啾咪~', '陪我玩陪我玩！'];
  const LINES_PET = ['嘿嘿，好舒服~', '主人的手好温暖~', '再摸摸嘛~', '偶最喜欢主人了~', '呼噜呼噜~'];
  const LINES_LOW = { hunger: '呜呜，肚子咕咕叫…', clean: '身上脏兮兮的，想洗澡…', mood: '哼，都不陪我玩…' };
  const LINES_SICK = ['我生病了…需要吃药', '好难受…呜呜', '主人，我不舒服…'];

  const STAT_META = [
    { key: 'hunger', name: '饥饿', color: '#f0a030', icon: '🍖' },
    { key: 'clean',  name: '清洁', color: '#3a9ff0', icon: '🛁' },
    { key: 'mood',   name: '心情', color: '#f070a8', icon: '💢' },
    { key: 'health', name: '健康', color: '#58c058', icon: '💊' },
  ];

  /* ---- 商店/背包物品: cat=food|clean|med, use=使用效果, eff=商店说明 ---- */
  const ITEMS = {
    bone:   { name: '肉骨头',   icon: '🦴', cat: 'food',  price: 30,  eff: '饥饿+20',           use: { hunger: 20 },           say: '好好吃！谢谢主人~' },
    fish:   { name: '鱼罐头',   icon: '🐟', cat: 'food',  price: 50,  eff: '饥饿+35 心情+5',    use: { hunger: 35, mood: 5 },  say: '鱼罐头最香啦！' },
    feast:  { name: '豪华大餐', icon: '🍱', cat: 'food',  price: 120, eff: '饥饿+60 经验+5',    use: { hunger: 60, exp: 5 },   say: '哇！是豪华大餐！' },
    soap:   { name: '香皂',     icon: '🧼', cat: 'clean', price: 20,  eff: '清洁+25',           use: { clean: 25 },            say: '洗白白~ 香喷喷！' },
    bubble: { name: '泡泡浴',   icon: '🛁', cat: 'clean', price: 60,  eff: '清洁+50 心情+5',    use: { clean: 50, mood: 5 },   say: '好多泡泡！真舒服~' },
    pill:   { name: '感冒药',   icon: '💊', cat: 'med',   price: 80,  eff: '健康+60',           use: { health: 60, mood: -10 }, say: '药好苦…呜呜' },
  };
  const SHOP_CATS = [
    { cat: 'food',  name: '🍖 食物' },
    { cat: 'clean', name: '🛁 清洁' },
    { cat: 'med',   name: '💊 药品' },
    { cat: 'toy',   name: '🎾 玩具' },
  ];
  const TOY_BALL = { name: '皮球', icon: '🎾', price: 100, eff: '玩球每日次数+2' };

  /* ---- 打工工种 ---- */
  const JOBS = [
    { id: 'brick', name: '搬砖',   icon: '🔨', sec: 60, pay: 40, cost: { hunger: 15, mood: 10 } },
    { id: 'paper', name: '送报纸', icon: '📰', sec: 60, pay: 35, cost: { hunger: 15, mood: 10, clean: 10 } },
    { id: 'actor', name: '演员',   icon: '🎬', sec: 60, pay: 60, cost: { hunger: 15, mood: 15 }, reqEdu: 2 },
  ];
  /* ---- 学习课程 ---- */
  const COURSES = [
    { id: 'cn1', name: '小学语文', icon: '📖', sec: 45, edu: 1, exp: 10 },
  ];
  /* ---- 旅游目的地 ---- */
  const DESTS = ['海南岛', '长城', '哈尔滨冰雪大世界', '上海外滩', '桂林山水', '西藏布达拉宫', '香港迪士尼', '青岛海边'];

  /* ---------------- 状态存取 (localStorage, 离线按真实时间衰减, 兼容旧存档) ---------------- */
  function clamp(v) { return Math.max(0, Math.min(100, v)); }
  function todayStr() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function expNeed(lv) { return lv * 20; }
  function stageOf(lv) { return lv <= 4 ? 'baby' : lv >= 10 ? 'adult' : 'mid'; }
  function petTitle(lv) { return lv >= 10 ? '企鹅贵族' : '小企鹅'; }

  function defaultState() {
    return {
      // 旧存档字段 (v1 兼容)
      hunger: 85, clean: 85, mood: 90, health: 100,
      level: 1, exp: 0, adopt: Date.now(),
      feedDay: todayStr(), feedCount: 0, lastSaved: Date.now(),
      // v2 扩展字段
      yuanbao: 500,                       // 元宝 (初始 500)
      topupV2: true,                      // v2 元宝补贴标记
      bag: {},                            // 背包 {itemId: 数量}
      edu: 0,                             // 学历
      workCD: 0,                          // 打工冷却截止 timestamp
      ballDay: todayStr(), ballCount: 0, ballBonus: 0,   // 玩球: 日计数 + 永久加成
      studyDay: todayStr(), studyCount: 0,               // 学习: 日计数
      travel: null,                       // 旅游状态 {end, dest}
      lastInteract: Date.now(),           // 最后互动时间 (冷落判定)
    };
  }
  function loadState() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
    if (!s || typeof s !== 'object') return defaultState();
    const needTopup = s.topupV2 == null;   // 老存档标记(需在默认值合并前判定)
    const d = defaultState();
    for (const k in d) if (s[k] == null) s[k] = d[k];
    // v2 元宝补贴: 老存档一次性补到 500
    if (needTopup) { s.yuanbao = Math.max(s.yuanbao, 500); s.topupV2 = true;
      try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
    // 离线衰减: 按上次保存至今的真实时间折算 (平均 0.75/30s)
    const elapsed = Math.max(0, Date.now() - (s.lastSaved || Date.now()));
    const loss = (elapsed / DECAY_MS) * 0.75;
    if (loss > 0) ['hunger', 'clean', 'mood', 'health'].forEach(k => { s[k] = clamp(s[k] - loss); });
    s.lastSaved = Date.now();
    return s;
  }
  function saveState() {
    if (!pet) return;
    pet.state.lastSaved = Date.now();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(pet.state)); } catch (e) {}
  }
  function touch() { if (pet) pet.state.lastInteract = Date.now(); }
  function addBag(id, n) { const b = pet.state.bag; b[id] = (b[id] || 0) + n; if (b[id] <= 0) delete b[id]; }

  /* ---------------- 宠物实例 (单例) ---------------- */
  let pet = null;
  let statusWin = null, shopWin = null;

  function desktopEl() { return document.getElementById('desktop'); }
  function desktopHidden() { const d = desktopEl(); return !d || d.classList.contains('hidden'); }
  function isSick() { const s = pet.state; return Math.min(s.hunger, s.clean, s.mood, s.health) <= 0; }
  function lowestStat() {
    const s = pet.state; let best = null;
    STAT_META.forEach(m => { if (m.key !== 'health' && (!best || s[m.key] < s[best.key])) best = m; });
    return best;
  }
  function ballLimit() { return BALL_BASE + (pet.state.ballBonus || 0); }

  function open() {
    if (pet) { // 单实例: 已召唤则打个招呼
      if (pet.traveling) pet.say('偶还在旅游呢，马上回来~');
      else { pet.jump(); pet.say('我在这儿呢~'); }
      return;
    }
    summon();
  }

  function summon() {
    const state = loadState();
    const layer = document.createElement('div');
    layer.className = 'app-qp-layer';

    const petEl = document.createElement('div');
    petEl.className = 'app-qp-pet';
    const startX = Math.max(10, window.innerWidth - 170);
    const startY = Math.max(10, window.innerHeight - 210);
    petEl.style.left = startX + 'px';
    petEl.style.top = startY + 'px';

    const flip = document.createElement('div');
    flip.className = 'app-qp-flip';
    const wrap = document.createElement('div');
    wrap.className = 'app-qp-wrap';

    // 形象: 多姿态 sprite, 失败回退 qq2005 图标, 再失败回退 emoji
    const face = document.createElement('img');
    face.className = 'app-qp-face';
    face.alt = 'QQ宠物';
    face.draggable = false;
    const emojiDiv = document.createElement('div');
    emojiDiv.className = 'app-qp-face app-qp-emoji';
    emojiDiv.textContent = '🐧';
    emojiDiv.style.display = 'none';
    face.addEventListener('error', function () {
      if (!pet || pet.emojiMode) return;
      if (face.dataset.fb === '1') {           // 第二级失败: 回退 emoji
        pet.emojiMode = true;
        face.style.display = 'none';
        emojiDiv.style.display = 'block';
      } else {                                 // 第一级失败: 回退旧图标
        face.dataset.fb = '1';
        face.src = 'assets/img/icons/qq2005.png';
      }
    });
    wrap.appendChild(face);
    wrap.appendChild(emojiDiv);
    flip.appendChild(wrap);

    const tool = document.createElement('div');   // 打工🔨/学习🎓 叠加
    tool.className = 'app-qp-tool';

    const bubble = document.createElement('div');
    bubble.className = 'app-qp-bubble';
    bubble.style.display = 'none';

    const alert = document.createElement('div');
    alert.className = 'app-qp-alert';
    alert.style.display = 'none';

    const menuBtn = document.createElement('div');
    menuBtn.className = 'app-qp-menubtn';
    menuBtn.textContent = '≡';
    menuBtn.title = '宠物菜单';

    const bars = document.createElement('div');
    bars.className = 'app-qp-bars';
    const barFills = {};
    ['hunger', 'clean', 'mood'].forEach(k => {
      const meta = STAT_META.find(m => m.key === k);
      const bar = document.createElement('div');
      bar.className = 'app-qp-bar';
      const fill = document.createElement('i');
      fill.style.background = meta.color;
      bar.appendChild(fill);
      bars.appendChild(bar);
      barFills[k] = fill;
    });

    const panel = document.createElement('div');
    panel.className = 'app-qp-panel';
    panel.style.display = 'none';

    petEl.appendChild(bubble);
    petEl.appendChild(alert);
    petEl.appendChild(menuBtn);
    petEl.appendChild(tool);
    petEl.appendChild(flip);
    petEl.appendChild(bars);
    petEl.appendChild(panel);
    layer.appendChild(petEl);
    desktopEl().appendChild(layer);

    pet = {
      state, layer, el: petEl, flip, wrap, face, emojiDiv, tool, bubble, alert, bars, barFills, panel,
      x: startX, y: startY, facingLeft: false, pose: 'stand', emojiMode: false,
      sleeping: false, dragging: false, busy: null, traveling: false, fetching: false,
      ball: null, chat: [{ role: 'pet', text: '主人来找偶聊天啦~ 偶好开森！' }], chatEl: null, chatTyping: false,
      actionTimer: null, decayTimer: null, bubbleTimer: null, animTimer: null, poseTimer: null,
      busyTimer: null, travelTimer: null, travelHideTimer: null, danceTimers: [],
      menuEl: null, subEl: null, menuCloser: null,
      lastDance: 0,

      say(text, ms) {
        clearTimeout(pet.bubbleTimer);
        pet.bubble.textContent = text;
        pet.bubble.style.display = 'block';
        pet.bubbleTimer = setTimeout(() => { if (pet) pet.bubble.style.display = 'none'; }, ms || 3000);
      },
      jump() {
        if (pet.sleeping || isSick()) return;
        pet.playAnim('jump', 600);
        setPose('happy', 1200);
      },
      // 互斥播放一次性/临时动画, 结束自动回落到呼吸动画
      playAnim(cls, ms) {
        pet.wrap.classList.remove('walk', 'jump', 'talk', 'look', 'dance');
        void pet.wrap.offsetWidth;
        pet.wrap.classList.add(cls);
        clearTimeout(pet.animTimer);
        pet.animTimer = setTimeout(() => { if (pet) pet.wrap.classList.remove(cls); }, ms);
      },
    };

    bindInteractions();
    applySize();
    applySprite();
    render();
    pet.say(isSick() ? '我生病了…需要吃药' : '主人，我来啦！');
    scheduleAction();
    pet.decayTimer = setInterval(decayTick, DECAY_MS);
    window.addEventListener('resize', onResize);

    // 旅游状态恢复 (存档中的未完成/已完成旅游)
    if (state.travel) {
      if (Date.now() >= state.travel.end) completeTravel(true);
      else beginTravelVisual(state.travel.dest, state.travel.end, true);
    }
  }

  /* ---------------- 形象: 姿态切换 / 等级进化 / 体型 ---------------- */
  function petSize() {
    const lv = pet.state.level, st = stageOf(lv);
    if (st === 'baby') return 72 + (lv - 1) * 2;         // 72~78
    if (st === 'mid')  return 86 + (lv - 5) * 2;         // 86~94
    return 96 + Math.min(lv - 10, 10) * 2;               // 96~116
  }
  function currentPose() {
    if (pet.sleeping) return 'sleep';
    if (isSick()) return 'sick';
    return pet.pose || 'stand';
  }
  function applySprite() {
    if (!pet || pet.emojiMode) return;
    const st = stageOf(pet.state.level);
    const key = st === 'baby' ? 'baby' : st === 'adult' ? 'adult' : currentPose();
    const src = 'assets/img/qpet/' + key + '.png';
    if (pet.face.dataset.cur !== src) {
      pet.face.dataset.cur = src;
      pet.face.dataset.fb = '';          // 新地址重置失败计数
      pet.face.src = src;
    }
  }
  function applySize() {
    if (!pet) return;
    const sz = petSize();
    pet.el.style.width = sz + 'px';
    pet.face.style.width = sz + 'px';
    pet.face.style.height = sz + 'px';
    pet.emojiDiv.style.fontSize = Math.round(sz * 0.75) + 'px';
    pet.emojiDiv.style.lineHeight = sz + 'px';
    pet.bubble.style.bottom = (sz + 6) + 'px';
    pet.panel.style.bottom = (sz + 26) + 'px';
    if (pet.chatEl) pet.chatEl.style.bottom = (sz + 26) + 'px';
  }
  function setPose(p, ms) {
    if (!pet) return;
    pet.pose = p;
    applySprite();
    clearTimeout(pet.poseTimer);
    if (ms) pet.poseTimer = setTimeout(() => { if (pet) { pet.pose = 'stand'; applySprite(); } }, ms);
  }

  /* ---------------- 渲染: 状态条 / 提醒图标 / 病睡姿态 / hover 面板 ---------------- */
  function render() {
    if (!pet) return;
    const s = pet.state;
    for (const k in pet.barFills) pet.barFills[k].style.width = clamp(s[k]) + '%';
    // 低状态提醒图标 (取饥饿/清洁/心情中最低且 <30 的)
    const low = lowestStat();
    if (low && s[low.key] < 30 && !isSick()) {
      pet.alert.textContent = low.icon;
      pet.alert.style.display = 'block';
    } else {
      pet.alert.style.display = 'none';
    }
    // 姿态 class (睡/病) 与 sprite
    pet.wrap.classList.toggle('sick', isSick() && !pet.sleeping);
    pet.wrap.classList.toggle('sleep', pet.sleeping);
    applySprite();
    applySize();
    // hover 面板
    pet.panel.innerHTML =
      '<div class="pn-t">' + PET_NAME + ' Lv.' + s.level +
      (s.level >= 10 ? ' 👑' : '') + '</div>' +
      STAT_META.map(m =>
        '<div class="pn-row"><span>' + m.name + '</span><div class="pn-bar"><i style="width:' + clamp(s[m.key]) +
        '%;background:' + m.color + '"></i></div><div class="pn-v">' + Math.round(s[m.key]) + '</div></div>'
      ).join('') +
      '<div style="margin-top:3px;color:#7a6d3d">经验 ' + s.exp + '/' + expNeed(s.level) +
      ' · 💰' + s.yuanbao + '</div>' +
      '<div style="color:#7a6d3d">学历 Lv.' + s.edu + ' · ' + petTitle(s.level) + '</div>';
  }

  /* ---------------- 自主行为循环 ---------------- */
  function scheduleAction() {
    if (!pet) return;
    clearTimeout(pet.actionTimer);
    pet.actionTimer = setTimeout(doAction, 3000 + Math.random() * 3000);
  }
  function doAction() {
    if (!pet) return;
    if (desktopHidden()) { scheduleAction(); return; }          // 注销中: 暂停
    if (pet.busy || pet.traveling || pet.fetching) { scheduleAction(); return; } // 忙/旅游/捡球
    if (pet.sleeping) {                                          // 睡觉: 偶尔冒 zzz
      if (Math.random() < 0.5) pet.say('zzz…');
      scheduleAction(); return;
    }
    if (isSick()) {                                              // 生病: 只哀嚎
      pet.say(LINES_SICK[Math.floor(Math.random() * LINES_SICK.length)], 3500);
      scheduleAction(); return;
    }
    const s = pet.state;
    const low = lowestStat();
    if (low && s[low.key] < 30 && Math.random() < 0.55) {        // 低状态哀嚎
      pet.say(LINES_LOW[low.key], 3500);
      scheduleAction(); return;
    }
    const r = Math.random();
    if (r < 0.42) walk();
    else if (r < 0.68) lookAround();
    else talkRandom();
    scheduleAction();
  }

  function walk() {
    const sz = petSize();
    const maxX = window.innerWidth - sz - 10;
    const maxY = window.innerHeight - sz - 60;   // 避开任务栏
    const nx = Math.max(5, Math.min(maxX, 10 + Math.random() * (maxX - 10)));
    const ny = Math.max(5, Math.min(maxY, 10 + Math.random() * (maxY - 10)));
    setFacing(nx < pet.x);
    pet.el.style.transition = 'left 1.8s ease-in-out, top 1.8s ease-in-out';
    pet.el.style.left = nx + 'px';
    pet.el.style.top = ny + 'px';
    pet.x = nx; pet.y = ny;
    setPose('walk', 1900);
    pet.playAnim('walk', 1900);
  }
  function lookAround() {
    setFacing(!pet.facingLeft);
    pet.playAnim('look', 1300);
    clearTimeout(pet.animTimer);
    pet.animTimer = setTimeout(() => { if (pet) { pet.wrap.classList.remove('look'); setFacing(Math.random() < 0.5); } }, 1300);
  }
  function talkRandom() {
    const t = LINES_NORMAL[Math.floor(Math.random() * LINES_NORMAL.length)];
    pet.say(t);
    pet.playAnim('talk', 3000);
  }
  function setFacing(left) {
    pet.facingLeft = left;
    pet.flip.classList.toggle('left', left);
  }

  /* ---------------- 衰减 (注销/睡觉/旅游时暂停) + 冷落惩罚 ---------------- */
  function decayTick() {
    if (!pet) return;
    const s = pet.state;
    if (!desktopHidden() && !pet.sleeping && !pet.traveling) {
      ['hunger', 'clean', 'mood', 'health'].forEach(k => {
        s[k] = clamp(s[k] - (0.5 + Math.random() * 0.5));
      });
      // 冷落惩罚: 10 分钟无任何互动 → 心情额外 -5
      if (!pet.busy && Date.now() - (s.lastInteract || 0) > NEGLECT_MS) {
        s.mood = clamp(s.mood - 5);
        s.lastInteract = Date.now();
        if (!isSick()) pet.say('呜呜，主人不理我…', 3500);
      }
      render();
      if (isSick()) pet.say('我生病了…需要吃药', 3500);
    }
    saveState();
  }

  /* ---------------- 经验 / 等级 / 进化 ---------------- */
  function addExp(n) {
    const s = pet.state;
    const st0 = stageOf(s.level);
    s.exp += n;
    let up = false;
    while (s.exp >= expNeed(s.level)) { s.exp -= expNeed(s.level); s.level++; up = true; }
    if (up) {
      const st1 = stageOf(s.level);
      let msg;
      if (st1 !== st0 && st1 === 'adult') msg = '偶进化啦！从今天起请叫偶企鹅贵族！👑';
      else if (st1 !== st0 && st1 === 'mid') msg = '偶长大啦！ Lv.' + s.level;
      else {
        msg = '我升级啦！ Lv.' + s.level;
        if (s.level === 3) msg += ' 解锁学习📚';
        if (s.level === 5) msg += ' 解锁旅游✈️';
      }
      pet.say(msg, 4000);
      pet.jump();
      applySize(); applySprite();
      XP.sound('tada');
    }
  }

  /* ---------------- 互动: 点击 / 拖拽 / 抚摸 / 双击跳舞 ---------------- */
  function bindInteractions() {
    const el_ = pet.el;
    let downX = 0, downY = 0, startX = 0, startY = 0, pid = null;
    let petAcc = 0, petLast = 0, lastX = 0, lastY = 0;   // 抚摸累积

    el_.addEventListener('pointerdown', e => {
      if (e.target === pet.bubble || e.target.classList.contains('app-qp-menubtn')) return;
      if (e.target.closest && e.target.closest('.app-qp-chat')) return;
      pid = e.pointerId;
      downX = e.clientX; downY = e.clientY;
      startX = pet.x; startY = pet.y;
      lastX = e.clientX; lastY = e.clientY; petAcc = 0;
      pet.dragging = false;
      try { el_.setPointerCapture(pid); } catch (err) {}
    });
    el_.addEventListener('pointermove', e => {
      // 拖拽中
      if (pid === e.pointerId && pet.dragging) {
        const dx = e.clientX - downX, dy = e.clientY - downY;
        const sz = petSize();
        pet.x = Math.max(0, Math.min(window.innerWidth - sz - 5, startX + dx));
        pet.y = Math.max(0, Math.min(window.innerHeight - sz - 45, startY + dy));
        el_.style.left = pet.x + 'px';
        el_.style.top = pet.y + 'px';
        return;
      }
      if (pid === e.pointerId) {
        const dx = e.clientX - downX, dy = e.clientY - downY;
        if (Math.abs(dx) + Math.abs(dy) >= 5) {   // 进入拖拽
          pet.dragging = true;
          el_.classList.add('dragging');
          pet.el.style.transition = 'none';
          closeMenu();
        }
        return;
      }
      // 无按键移动 = 抚摸 (仅限宠物身体区域)
      if (!e.target.closest || !e.target.closest('.app-qp-wrap')) return;
      if (pet.busy || pet.traveling || pet.fetching || pet.sleeping) return;
      petAcc += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      lastX = e.clientX; lastY = e.clientY;
      if (petAcc > 120 && Date.now() - petLast > 2000) {
        petAcc = 0; petLast = Date.now();
        onPet();
      }
    });
    el_.addEventListener('pointerup', e => {
      if (pid !== e.pointerId) return;
      pid = null;
      try { el_.releasePointerCapture(e.pointerId); } catch (err) {}
      if (pet.dragging) {
        pet.dragging = false;
        el_.classList.remove('dragging');
        touch();
        scheduleAction();   // 拖完继续自主行动
      } else {
        onClick();
      }
    });
    el_.addEventListener('pointercancel', () => {
      pid = null; pet.dragging = false; el_.classList.remove('dragging');
    });

    function onClick() {
      touch();
      if (pet.busy) { pet.say('偶正在' + pet.busy.name + '呢，等会儿再找偶玩~'); return; }
      if (pet.sleeping) { toggleSleep(); return; }   // 睡觉时点一下 = 唤醒
      if (isSick()) { pet.say(LINES_SICK[Math.floor(Math.random() * LINES_SICK.length)], 3500); return; }
      pet.jump();
      pet.say(LINES_CLICK[Math.floor(Math.random() * LINES_CLICK.length)]);
      addExp(1);
      saveState(); render();
      XP.sound('ding');
    }
    // 抚摸: 心情+经验缓慢上升, 眯眼开心+冒爱心
    function onPet() {
      touch();
      const s = pet.state;
      s.mood = clamp(s.mood + 1);
      addExp(1);
      setPose('happy', 1500);
      spawnFloat('❤️');
      if (Math.random() < 0.3) pet.say(LINES_PET[Math.floor(Math.random() * LINES_PET.length)]);
      saveState(); render();
    }

    // 双击跳舞
    el_.addEventListener('dblclick', e => {
      e.preventDefault(); e.stopPropagation();
      doDance();
    });
    // 右键菜单
    el_.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      openMenu(e.clientX, e.clientY);
    });
    // 左键菜单按钮
    pet.el.querySelector('.app-qp-menubtn').addEventListener('click', e => {
      e.stopPropagation();
      const r = e.target.getBoundingClientRect();
      openMenu(r.left, r.bottom + 4);
    });
    // hover 状态面板
    el_.addEventListener('mouseenter', () => { if (!pet.menuEl) pet.panel.style.display = 'block'; });
    el_.addEventListener('mouseleave', () => { pet.panel.style.display = 'none'; });
  }

  /* ---------------- 漂浮特效 (爱心/音符) ---------------- */
  function spawnFloat(ch) {
    if (!pet) return;
    const f = document.createElement('div');
    f.className = 'app-qp-float';
    f.textContent = ch;
    f.style.left = (pet.x + 8 + Math.random() * Math.max(10, petSize() - 16)) + 'px';
    f.style.top = (pet.y + Math.random() * 30) + 'px';
    pet.layer.appendChild(f);
    setTimeout(() => { if (pet) f.remove(); }, 1300);
  }

  /* ---------------- 右键菜单 (支持子菜单) ---------------- */
  function openMenu(x, y) {
    closeMenu();
    const sick = isSick();
    const s = pet.state;
    if (s.ballDay !== todayStr()) { s.ballDay = todayStr(); s.ballCount = 0; }
    if (s.studyDay !== todayStr()) { s.studyDay = todayStr(); s.studyCount = 0; }
    const items = [
      ...(sick ? [{ t: '❤️ 复活 (免费)', act: doRevive }, { sep: true }] : []),
      { t: '🍖 喂食', sub: bagItems('food') },
      { t: '🛁 洗澡', sub: bagItems('clean') },
      { t: '💊 用药', dis: !sick, sub: bagItems('med') },
      { t: '🎾 玩球 (' + s.ballCount + '/' + ballLimit() + ')', act: doBall },
      { t: '💃 跳舞', act: doDance },
      { t: '💬 聊天', act: openChat },
      { sep: true },
      { t: '🔨 打工', sub: jobItems() },
      { t: '📚 学习' + (s.level < 3 ? ' (Lv.3解锁)' : ''), dis: s.level < 3, sub: studyItems() },
      { t: '✈️ 旅游' + (s.level < 5 ? ' (Lv.5解锁)' : ''), dis: s.level < 5, act: startTravel },
      { t: '🛒 商店', act: openShopWin },
      { sep: true },
      { t: '📊 状态', act: openStatusWin },
      { t: pet.sleeping ? '☀️ 叫醒它' : '💤 让它睡觉', act: toggleSleep },
      { sep: true },
      { t: '👋 退出宠物', act: doExit },
    ];
    pet.menuEl = buildMenu(items, true);
    pet.layer.appendChild(pet.menuEl);
    const mw = pet.menuEl.offsetWidth, mh = pet.menuEl.offsetHeight;
    pet.menuEl.style.left = Math.max(2, Math.min(x, window.innerWidth - mw - 4)) + 'px';
    pet.menuEl.style.top = Math.max(2, Math.min(y, window.innerHeight - mh - 38)) + 'px';
    pet.menuCloser = function (e) { if (pet.menuEl && !pet.menuEl.contains(e.target) && !(pet.subEl && pet.subEl.contains(e.target))) closeMenu(); };
    setTimeout(() => { if (pet && pet.menuCloser) document.addEventListener('pointerdown', pet.menuCloser, true); }, 0);
  }
  function buildMenu(items, isMain) {
    const menu = document.createElement('div');
    menu.className = 'app-qp-menu';
    items.forEach(it => {
      if (it.sep) { const sp = document.createElement('div'); sp.className = 'sep'; menu.appendChild(sp); return; }
      const mi = document.createElement('div');
      mi.className = 'mi' + (it.dis ? ' dis' : '');
      mi.innerHTML = it.t.replace(/</g, '&lt;') + (it.sub ? '<span class="ar">▸</span>' : '');
      if (it.title) mi.title = it.title;
      if (!it.dis) {
        if (it.sub) mi.addEventListener('click', e => { e.stopPropagation(); openSub(mi, it.sub); });
        else mi.addEventListener('click', e => { e.stopPropagation(); closeMenu(); it.act(); });
      }
      menu.appendChild(mi);
    });
    return menu;
  }
  function openSub(parentMi, items) {
    closeSub();
    const sub = buildMenu(items, false);
    pet.layer.appendChild(sub);
    pet.subEl = sub;
    const r = parentMi.getBoundingClientRect();
    let sx = r.right - 2;
    if (sx + sub.offsetWidth > window.innerWidth - 4) sx = r.left - sub.offsetWidth + 2;
    sub.style.left = Math.max(2, sx) + 'px';
    sub.style.top = Math.max(2, Math.min(r.top - 4, window.innerHeight - sub.offsetHeight - 38)) + 'px';
  }
  function closeSub() { if (pet && pet.subEl) { pet.subEl.remove(); pet.subEl = null; } }
  function closeMenu() {
    if (!pet) return;
    closeSub();
    if (pet.menuEl) { pet.menuEl.remove(); pet.menuEl = null; }
    if (pet.menuCloser) { document.removeEventListener('pointerdown', pet.menuCloser, true); pet.menuCloser = null; }
  }
  // 子菜单内容构造
  function bagItems(cat) {
    const its = Object.keys(ITEMS)
      .filter(k => ITEMS[k].cat === cat && (pet.state.bag[k] || 0) > 0)
      .map(k => ({ t: ITEMS[k].icon + ' ' + ITEMS[k].name + ' ×' + pet.state.bag[k], act: () => useItem(k) }));
    if (!its.length) its.push({ t: '(背包空空，去商店买吧)', dis: true });
    return its;
  }
  function jobItems() {
    const s = pet.state;
    return JOBS.map(j => ({
      t: j.icon + ' ' + j.name + ' (' + j.sec + '秒→' + j.pay + '元宝)' + (j.reqEdu ? ' 需学历' + j.reqEdu : ''),
      dis: j.reqEdu && s.edu < j.reqEdu,
      act: () => startJob(j),
    }));
  }
  function studyItems() {
    const s = pet.state;
    return COURSES.map(c => ({
      t: c.icon + ' ' + c.name + ' (' + c.sec + '秒·学历+' + c.edu + ' 经验+' + c.exp + ') 今日' + s.studyCount + '/' + STUDY_LIMIT,
      dis: s.studyCount >= STUDY_LIMIT,
      act: () => startStudy(c),
    }));
  }

  /* ---------------- 忙碌/睡觉 拦截 ---------------- */
  function busyBlock() {
    if (!pet.busy) return false;
    pet.say('偶正在' + pet.busy.name + '呢，等会儿再找偶玩~');
    return true;
  }
  function sleepBlock() {
    if (!pet.sleeping) return false;
    pet.say('偶还在睡觉呢，先叫醒偶吧~');
    return true;
  }

  /* ---------------- 背包物品使用 (喂食/洗澡/用药) ---------------- */
  function useItem(id) {
    const it = ITEMS[id];
    if (!it) return;
    touch();
    if (busyBlock()) return;
    const s = pet.state;
    if ((s.bag[id] || 0) <= 0) { pet.say('背包里没有' + it.name + '啦~'); return; }
    addBag(id, -1);
    for (const k in it.use) {
      if (k === 'exp') continue;
      s[k] = clamp(s[k] + it.use[k]);
    }
    if (it.use.exp) addExp(it.use.exp);
    if (it.cat === 'food') { setPose('eat', 2600); pet.playAnim('talk', 2500); }
    else if (it.cat === 'clean') { pet.playAnim('talk', 2500); pet.jump(); }
    else { pet.say(it.say); }
    if (it.cat !== 'med') pet.say(it.say);
    else pet.say(isSick() ? it.say : '我感觉好多啦！');
    XP.sound('ding');
    saveState(); render();
  }

  /* ---------------- 玩球: 刷球 → 拖走扔出 → 宠物追球捡回 ---------------- */
  /* ---------------- 复活 (生病时免费复活) ---------------- */
  function doRevive() {
    if (!pet) return;
    closeMenu();
    const s = pet.state;
    s.health = Math.max(s.health, 70);
    s.hunger = Math.max(s.hunger, 40);
    s.clean = Math.max(s.clean, 40);
    s.mood = Math.max(s.mood, 50);
    touch(); saveState();
    applySprite(); pet.wrap.classList.remove('sick');
    XP.sound('tada');
    pet.say('我又活过来啦！ 谢谢主人~ ❤️', 4000);
    pet.playAnim('happy', 1500);
    addExp(2);
  }

  function doBall() {
    touch();
    if (busyBlock() || sleepBlock()) return;
    if (isSick()) { pet.say('偶生病了，玩不动…'); return; }
    const s = pet.state;
    if (s.ballDay !== todayStr()) { s.ballDay = todayStr(); s.ballCount = 0; }
    if (s.ballCount >= ballLimit()) { pet.say('今天玩够啦，明天再玩~'); XP.sound('error'); return; }
    if (pet.ball) { pet.say('球还在那儿呢，快拖出去扔！'); return; }
    spawnBall();
    pet.say('把球拖走扔出去，偶去捡回来！', 3500);
  }
  function spawnBall() {
    const b = document.createElement('div');
    b.className = 'app-qp-ball';
    b.textContent = '🎾';
    const sz = petSize();
    b.style.left = (pet.x + sz * 0.55) + 'px';
    b.style.top = (pet.y + sz - 26) + 'px';
    pet.layer.appendChild(b);
    pet.ball = { el: b };
    let pid = null, ox = 0, oy = 0, bx = 0, by = 0;
    b.addEventListener('pointerdown', e => {
      e.stopPropagation();
      pid = e.pointerId;
      ox = e.clientX; oy = e.clientY;
      bx = parseFloat(b.style.left); by = parseFloat(b.style.top);
      b.classList.add('drag');
      try { b.setPointerCapture(pid); } catch (err) {}
    });
    b.addEventListener('pointermove', e => {
      if (pid !== e.pointerId) return;
      b.style.left = Math.max(0, Math.min(window.innerWidth - 30, bx + e.clientX - ox)) + 'px';
      b.style.top = Math.max(0, Math.min(window.innerHeight - 60, by + e.clientY - oy)) + 'px';
    });
    const release = e => {
      if (pid !== e.pointerId) return;
      pid = null;
      b.classList.remove('drag');
      try { b.releasePointerCapture(e.pointerId); } catch (err) {}
      fetchBall(parseFloat(b.style.left), parseFloat(b.style.top));
    };
    b.addEventListener('pointerup', release);
    b.addEventListener('pointercancel', release);
  }
  function fetchBall(bx, by) {
    if (!pet || pet.fetching) return;
    pet.fetching = true;
    clearTimeout(pet.actionTimer);
    const sz = petSize();
    const nx = Math.max(0, Math.min(window.innerWidth - sz - 5, bx - sz * 0.4));
    const ny = Math.max(0, Math.min(window.innerHeight - sz - 45, by - sz + 30));
    setFacing(nx < pet.x);
    pet.el.style.transition = 'left 1.6s ease-in-out, top 1.6s ease-in-out';
    pet.el.style.left = nx + 'px';
    pet.el.style.top = ny + 'px';
    pet.x = nx; pet.y = ny;
    setPose('walk', 1700);
    pet.playAnim('walk', 1700);
    setTimeout(() => {
      if (!pet) return;
      if (pet.ball) { pet.ball.el.remove(); pet.ball = null; }
      pet.fetching = false;
      const s = pet.state;
      s.ballCount++;
      s.mood = clamp(s.mood + 15);
      addExp(2);
      pet.jump();
      pet.say('捡回来啦！好开心~ (' + s.ballCount + '/' + ballLimit() + ')');
      XP.sound('ding');
      saveState(); render();
      scheduleAction();
    }, 1750);
  }

  /* ---------------- 双击跳舞 ---------------- */
  function doDance() {
    touch();
    if (busyBlock() || sleepBlock()) return;
    if (isSick()) { pet.say('偶生病了，跳不动…'); return; }
    if (Date.now() - pet.lastDance < 10000) { pet.say('让偶喘口气嘛~'); return; }
    pet.lastDance = Date.now();
    pet.wrap.classList.remove('walk', 'jump', 'talk', 'look');
    void pet.wrap.offsetWidth;
    pet.wrap.classList.add('dance');
    setPose('happy', 2400);
    ['♪', '♫', '♪', '♬'].forEach((n, i) => {
      pet.danceTimers.push(setTimeout(() => { if (pet) spawnFloat(n); }, i * 450));
    });
    pet.danceTimers.push(setTimeout(() => { if (pet) pet.wrap.classList.remove('dance'); }, 2300));
    pet.state.mood = clamp(pet.state.mood + 5);
    addExp(3);
    pet.say('跟偶一起摇摆~ ♪');
    XP.sound('tada');
    saveState(); render();
  }

  /* ---------------- 聊天 (http(s) 环境走 /api/chat, 否则离线关键词回复) ---------------- */
  function openChat() {
    touch();
    if (busyBlock()) return;
    if (!pet.chatEl) buildChat();
    pet.chatEl.style.display = 'block';
    pet.chatEl.style.bottom = (petSize() + 26) + 'px';
    renderChat();
    const inp = pet.chatEl.querySelector('input');
    if (inp) inp.focus();
  }
  function buildChat() {
    const box = document.createElement('div');
    box.className = 'app-qp-chat';
    box.innerHTML =
      '<div class="ct-t"><span>和' + PET_NAME + '聊天</span><span class="ct-x">×</span></div>' +
      '<div class="ct-lines"></div>' +
      '<div class="ct-in"><input maxlength="60" placeholder="说点什么吧~"><button>发送</button></div>';
    box.addEventListener('pointerdown', e => e.stopPropagation());
    box.querySelector('.ct-x').addEventListener('click', e => { e.stopPropagation(); box.style.display = 'none'; });
    const inp = box.querySelector('input');
    const send = () => {
      const t = inp.value.trim();
      if (!t) return;
      inp.value = '';
      chatAsk(t);
    };
    box.querySelector('button').addEventListener('click', e => { e.stopPropagation(); send(); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    pet.el.appendChild(box);
    pet.chatEl = box;
  }
  function renderChat() {
    if (!pet.chatEl) return;
    const lines = pet.chatEl.querySelector('.ct-lines');
    lines.innerHTML = pet.chat.slice(-20).map(m =>
      '<div class="' + (m.role === 'user' ? 'u' : 'p') + '">' +
      (m.role === 'user' ? '主人: ' : PET_NAME + ': ') +
      String(m.text).replace(/</g, '&lt;') + '</div>'
    ).join('') + (pet.chatTyping ? '<div class="p">' + PET_NAME + ': …</div>' : '');
    lines.scrollTop = lines.scrollHeight;
  }
  function chatAsk(text) {
    touch();
    pet.chat.push({ role: 'user', text: text });
    pet.chatTyping = true;
    renderChat();
    const done = reply => {
      if (!pet) return;
      pet.chatTyping = false;
      pet.chat.push({ role: 'pet', text: reply });
      renderChat();
      setPose('happy', 1500);
      pet.state.mood = clamp(pet.state.mood + 2);
      addExp(1);
      saveState(); render();
    };
    // 协议守卫: 仅 http(s) 环境尝试后端, 8 秒超时, 失败回退离线回复
    if (/^https?:$/.test(location.protocol) && typeof fetch === 'function') {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          persona: CHAT_PERSONA,
          messages: pet.chat.slice(-5).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
        }),
      }).then(r => r.json()).then(d => {
        clearTimeout(to);
        const t = d && (d.reply || d.text || d.message || d.content ||
          (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content));
        done(t ? String(t) : cannedReply(text));
      }).catch(() => { clearTimeout(to); done(cannedReply(text)); });
    } else {
      setTimeout(() => { if (pet) done(cannedReply(text)); }, 400 + Math.random() * 600);
    }
  }
  function cannedReply(text) {
    const t = text || '';
    if (/饿|吃|饭|食/.test(t)) return '偶也好饿呀~ 主人快喂偶吃东西嘛!';
    if (/玩|球|游戏/.test(t)) return '好耶! 偶最喜欢和主人玩啦~';
    if (/睡|困|晚安|觉/.test(t)) return '呼呼… 偶也有点困了呢~ 晚安主人!';
    if (/爱|喜欢|想你/.test(t)) return '偶也最爱主人啦! 啾咪~';
    if (/病|药|难受/.test(t)) return '呜呜… 要按时吃药多喝水哦~';
    if (/钱|元宝|穷/.test(t)) return '偶会努力打工赚元宝养家的!';
    if (/学习|作业|考试/.test(t)) return '学习加油! 偶也在上小学语文呢~';
    if (/旅游|出去|风景/.test(t)) return '偶好想去旅游呀! 听说海南岛可美了~';
    const d = ['嘿嘿，偶在认真听呢~', '主人最好啦!', '今天也要元气满满哦~', '偶想你了啦~', '和主人聊天最开心了!'];
    return d[Math.floor(Math.random() * d.length)];
  }

  /* ---------------- 打工 (60秒, 工作动画, 不可互动, 冷却 3 分钟) ---------------- */
  function startJob(job) {
    touch();
    if (busyBlock() || sleepBlock()) return;
    if (isSick()) { pet.say('偶生病了，打不了工…'); return; }
    const s = pet.state;
    if (job.reqEdu && s.edu < job.reqEdu) { pet.say('需要学历 Lv.' + job.reqEdu + ' 才能做' + job.name + '哦~'); return; }
    const cd = s.workCD || 0;
    if (Date.now() < cd) { pet.say('打工太累啦，休息 ' + Math.ceil((cd - Date.now()) / 1000) + ' 秒再去吧~'); return; }
    pet.busy = { type: 'work', name: job.name };
    pet.wrap.classList.remove('walk', 'jump', 'talk', 'look', 'dance');
    pet.wrap.classList.add('work');
    pet.tool.textContent = job.icon;
    pet.tool.classList.add('swing');
    pet.tool.style.display = 'block';
    pet.say('偶去' + job.name + '啦！(' + job.sec + '秒)', 3500);
    XP.sound('ding');
    pet.busyTimer = setTimeout(() => {
      if (!pet) return;
      pet.busy = null;
      pet.wrap.classList.remove('work');
      pet.tool.style.display = 'none';
      pet.tool.classList.remove('swing');
      s.yuanbao += job.pay;
      for (const k in job.cost) s[k] = clamp(s[k] - job.cost[k]);
      s.workCD = Date.now() + WORK_CD_MS;
      addExp(8);
      pet.jump();
      pet.say('打工完成！赚了 ' + job.pay + ' 元宝~ 💰', 4000);
      XP.sound('tada');
      saveState(); render();
      scheduleAction();
    }, job.sec * 1000);
    saveState(); render();
  }

  /* ---------------- 学习 (Lv3解锁, 45秒, 学历+1 经验+10, 每日2次) ---------------- */
  function startStudy(course) {
    touch();
    if (busyBlock() || sleepBlock()) return;
    if (isSick()) { pet.say('偶生病了，学不进去…'); return; }
    const s = pet.state;
    if (s.level < 3) { pet.say('Lv.3 才能学习哦~'); return; }
    if (s.studyDay !== todayStr()) { s.studyDay = todayStr(); s.studyCount = 0; }
    if (s.studyCount >= STUDY_LIMIT) { pet.say('今天学够啦，明天再学~'); return; }
    pet.busy = { type: 'study', name: '学习' };
    pet.wrap.classList.remove('walk', 'jump', 'talk', 'look', 'dance');
    pet.wrap.classList.add('study');
    pet.tool.textContent = '🎓';
    pet.tool.classList.remove('swing');
    pet.tool.style.display = 'block';
    pet.say('偶在认真上' + course.name + '…(' + course.sec + '秒)', 3500);
    XP.sound('ding');
    pet.busyTimer = setTimeout(() => {
      if (!pet) return;
      pet.busy = null;
      pet.wrap.classList.remove('study');
      pet.tool.style.display = 'none';
      s.studyCount++;
      s.edu += course.edu;
      addExp(course.exp);
      pet.jump();
      pet.say('学习完成！学历+1，偶更聪明啦~ 🎓', 4000);
      XP.sound('tada');
      saveState(); render();
      scheduleAction();
    }, course.sec * 1000);
    saveState(); render();
  }

  /* ---------------- 旅游 (Lv5解锁, 离开60秒, 回来带礼物) ---------------- */
  function startTravel() {
    touch();
    if (busyBlock() || sleepBlock()) return;
    if (isSick()) { pet.say('偶生病了，哪也不想去…'); return; }
    const s = pet.state;
    if (s.level < 5) { pet.say('Lv.5 才能去旅游哦~'); return; }
    if (s.travel) { pet.say('偶还在路上呢~'); return; }
    const dest = DESTS[Math.floor(Math.random() * DESTS.length)];
    s.travel = { end: Date.now() + TRAVEL_MS, dest: dest };
    beginTravelVisual(dest, s.travel.end, false);
    saveState();
  }
  function beginTravelVisual(dest, end, resumed) {
    pet.traveling = true;
    clearTimeout(pet.actionTimer);
    if (resumed) {
      pet.el.style.display = 'none';
    } else {
      pet.say('偶去' + dest + '旅游啦~ 60秒后回来！', 3500);
      pet.travelHideTimer = setTimeout(() => { if (pet) pet.el.style.display = 'none'; }, 3000);
    }
    pet.travelTimer = setTimeout(() => completeTravel(false), Math.max(0, end - Date.now()));
  }
  function completeTravel(silent) {
    if (!pet) return;
    const s = pet.state;
    const tr = s.travel;
    if (!tr) { pet.traveling = false; return; }
    clearTimeout(pet.travelTimer);
    clearTimeout(pet.travelHideTimer);
    pet.el.style.display = '';
    pet.traveling = false;
    s.travel = null;
    // 随机礼物: 元宝 20~80 / 食物 / 经验
    const r = Math.random();
    let giftText;
    if (r < 0.4) {
      const y = 20 + Math.floor(Math.random() * 61);
      s.yuanbao += y;
      giftText = '给你带了 ' + y + ' 元宝！';
    } else if (r < 0.75) {
      const foods = Object.keys(ITEMS).filter(k => ITEMS[k].cat === 'food');
      const f = foods[Math.floor(Math.random() * foods.length)];
      addBag(f, 1);
      giftText = '给你带了' + ITEMS[f].name + '！';
    } else {
      const e = 10 + Math.floor(Math.random() * 11);
      addExp(e);
      giftText = '长了 ' + e + ' 点见识！';
    }
    pet.say('偶从' + tr.dest + '回来啦！' + giftText, 5500);
    pet.jump();
    XP.sound('tada');
    saveState(); render();
    scheduleAction();
  }

  /* ---------------- 睡觉 / 退出 ---------------- */
  function toggleSleep() {
    if (pet.busy) { busyBlock(); return; }
    pet.sleeping = !pet.sleeping;
    if (pet.sleeping) {
      pet.wrap.classList.remove('walk', 'talk', 'jump', 'look', 'dance');
      pet.say('晚安，主人… zzz');
    } else {
      pet.say('嗯？天亮啦？早安主人！');
      pet.jump();
      scheduleAction();
    }
    applySprite();
    saveState(); render();
  }
  function doExit() {
    if (!confirm('确定要让宠物回家吗？\n下次可从 QQ 面板「宠物」按钮再次召唤。')) return;
    destroy();
  }

  /* ---------------- 商店窗口 ---------------- */
  function openShopWin() {
    touch();
    if (shopWin && !shopWin.closed) { shopWin.focus(); refreshShopWin(); return; }
    shopWin = XP.createWindow({ title: '宠物商店', icon: '🛒', width: 360, height: 420, resizable: false });
    shopWin.on('close', () => { shopWin = null; });
    refreshShopWin();
  }
  function refreshShopWin() {
    if (!shopWin || shopWin.closed || !pet) return;
    const s = pet.state;
    const w = shopWin.body;
    w.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'app-qp-shop';
    const top = document.createElement('div');
    top.className = 'sh-top';
    top.innerHTML = '<span>🛒 宠物商店</span><span>💰 ' + s.yuanbao + ' 元宝</span>';
    box.appendChild(top);
    SHOP_CATS.forEach(c => {
      const h = document.createElement('div');
      h.className = 'sh-cat';
      h.textContent = c.name;
      box.appendChild(h);
      if (c.cat === 'toy') {
        box.appendChild(shopRow(TOY_BALL.icon + ' ' + TOY_BALL.name, TOY_BALL.eff, TOY_BALL.price, () => buyToy()));
      } else {
        Object.keys(ITEMS).filter(k => ITEMS[k].cat === c.cat).forEach(k => {
          const it = ITEMS[k];
          box.appendChild(shopRow(it.icon + ' ' + it.name, it.eff + ' · 持有×' + (s.bag[k] || 0), it.price, () => buyItem(k)));
        });
      }
    });
    w.appendChild(box);
  }
  function shopRow(name, eff, price, onBuy) {
    const row = document.createElement('div');
    row.className = 'sh-row';
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.innerHTML = name + '<small>' + eff + '</small>';
    const pr = document.createElement('div');
    pr.className = 'pr';
    pr.textContent = price + ' 元宝';
    const btn = document.createElement('button');
    btn.textContent = '购买';
    btn.addEventListener('click', onBuy);
    row.appendChild(nm); row.appendChild(pr); row.appendChild(btn);
    return row;
  }
  function buyItem(id) {
    const it = ITEMS[id];
    if (!it) return;
    const s = pet.state;
    if (s.yuanbao < it.price) {
      pet.say('元宝不够啦，快去打工赚吧~');
      XP.sound('error');
      if (shopWin && !shopWin.closed) shopWin.shake();
      return;
    }
    s.yuanbao -= it.price;
    addBag(id, 1);
    pet.say('买到' + it.name + '啦！放入背包~');
    XP.sound('ding');
    saveState(); render(); refreshShopWin();
  }
  function buyToy() {
    const s = pet.state;
    if (s.yuanbao < TOY_BALL.price) {
      pet.say('元宝不够啦，快去打工赚吧~');
      XP.sound('error');
      if (shopWin && !shopWin.closed) shopWin.shake();
      return;
    }
    s.yuanbao -= TOY_BALL.price;
    s.ballBonus += 2;
    pet.say('买到皮球！每天能多玩 2 次球啦~ 🎾');
    XP.sound('ding');
    saveState(); render(); refreshShopWin();
  }

  /* ---------------- 状态窗口 ---------------- */
  function openStatusWin() {
    if (statusWin && !statusWin.closed) { statusWin.focus(); refreshStatusWin(); return; }
    statusWin = XP.createWindow({ title: '宠物状态', icon: '🐾', width: 320, height: 420, resizable: false });
    statusWin.on('close', () => { statusWin = null; });
    refreshStatusWin();
  }
  function refreshStatusWin() {
    if (!statusWin || statusWin.closed || !pet) return;
    const s = pet.state;
    const adopt = new Date(s.adopt);
    const days = Math.max(0, Math.floor((Date.now() - s.adopt) / 86400000));
    const bagText = Object.keys(ITEMS).filter(k => (s.bag[k] || 0) > 0)
      .map(k => ITEMS[k].icon + ITEMS[k].name + '×' + s.bag[k]).join('，') || '空空如也';
    const w = statusWin.body;
    w.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'app-qp-statwin';
    box.innerHTML =
      '<div class="sw-head"><div class="emo">' + (isSick() ? '🤒' : pet.sleeping ? '😴' : '🐧') + '</div>' +
      '<div><div class="nm">' + PET_NAME + (s.level >= 10 ? ' 👑' : '') + '</div><div class="lv">等级 Lv.' + s.level +
      ' · ' + petTitle(s.level) + ' · ' +
      (pet.traveling ? '旅游中' : pet.busy ? pet.busy.name + '中' : isSick() ? '生病中' : pet.sleeping ? '睡觉中' : '健康成长中') +
      '</div></div></div>' +
      '<div class="sw-row"><div class="lb">经验</div><div class="sw-bar"><i style="width:' +
      Math.round(s.exp / expNeed(s.level) * 100) + '%;background:#b07fd8"></i></div>' +
      '<div class="sw-v">' + s.exp + '/' + expNeed(s.level) + '</div></div>' +
      STAT_META.map(m =>
        '<div class="sw-row"><div class="lb">' + m.name + '</div><div class="sw-bar"><i style="width:' +
        clamp(s[m.key]) + '%;background:' + m.color + '"></i></div>' +
        '<div class="sw-v">' + Math.round(s[m.key]) + '</div></div>'
      ).join('') +
      '<div class="sw-foot">💰 元宝 ' + s.yuanbao + ' · 🎓 学历 Lv.' + s.edu + '<br>' +
      '🎒 背包: ' + bagText + '<br>' +
      '领养于 2005年' + (adopt.getMonth() + 1) + '月' + adopt.getDate() + '日<br>' +
      '已经陪伴你 ' + days + ' 天</div>';
    w.appendChild(box);
  }

  /* ---------------- 窗口缩放保护 / 销毁 ---------------- */
  function onResize() {
    if (!pet) return;
    const sz = petSize();
    const maxX = window.innerWidth - sz - 5, maxY = window.innerHeight - sz - 45;
    if (pet.x > maxX || pet.y > maxY) {
      pet.x = Math.max(0, Math.min(maxX, pet.x));
      pet.y = Math.max(0, Math.min(maxY, pet.y));
      pet.el.style.left = pet.x + 'px';
      pet.el.style.top = pet.y + 'px';
    }
  }
  function destroy() {
    if (!pet) return;
    saveState();
    closeMenu();
    clearTimeout(pet.actionTimer);
    clearTimeout(pet.bubbleTimer);
    clearTimeout(pet.animTimer);
    clearTimeout(pet.poseTimer);
    clearTimeout(pet.busyTimer);
    clearTimeout(pet.travelTimer);
    clearTimeout(pet.travelHideTimer);
    pet.danceTimers.forEach(clearTimeout);
    clearInterval(pet.decayTimer);
    window.removeEventListener('resize', onResize);
    if (statusWin && !statusWin.closed) statusWin.close();
    if (shopWin && !shopWin.closed) shopWin.close();
    statusWin = null; shopWin = null;
    pet.layer.remove();
    pet = null;
  }

  /* ---------------- 注册 ---------------- */
  XP.registerApp({ id: 'qpet', name: 'QQ宠物', icon: '🐾', desktop: false, open: open });
})();
