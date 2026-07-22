(function () {
  const menu = (items, selected = 1) => `<div class="mac-menu">${items.map((item, index) => `<div class="mac-menu-row ${index === selected ? "selected" : ""}"><span>${item}</span>${index === selected ? "<b>↩</b>" : index === items.length - 1 ? "<b>⌘Q</b>" : ""}</div>`).join("")}</div>`;
  const lights = '<span class="traffic"><i></i><i></i><i></i></span>';
  const win = (title, body, cls = "") => `<div class="mock-window ${cls}"><div class="mock-titlebar">${lights}<b>${title}</b></div><div class="mock-body">${body}</div></div>`;
  const field = (text = "Search…", focused = false) => `<div class="mock-field ${focused ? "focused" : ""}"><span>⌕</span><em>${text}</em></div>`;
  const dock = (badge = true) => `<div class="mock-dock"><span class="app blue">${badge ? '<b class="red-badge">3</b>' : ""}</span><span class="app green"></span><span class="app purple"></span><span class="app orange"></span></div>`;
  const folder = (name = "Project") => `<div class="folder"><span>▰</span><b>${name}</b></div>`;
  const rows = (labels) => `<div class="line-list">${labels.map((label, i) => `<div><span>${i % 2 ? "▾" : "▸"}</span>${label}</div>`).join("")}</div>`;

  window.renderTermDemo = function renderTermDemo(term) {
    let content = "";
    switch (term.slug) {
      case "menu-bar":
        content = `<div class="menu-desktop"><div class="system-bar"><b>●　访达</b><span>★　⌁　▰　9:41</span></div>${menu(["打开这叫啥", "检查更新…", "设置…", "", "退出"], 1)}</div>`;
        break;
      case "context-menu":
        content = `<div class="context-stage">${folder("项目")}${menu(["打开　　⌘O", "重命名…", "复制　　　›", "", "移到废纸篓"], 1)}</div>`;
        break;
      case "disclosure-triangle":
        content = win("", `${rows(["📁 文稿", "　▤ Q3 报告.pages", "　▤ 笔记.md", "📁 下载"])}`, "file-window");
        break;
      case "dock-badge":
        content = `<div class="dock-stage"><span class="callout one">1</span>${dock(true)}<span class="callout two">2</span><div class="demo-action">发送通知</div><small>红色数字是角标；图标跳动是注意力弹跳</small></div>`;
        break;
      case "focus-ring":
      case "focus-ring-web":
        content = `<div class="focus-stage">${field("搜索…", true)}<span class="check">✓</span><b>已启用</b><div class="demo-button">保存</div></div>`;
        break;
      case "inspector":
        content = win("幻灯片", `<div class="canvas-object"><i></i></div><aside class="inspector"><b>样式</b><label>填充</label><span></span><label>边框</label><span></span><label>阴影</label><span></span></aside>`, "inspector-window");
        break;
      case "menu-bar-extra":
        content = `<div class="menu-desktop"><div class="system-bar"><b>访达</b><span class="status-highlight">☀</span><span>⌁　▰　9:41</span></div>${menu(["专注模式", "勿扰模式", "显示设置", "退出"], 0)}</div>`;
        break;
      case "panel":
        content = `${win("编辑器", `<div class="fake-lines"><i></i><i></i><i></i></div>`, "back-window")}<div class="floating-panel"><b>颜色</b><div class="swatches"><i></i><i></i><i></i><i></i><i></i></div><span></span></div>`;
        break;
      case "popover":
        content = `<div class="popover-stage"><div class="bubble"><b>正在播放</b><p>歌名 · 艺术家</p></div><div class="bubble-arrow"></div><div class="demo-button">显示弹出框</div></div>`;
        break;
      case "popup-pulldown-combo":
        content = `<div class="select-stage"><div class="select-button">小号 <span>⌄</span></div>${menu(["小号", "中号", "大号", "自定义…"], 1)}</div>`;
        break;
      case "segmented-control":
        content = `<div class="segments"><span class="active">列表</span><span>图标</span><span>分栏</span></div>`;
        break;
      case "sheet":
        content = win("文稿", `<div class="dim-page"></div><div class="attached-sheet"><b>要保存更改吗？</b><p>关闭前请确认。</p><span>取消　 <strong>保存</strong></span></div>`, "sheet-window");
        break;
      case "sidebar":
        content = win("收件箱", `<aside class="sidebar-demo">⌂ 首页<br>▣ 收件箱<br><b>★ 收藏</b><br>⚙ 设置</aside><div class="content-lines"><i></i><i></i><i></i><i></i></div>`, "sidebar-window");
        break;
      case "stepper":
        content = `<div class="stepper-stage"><label>份数</label><div class="number-field">3</div><div class="stepper"><span>＋</span><span>−</span></div></div>`;
        break;
      case "toolbar":
        content = win("文稿", `<div class="toolbar-row"><span>←</span><span>↗</span><span>▦</span>${field("搜索")}</div><div class="content-lines"><i></i><i></i><i></i></div>`, "toolbar-window");
        break;
      case "traffic-lights":
        content = `<div class="lights-focus">${lights}<span>关闭　最小化　全屏</span></div>`;
        break;
      case "vibrancy":
        content = `<div class="vibrancy-bg"><i></i><i></i><i></i><div class="glass-panel"><b>毛玻璃效果</b><span></span><span></span></div></div>`;
        break;
      case "window":
        content = win("我的窗口", `<div class="content-lines"><i></i><i></i><i></i><i></i></div>`, "full-window");
        break;
      case "split-view":
        content = win("拆分视图", `<div class="split-pane left">导航<br>项目<br>收藏</div><div class="split-handle"></div><div class="split-pane right"><i></i><i></i><i></i></div>`, "split-window");
        break;
      case "scroll-view":
        content = `<div class="scroll-box"><div>${Array.from({length: 8}, (_, i) => `<p>第 ${i + 1} 行内容</p>`).join("")}</div><span class="scrollbar"><i></i></span></div>`;
        break;
      case "search-field":
        content = `<div class="search-demo">${field("搜索联系人…", true)}<div class="search-suggestions"><span>最近搜索</span><b>设计系统</b><b>界面术语</b></div></div>`;
        break;
      case "save-panel":
        content = win("保存", `<label class="save-label">保存为：<span>未命名文稿</span></label><div class="finder-list">桌面<br>文稿<br>下载</div><div class="save-actions">取消　 <b>保存</b></div>`, "save-window");
        break;
      case "token-field":
        content = `<div class="token-stage"><label>收件人</label><div class="token-field"><span>小明　×</span><span>设计组　×</span><i>输入地址…</i></div></div>`;
        break;
      case "combo-button":
        content = `<div class="combo-stage"><div class="combo-main">新建文稿</div><div class="combo-arrow">⌄</div>${menu(["空白文稿", "从模板新建", "导入文件"], 0)}</div>`;
        break;
      case "level-indicator":
        content = `<div class="level-stage"><div class="stars">★ ★ ★ ★ ☆</div><div class="meter"><i></i><i></i><i></i><i></i><i></i></div><small>信号强度</small></div>`;
        break;
      case "column-view":
        content = win("访达", `<div class="columns-demo"><div>文稿<br><b>项目 ›</b><br>下载</div><div>网站<br><b>App ›</b><br>资料</div><div>index.html<br>app.js<br>style.css</div></div>`, "column-window");
        break;
      case "outline-view":
        content = win("项目导航", rows(["src", "　components", "　pages", "public", "package.json"]), "outline-window");
        break;
      case "pointer":
        content = `<div class="pointer-stage"><span class="cursor arrow">➤</span><span class="cursor hand">☝</span><span class="cursor text">I</span><span class="cursor resize">↔</span><small>箭头　链接　文本　调整大小</small></div>`;
        break;
      case "alert":
        content = win("", `<div class="alert-box"><span>!</span><div><b>删除这个项目？</b><p>此操作无法撤销。</p><em>取消　 <strong>删除</strong></em></div></div>`, "alert-window");
        break;
      case "slider":
        content = `<div class="slider-stage"><span>🔈</span><div class="slider-track"><i></i><b></b></div><span>🔊</span><small>音量 62%</small></div>`;
        break;
      case "color-well":
        content = `<div class="color-stage"><div class="color-well"></div><div class="color-panel"><div class="swatches"><i></i><i></i><i></i><i></i><i></i></div><span class="hue"></span></div></div>`;
        break;
      case "hamburger-menu":
        content = `<div class="hamburger-stage"><div class="hamburger-page"><div class="hamburger-appbar"><span class="hamburger-icon"><i></i><i></i><i></i></span><b>Field Notes</b></div><div class="hamburger-lines"><i></i><i></i><i></i></div></div><div class="hamburger-scrim"></div><nav class="nav-drawer"><div><b>Field Notes</b><span>×</span></div><span class="active">首页</span><span>文章</span><span>归档</span><span>关于</span></nav></div>`;
        break;
      case "three-dots":
        content = `<div class="dots-stage"><div class="dots-button">•••</div>${menu(["编辑", "复制链接", "移动", "删除"], 0)}</div>`;
        break;
      case "drag-and-drop":
        content = `<div class="drag-stage"><div class="drag-card">≡　设计稿</div><span class="drag-arrow">→</span><div class="drop-zone">拖到这里</div><span class="cursor drag-cursor">☝</span></div>`;
        break;
      case "divider":
        content = `<div class="divider-stage"><p>账户</p><hr><p>通知</p><hr><p>隐私</p><span class="vertical-divider"></span></div>`;
        break;
      case "progress-indicators":
        content = `<div class="progress-stage"><div class="progress-bar"><i></i></div><b>正在上传 68%</b><small>还剩大约 12 秒</small></div>`;
        break;
      case "toast":
        content = `<div class="toast-stage"><div class="toast success"><span>✓</span><b>已保存更改</b><em>撤销</em></div><div class="toast"><span>i</span><b>链接已复制</b></div></div>`;
        break;
      case "dialog-drawer-sheet":
        content = `<div class="drawer-stage"><div class="scrim-bg"></div><div class="center-dialog">对话框</div><div class="side-drawer">抽屉<br><span></span><span></span></div><div class="bottom-sheet">底部弹层</div></div>`;
        break;
      case "popover-dropdown-tooltip":
        content = `<div class="float-stage"><div class="tooltip">文字提示</div><div class="anchor-button">按钮</div><div class="popover-card"><b>气泡卡片</b><p>可以承载更多内容</p></div><div class="dropdown-list">下拉菜单<br>选项一<br>选项二</div></div>`;
        break;
      case "scrim":
        content = `<div class="scrim-stage"><div class="page-behind"><i></i><i></i><i></i></div><div class="dark-scrim"></div><div class="modal-card"><b>确认操作</b><p>背景被遮罩层弱化</p></div></div>`;
        break;
      case "skeleton":
        content = `<div class="skeleton-stage"><span class="skeleton-avatar"></span><div class="skeleton-lines"><i></i><i></i><i></i></div></div>`;
        break;
      case "loading-spinner":
        content = `<div class="spinner-stage"><span class="spinner"></span><b>正在加载</b><small>请稍候…</small></div>`;
        break;
      case "combobox":
        content = `<div class="combobox-stage">${field("输入城市…", true)}<div class="combo-options"><b>上海</b><span>上海市，中国</span><b>上饶</b><span>江西省，中国</span></div></div>`;
        break;
      case "command-palette":
        content = `<div class="command-stage"><div class="command-input">⌕　输入命令…　 <kbd>⌘K</kbd></div><div class="command-list"><span>打开文件 <b>⌘O</b></span><span class="active">切换主题 <b>⌘T</b></span><span>显示设置 <b>⌘,</b></span></div></div>`;
        break;
      case "accordion":
        content = `<div class="accordion-stage"><div><b>什么是 UI 术语？</b><span>⌃</span><p>界面元素的标准名称与用途。</p></div><div><b>为什么保留英文？</b><span>⌄</span></div><div><b>如何搜索？</b><span>⌄</span></div></div>`;
        break;
      case "tabs":
        content = `<div class="tabs-stage"><nav><b>概览</b><span>活动</span><span>设置</span></nav><div class="tab-content"><i></i><i></i><i></i></div></div>`;
        break;
      case "badge":
        content = `<div class="badge-stage"><span class="badge-anchor">消息<b>12</b></span><small>数字也可以换成一个状态圆点</small></div>`;
        break;
      case "chip":
        content = `<div class="single-chip-stage"><span class="chip-demo">设计　×</span><small>表示已选条件，可以单独删除</small></div>`;
        break;
      case "pill":
        content = `<div class="single-chip-stage"><span class="pill-demo">进行中</span><small>胶囊外形不代表它一定可以点击</small></div>`;
        break;
      case "breadcrumbs":
        content = `<div class="crumb-stage"><nav>首页　›　组件　›　<b>导航</b></nav><div class="crumb-card">当前位置<br><strong>面包屑</strong></div></div>`;
        break;
      case "sticky-fixed":
        content = `<div class="sticky-stage"><div class="sticky-head">粘性标题 · 到顶后停住</div><p>第一段内容</p><p>第二段内容</p><div class="fixed-button">固定</div></div>`;
        break;
      case "empty-state":
        content = `<div class="empty-stage"><div class="empty-icon">□</div><b>还没有项目</b><p>创建第一个项目开始使用。</p><div class="demo-button">新建项目</div></div>`;
        break;
      case "hover-card":
        content = `<div class="hover-stage"><span class="avatar">林</span><span class="hover-link">@lin-design</span><div class="hover-card-demo"><b>林设计</b><p>产品设计师 · 上海</p><span>128 关注者</span></div></div>`;
        break;
      case "switch-checkbox-radio":
        content = `<div class="checks-stage"><label><span class="switch on"><i></i></span> 开关</label><label><span class="checkbox on">✓</span> 复选框</label><label><span class="radio on"><i></i></span> 单选框</label></div>`;
        break;
      case "toggle-group":
        content = `<div class="toggle-stage"><span class="active"><b>B</b></span><span><i>I</i></span><span><u>U</u></span><span>≡</span><span>☷</span></div>`;
        break;
      case "form-field":
        content = `<div class="form-stage"><label>电子邮箱</label><div class="mock-field focused"><em>name@example.com</em></div><small>我们只用它发送账户通知。</small><label>密码</label><div class="mock-field error"><em>••••</em></div><b>至少需要 8 个字符</b></div>`;
        break;
      case "truncation":
        content = `<div class="truncate-stage"><div><b>完整标题</b><p>这是一段可以完整显示的界面文字</p></div><div><b>空间不足</b><p>这是一段非常非常长但只能显示一…</p></div></div>`;
        break;
      case "lightbox":
        content = `<div class="lightbox-stage"><div class="gallery-thumb">▧</div><div class="lightbox-scrim"></div><div class="photo-large">▧<span>×</span></div></div>`;
        break;
      case "marquee":
        content = `<div class="marquee-stage"><div class="marquee-track"><span>设计系统</span><span>界面组件</span><span>中文术语</span><span>交互模式</span></div><small>内容持续横向循环</small></div>`;
        break;
      /* ── TDesign 专属 demo（TDesign 蓝 #0052d9 主题）── */
      case "td-input":
        content = `<div class="tdinput-stage"><label>用户名</label><div class="tdinput"><em>admin</em><span class="ic">✓</span></div><small>支持前后置图标与状态</small></div>`;
        break;
      case "td-select":
        content = `<div class="tdsel-stage"><div class="tdsel-input">下拉选择 <span>▾</span></div><div class="tdsel-drop"><b>选项一 ✓</b><span>选项二</span><span>选项三</span></div></div>`;
        break;
      case "td-tabs":
        content = `<div class="tdtabs-stage"><nav><b>标签一</b><span>标签二</span><span>标签三</span></nav><div class="tdtabs-content"><i></i><i></i></div></div>`;
        break;
      case "td-badge":
        content = `<div class="tdbadge-stage"><div class="tdbadge-anchor">🔔<b>8</b></div><small>数字 · 红点 · 角标</small></div>`;
        break;
      case "td-tag":
        content = `<div class="tdtag-stage"><span class="tdtag">默认</span><span class="tdtag primary">主要</span><span class="tdtag success">成功</span><span class="tdtag warning">警告</span><span class="tdtag danger">危险</span></div>`;
        break;
      case "td-switch":
        content = `<div class="tdswitch-stage"><label><span class="tdswitch on"><i></i></span> 开启</label><label><span class="tdswitch"><i></i></span> 关闭</label></div>`;
        break;
      case "td-checkbox":
        content = `<div class="tdchk-stage"><label><span class="tdchk on">✓</span> 已选</label><label><span class="tdchk"></span> 未选</label><label><span class="tdchk ind">—</span> 部分</label></div>`;
        break;
      case "td-radio":
        content = `<div class="tdradio-stage"><label><span class="tdradio on"><i></i></span> 选项 A</label><label><span class="tdradio"></span> 选项 B</label></div>`;
        break;
      case "td-slider":
        content = `<div class="tdslider-stage"><span>🔈</span><div class="tdslider-track"><i></i><b></b></div><span>🔊</span><small>音量 62%</small></div>`;
        break;
      case "td-dialog":
        content = `<div class="tddialog-stage"><div class="tddialog-scrim"></div><div class="tddialog"><b>确认删除？</b><p>此操作不可逆</p><div class="tddialog-actions"><span>取消</span><b>确认</b></div></div></div>`;
        break;
      case "td-drawer":
        content = `<div class="tddrawer-stage"><div class="tddrawer-scrim"></div><div class="tddrawer"><b>详情面板</b><i></i><i></i><i></i></div></div>`;
        break;
      case "td-tooltip":
        content = `<div class="tdtooltip-stage"><span class="tdtooltip">文字提示</span><span class="tdtooltip-btn">悬停触发</span></div>`;
        break;
      case "td-dropdown":
        content = `<div class="tddropdown-stage"><span class="tddropdown-btn">更多操作 ▾</span><div class="tddropdown-menu"><b>编辑</b><span>复制</span><span>删除</span></div></div>`;
        break;
      case "td-popconfirm":
        content = `<div class="tdpop-stage"><span class="tdpop-bubble">确定执行此操作？<b>取消 确定</b></span><span class="tdpop-btn">触发按钮</span></div>`;
        break;
      case "td-alert":
        content = `<div class="tdalert-stage"><div class="tdalert info"><span>i</span><b>信息提示</b><p>这是一条提示信息</p></div><div class="tdalert success"><span>✓</span><b>成功提示</b></div></div>`;
        break;
      case "td-message":
        content = `<div class="tdmsg-stage"><div class="tdmsg">✓ 操作成功</div><div class="tdmsg warn">⚠ 请注意</div></div>`;
        break;
      case "td-loading":
        content = `<div class="tdload-stage"><span class="tdspinner"></span><b>加载中…</b></div>`;
        break;
      case "td-progress":
        content = `<div class="tdprog-stage"><div class="tdprog-bar"><i></i></div><b>68%</b></div>`;
        break;
      case "td-skeleton":
        content = `<div class="tdskel-stage"><span class="tdskel-av"></span><div class="tdskel-lines"><i></i><i></i><i></i></div></div>`;
        break;
      case "td-breadcrumb":
        content = `<div class="tdcrumb-stage"><nav>首页 <span>›</span> 列表 <span>›</span> <b>详情</b></nav></div>`;
        break;
      case "td-pagination":
        content = `<div class="tdpage-stage"><span>‹</span><b>1</b><span>2</span><span>3</span><span>…</span><span>›</span></div>`;
        break;
      case "td-empty":
        content = `<div class="tdempty-stage"><div class="tdempty-ic">∅</div><b>暂无数据</b><small>当前没有任何内容</small></div>`;
        break;
      case "td-card":
        content = `<div class="tdcard-stage"><div class="tdcard"><b>卡片标题</b><p>卡片内容区域</p><small>操作按钮</small></div></div>`;
        break;
      case "td-image":
        content = `<div class="tdimg-stage"><div class="tdimg"><span>▧</span></div><small>支持懒加载与占位图</small></div>`;
        break;
      case "td-image-viewer":
        content = `<div class="tdviewer-stage"><div class="tdviewer-scrim"></div><div class="tdviewer"><span>▧</span><b>×</b></div><div class="tdviewer-tools"><span>🔍</span><span>↻</span></div></div>`;
        break;
      case "td-form":
        content = `<div class="tdform-stage"><div class="tdform-row"><label>用户名</label><div class="tdinput sm"><em>admin</em></div></div><div class="tdform-row"><label>密码</label><div class="tdinput sm err"><em>••••</em></div><small class="err">必填项</small></div></div>`;
        break;
      case "td-menu":
        content = `<div class="tdmenu-stage"><div class="tdmenu"><b>📊 仪表盘</b><span>👤 用户管理</span><span>⚙ 系统设置</span><span>📝 操作日志</span></div></div>`;
        break;
      case "td-collapse":
        content = `<div class="tdcol-stage"><div class="tdcol"><b>面板一</b><span>▾</span><p>已展开的内容</p></div><div class="tdcol"><b>面板二</b><span>▸</span></div></div>`;
        break;
      case "td-table":
        content = `<div class="tdtable-stage"><table><tr><th>姓名</th><th>职位</th><th>城市</th></tr><tr><td>林设计</td><td>设计师</td><td>上海</td></tr><tr><td>王开发</td><td>工程师</td><td>北京</td></tr></table></div>`;
        break;
      case "td-upload":
        content = `<div class="tdupload-stage"><div class="tdupload-zone"><span>⬆</span><b>点击或拖拽上传</b><small>支持批量上传</small></div></div>`;
        break;
      case "td-tree":
        content = `<div class="tdtree-stage"><span>▾ 📁 总部</span><b>  ✓ 技术部</b><span>    产品组</span><span>    设计组</span><span>▸ 📁 市场部</span></div>`;
        break;
      case "td-divider":
        content = `<div class="tddivider-stage"><p>第一段</p><hr><p>第二段</p></div>`;
        break;
      case "td-sticky-tool":
        content = `<div class="tdsticky-stage"><div class="tdsticky"><span>📞</span><span>💬</span><span>↑</span></div></div>`;
        break;
      case "td-focus-ring-web":
        content = `<div class="tdfocus-stage"><div class="tdfocus-ring"><em>已聚焦</em></div><small>键盘导航可见</small></div>`;
        break;
      case "td-truncation":
        content = `<div class="tdtrunc-stage"><div><b>完整</b><p>可完整显示的内容</p></div><div><b>截断</b><p>这是一段很长的文字会被…</p></div></div>`;
        break;
      case "td-button":
        content = `<div class="btn-stage"><span class="t-btn primary">主要操作</span><span class="t-btn outline">次要</span><span class="t-btn ghost">幽灵</span><span class="t-btn danger">删除</span><span class="t-btn disabled">禁用</span><small>主要 · 次要 · 幽灵 · 危险 · 禁用</small></div>`;
        break;
      case "td-avatar":
        content = `<div class="avatar-stage"><div class="t-avatar-group"><span class="t-avatar blue">林</span><span class="t-avatar green">王</span><span class="t-avatar purple">张</span><span class="t-avatar overflow">+3</span></div><div class="t-avatar-row"><span class="t-avatar square img">▧</span><span class="t-avatar small orange">李</span><span class="t-avatar small gray">☺</span></div></div>`;
        break;
      case "td-input-number":
        content = `<div class="num-stage"><label>数量</label><div class="t-input-number"><span class="dec">−</span><em>3</em><span class="inc">+</span></div><small>min=0 · max=99 · step=1</small></div>`;
        break;
      case "td-textarea":
        content = `<div class="ta-stage"><label>留言</label><div class="t-textarea"><em>这是一段多行文本…</em></div><span class="ta-count">28 / 200</span></div>`;
        break;
      case "td-date-picker":
        content = `<div class="dp-stage"><div class="dp-head"><span>‹</span><b>2026 年 7 月</b><span>›</span></div><div class="dp-week"><i>一</i><i>二</i><i>三</i><i>四</i><i>五</i><i>六</i><i>日</i></div><div class="dp-days"><s></s><s></s><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b><b>10</b><b>11</b><b>12</b><b>13</b><b>14</b><em>15</em><b>16</b><b>17</b><b>18</b><b>19</b><b>20</b></div></div>`;
        break;
      case "td-time-picker":
        content = `<div class="tp-stage"><div class="tp-col"><b>14</b><span>13</span><span>15</span></div><div class="tp-col"><b>30</b><span>29</span><span>31</span></div><div class="tp-col"><span>00</span></div></div>`;
        break;
      case "td-cascader":
        content = `<div class="casc-stage"><div class="casc-col"><b>广东 ›</b><span>北京</span><span>上海</span></div><div class="casc-col"><span>广州</span><b>深圳 ›</b><span>东莞</span></div><div class="casc-col"><span>南山区</span><span>福田区</span><span>宝安区</span></div></div>`;
        break;
      case "td-transfer":
        content = `<div class="xfr-stage"><div class="xfr-box"><b>源列表</b><span class="chk">✓ 选项一</span><span class="chk">✓ 选项二</span><span class="chk">选项三</span></div><div class="xfr-arrows"><span>›</span><span>»</span><span>‹</span></div><div class="xfr-box"><b>目标列表</b><span class="chk">✓ 选项四</span></div></div>`;
        break;
      case "td-color-picker":
        content = `<div class="cp-stage"><div class="cp-swatch" style="background:#0052d9"></div><div class="cp-grid"><i style="background:#f00"></i><i style="background:#ff0"></i><i style="background:#0f0"></i><i style="background:#00f"></i><i style="background:#f0f"></i><i style="background:#0052d9"></i></div><div class="cp-input">#0052D9</div></div>`;
        break;
      case "td-steps":
        content = `<div class="steps-stage"><div class="t-step done"><b>1</b><span>填写信息</span></div><div class="t-step-line done"></div><div class="t-step active"><b>2</b><span>支付订单</span></div><div class="t-step-line"></div><div class="t-step"><b>3</b><span>完成</span></div></div>`;
        break;
      case "td-timeline":
        content = `<div class="tl-stage"><div class="t-tl"><i class="ok">✓</i><b>已签收</b><small>今天 14:30</small></div><div class="t-tl"><i class="cur"></i><b>派送中</b><small>今天 09:15</small></div><div class="t-tl"><i></i><span>运输中</span><small>昨天 22:00</small></div><div class="t-tl"><i></i><span>已下单</span><small>7月12日</small></div></div>`;
        break;
      case "td-list":
        content = `<div class="list-stage"><div class="t-list-item"><span class="li-av blue">林</span><div><b>林设计</b><p>发表了新文章</p></div></div><div class="t-list-item"><span class="li-av green">王</span><div><b>王开发</b><p>提交了代码审查</p></div></div><div class="t-list-item"><span class="li-av purple">张</span><div><b>张产品</b><p>更新了需求文档</p></div></div></div>`;
        break;
      case "td-comment":
        content = `<div class="cmt-stage"><div class="t-comment"><span class="cm-av blue">林</span><div class="cm-body"><b>林设计</b><small>3 小时前</small><p>这个设计方案很不错，细节处理到位 👍</p><div class="cm-acts"><span>👍 12</span><span>💬 回复</span></div></div></div></div>`;
        break;
      case "td-rate":
        content = `<div class="rate-stage"><div class="t-stars"><i>★</i><i>★</i><i>★</i><i>★</i><i class="off">★</i></div><b>4.0 / 5</b><small>点击星星进行评分</small></div>`;
        break;
      case "td-calendar":
        content = `<div class="cal-stage"><div class="cal-head"><b>2026 年 7 月</b><span>月 · 周</span></div><div class="cal-week"><i>一</i><i>二</i><i>三</i><i>四</i><i>五</i><i>六</i><i>日</i></div><div class="cal-grid"><s></s><s></s><b>1</b><b>2</b><b>3</b><b>4</b><b>5</b><b>6</b><b>7</b><b>8</b><b>9</b><b>10</b><b>11</b><b>12</b><b>13</b><b>14</b><em>15</em><b>16</b><b>17</b><b>18</b><b>19</b></div></div>`;
        break;
      case "td-notification":
        content = `<div class="notif-stage"><div class="t-notif info"><span class="n-ic">i</span><div><b>系统更新</b><p>v2.4.0 已发布，包含多项优化。</p></div></div><div class="t-notif success"><span class="n-ic">✓</span><div><b>保存成功</b><p>更改已同步到云端。</p></div></div></div>`;
        break;
      case "td-anchor":
        content = `<div class="anchor-stage"><div class="t-anchor"><i class="dot-active"></i><b>概览</b><i class="dot"></i><span>快速开始</span><i class="dot"></i><span>API 文档</span><i class="dot"></i><span>示例代码</span></div><div class="anchor-preview"><b>概览</b><p>这里是概览的内容区域。</p></div></div>`;
        break;
      case "td-back-top":
        content = `<div class="bt-stage"><div class="bt-page"><i></i><i></i><i></i><i></i><i></i></div><div class="t-back-top">↑</div></div>`;
        break;
      case "td-watermark":
        content = `<div class="wm-stage"><div class="wm-content"><b>机密文档</b><p>这是一段敏感内容。</p></div><div class="wm-layer"><span>内部</span><span>机密</span><span>内部</span><span>机密</span><span>内部</span><span>机密</span><span>内部</span><span>机密</span></div></div>`;
        break;
      case "td-typography":
        content = `<div class="typo-stage"><h3 class="t-h">排版标题</h3><p class="t-p">这是一段正文内容，展示排版组件的效果。</p><span class="t-link">文字链接</span><span class="t-text-sec">次要说明文字</span></div>`;
        break;
      case "td-space":
        content = `<div class="space-stage"><span class="sp-item">按钮</span><span class="sp-item">标签</span><span class="sp-item">图标</span></div>`;
        break;
      case "td-grid":
        content = `<div class="grid-stage"><span class="gr-col">col-8</span><span class="gr-col">col-8</span><span class="gr-col">col-8</span><span class="gr-col full">col-12</span><span class="gr-col full">col-12</span></div>`;
        break;
      case "td-swiper":
        content = `<div class="sw-stage"><div class="t-swiper"><b>01</b></div><div class="sw-dots"><i class="on"></i><i></i><i></i><i></i></div></div>`;
        break;
      case "td-tooltip-lite":
        content = `<div class="tlite-stage"><span class="t-tlite-btn">悬停查看</span><span class="t-tlite">轻量提示</span></div>`;
        break;
      case "td-affix":
        content = `<div class="affix-stage"><div class="affix-scroll"><div class="affix-head">固定头部（吸顶）</div><div class="affix-content"><i></i><i></i><i></i><i></i><i></i></div></div></div>`;
        break;
      case "td-layout":
        content = `<div class="lay-stage"><div class="t-layout"><div class="t-header">Header</div><div class="t-body"><div class="t-aside">Aside</div><div class="t-content">Content</div></div><div class="t-footer">Footer</div></div></div>`;
        break;
      case "td-icon":
        content = `<div class="icon-stage"><div class="icon-grid"><span>🔍</span><span>⚙</span><span>✉</span><span>☰</span><span>♥</span><span>★</span><span>👤</span><span>⬇</span></div><small>2100+ 图标</small></div>`;
        break;
      case "td-link":
        content = `<div class="link-stage"><span class="t-link-a">主要链接</span><span class="t-link-a succ">成功</span><span class="t-link-a warn">警告</span><span class="t-link-a dang">危险</span><span class="t-link-a dis">禁用</span></div>`;
        break;
      case "td-auto-complete":
        content = `<div class="ac-stage"><div class="ac-input"><em>北京</em><span>×</span></div><div class="ac-drop"><b>北京</b><span>北京市，中国</span><span>Beijing，Capital</span></div></div>`;
        break;
      case "td-tag-input":
        content = `<div class="tinput-stage"><div class="t-tag-input"><span class="t-tag">设计 <i>×</i></span><span class="t-tag">前端 <i>×</i></span><em>输入标签…</em></div></div>`;
        break;
      case "td-tree-select":
        content = `<div class="tsel-stage"><div class="tsel-input">选择节点 <span>▾</span></div><div class="tsel-tree"><span>▾ 总部</span><b>✓ 技术部</b><span> 产品组</span><span> 设计组</span><span>▸ 市场部</span></div></div>`;
        break;
      case "td-popup":
        content = `<div class="popup-stage"><span class="popup-btn">触发元素</span><span class="popup-bubble">Popup 弹出层</span></div>`;
        break;
      case "td-descriptions":
        content = `<div class="desc-stage"><table><tr><th>姓名</th><td>林设计</td><th>职位</th><td>产品设计师</td></tr><tr><th>部门</th><td>设计中心</td><th>城市</th><td>上海</td></tr></table></div>`;
        break;
      case "td-statistic":
        content = `<div class="stat-stage"><div class="t-stat"><small>总访问量</small><b>12,345</b><em>↑ 12.5%</em></div></div>`;
        break;
      case "td-guide":
        content = `<div class="guide-stage"><div class="guide-page"><i></i><i></i><i></i></div><div class="guide-spotlight"></div><div class="guide-pop"><b>欢迎使用</b><p>这是功能引导的第一步</p><span>跳过 1/3 下一步</span></div></div>`;
        break;
      case "td-config-provider":
        content = `<div class="cfg-stage"><div class="cfg-wrap"><span class="cfg-tag">ConfigProvider</span><div class="cfg-inner"><span class="cfg-btn">按钮</span><span class="cfg-input">输入框</span></div></div><small>统一注入主题、国际化配置</small></div>`;
        break;
      case "td-range-input":
        content = `<div class="rinput-stage"><div class="t-range-input"><em>100</em><span>—</span><em>500</em></div><small>价格区间（元）</small></div>`;
        break;
      case "td-select-input":
        content = `<div class="sinput-stage"><div class="t-select-input"><em>请选择…</em><span>▾</span></div><div class="sinput-drop"><span>选项一</span><b>选项二 ✓</b><span>选项三</span></div></div>`;
        break;
      case "td-qrcode":
        content = `<div class="qr-stage"><div class="qr-code"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><small>https://tdesign.tencent.com</small></div>`;
        break;
      default:
        if (term.category === "TDesign") {
          const compName = term.slug.replace(/^td-/, "");
          content = `<div class="tdesign-default"><div class="td-logo">T</div><div class="td-code">&lt;t-${compName}&gt;</div><div class="td-label">${term.zh}</div></div>`;
        } else {
          content = win(term.zh, `<div class="content-lines"><i></i><i></i><i></i></div>`);
        }
    }
    return `<div class="demo-scene demo-${term.slug}">${content}</div>`;
  };
})();
