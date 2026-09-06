// ============================================================
// 穿画 · Passage — 世界引擎（切片）
//
// 你是一粒光，住在画里。
// 三个动作：
//   入画   — 点一幅画，走进去；画里还挂着更小的画
//   拽出   — 把画里的小画拖到墙上，它变成一幅大画
//   咬合   — 把两幅画推到一起：路接上路，月亮落进灯里
//
// 每个场景是一张 0..100 的画布：
//   shapes  画面内容（山/路/月/灯/窗……）
//   nodes   光可以停驻的点（起点/目标/接口）
//   edges   光可以走的路（折线；needs 旗标未置位时是断的）
// 咬合（dock）把两幅画拼成一个合成画面：
//   link    — 两画并排，接口节点之间搭一条金线
//   overlay — 一幅画的东西落进另一幅（只置旗标，场景自己变）
// ============================================================

export type WPt = [number, number];

export interface WShape {
  k: 'line' | 'circle' | 'rect';
  pts?: WPt[];          // line
  at?: WPt;             // circle / rect
  r?: number;           // circle
  w?: number;           // rect / line 宽度
  h?: number;           // rect
  c?: string;           // 颜色（默认墨）
  rot?: number;
  dash?: boolean;
  fill?: boolean;       // circle 实心 / rect 实心
  flag?: string;        // 依赖旗标
  when?: 'show' | 'hide'; // 旗标置位后 出现 / 消失（默认 show）
  glow?: boolean;       // 金色发光物（月亮/灯/太阳）
}

export interface WNode {
  id: string;
  at: WPt;
  start?: boolean;
  goal?: boolean;
}

export interface WEdge {
  a: string;
  b: string;
  pts: WPt[];
  needs?: string; // 旗标未置位：路是断的（虚线暗色）
}

export interface WScene {
  name: string;
  art: number;            // TileArt 画味变体（底纹）
  shapes: WShape[];
  nodes: WNode[];
  edges: WEdge[];
  sub?: { paint: string; at: WPt; w: number; h: number }; // 画中画挂框
}

export interface WDock {
  id: string;
  aP: string;
  bP: string;
  type: 'link' | 'overlay';
  aNode?: string;         // link：两画接口节点
  bNode?: string;
  grant?: string[];       // 咬合后置位的旗标
  layout: Record<string, WPt>; // 合成画面里各画的偏移（100 为一格）
  addShapes?: Record<string, WShape[]>; // 咬合后补画的东西（桥/光/月亮）
  hint: string;           // 咬合成功的一句话
}

export interface WLevel {
  id: number;
  name: string;
  tip: string;            // 铭牌：这一幕要干嘛
  hint: string;           // 提示按钮
  wall: string[];         // 初始挂在墙上的画
  scenes: Record<string, WScene>;
  docks: WDock[];
  start: { scene: string; node: string };
  goal: { scene: string; node: string };
}

// ------------------------------------------------------------
// 图：把当前状态（已咬合/已拽出）编译成光可以走的图
// ------------------------------------------------------------
export interface GEdge {
  pts: WPt[];   // 绝对坐标
  active: boolean;
}

export interface GraphOut {
  offset: Map<string, WPt>;      // 合成画面中的画 → 偏移（不在合成里的画无条目）
  edges: GEdge[];
  reachEdges: Set<number>;
  reachNodes: Set<string>;       // `${scene}.${node}`
  sceneEdgeIdx: Map<string, number[]>; // 场景内第 i 条边 → 图边下标（墙上单画显示金光用）
  solved: boolean;
  route: WPt[];                  // solved 时：从起点到目标的绝对坐标折线
}

const nkey = (scene: string, node: string) => `${scene}.${node}`;

export function flagsOf(level: WLevel, done: Set<string>): Set<string> {
  const f = new Set<string>();
  for (const d of level.docks) if (done.has(d.id)) for (const g of d.grant ?? []) f.add(g);
  return f;
}

export function layoutOf(level: WLevel, done: Set<string>): Map<string, WPt> {
  const m = new Map<string, WPt>();
  for (const d of level.docks) {
    if (!done.has(d.id)) continue;
    for (const [p, off] of Object.entries(d.layout)) m.set(p, off);
  }
  return m;
}

export function buildGraph(level: WLevel, done: Set<string>, pulled: Set<string>): GraphOut {
  const flags = flagsOf(level, done);
  const offset = layoutOf(level, done);

  // 参与行走的画：墙上 + 已拽出；还在母画肚子里的不参与
  const inside = new Set<string>();
  for (const s of Object.values(level.scenes)) {
    if (s.sub && !pulled.has(s.sub.paint)) inside.add(s.sub.paint);
  }
  const live = Object.keys(level.scenes).filter((id) => !inside.has(id));

  const nodeAbs = new Map<string, WPt>();
  const adj = new Map<string, { to: string; ei: number }[]>();
  const edges: GEdge[] = [];
  const sceneEdgeIdx = new Map<string, number[]>();

  const addNode = (scene: string, n: WNode) => {
    const off = offset.get(scene) ?? [0, 0];
    nodeAbs.set(nkey(scene, n.id), [n.at[0] + off[0], n.at[1] + off[1]]);
  };
  const link = (ka: string, kb: string, pts: WPt[], active: boolean) => {
    const ei = edges.length;
    edges.push({ pts, active });
    (adj.get(ka) ?? adj.set(ka, []).get(ka)!).push({ to: kb, ei });
    (adj.get(kb) ?? adj.set(kb, []).get(kb)!).push({ to: ka, ei });
    return ei;
  };

  for (const sid of live) {
    const sc = level.scenes[sid];
    sc.nodes.forEach((n) => addNode(sid, n));
  }
  for (const sid of live) {
    const sc = level.scenes[sid];
    const off = offset.get(sid) ?? [0, 0];
    const idxs: number[] = [];
    for (const e of sc.edges) {
      const pts = e.pts.map(([x, y]) => [x + off[0], y + off[1]] as WPt);
      idxs.push(link(nkey(sid, e.a), nkey(sid, e.b), pts, !e.needs || flags.has(e.needs)));
    }
    sceneEdgeIdx.set(sid, idxs);
  }
  // 咬合桥：两画接口之间的金线
  for (const d of level.docks) {
    if (!done.has(d.id) || d.type !== 'link' || !d.aNode || !d.bNode) continue;
    const ka = nkey(d.aP, d.aNode);
    const kb = nkey(d.bP, d.bNode);
    const pa = nodeAbs.get(ka);
    const pb = nodeAbs.get(kb);
    if (pa && pb) link(ka, kb, [pa, pb], true);
  }

  // BFS（只走 active 边）
  const startKey = nkey(level.start.scene, level.start.node);
  const goalKey = nkey(level.goal.scene, level.goal.node);
  const reachNodes = new Set<string>([startKey]);
  const reachEdges = new Set<number>();
  const parent = new Map<string, { from: string; ei: number }>();
  const q = [startKey];
  while (q.length) {
    const cur = q.shift()!;
    for (const { to, ei } of adj.get(cur) ?? []) {
      if (!edges[ei].active || reachNodes.has(to)) continue;
      reachNodes.add(to);
      reachEdges.add(ei);
      parent.set(to, { from: cur, ei });
      q.push(to);
    }
  }

  const solved = reachNodes.has(goalKey);
  const route: WPt[] = [];
  if (solved) {
    // 沿父链回溯：节点位置 + 边折线拼成完整路线
    const chain: { key: string; ei?: number }[] = [];
    let cur = goalKey;
    while (cur !== startKey) {
      const p = parent.get(cur)!;
      chain.unshift({ key: cur, ei: p.ei });
      cur = p.from;
    }
    chain.unshift({ key: startKey });
    const sPos = nodeAbs.get(startKey);
    if (sPos) route.push(sPos);
    for (const step of chain) {
      if (step.ei === undefined) continue;
      const ePts = edges[step.ei].pts;
      const last = route[route.length - 1];
      const forward =
        Math.hypot(ePts[0][0] - last[0], ePts[0][1] - last[1]) <=
        Math.hypot(ePts[ePts.length - 1][0] - last[0], ePts[ePts.length - 1][1] - last[1]);
      const seq = forward ? ePts : [...ePts].reverse();
      for (const p of seq) {
        const l = route[route.length - 1];
        if (Math.hypot(p[0] - l[0], p[1] - l[1]) > 0.01) route.push(p);
      }
      const nPos = nodeAbs.get(step.key);
      if (nPos) {
        const l = route[route.length - 1];
        if (Math.hypot(nPos[0] - l[0], nPos[1] - l[1]) > 0.01) route.push(nPos);
      }
    }
  }

  return { offset, edges, reachEdges, reachNodes, sceneEdgeIdx, solved, route };
}

// ------------------------------------------------------------
// 指引圈（画中世界式：可咬合的位置给呼吸金圈，画在画里，不写文字）
// dockId → 场景 → 圈心
// ------------------------------------------------------------
export const DOCK_RINGS: Record<string, Record<string, WPt[]>> = {
  bank: { road: [[94, 58]], river: [[6, 58]] },
  borrow: { moon: [[50, 30]], room: [[50, 47]] },
  enter: { hall: [[71, 52]], valley: [[50, 92]] },
};

// ------------------------------------------------------------
// 三幕
// ------------------------------------------------------------
const INK = '#2a2620';
const GOLD = '#d9a41c';
const CREAM = '#f7f3ea';

export const WLEVELS: WLevel[] = [
  // ============ 第一幕 · 岸：路接上路 ============
  {
    id: 1,
    name: '岸',
    tip: '光想过河。路，断在岸边。',
    hint: '把一幅画拖到另一幅画上——路会自己找到路。',
    wall: ['road', 'river'],
    scenes: {
      road: {
        name: '路',
        art: 2,
        shapes: [
          { k: 'line', pts: [[0, 78], [30, 70], [62, 74], [100, 68]], w: 1.2, c: INK }, // 远山
          { k: 'line', pts: [[84, 40], [92, 52]], w: 1.4, c: INK }, // 断崖裂纹
          { k: 'line', pts: [[88, 36], [96, 48]], w: 1.4, c: INK },
          { k: 'rect', at: [70, 50], w: 5, h: 9, c: '#8a6d4a', fill: true, rot: -8 }, // 断桥桩
        ],
        nodes: [
          { id: 'home', at: [10, 58], start: true },
          { id: 'cliff', at: [94, 58] },
        ],
        edges: [{ a: 'home', b: 'cliff', pts: [[10, 58], [40, 58], [70, 56], [94, 58]] }],
      },
      river: {
        name: '河',
        art: 4,
        shapes: [
          { k: 'line', pts: [[0, 76], [36, 70], [72, 74], [100, 70]], w: 1.1, c: '#4a5d75' }, // 水纹
          { k: 'line', pts: [[8, 86], [48, 82], [88, 85]], w: 1, c: '#4a5d75' },
          { k: 'circle', at: [34, 60], r: 4.5, c: '#8d8578', fill: true }, // 汀步石
          { k: 'circle', at: [56, 54], r: 5, c: '#8d8578', fill: true },
          { k: 'circle', at: [74, 48], r: 4, c: '#8d8578', fill: true },
        ],
        nodes: [
          { id: 'gate', at: [6, 58] },
          { id: 'bell', at: [90, 34], goal: true },
        ],
        edges: [{ a: 'gate', b: 'bell', pts: [[6, 58], [34, 60], [56, 54], [74, 48], [90, 34]] }],
      },
    },
    docks: [
      {
        id: 'bank',
        aP: 'road',
        bP: 'river',
        type: 'link',
        aNode: 'cliff',
        bNode: 'gate',
        layout: { road: [0, 0], river: [103, 0] },
        addShapes: {
          river: [
            { k: 'line', pts: [[-8, 58], [-2, 54], [5, 57]], w: 3, c: '#8a6d4a' }, // 咬合处生出的板桥
          ],
        },
        hint: '断桥处，长出了一块板桥。',
      },
    ],
    start: { scene: 'road', node: 'home' },
    goal: { scene: 'river', node: 'bell' },
  },

  // ============ 第二幕 · 借月：月亮落进灯里 ============
  {
    id: 2,
    name: '借月',
    tip: '房间太暗，光走不过去。天上有一枚月亮。',
    hint: '把有月亮的画，盖到房间上。',
    wall: ['room', 'moon'],
    scenes: {
      room: {
        name: '夜室',
        art: 3,
        shapes: [
          { k: 'line', pts: [[0, 84], [100, 84]], w: 1.4, c: INK }, // 地板
          { k: 'rect', at: [44, 60], w: 12, h: 5, c: INK, fill: true }, // 桌子
          { k: 'line', pts: [[50, 60], [50, 52]], w: 1.6, c: INK }, // 灯杆
          { k: 'circle', at: [50, 47], r: 5.5, c: INK }, // 空灯罩
          { k: 'circle', at: [50, 47], r: 5, c: GOLD, fill: true, glow: true, flag: 'lit' }, // 落进来的月亮
          { k: 'line', pts: [[50, 47], [24, 84]], w: 0.8, c: GOLD, flag: 'lit', dash: true }, // 洒下来的光
          { k: 'line', pts: [[50, 47], [80, 84]], w: 0.8, c: GOLD, flag: 'lit', dash: true },
          { k: 'rect', at: [82, 18], w: 14, h: 18, c: INK }, // 窗
          { k: 'line', pts: [[89, 18], [89, 36]], w: 1, c: INK },
        ],
        nodes: [
          { id: 'bed', at: [10, 76], start: true },
          { id: 'lamp', at: [50, 64] },
          { id: 'win', at: [89, 44], goal: true },
        ],
        edges: [
          { a: 'bed', b: 'lamp', pts: [[10, 76], [30, 74], [50, 64]] },
          { a: 'lamp', b: 'win', pts: [[50, 64], [64, 56], [78, 48], [89, 44]], needs: 'lit' },
        ],
      },
      moon: {
        name: '月夜',
        art: 1,
        shapes: [
          { k: 'circle', at: [50, 30], r: 14, c: '#e8d9a8', fill: true, glow: true, flag: 'lit', when: 'hide' }, // 月亮（被借走后消失）
          { k: 'line', pts: [[0, 74], [30, 62], [58, 70], [100, 60]], w: 1.3, c: INK }, // 山脊
          { k: 'circle', at: [20, 22], r: 1.4, c: CREAM, fill: true }, // 星
          { k: 'circle', at: [78, 14], r: 1.2, c: CREAM, fill: true },
          { k: 'circle', at: [64, 44], r: 1, c: CREAM, fill: true },
        ],
        nodes: [],
        edges: [],
      },
    },
    docks: [
      {
        id: 'borrow',
        aP: 'room',
        bP: 'moon',
        type: 'overlay',
        grant: ['lit'],
        layout: { room: [0, 0] },
        hint: '月亮落进了灯罩。房间亮了。',
      },
    ],
    start: { scene: 'room', node: 'bed' },
    goal: { scene: 'room', node: 'win' },
  },

  // ============ 第三幕 · 谷：画里还挂着一幅画 ============
  {
    id: 3,
    name: '谷',
    tip: '光想到太阳那里去。太阳在墙上的小画里。',
    hint: '点开展厅走进去——小画可以拽出来，变成大画。',
    wall: ['hall'],
    scenes: {
      hall: {
        name: '厅',
        art: 5,
        shapes: [
          { k: 'line', pts: [[0, 86], [100, 86]], w: 1.4, c: INK }, // 地板
          { k: 'line', pts: [[12, 20], [12, 86]], w: 1, c: INK }, // 墙角
          { k: 'circle', at: [30, 66], r: 3, c: '#8a6d4a', fill: true }, // 凳子
        ],
        nodes: [
          { id: 'door', at: [12, 76], start: true },
          { id: 'frame', at: [71, 52] },
        ],
        edges: [{ a: 'door', b: 'frame', pts: [[12, 76], [34, 74], [52, 66], [64, 58], [71, 52]] }],
        sub: { paint: 'valley', at: [58, 18], w: 26, h: 26 },
      },
      valley: {
        name: '谷',
        art: 10,
        shapes: [
          { k: 'line', pts: [[0, 70], [24, 44], [40, 62]], w: 1.5, c: INK }, // 左山
          { k: 'line', pts: [[58, 66], [78, 40], [100, 68]], w: 1.5, c: INK }, // 右山
          { k: 'circle', at: [50, 20], r: 9, c: GOLD, fill: true, glow: true }, // 太阳
          { k: 'line', pts: [[36, 88], [64, 88]], w: 1, c: '#8d8578' }, // 谷口石阶
        ],
        nodes: [
          { id: 'gate', at: [50, 92] },
          { id: 'sun', at: [50, 20], goal: true },
        ],
        edges: [{ a: 'gate', b: 'sun', pts: [[50, 92], [38, 72], [58, 58], [42, 40], [50, 20]] }],
      },
    },
    docks: [
      {
        id: 'enter',
        aP: 'hall',
        bP: 'valley',
        type: 'link',
        aNode: 'frame',
        bNode: 'gate',
        layout: { hall: [0, 0], valley: [112, -34] },
        addShapes: {
          valley: [
            { k: 'line', pts: [[-38, 84], [-14, 92], [-2, 96]], w: 1.2, c: GOLD, dash: true }, // 金线牵进谷口
          ],
        },
        hint: '展厅的路，牵进了山谷。',
      },
    ],
    start: { scene: 'hall', node: 'door' },
    goal: { scene: 'valley', node: 'sun' },
  },
];
