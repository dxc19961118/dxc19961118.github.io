/* 系统应用: 我的电脑 / 我的文档 / 回收站 / 控制面板 */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
.app-sys-layout { display: flex; height: 100%; }
.app-sys-side { width: 168px; flex: none; background: linear-gradient(180deg, #7a9be0, #6c8fd8); padding: 10px 8px; overflow: auto; }
.app-sys-side .box { background: rgba(255,255,255,.9); border-radius: 4px; margin-bottom: 10px; overflow: hidden; }
.app-sys-side .box-h { background: linear-gradient(180deg, #f0f4fc, #c8d8f4); color: #0c327c; font-weight: bold; padding: 4px 8px; font-size: 11px; }
.app-sys-side .box-i { padding: 4px 10px; font-size: 11px; color: #0c327c; cursor: pointer; display: flex; gap: 5px; align-items: center; }
.app-sys-side .box-i:hover { text-decoration: underline; }
.app-sys-main { flex: 1; background: #fff; padding: 8px; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 4px; overflow: auto; }
.app-sys-item { width: 88px; padding: 6px 2px; text-align: center; cursor: pointer; border: 1px solid transparent; border-radius: 3px; }
.app-sys-item:hover { background: #e8f0fc; border-color: #b8d0f0; }
.app-sys-item .ico { font-size: 34px; line-height: 40px; }
.app-sys-item .lbl { font-size: 11px; line-height: 1.3; word-break: break-all; max-height: 30px; overflow: hidden; }
.app-sys-addr { display: flex; align-items: center; gap: 6px; padding: 3px 6px; background: #f7f5ee; border-bottom: 1px solid #d0ccbc; font-size: 11px; }
.app-sys-addr input { flex: 1; }
.app-sys-empty { padding: 30px; color: #888; width: 100%; text-align: center; }
.app-cp-grid { display: flex; flex-wrap: wrap; gap: 4px; padding: 12px; background: #fff; height: 100%; align-content: flex-start; overflow: auto; }
.app-cp-item { width: 130px; display: flex; align-items: center; gap: 8px; padding: 8px 6px; cursor: pointer; border: 1px solid transparent; border-radius: 3px; }
.app-cp-item:hover { background: #e8f0fc; border-color: #b8d0f0; }
.app-cp-item .ico { font-size: 28px; }
.app-cp-item .lbl { font-size: 12px; line-height: 1.3; }
`;
  document.head.appendChild(style);

  const EXE_MAP = {
    'QQ2005.exe': 'qq', 'iexplore.exe': 'ie', 'TTPlayer.exe': 'ttplayer',
    '问道.exe': 'wendao', 'gta-vc.exe': 'vicecity', 'notepad.exe': 'notepad',
  };
  function fileIcon(name) {
    if (/\.exe$/i.test(name)) return '💿';
    if (/\.txt$/i.test(name)) return '📝';
    if (/\.mp3$/i.test(name)) return '🎵';
    if (/\.bmp$/i.test(name)) return '🖼️';
    return '📄';
  }

  /* ---------- 我的电脑 / 资源管理器 ---------- */
  function openExplorer(initialPath) {
    const w = XP.createWindow({ title: '我的电脑', icon: '💻', width: 660, height: 450 });
    const main = XP.el('div', { class: 'app-sys-main' });
    const addrInput = XP.el('input', { class: 'xp-input', readonly: '' });
    let path = initialPath || null;   // null = “我的电脑”根视图
    let hist = [path], hi = 0;

    w.body.style.display = 'flex';
    w.body.style.flexDirection = 'column';
    w.body.appendChild(XP.el('div', { class: 'xp-menubar' },
      ['文件(F)', '编辑(E)', '查看(V)', '收藏(A)', '工具(T)', '帮助(H)'].map(t => XP.el('span', { text: t }))));
    const btnBack = XP.el('div', { class: 'xp-tool-btn', html: '⬅ <span>后退</span>' });
    const btnFwd = XP.el('div', { class: 'xp-tool-btn', html: '➡' });
    const btnUp = XP.el('div', { class: 'xp-tool-btn', html: '⬆ <span>向上</span>' });
    w.body.appendChild(XP.el('div', { class: 'xp-toolbar' }, [btnBack, btnFwd, btnUp]));
    w.body.appendChild(XP.el('div', { class: 'app-sys-addr' }, [XP.el('span', { text: '地址(A)' }), addrInput]));

    const side = XP.el('div', { class: 'app-sys-side' }, [
      XP.el('div', { class: 'box' }, [
        XP.el('div', { class: 'box-h', text: '系统任务' }),
        XP.el('div', { class: 'box-i', html: 'ℹ️ <span>查看系统信息</span>', onclick: () => XP.notify('系统属性', 'Windows XP Professional 怀旧版\n版本 2005 Service Pack 2\n注册到: Administrator\n计算机: P4 2.4GHz, 512MB 内存') }),
        XP.el('div', { class: 'box-i', html: '📦 <span>添加/删除程序</span>', onclick: () => XP.openApp('controlpanel') }),
        XP.el('div', { class: 'box-i', html: '⚙️ <span>更改一个设置</span>', onclick: () => XP.openApp('controlpanel') }),
      ]),
      XP.el('div', { class: 'box' }, [
        XP.el('div', { class: 'box-h', text: '其他位置' }),
        XP.el('div', { class: 'box-i', html: '📁 <span>我的文档</span>', onclick: () => navigate('C:\\我的文档') }),
        XP.el('div', { class: 'box-i', html: '🌐 <span>网上邻居</span>', onclick: () => XP.notify('网上邻居', '未找到其他计算机。') }),
        XP.el('div', { class: 'box-i', html: '🗑️ <span>回收站</span>', onclick: () => XP.openApp('recycle') }),
      ]),
    ]);
    w.body.appendChild(XP.el('div', { class: 'app-sys-layout', style: { flex: '1', minHeight: '0' } }, [side, main]));

    function navigate(p, fromHistory) {
      path = p;
      if (!fromHistory) { hist = hist.slice(0, hi + 1); hist.push(p); hi = hist.length - 1; }
      render();
    }
    function parentOf(p) {
      if (!p) return null;
      if (/^[CD]:\\$/.test(p)) return null;
      const idx = p.lastIndexOf('\\');
      if (idx <= 2) return p.slice(0, 3);
      return p.slice(0, idx);
    }
    function openFile(full, name) {
      if (/\.txt$/i.test(name)) { if (window.XPNotepad) window.XPNotepad.open(full); return; }
      if (/\.bmp$/i.test(name)) { if (window.XPPaint) window.XPPaint.open(full); return; }
      if (/\.exe$/i.test(name)) {
        const app = EXE_MAP[name];
        if (app) XP.openApp(app);
        else { XP.sound('error'); XP.notify('打开文件', '"' + name + '" 不是有效的 Win32 应用程序。'); }
        return;
      }
      if (/\.mp3$/i.test(name)) { XP.notify('千千静听', '正在播放: ' + name); XP.openApp('ttplayer'); return; }
      XP.notify('打开文件', 'Windows 无法打开此文件:\n' + name);
    }
    function render() {
      main.innerHTML = '';
      if (!path) {
        addrInput.value = '我的电脑';
        w.setTitle('我的电脑');
        [['📁', '我的文档', () => navigate('C:\\我的文档')],
         ['💽', '本地磁盘 (C:)', () => navigate('C:\\')],
         ['💽', '本地磁盘 (D:)', () => navigate('D:\\')],
         ['💿', 'CD 驱动器 (E:)', () => { XP.sound('error'); XP.notify('CD 驱动器', '驱动器中没有软盘…啊不, 没有光盘。'); }],
        ].forEach(([ico, lbl, act]) => main.appendChild(XP.el('div', { class: 'app-sys-item', ondblclick: act }, [
          XP.el('div', { class: 'ico', html: ico }), XP.el('div', { class: 'lbl', text: lbl })])));
        return;
      }
      addrInput.value = path;
      w.setTitle(path.split('\\').filter(Boolean).pop() + (path.endsWith('\\') ? '' : ''));
      const items = XP.fs.list(path);
      if (!items.length) { main.appendChild(XP.el('div', { class: 'app-sys-empty', text: '该文件夹是空的。' })); return; }
      items.forEach(it => {
        const full = path + (path.endsWith('\\') ? '' : '\\') + it.name;
        const ico = it.type === 'dir' ? '📁' : fileIcon(it.name);
        const item = XP.el('div', {
          class: 'app-sys-item',
          ondblclick: () => it.type === 'dir' ? navigate(full) : openFile(full, it.name),
        }, [XP.el('div', { class: 'ico', html: ico }), XP.el('div', { class: 'lbl', text: it.name })]);
        if (it.type === 'file') {
          item.addEventListener('contextmenu', e => {
            e.preventDefault(); e.stopPropagation();
            document.querySelectorAll('.ctx-menu').forEach(m => m.remove());
            const menu = XP.el('div', { class: 'ctx-menu', style: { left: e.clientX + 'px', top: e.clientY + 'px', zIndex: '7500' } }, [
              XP.el('div', { class: 'cm-item', text: '打开', onclick: () => { openFile(full, it.name); menu.remove(); } }),
              XP.el('div', { class: 'cm-sep' }),
              XP.el('div', { class: 'cm-item', text: '删除(D)', onclick: () => {
                if (confirm('确实要把 "' + it.name + '" 放入回收站吗?')) {
                  XP.fs.remove(full);
                  XP.notify('回收站', '"' + it.name + '" 已放入回收站');
                  render();
                }
                menu.remove();
              } }),
            ]);
            document.getElementById('desktop').appendChild(menu);
            setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
          });
        }
        main.appendChild(item);
      });
    }
    btnBack.addEventListener('click', () => { if (hi > 0) { hi--; path = hist[hi]; render(); } });
    btnFwd.addEventListener('click', () => { if (hi < hist.length - 1) { hi++; path = hist[hi]; render(); } });
    btnUp.addEventListener('click', () => navigate(parentOf(path)));
    render();
    return w;
  }

  XP.registerApp({ id: 'computer', name: '我的电脑', icon: '💻', open: () => openExplorer(null) });
  XP.registerApp({ id: 'docs', name: '我的文档', icon: '📁', open: () => openExplorer('C:\\我的文档') });

  /* ---------- 回收站 (真实回收流: 删除进回收站/可还原/可清空) ---------- */
  XP.registerApp({
    id: 'recycle', name: '回收站', icon: '🗑️', open() {
      const w = XP.createWindow({ title: '回收站', icon: '🗑️', width: 560, height: 380 });
      w.body.style.display = 'flex';
      w.body.style.flexDirection = 'column';
      const main = XP.el('div', { class: 'app-sys-main', style: { flex: '1' } });
      const render = () => {
        main.innerHTML = '';
        const items = XP.fs.trashList();
        if (!items.length) { main.appendChild(XP.el('div', { class: 'app-sys-empty', text: '回收站是空的。' })); return; }
        items.forEach((it, i) => {
          main.appendChild(XP.el('div', {
            class: 'app-sys-item', title: '原位置: ' + it.orig + '\n双击还原, 右键彻底删除',
            ondblclick: () => {
              if (XP.fs.trashRestore(i)) { XP.notify('回收站', '已还原: ' + it.name + '\n位置: ' + it.orig); render(); }
              else XP.notify('回收站', '还原失败: 原文件夹不存在');
            },
            oncontextmenu: e => {
              e.preventDefault();
              if (confirm('确实要永久删除 "' + it.name + '" 吗?')) { XP.fs.trashDelete(i); render(); }
            },
          }, [XP.el('div', { class: 'ico', html: fileIcon(it.name) }),
              XP.el('div', { class: 'lbl', text: it.name })]));
        });
      };
      w.body.appendChild(XP.el('div', { class: 'xp-toolbar' }, [
        XP.el('div', { class: 'xp-tool-btn', html: '🗑️ <span>清空回收站</span>', onclick: () => {
          if (XP.fs.trashList().length && confirm('确实要永久删除回收站中的所有项目吗?')) { XP.fs.trashEmpty(); render(); XP.notify('回收站', '回收站已清空。'); }
        } }),
        XP.el('div', { class: 'xp-tool-btn', html: '↩️ <span>全部还原</span>', onclick: () => {
          const items = XP.fs.trashList();
          let n = 0;
          for (let i = items.length - 1; i >= 0; i--) { if (XP.fs.trashRestore(i)) n++; }
          if (n) XP.notify('回收站', n + ' 个项目已还原到原位置。');
          render();
        } }),
        XP.el('div', { class: 'xp-tool-btn', html: '❔ <span>双击还原 · 右键永久删除</span>' }),
      ]));
      w.body.appendChild(main);
      render();
    },
  });

  /* ---------- 控制面板 ---------- */
  function dlg(title, icon, w_, h_, build) {
    const w = XP.createWindow({ title, icon, width: w_, height: h_, resizable: false });
    build(w.body, w);
    return w;
  }
  const applets = [
    { icon: '🖥️', name: '显示', act: () => XP.notify('显示 属性', '提示: 在桌面空白处单击鼠标右键 →「属性」, 即可更换壁纸。') },
    { icon: '🔊', name: '声音和音频设备', act: () => dlg('声音和音频设备 属性', '🔊', 380, 200, (body, w) => {
        body.style.padding = '14px';
        body.appendChild(XP.el('div', { class: 'xp-fieldset' }, [
          XP.el('legend', { text: '设备音量' }),
          XP.el('label', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, [
            (() => { const cb = XP.el('input', { type: 'checkbox' }); cb.checked = XP.isMuted();
              cb.addEventListener('change', () => { XP.setMuted(cb.checked); XP.notify('音量', cb.checked ? '已静音 🔇' : '已取消静音 🔊'); }); return cb; })(),
            XP.el('span', { text: '静音(M)' })]),
        ]));
        const test = XP.el('button', { class: 'xp-btn', text: '测试声音 ▶' });
        test.addEventListener('click', () => XP.sound('ding'));
        body.appendChild(XP.el('div', { style: { marginTop: '12px', textAlign: 'right' } }, [test]));
      }) },
    { icon: '👤', name: '用户帐户', act: () => dlg('用户帐户', '👤', 400, 220, (body) => {
        body.style.padding = '14px';
        body.appendChild(XP.el('div', { text: '挑选一个帐户做更改:' }));
        body.appendChild(XP.el('div', { style: { display: 'flex', gap: '12px', marginTop: '12px' } }, [
          XP.el('div', { style: { fontSize: '44px', background: 'linear-gradient(145deg,#f9a03f,#d96c1f)', borderRadius: '6px', padding: '6px 12px', color: '#fff' }, html: '👤' }),
          XP.el('div', {}, [XP.el('div', { style: { fontWeight: 'bold', fontSize: '14px' }, text: 'Administrator' }),
            XP.el('div', { text: '计算机管理员' }), XP.el('div', { style: { color: '#0a5c0a' }, text: '● 已登录' })]),
        ]));
      }) },
    { icon: '📦', name: '添加或删除程序', act: () => dlg('添加或删除程序', '📦', 480, 340, (body) => {
        body.style.padding = '10px';
        body.appendChild(XP.el('div', { style: { marginBottom: '8px' }, text: '当前安装的程序:' }));
        const list = XP.el('div', { class: 'xp-listbox', style: { height: '210px' } });
        [['🐧', 'QQ2005 贺岁版', 'Tencent'], ['🎧', '千千静听 4.6', 'TTPlayer'], ['⚔️', '问道 客户端 v1.38', '光宇华夏'],
         ['🚗', '侠盗飞车: 罪恶都市', 'Rockstar'], ['🌐', 'Internet Explorer 6 SP2', 'Microsoft'], ['💣', 'Windows 游戏组件', 'Microsoft'],
        ].forEach(([ico, name, pub]) => {
          const row = XP.el('div', { class: 'lb-item', style: { display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px' } }, [
            XP.el('span', { html: ico }), XP.el('span', { style: { flex: '1' }, text: name }), XP.el('span', { style: { color: '#888', fontSize: '11px' }, text: pub }),
            XP.el('button', { class: 'xp-btn', text: '更改/删除', onclick: () => XP.notify('添加或删除程序', '删除失败: 这是 2005 年的珍贵回忆, 舍不得删。') }),
          ]);
          list.appendChild(row);
        });
        body.appendChild(list);
      }) },
    { icon: '🕐', name: '日期和时间', act: () => dlg('日期和时间 属性', '🕐', 360, 200, (body, w) => {
        body.style.padding = '16px';
        const now = XP.el('div', { style: { fontSize: '16px', marginTop: '10px' } });
        const tick = () => { now.textContent = '当前日期和时间:  ' + new Date().toLocaleString('zh-CN'); };
        tick(); const t = setInterval(tick, 1000);
        body.appendChild(XP.el('div', { text: '时区: (GMT+08:00) 北京, 重庆, 香港特别行政区, 乌鲁木齐' }));
        body.appendChild(now);
        w.on('close', () => clearInterval(t));
      }) },
    { icon: '🌐', name: 'Internet 选项', act: () => dlg('Internet 属性', '🌐', 420, 220, (body, w) => {
        body.style.padding = '14px';
        body.appendChild(XP.el('div', { class: 'xp-fieldset' }, [
          XP.el('legend', { text: '主页' }),
          XP.el('div', { text: '若要创建主页选项卡, 请在下面的地址栏键入地址:' }),
          XP.el('input', { class: 'xp-input', value: 'http://www.hao123.com', style: { width: '100%', marginTop: '6px' } }),
        ]));
        const ok = XP.el('button', { class: 'xp-btn', text: '确定' });
        ok.addEventListener('click', () => { XP.notify('Internet 属性', '主页设置已保存。'); w.close(); });
        body.appendChild(XP.el('div', { style: { marginTop: '12px', textAlign: 'right' } }, [ok]));
      }) },
  ];
  XP.registerApp({
    id: 'controlpanel', name: '控制面板', icon: '⚙️', desktop: false, open() {
      const w = XP.createWindow({ title: '控制面板', icon: '⚙️', width: 520, height: 380 });
      const grid = XP.el('div', { class: 'app-cp-grid' });
      applets.forEach(a => grid.appendChild(XP.el('div', { class: 'app-cp-item', ondblclick: a.act, title: a.name }, [
        XP.el('span', { class: 'ico', html: a.icon }), XP.el('span', { class: 'lbl', text: a.name })])));
      w.body.appendChild(grid);
    },
  });
})();
