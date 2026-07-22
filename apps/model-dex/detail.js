/**
 * detail.js — 模型详情页渲染
 * 依赖全局 App 命名空间（由 app.js 提供）
 */
(function () {
  "use strict";

  const LOGO_BASE = "https://models.dev/logos/labs";

  /* ========== 工具函数 ========== */

  function getLab(modelId) {
    return modelId.split("/")[0];
  }

  function logoUrl(modelId) {
    return `${LOGO_BASE}/${getLab(modelId)}.svg`;
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

  function formatDate(d) {
    if (!d) return "-";
    return d;
  }

  /* ========== 能力徽章 ========== */

  const CAPS = [
    {
      key: "reasoning",
      label: "推理",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
    },
    {
      key: "tool_call",
      label: "工具调用",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    },
    {
      key: "structured_output",
      label: "结构化输出",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>',
    },
    {
      key: "attachment",
      label: "文件附件",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    },
    {
      key: "temperature",
      label: "温度控制",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
    },
    {
      key: "open_weights",
      label: "开放权重",
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    },
  ];

  function renderCapabilities(model) {
    return CAPS.map((cap) => {
      const yes = !!model[cap.key];
      return `<span class="cap-badge ${yes ? "cap-yes" : "cap-no"}">${cap.icon}${cap.label}</span>`;
    }).join("");
  }

  /* ========== 模态信息 ========== */

  function renderModalities(model) {
    const m = model.modalities || {};
    const input = (m.input || []).join(" / ") || "-";
    const output = (m.output || []).join(" / ") || "-";
    return `
      <div class="info-card">
        <div class="info-card-title">输入模态</div>
        <div class="info-value" style="font-size:15px;font-family:var(--font)">${input}</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">输出模态</div>
        <div class="info-value" style="font-size:15px;font-family:var(--font)">${output}</div>
      </div>
    `;
  }

  /* ========== 定价信息 ========== */

  function renderPricing(providers) {
    if (!providers || !providers.length) {
      return '<div class="info-card"><div class="info-card-title">定价</div><div class="info-value" style="font-size:14px;font-family:var(--font)">暂无定价信息</div></div>';
    }

    // Find cheapest
    let minInput = Infinity,
      minOutput = Infinity;
    let freeCount = 0;
    providers.forEach((p) => {
      if (!p.cost) return;
      if (p.cost.input === 0 && p.cost.output === 0) {
        freeCount++;
        return;
      }
      if (p.cost.input != null && p.cost.input < minInput)
        minInput = p.cost.input;
      if (p.cost.output != null && p.cost.output < minOutput)
        minOutput = p.cost.output;
    });

    const inputStr = minInput === Infinity ? "-" : formatPrice(minInput);
    const outputStr = minOutput === Infinity ? "-" : formatPrice(minOutput);
    const sub =
      freeCount > 0
        ? `${freeCount} 个供应商提供免费使用`
        : `共 ${providers.length} 个供应商`;

    return `
      <div class="info-card">
        <div class="info-card-title">最低输入价格</div>
        <div class="info-value">${inputStr}</div>
        <div class="info-sub">每百万 tokens</div>
      </div>
      <div class="info-card">
        <div class="info-card-title">最低输出价格</div>
        <div class="info-value">${outputStr}</div>
        <div class="info-sub">${sub}</div>
      </div>
    `;
  }

  /* ========== 供应商表格 ========== */

  function renderProviderTable(providers) {
    if (!providers || !providers.length) {
      return '<p style="color:var(--fg-muted)">暂无供应商信息</p>';
    }

    const rows = providers
      .map((p) => {
        const cost = p.cost || {};
        const inputPrice =
          cost.input != null ? formatPrice(cost.input) + "/M" : "-";
        const outputPrice =
          cost.output != null ? formatPrice(cost.output) + "/M" : "-";
        const docLink = p.provider.doc
          ? `<a href="${p.provider.doc}" target="_blank" rel="noopener" class="provider-link">
             文档 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
           </a>`
          : "-";

        return `
        <tr>
          <td><span class="provider-name">${p.provider.name}</span></td>
          <td><span class="provider-npm">${p.provider.npm || "-"}</span></td>
          <td style="font-family:var(--font-mono);font-size:12px">${inputPrice}</td>
          <td style="font-family:var(--font-mono);font-size:12px">${outputPrice}</td>
          <td>${docLink}</td>
        </tr>
      `;
      })
      .join("");

    return `
      <div class="provider-table">
        <table>
          <thead>
            <tr>
              <th>供应商</th>
              <th>SDK 包名</th>
              <th>输入价格</th>
              <th>输出价格</th>
              <th>文档</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  /* ========== Benchmark 列表 ========== */

  function renderBenchmarks(benchmarks) {
    if (!benchmarks || !benchmarks.length) {
      return '<p style="color:var(--fg-muted)">暂无 Benchmark 数据</p>';
    }

    const items = benchmarks
      .map((b) => {
        const version = b.version
          ? `<span class="benchmark-version">v${b.version}</span>`
          : "";
        const metric = b.metric
          ? `<span class="benchmark-metric">${b.metric}</span>`
          : "";
        return `
        <div class="benchmark-item">
          <div>
            <span class="benchmark-name">${b.name}</span>${version}
            <div>${metric}${b.date ? " · " + b.date : ""}</div>
          </div>
          <div style="text-align:right">
            <div class="benchmark-score">${b.score}</div>
          </div>
        </div>
      `;
      })
      .join("");

    return `<div class="benchmark-list">${items}</div>`;
  }

  /* ========== 主渲染函数 ========== */

  function renderDetail(model, providers) {
    const lab = getLab(model.id);
    const logo = logoUrl(model.id);
    const limit = model.limit || {};
    const contextStr = formatNumber(limit.context);
    const outputStr = formatNumber(limit.output);

    return `
      <button class="detail-back" onclick="App.navigate('#/')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        返回列表
      </button>

      <div class="detail-header">
        <div class="detail-logo">
          <img src="${logo}" alt="${lab}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <span class="detail-logo-fallback" style="display:none">${lab.charAt(0).toUpperCase()}</span>
        </div>
        <div class="detail-title">
          <div class="detail-name">${model.name}</div>
          <div class="detail-lab">${lab} ${model.family ? "· " + model.family : ""}</div>
          <div class="detail-desc">${model.description || ""}</div>
          <div class="detail-id">${model.id}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <div class="info-card-title">上下文窗口</div>
          <div class="info-value">${contextStr}</div>
          <div class="info-sub">tokens</div>
        </div>
        <div class="info-card">
          <div class="info-card-title">最大输出</div>
          <div class="info-value">${outputStr}</div>
          <div class="info-sub">tokens</div>
        </div>
        ${renderPricing(providers)}
        ${renderModalities(model)}
        <div class="info-card">
          <div class="info-card-title">发布日期</div>
          <div class="info-value" style="font-size:16px;font-family:var(--font)">${formatDate(model.release_date)}</div>
        </div>
        <div class="info-card">
          <div class="info-card-title">知识截止</div>
          <div class="info-value" style="font-size:16px;font-family:var(--font)">${model.knowledge || "-"}</div>
        </div>
      </div>

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
        能力矩阵
      </div>
      <div class="info-card" style="margin-bottom:24px">
        <div class="capability-grid">${renderCapabilities(model)}</div>
      </div>

      <div class="section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
        Benchmark 成绩
      </div>
      ${renderBenchmarks(model.benchmarks)}

      <div style="margin-top:24px">
        <div class="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          可用供应商（${providers ? providers.length : 0}）
        </div>
        ${renderProviderTable(providers)}
      </div>
    `;
  }

  /* ========== 导出 ========== */

  window.DetailView = {
    render: renderDetail,
    logoUrl: logoUrl,
    getLab: getLab,
  };
})();
