import { writeFileSync } from "fs";

// ── SVG builder ──────────────────────────────────────────────────────────────
function createSVG(width, height) {
  const els = [];

  // Proper vertical arrow (fixed direction)
  function arrowDown(x, y1, y2, opts = {}) {
    const stroke = opts.stroke ?? "#3b82f6";
    const sw = opts.strokeWidth ?? 2.5;
    const dash = opts.dashed ? `stroke-dasharray="6,4"` : "";
    // tiny horizontal wobble for hand-drawn feel, NO vertical wobble
    const cx = x + (Math.random() * 4 - 2);
    const cy = (y1 + y2) / 2;
    els.push(
      `<path d="M${x},${y1} Q${cx},${cy} ${x},${y2}"
       fill="none" stroke="${stroke}" stroke-width="${sw}" ${dash}
       marker-end="url(#arr-${stroke.replace("#","")})" />`
    );
  }

  // Diagonal arrow (for MCP fan-out etc.)
  function arrowDiag(x1, y1, x2, y2, opts = {}) {
    const stroke = opts.stroke ?? "#3b82f6";
    const sw = opts.strokeWidth ?? 2;
    const dash = opts.dashed ? `stroke-dasharray="6,4"` : "";
    els.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
       stroke="${stroke}" stroke-width="${sw}" ${dash}
       marker-end="url(#arr-${stroke.replace("#","")})" />`
    );
  }

  function rect(x, y, w, h, opts = {}) {
    const rx = opts.radius ?? 10;
    const fill = opts.fill ?? "none";
    const stroke = opts.stroke ?? "#1e1e1e";
    const sw = opts.strokeWidth ?? 2;
    const dash = opts.dashed ? `stroke-dasharray="7,4"` : "";
    els.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
       fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`
    );
  }

  function text(x, y, content, opts = {}) {
    const color = opts.color ?? "#374151";
    const size = opts.size ?? 15;
    const anchor = opts.anchor ?? "middle";
    const weight = opts.weight ?? "normal";
    const lines = String(content).split("\n");
    const lh = size * 1.5;
    const startY = y - ((lines.length - 1) * lh) / 2;
    lines.forEach((line, i) => {
      els.push(
        `<text x="${x}" y="${startY + i * lh}"
         font-family="'Segoe UI',system-ui,sans-serif"
         font-size="${size}" font-weight="${weight}"
         fill="${color}" text-anchor="${anchor}"
         dominant-baseline="middle">${line}</text>`
      );
    });
  }

  // Collect all unique arrow colors for marker defs
  const markerColors = new Set(["3b82f6","059669","f59e0b","dc2626","9333ea","1e40af","374151","94a3b8"]);

  return {
    rect, text, arrowDown, arrowDiag,
    line(x1, y1, x2, y2, opts = {}) {
      const stroke = opts.stroke ?? "#94a3b8";
      const sw = opts.strokeWidth ?? 1.5;
      const dash = opts.dashed ? `stroke-dasharray="4,4"` : "";
      els.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" ${dash}/>`);
    },
    // shortcut: centred label between two y positions
    stepLabel(x, y, w, h, title, sub, opts = {}) {
      rect(x, y, w, h, opts);
      if (sub) {
        text(x + w/2, y + h/2 - 11, title, { color: opts.titleColor ?? opts.stroke ?? "#374151", size: opts.titleSize ?? 17, weight: "600" });
        text(x + w/2, y + h/2 + 14, sub, { color: "#374151", size: opts.subSize ?? 13 });
      } else {
        text(x + w/2, y + h/2, title, { color: opts.titleColor ?? opts.stroke ?? "#374151", size: opts.titleSize ?? 17, weight: "600" });
      }
    },
    save(path) {
      const markers = [...markerColors].map(c =>
        `<marker id="arr-${c}" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0,10 3.5,0 7" fill="#${c}"/>
        </marker>`
      ).join("\n    ");

      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    ${markers}
  </defs>
  <rect width="${width}" height="${height}" fill="white"/>
  ${els.join("\n  ")}
</svg>`;
      writeFileSync(path, svg);
      console.log(`✓ ${path.split("/").pop()}`);
    }
  };
}

const OUT = "/Users/liugang/study/ai/CC/claudecode/book/diagrams/";

// ── 1. Query Engine Flow ───────────────────────────────────────────────────────
{
  const g = createSVG(740, 770);
  const W = 520, X = 110, CX = 370;

  g.text(CX, 34, "Query Engine 执行流程", { color: "#1e40af", size: 22, weight: "bold" });

  const steps = [
    { y: 60,  h: 60,  bg: "#a5d8ff", stroke: "#1e40af", title: "submitMessage( userInput )",         sub: "" },
    { y: 165, h: 75,  bg: "#fff3bf", stroke: "#92400e", title: "① 预处理用户输入",                   sub: "解析斜杠命令 · 处理附件 · 注入 Memory" },
    { y: 285, h: 75,  bg: "#c3fae8", stroke: "#065f46", title: "② 构建消息列表",                     sub: "历史消息 · 新用户消息 · 系统上下文" },
    { y: 405, h: 120, bg: "#dbe4ff", stroke: "#3730a3", title: "③ 调用 query() 核心循环",            sub: "构建系统提示 → 调用 Claude API（流式）\n解析响应 → 执行工具调用 → 循环直到完成", dashed: true },
    { y: 575, h: 75,  bg: "#d0bfff", stroke: "#6b21a8", title: "④ 后处理",                          sub: "记录 token · 保存会话 · 触发 hooks · 检查压缩" },
    { y: 695, h: 60,  bg: "#b2f2bb", stroke: "#14532d", title: "⑤ yield 结果给调用方（流式）",       sub: "" },
  ];

  steps.forEach((s, i) => {
    g.rect(X, s.y, W, s.h, { fill: s.bg, stroke: s.stroke, strokeWidth: 2.5, dashed: s.dashed });
    if (s.sub) {
      const subLines = s.sub.split("\n");
      g.text(CX, s.y + s.h/2 - (subLines.length > 1 ? 18 : 11), s.title, { color: s.stroke, size: 17, weight: "600" });
      subLines.forEach((line, li) => {
        g.text(CX, s.y + s.h/2 + (subLines.length > 1 ? li * 18 : 0) + 14, line, { color: "#374151", size: 13 });
      });
    } else {
      g.text(CX, s.y + s.h/2, s.title, { color: s.stroke, size: 17, weight: "600" });
    }
    if (i < steps.length - 1) {
      const y1 = s.y + s.h + 2;
      const y2 = steps[i+1].y - 2;
      g.arrowDown(CX, y1, y2, { stroke: "#3b82f6" });
    }
  });

  g.save(OUT + "query-engine-flow.svg");
}

// ── 2. Tool System Hierarchy ──────────────────────────────────────────────────
{
  const g = createSVG(900, 570);
  g.text(450, 34, "工具系统三层架构", { color: "#1e40af", size: 22, weight: "bold" });

  // Layer 3
  g.rect(50, 62, 800, 115, { fill: "#dbe4ff", stroke: "#3730a3", dashed: true, radius: 12 });
  g.text(135, 79, "第三层：高阶操作（工具调用工具）", { color: "#3730a3", size: 14, anchor: "start" });
  g.rect(90, 92, 270, 70, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(225, 127, "AgentTool\n启动子代理（独立工具集）", { color: "#1e40af", size: 15 });
  g.rect(540, 92, 260, 70, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(670, 127, "SkillTool\n执行预定义工具链", { color: "#1e40af", size: 15 });

  g.arrowDown(450, 178, 220, { stroke: "#f59e0b" });
  g.text(510, 200, "Claude 编排", { color: "#f59e0b", size: 13 });

  // Layer 2
  g.rect(50, 225, 800, 115, { fill: "#d3f9d8", stroke: "#065f46", dashed: true, radius: 12 });
  g.text(130, 242, "第二层：组合操作（Claude 编排原子操作）", { color: "#065f46", size: 14, anchor: "start" });
  g.rect(70, 258, 350, 68, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(245, 292, "找出所有 TODO 并整理\n= GlobTool + FileReadTool + GrepTool", { color: "#374151", size: 13 });
  g.rect(480, 258, 350, 68, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(655, 292, "重构函数名\n= GrepTool + FileEditTool×N + BashTool", { color: "#374151", size: 13 });

  g.arrowDown(450, 342, 388, { stroke: "#f59e0b" });
  g.text(510, 365, "原子组合", { color: "#f59e0b", size: 13 });

  // Layer 1
  g.rect(50, 392, 800, 128, { fill: "#e5dbff", stroke: "#6b21a8", dashed: true, radius: 12 });
  g.text(115, 409, "第一层：原子操作（不可再分）", { color: "#6b21a8", size: 14, anchor: "start" });
  const atoms = [
    { x: 68,  label: "FileReadTool\n读一个文件" },
    { x: 258, label: "FileEditTool\n改一处内容" },
    { x: 448, label: "GrepTool\n搜索一个模式" },
    { x: 638, label: "BashTool\n执行一条命令" },
  ];
  atoms.forEach(a => {
    g.rect(a.x, 428, 170, 70, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
    g.text(a.x + 85, 463, a.label, { color: "#374151", size: 14 });
  });

  g.save(OUT + "tool-system-hierarchy.svg");
}

// ── 3. Permission Model Layers ────────────────────────────────────────────────
{
  const g = createSVG(900, 650);
  g.text(450, 34, "五层权限架构", { color: "#1e40af", size: 22, weight: "bold" });

  const layers = [
    { y: 62,  w: 820, x: 40,  bg: "#a5d8ff", stroke: "#1e40af", title: "层次 1：会话模式（Session Mode）",     desc: "default / acceptEdits / bypassPermissions / plan  —  决定整体权限基调" },
    { y: 170, w: 740, x: 80,  bg: "#b2f2bb", stroke: "#059669", title: "层次 2：工具白名单 / 黑名单",          desc: "allowedTools: [FileReadTool...]   deniedTools: [BashTool...]  —  决定哪些工具可用" },
    { y: 278, w: 660, x: 120, bg: "#d0bfff", stroke: "#9333ea", title: "层次 3：工具级权限",                   desc: "FileReadTool → 自动允许    FileEditTool → 询问    BashTool → 询问" },
    { y: 386, w: 580, x: 160, bg: "#ffd8a8", stroke: "#d97706", title: "层次 4：操作级权限",                   desc: "\"ls\" → 低风险    \"rm -rf\" → 高风险必须确认  —  同一工具不同操作分级" },
    { y: 494, w: 500, x: 200, bg: "#ffc9c9", stroke: "#dc2626", title: "层次 5：路径 / 命令级权限",            desc: "allowedWritePaths   deniedWritePaths   allowedBashCommands  —  最细粒度" },
  ];

  layers.forEach((l, i) => {
    g.rect(l.x, l.y, l.w, 88, { fill: l.bg, stroke: l.stroke, strokeWidth: 2.5, radius: 10 });
    g.text(450, l.y + 28, l.title, { color: l.stroke, size: 17, weight: "600" });
    g.text(450, l.y + 60, l.desc, { color: "#374151", size: 13 });
    if (i < layers.length - 1) {
      g.arrowDown(450, l.y + 90, l.y + 103, { stroke: "#3b82f6" });
    }
  });

  g.text(450, 614, "安全是默认，便利是可选，控制在用户手中", { color: "#6b7280", size: 15 });
  g.save(OUT + "permission-model-layers.svg");
}

// ── 4. MCP Architecture ───────────────────────────────────────────────────────
{
  const g = createSVG(1000, 490);
  g.text(500, 34, "MCP 架构：AI 工具的互联网", { color: "#1e40af", size: 22, weight: "bold" });

  g.rect(230, 62, 540, 145, { fill: "#dbe4ff", stroke: "#1e40af", radius: 12, strokeWidth: 2 });
  g.text(500, 82, "Claude Code（MCP 客户端）", { color: "#1e40af", size: 17, weight: "600" });
  g.rect(268, 97, 464, 80, { fill: "#a5d8ff", stroke: "#3b82f6", radius: 8, strokeWidth: 2 });
  g.text(500, 137, "MCP 客户端层  src/services/mcp/\n连接管理 · 工具注册 · 资源访问 · 认证处理", { color: "#1e40af", size: 14 });

  g.text(500, 228, "MCP 协议（JSON-RPC over stdio / HTTP）", { color: "#6b7280", size: 13 });

  const servers = [
    { x: 40,  name: "数据库 MCP 服务" },
    { x: 275, name: "GitHub MCP 服务" },
    { x: 510, name: "Slack MCP 服务" },
    { x: 745, name: "自定义 MCP 服务" },
  ];
  const srcY = 210, dstY = 275;
  servers.forEach(s => {
    const cx = s.x + 175/2;
    g.arrowDiag(500, srcY, cx, dstY, { stroke: "#3b82f6", dashed: true });
    g.rect(s.x, 280, 175, 130, { fill: "#c3fae8", stroke: "#059669", radius: 10, strokeWidth: 2 });
    g.text(cx, 322, s.name, { color: "#065f46", size: 14, weight: "600" });
    g.text(cx, 368, "Tools · Resources\nPrompts", { color: "#374151", size: 13 });
  });

  g.text(500, 446, "MCP 之于 AI 工具，就像 HTTP 之于网页 — 开放协议，让工具互联互通", { color: "#6b7280", size: 14 });
  g.save(OUT + "mcp-architecture.svg");
}

// ── 5. Multi-Agent Modes ──────────────────────────────────────────────────────
{
  const g = createSVG(900, 560);
  g.text(450, 34, "多代理架构：三种模式", { color: "#1e40af", size: 22, weight: "bold" });

  const modes = [
    { x: 30,  color: "#3730a3", bg: "#dbe4ff", title: "模式一：子代理",       parent: "父代理",              child: "子代理（独立上下文）", note: "阻塞等待结果",      childBg: "#d0bfff", childStroke: "#9333ea" },
    { x: 320, color: "#065f46", bg: "#d3f9d8", title: "模式二：后台代理",     parent: "父代理（立即继续）",   child: "子代理（后台运行）",   note: "完成后通知父代理",  childBg: "#b2f2bb", childStroke: "#059669" },
    { x: 610, color: "#92400e", bg: "#fff3bf", title: "模式三：Worktree 隔离", parent: "父代理（main branch）", child: "子代理（独立 worktree）", note: "隔离分支，可选合并", childBg: "#ffd8a8", childStroke: "#d97706" },
  ];

  modes.forEach(m => {
    g.rect(m.x, 62, 255, 215, { fill: m.bg, stroke: m.color, dashed: true, radius: 12 });
    g.text(m.x + 127, 82, m.title, { color: m.color, size: 15, weight: "600" });
    g.rect(m.x + 18, 98, 220, 52, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8 });
    g.text(m.x + 128, 124, m.parent, { color: "#1e40af", size: 14 });
    g.arrowDown(m.x + 128, 151, 178, { stroke: m.color });
    g.rect(m.x + 18, 183, 220, 52, { fill: m.childBg, stroke: m.childStroke, radius: 8 });
    g.text(m.x + 128, 209, m.child, { color: m.color, size: 13 });
    g.text(m.x + 128, 252, m.note, { color: "#6b7280", size: 13 });
  });

  // Context isolation section
  g.rect(40, 305, 820, 215, { fill: "#f8fafc", stroke: "#94a3b8", radius: 12 });
  g.text(450, 330, "子代理上下文隔离（Context Isolation）", { color: "#1e40af", size: 17, weight: "600" });

  g.rect(58, 350, 360, 150, { fill: "#a5d8ff", stroke: "#3b82f6", radius: 8, strokeWidth: 2 });
  g.text(238, 373, "父代理 messages[]", { color: "#1e40af", size: 14, weight: "600" });
  g.text(238, 415, "user: Build login + tests\nassistant: Planning approach...\ntool_result: project structure\nsummary: 3 tests written ✓", { color: "#374151", size: 13 });

  g.rect(482, 350, 360, 150, { fill: "#f1f5f9", stroke: "#94a3b8", radius: 8, strokeWidth: 2 });
  g.text(662, 373, "子代理 messages[] (fresh)", { color: "#6b7280", size: 14, weight: "600" });
  g.text(662, 415, "task: Write unit tests for auth\ntool_use: read auth.ts\ntool_use: write test.ts\n→ context discarded after", { color: "#94a3b8", size: 13 });

  g.text(450, 515, "父代理只收到摘要，不承担子代理的上下文膨胀", { color: "#059669", size: 14 });
  g.save(OUT + "multi-agent-modes.svg");
}

// ── 6. State Management (两层状态) ────────────────────────────────────────────
{
  const g = createSVG(800, 500);
  g.text(400, 34, "两层状态架构", { color: "#1e40af", size: 22, weight: "bold" });

  // Bootstrap State
  g.rect(60, 62, 680, 155, { fill: "#dbe4ff", stroke: "#1e40af", radius: 12, strokeWidth: 2.5 });
  g.text(400, 84, "Bootstrap State（全局单例）  src/bootstrap/state.ts", { color: "#1e40af", size: 16, weight: "600" });
  g.rect(90, 102, 620, 100, { fill: "#a5d8ff", stroke: "#3b82f6", radius: 8, strokeWidth: 2 });
  g.text(400, 140, "sessionId · projectRoot · cwd · totalCostUSD · modelUsage", { color: "#374151", size: 14 });
  g.text(400, 163, "OpenTelemetry providers · 注册的 hooks", { color: "#374151", size: 14 });
  g.text(650, 108, "进程级 · 跨会话持久", { color: "#3730a3", size: 12 });

  g.arrowDown(400, 218, 268, { stroke: "#3b82f6" });
  g.text(470, 244, "被 AppState 读取", { color: "#6b7280", size: 13 });

  // AppState
  g.rect(60, 272, 680, 155, { fill: "#d3f9d8", stroke: "#059669", radius: 12, strokeWidth: 2.5 });
  g.text(400, 294, "AppState（React 状态树）  src/state/AppStateStore.ts", { color: "#065f46", size: 16, weight: "600" });
  g.rect(90, 312, 620, 100, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(400, 350, "messages[] · toolExecutionState · tasks · permissionDialogs", { color: "#374151", size: 14 });
  g.text(400, 373, "fileHistory · UI 状态（权限弹窗、进度等）", { color: "#374151", size: 14 });
  g.text(648, 318, "会话级 · 响应式更新", { color: "#065f46", size: 12 });

  g.arrowDown(400, 428, 460, { stroke: "#059669" });
  g.text(400, 480, "UI 渲染（Ink / React）", { color: "#6b7280", size: 14 });

  g.save(OUT + "state-management.svg");
}

// ── 7. System Prompt Construction ────────────────────────────────────────────
{
  const g = createSVG(740, 600);
  g.text(370, 34, "系统提示构建流程", { color: "#1e40af", size: 22, weight: "bold" });

  const steps = [
    { bg: "#a5d8ff", stroke: "#1e40af", title: "1. 核心指令（固定部分）",     desc: "角色定义 · 行为准则 · 安全规则" },
    { bg: "#b2f2bb", stroke: "#059669", title: "2. 工具定义（动态生成）",     desc: "根据当前可用工具：name / description / schema" },
    { bg: "#fff3bf", stroke: "#92400e", title: "3. 用户上下文（CLAUDE.md）",  desc: "项目说明 · 代码规范 · 工作流程" },
    { bg: "#c3fae8", stroke: "#065f46", title: "4. 系统上下文（动态）",       desc: "Git 状态 · 当前目录 · 环境信息" },
    { bg: "#d0bfff", stroke: "#6b21a8", title: "5. 自定义系统提示（可选）",   desc: "用户通过 --system-prompt 传入" },
  ];

  let y = 62;
  const H = 76, GAP = 16, W = 560, X = 90;
  steps.forEach((s, i) => {
    g.rect(X, y, W, H, { fill: s.bg, stroke: s.stroke, strokeWidth: 2.5 });
    g.text(370, y + H/2 - 11, s.title, { color: s.stroke, size: 16, weight: "600" });
    g.text(370, y + H/2 + 14, s.desc, { color: "#374151", size: 13 });
    if (i < steps.length - 1) {
      g.arrowDown(370, y + H + 2, y + H + GAP - 2, { stroke: "#3b82f6" });
    }
    y += H + GAP;
  });

  // Result
  g.arrowDown(370, y, y + 28, { stroke: "#3b82f6" });
  y += 32;
  g.rect(150, y, 440, 60, { fill: "#ffc9c9", stroke: "#dc2626", strokeWidth: 2.5, radius: 10 });
  g.text(370, y + 30, "完整系统提示 → 发送给 Claude API", { color: "#dc2626", size: 16, weight: "600" });

  g.save(OUT + "system-prompt-construction.svg");
}

// ── 8. Auto-Compact Flow ──────────────────────────────────────────────────────
{
  const g = createSVG(840, 520);
  g.text(420, 34, "Auto-Compact 压缩流程", { color: "#1e40af", size: 22, weight: "bold" });

  // Full history
  g.rect(40, 62, 380, 140, { fill: "#ffc9c9", stroke: "#dc2626", radius: 10, strokeWidth: 2 });
  g.text(230, 82, "原始消息列表（255K tokens）", { color: "#dc2626", size: 14, weight: "600" });
  g.text(230, 118, "系统提示 + 50 轮对话 +\n大量工具调用结果", { color: "#374151", size: 13 });
  g.text(230, 165, "▲ 超出 85% 阈值，触发压缩", { color: "#dc2626", size: 13 });

  g.arrowDown(230, 204, 244, { stroke: "#d97706" });

  // Split
  g.rect(40, 248, 170, 80, { fill: "#ffd8a8", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(125, 288, "待压缩部分\n（200K tokens）", { color: "#92400e", size: 13 });
  g.rect(250, 248, 170, 80, { fill: "#c3fae8", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(335, 288, "保留部分\n（最近 10 条）", { color: "#065f46", size: 13 });

  g.arrowDown(125, 330, 370, { stroke: "#d97706" });

  g.rect(40, 374, 170, 60, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(125, 404, "Claude 生成摘要\n（10K tokens）", { color: "#6b21a8", size: 13 });

  // Merge arrow
  g.arrowDiag(125, 436, 340, 460, { stroke: "#3b82f6" });
  g.arrowDiag(335, 330, 380, 460, { stroke: "#3b82f6" });

  // Result
  g.rect(280, 460, 340, 46, { fill: "#b2f2bb", stroke: "#059669", strokeWidth: 2.5, radius: 10 });
  g.text(450, 483, "压缩后消息列表（60K tokens）✓", { color: "#065f46", size: 14, weight: "600" });

  // Token threshold note
  g.rect(470, 62, 340, 120, { fill: "#f8fafc", stroke: "#94a3b8", radius: 10, strokeWidth: 1.5 });
  g.text(640, 90, "触发阈值", { color: "#374151", size: 15, weight: "600" });
  g.text(640, 122, "85% → 显示警告", { color: "#d97706", size: 14 });
  g.text(640, 148, "95% → 强制压缩", { color: "#dc2626", size: 14 });

  g.save(OUT + "auto-compact-flow.svg");
}

// ── 9. Coordinator Pattern ────────────────────────────────────────────────────
{
  const g = createSVG(860, 480);
  g.text(430, 34, "Coordinator 协调者模式", { color: "#1e40af", size: 22, weight: "bold" });

  // Coordinator
  g.rect(280, 62, 300, 70, { fill: "#a5d8ff", stroke: "#1e40af", radius: 10, strokeWidth: 2.5 });
  g.text(430, 97, "协调者代理（Coordinator）\n分析任务 · 分解 · 分配 · 汇总", { color: "#1e40af", size: 15 });

  // Fan out arrows
  const agents = [
    { x: 40,  label: "Explore 代理\n只读，代码探索",     bg: "#c3fae8", stroke: "#059669" },
    { x: 235, label: "Plan 代理\n只生成计划",            bg: "#fff3bf", stroke: "#92400e" },
    { x: 430, label: "general-purpose\n有写入权限",      bg: "#d0bfff", stroke: "#9333ea" },
    { x: 625, label: "general-purpose\n并行 / 依赖执行",  bg: "#d0bfff", stroke: "#9333ea" },
  ];
  agents.forEach(a => {
    const cx = a.x + 160/2;
    g.arrowDiag(430, 133, cx, 198, { stroke: "#3b82f6" });
    g.rect(a.x, 202, 160, 80, { fill: a.bg, stroke: a.stroke, radius: 8, strokeWidth: 2 });
    g.text(cx, 242, a.label, { color: a.stroke, size: 13 });
  });

  // Return arrows
  agents.forEach(a => {
    const cx = a.x + 160/2;
    g.arrowDiag(cx, 284, 430, 348, { stroke: "#059669" });
  });

  // Summary return
  g.rect(280, 352, 300, 60, { fill: "#b2f2bb", stroke: "#059669", radius: 10, strokeWidth: 2 });
  g.text(430, 382, "汇总结果 → 返回主代理", { color: "#065f46", size: 15, weight: "600" });

  // Benefits
  g.rect(40, 432, 780, 38, { fill: "#f8fafc", stroke: "#94a3b8", radius: 8 });
  g.text(430, 451, "优势：任务并行 · 上下文隔离 · 专业化分工 · 突破单 Agent 上下文限制", { color: "#374151", size: 13 });

  g.save(OUT + "coordinator-pattern.svg");
}

// ── 10. Context Engineering Overview ─────────────────────────────────────────
{
  const g = createSVG(860, 460);
  g.text(430, 34, "Context Engineering：上下文的组成", { color: "#1e40af", size: 22, weight: "bold" });

  // System prompt box
  g.rect(40, 62, 370, 200, { fill: "#dbe4ff", stroke: "#1e40af", radius: 12, strokeWidth: 2 });
  g.text(225, 84, "系统提示（System Prompt）", { color: "#1e40af", size: 15, weight: "600" });
  const spItems = [
    { y: 112, label: "核心指令", bg: "#a5d8ff", s: "#1e40af" },
    { y: 148, label: "工具定义（43 个工具）", bg: "#a5d8ff", s: "#1e40af" },
    { y: 184, label: "用户上下文（CLAUDE.md）", bg: "#c3fae8", s: "#059669" },
    { y: 220, label: "系统上下文（git status）", bg: "#c3fae8", s: "#059669" },
  ];
  spItems.forEach(item => {
    g.rect(58, item.y, 334, 28, { fill: item.bg, stroke: item.s, radius: 6, strokeWidth: 1.5 });
    g.text(225, item.y + 14, item.label, { color: item.s, size: 13 });
  });

  // Messages box
  g.rect(450, 62, 370, 200, { fill: "#d3f9d8", stroke: "#059669", radius: 12, strokeWidth: 2 });
  g.text(635, 84, "对话历史（Messages）", { color: "#065f46", size: 15, weight: "600" });
  const msgItems = [
    { y: 112, label: "用户消息", bg: "#b2f2bb", s: "#059669" },
    { y: 148, label: "助手响应（含工具调用）", bg: "#b2f2bb", s: "#059669" },
    { y: 184, label: "工具执行结果", bg: "#b2f2bb", s: "#059669" },
    { y: 220, label: "Memory 附件", bg: "#c3fae8", s: "#065f46" },
  ];
  msgItems.forEach(item => {
    g.rect(468, item.y, 334, 28, { fill: item.bg, stroke: item.s, radius: 6, strokeWidth: 1.5 });
    g.text(635, item.y + 14, item.label, { color: item.s, size: 13 });
  });

  // Token budget bar
  g.rect(40, 285, 780, 60, { fill: "#f8fafc", stroke: "#94a3b8", radius: 10 });
  g.text(430, 305, "Token 预算分配（200K 上下文窗口）", { color: "#374151", size: 14, weight: "600" });
  // mini bar segments
  const segs = [
    { w: 90,  x: 55,  fill: "#a5d8ff", label: "系统\n5K" },
    { w: 200, x: 148, fill: "#b2f2bb", label: "对话历史\n~150K" },
    { w: 120, x: 352, fill: "#ffd8a8", label: "工具结果\n~40K" },
    { w: 80,  x: 476, fill: "#d0bfff", label: "输出\n~40K" },
    { w: 270, x: 560, fill: "#f1f5f9", label: "剩余\n缓冲区" },
  ];
  segs.forEach(s => {
    g.rect(s.x, 316, s.w, 20, { fill: s.fill, stroke: "#94a3b8", radius: 3, strokeWidth: 1 });
    g.text(s.x + s.w/2, 327, s.label.split("\n")[0], { color: "#374151", size: 10 });
  });

  g.text(430, 380, "Context Engineering 的核心：在有限窗口内放入最相关的信息", { color: "#374151", size: 14 });

  // Auto-compact note
  g.rect(40, 400, 780, 46, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 1.5 });
  g.text(430, 423, "超出 85% → 触发 Auto-Compact：用摘要替换早期消息，保留关键上下文", { color: "#92400e", size: 13 });

  g.save(OUT + "context-engineering.svg");
}

// ── 11. Agent Loop ────────────────────────────────────────────────────────────
{
  const g = createSVG(740, 560);
  const CX = 370, W = 500, X = 120;
  g.text(CX, 34, "Claude Code Agent 循环", { color: "#1e40af", size: 22, weight: "bold" });

  // User input
  g.rect(X, 60, W, 58, { fill: "#a5d8ff", stroke: "#1e40af", radius: 10, strokeWidth: 2.5 });
  g.text(CX, 89, "用户输入", { color: "#1e40af", size: 18, weight: "600" });
  g.arrowDown(CX, 119, 149, { stroke: "#3b82f6" });

  // Build message list
  g.rect(X, 153, W, 58, { fill: "#fff3bf", stroke: "#92400e", radius: 10, strokeWidth: 2 });
  g.text(CX, 182, "构建消息列表（含历史）", { color: "#92400e", size: 16, weight: "600" });
  g.arrowDown(CX, 212, 242, { stroke: "#3b82f6" });

  // Call Claude API
  g.rect(X, 246, W, 58, { fill: "#c3fae8", stroke: "#059669", radius: 10, strokeWidth: 2 });
  g.text(CX, 275, "调用 Claude API（流式）", { color: "#059669", size: 16, weight: "600" });
  g.arrowDown(CX, 305, 335, { stroke: "#3b82f6" });

  // Parse response
  g.rect(X, 339, W, 84, { fill: "#dbe4ff", stroke: "#3730a3", radius: 10, strokeWidth: 2 });
  g.text(CX, 364, "响应解析", { color: "#3730a3", size: 16, weight: "600" });
  g.text(CX, 388, "文本块 → 流式显示  ·  思考块 → 内部处理  ·  工具调用块 → 执行工具", { color: "#374151", size: 12 });
  g.arrowDown(CX, 424, 454, { stroke: "#3b82f6" });

  // Tool results → messages
  g.rect(X, 458, W, 55, { fill: "#d0bfff", stroke: "#9333ea", radius: 10, strokeWidth: 2 });
  g.text(CX, 485, "工具结果回填到消息列表", { color: "#6b21a8", size: 15, weight: "600" });

  // Loop back arrow (right side)
  g.arrowDiag(CX + W/2 + 2, 486, CX + W/2 + 60, 420, { stroke: "#dc2626" });
  g.arrowDiag(CX + W/2 + 60, 420, CX + W/2 + 60, 275, { stroke: "#dc2626" });
  g.arrowDiag(CX + W/2 + 60, 275, CX + W/2 + 2, 275, { stroke: "#dc2626" });
  g.text(CX + W/2 + 80, 350, "继续？", { color: "#dc2626", size: 13, anchor: "start" });

  // End note
  g.text(X + 20, 533, "← 无工具调用 / 达到轮次限制 → 返回最终结果", { color: "#6b7280", size: 13, anchor: "start" });

  g.save(OUT + "agent-loop.svg");
}

// ── 12. Permission Decision Tree ──────────────────────────────────────────────
{
  const g = createSVG(840, 500);
  g.text(420, 34, "权限检查决策树", { color: "#1e40af", size: 22, weight: "bold" });

  // Entry
  g.rect(295, 62, 250, 52, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2.5 });
  g.text(420, 88, "canUseTool( toolName, input )", { color: "#1e40af", size: 14, weight: "600" });
  g.arrowDown(420, 115, 148, { stroke: "#3b82f6" });

  // Decision 1: bypassPermissions
  g.rect(245, 152, 350, 48, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(420, 176, "bypassPermissions 模式？", { color: "#92400e", size: 14 });
  // Yes → allow
  g.arrowDiag(595, 176, 690, 176, { stroke: "#059669" });
  g.rect(695, 152, 80, 48, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(735, 176, "allow", { color: "#059669", size: 14, weight: "600" });
  g.text(640, 162, "是", { color: "#059669", size: 13 });
  // No → down
  g.arrowDown(420, 200, 238, { stroke: "#3b82f6" });
  g.text(438, 218, "否", { color: "#6b7280", size: 13 });

  // Decision 2: whitelist
  g.rect(245, 242, 350, 48, { fill: "#dbe4ff", stroke: "#3730a3", radius: 8, strokeWidth: 2 });
  g.text(420, 266, "工具在白名单中？", { color: "#3730a3", size: 14 });
  g.arrowDiag(595, 266, 690, 266, { stroke: "#059669" });
  g.rect(695, 242, 80, 48, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(735, 266, "allow", { color: "#059669", size: 14, weight: "600" });
  g.text(640, 252, "是", { color: "#059669", size: 13 });
  g.arrowDown(420, 290, 328, { stroke: "#3b82f6" });
  g.text(438, 308, "否", { color: "#6b7280", size: 13 });

  // Decision 3: blacklist
  g.rect(245, 332, 350, 48, { fill: "#ffc9c9", stroke: "#dc2626", radius: 8, strokeWidth: 2 });
  g.text(420, 356, "工具在黑名单中？", { color: "#dc2626", size: 14 });
  g.arrowDiag(595, 356, 690, 356, { stroke: "#dc2626" });
  g.rect(695, 332, 80, 48, { fill: "#ffc9c9", stroke: "#dc2626", radius: 8, strokeWidth: 2 });
  g.text(735, 356, "deny", { color: "#dc2626", size: 14, weight: "600" });
  g.text(640, 342, "是", { color: "#dc2626", size: 13 });
  g.arrowDown(420, 380, 418, { stroke: "#3b82f6" });
  g.text(438, 398, "否", { color: "#6b7280", size: 13 });

  // Decision 4: ask user
  g.rect(245, 422, 350, 48, { fill: "#e5dbff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(420, 446, "默认：询问用户（ask）", { color: "#6b21a8", size: 14, weight: "600" });

  // Footnote
  g.text(420, 490, "BashTool 额外分析命令安全性  ·  FileEditTool 检查路径是否在允许范围", { color: "#6b7280", size: 12 });

  g.save(OUT + "permission-decision-tree.svg");
}

// ── 13. Query Loop (query() execution loop) ───────────────────────────────────
{
  const g = createSVG(800, 580);
  const CX = 400, W = 460, X = 170;
  g.text(CX, 34, "query() 执行循环", { color: "#1e40af", size: 22, weight: "bold" });

  // Turn counter
  g.rect(X, 62, W, 52, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(CX, 88, "turnCount++  ·  检查轮次限制", { color: "#92400e", size: 15, weight: "600" });
  g.arrowDown(CX, 115, 148, { stroke: "#3b82f6" });

  // Call API
  g.rect(X, 152, W, 80, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(CX, 177, "调用 Claude API（流式）", { color: "#1e40af", size: 15, weight: "600" });
  g.text(CX, 200, "messages  ·  systemPrompt  ·  tools", { color: "#374151", size: 13 });
  g.arrowDown(CX, 233, 268, { stroke: "#3b82f6" });

  // Parse response
  g.rect(X, 272, W, 80, { fill: "#c3fae8", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(CX, 295, "解析流式响应", { color: "#065f46", size: 15, weight: "600" });
  g.text(CX, 318, "text → yield 给用户  ·  thinking → 内部处理  ·  tool_use → 收集", { color: "#374151", size: 12 });
  g.arrowDown(CX, 353, 388, { stroke: "#3b82f6" });

  // Tool calls?
  g.rect(X, 392, W, 48, { fill: "#dbe4ff", stroke: "#3730a3", radius: 8, strokeWidth: 2 });
  g.text(CX, 416, "有工具调用？", { color: "#3730a3", size: 15, weight: "600" });
  // No → end
  g.arrowDiag(CX + W/2, 416, CX + W/2 + 80, 416, { stroke: "#dc2626" });
  g.text(CX + W/2 + 50, 406, "否→结束", { color: "#dc2626", size: 12 });
  // Yes → down
  g.arrowDown(CX, 440, 480, { stroke: "#3b82f6" });
  g.text(CX + 12, 460, "是", { color: "#059669", size: 13 });

  // Run tools
  g.rect(X, 484, W, 52, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(CX, 510, "并行执行工具调用  ·  工具结果追加到消息列表", { color: "#6b21a8", size: 14, weight: "600" });

  // Loop back arrow
  g.arrowDiag(X - 2, 510, X - 60, 510, { stroke: "#d97706" });
  g.arrowDiag(X - 60, 510, X - 60, 88, { stroke: "#d97706" });
  g.arrowDiag(X - 60, 88, X, 88, { stroke: "#d97706" });
  g.text(X - 90, 300, "循环", { color: "#d97706", size: 13, anchor: "middle" });

  // Token budget note
  g.rect(X, 550, W, 22, { fill: "#f8fafc", stroke: "#94a3b8", radius: 5, strokeWidth: 1 });
  g.text(CX, 561, "token 预算超出 → 结束循环", { color: "#6b7280", size: 12 });

  g.save(OUT + "query-loop.svg");
}

// ── 14. MCP Auth Flow ────────────────────────────────────────────────────────
{
  const g = createSVG(780, 480);
  g.text(390, 34, "MCP 认证流程", { color: "#1e40af", size: 22, weight: "bold" });

  // Column headers
  g.text(200, 68, "Claude Code", { color: "#1e40af", size: 16, weight: "600" });
  g.text(580, 68, "MCP 服务器", { color: "#059669", size: 16, weight: "600" });

  // Vertical lifelines
  g.line(200, 82, 200, 450, { dashed: true });
  g.line(580, 82, 580, 450, { dashed: true });

  // Step 1: call tool →
  g.rect(60, 95, 270, 42, { fill: "#a5d8ff", stroke: "#1e40af", radius: 8, strokeWidth: 2 });
  g.text(195, 116, "① 调用工具", { color: "#1e40af", size: 14, weight: "600" });
  g.arrowDiag(332, 116, 540, 116, { stroke: "#1e40af" });

  // Step 2: -32042 error ←
  g.rect(450, 155, 270, 50, { fill: "#ffc9c9", stroke: "#dc2626", radius: 8, strokeWidth: 2 });
  g.text(585, 175, "② 返回 -32042 错误（需要认证）", { color: "#dc2626", size: 13, weight: "600" });
  g.arrowDiag(448, 180, 270, 180, { stroke: "#dc2626" });

  // Step 3: show URL to user
  g.rect(60, 220, 270, 42, { fill: "#fff3bf", stroke: "#d97706", radius: 8, strokeWidth: 2 });
  g.text(195, 241, "③ 显示 auth_url 给用户", { color: "#92400e", size: 13, weight: "600" });

  // Step 4: user completes OAuth in browser
  g.rect(60, 280, 270, 50, { fill: "#d0bfff", stroke: "#9333ea", radius: 8, strokeWidth: 2 });
  g.text(195, 300, "④ 用户在浏览器完成 OAuth", { color: "#6b21a8", size: 13, weight: "600" });
  g.text(195, 318, "保存 token 到本地", { color: "#6b21a8", size: 12 });

  // Step 5: retry with token →
  g.rect(60, 348, 270, 42, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(195, 369, "⑤ 重试工具调用（携带 token）", { color: "#065f46", size: 13, weight: "600" });
  g.arrowDiag(332, 369, 540, 369, { stroke: "#059669" });

  // Step 6: result ←
  g.rect(450, 408, 270, 40, { fill: "#b2f2bb", stroke: "#059669", radius: 8, strokeWidth: 2 });
  g.text(585, 428, "⑥ 返回结果 ✓", { color: "#065f46", size: 14, weight: "600" });
  g.arrowDiag(448, 428, 332, 428, { stroke: "#059669" });

  g.save(OUT + "mcp-auth-flow.svg");
}

console.log("\n✓ All 14 SVGs generated in book/diagrams/");
