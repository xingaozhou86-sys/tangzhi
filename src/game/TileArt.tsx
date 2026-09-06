import { useId } from 'react';
import type { ColorId, Dir, Tile } from './model';
import { COLOR_HEX } from './model';

// 色盲冗余：每种颜色的端口上带一个白色形状标记
// 红=纯色（基准） 蓝=横线 黄=圆点 紫=十字 橙=斜线
function TabMark({ color, cx, cy }: { color: ColorId; cx: number; cy: number }) {
  const s = { stroke: '#f7f3ea', strokeWidth: 1.5, strokeLinecap: 'round' as const };
  switch (color) {
    case 'blue':
      return <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} {...s} />;
    case 'yellow':
      return <circle cx={cx} cy={cy} r={2.1} fill="#f7f3ea" />;
    case 'purple':
      return (
        <g {...s}>
          <line x1={cx - 3} y1={cy} x2={cx + 3} y2={cy} />
          <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 3} />
        </g>
      );
    case 'orange':
      return <line x1={cx - 3} y1={cy + 3} x2={cx + 3} y2={cy - 3} {...s} />;
    default:
      return null;
  }
}

// 黑线路径（viewBox 100x100，端口在各边中点）
const LINK_PATHS: Record<string, string> = {
  EW: 'M 0 50 L 100 50',
  NS: 'M 50 0 L 50 100',
  EN: 'M 50 0 A 50 50 0 0 1 100 50',
  NW: 'M 50 0 A 50 50 0 0 0 0 50',
  ES: 'M 50 100 A 50 50 0 0 0 100 50',
  SW: 'M 0 50 A 50 50 0 0 1 50 100',
};

function linkKey(a: Dir, b: Dir) {
  return [a, b].sort().join('');
}

const TAB: Record<Dir, { x: number; y: number; w: number; h: number }> = {
  N: { x: 41, y: 0, w: 18, h: 9 },
  S: { x: 41, y: 91, w: 18, h: 9 },
  W: { x: 0, y: 41, w: 9, h: 18 },
  E: { x: 91, y: 41, w: 9, h: 18 },
};

// 金色母题的位置（按 art 变体错开）
const GOLD_POS: [number, number][] = [
  [76, 74], [22, 78], [26, 20], [78, 22], [24, 24], [76, 22], [50, 50], [50, 26], [50, 50], [50, 74], [50, 26],
];

// 残端：裂缝/负空间未显影时，从边缘伸出的半截线
const STUB: Record<Dir, string> = {
  N: 'M 50 0 L 50 24',
  S: 'M 50 100 L 50 76',
  W: 'M 0 50 L 24 50',
  E: 'M 100 50 L 76 50',
};

// ------------------------------------------------------------
// 画味系统：布面抽象画
// 原则：柔边晕染代替硬填充，手弧线代替直线，颗粒与做旧统一质感
// ------------------------------------------------------------
const P = {
  ink: '#2a2620',
  ochre: '#c49a3a',
  rust: '#a9502f',
  slate: '#4a5d75',
  sage: '#7d8a5c',
  clay: '#b07a4e',
  plum: '#6f5570',
  cream: '#f2ead8',
};

/** 柔边晕染：径向渐退的色块，像颜料在布上化开 */
function Wash({ id, cx, cy, r, color, op = 0.85 }: { id: string; cx: number; cy: number; r: number; color: string; op?: number }) {
  return (
    <>
      <radialGradient id={id}>
        <stop offset="50%" stopColor={color} stopOpacity={op} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </>
  );
}

/** 纸面颗粒：极轻的噪点，消除"打印感" */
function Grain({ uid }: { uid: string }) {
  return (
    <>
      <filter id={`${uid}grain`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
      </filter>
      <rect x={0} y={0} width={100} height={100} filter={`url(#${uid}grain)`} opacity={0.07} pointerEvents="none" />
    </>
  );
}

/** 做旧边缘：四角轻微压暗，像挂了些年的画 */
function Vignette({ uid }: { uid: string }) {
  return (
    <>
      <radialGradient id={`${uid}vig`} cx="50%" cy="42%" r="78%">
        <stop offset="60%" stopColor="#191713" stopOpacity={0} />
        <stop offset="100%" stopColor="#191713" stopOpacity={0.13} />
      </radialGradient>
      <rect x={0} y={0} width={100} height={100} fill={`url(#${uid}vig)`} pointerEvents="none" />
    </>
  );
}

function Specks({ pts }: { pts: [number, number, number][] }) {
  return (
    <>
      {pts.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={P.ink} opacity={0.3} />
      ))}
    </>
  );
}

function Decor({ art, c1, c2, dual, uid }: { art: number; c1: string; c2: string; dual?: boolean; uid: string }) {
  if (dual) {
    // 双色双读：独立时读作两个物体（柔和的瓶与月）
    return (
      <>
        <Wash id={`${uid}dw1`} cx={26} cy={50} r={30} color={c1} op={0.55} />
        <rect x={11} y={16} width={30} height={68} rx={15} fill={c1} opacity={0.82} />
        <Wash id={`${uid}dw2`} cx={72} cy={50} r={32} color={c2} op={0.55} />
        <circle cx={72} cy={50} r={22} fill={c2} opacity={0.82} />
        <path d="M 50 12 Q 46 50 50 88" fill="none" stroke={P.ink} strokeWidth={1.4} opacity={0.25} />
      </>
    );
  }
  switch (art % 11) {
    case 0:
      // 墙角日出：角落化开的暖色 + 悬浮的方形
      return (
        <>
          <Wash id={`${uid}w0`} cx={6} cy={94} r={72} color={P.rust} op={0.85} />
          <linearGradient id={`${uid}g0`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={P.ochre} stopOpacity={0.9} />
            <stop offset="100%" stopColor={P.clay} stopOpacity={0.7} />
          </linearGradient>
          <rect x={58} y={12} width={30} height={30} fill={`url(#${uid}g0)`} transform="rotate(8 73 27)" />
          <path d="M 96 6 Q 62 38 88 80" fill="none" stroke={P.slate} strokeWidth={2.2} opacity={0.5} strokeLinecap="round" />
          <Specks pts={[[30, 20, 1.6], [22, 34, 1.2], [42, 14, 1.1]]} />
        </>
      );
    case 1:
      // 斜光：一道斜进来的冷色光带 + 一团暖
      return (
        <>
          <linearGradient id={`${uid}g1`} x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor={P.slate} stopOpacity={0.7} />
            <stop offset="100%" stopColor={P.slate} stopOpacity={0.3} />
          </linearGradient>
          <path d="M 0 16 L 100 0 L 100 26 L 0 46 Z" fill={`url(#${uid}g1)`} />
          <Wash id={`${uid}w1`} cx={76} cy={72} r={26} color={P.plum} op={0.8} />
          <path d="M 8 84 Q 50 68 92 88" fill="none" stroke={P.ink} strokeWidth={1.8} opacity={0.4} strokeLinecap="round" />
          <Specks pts={[[16, 60, 1.4], [26, 54, 1.1]]} />
        </>
      );
    case 2:
      // 地平线：顶部色层 + 右下角化开的绿
      return (
        <>
          <linearGradient id={`${uid}g2`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.clay} stopOpacity={0.75} />
            <stop offset="100%" stopColor={P.clay} stopOpacity={0.25} />
          </linearGradient>
          <rect x={0} y={0} width={100} height={28} fill={`url(#${uid}g2)`} />
          <Wash id={`${uid}w2`} cx={96} cy={96} r={58} color={P.sage} op={0.85} />
          <rect x={10} y={64} width={14} height={14} fill={P.rust} opacity={0.85} transform="rotate(-6 17 71)" />
          <path d="M 0 31 L 100 27" fill="none" stroke={P.ink} strokeWidth={1.6} opacity={0.35} />
          <Specks pts={[[60, 52, 1.3], [70, 44, 1]]} />
        </>
      );
    case 3:
      // 角落的重量：一角沉下去，一笔暖弧把它拉住
      return (
        <>
          <Wash id={`${uid}w3`} cx={98} cy={4} r={62} color={P.ink} op={0.75} />
          <linearGradient id={`${uid}g3`} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor={P.clay} stopOpacity={0.9} />
            <stop offset="100%" stopColor={P.rust} stopOpacity={0.65} />
          </linearGradient>
          <rect x={12} y={62} width={30} height={30} fill={`url(#${uid}g3)`} transform="rotate(-6 27 77)" />
          <path d="M 6 30 Q 40 8 74 26" fill="none" stroke={P.ochre} strokeWidth={2.4} opacity={0.55} strokeLinecap="round" />
          <Specks pts={[[60, 80, 1.4], [70, 72, 1.1]]} />
        </>
      );
    case 4:
      // 低地：绿色在底部淤积，两根细线撑起呼吸
      return (
        <>
          <linearGradient id={`${uid}g4`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={P.sage} stopOpacity={0.3} />
            <stop offset="100%" stopColor={P.sage} stopOpacity={0.85} />
          </linearGradient>
          <path d="M 0 100 L 100 100 L 100 40 L 0 70 Z" fill={`url(#${uid}g4)`} />
          <Wash id={`${uid}w4`} cx={24} cy={22} r={20} color={P.plum} op={0.8} />
          <path d="M 52 12 L 54 88" fill="none" stroke={P.ink} strokeWidth={1.4} opacity={0.25} />
          <path d="M 64 10 L 62 90" fill="none" stroke={P.ink} strokeWidth={1.4} opacity={0.2} />
          <Specks pts={[[80, 20, 1.3], [86, 32, 1]]} />
        </>
      );
    case 5:
      // 窗的练习：冷色一角 + 一个被轻轻画出来的方
      return (
        <>
          <Wash id={`${uid}w5`} cx={2} cy={2} r={56} color={P.slate} op={0.85} />
          <linearGradient id={`${uid}g5`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={P.cream} stopOpacity={0.65} />
            <stop offset="100%" stopColor={P.ochre} stopOpacity={0.3} />
          </linearGradient>
          <rect x={46} y={46} width={44} height={44} fill={`url(#${uid}g5)`} stroke={P.ink} strokeWidth={2.2} transform="rotate(3 68 68)" />
          <path d="M 12 88 L 88 14" fill="none" stroke={P.rust} strokeWidth={1.8} opacity={0.4} strokeLinecap="round" />
          <Specks pts={[[22, 60, 1.3], [32, 70, 1]]} />
        </>
      );
    case 6:
      // 玻璃（滤片）：近乎透明的竖纹，像毛玻璃
      return (
        <>
          <linearGradient id={`${uid}g6`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P.cream} stopOpacity={0.55} />
            <stop offset="100%" stopColor={P.cream} stopOpacity={0.08} />
          </linearGradient>
          {[14, 42, 70].map((x) => (
            <rect key={x} x={x} y={0} width={16} height={100} fill={`url(#${uid}g6)`} />
          ))}
          <Wash id={`${uid}w6`} cx={50} cy={50} r={44} color={P.ochre} op={0.14} />
        </>
      );
    case 7:
      // 重复纹样：三条完全相同的斜带——看起来每块砖都一样
      return (
        <>
          <linearGradient id={`${uid}g7`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={P.clay} stopOpacity={0.6} />
            <stop offset="100%" stopColor={P.clay} stopOpacity={0.3} />
          </linearGradient>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${-20 + i * 34} 120 L ${60 + i * 34} -20 L ${72 + i * 34} -20 L ${-8 + i * 34} 120 Z`} fill={`url(#${uid}g7)`} />
          ))}
          <Specks pts={[[50, 50, 1.2], [80, 18, 1]]} />
        </>
      );
    case 8:
      // 深色遮片：整块沉重的深色板，带一道旧划痕
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill="#2b2723" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M ${i * 24 - 10} 104 L ${i * 24 + 34} -4`} stroke="#3a352e" strokeWidth={4} />
          ))}
          <path d="M 14 78 Q 46 60 82 70" fill="none" stroke="#4a443b" strokeWidth={1.6} opacity={0.8} />
          <rect x={6} y={6} width={88} height={88} fill="none" stroke="#17140f" strokeWidth={2.5} />
        </>
      );
    case 9:
      // 完整轮廓：一个完美的、封闭的圆环——温润但哪儿也不通
      return (
        <>
          <Wash id={`${uid}w9`} cx={50} cy={50} r={46} color={P.ochre} op={0.25} />
          <circle cx={50} cy={50} r={35} fill="none" stroke={P.ochre} strokeWidth={12} opacity={0.9} />
          <circle cx={50} cy={50} r={43} fill="none" stroke={P.ink} strokeWidth={1.4} opacity={0.25} />
          <Wash id={`${uid}w9b`} cx={50} cy={50} r={14} color={P.plum} op={0.4} />
        </>
      );
    case 10:
      // 缺口圆环：轮廓在顶部断开——缺口才是路
      return (
        <>
          <Wash id={`${uid}w10`} cx={50} cy={56} r={44} color={P.slate} op={0.2} />
          <circle cx={50} cy={50} r={35} fill="none" stroke={P.slate} strokeWidth={12} opacity={0.88}
            strokeDasharray="172 52" transform="rotate(-64 50 50)" strokeLinecap="round" />
          <Wash id={`${uid}w10b`} cx={82} cy={24} r={11} color={P.rust} op={0.6} />
          <path d="M 74 34 Q 82 28 90 30" fill="none" stroke={P.ink} strokeWidth={1.6} opacity={0.4} strokeLinecap="round" />
        </>
      );
    default:
      return (
        <>
          <Wash id={`${uid}wd`} cx={50} cy={50} r={52} color={P.cream} op={0.5} />
          <Specks pts={[[30, 30, 1.2], [68, 62, 1.4]]} />
        </>
      );
  }
}

export default function TileArt({
  tile,
  litDirs,
  litDelays,
  revealed = false,
  covered = false,
  asOverlay = false,
}: {
  tile: Tile;
  litDirs: Set<string>;
  litDelays?: Map<string, number>; // 局部方向 → 金光到达延迟（ms），由 BFS 距离驱动
  revealed?: boolean; // 所在格叠有滤片 → 负空间显现
  covered?: boolean;  // 所在格被遮片压住 → coveredLinks 不生效
  asOverlay?: boolean; // 作为叠层渲染（半透明）
}) {
  const uid = useId().replace(/:/g, '');
  const c1 = COLOR_HEX[tile.ports[0]?.color ?? 'red'];
  const c2 = COLOR_HEX[tile.ports[1]?.color ?? tile.ports[0]?.color ?? 'red'];

  if (tile.isCover) {
    // 遮片：沉重的深色板；自带 link 的是"窗口"（纸色通道穿透深色）
    return (
      <svg viewBox="0 0 100 100" className="block h-full w-full" aria-label={tile.id}>
        <Decor art={tile.art} c1={c1} c2={c2} uid={uid} />
        <Grain uid={uid} />
        {tile.links.map(([a, b], i) => {
          const d = LINK_PATHS[linkKey(a, b)];
          const lit = litDirs.has(a) || litDirs.has(b);
          const delay = litDelays?.get(a) ?? litDelays?.get(b) ?? 0;
          return (
            <g key={i}>
              {lit && (
                <path d={d} fill="none" stroke="#d9a41c" strokeWidth={16} strokeLinecap="round" className="lit-glow" style={{ animationDelay: `${delay}ms` }} />
              )}
              <path d={d} fill="none" stroke="#f7f3ea" strokeWidth={13} strokeLinecap="round" />
              <path d={d} fill="none" stroke={lit ? '#8a6d1f' : '#191713'} strokeWidth={2} strokeLinecap="round" opacity={0.7} style={{ transition: 'stroke 0.35s' }} />
              {lit && (
                <path d={d} fill="none" stroke="#ffe9a8" strokeWidth={2.4} strokeLinecap="round" className="lit-core" style={{ animationDelay: `${delay}ms` }} />
              )}
            </g>
          );
        })}
        {tile.ports.map((p) => {
          const t = TAB[p.dir];
          const lit = litDirs.has(p.dir);
          return (
            <g key={p.dir} style={lit ? { filter: 'drop-shadow(0 0 4px rgba(217,164,28,0.95))' } : undefined}>
              <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={3}
                fill={COLOR_HEX[p.color]} stroke={lit ? '#d9a41c' : '#f7f3ea'} strokeWidth={lit ? 2.6 : 1.2} />
              <TabMark color={p.color} cx={t.x + t.w / 2} cy={t.y + t.h / 2} />
            </g>
          );
        })}
      </svg>
    );
  }

  const renderLink = (a: Dir, b: Dir, i: number, hidden: boolean) => {
    const d = LINK_PATHS[linkKey(a, b)];
    const lit = litDirs.has(a) || litDirs.has(b);
    const delay = litDelays?.get(a) ?? litDelays?.get(b) ?? 0;
    if (hidden) {
      // 负空间：纸色粗线把色块"擦掉"，中间一道虚线
      return (
        <g key={`h${i}`}>
          {lit && (
            <path d={d} fill="none" stroke="#d9a41c" strokeWidth={16} strokeLinecap="round" className="lit-glow" style={{ animationDelay: `${delay}ms` }} />
          )}
          <path d={d} fill="none" stroke="#f7f3ea" strokeWidth={12} strokeLinecap="round" />
          <path d={d} fill="none" stroke={lit ? '#8a6d1f' : '#191713'} strokeWidth={1.6} strokeDasharray="4 4" opacity={0.8} style={{ transition: 'stroke 0.35s' }} />
          {lit && (
            <path d={d} fill="none" stroke="#ffe9a8" strokeWidth={2.4} strokeLinecap="round" className="lit-core" style={{ animationDelay: `${delay}ms` }} />
          )}
        </g>
      );
    }
    return (
      <g key={i}>
        {lit && (
          <path d={d} fill="none" stroke="#d9a41c" strokeWidth={14} strokeLinecap="round" className="lit-glow" style={{ animationDelay: `${delay}ms` }} />
        )}
        <path d={d} fill="none" stroke={lit ? '#e9b83a' : '#191713'} strokeWidth={7.5} strokeLinecap="round" style={{ transition: 'stroke 0.35s' }} />
        {lit && (
          <path d={d} fill="none" stroke="#ffe9a8" strokeWidth={2.4} strokeLinecap="round" className="lit-core" style={{ animationDelay: `${delay}ms` }} />
        )}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 100 100" className="block h-full w-full" aria-label={tile.id}>
      <rect x={0} y={0} width={100} height={100} fill="#f7f3ea" />
      <g opacity={asOverlay ? 0.55 : 1}>
        <Decor art={tile.art} c1={c1} c2={c2} dual={tile.dual && !asOverlay} uid={uid} />
      </g>
      <Grain uid={uid} />
      <Vignette uid={uid} />

      {tile.links.map(([a, b], i) => renderLink(a, b, i, false))}
      {revealed && (tile.hiddenLinks ?? []).map(([a, b], i) => renderLink(a, b, i, true))}
      {!covered && (tile.coveredLinks ?? []).map(([a, b], i) => renderLink(a, b, 100 + i, false))}

      {/* 裂缝残端：负空间未显影时，从边缘伸出的半截线 */}
      {!revealed &&
        (tile.hiddenLinks ?? []).flatMap(([a, b], i) => [
          <path key={`s${i}a`} d={STUB[a]} fill="none" stroke="#191713" strokeWidth={7.5} strokeLinecap="round" opacity={0.35} />,
          <path key={`s${i}b`} d={STUB[b]} fill="none" stroke="#191713" strokeWidth={7.5} strokeLinecap="round" opacity={0.35} />,
        ])}

      {/* 端口色块（不规则接口画成三角） */}
      {tile.ports.map((p) => {
        const t = TAB[p.dir];
        const lit = litDirs.has(p.dir);
        const stroke = lit ? '#d9a41c' : '#191713';
        const sw = lit ? 2.6 : 1.2;
        const glow = lit ? { filter: 'drop-shadow(0 0 4px rgba(217,164,28,0.95))' } : undefined;
        if (tile.quirkyTab === p.dir) {
          const cx = t.x + t.w / 2;
          const cy = t.y + t.h / 2;
          const pts =
            p.dir === 'E' ? `${t.x},${t.y} ${t.x},${t.y + t.h} ${t.x + t.w + 5},${cy}`
            : p.dir === 'W' ? `${t.x + t.w},${t.y} ${t.x + t.w},${t.y + t.h} ${t.x - 5},${cy}`
            : p.dir === 'N' ? `${t.x},${t.y + t.h} ${t.x + t.w},${t.y + t.h} ${cx},${t.y - 5}`
            : `${t.x},${t.y} ${t.x + t.w},${t.y} ${cx},${t.y + t.h + 5}`;
          return <polygon key={p.dir} points={pts} fill={COLOR_HEX[p.color]} stroke={stroke} strokeWidth={sw} style={glow} />;
        }
        return (
          <g key={p.dir} style={glow}>
            <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={3}
              fill={COLOR_HEX[p.color]} stroke={stroke} strokeWidth={sw} />
            <TabMark color={p.color} cx={t.x + t.w / 2} cy={t.y + t.h / 2} />
          </g>
        );
      })}

      {/* 金色母题 */}
      {tile.gold && (
        <g transform={`translate(${GOLD_POS[tile.art % 11][0]} ${GOLD_POS[tile.art % 11][1]})`}>
          <polygon points="0,-7 5,0 0,7 -5,0" fill="#d9a41c" stroke="#191713" strokeWidth={1.2} />
          <circle r={2} fill="#191713" />
        </g>
      )}

      {tile.isFilter && (
        <rect x={4} y={4} width={92} height={92} fill="none" stroke="#191713" strokeWidth={1.6} strokeDasharray="6 5" opacity={0.65} />
      )}
    </svg>
  );
}
