// ============================================================
// Reframe · 重读 — 通用规则引擎
//
// 底层概念：
//   端口(Port)   — 画面边缘的接口，带颜色
//   黑线(Link)   — 画面内部连接两个端口
//   负空间       — hiddenLinks，只有当该格叠有滤片时才显现
//   遮片(Cover)  — 深色覆盖物；coveredLinks 被压住时失效；
//                  遮片自身也可以带 link（窗口）
//   滤片(Filter) — 叠合到某格后，该格边缘的连接不再校验颜色
//   旋转(Rot)    — 可旋转画面，朝向即信息
//   边界(Expand) — 画面边界可以被拉开，制造额外空间
//
// 唯一恒真的连接规则：
//   两个端口相贴 ⇔ 颜色相交，或任一侧边缘上有滤片。
//   其余一切"规则"都是关卡设计出来的错觉。
// ============================================================

export type Dir = 'N' | 'E' | 'S' | 'W';

export const OPP: Record<Dir, Dir> = { N: 'S', S: 'N', E: 'W', W: 'E' };
export const DELTA: Record<Dir, [number, number]> = {
  N: [0, -1],
  S: [0, 1],
  E: [1, 0],
  W: [-1, 0],
};

const ORDER: Dir[] = ['N', 'E', 'S', 'W'];
export function rotDir(d: Dir, r: number): Dir {
  return ORDER[(ORDER.indexOf(d) + ((r % 4) + 4)) % 4];
}

export type ColorId = 'red' | 'blue' | 'yellow' | 'purple' | 'orange';

export const COLOR_HEX: Record<ColorId, string> = {
  red: '#c8402a',
  blue: '#2a4f9e',
  yellow: '#d9a41c',
  purple: '#6d4a8f',
  orange: '#e07b39',
};

export interface Port {
  dir: Dir;
  color: ColorId;
}

export interface Tile {
  id: string;
  ports: Port[];
  links: [Dir, Dir][];
  hiddenLinks?: [Dir, Dir][];  // 负空间：该格叠有滤片时才生效
  coveredLinks?: [Dir, Dir][]; // 被遮片压住时不生效，挪开遮片才生效
  isFilter?: boolean;
  isCover?: boolean;           // 深色遮片：看似障碍，实为可移动的覆盖物
  rotatable?: boolean;
  gold?: boolean;              // 金色母题碎片
  quirkyTab?: Dir;             // “不规则的接口”视觉标记
  dual?: boolean;              // 双色双读：独立时读作两个物体
  initialRot?: Rot;            // 放入初始网格时的朝向
  art: number;
}

export type Rot = 0 | 1 | 2 | 3;
export interface Placed {
  tile: Tile;
  rot: Rot;
}
export type Stack = Placed[];

export interface Terminal {
  x: number;
  y: number;
  dir: Dir;
  color: ColorId;
}

export interface LevelDef {
  id: number;
  chapter: number; // 1-5
  name: string;
  rule: string;    // 本关想让你相信（或怀疑）的规则
  hint: string;
  winLine: string; // 过关语——只陈述机制，不说教
  rows: number;
  cols: number;
  expandCols?: number; // 可拉开的边界（列数目标）
  entry: Terminal;     // 以最终网格坐标给出
  exit: Terminal;
  tiles: Tile[];
  initialCells: (string | string[] | null)[]; // 字符串数组 = 该格初始叠放（从下到上）
  tray: string[];
  trayLabel?: string;  // 托盘名称（滤片 / 遮片……），设置后托盘常驻显示
  features: string[];  // 本关可用的操作说明
}

export const CHAPTERS = [
  { id: 1, name: '颜色', sub: '建立，然后背叛' },
  { id: 2, name: '轮廓', sub: '缺口才是通道' },
  { id: 3, name: '朝向', sub: '不规则即是信息' },
  { id: 4, name: '阴影', sub: '深色不是障碍' },
  { id: 5, name: '边界', sub: '改变条件也是行动' },
];

// ------------------------------------------------------------
// 关卡：误读 → 卡住 → 重新分类 → 发现出路
// 每关一个小循环：教会 → 背叛 → 变体巩固
// ------------------------------------------------------------

export const LEVELS: LevelDef[] = [
  // ============ 第一章 · 颜色 ============
  {
    id: 1,
    chapter: 1,
    name: '配色分类',
    rule: '同色的接口会吸合。让黑线从入口流到出口。',
    hint: '拖动画面，换个位置。颜色要相配，线也要真的通——有的画看着接上了，其实只接了一半。',
    winLine: '你刚刚相信了一条规则：同色即相连。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'blue' }], links: [['W', 'S']], art: 1 },
      { id: 'C', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'yellow' }], links: [['N', 'E']], art: 2, gold: true },
      { id: 'D', ports: [{ dir: 'W', color: 'red' }, { dir: 'N', color: 'purple' }], links: [['W', 'N']], art: 3 }, // 红色诱饵：接得上入口，却通向画外
    ],
    initialCells: ['B', 'A', 'C', 'D'], // 开局光流沿左列下行，死在 C|D 的黄红接口上；任何单交换都不够
    tray: [],
    features: ['拖动换位'],
  },
  {
    id: 2,
    chapter: 1,
    name: '色彩陷阱',
    rule: '整幅画都在发光，就差最后一步。',
    hint: '金光停在了一个不合群的颜色上。托盘里有两片滤片——一片竖缝、一片横缝。滤片只对它有接口的边缘生效，选错方向等于没盖。',
    winLine: '唯一的偏色不是错误，是接口。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'blue' }], links: [['W', 'S']], art: 1 },
      { id: 'C', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'purple' }], links: [['N', 'E']], art: 2, gold: true }, // 唯一的偏色：紫口对着黄出口
      { id: 'F1', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, art: 6 }, // 竖缝滤片：盖不住横向接口
      { id: 'F2', ports: [{ dir: 'W', color: 'orange' }, { dir: 'E', color: 'orange' }], links: [['W', 'E']], isFilter: true, art: 7 }, // 横缝滤片：正对出口缝
    ],
    initialCells: ['A', 'B', null, 'C'], // 开局光流绕满全画，死在 C.E 的紫↔黄缝上
    tray: ['F1', 'F2'],
    trayLabel: '滤 片',
    features: ['拖动换位', '滤片叠合'],
  },
  {
    id: 3,
    chapter: 1,
    name: '双色双读',
    rule: '碎片都在，路却断在半空。',
    hint: '先让光流走起来——有一条看着很顺的蓝线路其实通向画外。链摆对后还断在半空的那块，用托盘里那片橙/紫碎片盖上去：它单独看是两个物体，盖上去就是一层滤片。',
    winLine: '盖住它，才看见路。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'blue' }], links: [['W', 'S']], art: 1 },
      {
        id: 'C',
        ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'yellow' }],
        links: [],
        hiddenLinks: [['N', 'E']],
        art: 2,
        gold: true,
      },
      { id: 'E2', ports: [{ dir: 'W', color: 'red' }, { dir: 'N', color: 'blue' }], links: [['W', 'N']], art: 4 }, // 扰动块
      { id: 'D', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'purple' }], links: [['N', 'S']], isFilter: true, dual: true, rotatable: true, art: 6 },
    ],
    initialCells: ['B', 'A', 'E2', 'C'], // 开局即诱饵陷阱：蓝蓝相接却通向画外
    tray: ['D'],
    trayLabel: '滤 片',
    features: ['拖动换位', '滤片叠合', '负空间'],
  },

  // ============ 第二章 · 轮廓 ============
  {
    id: 4,
    chapter: 2,
    name: '完整轮廓',
    rule: '完整的轮廓才是物体。',
    hint: '那个完美的圆环，线真的进得去吗？数数每块砖边缘上的接口。',
    winLine: '完整的轮廓也会是死路。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 10 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 10 },
      { id: 'C', ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 10, gold: true },
      { id: 'D', ports: [{ dir: 'W', color: 'red' }], links: [], art: 9 }, // 完美圆环，但线是断头
    ],
    initialCells: ['D', 'A', 'B', 'C'], // 开局圆环正堵入口：光一进环就消失
    tray: [],
    features: ['拖动换位'],
  },
  {
    id: 5,
    chapter: 2,
    name: '裂缝',
    rule: '断了，就是坏了。',
    hint: '那不是断裂，是一道缝。缝的两端只差一层显影——托盘里的滤片。',
    winLine: '裂缝不是损坏，是通道。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'blue' }], links: [['W', 'S']], art: 1 },
      {
        id: 'C',
        ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'yellow' }],
        links: [],
        hiddenLinks: [['N', 'E']],
        art: 5,
        gold: true,
      },
      { id: 'F', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
    ],
    initialCells: ['A', 'B', 'C', null], // 开局光流断在半空；裂缝砖在画外等着被看懂
    tray: ['F'],
    trayLabel: '滤 片',
    features: ['拖动换位', '滤片叠合', '负空间'],
  },
  {
    id: 6,
    chapter: 2,
    name: '负空间拼接',
    rule: '路变长了，最后还是断的。',
    hint: '连环都能接上，只有最后一块是"空"的。空的不是缺陷——它等着被显影。',
    winLine: '空的那块，才是最后一块拼图。',
    rows: 2,
    cols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 4 },
      { id: 'C', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'blue' }], links: [['W', 'S']], art: 3 },
      {
        id: 'D',
        ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'yellow' }],
        links: [],
        hiddenLinks: [['N', 'E']],
        art: 2,
        gold: true,
      },
      { id: 'G', ports: [{ dir: 'W', color: 'blue' }, { dir: 'N', color: 'blue' }], links: [['W', 'N']], art: 1 }, // 诱人的侧路
      { id: 'F', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
    ],
    initialCells: ['A', 'B', 'G', 'C', null, 'D'], // 开局光流死在 B|G 的红蓝缝上：诱人的侧路先亮给你看
    tray: ['F'],
    trayLabel: '滤 片',
    features: ['拖动换位', '滤片叠合', '负空间'],
  },
  {
    id: 7,
    chapter: 2,
    name: '两处断口',
    rule: '一片滤片，好像不够用。',
    hint: '断口有两处，而且性质不同：一处是颜色不相认，一处是路径没显影。它们各自需要一片。注意：滤片也可以点按旋转——它只让被它盖住的边缘不计颜色。',
    winLine: '两处断口，两种读法，各要一片。',
    rows: 2,
    cols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'blue' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 4 },
      { id: 'C', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'purple' }], links: [['W', 'S']], art: 3 },
      {
        id: 'D',
        ports: [{ dir: 'N', color: 'yellow' }, { dir: 'E', color: 'yellow' }],
        links: [],
        hiddenLinks: [['N', 'E']],
        art: 2,
        gold: true,
      },
      { id: 'F1', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
      { id: 'F2', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
    ],
    initialCells: ['A', 'B', 'C', null, null, 'D'],
    tray: ['F1', 'F2'],
    trayLabel: '滤 片',
    features: ['拖动换位', '滤片叠合', '点按旋转滤片', '负空间'],
  },

  // ============ 第三章 · 朝向 ============
  {
    id: 8,
    chapter: 3,
    name: '转向',
    rule: '这块的方向，好像不太对。',
    hint: '点一下画面，它会转九十度。他习惯把钥匙藏在朝向里。',
    winLine: '朝向也是拼法的一部分。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 4, rotatable: true, initialRot: 1 },
      { id: 'C', ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 5, gold: true },
      { id: 'D', ports: [{ dir: 'W', color: 'red' }, { dir: 'N', color: 'red' }], links: [['W', 'N']], art: 3 },
    ],
    initialCells: ['B', 'A', 'D', 'C'], // 开局 B 横躺在入口：光向上流出画外；只旋转不够，还要先换位
    tray: [],
    features: ['拖动换位', '点按旋转'],
  },
  {
    id: 9,
    chapter: 3,
    name: '不对称的接口',
    rule: '这次颜色都一样。路藏在朝向上。',
    hint: '别急着把构图摆匀称——那个看着别扭的朝向，可能正是接口。',
    winLine: '不协调的边角不是要修复的东西，是信息。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 4, rotatable: true, initialRot: 1 },
      { id: 'C', ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 5, rotatable: true, initialRot: 1, gold: true, quirkyTab: 'E' },
      { id: 'D', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 3, rotatable: true },
    ],
    initialCells: ['A', 'B', 'D', 'C'],
    tray: [],
    features: ['拖动换位', '点按旋转'],
  },
  {
    id: 10,
    chapter: 3,
    name: '朝向与颜色',
    rule: '转来转去，总差一口气。',
    hint: '这一关要同时用两只手：旋转归位，以及一片不计颜色的滤片。少一样都差一点。',
    winLine: '朝向解决一半，重新分类解决另一半。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 4, rotatable: true, initialRot: 1 },
      { id: 'C', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 5, rotatable: true, initialRot: 1, gold: true, quirkyTab: 'N' },
      { id: 'F', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
    ],
    initialCells: ['A', 'B', null, 'C'],
    tray: ['F'],
    trayLabel: '滤 片',
    features: ['拖动换位', '点按旋转', '滤片叠合'],
  },

  // ============ 第四章 · 阴影 ============
  {
    id: 11,
    chapter: 4,
    name: '深色遮片',
    rule: '画面中央那块深色，把路堵死了。',
    hint: '深色真的是画上去的吗？碰碰它——拖拖看。',
    winLine: '深色不是障碍，是一片可以挪开的遮片。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 4 },
      {
        id: 'C',
        ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'red' }],
        links: [],
        coveredLinks: [['N', 'E']],
        art: 2,
        gold: true,
      },
      { id: 'K', ports: [], links: [], isCover: true, art: 8 },
    ],
    initialCells: ['B', 'A', null, ['C', 'K']], // 开局光流断在半空；修好链才发现深色压着路
    tray: [],
    trayLabel: '遮 片',
    features: ['拖动换位', '挪开遮片'],
  },
  {
    id: 12,
    chapter: 4,
    name: '窗口',
    rule: '挪开深色之后，路通向一条死胡同。',
    hint: '托盘里还有另一片深色——它中间开着一道口子。遮片不一定要挪开，也可以换一片。',
    winLine: '遮片开对了口，就是窗口。',
    rows: 2,
    cols: 2,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 1, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'blue' }], links: [['W', 'S']], art: 1 },
      {
        id: 'C',
        ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'red' }, { dir: 'W', color: 'red' }],
        links: [],
        coveredLinks: [['W', 'E']], // 挪开遮片才出现的——诱饵死路
        art: 2,
        gold: true,
      },
      { id: 'K', ports: [], links: [], isCover: true, art: 8 },
      { id: 'W1', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], isCover: true, art: 8 }, // 开口的遮片
    ],
    initialCells: ['B', 'A', null, ['C', 'K']], // 与 L11 同构开局——这次的背叛是"挪开还不够"
    tray: ['W1'],
    trayLabel: '遮 片',
    features: ['拖动换位', '挪开遮片', '换上窗口'],
  },
  {
    id: 13,
    chapter: 4,
    name: '两片深色',
    rule: '两块画面都被深色压住了。',
    hint: '两片深色不是同一种东西：一片下面的路是现成的，挪开就好；另一片下面什么都没有——它那个位置需要一道窗口。',
    winLine: '一片要挪开，一片要替换。',
    rows: 2,
    cols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 4 },
      {
        id: 'D',
        ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'red' }],
        links: [],
        coveredLinks: [['N', 'E']],
        art: 2,
        gold: true,
      },
      { id: 'E', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [], art: 5 },
      { id: 'K1', ports: [], links: [], isCover: true, art: 8 },
      { id: 'K2', ports: [], links: [], isCover: true, art: 8 },
      { id: 'W1', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], isCover: true, art: 8 },
    ],
    initialCells: ['A', 'B', null, null, ['D', 'K1'], ['E', 'K2']],
    tray: ['W1'],
    trayLabel: '遮 片',
    features: ['拖动换位', '挪开遮片', '换上窗口'],
  },
  {
    id: 14,
    chapter: 4,
    name: '暗处与负空间',
    rule: '阴影和空白，同时挡在路上。',
    hint: '两种"没有"：被深色压住的，要挪开；还没显影的，要叠滤片。它们不是一回事。',
    winLine: '暗处要挪开，空白要显影。',
    rows: 2,
    cols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'blue' }], links: [['W', 'S']], art: 1 },
      {
        id: 'C',
        ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'red' }],
        links: [],
        coveredLinks: [['N', 'E']],
        art: 2,
      },
      {
        id: 'D',
        ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'yellow' }],
        links: [],
        hiddenLinks: [['W', 'E']],
        art: 3,
        gold: true,
      },
      { id: 'K', ports: [], links: [], isCover: true, art: 8 },
      { id: 'F', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
    ],
    initialCells: ['A', 'B', null, null, ['C', 'K'], 'D'],
    tray: ['F'],
    trayLabel: '遮 片',
    features: ['拖动换位', '挪开遮片', '滤片叠合'],
  },

  // ============ 第五章 · 边界 ============
  {
    id: 15,
    chapter: 5,
    name: '资源不足',
    rule: '四块碎片，两格空间，拼不出一条通路。',
    hint: '有些局面不是拼法不对，是墙太小。画面右侧那条虚线——是可以拉开的。',
    winLine: '不是所有局面都要硬塞进现有结构。',
    rows: 2,
    cols: 2,
    expandCols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 4 },
      { id: 'C', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 5 },
      { id: 'D', ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 3, gold: true },
    ],
    initialCells: ['A', 'C', 'B', 'D'],
    tray: [],
    features: ['拖动换位', '拉开边界'],
  },
  {
    id: 16,
    chapter: 5,
    name: '重复纹样',
    rule: '六块砖，长得一模一样。',
    hint: '别再用颜色判断了。凑近看每个弯头的朝向——偏差藏在重复里。',
    winLine: '重复不是装饰，每一次偏差都是路径。',
    rows: 2,
    cols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 0, dir: 'E', color: 'red' },
    tiles: [
      { id: 'S', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 7 },
      { id: 'E1', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 7 },
      { id: 'E2', ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 7 },
      { id: 'E3', ports: [{ dir: 'W', color: 'red' }, { dir: 'N', color: 'red' }], links: [['W', 'N']], art: 7, gold: true },
      { id: 'E4', ports: [{ dir: 'S', color: 'red' }, { dir: 'E', color: 'red' }], links: [['S', 'E']], art: 7 },
      { id: 'X', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 7 },
    ],
    initialCells: ['E1', 'E2', 'S', 'X', 'E4', 'E3'],
    tray: [],
    features: ['拖动换位', '辨别偏差'],
  },
  {
    id: 17,
    chapter: 5,
    name: '拉开之后',
    rule: '拉开了边界，还是差一步。',
    hint: '空间解决了一半。最后那道断口是颜色不相认——它还差一片滤片。',
    winLine: '先改变条件，再重新分类。',
    rows: 2,
    cols: 2,
    expandCols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 1, dir: 'E', color: 'red' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 4 },
      { id: 'C', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 5 },
      { id: 'D', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 3, gold: true },
      { id: 'F', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
    ],
    initialCells: ['A', 'C', 'B', 'D'],
    tray: ['F'],
    trayLabel: '滤 片',
    features: ['拖动换位', '拉开边界', '滤片叠合'],
  },
  {
    id: 18,
    chapter: 5,
    name: '金色合拢',
    rule: '最后一幅图。每一块金色都在最难的位置。',
    hint: '三件事都要做：转正那块横的，挪开那片深色，让最后一段显影。',
    winLine: '金色不是奖励，是这张图的结构核心。',
    rows: 2,
    cols: 3,
    entry: { x: 0, y: 0, dir: 'W', color: 'red' },
    exit: { x: 2, y: 1, dir: 'E', color: 'yellow' },
    tiles: [
      { id: 'A', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 0 },
      { id: 'B', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 4, rotatable: true, initialRot: 1, gold: true },
      {
        id: 'C',
        ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }],
        links: [],
        coveredLinks: [['W', 'S']],
        art: 5,
        gold: true,
      },
      {
        id: 'D',
        ports: [{ dir: 'N', color: 'red' }, { dir: 'E', color: 'yellow' }],
        links: [],
        hiddenLinks: [['N', 'E']],
        art: 2,
        gold: true,
      },
      { id: 'K', ports: [], links: [], isCover: true, art: 8 },
      { id: 'F', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], isFilter: true, rotatable: true, art: 6 },
    ],
    initialCells: ['A', 'B', ['C', 'K'], null, null, 'D'],
    tray: ['F'],
    trayLabel: '遮 片',
    features: ['拖动换位', '点按旋转', '挪开遮片', '滤片叠合'],
  },
];

// ------------------------------------------------------------
// 连通性求解
// ------------------------------------------------------------

class UnionFind {
  parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    const p = this.parent.get(x)!;
    if (p === x) return x;
    const r = this.find(p);
    this.parent.set(x, r);
    return r;
  }
  union(a: string, b: string) {
    this.parent.set(this.find(a), this.find(b));
  }
}

interface NodeInfo {
  colors: Set<ColorId>;
  hasFilter: boolean;
}

export interface Bridge {
  x: number;
  y: number;
  dir: 'E' | 'S';
  lit: boolean;
}

export interface FlowResult {
  solved: boolean;
  lit: Set<string>; // `${x},${y}:${dir}`
  bridges: Bridge[];
  dist: Map<string, number>; // 从入口出发的 BFS 跳数——金光传播的时序
  maxDist: number;
}

export function stackHasFilter(stack: Stack): boolean {
  return stack.some((p) => p.tile.isFilter);
}

export function stackHasCover(stack: Stack): boolean {
  return stack.some((p) => p.tile.isCover);
}

export function computeFlow(level: LevelDef, cols: number, stacks: Stack[]): FlowResult {
  const rows = level.rows;
  const uf = new UnionFind();
  const nodes = new Map<string, NodeInfo>();
  const edges: [string, string][] = []; // 实际连通的边（与 union 同步记录，供 BFS 时序用）
  const key = (x: number, y: number, dir: Dir) => `${x},${y}:${dir}`;

  const empty: FlowResult = { solved: false, lit: new Set(), bridges: [], dist: new Map(), maxDist: 0 };

  // 1. 收集节点（同格同向端口合并；旋转换算到棋盘坐标）
  stacks.forEach((stack, cell) => {
    const x = cell % cols;
    const y = Math.floor(cell / cols);
    const revealed = stackHasFilter(stack);
    const covered = stackHasCover(stack);
    for (const p of stack) {
      const t = p.tile;
      for (const port of t.ports) {
        const k = key(x, y, rotDir(port.dir, p.rot));
        if (!nodes.has(k)) nodes.set(k, { colors: new Set(), hasFilter: false });
        const n = nodes.get(k)!;
        n.colors.add(port.color);
        if (t.isFilter) n.hasFilter = true;
      }
      const links: [Dir, Dir][] = [
        ...t.links,
        ...(revealed ? t.hiddenLinks ?? [] : []),
        ...(covered ? [] : t.coveredLinks ?? []),
      ];
      for (const [a, b] of links) {
        const ka = key(x, y, rotDir(a, p.rot));
        const kb = key(x, y, rotDir(b, p.rot));
        if (nodes.has(ka) && nodes.has(kb)) {
          uf.union(ka, kb);
          edges.push([ka, kb]);
        }
      }
    }
  });

  // 2. 相邻格连接
  const bridges: Bridge[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      for (const dir of ['E', 'S'] as const) {
        const [dx, dy] = DELTA[dir];
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= cols || ny >= rows) continue;
        const a = nodes.get(key(x, y, dir));
        const b = nodes.get(key(nx, ny, OPP[dir]));
        if (!a || !b) continue;
        const colorMatch = [...a.colors].some((c) => b.colors.has(c));
        if (colorMatch || a.hasFilter || b.hasFilter) {
          uf.union(key(x, y, dir), key(nx, ny, OPP[dir]));
          edges.push([key(x, y, dir), key(nx, ny, OPP[dir])]);
          bridges.push({ x, y, dir, lit: false });
        }
      }
    }
  }

  // 3. 入口 / 出口（可能尚在边界之外）
  const inBounds = (t: Terminal) => t.x >= 0 && t.y >= 0 && t.x < cols && t.y < rows;
  if (!inBounds(level.entry) || !inBounds(level.exit)) return { ...empty, bridges };
  const connectTerminal = (t: Terminal, term: string) => {
    const n = nodes.get(key(t.x, t.y, t.dir));
    if (n && (n.colors.has(t.color) || n.hasFilter)) {
      uf.union(key(t.x, t.y, t.dir), term);
      edges.push([key(t.x, t.y, t.dir), term]);
    }
  };
  connectTerminal(level.entry, 'SRC');
  connectTerminal(level.exit, 'SNK');

  const srcRoot = uf.find('SRC');
  const lit = new Set<string>();
  for (const k of nodes.keys()) if (uf.find(k) === srcRoot) lit.add(k);
  if (uf.find('SNK') === srcRoot) lit.add('SNK');

  // 4. BFS：金光从入口逐跳传播的距离（驱动 stagger 动画）
  const adj = new Map<string, string[]>();
  for (const [a, b] of edges) {
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
  }
  const dist = new Map<string, number>([['SRC', 0]]);
  const queue = ['SRC'];
  let maxDist = 0;
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of adj.get(cur) ?? []) {
      if (!dist.has(nb)) {
        dist.set(nb, dist.get(cur)! + 1);
        maxDist = Math.max(maxDist, dist.get(nb)!);
        queue.push(nb);
      }
    }
  }

  for (const br of bridges) {
    br.lit = lit.has(key(br.x, br.y, br.dir));
  }

  const solved = uf.find('SNK') === srcRoot && lit.size > 0;
  return { solved, lit, bridges, dist, maxDist };
}
