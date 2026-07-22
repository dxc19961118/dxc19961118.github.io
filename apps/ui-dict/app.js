const terms = window.UI_TERMS;
const root = document.documentElement;
const homeView = document.querySelector("#home-view");
const detailView = document.querySelector("#detail-view");
const grid = document.querySelector("#term-grid");
const emptyResults = document.querySelector("#empty-results");
const searchDialog = document.querySelector("#search-dialog");
const searchInput = document.querySelector("#search-input");
const searchHint = document.querySelector("#search-hint");
const searchResults = document.querySelector("#search-results");
const siteUrl = "https://dengxc.netlify.app/apps/ui-dict/index.html";
let activeFilter = "全部";
let currentTerm = null;
let savedScrollPos = 0;

document
  .querySelectorAll("[data-nav-filter] small, [data-filter]")
  .forEach((el) => {
    const key = el.dataset.navFilter || el.dataset.filter;
    if (key === "全部") el.textContent = terms.length;
    else if (key === "macOS")
      el.textContent = terms.filter((t) => t.category === "macOS").length;
    else if (key === "通用 / Web")
      el.textContent = terms.filter((t) => t.category === "通用 / Web").length;
    else if (key === "TDesign")
      el.textContent = terms.filter((t) => t.category === "TDesign").length;
  });

const normalize = (value) =>
  value.toLocaleLowerCase("zh-CN").replace(/[\s/·—、，。：“”‘’（）()_-]/g, "");
const searchableText = (term) =>
  normalize(
    [term.zh, term.en, term.desc, term.aliases, term.api, term.category].join(
      " ",
    ),
  );
const routeFor = (term) => {
  const prefix =
    term.category === "macOS"
      ? "macos"
      : term.category === "TDesign"
        ? "tdesign"
        : "web";
  return `#/${prefix}/${term.slug}`;
};
const categoryLabel = (term) =>
  term.category === "macOS"
    ? "macOS"
    : term.category === "TDesign"
      ? "TDesign"
      : "Web / 通用";

function termCard(term) {
  return `
    <a class="term-card" href="${routeFor(term)}" data-slug="${term.slug}" aria-label="查看${term.zh}的完整解释">
      <span class="term-visual" aria-hidden="true">${renderTermDemo(term)}</span>
      <span class="term-meta"><span class="term-zh">${term.zh}</span><span class="term-category">${categoryLabel(term)}</span></span>
      <span class="term-en">${term.en}</span>
      <span class="term-api">${term.api.split("·")[0].trim()}</span>
      <span class="term-desc">${term.desc}</span>
    </a>`;
}

function renderGrid() {
  const filtered =
    activeFilter === "全部"
      ? terms
      : terms.filter((term) => term.category === activeFilter);
  grid.innerHTML = filtered.map(termCard).join("");
  emptyResults.hidden = filtered.length > 0;
}

function findTerms(query) {
  const needle = normalize(query);
  if (!needle) return [];
  const pairs = (value) =>
    value.length < 2
      ? [value]
      : Array.from({ length: value.length - 1 }, (_, index) =>
          value.slice(index, index + 2),
        );
  const queryPairs = pairs(needle);
  return terms
    .map((term) => {
      const haystack = searchableText(term);
      if (haystack.includes(needle)) return { term, score: 2 };
      const hits = queryPairs.filter((pair) => haystack.includes(pair)).length;
      return { term, score: hits / queryPairs.length };
    })
    .filter((item) => item.score >= 0.28)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item) => item.term);
}

function renderSearch(query) {
  const matches = findTerms(query);
  searchHint.hidden = query.length > 0;
  searchResults.innerHTML = matches
    .map(
      (term) => `
    <button class="search-result" type="button" data-search-slug="${term.slug}">
      <strong>${term.zh}</strong><span class="result-en">${term.en}</span>
      <p>${term.desc}</p>
    </button>`,
    )
    .join("");
  if (query && matches.length === 0) {
    searchResults.innerHTML =
      '<p class="empty-results">没有找到。试试描述它的位置、形状或点击后的效果。</p>';
  }
}

function openSearch() {
  if (!searchDialog.open) searchDialog.showModal();
  requestAnimationFrame(() => searchInput.focus());
}

function copyText(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const original = button.textContent;
    button.textContent = "✓ 已复制";
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  });
}

function showShareFeedback(button) {
  const original = button.innerHTML;
  button.textContent = button.classList.contains("icon-button")
    ? "✓"
    : "✓ 已复制文案";
  setTimeout(() => {
    button.innerHTML = original;
  }, 1400);
}

async function copyShareText(text, button) {
  await navigator.clipboard.writeText(text);
  showShareFeedback(button);
}

function renderDetail(term) {
  currentTerm = term;
  const detail = getTermDetail(term, terms);
  homeView.hidden = true;
  detailView.hidden = false;
  document.body.classList.add("detail-active");
  document.querySelector("#detail-platform").textContent =
    term.category === "macOS"
      ? "macOS"
      : term.category === "TDesign"
        ? "TDesign"
        : "Web";
  document.querySelector("#detail-demo").innerHTML = renderTermDemo(term);
  document.querySelector("#detail-title").textContent = term.zh;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  document.querySelector("#detail-apis").innerHTML = term.api
    .split("·")
    .map((api) => `<span>/</span><code>${esc(api.trim())}</code>`)
    .join("");
  document.querySelector("#detail-aliases").innerHTML =
    `<em>也叫</em> ${term.aliases.split(" ").filter(Boolean).join("、")}`;
  const namingNote = document.querySelector("#detail-naming");
  namingNote.hidden = !detail.naming;
  document.querySelector("#detail-naming-copy").textContent =
    detail.naming || "";
  document.querySelector("#detail-sources").innerHTML = (detail.sources || [])
    .map(
      (source) =>
        `<a href="${source.url}" target="_blank" rel="noreferrer">${source.label}</a>`,
    )
    .join("");
  document.querySelector("#detail-description").textContent = detail.long;
  document.querySelector("#detail-anatomy").innerHTML = detail.parts
    .map(
      (part, index) => `
    <div class="anatomy-row">
      <span class="anatomy-number">${index + 1}</span>
      <div><h3>${part.name}</h3>${part.api ? `<code>${part.api}</code>` : ""}<p>${part.description}</p></div>
      ${part.api ? `<button type="button" data-copy-text="${part.api.replaceAll('"', "&quot;")}" aria-label="复制 ${part.api}">▣</button>` : ""}
    </div>`,
    )
    .join("");
  document.querySelector("#detail-prompt").textContent = detail.prompt;
  document.querySelector("#detail-debug").textContent = detail.debug;
  document.querySelector("#detail-code").innerHTML = detail.code
    .map(
      (row) => `
    <div><span>${row.framework}</span><code>${row.symbol}</code><button type="button" data-copy-text="${row.symbol.replaceAll('"', "&quot;")}" aria-label="复制 ${row.symbol}">▣</button></div>`,
    )
    .join("");
  document.querySelector("#detail-related").innerHTML = detail.related
    .map((slug) => {
      const related = terms.find((item) => item.slug === slug);
      return `<a href="${routeFor(related)}"><b>${related.zh}</b><span>${related.en} · ${categoryLabel(related)}</span></a>`;
    })
    .join("");
  document.title = `${term.zh}（${term.en}）— 这个叫啥`;
  /* 仅在直接 URL 访问时保存（点击卡片时已在 click 事件中保存） */
  if (!savedScrollPos) savedScrollPos = window.pageYOffset;
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showHome() {
  currentTerm = null;
  detailView.hidden = true;
  homeView.hidden = false;
  document.body.classList.remove("detail-active");
  document.title = "这个叫啥 — 中文 UI 词典库";
  requestAnimationFrame(() => {
    window.scrollTo({ top: savedScrollPos, behavior: "instant" });
  });
}

function route() {
  const match = location.hash.match(/^#\/(?:macos|web|tdesign)\/([^/]+)$/);
  if (!match) {
    showHome();
    return;
  }
  const term = terms.find((item) => item.slug === match[1]);
  if (term) renderDetail(term);
  else showHome();
}

document
  .querySelectorAll("[data-open-search]")
  .forEach((button) => button.addEventListener("click", openSearch));
document
  .querySelector(".close-search")
  .addEventListener("click", () => searchDialog.close());

/* ── 拦截返回列表/首页链接，阻止浏览器锚点跳转覆盖滚动恢复 ── */
document.addEventListener("click", (event) => {
  const homeLink = event.target.closest(".back-to-list, [data-home-link]");
  if (homeLink && homeView.hidden) {
    event.preventDefault();
    location.hash = "";
    showHome();
  }
});

searchInput.addEventListener("input", (event) =>
  renderSearch(event.target.value),
);

document.addEventListener("click", (event) => {
  /* 点击卡片/相关链接：在 hash 变更前保存滚动位置 */
  const cardTarget = event.target.closest(".term-card, .detail-page .related-links a");
  if (cardTarget && !homeView.hidden) {
    savedScrollPos = window.pageYOffset;
  }
  const searchTarget = event.target.closest("[data-search-slug]");
  if (searchTarget) {
    savedScrollPos = window.pageYOffset;
    const term = terms.find(
      (item) => item.slug === searchTarget.dataset.searchSlug,
    );
    searchDialog.close();
    location.hash = routeFor(term).slice(1);
    return;
  }
  const copyTarget = event.target.closest("[data-copy-target]");
  if (copyTarget) {
    copyText(
      document.querySelector(`#${copyTarget.dataset.copyTarget}`).textContent,
      copyTarget,
    );
    return;
  }
  const copyValue = event.target.closest("[data-copy-text]");
  if (copyValue) copyText(copyValue.dataset.copyText, copyValue);
});

document.querySelector("#copy-page").addEventListener("click", (event) => {
  if (!currentTerm) return;
  const detail = getTermDetail(currentTerm, terms);
  copyText(
    `${currentTerm.zh}（${currentTerm.en}）\n\n${detail.long}\n\n实现提示词：\n${detail.prompt}\n\n排错提示词：\n${detail.debug}`,
    event.currentTarget,
  );
});

document.querySelector("#share-site").addEventListener("click", (event) => {
  copyShareText(
    `每个控件都有自己的名字。「这个叫啥」是一本中文 UI 词典库，帮你查到准确的中英文名称，还能直接复制给 AI 编程助手。\n${siteUrl}`,
    event.currentTarget,
  );
});

const bookmarkButton = document.querySelector("#bookmark-site");
const bookmarkTip = document.querySelector("#bookmark-tip");
const bookmarkInstruction = document.querySelector("#bookmark-instruction");

bookmarkButton.addEventListener("click", () => {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  bookmarkInstruction.textContent = isMobile
    ? "请从浏览器菜单中选择“添加到书签”"
    : `按 ${isApple ? "⌘D" : "Ctrl+D"} 加入浏览器收藏夹`;
  bookmarkTip.hidden = !bookmarkTip.hidden;
  bookmarkButton.setAttribute("aria-expanded", String(!bookmarkTip.hidden));
});

document.querySelector("#share-page").addEventListener("click", (event) => {
  if (!currentTerm) return;
  copyShareText(
    `「${currentTerm.zh}（${currentTerm.en}）」是什么？查看中文解释、界面示意和可直接复制给 AI 的实现提示词。\n${siteUrl}${routeFor(currentTerm)}`,
    event.currentTarget,
  );
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    openSearch();
  }
  if (event.key === "Escape" && !bookmarkTip.hidden) {
    bookmarkTip.hidden = true;
    bookmarkButton.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".bookmark-wrap") && !bookmarkTip.hidden) {
    bookmarkTip.hidden = true;
    bookmarkButton.setAttribute("aria-expanded", "false");
  }
});

searchDialog.addEventListener("click", (event) => {
  if (event.target === searchDialog) searchDialog.close();
});

document.querySelectorAll(".filter-tab").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    syncFilterUI();
    renderGrid();
  });
});

/* Sidebar nav */
function syncFilterUI() {
  document
    .querySelectorAll(".nav-item")
    .forEach((n) =>
      n.classList.toggle("active", n.dataset.navFilter === activeFilter),
    );
  document
    .querySelectorAll(".filter-tab")
    .forEach((t) =>
      t.classList.toggle("active", t.dataset.filter === activeFilter),
    );
}
document.querySelectorAll("[data-nav-filter]").forEach((item) => {
  item.addEventListener("click", () => {
    activeFilter = item.dataset.navFilter;
    syncFilterUI();
    renderGrid();
    if (homeView.hidden) {
      location.hash = "";
      showHome();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    closeSidebar();
  });
});

/* Mobile drawer */
const sidebar = document.querySelector(".sidebar");
const backdrop = document.querySelector(".backdrop");
function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
  if (backdrop) backdrop.classList.remove("open");
}
document.querySelector(".menu-toggle")?.addEventListener("click", () => {
  sidebar?.classList.add("open");
  backdrop?.classList.add("open");
});
backdrop?.addEventListener("click", closeSidebar);

/* Sidebar collapse — temporarily disabled
const collapseBtn = document.querySelector("#sidebar-collapse");
collapseBtn?.addEventListener("click", () => {
  const isCollapsed = sidebar.classList.toggle("collapsed");
  collapseBtn.setAttribute(
    "aria-label",
    isCollapsed ? "展开侧边栏" : "收起侧边栏",
  );
  const label = collapseBtn.querySelector("span");
  if (label) label.textContent = isCollapsed ? "展开" : "收起";
  try {
    localStorage.setItem(
      "ui-dict-sidebar",
      isCollapsed ? "collapsed" : "expanded",
    );
  } catch (_) {}
});
// Restore sidebar state
try {
  if (localStorage.getItem("ui-dict-sidebar") === "collapsed" && sidebar) {
    sidebar.classList.add("collapsed");
    collapseBtn?.setAttribute("aria-label", "展开侧边栏");
    const label = collapseBtn?.querySelector("span");
    if (label) label.textContent = "展开";
  }
} catch (_) {}
*/

document.querySelector("#theme-toggle").addEventListener("click", () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  localStorage.setItem("ui-dict-theme", theme);
  document
    .querySelector("#theme-toggle")
    .setAttribute(
      "aria-label",
      theme === "dark" ? "切换浅色主题" : "切换深色主题",
    );
});

const storedTheme = localStorage.getItem("ui-dict-theme");
if (storedTheme === "light" || storedTheme === "dark")
  root.dataset.theme = storedTheme;

/* Rotating prompts removed in sidebar redesign */

/* ── 返回顶部按钮 ── */
const backToTopBtn = document.querySelector("#back-to-top");
let backToTopTick = 0;
function syncBackToTop() {
  if (!backToTopBtn) return;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const show = scrollTop > 200;
  backToTopBtn.classList.toggle("visible", show);
  backToTopBtn.hidden = !show;
}
if (backToTopBtn) {
  window.addEventListener("scroll", () => {
    if (backToTopTick) return;
    backToTopTick = requestAnimationFrame(() => {
      syncBackToTop();
      backToTopTick = 0;
    });
  }, { passive: true });
  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  syncBackToTop();
}

window.addEventListener("hashchange", route);
renderGrid();
route();
