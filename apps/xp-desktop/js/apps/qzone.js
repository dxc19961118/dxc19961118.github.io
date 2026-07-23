/* ============================================================
   QQ空间 (QZone 2005 怀旧版) + QQ农场频道
   · 主页 / 日志 / 相册 / 留言板 / 农场 五个频道
   ·  flashy 黄橙横幅 + 星星闪图 + 走马灯
   · 背景音乐: assets/audio/01.mp3 (与千千静听同一文件, 关窗停止)
   · 农场: 2.5D 斜视角贴图农田(素材 assets/img/farm/) / 种植循环 / 随机事件 /
     商店 / 背包 / 仓库 / 开垦扩地 /
     好友农场偷菜(每日限次 + 看门狗) / 离线按真实时间生长
   · 农场状态 localStorage 持久化, key 前缀 'winxp_farm_'
   · 纯逻辑函数在 Node 下可通过 module.exports 导出做状态机测试
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 通用工具 ---------------- */
  function lsGet(key, def) {
    try {
      const v = localStorage.getItem(key);
      if (v != null) return JSON.parse(v);
    } catch (e) {}
    return def == null ? def : JSON.parse(JSON.stringify(def));
  }
  function lsSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function dailyKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }
  function fmtRemain(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    if (s < 60) return s + '秒';
    if (s < 3600) return Math.floor(s / 60) + '分' + String(s % 60).padStart(2, '0') + '秒';
    return Math.floor(s / 3600) + '时' + Math.floor((s % 3600) / 60) + '分';
  }
  function fmtNow() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  /* ---------------- 农场: 常量 ---------------- */
  const FARM_KEY = 'winxp_farm_state';
  const MAX_PLOTS = 18;
  const CROPS = {
    radish:     { name: '萝卜', seedName: '萝卜种子', icon: '🥕', stages: ['🌱', '🌿', '🥕'],      seedPrice: 50,  sellPrice: 85,   growMs: 60 * 1000,      exp: 5,  unlockLv: 1,  yieldMin: 3, yieldMax: 6 },
    cabbage:    { name: '白菜', seedName: '白菜种子', icon: '🥬', stages: ['🌱', '🌿', '🥬'],      seedPrice: 120, sellPrice: 210,  growMs: 3 * 60 * 1000,  exp: 12, unlockLv: 3,  yieldMin: 3, yieldMax: 6 },
    tomato:     { name: '番茄', seedName: '番茄种子', icon: '🍅', stages: ['🌱', '🌿', '🌸', '🍅'], seedPrice: 300, sellPrice: 520,  growMs: 8 * 60 * 1000,  exp: 25, unlockLv: 6,  yieldMin: 4, yieldMax: 7 },
    watermelon: { name: '西瓜', seedName: '西瓜种子', icon: '🍉', stages: ['🌱', '🌿', '🌸', '🍉'], seedPrice: 800, sellPrice: 1400, growMs: 20 * 60 * 1000, exp: 50, unlockLv: 10, yieldMin: 4, yieldMax: 8 },
  };
  const CROP_ORDER = ['radish', 'cabbage', 'tomato', 'watermelon'];
  const EVENT_TYPES = {
    grass: { icon: '🌾', name: '长草了', action: '除草' },
    bug:   { icon: '🐛', name: '生虫了', action: '除虫' },
    dry:   { icon: '💧', name: '干旱了', action: '浇水' },
  };
  const FRIENDS = [
    { id: 'pz',      name: '痞子蔡',     avatar: '🧑',   lv: 8 },
    { id: 'yan',     name: '小燕子',     avatar: '👧',   lv: 5 },
    { id: 'wind',    name: '追风少年',   avatar: '🧒',   lv: 12 },
    { id: 'crystal', name: '水晶之恋',   avatar: '👩',   lv: 3 },
    { id: 'mars',    name: '火星文达人', avatar: '🧑‍🎤', lv: 15 },
    { id: 'blue',    name: '蓝色忧郁',   avatar: '🧑‍🦱', lv: 7 },
  ];
  const LV_TITLES = ['小菜农', '见习农夫', '农场新手', '快乐农夫', '农场达人', '农场主', '大农场主', '农场大亨', '农场巨擘', '传说农场主'];
  function lvTitle(lv) { return LV_TITLES[Math.min(LV_TITLES.length - 1, Math.max(0, lv - 1))]; }

  /* ---------------- 农场: 纯逻辑(界面调用, 也可被 Node 测试脚本复用) ---------------- */
  function growFrac(plot, now) {
    return Math.max(0, (now - plot.plantedAt) / CROPS[plot.crop].growMs);
  }
  // 生长阶段: 未成熟按进度均分到前 n-1 个外观, 成熟后显示最后一个(果实)
  function stageOf(plot, now) {
    const c = CROPS[plot.crop], n = c.stages.length;
    const frac = growFrac(plot, now);
    if (frac >= 1) return { idx: n - 1, emoji: c.stages[n - 1], mature: true, frac: 1 };
    const idx = Math.min(n - 2, Math.floor(frac * (n - 1)));
    return { idx, emoji: c.stages[idx], mature: false, frac: frac };
  }
  // 最终产量: 基础产量 - 未处理事件数 - 被偷数量, 至少 1 个
  function finalYield(crop, plot) {
    const unhandled = (plot.events || []).filter(e => !e.handled).length;
    return Math.max(1, (plot.baseYield || crop.yieldMin) - unhandled - (plot.stolen || 0));
  }
  function expForNext(lv) { return lv * 100; }
  function seedUnlocked(cropId, lv) { return lv >= CROPS[cropId].unlockLv; }
  function expandCost(curPlots) { return 300 * (curPlots - 11); }   // 第 13 块 300 金, 第 18 块 1800 金
  function expandLvReq(curPlots) { return 2 + (curPlots - 12); }    // 第 13 块需 2 级, 第 18 块需 7 级
  function stealRoll(rnd) {
    return { caught: rnd() < 0.3, loot: rnd() < 0.5 ? 1 : 2 };
  }
  const STEAL_LIMIT = 3;   // 每个好友每天最多偷 3 次
  function stealsToday(state, friendId) { return (state.steals && state.steals.byFriend[friendId]) || 0; }
  function freshFarmState() {
    return {
      v: 1, coins: 500, exp: 0, level: 1,
      plots: Array.from({ length: 12 }, () => ({ state: 'empty' })),
      seeds: { radish: 2 },                 // 开局送 2 个萝卜种子
      warehouse: {},
      steals: { date: dailyKey(Date.now()), byFriend: {} },
      friendFarms: null,
    };
  }
  function applyBuySeed(state, cropId, qty) {
    const c = CROPS[cropId];
    if (!seedUnlocked(cropId, state.level)) return { ok: false, reason: '需要 ' + c.unlockLv + ' 级才能购买' };
    const cost = c.seedPrice * qty;
    if (state.coins < cost) return { ok: false, reason: '金币不足, 需要 ' + cost + ' 金币' };
    state.coins -= cost;
    state.seeds[cropId] = (state.seeds[cropId] || 0) + qty;
    return { ok: true, cost: cost };
  }
  function applySell(state, cropId, qty) {
    const have = state.warehouse[cropId] || 0;
    const n = Math.min(qty, have);
    if (n <= 0) return { ok: false, reason: '仓库里没有该作物' };
    state.warehouse[cropId] = have - n;
    const gold = CROPS[cropId].sellPrice * n;
    state.coins += gold;
    return { ok: true, n: n, gold: gold };
  }
  function applyPlant(state, idx, cropId, now, rnd) {
    if ((state.seeds[cropId] || 0) <= 0) return { ok: false, reason: '背包里没有该种子' };
    const p = state.plots[idx];
    if (p && p.state !== 'empty') return { ok: false, reason: '这块地不是空地' };
    const c = CROPS[cropId];
    state.seeds[cropId]--;
    state.plots[idx] = {
      state: 'growing', crop: cropId, plantedAt: now, events: [], stolen: 0,
      baseYield: c.yieldMin + Math.floor((rnd || Math.random)() * (c.yieldMax - c.yieldMin + 1)),
    };
    return { ok: true };
  }
  function applyHarvest(state, idx, now) {
    const p = state.plots[idx];
    if (!p || p.state !== 'growing') return { ok: false, reason: '这块地没有作物' };
    if (growFrac(p, now) < 1) return { ok: false, reason: '作物还没成熟' };
    const c = CROPS[p.crop], n = finalYield(c, p);
    state.warehouse[p.crop] = (state.warehouse[p.crop] || 0) + n;
    state.plots[idx] = { state: 'empty' };
    return { ok: true, n: n, crop: p.crop, exp: c.exp };
  }
  function applyExpand(state) {
    const i = state.plots.length;
    if (i >= MAX_PLOTS) return { ok: false, reason: '土地已达上限' };
    const req = expandLvReq(i), cost = expandCost(i);
    if (state.level < req) return { ok: false, reason: '需要 ' + req + ' 级才能开垦' };
    if (state.coins < cost) return { ok: false, reason: '金币不足, 需要 ' + cost + ' 金币' };
    state.coins -= cost;
    state.plots.push({ state: 'empty' });
    return { ok: true, cost: cost };
  }
  // 偷菜: 30% 被狗发现(扣 50 金币或空手而归), 否则偷走 1~2 个
  function applySteal(state, friendPlots, plotIdx, rnd) {
    const fp = friendPlots[plotIdx];
    if (!fp || fp.qty <= 0) return { ok: false, reason: '这块地没有可偷的作物' };
    const roll = stealRoll(rnd || Math.random);
    if (roll.caught) {
      if (state.coins >= 50) { state.coins -= 50; return { ok: true, caught: true, loot: 0, msg: '被狗发现了! 被咬了一口, 损失 50 金币 🐕' }; }
      return { ok: true, caught: true, loot: 0, msg: '被狗发现了! 你落荒而逃, 空手而归 🐕' };
    }
    const n = Math.min(roll.loot, fp.qty);
    fp.qty -= n;
    state.warehouse[fp.crop] = (state.warehouse[fp.crop] || 0) + n;
    return { ok: true, caught: false, loot: n, crop: fp.crop };
  }
  function applyEventHandled(plot) {
    const e = (plot.events || []).find(x => !x.handled);
    if (!e) return null;
    e.handled = true;
    return e.type;
  }
  // 好友来偷你的菜: 随机一块成熟地 -1~2 产量
  function applyRobbery(state, now, rnd) {
    rnd = rnd || Math.random;
    const mature = [];
    state.plots.forEach((p, i) => { if (p.state === 'growing' && growFrac(p, now) >= 1) mature.push(i); });
    if (!mature.length) return null;
    const i = mature[Math.floor(rnd() * mature.length)];
    const p = state.plots[i];
    const n = 1 + Math.floor(rnd() * 2);
    p.stolen = (p.stolen || 0) + n;
    const f = FRIENDS[Math.floor(rnd() * FRIENDS.length)];
    return { friend: f.name, n: n, crop: p.crop, msg: f.name + ' 偷走了你的 ' + n + ' 个' + CROPS[p.crop].name + '!' };
  }

  /* ---------------- Node 测试导出(浏览器中 module 未定义, 自动跳过) ---------------- */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CROPS, CROP_ORDER, EVENT_TYPES, FRIENDS, MAX_PLOTS, FARM_KEY,
      growFrac, stageOf, finalYield, expForNext, seedUnlocked, expandCost, expandLvReq,
      stealRoll, freshFarmState, applyBuySeed, applySell, applyPlant, applyHarvest,
      applyExpand, applySteal, applyEventHandled, applyRobbery, dailyKey, fmtRemain,
      STEAL_LIMIT, stealsToday,
    };
    return;
  }
  if (typeof window === 'undefined' || !window.XP) return;

  /* ---------------- CSS 注入(类名统一前缀 app-qz-) ---------------- */
  const CSS = `
.app-qz-root{position:relative;display:flex;flex-direction:column;height:100%;background:#fffdf5;font-size:12px;color:#333}
.app-qz-banner{position:relative;flex:none;height:94px;overflow:hidden;background:linear-gradient(135deg,#ffe14d 0%,#ffb42e 45%,#ff7b39 100%);border-bottom:3px solid #ff8c00}
.app-qz-banner-title{position:absolute;left:24px;top:12px;font-size:28px;font-weight:bold;color:#fff;text-shadow:2px 2px 0 #e85d00,4px 4px 8px rgba(0,0,0,.35);letter-spacing:2px;z-index:2}
.app-qz-bt-sub{font-size:17px;color:#fffbe0}
.app-qz-banner-marq{position:absolute;left:0;right:0;bottom:6px;overflow:hidden;height:18px}
.app-qz-marq-in{display:inline-block;white-space:nowrap;color:#fff;font-weight:bold;text-shadow:1px 1px 1px rgba(180,80,0,.6);animation:app-qz-marq 14s linear infinite}
.app-qz-star{position:absolute;font-size:16px;animation:app-qz-twinkle 2s ease-in-out infinite;z-index:1}
@keyframes app-qz-marq{from{transform:translateX(860px)}to{transform:translateX(-780px)}}
@keyframes app-qz-twinkle{0%,100%{opacity:.2;transform:scale(.75)}50%{opacity:1;transform:scale(1.2)}}
.app-qz-nav{flex:none;display:flex;background:linear-gradient(180deg,#ffc24d,#ff9a1f);border-bottom:2px solid #e87f00;padding:2px 6px 0;gap:2px}
.app-qz-nav-btn{padding:4px 16px;cursor:pointer;font-weight:bold;color:#8a4400;border:1px solid transparent;border-bottom:none;border-radius:5px 5px 0 0}
.app-qz-nav-btn:hover{background:rgba(255,255,255,.35)}
.app-qz-nav-btn.active{background:#fffdf5;color:#e85d00;border-color:#e87f00}
.app-qz-main{flex:1;display:flex;overflow:hidden}
.app-qz-content{flex:1;overflow:auto;padding:10px;background:#fffdf5;background-image:radial-gradient(rgba(255,190,70,.28) 1px,transparent 1.4px);background-size:15px 15px}
.app-qz-content.farm-mode{padding:0;background:#9ad07a}
.app-qz-side{flex:none;width:172px;background:linear-gradient(180deg,#fff7e0,#ffedc2);border-left:2px solid #ffd27f;padding:10px 8px;text-align:center;overflow:auto}
.app-qz-avatar{width:72px;height:72px;margin:2px auto 6px;border-radius:6px;border:3px solid #ffb42e;background:linear-gradient(145deg,#fff,#ffe9b0);font-size:42px;display:flex;align-items:center;justify-content:center}
.app-qz-avatar.sm{width:46px;height:46px;font-size:28px;border-width:2px;margin:0}
.app-qz-nick{font-size:15px;font-weight:bold;color:#d2691e;margin-bottom:4px}
.app-qz-info-row{font-size:11px;color:#7a5b20;margin:3px 0}
.app-qz-hz{display:inline-block;margin-top:6px;padding:2px 10px;border-radius:10px;font-weight:bold;color:#7a5200;background:linear-gradient(180deg,#fff2a8,#ffd23c);border:1px solid #e0a800;box-shadow:0 1px 3px rgba(180,130,0,.4)}
.app-qz-side-foot{margin-top:12px;font-size:10px;color:#b09050}
.app-qz-musicbar{flex:none;display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;background:linear-gradient(180deg,#ffe9a8,#ffd36b);border-top:2px solid #ffb13c;color:#8a4b00;font-weight:bold}
.app-qz-note{font-size:15px;color:#e85d00;animation:app-qz-pulse 1.2s ease-in-out infinite}
.app-qz-music-txt{flex:1}
.app-qz-music-btn{font-family:inherit;font-size:11px;padding:2px 10px;cursor:pointer;border:1px solid #d98a00;border-radius:3px;background:linear-gradient(180deg,#fff,#ffe1a0);color:#8a4b00;font-weight:bold}
.app-qz-music-btn:hover{filter:brightness(1.06)}
@keyframes app-qz-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.25)}}
.app-qz-home-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.app-qz-widget{background:#fff;border:1px solid #ffce8a;border-radius:4px;overflow:hidden}
.app-qz-widget.full{grid-column:1/-1}
.app-qz-widget-h{display:flex;justify-content:space-between;align-items:center;padding:3px 8px;font-weight:bold;color:#8a4b00;background:linear-gradient(180deg,#ffd98a,#ffc24d);border-bottom:1px solid #ffb13c}
.app-qz-widget-b{padding:6px 8px}
.app-qz-link{color:#d2691e;cursor:pointer;font-size:11px;font-weight:normal}
.app-qz-link:hover{text-decoration:underline}
.app-qz-meta{font-size:11px;color:#999}
.app-qz-profile{display:flex;gap:8px;align-items:center}
.app-qz-sign{margin-top:3px;color:#c1440e;font-style:italic}
.app-qz-farm-card{display:flex;align-items:center;gap:10px;cursor:pointer;padding:4px;border-radius:4px}
.app-qz-farm-card:hover{background:#fff3d6}
.app-qz-farm-card-ico{font-size:34px}
.app-qz-farm-card-go{margin-left:auto;font-weight:bold;color:#3e8948}
.app-qz-ss-item{padding:5px 2px;border-bottom:1px dashed #f0dcb0}
.app-qz-ss-text{color:#333;line-height:1.5;word-break:break-all}
.app-qz-ss-input{width:100%;margin-top:6px;resize:vertical;font-family:inherit}
.app-qz-form-row{display:flex;justify-content:flex-end;margin-top:5px;gap:6px}
.app-qz-visitor{display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px dotted #f3e3c0}
.app-qz-v-av{font-size:20px;width:26px;text-align:center}
.app-qz-v-name{flex:1;color:#335}
.app-qz-blog-mini{padding:4px 2px;border-bottom:1px dashed #f0dcb0;cursor:pointer}
.app-qz-blog-mini:hover{background:#fff3d6}
.app-qz-blog-mini .app-qz-t{color:#d2691e;font-weight:bold}
.app-qz-blog-head{display:flex;justify-content:space-between;align-items:center;padding:2px 2px 8px;font-weight:bold;color:#8a4b00;font-size:13px}
.app-qz-blog-item{padding:7px 4px;border-bottom:1px solid #f3e3c0}
.app-qz-blog-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.app-qz-blog-title{color:#d2691e;font-weight:bold;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.app-qz-blog-title:hover{text-decoration:underline}
.app-qz-blog-row .app-qz-meta{flex:none}
.app-qz-blog-abs{color:#888;font-size:11px;margin-top:2px}
.app-qz-back{display:inline-block;color:#316ac5;cursor:pointer;margin-bottom:6px}
.app-qz-back:hover{text-decoration:underline}
.app-qz-art-title{color:#c1440e;margin:2px 0 4px;font-size:17px}
.app-qz-art-body{margin:8px 0;line-height:1.9;color:#333}
.app-qz-art-body p{margin:6px 0;text-indent:2em}
.app-qz-comments{margin-top:10px}
.app-qz-cm-h{font-weight:bold;color:#8a4b00;border-bottom:2px solid #ffd27f;padding-bottom:3px;margin-bottom:6px}
.app-qz-comment{display:flex;gap:6px;margin:6px 0}
.app-qz-cm-bub{flex:1;background:#fff8e8;border:1px solid #f0dcb0;border-radius:4px;padding:4px 8px}
.app-qz-cm-form{margin-top:8px}
.app-qz-ed-title{width:100%;margin:6px 0;font-weight:bold}
.app-qz-ed-body{width:100%;resize:vertical;font-family:inherit}
.app-qz-album-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.app-qz-photo{cursor:pointer}
.app-qz-photo-img{height:96px;border:4px solid #fff;box-shadow:1px 2px 5px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:42px;transition:transform .15s}
.app-qz-photo:hover .app-qz-photo-img{transform:scale(1.05) rotate(-1deg)}
.app-qz-photo-cap{font-size:11px;color:#777;margin-top:3px;text-align:center}
.app-qz-lightbox{position:absolute;inset:0;z-index:40;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;flex-direction:column}
.app-qz-lb-inner{text-align:center}
.app-qz-lb-img{width:320px;height:240px;border:6px solid #fff;display:flex;align-items:center;justify-content:center;font-size:110px;box-shadow:0 4px 20px rgba(0,0,0,.5)}
.app-qz-lb-cap{color:#fff;margin-top:10px;font-size:13px}
.app-qz-msg-list{margin-bottom:10px}
.app-qz-msg{display:flex;gap:8px;padding:7px 2px;border-bottom:1px dashed #f0dcb0}
.app-qz-msg-av{font-size:26px;width:34px;text-align:center}
.app-qz-msg-body{flex:1}
.app-qz-msg-name{color:#d2691e}
.app-qz-msg-text{margin:2px 0;line-height:1.5;word-break:break-all}
.app-qz-replies{margin-top:4px}
.app-qz-reply{background:#fff3d6;border-left:3px solid #ffcf6b;padding:3px 6px;margin:2px 0;font-size:11px}
.app-qz-reply-form{margin-top:4px;display:flex;gap:5px;align-items:center}
.app-qz-msg-form{background:#fff;border:1px solid #ffce8a;border-radius:4px;padding:8px}
/* ---------- QQ农场(2009 经典版复刻) ---------- */
.app-qz-farm{position:relative;display:flex;flex-direction:column;height:100%;background:#8ac85a}
/* 顶部木质信息条: 头像 + 昵称 + 经验条 + 等级徽章 + 金币 */
.app-qz-farm-bar{flex:none;display:flex;align-items:center;gap:8px;padding:5px 10px;background:linear-gradient(180deg,#b9824a,#8f5e2f);border-bottom:3px solid #6e4520;box-shadow:inset 0 1px 0 rgba(255,235,200,.5);color:#fff;font-weight:bold;font-size:12px}
.app-qz-farm-av{flex:none;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:22px;background:linear-gradient(180deg,#fff8e6,#f0dcb0);border:2px solid #6e4520;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.35)}
.app-qz-farm-name{color:#fff6da;text-shadow:1px 1px 0 rgba(80,45,10,.7);white-space:nowrap}
.app-qz-farm-lv{flex:none;min-width:24px;height:24px;padding:0 4px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#7a4a00;background:radial-gradient(circle at 38% 32%,#fff2a8,#ffd23c 70%,#f0b400);border:2px solid #a97900;border-radius:50%;box-shadow:0 1px 2px rgba(0,0,0,.4)}
.app-qz-farm-coin{background:rgba(60,35,10,.4);border:1px solid rgba(255,240,200,.35);border-radius:10px;padding:1px 9px;white-space:nowrap;color:#ffe9a8}
.app-qz-exp{position:relative;display:inline-block;width:96px;height:14px;background:rgba(60,35,10,.45);border:1px solid rgba(255,240,200,.3);border-radius:7px;overflow:hidden;vertical-align:middle}
.app-qz-exp>div{height:100%;background:linear-gradient(180deg,#9fe3ff,#4aa3e8);transition:width .3s}
.app-qz-exp-txt{position:absolute;left:0;right:0;top:0;line-height:14px;text-align:center;font-size:10px;font-weight:bold;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.6)}
.app-qz-farm-tip{flex:1;font-weight:normal;color:#fff6da;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;text-shadow:1px 1px 0 rgba(80,45,10,.5)}
.app-qz-farm-btn{font-family:inherit;font-size:11px;font-weight:bold;color:#5a3d00;background:linear-gradient(180deg,#fff6d8,#ffd97a);border:1px solid #7a5b12;border-radius:3px;padding:1px 8px;cursor:pointer;white-space:nowrap}
.app-qz-farm-btn:hover{filter:brightness(1.07)}
.app-qz-farm-btn:disabled{filter:grayscale(.8);opacity:.55;cursor:default}
.app-qz-ftitle{display:none;color:#5a3d00;background:linear-gradient(180deg,#e8c48a,#c99a58);border:2px solid #7a5520;border-radius:5px;padding:1px 10px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,.35)}
/* 场景: 蓝天白云 + 远山松林 + 草地(带碎花点) */
.app-qz-grid-wrap{flex:1;overflow:auto;position:relative;background:radial-gradient(rgba(255,255,255,.55) 1.6px,transparent 2.4px) 0 0/44px 44px,radial-gradient(rgba(255,255,255,.3) 1.4px,transparent 2.2px) 22px 22px/44px 44px,linear-gradient(180deg,#74bff0 0%,#a5dbfb 14%,#dcf2d6 23%,#a8d86c 27%,#8ac85a 62%,#6fb045 100%)}
.app-qz-scene-in{position:relative;min-height:100%;margin:0 auto}
.app-qz-cloud{position:absolute;background:#fff;border-radius:50%;opacity:.95;box-shadow:20px 5px 0 -4px #fff,40px 0 0 -7px #fff,12px -7px 0 -5px #fff;animation:app-qz-drift 12s ease-in-out infinite alternate;z-index:0}
@keyframes app-qz-drift{from{transform:translateX(-14px)}to{transform:translateX(26px)}}
.app-qz-hills{position:absolute;left:0;right:0;top:13%;height:72px;z-index:0;background:radial-gradient(ellipse 130px 64px at 10% 100%,#69a848 62%,transparent 64%),radial-gradient(ellipse 170px 76px at 34% 100%,#5e9d40 62%,transparent 64%),radial-gradient(ellipse 150px 66px at 58% 100%,#6bac4b 62%,transparent 64%),radial-gradient(ellipse 190px 80px at 85% 100%,#588f3c 62%,transparent 64%)}
.app-qz-pine{position:absolute;top:10.5%;font-size:22px;z-index:0;filter:drop-shadow(0 1px 0 rgba(0,0,0,.15))}
.app-qz-path{position:absolute;right:8px;bottom:64px;width:250px;height:84px;z-index:0;background:radial-gradient(ellipse,#eed9a4 30%,#ddc184 72%,transparent 76%);border-radius:50%;transform:rotate(-7deg)}
.app-qz-fence{position:absolute;left:0;right:0;top:88px;height:24px;z-index:1;background-image:repeating-linear-gradient(90deg,transparent 0 26px,#9c6b34 26px 32px,transparent 32px 58px),linear-gradient(#c89355,#a9783c),linear-gradient(#c89355,#a9783c);background-size:auto 24px,100% 6px,100% 6px;background-position:0 0,0 4px,0 15px;background-repeat:repeat-x,no-repeat,no-repeat;transform:rotate(-1.2deg);filter:drop-shadow(0 2px 1px rgba(60,40,15,.35))}
.app-qz-grid{position:relative;z-index:1}
.app-qz-plot{position:absolute;width:130px;height:99px;cursor:pointer;background:url('assets/img/farm/plot.png') center/100% 100% no-repeat;overflow:visible;transition:transform .2s}
.app-qz-plot:hover{filter:brightness(1.08)}
.app-qz-plot.locked{background:url('assets/img/farm/plot_grass.png') center/100% 100% no-repeat;filter:none}
.app-qz-plot.locked::after{content:'';position:absolute;inset:16px 6px;border:2px dashed rgba(70,120,50,.9);border-radius:50%;z-index:1;pointer-events:none}
.app-qz-plot.locked:hover{filter:brightness(1.05)}
.app-qz-crop{position:absolute;left:50%;bottom:44px;transform:translateX(-50%);z-index:3;pointer-events:none;transition:height .3s;filter:drop-shadow(0 2px 1px rgba(0,0,0,.25))}
span.app-qz-crop{line-height:1}
.app-qz-halo{position:absolute;left:50%;bottom:36px;width:104px;height:46px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,rgba(255,238,120,.9),rgba(255,214,60,0) 72%);z-index:2;pointer-events:none;animation:app-qz-halo 1.4s ease-in-out infinite}
@keyframes app-qz-halo{0%,100%{opacity:.4;transform:translateX(-50%) scale(.88)}50%{opacity:1;transform:translateX(-50%) scale(1.1)}}
.app-qz-evt{position:absolute;top:-10px;right:18px;font-size:20px;z-index:5;pointer-events:none;animation:app-qz-bob .8s ease-in-out infinite;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))}
.app-qz-hand{position:absolute;top:-12px;right:12px;font-size:22px;z-index:5;pointer-events:none;animation:app-qz-bob .7s ease-in-out infinite;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))}
@keyframes app-qz-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.app-qz-plot-tag{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:10px;color:#fff;background:rgba(60,40,10,.65);border-radius:7px;padding:0 6px;white-space:nowrap;z-index:4;pointer-events:none}
.app-qz-lock-ico{position:absolute;top:30px;left:0;right:0;text-align:center;font-size:18px;z-index:4}
.app-qz-lock-info{position:absolute;top:50px;left:0;right:0;text-align:center;font-size:10px;line-height:1.3;color:#3d5a2a;font-weight:bold;z-index:4;text-shadow:0 1px 0 rgba(255,255,255,.6)}
.app-qz-deco{position:absolute;z-index:6;pointer-events:none;text-align:center}
.app-qz-deco.click{pointer-events:auto;cursor:pointer}
.app-qz-deco.click:hover{filter:brightness(1.06)}
.app-qz-deco-tag{display:inline-block;font-size:10px;color:#fff;background:rgba(60,40,10,.55);border-radius:7px;padding:0 7px;margin-top:-4px}
.app-qz-dog-peek{position:absolute;width:26px;height:24px;overflow:hidden;z-index:6;font-size:21px;pointer-events:none}
.app-qz-dog-peek>span{display:block;animation:app-qz-peek 9s ease-in-out infinite}
@keyframes app-qz-peek{0%,70%,100%{transform:translateY(24px)}80%,92%{transform:translateY(1px)}}
.app-qz-flower{position:absolute;bottom:14px;font-size:15px;z-index:1;pointer-events:none}
/* 底部工具栏: 彩色圆角图标按钮 */
.app-qz-farm-tools{flex:none;display:flex;align-items:center;gap:8px;padding:5px 10px;background:linear-gradient(180deg,#fff6dd,#f3ddb0);border-top:3px solid #c79a5b;box-shadow:inset 0 1px 0 #fff}
.app-qz-dogname{font-size:11px;color:#7a4f1e;font-weight:bold;white-space:nowrap}
.app-qz-bark{background:#fff;color:#d33;border:1px solid #e8b0b0;border-radius:8px;padding:0 8px;font-weight:bold;font-size:11px;visibility:hidden}
.app-qz-tool{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:54px;padding:3px 6px 2px;font-family:inherit;font-size:11px;font-weight:bold;color:#fff;border:2px solid rgba(0,0,0,.25);border-radius:10px;cursor:pointer;text-shadow:0 1px 1px rgba(0,0,0,.35)}
.app-qz-tool:hover{filter:brightness(1.08)}
.app-qz-tool-ico{font-size:20px;line-height:1.1}
.app-qz-tool.shop{background:linear-gradient(180deg,#ffb44d,#f08c1e)}
.app-qz-tool.bag{background:linear-gradient(180deg,#5fb6f0,#2f86d8)}
.app-qz-tool.wh{background:linear-gradient(180deg,#c98a52,#a05f28)}
.app-qz-tool.fr{background:linear-gradient(180deg,#7fce5a,#4ea832)}
.app-qz-tool.msg{background:linear-gradient(180deg,#f58ac0,#e0509a)}
.app-qz-dlg{position:absolute;inset:0;z-index:30;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}
.app-qz-dlg-box{background:#fffdf2;border:2px solid #7a5b12;border-radius:6px;width:400px;max-width:92%;max-height:88%;display:flex;flex-direction:column}
.app-qz-dlg-h{display:flex;justify-content:space-between;align-items:center;padding:4px 10px;color:#fff;font-weight:bold;background:linear-gradient(180deg,#8fc96a,#5fa043);border-radius:4px 4px 0 0}
.app-qz-dlg-x{cursor:pointer;padding:0 4px}
.app-qz-dlg-b{padding:6px 8px;overflow:auto}
.app-qz-shop-row{display:flex;align-items:center;gap:8px;padding:5px 2px;border-bottom:1px dashed #d8c48c}
.app-qz-ico{font-size:26px;width:32px;text-align:center}
.app-qz-grow{flex:1}
`;
  if (!document.getElementById('app-qz-style')) {
    const st = document.createElement('style');
    st.id = 'app-qz-style';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const el = XP.el;

  /* ---------------- 空间数据(说说/日志/留言/评论, localStorage) ---------------- */
  const QK = { ss: 'winxp_qz_shuoshuo', msgs: 'winxp_qz_msgs', blogs: 'winxp_qz_userblogs', cmts: 'winxp_qz_comments' };

  const DEFAULT_SHUOSHUO = [
    { text: '今天的阳光真好, 适合想念一个人... (∩_∩)', time: '2005-08-28 14:32' },
    { text: '超女总决赛倒计时! 春春一定要拿冠军!! o(>_<)o', time: '2005-08-25 20:15' },
    { text: '新换的空间皮肤好看吗? 踩踩不跑堂~ 跑堂是小狗!', time: '2005-08-20 09:48' },
  ];
  const DEFAULT_VISITORS = [
    { avatar: '🧑',   name: '痞子蔡',     time: '5分钟前' },
    { avatar: '👧',   name: '小燕子',     time: '12分钟前' },
    { avatar: '🧑‍🦱', name: '蓝色忧郁',   time: '半小时前' },
    { avatar: '🧒',   name: '追风少年',   time: '1小时前' },
    { avatar: '👩',   name: '水晶之恋',   time: '2小时前' },
    { avatar: '🧑‍🎤', name: '火星文达人', time: '昨天 21:40' },
  ];
  const DEFAULT_BLOGS = [
    {
      id: 'b1', title: '今天超女总决赛, 我哭了', date: '2005-08-26', read: 3821,
      body: [
        '今晚守在电视机前看完了超级女声总决赛, 当春春举起奖杯的那一刻, 我的眼泪止不住地流下来。',
        '从海选一路看到总决赛, 每周五晚上都是我最幸福的时光。玉米们, 我们做到了! 3528308票, 这是短信一票一票投出来的奇迹!',
        '明天要去买春春的海报贴在床头。这个夏天的尾巴, 因为超女而变得闪闪发光。♪',
      ],
    },
    {
      id: 'b2', title: '我的QQ宠物结婚啦!', date: '2005-08-15', read: 1204,
      body: [
        '养了三个月的QMM今天终于结婚了! 对象是隔壁班小明的QGG, 爱情值刷到了5200。',
        '婚礼在宠物社区礼堂举行, 我给它换上了攒了一个月元宝买的婚纱, 还放了99个烟花。',
        '下个月就能孵蛋生宝宝了, 希望遗传到它爸爸的高武力值, 哈哈!',
      ],
    },
    {
      id: 'b3', title: '转载| 十二星座本周运势', date: '2005-08-10', read: 856,
      body: [
        '白羊座: 本周桃花运旺盛, 注意身边默默关注你的人。幸运色: 红色。',
        '金牛座: 财运不错, 可能会有意外之财。学习上需要多加努力。',
        '双子座: 人际关系是本周的主题, 老朋友会带来好消息……(其余星座略, 原文太长)',
        '——转载自搜狐星座频道, 纯属娱乐, 不喜勿喷。',
      ],
    },
    {
      id: 'b4', title: '网吧通宵纪实', date: '2005-07-30', read: 2341,
      body: [
        '晚上10点, 和小强、大头在学校后门的网吧会合, 包夜15块, 还送一瓶冰红茶。',
        '前半夜打CS, 我是CT方的狙神, de_dust2守中门一挑三, 隔壁机子的小哥都来围观。',
        '后半夜困得不行, 挂着QQ升级, 刷了一会儿空间, 听着耳机里的《江南》, 迷迷糊糊就到了天亮。',
        '早上6点走出网吧, 阳光刺眼, 买了两个肉包子当早饭。这就是青春吧。',
      ],
    },
    {
      id: 'b5', title: '高考结束了, 我的青春呢', date: '2005-06-10', read: 1567,
      body: [
        '最后一科交卷铃响起的时候, 整个考场安静了几秒, 然后有人开始欢呼, 有人默默流泪。',
        '三年的书本卖了23块钱, 用这笔钱请宿舍的兄弟们吃了一顿麻辣烫。',
        '不管结果如何, 至少我们努力过。未来的日子, 愿我们都能被这个世界温柔以待。',
      ],
    },
    {
      id: 'b6', title: '[荐] 50首好听的非主流歌曲', date: '2005-06-02', read: 4205,
      body: [
        '1. 光良 - 童话  2. 林俊杰 - 江南  3. 陈奕迅 - 十年  4. 香香 - 老鼠爱大米  5. 庞龙 - 两只蝴蝶  6. S.H.E - Super Star  7. 潘玮柏/弦子 - 不得不爱……',
        '这些歌我都存在MP3里了, 128M的内存根本不够用! 想要完整歌单的留言, 我用QQ传给你们。',
      ],
    },
    {
      id: 'b7', title: '今天去照了大头贴!', date: '2005-05-20', read: 723,
      body: [
        '放学和闺蜜去照大头贴, 30块钱一版, 选了心形和星星的边框, 还加了blingbling的特效。',
        '照片贴在钱包里、课桌上、日记本里, 还留了一张准备送给……(此处省略一个名字, 嘿嘿)',
      ],
    },
  ];
  const DEFAULT_COMMENTS = {
    b1: [
      { name: '玉米加农炮', avatar: '🌽', text: '我也是玉米!! 春春最棒!', time: '2005-08-26 23:15' },
      { name: '凉粉', avatar: '🐬', text: '靓颖也很棒好吗, 海豚音无敌', time: '2005-08-27 08:42' },
      { name: '痞子蔡', avatar: '🧑', text: '哭什么哭, 大男人看超女(偷笑)', time: '2005-08-27 10:20' },
    ],
    b2: [
      { name: '小燕子', avatar: '👧', text: '恭喜恭喜! 记得请我喝喜酒~', time: '2005-08-15 21:08' },
      { name: '追风少年', avatar: '🧒', text: '我的宠物还单着呢, 求介绍!', time: '2005-08-16 09:33' },
    ],
    b3: [
      { name: '水晶之恋', avatar: '👩', text: '我是金牛座, 真的准! 昨天捡了5毛钱', time: '2005-08-10 16:20' },
      { name: '火星文达人', avatar: '🧑‍🎤', text: '莪昰迡蝎蓙の, 怎庅莈冇?', time: '2005-08-11 11:11' },
    ],
    b4: [
      { name: '黑客帝国', avatar: '🕶️', text: '下次带我一个, 我AWP贼溜', time: '2005-07-30 15:45' },
      { name: '同桌的你', avatar: '🧒', text: '小心被班主任抓到, 哈哈', time: '2005-07-31 08:12' },
    ],
    b5: [
      { name: '蓝色忧郁', avatar: '🧑‍🦱', text: '看哭了……我们都要好好的', time: '2005-06-10 22:30' },
      { name: '小丸子', avatar: '👧', text: '前程似锦! 常联系!', time: '2005-06-11 10:05' },
    ],
    b6: [
      { name: '音乐盒', avatar: '🎵', text: '求歌单! 我QQ号是 12345678', time: '2005-06-02 19:20' },
      { name: '痞子蔡', avatar: '🧑', text: '没有《丁香花》? 差评', time: '2005-06-03 14:02' },
    ],
    b7: [
      { name: '小燕子', avatar: '👧', text: '哇! 我也要去照! 明天放学一起?', time: '2005-05-20 18:40' },
    ],
  };
  const ALBUM = [
    { emoji: '🌅', cap: '海边', desc: '暑假和爸妈去北戴河, 海水真咸', bg: 'linear-gradient(180deg,#ffd9a0,#7ec8e3)' },
    { emoji: '🍜', cap: '美食', desc: '学校门口的麻辣烫, 3块钱一碗', bg: 'linear-gradient(180deg,#ffb3a0,#e8503a)' },
    { emoji: '🐱', cap: '猫咪', desc: '楼下的小野猫, 我叫它咪咪', bg: 'linear-gradient(180deg,#f5e6c8,#c9a96e)' },
    { emoji: '🎂', cap: '生日', desc: '16岁生日, 谢谢大家的礼物', bg: 'linear-gradient(180deg,#ffc8dd,#ff8fab)' },
    { emoji: '🏫', cap: '校园', desc: '我们的教室, 初三(2)班', bg: 'linear-gradient(180deg,#b8e0d2,#5e9e8a)' },
    { emoji: '🌸', cap: '樱花', desc: '公园的花开了, 春天来了', bg: 'linear-gradient(180deg,#ffe0ec,#f7a8c4)' },
    { emoji: '🎆', cap: '烟花', desc: '元宵节的烟花大会', bg: 'linear-gradient(180deg,#2b2d5c,#8a5cf6)' },
    { emoji: '🐶', cap: '小狗', desc: '旺旺又胖了, 该减肥了', bg: 'linear-gradient(180deg,#f6e3b4,#d9a441)' },
    { emoji: '🌃', cap: '夜景', desc: '从网吧楼顶看城市的灯火', bg: 'linear-gradient(180deg,#1d2b64,#f8cd4a)' },
  ];
  const DEFAULT_MSGS = [
    { name: '小丸子',     avatar: '👧',   time: '2005-08-28 15:20', text: '来踩踩~ 记得回踩哦! 跑堂的是小狗~', replies: [] },
    { name: '黑客帝国',   avatar: '🕶️', time: '2005-08-28 12:05', text: '你的空间好漂亮, 代码发我一下呗, 我用好玩的flash跟你换!', replies: [] },
    { name: '同桌的你',   avatar: '🧒',   time: '2005-08-27 21:30', text: '高考加油! 考完一起去滑旱冰!', replies: [{ text: '好呀好呀, 一言为定!', time: '2005-08-27 22:01' }] },
    { name: '痞子蔡',     avatar: '🧑',   time: '2005-08-27 18:44', text: '第一次来你空间, 不错不错, 背景音乐是童话? 有品位!', replies: [] },
    { name: '水晶之恋',   avatar: '👩',   time: '2005-08-26 22:10', text: '姐姐你的日志好感人, 看哭了……抱抱 (づ｡◕‿‿◕｡)づ', replies: [] },
    { name: '追风少年',   avatar: '🧒',   time: '2005-08-26 16:33', text: '帮你浇花了! 花藤快快长大~', replies: [] },
    { name: '蓝色忧郁',   avatar: '🧑‍🦱', time: '2005-08-25 19:27', text: '好久不见, 你还好吗? 有空来我空间坐坐。', replies: [] },
    { name: '火星文达人', avatar: '🧑‍🎤', time: '2005-08-25 14:02', text: '伱の倥間眞のぬ薸湸! ①啶崾伽油喔!', replies: [{ text: '哈哈, 你的火星文我看懂了!', time: '2005-08-25 15:30' }] },
    { name: '小燕子',     avatar: '👧',   time: '2005-08-24 20:15', text: '踩踩! 帮你把访客数刷到100啦, 哈哈!', replies: [] },
    { name: '音乐盒',     avatar: '🎵',   time: '2005-08-24 09:30', text: '求空间背景音乐的歌名, 好好听!', replies: [] },
  ];

  let shuoshuo = lsGet(QK.ss, DEFAULT_SHUOSHUO);
  let msgs = lsGet(QK.msgs, DEFAULT_MSGS);
  let userBlogs = lsGet(QK.blogs, []);
  let userComments = lsGet(QK.cmts, {});
  const saveShuoshuo = () => lsSet(QK.ss, shuoshuo);
  const saveMsgs = () => lsSet(QK.msgs, msgs);
  const saveUserBlogs = () => lsSet(QK.blogs, userBlogs);
  const saveComments = () => lsSet(QK.cmts, userComments);

  function allBlogs() { return userBlogs.concat(DEFAULT_BLOGS); }
  function commentsOf(id) { return (DEFAULT_COMMENTS[id] || []).concat(userComments[id] || []); }

  /* ---------------- 农场存档读写 ---------------- */
  function loadFarm() {
    const s = lsGet(FARM_KEY, null);
    if (!s || !Array.isArray(s.plots)) return freshFarmState();
    const f = freshFarmState();
    return Object.assign(f, s);
  }
  function saveFarm(state) { lsSet(FARM_KEY, state); }
  function resetDailySteals(state) {
    const dk = dailyKey(Date.now());
    if (!state.steals || state.steals.date !== dk) state.steals = { date: dk, byFriend: {} };
  }
  // 好友农场: 每天随机生成一次(6 块地, 大部分是成熟作物)
  function genFriendFarms(state) {
    const dk = dailyKey(Date.now());
    if (state.friendFarms && state.friendFarms.date === dk && state.friendFarms.farms) return state.friendFarms.farms;
    const farms = {};
    FRIENDS.forEach(f => {
      const avail = CROP_ORDER.filter(c => CROPS[c].unlockLv <= f.lv);
      const plots = [];
      for (let i = 0; i < 6; i++) {
        if (Math.random() < 0.8) plots.push({ crop: pick(avail), qty: randInt(3, 8) });
        else plots.push(null);
      }
      farms[f.id] = plots;
    });
    state.friendFarms = { date: dk, farms: farms };
    return farms;
  }

  /* ---------------- 注册应用 ---------------- */
  let qzWin = null;       // 单实例
  let curRoot = null;     // 灯箱/弹窗挂载点
  let pendingArticle = null;

  XP.registerApp({
    id: 'qzone',
    name: 'QQ空间',
    icon: '🌟',
    open: openQZone,
  });
  // 桌面直达农场入口
  XP.registerApp({
    id: 'farm',
    name: 'QQ农场',
    icon: '<img src="assets/img/icons/farm.png" style="width:1em;height:1em;vertical-align:-0.12em" alt="">',
    open() {
      if (qzWin && !qzWin.closed) { qzWin.focus(); switchCh('farm'); return; }
      openQZone('farm');
    },
  });

  /* ---------------- 主窗口 ---------------- */
  function openQZone(startCh) {
    if (qzWin && !qzWin.closed) { qzWin.focus(); if (startCh) switchCh(startCh); return; }
    const win = qzWin = XP.createWindow({ title: '轻舞飞扬 的QQ空间', icon: '🌟', width: 860, height: 600 });
    win.body.style.cssText = 'padding:0;overflow:hidden;display:flex;flex-direction:column;';
    const root = curRoot = el('div', { class: 'app-qz-root' });
    win.body.appendChild(root);

    /* 横幅 */
    const stars = [
      ['✨', '8%', '20%', '0s'], ['⭐', '22%', '58%', '.4s'], ['🌟', '60%', '16%', '.8s'],
      ['💫', '79%', '52%', '.2s'], ['✨', '92%', '26%', '1.1s'], ['🌠', '44%', '8%', '.6s'],
    ];
    root.appendChild(el('div', { class: 'app-qz-banner' }, [
      el('div', { class: 'app-qz-banner-title', html: '轻舞飞扬 <span class="app-qz-bt-sub">的QQ空间</span>' }),
      el('div', { class: 'app-qz-banner-marq' }, [
        el('span', { class: 'app-qz-marq-in', text: '★ 欢迎来到我的空间, 记得留言哦~ 踩踩更健康, 跑堂是小狗! ★ 今日天气: 晴, 适合想你 ♪' }),
      ]),
    ].concat(stars.map(s => el('span', { class: 'app-qz-star', text: s[0], style: { left: s[1], top: s[2], animationDelay: s[3] } })))));

    /* 导航栏 */
    const NAVS = [['home', '主页'], ['blog', '日志'], ['album', '相册'], ['msg', '留言板'], ['farm', '农场🌾']];
    const navBtns = {};
    root.appendChild(el('div', { class: 'app-qz-nav' }, NAVS.map(it => {
      const b = el('div', { class: 'app-qz-nav-btn', text: it[1], onclick: () => switchCh(it[0]) });
      navBtns[it[0]] = b;
      return b;
    })));

    /* 主体: 内容区 + 右侧信息卡 */
    const content = el('div', { class: 'app-qz-content' });
    root.appendChild(el('div', { class: 'app-qz-main' }, [content, buildSide()]));

    /* 背景音乐条 */
    const audio = new Audio('assets/audio/01.mp3');
    audio.loop = true;
    let playing = false;
    const musicTxt = el('span', { class: 'app-qz-music-txt', text: '♪ 正在播放: 童话 - 光良' });
    const musicBtn = el('button', { class: 'app-qz-music-btn', text: '▶ 播放' });
    function setMusic(p) {
      playing = p;
      musicBtn.textContent = p ? '⏸ 暂停' : '▶ 播放';
      musicTxt.textContent = (p ? '♪ 正在播放: ' : '⏸ 已暂停: ') + '童话 - 光良';
    }
    musicBtn.addEventListener('click', () => {
      if (playing) { audio.pause(); setMusic(false); }
      else audio.play().then(() => setMusic(true)).catch(() => { setMusic(false); XP.notify('QQ空间', '浏览器阻止了自动播放, 请再点一次播放'); });
    });
    root.appendChild(el('div', { class: 'app-qz-musicbar' }, [el('span', { class: 'app-qz-note', text: '♪' }), musicTxt, musicBtn]));
    audio.play().then(() => setMusic(true)).catch(() => setMusic(false));

    /* 频道切换 */
    let curCh = null, farmCtl = null;
    function switchCh(ch) {
      if (curCh === ch) return;
      if (farmCtl) { farmCtl.stop(); farmCtl = null; }
      curCh = ch;
      Object.keys(navBtns).forEach(k => navBtns[k].classList.toggle('active', k === ch));
      content.classList.toggle('farm-mode', ch === 'farm');
      content.innerHTML = '';
      if (ch === 'home') renderHome(content, switchCh);
      else if (ch === 'blog') renderBlogList(content);
      else if (ch === 'album') renderAlbum(content);
      else if (ch === 'msg') renderMsgBoard(content);
      else if (ch === 'farm') farmCtl = createFarm(content);
      content.scrollTop = 0;
    }
    switchCh(startCh || 'home');

    /* 上线时偶尔被好友偷菜 */
    const openStealTimer = setTimeout(() => {
      const st = loadFarm();
      if (Math.random() < 0.35) {
        const r = applyRobbery(st, Date.now());
        if (r) { saveFarm(st); XP.notify('QQ农场', r.msg); XP.sound('notify'); }
      }
    }, 4000);

    win.on('close', () => {
      clearTimeout(openStealTimer);
      if (farmCtl) farmCtl.stop();
      try { audio.pause(); audio.src = ''; } catch (e) {}
      qzWin = null;
      curRoot = null;
    });
  }

  /* ---------------- 右侧信息卡 ---------------- */
  function buildSide() {
    return el('div', { class: 'app-qz-side' }, [
      el('div', { class: 'app-qz-avatar', text: '🐧' }),
      el('div', { class: 'app-qz-nick', text: '轻舞飞扬' }),
      el('div', { class: 'app-qz-info-row', html: 'QQ等级: <b>42级</b>' }),
      el('div', { class: 'app-qz-info-row', text: '☀️☀️🌙🌙⭐⭐' }),
      el('div', { class: 'app-qz-info-row', html: '🌻 花藤: <b>5级</b>' }),
      el('div', { class: 'app-qz-info-row', text: '阳光指数: 2680' }),
      el('div', { class: 'app-qz-hz', text: '💎 黄钻贵族 LV7' }),
      el('div', { class: 'app-qz-info-row', style: { marginTop: '8px' }, html: '今日访客: <b>68</b>' }),
      el('div', { class: 'app-qz-info-row', text: '总访问量: 128,493' }),
      el('div', { class: 'app-qz-side-foot', text: 'Qzone 2005 经典版' }),
    ]);
  }

  function widget(title, more, builder, onMore, full) {
    const head = el('div', { class: 'app-qz-widget-h' }, [el('span', { text: title })]);
    if (more) head.appendChild(el('span', { class: 'app-qz-link', text: more, onclick: onMore || (() => {}) }));
    const body = el('div', { class: 'app-qz-widget-b' });
    builder(body);
    return el('div', { class: 'app-qz-widget' + (full ? ' full' : '') }, [head, body]);
  }

  /* ---------------- 主页 ---------------- */
  function renderHome(box, go) {
    const grid = el('div', { class: 'app-qz-home-grid' });

    grid.appendChild(widget('个人档', null, b => {
      b.appendChild(el('div', { class: 'app-qz-profile' }, [
        el('div', { class: 'app-qz-avatar sm', text: '🐧' }),
        el('div', {}, [
          el('div', { html: '<b>轻舞飞扬</b> (女, 16岁)' }),
          el('div', { class: 'app-qz-meta', text: '来自: 火星 · 在线时长: 520小时' }),
          el('div', { class: 'app-qz-sign', text: '签名: 我可以躲进你的身体♪' }),
        ]),
      ]));
    }));

    grid.appendChild(widget('最近访客', null, b => {
      DEFAULT_VISITORS.forEach(v => {
        b.appendChild(el('div', { class: 'app-qz-visitor' }, [
          el('span', { class: 'app-qz-v-av', text: v.avatar }),
          el('span', { class: 'app-qz-v-name', text: v.name }),
          el('span', { class: 'app-qz-meta', text: v.time }),
        ]));
      });
    }));

    grid.appendChild(widget('心情说说', null, b => {
      const list = el('div');
      function drawList() {
        list.innerHTML = '';
        shuoshuo.forEach(s => {
          list.appendChild(el('div', { class: 'app-qz-ss-item' }, [
            el('div', { class: 'app-qz-ss-text', text: s.text }),
            el('div', { class: 'app-qz-meta', text: s.time + ' · 轻舞飞扬' }),
          ]));
        });
      }
      drawList();
      const ta = el('textarea', { class: 'xp-textarea app-qz-ss-input', rows: '2', placeholder: '说点什么吧… (支持火星文喔)' });
      const btn = el('button', { class: 'xp-btn', text: '发表说说' });
      btn.addEventListener('click', () => {
        const v = ta.value.trim();
        if (!v) { XP.sound('error'); return; }
        shuoshuo.unshift({ text: v, time: fmtNow() });
        saveShuoshuo();
        drawList();
        ta.value = '';
        XP.sound('ding');
      });
      b.appendChild(list);
      b.appendChild(ta);
      b.appendChild(el('div', { class: 'app-qz-form-row' }, [btn]));
    }, null, true));

    grid.appendChild(widget('🌾 我的农场', '进入农场 >>', b => {
      const fs = loadFarm(), now = Date.now();
      const mature = fs.plots.filter(p => p.state === 'growing' && growFrac(p, now) >= 1).length;
      b.appendChild(el('div', { class: 'app-qz-farm-card', onclick: () => go('farm') }, [
        el('span', { class: 'app-qz-farm-card-ico', text: mature ? '🥕' : '🌱' }),
        el('div', {}, [
          el('div', { text: '农场 Lv.' + fs.level + ' ' + lvTitle(fs.level) + ' · ' + fs.plots.length + ' 块地' }),
          el('div', { class: 'app-qz-meta', text: mature ? ('🎉 有 ' + mature + ' 块地的作物成熟啦, 快去收获!') : '作物正在茁壮成长中…' }),
        ]),
        el('span', { class: 'app-qz-farm-card-go', text: '进入 →' }),
      ]));
    }, () => go('farm')));

    grid.appendChild(widget('最新日志', '查看全部 >>', b => {
      allBlogs().slice(0, 3).forEach(bl => {
        b.appendChild(el('div', { class: 'app-qz-blog-mini', onclick: () => { pendingArticle = bl.id; go('blog'); } }, [
          el('div', { class: 'app-qz-t', text: bl.title }),
          el('div', { class: 'app-qz-meta', text: bl.date + ' · ' + bl.body[0].slice(0, 26) + '……' }),
        ]));
      });
    }, () => go('blog')));

    box.appendChild(grid);
  }

  /* ---------------- 日志 ---------------- */
  function renderBlogList(box) {
    if (pendingArticle) {
      const id = pendingArticle;
      pendingArticle = null;
      renderArticle(box, id);
      return;
    }
    box.appendChild(el('div', { class: 'app-qz-blog-head' }, [
      el('span', { text: '📝 日志列表' }),
      el('button', { class: 'xp-btn', text: '✏️ 写日志', onclick: () => renderBlogEditor(box) }),
    ]));
    const list = el('div');
    allBlogs().forEach(bl => {
      list.appendChild(el('div', { class: 'app-qz-blog-item' }, [
        el('div', { class: 'app-qz-blog-row' }, [
          el('span', { class: 'app-qz-blog-title', text: bl.title, onclick: () => renderArticle(box, bl.id) }),
          el('span', { class: 'app-qz-meta', text: '阅读(' + bl.read + ') 评论(' + commentsOf(bl.id).length + ') ' + bl.date }),
        ]),
        el('div', { class: 'app-qz-blog-abs', text: bl.body[0].slice(0, 42) + '……' }),
      ]));
    });
    box.appendChild(list);
  }

  function renderArticle(box, id) {
    box.innerHTML = '';
    const bl = allBlogs().find(b => b.id === id);
    if (!bl) { renderBlogList(box); return; }
    if (id.charAt(0) === 'u') { bl.read++; saveUserBlogs(); }   // 用户日志阅读数 +1
    box.appendChild(el('div', { class: 'app-qz-back', text: '« 返回日志列表', onclick: () => { box.innerHTML = ''; renderBlogList(box); } }));
    box.appendChild(el('h2', { class: 'app-qz-art-title', text: bl.title }));
    box.appendChild(el('div', { class: 'app-qz-meta', text: '轻舞飞扬 发表于 ' + bl.date + ' · 阅读(' + bl.read + ') · 评论(' + commentsOf(id).length + ')' }));
    const body = el('div', { class: 'app-qz-art-body' });
    bl.body.forEach(p => body.appendChild(el('p', { text: p })));
    box.appendChild(body);

    const cbox = el('div', { class: 'app-qz-comments' });
    function drawC() {
      cbox.innerHTML = '';
      cbox.appendChild(el('div', { class: 'app-qz-cm-h', text: '💬 评论 (' + commentsOf(id).length + ')' }));
      commentsOf(id).forEach(c => {
        cbox.appendChild(el('div', { class: 'app-qz-comment' }, [
          el('span', { class: 'app-qz-v-av', text: c.avatar || '🙂' }),
          el('div', { class: 'app-qz-cm-bub' }, [
            el('div', {}, [el('b', { text: c.name }), el('span', { class: 'app-qz-meta', text: '  ' + c.time })]),
            el('div', { text: c.text }),
          ]),
        ]));
      });
    }
    drawC();
    box.appendChild(cbox);

    const ta = el('textarea', { class: 'xp-textarea app-qz-ss-input', rows: '2', placeholder: '友善回复, 理性灌水…' });
    const btn = el('button', { class: 'xp-btn', text: '发表评论' });
    btn.addEventListener('click', () => {
      const v = ta.value.trim();
      if (!v) { XP.sound('error'); return; }
      (userComments[id] = userComments[id] || []).push({ name: '轻舞飞扬', avatar: '🐧', text: v, time: fmtNow() });
      saveComments();
      drawC();
      ta.value = '';
      XP.sound('ding');
    });
    box.appendChild(el('div', { class: 'app-qz-cm-form' }, [ta, el('div', { class: 'app-qz-form-row' }, [btn])]));
  }

  function renderBlogEditor(box) {
    box.innerHTML = '';
    box.appendChild(el('div', { class: 'app-qz-back', text: '« 返回日志列表', onclick: () => { box.innerHTML = ''; renderBlogList(box); } }));
    box.appendChild(el('h3', { text: '✏️ 写日志' }));
    const title = el('input', { class: 'xp-input app-qz-ed-title', placeholder: '标题', maxlength: '40' });
    const ta = el('textarea', { class: 'xp-textarea app-qz-ed-body', rows: '10', placeholder: '正文… (按回车分段)' });
    const btn = el('button', { class: 'xp-btn', text: '发布日志' });
    btn.addEventListener('click', () => {
      const t = title.value.trim(), v = ta.value.trim();
      if (!t || !v) { XP.sound('error'); XP.notify('QQ空间', '标题和正文不能为空'); return; }
      userBlogs.unshift({ id: 'u' + Date.now(), title: t, date: fmtNow().slice(0, 10), read: 0, body: v.split(/\n+/).filter(x => x.trim()) });
      saveUserBlogs();
      XP.sound('ding');
      XP.notify('QQ空间', '日志发表成功!');
      box.innerHTML = '';
      renderBlogList(box);
    });
    box.appendChild(title);
    box.appendChild(ta);
    box.appendChild(el('div', { class: 'app-qz-form-row' }, [btn]));
    title.focus();
  }

  /* ---------------- 相册 ---------------- */
  function renderAlbum(box) {
    box.appendChild(el('div', { class: 'app-qz-blog-head' }, [el('span', { text: '📷 我的相册 (点击照片可放大)' })]));
    const grid = el('div', { class: 'app-qz-album-grid' });
    ALBUM.forEach(p => {
      grid.appendChild(el('div', { class: 'app-qz-photo', onclick: () => openLightbox(p) }, [
        el('div', { class: 'app-qz-photo-img', style: { background: p.bg } }, [el('span', { text: p.emoji })]),
        el('div', { class: 'app-qz-photo-cap', text: p.emoji + ' ' + p.cap + ' —— ' + p.desc }),
      ]));
    });
    box.appendChild(grid);
  }

  function openLightbox(p) {
    if (!curRoot) return;
    const ov = el('div', { class: 'app-qz-lightbox', onclick: () => ov.remove() }, [
      el('div', { class: 'app-qz-lb-inner' }, [
        el('div', { class: 'app-qz-lb-img', style: { background: p.bg } }, [el('span', { text: p.emoji })]),
        el('div', { class: 'app-qz-lb-cap', text: p.emoji + ' ' + p.cap + ' —— ' + p.desc }),
        el('div', { class: 'app-qz-meta', style: { color: '#ddd', marginTop: '4px' }, text: '点击任意处关闭' }),
      ]),
    ]);
    curRoot.appendChild(ov);
  }

  /* ---------------- 留言板 ---------------- */
  function renderMsgBoard(box) {
    box.appendChild(el('div', { class: 'app-qz-blog-head' }, [el('span', { text: '📮 留言板 (共 ' + msgs.length + ' 条留言)' })]));
    const list = el('div', { class: 'app-qz-msg-list' });
    function draw() {
      list.innerHTML = '';
      msgs.forEach(m => {
        const replies = el('div', { class: 'app-qz-replies' });
        (m.replies || []).forEach(r => {
          replies.appendChild(el('div', { class: 'app-qz-reply' }, [
            el('b', { text: '轻舞飞扬(楼主): ' }),
            el('span', { text: r.text }),
            el('span', { class: 'app-qz-meta', text: '  ' + r.time }),
          ]));
        });
        const ta = el('textarea', { class: 'xp-textarea', rows: '1', style: { width: '70%' }, placeholder: '回复 ' + m.name + '…' });
        const ok = el('button', { class: 'xp-btn', text: '回复' });
        const replyForm = el('div', { class: 'app-qz-reply-form', style: { display: 'none' } }, [ta, ok]);
        ok.addEventListener('click', () => {
          const v = ta.value.trim();
          if (!v) return;
          (m.replies = m.replies || []).push({ text: v, time: fmtNow() });
          saveMsgs();
          draw();
          XP.sound('ding');
        });
        list.appendChild(el('div', { class: 'app-qz-msg' }, [
          el('span', { class: 'app-qz-msg-av', text: m.avatar }),
          el('div', { class: 'app-qz-msg-body' }, [
            el('div', {}, [el('b', { class: 'app-qz-msg-name', text: m.name }), el('span', { class: 'app-qz-meta', text: '  ' + m.time })]),
            el('div', { class: 'app-qz-msg-text', text: m.text }),
            el('div', {}, [el('span', {
              class: 'app-qz-link', text: '回复',
              onclick: () => { replyForm.style.display = replyForm.style.display === 'none' ? '' : 'none'; if (replyForm.style.display !== 'none') ta.focus(); },
            })]),
            replies,
            replyForm,
          ]),
        ]));
      });
    }
    draw();
    box.appendChild(list);

    const name = el('input', { class: 'xp-input', value: '游客', style: { width: '90px' } });
    const ta = el('textarea', { class: 'xp-textarea app-qz-ss-input', rows: '2', placeholder: '留个言吧, 不留言的是跑堂狗~' });
    const btn = el('button', { class: 'xp-btn', text: '提交留言' });
    btn.addEventListener('click', () => {
      const v = ta.value.trim();
      if (!v) { XP.sound('error'); return; }
      msgs.push({ name: name.value.trim() || '游客', avatar: pick(['🙂', '😺', '🐰', '🐼', '🦊']), time: fmtNow(), text: v, replies: [] });
      saveMsgs();
      draw();
      ta.value = '';
      XP.sound('ding');
    });
    box.appendChild(el('div', { class: 'app-qz-msg-form' }, [
      el('div', { class: 'app-qz-form-row', style: { justifyContent: 'flex-start' } }, [el('span', { text: '昵称:' }), name]),
      ta,
      el('div', { class: 'app-qz-form-row' }, [btn]),
    ]));
  }

  /* ---------------- QQ农场 ---------------- */
  function createFarm(container) {
    const state = loadFarm();
    resetDailySteals(state);
    genFriendFarms(state);
    saveFarm(state);
    let view = 'mine', friendId = null;

    const farm = el('div', { class: 'app-qz-farm' });
    container.appendChild(farm);

    /* 顶部木质信息条: 头像 + 昵称/木牌 + 经验条 + 等级徽章 + 金币 */
    const backBtn = el('button', { class: 'app-qz-farm-btn', text: '⬅ 返回我的农场', style: { display: 'none' }, onclick: leaveFriend });
    const avEl = el('div', { class: 'app-qz-farm-av', text: '🧑‍🌾' });
    const nameEl = el('span', { class: 'app-qz-farm-name', text: '我的农场' });
    const ftitleEl = el('span', { class: 'app-qz-ftitle' });
    const expFill = el('div');
    const expTxt = el('span', { class: 'app-qz-exp-txt' });
    const lvEl = el('span', { class: 'app-qz-farm-lv' });
    const coinEl = el('span', { class: 'app-qz-farm-coin' });
    const tipEl = el('span', { class: 'app-qz-farm-tip' });
    farm.appendChild(el('div', { class: 'app-qz-farm-bar' }, [
      backBtn, avEl, nameEl, ftitleEl,
      el('span', { class: 'app-qz-exp' }, [expFill, expTxt]), lvEl, coinEl, tipEl,
    ]));

    /* 农田场景: 蓝天白云 + 远山松林 + 草地 + 木栅栏 + 独立椭圆土堆 */
    const grid = el('div', { class: 'app-qz-grid' });
    const sceneIn = el('div', { class: 'app-qz-scene-in' });
    farm.appendChild(el('div', { class: 'app-qz-grid-wrap' }, [sceneIn]));
    /* 远山 + 松树 + 白云 */
    sceneIn.appendChild(el('div', { class: 'app-qz-hills' }));
    ['8%', '24%', '42%', '63%', '82%'].forEach(l =>
      sceneIn.appendChild(el('span', { class: 'app-qz-pine', text: '🌲', style: { left: l } })));
    [['6%', '5%', 70, 24, '11s'], ['36%', '9%', 96, 28, '14s'], ['70%', '3%', 82, 24, '12s']].forEach(c =>
      sceneIn.appendChild(el('div', { class: 'app-qz-cloud', style: { left: c[0], top: c[1], width: c[2] + 'px', height: c[3] + 'px', animationDuration: c[4] } })));
    /* 小屋下的土路 + 地块上方木栅栏 */
    sceneIn.appendChild(el('div', { class: 'app-qz-path' }));
    sceneIn.appendChild(el('div', { class: 'app-qz-fence' }));
    sceneIn.appendChild(grid);
    /* 左下狗屋(旺财偶尔探头) / 右下小木屋(点击打开仓库) / 小花 */
    sceneIn.appendChild(el('div', { class: 'app-qz-deco', style: { left: '12px', bottom: '10px' } }, [
      el('img', { src: 'assets/img/farm/doghouse.png', draggable: 'false', alt: '狗屋', style: { height: '92px' } }),
      el('div', { class: 'app-qz-dog-peek', style: { left: '56px', bottom: '36px' } }, [el('span', { text: '🐕' })]),
    ]));
    sceneIn.appendChild(el('div', { class: 'app-qz-deco click', style: { right: '16px', bottom: '10px' }, onclick: openWarehouse, title: '打开仓库' }, [
      el('img', { src: 'assets/img/farm/hut.png', draggable: 'false', alt: '仓库', style: { height: '102px' } }),
      el('div', { class: 'app-qz-deco-tag', text: '🏠 仓库' }),
    ]));
    [['🌼', '30%'], ['🌷', '44%'], ['🌻', '60%']].forEach(f =>
      sceneIn.appendChild(el('span', { class: 'app-qz-flower', text: f[0], style: { left: f[1] } })));

    /* 底部工具栏: 狗狗状态 + 彩色图标按钮 */
    const dogName = el('span', { class: 'app-qz-dogname' });
    const bark = el('span', { class: 'app-qz-bark', text: '汪!' });
    function toolBtn(cls, ico, label, onclick) {
      return el('button', { class: 'app-qz-tool ' + cls, onclick: onclick }, [
        el('span', { class: 'app-qz-tool-ico', text: ico }), el('span', { text: label }),
      ]);
    }
    const btnShop = toolBtn('shop', '🛒', '商店', openShop);
    const btnBag = toolBtn('bag', '🎒', '背包', openBag);
    const btnWh = toolBtn('wh', '🏠', '仓库', openWarehouse);
    const btnFr = toolBtn('fr', '👥', '好友', openFriends);
    const btnMsg = toolBtn('msg', '✉️', '消息', openMsg);
    farm.appendChild(el('div', { class: 'app-qz-farm-tools' }, [
      dogName, bark, el('span', { style: { flex: 1 } }), btnShop, btnBag, btnWh, btnFr, btnMsg,
    ]));

    let plotCells = [], plotSigs = [], barkLeft = 0;

    function tip(msg) { tipEl.textContent = msg; }
    function friendObj() { return FRIENDS.find(f => f.id === friendId); }

    function refreshBar() {
      coinEl.textContent = '💰 ' + state.coins;
      lvEl.textContent = state.level;
      lvEl.title = 'Lv.' + state.level + ' ' + lvTitle(state.level);
      const need = expForNext(state.level);
      expFill.style.width = Math.min(100, state.exp / need * 100) + '%';
      expTxt.textContent = state.exp + '/' + need;
      const mine = view === 'mine';
      backBtn.style.display = mine ? 'none' : '';
      nameEl.style.display = mine ? '' : 'none';
      ftitleEl.style.display = mine ? 'none' : '';
      if (!mine) ftitleEl.textContent = '🏡 ' + friendObj().name + ' 的农场';
      [btnShop, btnBag, btnWh, btnFr, btnMsg].forEach(b => b.style.display = mine ? '' : 'none');
      dogName.textContent = mine ? '🐕 旺财 (看家护院中…)' : '🐕 ' + friendObj().name + ' 的狗 (很凶, 小心!)';
    }

    function plotSig(p) {
      if (!p || p.state === 'empty') return 'e';
      const st = stageOf(p, Date.now());
      return p.crop + '|' + st.idx + '|' + (st.mature ? 1 : 0) + '|' +
        (p.events || []).map(e => e.type + (e.handled ? 1 : 0)).join(',') + '|' + (p.stolen || 0);
    }

    /* 2.5D 布局: 每行 3 块, 后排(上面)行向右偏移且略小, 前排(下面)行向左铺开且略大 */
    const PW = 130, PH = 99, DX = 126, DY = 62, OX = 42, PADX = 30, PADY = 110;
    const CROP_H = [40, 58, 76, 96];   // 4 个生长阶段贴图高度(作物明显大于土堆)
    function cols() { return 3; }
    function rows() { return Math.ceil((view === 'mine' ? MAX_PLOTS : 6) / cols()); }

    function placeCell(cell, i) {
      const cs = cols(), rs = rows(), row = Math.floor(i / cs), col = i % cs;
      cell.style.left = (PADX + col * DX + (rs - 1 - row) * OX) + 'px';
      cell.style.top = (PADY + row * DY) + 'px';
      cell.style.transform = 'scale(' + (0.9 + 0.035 * row).toFixed(3) + ')';
      cell.style.zIndex = row + 2;
    }

    // 作物贴图: 4 阶段切换, 加载失败自动回退 emoji
    function cropImg(cropId, vidx, st) {
      const img = el('img', { class: 'app-qz-crop', draggable: 'false', alt: '' });
      img.style.height = CROP_H[vidx] + 'px';
      img.onerror = () => {
        const e = el('span', { class: 'app-qz-crop', text: (st && st.emoji) || CROPS[cropId].icon, style: { fontSize: Math.round(CROP_H[vidx] * 0.8) + 'px' } });
        if (img.parentNode) img.parentNode.replaceChild(e, img);
      };
      img.src = 'assets/img/farm/crop_' + cropId + '_' + vidx + '.png';
      return img;
    }

    function renderGrid() {
      grid.innerHTML = '';
      plotCells = [];
      plotSigs = [];
      const cs = cols(), rs = rows();
      sceneIn.style.width = (PADX * 2 + (cs - 1) * DX + PW + (rs - 1) * OX + 24) + 'px';
      grid.style.height = (PADY + (rs - 1) * DY + PH + 34) + 'px';
      if (view === 'mine') {
        state.plots.forEach((p, i) => {
          const cell = el('div', { class: 'app-qz-plot' });
          placeCell(cell, i);
          fillPlotCell(cell, p, i);
          plotSigs[i] = plotSig(p);
          plotCells[i] = cell;
          grid.appendChild(cell);
        });
        for (let i = state.plots.length; i < MAX_PLOTS; i++) {
          const cell = makeLockedCell(i);
          placeCell(cell, i);
          grid.appendChild(cell);
        }
      } else {
        const fps = state.friendFarms.farms[friendId];
        for (let i = 0; i < 6; i++) {
          const cell = makeFriendCell(fps[i], i);
          placeCell(cell, i);
          grid.appendChild(cell);
        }
      }
    }

    function fillPlotCell(cell, p, i) {
      cell.innerHTML = '';
      cell.className = 'app-qz-plot';
      cell.onclick = null;
      if (!p || p.state === 'empty') {
        cell.classList.add('empty');
        cell.appendChild(el('div', { class: 'app-qz-plot-tag', text: '空地 · 点击种植' }));
        cell.onclick = () => onEmptyClick(i);
        return;
      }
      const c = CROPS[p.crop], st = stageOf(p, Date.now());
      const vidx = st.mature ? 3 : Math.min(2, Math.floor(st.frac * 3));
      if (st.mature) cell.appendChild(el('div', { class: 'app-qz-halo' }));
      cell.appendChild(cropImg(p.crop, vidx, st));
      const unhandled = (p.events || []).filter(e => !e.handled);
      if (unhandled.length) cell.appendChild(el('span', { class: 'app-qz-evt', text: EVENT_TYPES[unhandled[0].type].icon, title: EVENT_TYPES[unhandled[0].type].name }));
      if (st.mature) {
        cell.classList.add('mature');
        cell.appendChild(el('div', { class: 'app-qz-plot-tag', text: '可收获!' + (p.stolen ? '(被偷' + p.stolen + ')' : '') }));
        cell.onclick = () => doHarvest(i);
      } else if (unhandled.length) {
        cell.appendChild(el('div', { class: 'app-qz-plot-tag', text: EVENT_TYPES[unhandled[0].type].action + '!' }));
        cell.onclick = () => doHandleEvent(i);
      } else {
        cell.appendChild(el('div', { class: 'app-qz-plot-tag', text: c.name + ' ' + Math.floor(st.frac * 100) + '%' }));
        cell.onclick = () => tip(c.name + ' 生长中, 还需约 ' + fmtRemain(c.growMs - (Date.now() - p.plantedAt)) + ' 成熟');
      }
    }

    function makeLockedCell(i) {
      const cell = el('div', { class: 'app-qz-plot locked' }, [
        el('div', { class: 'app-qz-lock-ico', text: '⛏️' }),
        el('div', { class: 'app-qz-lock-info', html: '开垦<br>Lv.' + expandLvReq(i) + ' · ' + expandCost(i) + '金' }),
      ]);
      cell.onclick = () => doExpand(i);
      return cell;
    }

    function makeFriendCell(fp, i) {
      const cell = el('div', { class: 'app-qz-plot' });
      if (!fp || fp.qty <= 0) {
        cell.classList.add('empty');
        cell.appendChild(el('div', { class: 'app-qz-plot-tag', text: fp ? '被偷光了' : '未成熟' }));
        return cell;
      }
      cell.classList.add('mature');
      cell.appendChild(el('div', { class: 'app-qz-halo' }));
      cell.appendChild(cropImg(fp.crop, 3, null));
      cell.appendChild(el('span', { class: 'app-qz-hand', text: '✋', title: '可偷' }));
      cell.appendChild(el('div', { class: 'app-qz-plot-tag', text: '可偷 ' + CROPS[fp.crop].name + ' ×' + fp.qty }));
      cell.onclick = () => doSteal(i);
      return cell;
    }

    function refreshPlots() {
      if (view !== 'mine') return;
      state.plots.forEach((p, i) => {
        const sig = plotSig(p);
        if (sig !== plotSigs[i]) {
          plotSigs[i] = sig;
          if (plotCells[i]) fillPlotCell(plotCells[i], p, i);
        }
      });
    }

    /* 操作 */
    function addExp(n) {
      state.exp += n;
      let up = false;
      while (state.exp >= expForNext(state.level)) { state.exp -= expForNext(state.level); state.level++; up = true; }
      if (up) {
        const unlocked = CROP_ORDER.find(id => CROPS[id].unlockLv === state.level);
        XP.notify('QQ农场', '恭喜升到 ' + state.level + ' 级!' + (unlocked ? ' 解锁新种子: ' + CROPS[unlocked].name + '!' : ''));
        XP.sound('tada');
      }
    }

    function onEmptyClick(i) {
      const owned = CROP_ORDER.filter(c => (state.seeds[c] || 0) > 0);
      if (!owned.length) { tip('背包里没有种子, 先去商店购买吧!'); openShop(); return; }
      showDialog('选择要种植的种子', body => {
        owned.forEach(cid => {
          const c = CROPS[cid];
          body.appendChild(el('div', { class: 'app-qz-shop-row' }, [
            el('span', { class: 'app-qz-ico', text: c.icon }),
            el('div', { class: 'app-qz-grow' }, [
              el('div', { text: c.seedName + ' ×' + state.seeds[cid] }),
              el('div', { class: 'app-qz-meta', text: '成熟需 ' + fmtRemain(c.growMs) + ' · 收获经验 +' + c.exp }),
            ]),
            el('button', { class: 'app-qz-farm-btn', text: '种下', onclick: () => { doPlant(i, cid); closeDialog(); } }),
          ]));
        });
      });
    }

    function doPlant(i, cid) {
      const r = applyPlant(state, i, cid, Date.now());
      if (!r.ok) { tip(r.reason); XP.sound('error'); return; }
      addExp(2);
      saveFarm(state);
      refreshPlots();
      refreshBar();
      tip('种下了 ' + CROPS[cid].name + ', 记得常来看看~ (经验 +2)');
      XP.sound('click');
    }

    function doHarvest(i) {
      const r = applyHarvest(state, i, Date.now());
      if (!r.ok) { tip(r.reason); return; }
      addExp(r.exp);
      saveFarm(state);
      refreshPlots();
      refreshBar();
      tip('收获 ' + r.n + ' 个' + CROPS[r.crop].name + ', 已放入仓库! (经验 +' + r.exp + ')');
      XP.sound('ding');
    }

    function doHandleEvent(i) {
      const p = state.plots[i];
      const t = p && applyEventHandled(p);
      if (!t) return;
      addExp(2);
      saveFarm(state);
      refreshPlots();
      refreshBar();
      tip(EVENT_TYPES[t].action + '完成! 作物长得更好了 (经验 +2)');
      XP.sound('click');
    }

    function doExpand(i) {
      if (i !== state.plots.length) { tip('请先开垦前面的土地'); return; }
      const r = applyExpand(state);
      if (!r.ok) { tip(r.reason); XP.sound('error'); return; }
      saveFarm(state);
      refreshBar();
      renderGrid();
      tip('开垦成功! 现在有 ' + state.plots.length + ' 块地了');
      XP.sound('ding');
    }

    function doSteal(i) {
      resetDailySteals(state);
      const f = friendObj();
      const cnt = stealsToday(state, f.id);
      if (cnt >= STEAL_LIMIT) { tip('今天已经偷过 ' + f.name + ' ' + STEAL_LIMIT + ' 次了, 明天再来吧!'); XP.sound('error'); return; }
      const fps = state.friendFarms.farms[f.id];
      const r = applySteal(state, fps, i);
      if (!r.ok) { tip(r.reason); return; }
      state.steals.byFriend[f.id] = cnt + 1;
      if (r.caught) { XP.sound('error'); tip('偷菜失败: ' + r.msg); XP.notify('QQ农场', '偷菜失败: ' + r.msg); }
      else {
        addExp(3);
        const msg = '偷到 ' + r.loot + ' 个' + CROPS[r.crop].name + '! 已放入仓库 (今日已偷 ' + (cnt + 1) + '/' + STEAL_LIMIT + ' 次)';
        tip(msg);
        XP.notify('QQ农场', msg);
        XP.sound('ding');
      }
      saveFarm(state);
      refreshBar();
      renderGrid();
    }

    /* 弹窗 */
    let dlgEl = null, dlgBuild = null;
    function showDialog(title, builder) {
      closeDialog();
      dlgBuild = () => {
        const box = el('div', { class: 'app-qz-dlg-box' }, [
          el('div', { class: 'app-qz-dlg-h' }, [el('span', { text: title }), el('span', { class: 'app-qz-dlg-x', text: '✕', onclick: closeDialog })]),
        ]);
        const body = el('div', { class: 'app-qz-dlg-b' });
        builder(body);
        box.appendChild(body);
        return box;
      };
      dlgEl = el('div', { class: 'app-qz-dlg', onclick: e => { if (e.target === dlgEl) closeDialog(); } }, [dlgBuild()]);
      farm.appendChild(dlgEl);
    }
    function refreshDialog() { if (dlgEl && dlgBuild) { dlgEl.innerHTML = ''; dlgEl.appendChild(dlgBuild()); } }
    function closeDialog() { if (dlgEl) { dlgEl.remove(); dlgEl = null; dlgBuild = null; } }

    function openShop() {
      showDialog('🛒 种子商店', body => {
        CROP_ORDER.forEach(cid => {
          const c = CROPS[cid], ok = seedUnlocked(cid, state.level);
          body.appendChild(el('div', { class: 'app-qz-shop-row' }, [
            el('span', { class: 'app-qz-ico', text: c.icon }),
            el('div', { class: 'app-qz-grow' }, [
              el('div', { text: c.seedName + (ok ? '' : ' 🔒') }),
              el('div', { class: 'app-qz-meta', text: ok ? ('成熟 ' + fmtRemain(c.growMs) + ' · 售价 ' + c.sellPrice + '/个') : ('需要 ' + c.unlockLv + ' 级解锁') }),
            ]),
            el('span', { style: { minWidth: '52px', textAlign: 'right' }, text: c.seedPrice + '金' }),
            el('button', { class: 'app-qz-farm-btn', text: '买1', disabled: ok ? null : '', onclick: () => buySeed(cid, 1) }),
            el('button', { class: 'app-qz-farm-btn', text: '买5', disabled: ok ? null : '', onclick: () => buySeed(cid, 5) }),
          ]));
        });
        body.appendChild(el('div', { class: 'app-qz-meta', style: { marginTop: '6px' }, text: '💰 当前金币: ' + state.coins }));
      });
    }
    function buySeed(cid, qty) {
      const r = applyBuySeed(state, cid, qty);
      if (!r.ok) { tip(r.reason); XP.sound('error'); return; }
      saveFarm(state);
      refreshBar();
      refreshDialog();
      tip('购买了 ' + qty + ' 个' + CROPS[cid].seedName + ', 花费 ' + r.cost + ' 金币');
      XP.sound('click');
    }

    function openBag() {
      showDialog('🎒 我的背包', body => {
        const owned = CROP_ORDER.filter(c => (state.seeds[c] || 0) > 0);
        if (!owned.length) body.appendChild(el('div', { text: '背包空空如也, 去商店买些种子吧!' }));
        owned.forEach(cid => {
          body.appendChild(el('div', { class: 'app-qz-shop-row' }, [
            el('span', { class: 'app-qz-ico', text: CROPS[cid].icon }),
            el('div', { class: 'app-qz-grow', text: CROPS[cid].seedName }),
            el('span', { text: '×' + state.seeds[cid] }),
          ]));
        });
      });
    }

    function openWarehouse() {
      showDialog('🏠 我的仓库', body => {
        const owned = CROP_ORDER.filter(c => (state.warehouse[c] || 0) > 0);
        if (!owned.length) body.appendChild(el('div', { text: '仓库里还没有作物, 快去种植收获吧!' }));
        owned.forEach(cid => {
          const c = CROPS[cid], n = state.warehouse[cid];
          body.appendChild(el('div', { class: 'app-qz-shop-row' }, [
            el('span', { class: 'app-qz-ico', text: c.icon }),
            el('div', { class: 'app-qz-grow' }, [
              el('div', { text: c.name + ' ×' + n }),
              el('div', { class: 'app-qz-meta', text: '单价 ' + c.sellPrice + ' 金 · 共 ' + (c.sellPrice * n) + ' 金' }),
            ]),
            el('button', { class: 'app-qz-farm-btn', text: '卖1个', onclick: () => sellCrop(cid, 1) }),
            el('button', { class: 'app-qz-farm-btn', text: '全卖', onclick: () => sellCrop(cid, n) }),
          ]));
        });
        body.appendChild(el('div', { class: 'app-qz-meta', style: { marginTop: '6px' }, text: '💰 当前金币: ' + state.coins }));
      });
    }
    function sellCrop(cid, qty) {
      const r = applySell(state, cid, qty);
      if (!r.ok) { tip(r.reason); return; }
      saveFarm(state);
      refreshBar();
      refreshDialog();
      tip('卖出 ' + r.n + ' 个' + CROPS[cid].name + ', 获得 ' + r.gold + ' 金币');
      XP.sound('ding');
    }

    function openFriends() {
      showDialog('👥 好友农场', body => {
        body.appendChild(el('div', { class: 'app-qz-meta', style: { marginBottom: '6px' }, text: '去好友家逛逛, 成熟的作物可以"顺手牵羊"~ 每人每天限偷 ' + STEAL_LIMIT + ' 次' }));
        FRIENDS.forEach(f => {
          const cnt = stealsToday(state, f.id);
          const fps = state.friendFarms.farms[f.id] || [];
          const mature = fps.filter(p => p && p.qty > 0).length;
          body.appendChild(el('div', { class: 'app-qz-shop-row' }, [
            el('span', { class: 'app-qz-ico', text: f.avatar }),
            el('div', { class: 'app-qz-grow' }, [
              el('div', { text: f.name }),
              el('div', { class: 'app-qz-meta', text: '农场 Lv.' + f.lv + ' · 🥕 ' + mature + '/' + fps.length + ' 块地可偷 · 今日已偷 ' + cnt + '/' + STEAL_LIMIT + ' 次' }),
            ]),
            el('button', { class: 'app-qz-farm-btn', text: '去逛逛', onclick: () => { enterFriend(f.id); closeDialog(); } }),
          ]));
        });
        body.appendChild(el('div', { class: 'app-qz-meta', style: { marginTop: '6px' }, text: '⚠️ 小心看门狗! 偷菜有 30% 概率被发现, 会被咬或空手而归' }));
      });
    }

    function openMsg() {
      resetDailySteals(state);
      saveFarm(state);
      showDialog('✉️ 农场消息', body => {
        body.appendChild(el('div', { class: 'app-qz-meta', style: { marginBottom: '6px' }, text: '今日偷菜战况 (每人每天限偷 ' + STEAL_LIMIT + ' 次)' }));
        FRIENDS.forEach(f => {
          body.appendChild(el('div', { class: 'app-qz-shop-row' }, [
            el('span', { class: 'app-qz-ico', text: f.avatar }),
            el('div', { class: 'app-qz-grow', text: f.name }),
            el('span', { text: '已偷 ' + stealsToday(state, f.id) + '/' + STEAL_LIMIT + ' 次' }),
          ]));
        });
        body.appendChild(el('div', { class: 'app-qz-meta', style: { marginTop: '6px' }, text: '🐕 旺财会一直守护你的农场, 放心去好友家逛逛吧~' }));
      });
    }

    function enterFriend(fid) {
      view = 'friend';
      friendId = fid;
      refreshBar();
      renderGrid();
      const f = friendObj();
      tip('正在逛 ' + f.name + ' 的农场, 点击带 ✋ 的成熟作物可以偷取 (今日已偷 ' + stealsToday(state, f.id) + '/' + STEAL_LIMIT + ' 次)');
    }
    function leaveFriend() {
      view = 'mine';
      friendId = null;
      refreshBar();
      renderGrid();
      tip('回到了我的农场');
    }

    /* 定时刷新: 生长阶段 / 随机事件 / 被偷 / 狗叫 */
    function maybeAddEvent() {
      const now = Date.now();
      let changed = false;
      state.plots.forEach(p => {
        if (!p || p.state !== 'growing') return;
        const frac = growFrac(p, now);
        if (frac < 0.15 || frac >= 1) return;
        if ((p.events || []).some(e => !e.handled)) return;
        if ((p.events || []).length >= 2) return;
        if (Math.random() < 0.03) {
          (p.events = p.events || []).push({ type: pick(['grass', 'bug', 'dry']), handled: false });
          changed = true;
        }
      });
      if (changed) saveFarm(state);
    }
    function dogTick() {
      if (barkLeft > 0) { barkLeft--; if (barkLeft === 0) bark.style.visibility = 'hidden'; return; }
      if (Math.random() < (view === 'friend' ? 0.25 : 0.12)) {
        bark.textContent = view === 'friend' ? '汪汪汪!!' : pick(['汪!', '汪汪!', '汪~ 呜~']);
        bark.style.visibility = 'visible';
        barkLeft = 2;
      }
    }
    function tick() {
      if (view === 'mine') {
        maybeAddEvent();
        refreshPlots();
        if (Math.random() < 0.004) {
          const r = applyRobbery(state, Date.now());
          if (r) {
            saveFarm(state);
            refreshPlots();
            XP.notify('QQ农场', r.msg);
            XP.sound('notify');
            tip(r.msg);
          }
        }
      }
      dogTick();
    }

    /* 启动 */
    refreshBar();
    renderGrid();
    tip('欢迎来到我的农场! 点击空地种植, 作物成熟后点击收获');
    const timer = setInterval(tick, 3000);

    return {
      stop() {
        clearInterval(timer);
        closeDialog();
        saveFarm(state);
      },
    };
  }
})();
