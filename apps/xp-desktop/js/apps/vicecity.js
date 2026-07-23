/* 侠盗飞车:罪恶都市 — 俯视角开放世界小游戏 (纯 Canvas 离线实现)
   功能: 人车分离(步行/驾车/抢车拽人) · NPC 交通车流+行人 AI · 车辆耐久/起火/爆炸
        血量护甲 + WASTED/BUSTED · 步行格斗 + 警察枪战 · 喷漆店消星 / 加油站修车
        4 任务链(剧情对话: 汤米/肯·罗森博格/兰斯) · 昼夜循环 · 区域特色 · 电台 · 小地图 */
(function () {
  'use strict';

  /* ============ 应用样式 (统一前缀 app-vc-) ============ */
  const style = document.createElement('style');
  style.textContent = [
    '.app-vc-wrap{position:relative;width:800px;height:480px;background:#0b1020;overflow:hidden;}',
    '.app-vc-canvas{display:block;outline:none;}',
    '.app-vc-focus{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:rgba(8,10,26,.55);color:#fff;cursor:pointer;text-align:center;text-shadow:0 0 10px #ff71ce,0 0 22px #01cdfe;letter-spacing:2px;}',
    '.app-vc-focus .ico{font-size:44px;}',
    '.app-vc-focus .t1{font-size:18px;font-weight:bold;}',
    '.app-vc-focus .t2{font-size:12px;opacity:.85;letter-spacing:1px;}',
  ].join('\n');
  document.head.appendChild(style);

  /* ============ 地图常量 ============ */
  const VIEW_W = 800, VIEW_H = 480;            // 视口尺寸
  const MAP_W = 2000, MAP_H = 1500;            // 城市地图尺寸
  const ROAD_W = 84;
  const ROADS_X = [220, 540, 860, 1180, 1500, 1650]; // 纵向道路(末条为海滨公路)
  const ROADS_Y = [180, 460, 740, 1020, 1300];       // 横向道路
  const BEACH_X0 = 1710, OCEAN_X0 = 1840;            // 东侧: 沙滩 / 海洋分界
  const CAR_R = 12;
  const PLAYER_MAX = 268, SAND_MAX = 130, POLICE_MAX = 242; // 极速 px/s (警车略慢于玩家)
  const FOOT_MAX = 118;                        // 步行速度 (远慢于开车)
  const SPAWN = { x: 1475, y: 1160, a: -Math.PI / 2 };       // Ocean View Hotel 门口
  const HOSPITAL = { x: 1180, y: 330, a: Math.PI };          // WASTED 重生点(医院门口路边)
  const DAY_LEN = 240;                         // 现实秒 / 游戏天 (约 4 分钟一天)
  const START_TIME = 12 * 3600;                // 1986-10-26 12:00 开局
  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']; // 1986-10-26 是周日

  /* ---------- 功能站点 (加油站/喷漆店/医院/枪店) ---------- */
  const SITES = {
    gas:      { x: 1300, y: 270, w: 120, h: 90 },   // 加油站: 停稳 2 秒修车 $100
    spray:    { x: 310, y: 1110, w: 110, h: 85 },   // Pay 'n' Spray: 停稳 2 秒消星 $200
    hospital: { x: 960, y: 260, w: 130, h: 95 },    // 医院 (实体建筑)
    ammu:     { x: 300, y: 820, w: 105, h: 80 },    // Ammu-Nation 枪店 (实体建筑)
  };
  const ARMOR_PICKUPS = [{ x: 435, y: 905 }, { x: 1680, y: 1150 }]; // 枪店旁 / 码头

  /* ---------- 任务链定义 ---------- */
  const DOCKS = { x: 1700, y: 1160 };   // 码头任务点
  const MALIBU = { x: 700, y: 430 };    // 马里布俱乐部门口
  const PKG_POINTS = [{ x: 370, y: 900 }, { x: 1620, y: 560 }, { x: 700, y: 1300 }]; // 快递点
  const MISSION_DEFS = [
    {
      name: '老司机', start: { x: 1512, y: 1212 },
      intro: [
        { who: '肯·罗森博格', text: '汤米! 你总算来了。听着, 码头那边有批货要人去接。' },
        { who: '肯·罗森博格', text: '门口有辆车, 90 秒内开到码头, 别把座驾撞报废了!' },
        { who: '汤米', text: '小菜一碟。' },
      ],
      outro: [
        { who: '肯·罗森博格', text: '漂亮! 老司机就是老司机。这是你的酬劳, $500。' },
        { who: '肯·罗森博格', text: '之后来市中心的报社旁找我, 有快递的活。' },
      ],
      reward: 500,
    },
    {
      name: '快递风云', start: { x: 1020, y: 988 },
      intro: [
        { who: '肯·罗森博格', text: '三个包裹, 三个地址, 每个都限时 60 秒。' },
        { who: '肯·罗森博格', text: '小心开车 —— 撞狠了包裹会掉, 得回头去捡!' },
      ],
      outro: [
        { who: '肯·罗森博格', text: '全部送达! $800 一分不少, 还有一套防弹衣。' },
        { who: '兰斯', text: '肯说你能干。来码头找我, 有笔硬仗要打。' },
      ],
      reward: 800,
    },
    {
      name: '清场', start: { x: 1622, y: 1155 },
      intro: [
        { who: '兰斯', text: '迪亚兹的人占了三条街, 开着红色帮车耀武扬威。' },
        { who: '兰斯', text: '把这 3 辆标红的帮派车全部撞毁! 他们会逃, 咬住别放。' },
      ],
      outro: [
        { who: '兰斯', text: '干得漂亮! 城里很快就知道谁说了算。$1200 拿去。' },
        { who: '兰斯', text: '风声紧了, 条子盯上我们了。来市中心, 商量跑路。' },
      ],
      reward: 1200,
    },
    {
      name: '大逃亡', start: { x: 955, y: 730 },
      intro: [
        { who: '兰斯', text: '完了, 三星通缉! 整个罪城的警察都在找你!' },
        { who: '兰斯', text: '冲到马里布俱乐部, 我安排好船了。喷漆店可以消星, 善用!' },
        { who: '汤米', text: '坐稳了 —— 我们杀出去!' },
      ],
      outro: [
        { who: '汤米', text: '呼…… 总算是甩掉了。' },
        { who: '兰斯', text: '汤米, 从今天起, 你就是罪恶都市的传奇!' },
        { who: '肯·罗森博格', text: '奖励 $2000! 旅馆门口给你留了辆金色跑车, 好好享受!' },
      ],
      reward: 2000,
    },
  ];

  /* ============ 工具函数 ============ */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function rectsOverlap(a, b, pad) {
    return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x &&
           a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
  }
  // 圆(车辆/人)与矩形(建筑)碰撞解算: 返回推出向量与法线, 无碰撞返回 null
  function circleRect(cx, cy, r, b) {
    const nx = clamp(cx, b.x, b.x + b.w);
    const ny = clamp(cy, b.y, b.y + b.h);
    const dx = cx - nx, dy = cy - ny;
    const d2 = dx * dx + dy * dy;
    if (d2 > r * r) return null;
    if (d2 > 0.0001) {
      const d = Math.sqrt(d2), push = r - d;
      return { px: dx / d * push, py: dy / d * push, nx: dx / d, ny: dy / d };
    }
    // 圆心在矩形内部: 从最近的边推出
    const left = cx - b.x, right = b.x + b.w - cx, top = cy - b.y, bot = b.y + b.h - cy;
    const m = Math.min(left, right, top, bot);
    if (m === left) return { px: -(r + left), py: 0, nx: -1, ny: 0 };
    if (m === right) return { px: r + right, py: 0, nx: 1, ny: 0 };
    if (m === top) return { px: 0, py: -(r + top), nx: 0, ny: -1 };
    return { px: 0, py: r + bot, nx: 0, ny: 1 };
  }

  /* ---------- 区域划分: 沙滩/市中心/小哈瓦那/码头/普通区 ---------- */
  function districtAt(x, y) {
    if (x >= 1500 && y >= 1020) return 'docks';
    if (x >= 1500) return 'beach';
    if (x >= 540 && x < 1180 && y >= 460 && y < 1020) return 'downtown';
    if (x < 540 && y >= 740) return 'havana';
    return 'midtown';
  }

  /* ---------- 路网图 (NPC 车辆导航用) ---------- */
  const NODE_LIST = [];
  const NODE_MAP = {};
  for (let i = 0; i < ROADS_X.length; i++) {
    for (let j = 0; j < ROADS_Y.length; j++) {
      const n = { i: i, j: j, x: ROADS_X[i], y: ROADS_Y[j] };
      NODE_MAP[i + ',' + j] = n;
      NODE_LIST.push(n);
    }
  }
  function nodeNeighbors(n) {
    const r = [];
    if (n.i > 0) r.push(NODE_MAP[(n.i - 1) + ',' + n.j]);
    if (n.i < ROADS_X.length - 1) r.push(NODE_MAP[(n.i + 1) + ',' + n.j]);
    if (n.j > 0) r.push(NODE_MAP[n.i + ',' + (n.j - 1)]);
    if (n.j < ROADS_Y.length - 1) r.push(NODE_MAP[n.i + ',' + (n.j + 1)]);
    return r;
  }

  /* ============ 城市生成 (固定种子, 每次启动布局相同) ============ */
  const WALLS = ['#e8b4c8', '#a8c8e8', '#e8d8a8', '#c8a8e0', '#a8d8c0', '#e0a890', '#b8b8d0', '#d0c0a0'];
  const NEONS = ['#ff71ce', '#01cdfe', '#f9f871', '#b967ff', '#05ffa1'];
  const SIGNS = ['💃Pole Position', '🍒Cherry Popper', '🌊Ocean Beach', '🎰North Point',
                 '☕小哈瓦那', '🍔Well Stacked', '💈理发店', '🛍️海滨商场', '🚕考夫曼车行', '🍹鸡尾酒吧'];

  function buildCity() {
    const rnd = mulberry32(19861026);
    const list = [
      // 地标
      { x: 1246, y: 1080, w: 178, h: 160, wall: '#d9c9a3', sign: 'Ocean View Hotel', neon: '#01cdfe', style: 'hotel' },
      { x: 606, y: 250, w: 190, h: 140, wall: '#b388c9', sign: '🌴Malibu Club', neon: '#ff71ce', style: 'club' },
      { x: 930, y: 800, w: 180, h: 155, wall: '#9fb8d1', sign: 'Vice City News', neon: '#f9f871', style: 'office', glass: true },
      // 医院 / 枪店
      { x: SITES.hospital.x, y: SITES.hospital.y, w: SITES.hospital.w, h: SITES.hospital.h, wall: '#eef0f2', sign: '🏥医院', neon: '#ff5b5b', style: 'hospital' },
      { x: SITES.ammu.x, y: SITES.ammu.y, w: SITES.ammu.w, h: SITES.ammu.h, wall: '#8a6d4b', sign: '🔫Ammu-Nation', neon: '#f9f871', style: 'shop' },
      // 海滩汽车旅馆 (艺术装饰风)
      { x: 1546, y: 430, w: 58, h: 110, wall: '#f7c5d6', sign: 'TIDES', neon: '#01cdfe', style: 'artdeco' },
      { x: 1546, y: 700, w: 58, h: 120, wall: '#c5e0f7', sign: 'COLONY', neon: '#ff71ce', style: 'artdeco' },
      // 码头仓库
      { x: 1546, y: 1180, w: 58, h: 56, wall: '#9a9a86', sign: '🚢码头', neon: '#f9f871', style: 'warehouse' },
    ];
    const reserved = list.concat([
      { x: SITES.gas.x - 6, y: SITES.gas.y - 6, w: SITES.gas.w + 12, h: SITES.gas.h + 12 },
      { x: SITES.spray.x - 6, y: SITES.spray.y - 6, w: SITES.spray.w + 12, h: SITES.spray.h + 12 },
    ]);
    const GLASS_WALLS = ['#3a4a5c', '#42566b', '#33424f', '#4a5a6e'];
    const HAVANA_WALLS = ['#e88a8a', '#e8c08a', '#8ad8c8', '#d8a8e0', '#e0d080', '#90b8e0'];
    for (let i = 0; i < ROADS_X.length - 1; i++) {
      for (let j = 0; j < ROADS_Y.length - 1; j++) {
        const bx0 = ROADS_X[i] + ROAD_W / 2 + 16;
        const by0 = ROADS_Y[j] + ROAD_W / 2 + 16;
        const bw = ROADS_X[i + 1] - ROADS_X[i] - ROAD_W - 32;
        const bh = ROADS_Y[j + 1] - ROADS_Y[j] - ROAD_W - 32;
        if (bw < 64 || bh < 64) continue;
        const cxm = (ROADS_X[i] + ROADS_X[i + 1]) / 2;
        const cym = (ROADS_Y[j] + ROADS_Y[j + 1]) / 2;
        const dist = districtAt(cxm, cym);
        if (dist === 'docks') continue; // 码头区只放固定集装箱
        const n = rnd() < 0.55 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const w = 70 + rnd() * Math.min(120, bw - 16);
          const h = 60 + rnd() * Math.min(100, bh - 16);
          const b = {
            x: bx0 + rnd() * (bw - w),
            y: by0 + rnd() * (bh - h),
            w: w, h: h, style: dist,
          };
          if (dist === 'downtown') { b.wall = GLASS_WALLS[(rnd() * GLASS_WALLS.length) | 0]; b.glass = true; }
          else if (dist === 'havana') { b.wall = HAVANA_WALLS[(rnd() * HAVANA_WALLS.length) | 0]; b.low = true; }
          else b.wall = WALLS[(rnd() * WALLS.length) | 0];
          if (rnd() < 0.3) {
            b.sign = SIGNS[(rnd() * SIGNS.length) | 0];
            b.neon = NEONS[(rnd() * NEONS.length) | 0];
          }
          let bad = false;
          for (const o of reserved) { if (rectsOverlap(b, o, 8)) { bad = true; break; } }
          if (!bad) list.push(b);
        }
      }
    }
    // 码头: 集装箱堆 (实体障碍)
    const cont = ['#c0504d', '#4d79c0', '#d0b04d', '#5aa05a', '#8a8a8a', '#c07840'];
    const dockDefs = [
      [1726, 1046, 54, 32], [1726, 1086, 54, 32], [1726, 1126, 54, 32],
      [1726, 1166, 54, 32], [1726, 1206, 54, 32], [1726, 1246, 54, 32],
      [1788, 1066, 44, 28], [1788, 1102, 44, 28], [1788, 1138, 44, 28],
    ];
    dockDefs.forEach((d, i) => list.push({ x: d[0], y: d[1], w: d[2], h: d[3], wall: cont[i % cont.length], style: 'container' }));
    return list;
  }
  function buildPalms() {
    const list = [];
    for (let y = 50; y < MAP_H - 30; y += 78) list.push({ x: 1701, y: y });    // 海滨公路东侧
    for (let y = 90; y < MAP_H - 30; y += 104) list.push({ x: 1576, y: y });   // 海滨公路西侧绿化带
    for (let y = 120; y < 980; y += 130) list.push({ x: 1788, y: y });         // 沙滩上
    return list;
  }
  function buildGraffiti() {
    const rnd = mulberry32(555);
    const list = [];
    const cols = ['#ff71ce', '#01cdfe', '#f9f871', '#05ffa1', '#b967ff'];
    for (let i = 0; i < 14; i++) {
      list.push({ x: 120 + rnd() * 380, y: 800 + rnd() * 480, c: cols[(rnd() * cols.length) | 0], seed: (rnd() * 100000) | 0 });
    }
    return list;
  }
  const buildings = buildCity();
  const palms = buildPalms().filter(pm => !inBuilding(pm.x, pm.y));
  const graffiti = buildGraffiti();
  const CRANES = [{ x: 1760, y: 1012 }, { x: 1706, y: 1258 }];
  const STREETLIGHTS = [];
  for (const rx of ROADS_X) for (let y = 90; y < MAP_H - 40; y += 150) STREETLIGHTS.push({ x: rx + ROAD_W / 2 - 8, y: y });
  for (const ry of ROADS_Y) for (let x = 90; x < OCEAN_X0 - 40; x += 150) STREETLIGHTS.push({ x: x, y: ry - ROAD_W / 2 + 8 });
  function inBuilding(x, y) {
    for (const b of buildings) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
    }
    return false;
  }

  /* ============ 电台 (WebAudio 合成循环旋律, 3 个台) ============ */
  const NOTE = {
    c2: 65.41, d2: 73.42, e2: 82.41, g2: 98, a2: 110,
    c4: 261.63, d4: 293.66, e4: 329.63, f4: 349.23, g4: 392, a4: 440, b4: 493.88,
    c5: 523.25, d5: 587.33, e5: 659.25, g5: 783.99, a5: 880,
  };
  const STATIONS = [
    { name: '电台关闭' },
    {
      name: '闪光FM', bpm: 124, wave: 'square',
      seq: [NOTE.a4, 0, NOTE.c5, NOTE.e5, NOTE.a5, NOTE.e5, NOTE.c5, 0,
            NOTE.g4, 0, NOTE.b4, NOTE.d5, NOTE.g5, NOTE.d5, NOTE.b4, 0],
      bass: [NOTE.a2, NOTE.e2, NOTE.g2, NOTE.d2],
    },
    {
      name: '情感98.3', bpm: 80, wave: 'triangle',
      seq: [NOTE.d4, 0, NOTE.f4, 0, NOTE.a4, 0, NOTE.f4, 0,
            NOTE.c4, 0, NOTE.e4, 0, NOTE.g4, 0, NOTE.e4, 0],
      bass: [NOTE.d2, NOTE.c2],
    },
    {
      name: '狂野105', bpm: 96, wave: 'sawtooth',
      seq: [NOTE.e4, NOTE.e4, 0, NOTE.g4, NOTE.a4, 0, NOTE.a4, NOTE.g4,
            NOTE.e4, 0, NOTE.d4, NOTE.e4, NOTE.c4, 0, NOTE.d4, 0],
      bass: [NOTE.e2, NOTE.a2, NOTE.c2, NOTE.d2],
    },
  ];

  /* ============ 离线 Canvas 版引擎 (在线版不可用时的备用) ============ */
  function startOffline(container, win) {
    /* ---------- DOM ---------- */
    const wrap = XP.el('div', { class: 'app-vc-wrap' });
    const canvas = XP.el('canvas', {
      class: 'app-vc-canvas', width: VIEW_W, height: VIEW_H, tabindex: 0,
      onPointerdown: () => { ensureAudio(); canvas.focus(); },
      onFocus: () => focusEl.classList.add('hidden'),
      onBlur: () => { focusEl.classList.remove('hidden'); keys.up = keys.down = keys.left = keys.right = keys.hand = false; },
    });
    const focusEl = XP.el('div', { class: 'app-vc-focus' }, [
      XP.el('div', { class: 'ico', text: '🚗' }),
      XP.el('div', { class: 't1', text: '点击画面开始游戏' }),
      XP.el('div', { class: 't2', text: 'WASD/方向键 移动 · F 上/下车 · 空格 出拳/手刹 · R 电台 · Enter 推进对话' }),
    ]);
    focusEl.addEventListener('click', () => { ensureAudio(); canvas.focus(); });
    wrap.appendChild(canvas);
    wrap.appendChild(focusEl);
    container.appendChild(wrap);
    const ctx = canvas.getContext('2d');

    /* ---------- 游戏状态 ---------- */
    const LANE = ROAD_W * 0.24;                  // 车道偏移(靠右行驶)
    const SPRAY_COLORS = ['#ff4fa3', '#01cdfe', '#7CFC9B', '#ffd166', '#b967ff', '#ff7043', '#e8e8e8'];
    const keys = { up: false, down: false, left: false, right: false, hand: false };
    const player = { x: SPAWN.x, y: SPAWN.y, vx: 0, vy: 0, a: SPAWN.a, hp: 100, armor: 0, punchT: 0, punchCd: 0, walkT: 0, invuln: 0 };
    let onFoot = true, pcar = null;              // pcar: 玩家当前驾驶的车辆
    const cars = [];                             // 所有车辆(玩家车/警车/帮派车/NPC)
    const peds = [];                             // 行人
    const cops = [];                             // 步行警察
    const parts = [];                            // 粒子(烟/火/碎片/闪光)
    const splats = [], tracers = [], skids = [], msgs = [];
    const armorPacks = ARMOR_PICKUPS.map(p => ({ x: p.x, y: p.y, t: 0 }));
    let wanted = 0, money = 500;
    let escapeT = 0, bustT = 0, wantedCd = 0, crashCd = 0, spawnCd = 0, copSpawnCd = 0, trafficCd = 0;
    let mode = 'play';                           // 'play' | 'dialog' | 'wasted' | 'busted'
    let modeT = 0;                               // wasted/busted 计时
    let dialog = null;                           // { lines, i, onDone }
    let gameTime = START_TIME, dayCount = 0;
    let gasT = 0, sprayT = 0;                    // 加油站/喷漆店 停稳计时
    let jackT = 0, jackCar = null;               // 抢车拽人动画
    let time = 0, last = performance.now(), rafId = 0, closed = false, pausedNow = true;
    let audioCtx = null, audioOn = false, station = 0, step = 0, nextNoteTime = 0, radioTimer = null;

    // 任务链状态机: idx 当前任务序号, state 'marker'(前往接取) / 'active'(进行中)
    const MS = { idx: 0, state: 'marker', timer: 0, pkg: 0, dropped: null, gangs: [], goldSpawned: false };

    /* ---------- 实体位置访问 ---------- */
    function px() { return onFoot ? player.x : pcar.x; }
    function py() { return onFoot ? player.y : pcar.y; }
    function pspeed() { return onFoot ? Math.hypot(player.vx, player.vy) : Math.hypot(pcar.vx, pcar.vy); }

    /* ---------- 消息 ---------- */
    function addMsg(text, color) {
      msgs.push({ text: text, color: color || '#fff', t: 3.4 });
      while (msgs.length > 4) msgs.shift();
    }

    /* ---------- 行人 ---------- */
    const PED_COLORS = ['#e05656', '#56a0e0', '#e0c056', '#7ed07e', '#c07ed0', '#e08040', '#f0f0f0'];
    const BEACH_COLORS = ['#ff8fb1', '#ffd166', '#06d6a0', '#ef476f'];
    function newPedPos(minDist) {
      for (let i = 0; i < 30; i++) {
        const x = 40 + Math.random() * (OCEAN_X0 - 90);
        const y = 40 + Math.random() * (MAP_H - 80);
        if (inBuilding(x, y)) continue;
        if (minDist && Math.hypot(x - px(), y - py()) < minDist) continue;
        return { x: x, y: y };
      }
      return { x: 100, y: 100 };
    }
    function spawnPed(far) {
      const pos = newPedPos(far ? 420 : 0);
      const d = districtAt(pos.x, pos.y);
      peds.push({
        x: pos.x, y: pos.y, dir: Math.random() * 6.2832,
        t: 1 + Math.random() * 4, spd: (d === 'beach' ? 12 : 20) + Math.random() * 16,
        color: d === 'beach' ? BEACH_COLORS[(Math.random() * BEACH_COLORS.length) | 0] : PED_COLORS[(Math.random() * PED_COLORS.length) | 0],
        state: 'walk', downT: 0, atkCd: 0, panicT: 0, thrown: 0, angry: false,
      });
    }
    for (let i = 0; i < 34; i++) spawnPed(false);

    /* ---------- 车辆 ---------- */
    const CAR_COLORS = ['#e8e8e8', '#3a7bd5', '#d53a3a', '#3ad57b', '#d5b83a', '#8a3ad5', '#d57b3a', '#2b2f36', '#39c5c5'];
    function makeCar(x, y, a, kind, color) {
      return {
        x: x, y: y, a: a, vx: 0, vy: 0, kind: kind, color: color,
        skin: kind === 'police' ? 'police' : null,
        hp: 100, burn: 0, driver: null, ai: false, cruise: 0,
        tgt: null, from: null, stuckT: 0, lastX: x, lastY: y,
        turnSig: 0, dead: false, maxSpdMul: 1,
      };
    }
    function trafficCount() { let n = 0; for (const c of cars) if (c.kind === 'civil' && c.ai) n++; return n; }
    function spawnTraffic() {
      for (let tries = 0; tries < 24; tries++) {
        const n = NODE_LIST[(Math.random() * NODE_LIST.length) | 0];
        const d = Math.hypot(n.x - px(), n.y - py());
        if (d < 320 || d > 950) continue;
        const dist = districtAt(n.x, n.y);
        // 区域车流密度: 市中心密, 沙滩稀
        const w = dist === 'downtown' ? 1 : dist === 'beach' ? 0.3 : dist === 'havana' ? 0.8 : dist === 'docks' ? 0.5 : 0.7;
        if (Math.random() > w) continue;
        const nb = nodeNeighbors(n);
        const to = nb[(Math.random() * nb.length) | 0];
        const c = makeCar(n.x, n.y, Math.atan2(to.y - n.y, to.x - n.x), 'civil', CAR_COLORS[(Math.random() * CAR_COLORS.length) | 0]);
        c.ai = true; c.driver = 'npc'; c.tgt = to; c.from = n;
        c.cruise = (dist === 'beach' ? 80 : 110) + Math.random() * 50;
        cars.push(c);
        return true;
      }
      return false;
    }
    // 玩家的第一辆车 (停在旅馆门口) + 路边可抢的停车
    cars.push(makeCar(1505, 1180, -Math.PI / 2, 'civil', '#ff4fa3'));
    const PARKED = [[300, 180, 0], [860, 1300, Math.PI], [1180, 740, -Math.PI / 2], [1650, 300, Math.PI], [540, 1020, 0]];
    PARKED.forEach((d, i) => cars.push(makeCar(d[0], d[1], d[2], 'civil', CAR_COLORS[(i + 3) % CAR_COLORS.length])));
    for (let i = 0; i < 15; i++) spawnTraffic();

    function nearPlayerPos() {
      for (let i = 0; i < 14; i++) {
        const ang = Math.random() * 6.2832;
        const d = 360 + Math.random() * 90;
        const x = clamp(px() + Math.cos(ang) * d, 30, OCEAN_X0 - 30);
        const y = clamp(py() + Math.sin(ang) * d, 30, MAP_H - 30);
        if (!inBuilding(x, y)) return { x: x, y: y };
      }
      return { x: clamp(px() - 380, 30, OCEAN_X0 - 30), y: py() };
    }

    /* ---------- 伤害 / 死亡 / 通缉 ---------- */
    function hurt(dmg) {
      if (mode !== 'play' || dmg <= 0) return;
      const aa = Math.min(player.armor, dmg * 0.6);   // 护甲吸收 60%
      player.armor -= aa;
      player.hp -= dmg - aa;
      if (player.hp <= 0) { player.hp = 0; doWasted(); }
    }
    function doWasted() {
      mode = 'wasted'; modeT = 3.2;
      money = Math.max(0, money - 300);
      XP.sound('error');
    }
    function doBusted() {
      mode = 'busted'; modeT = 2.8;
      money = Math.max(0, money - 200);
      XP.sound('error');
    }
    function respawnAtHospital() {
      onFoot = true;
      if (pcar) { pcar.driver = null; pcar.turnSig = 0; pcar = null; }
      player.x = HOSPITAL.x; player.y = HOSPITAL.y; player.a = HOSPITAL.a;
      player.vx = player.vy = 0; player.hp = 100; player.armor = 0; player.invuln = 1.5;
      clearWanted(null);
      failMission('你在医院醒来, 任务失败了');
      addMsg('WASTED — 医疗费 $300, 通缉清零', '#7CFC9B');
      mode = 'play';
    }
    function respawnAtHotel() {
      onFoot = true;
      if (pcar) { pcar.driver = null; pcar.turnSig = 0; pcar = null; }
      player.x = SPAWN.x; player.y = SPAWN.y; player.a = SPAWN.a;
      player.vx = player.vy = 0; player.invuln = 1.5;
      clearWanted(null);
      failMission('你被保释出来, 任务失败了');
      addMsg('BUSTED — 罚款 $200, 通缉清零', '#7CFC9B');
      mode = 'play';
    }
    function addWanted() {
      if (wanted >= 6) return;
      wanted++;
      escapeT = 0;
      spawnCd = Math.min(spawnCd, 0.6);
      XP.sound('error');
      addMsg('通缉等级上升: ' + wanted + ' ★', '#ff5b5b');
    }
    function clearWanted(msg) {
      wanted = 0; escapeT = 0; bustT = 0;
      for (let i = cars.length - 1; i >= 0; i--) if (cars[i].kind === 'police') cars.splice(i, 1);
      cops.length = 0;
      if (msg) addMsg(msg, '#7CFC9B');
    }
    function updateWanted(dt) {
      if (wanted < 1) { escapeT = 0; bustT = 0; return; }
      let minD = Infinity;
      for (const c of cars) if (c.kind === 'police') minD = Math.min(minD, Math.hypot(px() - c.x, py() - c.y));
      for (const c of cops) minD = Math.min(minD, Math.hypot(px() - c.x, py() - c.y));
      // 与所有警力距离都 > 300 持续 10 秒 -> 通缉 -1
      if (minD > 300) {
        escapeT += dt;
        if (escapeT >= 10) {
          escapeT = 0;
          wanted--;
          if (wanted === 0) clearWanted('通缉解除! 安全了');
          else addMsg('摆脱追踪! 通缉降至 ' + wanted + ' ★', '#ffd166');
        }
      } else escapeT = 0;
      // 被警察围住且自身几乎静止 3 秒 -> BUSTED
      const sp = pspeed();
      if (minD < (onFoot ? 26 : 42) && sp < 12) {
        bustT += dt;
        if (bustT >= 3) doBusted();
      } else bustT = Math.max(0, bustT - dt);
    }

    /* ---------- 车辆耐久 / 起火 / 爆炸 ---------- */
    function damageCar(c, dmg) {
      if (c.burn > 0 || dmg <= 0) return;
      c.hp -= dmg;
      if (c.hp <= 0) ignite(c);
    }
    function ignite(c) {
      c.hp = 0;
      c.burn = 3.0;
      if (c === pcar) addMsg('引擎起火! 3 秒后爆炸, 快按 F 跳车!', '#ff7043');
    }
    function explode(c) {
      c.dead = true;
      win.shake();
      XP.sound('error');
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * 6.2832, sp = 60 + Math.random() * 220;
        parts.push({ x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0.5 + Math.random() * 0.5, life: 1, color: i % 2 ? '#ffcc33' : '#ff5522', size: 3 + Math.random() * 4 });
      }
      parts.push({ x: c.x, y: c.y, vx: 0, vy: 0, t: 0.35, life: 0.35, color: 'flash', size: 10 });
      // 波及玩家
      if (pcar === c && !onFoot) {
        hurt(65);
        ejectFromCar(c);
        addMsg('你的车爆炸了! 你被气浪掀飞', '#ff7043');
      } else {
        const d = Math.hypot(px() - c.x, py() - c.y);
        if (d < 95) {
          const dmg = (1 - d / 95) * 50;
          hurt(dmg);
          if (onFoot && d > 0.1) { player.vx += (player.x - c.x) / d * 120; player.vy += (player.y - c.y) / d * 120; }
          addMsg('爆炸波及! -' + Math.round(dmg) + ' HP', '#ff7043');
        }
        if (pcar === c) pcar = null; // 玩家此前已下车
      }
      // 波及附近车辆 (连锁)
      for (const o of cars) {
        if (o === c || o.burn > 0 || o.dead) continue;
        const d = Math.hypot(o.x - c.x, o.y - c.y);
        if (d < 75) damageCar(o, 45 * (1 - d / 75));
      }
    }
    function ejectFromCar(c) {
      player.x = clamp(c.x - Math.cos(c.a) * 26, 10, OCEAN_X0 - 10);
      player.y = clamp(c.y - Math.sin(c.a) * 26, 10, MAP_H - 10);
      player.vx = -Math.cos(c.a) * 150; player.vy = -Math.sin(c.a) * 150;
      player.a = c.a + Math.PI;
      onFoot = true; pcar = null; c.driver = null;
    }

    /* ---------- 上车 / 下车 / 抢车 ---------- */
    function tryEnterCar() {
      if (!onFoot || jackT > 0 || mode !== 'play') return;
      let best = null, bd = 34;
      for (const c of cars) {
        if (c.dead) continue;
        const d = Math.hypot(c.x - player.x, c.y - player.y);
        if (d < bd) { bd = d; best = c; }
      }
      if (!best) { addMsg('附近没有可上的车', '#bbbbbb'); return; }
      if (best.burn > 0) { addMsg('车着火了, 不能上!', '#ff7043'); return; }
      const wasGang = best.driver === 'gang';
      if (best.driver === 'npc' || wasGang) {
        // 抢车: 把司机拽下来 (0.55 秒动画)
        jackCar = best; jackT = 0.55;
        const side = Math.random() < 0.5 ? 1 : -1;
        const ox = clamp(best.x + Math.cos(best.a + Math.PI / 2) * 22 * side, 10, OCEAN_X0 - 10);
        const oy = clamp(best.y + Math.sin(best.a + Math.PI / 2) * 22 * side, 10, MAP_H - 10);
        peds.push({
          x: ox, y: oy, dir: Math.atan2(oy - player.y, ox - player.x) + Math.PI,
          t: 1, spd: 110, color: wasGang ? '#b02020' : PED_COLORS[(Math.random() * PED_COLORS.length) | 0],
          state: 'flee', downT: 0, atkCd: 0, panicT: 4, thrown: 0.5, angry: false,
        });
        best.driver = null; best.ai = null;
        addMsg(wasGang ? '你把帮派份子拽下了车!' : '你把司机拽下了车!', '#ffd166');
      } else {
        if (best.kind === 'police') { addWanted(); addMsg('你抢了一辆警车! 通缉 +1', '#ff5b5b'); }
        enterCar(best);
      }
    }
    function enterCar(c) {
      onFoot = false; pcar = c; c.driver = 'player';
      if (c.kind === 'police') { c.kind = 'civil'; c.skin = 'police'; } // 抢来的警车不再算警力
      else if (c.kind === 'gang') c.kind = 'civil';                     // 抢下帮派车也算"解决"
      c.vx *= 0.3; c.vy *= 0.3;
      XP.sound('click');
    }
    function tryExitCar() {
      if (onFoot || !pcar || mode !== 'play') return;
      if (pspeed() > 45) { addMsg('车速太快, 无法下车!', '#bbbbbb'); return; }
      const c = pcar;
      const sides = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];
      let placed = false;
      for (const s of sides) {
        const ex = c.x + Math.cos(c.a + s) * 24, ey = c.y + Math.sin(c.a + s) * 24;
        if (ex < 10 || ex > OCEAN_X0 - 10 || ey < 10 || ey > MAP_H - 10 || inBuilding(ex, ey)) continue;
        player.x = ex; player.y = ey; player.a = c.a + s; placed = true; break;
      }
      if (!placed) { addMsg('四周空间不够, 无法下车', '#bbbbbb'); return; }
      onFoot = true; pcar = null;
      c.driver = null; c.turnSig = 0;
      player.vx = c.vx * 0.2; player.vy = c.vy * 0.2;
      XP.sound('click');
    }

    /* ---------- 步行战斗 ---------- */
    function punch() {
      if (!onFoot || jackT > 0 || player.punchCd > 0 || mode !== 'play') return;
      player.punchCd = 0.45; player.punchT = 0.22;
      XP.sound('click');
      const fx = Math.cos(player.a), fy = Math.sin(player.a);
      let hit = false;
      for (const ped of peds) {
        if (ped.state === 'down') continue;
        const dx = ped.x - player.x, dy = ped.y - player.y;
        const d = Math.hypot(dx, dy);
        if (d < 24 && (dx * fx + dy * fy) / (d || 1) > 0.2) {
          knockPed(ped, dx / (d || 1), dy / (d || 1));
          hit = true;
        }
      }
      for (const c of cops) {
        if (c.downT > 0) continue;
        const dx = c.x - player.x, dy = c.y - player.y;
        const d = Math.hypot(dx, dy);
        if (d < 24 && (dx * fx + dy * fy) / (d || 1) > 0.2) {
          c.downT = 4; c.shootCd = 2;
          addWanted(); addWanted();
          addMsg('你打倒了一名警察! 通缉 +2', '#ff5b5b');
          hit = true;
        }
      }
      if (hit) splats.push({ x: player.x + fx * 18, y: player.y + fy * 18, t: 0.5 });
    }
    function knockPed(ped, nx, ny) {
      ped.state = 'down'; ped.downT = 2.6;
      ped.x += nx * 8; ped.y += ny * 8;
      ped.angry = Math.random() < 0.35; // 起身后可能反击
    }

    /* ---------- 粒子 ---------- */
    function mkSmoke(x, y) { return { x: x, y: y, vx: (Math.random() - 0.5) * 10, vy: -12 - Math.random() * 10, t: 1.2, life: 1.2, color: 'smoke', size: 3 + Math.random() * 3 }; }
    function mkFire(x, y) { return { x: x, y: y, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 30, t: 0.4 + Math.random() * 0.3, life: 0.7, color: Math.random() < 0.5 ? '#ffcc33' : '#ff5522', size: 2 + Math.random() * 3 }; }
    function mkSpark(x, y) { const a = Math.random() * 6.2832; return { x: x, y: y, vx: Math.cos(a) * (60 + Math.random() * 120), vy: Math.sin(a) * (60 + Math.random() * 120), t: 0.3, life: 0.3, color: '#ffd966', size: 1.5 }; }
    function addSkid(c) {
      skids.push({ x: c.x - Math.cos(c.a) * 12, y: c.y - Math.sin(c.a) * 12, a: c.a, t: 4 });
      if (skids.length > 160) skids.shift();
    }
    function updateParts(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const pt = parts[i];
        pt.t -= dt;
        if (pt.t <= 0) { parts.splice(i, 1); continue; }
        pt.x += pt.vx * dt; pt.y += pt.vy * dt;
        pt.vx *= Math.pow(0.92, dt * 60); pt.vy *= Math.pow(0.92, dt * 60);
        if (pt.color === 'smoke') { pt.vy -= 6 * dt; pt.size += 6 * dt; }
      }
      for (let i = splats.length - 1; i >= 0; i--) { splats[i].t -= dt; if (splats[i].t <= 0) splats.splice(i, 1); }
      for (let i = tracers.length - 1; i >= 0; i--) { tracers[i].t -= dt; if (tracers[i].t <= 0) tracers.splice(i, 1); }
      for (let i = skids.length - 1; i >= 0; i--) { skids[i].t -= dt; if (skids[i].t <= 0) skids.splice(i, 1); }
      for (let i = msgs.length - 1; i >= 0; i--) { msgs[i].t -= dt; if (msgs[i].t <= 0) msgs.splice(i, 1); }
    }

    /* ---------- 玩家步行: 移动+朝向 / 建筑碰撞 / 被车撞 ---------- */
    function updateOnFoot(dt) {
      let mx = 0, my = 0;
      if (keys.up) my -= 1;
      if (keys.down) my += 1;
      if (keys.left) mx -= 1;
      if (keys.right) mx += 1;
      const m = Math.hypot(mx, my);
      const onSand = player.x > BEACH_X0;
      const spd = FOOT_MAX * (onSand ? 0.85 : 1);
      if (m > 0) {
        mx /= m; my /= m;
        player.vx = mx * spd; player.vy = my * spd;
        player.a = Math.atan2(my, mx);
        player.walkT += dt * 10;
      } else { player.vx = player.vy = 0; }
      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.x = clamp(player.x, 8, OCEAN_X0 - 8);
      player.y = clamp(player.y, 8, MAP_H - 8);
      for (const b of buildings) {
        if (player.x < b.x - 10 || player.x > b.x + b.w + 10 || player.y < b.y - 10 || player.y > b.y + b.h + 10) continue;
        const res = circleRect(player.x, player.y, 7, b);
        if (res) { player.x += res.px; player.y += res.py; }
      }
      if (player.punchT > 0) player.punchT -= dt;
      if (player.punchCd > 0) player.punchCd -= dt;
      if (player.invuln > 0) player.invuln -= dt;
      // 与车辆交互: 快车撞伤, 慢车/停车挡路
      for (const c of cars) {
        if (c.dead) continue;
        const dx = player.x - c.x, dy = player.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d >= CAR_R + 7) continue;
        const sp = Math.hypot(c.vx, c.vy);
        const nx = dx / (d || 1), ny = dy / (d || 1);
        if (sp > 50 && c.burn <= 0 && player.invuln <= 0) {
          const dmg = sp * 0.14;
          hurt(dmg);
          player.x += nx * 16; player.y += ny * 16;
          player.invuln = 0.8;
          splats.push({ x: player.x, y: player.y, t: 0.9 });
          win.shake();
          addMsg('你被车撞了! -' + Math.round(dmg) + ' HP', '#ff8080');
        } else {
          player.x = c.x + nx * (CAR_R + 7);
          player.y = c.y + ny * (CAR_R + 7);
        }
      }
    }

    /* ---------- 玩家驾驶: 惯性物理 + 建筑碰撞(沿墙滑动) + 耐久扣减 + 沙滩减速 ---------- */
    function updateDriving(dt) {
      const c = pcar;
      const cosA = Math.cos(c.a), sinA = Math.sin(c.a);
      let fwd = c.vx * cosA + c.vy * sinA;
      let lat = -c.vx * sinA + c.vy * cosA;
      const onSand = c.x > BEACH_X0;
      const maxSpd = (onSand ? SAND_MAX : PLAYER_MAX) * c.maxSpdMul;
      if (keys.up) fwd += (onSand ? 160 : 240) * dt;
      if (keys.down) fwd -= (fwd > 0 ? 340 : 160) * dt;   // 前进时刹车, 静止时倒车
      if (keys.hand) fwd *= Math.pow(0.94, dt * 60);       // 手刹
      fwd = clamp(fwd, -maxSpd * 0.45, maxSpd);
      fwd *= Math.pow(onSand ? 0.90 : 0.986, dt * 60);     // 阻力(沙滩更大)
      lat *= Math.pow(keys.hand ? 0.80 : 0.85, dt * 60);   // 侧向抓地(手刹时甩尾)
      const sp = Math.hypot(fwd, lat);
      const grip = clamp(sp / 55, 0, 1) * (fwd >= 0 ? 1 : -1) * (keys.hand ? 1.5 : 1);
      if (keys.left) { c.a -= 2.6 * dt * grip; c.turnSig = -1; }
      else if (keys.right) { c.a += 2.6 * dt * grip; c.turnSig = 1; }
      else c.turnSig = 0;
      c.vx = fwd * Math.cos(c.a) - lat * Math.sin(c.a);
      c.vy = fwd * Math.sin(c.a) + lat * Math.cos(c.a);
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.x = clamp(c.x, CAR_R, OCEAN_X0 - CAR_R); // 海岸线不可驶入深海
      c.y = clamp(c.y, CAR_R, MAP_H - CAR_R);
      for (const b of buildings) {
        if (c.x < b.x - 16 || c.x > b.x + b.w + 16 || c.y < b.y - 16 || c.y > b.y + b.h + 16) continue;
        const res = circleRect(c.x, c.y, CAR_R, b);
        if (!res) continue;
        const into = c.vx * res.nx + c.vy * res.ny;
        c.x += res.px; c.y += res.py;
        if (into < 0) {
          c.vx -= into * res.nx; // 仅去掉指向墙内的速度分量 -> 沿墙滑动
          c.vy -= into * res.ny;
          const imp = -into;
          if (imp > 120) {
            damageCar(c, (imp - 120) * 0.05);
            onPlayerCrash(imp);
            if (crashCd <= 0) { win.shake(); crashCd = 0.8; }
            for (let i = 0; i < 4; i++) parts.push(mkSpark(c.x - cosA * 14, c.y - sinA * 14));
          }
        }
      }
      // 刹车痕
      if ((keys.down && fwd > 60) || (keys.hand && sp > 120)) addSkid(c);
    }
    // 玩家车辆受到冲击的钩子 (任务 2 包裹掉落)
    function onPlayerCrash(imp) {
      if (MS.idx === 1 && MS.state === 'active' && imp > 160 && !MS.dropped) {
        MS.dropped = {
          x: clamp(px() - Math.cos(pcar.a) * 34, 20, OCEAN_X0 - 20),
          y: clamp(py() - Math.sin(pcar.a) * 34, 20, MAP_H - 20),
        };
        addMsg('包裹掉落了! 回去捡 (紫色光柱)', '#c792ff');
        XP.sound('error');
      }
    }

    /* ---------- 车辆总更新: AI / 起火 / 碰撞 / 清理 / 车流补充 ---------- */
    function updateCars(dt) {
      for (const c of cars) {
        if (c.dead) continue;
        if (c.burn > 0) {
          c.burn -= dt;
          if (Math.random() < dt * 30) parts.push(mkFire(c.x + (Math.random() - 0.5) * 10, c.y + (Math.random() - 0.5) * 8));
          if (c.burn <= 0) { explode(c); continue; }
          if (c !== pcar) { c.vx *= Math.pow(0.9, dt * 60); c.vy *= Math.pow(0.9, dt * 60); c.x += c.vx * dt; c.y += c.vy * dt; continue; }
        } else if (c.hp < 30 && Math.random() < dt * 18) {
          parts.push(mkSmoke(c.x - Math.cos(c.a) * 12, c.y - Math.sin(c.a) * 12));
        }
        if (c === pcar) continue;           // 玩家车物理在 updateDriving
        if (c.kind === 'police') continue;  // 警车在 updatePoliceCars
        if (c.kind === 'gang') { updateGang(c, dt); continue; }
        if (c.ai) {
          updateTraffic(c, dt);
          // 远离玩家的交通车回收, 保持分布新鲜
          if (Math.hypot(c.x - px(), c.y - py()) > 1150) c.dead = true;
        } else {
          c.vx *= Math.pow(0.9, dt * 60); c.vy *= Math.pow(0.9, dt * 60);
          c.x += c.vx * dt; c.y += c.vy * dt;
        }
      }
      collideCars();
      for (let i = cars.length - 1; i >= 0; i--) if (cars[i].dead) cars.splice(i, 1);
      trafficCd -= dt;
      if (trafficCd <= 0) {
        trafficCd = 1.5;
        const n = trafficCount();
        if (n < 12) spawnTraffic();
        else if (n < 18 && Math.random() < 0.25) spawnTraffic();
      }
    }

    /* ---------- NPC 交通车: 沿路网格行驶, 路口随机转向, 避撞刹车 ---------- */
    function updateTraffic(c, dt) {
      const tx = c.tgt.x, ty = c.tgt.y;
      let dx = tx - c.x, dy = ty - c.y;
      const dist = Math.hypot(dx, dy) || 1;
      dx /= dist; dy /= dist;
      // 靠右行驶: 瞄准点带车道偏移
      const aimX = tx + dy * LANE, aimY = ty - dx * LANE;
      const desired = Math.atan2(aimY - c.y, aimX - c.x);
      let da = desired - c.a;
      while (da > Math.PI) da -= 6.2832;
      while (da < -Math.PI) da += 6.2832;
      c.a += clamp(da, -2.2 * dt, 2.2 * dt);
      c.turnSig = Math.abs(da) > 0.25 ? Math.sign(da) : 0;
      // 避撞: 前方有车/玩家则刹车
      let brake = false;
      const fx = Math.cos(c.a), fy = Math.sin(c.a);
      for (const o of cars) {
        if (o === c || o.dead || o.burn > 0) continue;
        const ox = o.x - c.x, oy = o.y - c.y;
        const fd = ox * fx + oy * fy;
        if (fd > 0 && fd < 52 && Math.abs(ox * fy - oy * fx) < 22) { brake = true; break; }
      }
      if (!brake && onFoot) {
        const ox = player.x - c.x, oy = player.y - c.y;
        const fd = ox * fx + oy * fy;
        if (fd > 0 && fd < 30 && Math.abs(ox * fy - oy * fx) < 14) brake = true;
      }
      const target = brake ? 0 : c.cruise;
      const sp = Math.hypot(c.vx, c.vy);
      const ns = sp + clamp(target - sp, -260 * dt, 200 * dt);
      c.vx = fx * ns; c.vy = fy * ns;
      c.x += c.vx * dt; c.y += c.vy * dt;
      // 到达路口 -> 随机转向 (不倒车)
      if (dist < 20) {
        const nb = nodeNeighbors(c.tgt);
        const opts = nb.filter(n => n !== c.from);
        const pool = opts.length ? opts : nb;
        const next = pool[(Math.random() * pool.length) | 0];
        c.from = c.tgt; c.tgt = next;
      }
    }

    /* ---------- 追击型车辆通用转向 (警车追 / 帮派车逃) ---------- */
    function seekCar(c, tx, ty, maxSpd, dt, flee) {
      let dx = tx - c.x, dy = ty - c.y;
      if (flee) { dx = -dx; dy = -dy; }
      let da = Math.atan2(dy, dx) - c.a;
      while (da > Math.PI) da -= 6.2832;
      while (da < -Math.PI) da += 6.2832;
      c.a += clamp(da, -2.3 * dt, 2.3 * dt);
      const sp = Math.hypot(c.vx, c.vy);
      const ns = Math.min(sp + 300 * dt, maxSpd);
      c.vx = Math.cos(c.a) * ns; c.vy = Math.sin(c.a) * ns;
      c.x += c.vx * dt; c.y += c.vy * dt;
      c.x = clamp(c.x, CAR_R, OCEAN_X0 - CAR_R);
      c.y = clamp(c.y, CAR_R, MAP_H - CAR_R);
      for (const b of buildings) {
        if (c.x < b.x - 16 || c.x > b.x + b.w + 16 || c.y < b.y - 16 || c.y > b.y + b.h + 16) continue;
        const res = circleRect(c.x, c.y, CAR_R, b);
        if (res) { c.x += res.px; c.y += res.py; }
      }
    }
    function updateGang(c, dt) {
      seekCar(c, px(), py(), 205, dt, true);
      // 卡住检测: 长时间几乎不动就强行转向
      if (Math.hypot(c.x - c.lastX, c.y - c.lastY) < 3) {
        c.stuckT += dt;
        if (c.stuckT > 1.2) { c.a += 2.2; c.stuckT = 0; }
      } else c.stuckT = 0;
      c.lastX = c.x; c.lastY = c.y;
    }

    /* ---------- 警车: 按通缉等级生成 + seek AI 追踪 + 部署步行警察 ---------- */
    function updatePoliceCars(dt) {
      const desired = wanted >= 1 ? Math.min(wanted, 4) : 0;
      spawnCd -= dt;
      let pcount = 0;
      for (const c of cars) if (c.kind === 'police') pcount++;
      if (pcount < desired && spawnCd <= 0) {
        const pos = nearPlayerPos();
        const c = makeCar(pos.x, pos.y, Math.random() * 6.2832, 'police', '#eef1f6');
        c.driver = 'police';
        cars.push(c);
        spawnCd = 2.2;
        pcount++;
      }
      if (pcount > desired) {
        let fi = -1, fd = -1;
        for (let i = 0; i < cars.length; i++) {
          if (cars[i].kind !== 'police') continue;
          const d = Math.hypot(px() - cars[i].x, py() - cars[i].y);
          if (d > fd) { fd = d; fi = i; }
        }
        if (fi >= 0) cars.splice(fi, 1);
      }
      for (const c of cars) {
        if (c.kind !== 'police' || c.burn > 0 || c === pcar) continue;
        const d0 = Math.hypot(px() - c.x, py() - c.y);
        if (d0 > 850) { const pos = nearPlayerPos(); c.x = pos.x; c.y = pos.y; }
        seekCar(c, px(), py(), POLICE_MAX, dt, false);
        // 碾压步行的玩家
        if (onFoot) {
          const d = Math.hypot(player.x - c.x, player.y - c.y);
          const sp = Math.hypot(c.vx, c.vy);
          if (d < CAR_R + 7 && sp > 50 && player.invuln <= 0) {
            hurt(sp * 0.12);
            player.invuln = 0.8;
            const nx = (player.x - c.x) / (d || 1), ny = (player.y - c.y) / (d || 1);
            player.x += nx * 16; player.y += ny * 16;
            splats.push({ x: player.x, y: player.y, t: 0.9 });
            win.shake();
          }
          // 玩家步行且警车靠近停稳 -> 警察下车步行追
          if (wanted >= 1 && d < 130 && sp < 30 && cops.length < Math.min(wanted + 1, 5) && copSpawnCd <= 0) {
            spawnCop(c.x + (Math.random() - 0.5) * 20, c.y + (Math.random() - 0.5) * 20);
            copSpawnCd = 1.5;
          }
        }
      }
    }

    /* ---------- 步行警察: 追击 / 通缉>=2 开枪(弹道线) / 近身逮捕 ---------- */
    function spawnCop(x, y) {
      cops.push({ x: clamp(x, 20, OCEAN_X0 - 20), y: clamp(y, 20, MAP_H - 20), dir: 0, shootCd: 1 + Math.random(), downT: 0 });
    }
    function updateCops(dt) {
      copSpawnCd -= dt;
      // 通缉>=1 且玩家步行: 从视野外补充步行警察
      const desiredCops = (wanted >= 1 && onFoot) ? Math.min(wanted, 3) : 0;
      if (cops.length < desiredCops && copSpawnCd <= 0) {
        const pos = nearPlayerPos();
        spawnCop(pos.x, pos.y);
        copSpawnCd = 2.5;
      }
      for (let i = cops.length - 1; i >= 0; i--) {
        const c = cops[i];
        if (c.downT > 0) { c.downT -= dt; continue; }
        const dx = player.x - c.x, dy = player.y - c.y;
        const d = Math.hypot(dx, dy) || 1;
        c.dir = Math.atan2(dy, dx);
        // 玩家上车或通缉消失: 警察撤退离场
        if ((!onFoot || wanted < 1) && d > 500) { cops.splice(i, 1); continue; }
        if (!onFoot && pcar) {
          const sp = Math.hypot(pcar.vx, pcar.vy);
          if (sp > 40 && Math.hypot(pcar.x - c.x, pcar.y - c.y) < CAR_R + 5) {
            c.downT = 5; c.shootCd = 3;
            splats.push({ x: c.x, y: c.y, t: 0.9 });
            addWanted(); addWanted();
            addMsg('你撞倒了一名警察! 通缉 +2', '#ff5b5b');
            continue;
          }
        }
        if (d > 16) {
          const sp = 165;
          const nx = c.x + dx / d * sp * dt, ny = c.y + dy / d * sp * dt;
          if (!inBuilding(nx, ny)) { c.x = nx; c.y = ny; }
          else { // 沿墙绕行
            const s = Math.random() < 0.5 ? 1 : -1;
            c.x += -dy / d * sp * dt * s;
            c.y += dx / d * sp * dt * s;
          }
        }
        // 开枪 (通缉>=2, 仅玩家步行时)
        c.shootCd -= dt;
        if (wanted >= 2 && onFoot && d < 280 && c.shootCd <= 0 && mode === 'play') {
          c.shootCd = 1.1 + Math.random() * 0.7;
          const hitP = clamp(1 - d / 340, 0.25, 0.9);
          const spread = (1 - hitP) * 60;
          const ex = player.x + (Math.random() - 0.5) * spread;
          const ey = player.y + (Math.random() - 0.5) * spread;
          tracers.push({ x1: c.x, y1: c.y, x2: ex, y2: ey, t: 0.12 });
          if (Math.hypot(ex - player.x, ey - player.y) < 14) hurt(7 + Math.random() * 6);
        }
      }
    }

    /* ---------- 车车碰撞: 推开 + 按相对速度扣双方耐久 ---------- */
    function collideCars() {
      for (let i = 0; i < cars.length; i++) {
        const a = cars[i];
        if (a.dead) continue;
        for (let j = i + 1; j < cars.length; j++) {
          const b = cars[j];
          if (b.dead) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          const rr = CAR_R * 2;
          if (d2 > rr * rr || d2 < 0.001) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d, ny = dy / d;
          const push = (rr - d) / 2;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
          const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; // <0: 正在接近
          if (rv >= 0) continue;
          const imp = -rv;
          const dmg = Math.max(0, (imp - 60) * 0.045);
          if (dmg > 0) { damageCar(a, dmg); damageCar(b, dmg); }
          const jimp = -(1 + 0.3) * rv / 2; // 弹性冲量(等质量)
          a.vx -= jimp * nx; a.vy -= jimp * ny;
          b.vx += jimp * nx; b.vy += jimp * ny;
          if ((a === pcar || b === pcar) && imp > 100) {
            onPlayerCrash(imp);
            if (crashCd <= 0) { win.shake(); crashCd = 0.8; }
            if ((a.kind === 'police' || b.kind === 'police') && wantedCd <= 0 && imp > 80) {
              addWanted(); wantedCd = 1.5;
            }
          }
        }
      }
    }

    /* ---------- 行人: 漫游 / 躲车 / 逃跑 / 反击 / 倒地 ---------- */
    function updatePeds(dt) {
      const spx = px(), spy = py();
      for (let i = peds.length - 1; i >= 0; i--) {
        const ped = peds[i];
        if (ped.state === 'down') {
          ped.downT -= dt;
          if (ped.downT <= 0) {
            if (ped.angry) { ped.state = 'angry'; ped.t = 4 + Math.random() * 3; }
            else { ped.state = 'flee'; ped.panicT = 4 + Math.random() * 3; ped.dir = Math.atan2(ped.y - spy, ped.x - spx); }
          }
          continue;
        }
        // 被玩家车辆碾压 -> 通缉 +1
        if (!onFoot) {
          const sp = Math.hypot(pcar.vx, pcar.vy);
          if (sp > 40 && Math.hypot(pcar.x - ped.x, pcar.y - ped.y) < CAR_R + 5) {
            splats.push({ x: ped.x, y: ped.y, t: 0.9 });
            if (wantedCd <= 0) { addWanted(); wantedCd = 0.8; }
            peds.splice(i, 1);
            spawnPed(true);
            continue;
          }
        }
        // 躲车: 任何快速靠近的车辆
        if (ped.state !== 'angry') {
          let threat = null, td = 42;
          for (const c of cars) {
            if (c.dead || c.burn > 0) continue;
            const d = Math.hypot(c.x - ped.x, c.y - ped.y);
            if (d < td && Math.hypot(c.vx, c.vy) > 40) { td = d; threat = c; }
          }
          if (threat) {
            ped.state = 'flee';
            ped.panicT = 1.5 + Math.random();
            ped.dir = Math.atan2(ped.y - threat.y, ped.x - threat.x) + (Math.random() - 0.5) * 0.8;
          }
        }
        let spd = ped.spd;
        if (ped.state === 'flee') {
          ped.panicT -= dt;
          spd = 95;
          if (ped.panicT <= 0) ped.state = 'walk';
        } else if (ped.state === 'angry') {
          ped.t -= dt;
          if (onFoot) {
            const dx = player.x - ped.x, dy = player.y - ped.y;
            const d = Math.hypot(dx, dy) || 1;
            ped.dir = Math.atan2(dy, dx);
            spd = 85;
            ped.atkCd -= dt;
            if (d < 16 && ped.atkCd <= 0) {
              ped.atkCd = 1;
              hurt(5);
              addMsg('行人反击! -5 HP', '#ff8080');
            }
          } else spd = 40;
          if (ped.t <= 0) ped.state = 'walk';
        } else {
          ped.t -= dt;
          if (ped.t <= 0) { ped.dir += (Math.random() - 0.5) * 2.2; ped.t = 1.2 + Math.random() * 3.5; }
        }
        if (ped.thrown > 0) { ped.thrown -= dt; spd = 160; }
        const nx = ped.x + Math.cos(ped.dir) * spd * dt;
        const ny = ped.y + Math.sin(ped.dir) * spd * dt;
        if (nx < 12 || nx > OCEAN_X0 - 12 || ny < 12 || ny > MAP_H - 12 || inBuilding(nx, ny)) {
          ped.dir += Math.PI * (0.6 + Math.random() * 0.8);
          ped.t = 1 + Math.random() * 2;
        } else { ped.x = nx; ped.y = ny; }
      }
    }

    /* ---------- 功能站点: 加油站修车 / 喷漆店消星 / 护甲包 ---------- */
    function inZone(x, y, z) { return x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h; }
    function updateSites(dt) {
      if (!onFoot && pcar && pcar.burn <= 0) {
        const sp = Math.hypot(pcar.vx, pcar.vy);
        // 加油站: 停稳 2 秒, $100 修车
        if (inZone(pcar.x, pcar.y, SITES.gas) && sp < 10 && pcar.hp < 99.5) {
          gasT += dt;
          if (gasT >= 2) {
            gasT = 0;
            if (money >= 100) { money -= 100; pcar.hp = 100; XP.sound('tada'); addMsg('车辆已修复! -$100', '#7CFC9B'); }
            else addMsg('现金不足 $100, 无法修车', '#ff8080');
          }
        } else gasT = 0;
        // 喷漆店: 停稳 2 秒, $200 消星+换色 (有通缉才有效)
        if (inZone(pcar.x, pcar.y, SITES.spray) && sp < 10 && wanted > 0) {
          sprayT += dt;
          if (sprayT >= 2) {
            sprayT = 0;
            if (money >= 200) {
              money -= 200;
              pcar.color = SPRAY_COLORS[(Math.random() * SPRAY_COLORS.length) | 0];
              clearWanted(null);
              XP.sound('tada');
              addMsg("Pay 'n' Spray: 通缉清零, 车辆换色! -$200", '#7CFC9B');
            } else addMsg('现金不足 $200, 无法喷漆', '#ff8080');
          }
        } else sprayT = 0;
      } else { gasT = 0; sprayT = 0; }
      // 护甲包 (+50, 45 秒后刷新)
      for (const pk of armorPacks) {
        if (pk.t > 0) { pk.t -= dt; continue; }
        const r = onFoot ? 14 : 20;
        if (Math.hypot(px() - pk.x, py() - pk.y) < r) {
          if (player.armor < 100) {
            player.armor = Math.min(100, player.armor + 50);
            pk.t = 45;
            XP.sound('tada');
            addMsg('捡到护甲包! 护甲 +50', '#7fb8ff');
          }
        }
      }
    }

    /* ---------- 任务链状态机 ---------- */
    function missionDef() { return MS.idx < MISSION_DEFS.length ? MISSION_DEFS[MS.idx] : null; }
    function startDialog(lines, onDone) {
      dialog = { lines: lines, i: 0, onDone: onDone };
      mode = 'dialog';
    }
    function advanceDialog() {
      if (!dialog) return;
      dialog.i++;
      if (dialog.i >= dialog.lines.length) {
        const cb = dialog.onDone;
        dialog = null;
        mode = 'play';
        if (cb) cb();
      }
    }
    function startMission() {
      MS.state = 'active';
      MS.timer = 0; MS.pkg = 0; MS.dropped = null; MS.gangs = [];
      if (MS.idx === 0) MS.timer = 90;
      else if (MS.idx === 1) MS.timer = 60;
      else if (MS.idx === 2) spawnGangCars();
      else if (MS.idx === 3) {
        while (wanted < 3) addWanted();
        addMsg('三星通缉! 冲向马里布俱乐部! (喷漆店可消星)', '#ff5b5b');
      }
    }
    function completeMission() {
      const def = missionDef();
      money += def.reward;
      XP.sound('tada');
      if (MS.idx === 1) player.armor = Math.min(100, player.armor + 50); // 任务 2 附赠防弹衣
      if (MS.idx === 3) {
        clearWanted(null);
        if (!MS.goldSpawned) { // 通关解锁: 金色跑车
          const g = makeCar(1505, 1120, -Math.PI / 2, 'gold', '#ffd700');
          g.maxSpdMul = 1.28;
          cars.push(g);
          MS.goldSpawned = true;
        }
      }
      MS.idx++;
      MS.state = 'marker';
      startDialog(def.outro, null);
    }
    function failMission(msg) {
      if (MS.state !== 'active') return;
      for (let i = cars.length - 1; i >= 0; i--) if (cars[i].kind === 'gang') cars.splice(i, 1);
      MS.state = 'marker'; MS.timer = 0; MS.pkg = 0; MS.dropped = null; MS.gangs = [];
      addMsg(msg + ' — 可前往任务点重试', '#ff8080');
    }
    function spawnGangCars() {
      MS.gangs = [];
      const far = NODE_LIST.filter(n => Math.hypot(n.x - px(), n.y - py()) > 500);
      for (let i = 0; i < 3 && far.length; i++) {
        const n = far.splice((Math.random() * far.length) | 0, 1)[0];
        const c = makeCar(n.x, n.y, Math.random() * 6.2832, 'gang', '#b02020');
        c.driver = 'gang';
        cars.push(c);
        MS.gangs.push(c);
      }
      addMsg('撞毁 3 辆红色帮派车! (小地图红点)', '#ff5b5b');
    }
    function gangAlive() { let n = 0; for (const g of MS.gangs) if (!g.dead && g.kind === 'gang') n++; return n; }
    function updateMission(dt) {
      if (MS.idx >= MISSION_DEFS.length) return;
      const def = missionDef();
      if (MS.state === 'marker') {
        if (Math.hypot(px() - def.start.x, py() - def.start.y) < 40) startDialog(def.intro, startMission);
        return;
      }
      if (MS.idx === 0) { // 老司机: 90 秒开到码头, 座驾不能报废
        MS.timer -= dt;
        if (MS.timer <= 0) {
          failMission('时间到了! 任务失败');
          startDialog([{ who: '肯·罗森博格', text: '太慢了! 货都凉了! 重来!' }], null);
          return;
        }
        if (pcar && pcar.burn > 0) { failMission('座驾报废! 任务失败'); return; }
        if (Math.hypot(px() - DOCKS.x, py() - DOCKS.y) < 46) completeMission();
      } else if (MS.idx === 1) { // 快递风云: 3 个包裹点, 每个限时 60 秒
        MS.timer -= dt;
        if (MS.timer <= 0) {
          failMission('快递超时! 任务失败');
          startDialog([{ who: '肯·罗森博格', text: '客户投诉了! 重来, 这次快点!' }], null);
          return;
        }
        if (MS.dropped) {
          if (Math.hypot(px() - MS.dropped.x, py() - MS.dropped.y) < 24) {
            MS.dropped = null;
            addMsg('包裹捡回来了, 继续送!', '#c792ff');
            XP.sound('ding');
          }
        } else {
          const tgt = PKG_POINTS[MS.pkg];
          if (Math.hypot(px() - tgt.x, py() - tgt.y) < 42) {
            MS.pkg++;
            XP.sound('ding');
            if (MS.pkg >= PKG_POINTS.length) completeMission();
            else { MS.timer = 60; addMsg('包裹 ' + MS.pkg + '/3 已送达! 下一个 (限时 60 秒)', '#ffe066'); }
          }
        }
      } else if (MS.idx === 2) { // 清场: 撞毁全部帮派车
        if (MS.gangs.length && gangAlive() === 0) completeMission();
      } else if (MS.idx === 3) { // 大逃亡: 到达马里布俱乐部
        if (Math.hypot(px() - MALIBU.x, py() - MALIBU.y) < 46) completeMission();
      }
    }
    function missionText() {
      if (MS.idx >= MISSION_DEFS.length) return '任务: 全部完成 ✓ 自由模式';
      const def = missionDef();
      if (MS.state === 'marker') return '任务: 前往黄色光柱接受任务「' + def.name + '」';
      if (MS.idx === 0) return '老司机: 开到码头 (剩 ' + Math.ceil(MS.timer) + ' 秒)';
      if (MS.idx === 1) return MS.dropped ? '快递风云: 包裹掉落! 去捡回紫色包裹 (剩 ' + Math.ceil(MS.timer) + ' 秒)'
        : '快递风云: 送达包裹 ' + (MS.pkg + 1) + '/3 (剩 ' + Math.ceil(MS.timer) + ' 秒)';
      if (MS.idx === 2) return '清场: 摧毁帮派车 ' + (3 - gangAlive()) + '/3';
      return '大逃亡: 冲到马里布俱乐部!';
    }

    /* ---------- 昼夜循环 ---------- */
    function updateClock(dt) {
      gameTime += dt * (86400 / DAY_LEN);
      while (gameTime >= 86400) { gameTime -= 86400; dayCount++; }
    }
    function nightFactor() {
      const h = gameTime / 3600;
      if (h >= 7 && h < 17) return 0;
      if (h >= 17 && h < 20) return (h - 17) / 3;       // 黄昏渐暗
      if (h >= 20 || h < 5) return 1;                   // 夜晚
      return 1 - (h - 5) / 2;                           // 黎明渐亮
    }
    function duskFactor() {
      const h = gameTime / 3600;
      if (h >= 16.5 && h < 19.5) return 1 - Math.abs(h - 18) / 1.5;
      if (h >= 5 && h < 7) return (1 - Math.abs(h - 6)) * 0.6;
      return 0;
    }
    function timeStr() {
      const h = Math.floor(gameTime / 3600), m = Math.floor(gameTime % 3600 / 60);
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    function dateStr() {
      let dom = 26 + dayCount, mon = 10;
      if (dom > 31) { dom -= 31; mon = 11; }
      return '1986.' + mon + '.' + dom + ' ' + WEEKDAYS[dayCount % 7];
    }

    /* ---------- 主循环 ---------- */
    function isPaused() {
      return closed || win.el.style.display === 'none' || document.hidden || document.activeElement !== canvas;
    }
    function frame(now) {
      if (closed) return;
      rafId = requestAnimationFrame(frame);
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05; // 防止切后台后的时间跳变
      pausedNow = isPaused();
      if (!pausedNow) update(dt);
      if (win.el.style.display !== 'none' && !document.hidden) render();
      if (audioCtx && audioOn) {
        if (pausedNow || station === 0) { if (audioCtx.state === 'running') audioCtx.suspend(); }
        else if (audioCtx.state === 'suspended') audioCtx.resume();
      }
    }
    function update(dt) {
      time += dt;
      updateClock(dt);
      updateParts(dt);
      if (wantedCd > 0) wantedCd -= dt;
      if (crashCd > 0) crashCd -= dt;
      if (mode === 'dialog') return;                    // 对话时世界暂停
      if (mode === 'wasted' || mode === 'busted') {
        modeT -= dt;
        if (modeT <= 0) { if (mode === 'wasted') respawnAtHospital(); else respawnAtHotel(); }
        return;
      }
      if (jackT > 0) {                                  // 抢车拽人动画中
        jackT -= dt;
        if (jackT <= 0 && jackCar) { if (!jackCar.dead) enterCar(jackCar); jackCar = null; }
      }
      if (onFoot) { if (jackT <= 0) updateOnFoot(dt); }
      else updateDriving(dt);
      updateCars(dt);
      if (mode !== 'play') return;                      // 本帧内爆炸致死/被捕 -> 后续系统停一帧
      updatePeds(dt);
      updatePoliceCars(dt);
      updateCops(dt);
      updateWanted(dt);
      updateSites(dt);
      updateMission(dt);
    }

    /* ---------- 渲染 ---------- */
    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function render() {
      const cx = clamp(px() - VIEW_W / 2, 0, MAP_W - VIEW_W);
      const cy = clamp(py() - VIEW_H / 2, 0, MAP_H - VIEW_H);
      ctx.clearRect(0, 0, VIEW_W, VIEW_H);
      ctx.save();
      ctx.translate(-cx, -cy);
      drawGround(cx, cy);
      drawRoads(cx, cy);
      drawSidewalks(cx, cy);
      drawDistrictDecor(cx, cy);
      drawSkids();
      drawSplats();
      drawSites(cx, cy);
      drawBuildings(cx, cy);
      drawPalms(cx, cy);
      drawMarkers();
      drawPeds(cx, cy);
      drawCops();
      for (const c of cars) if (!c.dead && c !== pcar) drawCar(c);
      if (pcar && !pcar.dead) drawCar(pcar);
      if (onFoot && jackT <= 0) drawTommy();
      drawParts();
      drawTracers();
      ctx.restore();
      drawNight(cx, cy);
      drawHUD(cx, cy);
      if (mode === 'dialog') drawDialog();
      if (mode === 'wasted') drawWasted();
      if (mode === 'busted') drawBusted();
    }
    function drawGround(cx, cy) {
      ctx.fillStyle = '#57a049';
      ctx.fillRect(cx, cy, VIEW_W, VIEW_H);
      ctx.fillStyle = 'rgba(40,120,40,.35)';
      const gx0 = Math.floor(cx / 120) * 120, gy0 = Math.floor(cy / 120) * 120;
      for (let gx = gx0; gx < cx + VIEW_W; gx += 120) {
        for (let gy = gy0; gy < cy + VIEW_H; gy += 120) {
          if ((gx / 120 + gy / 120) % 2 === 0) ctx.fillRect(gx, gy, 120, 120);
        }
      }
      // 区域底色: 小哈瓦那暖土色 / 市中心冷灰
      if (cx < 540 && cy + VIEW_H > 740) {
        ctx.fillStyle = 'rgba(178,148,108,.30)';
        const x1 = Math.min(540, cx + VIEW_W), y0 = Math.max(cy, 740);
        ctx.fillRect(cx, y0, x1 - cx, cy + VIEW_H - y0);
      }
      const dx0 = Math.max(cx, 540), dx1 = Math.min(cx + VIEW_W, 1180);
      const dy0 = Math.max(cy, 460), dy1 = Math.min(cy + VIEW_H, 1020);
      if (dx1 > dx0 && dy1 > dy0) {
        ctx.fillStyle = 'rgba(120,130,150,.28)';
        ctx.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
      }
      // 沙滩
      if (cx + VIEW_W > BEACH_X0) {
        ctx.fillStyle = '#e7d59b';
        ctx.fillRect(BEACH_X0, cy, OCEAN_X0 - BEACH_X0, VIEW_H);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        for (let gy = Math.floor(cy / 40) * 40; gy < cy + VIEW_H; gy += 40) {
          ctx.fillRect(BEACH_X0 + 8 + (gy % 80 ? 0 : 14), gy + 10, 6, 4);
        }
      }
      // 海洋 + 海浪动画
      if (cx + VIEW_W > OCEAN_X0) {
        ctx.fillStyle = '#1c79bd';
        ctx.fillRect(OCEAN_X0, cy, MAP_W - OCEAN_X0, VIEW_H);
        ctx.strokeStyle = 'rgba(255,255,255,.5)';
        ctx.lineWidth = 2;
        const x1 = Math.min(MAP_W, cx + VIEW_W);
        for (let gy = Math.floor(cy / 34) * 34; gy < cy + VIEW_H; gy += 34) {
          ctx.beginPath();
          for (let gx = OCEAN_X0; gx <= x1; gx += 14) {
            const yy = gy + Math.sin(gx * 0.05 + time * 1.8 + gy * 0.06) * 4;
            if (gx === OCEAN_X0) ctx.moveTo(gx, yy); else ctx.lineTo(gx, yy);
          }
          ctx.stroke();
        }
      }
    }
    function drawRoads(cx, cy) {
      ctx.fillStyle = '#494c54';
      for (const rx of ROADS_X) {
        if (rx + ROAD_W / 2 < cx || rx - ROAD_W / 2 > cx + VIEW_W) continue;
        ctx.fillRect(rx - ROAD_W / 2, cy, ROAD_W, VIEW_H);
      }
      for (const ry of ROADS_Y) {
        if (ry + ROAD_W / 2 < cy || ry - ROAD_W / 2 > cy + VIEW_H) continue;
        ctx.fillRect(cx, ry - ROAD_W / 2, VIEW_W, ROAD_W);
      }
      ctx.strokeStyle = '#f4f4f4';
      ctx.lineWidth = 3;
      ctx.setLineDash([18, 16]);
      for (const rx of ROADS_X) {
        if (rx + ROAD_W / 2 < cx || rx - ROAD_W / 2 > cx + VIEW_W) continue;
        ctx.beginPath(); ctx.moveTo(rx, cy); ctx.lineTo(rx, cy + VIEW_H); ctx.stroke();
      }
      for (const ry of ROADS_Y) {
        if (ry + ROAD_W / 2 < cy || ry - ROAD_W / 2 > cy + VIEW_H) continue;
        ctx.beginPath(); ctx.moveTo(cx, ry); ctx.lineTo(cx + VIEW_W, ry); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    function drawSidewalks(cx, cy) {
      ctx.strokeStyle = '#c8c0ad';
      ctx.lineWidth = 13;
      for (let i = 0; i < ROADS_X.length - 1; i++) {
        const x0 = ROADS_X[i] + ROAD_W / 2 + 7;
        const w = ROADS_X[i + 1] - ROADS_X[i] - ROAD_W - 14;
        if (w < 36 || x0 > cx + VIEW_W || x0 + w < cx) continue;
        for (let j = 0; j < ROADS_Y.length - 1; j++) {
          const y0 = ROADS_Y[j] + ROAD_W / 2 + 7;
          const h = ROADS_Y[j + 1] - ROADS_Y[j] - ROAD_W - 14;
          if (h < 36 || y0 > cy + VIEW_H || y0 + h < cy) continue;
          ctx.strokeRect(x0, y0, w, h);
        }
      }
    }
    // 区域装饰: 码头水泥地+吊车+货轮 / 小哈瓦那涂鸦
    function drawDistrictDecor(cx, cy) {
      if (cx + VIEW_W > 1690 && cy + VIEW_H > 1010) {
        ctx.fillStyle = '#9a9488';
        ctx.fillRect(1700, 1020, 140, 262);
      }
      // 货轮 (港口海面)
      const ship = { x: 1880, y: 1060, w: 96, h: 200 };
      if (rectsOverlap(ship, { x: cx, y: cy, w: VIEW_W, h: VIEW_H }, 40)) {
        ctx.fillStyle = '#3d4852';
        rr(ship.x, ship.y, ship.w, ship.h, 14); ctx.fill();
        ctx.fillStyle = '#525e6a';
        rr(ship.x + 8, ship.y + 10, ship.w - 16, ship.h - 46, 8); ctx.fill();
        const cols = ['#c0504d', '#4d79c0', '#d0b04d'];
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 4; j++) {
            ctx.fillStyle = cols[(i + j) % 3];
            ctx.fillRect(ship.x + 14 + i * 24, ship.y + 20 + j * 30, 20, 24);
          }
        }
        ctx.fillStyle = '#e8e8e8';
        ctx.fillRect(ship.x + 16, ship.y + ship.h - 30, ship.w - 32, 18);
        ctx.fillStyle = '#cc3333';
        ctx.fillRect(ship.x + 44, ship.y + ship.h - 40, 8, 10);
      }
      // 吊车
      for (const cr of CRANES) {
        if (cr.x < cx - 80 || cr.x > cx + VIEW_W + 80 || cr.y < cy - 80 || cr.y > cy + VIEW_H + 80) continue;
        ctx.strokeStyle = '#e0b030'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cr.x, cr.y); ctx.lineTo(cr.x, cr.y + 40);
        ctx.moveTo(cr.x - 26, cr.y + 4); ctx.lineTo(cr.x + 34, cr.y + 4);
        ctx.moveTo(cr.x + 26, cr.y + 4); ctx.lineTo(cr.x + 26, cr.y + 20);
        ctx.stroke();
        ctx.fillStyle = '#c89020'; ctx.fillRect(cr.x - 6, cr.y - 4, 12, 8);
        ctx.fillStyle = '#8a8a8a'; ctx.fillRect(cr.x + 22, cr.y + 20, 8, 6);
      }
      // 涂鸦 (确定性随机涂鸦线)
      ctx.save();
      ctx.lineWidth = 2.5;
      for (const g of graffiti) {
        if (g.x < cx - 30 || g.x > cx + VIEW_W + 30 || g.y < cy - 30 || g.y > cy + VIEW_H + 30) continue;
        ctx.strokeStyle = g.c;
        ctx.globalAlpha = 0.8;
        const rnd = mulberry32(g.seed);
        let x = g.x, y = g.y;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i < 8; i++) { x += (rnd() - 0.5) * 18; y += (rnd() - 0.5) * 18; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
    }
    function drawBuildings(cx, cy) {
      const nf = nightFactor();
      for (const b of buildings) {
        if (b.x > cx + VIEW_W || b.x + b.w + 14 < cx || b.y > cy + VIEW_H || b.y + b.h + 14 < cy) continue;
        const OFF = b.low ? 5 : b.glass ? 14 : 9;
        // 南墙 + 东墙 (伪 3D)
        ctx.fillStyle = shade(b.wall, -0.38);
        ctx.fillRect(b.x + OFF, b.y + b.h, b.w, OFF);
        ctx.fillRect(b.x + b.w, b.y + OFF, OFF, b.h);
        // 窗户 (夜间亮灯更多)
        const litP = 0.4 + nf * 0.45;
        for (let wx = b.x + OFF + 8; wx < b.x + b.w - 4; wx += 16) {
          ctx.fillStyle = ((wx * 7 + b.y * 3) % 97) / 97 < litP ? '#ffe9a8' : (b.glass ? '#243240' : '#3c4a5c');
          ctx.fillRect(wx, b.y + b.h + 2, 9, 5);
        }
        for (let wy = b.y + OFF + 8; wy < b.y + b.h - 4; wy += 16) {
          ctx.fillStyle = ((wy * 7 + b.x * 3) % 97) / 97 < litP ? '#ffe9a8' : (b.glass ? '#243240' : '#3c4a5c');
          ctx.fillRect(b.x + b.w + 2, wy, 5, 9);
        }
        // 屋顶
        ctx.fillStyle = b.wall;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.style === 'container') {
          ctx.strokeStyle = shade(b.wall, -0.3); ctx.lineWidth = 1.5;
          for (let ry2 = b.y + 6; ry2 < b.y + b.h - 2; ry2 += 6) {
            ctx.beginPath(); ctx.moveTo(b.x + 3, ry2); ctx.lineTo(b.x + b.w - 3, ry2); ctx.stroke();
          }
          ctx.lineWidth = 2.5;
          ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
          continue;
        }
        if (b.glass) { // 玻璃幕墙反光条
          ctx.fillStyle = 'rgba(160,200,230,.18)';
          for (let gx = b.x + 10; gx < b.x + b.w - 8; gx += 14) ctx.fillRect(gx, b.y + 6, 7, b.h - 12);
        }
        ctx.strokeStyle = shade(b.wall, -0.25);
        ctx.lineWidth = 3;
        ctx.strokeRect(b.x + 3, b.y + 3, b.w - 6, b.h - 6);
        ctx.fillStyle = shade(b.wall, -0.18);
        ctx.fillRect(b.x + 10, b.y + 10, 16, 12);
        if (b.w > 110) ctx.fillRect(b.x + b.w - 30, b.y + b.h - 24, 18, 12);
        if (b.style === 'artdeco') { // 艺术装饰白边
          ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2;
          ctx.strokeRect(b.x + 7, b.y + 7, b.w - 14, b.h - 14);
        }
        // 霓虹招牌 (夜晚更亮)
        if (b.sign) {
          ctx.save();
          ctx.font = 'bold 13px Tahoma, "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = b.neon;
          ctx.shadowBlur = 9 * (1 + nf * 1.8);
          ctx.fillStyle = b.neon;
          ctx.fillText(b.sign, b.x + b.w / 2, b.y + b.h / 2);
          if (nf > 0.3) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,.85)';
            ctx.fillText(b.sign, b.x + b.w / 2, b.y + b.h / 2);
          }
          ctx.restore();
        }
      }
    }
    function drawPalms(cx, cy) {
      ctx.save();
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const pm of palms) {
        if (pm.x < cx - 20 || pm.x > cx + VIEW_W + 20 || pm.y < cy - 20 || pm.y > cy + VIEW_H + 20) continue;
        ctx.fillText('🌴', pm.x, pm.y);
      }
      ctx.restore();
    }
    // 功能站点: 加油站 / 喷漆店 / 护甲包
    function drawSites(cx, cy) {
      const g = SITES.gas;
      if (rectsOverlap(g, { x: cx, y: cy, w: VIEW_W, h: VIEW_H }, 30)) {
        ctx.fillStyle = '#5a5f66'; ctx.fillRect(g.x, g.y, g.w, g.h);
        ctx.fillStyle = '#e8453b'; ctx.fillRect(g.x, g.y, g.w, 12);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Tahoma, "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GAS 加油站', g.x + g.w / 2, g.y + 10);
        ctx.fillStyle = 'rgba(232,69,59,.85)'; ctx.fillRect(g.x + 8, g.y + 26, g.w - 16, 30);
        ctx.fillStyle = '#fff'; ctx.fillRect(g.x + 8, g.y + 26, g.w - 16, 4);
        ctx.fillStyle = '#3a3f46';
        ctx.fillRect(g.x + 22, g.y + 34, 8, 14);
        ctx.fillRect(g.x + g.w - 30, g.y + 34, 8, 14);
        ctx.font = '10px serif';
        ctx.fillText('⛽', g.x + 26, g.y + 46);
        ctx.fillText('⛽', g.x + g.w - 26, g.y + 46);
        ctx.fillStyle = '#7CFC9B'; ctx.font = 'bold 10px Tahoma, "Microsoft YaHei", sans-serif';
        ctx.fillText('停车 2 秒修车 $100', g.x + g.w / 2, g.y + g.h - 10);
        ctx.textAlign = 'left';
      }
      const s = SITES.spray;
      if (rectsOverlap(s, { x: cx, y: cy, w: VIEW_W, h: VIEW_H }, 30)) {
        ctx.fillStyle = '#6a4a8a'; ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.fillStyle = '#4a2f63'; ctx.fillRect(s.x + 8, s.y + 22, s.w - 16, s.h - 34);
        ctx.save();
        ctx.shadowColor = '#ff71ce'; ctx.shadowBlur = 8 + nightFactor() * 10;
        ctx.fillStyle = '#ff71ce';
        ctx.font = 'bold 26px Tahoma, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('P', s.x + s.w / 2, s.y + s.h / 2 + 5);
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Tahoma, "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText("Pay 'n' Spray 消星 $200", s.x + s.w / 2, s.y + 14);
        ctx.textAlign = 'left';
      }
      for (const pk of armorPacks) {
        if (pk.t > 0) continue;
        if (pk.x < cx - 20 || pk.x > cx + VIEW_W + 20 || pk.y < cy - 20 || pk.y > cy + VIEW_H + 20) continue;
        const bob = Math.sin(time * 4 + pk.x) * 2;
        ctx.fillStyle = 'rgba(127,184,255,.25)';
        ctx.beginPath(); ctx.arc(pk.x, pk.y + bob, 11, 0, 6.2832); ctx.fill();
        ctx.fillStyle = '#2a4a7a';
        rr(pk.x - 7, pk.y - 6 + bob, 14, 13, 3); ctx.fill();
        ctx.fillStyle = '#7fb8ff';
        ctx.fillRect(pk.x - 1.5, pk.y - 4 + bob, 3, 9);
        ctx.fillRect(pk.x - 5, pk.y - 1 + bob, 10, 3);
      }
    }
    // 任务光柱 + 包裹标记
    function drawMarkers() {
      const def = missionDef();
      if (!def) return;
      if (MS.state === 'marker') drawPillar(def.start.x, def.start.y, '#ffe066', '📞');
      else if (MS.idx === 0) drawPillar(DOCKS.x, DOCKS.y, '#ffe066', '🚢');
      else if (MS.idx === 1) {
        if (MS.dropped) drawPillar(MS.dropped.x, MS.dropped.y, '#c792ff', '📦');
        else drawPillar(PKG_POINTS[MS.pkg].x, PKG_POINTS[MS.pkg].y, '#ffe066', '📦');
      } else if (MS.idx === 3) drawPillar(MALIBU.x, MALIBU.y, '#ffe066', '🌴');
    }
    function drawPillar(x, y, color, icon) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 4);
      const g = ctx.createLinearGradient(0, y - 300, 0, y);
      g.addColorStop(0, hexA(color, 0));
      g.addColorStop(1, hexA(color, 0.5));
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 300, 32, 300);
      ctx.strokeStyle = hexA(color, 0.55 + 0.45 * pulse);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, 28 + pulse * 8, 0, 6.2832);
      ctx.stroke();
      const by = y - 44 - Math.sin(time * 5) * 6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, by + 15);
      ctx.lineTo(x - 11, by);
      ctx.lineTo(x + 11, by);
      ctx.closePath();
      ctx.fill();
      ctx.font = '18px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, x, by - 12);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    function drawSkids() {
      for (const s of skids) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.a);
        ctx.fillStyle = 'rgba(20,20,22,' + (s.t / 4 * 0.35) + ')';
        ctx.fillRect(-7, -9.5, 10, 2.6);
        ctx.fillRect(-7, 6.9, 10, 2.6);
        ctx.restore();
      }
    }
    function drawSplats() {
      for (const s of splats) {
        const k = s.t / 0.9;
        ctx.fillStyle = 'rgba(200,20,20,' + (k * 0.7) + ')';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5 + (1 - k) * 9, 0, 6.2832);
        ctx.fill();
      }
    }
    function drawPeds(cx, cy) {
      for (const ped of peds) {
        if (ped.x < cx - 12 || ped.x > cx + VIEW_W + 12 || ped.y < cy - 12 || ped.y > cy + VIEW_H + 12) continue;
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.beginPath();
        ctx.ellipse(ped.x, ped.y + 3, 4, 2, 0, 0, 6.2832);
        ctx.fill();
        if (ped.state === 'down') { // 倒地
          ctx.fillStyle = ped.color;
          ctx.fillRect(ped.x - 5, ped.y - 2.5, 10, 5);
          ctx.fillStyle = '#f1c79a';
          ctx.fillRect(ped.x + 3, ped.y - 2, 3, 4);
          continue;
        }
        ctx.fillStyle = ped.state === 'angry' ? '#ff4d4d' : ped.color;
        ctx.beginPath();
        ctx.arc(ped.x, ped.y, 4.2, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = '#f1c79a';
        ctx.beginPath();
        ctx.arc(ped.x + Math.cos(ped.dir) * 1.5, ped.y + Math.sin(ped.dir) * 1.5, 1.8, 0, 6.2832);
        ctx.fill();
        if (ped.state === 'flee') {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('!', ped.x + 4, ped.y - 5);
        }
      }
    }
    function drawCops() {
      for (const c of cops) {
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.beginPath();
        ctx.ellipse(c.x, c.y + 3, 4, 2, 0, 0, 6.2832);
        ctx.fill();
        if (c.downT > 0) {
          ctx.fillStyle = '#24418f';
          ctx.fillRect(c.x - 5, c.y - 2.5, 10, 5);
          continue;
        }
        ctx.fillStyle = '#24418f';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 4.4, 0, 6.2832);
        ctx.fill();
        ctx.fillStyle = '#f1c79a';
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(c.dir) * 1.5, c.y + Math.sin(c.dir) * 1.5, 1.8, 0, 6.2832);
        ctx.fill();
        // 手枪
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x + Math.cos(c.dir) * 7, c.y + Math.sin(c.dir) * 7);
        ctx.stroke();
      }
    }
    function drawTommy() {
      const p = player;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(0, 3, 6, 3, 0, 0, 6.2832);
      ctx.fill();
      ctx.rotate(p.a);
      const moving = Math.hypot(p.vx, p.vy) > 10;
      const sw = moving ? Math.sin(p.walkT) * 1.6 : 0;
      // 腿
      ctx.strokeStyle = '#3a5a8a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-2, -2); ctx.lineTo(-6, -3 + sw);
      ctx.moveTo(-2, 2); ctx.lineTo(-6, 3 - sw);
      ctx.stroke();
      // 身体 (蓝色夏威夷衬衫)
      ctx.fillStyle = '#2e86de';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 5, 0, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fillRect(-1, -4, 1.5, 8);
      // 手臂 (出拳动画)
      ctx.strokeStyle = '#f1c79a';
      ctx.lineWidth = 2.2;
      const punch = p.punchT > 0 ? 8 : 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -2.5); ctx.lineTo(punch, -3.5);
      ctx.moveTo(0, 2.5); ctx.lineTo(p.punchT > 0 ? 3 : punch, 3.5);
      ctx.stroke();
      // 头
      ctx.fillStyle = '#f1c79a';
      ctx.beginPath();
      ctx.arc(2.5, 0, 3, 0, 6.2832);
      ctx.fill();
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath();
      ctx.arc(1.8, 0, 3, 2.2, 4.1);
      ctx.fill();
      ctx.restore();
      // 重生无敌圈
      if (p.invuln > 0) {
        ctx.strokeStyle = 'rgba(127,184,255,' + (0.4 + 0.3 * Math.sin(time * 20)) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11, 0, 6.2832);
        ctx.stroke();
      }
    }
    function drawCar(c) {
      const burning = c.burn > 0;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.a);
      // 阴影
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      rr(-13, -5, 30, 17, 4); ctx.fill();
      // 车轮
      ctx.fillStyle = '#14161a';
      ctx.fillRect(-11, -10.5, 8, 3.5);
      ctx.fillRect(4, -10.5, 8, 3.5);
      ctx.fillRect(-11, 7, 8, 3.5);
      ctx.fillRect(4, 7, 8, 3.5);
      // 车身 (纵向渐变)
      const g = ctx.createLinearGradient(0, -8, 0, 8);
      g.addColorStop(0, shade(c.color, burning ? -0.55 : 0.28));
      g.addColorStop(1, shade(c.color, burning ? -0.75 : -0.18));
      ctx.fillStyle = g;
      rr(-15, -8, 30, 16, 4); ctx.fill();
      // 车顶
      ctx.fillStyle = shade(c.color, burning ? -0.6 : 0.05);
      rr(-9, -6.5, 16, 13, 3); ctx.fill();
      // 挡风玻璃 + 反光条
      ctx.fillStyle = burning ? '#332222' : '#bfe3ff';
      rr(1, -5, 6, 10, 2); ctx.fill();
      if (!burning) {
        ctx.fillStyle = 'rgba(255,255,255,.65)';
        ctx.fillRect(2.5, -4, 1.6, 8);
        ctx.fillStyle = '#7fb8e0';
        rr(-8, -5, 5, 10, 2); ctx.fill();
      }
      // 警车涂装 + 警灯
      if (c.skin === 'police') {
        ctx.fillStyle = '#24418f';
        ctx.fillRect(-15, -8, 8, 16);
        ctx.fillRect(7, -8, 8, 16);
        const on = Math.floor(time * 6) % 2 === 0;
        ctx.fillStyle = on ? '#ff3333' : '#3366ff';
        ctx.fillRect(-4.5, -7.5, 5, 3.5);
        ctx.fillStyle = on ? '#3366ff' : '#ff3333';
        ctx.fillRect(-4.5, 4, 5, 3.5);
      }
      // 帮派车标记 (红色三角)
      if (c.kind === 'gang') {
        ctx.fillStyle = Math.floor(time * 3) % 2 ? '#ff3030' : '#ffd0d0';
        ctx.beginPath();
        ctx.moveTo(-3, -14); ctx.lineTo(4, -14); ctx.lineTo(0.5, -9.5);
        ctx.closePath();
        ctx.fill();
      }
      // 车头灯
      ctx.fillStyle = burning ? '#aa3333' : '#fff6c8';
      ctx.fillRect(13.5, -6, 2, 4);
      ctx.fillRect(13.5, 2, 2, 4);
      // 刹车灯 (玩家车刹车时)
      if (c === pcar && keys.down && !burning) {
        ctx.fillStyle = '#ff2020';
        ctx.fillRect(-15.5, -6.5, 2, 4.5);
        ctx.fillRect(-15.5, 2, 2, 4.5);
      }
      // 转向灯 (闪烁)
      if (c.turnSig && !burning && Math.floor(time * 5) % 2 === 0) {
        ctx.fillStyle = '#ffb030';
        const ty = c.turnSig < 0 ? -8.5 : 6.5;
        ctx.fillRect(13, ty, 2.6, 2.4);
        ctx.fillRect(-15.2, ty, 2.6, 2.4);
      }
      ctx.restore();
      // 耐久条 (玩家车/帮派车受损时)
      if (!burning && c.hp < 99 && (c === pcar || c.kind === 'gang')) {
        ctx.fillStyle = 'rgba(0,0,0,.5)';
        ctx.fillRect(c.x - 14, c.y - 22, 28, 4);
        ctx.fillStyle = c.hp > 50 ? '#7CFC9B' : c.hp > 25 ? '#ffd166' : '#ff5b5b';
        ctx.fillRect(c.x - 13, c.y - 21, 26 * clamp(c.hp, 0, 100) / 100, 2);
      }
    }
    function drawParts() {
      for (const pt of parts) {
        const k = pt.t / pt.life;
        if (pt.color === 'flash') {
          ctx.fillStyle = 'rgba(255,220,120,' + (k * 0.8) + ')';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (1 - k) * 70 + 10, 0, 6.2832);
          ctx.fill();
        } else if (pt.color === 'smoke') {
          ctx.fillStyle = 'rgba(30,28,30,' + (k * 0.55) + ')';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, 6.2832);
          ctx.fill();
        } else {
          ctx.globalAlpha = k;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, 6.2832);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }
    function drawTracers() {
      for (const t of tracers) {
        ctx.strokeStyle = 'rgba(255,230,120,' + (t.t / 0.12) + ')';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
      }
    }
    // 夜景: 天色渐变叠加 + 路灯 + 车灯 (叠加提亮)
    function drawNight(cx, cy) {
      const dk = duskFactor();
      if (dk > 0.01) {
        ctx.fillStyle = 'rgba(255,110,40,' + (0.16 * dk) + ')';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      const nf = nightFactor();
      if (nf <= 0.01) return;
      ctx.fillStyle = 'rgba(6,8,32,' + (0.62 * nf) + ')';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(-cx, -cy);
      for (const l of STREETLIGHTS) {
        if (l.x < cx - 40 || l.x > cx + VIEW_W + 40 || l.y < cy - 40 || l.y > cy + VIEW_H + 40) continue;
        const g = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 34);
        g.addColorStop(0, 'rgba(255,220,150,' + (0.5 * nf) + ')');
        g.addColorStop(1, 'rgba(255,220,150,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(l.x, l.y, 34, 0, 6.2832);
        ctx.fill();
      }
      if (nf > 0.2) {
        for (const c of cars) {
          if (c.dead || c.burn > 0) continue;
          if (c.x < cx - 120 || c.x > cx + VIEW_W + 120 || c.y < cy - 120 || c.y > cy + VIEW_H + 120) continue;
          if (Math.hypot(c.vx, c.vy) < 20 && c !== pcar) continue;
          const fx = Math.cos(c.a), fy = Math.sin(c.a);
          const hx = c.x + fx * 26, hy = c.y + fy * 26;
          const g = ctx.createRadialGradient(hx, hy, 3, hx, hy, 52);
          g.addColorStop(0, 'rgba(255,250,210,' + (0.42 * nf) + ')');
          g.addColorStop(1, 'rgba(255,250,210,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(hx, hy, 52, 34, c.a, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    /* ---------- HUD ---------- */
    function drawBar(x, y, w, h, frac, color, bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
      ctx.strokeStyle = 'rgba(255,255,255,.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    }
    function drawHUD(cx, cy) {
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(8,10,26,.75)';
      rr(8, 8, 216, 152, 8); ctx.fill();
      ctx.textAlign = 'left';
      let y = 28;
      ctx.font = 'bold 13px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#fff';
      if (onFoot) ctx.fillText('步行中 (F 上车)', 18, y);
      else {
        const kmh = Math.round(Math.abs(pcar.vx * Math.cos(pcar.a) + pcar.vy * Math.sin(pcar.a)) * 0.9);
        ctx.fillText('速度 ' + kmh + ' km/h', 18, y);
        drawBar(116, y - 9, 98, 8, clamp(pcar.hp, 0, 100) / 100, pcar.hp > 50 ? '#7CFC9B' : pcar.hp > 25 ? '#ffd166' : '#ff5b5b', '#333333');
      }
      y += 20;
      ctx.fillStyle = wanted > 0 ? '#ff5b5b' : '#9aa0aa';
      ctx.fillText('通缉 ' + '★'.repeat(wanted) + '☆'.repeat(6 - wanted), 18, y);
      y += 20;
      ctx.fillStyle = '#7CFC9B';
      ctx.fillText('金钱 $' + money, 18, y);
      y += 22;
      ctx.fillStyle = '#ff8080';
      ctx.fillText('生命', 18, y);
      drawBar(52, y - 9, 76, 8, player.hp / 100, '#ff5b5b', '#442222');
      ctx.fillStyle = '#fff';
      ctx.font = '11px Tahoma, sans-serif';
      ctx.fillText(Math.ceil(player.hp) + '', 134, y);
      ctx.font = 'bold 13px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#7fb8ff';
      ctx.fillText('护甲', 160, y);
      drawBar(194, y - 9, 22, 8, player.armor / 100, '#7fb8ff', '#112233');
      y += 22;
      ctx.fillStyle = '#ffd9a0';
      ctx.fillText('🕐 ' + dateStr() + ' ' + timeStr(), 18, y);
      y += 20;
      ctx.fillStyle = '#01cdfe';
      ctx.fillText('电台 ' + STATIONS[station].name + (station ? ' ♪' : ''), 18, y);
      // 任务目标
      const mtext = missionText();
      ctx.font = 'bold 13px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#000';
      ctx.fillText(mtext, 19, 180);
      ctx.fillStyle = '#ffe066';
      ctx.fillText(mtext, 18, 179);
      drawMinimap();
      drawOffscreenArrows(cx, cy);
      drawHint();
      drawMsgs();
      drawSiteProgress();
    }
    function drawMinimap() {
      const MW = 152, MH = 114, mx = VIEW_W - MW - 10, my = 8, s = MW / MAP_W;
      ctx.fillStyle = 'rgba(8,10,26,.75)';
      rr(mx - 4, my - 4, MW + 8, MH + 8, 8); ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.rect(mx, my, MW, MH);
      ctx.clip();
      ctx.fillStyle = '#3f7a44';
      ctx.fillRect(mx, my, MW, MH);
      ctx.fillStyle = '#d9c48a';
      ctx.fillRect(mx + BEACH_X0 * s, my, (OCEAN_X0 - BEACH_X0) * s, MH);
      ctx.fillStyle = '#1c79bd';
      ctx.fillRect(mx + OCEAN_X0 * s, my, (MAP_W - OCEAN_X0) * s, MH);
      ctx.strokeStyle = '#55585f';
      ctx.lineWidth = 2;
      for (const rx of ROADS_X) { ctx.beginPath(); ctx.moveTo(mx + rx * s, my); ctx.lineTo(mx + rx * s, my + MH); ctx.stroke(); }
      for (const ry of ROADS_Y) { ctx.beginPath(); ctx.moveTo(mx, my + ry * s); ctx.lineTo(mx + MW, my + ry * s); ctx.stroke(); }
      // 商店: $ 加油站 / P 喷漆店 / H 医院
      miniIcon(mx + (SITES.gas.x + SITES.gas.w / 2) * s, my + (SITES.gas.y + SITES.gas.h / 2) * s, '$', '#7CFC9B');
      miniIcon(mx + (SITES.spray.x + SITES.spray.w / 2) * s, my + (SITES.spray.y + SITES.spray.h / 2) * s, 'P', '#ff71ce');
      miniIcon(mx + (SITES.hospital.x + SITES.hospital.w / 2) * s, my + (SITES.hospital.y + SITES.hospital.h / 2) * s, 'H', '#ff5b5b');
      // 护甲包
      ctx.fillStyle = '#7fb8ff';
      for (const pk of armorPacks) {
        if (pk.t > 0) continue;
        ctx.beginPath();
        ctx.arc(mx + pk.x * s, my + pk.y * s, 2, 0, 6.2832);
        ctx.fill();
      }
      // 任务点
      const def = missionDef();
      if (def) {
        let tx = 0, ty = 0, show = true;
        if (MS.state === 'marker') { tx = def.start.x; ty = def.start.y; }
        else if (MS.idx === 0) { tx = DOCKS.x; ty = DOCKS.y; }
        else if (MS.idx === 1) { const p2 = MS.dropped || PKG_POINTS[MS.pkg]; tx = p2.x; ty = p2.y; }
        else if (MS.idx === 3) { tx = MALIBU.x; ty = MALIBU.y; }
        else show = false;
        if (show) {
          ctx.fillStyle = MS.dropped ? '#c792ff' : '#ffe066';
          ctx.beginPath();
          ctx.arc(mx + tx * s, my + ty * s, 3 + Math.sin(time * 6) * 1.2, 0, 6.2832);
          ctx.fill();
        }
      }
      // 帮派车 (任务 3)
      if (MS.idx === 2 && MS.state === 'active') {
        ctx.fillStyle = '#ff3030';
        for (const g2 of MS.gangs) {
          if (g2.dead || g2.kind !== 'gang') continue;
          ctx.beginPath();
          ctx.arc(mx + g2.x * s, my + g2.y * s, 2.8, 0, 6.2832);
          ctx.fill();
        }
      }
      // 警车 (红蓝闪烁)
      ctx.fillStyle = Math.floor(time * 4) % 2 === 0 ? '#4da3ff' : '#ff5b5b';
      for (const c of cars) {
        if (c.kind !== 'police') continue;
        ctx.beginPath();
        ctx.arc(mx + c.x * s, my + c.y * s, 2.6, 0, 6.2832);
        ctx.fill();
      }
      // 玩家
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(mx + px() * s, my + py() * s, 3.2, 0, 6.2832);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx, my, MW, MH);
    }
    function miniIcon(x, y, ch, color) {
      ctx.fillStyle = color;
      ctx.font = 'bold 9px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, x, y);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
    function drawOffscreenArrows(cx, cy) {
      const def = missionDef();
      if (!def) return;
      const targets = [];
      if (MS.state === 'marker') targets.push({ x: def.start.x, y: def.start.y, c: '#ffe066' });
      else if (MS.idx === 0) targets.push({ x: DOCKS.x, y: DOCKS.y, c: '#ffe066' });
      else if (MS.idx === 1) targets.push(MS.dropped ? { x: MS.dropped.x, y: MS.dropped.y, c: '#c792ff' } : { x: PKG_POINTS[MS.pkg].x, y: PKG_POINTS[MS.pkg].y, c: '#ffe066' });
      else if (MS.idx === 2) { for (const g of MS.gangs) if (!g.dead && g.kind === 'gang') targets.push({ x: g.x, y: g.y, c: '#ff5b5b' }); }
      else if (MS.idx === 3) targets.push({ x: MALIBU.x, y: MALIBU.y, c: '#ffe066' });
      for (const t of targets) drawArrowTo(t.x, t.y, t.c, cx, cy);
    }
    function drawArrowTo(tx, ty, color, cx, cy) {
      const sx = tx - cx, sy = ty - cy;
      if (sx >= 36 && sx <= VIEW_W - 36 && sy >= 36 && sy <= VIEW_H - 36) return; // 目标在画面内
      const ang = Math.atan2(sy - VIEW_H / 2, sx - VIEW_W / 2);
      const ex = clamp(sx, 44, VIEW_W - 44), ey = clamp(sy, 44, VIEW_H - 44);
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(ang);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(-8, -9);
      ctx.lineTo(-8, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      const dist = Math.round(Math.hypot(tx - px(), ty - py()) / 3);
      ctx.font = 'bold 12px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = color;
      ctx.fillText(dist + 'm', ex, ey + 24);
      ctx.textAlign = 'left';
    }
    function drawHint() {
      const text = 'WASD/方向键 移动 · F 上/下车 · 空格 出拳/手刹 · R 电台 · 喷漆店(P)消星 · 加油站修车';
      ctx.font = '12px Tahoma, "Microsoft YaHei", sans-serif';
      const w = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(8,10,26,.72)';
      rr((VIEW_W - w) / 2 - 10, VIEW_H - 30, w + 20, 22, 6); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(text, VIEW_W / 2, VIEW_H - 15);
      ctx.textAlign = 'left';
    }
    function drawMsgs() {
      ctx.font = 'bold 15px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      let y = 204;
      for (const m of msgs) {
        ctx.globalAlpha = clamp(m.t, 0, 1);
        ctx.fillStyle = '#000';
        ctx.fillText(m.text, VIEW_W / 2 + 1, y + 1);
        ctx.fillStyle = m.color;
        ctx.fillText(m.text, VIEW_W / 2, y);
        y += 22;
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    }
    function drawSiteProgress() {
      let txt = null, frac = 0;
      if (gasT > 0) { txt = '修车中…'; frac = gasT / 2; }
      else if (sprayT > 0) { txt = "Pay 'n' Spray 喷漆中…"; frac = sprayT / 2; }
      if (!txt) return;
      const w = 240, x = (VIEW_W - w) / 2, y = VIEW_H - 66;
      ctx.fillStyle = 'rgba(8,10,26,.85)';
      rr(x - 8, y - 8, w + 16, 26, 6); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(txt, x, y + 8);
      drawBar(x + 140, y, w - 148, 9, frac, '#7CFC9B', '#333333');
    }
    function drawDialog() {
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const bx = 60, bw = VIEW_W - 120, bh = 98, by = VIEW_H - bh - 36;
      ctx.fillStyle = 'rgba(8,10,26,.94)';
      rr(bx, by, bw, bh, 10); ctx.fill();
      ctx.strokeStyle = '#01cdfe';
      ctx.lineWidth = 2;
      rr(bx, by, bw, bh, 10); ctx.stroke();
      const line = dialog.lines[dialog.i];
      const whoColor = { '汤米': '#5ad1ff', '肯·罗森博格': '#ff9ec6', '兰斯': '#9bff9b' }[line.who] || '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.fillStyle = whoColor;
      ctx.fillText(line.who, bx + 18, by + 26);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Tahoma, "Microsoft YaHei", sans-serif';
      // 中文按字符折行
      let lx = bx + 18, ly = by + 50;
      for (const ch of line.text) {
        const wch = ctx.measureText(ch).width;
        if (lx + wch > bx + bw - 18) { lx = bx + 18; ly += 20; }
        ctx.fillText(ch, lx, ly);
        lx += wch;
      }
      ctx.fillStyle = '#ffe066';
      ctx.font = '12px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('▼ Enter 继续 (' + (dialog.i + 1) + '/' + dialog.lines.length + ')', bx + bw - 16, by + bh - 12);
      ctx.textAlign = 'left';
    }
    function drawWasted() {
      ctx.fillStyle = 'rgba(170,170,170,.5)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 72px Tahoma, sans-serif';
      ctx.fillText('WASTED', VIEW_W / 2, VIEW_H / 2 - 6);
      ctx.font = '15px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.fillText('你倒下了! 医疗费 $300 · 即将在医院门口重生', VIEW_W / 2, VIEW_H / 2 + 34);
      ctx.textAlign = 'left';
    }
    function drawBusted() {
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e23b3b';
      ctx.font = 'bold 70px Tahoma, sans-serif';
      ctx.fillText('BUSTED', VIEW_W / 2, VIEW_H / 2 - 6);
      ctx.fillStyle = '#fff';
      ctx.font = '15px Tahoma, "Microsoft YaHei", sans-serif';
      ctx.fillText('你被警方逮捕! 罚款 $200 · 即将在 Ocean View Hotel 门口重生', VIEW_W / 2, VIEW_H / 2 + 34);
      ctx.textAlign = 'left';
    }

    /* ---------- 电台 ---------- */
    function ensureAudio() {
      if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
      }
      audioOn = true;
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }
    function playNote(freq, t, dur, type, vol) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    }
    function radioTick() {
      if (!audioCtx || !audioOn || station === 0 || isPaused()) return;
      const st = STATIONS[station];
      const spb = 60 / st.bpm / 4; // 十六分音符时长
      if (nextNoteTime < audioCtx.currentTime) nextNoteTime = audioCtx.currentTime + 0.06;
      let guard = 0;
      while (nextNoteTime < audioCtx.currentTime + 0.25 && guard++ < 64) {
        const f = st.seq[step % st.seq.length];
        if (f) playNote(f, nextNoteTime, spb * 1.9, st.wave, 0.05);
        if (step % 4 === 0) {
          const bf = st.bass[(step / 4) % st.bass.length | 0];
          if (bf) playNote(bf, nextNoteTime, spb * 3.4, 'triangle', 0.04);
        }
        nextNoteTime += spb;
        step++;
      }
    }
    function nextStation() {
      station = (station + 1) % STATIONS.length;
      step = 0; nextNoteTime = 0;
      if (station !== 0) ensureAudio();
      addMsg('电台: ' + STATIONS[station].name, '#01cdfe');
    }

    /* ---------- 键盘 ---------- */
    function setKey(code, v) {
      if (code === 'KeyW' || code === 'ArrowUp') { keys.up = v; return true; }
      if (code === 'KeyS' || code === 'ArrowDown') { keys.down = v; return true; }
      if (code === 'KeyA' || code === 'ArrowLeft') { keys.left = v; return true; }
      if (code === 'KeyD' || code === 'ArrowRight') { keys.right = v; return true; }
      return false;
    }
    function onKeyDown(e) {
      ensureAudio();
      if (mode === 'dialog') {
        if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); advanceDialog(); }
        return;
      }
      if (setKey(e.code, true)) { e.preventDefault(); return; }
      if (e.code === 'Space') {
        e.preventDefault();
        if (onFoot) { if (!e.repeat) punch(); }
        else keys.hand = true; // 驾驶时空格 = 手刹
        return;
      }
      if (e.code === 'KeyF' && !e.repeat) {
        e.preventDefault();
        if (onFoot) tryEnterCar(); else tryExitCar();
        return;
      }
      if (e.code === 'KeyR' && !e.repeat) { e.preventDefault(); nextStation(); }
    }
    function onKeyUp(e) {
      if (setKey(e.code, false)) { e.preventDefault(); return; }
      if (e.code === 'Space') { keys.hand = false; e.preventDefault(); }
    }
    function onVis() {
      if (!audioCtx || !audioOn) return;
      if (isPaused() || station === 0) { if (audioCtx.state === 'running') audioCtx.suspend(); }
      else if (audioCtx.state === 'suspended') audioCtx.resume();
    }
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('keyup', onKeyUp);
    document.addEventListener('visibilitychange', onVis);

    /* ---------- 清理: 关闭窗口时停止一切 ---------- */
    win.on('close', () => {
      closed = true;
      cancelAnimationFrame(rafId);
      clearInterval(radioTimer);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('visibilitychange', onVis);
      if (audioCtx) { try { audioCtx.close(); } catch (e) {} }
    });

    addMsg('欢迎来到罪恶都市! 你正步行在 Ocean View Hotel 门口', '#ffe066');
    addMsg('前往黄色光柱接受任务「老司机」, 或按 F 上车自由兜风', '#01cdfe');
    radioTimer = setInterval(radioTick, 40);
    rafId = requestAnimationFrame(frame);
    return win;
  }

  /* ============ 打开应用 (单实例): 在线版 iframe + 离线 Canvas 备用 ============ */
  const VC_URL = 'https://gtavc.armdev.cn/';
  let single = null;
  function open() {
    if (single && !single.closed) { single.focus(); return; }
    const win = XP.createWindow({
      title: '侠盗飞车:罪恶都市', icon: '🚗', width: 920, height: 660,
      onClose: () => { single = null; },
    });
    single = win;

    win.body.style.padding = '0';
    win.body.style.display = 'flex';
    win.body.style.flexDirection = 'column';
    win.body.style.background = '#0b1020';

    // 工具栏
    const iframe = XP.el('iframe', {
      src: VC_URL, allowfullscreen: '',
      allow: 'autoplay; fullscreen; gamepad; clipboard-write',
      style: { width: '100%', height: '100%', border: '0', display: 'block', background: '#000' },
    });
    const loadingEl = XP.el('div', { class: 'app-vc-focus' }, [
      XP.el('div', { class: 'ico', text: '🚗' }),
      XP.el('div', { class: 't1', text: '正在加载罪恶都市在线版…' }),
      XP.el('div', { class: 't2', text: '首次进入需下载游戏资源(数百MB), 请耐心等待; 若长时间黑屏, 点工具栏「离线版」' }),
    ]);
    iframe.addEventListener('load', () => loadingEl.classList.add('hidden'));

    const toolbar = XP.el('div', { class: 'xp-toolbar', style: { flex: 'none' } }, [
      XP.el('span', { html: '🌐' }),
      XP.el('input', { class: 'xp-input', readonly: '', value: VC_URL, style: { flex: '1', fontSize: '11px' } }),
      XP.el('div', { class: 'xp-tool-btn', html: '🔄 <span>刷新</span>', onclick: () => { loadingEl.classList.remove('hidden'); iframe.src = VC_URL; } }),
      XP.el('div', { class: 'xp-tool-btn', html: '↗️ <span>新标签页打开</span>', onclick: () => window.open(VC_URL, '_blank') }),
      XP.el('div', { class: 'xp-tool-btn', html: '🎮 <span>离线版</span>', onclick: () => switchOffline() }),
    ]);
    win.body.appendChild(toolbar);

    const onlineWrap = XP.el('div', { style: { flex: '1', position: 'relative', minHeight: '0' } }, [iframe, loadingEl]);
    win.body.appendChild(onlineWrap);

    const offlineWrap = XP.el('div', { class: 'hidden', style: { flex: '1', alignItems: 'center', justifyContent: 'center', minHeight: '0' } });
    win.body.appendChild(offlineWrap);
    let offlineStarted = false;
    function switchOffline() {
      if (!offlineStarted) { offlineStarted = true; offlineWrap.style.display = 'flex'; startOffline(offlineWrap, win); }
      onlineWrap.classList.add('hidden');
      offlineWrap.classList.remove('hidden');
    }
    return win;
  }

  XP.registerApp({ id: 'vicecity', name: '侠盗飞车:罪恶都市', icon: '🚗', open });
})();
