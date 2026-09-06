import { useState } from 'react'
import { PanelField } from './goro'
import type { GPanel, GWalker } from './goro'
import { LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第三章 · 下岗（1998）
// 三层画叠在同一处：1998 名单 → 1988 通报 → 1978 红榜。
// 卷角在呼吸——拖开（或点一下卷角），就回到十年前。
// 揭下来的旧年份不会消失：它落成桌上一幅小小的记忆，
// 微微发暗，还可以再入画翻看。
// 揭到底，他的名字在红榜第一行发光。他从红榜里走出来，
// 自己走到厂门前。点锁，锁落，画面灰掉；
// 门房窗台上的工作证翻开，里面是第三角糖纸。
// ------------------------------------------------------------

type Ch3Phase = 'peel' | 'gate' | 'unlocked' | 'card' | 'flip' | 'collect' | 'done'

const HOME = { x: 24, y: 5 }
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
      {/* 卷角：像在邀请人揭开这一层 */}
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
  const [peeled, setPeeled] = useState(D === 'gate' || D === 'unlocked' || D === 'flip' || D === 'collect' || D === 'done' ? 2 : D === 'peel1' ? 1 : 0)
  const [phase, setPhase] = useState<Ch3Phase>(
    D === 'unlocked' ? 'unlocked' : D === 'flip' ? 'flip' : D === 'collect' || D === 'done' ? 'collect'
    : D === 'gate' ? 'gate' : 'peel')
  const [walker, setWalker] = useState<GWalker | null>(
    D === 'gate' ? { panel: 'gate', rx: 50, ry: 80, facing: 1 } : null)
  const later = useTimers()
  useLoop('/story/amb-wind.mp3', 0.22)

  const panels: GPanel[] = [
    { id: 'y1978', img: '/story/a3-1978.webp', x: HOME.x, y: HOME.y, w: 50, zoomable: true },
    { id: 'y1988', img: '/act4/workshop.webp', x: HOME.x, y: HOME.y, w: 50, zoomable: true,
      hide: peeled >= 2 },
    { id: 'y1998', img: '/story/a3.webp', x: HOME.x, y: HOME.y, w: 50, zoomable: true,
      hide: peeled >= 1 },
    // 揭下来的旧年份：落成桌上的小小记忆画，发暗，可再入画翻看
    ...(peeled >= 1
      ? [{ id: 'm1998', img: '/story/a3.webp', x: 74, y: 25, w: 22, zoomable: true } as GPanel]
      : []),
    ...(peeled >= 2
      ? [{ id: 'm1988', img: '/act4/workshop.webp', x: 74, y: 2, w: 22, zoomable: true } as GPanel]
      : []),
    { id: 'gate', img: '/story/a3-gate.webp', x: 70, y: 50, w: 28, zoomable: true },
  ]

  const peelLayer = () => {
    if (peeled === 0) {
      setPeeled(1); playOnce('/story/sfx-peel.mp3', 0.7)
    } else if (peeled === 1) {
      setPeeled(2); playOnce('/story/sfx-peel.mp3', 0.7)
      // 他的名字亮了；他从红榜里走出来，自己走到厂门前
      later(() => setWalker({ panel: 'y1978', rx: 50, ry: 80, facing: 1 }), 1400)
      later(() => setWalker({ panel: 'gate', rx: 50, ry: 80, facing: 1 }), 2400)
      later(() => setPhase('gate'), 3400)
    }
  }

  const onDrop = (id: string, x: number, y: number) => {
    const far = Math.hypot(x - HOME.x, y - HOME.y) > 18
    if ((id === 'y1998' && peeled === 0 && far) || (id === 'y1988' && peeled === 1 && far)) {
      peelLayer()
    }
  }

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean) => {
    if (!zoomed) return
    // 点一下卷角 = 揭开这一层
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

  // 光停在哪，下一步就在哪
  const lightAt =
    phase === 'peel'
      ? (peeled === 0 ? { panel: 'y1998', rx: 68, ry: 82 } : peeled === 1 ? { panel: 'y1988', rx: 68, ry: 82 } : { panel: 'y1978', rx: 50, ry: 28 })
    : phase === 'gate' ? { panel: 'gate', rx: 50, ry: 62 }
    : phase === 'card' || phase === 'flip' ? { panel: 'gate', rx: 71, ry: 76 }
    : { panel: 'gate', rx: 73, ry: 84 }

  // 圆圈提示：现在该点哪里
  const rings: { panel: string; rx: number; ry: number }[] =
    phase === 'peel'
      ? (peeled === 0 ? [{ panel: 'y1998', rx: 68, ry: 80 }] : peeled === 1 ? [{ panel: 'y1988', rx: 68, ry: 80 }] : [])
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
          {phase === 'gate' && (
            <div style={{ position: 'absolute', left: '47%', top: '56%', width: 30, height: 38, zIndex: 5,
              borderRadius: '5px 5px 7px 7px',
              background: 'linear-gradient(160deg, #c8a44e, #7a5e22)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.75), 0 0 18px rgba(255,210,120,0.4)',
              animation: 'port-breathe 2.6s ease-in-out infinite', pointerEvents: 'none' }} />
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

  const idleGlow = phase === 'peel'
    ? [peeled === 0 ? 'y1998' : 'y1988']
    : ['gate']

  return (
    <>
      <PanelField
        panels={panels}
        fused={[]}
        onFuse={() => {}}
        onDrop={onDrop}
        onTap={onTap}
        renderOverlay={overlay}
        idleGlowIds={idleGlow}
        walker={walker}
        rings={rings}
        bg="/story/a3.webp"
        intro={{ img: '/story/a3.webp' }}
        lightAt={lightAt}
        lightColor={LIGHTS[3].core}
        lightGlow={LIGHTS[3].glow}
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
