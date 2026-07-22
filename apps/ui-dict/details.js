(function () {
  const exact = {
    "menu-bar": {
      long: "菜单栏横跨 Mac 屏幕顶部。左边是苹果菜单和当前 App 的各级菜单，右边是状态图标、控制中心和时钟。平时说的“Mac 顶栏”通常就是它，但栏里的图标、菜单和状态项各有自己的名称。",
      parts: [
        ["应用菜单（主菜单）", "NSApp.mainMenu", "左侧显示应用名以及文件、编辑、视图等菜单。"],
        ["菜单栏附加项（状态项）", "NSStatusItem", "右侧靠近时钟的小图标；SwiftUI 中对应 MenuBarExtra。"],
        ["模板图标", "NSImage.isTemplate", "会跟随菜单栏的浅色或深色外观自动变色的单色图标。"],
        ["高亮状态", "NSStatusBarButton.isHighlighted", "菜单打开时出现在图标背后的浅色圆角背景。"],
        ["菜单与菜单项", "NSMenu · NSMenuItem", "点击状态项后出现的菜单，以及其中可被选择的每一行。"],
        ["分隔项", "NSMenuItem.separator()", "在菜单中划分相关操作组的细线。"],
        ["键盘快捷键", "NSMenuItem.keyEquivalent", "显示在菜单项右边的快捷键，例如 ⌘Q。"]
      ]
    },
    "context-menu": {
      long: "上下文菜单就是大家常说的“右键菜单”。在某个文件、文字或对象上右键，或者按住 Control 再点按，它会出现在点击位置附近，只列出与当前对象有关的操作。它和由固定按钮打开的下拉菜单不是一回事。",
      parts: [
        ["选择高亮", "NSMenuItem", "指针所在菜单项背后的强调色圆角区域。"],
        ["分隔项", "NSMenuItem.separator()", "把复制、重命名、删除等操作划分成组。"],
        ["键盘快捷键", "NSMenuItem.keyEquivalent", "显示在菜单项右边的快捷键。"],
        ["子菜单指示器", "NSMenuItem.submenu", "表示当前菜单项右侧还有下一级选项的箭头。"]
      ]
    },
    "disclosure-triangle": {
      long: "展开三角形是显示或隐藏层级内容的小型旋转控件。收起时指向侧面，展开时转向下方，子项紧跟在父项下面出现；它常见于“访达”列表、项目导航和大纲视图。",
      parts: [
        ["展开控件", "NSButton.BezelStyle.disclosure", "标题左侧可点击的小三角或折叠指示器。"],
        ["收起状态", "DisclosureGroup.isExpanded = false", "指示器朝向侧面，子项不可见。"],
        ["展开状态", "DisclosureGroup.isExpanded = true", "指示器向下旋转，并显示嵌套内容。"]
      ]
    },
    "dock-badge": {
      long: "程序坞角标是 App 图标右上角的红色数字或短文字，常用来提示未读消息和待处理事项。Apple 文档也会把它称作程序坞标记；如果整个 App 图标上下跳动，那叫图标弹跳，是另一种更强的提醒。",
      parts: [
        ["红色标记", "NSDockTile.badgeLabel", "叠在 App 图标右上角的红色数字或短文字。"],
        ["图标弹跳", "NSApplication.requestUserAttention(_:)", "程序坞中的 App 图标上下跳动，用来吸引注意；它不属于红色标记。"]
      ],
      prompt: "显示程序坞标记：把数量赋给 NSApp.dockTile.badgeLabel，没有待处理数量时清空标签。如果确实需要更强的提醒，再单独调用 NSApplication.requestUserAttention(_:) 让程序坞图标弹跳；弹跳不属于标记本身。",
      debug: "排查 macOS 程序坞标记（NSDockTile.badgeLabel、NSApp.dockTile）：确认清除时使用 nil 或空字符串，而不是字符串 \"0\"；确认从主线程设置；不要假设 App 退出后标记仍会保留；检查过长文字是否在图标上被截断。当前症状：",
      naming: "主标题采用国内产品和设计语境更常见的“角标”；Apple 文档中的“标记”和 AppKit 属性 badgeLabel 保留在别名与 API 中。",
      sources: [{ label: "Apple · NSDockTile", url: "https://developer.apple.com/documentation/appkit/nsdocktile" }],
      related: ["badge", "menu-bar-extra", "toast"]
    },
    "focus-ring": {
      long: "焦点环是控件获得键盘输入焦点后出现的强调色光环。它告诉键盘用户下一次输入或空格键会作用于哪个控件，不应仅依赖颜色很浅的边框替代。",
      parts: [
        ["键盘焦点", "firstResponder", "当前接收键盘输入的控件。"],
        ["焦点环样式", "NSView.focusRingType", "沿控件边界绘制的系统强调色外圈。"]
      ]
    },
    "inspector": {
      long: "检查器通常位于窗口右侧，用来查看和修改当前所选对象的属性。选中不同对象时，里面的内容也会随之更新；样式、尺寸、边框和阴影等设置一般会分组显示，方便快速查找。",
      parts: [
        ["当前选择", "selection", "检查器内容所对应的画布对象或列表项。"],
        ["属性分组", "", "按样式、布局或行为整理在一起的设置区域。"],
        ["检查器栏", "View.inspector(isPresented:content:)", "在 SwiftUI 中附加到主内容右侧的系统检查器。"]
      ]
    },
    "hamburger-menu": {
      long: "三条横线本身叫汉堡按钮，点开后从屏幕侧边滑出的面板叫导航抽屉。按钮只是入口，抽屉才是承载导航链接的区域；手机端通常把它放在页面左上角，抽屉打开时会盖在页面和半透明遮罩层之上。不要把三点菜单、更多菜单和汉堡菜单混为一谈。",
      parts: [
        ["汉堡按钮", "aria-expanded + aria-controls", "由三条横线组成的开关按钮；aria-expanded 要与抽屉当前的展开状态保持一致。"],
        ["导航抽屉", "Sheet side=\"left\"", "从屏幕侧边滑入的站点导航面板，位于页面和遮罩层上方。"]
      ],
      prompt: "请实现一个汉堡菜单：使用带 aria-expanded 和 aria-controls 的按钮绘制三条横线，点按后从左侧滑入包含 <nav> 的导航抽屉，并在页面上覆盖半透明遮罩层。可使用 shadcn/ui 的 Sheet side=\"left\" 或 Material NavigationDrawer。打开时锁定页面滚动；按 Escape、点按遮罩层或选择链接后关闭；关闭后把键盘焦点送回汉堡按钮，并始终让 aria-expanded 与实际状态一致。",
      debug: "请排查汉堡菜单（aria-expanded 开关 + 侧滑 <nav> 导航抽屉）：检查抽屉是否错误地位于遮罩层或页头下方；打开后背景页面是否仍能滚动；aria-expanded 是否没有随状态切换；关闭后焦点是否没有回到汉堡按钮；translateX 的方向是否写反；以及桌面断点隐藏按钮后，完整导航链接是否也被一并隐藏。当前症状：",
      related: ["three-dots", "dialog-drawer-sheet", "scrim"]
    },
    "menu-bar-extra": {
      long: "菜单栏状态项位于 Mac 菜单栏右侧，通常用一个小图标显示 App 状态或提供快捷操作。AppKit 中对应 NSStatusItem，SwiftUI 中对应 MenuBarExtra；它不是 Windows 的系统托盘，但在中文交流中常被类比为“托盘图标”。",
      parts: [
        ["状态图标", "NSStatusBarButton", "显示在菜单栏中的图标或简短标题。"],
        ["状态菜单", "NSMenu", "点按状态图标后出现的操作菜单。"],
        ["高亮状态", "isHighlighted", "菜单打开时，图标背后出现的系统高亮背景。"]
      ],
      naming: "“菜单栏附加项”是 Menu Bar Extra 的直接译法；主标题改用更能说明位置和用途的“菜单栏状态项”，并保留“附加项”作为别名。",
      sources: [{ label: "Apple · MenuBarExtra", url: "https://developer.apple.com/documentation/swiftui/menubarextra" }]
    },
    "popover": {
      long: "弹出框贴着触发它的按钮或对象出现，用来展示补充内容和少量操作。它通常带有指向触发位置的小箭头；点击外部或完成操作后关闭，不会像普通窗口那样长期独立存在。",
      parts: [
        ["触发控件", "positioningRect", "用户点按后打开弹出框的按钮或对象。"],
        ["内容区域", "contentViewController", "承载说明、选项或少量操作。"],
        ["定位箭头", "preferredEdge", "指向触发控件，并说明弹出框与来源的关系。"]
      ],
      naming: "Apple 简体中文资料常写“弹出窗口”，国内组件库更常使用“弹出框”或“气泡卡片”。本站以“弹出框”为主标题，同时保留平台官方叫法。",
      sources: [
        { label: "Apple · Popovers", url: "https://developer.apple.com/design/human-interface-guidelines/popovers" },
        { label: "Element Plus · Popover", url: "https://element-plus.org/zh-CN/component/popover.html" }
      ]
    },
    "sheet": {
      long: "窗口附属对话框是依附于某个 Mac 窗口的模态界面，通常从标题栏下方展开。用户必须先完成或取消其中的任务，才能继续操作它所属的窗口，但不会阻塞 App 中的其他窗口。",
      parts: [
        ["所属窗口", "sheetParent", "被当前对话框暂时阻塞的文档窗口。"],
        ["附属对话框", "beginSheet", "承载保存、导出或确认等必须先完成的任务。"],
        ["完成操作", "endSheet", "确认或取消后关闭，并把控制权交还所属窗口。"]
      ],
      naming: "Apple HIG 将 macOS Sheet 本地化为“表单”，但国内开发语境中的“表单”通常指 Form。为避免让用户和 AI 做成输入表单，主标题使用“窗口附属对话框”。",
      sources: [{ label: "Apple HIG · Sheets", url: "https://developer.apple.com/cn/design/human-interface-guidelines/sheets" }]
    },
    "save-panel": {
      long: "保存面板是 macOS 提供的系统文件保存界面，让用户填写文件名、选择文件夹并确认保存。它由系统统一提供，因此位置浏览、权限提示和文件名处理都应交给 NSSavePanel，而不是自己仿制。",
      parts: [
        ["文件名字段", "nameFieldStringValue", "填写即将保存的文件名称。"],
        ["位置浏览区", "directoryURL", "选择桌面、文稿或其他目标文件夹。"],
        ["保存按钮", "runModal / begin", "确认名称和位置并返回用户选择结果。"]
      ],
      naming: "“存储面板”可以在部分 Apple 本地化资料中看到，但国内用户更习惯“保存面板”或“保存对话框”。",
      sources: [{ label: "Apple · NSSavePanel", url: "https://developer.apple.com/documentation/appkit/nssavepanel" }]
    },
    "color-well": {
      long: "颜色选择按钮显示当前颜色，点按后打开系统颜色面板供用户调整。它本身只是当前颜色的入口，不等同于包含色相、明度、预设色板等完整功能的颜色选择器。",
      parts: [
        ["当前颜色", "color", "按钮表面显示的已选颜色。"],
        ["颜色面板", "NSColorPanel", "点按后出现的完整系统取色界面。"],
        ["颜色变化", "colorAction", "用户选色后发送更新事件。"]
      ],
      naming: "Color Well 直译为“颜色池”不符合多数国内用户的表达习惯；主标题按功能写成“颜色选择按钮”，“颜色池”保留为平台术语别名。",
      sources: [{ label: "Apple · NSColorWell", url: "https://developer.apple.com/documentation/appkit/nscolorwell" }]
    },
    "divider": {
      long: "分割线用一条水平线或垂直线区分相关内容组。它只负责建立视觉层级，不应该代替真正的页面分区标题；当分隔具有语义时，可使用 hr 或 role=separator。",
      parts: [
        ["线条", "Divider", "水平或垂直的视觉边界。"],
        ["间距", "margin / spacing", "让分割线与两侧内容保持清晰距离。"],
        ["分割文字", "children", "可选的说明文字，用于标记下一个内容分组。"]
      ],
      naming: "Ant Design、Element Plus 和 Semi Design 均主要使用“分割线”；“分隔线”仍是正确近义词，保留为搜索别名。",
      sources: [
        { label: "Ant Design · 分割线", url: "https://ant.design/components/divider-cn/" },
        { label: "Element Plus · 分割线", url: "https://element-plus.org/zh-CN/component/divider" }
      ]
    },
    "progress-indicators": {
      long: "进度条展示任务已经完成的比例，常见形式包括水平线、圆环和分段进度。只有知道完成比例时才应显示百分比；如果无法估算进度，应改用加载器，而不是让进度条停在一个虚假数值上。",
      parts: [
        ["进度轨道", "track", "表示整个任务范围的背景区域。"],
        ["已完成部分", "value", "随实际完成比例增长的强调色区域。"],
        ["进度文字", "aria-valuenow", "显示百分比、当前步骤或剩余时间。"]
      ],
      naming: "国内组件库普遍把 Progress 称为“进度条”；原来的“进度指示器”是更宽泛的上位概念，现保留为别名。",
      sources: [{ label: "Ant Design · 进度条", url: "https://ant.design/components/progress-cn/" }],
      related: ["loading-spinner", "skeleton", "toast"]
    },
    "skeleton": {
      long: "骨架屏在真实内容到达前，用灰色块模拟标题、头像和正文的大致布局。它适合结构已知但内容尚未返回的页面，并应尽量保持与最终内容相同的尺寸，避免加载完成后发生明显跳动。",
      parts: [
        ["轮廓占位", "Skeleton", "模拟最终内容的形状和排列。"],
        ["加载状态", "aria-busy", "告诉辅助技术当前区域仍在更新。"],
        ["真实内容", "loaded state", "数据返回后一次性替换骨架，而不是和骨架重叠。"]
      ],
      naming: "“骨架屏”是 Ant Design、Element Plus 和 Semi Design 共同采用的成熟中文名称。",
      sources: [{ label: "Ant Design · 骨架屏", url: "https://ant.design/components/skeleton-cn/" }],
      related: ["loading-spinner", "progress-indicators", "empty-state"]
    },
    "loading-spinner": {
      long: "加载器用持续旋转的图形表示系统正在处理，但不承诺具体完成比例。它适合短时间、无法估算进度的等待；持续时间较长时，应补充文字、取消操作或改用可显示进度的进度条。",
      parts: [
        ["旋转图形", "Spin / Spinner", "提供持续但不确定的加载反馈。"],
        ["状态文字", "aria-label", "说明正在加载什么，而不只显示一个无含义的动画。"],
        ["覆盖范围", "aria-busy", "明确是按钮、局部区域还是整页正在处理。"]
      ],
      naming: "不同国内组件库分别使用“加载中”“加载器”“加载”等名称；本站以可独立指代组件的“加载器”为主标题，并保留其他叫法。",
      sources: [
        { label: "Ant Design · 加载中", url: "https://ant.design/components/spin-cn/" },
        { label: "Semi Design · 加载器", url: "https://semi.design/zh-CN/feedback/spin" }
      ],
      related: ["progress-indicators", "skeleton", "toast"]
    },
    "badge": {
      long: "徽章依附在图标、头像或标题附近，用数字、小圆点或短文字提示未读数量和状态。它通常只负责提示，不应承载主要操作；当数量为零时是否隐藏，需要根据业务含义明确决定。",
      parts: [
        ["承载对象", "children", "徽章所依附的图标、头像或标题。"],
        ["数字角标", "count", "显示待处理数量，并设置合理的封顶值。"],
        ["状态点", "status / dot", "只表达是否存在新状态，不展示具体数量。"]
      ],
      naming: "Ant Design 使用“徽标数”，Element Plus 与 Semi Design 使用“徽章”。本站选择覆盖范围更广的“徽章”，并把“徽标数”和“角标”保留为别名。",
      sources: [
        { label: "Ant Design · 徽标数", url: "https://ant.design/components/badge-cn/" },
        { label: "Element Plus · 徽章", url: "https://element-plus.org/zh-CN/component/badge" }
      ],
      related: ["dock-badge", "chip", "pill"]
    },
    "chip": {
      long: "可交互标签表示一个已选条件、关键词或对象，并允许用户选择、筛选或删除。它与只负责展示分类的普通标签不同：如果右侧带关闭按钮，就必须支持键盘访问并提供清楚的删除名称。",
      parts: [
        ["标签文字", "label", "说明当前条件、关键词或对象。"],
        ["选中状态", "selected", "表示该标签是否正在参与筛选。"],
        ["删除按钮", "closable", "移除当前标签，不能只依靠一个没有名称的叉号。"]
      ],
      naming: "Chip 在国内没有唯一统一译名，常被并入 Tag。本站用“可交互标签”强调其可选择、筛选或删除的行为，并始终保留英文 Chip。",
      sources: [{ label: "Material · Chips", url: "https://m3.material.io/components/chips/overview" }],
      related: ["pill", "badge", "toggle-group"]
    },
    "pill": {
      long: "胶囊标签指两端呈完整圆弧的短标签，常用于展示状态、类别或轻量信息。Pill 首先描述的是外形，不代表它一定能点击；是否可交互必须由按钮语义、悬停状态和键盘焦点共同说明。",
      parts: [
        ["胶囊外形", "border-radius", "圆角至少达到高度的一半，使两端形成完整圆弧。"],
        ["状态文字", "label", "使用简短词语表达状态或分类。"],
        ["交互语义", "button / span", "可点击时使用按钮，不可点击时保持纯展示语义。"]
      ],
      naming: "Pill 描述视觉形状而不是固定组件类型；“胶囊标签”比单独写“胶囊”更清楚，同时保留英文名帮助检索。",
      sources: [{ label: "Bootstrap · Badges", url: "https://getbootstrap.com/docs/5.3/components/badge/" }],
      related: ["chip", "badge", "toggle-group"]
    },
    "breadcrumbs": {
      long: "面包屑显示当前页面在网站层级中的路径，通常从首页逐级通向当前页面。前面的层级可以点击返回，最后一项表示当前位置，不应再做成跳向自身的链接。",
      parts: [
        ["路径容器", "nav aria-label=breadcrumb", "向辅助技术说明这是一组面包屑导航。"],
        ["上级链接", "a", "允许返回首页、分类或上一级页面。"],
        ["当前位置", "aria-current=page", "标记用户当前所在页面。"]
      ],
      naming: "国内主流组件库的组件标题普遍直接使用“面包屑”；“面包屑导航”作为完整解释保留在别名中。",
      sources: [{ label: "Ant Design · 面包屑", url: "https://ant.design/components/breadcrumb-cn/" }]
    },
    "form-field": {
      long: "表单项是一组完整的输入单元，由字段名称、输入控件、帮助说明和校验信息组成。输入框只是其中一个部分；标签必须与控件建立关联，错误提示也要明确说明如何修正。",
      parts: [
        ["字段标签", "label", "说明用户需要填写什么，并与输入控件绑定。"],
        ["输入控件", "input / select", "接收文字、选择或其他用户输入。"],
        ["帮助说明", "aria-describedby", "补充格式、用途或隐私信息。"],
        ["错误提示", "aria-invalid", "指出当前问题，并给出可执行的修正方法。"]
      ],
      naming: "“表单字段”在数据模型语境中很常见；国内组件库和前端代码更常把完整的一组 label、控件与错误信息称作“表单项”或 Form.Item。",
      sources: [{ label: "Ant Design · Form.Item", url: "https://ant.design/components/form-cn/" }]
    }
  };

  const frameworkFor = (symbol, category) => {
    if (/^NS|AppKit/.test(symbol)) return "AppKit";
    if (/SwiftUI|View\.|Navigation|Picker|ScrollView|Alert|Slider|ColorPicker|Stepper|ProgressView/.test(symbol)) return "SwiftUI";
    if (/role=|input|dialog|CSS|position:|text-overflow|details|nav |progress|DragEvent|aria-|:focus/.test(symbol)) return "Web";
    return category === "macOS" ? "macOS" : "网页 / 界面模式";
  };

  const apiRows = (term) => term.api.split("·").map((value) => value.trim()).filter(Boolean).map((symbol) => ({
    framework: frameworkFor(symbol, term.category),
    symbol
  }));

  const displayOnly = new Set([
    "divider", "progress-indicators", "skeleton", "loading-spinner", "badge", "chip", "pill", "breadcrumbs",
    "empty-state", "truncation", "lightbox", "marquee", "vibrancy", "level-indicator"
  ]);

  window.getTermDetail = function getTermDetail(term, allTerms) {
    const override = exact[term.slug] || {};
    const rows = apiRows(term);
    const isDisplayOnly = displayOnly.has(term.slug);
    const parts = override.parts || [
      ["主要部分", rows[0]?.symbol || term.en, term.desc],
      [isDisplayOnly ? "显示变化" : "操作与反馈", rows[1]?.symbol || "", isDisplayOnly
        ? "内容、数值或加载状态发生变化时，画面也要及时更新，并保持清楚易读。"
        : "用户点按、输入或使用键盘操作后，应立即看到明确的选中、展开、禁用或完成反馈。"]
    ];
    const related = override.related || allTerms
      .filter((item) => item.slug !== term.slug && (item.category === term.category || item.demo === term.demo))
      .slice(0, 3)
      .map((item) => item.slug);
    return {
      long: override.long || `${term.desc} ${term.category === "macOS" ? "在 Mac App 里" : "在网页和跨平台应用里"}，用户通常会根据它出现的位置、样子和操作后的反应来判断用途。${isDisplayOnly ? "实现时要兼顾内容变化、不同屏幕宽度和清晰度，不能只把静态外观画出来。" : "实现时不仅要还原外观，还要让鼠标、触控板和键盘操作都符合用户习惯，并给出清楚的状态反馈。"}`,
      naming: override.naming || "",
      sources: override.sources || [],
      parts: parts.map(([name, api, description]) => ({ name, api, description })),
      prompt: override.prompt || `请帮我实现${term.zh}（${term.en}），优先使用 ${rows.map((row) => row.symbol).join(" / ")}。外观和操作方式要符合平台习惯；同时处理好${isDisplayOnly ? "内容变化、加载状态、文字溢出和窄屏显示" : "默认、悬停、键盘焦点、禁用和内容过长"}等情况，不要拿一个只是长得相似、用途却不同的控件代替。`,
      debug: override.debug || `请帮我排查${term.zh}（${term.en}）的问题。先确认控件类型和使用场景是否正确，再检查${isDisplayOnly ? "数据变化后画面有没有及时更新、文字或内容是否溢出，以及窄屏下布局是否错位" : "点击和键盘操作是否一致、选中或禁用状态是否清楚，以及内容过长或屏幕变窄时布局是否错位"}。我现在遇到的情况是：`,
      code: rows,
      related
    };
  };
})();
