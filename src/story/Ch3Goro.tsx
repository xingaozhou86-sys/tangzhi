import { useState } from 'react'
import { GridField } from './grid'
import type { GPanel, GRing, GWalker } from './grid'
import { useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第三章 · 下岗（1998）—— 格子墙 · 揭年时间
// 墙上：左上角一叠年画（1998 名单压在最上面），
// 右上角从一开始就挂着厂门——锁着，安静地等你。
// 把最上面那层拖去空框（或入画点卷角），它就落成一幅
// 小小的记忆画：1998 拖开是 1988，1988 拖开是 1978。
// 揭到底，红榜第一行他的名字发光，红榜右边的缝亮了——
// 把厂门挪到红榜旁边（或直接对上），他自己走出红榜，
// 走到厂门前。入画点锁，锁落，画面灰掉；
// 门房窗台上的工作证翻开，里面是第三角糖纸。
// ------------------------------------------------------------

type Ch3Phase = 'peel' | 'gate' | 'unlocked' | 'card' | 'flip' | 'collect' | 'done'

const NAMES_1998 = ['王德福', '赵铁柱', '孙爱华', '周明礼', '吴桂兰', '顾长明', '郑长顺', '马秀珍', '刘广田', '陈淑云', '郭守义', '高凤英']

function Poster({ year, zoomed, glowName, curl }: { year: 1998 | 1988 | 1978; zoomed: boolean; glowName?: boolean; curl?: boolean }) {
  const fs = zoomed ? 1 : 0.55
  return (
    <div style={{
      position: 'absolute', left: '26%', top: '12%', width: '48%', height: '76%',
      background: year === 1978 ? '#c8b190' : year === 1988 ? '#ddd2b8' : '#e6ddc8',
      padding: '3% 4%', overflow: 'hidden', pointerEvents: 'none',
      boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
    }}>
      {curl && (
        <div style={{
          position: 'absolute', right: 0, bottom: 0, width: '16%', height: '14%',
          background: 'linear-gradient(315deg, #f4ecd8 0 46%, rgba(60,48,30,0.55) 50%, transparent 56%)',
          filter: 'drop-shadow(-3px -3px 5px rgba(0,0,0,0.4))',
          animation: 'port-breathe 2.2s ease-in-out infinite',
        }} />
      )}
      <div style={{ textAlign: 'center', fontSize: 15 * fs, letterSpacing: '0.35em', fontWeight: 700,
        color: year === 1978 ? '#7a1e10' : '#2e2820',
        borderBottom: `2px solid ${year === 1978 ? '#7a1e10' : '#2e2820'}`,
        paddingBottom: 5, marginBottom: 8 }}>
        {year === 1998 ? '优化组合人员名单' : year === 1988 ? '事 故 通 报' : '招 工 光 荣 榜'}
      </div>
      {year === 1998 && (
        <div style={{ columnCount: 3, columnGap: 10, fontSize: 11 * fs, lineHeight: 1.9, color: '#3a3226' }}>
          {NAMES_1998.map((n) => <div key={n}>{n}</div>)}
        </div>
      )}
      {year === 1988 && (
        <div style={{ fontSize: 10.5 * fs, lineHeight: 2, color: '#4a4030' }}>
          <p style={{ margin: 0, opacity: 0.65 }}>……冲压车间设备伤害事故一起……</p>
          <p style={{ margin: 0, opacity: 0.65 }}>……系当事人违反操作规程所致……</p>
          <p style={{ margin: '10px 0 0', textAlign: 'right', fontFamily: 'cursive',
            fontSize: 13.5 * fs, opacity: 0.85 }}>
            情况属实 —— 顾长明
          </p>
        </div>
      )}
      {year === 1978 && (
        <div style={{ fontSize: 11 * fs, lineHeight: 2.1, color: '#5a2418' }}>
          <div style={{
            fontSize: 16 * fs, fontWeight: 700,
            color: glowName ? '#a32312' : '#5a2418',
            textShadow: glowName ? '0 0 14px rgba(255,120,60,0.8)' : 'none',
            transition: 'all 1.6s ease',
          }}>顾长明</div>
          <div style={{ opacity: 0.7 }}>赵铁柱　孙爱华　周明礼</div>
          <div style={{ opacity: 0.7 }}>吴桂兰　郑长顺　马秀珍</div>
        </div>
      )}
    </div>
  )
}

export default function Ch3Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const solved = D === 'gate' || D === 'unlocked' || D === 'flip' || D === 'collect' || D === 'done'
  const [peeled, setPeeled] = useState(D === 'peel1' ? 1 : solved ? 2 : 0)
  const [phase, setPhase] = useState<Ch3Phase>(
    D === 'unlocked' ? 'unlocked' : D === 'flip' ? 'flip' : D === 'collect' || D === 'done' ? 'collect'
    : D === 'gate' ? 'gate' : 'peel')
  const [fused, setFused] = useState<[string, string][]>(solved ? [['y1978', 'gate']] : [])
  const [walker, setWalker] = useState<GWalker | null>(
    D === 'gate' ? { panel: 'gate', rx: 50, ry: 80, facing: 1 } : null)
  const later = useTimers()
  useLoop('/story/amb-wind.mp3', 0.22)

  const walkOn = fused.length > 0

  const panels: GPanel[] = [
    // 年画叠在最底层的 1978：揭到底才露出右边的缝
    { id: 'y1978', img: '/story/a3-1978.webp', slot: 0, zoomable: true, locked: true,
      ports: peeled >= 2 ? [{ side: 'r', at: 55, key: 'walk' }] : [] },
    { id: 'y1988', img: '/act4/workshop.webp', slot: 0, zoomable: true,
      hide: peeled >= 2, locked: peeled < 1 },
    { id: 'y1998', img: '/story/a3.webp', slot: 0, zoomable: true,
      hide: peeled >= 1 },
    // 揭下来的旧年份：落成空框里的记忆小画，发暗，可再入画
    ...(peeled >= 1
      ? [{ id: 'm1998', img: '/story/a3.webp', slot: 2, zoomable: true } as GPanel] : []),
    ...(peeled >= 2
      ? [{ id: 'm1988', img: '/act4/workshop.webp', slot: 3, zoomable: true } as GPanel] : []),
    // 厂门从一开始就挂在右上角，锁着
    { id: 'gate', img: '/story/a3-gate.webp', slot: 1, zoomable: true,
      ports: [{ side: 'l', at: 55, key: 'walk' }] },
  ]

  const peelLayer = () => {
    if (peeled === 0) {
      setPeeled(1); playOnce('/story/sfx-peel.mp3', 0.7)
    } else if (peeled === 1) {
      setPeeled(2); playOnce('/story/sfx-peel.mp3', 0.7)
    }
  }

  // 把最上面那层拖去别的框 = 揭开这一年
  const onSlotChange = (id: string, _to: number) => {
    if (id === 'y1998' && peeled === 0) peelLayer()
    if (id === 'y1988' && peeled === 1) peelLayer()
  }

  // 红榜与厂门对上：他走出红榜，自己走到厂门前
  const onFuse = (a: string, b: string, key: string) => {
    if (key !== 'walk') return
    setFused((f) => [...f, [a, b]])
    playOnce('/story/sfx-chime.mp3', 0.5, 0.9)
    later(() => setWalker({ panel: 'y1978', rx: 50, ry: 80, facing: 1 }), 600)
    later(() => setWalker({ panel: 'gate', rx: 50, ry: 80, facing: 1 }), 1800)
    later(() => setPhase('gate'), 3000)
  }

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean) => {
    if (!zoomed) return
    // 点卷角 = 揭开这一层
    if (id === 'y1998' && peeled === 0 && rx > 58 && ry > 70) { peelLayer(); return }
    if (id === 'y1988' && peeled === 1 && rx > 58 && ry > 70) { peelLayer(); return }
    if (id === 'gate' && phase === 'gate' && rx > 42 && rx < 60 && ry > 52 && ry < 74) {
      setPhase('unlocked')
      playOnce('/act4/thud.mp3', 0.35, 1.9)
      setWalker((w) => (w ? { ...w, fade: true } : w))
      later(() => setWalker(null), 1400)
      later(() => setPhase('card'), 1800)
      return
    }
    if (id === 'gate' && phase === 'card' && rx > 60 && rx < 82 && ry > 62 && ry < 92) {
      setPhase('flip')
      later(() => setPhase('collect'), 1100)
      return
    }
    if (id === 'gate' && phase === 'collect' && rx > 60 && rx < 86 && ry > 62 && ry < 96) {
      setPhase('done')
      later(onDone, 2600)
    }
  }

  // 第一动立刻给圆圈；其余静置后才出现
  const ringsNow: GRing[] =
    phase === 'peel' && peeled === 0 ? [{ panel: 'y1998', rx: 68, ry: 80 }] : []
  const rings: GRing[] =
    phase === 'peel'
      ? (peeled === 1 ? [{ panel: 'y1988', rx: 68, ry: 80 }] : peeled >= 2 && !walkOn ? [{ panel: 'gate', rx: 6, ry: 55 }] : [])
    : phase === 'gate' ? [{ panel: 'gate', rx: 51, ry: 63 }]
    : phase === 'card' ? [{ panel: 'gate', rx: 71, ry: 76 }]
    : []

  const overlay = (id: string, zoomed: boolean) => {
    if (id === 'y1998') return <Poster year={1998} zoomed={zoomed} curl={phase === 'peel' && peeled === 0} />
    if (id === 'y1988') return <Poster year={1988} zoomed={zoomed} curl={phase === 'peel' && peeled === 1} />
    if (id === 'y1978') return <Poster year={1978} zoomed={zoomed} glowName={peeled >= 2} />
    if (id === 'm1998' || id === 'm1988') {
      return (
        <>
          <Poster year={id === 'm1998' ? 1998 : 1988} zoomed={zoomed} />
          {!zoomed && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,8,14,0.38)',
              pointerEvents: 'none' }} />
          )}
        </>
      )
    }
    if (id === 'gate' && zoomed) {
      return (
        <>
          {phase !== 'unlocked' && phase !== 'card' && phase !== 'flip' && phase !== 'collect' && phase !== 'done' && (
            <div style={{ position: 'absolute', left: '47%', top: '56%', width: 30, height: 38, zIndex: 5,
              borderRadius: '5px 5px 7px 7px',
              background: 'linear-gradient(160deg, #c8a44e, #7a5e22)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.75), 0 0 18px rgba(255,210,120,0.4)',
              animation: phase === 'gate' ? 'port-breathe 2.6s ease-in-out infinite' : undefined,
              opacity: phase === 'gate' ? 1 : 0.45,
              pointerEvents: 'none' }} />
          )}
          {(phase === 'unlocked' || phase === 'card' || phase === 'flip' || phase === 'collect' || phase === 'done') && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(120,126,132,0.35)',
              mixBlendMode: 'saturation', pointerEvents: 'none', animation: 'propIn 1.8s ease' }} />
          )}
          {(phase === 'card' || phase === 'flip' || phase === 'collect' || phase === 'done') && (
            <div style={{
              position: 'absolute', left: '64%', top: '68%', width: '14%', aspectRatio: '3/4', zIndex: 6,
              transform: `rotateY(${phase === 'card' ? 0 : 180}deg)`, transformStyle: 'preserve-3d',
              transition: 'transform 1.1s ease', pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                background: 'linear-gradient(160deg,#2d4470,#1c2c4c)', borderRadius: 5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 18px rgba(0,0,0,0.6)' }}>
                <div style={{ color: '#d8c98e', fontSize: 12, letterSpacing: '0.4em', writingMode: 'vertical-rl' }}>工作证</div>
              </div>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)', background: '#e9e0c8', borderRadius: 5, padding: '8%',
                boxShadow: '0 8px 18px rgba(0,0,0,0.6)' }}>
                <div style={{ width: '44%', aspectRatio: '3/4', background: '#b9ad92', border: '1px solid #8a7f66' }} />
                <div style={{ fontSize: 11, color: '#3a3226', letterSpacing: '0.2em', marginTop: 4 }}>顾长明</div>
              </div>
            </div>
          )}
          {(phase === 'collect' || phase === 'done') && <PaperBit x={70} y={82} />}
        </>
      )
    }
    return null
  }

  return (
    <>
      <GridField
        panels={panels}
        fused={fused}
        onFuse={onFuse}
        onSlotChange={onSlotChange}
        onTap={onTap}
        renderOverlay={overlay}
        walker={walker}
        rings={rings}
        ringsNow={ringsNow}
        bg="/story/a3.webp"
        intro={{ img: '/story/a3.webp' }}
      />
      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
          <CollectCard label="糖 纸 · 叁 / 伍" />
        </div>
      )}
      <div className="act4-bar top" /><div className="act4-bar bottom" />
    </>
  )
}
