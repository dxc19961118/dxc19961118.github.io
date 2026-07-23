/* ============================================================
   Internet Explorer 6 (怀旧模拟版)
   - 单文件普通脚本, 通过全局 XP 注册应用
   - 百度搜索联网检索真实结果: http 环境下优先本机搜狗代理 (/api/search),
     失败后回退 中文维基百科 + DuckDuckGo, 再失败回退离线演示结果; file:// 直接走原路径
   - 百度搜索支持时间筛选 (不限 / 2005年前 / 2000年前 / 1995年前), 每窗口记忆
   - 其余"网站"均由 JS 离线渲染, 链接为内部跳转
   - 支持多窗口, 每个窗口独立历史栈 / 假加载进度
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 应用专有样式 (前缀 app-ie-) ---------------- */
  var CSS = [
    '.app-ie-root{display:flex;flex-direction:column;height:100%;background:#ece9d8;}',
    '.app-ie-addr{display:flex;align-items:center;gap:6px;padding:3px 6px;background:#ece9d8;border-bottom:1px solid #d8d4c4;flex:none;}',
    '.app-ie-addr label{white-space:nowrap;font-size:12px;}',
    '.app-ie-addr input{flex:1;min-width:0;}',
    '.app-ie-sep{width:1px;height:20px;background:#c8c4b4;margin:0 4px;flex:none;}',
    '.app-ie-off{color:#aca899;cursor:default;}',
    '.app-ie-off:hover{background:transparent;border-color:transparent;}',
    /* 网页内容区: 2005 风格 宋体 / 蓝色下划线链接 / 12px */
    '.app-ie-page{flex:1;min-height:0;overflow:auto;background:#fff;font-family:SimSun,"宋体",serif;font-size:12px;color:#000;line-height:1.5;user-select:text;}',
    '.app-ie-frame{width:100%;height:100%;border:0;display:block;background:#fff;}',
    '.app-ie-page a{color:#0000ee;text-decoration:underline;cursor:pointer;}',
    '.app-ie-page a:hover{color:#f60;}',
    '.app-ie-page em{color:#c00;font-style:normal;}',
    /* 下拉面板 (收藏夹/历史) */
    '.app-ie-dropdown{position:absolute;z-index:50;min-width:190px;max-width:320px;max-height:280px;overflow:auto;background:#fff;border:1px solid #aca899;box-shadow:2px 2px 6px rgba(0,0,0,.35);padding:2px;font-family:Tahoma,"Microsoft YaHei",sans-serif;}',
    '.app-ie-dropdown .dd-head{padding:3px 8px;color:#666;border-bottom:1px solid #ddd;font-size:11px;}',
    '.app-ie-dropdown .dd-item{padding:4px 8px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;}',
    '.app-ie-dropdown .dd-item:hover{background:#316ac5;color:#fff;}',
    /* hao123 */
    '.app-ie-h123{max-width:780px;margin:0 auto;padding:6px 8px 24px;}',
    '.app-ie-h123-head{text-align:center;padding:10px 0 0;}',
    '.app-ie-h123-logo{font-family:Arial,sans-serif;font-size:46px;font-weight:bold;letter-spacing:1px;}',
    '.app-ie-h123-logo .g{color:#009a44;}',
    '.app-ie-h123-logo .o{color:#f60;}',
    '.app-ie-h123-sub{font-size:17px;color:#009a44;letter-spacing:8px;font-weight:bold;}',
    '.app-ie-h123-slogan{text-align:center;color:#777;margin:2px 0 12px;font-size:12px;}',
    '.app-ie-h123-search{text-align:center;margin-bottom:14px;}',
    '.app-ie-h123-search input{width:310px;font-size:14px;padding:3px 5px;border:1px solid #7f9db9;font-family:SimSun,"宋体",serif;}',
    '.app-ie-h123-search button{font-size:14px;padding:3px 14px;margin-left:5px;cursor:pointer;font-family:SimSun,"宋体",serif;background:#f0f0f0;border:1px solid #999;}',
    '.app-ie-h123-grid{width:100%;border-collapse:collapse;}',
    '.app-ie-h123-grid td{border:1px solid #9bc8d8;padding:7px 10px;vertical-align:middle;background:#f4fafc;}',
    '.app-ie-h123-grid td.cc{width:64px;text-align:center;background:#dff0f6;}',
    '.app-ie-h123-cat{color:#008000;font-weight:bold;font-size:14px;}',
    '.app-ie-h123-grid a{margin-right:16px;font-size:12px;}',
    '.app-ie-h123-foot{text-align:center;color:#999;margin-top:16px;font-size:11px;}',
    /* 百度首页 */
    '.app-ie-bd{text-align:center;padding-top:80px;}',
    '.app-ie-bd-logo{font-family:"Microsoft YaHei",SimSun,serif;font-size:74px;font-weight:bold;letter-spacing:8px;}',
    '.app-ie-bd-logo .b1{color:#2932e1;}',
    '.app-ie-bd-logo .b2{color:#e10602;}',
    '.app-ie-bd-box{margin:24px 0 10px;}',
    '.app-ie-bd-box input{width:350px;height:24px;font-size:16px;border:1px solid #555;padding:0 6px;font-family:SimSun,"宋体",serif;vertical-align:middle;}',
    '.app-ie-bd-box button{height:26px;font-size:15px;padding:0 14px;margin-left:6px;cursor:pointer;font-family:SimSun,"宋体",serif;vertical-align:middle;background:#f0f0f0;border:1px solid #666;}',
    '.app-ie-bd-links a{margin:0 6px;font-size:12px;}',
    '.app-ie-bd-foot{margin-top:70px;color:#888;font-size:11px;}',
    /* 百度搜索结果 */
    '.app-ie-bdr{padding:10px 18px 30px;}',
    '.app-ie-bdr-top{display:flex;align-items:center;gap:10px;padding-bottom:8px;border-bottom:1px solid #999;}',
    '.app-ie-bdr-logo{font-family:"Microsoft YaHei",SimSun,serif;font-size:26px;font-weight:bold;cursor:pointer;}',
    '.app-ie-bdr-logo .b1{color:#2932e1;}',
    '.app-ie-bdr-logo .b2{color:#e10602;}',
    '.app-ie-bdr-top input{flex:1;max-width:430px;height:22px;font-size:14px;border:1px solid #555;padding:0 5px;font-family:SimSun,"宋体",serif;}',
    '.app-ie-bdr-top button{height:24px;padding:0 12px;cursor:pointer;font-family:SimSun,"宋体",serif;background:#f0f0f0;border:1px solid #666;}',
    '.app-ie-bdr-count{color:#666;margin:10px 0 14px;font-size:12px;}',
    '.app-ie-bdr-item{margin-bottom:15px;max-width:660px;}',
    '.app-ie-bdr-item .t{font-size:14px;margin-bottom:2px;}',
    '.app-ie-bdr-item .s{color:#333;font-size:12px;}',
    '.app-ie-bdr-item .u{color:#008000;font-size:12px;}',
    '.app-ie-bdr-item .snap{color:#666;font-size:11px;margin-left:6px;}',
    '.app-ie-bdr-status{font-size:11px;margin:8px 0 2px;}',
    /* 搜索时间筛选下拉 / 结果日期 */
    '.app-ie-bd-box select,.app-ie-h123-search select,.app-ie-bdr-top select{height:24px;font-size:12px;font-family:SimSun,"宋体",serif;vertical-align:middle;border:1px solid #7f9db9;}',
    '.app-ie-bdr-date{color:#999;font-size:11px;margin-left:6px;}',
    /* 新闻门户 (新浪/网易) */
    '.app-ie-portal{max-width:800px;margin:0 auto;padding:0 10px 30px;}',
    '.app-ie-ph{display:flex;align-items:baseline;gap:12px;padding:9px 14px;}',
    '.app-ie-ph .lg{font-size:26px;font-weight:bold;font-family:SimHei,"黑体",sans-serif;color:#fff;}',
    '.app-ie-ph .dm{font-size:12px;}',
    '.app-ie-ph.sina{background:#d40000;}',
    '.app-ie-ph.sina .dm{color:#ffd0d0;}',
    '.app-ie-ph.n163{background:#005bac;}',
    '.app-ie-ph.n163 .dm{color:#cfe4ff;}',
    '.app-ie-nav{padding:5px 14px;border-bottom:1px solid #ccc;}',
    '.app-ie-nav.sina{background:#fff0e8;border-bottom-color:#d40000;}',
    '.app-ie-nav.sina a{color:#8a0000;}',
    '.app-ie-nav.n163{background:#e8f1fb;border-bottom-color:#005bac;}',
    '.app-ie-nav.n163 a{color:#004080;}',
    '.app-ie-nav a{margin-right:14px;font-size:13px;font-weight:bold;}',
    '.app-ie-slogan{padding:4px 14px;color:#777;font-size:11px;border-bottom:1px dotted #ccc;}',
    '.app-ie-sec{font-weight:bold;font-size:13px;padding:5px 2px 3px;margin:10px 0 4px;border-bottom:2px solid;}',
    '.app-ie-sec.sina{color:#d40000;border-color:#d40000;}',
    '.app-ie-sec.n163{color:#005bac;border-color:#005bac;}',
    '.app-ie-news{list-style:none;margin:0;padding:0;}',
    '.app-ie-news li{padding:3px 2px;border-bottom:1px dotted #ccc;overflow:hidden;}',
    '.app-ie-news li.hot a{color:#c00;font-weight:bold;font-size:13px;}',
    '.app-ie-news .dt{float:right;color:#999;font-size:11px;margin-left:10px;}',
    /* 文章页 */
    '.app-ie-art{max-width:680px;margin:0 auto;padding:12px 12px 40px;}',
    '.app-ie-art-crumb{color:#666;font-size:11px;margin-bottom:6px;}',
    '.app-ie-art h1{font-size:20px;text-align:center;font-family:SimHei,"黑体",sans-serif;margin:10px 0 6px;line-height:1.4;}',
    '.app-ie-art .info{text-align:center;color:#666;font-size:11px;border-bottom:1px solid #bbb;padding-bottom:8px;margin-bottom:14px;}',
    '.app-ie-art p{text-indent:2em;margin:10px 0;font-size:14px;line-height:1.9;}',
    '.app-ie-art-foot{margin-top:22px;text-align:center;border-top:1px dotted #bbb;padding-top:10px;}',
    /* 腾讯网迷你首页 */
    '.app-ie-qq{max-width:720px;margin:0 auto;padding:0 10px 30px;}',
    '.app-ie-qq-head{background:#1a8bd8;color:#fff;padding:10px 14px;display:flex;align-items:baseline;gap:10px;}',
    '.app-ie-qq-head .lg{font-size:24px;font-weight:bold;font-family:SimHei,"黑体",sans-serif;}',
    '.app-ie-qq-head .dm{font-size:12px;color:#d8f0ff;}',
    '.app-ie-qq-nav{background:#e3f3fc;border-bottom:1px solid #1a8bd8;padding:5px 14px;}',
    '.app-ie-qq-nav a{margin-right:14px;color:#005a90;font-weight:bold;font-size:13px;}',
    '.app-ie-qq-dl{margin:12px 0;padding:10px 14px;background:#fff8e0;border:1px solid #e0c060;text-align:center;font-size:13px;}',
    '.app-ie-qq-dl b{color:#d40000;}',
    '.app-ie-qq-sec{color:#1a8bd8;font-weight:bold;font-size:13px;border-bottom:2px solid #1a8bd8;padding:4px 2px;margin:10px 0 6px;}',
    /* IE6 错误页 */
    '.app-ie-err{padding:26px 40px;max-width:660px;font-family:SimSun,"宋体",serif;}',
    '.app-ie-err h2{font-size:17px;margin-bottom:12px;}',
    '.app-ie-err .msg{margin-bottom:12px;}',
    '.app-ie-err hr{border:none;border-top:1px solid #999;margin:10px 0;}',
    '.app-ie-err ul{margin:8px 0 8px 26px;color:#444;}',
    '.app-ie-err li{margin:5px 0;}',
    '.app-ie-err .dns{margin-top:18px;font-size:12px;}',
    /* 通用生成站点 (未知域名按类别生成) */
    '.app-ie-gen{max-width:820px;margin:0 auto;padding:0 10px 30px;}',
    '.app-ie-gh{display:flex;align-items:baseline;gap:12px;padding:10px 14px;}',
    '.app-ie-gh .lg{font-size:24px;font-weight:bold;font-family:SimHei,"黑体",sans-serif;color:#fff;}',
    '.app-ie-gh .dm{font-size:12px;color:#fff;opacity:.8;}',
    '.app-ie-gh.mail{background:#3f6fb5;}.app-ie-gh.game{background:#5b2d90;}.app-ie-gh.music{background:#d14f8f;}',
    '.app-ie-gh.soft{background:#2e8b57;}.app-ie-gh.weather{background:#1e8fd5;}.app-ie-gh.train{background:#b03030;}.app-ie-gh.portal{background:#b8312f;}',
    '.app-ie-gnav{padding:5px 14px;border-bottom:1px solid #ccc;background:#f5f5f5;}',
    '.app-ie-gnav a{margin-right:14px;font-size:13px;font-weight:bold;}',
    '.app-ie-gnav.mail{background:#e8f0fa;border-bottom-color:#3f6fb5;}.app-ie-gnav.game{background:#f0e8fa;border-bottom-color:#5b2d90;}',
    '.app-ie-gnav.music{background:#fce8f3;border-bottom-color:#d14f8f;}.app-ie-gnav.soft{background:#e8f5ee;border-bottom-color:#2e8b57;}',
    '.app-ie-gnav.weather{background:#e6f4fc;border-bottom-color:#1e8fd5;}.app-ie-gnav.train{background:#fbe8e8;border-bottom-color:#b03030;}',
    '.app-ie-gnav.portal{background:#fbeae9;border-bottom-color:#b8312f;}',
    '.app-ie-gwrap{display:flex;gap:12px;margin-top:10px;}',
    '.app-ie-gmain{flex:1;min-width:0;}',
    '.app-ie-gside{width:190px;flex:none;}',
    '.app-ie-gsec{font-weight:bold;font-size:13px;padding:4px 2px 3px;margin:10px 0 5px;border-bottom:2px solid #999;}',
    '.app-ie-gsec.mail{color:#3f6fb5;border-color:#3f6fb5;}.app-ie-gsec.game{color:#5b2d90;border-color:#5b2d90;}',
    '.app-ie-gsec.music{color:#d14f8f;border-color:#d14f8f;}.app-ie-gsec.soft{color:#2e8b57;border-color:#2e8b57;}',
    '.app-ie-gsec.weather{color:#1e8fd5;border-color:#1e8fd5;}.app-ie-gsec.train{color:#b03030;border-color:#b03030;}',
    '.app-ie-gsec.portal{color:#b8312f;border-color:#b8312f;}',
    '.app-ie-gbox{border:1px solid #ccc;background:#f7f7f7;padding:8px 10px;margin-bottom:10px;}',
    '.app-ie-gbox-t{font-weight:bold;color:#333;margin-bottom:5px;font-size:12px;border-bottom:1px dotted #bbb;padding-bottom:3px;}',
    '.app-ie-gtbl{width:100%;border-collapse:collapse;font-size:12px;background:#fff;}',
    '.app-ie-gtbl th{background:#f0f0f0;border:1px solid #ccc;padding:4px 6px;text-align:left;}',
    '.app-ie-gtbl td{border:1px solid #ccc;padding:4px 6px;}',
    '.app-ie-mini-btn{font-size:12px;padding:1px 8px;cursor:pointer;font-family:SimSun,"宋体",serif;background:#f0f0f0;border:1px solid #999;}',
    '.app-ie-ipt{font-size:12px;padding:2px 4px;border:1px solid #7f9db9;font-family:SimSun,"宋体",serif;width:150px;}',
    '.app-ie-wcur{font-size:16px;padding:10px 14px;background:#f0f9ff;border:1px solid #b8dcf5;margin-bottom:10px;}',
    /* 搜索结果内嵌快照页 */
    '.app-ie-snap-sum{background:#f4f8ff;border:1px solid #c8d8f0;padding:8px 10px;margin:10px 0 14px;font-size:13px;line-height:1.7;}',
    '.app-ie-open-btn{font-size:13px;padding:3px 12px;cursor:pointer;font-family:SimSun,"宋体",serif;background:#f0f0f0;border:1px solid #666;}',
    /* 菜单栏下拉菜单 (XP 风格, 支持二级子菜单) */
    '.app-ie-menu-drop{position:absolute;z-index:60;min-width:190px;background:#fff;border:1px solid #aca899;box-shadow:2px 2px 6px rgba(0,0,0,.35);padding:2px;font-family:Tahoma,"Microsoft YaHei",sans-serif;font-size:12px;}',
    '.app-ie-menu-item{position:relative;display:flex;justify-content:space-between;align-items:center;gap:18px;padding:3px 20px 3px 24px;cursor:default;white-space:nowrap;color:#000;}',
    '.app-ie-menu-item:hover{background:#316ac5;color:#fff;}',
    '.app-ie-menu-item .hk{color:#666;font-size:11px;}',
    '.app-ie-menu-item:hover .hk{color:#dbe7fb;}',
    '.app-ie-menu-item.chk::before{content:"✓";position:absolute;left:8px;}',
    '.app-ie-menu-item.has-sub::after{content:"▶";position:absolute;right:6px;font-size:8px;}',
    '.app-ie-menu-sep{height:1px;background:#d8d4c4;margin:3px 1px;}',
    '.app-ie-menu-sub{position:absolute;}',
    /* 页内查找条 */
    '.app-ie-findbar{position:absolute;left:0;right:0;z-index:55;display:flex;align-items:center;gap:5px;padding:4px 8px;background:#fffbe6;border-bottom:1px solid #d8d0a0;font-family:Tahoma,"Microsoft YaHei",sans-serif;font-size:12px;}',
    '.app-ie-findbar input{width:160px;font-size:12px;padding:2px 4px;border:1px solid #7f9db9;font-family:SimSun,"宋体",serif;}',
    '.app-ie-findbar button{font-size:12px;padding:2px 10px;cursor:pointer;background:#f0f0f0;border:1px solid #999;font-family:SimSun,"宋体",serif;}',
    '.app-ie-findbar .cnt{color:#666;}',
    '.app-ie-findbar .x{margin-left:auto;cursor:pointer;color:#900;font-weight:bold;padding:0 4px;}',
    '.app-ie-page mark.app-ie-find{background:#ff0;color:#000;padding:0;}',
    '.app-ie-page mark.app-ie-find.cur{background:#f60;color:#fff;}',
    /* 菜单弹出的各类小窗口通用样式 */
    '.app-ie-dlg{font-family:SimSun,"宋体",serif;font-size:12px;color:#000;}',
    '.app-ie-dlg .row{margin:8px 0;display:flex;align-items:center;gap:8px;}',
    '.app-ie-dlg .row label{white-space:nowrap;}',
    '.app-ie-dlg .row input[type=text]{flex:1;min-width:0;border:1px solid #7f9db9;padding:3px 5px;font-family:inherit;font-size:12px;}',
    '.app-ie-dlg select{border:1px solid #7f9db9;padding:2px;font-family:inherit;font-size:12px;}',
    '.app-ie-dlg .btns{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;}',
    '.app-ie-src{margin:0;padding:10px;font-family:"Courier New",monospace;font-size:12px;line-height:1.45;white-space:pre-wrap;word-break:break-all;background:#fff;color:#000;user-select:text;}',
    '.app-ie-help{padding:12px 16px;font-family:SimSun,"宋体",serif;font-size:12px;line-height:1.8;background:#fff;height:100%;box-sizing:border-box;overflow:auto;}',
    '.app-ie-help h3{font-size:14px;color:#0a3d91;margin:12px 0 4px;border-bottom:1px solid #ccc;padding-bottom:2px;}',
    '.app-ie-help p{margin:4px 0;text-indent:2em;}',
    '.app-ie-addon{width:100%;border-collapse:collapse;font-size:12px;background:#fff;margin-top:6px;}',
    '.app-ie-addon th{background:#ece9d8;border:1px solid #aca899;padding:4px 6px;text-align:left;}',
    '.app-ie-addon td{border:1px solid #c8c4b4;padding:4px 6px;}',
    '.app-ie-about{display:flex;gap:12px;}',
    '.app-ie-about-logo{position:relative;width:56px;height:56px;flex:none;}',
    '.app-ie-about-logo b{position:absolute;left:10px;top:-8px;font:italic bold 58px Georgia,"Times New Roman",serif;color:#1a5cb8;}',
    '.app-ie-about-logo i{position:absolute;left:-4px;top:19px;width:62px;height:20px;border:4px solid #d4a017;border-left-color:transparent;border-radius:50%;transform:rotate(-28deg);}',
    '.app-ie-about .info{flex:1;line-height:1.7;}',
    '.app-ie-about .pn{font-size:15px;font-weight:bold;font-family:Arial,sans-serif;}',
    '.app-ie-about .warn{font-size:11px;color:#444;border-top:1px solid #bbb;margin-top:8px;padding-top:6px;line-height:1.5;}'
  ].join('\n');
  var styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ---------------- 工具函数 ---------------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function decodeQuery(s) {
    try { return decodeURIComponent(String(s).replace(/\+/g, ' ')); } catch (e) { return String(s); }
  }

  var HOME = 'http://www.hao123.com';
  var NAME_URLS = {
    'hao123': 'http://www.hao123.com', '好123': 'http://www.hao123.com', '网址之家': 'http://www.hao123.com',
    '百度': 'http://www.baidu.com', '新浪': 'http://www.sina.com.cn',
    '网易': 'http://www.163.com', '腾讯': 'http://www.qq.com'
  };
  // URL 补全: "baidu" -> http://www.baidu.com ; "sina.com.cn" -> http://sina.com.cn
  function normalizeUrl(raw) {
    var u = String(raw == null ? '' : raw).trim();
    if (!u) return null;
    if (NAME_URLS[u]) return NAME_URLS[u];
    var low = u.toLowerCase();
    if (NAME_URLS[low]) return NAME_URLS[low];
    if (!/^https?:\/\//i.test(u)) {
      if (/^[^\s]+\.[^\s]+$/.test(u)) u = 'http://' + u;
      else {
        var token = u.replace(/\s+/g, '');
        if (!/^[\w\u4e00-\u9fa5-]+$/.test(token)) return null;   /* 明显非法输入 → 保留错误页 */
        u = 'http://www.' + token + '.com';
      }
    }
    return u;
  }

  /* ---------------- 链接生成 (data-url 内部跳转; data-real-url 为真实外网链接) ---------------- */
  function link(label, url) { return '<a data-url="' + esc(url) + '">' + esc(label) + '</a>'; }
  function linkHtml(labelHtml, url) { return '<a data-url="' + esc(url) + '">' + labelHtml + '</a>'; }
  function hl(text, q) {
    var t = esc(text);
    if (!q) return t;
    var eq = esc(q);
    return t.split(eq).join('<em>' + eq + '</em>');
  }

  /* ---------------- hao123 网址之家 ---------------- */
  /* 搜索时间筛选下拉 (默认 2005年前, 契合怀旧主题); before 取值 '' | '2005' | '2000' | '1995' */
  var SEARCH_BEFORE_OPTS = [['', '不限'], ['2005', '2005年前'], ['2000', '2000年前'], ['1995', '1995年前']];
  function beforeSelectHtml(before) {
    return '<select data-search-before title="按网页时间筛选">' +
      SEARCH_BEFORE_OPTS.map(function (o) {
        return '<option value="' + o[0] + '"' + (o[0] === (before || '') ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select>';
  }
  function beforeLabel(before) {
    for (var i = 0; i < SEARCH_BEFORE_OPTS.length; i++) {
      if (SEARCH_BEFORE_OPTS[i][0] === (before || '')) return SEARCH_BEFORE_OPTS[i][1];
    }
    return '不限';
  }
  var H123_CATS = [
    ['新闻', [['新浪网', 'http://www.sina.com.cn'], ['搜狐', 'http://www.sohu.com'], ['网易', 'http://www.163.com'], ['腾讯网', 'http://www.qq.com']]],
    ['邮箱', [['163邮箱', 'http://mail.163.com'], ['126邮箱', 'http://www.126.com'], ['Hotmail', 'http://www.hotmail.com']]],
    ['游戏', [['17173', 'http://www.17173.com'], ['问道官网', 'http://wd.gyyx.cn'], ['联众世界', 'http://www.lianzhong.com']]],
    ['音乐', [['百度MP3', 'http://mp3.baidu.com'], ['千千静听', 'http://www.ttplayer.com']]],
    ['实用', [['天气预报', 'http://www.weather.com.cn'], ['火车时刻表', 'http://www.huoche.com.cn'], ['IP查询', 'http://www.ip138.com']]]
  ];
  function pageHao123(before) {
    var rows = H123_CATS.map(function (c) {
      return '<tr><td class="cc"><span class="app-ie-h123-cat">' + esc(c[0]) + '</span></td><td>' +
        c[1].map(function (l) { return link(l[0], l[1]); }).join('') + '</td></tr>';
    }).join('');
    var html =
      '<div class="app-ie-h123">' +
      '<div class="app-ie-h123-head"><span class="app-ie-h123-logo"><b class="g">hao</b><b class="o">123</b></span>&nbsp;&nbsp;' +
      '<span class="app-ie-h123-sub">网址之家</span></div>' +
      '<div class="app-ie-h123-slogan">—— 精彩网址，从这里开始！ ——</div>' +
      '<div class="app-ie-h123-search"><input data-search data-autofocus value="" placeholder="输入关键字，百度搜索">' +
      beforeSelectHtml(before) +
      '<button data-search-btn>搜索</button></div>' +
      '<table class="app-ie-h123-grid">' + rows + '</table>' +
      '<div class="app-ie-h123-foot">Copyright &copy; 2005 hao123.com 版权所有　本站仅收录优秀网址</div>' +
      '</div>';
    return { title: 'hao123网址之家', html: html };
  }

  /* ---------------- 百度 ---------------- */
  function pageBaidu(before) {
    var nav = ['新闻', '网页', '贴吧', '知道', 'MP3', '图片']
      .map(function (t) { return link(t, 'http://' + t + '.baidu.com'); }).join('　');
    var html =
      '<div class="app-ie-bd">' +
      '<div class="app-ie-bd-logo"><span class="b1">百</span><span class="b2">度</span></div>' +
      '<div class="app-ie-bd-box"><input data-search data-autofocus value="">' +
      beforeSelectHtml(before) +
      '<button data-search-btn>百度一下</button></div>' +
      '<div class="app-ie-bd-links">' + nav + '</div>' +
      '<div class="app-ie-bd-foot">&copy;2005 Baidu 使用百度前必读　' +
      link('关于百度', 'http://www.baidu.com/about.html') + '　' +
      link('帮助中心', 'http://www.baidu.com/help.html') + '</div>' +
      '</div>';
    return { title: '百度一下，你就知道', html: html };
  }

  var BDR_TITLE_TPLS = [
    '{q}官方网站', '{q}_百度百科', '{q}最新消息 新闻汇总', '{q}吧_百度贴吧',
    '{q}免费下载 绿色版', '{q}图片大全', '{q}视频 在线观看', '{q}论坛 网友讨论区',
    '{q}相关知识问答', '{q}专题报道'
  ];
  var BDR_ABS_TPLS = [
    '{q}是目前网友关注的热点话题，本站为您提供{q}的最新动态、相关资料与网友评论，欢迎访问。',
    '专业{q}网站，提供{q}新闻、{q}下载、{q}图片等全方位信息，更新及时，内容权威。',
    '{q}讨论区，聚集了大量{q}爱好者，您可以在这里交流{q}的心得与经验。',
    '本站精心整理了{q}的相关资源，包括{q}教程、{q}常见问题解答，欢迎收藏。',
    '{q}专题频道，汇集{q}新闻资讯、{q}行情报价及{q}使用技巧，每日更新。'
  ];
  var BDR_DOMAINS = ['xinhuanet.com', 'people.com.cn', 'chinanews.com', 'cctv.com', 'tom.com', 'sohu.com', '21cn.com', 'yesky.com', 'pconline.com.cn', 'zjol.com.cn'];
  var BDR_INTERNAL = ['http://www.sina.com.cn', 'http://www.163.com', 'http://www.qq.com', 'http://www.hao123.com'];

  /* 结果页公共头尾 */
  function baiduResultsHead(q, before) {
    return '<div class="app-ie-bdr">' +
      '<div class="app-ie-bdr-top">' +
      '<span class="app-ie-bdr-logo" data-url="http://www.baidu.com"><span class="b1">百</span><span class="b2">度</span></span>' +
      '<input data-search value="' + esc(q) + '">' +
      '时间：' + beforeSelectHtml(before) +
      '<button data-search-btn>百度一下</button>' +
      '</div>';
  }
  function baiduResultsFoot(q) {
    return '<div class="app-ie-bdr-count">相关搜索：' +
      [q + '下载', q + '新闻', q + '图片', q + '视频', q + '官网']
        .map(function (t) { return link(t, 'http://www.baidu.com/s?wd=' + encodeURIComponent(t)); }).join('　') +
      '</div></div>';
  }

  /* 离线回退: 诚实提示 (不用模拟结果填充) */
  function pageBaiduResults(q, offline, before) {
    if (offline) {
      var html = baiduResultsHead(q, before) +
        '<div class="app-ie-bdr-status" style="color:#c60">网络不可用，暂时无法联网搜索</div>' +
        '<div class="app-ie-bdr-count">请检查网络连接后按 F5 或点击"刷新"重试。<br><br>当前搜索服务（搜狗实时检索）暂不可达。<br><br><span style="color:#888">提示: 本模拟器离线时仅 hao123 导航页及内置站点（新浪/网易/腾讯网）可浏览。</span></div>' +
        baiduResultsFoot(q);
      return { title: q + '_百度搜索', html: html };
    }
    var h = hashStr(q);
    var count = 100000 + (h % 8900000);
    var secs = (0.01 + (h % 90) / 100).toFixed(3);
    var items = '';
    for (var i = 0; i < 10; i++) {
      var seed = hashStr(q + '#' + i);
      var toInternal = seed % 4 === 0;
      var url = toInternal
        ? BDR_INTERNAL[seed % BDR_INTERNAL.length]
        : 'http://www.' + BDR_DOMAINS[seed % BDR_DOMAINS.length] + '/' + (1000 + seed % 9000) + '.shtml';
      var title = BDR_TITLE_TPLS[seed % BDR_TITLE_TPLS.length].replace(/\{q\}/g, q);
      var abs = BDR_ABS_TPLS[seed % BDR_ABS_TPLS.length].replace(/\{q\}/g, q);
      if (!toInternal) snapPut(url, title, null, abs, '百度搜索');
      items +=
        '<div class="app-ie-bdr-item">' +
        '<div class="t">' + linkHtml(hl(title, q), url) + '</div>' +
        '<div class="s">' + hl(abs, q) + '</div>' +
        '<div><span class="u">' + esc(url) + '</span><span class="snap">百度快照</span></div>' +
        '</div>';
    }
    var html = baiduResultsHead(q, before) +
      (offline ? '<div class="app-ie-bdr-status" style="color:#c60">网络不可用，以下为离线演示结果</div>' : '') +
      '<div class="app-ie-bdr-count">百度为您找到相关结果约 <b>' + fmtNum(count) + '</b> 个，用时 ' + secs + ' 秒（时间：' + beforeLabel(before) + '）</div>' +
      items + baiduResultsFoot(q);
    return { title: q + '_百度搜索', html: html };
  }

  /* ---------------- 真实联网搜索 (中文维基百科 + DuckDuckGo, 均支持 CORS) ---------------- */
  var SEARCH_CACHE = {};       /* q -> { data, secs }, 避免后退/前进时重复请求 */
  var SEARCH_CACHE_KEYS = [];
  var WIKI_SNAPSHOTS = {};     /* 词条标题 -> { html, url }, 供站内快照使用 */
  var REAL_SNAPSHOTS = {};     /* 真实 URL -> { title, html, text, source }, 搜索结果点击后内嵌快照 */
  var REAL_SNAP_KEYS = [];

  function snapPut(url, title, snipHtml, snipText, source, date) {
    if (!url || !title) return;
    if (!REAL_SNAPSHOTS[url]) REAL_SNAP_KEYS.push(url);
    REAL_SNAPSHOTS[url] = { title: title, html: snipHtml || null, text: snipText || '', source: source || '', date: date || '' };
    while (REAL_SNAP_KEYS.length > 80) delete REAL_SNAPSHOTS[REAL_SNAP_KEYS.shift()];
  }

  function cachePut(q, data, secs) {
    if (!SEARCH_CACHE[q]) SEARCH_CACHE_KEYS.push(q);
    SEARCH_CACHE[q] = { data: data, secs: secs };
    while (SEARCH_CACHE_KEYS.length > 20) delete SEARCH_CACHE[SEARCH_CACHE_KEYS.shift()];
  }

  /* 维基百科 snippet 仅保留 <span class="searchmatch"> 高亮 (转成 <em>), 其余一律转义 */
  function sanitizeSnippet(s) {
    var t = String(s == null ? '' : s)
      .replace(/<span class="searchmatch">/gi, '\x01')
      .replace(/<\/span>/gi, '\x02');
    return esc(t).replace(/\x01/g, '<em>').replace(/\x02/g, '</em>');
  }

  /* 带 6 秒超时的 JSON 请求; 任何失败都 resolve(null), 不抛异常 */
  function fetchJson(url) {
    return new Promise(function (resolve) {
      var settled = false;
      var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (ctrl) { try { ctrl.abort(); } catch (e) {} }
        finish(null);
      }, 6000);
      function finish(v) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(v);
      }
      try {
        if (typeof fetch !== 'function') { finish(null); return; }
        fetch(url, ctrl ? { signal: ctrl.signal } : undefined).then(function (resp) {
          if (!resp || !resp.ok) { finish(null); return null; }
          return resp.json();
        }).then(function (json) {
          if (json != null) finish(json);
        }).catch(function () { finish(null); });
      } catch (e) { finish(null); }
    });
  }

  function wikiPageUrl(title) {
    return 'https://zh.wikipedia.org/wiki/' + encodeURIComponent(String(title).replace(/ /g, '_'));
  }

  function fetchWiki(q) {
    var api = 'https://zh.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*' +
      '&srlimit=8&srprop=snippet&srsearch=' + encodeURIComponent(q);
    return fetchJson(api).then(function (data) {
      var arr = (data && data.query && data.query.search) || [];
      var out = [];
      arr.forEach(function (it) {
        var title = String((it && it.title) || '').trim();
        if (!title) return;
        var pageUrl = wikiPageUrl(title);
        var snippetHtml = sanitizeSnippet(it.snippet);
        WIKI_SNAPSHOTS[title] = { html: snippetHtml, url: pageUrl };
        out.push({ title: title, snippetHtml: snippetHtml, url: pageUrl, source: 'wiki' });
      });
      return out;
    });
  }

  function fetchDDG(q) {
    var api = 'https://api.duckduckgo.com/?format=json&no_html=1&skip_disambig=1&q=' + encodeURIComponent(q);
    return fetchJson(api).then(function (data) {
      var out = [];
      if (!data) return out;
      if (data.AbstractText && data.AbstractURL) {
        out.push({
          title: String(data.Heading || q), snippetText: String(data.AbstractText),
          url: String(data.AbstractURL), source: 'ddg'
        });
      }
      var topics = [];
      (function flatten(list) {
        (list || []).forEach(function (t) {
          if (!t) return;
          if (t.Topics) flatten(t.Topics);
          else if (t.Text && t.FirstURL) topics.push(t);
        });
      })(data.RelatedTopics);
      topics.slice(0, 6).forEach(function (t) {
        var text = String(t.Text);
        var dash = text.indexOf(' - ');
        out.push({
          title: dash > 0 ? text.slice(0, dash) : text.slice(0, 40),
          snippetText: text, url: String(t.FirstURL), source: 'ddg'
        });
      });
      return out;
    });
  }

  /* 并行请求两个数据源, 按链接去重合并; >=1 条真实结果即成功, 否则返回 null */
  function fetchRealResults(q) {
    if (typeof Promise === 'undefined') return null;
    if (!Promise.allSettled) return Promise.resolve(null);
    return Promise.allSettled([fetchWiki(q), fetchDDG(q)]).then(function (settled) {
      var items = [], seen = {}, sources = [], names = ['维基百科', 'DuckDuckGo'];
      settled.forEach(function (s, i) {
        if (s.status !== 'fulfilled' || !s.value || !s.value.length) return;
        sources.push(names[i]);
        s.value.forEach(function (it) {
          if (!it.url || seen[it.url]) return;
          seen[it.url] = true;
          items.push(it);
        });
      });
      return items.length ? { items: items, sources: sources } : null;
    }).catch(function () { return null; });
  }

  /* 本机搜狗搜索代理: GET /api/search?q=...&before=YYYY (同源, http 环境下首选真实搜索路径) */
  function fetchSogou(q, before) {
    /* 协议守卫: 仅 http/https 同源环境尝试本机代理; file:// 下 fetch 必败, 直接跳过走原路径 */
    if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return null;
    if (typeof Promise === 'undefined') return null;
    var api = '/api/search?q=' + encodeURIComponent(q) + (before ? '&before=' + encodeURIComponent(before) : '');
    return fetchJson(api).then(function (data) {
      var arr = (data && data.results) || [];
      var out = [];
      arr.forEach(function (it) {
        if (!it || !it.url) return;
        out.push({
          title: String(it.title || it.url),
          snippetText: String(it.snippet || ''),
          url: String(it.url),
          date: it.date ? String(it.date) : '',
          source: 'sogou'
        });
      });
      return out;
    });
  }

  /* 搜索优先级: 搜狗代理 (仅 http) → 维基百科/DuckDuckGo → null (调用方回退离线) */
  function fetchAnyResults(q, before) {
    var sg = fetchSogou(q, before);
    if (sg) {
      return sg.then(function (items) {
        if (items && items.length) return { items: items, sources: ['搜狗'] };
        return fetchRealResults(q);   /* 搜狗失败或无结果 → 原有联网路径 */
      });
    }
    return fetchRealResults(q);
  }

  /* 真实结果页: 保持 2005 百度样式, 标题为 data-real-url 真实外网链接 */
  function pageBaiduRealResults(q, data, secs, before) {
    var items = data.items.map(function (it) {
      var snip = it.snippetHtml != null ? it.snippetHtml : hl(it.snippetText || '', q);
      var dateSpan = it.date ? '<span class="app-ie-bdr-date">' + esc(it.date) + '</span>' : '';
      var srcName = it.source === 'wiki' ? '维基百科' : (it.source === 'sogou' ? '搜狗' : 'DuckDuckGo');
      snapPut(it.url, it.title, it.snippetHtml, it.snippetText, srcName, it.date);
      var snap = it.source === 'wiki'
        ? '<span class="snap">' + link('站内快照', it.url) + '</span>' : '';
      return '<div class="app-ie-bdr-item">' +
        '<div class="t"><a data-url="' + esc(it.url) + '" title="在 IE 内通过代理打开真实网页">' + hl(it.title, q) + '</a>' +
        ' <a data-real-url="' + esc(it.url) + '" class="app-ie-ext" title="在真实浏览器新标签打开" style="font-weight:normal;font-size:11px">↗新标签</a></div>' +
        '<div class="s">' + snip + dateSpan + '</div>' +
        '<div><span class="u">' + esc(it.url) + '</span>' + snap + '</div>' +
        '</div>';
    }).join('');
    var srcText = data.sources.join('、');
    /* 搜狗路径按要求标注"搜狗实时检索"; 维基/DDG 保持原有带间隔格式 */
    var srcSep = (data.sources.length === 1 && data.sources[0] === '搜狗') ? '' : ' ';
    var html = baiduResultsHead(q, before) +
      '<div class="app-ie-bdr-status" style="color:#080">以下结果来自 ' + esc(srcText) + srcSep + '实时检索 ✓</div>' +
      '<div class="app-ie-bdr-count">百度为您找到相关结果约 <b>' + data.items.length + '</b> 个，用时 ' + secs + ' 秒（时间：' + beforeLabel(before) + '）</div>' +
      items + baiduResultsFoot(q);
    return { title: q + '_百度搜索', html: html };
  }

  /* 联网检索中的加载状态页 */
  function pageBaiduLoading(q, before) {
    var html = baiduResultsHead(q, before) +
      '<div class="app-ie-bdr-count">正在联网检索真实结果（搜狗 / 维基百科 / DuckDuckGo），请稍候…</div>' +
      '</div>';
    return { title: q + '_百度搜索', html: html };
  }

  /* 维基百科站内快照: 用搜索 snippet 渲染精简词条页 */
  function pageWikiSnapshot(title, snap) {
    var html =
      '<div class="app-ie-art">' +
      '<div class="app-ie-art-crumb">' + link('百度搜索', 'http://www.baidu.com') + ' &gt; 维基百科站内快照</div>' +
      '<h1>' + esc(title) + '</h1>' +
      '<div class="info">来源：中文维基百科（站内快照）</div>' +
      '<p style="text-indent:0">' + snap.html + '</p>' +
      '<div class="app-ie-art-foot"><a data-real-url="' + esc(snap.url) + '">在真实浏览器打开</a>　' +
      link('返回百度搜索', 'http://www.baidu.com') + '</div>' +
      '</div>';
    return { title: title + '_维基百科', html: html };
  }

  /* 判断 URL 是否为百度搜索并提取关键词 */
  function baiduSearchQuery(url) {
    var m = String(url).match(/^https?:\/\/([^\/]+)(\/[^?#]*)?(\?[^#]*)?/i);
    if (!m) return null;
    if (m[1].toLowerCase().replace(/^www\./, '') !== 'baidu.com') return null;
    var path = m[2] || '/', query = m[3] || '';
    if (path.indexOf('/s') !== 0 && query.indexOf('wd=') < 0) return null;
    var qm = query.match(/[?&]wd=([^&]*)/);
    var q = qm ? decodeQuery(qm[1]).trim() : '';
    return q || null;
  }

  /* ---------------- 新浪 / 网易 新闻数据 ----------------
     [标题, 日期时间, 来源, 正文第一段, 正文第二段] */
  var SINA_NEWS = [
    ['神舟六号载人飞船发射成功 航天员费俊龙聂海胜出征', '2005年10月12日 09:00', '新浪科技',
      '北京时间10月12日9时整，搭载航天员费俊龙、聂海胜的神舟六号载人飞船在酒泉卫星发射中心点火升空。约10分钟后，船箭顺利分离，飞船准确进入预定轨道，发射取得圆满成功。',
      '这是我国第二次载人航天飞行。两名航天员将在轨飞行多日，首次进入轨道舱工作和生活，并开展一系列空间科学实验。'],
    ['超级女声总决赛落幕 李宇春夺得年度总冠军', '2005年8月26日 22:30', '新浪娱乐',
      '8月26日晚，2005超级女声年度总决赛在长沙落下帷幕，成都唱区选手李宇春以超过350万条短信票数的成绩夺得总冠军，周笔畅、张靓颖分列二、三位。',
      '这档平民选秀节目今年夏天席卷全国，总决赛收视率创下省级卫视新高，“玉米”“笔迷”“凉粉”等粉丝群体成为社会热议的现象。'],
    ['联想宣布完成对IBM全球PC业务收购', '2005年5月1日 10:20', '新浪科技',
      '联想集团今日宣布，以12.5亿美元收购IBM全球个人电脑业务的交易正式完成，新联想由此成为全球第三大PC厂商，新总部位于美国纽约。',
      '收购完成后，联想获得了ThinkPad等知名品牌及IBM的全球销售网络。IBM将持有联想约18.9%的股份，双方将在销售和研发领域继续合作。'],
    ['2005年版第五套人民币即将发行 央行公布防伪特征', '2005年8月31日 15:00', '新浪财经',
      '中国人民银行今日公告，定于2005年8月31日起发行2005年版第五套人民币100元、50元、20元、10元、5元纸币和1角硬币。',
      '新版人民币在保持主图案、主色调不变的基础上，调整了防伪特征布局，增加了白水印、凹印手感线等公众防伪特征，更便于群众识别。'],
    ['人民币汇率形成机制改革启动 对美元一次性升值2%', '2005年7月21日 19:05', '新浪财经',
      '中国人民银行宣布，自7月21日起，我国开始实行以市场供求为基础、参考一篮子货币进行调节、有管理的浮动汇率制度。',
      '当日19时，人民币对美元汇率中间价调整为8.11，一次性升值2%。央行表示，人民币汇率不再盯住单一美元，形成更富弹性的汇率机制。'],
    ['青藏铁路全线铺通 预计明年7月投入试运营', '2005年10月15日 11:40', '新浪新闻',
      '10月15日，青藏铁路格尔木至拉萨段最后一排轨排铺设完毕，标志着世界上海拔最高、线路最长的高原铁路全线铺通。',
      '青藏铁路全长1956公里，其中海拔4000米以上路段达960公里，最高点唐古拉山口海拔5072米。铁路部门预计2006年7月1日开通试运营。'],
    ['网络游戏防沉迷系统开始试运行 七部委联合推动', '2005年10月20日 14:10', '新浪游戏',
      '新闻出版总署等七部委联合开发的网络游戏防沉迷系统，今日起在《传奇》《梦幻西游》等热门网络游戏中开始试运行。',
      '按照方案，未成年人累计在线游戏时间超过3小时，游戏收益将减半；超过5小时收益降为零，以此引导青少年健康游戏。'],
    ['连战率团访问大陆 国共两党时隔60年再次握手', '2005年4月29日 16:45', '新浪新闻',
      '4月29日下午，中共中央总书记胡锦涛与中国国民党主席连战在北京举行历史性会谈，这是国共两党最高领导人时隔60年后的首次会面。',
      '双方就促进两岸关系改善和发展的重大问题深入交换了意见，并共同发布“两岸和平发展共同愿景”。'],
    ['国际油价盘中突破65美元 发改委表示密切关注', '2005年8月30日 08:50', '新浪财经',
      '受飓风“卡特里娜”影响美国墨西哥湾石油生产等因素推动，纽约商品交易所原油期货价格盘中一度突破每桶65美元，再创历史新高。',
      '国家发改委有关负责人表示，将密切关注国际市场油价变化，统筹考虑各方面因素，慎重把握国内成品油价格调整时机。'],
    ['教育部：2006年高考报名人数预计突破千万大关', '2005年9月8日 10:05', '新浪教育',
      '教育部有关负责人今日透露，2006年全国普通高校招生报名人数预计将首次突破1000万大关，再创历史新高。',
      '负责人表示，明年高考将继续推进分省命题和网上录取，严厉打击考试舞弊行为，维护高考的公平与公正。'],
    ['十运会南京开幕 刘翔轻松夺得110米栏冠军', '2005年10月12日 20:15', '新浪体育',
      '第十届全国运动会在江苏南京隆重开幕。在备受关注的男子110米栏决赛中，奥运冠军刘翔以13秒10的成绩轻松夺冠。',
      '这是刘翔继雅典奥运会夺冠后收获的又一项重要冠军。赛后他表示，接下来的目标是备战2008年北京奥运会。'],
    ['陈凯歌新作《无极》首映 首日票房刷新纪录', '2005年12月15日 23:20', '新浪娱乐',
      '陈凯歌历时三年打造的魔幻巨制《无极》今日全国公映，首映当天全国票房超过2100万元，刷新了国产影片首日票房纪录。',
      '影片汇集了张柏芝、谢霆锋、真田广之、张东健等中日韩明星，号称投资超过3亿元人民币，是迄今投资最大的华语电影。'],
    ['百度登陆纳斯达克 首日股价大涨353%', '2005年8月5日 07:30', '新浪科技',
      '北京时间8月5日晚，中文搜索引擎百度正式在美国纳斯达克挂牌交易，发行价27美元，开盘即报66美元，首日收报122.54美元，涨幅达353.85%。',
      '百度上市创下中国概念股首日涨幅纪录，创始人李彦宏一夜之间跻身亿万富翁行列，“中国Google”的概念受到美国投资者热捧。'],
    ['印度洋海啸一周年 受灾各国举行悼念活动', '2005年12月26日 12:00', '新浪新闻',
      '12月26日是印度洋大地震和海啸发生一周年纪念日，印度尼西亚、泰国、斯里兰卡等受灾国家纷纷举行悼念活动，缅怀近23万名遇难者。',
      '一年过去了，灾区重建工作仍在进行。国际社会承诺的援助资金正逐步到位，但部分受灾民众仍居住在临时安置点。'],
    ['卫生部公布禽流感防控方案 要求各地加强监测', '2005年11月3日 09:25', '新浪健康',
      '卫生部今日公布《人禽流感诊疗方案（2005版）》，要求各地医疗机构加强不明原因肺炎病例监测，做到早发现、早报告、早隔离、早治疗。',
      '近期我国内蒙古、安徽、湖南等地相继发生高致病性禽流感疫情。专家强调，目前尚未发现人传人证据，公众不必恐慌，但要避免接触病死禽类。'],
    ['国产手机市场份额持续下滑 波导夏新艰难转型', '2005年9月26日 13:35', '新浪科技',
      '最新市场数据显示，国产手机厂商整体市场份额已从去年高峰时的近60%下滑至不足45%，波导、夏新等老牌厂商均出现亏损。',
      '业内人士分析，诺基亚、摩托罗拉等国际品牌价格不断下探，加上“黑手机”泛滥，国产手机赖以生存的价格优势正在丧失，转型迫在眉睫。']
  ];

  var N163_NEWS = [
    ['神舟六号胜利凯旋 返回舱成功着陆内蒙古', '2005年10月17日 04:35', '网易新闻',
      '10月17日凌晨4时33分，神舟六号载人飞船返回舱在内蒙古四子王旗主着陆场成功着陆，航天员费俊龙、聂海胜自主出舱，身体状况良好。',
      '神舟六号在轨飞行115小时32分钟，绕地球76圈，圆满完成了多人多天太空飞行任务，我国载人航天工程第二步首战告捷。'],
    ['人民币汇率改革启动 对美元升值2%', '2005年7月22日 09:10', '网易财经',
      '央行宣布人民币汇率形成机制改革方案，人民币对美元一次性升值2%，并开始参考一篮子货币进行调节。',
      '分析人士认为，汇改有利于缓解国际贸易摩擦，但短期内出口企业将面临一定压力，需要加快调整产品结构。'],
    ['超级女声引发全民热议 平民选秀走向何方', '2005年9月2日 15:40', '网易娱乐',
      '2005超级女声落幕已一周，但围绕这档节目的讨论仍在继续。支持者认为它圆了普通人的明星梦，批评者则担心过度娱乐化。',
      '据悉，多家卫视已计划明年推出类似选秀节目，广电总局表示将加强管理，防止一哄而上、恶性竞争。'],
    ['中国铁路第六次大提速方案正式公布', '2005年11月18日 10:30', '网易新闻',
      '铁道部今日公布第六次大面积提速方案，部分干线列车最高时速将达到200公里，北京至上海旅行时间有望压缩至10小时以内。',
      '此次提速将于2007年4月实施，届时将首次开行国产化“和谐号”动车组列车，标志着中国铁路进入高速时代。'],
    ['联想发布整合IBM后首份财报 业绩超预期', '2005年8月11日 18:00', '网易科技',
      '联想集团发布2005/06财年第一季度财报，这是收购IBM PC业务后的首份季报，营业额达196亿港元，同比增长234%。',
      '联想CEO沃德表示，整合进展顺利，Think品牌业务保持稳定。受利好消息刺激，联想股价在香港联交所上涨超过6%。'],
    ['农业部部署禽流感防控工作 严查活禽市场', '2005年11月5日 08:20', '网易新闻',
      '农业部召开紧急会议部署秋冬季禽流感防控工作，要求各地加强活禽市场监管，坚决关闭城区活禽交易市场。',
      '截至目前，全国已有多个省份发生禽流感疫情，扑杀家禽数百万只。农业部强调，对瞒报、迟报疫情的行为将严肃查处。'],
    ['上海合作组织峰会举行 六国元首共商合作', '2005年7月5日 21:15', '网易新闻',
      '上海合作组织成员国元首理事会第五次会议在哈萨克斯坦首都阿斯塔纳举行，六国元首就深化安全与经济合作达成多项共识。',
      '会议决定给予巴基斯坦、伊朗、印度观察员地位，并通过了打击恐怖主义、分裂主义和极端主义的合作构想。'],
    ['教育部回应高校学费质疑：将完善资助体系', '2005年9月12日 11:05', '网易教育',
      '针对社会广泛关注的高校学费问题，教育部新闻发言人表示，高校收费标准自2000年以来基本没有调整，今后也不会大幅上涨。',
      '据介绍，国家将进一步完善以“奖、贷、助、补、减”为主体的资助体系，确保没有一名学生因家庭经济困难而失学。'],
    ['成龙金喜善主演《神话》票房突破一亿元', '2005年10月8日 16:30', '网易娱乐',
      '由唐季礼执导，成龙、金喜善主演的动作大片《神话》上映两周，全国票房突破1亿元大关，成为今年国庆档最大赢家。',
      '影片讲述了一段跨越两千年的爱情故事，主题曲《美丽的神话》由成龙与金喜善合唱，迅速登上各大音乐排行榜榜首。'],
    ['微软发布Windows XP安全更新 修复多个漏洞', '2005年10月12日 03:40', '网易科技',
      '微软公司发布10月份安全公告，共推出9个安全补丁，修复了Windows XP、Office等产品中存在的多个严重漏洞。',
      '安全专家提醒，其中数个漏洞可被黑客利用远程控制用户电脑，建议用户尽快通过Windows Update安装更新。'],
    ['南京地铁一号线开通运营 全长21.7公里', '2005年9月3日 10:00', '网易新闻',
      '南京地铁一号线今日正式开通试运营，线路南起奥体中心，北至迈皋桥，全长21.7公里，共设16座车站。',
      '南京由此成为内地第六个拥有地铁的城市。试运营期间实行2元、3元、4元的分段计价，发车间隔约8分钟。'],
    ['青藏铁路创造多项世界高原铁路纪录', '2005年10月16日 14:25', '网易新闻',
      '全线铺通的青藏铁路创造了多项世界纪录：世界海拔最高的高原铁路、世界最长的高原冻土隧道、世界海拔最高的火车站。',
      '为解决冻土难题，建设者采用了以桥代路、热棒降温等多项创新技术。专家称，青藏铁路的建成是世界铁路建设史上的一大奇迹。'],
    ['电子商务立法提上日程 专家呼吁规范网上交易', '2005年11月22日 09:45', '网易科技',
      '随着淘宝网、易趣等网站的交易额快速增长，电子商务立法已提上议事日程。《电子签名法》自今年4月1日起正式实施。',
      '专家指出，目前网上购物仍面临假货泛滥、支付安全、维权困难等问题，亟需通过立法明确各方责任，保护消费者权益。'],
    ['中国男篮亚锦赛夺冠 姚明荣膺最有价值球员', '2005年9月16日 22:10', '网易体育',
      '第23届亚洲男篮锦标赛在卡塔尔多哈落幕，中国男篮在决赛中以77比61击败黎巴嫩队，以全胜战绩第14次夺得亚锦赛冠军。',
      '效力于NBA休斯敦火箭队的姚明场均贡献20.6分，无可争议地当选本届赛事最有价值球员。']
  ];

  /* ---------------- 门户首页 (新浪/网易共用) ---------------- */
  function pagePortal(cfg) {
    var navHtml = cfg.nav.map(function (n, i) {
      return link(n[0], i === 0 ? cfg.home : n[1]);
    }).join('');
    var listHtml = cfg.news.map(function (n, i) {
      return '<li' + (i < 2 ? ' class="hot"' : '') + '>' +
        '<span class="dt">(' + esc(n[1].slice(0, 10)) + ')</span>' +
        link(n[0], cfg.home + '/news/' + i + '.html') + '</li>';
    }).join('');
    var html =
      '<div class="app-ie-portal">' +
      '<div class="app-ie-ph ' + cfg.cls + '"><span class="lg">' + esc(cfg.name) + '</span><span class="dm">' + esc(cfg.domain) + '</span></div>' +
      '<div class="app-ie-nav ' + cfg.cls + '">' + navHtml + '</div>' +
      '<div class="app-ie-slogan">' + esc(cfg.slogan) + '</div>' +
      '<div class="app-ie-sec ' + cfg.cls + '">今日头条</div>' +
      '<ul class="app-ie-news">' + listHtml + '</ul>' +
      '</div>';
    return { title: cfg.title, html: html };
  }

  function pageSina() {
    return pagePortal({
      cls: 'sina', name: '新浪网', domain: 'sina.com.cn', home: 'http://www.sina.com.cn',
      title: '新浪网首页', slogan: '新闻中心　·　全球新闻，一网打尽',
      news: SINA_NEWS,
      nav: [['新闻', ''], ['体育', 'http://sports.sina.com.cn'], ['娱乐', 'http://ent.sina.com.cn'], ['财经', 'http://finance.sina.com.cn'], ['科技', 'http://tech.sina.com.cn']]
    });
  }
  function page163() {
    return pagePortal({
      cls: 'n163', name: '网易', domain: 'www.163.com', home: 'http://www.163.com',
      title: '网易首页', slogan: '网聚人的力量',
      news: N163_NEWS,
      nav: [['新闻', ''], ['体育', 'http://sports.163.com'], ['娱乐', 'http://ent.163.com'], ['财经', 'http://money.163.com'], ['科技', 'http://tech.163.com']]
    });
  }

  function pageArticle(news, idx, site, url) {
    var n = news[idx];
    if (!n) return pageError(url);
    var isSina = site === 'sina';
    var homeUrl = isSina ? 'http://www.sina.com.cn' : 'http://www.163.com';
    var siteName = isSina ? '新浪网' : '网易';
    var html =
      '<div class="app-ie-art">' +
      '<div class="app-ie-art-crumb">' + link(siteName + '首页', homeUrl) + ' &gt; 新闻中心 &gt; 正文</div>' +
      '<h1>' + esc(n[0]) + '</h1>' +
      '<div class="info">' + esc(n[1]) + '　来源：' + esc(n[2]) + '</div>' +
      '<p>' + esc(n[3]) + '</p>' +
      '<p>' + esc(n[4]) + '</p>' +
      '<p>相关专题报道请继续关注' + siteName + '，本网将在第一时间发布最新进展。（责任编辑：小编）</p>' +
      '<div class="app-ie-art-foot">' + link('返回' + siteName + '首页', homeUrl) + '</div>' +
      '</div>';
    return { title: n[0] + '_' + siteName, html: html };
  }

  /* ---------------- 腾讯网迷你首页 ---------------- */
  function pageQQ() {
    var headlines = [
      ['神舟六号发射圆满成功　腾讯网专题报道', 'http://news.qq.com/zt/2005/shenzhou6.htm'],
      ['超级女声总冠军李宇春写真集全国热销', 'http://ent.qq.com/a/20050901/000128.htm'],
      ['QQ宠物公测火爆　百万网友在线养宠', 'http://pet.qq.com/act/2005/open.htm'],
      ['《魔兽世界》国服同时在线人数突破50万', 'http://games.qq.com/a/20050720/000315.htm'],
      ['QQ2005正式版发布　新增QQ秀商城', 'http://im.qq.com/qq/2005/'],
      ['人民币汇率改革启动　人民币升值2%', 'http://finance.qq.com/a/20050721/000066.htm']
    ];
    var nav = [['新闻', 'http://news.qq.com'], ['娱乐', 'http://ent.qq.com'], ['游戏', 'http://games.qq.com'], ['女性', 'http://lady.qq.com'], ['汽车', 'http://auto.qq.com']]
      .map(function (n) { return link(n[0], n[1]); }).join('');
    var list = headlines.map(function (h) { return '<li>' + link(h[0], h[1]) + '</li>'; }).join('');
    var html =
      '<div class="app-ie-qq">' +
      '<div class="app-ie-qq-head"><span class="lg">腾讯网</span><span class="dm">QQ.COM</span></div>' +
      '<div class="app-ie-qq-nav">' + nav + '</div>' +
      '<div class="app-ie-qq-dl">' + linkHtml('<b>QQ2005 正式版 SP1</b> 火热下载中！新增视频聊天、QQ宠物功能。', 'http://im.qq.com/qq/2005/') + '</div>' +
      '<div class="app-ie-qq-sec">热点新闻</div>' +
      '<ul class="app-ie-news">' + list + '</ul>' +
      '<div class="app-ie-h123-foot">Copyright &copy; 1998-2005 Tencent Inc. All Rights Reserved</div>' +
      '</div>';
    return { title: '腾讯网首页', html: html };
  }

  /* ---------------- IE6 错误页 ---------------- */
  function pageError(url) {
    var html =
      '<div class="app-ie-err">' +
      '<h2>该页无法显示</h2>' +
      '<div class="msg">您要查看的网页目前不可用。这可能是由于网站遇到技术问题，或者您需要调整浏览器设置。</div>' +
      '<hr>' +
      '<div>请尝试以下操作：</div>' +
      '<ul>' +
      '<li>单击 <a data-refresh>刷新</a> 按钮，或稍后重试。</li>' +
      '<li>如果您在地址栏中输入了网页地址，请检查其拼写是否正确。</li>' +
      '<li>要查看连接设置，请单击“工具”菜单，然后单击“Internet 选项”。</li>' +
      '<li>如果您的网络管理员已启用，Microsoft Windows 可以检查网络并自动发现网络连接设置。</li>' +
      '</ul>' +
      '<hr>' +
      '<div class="dns">找不到服务器或 DNS 错误<br>Internet Explorer</div>' +
      '</div>';
    return { title: '该页无法显示', html: html };
  }

  /* ---------------- 通用网站生成器: 未知域名按关键词分类, 离线生成 2005 风格站点 ---------------- */
  var GEN_CATS = [
    { id: 'mail', kws: ['mail', '邮箱', '126', 'hotmail', 'yeah.net', 'eyou'] },
    { id: 'music', kws: ['music', 'mp3', '千千', 'ttplayer', 'player', 'yinyue', '音乐', 'kugou', '酷狗', 'kuwo'] },
    { id: 'game', kws: ['game', '17173', '联众', 'lianzhong', 'play', 'gyyx', 'youxi', '游戏'] },
    { id: 'soft', kws: ['soft', 'download', 'xiazai', '下载', '华军', 'huajun', '天空', 'tiankong', 'skycn', 'onlinedown', 'crsky', 'xunlei', '迅雷', 'pconline', 'yesky'] },
    { id: 'weather', kws: ['weather', '天气', 'tianqi'] },
    { id: 'train', kws: ['train', '火车', 'huoche', 'lieche', 'rail', '12306', 'chetong', 'tieyou'] }
  ];
  var BRAND_MAP = {
    '163': '网易', '126': '126', 'sina': '新浪', 'sohu': '搜狐', 'baidu': '百度', 'qq': '腾讯',
    'ttplayer': '千千静听', 'lianzhong': '联众世界', 'weather': '中国天气', 'huoche': '火车',
    'ip138': 'IP138', 'hotmail': 'Hotmail', 'gyyx': '光宇游戏', '17173': '17173',
    'xunlei': '迅雷', 'skycn': '天空', 'huajun': '华军', 'onlinedown': '华军', 'mp3': 'MP3'
  };
  var CAT_SUFFIX = { mail: '邮箱', game: ' 游戏网', music: ' 音乐网', soft: '下载站', weather: '网', train: '票务网', portal: '网' };
  var SITE_NAME_OVERRIDE = {
    'lianzhong.com': '联众世界', 'ttplayer.com': '千千静听官网', 'gyyx.cn': '光宇游戏官网',
    'weather.com.cn': '中国天气网', 'hotmail.com': 'Hotmail 邮箱'
  };
  var CAT_SLOGAN = {
    mail: '安全 稳定 快速的免费邮箱', music: '新歌首发 · 在线试听', game: '网络游戏第一门户',
    soft: '绿色软件 安全下载', weather: '天气预报 准确及时', train: '列车时刻 在线查询', portal: '网聚天下事'
  };
  var CAT_CRUMB = { mail: '邮件', music: '试听', soft: '下载', game: '游戏新闻', weather: '天气资讯', train: '铁路资讯', portal: '新闻中心' };
  var CAT_NAV = {
    mail: ['邮箱首页', '收件箱', '写信', '通讯录', '网盘'],
    music: ['音乐首页', '新歌榜', '歌手大全', '音乐下载', '歌词搜索'],
    game: ['游戏首页', '新网游', '游戏新闻', '新服预告', '玩家论坛'],
    soft: ['软件首页', '最新软件', '下载排行', '系统工具', '网络软件'],
    weather: ['天气首页', '城市预报', '天气新闻', '生活指数', '气象知识'],
    train: ['首页', '时刻查询', '余票查询', '票价查询', '乘车指南'],
    portal: ['首页', '新闻', '体育', '娱乐', '财经', '科技']
  };

  function classifyHost(host) {
    var low = String(host).toLowerCase();
    for (var i = 0; i < GEN_CATS.length; i++) {
      var kws = GEN_CATS[i].kws;
      for (var j = 0; j < kws.length; j++) {
        if (low.indexOf(kws[j]) >= 0) return GEN_CATS[i].id;
      }
    }
    return 'portal';
  }
  /* 取域名主标识: mail.163.com -> 163 ; weather.com.cn -> weather */
  function baseLabel(host) {
    var parts = String(host).toLowerCase().split('.');
    if (parts.length <= 1) return parts[0] || 'site';
    var tail2 = parts[parts.length - 2] + '.' + parts[parts.length - 1];
    var twoPart = { 'com.cn': 1, 'net.cn': 1, 'org.cn': 1, 'gov.cn': 1, 'edu.cn': 1, 'com.hk': 1, 'com.tw': 1 };
    var base = parts.slice(0, parts.length - (twoPart[tail2] ? 2 : 1));
    return base.length ? base[base.length - 1] : parts[0];
  }
  function genSiteInfo(host, urlHost) {
    var cat = classifyHost(host);
    var label = baseLabel(host);
    var brand = BRAND_MAP[label] || (label.charAt(0).toUpperCase() + label.slice(1));
    var name = SITE_NAME_OVERRIDE[host] || (brand + CAT_SUFFIX[cat]);
    return { host: host, urlHost: urlHost, cat: cat, label: label, brand: brand, name: name };
  }

  /* ---- 生成器数据池 ---- */
  var GEN_NEWS_POOL = {
    game: [
      '《魔兽世界》国服运营一周年庆典活动启动', '《梦幻西游》新资料片即将全服上线',
      '《传奇世界》公会争霸赛报名正式开始', '《泡泡堂》夏日新版本新增十张地图',
      '《劲乐团》全国网吧联赛火热进行中', '《剑侠情缘网络版》新门派资料首次曝光',
      '《魔力宝贝》怀旧服务器人气持续爆棚', '中国电竞代表团出征世界总决赛'
    ],
    soft: [
      '电信网通双线路下载镜像正式开通', '本月软件下载排行榜出炉 下载工具领跑',
      '专家提醒：下载软件请认准官方站点', '装机必备软件大全专题上线',
      '多款常用软件发布2005年度更新版', '本站全面启用新下载服务器 速度提升'
    ],
    weather: [
      '北方冷空气南下 多地将迎明显降温', '东南沿海局部地区将有大到暴雨',
      '未来一周黄淮地区持续晴热高温', '秋收时节全国大部地区天气晴好',
      '青藏线沿线风雪天气 出行请注意', '北京今日空气质量良好 适宜户外活动'
    ],
    train: [
      '铁路第六次大提速方案正式公布', '国庆黄金周加开临客列车二百余列',
      '动车组车票预售期调整为十天', '春运火车票电话订票系统试运行',
      '沪宁线增开多趟城际特快列车', '学生票优惠区间变更办理指南'
    ],
    portal: [
      '神六载人飞行任务取得圆满成功', '人民币汇率形成机制改革正式启动',
      '超级女声现象引发社会广泛讨论', '联想完成收购IBM全球PC业务',
      '国际油价持续走高 发改委作出回应', '教育部：明年高考报名预计破千万',
      '国产手机厂商艰难转型谋求突围', '十运会南京开幕 刘翔轻松夺冠'
    ]
  };
  var GEN_SONGS = [
    ['童话', '光良'], ['夜曲', '周杰伦'], ['不得不爱', '潘玮柏 / 弦子'], ['宁夏', '梁静茹'],
    ['寂寞沙洲冷', '周传雄'], ['千年之恋', 'F.I.R 飞儿乐团'], ['想唱就唱', '张含韵'],
    ['倔强', '五月天'], ['两只蝴蝶', '庞龙'], ['老鼠爱大米', '香香']
  ];
  var GEN_SOFTS = [
    ['迅雷', '5.0.0.72 正式版'], ['网际快车 FlashGet', '1.71 简体中文版'], ['千千静听', '4.6.0'],
    ['暴风影音', '2005 全功能完美版'], ['WinRAR', '3.50 简体中文版'], ['腾讯 QQ', '2005 Beta3'],
    ['紫光拼音输入法', '3.0'], ['超级兔子魔法设置', '7.15'], ['ACDSee', '7.0 迷你版'], ['Foxmail', '5.0 正式版']
  ];
  var GEN_MAILS = [
    ['系统管理员', '【系统通知】您的邮箱已免费升级至1G容量', '10月16日'],
    ['编辑部', '每周精选：本周最值得一看的精彩内容', '10月15日'],
    ['老同学 张伟', '十年聚首：同学聚会邀请函', '10月14日'],
    ['人事部', '会议通知：周五下午三点项目组例会', '10月13日'],
    ['账单中心', '您的话费账单已生成，请及时查收', '10月12日']
  ];
  var GEN_SERVERS = [
    ['电信一区', '龙腾四海', '10月18日 14:00', '火爆'], ['网通二区', '风云再起', '10月19日 15:00', '新服'],
    ['电信三区', '傲视群雄', '10月20日 12:00', '推荐'], ['双线一区', '王者归来', '10月21日 18:00', '预约中'],
    ['网通一区', '纵横天下', '10月22日 10:00', '预约中']
  ];
  var GEN_GAMES_HOT = ['魔兽世界', '梦幻西游', '传奇世界', '泡泡堂', '劲乐团', '魔力宝贝', '冒险岛', '大话西游II'];
  var GEN_WEATHERS = ['晴', '多云', '阴', '小雨', '中雨', '雷阵雨', '晴转多云', '多云转阴'];
  var GEN_MID = [
    '业内人士分析认为，此事之所以引发广泛关注，与当前的社会热点密不可分。专家建议广大网友理性看待，以权威部门发布的信息为准。',
    '记者走访了多位相关人士。有受访者表示，对事态的发展保持乐观；也有网友认为，还需要进一步观察后续的变化情况。',
    '据了解，事件发生后，有关方面高度重视，已经着手开展相关工作，并及时向社会公布了最新情况。',
    '在各大论坛上，网友们就此展开了热烈讨论。多数网友表示理解和支持，也有部分网友提出了自己的看法和建议。'
  ];
  var GEN_END = [
    '截至记者发稿时，相关话题的讨论仍在继续。本网将持续关注事件进展，第一时间为网友带来最新报道。（责任编辑：小李）',
    '更多详细内容，请关注本网后续专题报道，欢迎网友在下方留言区发表自己的看法。（责任编辑：小王）',
    '本网记者将继续跟踪报道此事，敬请广大网友关注。（责任编辑：小张）'
  ];

  function rotate(arr, key) {
    var h = hashStr(String(key)) % arr.length;
    return arr.slice(h).concat(arr.slice(0, h));
  }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function genDate(h) {
    return '2005年' + (1 + h % 12) + '月' + (1 + (h >> 4) % 28) + '日 ' + p2(8 + (h >> 8) % 14) + ':' + p2((h >> 12) % 60);
  }
  function articleUrl(info, i) { return 'http://' + info.urlHost + '/article/' + i + '.shtml'; }

  /* 各类站点的主列表条目 (与 /article/i 一一对应, 保证标题一致) */
  function genItems(info) {
    if (info.cat === 'music') return rotate(GEN_SONGS, info.host).map(function (s) { return '《' + s[0] + '》' + s[1]; });
    if (info.cat === 'soft') return rotate(GEN_SOFTS, info.host).map(function (s) { return s[0] + ' ' + s[1]; });
    if (info.cat === 'mail') return rotate(GEN_MAILS, info.host).map(function (m) { return m[1]; });
    return rotate(GEN_NEWS_POOL[info.cat], info.host);
  }

  /* 生成站点公共头尾 */
  function genHome(info, bodyHtml) {
    var navHtml = CAT_NAV[info.cat].map(function (n, i) {
      return link(n, i === 0 ? 'http://' + info.urlHost + '/' : 'http://' + info.urlHost + '/list/' + i + '.html');
    }).join('');
    var html =
      '<div class="app-ie-gen">' +
      '<div class="app-ie-gh ' + info.cat + '"><span class="lg">' + esc(info.name) + '</span><span class="dm">' + esc(info.host) + '</span></div>' +
      '<div class="app-ie-gnav ' + info.cat + '">' + navHtml + '</div>' +
      '<div class="app-ie-slogan">' + esc(CAT_SLOGAN[info.cat]) + '　·　' + esc(info.host) + '</div>' +
      bodyHtml +
      '<div class="app-ie-h123-foot">Copyright &copy; 2005 ' + esc(info.host) + ' 版权所有　本站内容为怀旧模拟演示</div>' +
      '</div>';
    return { title: info.name + '首页', html: html };
  }
  function sideBox(title, inner) {
    return '<div class="app-ie-gbox"><div class="app-ie-gbox-t">' + esc(title) + '</div>' + inner + '</div>';
  }
  function newsListHtml(items, info, salt) {
    var h = hashStr(info.host + '#' + (salt || ''));
    return items.map(function (t, k) {
      var j = (k + h) % items.length;
      return '<li' + (k < 2 ? ' class="hot"' : '') + '>' +
        '<span class="dt">(' + esc(genDate(hashStr(info.host + '@' + j)).slice(0, 10)) + ')</span>' +
        link(items[j], articleUrl(info, j)) + '</li>';
    }).join('');
  }

  /* ---- 邮箱登录页 ---- */
  function pageMail(info) {
    var mails = rotate(GEN_MAILS, info.host);
    var rows = mails.slice(0, 3).map(function (m, k) {
      return '<tr><td style="width:26px"><input type="checkbox"></td><td>' + esc(m[0]) + '</td>' +
        '<td>' + link(m[1], articleUrl(info, k)) + ' <b style="color:#c00">(未读)</b></td>' +
        '<td style="width:70px">' + esc(m[2]) + '</td></tr>';
    }).join('');
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-gbox"><div class="app-ie-gbox-t">登录' + esc(info.name) + '</div>' +
      '<div style="text-align:center;padding:8px 0">用户名：<input class="app-ie-ipt" data-mail-user value="test@' + esc(info.host) + '">　' +
      '密码：<input class="app-ie-ipt" type="password" value="123456">　' +
      '<button class="app-ie-mini-btn" data-mail-login>登 录</button>　' +
      link('注册新邮箱', 'http://' + info.urlHost + '/list/2.html') + '</div></div>' +
      '<div class="app-ie-gsec mail">收件箱（3 封未读）</div>' +
      '<table class="app-ie-gtbl"><tr><th></th><th>发件人</th><th>主题</th><th>日期</th></tr>' + rows + '</table>' +
      '</div><div class="app-ie-gside">' +
      sideBox('邮箱特色', '<ul class="app-ie-news"><li>1G 超大容量</li><li>30M 超大附件</li><li>垃圾邮件拦截率 98%</li><li>邮件到达短信提醒</li></ul>') +
      sideBox('系统公告', '<ul class="app-ie-news"><li>' + link('邮箱容量免费升级公告', articleUrl(info, 3)) + '</li><li>' + link('反垃圾邮件系统上线', articleUrl(info, 4)) + '</li></ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 游戏资讯站 ---- */
  function pageGame(info) {
    var items = genItems(info);
    var srvRows = rotate(GEN_SERVERS, info.host).slice(0, 4).map(function (s) {
      return '<tr><td>' + esc(s[0]) + '</td><td><b>' + esc(s[1]) + '</b></td><td>' + esc(s[2]) + '</td>' +
        '<td style="color:#c00">' + esc(s[3]) + '</td></tr>';
    }).join('');
    var hot = rotate(GEN_GAMES_HOT, info.host).map(function (g, k) {
      return '<li>' + (k + 1) + '. ' + link(g, 'http://' + info.urlHost + '/list/2.html') + '</li>';
    }).join('');
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-gsec game">新服预告</div>' +
      '<table class="app-ie-gtbl"><tr><th>服务器</th><th>名称</th><th>开服时间</th><th>状态</th></tr>' + srvRows + '</table>' +
      '<div class="app-ie-gsec game">游戏新闻</div>' +
      '<ul class="app-ie-news">' + newsListHtml(items, info) + '</ul>' +
      '</div><div class="app-ie-gside">' +
      sideBox('热门游戏排行', '<ul class="app-ie-news">' + hot + '</ul>') +
      sideBox('新手指南', '<ul class="app-ie-news"><li>' + link('游戏下载与安装教程', 'http://' + info.urlHost + '/list/4.html') + '</li><li>' + link('防沉迷系统常见问题', 'http://' + info.urlHost + '/list/3.html') + '</li><li>' + link('账号安全保护须知', 'http://' + info.urlHost + '/list/4.html') + '</li></ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 音乐站 ---- */
  function pageMusic(info) {
    var songs = rotate(GEN_SONGS, info.host);
    var rows = songs.map(function (s, k) {
      return '<tr><td style="width:34px;color:#c00;font-weight:bold">' + (k + 1) + '</td>' +
        '<td>' + link('《' + s[0] + '》', articleUrl(info, k)) + '</td><td>' + esc(s[1]) + '</td>' +
        '<td style="width:56px"><button class="app-ie-mini-btn" data-listen="' + esc(s[0] + ' - ' + s[1]) + '">试听</button></td></tr>';
    }).join('');
    var singers = rotate(['周杰伦', '光良', '梁静茹', '五月天', 'S.H.E', '林俊杰', '刀郎', '张含韵'], info.host).map(function (s, k) {
      return '<li>' + (k + 1) + '. ' + link(s, 'http://' + info.urlHost + '/list/2.html') + '</li>';
    }).join('');
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-gsec music">新歌榜 TOP10</div>' +
      '<table class="app-ie-gtbl"><tr><th>排名</th><th>歌曲</th><th>歌手</th><th>试听</th></tr>' + rows + '</table>' +
      '</div><div class="app-ie-gside">' +
      sideBox('热门歌手', '<ul class="app-ie-news">' + singers + '</ul>') +
      sideBox('音乐工具', '<ul class="app-ie-news"><li>' + link('歌词搜索', 'http://' + info.urlHost + '/list/5.html') + '</li><li>' + link('彩铃下载', 'http://' + info.urlHost + '/list/4.html') + '</li><li>' + link('歌手大全', 'http://' + info.urlHost + '/list/2.html') + '</li></ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 软件下载站 ---- */
  function pageSoft(info) {
    var softs = rotate(GEN_SOFTS, info.host);
    var rows = softs.map(function (s, k) {
      var h = hashStr(info.host + '$' + k);
      return '<tr><td>' + link(s[0] + ' ' + s[1], articleUrl(info, k)) + '</td>' +
        '<td style="width:56px">' + (2 + h % 38) + '.' + (h % 10) + 'MB</td>' +
        '<td style="width:86px">' + esc(genDate(h).slice(0, 10)) + '</td>' +
        '<td style="width:56px"><button class="app-ie-mini-btn" data-download="' + esc(s[0]) + '">下载</button></td></tr>';
    }).join('');
    var rank = rotate(GEN_SOFTS, info.host + '#rank').slice(0, 6).map(function (s, k) {
      return '<li>' + (k + 1) + '. ' + link(s[0], 'http://' + info.urlHost + '/list/3.html') + '</li>';
    }).join('');
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-gsec soft">最新软件</div>' +
      '<table class="app-ie-gtbl"><tr><th>软件名称</th><th>大小</th><th>更新日期</th><th>下载</th></tr>' + rows + '</table>' +
      '</div><div class="app-ie-gside">' +
      sideBox('下载排行', '<ul class="app-ie-news">' + rank + '</ul>') +
      sideBox('下载提示', '<ul class="app-ie-news"><li>本站软件均经杀毒检测</li><li>建议使用下载工具提速</li><li>电信/网通镜像任选</li></ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 天气预报页 ---- */
  function pageWeather(info) {
    var h = hashStr(info.host);
    var city = info.brand === '中国天气' ? '北京' : info.brand;
    var days = ['今天（周一）', '明天（周二）', '后天（周三）', '周四', '周五'];
    var rows = days.map(function (d, k) {
      var hh = hashStr(info.host + '~' + k);
      var hi = 15 + hh % 14, lo = hi - 5 - (hh >> 3) % 5;
      return '<tr><td>' + d + '</td><td>' + esc(GEN_WEATHERS[hh % GEN_WEATHERS.length]) + '</td>' +
        '<td>' + lo + '℃ ~ ' + hi + '℃</td><td>' + esc(['微风', '3-4级', '4-5级', '小于3级'][hh % 4]) + '</td></tr>';
    }).join('');
    var curHi = 15 + h % 14;
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-wcur"><b>' + esc(city) + '</b> 今日天气：' + esc(GEN_WEATHERS[h % GEN_WEATHERS.length]) +
      '　' + (curHi - 6) + '℃ ~ ' + curHi + '℃　微风　<span style="color:#999;font-size:12px">（演示数据）</span></div>' +
      '<div class="app-ie-gsec weather">未来五天天气预报</div>' +
      '<table class="app-ie-gtbl"><tr><th>日期</th><th>天气</th><th>气温</th><th>风力</th></tr>' + rows + '</table>' +
      '</div><div class="app-ie-gside">' +
      sideBox('生活指数', '<ul class="app-ie-news"><li>穿衣：适宜穿长袖衬衫</li><li>洗车：适宜洗车</li><li>紫外线：中等</li><li>晨练：适宜</li></ul>') +
      sideBox('天气新闻', '<ul class="app-ie-news">' + newsListHtml(genItems(info), info, 'side') + '</ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 列车时刻查询页 ---- */
  function pageTrain(info, query) {
    var from = '北京', to = '上海';
    var fm = String(query || '').match(/[?&]from=([^&]*)/);
    var tm = String(query || '').match(/[?&]to=([^&]*)/);
    if (fm) { var f1 = decodeQuery(fm[1]).trim(); if (f1) from = f1; }
    if (tm) { var t1 = decodeQuery(tm[1]).trim(); if (t1) to = t1; }
    var prefixes = ['G', 'D', 'T', 'K', 'Z'];
    var rows = '';
    for (var k = 0; k < 6; k++) {
      var hh = hashStr(from + to + '#' + k);
      var dep = 6 + k * 2 + hh % 3;
      var durH = 4 + hh % 8, durM = (hh >> 3) % 60;
      var arr = dep + durH;
      var seat = 40 + hh % 160;
      rows += '<tr><td><b>' + prefixes[hh % prefixes.length] + (1 + hh % 900) + '</b></td>' +
        '<td>' + esc(from) + '</td><td>' + esc(to) + '</td>' +
        '<td>' + p2(dep % 24) + ':' + p2((hh >> 5) % 60) + '</td>' +
        '<td>' + p2(arr % 24) + ':' + p2((hh >> 9) % 60) + (arr >= 24 ? '<br>次日' : '') + '</td>' +
        '<td>' + durH + '小时' + durM + '分</td>' +
        '<td>￥' + seat + '</td><td>￥' + (seat + 110) + '</td><td>￥' + (seat + 190) + '</td></tr>';
    }
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-gbox"><div class="app-ie-gbox-t">列车时刻查询</div>' +
      '<div style="text-align:center;padding:6px 0">出发地：<input class="app-ie-ipt" data-train-from value="' + esc(from) + '">　' +
      '目的地：<input class="app-ie-ipt" data-train-to value="' + esc(to) + '">　' +
      '<button class="app-ie-mini-btn" data-train-btn data-train-base="http://' + esc(info.urlHost) + '/">查 询</button></div></div>' +
      '<div class="app-ie-gsec train">' + esc(from) + ' → ' + esc(to) + '　查询结果（6 趟列车，演示数据）</div>' +
      '<table class="app-ie-gtbl"><tr><th>车次</th><th>出发站</th><th>到达站</th><th>开车</th><th>到达</th><th>历时</th><th>硬座</th><th>硬卧</th><th>软卧</th></tr>' + rows + '</table>' +
      '</div><div class="app-ie-gside">' +
      sideBox('温馨提示', '<ul class="app-ie-news"><li>开车前10分钟停止检票</li><li>学生票请出示学生证</li><li>数据仅供参考，以车站公告为准</li></ul>') +
      sideBox('铁路新闻', '<ul class="app-ie-news">' + newsListHtml(genItems(info), info, 'side') + '</ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 综合门户首页 (默认类别) ---- */
  function pagePortalGen(info) {
    var items = genItems(info);
    var pics = [0, 1, 2].map(function (k) {
      return '<li>' + link('[图] ' + items[k], articleUrl(info, k)) + '</li>';
    }).join('');
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-gsec portal">今日头条</div>' +
      '<ul class="app-ie-news">' + newsListHtml(items, info) + '</ul>' +
      '</div><div class="app-ie-gside">' +
      sideBox('图片新闻', '<ul class="app-ie-news">' + pics + '</ul>') +
      sideBox('本站公告', '<ul class="app-ie-news"><li>本站新版上线欢迎体验</li><li>诚邀各网站交换友情链接</li></ul>') +
      sideBox('友情链接', '<ul class="app-ie-news"><li>' + link('hao123网址之家', 'http://www.hao123.com') + '</li><li>' + link('百度搜索', 'http://www.baidu.com') + '</li></ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 列表页 (导航栏各频道) ---- */
  function pageGenList(info, idx) {
    var navs = CAT_NAV[info.cat];
    var ni = navs.length > 1 ? idx % (navs.length - 1) + 1 : 0;
    var secName = navs[ni];
    var items = genItems(info);
    var body =
      '<div class="app-ie-gwrap"><div class="app-ie-gmain">' +
      '<div class="app-ie-gsec ' + info.cat + '">' + esc(secName) + '</div>' +
      '<ul class="app-ie-news">' + newsListHtml(items, info, secName) + '</ul>' +
      '</div><div class="app-ie-gside">' +
      sideBox('热门推荐', '<ul class="app-ie-news">' + items.slice(0, 5).map(function (t, k) {
        return '<li>' + link(t, articleUrl(info, k)) + '</li>';
      }).join('') + '</ul>') +
      '</div></div>';
    return genHome(info, body);
  }

  /* ---- 文章页: 复用 app-ie-art 样式, 正文按标题+类别模板生成 ---- */
  function genArticleBody(title, info) {
    var h = hashStr(title + '|' + info.host);
    var ps;
    if (info.cat === 'music') {
      ps = [
        '“' + title + '”自推出以来深受广大网友喜爱，连续多周位居本站新歌榜前列，累计试听次数已突破 ' + (50 + h % 950) + ' 万人次。',
        '不少歌迷在留言中表示，这首歌曲旋律优美、歌词感人，是 2005 年不可多得的优秀作品。本站提供在线试听服务，点击新歌榜中的“试听”按钮即可播放。',
        '本站音乐频道每日更新最新歌曲与排行榜，欢迎收藏本站，第一时间试听最新流行金曲。'
      ];
    } else if (info.cat === 'soft') {
      ps = [
        title + ' 是一款深受网友欢迎的软件，界面友好、功能实用，是许多网友装机时的必备选择。',
        '本站提供该软件的本地下载服务，电信、网通双线路镜像，下载速度快，经检测无插件、无病毒，请放心使用。据统计，本月已有 ' + (1000 + h % 9000) + ' 人次从本站下载，网友好评率达 9' + (h % 10) + '%。',
        '下载前请确认您的操作系统为 Windows 98/2000/XP，建议使用迅雷或网际快车等下载工具以获得更快的下载速度。'
      ];
    } else if (info.cat === 'mail') {
      ps = [
        '尊敬的用户，您好！这是一封来自' + info.name + '的演示邮件，用于展示怀旧邮箱的邮件阅读界面。',
        '邮件主题“' + title + '”暂无更多详细内容。您可以通过页面顶部的导航返回收件箱、撰写新邮件或查看通讯录。',
        '（本邮件为模拟演示内容，系统信箱请勿回复。）'
      ];
    } else {
      ps = [
        '据' + info.name + '记者报道，近日，“' + title + '”成为众多网友关注的焦点，相关话题在各大论坛和聊天室持续升温，不少网友纷纷发表自己的看法。',
        GEN_MID[h % GEN_MID.length],
        GEN_END[(h >> 4) % GEN_END.length]
      ];
    }
    return ps.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  }
  function pageGenArticle(info, idx) {
    var items = genItems(info);
    var i = ((idx % items.length) + items.length) % items.length;
    var title = items[i];
    var rel = '';
    for (var k = 1; k <= 3; k++) {
      var j = (i + k) % items.length;
      rel += '<li>' + link(items[j], articleUrl(info, j)) + '</li>';
    }
    var html =
      '<div class="app-ie-art">' +
      '<div class="app-ie-art-crumb">' + link(info.name + '首页', 'http://' + info.urlHost + '/') + ' &gt; ' + esc(CAT_CRUMB[info.cat]) + ' &gt; 正文</div>' +
      '<h1>' + esc(title) + '</h1>' +
      '<div class="info">' + esc(genDate(hashStr(info.host + '@' + i))) + '　来源：' + esc(info.name) + '</div>' +
      genArticleBody(title, info) +
      '<div class="app-ie-gsec ' + info.cat + '">相关阅读</div>' +
      '<ul class="app-ie-news">' + rel + '</ul>' +
      '<div class="app-ie-art-foot">' + link('返回' + info.name + '首页', 'http://' + info.urlHost + '/') + '</div>' +
      '</div>';
    return { title: title + '_' + info.name, html: html };
  }

  /* ---- 搜索结果内嵌快照页: 标题 + 摘要 + 来源域名 + 扩展正文 + 真实打开按钮 ---- */
  function stripTags(s) { return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }
  var SNAP_MID = [
    '据了解，该话题近期在多个网站引发讨论，网友们通过论坛、博客和即时通讯工具交流看法，关注度持续上升。',
    '相关信息显示，不少网友对此表现出浓厚兴趣，并在各大社区留言讨论，希望了解更多背景资料和最新进展。',
    '围绕这一话题，多家网站推出了相关报道和专题，编辑整理了各方观点，供广大网友参考。',
    '有网友表示，希望有关方面能提供更加详细的说明；也有网友分享了自己的经验和见解。'
  ];
  var SNAP_END = [
    '本文内容系根据公开搜索摘要自动整理生成，仅供参考。如需查阅完整原文，请点击下方按钮，在真实浏览器中访问来源网站。',
    '由于本站为怀旧模拟环境，无法直接访问外部服务器，以上为根据摘要扩展生成的预览内容，完整信息请以来源网站为准。'
  ];
  function pageRealSnapshot(url, snap) {
    var hm = String(url).match(/^https?:\/\/([^\/]+)/i);
    var host = hm ? hm[1] : url;
    var sumHtml = snap.html != null ? snap.html : esc(snap.text);
    var plain = stripTags(sumHtml);
    var h = hashStr(snap.title + '|' + host);
    var ps = [
      '您正在查看“' + esc(snap.title) + '”的网页快照。该网页来自 ' + esc(host) + '，' +
        (plain ? '其内容摘要如上所示。' : '暂未获取到内容摘要。') +
        '为了方便您在模拟浏览器中阅读，本站根据摘要自动扩展生成了以下参考内容。',
      '围绕“' + esc(snap.title) + '”，' + esc(SNAP_MID[h % SNAP_MID.length]),
      esc(SNAP_END[(h >> 4) % SNAP_END.length])
    ];
    var html =
      '<div class="app-ie-art">' +
      '<div class="app-ie-art-crumb">' + link('百度搜索', 'http://www.baidu.com') + ' &gt; 网页快照</div>' +
      '<h1>' + esc(snap.title) + '</h1>' +
      '<div class="info">来源：' + esc(host) + (snap.date ? '　·　' + esc(snap.date) : '') + (snap.source ? '　·　' + esc(snap.source) : '') + '　·　网页快照（模拟）</div>' +
      '<div class="app-ie-snap-sum"><b>摘要：</b>' + sumHtml + '</div>' +
      ps.map(function (p) { return '<p>' + p + '</p>'; }).join('') +
      '<div class="app-ie-art-foot"><button class="app-ie-open-btn" data-real-url="' + esc(url) + '">在真实浏览器打开原网页 ↗</button>　' +
      link('返回百度搜索', 'http://www.baidu.com') + '</div>' +
      '</div>';
    return { title: snap.title + '_网页快照', html: html };
  }

  /* ---- 通用路由兜底: 未知域名 → 按类别生成站点; 仅明显非法输入保留错误页 ---- */
  function pageGeneric(url) {
    try {
      var m = String(url).match(/^https?:\/\/([^\/]+)(\/[^?#]*)?(\?[^#]*)?/i);
      if (!m) return pageError(url);
      var urlHost = m[1].toLowerCase();
      var host = urlHost.replace(/^www\./, '');
      if (!/[\w\u4e00-\u9fa5]/.test(host)) return pageError(url);
      var info = genSiteInfo(host, urlHost);
      var path = m[2] || '/', query = m[3] || '';
      var am = path.match(/\/article\/(\d+)/);
      if (am) return pageGenArticle(info, parseInt(am[1], 10));
      var lm = path.match(/\/list\/(\d+)/);
      if (lm) return pageGenList(info, parseInt(lm[1], 10));
      if (info.cat === 'mail') return pageMail(info);
      if (info.cat === 'music') return pageMusic(info);
      if (info.cat === 'game') return pageGame(info);
      if (info.cat === 'soft') return pageSoft(info);
      if (info.cat === 'weather') return pageWeather(info);
      if (info.cat === 'train') return pageTrain(info, query);
      return pagePortalGen(info);
    } catch (e) { return pageError(url); }
  }

  /* ---------------- 路由: 按主机名分发 ---------------- */
  function renderPage(url, opts) {
    var before = opts && opts.before;
    var m = String(url).match(/^https?:\/\/([^\/]+)(\/[^?#]*)?(\?[^#]*)?/i);
    if (!m) return pageError(url);
    var host = m[1].toLowerCase().replace(/^www\./, '');
    var path = m[2] || '/';
    if (host === 'hao123.com') return pageHao123(before);
    if (host === 'baidu.com') {
      var bq = baiduSearchQuery(url);
      if (!bq) return pageBaidu(before);
      // 搜索结果一律走真实检索: 命中缓存直接渲染真实结果, 否则触发异步联网搜索
      var ckey = bq + ' ' + before;
      var cached = SEARCH_CACHE[ckey];
      if (cached) return pageBaiduRealResults(bq, cached.data, cached.secs, before);
      renderSearchAsync(bq);
      return pageBaiduLoading(bq, before);
    }
    if (host === 'sina.com.cn' || host === 'sina.com') {
      var sa = path.match(/\/news\/(\d+)/);
      if (sa) return pageArticle(SINA_NEWS, parseInt(sa[1], 10), 'sina', url);
      return pageSina();
    }
    if (host === '163.com') {
      var na = path.match(/\/news\/(\d+)/);
      if (na) return pageArticle(N163_NEWS, parseInt(na[1], 10), '163', url);
      return page163();
    }
    if (host === 'qq.com') return pageQQ();
    if (host === 'zh.wikipedia.org') {
      var wm = path.match(/\/wiki\/(.+)/);
      var wtitle = wm ? decodeQuery(wm[1]).replace(/_/g, ' ') : '';
      var wsnap = wtitle && WIKI_SNAPSHOTS[wtitle];
      if (wsnap) return pageWikiSnapshot(wtitle, wsnap);
      var wrs = REAL_SNAPSHOTS[url];
      return wrs ? pageRealSnapshot(url, wrs) : pageGeneric(url);
    }
    var rs = REAL_SNAPSHOTS[url];
    if (rs) return pageRealSnapshot(url, rs);
    return pageGeneric(url);
  }

  /* ---------------- 收藏夹 ---------------- */
  var FAVORITES = [
    ['hao123网址之家', 'http://www.hao123.com'],
    ['百度一下，你就知道', 'http://www.baidu.com'],
    ['新浪网', 'http://www.sina.com.cn'],
    ['网易', 'http://www.163.com'],
    ['腾讯网', 'http://www.qq.com']
  ];

  /* ---------------- 打开浏览器窗口 ---------------- */
  function openIE() {
    var el = XP.el;
    var win = XP.createWindow({
      title: 'Microsoft Internet Explorer', icon: '🌐',
      width: 880, height: 620, resizable: true, onClose: cleanup
    });

    /* ---- 菜单栏 (下拉行为在下方"菜单系统"处绑定) ---- */
    var MENU_LABELS = ['文件(F)', '编辑(E)', '查看(V)', '收藏(A)', '工具(T)', '帮助(H)'];
    var menuSpans = MENU_LABELS.map(function (t) { return el('span', { text: t }); });
    var menubar = el('div', { class: 'xp-menubar' }, menuSpans);

    /* ---- 工具栏 ---- */
    var btnBack = el('div', { class: 'xp-tool-btn', title: '后退(Alt+左箭头)', html: '◀ 后退' });
    var btnFwd = el('div', { class: 'xp-tool-btn', title: '前进(Alt+右箭头)', html: '▶ 前进' });
    var btnStop = el('div', { class: 'xp-tool-btn', title: '停止(Esc)', html: '✕ 停止' });
    var btnRefresh = el('div', { class: 'xp-tool-btn', title: '刷新(F5)', html: '🔄 刷新' });
    var btnHome = el('div', { class: 'xp-tool-btn', title: '主页', html: '🏠 主页' });
    var btnFav = el('div', { class: 'xp-tool-btn', title: '收藏夹', html: '⭐ 收藏夹' });
    var btnHist = el('div', { class: 'xp-tool-btn', title: '历史', html: '🕘 历史' });
    var sep = el('div', { class: 'app-ie-sep' });
    var toolbar = el('div', { class: 'xp-toolbar' },
      [btnBack, btnFwd, btnStop, btnRefresh, btnHome, sep, btnFav, btnHist]);

    /* ---- 地址栏 ---- */
    var addrInput = el('input', { class: 'xp-input', type: 'text', title: '输入网址后按回车' });
    var btnGo = el('button', { class: 'xp-btn', text: '转到', title: '转到' });
    var addrBar = el('div', { class: 'app-ie-addr' },
      [el('label', { text: '地址(D)' }), addrInput, btnGo]);

    /* ---- 网页内容区 ---- */
    var page = el('div', { class: 'app-ie-page' });

    /* ---- 状态栏 ---- */
    var barInner = el('div', { style: { width: '0%' } });
    var progress = el('div', { class: 'xp-progress', style: { width: '110px', flex: 'none' } }, [barInner]);
    var statusText = el('span', { text: '完毕', style: { flex: '1', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' } });
    var statusbar = el('div', { class: 'xp-statusbar' },
      [progress, statusText, el('span', { class: 'sb-cell', html: '🌐 Internet' })]);

    var root = el('div', { class: 'app-ie-root' }, [menubar, toolbar, addrBar, page, statusbar]);
    win.body.appendChild(root);

    /* ---- 每窗口独立状态 ---- */
    var hist = [], histIdx = -1;
    var loading = false, loadTimer = null, loadInterval = null;
    var closeDropdown = null;
    var searchToken = 0;   /* 递增即作废未完成的联网检索 */
    var extraTimers = [];  /* 页面内演示定时器 (如下载假进度), 关窗时统一清理 */
    var favorites = FAVORITES.slice();      /* 收藏夹: 内置项 + 可追加, 关窗即弃 */
    var homeUrl = HOME;                     /* 主页地址, 可在 Internet 选项中修改 */
    var curUrl = '', curTitle = '', curHtml = '';  /* 当前页信息 (源文件/收藏/打开对话框使用) */
    var textSizeIdx = 2;                    /* 文字大小档位: 0最小 1小 2中 3大 4最大 */
    var fullRect = null;                    /* 模拟全屏前保存的窗口矩形 */
    var findBar = null, findQuery = '', findMatches = [], findIdx = -1;  /* 页内查找状态 */
    var searchBefore = '2005';           /* 百度搜索时间筛选, 每窗口记忆 (默认 2005年前) */

    function clearLoad() {
      searchToken++;
      if (loadTimer) { clearTimeout(loadTimer); loadTimer = null; }
      if (loadInterval) { clearInterval(loadInterval); loadInterval = null; }
    }
    function cleanup() {
      clearLoad();
      while (extraTimers.length) clearInterval(extraTimers.pop());
      if (closeDropdown) closeDropdown();
      closeMenu();
    }
    function updateNavBtns() {
      btnBack.classList.toggle('app-ie-off', histIdx <= 0);
      btnFwd.classList.toggle('app-ie-off', histIdx >= hist.length - 1);
    }
    function notify(title, text) {
      try { if (XP && typeof XP.notify === 'function') XP.notify(title, text); } catch (e) {}
      statusText.textContent = title + '：' + String(text).split('\n')[0];
    }

    /* ---- 下拉面板 (收藏夹 / 历史) ---- */
    function showDropdown(anchor, headText, items) {
      if (closeDropdown) closeDropdown();
      closeMenu();
      var dd = el('div', { class: 'app-ie-dropdown' });
      dd.appendChild(el('div', { class: 'dd-head', text: headText }));
      items.forEach(function (it) {
        var d = el('div', { class: 'dd-item', text: it[0], title: it[1] });
        d.addEventListener('click', function () { if (closeDropdown) closeDropdown(); navigate(it[1]); });
        dd.appendChild(d);
      });
      root.appendChild(dd);
      dd.style.left = anchor.offsetLeft + 'px';
      dd.style.top = (anchor.offsetTop + anchor.offsetHeight) + 'px';
      var onDoc = function (e) { if (!dd.contains(e.target) && closeDropdown) closeDropdown(); };
      setTimeout(function () { document.addEventListener('mousedown', onDoc); }, 0);
      closeDropdown = function () {
        document.removeEventListener('mousedown', onDoc);
        if (dd.parentNode) dd.parentNode.removeChild(dd);
        closeDropdown = null;
      };
    }

    /* ---- 导航核心 ---- */
    function navigate(url, push) {
      clearLoad();
      curUrl = url;
      if (closeDropdown) closeDropdown();
      closeMenu();
      if (findBar) hideFindBar();
      if (push !== false) {
        hist = hist.slice(0, histIdx + 1);
        hist.push(url);
        histIdx = hist.length - 1;
      }
      addrInput.value = url;
      updateNavBtns();

      /* 300~600ms 假加载进度动画, 可被"停止"打断 */
      loading = true;
      var dur = 300 + Math.floor(Math.random() * 300);
      var t0 = Date.now();
      barInner.style.width = '0%';
      statusText.textContent = '正在打开网页 ' + url + ' ...';
      loadInterval = setInterval(function () {
        var p = Math.min(100, Math.floor((Date.now() - t0) / dur * 100));
        barInner.style.width = p + '%';
      }, 30);
      loadTimer = setTimeout(function () {
        clearLoad();
        var bq = baiduSearchQuery(url);
        if (bq) { renderSearchAsync(bq); return; }
        /* 非内置站点: 走同源反向代理显示真实网页 */
        if (!isBuiltinHost(url)) { renderProxied(url); return; }
        var r = renderPage(url, { before: searchBefore });
        curTitle = r.title;
        curHtml = r.html;
        page.innerHTML = r.html;
        page.scrollTop = 0;
        bindPage();
        win.setTitle(r.title + ' - Microsoft Internet Explorer');
        barInner.style.width = '0%';
        statusText.textContent = '完毕';
        loading = false;
      }, dur);
    }
    function stopLoad() {
      if (!loading) return;
      clearLoad();
      barInner.style.width = '0%';
      statusText.textContent = '已停止';
      loading = false;
    }

    /* ---- 真实网页模式: 同源反向代理 iframe (参考 safari-proxy 设计) ---- */
    var BUILTIN_HOSTS = ['hao123.com', 'baidu.com', 'sina.com.cn', 'sina.com', '163.com', 'qq.com', 'zh.wikipedia.org'];
    function isBuiltinHost(url) {
      var m = String(url).match(/^https?:\/\/([^\/]+)/i);
      if (!m) return false;
      var h = m[1].toLowerCase().replace(/^www\./, '');
      return BUILTIN_HOSTS.indexOf(h) >= 0;
    }
    function renderProxied(realUrl) {
      curTitle = realUrl;
      curHtml = '';
      page.innerHTML = '';
      var frame = el('iframe', {
        class: 'app-ie-frame',
        sandbox: 'allow-scripts allow-forms allow-same-origin allow-modals',
        src: '/proxy?url=' + encodeURIComponent(realUrl),
      });
      page.appendChild(frame);
      statusText.textContent = '正在打开网页 ' + realUrl + ' (代理) ...';
      frame.addEventListener('load', function () {
        statusText.textContent = '完毕';
        loading = false;
        try {
          var cw = frame.contentWindow;
          var u = new URL(cw.location.href);
          var real = realUrl;
          if (u.pathname === '/proxy' && u.searchParams.get('url')) real = u.searchParams.get('url');
          /* iframe 内点击已改写链接产生了栈外导航 → 计入历史栈 */
          if (real !== curUrl && real !== hist[histIdx]) {
            hist = hist.slice(0, histIdx + 1);
            hist.push(real);
            histIdx = hist.length - 1;
            curUrl = real;
            addrInput.value = real;
            updateNavBtns();
          }
          var t = frame.contentDocument ? frame.contentDocument.title : '';
          win.setTitle((t || real) + ' - Microsoft Internet Explorer');
          injectClickGuard(frame);
        } catch (e) {}
      });
    }
    /* 运行期 JS 换链拦截: 裸的绝对外站链接一律拉回代理 (capture 阶段) */
    function injectClickGuard(frame) {
      var doc;
      try { doc = frame.contentDocument; } catch (e) { return; }
      if (!doc || doc.__ieGuarded) return;
      doc.__ieGuarded = true;
      doc.addEventListener('click', function (ev) {
        var a = ev.target && ev.target.closest ? ev.target.closest('a') : null;
        if (!a) return;
        var href = a.getAttribute('href') || '';
        if (!href || href.charAt(0) === '#' || /^(javascript:|mailto:|tel:|data:)/i.test(href)) return;
        var abs;
        try { abs = new URL(href, frame.contentWindow.location.href).href; } catch (e) { return; }
        if (abs.indexOf('/proxy?url=') >= 0 || !/^https?:\/\//i.test(abs)) return;   // 代理内链接放行
        ev.preventDefault();
        ev.stopPropagation();
        navigate(abs);
      }, true);
    }
    function goBack() { if (histIdx > 0) { histIdx--; navigate(hist[histIdx], false); } }
    function goFwd() { if (histIdx < hist.length - 1) { histIdx++; navigate(hist[histIdx], false); } }
    function refresh() { if (histIdx >= 0) navigate(hist[histIdx], false); }
    function goHome() { navigate(homeUrl); }
    function goFromInput() {
      var raw = String(addrInput.value).trim();
      var u = normalizeUrl(raw);
      if (u) navigate(u);
      else if (raw) navigate(raw);   /* 明显非法输入: 地址栏保留原文, 显示 IE6 错误页 */
      else addrInput.value = hist[histIdx] || '';
    }

    /* ---- 百度搜索: 加载态 -> 异步联网检索 (搜狗优先) -> 真实结果或离线回退 ---- */
    function renderSearchAsync(q) {
      var before = searchBefore;
      var lp = pageBaiduLoading(q, before);
      curTitle = lp.title;
      curHtml = lp.html;
      page.innerHTML = lp.html;
      page.scrollTop = 0;
      bindPage();
      win.setTitle(lp.title + ' - Microsoft Internet Explorer');
      barInner.style.width = '0%';
      statusText.textContent = '正在联网检索真实结果…';
      var myToken = ++searchToken;
      var t0 = Date.now();
      function done(res, secs) {
        if (myToken !== searchToken) return;   /* 用户已停止或离开, 丢弃结果 */
        var r = res ? pageBaiduRealResults(q, res, secs, before) : pageBaiduResults(q, true, before);
        curTitle = r.title;
        curHtml = r.html;
        page.innerHTML = r.html;
        page.scrollTop = 0;
        bindPage();
        win.setTitle(r.title + ' - Microsoft Internet Explorer');
        statusText.textContent = '完毕';
        loading = false;
      }
      var ckey = q + '' + before;   /* 缓存按 关键词+时间筛选 区分 */
      var cached = SEARCH_CACHE[ckey];
      if (cached) { done(cached.data, cached.secs); return; }
      var pr = fetchAnyResults(q, before);
      if (!pr) { done(null); return; }
      pr.then(function (res) {
        var secs = ((Date.now() - t0) / 1000).toFixed(3);
        if (res) cachePut(ckey, res, secs);
        done(res, secs);
      });
    }

    /* ---- 渲染后绑定页面内控件 ---- */
    function bindPage() {
      var si = page.querySelector('[data-search]');
      if (si) {
        var doSearch = function () {
          var q = si.value.trim();
          if (q) navigate('http://www.baidu.com/s?wd=' + encodeURIComponent(q));
        };
        si.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
        var sb = page.querySelector('[data-search-btn]');
        if (sb) sb.addEventListener('click', doSearch);
        if (si.hasAttribute('data-autofocus')) si.focus();
      }
      /* 时间筛选下拉: 与窗口记忆同步, 改选后下次搜索生效 */
      var sbf = page.querySelector('[data-search-before]');
      if (sbf) {
        sbf.value = searchBefore;
        sbf.addEventListener('change', function () { searchBefore = sbf.value; });
      }
      var rf = page.querySelector('[data-refresh]');
      if (rf) rf.addEventListener('click', function (e) { e.preventDefault(); refresh(); });

      /* 邮箱登录 (演示) */
      var ml = page.querySelector('[data-mail-login]');
      if (ml) ml.addEventListener('click', function (e) {
        e.preventDefault();
        notify('邮箱登录', '演示环境：已跳过密码验证。\n收件箱中有 3 封未读邮件，欢迎体验怀旧邮箱。');
      });
      /* 音乐试听 (演示) */
      var listenBtns = page.querySelectorAll('[data-listen]');
      for (var li = 0; li < listenBtns.length; li++) (function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          notify('正在试听', btn.getAttribute('data-listen') + '\n（模拟播放器，2005 怀旧版）');
        });
      })(listenBtns[li]);
      /* 软件下载假进度 (演示) */
      var dlBtns = page.querySelectorAll('[data-download]');
      for (var di = 0; di < dlBtns.length; di++) (function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          if (btn.getAttribute('data-dling')) return;
          btn.setAttribute('data-dling', '1');
          var name = btn.getAttribute('data-download');
          var pct = 0;
          btn.textContent = '下载中 0%';
          var timer = setInterval(function () {
            pct = Math.min(100, pct + 8 + Math.floor(Math.random() * 15));
            btn.textContent = pct >= 100 ? '下载完成 ✓' : ('下载中 ' + pct + '%');
            if (pct >= 100) {
              clearInterval(timer);
              btn.removeAttribute('data-dling');
              notify('下载完成', name + ' 已保存到「C:\\下载」。\n（演示环境，未产生真实文件）');
            }
          }, 150);
          extraTimers.push(timer);
        });
      })(dlBtns[di]);
      /* 火车时刻查询表单 */
      var tb = page.querySelector('[data-train-btn]');
      if (tb) tb.addEventListener('click', function (e) {
        e.preventDefault();
        var fi = page.querySelector('[data-train-from]');
        var ti = page.querySelector('[data-train-to]');
        var f = fi ? fi.value.trim() : '';
        var t = ti ? ti.value.trim() : '';
        if (!f || !t) { notify('列车查询', '请输入出发地和目的地。'); return; }
        navigate(tb.getAttribute('data-train-base') + '?from=' + encodeURIComponent(f) + '&to=' + encodeURIComponent(t));
      });
    }

    /* ---- 页面内链接: data-url 内部跳转; data-real-url 真实外网新标签页打开 ---- */
    function findAttr(node, attr) {
      while (node && node !== page) {
        if (node.getAttribute && node.getAttribute(attr)) return node;
        node = node.parentNode;
      }
      return null;
    }
    function findLink(node) { return findAttr(node, 'data-url'); }
    function openReal(url) {
      try { window.open(url, '_blank'); } catch (e) {}
      statusText.textContent = '已在新标签页打开真实网页';
    }
    page.addEventListener('click', function (e) {
      var ra = findAttr(e.target, 'data-real-url');
      if (ra) { e.preventDefault(); openReal(ra.getAttribute('data-real-url')); return; }
      var a = findLink(e.target);
      if (!a) return;
      e.preventDefault();
      var u = normalizeUrl(a.getAttribute('data-url'));
      if (u) navigate(u);
    });
    page.addEventListener('mouseover', function (e) {
      if (loading) return;
      var ra = findAttr(e.target, 'data-real-url');
      if (ra) { statusText.textContent = ra.getAttribute('data-real-url'); return; }
      var a = findLink(e.target);
      if (a) statusText.textContent = a.getAttribute('data-url');
    });
    page.addEventListener('mouseout', function (e) {
      if (loading) return;
      if (findAttr(e.target, 'data-real-url') || findLink(e.target)) statusText.textContent = '完毕';
    });

    /* ---- 菜单系统: XP 风格下拉菜单 (点外部关闭, 已打开时悬停切换) ---- */
    var menuState = { idx: -1, drop: null, sub: null };
    function closeSub() {
      if (menuState.sub && menuState.sub.parentNode) menuState.sub.parentNode.removeChild(menuState.sub);
      menuState.sub = null;
    }
    function closeMenu() {
      closeSub();
      if (menuState.drop && menuState.drop.parentNode) menuState.drop.parentNode.removeChild(menuState.drop);
      menuState.drop = null;
      menuState.idx = -1;
      document.removeEventListener('mousedown', onDocDown, true);
    }
    function onDocDown(e) {
      if (menuState.drop && menuState.drop.contains(e.target)) return;
      if (menubar.contains(e.target)) return;
      closeMenu();
    }
    function buildMenuRow(it, inSub) {
      var row = el('div', { class: 'app-ie-menu-item' + (it.chk ? ' chk' : '') + (it.sub ? ' has-sub' : '') },
        [el('span', { class: 'lbl', text: it.label }), it.hk ? el('span', { class: 'hk', text: it.hk }) : null]);
      if (it.sub) {
        row.addEventListener('mouseenter', function () { openSub(row, it); });
        row.addEventListener('click', function () { openSub(row, it); });
      } else {
        row.addEventListener('click', function () { closeMenu(); it.act(); });
        if (!inSub) row.addEventListener('mouseenter', closeSub);   /* 悬停其他项时收起子菜单 */
      }
      return row;
    }
    function openSub(row, it) {
      closeSub();
      var items = typeof it.sub === 'function' ? it.sub() : it.sub;
      var sub = el('div', { class: 'app-ie-menu-drop app-ie-menu-sub' });
      items.forEach(function (subIt) { sub.appendChild(buildMenuRow(subIt, true)); });
      menuState.drop.appendChild(sub);
      sub.style.left = ((menuState.drop.offsetWidth || 190) - 4) + 'px';
      sub.style.top = Math.max(0, row.offsetTop - 2) + 'px';
      menuState.sub = sub;
    }
    function openMenu(idx) {
      if (closeDropdown) closeDropdown();
      closeMenu();
      var drop = el('div', { class: 'app-ie-menu-drop' });
      MENU_DEFS[idx].forEach(function (it) {
        drop.appendChild(it === '-' ? el('div', { class: 'app-ie-menu-sep' }) : buildMenuRow(it, false));
      });
      root.appendChild(drop);
      drop.style.left = menuSpans[idx].offsetLeft + 'px';
      drop.style.top = (menubar.offsetTop + menubar.offsetHeight) + 'px';
      menuState.drop = drop;
      menuState.idx = idx;
      setTimeout(function () { document.addEventListener('mousedown', onDocDown, true); }, 0);
    }

    /* ---- 文件菜单: 打开 / 页面设置 / 打印 ---- */
    function dlgOpen() {
      var d = XP.createWindow({ title: '打开', icon: '📂', width: 390, height: 140, resizable: false });
      var box = el('div', { class: 'app-ie-dlg' });
      var input = el('input', { type: 'text', value: curUrl || HOME });
      box.appendChild(el('div', { class: 'row' }, [el('label', { text: '打开(O):' }), input]));
      function doOk() {
        var raw = String(input.value).trim();
        if (!raw) { d.close(); return; }
        var u = normalizeUrl(raw);
        navigate(u || raw);
        d.close();
      }
      var ok = el('button', { class: 'xp-btn', text: '确定' });
      ok.addEventListener('click', doOk);
      var browse = el('button', { class: 'xp-btn', text: '浏览(B)…' });
      browse.addEventListener('click', function () { notify('打开', '演示环境暂不支持浏览本地文件，请直接输入网址。'); });
      var cancel = el('button', { class: 'xp-btn', text: '取消' });
      cancel.addEventListener('click', function () { d.close(); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doOk(); });
      box.appendChild(el('div', { class: 'btns' }, [ok, browse, cancel]));
      d.body.appendChild(box);
      input.focus();
      input.select();
    }
    function dlgPageSetup() {
      var d = XP.createWindow({ title: '页面设置', icon: '🖨️', width: 340, height: 240, resizable: false });
      var box = el('div', { class: 'app-ie-dlg' });
      var paper = el('select', null,
        ['A4 (210×297 毫米)', 'A5 (148×210 毫米)', 'B5 (JIS)', 'Letter (8.5×11 英寸)', 'Legal (8.5×14 英寸)', '16开 (184×260 毫米)']
          .map(function (t) { return el('option', { text: t }); }));
      box.appendChild(el('div', { class: 'row' }, [el('label', { text: '纸张大小(Z):' }), paper]));
      var orient = el('select', null, ['纵向', '横向'].map(function (t) { return el('option', { text: t }); }));
      box.appendChild(el('div', { class: 'row' }, [el('label', { text: '方向(O):' }), orient]));
      box.appendChild(el('div', { class: 'row' }, [el('label', { text: '页边距(毫米):' }),
        el('input', { type: 'text', value: '19.05', style: { width: '52px', flex: 'none' } }),
        el('input', { type: 'text', value: '19.05', style: { width: '52px', flex: 'none' } })]));
      var ok = el('button', { class: 'xp-btn', text: '确定' });
      ok.addEventListener('click', function () {
        d.close();
        notify('页面设置', '已应用页面设置：' + paper.value + '，' + orient.value + '。\n(演示环境，不影响实际打印)');
      });
      var cancel = el('button', { class: 'xp-btn', text: '取消' });
      cancel.addEventListener('click', function () { d.close(); });
      box.appendChild(el('div', { class: 'btns' }, [ok, cancel]));
      d.body.appendChild(box);
    }
    function dlgPrint() {
      var d = XP.createWindow({ title: '打印', icon: '🖨️', width: 380, height: 170, resizable: false });
      var box = el('div', { class: 'app-ie-dlg' });
      box.appendChild(el('div', { class: 'row', text: '正在打印：' + (curTitle || '网页') }));
      box.appendChild(el('div', { style: { color: '#666', margin: '2px 0 8px' }, text: '打印机：Microsoft Office Document Image Writer' }));
      var inner = el('div', { style: { width: '0%' } });
      box.appendChild(el('div', { class: 'xp-progress' }, [inner]));
      var st = el('div', { style: { marginTop: '8px', color: '#666' }, text: '正在准备打印…' });
      box.appendChild(st);
      d.body.appendChild(box);
      var pct = 0;
      var timer = setInterval(function () {
        pct += 10;
        inner.style.width = Math.min(100, pct) + '%';
        st.textContent = pct >= 100 ? '打印完成' : ('正在打印第 1 页… ' + pct + '%');
        if (pct >= 100) {
          clearInterval(timer);
          timer = null;
          notify('打印', '打印完成（演示环境，未发送到真实打印机）');
        }
      }, 100);
      d.on('close', function () { if (timer) { clearInterval(timer); timer = null; } });
    }

    /* ---- 编辑菜单: 剪贴板命令 (作用于地址栏) ---- */
    function editCmd(cmd) {
      addrInput.focus();
      addrInput.select();
      var ok = false;
      try { ok = document.execCommand && document.execCommand(cmd); } catch (e) {}
      if (ok) return;
      if (cmd === 'paste' && typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (t) {
          var s = addrInput.selectionStart || 0, e2 = addrInput.selectionEnd || 0;
          addrInput.value = addrInput.value.slice(0, s) + t + addrInput.value.slice(e2);
        }).catch(function () { notify('粘贴', '浏览器拒绝了剪贴板访问，请按 Ctrl+V。'); });
      } else {
        notify('编辑', '当前浏览器不支持该操作，请使用键盘快捷键。');
      }
    }

    /* ---- 编辑菜单: 页内查找 (黄色 <mark> 高亮) ---- */
    var TEXT_SKIP = { INPUT: 1, BUTTON: 1, SELECT: 1, TEXTAREA: 1, SCRIPT: 1, STYLE: 1, MARK: 1 };
    function clearFindMarks() {
      var marks = page.querySelectorAll('mark.app-ie-find');
      for (var i = 0; i < marks.length; i++) {
        var mk = marks[i];
        if (mk.parentNode) mk.parentNode.replaceChild(document.createTextNode(mk.textContent), mk);
      }
      findMatches = [];
      findIdx = -1;
    }
    function highlightTextNode(tn, ql) {
      var text = tn.nodeValue;
      var low = text.toLowerCase();
      var idx = low.indexOf(ql);
      if (idx < 0) return;
      var frag = document.createDocumentFragment();
      var pos = 0;
      while (idx >= 0) {
        if (idx > pos) frag.appendChild(document.createTextNode(text.slice(pos, idx)));
        var mk = document.createElement('mark');
        mk.className = 'app-ie-find';
        mk.textContent = text.slice(idx, idx + ql.length);
        frag.appendChild(mk);
        pos = idx + ql.length;
        idx = low.indexOf(ql, pos);
      }
      if (pos < text.length) frag.appendChild(document.createTextNode(text.slice(pos)));
      tn.parentNode.replaceChild(frag, tn);
    }
    function walkText(node, ql) {
      var child = node.firstChild;
      while (child) {
        var next = child.nextSibling;
        if (child.nodeType === 3) highlightTextNode(child, ql);
        else if (child.nodeType === 1 && !TEXT_SKIP[child.tagName]) walkText(child, ql);
        child = next;
      }
    }
    function setFindCur(i) {
      if (!findMatches.length) return;
      findIdx = ((i % findMatches.length) + findMatches.length) % findMatches.length;
      for (var k = 0; k < findMatches.length; k++) {
        if (k === findIdx) findMatches[k].classList.add('cur');
        else findMatches[k].classList.remove('cur');
      }
      try { findMatches[findIdx].scrollIntoView({ block: 'center' }); } catch (e) {}
    }
    function findStep(q, dir) {
      var ql = String(q).toLowerCase();
      if (findMatches.length && findQuery === ql) { setFindCur(findIdx + (dir || 1)); return; }
      clearFindMarks();
      findQuery = ql;
      walkText(page, ql);
      findMatches = page.querySelectorAll('mark.app-ie-find');
      setFindCur(0);
    }
    function hideFindBar() {
      if (!findBar) return;
      if (findBar.parentNode) findBar.parentNode.removeChild(findBar);
      findBar = null;
      findQuery = '';
      clearFindMarks();
    }
    function openFindBar() {
      if (findBar) {
        var f0 = findBar.querySelector('input');
        if (f0) { f0.focus(); f0.select(); }
        return;
      }
      var input = el('input', { type: 'text', title: '输入要查找的文本' });
      var cnt = el('span', { class: 'cnt' });
      function run(dir) {
        var q = input.value;
        if (!q) { clearFindMarks(); cnt.textContent = '请输入查找内容'; return; }
        findStep(q, dir);
        cnt.textContent = findMatches.length ? ((findIdx + 1) + ' / ' + findMatches.length) : ('未找到 "' + q + '"');
      }
      input.addEventListener('input', function () { run(0); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(e.shiftKey ? -1 : 1); });
      var prev = el('button', { text: '上一个' });
      prev.addEventListener('click', function () { run(-1); });
      var next = el('button', { text: '下一个' });
      next.addEventListener('click', function () { run(1); });
      var x = el('span', { class: 'x', text: '✕', title: '关闭查找栏' });
      x.addEventListener('click', hideFindBar);
      findBar = el('div', { class: 'app-ie-findbar' },
        [el('span', { text: '查找:' }), input, prev, next, cnt, x]);
      root.appendChild(findBar);
      findBar.style.top = page.offsetTop + 'px';
      input.focus();
    }

    /* ---- 查看菜单: 源文件 / 全屏 ---- */
    function viewSource() {
      var d = XP.createWindow({ title: '源文件 - 记事本', icon: '📝', width: 660, height: 480, resizable: true });
      d.body.appendChild(el('pre', { class: 'app-ie-src', text: curHtml || '（当前页面暂无可显示的源文件）' }));
    }
    function toggleFull() {
      var w = win.el;
      if (!fullRect) {
        fullRect = { left: w.style.left, top: w.style.top, width: w.style.width, height: w.style.height };
        w.style.left = '0px';
        w.style.top = '0px';
        w.style.width = '100%';
        w.style.height = '100%';
        w.classList.add('maxed');
        statusText.textContent = '已进入全屏模式（再次选择「查看 → 全屏」可恢复）';
      } else {
        w.style.left = fullRect.left;
        w.style.top = fullRect.top;
        w.style.width = fullRect.width;
        w.style.height = fullRect.height;
        fullRect = null;
        w.classList.remove('maxed');
      }
    }

    /* ---- 收藏菜单 ---- */
    function dlgAddFav() {
      var d = XP.createWindow({ title: '添加到收藏夹', icon: '⭐', width: 380, height: 160, resizable: false });
      var box = el('div', { class: 'app-ie-dlg' });
      var input = el('input', { type: 'text', value: curTitle || curUrl || '新网页' });
      box.appendChild(el('div', { class: 'row' }, [el('label', { text: '名称(N):' }), input]));
      box.appendChild(el('div', { style: { color: '#666', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, text: '地址: ' + (curUrl || HOME) }));
      function doOk() {
        var name = String(input.value).trim() || curUrl;
        favorites.push([name, curUrl || HOME]);
        d.close();
        notify('收藏夹', '已添加到收藏夹：' + name);
      }
      var ok = el('button', { class: 'xp-btn', text: '确定' });
      ok.addEventListener('click', doOk);
      var cancel = el('button', { class: 'xp-btn', text: '取消' });
      cancel.addEventListener('click', function () { d.close(); });
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doOk(); });
      box.appendChild(el('div', { class: 'btns' }, [ok, cancel]));
      d.body.appendChild(box);
      input.focus();
      input.select();
    }
    function dlgOrganizeFav() {
      var d = XP.createWindow({ title: '整理收藏夹', icon: '⭐', width: 430, height: 330, resizable: true });
      var box = el('div', { class: 'app-ie-dlg' });
      box.appendChild(el('div', { text: '收藏夹内容（双击名称打开，关窗后不保留新增项）:' }));
      var list = el('div', { class: 'xp-listbox', style: { height: '190px', margin: '6px 0' } });
      function paint() {
        list.innerHTML = '';
        if (!favorites.length) {
          list.appendChild(el('div', { class: 'lb-item', text: '（收藏夹为空）' }));
          return;
        }
        favorites.forEach(function (f, i) {
          var row = el('div', { class: 'lb-item', style: { display: 'flex', alignItems: 'center', gap: '6px' } });
          var lbl = el('span', { style: { flex: '1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, text: '⭐ ' + f[0], title: f[1] });
          lbl.addEventListener('dblclick', function () { navigate(f[1]); d.close(); });
          var del = el('button', { class: 'app-ie-mini-btn', text: '删除' });
          del.addEventListener('click', function () {
            favorites.splice(i, 1);
            notify('收藏夹', '已删除：' + f[0]);
            paint();
          });
          row.appendChild(lbl);
          row.appendChild(del);
          list.appendChild(row);
        });
      }
      paint();
      box.appendChild(list);
      var close = el('button', { class: 'xp-btn', text: '关闭' });
      close.addEventListener('click', function () { d.close(); });
      box.appendChild(el('div', { class: 'btns' }, [close]));
      d.body.appendChild(box);
    }

    /* ---- 工具菜单 ---- */
    var ADDONS = [
      ['Shockwave Flash Object', 'Macromedia, Inc.', '9.0.47.0', true],
      ['Java Runtime Environment', 'Sun Microsystems, Inc.', '1.4.2_06', true],
      ['Microsoft XML Parser', 'Microsoft Corporation', '3.0 SP5', true],
      ['Windows Media Player', 'Microsoft Corporation', '10.0.0.3646', true],
      ['Adobe PDF Reader', 'Adobe Systems, Inc.', '7.0.8', false],
      ['Baidu 工具栏', 'Baidu.com, Inc.', '1.0.2', true]
    ];
    function dlgAddons() {
      var d = XP.createWindow({ title: '管理加载项', icon: '🧩', width: 480, height: 320, resizable: true });
      var box = el('div', { class: 'app-ie-dlg' });
      box.appendChild(el('div', { text: 'Internet Explorer 当前加载的加载项（点击按钮可启用/禁用，演示）:' }));
      var table = el('table', { class: 'app-ie-addon' });
      table.appendChild(el('tr', null,
        [el('th', { text: '名称' }), el('th', { text: '发行者' }), el('th', { text: '版本' }), el('th', { text: '状态' }), el('th', { text: '操作' })]));
      ADDONS.forEach(function (a) {
        var st = el('td', { text: a[3] ? '已启用' : '已禁用', style: { color: a[3] ? '#080' : '#999' } });
        var btn = el('button', { class: 'app-ie-mini-btn', text: a[3] ? '禁用' : '启用' });
        btn.addEventListener('click', function () {
          a[3] = !a[3];
          st.textContent = a[3] ? '已启用' : '已禁用';
          st.style.color = a[3] ? '#080' : '#999';
          btn.textContent = a[3] ? '禁用' : '启用';
          notify('管理加载项', a[0] + ' 已' + (a[3] ? '启用' : '禁用') + '（演示）');
        });
        table.appendChild(el('tr', null,
          [el('td', { text: a[0] }), el('td', { text: a[1] }), el('td', { text: a[2] }), st, el('td', null, [btn])]));
      });
      box.appendChild(table);
      var close = el('button', { class: 'xp-btn', text: '关闭' });
      close.addEventListener('click', function () { d.close(); });
      box.appendChild(el('div', { class: 'btns' }, [close]));
      d.body.appendChild(box);
    }
    function dlgInternetOptions() {
      var d = XP.createWindow({ title: 'Internet 选项', icon: '⚙️', width: 430, height: 280, resizable: false });
      var box = el('div', { class: 'app-ie-dlg' });
      var fs = el('fieldset', { class: 'xp-fieldset' });
      fs.appendChild(el('legend', { text: '主页' }));
      var input = el('input', { type: 'text', value: homeUrl });
      fs.appendChild(el('div', { class: 'row' }, [el('label', { text: '地址(R):' }), input]));
      var bCur = el('button', { class: 'xp-btn', text: '使用当前页(C)' });
      bCur.addEventListener('click', function () { if (curUrl) input.value = curUrl; });
      var bDef = el('button', { class: 'xp-btn', text: '使用默认页(D)' });
      bDef.addEventListener('click', function () { input.value = HOME; });
      fs.appendChild(el('div', { class: 'row' }, [bCur, bDef]));
      box.appendChild(fs);
      var fs2 = el('fieldset', { class: 'xp-fieldset' });
      fs2.appendChild(el('legend', { text: 'Internet 临时文件' }));
      var bCk = el('button', { class: 'xp-btn', text: '删除 Cookies(O)…' });
      bCk.addEventListener('click', function () { notify('Internet 选项', '已删除全部 Cookies（演示）'); });
      var bFile = el('button', { class: 'xp-btn', text: '删除文件(F)…' });
      bFile.addEventListener('click', function () { notify('Internet 选项', '已删除临时 Internet 文件（演示）'); });
      fs2.appendChild(el('div', { class: 'row' }, [bCk, bFile]));
      box.appendChild(fs2);
      var ok = el('button', { class: 'xp-btn', text: '确定' });
      ok.addEventListener('click', function () {
        var u = normalizeUrl(String(input.value).trim());
        homeUrl = u || HOME;
        d.close();
        notify('Internet 选项', '主页已设置为：' + homeUrl);
      });
      var cancel = el('button', { class: 'xp-btn', text: '取消' });
      cancel.addEventListener('click', function () { d.close(); });
      box.appendChild(el('div', { class: 'btns' }, [ok, cancel]));
      d.body.appendChild(box);
    }

    /* ---- 帮助菜单 ---- */
    function dlgHelp() {
      var d = XP.createWindow({ title: 'Internet Explorer 帮助', icon: '❓', width: 520, height: 440, resizable: true });
      d.body.appendChild(el('div', { class: 'app-ie-help', html:
        '<h2 style="font-size:16px;color:#0a3d91;margin:0 0 8px">欢迎使用 Internet Explorer 6（怀旧模拟版）</h2>' +
        '<h3>地址栏</h3>' +
        '<p>在地址栏输入网址（如 www.sina.com.cn）后按回车即可访问。也可以输入「百度」「新浪」「网易」「腾讯」「hao123」等简称，浏览器会自动补全。输入未知域名时，将按类别生成一个 2005 年风格的演示站点。</p>' +
        '<h3>搜索</h3>' +
        '<p>在 hao123 或百度页面的搜索框中输入关键词即可联网检索真实结果：http 环境下优先使用本机搜狗搜索代理，失败后回退 维基百科 / DuckDuckGo；网络不可用时自动回退到离线演示结果。搜索框旁的下拉可按时间筛选（不限 / 2005年前 / 2000年前 / 1995年前，默认 2005年前），每个窗口独立记忆。搜索结果中的「站内快照」「百度快照」为本地生成的模拟页面。</p>' +
        '<h3>工具栏</h3>' +
        '<p>后退 / 前进：在浏览历史中移动；停止：中断当前加载；刷新：重新打开当前页；主页：回到主页（可在「工具 → Internet 选项」中修改）；收藏夹 / 历史：快速访问已收藏或最近浏览的网址。</p>' +
        '<h3>菜单</h3>' +
        '<p>文件：新建窗口、打开网址、页面设置、打印（演示）；编辑：对地址栏的剪切 / 复制 / 粘贴，以及页内查找（黄色高亮匹配文本）；查看：刷新、停止、查看源文件、调整文字大小、模拟全屏；收藏：添加到收藏夹与整理收藏夹；工具：管理加载项、Windows 更新、Internet 选项；帮助：本说明与关于信息。</p>' +
        '<h3>提示</h3>' +
        '<p>本浏览器为纯前端怀旧模拟程序，除联网搜索外不会产生任何真实网络请求，下载、打印、保存等操作均为演示效果。</p>'
      }));
    }
    function dlgAbout() {
      var d = XP.createWindow({ title: '关于 Internet Explorer', icon: '🌐', width: 440, height: 310, resizable: false });
      var box = el('div', { class: 'app-ie-dlg' });
      box.appendChild(el('div', { class: 'app-ie-about' }, [
        el('div', { class: 'app-ie-about-logo' }, [el('b', { text: 'e' }), el('i')]),
        el('div', { class: 'info' }, [
          el('div', { class: 'pn', text: 'Microsoft® Internet Explorer' }),
          el('div', { text: '版本: 6.0.2900.2180.xpsp_sp2_rtm.040803-2158' }),
          el('div', { text: '更新版本: ;SP2;' }),
          el('div', { text: '产品 ID: 55274-640-0001876-23081' }),
          el('div', { text: '© 1995-2005 Microsoft Corporation. 保留所有权利。' })
        ])
      ]));
      box.appendChild(el('div', { class: 'warn', text: '警告: 本计算机程序受著作权法和国际条约保护。如未经授权而擅自复制或传播本程序（或其中任何部分），将受到严厉的民事及刑事制裁，并将在法律许可的范围内受到最大程度的起诉。' }));
      var sysinfo = el('button', { class: 'xp-btn', text: '系统信息(S)' });
      sysinfo.addEventListener('click', function () {
        notify('系统信息', 'Microsoft Windows XP Professional\n版本 2002 Service Pack 2\n（怀旧模拟环境）');
      });
      var ok = el('button', { class: 'xp-btn', text: '确定' });
      ok.addEventListener('click', function () { d.close(); });
      box.appendChild(el('div', { class: 'btns' }, [sysinfo, ok]));
      d.body.appendChild(box);
    }

    /* ---- 菜单定义 (与菜单栏 MENU_LABELS 一一对应) ---- */
    var TEXT_SIZES = [['最小', '0.75em'], ['小', '0.875em'], ['中', '1em'], ['大', '1.25em'], ['最大', '1.5em']];
    var MENU_DEFS = [
      [
        { label: '新建(N)', hk: 'Ctrl+N', act: function () { XP.openApp('ie'); } },
        { label: '打开(O)…', hk: 'Ctrl+O', act: dlgOpen },
        { label: '另存为(A)…', act: function () { notify('另存为', '网页「' + (curTitle || '未命名网页') + '」已保存到「我的文档」。\n(演示环境，未产生真实文件)'); } },
        '-',
        { label: '页面设置(U)…', act: dlgPageSetup },
        { label: '打印(P)…', hk: 'Ctrl+P', act: dlgPrint },
        '-',
        { label: '关闭(C)', hk: 'Alt+F4', act: function () { win.close(); } }
      ],
      [
        { label: '剪切(T)', hk: 'Ctrl+X', act: function () { editCmd('cut'); } },
        { label: '复制(C)', hk: 'Ctrl+C', act: function () { editCmd('copy'); } },
        { label: '粘贴(P)', hk: 'Ctrl+V', act: function () { editCmd('paste'); } },
        '-',
        { label: '全选(A)', hk: 'Ctrl+A', act: function () { addrInput.focus(); addrInput.select(); } },
        { label: '查找(在当前页)(F)…', hk: 'Ctrl+F', act: openFindBar }
      ],
      [
        { label: '刷新(R)', hk: 'F5', act: refresh },
        { label: '停止(O)', hk: 'Esc', act: stopLoad },
        '-',
        { label: '源文件(C)', act: viewSource },
        { label: '文字大小(X)', sub: function () {
          return TEXT_SIZES.map(function (s, i) {
            return {
              label: s[0], chk: i === textSizeIdx, act: function () {
                textSizeIdx = i;
                page.style.fontSize = s[1];
                statusText.textContent = '文字大小：' + s[0];
              }
            };
          });
        } },
        '-',
        { label: '全屏(F11)', hk: 'F11', act: toggleFull }
      ],
      [
        { label: '添加到收藏夹(A)…', act: dlgAddFav },
        { label: '整理收藏夹(B)…', act: dlgOrganizeFav }
      ],
      [
        { label: '管理加载项(A)…', act: dlgAddons },
        { label: 'Windows 更新(U)', act: function () { notify('Windows Update', '正在连接 Windows Update…\n(2005 年的服务器早已下班)'); } },
        '-',
        { label: 'Internet 选项(O)…', act: dlgInternetOptions }
      ],
      [
        { label: '帮助主题(H)', act: dlgHelp },
        '-',
        { label: '关于 Internet Explorer(A)', act: dlgAbout }
      ]
    ];

    /* ---- 事件绑定 ---- */
    menuSpans.forEach(function (span, idx) {
      span.addEventListener('click', function (e) {
        e.stopPropagation();
        if (menuState.idx === idx) closeMenu();
        else openMenu(idx);
      });
      span.addEventListener('mouseenter', function () {
        if (menuState.idx >= 0 && menuState.idx !== idx) openMenu(idx);   /* 已打开菜单时悬停切换 */
      });
    });
    btnBack.addEventListener('click', goBack);
    btnFwd.addEventListener('click', goFwd);
    btnStop.addEventListener('click', stopLoad);
    btnRefresh.addEventListener('click', refresh);
    btnHome.addEventListener('click', goHome);
    btnFav.addEventListener('click', function () {
      showDropdown(btnFav, '收藏夹', favorites);
    });
    btnHist.addEventListener('click', function () {
      var items = hist.slice().reverse().map(function (u) { return [u, u]; });
      if (!items.length) items = [['（暂无浏览历史）', HOME]];
      showDropdown(btnHist, '历史记录（最近访问）', items);
    });
    btnGo.addEventListener('click', goFromInput);
    addrInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') goFromInput(); });
    addrInput.addEventListener('focus', function () { addrInput.select(); });

    /* ---- 打开默认主页 ---- */
    navigate(HOME);
  }

  XP.registerApp({ id: 'ie', name: 'Internet Explorer', icon: '🌐', open: openIE });
})();
