import { useState } from 'react'
import { GridField } from './grid'
import type { GPanel, GRing, GWalker } from './grid'
import { useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第一章 · 夜班（2025）—— 格子墙 · 真谜题
// 墙上四个空画框，只有保安亭挂在左上角。
// 入画：窗外的楼道在发光——揭下来，它飞进角落的空框。
// 把它拖到亭子的右边（缝会亮），两幅连成一幅：
//   他起身，自己走过缝，在楼道尽头的亮窗前停下。
// 入画楼道，把尽头窗里的「对面楼」揭下来。
// 把它挪到亭子正下方——灯光灌进亭窗，
// 他走回桌前坐下，登记本显影，第一角糖纸在本子里。
// 没有顺序，没有指引光粒；只有你很久不动，圆圈才出现。
// ------------------------------------------------------------

type Ph = 'start' | 'play' | 'lit' | 'collect' | 'done'

const BOOTH: GPanel = {
  id: 'booth', img: '/story/a1.webp', slot: 0,
  ports: [{ side: 'r', at: 50, key: 'seam' }, { side: 'b', at: 55, key: 'lamp' }],
  zoomable: true,
}
const HALL = (slot: number): GPanel => ({
  id: 'hall', img: '/story/a1-hall.webp', slot,
  ports: [{ side: 'l', at: 50, key: 'seam' }], zoomable: true,
})
const BELOW = (slot: number): GPanel => ({
  id: 'below', img: '/story/a1-below.webp', slot,
  ports: [{ side: 't', at: 55, key: 'lamp' }], zoomable: true,
})

const inRect = (rx: number, ry: number, x0: number, y0: number, x1: number, y1: number) =>
  rx >= x0 && rx <= x1 && ry >= y0 && ry <= y1

export default function Ch1Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const [phase, setPhase] = useState<Ph>(
    D === 'done' ? 'done' : D === 'collect' ? 'collect' : D === 'lit' ? 'lit' : D ? 'play' : 'start')
  const [outHall, setOutHall] = useState(!!D)
  const [outBelow, setOutBelow] = useState(D === 'belowOut' || D === 'lit' || D === 'collect' || D === 'done')
  const [fused, setFused] = useState<[string, string][]>(() =>
    D === 'lit' || D === 'collect' || D === 'done'
      ? [['booth', 'hall'], ['booth', 'below']]
      : D === 'seam' || D === 'belowOut' ? [['booth', 'hall']] : [])
  const seamOn = fused.some(([a, b]) => (a === 'booth' && b === 'hall') || (a === 'hall' && b === 'booth'))
  const lampOn = fused.some(([a, b]) => (a === 'booth' && b === 'below') || (a === 'below' && b === 'booth'))
  const [walker, setWalker] = useState<GWalker | null>(
    D === 'seam' || D === 'belowOut' ? { panel: 'hall', rx: 86, ry: 78, facing: 1 } : null)
  // 格子占用：决定新揭下来的画飞进哪个空框
  const [occ, setOcc] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = { 0: 'booth' }
    if (D === 'lit' || D === 'collect' || D === 'done') return { 0: 'booth', 1: 'hall', 2: 'below' }
    if (D === 'seam') return { 0: 'booth', 1: 'hall' }
    if (D === 'belowOut') return { 0: 'booth', 1: 'hall', 3: 'below' }
    if (D === 'hallOut') return { 0: 'booth', 3: 'hall' }
    return m
  })
  const later = useTimers()
  useLoop('/story/amb-hum.mp3', 0.15)

  const firstEmpty = (prefer: number[]) =>
    prefer.find((s) => occ[s] == null) ?? [3, 2, 1].find((s) => occ[s] == null) ?? 3

  const panels: GPanel[] = [BOOTH]
  if (outHall) panels.push(HALL(D === 'seam' || D === 'belowOut' || D === 'lit' || D === 'collect' || D === 'done' ? 1 : 3))
  if (outBelow) panels.push(BELOW(D === 'lit' || D === 'collect' || D === 'done' ? 2 : firstEmpty([1, 3, 2])))

  const onSlotChange = (id: string, to: number) => {
    setOcc((o) => {
      const n = { ...o }
      Object.keys(n).forEach((k) => { if (n[+k] === id) delete n[+k] })
      n[to] = id
      return n
    })
  }

  const walkBackAndLight = (delay: number) => {
    later(() => setWalker({ panel: 'booth', rx: 56, ry: 76, facing: -1 }), delay)
    later(() => setWalker((w) => (w ? { ...w, fade: true } : w)), delay + 2000)
    later(() => setWalker(null), delay + 3000)
    later(() => setPhase('lit'), delay + 3400)
  }

  const onFuse = (a: string, b: string, key: string) => {
    setFused((f) => [...f, [a, b]])
    if (key === 'seam') {
      playOnce('/story/sfx-chime.mp3', 0.4, 0.8)
      later(() => setWalker({ panel: 'booth', rx: 56, ry: 76, facing: 1 }), 400)
      later(() => setWalker({ panel: 'hall', rx: 86, ry: 78, facing: 1 }), 1300)
      if (lampOn) walkBackAndLight(3000)
    } else if (key === 'lamp') {
      playOnce('/story/sfx-chime.mp3', 0.4, 1)
      if (seamOn) walkBackAndLight(700)
    }
  }

  // 画里揭画：从发亮的细节往外拖，它飞进空框落成新画
  const peelHall = () => {
    setOutHall(true); setPhase('play')
    playOnce('/story/sfx-chime.mp3', 0.35, 1.15)
  }
  const peelBelow = () => {
    setOutBelow(true)
    playOnce('/story/sfx-chime.mp3', 0.35, 1.3)
  }
  const onSwipe = (id: string, _dx: number, _dy: number, rx0: number, ry0: number): boolean => {
    if (id === 'booth' && !outHall && inRect(rx0, ry0, 10, 8, 50, 56)) { peelHall(); return true }
    if (id === 'hall' && outHall && !outBelow && inRect(rx0, ry0, 72, 10, 99, 64)) { peelBelow(); return true }
    return false
  }
  const onTap = (id: string, rx: number, ry: number, zoomed: boolean): boolean => {
    if (!zoomed) return false
    if (id === 'booth' && !outHall && inRect(rx, ry, 10, 8, 50, 56)) { peelHall(); return true }
    if (id === 'hall' && outHall && !outBelow && inRect(rx, ry, 72, 10, 99, 64)) { peelBelow(); return true }
    if (id === 'booth' && phase === 'lit' && inRect(rx, ry, 20, 58, 50, 82)) { setPhase('collect'); return false }
    if (id === 'booth' && phase === 'collect' && inRect(rx, ry, 22, 60, 48, 84)) {
      setPhase('done')
      later(onDone, 2800)
    }
    return false
  }

  // 只有第一动立刻给圆圈；其余提示静置 12 秒才出现
  const ringsNow: GRing[] = phase === 'start' ? [{ panel: 'booth', rx: 30, ry: 32 }] : []
  const rings: GRing[] =
    !outBelow && outHall ? [{ panel: 'hall', rx: 86, ry: 34 }]
    : outHall && !seamOn ? [{ panel: 'hall', rx: 6, ry: 50 }]
    : outBelow && !lampOn ? [{ panel: 'below', rx: 55, ry: 8 }]
    : phase === 'lit' ? [{ panel: 'booth', rx: 32, ry: 66 }]
    : []

  const boothDark = lampOn ? 0 : 0.55
  const chairEmpty = seamOn && phase === 'play'

  const overlay = (id: string, _zoomed: boolean) => {
    if (id === 'booth') {
      return (
        <>
          {boothDark > 0 && (
            <div style={{ position: 'absolute', inset: 0, background: `rgba(2,4,8,${boothDark})`,
              transition: 'background 2.4s ease', pointerEvents: 'none' }} />
          )}
          {chairEmpty && (
            <div style={{ position: 'absolute', left: '44%', top: '18%', width: '30%', height: '74%',
              background: 'radial-gradient(ellipse, rgba(6,9,14,0.88) 30%, rgba(6,9,14,0) 75%)',
              pointerEvents: 'none' }} />
          )}
          {phase === 'start' && (
            <div className="goro-hotspot" style={{ left: '10%', top: '8%', width: '40%', height: '48%' }} />
          )}
          {(phase === 'lit' || phase === 'collect' || phase === 'done') && <PaperBit x={22} y={62} />}
        </>
      )
    }
    if (id === 'hall' && outHall && !outBelow) {
      return <div className="goro-hotspot" style={{ left: '72%', top: '10%', width: '27%', height: '54%' }} />
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
        onSwipe={onSwipe}
        renderOverlay={overlay}
        walker={walker}
        rings={rings}
        ringsNow={ringsNow}
        bg="/story/a1.webp"
        intro={{ img: '/story/a1.webp' }}
      />
      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
          <CollectCard label="糖 纸 · 壹 / 伍" />
        </div>
      )}
      <div className="act4-bar top" /><div className="act4-bar bottom" />
    </>
  )
}
