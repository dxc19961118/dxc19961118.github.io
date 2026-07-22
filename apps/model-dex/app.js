/**
 * app.js — 模型图鉴主逻辑
 * 数据拉取、路由、列表/排行/详情渲染、搜索/排序/筛选
 */
(function () {
  "use strict";

  /* ========== 常量 ========== */

  const CATALOG_URL = "https://models.dev/catalog.json";
  const LOGO_BASE = "https://models.dev/logos/labs";

  /* ========== 状态 ========== */

  const state = {
    catalog: null, // 原始 catalog 数据
    models: [], // 规范化后的模型数组
    providersByModel: {}, // modelId → [{provider, cost}]
    filteredModels: [], // 当前筛选后的模型
    currentView: "list", // list | detail
    currentModelId: null,
    filters: {
      lab: "",
      caps: new Set(), // 激活的能力筛选
      search: "",
    },
    sort: "release_date",
  };

  /* ========== DOM 引用 ========== */

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    modelGrid: $("#modelGrid"),
    emptyState: $("#emptyState"),
    viewList: $("#viewList"),
    viewDetail: $("#viewDetail"),
    loading: $("#loading"),
    error: $("#error"),
    errorMsg: $("#errorMsg"),
    statsModels: $("#statModels"),
    statsProviders: $("#statProviders"),
    searchInput: $("#searchInput"),
    filterLab: $("#filterLab"),
    sortSelect: $("#sortSelect"),
    themeToggle: $("#themeToggle"),
  };

  /* ========== 工具函数 ========== */

  function getLab(modelId) {
    return modelId.split("/")[0];
  }

  function formatNumber(n) {
    if (n == null) return "-";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  }

  function formatPrice(p) {
    if (p == null) return "-";
    if (p === 0) return "免费";
    return "$" + p.toFixed(2);
  }

  function escapeHtml(s) {
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  /* ========== 数据处理 ========== */

  function processData(catalog) {
    const modelsMap = catalog.models || {};
    const providersMap = catalog.providers || {};

    // 构建模型数组
    const models = Object.values(modelsMap).map((m) => {
      const lab = getLab(m.id);
      return {
        ...m,
        lab,
        logoUrl: `${LOGO_BASE}/${lab}.svg`,
      };
    });

    // 构建模型名 → canonical model 映射
    // provider 中的 model id 是短名（如 claude-sonnet-5），canonical id 是 long/short（如 anthropic/claude-sonnet-5）
    const canonicalByShortName = {};
    for (const m of models) {
      const parts = m.id.split("/");
      const shortName = parts[parts.length - 1];
      canonicalByShortName[shortName] = m.id;
    }

    // 构建 modelId → providers 映射
    const providersByModel = {};
    for (const [pid, provider] of Object.entries(providersMap)) {
      const pModels = provider.models || {};
      for (const [mid, pModel] of Object.entries(pModels)) {
        // 尝试匹配 canonical model
        let canonicalId = canonicalByShortName[mid];
        // 如果没匹配到，尝试完整 id
        if (!canonicalId && modelsMap[mid]) {
          canonicalId = mid;
        }
        // 如果还没匹配到，可能 mid 本身就是 canonical ID
        if (!canonicalId) continue;

        if (!providersByModel[canonicalId]) {
          providersByModel[canonicalId] = [];
        }
        providersByModel[canonicalId].push({
          provider: {
            id: pid,
            name: provider.name || pid,
            npm: provider.npm || "",
            doc: provider.doc || "",
            api: provider.api || "",
          },
          cost: pModel.cost || null,
        });
      }
    }

    // 为每个模型计算一个"官方"价格（取第一个供应商的价格，优先选 lab 同名的供应商）
    for (const model of models) {
      const providers = providersByModel[model.id] || [];
      const official =
        providers.find((p) => p.provider.id === model.lab) || providers[0];
      model.cost = official ? official.cost : null;
      model.providerCount = providers.length;
    }

    // 收集所有 lab 名称
    const labs = new Set(models.map((m) => m.lab));

    state.catalog = catalog;
    state.models = models;
    state.providersByModel = providersByModel;

    // 填充筛选下拉
    const labSelect = dom.filterLab;
    Array.from(labs)
      .sort()
      .forEach((lab) => {
        const opt = document.createElement("option");
        opt.value = lab;
        opt.textContent = lab;
        labSelect.appendChild(opt);
      });

    // 更新统计
    dom.statsModels.textContent = models.length;
    dom.statsProviders.textContent = Object.keys(providersMap).length;
  }

  /* ========== 筛选 / 排序 ========== */

  function applyFiltersAndSort() {
    let result = [...state.models];
    const { lab, caps, search } = state.filters;

    // 实验室筛选
    if (lab) {
      result = result.filter((m) => m.lab === lab);
    }

    // 能力筛选
    for (const cap of caps) {
      result = result.filter((m) => !!m[cap]);
    }

    // 搜索
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.id && m.id.toLowerCase().includes(q)) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.lab && m.lab.toLowerCase().includes(q)),
      );
    }

    // 排序
    const sort = state.sort;
    result.sort((a, b) => {
      switch (sort) {
        case "release_date":
          return (b.release_date || "").localeCompare(a.release_date || "");
        case "context":
          return (b.limit?.context || 0) - (a.limit?.context || 0);
        case "cost_input": {
          const ca = a.cost?.input ?? Infinity;
          const cb = b.cost?.input ?? Infinity;
          return ca - cb;
        }
        case "cost_output": {
          const ca = a.cost?.output ?? Infinity;
          const cb = b.cost?.output ?? Infinity;
          return ca - cb;
        }
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return 0;
      }
    });

    state.filteredModels = result;
  }

  /* ========== 列表渲染 ========== */

  function renderModelCard(model) {
    const limit = model.limit || {};
    const context = formatNumber(limit.context);
    const cost = model.cost || {};
    const inputPrice = cost.input != null ? formatPrice(cost.input) : "-";
    const outputPrice = cost.output != null ? formatPrice(cost.output) : "-";

    const tags = [];
    if (model.reasoning)
      tags.push(
        '<span class="tag tag-reasoning"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>推理</span>',
      );
    if (model.tool_call)
      tags.push(
        '<span class="tag tag-tool"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>工具</span>',
      );
    if (model.structured_output)
      tags.push(
        '<span class="tag tag-structured"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>结构化</span>',
      );
    if (model.open_weights)
      tags.push(
        '<span class="tag tag-open"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>开源</span>',
      );

    return `
      <article class="model-card" data-id="${model.id}">
        <div class="card-header">
          <div class="card-logo">
            <img src="${model.logoUrl}" alt="${model.lab}" loading="lazy"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span class="card-logo-fallback" style="display:none">${model.lab.charAt(0).toUpperCase()}</span>
          </div>
          <div class="card-info">
            <div class="card-name">${escapeHtml(model.name)}</div>
            <div class="card-lab">${model.lab}${model.family ? " · " + model.family : ""}</div>
          </div>
        </div>
        <div class="card-desc">${escapeHtml(model.description || "")}</div>
        <div class="card-meta">
          <span class="meta-chip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            ${context} ctx
          </span>
          ${limit.output ? `<span class="meta-chip">输出 ${formatNumber(limit.output)}</span>` : ""}
          ${model.providerCount ? `<span class="meta-chip">${model.providerCount} 供应商</span>` : ""}
          ${model.release_date ? `<span class="meta-chip">${model.release_date}</span>` : ""}
        </div>
        ${tags.length ? `<div class="card-tags">${tags.join("")}</div>` : ""}
        <div class="card-price">
          <span class="price-item">输入 <strong>${inputPrice}</strong>/M</span>
          <span class="price-item">输出 <strong>${outputPrice}</strong>/M</span>
        </div>
      </article>
    `;
  }

  function renderList() {
    applyFiltersAndSort();
    const models = state.filteredModels;

    if (models.length === 0) {
      dom.modelGrid.innerHTML = "";
      dom.emptyState.classList.remove("hidden");
      return;
    }

    dom.emptyState.classList.add("hidden");
    dom.modelGrid.innerHTML = models.map(renderModelCard).join("");
  }

  /* ========== 详情页渲染 ========== */

  function renderDetail(modelId) {
    const model = state.models.find((m) => m.id === modelId);
    if (!model) {
      dom.viewDetail.innerHTML =
        '<p style="text-align:center;padding:40px;color:var(--fg-muted)">模型未找到</p>';
      return;
    }
    const providers = state.providersByModel[modelId] || [];
    dom.viewDetail.innerHTML = DetailView.render(model, providers);
  }

  /* ========== 视图切换 ========== */

  function switchView(view, modelId) {
    state.currentView = view;
    state.currentModelId = modelId || null;

    dom.viewList.classList.add("hidden");
    dom.viewDetail.classList.add("hidden");

    switch (view) {
      case "detail":
        dom.viewDetail.classList.remove("hidden");
        if (modelId) renderDetail(modelId);
        break;
      default:
        dom.viewList.classList.remove("hidden");
        renderList();
        break;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ========== 路由 ========== */

  function handleRoute() {
    const hash = window.location.hash || "#/";

    if (hash.startsWith("#/model/")) {
      const modelId = decodeURIComponent(hash.slice(8));
      switchView("detail", modelId);
    } else {
      switchView("list");
    }
  }

  /* ========== 主题 ========== */

  function initTheme() {
    const stored = localStorage.getItem("model-dex-theme");
    if (stored) {
      document.documentElement.dataset.theme = stored;
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.dataset.theme = "dark";
    }
  }

  function toggleTheme() {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("model-dex-theme", next);
  }

  /* ========== 事件绑定 ========== */

  function bindEvents() {
    // 主题切换
    dom.themeToggle.addEventListener("click", toggleTheme);

    // 搜索
    dom.searchInput.addEventListener("input", (e) => {
      state.filters.search = e.target.value.trim();
      renderList();
    });

    // Ctrl+K 聚焦搜索
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        dom.searchInput.focus();
        dom.searchInput.select();
      }
    });

    // 实验室筛选
    dom.filterLab.addEventListener("change", (e) => {
      state.filters.lab = e.target.value;
      renderList();
    });

    // 能力筛选
    $$(".cap-toggle").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cap = btn.dataset.cap;
        btn.classList.toggle("active");
        if (state.filters.caps.has(cap)) {
          state.filters.caps.delete(cap);
        } else {
          state.filters.caps.add(cap);
        }
        renderList();
      });
    });

    // 排序
    dom.sortSelect.addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderList();
    });

    // 重置筛选
    $("#btnReset").addEventListener("click", () => {
      state.filters = { lab: "", caps: new Set(), search: "" };
      dom.filterLab.value = "";
      dom.searchInput.value = "";
      $$(".cap-toggle").forEach((b) => b.classList.remove("active"));
      renderList();
    });

    // 重试
    $("#btnRetry").addEventListener("click", () => {
      dom.error.classList.add("hidden");
      dom.loading.classList.remove("hidden");
      loadData();
    });

    // 模型卡片点击
    dom.modelGrid.addEventListener("click", (e) => {
      const card = e.target.closest(".model-card");
      if (card) {
        window.location.hash = "#/model/" + encodeURIComponent(card.dataset.id);
      }
    });

    // Hash 路由
    window.addEventListener("hashchange", handleRoute);

    // 返回顶部
    const scrollTopBtn = $("#scrollTop");
    window.addEventListener(
      "scroll",
      () => {
        scrollTopBtn.classList.toggle("visible", window.scrollY > 400);
      },
      { passive: true },
    );
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ========== 数据加载 ========== */

  async function loadData() {
    try {
      const res = await fetch(CATALOG_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const catalog = await res.json();
      processData(catalog);
      dom.loading.classList.add("hidden");
      handleRoute();
    } catch (err) {
      console.error("Failed to load catalog:", err);
      dom.loading.classList.add("hidden");
      dom.error.classList.remove("hidden");
      dom.errorMsg.textContent = err.message || "网络请求失败，请稍后重试";
    }
  }

  /* ========== 启动 ========== */

  function init() {
    initTheme();
    bindEvents();
    dom.loading.classList.remove("hidden");
    loadData();
  }

  // 导出全局 App 命名空间（供 detail.js 使用路由功能）
  window.App = {
    navigate(hash) {
      window.location.hash = hash;
    },
  };

  // DOM 就绪后启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
