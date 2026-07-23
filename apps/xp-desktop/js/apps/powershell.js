/* Windows PowerShell — 经典蓝色命令行 (虚拟文件系统命令解释器) */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
.app-ps-root { display: flex; flex-direction: column; height: 100%; background: #012456; font-family: "Lucida Console", "Courier New", monospace; font-size: 13px; color: #fff; cursor: text; }
.app-ps-out { flex: 1; overflow-y: auto; padding: 8px 10px 0; white-space: pre-wrap; word-break: break-all; user-select: text; }
.app-ps-out .dim { color: #9db3d6; }
.app-ps-out .yellow { color: #f5d76e; }
.app-ps-out .err { color: #ff7b72; }
.app-ps-out .dirn { color: #7ee787; }
.app-ps-input-line { display: flex; align-items: baseline; padding: 2px 10px 8px; }
.app-ps-prompt { color: #fff; white-space: pre; flex: none; }
.app-ps-input { flex: 1; background: transparent; border: none; outline: none; color: #fff; font: inherit; caret-color: #fff; padding: 0; margin: 0 0 0 2px; }
.app-ps-input::selection { background: #3a5f9e; }
`;
  document.head.appendChild(style);

  const FS_ROOT = 'C:\\';

  function open() {
    const win = XP.createWindow({ title: 'Windows PowerShell', icon: '🔷', width: 660, height: 430 });
    const out = XP.el('div', { class: 'app-ps-out' });
    const input = XP.el('input', { class: 'app-ps-input', spellcheck: 'false', autocomplete: 'off' });
    const promptEl = XP.el('span', { class: 'app-ps-prompt' });
    const inputLine = XP.el('div', { class: 'app-ps-input-line' }, [promptEl, input]);
    // 输入行作为输出区最后一行, 随文本一起滚动 (真 PowerShell 形态)
    const root = XP.el('div', { class: 'app-ps-root' }, [out]);
    out.appendChild(inputLine);
    win.body.style.padding = '0';
    win.body.appendChild(root);

    let cwd = FS_ROOT;
    const history = [];
    let hIdx = -1;

    function print(text, cls) {
      const lines = String(text).split('\n');
      lines.forEach(l => {
        const s = XP.el('div', { text: l === '' ? ' ' : l });
        if (cls) s.className = cls;
        out.appendChild(s);
      });
      out.scrollTop = out.scrollHeight;
    }
    function printDirName(name) {
      const s = XP.el('div', { text: name, class: 'dirn' });
      out.appendChild(s);
      out.scrollTop = out.scrollHeight;
    }
    function setPrompt() { promptEl.textContent = 'PS ' + cwd + '>'; }

    /* ---------- 路径工具 ---------- */
    function norm(path) {
      let p = path.replace(/\//g, '\\');
      if (!/^[A-Za-z]:/.test(p)) p = cwd + (cwd.endsWith('\\') ? '' : '\\') + p;
      const parts = p.split('\\').filter(x => x !== '' && x !== '.');
      const drive = parts.shift().toUpperCase();
      const stack = [];
      parts.forEach(x => { if (x === '..') stack.pop(); else stack.push(x); });
      return drive + '\\' + stack.join('\\') + (stack.length ? '' : '');
    }
    function fsList(path) { return XP.fs.list(path); }
    function exists(path) { return XP.fs.exists(path); }
    function isDir(path) {
      const p = norm(path);
      if (/^[CD]:\\?$/.test(p)) return true;
      return fsList(p).length > 0 || XP.fs.exists(p) && fsList(p) !== null && fsList(p).length >= 0 && !/\.[a-z0-9]+$/i.test(p);
    }

    /* ---------- 命令 ---------- */
    const CMDS = {
      help() {
        print(`命令帮助:
  help                 显示本帮助
  dir [路径]           列出目录内容
  cd <路径>            切换目录 (cd .. 上一级, cd \\ 回根目录)
  pwd                  显示当前路径
  cls / clear          清屏
  echo <文本>          输出文本; echo 文本 > 文件.txt 写入文件
  type <文件>          显示文件内容
  tree                 显示目录树
  mkdir <名称>         创建文件夹
  ipconfig             显示网络信息
  ping <主机>          测试网络连接
  tasklist             显示运行中的窗口(进程)
  start <程序名>       启动程序 (如 start qq / start iexplore / start winmine)
  date / time          显示日期时间
  ver / hostname / whoami
  exit                 关闭 PowerShell`);
      },
      ver() { print('Microsoft Windows XP [版本 5.1.2600]'); },
      cls() { out.innerHTML = ''; },
      clear() { CMDS.cls(); },
      pwd() { print(cwd); },
      dir(args) {
        const p = args[0] ? norm(args[0]) : cwd;
        const items = fsList(p);
        if (!exists(p) && !/^[CD]:\\?$/.test(p)) { print('找不到路径 - ' + p, 'err'); return; }
        print('\n 目录: ' + p + '\n');
        const now = '2005/07/15  12:00';
        let dirs = 0, files = 0;
        items.forEach(it => {
          const isD = it.type === 'dir';
          if (isD) dirs++; else files++;
          print('  ' + now + '    ' + (isD ? '<DIR>        ' : '             ') + it.name, isD ? 'dirn' : '');
        });
        print('        ' + files + ' 个文件,  ' + dirs + ' 个目录\n');
      },
      cd(args) {
        if (!args[0] || args[0] === '\\' || args[0] === '/') { cwd = FS_ROOT; setPrompt(); return; }
        const p = norm(args[0]);
        if (/^[CD]:\\?$/.test(p)) { cwd = p === 'C:' ? 'C:\\' : p; setPrompt(); return; }
        if (!XP.fs.exists(p)) { print('找不到路径 - ' + p, 'err'); return; }
        if (!isDir(p)) { print('路径不是目录 - ' + p, 'err'); return; }
        cwd = p; setPrompt();
      },
      echo(args, raw) {
        const m = raw.match(/^echo\s+(.*?)\s*>\s*(\S+)\s*$/i);
        if (m) {
          const p = norm(m[2]);
          if (!isDir(p.split('\\').slice(0, -1).join('\\') || FS_ROOT)) { print('路径不存在', 'err'); return; }
          XP.fs.write(p, m[1]);
          print('已写入 ' + p, 'dim');
        } else print(raw.replace(/^echo\s*/i, ''));
      },
      type(args) {
        if (!args[0]) { print('用法: type <文件>', 'err'); return; }
        const p = norm(args[0]);
        const c = XP.fs.read(p);
        if (c == null) { print('找不到文件 - ' + p, 'err'); return; }
        print(c);
      },
      tree(args) {
        const root = args[0] ? norm(args[0]) : cwd;
        print(root);
        (function walk(p, prefix) {
          const items = fsList(p);
          items.forEach((it, i) => {
            const last = i === items.length - 1;
            print(prefix + (last ? '└── ' : '├── ') + it.name, it.type === 'dir' ? 'dirn' : '');
            if (it.type === 'dir') walk(p + (p.endsWith('\\') ? '' : '\\') + it.name, prefix + (last ? '    ' : '│   '));
          });
        })(root, '');
      },
      mkdir(args) {
        if (!args[0]) { print('用法: mkdir <名称>', 'err'); return; }
        const p = norm(args[0]);
        XP.fs.write(p + '\\.keep', '');
        print('已创建目录 ' + p + ' (经由 .keep 占位文件)', 'dim');
      },
      ipconfig() {
        print(`\nWindows IP 配置

  以太网适配器 本地连接:
    连接特定的 DNS 后缀 . . . . . . . : msh.team
    IP 地址. . . . . . . . . . . . . : 192.168.1.105
    子网掩码 . . . . . . . . . . . . : 255.255.255.0
    默认网关 . . . . . . . . . . . . : 192.168.1.1
`);
      },
      ping(args) {
        const host = args[0] || 'www.qq.com';
        print('');
        [32, 33, 31, 32].forEach((t, i) => {
          print('来自 ' + host + ' 的回复: 字节=32 时间=' + t + 'ms TTL=53');
        });
        print(`\n${host} 的 Ping 统计信息:
    数据包: 已发送 = 4, 已接收 = 4, 丢失 = 0 (0% 丢失)
往返行程的估计时间(以毫秒为单位):
    最短 = 31ms, 最长 = 33ms, 平均 = 32ms`);
      },
      tasklist() {
        const wins = [...document.querySelectorAll('.xp-window .xp-title-text')];
        print('\n映像名称                       PID 会话名       内存使用');
        print('========================= ======= ============ ============');
        wins.forEach((w, i) => {
          const name = (w.textContent || '窗口').slice(0, 24).padEnd(26, ' ');
          print(name + ' ' + String(1000 + i * 37).padEnd(8, ' ') + 'Console    ' + (8 + (i * 13) % 60) + ',024 K');
        });
        print('');
      },
      start(args) {
        const name = (args[0] || '').toLowerCase().replace(/\.exe$/, '');
        const map = {
          qq: 'qq', iexplore: 'ie', ie: 'ie', ttplayer: 'ttplayer', winmine: 'minesweeper',
          notepad: 'notepad', mspaint: 'paint', wendao: 'wendao', gta: 'vicecity', vicecity: 'vicecity',
          spider: 'spider', rising: 'rising', qzone: 'qzone', farm: 'farm', xunlei: 'xunlei',
          powershell: 'powershell', ps: 'powershell', cmd: 'powershell', computer: 'computer',
          recycle: 'recycle', controlpanel: 'controlpanel', qmail: 'qmail', qpet: 'qpet',
        };
        if (map[name]) { XP.openApp(map[name]); print('已启动 ' + name, 'dim'); }
        else print('start: 找不到程序 "' + (args[0] || '') + '"。可用: ' + Object.keys(map).join(', '), 'err');
      },
      date() { print('当前日期: 2005/7/15 星期五'); },
      time() { const d = new Date(); print('当前时间: ' + d.toLocaleTimeString('zh-CN') + ' (2005年)'); },
      hostname() { print('ADMINISTRATOR-XP'); },
      whoami() { print('administrator-xp\\administrator'); },
      exit() { win.close(); },
    };

    function run(raw) {
      const line = raw.trim();
      if (!line) return;
      history.push(line); hIdx = history.length;
      const parts = line.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const fn = CMDS[cmd];
      if (fn) { try { fn(parts.slice(1), line); } catch (e) { print('执行出错: ' + e.message, 'err'); } }
      else print('"' + parts[0] + '" 不是内部或外部命令，也不是可运行的程序或批处理文件。', 'err');
    }

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const v = input.value;
        print('PS ' + cwd + '> ' + v);
        input.value = '';
        run(v);
        out.scrollTop = out.scrollHeight;
        // 输入行随输出保持在最底部
        out.appendChild(inputLine);
        out.scrollTop = out.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIdx > 0) { hIdx--; input.value = history[hIdx] || ''; }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx] || ''; }
        else { hIdx = history.length; input.value = ''; }
      }
    });
    root.addEventListener('click', () => input.focus());

    print('Windows PowerShell\n版权所有 (C) 2005 Microsoft Corporation。保留所有权利。\n');
    print('输入 help 查看可用命令。', 'dim');
    setPrompt();
    setTimeout(() => input.focus(), 100);
    return win;
  }

  XP.registerApp({ id: 'powershell', name: 'PowerShell', icon: '🔷', open });
})();
