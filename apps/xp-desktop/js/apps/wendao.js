/* ============================================================
   问道 — 完整回合制 RPG (2005 年网游风格, Canvas 像素渲染)
   ------------------------------------------------------------
   · 五门派(金木水火土)· 五行相克 · 三张大地图(天墉城/十里坡/轩辕坟)
   · 主线+支线任务 · 宠物抓捕养成 · 回合制战斗 · 背包装备 · 商店客栈
   · 存档: localStorage 'winxp_wendao_save'
   · 素材: assets/img/wendao/ (Kenney Tiny Town CC0 瓦片 + AI 生成像素图)
   · 纯离线: 运行时零网络请求; 界面文字全部简体中文
   操作: 方向键/WASD 移动 · 空格 交互/确认 · B背包 Q任务 P宠物 · Esc 关闭
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 应用专有 CSS (前缀 app-wd-) ---------------- */
  const CSS = `
.app-wd-wrap { position: relative; padding: 6px; background: #ece9d8; width: 812px; user-select: none; }
.app-wd-canvas {
  display: block; width: 800px; height: 600px; background: #0a0a14;
  image-rendering: pixelated; border: 2px solid #7f9db9; outline: none;
}
.app-wd-canvas:focus { border-color: #316ac5; }
.app-wd-status { margin-top: 5px; font-size: 11px; color: #222; }
.app-wd-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-weight: bold; }
.app-wd-money { color: #8a5a00; }
.app-wd-sect { font-weight: bold; }
.app-wd-bars { display: flex; flex-direction: column; gap: 2px; }
.app-wd-barline { display: flex; align-items: center; gap: 6px; }
.app-wd-barline .lab { width: 26px; text-align: right; color: #444; flex: none; }
.app-wd-track { flex: 1; height: 11px; border: 1px solid #7f9db9; background: #fff; position: relative; overflow: hidden; }
.app-wd-fill { height: 100%; transition: width .2s; }
.app-wd-hp { background: linear-gradient(#ff7a7a, #c01818); }
.app-wd-mp { background: linear-gradient(#7ab8ff, #1850c0); }
.app-wd-xp { background: linear-gradient(#ffe27a, #d8a818); }
.app-wd-val { width: 70px; font-size: 10px; color: #333; flex: none; }
.app-wd-hint { margin-top: 4px; color: #666; font-size: 11px; text-align: center; border-top: 1px solid #d8d4c4; padding-top: 3px; }
.app-wd-overlay {
  position: absolute; left: 8px; top: 8px; width: 800px; height: 600px;
  background: rgba(8,8,18,.93); color: #e8e8e8; z-index: 10; overflow: hidden;
  font-size: 13px; display: flex; flex-direction: column;
}
.app-wd-ov-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: linear-gradient(#2a3a6a, #1a2444); border-bottom: 2px solid #4a6aaa; flex: none;
}
.app-wd-ov-head h2 { margin: 0; font-size: 17px; color: #ffe9a8; letter-spacing: 2px; }
.app-wd-ov-body { flex: 1; overflow-y: auto; padding: 10px 12px; }
.app-wd-ov-foot { flex: none; padding: 6px 12px; border-top: 1px solid #3a4a6a; color: #9ab; font-size: 11px; text-align: center; }
.app-wd-btn {
  background: linear-gradient(#f4f2e8, #d8d4c4); border: 1px solid #7a7a6a; border-radius: 3px;
  color: #1a1a1a; font-size: 13px; padding: 5px 14px; cursor: pointer; font-family: inherit;
}
.app-wd-btn:hover { background: linear-gradient(#fffef4, #e8e4d4); border-color: #316ac5; }
.app-wd-btn:disabled { color: #999; cursor: default; background: #d0d0c8; border-color: #aaa; }
.app-wd-btn.sel { outline: 2px solid #ffd93d; }
.app-wd-btnrow { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.app-wd-card {
  border: 2px solid #4a5a7a; border-radius: 5px; background: #14182a; padding: 8px;
  cursor: pointer; text-align: center;
}
.app-wd-card:hover { border-color: #8aa0d0; }
.app-wd-card.sel { border-color: #ffd93d; background: #1e2440; }
.app-wd-card img { width: 110px; height: 110px; object-fit: contain; image-rendering: auto; }
.app-wd-card h3 { margin: 4px 0 2px; font-size: 15px; }
.app-wd-card p { margin: 2px 0; font-size: 11px; color: #aab; line-height: 1.5; }
.app-wd-grid { display: grid; gap: 6px; }
.app-wd-slot {
  border: 1px solid #4a5a7a; background: #10142a; border-radius: 3px; min-height: 44px;
  padding: 3px; font-size: 10px; cursor: pointer; position: relative; overflow: hidden;
}
.app-wd-slot:hover { border-color: #8aa0d0; }
.app-wd-slot.sel { border-color: #ffd93d; background: #1e2440; }
.app-wd-slot .nm { color: #ffe9a8; font-size: 11px; }
.app-wd-slot .ct { position: absolute; right: 3px; bottom: 2px; color: #9fd; font-size: 11px; }
.app-wd-tag { display: inline-block; padding: 0 5px; border-radius: 3px; font-size: 10px; margin-left: 4px; }
.app-wd-table { width: 100%; border-collapse: collapse; }
.app-wd-table td, .app-wd-table th { border-bottom: 1px solid #2a3450; padding: 5px 6px; text-align: left; font-size: 12px; }
.app-wd-table th { color: #9ab; font-weight: normal; }
.app-wd-table tr:hover td { background: #1a2038; }
.app-wd-petrow { display: flex; align-items: center; gap: 8px; border: 1px solid #3a4a6a; border-radius: 4px; padding: 6px; margin-bottom: 6px; background: #10142a; }
.app-wd-petrow img { width: 44px; height: 44px; object-fit: contain; }
.app-wd-petrow.active { border-color: #ffd93d; }
.app-wd-mini-track { height: 8px; border: 1px solid #556; background: #222; border-radius: 4px; overflow: hidden; margin-top: 2px; }
.app-wd-mini-fill { height: 100%; }
.app-wd-input {
  background: #fff; border: 1px solid #7a7a6a; border-radius: 3px; padding: 5px 8px;
  font-size: 13px; font-family: inherit; width: 160px; color: #111;
}
.app-wd-dialog-portrait { width: 110px; height: 110px; object-fit: contain; flex: none; border: 2px solid #4a5a7a; border-radius: 5px; background: #0c1024; }
.app-wd-title-btn {
  display: block; width: 240px; margin: 8px auto; padding: 10px; font-size: 16px; letter-spacing: 4px;
  background: linear-gradient(#f4f2e8, #d8d4c4); border: 2px solid #7a6a3a; border-radius: 4px;
  color: #2a2008; cursor: pointer; font-family: inherit; font-weight: bold;
}
.app-wd-title-btn:hover { background: linear-gradient(#fffef4, #ece8d4); border-color: #ffd93d; }
.app-wd-title-btn:disabled { color: #999; cursor: default; border-color: #666; background: #c8c8c0; }
.app-wd-title-btn.sel { outline: 3px solid #ffd93d; }
`;
  let cssInjected = false;
  function injectCSS() {
    if (cssInjected) return;
    cssInjected = true;
    const s = document.createElement('style');
    s.id = 'app-wd-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ============================================================
     静态数据: 五行 / 门派 / 怪物 / 道具 / 装备 / 任务
     ============================================================ */
  const SAVE_KEY = 'winxp_wendao_save';
  const TS = 32, CW = 800, CH = 600;

  // 五行相克: 金克木→木克土→土克水→水克火→火克金 (克制方伤害+30%)
  const ELEM_BEATS = { jin: 'mu', mu: 'tu', tu: 'shui', shui: 'huo', huo: 'jin' };
  const ELEM_CN = { jin: '金', mu: '木', shui: '水', huo: '火', tu: '土' };
  const ELEM_FX = { jin: '#ffd84a', mu: '#5fd97a', shui: '#5ab8ff', huo: '#ff7a3a', tu: '#c8a060' };

  const SECTS = {
    jin: {
      name: '金系', el: '金', color: '#c8a020', img: 'char-jin', desc: '物理爆发·单体斩杀',
      base: { hp: 75, mp: 22, atk: 15, def: 5, spd: 8 }, grow: { hp: 9, mp: 2, atk: 3, def: 1, spd: 1 },
      skills: [
        { id: 'j1', name: '力劈华山', lv: 1, mp: 6, kind: 'dmg', mult: 1.9, tgt: 'one', fx: 'jin', desc: '单体物理高伤' },
        { id: 'j2', name: '破甲斩', lv: 4, mp: 9, kind: 'dmg', mult: 1.5, tgt: 'one', fx: 'jin', pierce: true, desc: '无视一半防御' },
        { id: 'j3', name: '万剑归宗', lv: 9, mp: 20, kind: 'dmg', mult: 1.5, tgt: 'all', fx: 'jin', desc: '群体剑雨' },
      ],
    },
    mu: {
      name: '木系', el: '木', color: '#2e9e5b', img: 'char-mu', desc: '治疗辅助·毒伤',
      base: { hp: 80, mp: 30, atk: 11, def: 5, spd: 7 }, grow: { hp: 10, mp: 4, atk: 2, def: 1, spd: 1 },
      skills: [
        { id: 'm1', name: '回春术', lv: 1, mp: 8, kind: 'heal', mult: 2.2, tgt: 'ally', fx: 'mu', desc: '治疗己方单体' },
        { id: 'm2', name: '毒藤缠绕', lv: 4, mp: 10, kind: 'dmg', mult: 1.2, tgt: 'one', fx: 'mu', dot: 3, desc: '伤害+中毒3回合' },
        { id: 'm3', name: '春风化雨', lv: 9, mp: 22, kind: 'heal', mult: 1.4, tgt: 'allally', fx: 'mu', desc: '治疗己方全体' },
      ],
    },
    shui: {
      name: '水系', el: '水', color: '#2a7fd4', img: 'char-shui', desc: '法术控制·冰封',
      base: { hp: 70, mp: 34, atk: 12, def: 4, spd: 9 }, grow: { hp: 8, mp: 5, atk: 2, def: 1, spd: 1 },
      skills: [
        { id: 's1', name: '冰封', lv: 1, mp: 9, kind: 'dmg', mult: 1.3, tgt: 'one', fx: 'shui', freeze: 0.5, desc: '伤害+50%冰冻' },
        { id: 's2', name: '水龙吟', lv: 5, mp: 14, kind: 'dmg', mult: 2.1, tgt: 'one', fx: 'shui', desc: '强力单体' },
        { id: 's3', name: '冰天雪地', lv: 10, mp: 24, kind: 'dmg', mult: 1.4, tgt: 'all', fx: 'shui', freeze: 0.25, desc: '群体+25%冰冻' },
      ],
    },
    huo: {
      name: '火系', el: '火', color: '#d04828', img: 'char-huo', desc: '法术群攻·灼烧',
      base: { hp: 68, mp: 32, atk: 13, def: 4, spd: 8 }, grow: { hp: 7, mp: 5, atk: 3, def: 1, spd: 1 },
      skills: [
        { id: 'h1', name: '烈火燎原', lv: 1, mp: 10, kind: 'dmg', mult: 1.1, tgt: 'all', fx: 'huo', desc: '群体火焰' },
        { id: 'h2', name: '三昧真火', lv: 6, mp: 16, kind: 'dmg', mult: 2.3, tgt: 'one', fx: 'huo', desc: '超强单体' },
        { id: 'h3', name: '焚天灭地', lv: 11, mp: 28, kind: 'dmg', mult: 1.8, tgt: 'all', fx: 'huo', desc: '毁天灭地' },
      ],
    },
    tu: {
      name: '土系', el: '土', color: '#a07838', img: 'char-tu', desc: '防御肉盾·反震',
      base: { hp: 95, mp: 20, atk: 12, def: 8, spd: 5 }, grow: { hp: 13, mp: 2, atk: 2, def: 2, spd: 1 },
      skills: [
        { id: 't1', name: '泰山压顶', lv: 1, mp: 8, kind: 'dmg', mult: 1.6, tgt: 'one', fx: 'tu', selfdef: true, desc: '伤害+本回合防御' },
        { id: 't2', name: '铜墙铁壁', lv: 5, mp: 10, kind: 'buff', tgt: 'self', fx: 'tu', desc: '3回合受伤-40%' },
        { id: 't3', name: '地裂山崩', lv: 10, mp: 22, kind: 'dmg', mult: 1.5, tgt: 'all', fx: 'tu', selfdef: true, desc: '群体+防御' },
      ],
    },
  };
  const SECT_ORDER = ['jin', 'mu', 'shui', 'huo', 'tu'];

  const MONSTERS = {
    yegou:    { name: '野狗',   img: 'mon-yegou',    elem: 'tu',   lvMin: 1,  lvMax: 4,  hp: 30,  atk: 8,  def: 2,  spd: 6,  exp: 9,   gold: 6,   skill: null,    areas: ['slipo'] },
    shanzei:  { name: '山贼',   img: 'mon-shanzei',  elem: 'jin',  lvMin: 3,  lvMax: 7,  hp: 46,  atk: 13, def: 4,  spd: 7,  exp: 15,  gold: 11,  skill: 'heavy', areas: ['slipo'] },
    huli:     { name: '狐狸精', img: 'mon-huli',     elem: 'huo',  lvMin: 4,  lvMax: 8,  hp: 42,  atk: 15, def: 3,  spd: 11, exp: 17,  gold: 13,  skill: 'charm', areas: ['slipo'] },
    laohu:    { name: '老虎',   img: 'mon-laohu',    elem: 'jin',  lvMin: 6,  lvMax: 10, hp: 68,  atk: 18, def: 6,  spd: 9,  exp: 24,  gold: 17,  skill: 'heavy', areas: ['slipo', 'xfen'] },
    kulou:    { name: '骷髅兵', img: 'mon-kulou',    elem: 'shui', lvMin: 8,  lvMax: 12, hp: 82,  atk: 20, def: 9,  spd: 6,  exp: 30,  gold: 21,  skill: 'heavy', areas: ['xfen'] },
    shuyao:   { name: '树妖',   img: 'mon-shuyao',   elem: 'mu',   lvMin: 9,  lvMax: 13, hp: 98,  atk: 22, def: 11, spd: 5,  exp: 34,  gold: 23,  skill: 'poison', areas: ['xfen'] },
    xiabing:  { name: '虾兵',   img: 'mon-xiabing',  elem: 'shui', lvMin: 10, lvMax: 14, hp: 112, atk: 25, def: 12, spd: 10, exp: 40,  gold: 27,  skill: 'heavy', areas: ['xfen'] },
    longwang: { name: '幽冥龙王', img: 'mon-longwang', elem: 'shui', lvMin: 12, lvMax: 12, hp: 750, atk: 30, def: 14, spd: 12, exp: 320, gold: 520, skill: 'aoe', boss: true, areas: ['xfen'] },
  };
  const ENC_TABLES = {
    slipo: [['yegou', 40], ['shanzei', 25], ['huli', 20], ['laohu', 15]],
    xfen: [['kulou', 30], ['shuyao', 25], ['xiabing', 25], ['laohu', 20]],
  };

  const ITEMS = {
    hppot:  { name: '小还丹', type: 'consum', heal: 80, price: 50,  desc: '恢复80点HP' },
    mppot:  { name: '凝神丹', type: 'consum', mp: 40,   price: 60,  desc: '恢复40点MP' },
    trap:   { name: '捕兽夹', type: 'consum', price: 100, desc: '战斗中抓捕宠物(怪物HP<30%才可抓)' },
    double: { name: '双倍丹', type: 'consum', price: 300, desc: '接下来5场战斗经验翻倍' },
    wine:   { name: '桂花酒', type: 'quest', desc: '客栈掌柜的佳酿,要送给帮派使者' },
  };

  // 装备: slot=weapon/hat/armor/shoe; sect 限定门派; lv 需求等级
  const EQUIPS = {
    w_jin1:  { name: '青铜剑', slot: 'weapon', sect: 'jin',  lv: 1,  atk: 4,  price: 150 },
    w_jin2:  { name: '玄铁剑', slot: 'weapon', sect: 'jin',  lv: 5,  atk: 10, price: 600 },
    w_jin3:  { name: '屠龙刀', slot: 'weapon', sect: 'jin',  lv: 10, atk: 18, quest: true },
    w_mu1:   { name: '桃木杖', slot: 'weapon', sect: 'mu',   lv: 1,  atk: 3,  price: 150 },
    w_mu2:   { name: '青藤杖', slot: 'weapon', sect: 'mu',   lv: 5,  atk: 8,  price: 600 },
    w_mu3:   { name: '回春杖', slot: 'weapon', sect: 'mu',   lv: 10, atk: 14, quest: true },
    w_shui1: { name: '寒冰扇', slot: 'weapon', sect: 'shui', lv: 1,  atk: 3,  price: 150 },
    w_shui2: { name: '碧波扇', slot: 'weapon', sect: 'shui', lv: 5,  atk: 9,  price: 600 },
    w_shui3: { name: '玄冰扇', slot: 'weapon', sect: 'shui', lv: 10, atk: 15, quest: true },
    w_huo1:  { name: '烈火符', slot: 'weapon', sect: 'huo',  lv: 1,  atk: 4,  price: 150 },
    w_huo2:  { name: '朱雀符', slot: 'weapon', sect: 'huo',  lv: 5,  atk: 11, price: 600 },
    w_huo3:  { name: '焚天符', slot: 'weapon', sect: 'huo',  lv: 10, atk: 17, quest: true },
    w_tu1:   { name: '石锤',   slot: 'weapon', sect: 'tu',   lv: 1,  atk: 3,  price: 150 },
    w_tu2:   { name: '玄石锤', slot: 'weapon', sect: 'tu',   lv: 5,  atk: 9,  price: 600 },
    w_tu3:   { name: '泰山锤', slot: 'weapon', sect: 'tu',   lv: 10, atk: 14, quest: true },
    hat1: { name: '布帽', slot: 'hat', lv: 1,  def: 1, price: 80 },
    hat2: { name: '皮帽', slot: 'hat', lv: 5,  def: 3, price: 300 },
    hat3: { name: '铁盔', slot: 'hat', lv: 10, def: 6, price: 800 },
    arm1: { name: '布衣', slot: 'armor', lv: 1,  def: 2, hp: 10, price: 100 },
    arm2: { name: '皮甲', slot: 'armor', lv: 5,  def: 5, hp: 30, price: 400 },
    arm3: { name: '铁甲', slot: 'armor', lv: 10, def: 9, hp: 60, price: 1000 },
    shoe1: { name: '布鞋',   slot: 'shoe', lv: 1,  spd: 2, price: 80 },
    shoe2: { name: '疾风靴', slot: 'shoe', lv: 5,  spd: 5, price: 350 },
    shoe3: { name: '追云靴', slot: 'shoe', lv: 10, spd: 9, price: 900 },
  };
  const SLOT_CN = { weapon: '武器', hat: '帽子', armor: '衣服', shoe: '鞋' };

  const SHOPS = {
    drug: { name: '药店', items: ['hppot', 'mppot', 'trap'] },
    equip: { name: '装备店', items: ['w_?1', 'w_?2', 'hat1', 'hat2', 'arm1', 'arm2', 'shoe1', 'shoe2'] },
  };

  const MAIN_QUESTS = [
    { t: '初入江湖', d: '初到天墉城,先去找药店老板聊聊吧。(城西北药店门口)' },
    { t: '为民除害', d: '十里坡野狗为患,前往消灭5只野狗。(进度 {dogs}/5)' },
    { t: '凯旋复命', d: '野狗已除!回天墉城向任务长老复命。(城西南长老府)' },
    { t: '屠龙之旅', d: '穿过十里坡前往轩辕坟,击败守底的幽冥龙王!' },
    { t: '衣锦还乡', d: '龙王已诛!回天墉城向任务长老报告,领取奖励。' },
    { t: '问道之旅', d: '主线完成!继续修炼、捕捉神宠,成为一代大侠吧。' },
  ];

  /* ============================================================
     核心数值公式 (纯函数, 与 /tmp 测试脚本互相校验)
     ============================================================ */
  // 五行克制倍率: 攻击方克制防御方 +30%
  function elemMult(atkElem, defElem) { return ELEM_BEATS[atkElem] === defElem ? 1.3 : 1; }

  // 抓捕成功率: BOSS不可抓; HP>=30%不可抓; HP越低成功率越高
  function capChance(hp, maxhp, boss) {
    if (boss) return 0;
    const r = hp / maxhp;
    if (r >= 0.3) return 0;
    return Math.min(0.85, 0.2 + (0.3 - r) * 2);
  }

  // 伤害公式: rnd 为随机源(注入便于测试)
  // p = { atk, def, mult, elemA, elemB, pierce, defend, buffDef }
  function calcDmg(p, rnd) {
    if (rnd() < 0.05) return { dmg: 0, miss: true, crit: false };   // 5% 闪避
    const def = p.pierce ? p.def * 0.5 : p.def;
    let base = Math.max(1, p.atk * p.mult - def * 0.6);
    base *= elemMult(p.elemA, p.elemB);                              // 五行克制
    const crit = rnd() < 0.10;                                       // 10% 暴击
    if (crit) base *= 1.5;
    base *= 0.88 + rnd() * 0.24;                                     // ±12% 浮动
    if (p.defend) base *= 0.5;                                       // 防御姿态减半
    if (p.buffDef) base *= 0.6;                                      // 铜墙铁壁 -40%
    return { dmg: Math.max(1, Math.round(base)), miss: false, crit: crit };
  }

  function expNeed(lv) { return 25 + lv * 35; }

  // 怪物按等级缩放属性
  function monStat(def, lv) {
    return {
      maxhp: Math.round(def.hp * (1 + 0.12 * (lv - 1))),
      atk: Math.round(def.atk * (1 + 0.08 * (lv - 1))),
      def: Math.round(def.def * (1 + 0.06 * (lv - 1))),
      spd: def.spd,
    };
  }

  // 任务进度: 击杀野狗推进主线阶段1→2
  function questDogKilled(q) {
    if (q.main === 1 && q.dogs < 5) {
      q.dogs++;
      if (q.dogs >= 5) q.main = 2;
      return true;
    }
    return false;
  }

  XP.registerApp({ id: 'wendao', name: '问道', icon: '⚔️', open: open });

  /* ============================================================
     打开应用
     ============================================================ */
  function open() {
    injectCSS();
    const win = XP.createWindow({
      title: '问道', icon: '⚔️', width: 828, height: 766, resizable: false,
    });
    win.body.style.overflow = 'hidden';

    /* ---------- DOM ---------- */
    const canvas = XP.el('canvas', { class: 'app-wd-canvas', width: CW, height: CH, tabindex: '0' });
    const nameText = XP.el('span', { text: '道友请留步' });
    const sectText = XP.el('span', { class: 'app-wd-sect' });
    const lvText = XP.el('span');
    const titleText = XP.el('span', { style: { color: '#a03028' } });
    const moneyText = XP.el('span', { class: 'app-wd-money' });
    const hpFill = XP.el('div', { class: 'app-wd-fill app-wd-hp' });
    const mpFill = XP.el('div', { class: 'app-wd-fill app-wd-mp' });
    const xpFill = XP.el('div', { class: 'app-wd-fill app-wd-xp' });
    const hpVal = XP.el('span', { class: 'app-wd-val' });
    const mpVal = XP.el('span', { class: 'app-wd-val' });
    const xpVal = XP.el('span', { class: 'app-wd-val' });
    function barLine(lab, fill, val) {
      return XP.el('div', { class: 'app-wd-barline' }, [
        XP.el('span', { class: 'lab', text: lab }),
        XP.el('div', { class: 'app-wd-track' }, [fill]),
        val,
      ]);
    }
    const ovLayer = XP.el('div');   // 弹层容器
    const wrap = XP.el('div', { class: 'app-wd-wrap' }, [
      canvas,
      XP.el('div', { class: 'app-wd-status' }, [
        XP.el('div', { class: 'app-wd-row' }, [nameText, sectText, lvText, titleText, moneyText]),
        XP.el('div', { class: 'app-wd-bars' }, [
          barLine('HP', hpFill, hpVal),
          barLine('MP', mpFill, mpVal),
          barLine('经验', xpFill, xpVal),
        ]),
        XP.el('div', { class: 'app-wd-hint', text: '方向键/WASD移动 · 空格交互 · B背包 Q任务 P宠物 · 草地遇敌 · Esc关闭弹层' }),
      ]),
      ovLayer,
    ]);
    win.body.appendChild(wrap);

    /* ---------- 定时器 ---------- */
    const timers = [];
    function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }

    /* ---------- 启动画面 (AI 生成素材, 2 秒后淡出) ---------- */
    const splash = XP.el('div', { style: {
      position: 'absolute', inset: '0', zIndex: '20', background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity .8s',
    } }, [
      XP.el('img', { src: 'assets/img/splash-wendao.png', style: { width: '100%', height: '100%', objectFit: 'cover' }, onerror: () => splash.remove() }),
      XP.el('div', { style: { position: 'absolute', bottom: '20px', color: '#ffe9a8', fontSize: '16px', textShadow: '0 0 8px #000', letterSpacing: '8px', fontWeight: 'bold' }, text: '问 道 · 天墉城' }),
    ]);
    win.body.appendChild(splash);
    const splashT = setTimeout(() => { splash.style.opacity = '0'; const t2 = setTimeout(() => splash.remove(), 850); timers.push(t2); }, 2000);
    timers.push(splashT);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    /* ---------- 素材加载 ---------- */
    const IMG_SRC = {
      'tile-grass': 'assets/img/wendao/tile-grass.png',
      'tile-grass2': 'assets/img/wendao/tile-grass2.png',
      'tile-grass3': 'assets/img/wendao/tile-grass3.png',
      'tile-sand': 'assets/img/wendao/tile-sand.png',
      'tile-tree-pine': 'assets/img/wendao/tile-tree-pine.png',
      'tile-tree-round': 'assets/img/wendao/tile-tree-round.png',
      'tile-tree-orange': 'assets/img/wendao/tile-tree-orange.png',
      'tile-door': 'assets/img/wendao/tile-door.png',
      'tile-rock': 'assets/img/wendao/tile-rock.png',
      'tile-ladder': 'assets/img/wendao/tile-ladder.png',
      'char-jin': 'assets/img/wendao/char-jin.png',
      'char-mu': 'assets/img/wendao/char-mu.png',
      'char-shui': 'assets/img/wendao/char-shui.png',
      'char-huo': 'assets/img/wendao/char-huo.png',
      'char-tu': 'assets/img/wendao/char-tu.png',
      'mon-yegou': 'assets/img/wendao/mon-yegou.png',
      'mon-shanzei': 'assets/img/wendao/mon-shanzei.png',
      'mon-huli': 'assets/img/wendao/mon-huli.png',
      'mon-laohu': 'assets/img/wendao/mon-laohu.png',
      'mon-kulou': 'assets/img/wendao/mon-kulou.png',
      'mon-shuyao': 'assets/img/wendao/mon-shuyao.png',
      'mon-xiabing': 'assets/img/wendao/mon-xiabing.png',
      'mon-longwang': 'assets/img/wendao/mon-longwang.png',
      'npc-yaodian': 'assets/img/wendao/npc-yaodian.png',
      'npc-zhuangbei': 'assets/img/wendao/npc-zhuangbei.png',
      'npc-kezhan': 'assets/img/wendao/npc-kezhan.png',
      'npc-bangpai': 'assets/img/wendao/npc-bangpai.png',
      'npc-zhanglao': 'assets/img/wendao/npc-zhanglao.png',
      'chest': 'assets/img/wendao/chest.png',
      'bg-grass': 'assets/img/wendao/bg-grass.png',
      'bg-grave': 'assets/img/wendao/bg-grave.png',
      'bg-town': 'assets/img/wendao/bg-town.png',
    };
    const imgs = {};
    let loadDone = 0;
    const loadTotal = Object.keys(IMG_SRC).length;
    let ready = false, started = false;
    for (const k in IMG_SRC) {
      const im = new Image();
      im.onload = im.onerror = () => {
        loadDone++;
        if (loadDone === loadTotal) { ready = true; tryStart(); }
      };
      im.src = IMG_SRC[k];
      imgs[k] = im;
    }
    function imgOk(im) { return im && im.complete && im.naturalWidth > 0; }

    /* ---------- 音效 ---------- */
    let actx = null;
    function ac() {
      if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      return actx;
    }
    function tone(freq, start, dur, type, gain, slideTo) {
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), gn = c.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, start);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
      gn.gain.setValueAtTime(0.0001, start);
      gn.gain.exponentialRampToValueAtTime(gain || 0.08, start + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(gn); gn.connect(c.destination);
      o.start(start); o.stop(start + dur + 0.03);
    }
    function noise(start, dur, gain) {
      const c = ac(); if (!c) return;
      const n = Math.floor(c.sampleRate * dur);
      const buf = c.createBuffer(1, n, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = c.createBufferSource(); s.buffer = buf;
      const gn = c.createGain(); gn.gain.value = gain || 0.05;
      s.connect(gn); gn.connect(c.destination); s.start(start);
    }
    const SFX = {
      atk:    () => { const t = ac().currentTime; tone(240, t, 0.12, 'square', 0.05, 110); noise(t, 0.08, 0.03); },
      hit:    () => { const t = ac().currentTime; tone(180, t, 0.14, 'sawtooth', 0.05, 90); noise(t, 0.1, 0.04); },
      crit:   () => { const t = ac().currentTime; tone(880, t, 0.1, 'square', 0.06); tone(440, t + 0.05, 0.16, 'square', 0.06); noise(t, 0.14, 0.05); },
      skill:  () => { const t = ac().currentTime; tone(300, t, 0.3, 'triangle', 0.06, 950); },
      heal:   () => { const t = ac().currentTime;[523, 659, 784].forEach((f, i) => tone(f, t + i * 0.09, 0.2, 'sine', 0.07)); },
      miss:   () => { const t = ac().currentTime; tone(1400, t, 0.06, 'sine', 0.03, 2200); },
      capture:() => { const t = ac().currentTime;[400, 560, 760, 1020].forEach((f, i) => tone(f, t + i * 0.1, 0.22, 'square', 0.05)); },
      fail:   () => { const t = ac().currentTime; tone(200, t, 0.25, 'square', 0.05, 120); },
      chest:  () => { const t = ac().currentTime;[880, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.07, 0.18, 'triangle', 0.06)); },
      level:  () => { const t = ac().currentTime;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.1, 0.3, 'triangle', 0.07)); },
      flee:   () => { const t = ac().currentTime; tone(600, t, 0.3, 'sine', 0.05, 150); },
      buy:    () => { const t = ac().currentTime; tone(1200, t, 0.05, 'square', 0.04); tone(1600, t + 0.05, 0.08, 'square', 0.04); },
      portal: () => { const t = ac().currentTime; tone(300, t, 0.4, 'sine', 0.06, 900); },
    };
    function sfx(name) { try { if (ac()) (SFX[name] || SFX.atk)(); } catch (e) {} }

    /* ---------- 游戏总状态 ---------- */
    const g = {
      state: 'loading',          // loading|title|create|map|dialog|shop|bag|quest|pet|help|battle
      frame: 0, raf: 0,
      // 角色
      name: '道友请留步', sect: 'jin', gender: 'm', title: '',
      lv: 1, exp: 0, hp: 75, maxhp: 75, mp: 22, maxmp: 22,
      atk: 15, def: 5, spd: 8, money: 100,
      // 位置
      mapId: 'town', px: 0, py: 0, tx: 0, ty: 0, face: 0, moving: false,
      safeSteps: 3, doubleBattles: 0,
      // 任务
      quest: { main: 0, dogs: 0, sideWine: 0 },   // sideWine: 0未接 1已接 2完成
      flags: { bossDead: false, chests: {} },
      // 背包: 24格, 元素 {id, n}
      bag: [], equip: { weapon: null, hat: null, armor: null, shoe: null },
      pets: [], activePet: 0,
      battle: null,
      sel: 0,            // 通用选择索引(标题/弹层)
      dialog: null, shop: null, bagSel: 0, petSel: 0,
    };
    const keys = { up: false, down: false, left: false, right: false };
    function clearKeys() { keys.up = keys.down = keys.left = keys.right = false; }

    /* ---------- 存档 ---------- */
    function saveGame(silent) {
      const data = {
        v: 2, name: g.name, sect: g.sect, gender: g.gender, title: g.title,
        lv: g.lv, exp: g.exp, hp: g.hp, maxhp: g.maxhp, mp: g.mp, maxmp: g.maxmp,
        atk: g.atk, def: g.def, spd: g.spd, money: g.money,
        mapId: g.mapId, px: Math.round(g.px), py: Math.round(g.py),
        doubleBattles: g.doubleBattles,
        quest: g.quest, flags: g.flags, bag: g.bag, equip: g.equip,
        pets: g.pets, activePet: g.activePet,
      };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        if (!silent) { XP.notify('问道', '游戏已保存'); XP.sound('ding'); }
      } catch (e) { XP.notify('问道', '存档失败'); }
    }
    function hasSave() {
      try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    }
    function loadGame() {
      let d;
      try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
      if (!d || d.v !== 2) return false;
      Object.assign(g, {
        name: d.name, sect: d.sect, gender: d.gender, title: d.title || '',
        lv: d.lv, exp: d.exp, hp: d.hp, maxhp: d.maxhp, mp: d.mp, maxmp: d.maxmp,
        atk: d.atk, def: d.def, spd: d.spd, money: d.money,
        mapId: MAPS[d.mapId] ? d.mapId : 'town', px: d.px, py: d.py,
        doubleBattles: d.doubleBattles || 0,
        quest: Object.assign({ main: 0, dogs: 0, sideWine: 0 }, d.quest),
        flags: Object.assign({ bossDead: false, chests: {} }, d.flags),
        bag: d.bag || [], equip: Object.assign({ weapon: null, hat: null, armor: null, shoe: null }, d.equip),
        pets: d.pets || [], activePet: d.activePet || 0,
      });
      if (!MAPS[g.mapId].npcs && g.mapId !== 'town') g.mapId = 'town';
      g.tx = Math.floor(g.px / TS); g.ty = Math.floor(g.py / TS);
      g.safeSteps = 3; g.face = 0;
      return true;
    }
    function newGame(name, sect, gender) {
      const s = SECTS[sect];
      Object.assign(g, {
        name: name || '道友请留步', sect: sect, gender: gender, title: '',
        lv: 1, exp: 0, money: 100,
        maxhp: s.base.hp, hp: s.base.hp, maxmp: s.base.mp, mp: s.base.mp,
        atk: s.base.atk, def: s.base.def, spd: s.base.spd,
        mapId: 'town', quest: { main: 0, dogs: 0, sideWine: 0 },
        flags: { bossDead: false, chests: {} },
        bag: [{ id: 'hppot', n: 3 }, { id: 'mppot', n: 2 }, { id: 'trap', n: 5 }],
        equip: { weapon: null, hat: null, armor: null, shoe: null },
        pets: [], activePet: 0, doubleBattles: 0,
      });
      const sp = MAPS.town.spawn;
      g.px = sp.x * TS + TS / 2; g.py = sp.y * TS + TS / 2;
      g.tx = sp.x; g.ty = sp.y; g.face = 0; g.safeSteps = 3;
    }

    /* ============================================================
       地图定义与生成
       地形: 0草地 1草地2 2花草 3道路 4水 5高草(遇敌) 6暗草 7暗高草(遇敌)
       ============================================================ */
    // 确定性伪随机 (装饰用)
    function h2(x, y) {
      let n = (x * 374761393 + y * 668265263) >>> 0;
      n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    }
    function blankMap(w, h, fill) {
      const m = [];
      for (let y = 0; y < h; y++) { m[y] = []; for (let x = 0; x < w; x++) m[y][x] = fill; }
      return m;
    }
    function fillRect(m, x0, y0, w, h, t) {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++)
        if (m[y] && m[y][x] !== undefined) m[y][x] = t;
    }
    function borderTrees(m, tree) {
      const w = m[0].length, h = m.length;
      for (let x = 0; x < w; x++) { m[0][x] = tree; m[h - 1][x] = tree; }
      for (let y = 0; y < h; y++) { m[y][0] = tree; m[y][w - 1] = tree; }
    }

    const MAPS = {};

    // —— 天墉城: 城镇, 5 NPC, 无遇敌 ——
    MAPS.town = (function () {
      const w = 40, h = 30;
      const m = blankMap(w, h, 0);
      // 草地装饰
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const r = h2(x, y);
        if (r < 0.12) m[y][x] = 2; else if (r < 0.3) m[y][x] = 1;
      }
      // 道路: 横 y14-15, 竖 x19-20
      fillRect(m, 1, 14, w - 2, 2, 3);
      fillRect(m, 19, 1, 2, h - 2, 3);
      // 店铺前小路
      fillRect(m, 4, 7, 3, 7, 3); fillRect(m, 12, 7, 3, 7, 3); fillRect(m, 26, 7, 3, 7, 3);
      fillRect(m, 4, 14, 3, 2, 3); fillRect(m, 26, 14, 3, 2, 3);
      // 池塘
      fillRect(m, 30, 20, 6, 5, 4);
      borderTrees(m, -1); // -1 = 树木(对象层绘制)
      m[14][39] = 3; m[15][39] = 3; // 东侧传送点开路
      // 零散树木
      const trees = [];
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        if (m[y][x] === 0 && h2(x + 50, y + 50) < 0.05) { m[y][x] = -1; }
      }
      return {
        id: 'town', name: '天墉城', w: w, h: h, ground: m, dark: false,
        spawn: { x: 19, y: 17 },
        houses: [
          { x: 2, y: 3, w: 7, h: 4, roof: '#4060a0', label: '药' },
          { x: 10, y: 3, w: 7, h: 4, roof: '#a05030', label: '装' },
          { x: 24, y: 3, w: 7, h: 4, roof: '#a03068', label: '栈' },
          { x: 2, y: 9, w: 7, h: 4, roof: '#686868', label: '令' },
          { x: 24, y: 9, w: 7, h: 4, roof: '#3050a0', label: '帮' },
        ],
        npcs: [
          { id: 'yaodian', name: '药店老板', x: 5, y: 8, color: '#8e44ad', portrait: 'npc-yaodian', role: 'drug' },
          { id: 'zhuangbei', name: '装备店老板', x: 13, y: 8, color: '#a05028', portrait: 'npc-zhuangbei', role: 'equip' },
          { id: 'kezhan', name: '客栈掌柜', x: 27, y: 8, color: '#c03060', portrait: 'npc-kezhan', role: 'inn' },
          { id: 'zhanglao', name: '任务长老', x: 5, y: 14, color: '#999', portrait: 'npc-zhanglao', role: 'elder' },
          { id: 'bangpai', name: '帮派使者', x: 27, y: 14, color: '#3050a0', portrait: 'npc-bangpai', role: 'guild' },
        ],
        chests: [], portals: [{ x: 39, y: 14, w: 1, h: 2, to: 'slipo', tx: 1, ty: 15, label: '→十里坡' }],
        enc: null, trees: trees, rocks: [],
      };
    })();

    // —— 十里坡: 野外, 1-10级怪, 宝箱 ——
    MAPS.slipo = (function () {
      const w = 44, h = 32;
      const m = blankMap(w, h, 0);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const r = h2(x + 7, y + 3);
        if (r < 0.1) m[y][x] = 2; else if (r < 0.28) m[y][x] = 1;
      }
      // 道路横贯 (连接两个传送点)
      fillRect(m, 1, 15, w - 2, 2, 3);
      // 高草遇敌区 (道路南北两片)
      fillRect(m, 3, 3, 38, 10, 5);
      fillRect(m, 3, 19, 38, 10, 5);
      // 池塘
      fillRect(m, 30, 22, 5, 4, 4);
      fillRect(m, 6, 5, 4, 3, 4);
      borderTrees(m, -1);
      m[15][0] = 3; m[16][0] = 3; m[15][43] = 3; m[16][43] = 3; // 两侧传送点开路
      // 树木群
      const groves = [[12, 3], [13, 3], [14, 3], [12, 4], [14, 4], [36, 9], [37, 9], [38, 9], [37, 10],
        [4, 20], [5, 20], [4, 21], [20, 26], [21, 26], [22, 26], [21, 27], [40, 24], [41, 24], [40, 25]];
      groves.forEach(([x, y]) => { if (m[y] && m[y][x] !== undefined) m[y][x] = -1; });
      return {
        id: 'slipo', name: '十里坡', w: w, h: h, ground: m, dark: false,
        spawn: { x: 2, y: 15 },
        houses: [], rocks: [],
        npcs: [],
        chests: [{ x: 9, y: 4, gold: 120, item: 'hppot', in: 2 }, { x: 36, y: 27, gold: 200, item: 'double', in: 1 }],
        portals: [
          { x: 0, y: 15, w: 1, h: 2, to: 'town', tx: 38, ty: 15, label: '→天墉城' },
          { x: 43, y: 15, w: 1, h: 2, to: 'xfen', tx: 1, ty: 15, label: '→轩辕坟' },
        ],
        enc: 'slipo',
      };
    })();

    // —— 轩辕坟: 高级怪 8-15级 + BOSS ——
    MAPS.xfen = (function () {
      const w = 44, h = 32;
      const m = blankMap(w, h, 6);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const r = h2(x + 90, y + 60);
        if (r < 0.25) m[y][x] = 7; // 暗高草(遇敌)
      }
      // 道路: 西入口横贯到BOSS平台
      fillRect(m, 1, 15, 36, 2, 3);
      fillRect(m, 37, 13, 6, 6, 3); // BOSS平台
      borderTrees(m, -2); // -2 = 枯树
      m[15][0] = 3; m[16][0] = 3; // 西侧传送点开路
      // 墓碑岩石带
      const rocks = [];
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        if (x === 5 && y === 28) continue; // 避开宝箱
        if ((m[y][x] === 6 || m[y][x] === 7) && h2(x + 200, y + 100) < 0.06) rocks.push([x, y]);
      }
      return {
        id: 'xfen', name: '轩辕坟', w: w, h: h, ground: m, dark: true,
        spawn: { x: 2, y: 15 },
        houses: [], rocks: rocks,
        npcs: [],
        boss: { id: 'longwang', x: 40, y: 15, name: '幽冥龙王' },
        chests: [{ x: 5, y: 28, gold: 300, item: 'trap', in: 3 }],
        portals: [{ x: 0, y: 15, w: 1, h: 2, to: 'slipo', tx: 42, ty: 15, label: '→十里坡' }],
        enc: 'xfen',
      };
    })();

    function curMap() { return MAPS[g.mapId]; }

    function solidAt(map, tx, ty) {
      if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) return true;
      const t = map.ground[ty][tx];
      if (t === 4 || t === -1 || t === -2) return true; // 水/树/枯树
      for (const hh of map.houses)
        if (tx >= hh.x && tx < hh.x + hh.w && ty >= hh.y && ty < hh.y + hh.h) return true;
      for (const n of map.npcs) if (n.x === tx && n.y === ty) return true;
      for (const r of map.rocks) if (r[0] === tx && r[1] === ty) return true;
      for (let i = 0; i < map.chests.length; i++) {
        const c = map.chests[i];
        if (c.x === tx && c.y === ty && !g.flags.chests[map.id + i]) return true;
      }
      if (map.boss && !g.flags.bossDead && map.boss.x === tx && map.boss.y === ty) return true;
      return false;
    }

    /* ============================================================
       角色/宠物/装备 派生属性
       ============================================================ */
    function equipStats() {
      const s = { atk: 0, def: 0, spd: 0, hp: 0 };
      for (const slot in g.equip) {
        const id = g.equip[slot];
        if (!id) continue;
        const e = EQUIPS[id];
        s.atk += e.atk || 0; s.def += e.def || 0; s.spd += e.spd || 0; s.hp += e.hp || 0;
      }
      return s;
    }
    function effAtk() { return g.atk + equipStats().atk; }
    function effDef() { return g.def + equipStats().def; }
    function effSpd() { return g.spd + equipStats().spd; }
    function effMaxHp() { return g.maxhp + equipStats().hp; }

    function bagCount(id) {
      const it = g.bag.find(b => b.id === id);
      return it ? it.n : 0;
    }
    function bagAdd(id, n) {
      const def = ITEMS[id] || EQUIPS[id];
      if (!def) return false;
      n = n || 1;
      if (def.type === 'consum' || def.type === 'quest') {
        const it = g.bag.find(b => b.id === id);
        if (it) { it.n += n; return true; }
      }
      // 消耗品新格子 / 装备每件一格
      for (let i = 0; i < n; i++) {
        if (g.bag.length >= 24) return i > 0;
        if (def.type === 'consum' || def.type === 'quest') { g.bag.push({ id: id, n: n - i }); return true; }
        g.bag.push({ id: id, n: 1 });
      }
      return true;
    }
    function bagRemove(id, n) {
      n = n || 1;
      const it = g.bag.find(b => b.id === id);
      if (!it || it.n < n) return false;
      it.n -= n;
      if (it.n <= 0) g.bag.splice(g.bag.indexOf(it), 1);
      return true;
    }

    function updateStatus() {
      const mh = effMaxHp();
      if (g.hp > mh) g.hp = mh;
      nameText.textContent = g.name;
      sectText.textContent = SECTS[g.sect].name + (g.gender === 'f' ? '·女' : '·男');
      sectText.style.color = SECTS[g.sect].color;
      lvText.textContent = 'Lv.' + g.lv;
      titleText.textContent = g.title ? '【' + g.title + '】' : '';
      moneyText.textContent = '金钱: ' + g.money + ' 文';
      hpFill.style.width = Math.max(0, g.hp / mh * 100) + '%';
      mpFill.style.width = Math.max(0, g.mp / g.maxmp * 100) + '%';
      xpFill.style.width = Math.max(0, Math.min(100, g.exp / expNeed(g.lv) * 100)) + '%';
      hpVal.textContent = g.hp + '/' + mh;
      mpVal.textContent = g.mp + '/' + g.maxmp;
      xpVal.textContent = g.exp + '/' + expNeed(g.lv);
    }

    /* ============================================================
       弹层系统 (DOM overlay)
       ============================================================ */
    function closeOverlay() {
      ovLayer.innerHTML = '';
      if (g.state !== 'battle' && g.state !== 'map' && g.state !== 'loading' && g.state !== 'title' && g.state !== 'create') {
        g.state = 'map';
      }
      try { canvas.focus(); } catch (e) {}
    }
    function makeOverlay(titleText_, onClose) {
      ovLayer.innerHTML = '';
      const body = XP.el('div', { class: 'app-wd-ov-body' });
      const foot = XP.el('div', { class: 'app-wd-ov-foot' });
      const ov = XP.el('div', { class: 'app-wd-overlay' }, [
        XP.el('div', { class: 'app-wd-ov-head' }, [
          XP.el('h2', { text: titleText_ }),
          XP.el('button', { class: 'app-wd-btn', text: '关闭(Esc)', onClick: () => { XP.sound('click'); (onClose || closeOverlay)(); } }),
        ]),
        body, foot,
      ]);
      ovLayer.appendChild(ov);
      return { ov: ov, body: body, foot: foot };
    }

    /* ---------- 标题画面 ---------- */
    const TITLE_ITEMS = ['新的征程', '继续游戏', '操作说明'];
    function showTitle() {
      g.state = 'title';
      g.sel = 0;
      ovLayer.innerHTML = '';
      const hasSv = hasSave();
      const btns = TITLE_ITEMS.map((t, i) => {
        const b = XP.el('button', {
          class: 'app-wd-title-btn' + (i === 0 ? ' sel' : ''), text: t,
          disabled: i === 1 && !hasSv ? 'disabled' : null,
          onClick: () => titleAction(i),
        });
        return b;
      });
      const ov = XP.el('div', { class: 'app-wd-overlay', style: { background: 'rgba(8,8,18,.55)', justifyContent: 'center' } }, [
        XP.el('div', { style: { textAlign: 'center', marginBottom: '10px' } }, [
          XP.el('div', { style: { fontSize: '56px', fontWeight: 'bold', color: '#ffd93d', letterSpacing: '24px', textShadow: '0 0 18px #a06000, 0 4px 0 #5a3000', paddingLeft: '24px' }, text: '问 道' }),
          XP.el('div', { style: { color: '#ffe9a8', fontSize: '14px', letterSpacing: '6px', marginTop: '6px' }, text: '五 行 修 真 · 回 合 制 江 湖' }),
        ]),
        XP.el('div', {}, btns),
        XP.el('div', { style: { textAlign: 'center', color: '#889', fontSize: '11px', marginTop: '14px' }, text: '↑↓选择 · 回车确认 · 2005年怀旧风格' }),
      ]);
      ovLayer.appendChild(ov);
      ov._btns = btns;
      g._titleOv = ov;
    }
    function titleSelMove(d) {
      const ov = g._titleOv;
      if (!ov) return;
      const n = TITLE_ITEMS.length;
      let i = g.sel;
      for (let k = 0; k < n; k++) {
        i = (i + d + n) % n;
        if (!ov._btns[i].disabled) break;
      }
      ov._btns[g.sel].classList.remove('sel');
      g.sel = i;
      ov._btns[i].classList.add('sel');
      XP.sound('click');
    }
    function titleAction(i) {
      if (i === 1 && !hasSave()) return;
      XP.sound('click');
      if (i === 0) { showCreate(); }
      else if (i === 1) {
        if (loadGame()) {
          ovLayer.innerHTML = '';
          g.state = 'map';
          updateStatus();
          XP.notify('问道', '欢迎回来,' + g.name + '!');
          try { canvas.focus(); } catch (e) {}
        }
      } else { showHelp(true); }
    }

    /* ---------- 角色创建 ---------- */
    function showCreate() {
      g.state = 'create';
      const cc = { sect: 'jin', gender: 'm', name: '道友请留步' };
      const { body, foot } = makeOverlay('创建角色 — 选择你的门派', () => showTitle());
      const cards = SECT_ORDER.map(sk => {
        const s = SECTS[sk];
        const card = XP.el('div', { class: 'app-wd-card' + (sk === cc.sect ? ' sel' : ''), style: { width: '140px' } }, [
          XP.el('img', { src: IMG_SRC[s.img] }),
          XP.el('h3', { style: { color: s.color }, text: s.name + '(' + s.el + ')' }),
          XP.el('p', { text: s.desc }),
          XP.el('p', { html: 'HP' + s.base.hp + ' MP' + s.base.mp + '<br>攻' + s.base.atk + ' 防' + s.base.def + ' 速' + s.base.spd }),
          XP.el('p', { style: { color: '#8a9' }, text: '技能: ' + s.skills.map(k => k.name).join(' / ') }),
        ]);
        card.addEventListener('click', () => {
          cc.sect = sk;
          cards.forEach(c => c.classList.remove('sel'));
          card.classList.add('sel');
          XP.sound('click');
        });
        return card;
      });
      const nameInput = XP.el('input', { class: 'app-wd-input', value: cc.name, maxlength: '8' });
      nameInput.addEventListener('input', () => { cc.name = nameInput.value.slice(0, 8); });
      const genderBtns = ['m', 'f'].map(gd => {
        const b = XP.el('button', {
          class: 'app-wd-btn' + (gd === cc.gender ? ' sel' : ''), text: gd === 'm' ? '♂ 男' : '♀ 女',
          onClick: () => {
            cc.gender = gd;
            genderBtns.forEach(x => x.classList.remove('sel'));
            b.classList.add('sel');
            XP.sound('click');
          },
        });
        return b;
      });
      body.appendChild(XP.el('div', { style: { marginBottom: '6px', color: '#ccd' }, text: '五行相克: 金克木 → 木克土 → 土克水 → 水克火 → 火克金 (克制+30%伤害)' }));
      body.appendChild(XP.el('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' } }, cards));
      body.appendChild(XP.el('div', { style: { display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'center', marginTop: '14px' } }, [
        XP.el('span', { text: '名字:' }), nameInput,
        XP.el('span', { text: '性别:' }), genderBtns[0], genderBtns[1],
      ]));
      body.appendChild(XP.el('div', { style: { textAlign: 'center', marginTop: '14px' } }, [
        XP.el('button', {
          class: 'app-wd-btn', style: { fontSize: '15px', padding: '8px 30px' }, text: '踏入江湖',
          onClick: () => {
            XP.sound('tada');
            newGame(cc.name.trim() || '道友请留步', cc.sect, cc.gender);
            ovLayer.innerHTML = '';
            g.state = 'map';
            updateStatus();
            saveGame(true);
            XP.notify('问道', '欢迎来到天墉城,' + g.name + '!');
            try { canvas.focus(); } catch (e) {}
          },
        }),
      ]));
      foot.textContent = '提示: 木系适合新手(能加血), 金系爆发高, 火系清怪快, 水系能控场, 土系最耐打';
    }

    /* ---------- 操作说明 ---------- */
    function showHelp(fromTitle) {
      const prev = g.state;
      g.state = 'help';
      g.helpFrom = !!fromTitle;
      const back = () => { if (fromTitle) showTitle(); else { g.state = prev === 'help' ? 'map' : prev; closeOverlay(); } };
      const { body, foot } = makeOverlay('操作说明', back);
      body.innerHTML = [
        '<h3 style="color:#ffe9a8">基本操作</h3>',
        '<p>方向键 / WASD: 移动　　空格 / 回车: 交互·确认(对话NPC、开宝箱、传送点、挑战BOSS)</p>',
        '<p>B: 背包/装备　　Q: 任务日志　　P: 宠物栏　　Esc: 关闭弹层</p>',
        '<h3 style="color:#ffe9a8">五行相克</h3>',
        '<p>金克木 → 木克土 → 土克水 → 水克火 → 火克金。攻击克制属性目标时伤害 <b style="color:#ffd93d">+30%</b>。</p>',
        '<h3 style="color:#ffe9a8">战斗</h3>',
        '<p>踩深色草地随机遇敌。回合制按速度排序行动。菜单: 攻击 / 法术 / 宠物 / 道具 / 防御 / 逃跑。</p>',
        '<p>暴击10%(1.5倍伤害), 闪避5%。法术随等级解锁, 注意MP消耗。</p>',
        '<h3 style="color:#ffe9a8">宠物(宝宝)</h3>',
        '<p>战斗中怪物HP低于30%时可用「捕兽夹」抓捕, HP越低成功率越高(BOSS不可抓)。',
        '宠物栏最多6只, 指定1只出战后会自动协助攻击, 和主人一样升级成长。</p>',
        '<h3 style="color:#ffe9a8">主线任务</h3>',
        '<p>药店老板 → 十里坡杀5只野狗 → 回复任务长老 → 轩辕坟击败幽冥龙王 → 回城领奖(门派武器+称号)。</p>',
        '<p>客栈掌柜还有一个小支线, 不妨问问她。客栈休息可全恢复并自动存档。</p>',
      ].join('');
      foot.textContent = 'Esc 返回';
    }

    /* ---------- NPC 对话 ---------- */
    function openDialog(npc) {
      g.state = 'dialog';
      clearKeys();
      const lines = dialogLines(npc);
      g.dialog = { npc: npc, lines: lines.text, opts: lines.opts, idx: 0 };
      renderDialog();
    }
    function dialogLines(npc) {
      const q = g.quest;
      switch (npc.role) {
        case 'drug':
          if (q.main === 0) {
            return { text: ['少侠,看你面生,是刚到天墉城吧?', '最近十里坡野狗成灾,咬伤了不少村民。', '任务长老正在悬赏除害,少侠不妨一试——', '先去十里坡消灭5只野狗,再去长老府复命吧!'],
              opts: [{ t: '领取任务:为民除害', fn: () => { g.quest.main = 1; saveGame(true); XP.notify('任务', '主线更新: 十里坡消灭野狗 0/5'); closeDialog(); } }] };
          }
          return { text: ['少侠辛苦了!需要药品的话尽管开口。', '小还丹50文,凝神丹60文,捕兽夹100文。'],
            opts: [{ t: '购买药品', fn: () => openShop('drug') }, { t: '告辞', fn: closeDialog }] };
        case 'equip':
          return { text: ['本店兵器甲胄应有尽有!', '看你骨骼清奇,给你算便宜点。'],
            opts: [{ t: '购买装备', fn: () => openShop('equip') }, { t: '告辞', fn: closeDialog }] };
        case 'inn': {
          const opts = [{ t: '休息一晚(200文·全恢复+存档)', fn: () => innRest() }];
          if (q.sideWine === 0) opts.push({ t: '打听(支线)', fn: () => {
            g.quest.sideWine = 1;
            bagAdd('wine', 1);
            XP.notify('支线任务', '帮掌柜把桂花酒送给帮派使者');
            saveGame(true);
            openDialogLines(npc, ['实不相瞒,我有坛上好的桂花酒,', '想送给城里的帮派使者大人,可我走不开…', '少侠能帮我跑一趟吗?必有酬谢!(桂花酒已放入背包)'],
              [{ t: '包在我身上', fn: closeDialog }]);
          } });
          else if (q.sideWine === 1) opts.push({ t: '关于送酒…', fn: () => openDialogLines(npc, ['酒送到了吗?帮派使者就在城南帮派堂门口。'], [{ t: '这就去', fn: closeDialog }]) });
          else opts.push({ t: '聊天', fn: () => openDialogLines(npc, ['少侠真是信人!以后来住店给你打八折…(并没有)'], [{ t: '告辞', fn: closeDialog }]) });
          opts.push({ t: '告辞', fn: closeDialog });
          return { text: ['客官里边请!打尖还是住店?', '住店一晚200文,包你 HP/MP 全恢复,还帮你存盘。'], opts: opts };
        }
        case 'elder':
          if (q.main === 0) return { text: ['年轻人,江湖路远,先去找药店老板聊聊吧。'], opts: [{ t: '告辞', fn: closeDialog }] };
          if (q.main === 1) return { text: ['野狗还没除净,继续努力!(进度 ' + q.dogs + '/5)'], opts: [{ t: '告辞', fn: closeDialog }] };
          if (q.main === 2) {
            return { text: ['好啊!十里坡的野狗都被你除干净了?', '这是赏你的:小还丹x3、200文钱。', '不过…轩辕坟最近妖气冲天,据说幽冥龙王苏醒了。', '少侠可愿为民除害,前去屠龙?'],
              opts: [{ t: '领取奖励并接受任务', fn: () => {
                g.quest.main = 3;
                bagAdd('hppot', 3); g.money += 200;
                updateStatus(); saveGame(true);
                XP.notify('任务', '获得 小还丹x3、200文 · 主线更新: 前往轩辕坟');
                closeDialog();
              } }] };
          }
          if (q.main === 3) return { text: ['幽冥龙王就在轩辕坟最深处。', '穿过十里坡往东就是轩辕坟入口,万事小心!'], opts: [{ t: '告辞', fn: closeDialog }] };
          if (q.main === 4) {
            return { text: ['你…你真的斩了幽冥龙王?!', '天墉城上下感激不尽!这是本城至宝——', '【' + EQUIPS['w_' + g.sect + '3'].name + '】与「屠龙勇士」称号,少侠当之无愧!'],
              opts: [{ t: '领取奖励', fn: () => {
                g.quest.main = 5;
                bagAdd('w_' + g.sect + '3', 1);
                g.title = '屠龙勇士';
                updateStatus(); saveGame(true);
                XP.sound('tada');
                XP.notify('任务完成', '获得门派武器【' + EQUIPS['w_' + g.sect + '3'].name + '】与称号「屠龙勇士」!');
                closeDialog();
              } }] };
          }
          return { text: ['屠龙勇士大驾光临,有失远迎!', '江湖已经传遍了你的威名。'], opts: [{ t: '告辞', fn: closeDialog }] };
        case 'guild':
          if (q.sideWine === 1 && bagCount('wine') > 0) {
            return { text: ['嗯?这是…客栈掌柜的桂花酒?', '哈哈,她倒是有心了。拿着,这是谢礼!', '(获得 100文 + 双倍丹x1)'],
              opts: [{ t: '交付桂花酒', fn: () => {
                bagRemove('wine', 1);
                g.quest.sideWine = 2;
                g.money += 100; bagAdd('double', 1);
                updateStatus(); saveGame(true);
                XP.notify('支线完成', '获得 100文 + 双倍丹x1');
                closeDialog();
              } }] };
          }
          return { text: ['本帮派广招天下豪杰。', '等你闯出名堂,再来谈入帮的事吧。'], opts: [{ t: '告辞', fn: closeDialog }] };
      }
      return { text: ['……'], opts: [{ t: '告辞', fn: closeDialog }] };
    }
    function openDialogLines(npc, lines, opts) {
      g.dialog = { npc: npc, lines: lines, opts: opts, idx: 0 };
      renderDialog();
    }
    function closeDialog() { g.dialog = null; closeOverlay(); }

    function renderDialog() {
      const d = g.dialog;
      if (!d) return;
      const { body, foot } = makeOverlay(d.npc.name, closeDialog);
      const row = XP.el('div', { style: { display: 'flex', gap: '12px' } });
      if (d.npc.portrait) row.appendChild(XP.el('img', { class: 'app-wd-dialog-portrait', src: IMG_SRC[d.npc.portrait] }));
      row.appendChild(XP.el('div', { style: { flex: '1' } }, [
        XP.el('div', { style: { fontSize: '14px', lineHeight: '1.9', color: '#eee', minHeight: '90px' },
          html: d.lines.map(l => '<p style="margin:2px 0">' + l + '</p>').join('') }),
        XP.el('div', { class: 'app-wd-btnrow' }, d.opts.map((o, i) =>
          XP.el('button', { class: 'app-wd-btn' + (i === 0 ? ' sel' : ''), text: (i + 1) + '. ' + o.t, onClick: () => { XP.sound('click'); o.fn(); } }))),
      ]));
      body.appendChild(row);
      foot.textContent = '数字键选择 · Esc 离开';
    }

    /* ---------- 客栈休息 ---------- */
    function innRest() {
      if (g.money < 200) { XP.sound('error'); XP.notify('问道', '钱不够!需要200文'); return; }
      g.money -= 200;
      g.hp = effMaxHp(); g.mp = g.maxmp;
      g.pets.forEach(p => { p.hp = p.maxhp; });
      updateStatus();
      saveGame(true);
      sfx('heal');
      XP.notify('客栈', '神清气爽!HP/MP全恢复,游戏已保存');
      closeDialog();
    }

    /* ---------- 商店 ---------- */
    function shopStock(kind) {
      if (kind === 'drug') return SHOPS.drug.items.slice();
      // 装备店: 当前门派武器 + 通用防具
      return SHOPS.equip.items.map(id => id.replace('?', g.sect));
    }
    function openShop(kind) {
      g.state = 'shop';
      g.shop = { kind: kind, sel: 0 };
      renderShop();
    }
    function renderShop() {
      const kind = g.shop.kind;
      const stock = shopStock(kind);
      const { body, foot } = makeOverlay(kind === 'drug' ? '药店' : '装备店', closeOverlay);
      body.appendChild(XP.el('div', { style: { marginBottom: '8px', color: '#ffd93d' }, text: '持有金钱: ' + g.money + ' 文' }));
      const tbl = XP.el('table', { class: 'app-wd-table' });
      tbl.appendChild(XP.el('tr', {}, [XP.el('th', { text: '商品' }), XP.el('th', { text: '效果' }), XP.el('th', { text: '价格' }), XP.el('th', { text: '持有' }), XP.el('th', {})]));
      stock.forEach((id, i) => {
        const def = ITEMS[id] || EQUIPS[id];
        if (!def) return;
        let eff = def.desc || '';
        if (def.slot) {
          eff = SLOT_CN[def.slot] + ' · ';
          if (def.atk) eff += '攻+' + def.atk + ' ';
          if (def.def) eff += '防+' + def.def + ' ';
          if (def.spd) eff += '速+' + def.spd + ' ';
          if (def.hp) eff += 'HP+' + def.hp + ' ';
          eff += '(需Lv.' + def.lv + (def.sect ? ' · ' + SECTS[def.sect].name + '限定' : '') + ')';
        }
        const owned = def.type === 'consum' ? bagCount(id) : (g.bag.filter(b => b.id === id).length + (Object.values(g.equip).indexOf(id) >= 0 ? 1 : 0));
        const buyBtn = XP.el('button', {
          class: 'app-wd-btn', text: '购买',
          disabled: g.money < def.price ? 'disabled' : null,
          onClick: () => buyItem(id),
        });
        const tr = XP.el('tr', {}, [
          XP.el('td', { html: '<b style="color:#ffe9a8">' + def.name + '</b>' }),
          XP.el('td', { text: eff }),
          XP.el('td', { text: def.price + '文' }),
          XP.el('td', { text: String(owned) }),
          XP.el('td', {}, [buyBtn]),
        ]);
        tr.addEventListener('dblclick', () => buyItem(id));
        tbl.appendChild(tr);
      });
      body.appendChild(tbl);
      foot.textContent = '点击购买 · Esc 离开商店';
    }
    function buyItem(id) {
      const def = ITEMS[id] || EQUIPS[id];
      if (!def || g.money < def.price) { XP.sound('error'); return; }
      if (g.bag.length >= 24 && !g.bag.find(b => b.id === id && (def.type === 'consum'))) {
        XP.sound('error'); XP.notify('问道', '背包已满(24格)!'); return;
      }
      g.money -= def.price;
      bagAdd(id, 1);
      sfx('buy');
      updateStatus();
      renderShop();
    }

    /* ---------- 背包 / 装备 ---------- */
    function openBag() {
      g.state = 'bag';
      g.bagSel = 0;
      renderBag();
    }
    function itemName(id) { const d = ITEMS[id] || EQUIPS[id]; return d ? d.name : id; }
    function equipLabel(id) {
      const e = EQUIPS[id];
      if (!e) return '';
      const parts = [];
      if (e.atk) parts.push('攻+' + e.atk);
      if (e.def) parts.push('防+' + e.def);
      if (e.spd) parts.push('速+' + e.spd);
      if (e.hp) parts.push('HP+' + e.hp);
      return parts.join(' ');
    }
    function renderBag() {
      const { body, foot } = makeOverlay('背包 / 装备', closeOverlay);
      // 装备栏
      const eqRow = XP.el('div', { style: { display: 'flex', gap: '8px', marginBottom: '10px' } });
      ['weapon', 'hat', 'armor', 'shoe'].forEach(slot => {
        const id = g.equip[slot];
        eqRow.appendChild(XP.el('div', { class: 'app-wd-slot', style: { flex: '1', minHeight: '52px', cursor: id ? 'pointer' : 'default' },
          html: '<div style="color:#9ab">' + SLOT_CN[slot] + '</div>' +
            (id ? '<div class="nm">' + EQUIPS[id].name + '</div><div style="color:#8c8">' + equipLabel(id) + '</div>' : '<div style="color:#556">(空)</div>'),
          onClick: id ? () => unequip(slot) : null,
        }));
      });
      body.appendChild(XP.el('div', { style: { color: '#9ab', marginBottom: '4px' }, text: '已装备 (点击卸下):' }));
      body.appendChild(eqRow);
      // 属性摘要
      const es = equipStats();
      body.appendChild(XP.el('div', { style: { color: '#8c8', fontSize: '11px', marginBottom: '8px' },
        text: '总属性: 攻' + effAtk() + ' 防' + effDef() + ' 速' + effSpd() + ' 生命' + effMaxHp() +
          (es.atk || es.def || es.spd || es.hp ? '  (装备加成: 攻+' + es.atk + ' 防+' + es.def + ' 速+' + es.spd + ' HP+' + es.hp + ')' : '') }));
      // 物品格子 24 (6x4)
      body.appendChild(XP.el('div', { style: { color: '#9ab', marginBottom: '4px' }, text: '物品 (' + g.bag.length + '/24):' }));
      const grid = XP.el('div', { class: 'app-wd-grid', style: { gridTemplateColumns: 'repeat(6, 1fr)' } });
      for (let i = 0; i < 24; i++) {
        const it = g.bag[i];
        const slot = XP.el('div', {
          class: 'app-wd-slot' + (i === g.bagSel ? ' sel' : ''),
          html: it ? '<div class="nm">' + itemName(it.id) + '</div>' + (EQUIPS[it.id] ? '<div style="color:#8c8">' + equipLabel(it.id) + '</div>' : '<div style="color:#789">' + (ITEMS[it.id].type === 'quest' ? '任务' : '道具') + '</div>') + (it.n > 1 ? '<span class="ct">x' + it.n + '</span>' : '') : '',
        });
        if (it) slot.addEventListener('click', () => { g.bagSel = i; renderBag(); });
        if (it) slot.addEventListener('dblclick', () => useBagItem(i));
        grid.appendChild(slot);
      }
      body.appendChild(grid);
      // 选中物品操作
      const sel = g.bag[g.bagSel];
      if (sel) {
        const def = ITEMS[sel.id] || EQUIPS[sel.id];
        const ops = XP.el('div', { class: 'app-wd-btnrow', style: { marginTop: '10px' } });
        ops.appendChild(XP.el('span', { style: { color: '#ccd', alignSelf: 'center' }, text: def.desc || equipLabel(sel.id) }));
        if (def.slot) {
          const canEq = g.lv >= def.lv && (!def.sect || def.sect === g.sect);
          ops.appendChild(XP.el('button', { class: 'app-wd-btn', text: canEq ? '装备' : '条件不足(需Lv.' + def.lv + (def.sect ? ' ' + SECTS[def.sect].name : '') + ')', disabled: canEq ? null : 'disabled',
            onClick: () => equipItem(g.bagSel) }));
        } else if (def.type === 'consum') {
          ops.appendChild(XP.el('button', { class: 'app-wd-btn', text: '使用', onClick: () => useBagItem(g.bagSel) }));
        }
        ops.appendChild(XP.el('button', { class: 'app-wd-btn', text: '丢弃', onClick: () => dropItem(g.bagSel) }));
        body.appendChild(ops);
      }
      foot.textContent = '单击选择 · 双击使用/装备 · B 或 Esc 关闭';
    }
    function useBagItem(i) {
      const it = g.bag[i];
      if (!it) return;
      const def = ITEMS[it.id];
      if (!def) { equipItem(i); return; }
      if (def.type === 'quest') { XP.notify('问道', '这是任务物品'); return; }
      if (def.heal) {
        if (g.hp >= effMaxHp()) { XP.sound('error'); XP.notify('问道', 'HP已满'); return; }
        g.hp = Math.min(effMaxHp(), g.hp + def.heal);
        sfx('heal');
      } else if (def.mp) {
        if (g.mp >= g.maxmp) { XP.sound('error'); XP.notify('问道', 'MP已满'); return; }
        g.mp = Math.min(g.maxmp, g.mp + def.mp);
        sfx('heal');
      } else if (it.id === 'double') {
        g.doubleBattles += 5;
        XP.notify('问道', '接下来5场战斗经验翻倍!');
        sfx('buy');
      } else if (it.id === 'trap') { XP.notify('问道', '捕兽夹要在战斗中使用'); return; }
      bagRemove(it.id, 1);
      updateStatus();
      renderBag();
    }
    function equipItem(i) {
      const it = g.bag[i];
      if (!it) return;
      const e = EQUIPS[it.id];
      if (!e) return;
      if (g.lv < e.lv) { XP.sound('error'); XP.notify('问道', '等级不足,需要Lv.' + e.lv); return; }
      if (e.sect && e.sect !== g.sect) { XP.sound('error'); XP.notify('问道', '门派不符,' + SECTS[e.sect].name + '专用'); return; }
      const old = g.equip[e.slot];
      g.equip[e.slot] = it.id;
      bagRemove(it.id, 1);
      if (old) bagAdd(old, 1);
      if (g.hp > effMaxHp()) g.hp = effMaxHp();
      sfx('buy');
      updateStatus();
      renderBag();
    }
    function unequip(slot) {
      const id = g.equip[slot];
      if (!id) return;
      if (g.bag.length >= 24) { XP.sound('error'); XP.notify('问道', '背包已满!'); return; }
      g.equip[slot] = null;
      bagAdd(id, 1);
      if (g.hp > effMaxHp()) g.hp = effMaxHp();
      updateStatus();
      renderBag();
    }
    function dropItem(i) {
      const it = g.bag[i];
      if (!it) return;
      if (ITEMS[it.id] && ITEMS[it.id].type === 'quest') { XP.notify('问道', '任务物品不能丢弃'); return; }
      bagRemove(it.id, 1);
      XP.sound('click');
      renderBag();
    }

    /* ---------- 任务日志 ---------- */
    function openQuestLog() {
      g.state = 'quest';
      const { body, foot } = makeOverlay('任务日志', closeOverlay);
      const q = MAIN_QUESTS[g.quest.main];
      body.appendChild(XP.el('div', { style: { border: '1px solid #6a5a2a', borderRadius: '5px', padding: '10px', background: '#1a1608', marginBottom: '12px' } }, [
        XP.el('h3', { style: { color: '#ffd93d', margin: '0 0 6px' }, text: '【主线】' + q.t + '  (' + Math.min(g.quest.main, 5) + '/5)' }),
        XP.el('div', { style: { lineHeight: '1.8' }, text: q.d.replace('{dogs}', String(g.quest.dogs)) }),
        g.quest.main === 1 ? XP.el('div', { style: { marginTop: '6px' } }, [
          XP.el('div', { class: 'app-wd-mini-track' }, [XP.el('div', { class: 'app-wd-mini-fill', style: { width: (g.quest.dogs / 5 * 100) + '%', background: '#5fd97a' } })]),
        ]) : null,
      ]));
      const sideT = g.quest.sideWine === 0 ? '未接取 (找客栈掌柜聊聊)' : g.quest.sideWine === 1 ? '进行中: 把桂花酒交给帮派使者' : '已完成 ✓';
      body.appendChild(XP.el('div', { style: { border: '1px solid #4a5a7a', borderRadius: '5px', padding: '10px', background: '#10142a' } }, [
        XP.el('h3', { style: { color: '#8ab', margin: '0 0 6px' }, text: '【支线】客栈掌柜的委托' }),
        XP.el('div', { text: sideT }),
      ]));
      foot.textContent = 'Q 或 Esc 关闭';
    }

    /* ---------- 宠物栏 ---------- */
    function openPetPanel() {
      g.state = 'pet';
      g.petSel = 0;
      renderPets();
    }
    function petElem(p) { return MONSTERS[p.key] ? MONSTERS[p.key].elem : 'jin'; }
    function renderPets() {
      const { body, foot } = makeOverlay('宠物栏 (' + g.pets.length + '/6)', closeOverlay);
      if (g.pets.length === 0) {
        body.appendChild(XP.el('div', { style: { color: '#889', textAlign: 'center', marginTop: '60px', lineHeight: '2' },
          html: '还没有宠物。<br>战斗中把怪物打到 HP&lt;30%, 用「捕兽夹」就能抓捕!<br>(捕兽夹: 药店100文一个, 初始送了5个)' }));
      }
      g.pets.forEach((p, i) => {
        const row = XP.el('div', { class: 'app-wd-petrow' + (i === g.activePet ? ' active' : '') }, [
          XP.el('img', { src: IMG_SRC[MONSTERS[p.key].img] }),
          XP.el('div', { style: { flex: '1' } }, [
            XP.el('div', { html: '<b style="color:#ffe9a8">' + p.name + '</b> <span class="app-wd-tag" style="background:' + ELEM_FX[petElem(p)] + '33;color:' + ELEM_FX[petElem(p)] + '">' + ELEM_CN[petElem(p)] + '</span> Lv.' + p.lv + (i === g.activePet ? ' <span class="app-wd-tag" style="background:#5a4a10;color:#ffd93d">出战中</span>' : '') }),
            XP.el('div', { class: 'app-wd-mini-track' }, [XP.el('div', { class: 'app-wd-mini-fill', style: { width: Math.max(0, p.hp / p.maxhp * 100) + '%', background: '#d04848' } })]),
            XP.el('div', { style: { fontSize: '10px', color: '#9ab' }, text: 'HP ' + Math.max(0, p.hp) + '/' + p.maxhp + ' · 攻' + p.atk + ' 防' + p.def + ' 速' + p.spd + ' · 经验 ' + p.exp + '/' + expNeed(p.lv) }),
          ]),
          XP.el('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
            i === g.activePet ? null : XP.el('button', { class: 'app-wd-btn', text: '出战', disabled: p.hp <= 0 ? 'disabled' : null, onClick: () => { g.activePet = i; XP.sound('click'); saveGame(true); renderPets(); } }),
            XP.el('button', { class: 'app-wd-btn', text: '改名', onClick: () => renamePet(i) }),
            XP.el('button', { class: 'app-wd-btn', text: '放生', onClick: () => releasePet(i) }),
          ]),
        ]);
        body.appendChild(row);
      });
      foot.textContent = 'P 或 Esc 关闭 · 宠物在战斗中自动行动, 并获得经验成长';
    }
    function renamePet(i) {
      const p = g.pets[i];
      if (!p) return;
      const { body, foot } = makeOverlay('给宠物改名', () => renderPets());
      const input = XP.el('input', { class: 'app-wd-input', value: p.name, maxlength: '8' });
      body.appendChild(XP.el('div', { style: { display: 'flex', gap: '10px', alignItems: 'center', marginTop: '20px', justifyContent: 'center' } }, [
        XP.el('span', { text: '新名字:' }), input,
        XP.el('button', { class: 'app-wd-btn', text: '确定', onClick: () => {
          const v = input.value.trim();
          if (v) { p.name = v; saveGame(true); XP.sound('click'); }
          renderPets();
        } }),
      ]));
      foot.textContent = '最多8个字';
      setTimeout(() => { try { input.focus(); input.select(); } catch (e) {} }, 30);
    }
    function releasePet(i) {
      const p = g.pets[i];
      if (!p) return;
      g.pets.splice(i, 1);
      if (g.activePet >= g.pets.length) g.activePet = Math.max(0, g.pets.length - 1);
      XP.notify('问道', p.name + ' 已回归自然…');
      saveGame(true);
      renderPets();
    }

    /* ============================================================
       战斗系统 — 逻辑
       ============================================================ */
    const MENU_LABELS = ['攻击', '法术', '宠物', '道具', '防御', '逃跑'];
    const ENEMY_POS = { 1: [400], 2: [280, 520], 3: [190, 400, 610] };
    const EY = 130, PY = { x: 95, y: 385 }, PETY = { x: 85, y: 520 };

    function bLog(s) {
      const b = g.battle;
      b.log.push(s);
      while (b.log.length > 7) b.log.shift();
    }
    function aliveEnemies() { return g.battle.enemies.filter(e => e.hp > 0); }
    function activePet() {
      if (!g.pets.length) return null;
      const p = g.pets[Math.min(g.activePet, g.pets.length - 1)];
      return p && p.hp > 0 ? p : null;
    }

    function enterBattle(opts) {
      clearKeys();
      sfx('portal');
      const enemies = [];
      if (opts.boss) {
        const def = MONSTERS.longwang;
        const lv = def.lvMin;
        const st = monStat(def, lv);
        enemies.push({ key: 'longwang', mdef: def, name: def.name, lv: lv,
          hp: st.maxhp, maxhp: st.maxhp, atk: st.atk, def: st.def, spd: st.spd,
          elem: def.elem, boss: true, frozen: false, dot: null });
      } else {
        const table = ENC_TABLES[opts.table];
        const n = Math.random() < 0.5 ? 1 : (Math.random() < 0.7 ? 2 : 3);
        const names = ['', '甲', '乙', '丙'];
        for (let i = 0; i < n; i++) {
          let total = 0; table.forEach(t => total += t[1]);
          let r = Math.random() * total, key = table[0][0];
          for (const t of table) { r -= t[1]; if (r <= 0) { key = t[0]; break; } }
          const def = MONSTERS[key];
          const lv = def.lvMin + Math.floor(Math.random() * (def.lvMax - def.lvMin + 1));
          const st = monStat(def, lv);
          enemies.push({ key: key, mdef: def, name: def.name + (n > 1 ? names[i + 1] : ''), lv: lv,
            hp: st.maxhp, maxhp: st.maxhp, atk: st.atk, def: st.def, spd: st.spd,
            elem: def.elem, boss: false, frozen: false, dot: null });
        }
      }
      g.battle = {
        enemies: enemies, bg: opts.bg, boss: !!opts.boss,
        phase: 'intro', log: [], queue: [], qi: 0,
        floats: [], fxs: [], shakeT: 0, flashT: 0,
        sel: 0, sub: null, subSel: 0, pending: null, targetSide: 'enemy', targetIdx: 0,
        round: 0, result: null,
        pDefend: false, pBuff: 0, pFrozen: false, pDot: null, petDefend: false, petFrozen: false, petDot: null,
        hitE: [], hitA: [], menuRects: [], subRects: [],
      };
      g.state = 'battle';
      ovLayer.innerHTML = '';
      bLog(opts.boss ? '幽冥龙王拦住了去路！' : '野生的' + enemies.map(e => e.mdef.name).join('、') + '出现了！');
      later(() => { const b = g.battle; if (b && b.phase === 'intro') beginBattle(); }, 1100);
    }
    function beginBattle() {
      const b = g.battle;
      if (!b) return;
      startRound();
    }

    function startRound() {
      const b = g.battle;
      if (!b) return;
      b.round++;
      // DoT 结算
      tickDot('player'); tickDot('pet');
      b.enemies.forEach(e => { if (e.dot && e.hp > 0) {
        const d = e.dot.dmg;
        e.hp -= d;
        addFloat(enemyPos(b.enemies.indexOf(e)).x, EY - 30, '-' + d, '#5fd97a');
        bLog(e.name + '受到毒伤 ' + d + ' 点。');
        e.dot.turns--; if (e.dot.turns <= 0) e.dot = null;
      } });
      if (checkBattleEnd()) return;
      // 行动队列: 按速度排序 (同速随机)
      const q = [{ side: 'player', spd: effSpd() + Math.random() * 0.5 }];
      const pet = activePet();
      if (pet) q.push({ side: 'pet', spd: pet.spd + Math.random() * 0.5 });
      b.enemies.forEach((e, i) => { if (e.hp > 0) q.push({ side: 'enemy', ei: i, spd: e.spd + Math.random() * 0.5 }); });
      q.sort((a, z) => z.spd - a.spd);
      b.queue = q; b.qi = 0;
      b.pDefend = false; b.petDefend = false;
      if (b.pBuff > 0) b.pBuff--;
      nextTurn();
    }
    function tickDot(side) {
      const b = g.battle;
      const key = side === 'player' ? 'pDot' : 'petDot';
      const dot = b[key];
      if (!dot) return;
      if (side === 'player') {
        if (g.hp <= 0) return;
        g.hp -= dot.dmg;
        addFloat(PY.x, PY.y - 60, '-' + dot.dmg, '#5fd97a');
        bLog('你受到毒伤 ' + dot.dmg + ' 点。');
      } else {
        const p = activePet();
        if (!p) { b[key] = null; return; }
        p.hp -= dot.dmg;
        addFloat(PETY.x, PETY.y - 40, '-' + dot.dmg, '#5fd97a');
        bLog(p.name + '受到毒伤 ' + dot.dmg + ' 点。');
      }
      dot.turns--; if (dot.turns <= 0) b[key] = null;
      updateStatus();
    }
    function curUnit() { const b = g.battle; return b.queue[b.qi] || null; }

    function nextTurn() {
      const b = g.battle;
      if (!b || b.phase === 'end') return;
      if (checkBattleEnd()) return;
      if (b.qi >= b.queue.length) { later(startRound, 500); b.phase = 'busy'; return; }
      const u = b.queue[b.qi];
      if (u.side === 'enemy' && b.enemies[u.ei].hp <= 0) { b.qi++; nextTurn(); return; }
      if (u.side === 'player') {
        if (b.pFrozen) { b.pFrozen = false; bLog('你被冻住了,无法行动!'); b.phase = 'busy'; later(endAction, 700); return; }
        b.phase = 'menu'; b.sel = 0; b.sub = null;
      } else if (u.side === 'pet') {
        const p = activePet();
        if (!p) { b.qi++; nextTurn(); return; }
        if (b.petFrozen) { b.petFrozen = false; bLog(p.name + '被冻住了,无法行动!'); b.phase = 'busy'; later(endAction, 700); return; }
        b.phase = 'busy';
        later(petAct, 550);
      } else {
        const e = b.enemies[u.ei];
        if (e.frozen) { e.frozen = false; bLog(e.name + '被冰封了,无法行动!'); b.phase = 'busy'; later(endAction, 700); return; }
        b.phase = 'busy';
        later(() => enemyAct(u.ei), 600);
      }
    }
    function endAction() {
      const b = g.battle;
      if (!b || b.phase === 'end') return;
      if (checkBattleEnd()) return;
      b.qi++;
      nextTurn();
    }
    function checkBattleEnd() {
      const b = g.battle;
      if (!b || b.phase === 'end') return b && b.phase === 'end';
      if (g.hp <= 0) { loseBattle(); return true; }
      if (aliveEnemies().length === 0) { winBattle(); return true; }
      return false;
    }

    /* ---------- 飘字与特效 ---------- */
    function addFloat(x, y, txt, color, big) {
      const b = g.battle;
      if (!b) return;
      b.floats.push({ x: x, y: y, txt: txt, color: color || '#fff', life: 1.1, vy: -34, big: !!big });
    }
    function addFx(x, y, color) {
      const b = g.battle;
      if (!b) return;
      b.fxs.push({ x: x, y: y, color: color, life: 0.45, r: 8 });
      b.shakeT = 0.22;
    }
    function enemyPos(i) {
      const b = g.battle;
      const n = b.enemies.length;
      return { x: ENEMY_POS[n][i], y: EY };
    }

    /* ---------- 命中结算 ---------- */
    // tgt: {side:'enemy',ei} | {side:'player'} | {side:'pet'}
    function applyHit(tgt, p) {
      const b = g.battle;
      let ref, name, elemB, defend, buffDef, pos;
      if (tgt.side === 'enemy') {
        ref = b.enemies[tgt.ei]; name = ref.name; elemB = ref.elem; defend = false; buffDef = false;
        pos = enemyPos(tgt.ei);
      } else if (tgt.side === 'player') {
        ref = g; name = '你'; elemB = g.sect; defend = b.pDefend; buffDef = b.pBuff > 0; pos = PY;
      } else {
        ref = activePet(); if (!ref) return { dmg: 0 };
        name = ref.name; elemB = petElem(ref); defend = b.petDefend; buffDef = false; pos = PETY;
      }
      const r = calcDmg({
        atk: p.atk, def: tgt.side === 'enemy' ? ref.def : (tgt.side === 'player' ? effDef() : ref.def),
        mult: p.mult, elemA: p.elemA, elemB: elemB, pierce: p.pierce, defend: defend, buffDef: buffDef,
      }, Math.random);
      if (r.miss) {
        addFloat(pos.x, pos.y - 50, '闪避!', '#9fd0ff');
        sfx('miss');
        return { dmg: 0, miss: true };
      }
      ref.hp -= r.dmg;
      addFloat(pos.x, pos.y - 50, '-' + r.dmg, r.crit ? '#ffd93d' : (tgt.side === 'enemy' ? '#fff' : '#ff8080'), r.crit);
      if (r.crit) addFloat(pos.x + 26, pos.y - 74, '暴击!', '#ffd93d');
      addFx(pos.x, pos.y - 20, p.fx ? ELEM_FX[p.fx] : '#fff');
      sfx(r.crit ? 'crit' : (tgt.side === 'enemy' ? 'atk' : 'hit'));
      if (tgt.side === 'player') updateStatus();
      return r;
    }
    function healTarget(side, amount) {
      let pos, ref, max;
      if (side === 'player') { ref = g; max = effMaxHp(); pos = PY; }
      else { ref = activePet(); if (!ref) return 0; max = ref.maxhp; pos = PETY; }
      const before = ref.hp;
      ref.hp = Math.min(max, ref.hp + amount);
      const got = ref.hp - before;
      addFloat(pos.x, pos.y - 50, '+' + got, '#5fd97a');
      sfx('heal');
      updateStatus();
      return got;
    }

    /* ---------- 我方行动 ---------- */
    function playerMenuAction(i) {
      const b = g.battle;
      if (!b || b.phase !== 'menu') return;
      if (b.sub) { XP.sound('click'); b.sub = null; }
      XP.sound('click');
      if (i === 0) { // 攻击
        const al = aliveEnemies();
        if (al.length === 1) doAttack(b.enemies.indexOf(al[0]));
        else beginTarget({ kind: 'attack' }, 'enemy');
      } else if (i === 1) { b.sub = 'skill'; b.subSel = 0; }
      else if (i === 2) { b.sub = 'pet'; b.subSel = 0; }
      else if (i === 3) { b.sub = 'item'; b.subSel = 0; }
      else if (i === 4) { b.pDefend = true; bLog('你摆开防御架势,本回合受伤减半。'); b.phase = 'busy'; later(endAction, 500); }
      else if (i === 5) doFlee();
    }

    function beginTarget(pending, side) {
      const b = g.battle;
      b.pending = pending;
      b.targetSide = side;
      b.targetIdx = 0;
      if (side === 'enemy') {
        const first = b.enemies.findIndex(e => e.hp > 0);
        b.targetIdx = Math.max(0, first);
      }
      b.phase = 'target';
    }
    function targetMove(d) {
      const b = g.battle;
      if (b.targetSide === 'enemy') {
        const idxs = b.enemies.map((e, i) => e.hp > 0 ? i : -1).filter(i => i >= 0);
        let k = idxs.indexOf(b.targetIdx);
        k = (k + d + idxs.length) % idxs.length;
        b.targetIdx = idxs[k];
      } else {
        b.targetIdx = activePet() ? (b.targetIdx === 0 ? 1 : 0) : 0;
      }
      XP.sound('click');
    }
    function confirmTarget() {
      const b = g.battle;
      const p = b.pending;
      b.phase = 'busy';
      b.pending = null;
      XP.sound('click');
      if (p.kind === 'attack') doAttack(b.targetIdx);
      else if (p.kind === 'skill') doSkill(p.skill, b.targetIdx, b.targetSide);
      else if (p.kind === 'capture') doCapture(b.targetIdx);
      else if (p.kind === 'item') doBattleItem(p.itemId, b.targetSide === 'ally' && b.targetIdx === 1 ? 'pet' : 'player');
    }
    function cancelTarget() {
      const b = g.battle;
      b.pending = null;
      b.phase = 'menu';
      XP.sound('click');
    }

    function doAttack(ei) {
      const b = g.battle;
      const e = b.enemies[ei];
      if (!e || e.hp <= 0) { endAction(); return; }
      b.phase = 'busy';
      const r = applyHit({ side: 'enemy', ei: ei }, { atk: effAtk(), mult: 1, elemA: g.sect });
      bLog(r.miss ? '你攻击' + e.name + ',被闪开了!' : '你攻击' + e.name + ',造成 ' + r.dmg + ' 点伤害' + (r.crit ? '(暴击!)' : '') + '。');
      if (e.hp <= 0) bLog(e.name + '倒下了!');
      later(endAction, 650);
    }

    function unlockedSkills() {
      return SECTS[g.sect].skills.filter(s => g.lv >= s.lv);
    }
    function pickSkill(i) {
      const b = g.battle;
      const skills = unlockedSkills();
      const sk = skills[i];
      if (!sk) return;
      if (g.mp < sk.mp) { XP.sound('error'); return; }
      b.sub = null;
      XP.sound('click');
      if (sk.tgt === 'all') doSkill(sk, -1, 'enemy');
      else if (sk.tgt === 'allally') doSkill(sk, -1, 'ally');
      else if (sk.tgt === 'self') doSkill(sk, 0, 'self');
      else if (sk.tgt === 'ally') beginTarget({ kind: 'skill', skill: sk }, 'ally');
      else beginTarget({ kind: 'skill', skill: sk }, 'enemy');
    }
    function doSkill(sk, tIdx, tSide) {
      const b = g.battle;
      if (g.mp < sk.mp) { b.phase = 'menu'; return; }
      g.mp -= sk.mp;
      b.phase = 'busy';
      sfx('skill');
      updateStatus();
      if (sk.kind === 'heal') {
        const amount = Math.round((effAtk() * sk.mult) + 20);
        if (sk.tgt === 'allally') {
          healTarget('player', amount);
          if (activePet()) healTarget('pet', amount);
          bLog('你施展' + sk.name + ',己方全体恢复生命!');
        } else {
          const side = tSide === 'ally' && tIdx === 1 ? 'pet' : 'player';
          healTarget(side, amount);
          bLog('你施展' + sk.name + ',恢复了 ' + amount + ' 点生命。');
        }
        later(endAction, 700);
        return;
      }
      if (sk.kind === 'buff') {
        b.pBuff = 3;
        addFloat(PY.x, PY.y - 60, '铜墙铁壁!', '#c8a060');
        bLog('你施展' + sk.name + ',3回合内受伤减少40%!');
        later(endAction, 700);
        return;
      }
      // 伤害类
      if (sk.selfdef) b.pDefend = true;
      const targets = sk.tgt === 'all' ? aliveEnemies().map(e => b.enemies.indexOf(e)) : [tIdx];
      let totalTxt = '';
      targets.forEach((ei, k) => {
        const e = b.enemies[ei];
        if (!e || e.hp <= 0) return;
        const r = applyHit({ side: 'enemy', ei: ei }, { atk: effAtk(), mult: sk.mult, elemA: g.sect, pierce: sk.pierce, fx: sk.fx });
        if (!r.miss) {
          if (sk.dot && e.hp > 0) e.dot = { dmg: Math.max(3, Math.round(effAtk() * 0.3)), turns: sk.dot };
          if (sk.freeze && e.hp > 0 && Math.random() < sk.freeze) { e.frozen = true; addFloat(enemyPos(ei).x + 24, EY - 60, '冰封!', '#5ab8ff'); }
        }
        totalTxt += (k > 0 ? '、' : '') + e.name + (r.miss ? '(闪避)' : ' -' + r.dmg);
      });
      bLog('你施展【' + sk.name + '】!' + totalTxt);
      aliveEnemies().length || bLog('敌人全灭!');
      later(endAction, 800);
    }

    function doCapture(ei) {
      const b = g.battle;
      const e = b.enemies[ei];
      b.phase = 'busy';
      if (!e || e.hp <= 0) { endAction(); return; }
      if (!bagRemove('trap', 1)) { bLog('没有捕兽夹了!'); later(() => { if (g.battle) g.battle.phase = 'menu'; }, 500); return; }
      const chance = capChance(e.hp, e.maxhp, e.boss);
      bLog('你扔出了捕兽夹…');
      if (e.boss) { sfx('fail'); later(() => { bLog('BOSS级别的存在无法被收服!'); endAction(); }, 700); return; }
      if (chance <= 0) { sfx('fail'); later(() => { bLog('怪物精力太旺盛,抓不住!(需HP低于30%)'); endAction(); }, 700); return; }
      if (Math.random() < chance) {
        sfx('capture');
        later(() => {
          const def = e.def;
          const pet = {
            key: e.key, name: def.name, lv: e.lv, exp: 0,
            maxhp: e.maxhp, hp: e.maxhp, atk: e.atk, def: e.def, spd: e.spd,
          };
          if (g.pets.length >= 6) {
            bLog('宠物栏已满(6只),' + def.name + '恋恋不舍地离开了…');
          } else {
            g.pets.push(pet);
            bLog('成功捕获 ' + def.name + '(Lv.' + e.lv + ')!它成为了你的宝宝!');
            XP.notify('问道', '捕获新宠物: ' + def.name + ' Lv.' + e.lv);
          }
          e.hp = 0; // 抓走视为退场
          addFloat(enemyPos(ei).x, EY - 50, '捕获!', '#ffd93d', true);
          endAction();
        }, 800);
      } else {
        sfx('fail');
        later(() => {
          bLog('可惜!' + e.name + '挣脱了捕兽夹!(成功率' + Math.round(chance * 100) + '%)');
          endAction();
        }, 800);
      }
    }

    function battleItems() {
      return g.bag.filter(it => it.id === 'hppot' || it.id === 'mppot');
    }
    function pickBattleItem(i) {
      const b = g.battle;
      const list = battleItems();
      const it = list[i];
      if (!it) return;
      b.sub = null;
      XP.sound('click');
      if (it.id === 'mppot') doBattleItem('mppot', 'player');
      else beginTarget({ kind: 'item', itemId: it.id }, 'ally');
    }
    function doBattleItem(itemId, side) {
      const b = g.battle;
      b.phase = 'busy';
      if (side === 'pet' && !activePet()) { b.phase = 'menu'; return; }
      if (!bagRemove(itemId, 1)) { bLog('道具已经没有了!'); later(() => { if (g.battle) g.battle.phase = 'menu'; }, 400); return; }
      if (itemId === 'hppot') {
        const got = healTarget(side, 80);
        bLog('你使用小还丹,' + (side === 'pet' ? '宠物' : '自己') + '恢复了 ' + got + ' 点HP。');
      } else {
        g.mp = Math.min(g.maxmp, g.mp + 40);
        sfx('heal');
        bLog('你服下凝神丹,恢复了 40 点MP。');
        updateStatus();
      }
      later(endAction, 600);
    }

    function petSubAction(i) {
      const b = g.battle;
      if (i === 0) { // 抓捕
        if (bagCount('trap') <= 0) { XP.sound('error'); bLog('没有捕兽夹!药店有售(100文)。'); return; }
        b.sub = null;
        XP.sound('click');
        const al = aliveEnemies();
        if (al.length === 1) doCapture(b.enemies.indexOf(al[0]));
        else beginTarget({ kind: 'capture' }, 'enemy');
      } else { // 切换出战
        b.sub = 'switch'; b.subSel = 0;
        XP.sound('click');
      }
    }
    function switchPet(i) {
      const b = g.battle;
      const p = g.pets[i];
      if (!p || p.hp <= 0 || i === g.activePet) { XP.sound('error'); return; }
      g.activePet = i;
      b.sub = null;
      b.phase = 'busy';
      b.petFrozen = false;
      bLog('你召回了宠物,派出 ' + p.name + ' 出战!');
      sfx('portal');
      later(endAction, 600);
    }

    function doFlee() {
      const b = g.battle;
      b.phase = 'busy';
      if (b.boss) {
        sfx('fail');
        bLog('幽冥龙王锁死了四周,无法逃跑!');
        later(endAction, 700);
        return;
      }
      const avg = aliveEnemies().reduce((s, e) => s + e.spd, 0) / Math.max(1, aliveEnemies().length);
      const chance = Math.max(0.2, Math.min(0.9, 0.55 + (effSpd() - avg) * 0.02));
      if (Math.random() < chance) {
        sfx('flee');
        bLog('逃跑成功!(成功率' + Math.round(chance * 100) + '%)');
        b.result = 'fled';
        b.phase = 'end';
      } else {
        sfx('fail');
        bLog('逃跑失败!');
        later(endAction, 600);
      }
    }

    /* ---------- 宠物 AI ---------- */
    function petAct() {
      const b = g.battle;
      if (!b || b.phase === 'end') return;
      const p = activePet();
      if (!p) { endAction(); return; }
      const al = aliveEnemies();
      if (!al.length) { endAction(); return; }
      const tgt = al[Math.floor(Math.random() * al.length)];
      const ei = b.enemies.indexOf(tgt);
      const useSkill = p.lv >= 5 && Math.random() < 0.3;
      const mult = useSkill ? 1.5 : 1;
      const r = applyHit({ side: 'enemy', ei: ei }, { atk: p.atk, mult: mult, elemA: petElem(p) });
      bLog(p.name + (useSkill ? '发动猛击!' : '发起攻击!') + (r.miss ? '被闪开了!' : tgt.name + '受到 ' + r.dmg + ' 点伤害' + (r.crit ? '(暴击!)' : '')));
      if (tgt.hp <= 0) bLog(tgt.name + '倒下了!');
      later(endAction, 650);
    }

    /* ---------- 敌方 AI ---------- */
    function enemyAct(ei) {
      const b = g.battle;
      if (!b || b.phase === 'end') return;
      const e = b.enemies[ei];
      if (!e || e.hp <= 0) { endAction(); return; }
      const pet = activePet();
      const pickTgt = () => (pet && Math.random() < 0.35) ? { side: 'pet' } : { side: 'player' };
      const tgtName = (t) => t.side === 'pet' ? (activePet() ? activePet().name : '宠物') : '你';
      const skillChance = e.boss ? 0.45 : 0.3;
      if (e.mdef.skill && Math.random() < skillChance) {
        const sk = e.mdef.skill;
        if (sk === 'aoe') {
          bLog(e.name + '施展【幽冥龙息】!全体攻击!');
          [ { side: 'player' } ].concat(pet ? [{ side: 'pet' }] : []).forEach(t => {
            const r = applyHit(t, { atk: e.atk, mult: 1.15, elemA: e.elem, fx: 'shui' });
            if (t.side === 'player' && !r.miss && Math.random() < 0.3) { b.pFrozen = true; addFloat(PY.x + 26, PY.y - 76, '冰冻!', '#5ab8ff'); }
          });
          later(endAction, 800);
          return;
        }
        const t = pickTgt();
        if (sk === 'heavy') {
          const r = applyHit(t, { atk: e.atk, mult: 1.6, elemA: e.elem });
          bLog(e.name + '使出重击!' + (r.miss ? '被闪开了!' : tgtName(t) + '受到 ' + r.dmg + ' 点伤害。'));
        } else if (sk === 'poison') {
          const r = applyHit(t, { atk: e.atk, mult: 1.0, elemA: e.elem, fx: 'mu' });
          if (!r.miss) {
            const dot = { dmg: Math.max(3, Math.round(e.atk * 0.25)), turns: 3 };
            if (t.side === 'player') b.pDot = dot; else b.petDot = dot;
            addFloat((t.side === 'player' ? PY : PETY).x + 24, (t.side === 'player' ? PY : PETY).y - 70, '中毒!', '#5fd97a');
          }
          bLog(e.name + '喷出毒雾!' + (r.miss ? '被闪开了!' : tgtName(t) + '受到 ' + r.dmg + ' 点伤害并中毒3回合。'));
        } else if (sk === 'charm') {
          const r = applyHit(t, { atk: e.atk, mult: 0.9, elemA: e.elem });
          if (!r.miss && Math.random() < 0.35) {
            if (t.side === 'player') b.pFrozen = true; else b.petFrozen = true;
            addFloat((t.side === 'player' ? PY : PETY).x + 24, (t.side === 'player' ? PY : PETY).y - 70, '魅惑!', '#ff9ad1');
          }
          bLog(e.name + '施展魅惑!' + (r.miss ? '被闪开了!' : tgtName(t) + '受到 ' + r.dmg + ' 点伤害。'));
        }
        later(endAction, 750);
        return;
      }
      // 普通攻击
      const t = pickTgt();
      const r = applyHit(t, { atk: e.atk, mult: 1, elemA: e.elem });
      bLog(e.name + '发起攻击!' + (r.miss ? tgtName(t) + '闪开了!' : tgtName(t) + '受到 ' + r.dmg + ' 点伤害' + (r.crit ? '(暴击!)' : '')));
      later(endAction, 650);
    }

    /* ---------- 结算 ---------- */
    function winBattle() {
      const b = g.battle;
      b.phase = 'end'; b.result = 'win';
      let exp = 0, gold = 0;
      b.enemies.forEach(e => {
        exp += Math.round(e.def.exp * (1 + 0.15 * (e.lv - 1)));
        gold += Math.round(e.def.gold * (1 + 0.1 * (e.lv - 1)));
      });
      if (g.doubleBattles > 0) { exp *= 2; g.doubleBattles--; bLog('双倍丹生效,经验翻倍!'); }
      g.exp += exp; g.money += gold;
      bLog('战斗胜利!获得 ' + exp + ' 点经验、' + gold + ' 文钱。');
      // 掉落
      const drops = [];
      b.enemies.forEach(e => {
        if (e.boss) { drops.push('double'); drops.push(randEquipDrop(10)); return; }
        const r = Math.random();
        if (r < 0.2) drops.push('hppot');
        else if (r < 0.32) drops.push('mppot');
        else if (r < 0.42) drops.push('trap');
        else if (r < 0.48) drops.push(randEquipDrop(e.lv));
      });
      drops.forEach(id => { if (id && bagAdd(id, 1)) bLog('拾得【' + itemName(id) + '】!'); });
      // 任务进度
      let dogProgress = false;
      b.enemies.forEach(e => {
        if (e.key === 'yegou') { if (questDogKilled(g.quest)) dogProgress = true; }
        if (e.boss) {
          g.flags.bossDead = true;
          if (g.quest.main === 3) { g.quest.main = 4; XP.notify('任务', '幽冥龙王已诛!回天墉城找长老领奖!'); }
        }
      });
      if (dogProgress) {
        if (g.quest.main === 2) { XP.notify('任务', '野狗已除净!回城找任务长老复命!'); bLog('任务进度: 野狗已除净,回去复命吧!'); }
        else bLog('任务进度: 野狗 ' + g.quest.dogs + '/5');
      }
      // 经验与升级
      gainExpPlayer(exp, bLog);
      const pet = g.pets[Math.min(g.activePet, Math.max(0, g.pets.length - 1))];
      g.pets.forEach((p, i) => {
        const pe = p === pet ? exp : Math.floor(exp * 0.4);
        gainExpPet(p, pe, bLog);
        // 战后恢复
        if (p.hp <= 0) p.hp = Math.max(1, Math.floor(p.maxhp * 0.25));
        else p.hp = Math.min(p.maxhp, p.hp + Math.floor(p.maxhp * 0.25));
      });
      XP.sound('ding');
      updateStatus();
      saveGame(true);
    }
    function randEquipDrop(lv) {
      const pool = Object.keys(EQUIPS).filter(id => {
        const e = EQUIPS[id];
        return !e.quest && e.price > 0 && e.lv <= Math.min(10, lv + 2) && (!e.sect || e.sect === g.sect);
      });
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'hppot';
    }
    function gainExpPlayer(exp, logFn) {
      let leveled = false;
      while (g.exp >= expNeed(g.lv)) {
        g.exp -= expNeed(g.lv);
        g.lv++;
        const gr = SECTS[g.sect].grow;
        g.maxhp += gr.hp; g.maxmp += gr.mp; g.atk += gr.atk; g.def += gr.def; g.spd += gr.spd;
        g.hp = effMaxHp(); g.mp = g.maxmp;
        logFn('★ 你升到了 ' + g.lv + ' 级!HP/MP全恢复!');
        const newSk = SECTS[g.sect].skills.find(s => s.lv === g.lv);
        if (newSk) logFn('★ 领悟了新法术:【' + newSk.name + '】!');
        leveled = true;
      }
      if (leveled) { sfx('level'); XP.notify('问道', '升到 ' + g.lv + ' 级!'); }
    }
    function gainExpPet(p, exp, logFn) {
      p.exp += exp;
      while (p.exp >= expNeed(p.lv)) {
        p.exp -= expNeed(p.lv);
        p.lv++;
        p.maxhp = Math.round(p.maxhp * 1.12) + 3;
        p.atk += 2; p.def += 1;
        if (p.lv % 3 === 0) p.spd += 1;
        p.hp = p.maxhp;
        logFn('★ 宠物 ' + p.name + ' 升到了 ' + p.lv + ' 级!');
      }
    }

    function loseBattle() {
      const b = g.battle;
      b.phase = 'end'; b.result = 'lose';
      g.money = Math.floor(g.money * 0.9);
      bLog('你被击败了…好心人把你抬回了天墉城。(金钱-10%)');
      XP.sound('error');
      updateStatus();
    }
    function continueEnd() {
      const b = g.battle;
      if (!b || b.phase !== 'end') return;
      const res = b.result;
      g.battle = null;
      g.state = 'map';
      clearKeys();
      g.safeSteps = 3;
      if (res === 'lose') {
        g.mapId = 'town';
        const sp = MAPS.town.spawn;
        g.px = sp.x * TS + TS / 2; g.py = sp.y * TS + TS / 2;
        g.tx = sp.x; g.ty = sp.y;
        g.hp = 1;
        g.pets.forEach(p => { if (p.hp <= 0) p.hp = Math.max(1, Math.floor(p.maxhp * 0.3)); });
        saveGame(true);
      }
      updateStatus();
    }

    /* ============================================================
       渲染 — 通用
       ============================================================ */
    const tinted = {};
    function makeTint(img, filter) {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const cx = c.getContext('2d');
      cx.filter = filter;
      if (imgOk(img)) cx.drawImage(img, 0, 0);
      return c;
    }
    function initTinted() {
      tinted.grassDark = makeTint(imgs['tile-grass'], 'brightness(0.42) saturate(0.8)');
      tinted.grass2Dark = makeTint(imgs['tile-grass2'], 'brightness(0.42) saturate(0.8)');
      tinted.sandDark = makeTint(imgs['tile-sand'], 'brightness(0.5) saturate(0.7)');
      tinted.treeDead = makeTint(imgs['tile-tree-orange'], 'brightness(0.5) saturate(0.6)');
    }
    function text(s, x, y, size, color, align, weight) {
      ctx.font = (weight || '') + size + 'px "Microsoft YaHei","PingFang SC",sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(s, x, y);
    }
    function drawImg(im, x, y, w, h) {
      if (imgOk(im)) { ctx.drawImage(im, x, y, w, h); return true; }
      return false;
    }
    function drawBar(x, y, w, h, frac, color) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * Math.min(1, Math.max(0, frac))), h - 2);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    }

    /* ============================================================
       渲染 — 地图
       ============================================================ */
    function camera() {
      const m = curMap();
      return {
        x: Math.max(0, Math.min(m.w * TS - CW, Math.round(g.px - CW / 2))),
        y: Math.max(0, Math.min(m.h * TS - CH, Math.round(g.py - CH / 2))),
      };
    }
    function drawGroundTile(t, sx, sy, tx, ty) {
      if (t === 0 || t === 1 || t === 2) {
        drawImg(imgs[t === 0 ? 'tile-grass' : t === 1 ? 'tile-grass2' : 'tile-grass3'], sx, sy, TS, TS) ||
          (ctx.fillStyle = '#63b04f', ctx.fillRect(sx, sy, TS, TS));
      } else if (t === 3) {
        drawImg(imgs['tile-sand'], sx, sy, TS, TS) || (ctx.fillStyle = '#c8a96a', ctx.fillRect(sx, sy, TS, TS));
      } else if (t === 4) {
        ctx.fillStyle = '#2f6fc0';
        ctx.fillRect(sx, sy, TS, TS);
        const off = (g.frame >> 4) % 3;
        ctx.strokeStyle = '#7fb0ec';
        ctx.lineWidth = 1;
        for (let row = 0; row < 2; row++) {
          ctx.beginPath();
          for (let i = 0; i <= TS; i += 4) {
            const yy = sy + 9 + row * 12 + Math.sin((i + off * 6 + tx * 3) / 5) * 1.8;
            if (i === 0) ctx.moveTo(sx, yy); else ctx.lineTo(sx + i, yy);
          }
          ctx.stroke();
        }
      } else if (t === 5) { // 高草(遇敌)
        drawImg(imgs['tile-grass2'], sx, sy, TS, TS) || (ctx.fillStyle = '#3a8040', ctx.fillRect(sx, sy, TS, TS));
        ctx.strokeStyle = '#2e6e34';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          const bx = sx + 4 + i * 6 + Math.floor(h2(tx + i, ty) * 3);
          ctx.beginPath();
          ctx.moveTo(bx, sy + 28);
          ctx.lineTo(bx + 1, sy + 12 + Math.floor(h2(tx, ty + i) * 8));
          ctx.stroke();
        }
      } else if (t === 6 || t === 7) { // 轩辕坟暗地
        ctx.drawImage((tx + ty) % 3 === 0 ? tinted.grass2Dark : tinted.grassDark, sx, sy, TS, TS);
        if (t === 7) {
          ctx.strokeStyle = '#4a4a5a';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const bx = sx + 5 + i * 7 + Math.floor(h2(tx + i, ty) * 3);
            ctx.beginPath();
            ctx.moveTo(bx, sy + 27);
            ctx.lineTo(bx, sy + 14 + Math.floor(h2(tx, ty + i) * 6));
            ctx.stroke();
          }
        }
      }
    }
    function drawTreeObj(sx, sy, tx, ty, dead) {
      const r = h2(tx, ty);
      if (dead) { ctx.drawImage(tinted.treeDead, sx, sy, TS, TS); return; }
      const im = r < 0.5 ? imgs['tile-tree-pine'] : imgs['tile-tree-round'];
      if (!drawImg(im, sx, sy, TS, TS)) {
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath(); ctx.arc(sx + 16, sy + 14, 12, 0, Math.PI * 2); ctx.fill();
      }
    }
    function drawHouse(hh, cam) {
      const px = hh.x * TS - cam.x, py = hh.y * TS - cam.y;
      const w = hh.w * TS, h = hh.h * TS;
      const roofH = Math.floor(h * 0.4);
      ctx.fillStyle = '#e8d8b0';
      ctx.fillRect(px + 3, py + roofH, w - 6, h - roofH);
      ctx.fillStyle = hh.roof;
      ctx.fillRect(px, py, w, roofH);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fillRect(px, py + roofH - 4, w, 4);
      // 窗
      ctx.fillStyle = '#9fd0f0';
      ctx.fillRect(px + 14, py + roofH + 12, 14, 14);
      ctx.fillRect(px + w - 28, py + roofH + 12, 14, 14);
      // 门
      if (!drawImg(imgs['tile-door'], px + w / 2 - 16, py + h - 32, 32, 32)) {
        ctx.fillStyle = '#8a5a2a';
        ctx.fillRect(px + w / 2 - 10, py + h - 28, 20, 28);
      }
      // 招牌
      ctx.fillStyle = '#f4e8c8';
      ctx.fillRect(px + w / 2 - 13, py + 4, 26, 22);
      ctx.strokeStyle = '#7a4a20';
      ctx.strokeRect(px + w / 2 - 12.5, py + 4.5, 25, 21);
      text(hh.label, px + w / 2, py + 21, 15, '#7a2010', 'center', 'bold ');
    }
    function drawNpcFig(x, y, color, name, female) {
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(x, y + 12, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.fillRect(x - 6, y - 2, 12, 14);
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath(); ctx.arc(x, y - 8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = female ? '#532' : '#444';
      ctx.beginPath(); ctx.arc(x, y - 10, 6, Math.PI, 0); ctx.fill();
      if (female) ctx.fillRect(x - 6, y - 10, 2, 8), ctx.fillRect(x + 4, y - 10, 2, 8);
      ctx.fillStyle = '#222';
      ctx.fillRect(x - 3, y - 8, 1.8, 1.8);
      ctx.fillRect(x + 1.2, y - 8, 1.8, 1.8);
      // 名字
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      const wname = name.length * 11 + 8;
      ctx.fillRect(x - wname / 2, y - 30, wname, 15);
      text(name, x, y - 18, 11, '#fff', 'center');
    }
    function drawPlayerFig(x, y) {
      const s = SECTS[g.sect];
      const bob = g.moving ? Math.sin(g.frame * 0.32) * 1.4 : 0;
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.ellipse(x, y + 12, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
      // 道袍
      ctx.fillStyle = g.gender === 'f' ? shade(s.color, 1.35) : s.color;
      ctx.fillRect(x - 6, y - 2 + bob, 12, 14);
      ctx.fillStyle = s.tint || '#f2c230';
      ctx.fillRect(x - 6, y + 5 + bob, 12, 2);
      // 头
      ctx.fillStyle = '#ffd9a0';
      ctx.beginPath(); ctx.arc(x, y - 8 + bob, 6, 0, Math.PI * 2); ctx.fill();
      // 发型: 男发髻/女长发
      ctx.fillStyle = '#222';
      if (g.gender === 'f') {
        ctx.beginPath(); ctx.arc(x, y - 10 + bob, 6, Math.PI, 0); ctx.fill();
        ctx.fillRect(x - 6, y - 9 + bob, 2.5, 10);
        ctx.fillRect(x + 3.5, y - 9 + bob, 2.5, 10);
      } else {
        ctx.beginPath(); ctx.arc(x, y - 10 + bob, 6, Math.PI, 0); ctx.fill();
        ctx.fillRect(x - 1.5, y - 17 + bob, 3, 5);
      }
      // 朝向 (眼睛)
      ctx.fillStyle = '#222';
      const f = g.face;
      if (f === 0) { ctx.fillRect(x - 3, y - 8 + bob, 1.8, 1.8); ctx.fillRect(x + 1.2, y - 8 + bob, 1.8, 1.8); }
      else if (f === 1) { ctx.fillRect(x - 4.2, y - 8 + bob, 1.8, 1.8); }
      else if (f === 2) { ctx.fillRect(x + 2.4, y - 8 + bob, 1.8, 1.8); }
    }
    function shade(hex, f) {
      const n = parseInt(hex.slice(1), 16);
      const r = Math.min(255, Math.round((n >> 16) * f));
      const gg = Math.min(255, Math.round(((n >> 8) & 255) * f));
      const b = Math.min(255, Math.round((n & 255) * f));
      return 'rgb(' + r + ',' + gg + ',' + b + ')';
    }

    function renderMap() {
      const m = curMap();
      const cam = camera();
      ctx.fillStyle = m.dark ? '#101018' : '#63b04f';
      ctx.fillRect(0, 0, CW, CH);
      const x0 = Math.floor(cam.x / TS), y0 = Math.floor(cam.y / TS);
      const x1 = Math.ceil((cam.x + CW) / TS), y1 = Math.ceil((cam.y + CH) / TS);
      for (let ty = y0; ty < y1; ty++) {
        for (let tx = x0; tx < x1; tx++) {
          if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) continue;
          const t = m.ground[ty][tx];
          const sx = tx * TS - cam.x, sy = ty * TS - cam.y;
          if (t === -1 || t === -2) {
            drawGroundTile(m.dark ? 6 : 0, sx, sy, tx, ty);
            drawTreeObj(sx, sy, tx, ty, t === -2);
          } else {
            drawGroundTile(t, sx, sy, tx, ty);
          }
        }
      }
      // 房屋
      m.houses.forEach(hh => drawHouse(hh, cam));
      // 岩石(墓碑)
      m.rocks.forEach(([rx, ry]) => {
        const sx = rx * TS - cam.x, sy = ry * TS - cam.y;
        if (!drawImg(imgs['tile-rock'], sx, sy, TS, TS)) {
          ctx.fillStyle = '#888'; ctx.fillRect(sx + 6, sy + 6, 20, 24);
        }
      });
      // 宝箱
      m.chests.forEach((c, i) => {
        const sx = c.x * TS - cam.x, sy = c.y * TS - cam.y;
        const opened = g.flags.chests[m.id + i];
        ctx.globalAlpha = opened ? 0.4 : 1;
        if (!drawImg(imgs.chest, sx - 4, sy - 6, 40, 40)) {
          ctx.fillStyle = opened ? '#666' : '#c8a020';
          ctx.fillRect(sx + 4, sy + 8, 24, 18);
        }
        ctx.globalAlpha = 1;
        if (!opened && (g.frame >> 3) % 2) {
          ctx.fillStyle = '#fff8c0';
          ctx.fillRect(sx + 24, sy + 2, 2, 2);
          ctx.fillRect(sx + 28, sy + 6, 2, 2);
        }
      });
      // 传送点 (发光)
      m.portals.forEach(p => {
        const sx = (p.x + p.w / 2) * TS - cam.x, sy = (p.y + p.h / 2) * TS - cam.y;
        const pulse = 0.5 + 0.5 * Math.sin(g.frame * 0.08);
        ctx.fillStyle = 'rgba(255,220,90,' + (0.25 + pulse * 0.35) + ')';
        ctx.beginPath(); ctx.ellipse(sx, sy, 16 + pulse * 6, 10 + pulse * 4, 0, 0, Math.PI * 2); ctx.fill();
        text(p.label, sx, sy - 16, 11, '#ffe9a8', 'center', 'bold ');
      });
      // BOSS
      if (m.boss && !g.flags.bossDead) {
        const sx = m.boss.x * TS + TS / 2 - cam.x, sy = m.boss.y * TS + TS / 2 - cam.y;
        const bobY = Math.sin(g.frame * 0.05) * 3;
        const pulse = 0.5 + 0.5 * Math.sin(g.frame * 0.1);
        ctx.fillStyle = 'rgba(200,40,40,' + (0.15 + pulse * 0.2) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, 30 + pulse * 8, 0, Math.PI * 2); ctx.fill();
        if (!drawImg(imgs['mon-longwang'], sx - 32, sy - 36 + bobY, 64, 64)) {
          ctx.fillStyle = '#6030a0';
          ctx.fillRect(sx - 16, sy - 16, 32, 32);
        }
        ctx.fillStyle = 'rgba(0,0,0,.6)';
        ctx.fillRect(sx - 34, sy - 52, 68, 15);
        text(m.boss.name, sx, sy - 41, 11, '#ff8080', 'center', 'bold ');
      }
      // NPC
      m.npcs.forEach(n => {
        drawNpcFig(n.x * TS + TS / 2 - cam.x, n.y * TS + TS / 2 - cam.y, n.color, n.name, n.id === 'kezhan');
      });
      // 主角
      drawPlayerFig(g.px - cam.x, g.py - cam.y);
      // 互动提示
      const near = nearInteractable();
      if (near && (g.frame >> 4) % 2) {
        const sx = g.px - cam.x, sy = g.py - cam.y;
        text('按空格: ' + near.hint, sx, sy - 30, 11, '#ffd93d', 'center', 'bold ');
      }
      // 轩辕坟雾气
      if (m.dark) {
        ctx.fillStyle = 'rgba(20,16,40,0.28)';
        ctx.fillRect(0, 0, CW, CH);
      }
      drawMinimap();
      drawQuestTracker();
    }

    function drawMinimap() {
      const m = curMap();
      const mw = 132, mh = Math.min(100, Math.round(132 * m.h / m.w));
      const ox = CW - mw - 10, oy = 10;
      const sx = mw / m.w, sy = mh / m.h;
      ctx.fillStyle = 'rgba(10,10,20,.75)';
      ctx.fillRect(ox - 2, oy - 2, mw + 4, mh + 4);
      ctx.strokeStyle = '#7f9db9';
      ctx.strokeRect(ox - 1.5, oy - 1.5, mw + 3, mh + 3);
      for (let ty = 0; ty < m.h; ty++) {
        for (let tx = 0; tx < m.w; tx++) {
          const t = m.ground[ty][tx];
          let c = null;
          if (t === 4) c = '#2f6fc0';
          else if (t === 3) c = '#c8a96a';
          else if (t === -1 || t === -2) c = m.dark ? '#3a3030' : '#2e7d32';
          else if (t === 5 || t === 7) c = m.dark ? '#4a4a5a' : '#3a8040';
          if (c) { ctx.fillStyle = c; ctx.fillRect(ox + tx * sx, oy + ty * sy, sx + 0.6, sy + 0.6); }
        }
      }
      m.houses.forEach(hh => { ctx.fillStyle = '#e8d8b0'; ctx.fillRect(ox + hh.x * sx, oy + hh.y * sy, hh.w * sx, hh.h * sy); });
      m.portals.forEach(p => { ctx.fillStyle = '#ffd93d'; ctx.fillRect(ox + p.x * sx - 1, oy + p.y * sy - 1, 4, 4); });
      m.npcs.forEach(n => { ctx.fillStyle = '#5fd0ff'; ctx.fillRect(ox + n.x * sx - 1, oy + n.y * sy - 1, 3.5, 3.5); });
      m.chests.forEach((c, i) => { if (!g.flags.chests[m.id + i]) { ctx.fillStyle = '#ffa030'; ctx.fillRect(ox + c.x * sx - 1, oy + c.y * sy - 1, 3.5, 3.5); } });
      if (m.boss && !g.flags.bossDead) { ctx.fillStyle = '#ff4040'; ctx.fillRect(ox + m.boss.x * sx - 1.5, oy + m.boss.y * sy - 1.5, 5, 5); }
      if ((g.frame >> 4) % 2) { ctx.fillStyle = '#fff'; ctx.fillRect(ox + (g.px / TS) * sx - 1.5, oy + (g.py / TS) * sy - 1.5, 4, 4); }
      text(m.name, ox + mw / 2, oy + mh + 13, 11, '#e8e8e8', 'center', 'bold ');
    }
    function drawQuestTracker() {
      const q = MAIN_QUESTS[g.quest.main];
      const txt = '任务: ' + q.t + (g.quest.main === 1 ? ' (' + g.quest.dogs + '/5)' : '');
      ctx.fillStyle = 'rgba(10,10,20,.65)';
      ctx.fillRect(8, 8, Math.min(330, 16 + txt.length * 12), 24);
      ctx.strokeStyle = '#6a5a2a';
      ctx.strokeRect(8.5, 8.5, Math.min(330, 16 + txt.length * 12) - 1, 23);
      text(txt, 16, 25, 12, '#ffd93d', 'left');
      if (g.doubleBattles > 0) text('双倍x' + g.doubleBattles + '场', 16, 45, 11, '#9f9', 'left');
    }

    /* ============================================================
       渲染 — 战斗
       ============================================================ */
    function drawPortrait(img, x, y, w, h, femaleTint) {
      if (femaleTint) ctx.filter = 'sepia(0.35) hue-rotate(-35deg) saturate(1.7)';
      const ok = drawImg(img, x, y, w, h);
      ctx.filter = 'none';
      return ok;
    }
    function renderBattle() {
      const b = g.battle;
      ctx.save();
      if (b.shakeT > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
      // 背景
      if (!drawImg(imgs[b.bg], 0, 0, CW, CH)) {
        ctx.fillStyle = b.bg === 'bg-grave' ? '#1a1830' : '#3a6a3a';
        ctx.fillRect(0, 0, CW, CH);
      }
      ctx.fillStyle = 'rgba(0,0,0,.15)';
      ctx.fillRect(0, 0, CW, CH);

      b.hitE = [];
      // 敌人
      b.enemies.forEach((e, i) => {
        if (e.hp <= 0) return;
        const pos = enemyPos(i);
        const size = e.boss ? 190 : 108;
        const bobY = Math.sin(g.frame * 0.05 + i) * 4;
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath(); ctx.ellipse(pos.x, pos.y + size * 0.42, size * 0.4, 10, 0, 0, Math.PI * 2); ctx.fill();
        if (!drawImg(imgs[e.mdef.img], pos.x - size / 2, pos.y - size / 2 + bobY, size, size)) {
          ctx.fillStyle = '#8040a0';
          ctx.fillRect(pos.x - 30, pos.y - 30, 60, 60);
          text(e.name[0], pos.x, pos.y + 8, 28, '#fff', 'center');
        }
        const barW = e.boss ? 200 : 120;
        drawBar(pos.x - barW / 2, pos.y - size / 2 - 24 + bobY, barW, 8, e.hp / e.maxhp, e.boss ? '#c030ff' : '#e33');
        text(e.name + ' Lv.' + e.lv, pos.x, pos.y - size / 2 - 30 + bobY, 12, '#fff', 'center', 'bold ');
        let badgeX = pos.x - barW / 2;
        if (e.frozen) { text('❄', badgeX, pos.y - size / 2 - 30 + bobY, 12, '#5ab8ff'); badgeX += 16; }
        if (e.dot) { text('☠', badgeX, pos.y - size / 2 - 30 + bobY, 12, '#5fd97a'); }
        b.hitE.push({ x: pos.x - size / 2, y: pos.y - size / 2 - 20, w: size, h: size + 20, i: i });
        // 目标选择箭头
        if (b.phase === 'target' && b.targetSide === 'enemy' && b.targetIdx === i) {
          const ay = pos.y - size / 2 - 52 + bobY + Math.sin(g.frame * 0.2) * 4;
          ctx.fillStyle = '#ffd93d';
          ctx.beginPath();
          ctx.moveTo(pos.x, ay + 12); ctx.lineTo(pos.x - 9, ay); ctx.lineTo(pos.x + 9, ay);
          ctx.closePath(); ctx.fill();
        }
      });

      // 日志
      ctx.fillStyle = 'rgba(8,8,18,.8)';
      ctx.fillRect(20, 238, 760, 82);
      ctx.strokeStyle = '#556';
      ctx.strokeRect(20.5, 238.5, 759, 81);
      const lines = b.log.slice(-3);
      lines.forEach((l, i) => text(l, 32, 262 + i * 24, 13, i === lines.length - 1 ? '#fff' : '#aab'));

      // 我方面板
      b.hitA = [];
      ctx.fillStyle = 'rgba(8,8,18,.8)';
      ctx.fillRect(20, 332, 360, 126);
      ctx.strokeStyle = b.phase === 'target' && b.targetSide === 'ally' && b.targetIdx === 0 ? '#ffd93d' : '#556';
      ctx.lineWidth = b.phase === 'target' && b.targetSide === 'ally' && b.targetIdx === 0 ? 2 : 1;
      ctx.strokeRect(20.5, 332.5, 359, 125);
      ctx.lineWidth = 1;
      drawPortrait(imgs[SECTS[g.sect].img], 32, 346, 96, 96, g.gender === 'f');
      text(g.name + '  Lv.' + g.lv, 140, 362, 13, '#fff', 'left', 'bold ');
      text(SECTS[g.sect].name, 140, 380, 11, SECTS[g.sect].color);
      text('HP', 140, 404, 11, '#ff9a9a');
      drawBar(166, 394, 140, 10, g.hp / effMaxHp(), '#e33');
      text(g.hp + '/' + effMaxHp(), 312, 404, 10, '#ccc');
      text('MP', 140, 424, 11, '#9ac0ff');
      drawBar(166, 414, 140, 10, g.mp / g.maxmp, '#36c');
      text(g.mp + '/' + g.maxmp, 312, 424, 10, '#ccc');
      let pbX = 140;
      if (b.pDefend) { text('[防]', pbX, 446, 11, '#7fd0ff'); pbX += 34; }
      if (b.pBuff > 0) { text('[壁' + b.pBuff + ']', pbX, 446, 11, '#c8a060'); pbX += 44; }
      if (b.pFrozen) { text('[冰]', pbX, 446, 11, '#5ab8ff'); pbX += 34; }
      if (b.pDot) { text('[毒' + b.pDot.turns + ']', pbX, 446, 11, '#5fd97a'); }
      b.hitA.push({ x: 20, y: 332, w: 360, h: 126, side: 'player', idx: 0 });

      // 宠物面板
      const pet = g.pets.length ? g.pets[Math.min(g.activePet, g.pets.length - 1)] : null;
      if (pet) {
        ctx.fillStyle = 'rgba(8,8,18,.8)';
        ctx.fillRect(20, 468, 360, 112);
        ctx.strokeStyle = b.phase === 'target' && b.targetSide === 'ally' && b.targetIdx === 1 ? '#ffd93d' : '#556';
        ctx.lineWidth = b.phase === 'target' && b.targetSide === 'ally' && b.targetIdx === 1 ? 2 : 1;
        ctx.strokeRect(20.5, 468.5, 359, 111);
        ctx.lineWidth = 1;
        if (pet.hp > 0) {
          if (!drawImg(imgs[MONSTERS[pet.key].img], 34, 482, 80, 80)) {
            ctx.fillStyle = '#8040a0'; ctx.fillRect(40, 490, 60, 60);
          }
        } else {
          ctx.globalAlpha = 0.35;
          drawImg(imgs[MONSTERS[pet.key].img], 34, 482, 80, 80);
          ctx.globalAlpha = 1;
          text('战斗不能', 74, 528, 12, '#f88', 'center');
        }
        text(pet.name + '  Lv.' + pet.lv, 128, 496, 13, '#ffe9a8', 'left', 'bold ');
        text(ELEM_CN[petElem(pet)] + '系宠物', 128, 514, 11, ELEM_FX[petElem(pet)]);
        text('HP', 128, 538, 11, '#ff9a9a');
        drawBar(154, 528, 150, 10, pet.hp / pet.maxhp, '#d04848');
        text(Math.max(0, pet.hp) + '/' + pet.maxhp, 310, 538, 10, '#ccc');
        let qbX = 128;
        if (b.petFrozen) { text('[冰]', qbX, 560, 11, '#5ab8ff'); qbX += 34; }
        if (b.petDot) { text('[毒' + b.petDot.turns + ']', qbX, 560, 11, '#5fd97a'); }
        b.hitA.push({ x: 20, y: 468, w: 360, h: 112, side: 'pet', idx: 1 });
      }

      // 菜单
      ctx.fillStyle = 'rgba(8,8,18,.85)';
      ctx.fillRect(400, 332, 380, 248);
      ctx.strokeStyle = '#556';
      ctx.strokeRect(400.5, 332.5, 379, 247);
      b.menuRects = [];
      const hints = ['普攻', '门派法术', '抓捕/切换', '使用物品', '受伤减半', b.boss ? '无法逃跑' : '概率逃离'];
      for (let i = 0; i < 6; i++) {
        const rx = 412 + (i % 2) * 190, ry = 344 + Math.floor(i / 2) * 78;
        const rw = 178, rh = 68;
        b.menuRects.push({ x: rx, y: ry, w: rw, h: rh });
        const on = b.phase === 'menu' && !b.sub;
        ctx.fillStyle = on && i === b.sel ? '#2a3050' : '#14182c';
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeStyle = on && i === b.sel ? '#ffd93d' : '#3a4a6a';
        ctx.lineWidth = on && i === b.sel ? 2 : 1;
        ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
        ctx.lineWidth = 1;
        text((i + 1) + '. ' + MENU_LABELS[i], rx + 14, ry + 30, 15, on && i === b.sel ? '#ffd93d' : '#fff', 'left', 'bold ');
        let hint = hints[i];
        if (i === 3) {
          const items = battleItems();
          hint = items.length ? items.map(it => itemName(it.id) + 'x' + it.n).join(' ') : '无可用道具';
        }
        if (i === 2) hint = '捕兽夹x' + bagCount('trap');
        text(hint, rx + 14, ry + 52, 11, '#889');
      }

      // 子菜单
      b.subRects = [];
      if (b.sub) drawSubmenu();

      // 目标选择提示
      if (b.phase === 'target') {
        ctx.fillStyle = 'rgba(0,0,0,.7)';
        ctx.fillRect(250, 210, 300, 24);
        text(b.targetSide === 'enemy' ? '←→ 选择敌人 · 回车确认 · Esc取消' : '←→ 选择己方 · 回车确认 · Esc取消', 400, 227, 12, '#ffd93d', 'center');
      }

      // 飘字
      b.floats.forEach(f => {
        ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
        text(f.txt, f.x, f.y, f.big ? 22 : 17, f.color, 'center', 'bold ');
      });
      ctx.globalAlpha = 1;
      // 技能特效环
      b.fxs.forEach(fx => {
        ctx.globalAlpha = Math.max(0, fx.life * 2);
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
      });
      ctx.globalAlpha = 1;

      // intro / end 覆盖
      if (b.phase === 'intro') {
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(0, 0, CW, CH);
        text(b.boss ? '幽冥龙王 现身!' : '遭遇敌人!', 400, 300, 30, '#ffd93d', 'center', 'bold ');
        if ((g.frame >> 4) % 2) text('(按任意键)', 400, 336, 13, '#ccc', 'center');
      }
      if (b.phase === 'end') {
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.fillRect(0, 0, CW, CH);
        const rt = b.result === 'win' ? '战斗胜利!' : b.result === 'fled' ? '成功逃跑' : '战败…';
        text(rt, 400, 280, 34, b.result === 'lose' ? '#ff8080' : '#ffd93d', 'center', 'bold ');
        if ((g.frame >> 4) % 2) text('按 回车 / 点击 继续', 400, 326, 14, '#fff', 'center');
      }
      ctx.restore();
    }
    function drawSubmenu() {
      const b = g.battle;
      ctx.fillStyle = 'rgba(10,12,26,.96)';
      ctx.fillRect(406, 338, 368, 236);
      ctx.strokeStyle = '#8aa0d0';
      ctx.strokeRect(406.5, 338.5, 367, 235);
      let rows = [];
      if (b.sub === 'skill') {
        rows = unlockedSkills().map(s => ({
          label: s.name + '  (' + s.mp + 'MP)',
          sub: s.desc + (s.tgt === 'all' ? ' · 群体' : s.kind === 'heal' ? ' · 治疗' : ' · 单体'),
          disabled: g.mp < s.mp,
        }));
        text('选择法术 (Lv.' + g.lv + '已解锁 ' + rows.length + '/' + SECTS[g.sect].skills.length + ')', 420, 362, 12, '#9ab');
      } else if (b.sub === 'pet') {
        rows = [
          { label: '抓捕宠物 (捕兽夹x' + bagCount('trap') + ')', sub: '怪物HP<30%才可抓, BOSS不可抓', disabled: bagCount('trap') <= 0 },
          { label: '更换出战宠物', sub: '当前: ' + (g.pets.length ? g.pets[Math.min(g.activePet, g.pets.length - 1)].name : '无'), disabled: g.pets.length <= 1 },
        ];
        text('宠物指令', 420, 362, 12, '#9ab');
      } else if (b.sub === 'switch') {
        rows = g.pets.map((p, i) => ({
          label: p.name + ' Lv.' + p.lv + (i === g.activePet ? ' (出战中)' : ''),
          sub: 'HP ' + Math.max(0, p.hp) + '/' + p.maxhp,
          disabled: p.hp <= 0 || i === g.activePet,
        }));
        text('选择出战宠物', 420, 362, 12, '#9ab');
      } else if (b.sub === 'item') {
        rows = battleItems().map(it => ({
          label: itemName(it.id) + ' x' + it.n,
          sub: ITEMS[it.id].desc,
          disabled: false,
        }));
        if (!rows.length) rows = [{ label: '(没有可用道具)', sub: '药店有售小还丹/凝神丹', disabled: true }];
        text('使用道具', 420, 362, 12, '#9ab');
      }
      const compact = rows.length > 4;
      const rh = compact ? 32 : 44;
      rows.forEach((r, i) => {
        const ry = 374 + i * rh;
        if (ry + rh - 2 > 572) return;
        const on = i === b.subSel;
        b.subRects.push({ x: 414, y: ry, w: 352, h: rh - 4, i: i });
        ctx.fillStyle = on ? '#2a3050' : '#14182c';
        ctx.fillRect(414, ry, 352, rh - 4);
        ctx.strokeStyle = on ? '#ffd93d' : '#3a4a6a';
        ctx.strokeRect(414.5, ry + 0.5, 351, rh - 5);
        if (compact) {
          text((i + 1) + '. ' + r.label, 424, ry + 20, 12, r.disabled ? '#666' : (on ? '#ffd93d' : '#fff'), 'left', 'bold ');
          text(r.sub, 748, ry + 20, 10, r.disabled ? '#555' : '#889', 'right');
        } else {
          text((i + 1) + '. ' + r.label, 424, ry + 18, 13, r.disabled ? '#666' : (on ? '#ffd93d' : '#fff'), 'left', 'bold ');
          text(r.sub, 424, ry + 34, 10, r.disabled ? '#555' : '#889');
        }
      });
    }

    /* ============================================================
       渲染 — 标题背景 / 加载 / 聚焦提示
       ============================================================ */
    function renderTitleBg() {
      if (!drawImg(imgs['bg-town'], 0, 0, CW, CH)) {
        ctx.fillStyle = '#20304a';
        ctx.fillRect(0, 0, CW, CH);
      }
      const grad = ctx.createLinearGradient(0, 0, 0, CH);
      grad.addColorStop(0, 'rgba(10,10,30,.35)');
      grad.addColorStop(1, 'rgba(10,10,20,.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CW, CH);
    }
    function renderLoading() {
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, CW, CH);
      text('问道', 400, 260, 44, '#ffd93d', 'center', 'bold ');
      text('素材加载中… ' + loadDone + '/' + loadTotal, 400, 310, 14, '#aab', 'center');
    }
    function drawFocusHint() {
      ctx.fillStyle = 'rgba(0,0,0,.6)';
      ctx.fillRect(0, 0, CW, CH);
      text('点击游戏画面开始操作', 400, 290, 18, '#fff', 'center', 'bold ');
      text('(键盘操作需要先点击画面聚焦)', 400, 318, 12, '#aaa', 'center');
    }

    /* ============================================================
       地图交互
       ============================================================ */
    function nearInteractable() {
      const m = curMap();
      const tx = g.tx, ty = g.ty;
      const dirs = g.face === 0 ? [[0, 1], [0, -1], [-1, 0], [1, 0]]
        : g.face === 3 ? [[0, -1], [0, 1], [-1, 0], [1, 0]]
        : g.face === 1 ? [[-1, 0], [1, 0], [0, 1], [0, -1]]
        : [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const d of dirs) {
        const nx = tx + d[0], ny = ty + d[1];
        const npc = m.npcs.find(n => n.x === nx && n.y === ny);
        if (npc) return { type: 'npc', npc: npc, hint: '与' + npc.name + '对话' };
        if (m.boss && !g.flags.bossDead && m.boss.x === nx && m.boss.y === ny) return { type: 'boss', hint: '挑战' + m.boss.name };
        for (let i = 0; i < m.chests.length; i++) {
          const c = m.chests[i];
          if (c.x === nx && c.y === ny && !g.flags.chests[m.id + i]) return { type: 'chest', i: i, hint: '打开宝箱' };
        }
      }
      for (const p of m.portals) {
        if (tx >= p.x && tx < p.x + p.w && ty >= p.y && ty < p.y + p.h) return { type: 'portal', p: p, hint: p.label.replace('→', '前往') };
      }
      return null;
    }
    function interact() {
      const n = nearInteractable();
      if (!n) return;
      ac();
      if (n.type === 'npc') { XP.sound('click'); openDialog(n.npc); }
      else if (n.type === 'chest') openChest(n.i);
      else if (n.type === 'portal') { sfx('portal'); switchMap(n.p); }
      else if (n.type === 'boss') {
        if (g.quest.main < 3) {
          XP.notify('问道', '恐怖的气息令人窒息…还是先完成长老的委托吧。(需接取屠龙任务)');
          XP.sound('error');
          return;
        }
        enterBattle({ boss: true, bg: 'bg-grave' });
      }
    }
    function openChest(i) {
      const m = curMap();
      const c = m.chests[i];
      g.flags.chests[m.id + i] = true;
      sfx('chest');
      g.money += c.gold;
      bagAdd(c.item, c.in || 1);
      XP.notify('宝箱', '获得 ' + c.gold + ' 文 + 【' + itemName(c.item) + '】x' + (c.in || 1));
      updateStatus();
      saveGame(true);
    }
    function switchMap(p) {
      g.mapId = p.to;
      g.px = p.tx * TS + TS / 2; g.py = p.ty * TS + TS / 2;
      g.tx = p.tx; g.ty = p.ty;
      g.safeSteps = 3;
      clearKeys();
      XP.notify('问道', '来到 ' + MAPS[p.to].name);
      saveGame(true);
    }

    /* ============================================================
       更新循环
       ============================================================ */
    function canStand(map, px, py) {
      const h = 7;
      return !solidAt(map, Math.floor((px - h) / TS), Math.floor((py - h) / TS)) &&
             !solidAt(map, Math.floor((px + h) / TS), Math.floor((py - h) / TS)) &&
             !solidAt(map, Math.floor((px - h) / TS), Math.floor((py + h) / TS)) &&
             !solidAt(map, Math.floor((px + h) / TS), Math.floor((py + h) / TS));
    }
    function onStep(map, tx, ty) {
      if (g.safeSteps > 0) { g.safeSteps--; return; }
      const t = map.ground[ty][tx];
      if ((t === 5 || t === 7) && Math.random() < 0.1) {
        enterBattle({ table: map.enc, bg: map.id === 'xfen' ? 'bg-grave' : 'bg-grass' });
      }
    }
    function updateBattle(dt) {
      const b = g.battle;
      if (!b) return;
      if (b.shakeT > 0) b.shakeT -= dt;
      for (let i = b.floats.length - 1; i >= 0; i--) {
        const f = b.floats[i];
        f.life -= dt; f.y += f.vy * dt;
        if (f.life <= 0) b.floats.splice(i, 1);
      }
      for (let i = b.fxs.length - 1; i >= 0; i--) {
        const fx = b.fxs[i];
        fx.life -= dt; fx.r += 70 * dt;
        if (fx.life <= 0) b.fxs.splice(i, 1);
      }
    }
    function update(dt) {
      g.frame++;
      if (g.state === 'battle') { updateBattle(dt); return; }
      if (g.state !== 'map') return;
      const map = curMap();
      let vx = 0, vy = 0;
      if (keys.up) vy -= 1;
      if (keys.down) vy += 1;
      if (keys.left) vx -= 1;
      if (keys.right) vx += 1;
      if (vx || vy) {
        if (vx && vy) { vx *= 0.7071; vy *= 0.7071; }
        g.face = vx > 0 ? 2 : vx < 0 ? 1 : vy < 0 ? 3 : 0;
        const sp = 115 * dt;
        const nx = g.px + vx * sp, ny = g.py + vy * sp;
        if (canStand(map, nx, g.py)) g.px = nx;
        if (canStand(map, g.px, ny)) g.py = ny;
        g.moving = true;
        const tx = Math.floor(g.px / TS), ty = Math.floor(g.py / TS);
        if (tx !== g.tx || ty !== g.ty) {
          g.tx = tx; g.ty = ty;
          onStep(map, tx, ty);
        }
      } else {
        g.moving = false;
      }
    }

    /* ============================================================
       输入处理
       ============================================================ */
    const GAME_KEYS = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright',
      'w', 'a', 's', 'd', ' ', 'enter', 'escape', 'b', 'q', 'p',
      '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    function resumeAudio() { try { if (actx && actx.state === 'suspended') actx.resume(); } catch (e) {} }

    function dialogKey(k) {
      const d = g.dialog;
      if (!d) return;
      if (k === 'escape') { closeDialog(); return; }
      const n = parseInt(k, 10);
      if (n >= 1 && n <= d.opts.length) { XP.sound('click'); d.opts[n - 1].fn(); }
      else if (k === 'enter' || k === ' ') { XP.sound('click'); d.opts[0].fn(); }
    }
    function bagKey(k) {
      if (k === 'arrowleft' || k === 'a') { g.bagSel = Math.max(0, g.bagSel - 1); renderBag(); }
      else if (k === 'arrowright' || k === 'd') { g.bagSel = Math.min(23, g.bagSel + 1); renderBag(); }
      else if (k === 'arrowup' || k === 'w') { g.bagSel = Math.max(0, g.bagSel - 6); renderBag(); }
      else if (k === 'arrowdown' || k === 's') { g.bagSel = Math.min(23, g.bagSel + 6); renderBag(); }
      else if (k === 'enter' || k === ' ') { if (g.bag[g.bagSel]) useBagItem(g.bagSel); }
    }
    function shopKey(k) {
      const n = parseInt(k, 10);
      const stock = shopStock(g.shop.kind);
      if (n >= 1 && n <= stock.length) buyItem(stock[n - 1]);
    }
    function mapKeyDown(k) {
      if (k === 'arrowup' || k === 'w') keys.up = true;
      else if (k === 'arrowdown' || k === 's') keys.down = true;
      else if (k === 'arrowleft' || k === 'a') keys.left = true;
      else if (k === 'arrowright' || k === 'd') keys.right = true;
      else if (k === ' ') { if (!keys._spLock) { keys._spLock = true; interact(); } }
      else if (k === 'b') openBag();
      else if (k === 'q') openQuestLog();
      else if (k === 'p') openPetPanel();
    }
    function subRowsCount() {
      const b = g.battle;
      if (b.sub === 'skill') return unlockedSkills().length;
      if (b.sub === 'pet') return 2;
      if (b.sub === 'switch') return g.pets.length;
      if (b.sub === 'item') return Math.max(1, battleItems().length);
      return 0;
    }
    function subConfirm() {
      const b = g.battle;
      if (b.sub === 'skill') pickSkill(b.subSel);
      else if (b.sub === 'pet') petSubAction(b.subSel);
      else if (b.sub === 'switch') switchPet(b.subSel);
      else if (b.sub === 'item') pickBattleItem(b.subSel);
    }
    function battleKey(k) {
      const b = g.battle;
      if (!b) return;
      if (b.phase === 'intro') { beginBattle(); return; }
      if (b.phase === 'end') { if (k === 'enter' || k === ' ') continueEnd(); return; }
      if (b.phase === 'busy') return;   // 输入锁
      if (b.phase === 'target') {
        if (k === 'arrowleft' || k === 'a' || k === 'arrowup' || k === 'w') targetMove(-1);
        else if (k === 'arrowright' || k === 'd' || k === 'arrowdown' || k === 's') targetMove(1);
        else if (k === 'enter' || k === ' ') confirmTarget();
        else if (k === 'escape') cancelTarget();
        return;
      }
      if (b.sub) {
        const rows = subRowsCount();
        if (k === 'arrowup' || k === 'w') { if (rows > 0) { b.subSel = (b.subSel - 1 + rows) % rows; XP.sound('click'); } }
        else if (k === 'arrowdown' || k === 's') { if (rows > 0) { b.subSel = (b.subSel + 1) % rows; XP.sound('click'); } }
        else if (k === 'enter' || k === ' ') { if (rows > 0) subConfirm(); }
        else if (k === 'escape') { b.sub = null; XP.sound('click'); }
        else { const n = parseInt(k, 10); if (n >= 1 && n <= rows) { b.subSel = n - 1; subConfirm(); } }
        return;
      }
      if (b.phase !== 'menu') return;
      if (k === 'arrowleft' || k === 'a') { if (b.sel % 2 === 1) { b.sel--; XP.sound('click'); } }
      else if (k === 'arrowright' || k === 'd') { if (b.sel % 2 === 0) { b.sel++; XP.sound('click'); } }
      else if (k === 'arrowup' || k === 'w') { if (b.sel >= 2) { b.sel -= 2; XP.sound('click'); } }
      else if (k === 'arrowdown' || k === 's') { if (b.sel < 4) { b.sel += 2; XP.sound('click'); } }
      else if (k === 'enter' || k === ' ') playerMenuAction(b.sel);
      else { const n = parseInt(k, 10); if (n >= 1 && n <= 6) { b.sel = n - 1; playerMenuAction(b.sel); } }
    }

    function onKeyDown(e) {
      const k = e.key.toLowerCase();
      const ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
      if (GAME_KEYS.indexOf(k) >= 0) e.preventDefault();
      resumeAudio();
      switch (g.state) {
        case 'title':
          if (k === 'arrowup' || k === 'w') titleSelMove(-1);
          else if (k === 'arrowdown' || k === 's') titleSelMove(1);
          else if (k === 'enter' || k === ' ') titleAction(g.sel);
          break;
        case 'create':
          if (k === 'escape') showTitle();
          break;
        case 'map':
          mapKeyDown(k);
          break;
        case 'battle':
          battleKey(k);
          break;
        case 'dialog':
          dialogKey(k);
          break;
        case 'bag':
          if (k === 'escape' || k === 'b') closeOverlay();
          else bagKey(k);
          break;
        case 'quest':
          if (k === 'escape' || k === 'q') closeOverlay();
          break;
        case 'pet':
          if (k === 'escape' || k === 'p') closeOverlay();
          break;
        case 'shop':
          if (k === 'escape') closeOverlay();
          else shopKey(k);
          break;
        case 'help':
          if (k === 'escape') { if (g.helpFrom) showTitle(); else closeOverlay(); }
          break;
      }
    }
    function onKeyUp(e) {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') keys.up = false;
      else if (k === 'arrowdown' || k === 's') keys.down = false;
      else if (k === 'arrowleft' || k === 'a') keys.left = false;
      else if (k === 'arrowright' || k === 'd') keys.right = false;
      else if (k === ' ') keys._spLock = false;
    }
    function inRectP(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
    function battleClick(x, y) {
      const b = g.battle;
      if (!b) return;
      if (b.phase === 'intro') { beginBattle(); return; }
      if (b.phase === 'end') { continueEnd(); return; }
      if (b.phase === 'busy') return;
      if (b.phase === 'target') {
        const list = b.targetSide === 'enemy' ? b.hitE : b.hitA;
        for (const h of list) {
          if (inRectP(x, y, h)) {
            if (b.targetSide === 'enemy') b.targetIdx = h.i; else b.targetIdx = h.idx;
            confirmTarget();
            return;
          }
        }
        return;
      }
      if (b.sub) {
        for (const r of b.subRects) if (inRectP(x, y, r)) { b.subSel = r.i; subConfirm(); return; }
        if (x < 406 || x > 774 || y < 338 || y > 574) { b.sub = null; }
        return;
      }
      if (b.phase === 'menu') {
        for (let i = 0; i < b.menuRects.length; i++)
          if (inRectP(x, y, b.menuRects[i])) { b.sel = i; playerMenuAction(i); return; }
      }
    }
    function onClick(e) {
      try { canvas.focus(); } catch (err) {}
      resumeAudio();
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (CW / rect.width);
      const y = (e.clientY - rect.top) * (CH / rect.height);
      if (g.state === 'battle') battleClick(x, y);
    }
    win.body.addEventListener('keydown', onKeyDown);
    win.body.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('blur', clearKeys);
    // 键盘监听挂在 win.body 上: 让 body 可聚焦, 点击非输入控件后自动收回焦点,
    // 避免按钮被移除后焦点丢失导致方向键失灵
    win.body.tabIndex = 0;
    win.body.style.outline = 'none';
    win.body.addEventListener('mousedown', e => {
      if (!e.target.closest('input,textarea,select')) {
        setTimeout(() => { try { win.body.focus(); } catch (err) {} }, 0);
      }
    });
    setTimeout(() => { try { win.body.focus(); } catch (err) {} }, 200);

    /* ============================================================
       主循环与启动/清理
       ============================================================ */
    function render() {
      if (g.state === 'loading') { renderLoading(); return; }
      if (g.state === 'battle') renderBattle();
      else if (g.state === 'title' || g.state === 'create' || (g.state === 'help' && g.helpFrom)) renderTitleBg();
      else renderMap();
      if (!win.body.contains(document.activeElement)) drawFocusHint();
    }
    let last = 0;
    function loop(t) {
      if (!last) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.05) dt = 0.05;
      try {
        update(dt);
        render();
        win.el.dataset.wdState = g.state;   // 供自动化测试读取游戏状态
      } catch (err) {
        console.error('[问道]', err);
      }
      g.raf = requestAnimationFrame(loop);
    }
    g.raf = requestAnimationFrame(loop);

    function tryStart() {
      if (started || !ready) return;
      started = true;
      initTinted();
      showTitle();
    }

    setTimeout(() => { try { canvas.focus(); } catch (e) {} }, 60);

    win.on('close', function cleanup() {
      cancelAnimationFrame(g.raf);
      timers.forEach(clearTimeout);
      win.body.removeEventListener('keydown', onKeyDown);
      win.body.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('blur', clearKeys);
      try { if (actx) actx.close(); } catch (e) {}
    });
  }
})();
