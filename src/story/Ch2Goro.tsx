import { useState } from 'react'
import { GridField, SLOTS_23 } from './grid'
import type { GPanel, GRing, GWalker } from './grid'
import { useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第二章 · 空城（2020）—— 2列×3行格子墙 · 纵向三连
// 他的房间挂在墙中央。入画一次，就能看到两处呼吸的细节：
// 对面楼那扇「她的窗」、他身下那片「楼下的街」——先揭哪幅都行。
// 它们落进右边的空框。怎么挂由你：
//   窗 → 房间正上方：光流进来，他起身
//   街 → 房间正下方：他走下楼，站到空街上
// 街入画后，街尽头面馆的灯可以揭。面馆挂到街尾——
// 路真的通了，卷帘门才卷起，他走进去。
// 面碗下面，压着第二角糖纸。
// ------------------------------------------------------------

type Ph = 'start' | 'play' | 'open' | 'collect' | 'done'

const ROOM: GPanel = {
  id: 'room', img: '/story/a2-room.webp', slot: 2,
  ports: [{ side: 't', at: 50, key: 'beam' }, { side: 'b', at: 50, key: 'spill' }],
  zoomable: true,
}
const FACADE = (slot: number): GPanel => ({
  id: 'facade', img: '/story/a2-windows.webp', slot,
  ports: [{ side: 'b', at: 50, key: 'beam' }], zoomable: true,
})
const STREET = (slot: number): GPanel => ({
  id: 'street', img: '/story/a2-street.webp', slot,
  ports: [{ side: 't', at: 50, key: 'spill' }, { side: 'r', at: 55, key: 'rest' }], zoomable: true,
})
const REST = (slot: number): GPanel => ({
  id: 'rest', img: '/story/a2-restaurant.webp', slot,
  ports: [{ side: 'l', at: 55, key: 'rest' }], zoomable: true,
})

const inRect = (rx: number, ry: number, x0: number, y0: number, x1: number, y1: number) =>
  rx >= x0 && rx <= x1 && ry >= y0 && ry <= y1

export default function Ch2Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const [phase, setPhase] = useState<Ph>(
    D === 'done' ? 'done' : D === 'collect' ? 'collect' : D === 'open' ? 'open' : D ? 'play' : 'start')
  const [outFacade, setOutFacade] = useState(!!D)
  const [outStreet, setOutStreet] = useState(D === 'streetOut' || D === 'door' || D === 'open' || D === 'collect' || D === 'done')
  const [outRest, setOutRest] = useState(D === 'door' || D === 'open' || D === 'collect' || D === 'done')
  const [fused, setFused] = useState<[string, string][]>(() =>
    D === 'open' || D === 'collect' || D === 'done'
      ? [['facade', 'room'], ['room', 'street'], ['street', 'rest']]
      : D === 'door' ? [['facade', 'room'], ['room', 'street']]
      : D === 'beam' || D === 'streetOut' ? [['facade', 'room']] : [])
  const beamOn = fused.some(([a, b]) => (a === 'facade' && b === 'room') || (a === 'room' && b === 'facade'))
  const spillOn = fused.some(([a, b]) => (a === 'room' && b === 'street') || (a === 'street' && b === 'room'))
  const restOn = fused.some(([a, b]) => (a === 'street' && b === 'rest') || (a === 'rest' && b === 'street'))
  const [walker, setWalker] = useState<GWalker | null>(
    D === 'door' ? { panel: 'street', rx: 46, ry: 80, facing: 1 }
      : D === 'beam' || D === 'streetOut' ? { panel: 'room', rx: 50, ry: 82, facing: 1 }
      : null)
  const later = useTimers()
  useLoop('/story/amb-city.mp3', 0.2)

  const dbgSolved = D === 'open' || D === 'collect' || D === 'done' || D === 'door'
  const dbgBeam = dbgSolved || D === 'beam' || D === 'streetOut'
  const panels: GPanel[] = [ROOM]
  if (outFacade) panels.push(FACADE(dbgBeam ? 0 : 1))
  if (outStreet) panels.push(STREET(dbgSolved ? 4 : 3))
  if (outRest) panels.push(REST(5))

  // 路通了：卷帘门卷起，他走进去坐下
  const walkIn = (delay: number) => {
    later(() => setWalker({ panel: 'rest', rx: 48, ry: 72, facing: 1 }), delay)
    later(() => setWalker((w) => (w ? { ...w, fade: true } : w)), delay + 1600)
    later(() => setWalker(null), delay + 2600)
    later(() => setPhase('open'), delay + 3000)
  }

  const onFuse = (a: string, b: string, key: string) => {
    setFused((f) => [...f, [a, b]])
    if (key === 'beam') {
      playOnce('/story/sfx-chime.mp3', 0.65)
      later(() => setWalker({ panel: 'room', rx: 50, ry: 82, facing: 1 }), 600)
      if (spillOn) {
        later(() => setWalker({ panel: 'street', rx: 46, ry: 80, facing: 1 }), 2400)
        if (restOn) walkIn(4000)
      }
    } else if (key === 'spill') {
      playOnce('/story/sfx-chime.mp3', 0.5, 0.85)
      later(() => setWalker({ panel: 'street', rx: 46, ry: 80, facing: 1 }), 800)
      if (restOn) walkIn(2400)
    } else if (key === 'rest') {
      playOnce('/story/sfx-chime.mp3', 0.45, 1.1)
      if (spillOn) walkIn(500)
    }
  }

  // 画里揭画
  const peelFacade = () => { setOutFacade(true); setPhase('play'); playOnce('/story/sfx-chime.mp3', 0.35, 1.15) }
  const peelStreet = () => { setOutStreet(true); setPhase('play'); playOnce('/story/sfx-chime.mp3', 0.35, 1.3) }
  const peelRest = () => { setOutRest(true); playOnce('/story/sfx-chime.mp3', 0.35, 1.1) }
  const onSwipe = (id: string, dx: number, _dy: number, rx0: number, ry0: number): boolean => {
    if (id === 'room' && !outFacade && inRect(rx0, ry0, 44, 20, 68, 48)) { peelFacade(); return true }
    if (id === 'room' && !outStreet && inRect(rx0, ry0, 25, 52, 75, 92)) { peelStreet(); return true }
    if (id === 'street' && outStreet && !outRest && dx > 6 && inRect(rx0, ry0, 58, 36, 92, 82)) { peelRest(); return true }
    return false
  }
  const onTap = (id: string, rx: number, ry: number, zoomed: boolean): boolean => {
    if (!zoomed) return false
    if (id === 'room' && !outFacade && inRect(rx, ry, 44, 20, 68, 48)) { peelFacade(); return true }
    if (id === 'room' && !outStreet && inRect(rx, ry, 25, 52, 75, 92)) { peelStreet(); return true }
    if (id === 'street' && outStreet && !outRest && inRect(rx, ry, 58, 36, 92, 82)) { peelRest(); return true }
    if (id === 'rest' && phase === 'open' && inRect(rx, ry, 34, 46, 60, 72)) { setPhase('collect'); return false }
    if (id === 'rest' && phase === 'collect' && inRect(rx, ry, 36, 54, 62, 84)) {
      setPhase('done')
      later(onDone, 2800)
    }
    return false
  }

  // 只有第一动立刻给圆圈；其余提示静置 12 秒才出现
  const ringsNow: GRing[] = phase === 'start' ? [{ panel: 'room', rx: 56, ry: 32 }] : []
  const rings: GRing[] =
    !outStreet && phase !== 'start' ? [{ panel: 'room', rx: 50, ry: 74 }]
    : !outRest && outStreet ? [{ panel: 'street', rx: 76, ry: 58 }]
    : phase === 'open' ? [{ panel: 'rest', rx: 46, ry: 54 }]
    : []

  const chairEmpty = beamOn
  const openOn = phase === 'open' || phase === 'collect' || phase === 'done'

  const overlay = (id: string, zoomed: boolean) => {
    if (id === 'room') {
      return (
        <>
          {chairEmpty && (
            <div style={{ position: 'absolute', left: '26%', top: '48%', width: '48%', height: '50%',
              background: 'radial-gradient(ellipse, rgba(4,6,10,0.85) 25%, rgba(4,6,10,0) 72%)',
              pointerEvents: 'none' }} />
          )}
          {!outFacade && (
            <div className="goro-hotspot" style={{ left: '44%', top: '20%', width: '24%', height: '28%' }} />
          )}
          {!outStreet && (
            <div className="goro-hotspot" style={{ left: '25%', top: '52%', width: '50%', height: '42%' }} />
          )}
          {beamOn && (
            <div style={{ position: 'absolute', left: '24%', top: '6%', width: '52%', height: '52%',
              pointerEvents: 'none', animation: 'propIn 1.4s ease', mixBlendMode: 'screen',
              background: 'radial-gradient(ellipse, rgba(255,216,140,0.85), rgba(255,190,100,0.25) 60%, rgba(255,190,100,0) 78%)' }} />
          )}
        </>
      )
    }
    if (id === 'street') {
      return (
        <>
          {!outRest && (
            <div className="goro-hotspot" style={{ left: '58%', top: '36%', width: '34%', height: '46%' }} />
          )}
          {spillOn && (
            <div style={{ position: 'absolute', left: '58%', top: '40%', width: '26%', height: '40%',
              pointerEvents: 'none', animation: 'propIn 2s ease',
              background: 'radial-gradient(ellipse, rgba(255,210,130,0.5), rgba(255,210,130,0) 72%)' }} />
          )}
        </>
      )
    }
    if (id === 'rest' && zoomed) {
      return (
        <>
          {!openOn && (
            <div style={{ position: 'absolute', left: '24%', top: 0, width: '52%', height: '58%',
              background: 'repeating-linear-gradient(180deg, #4a4d52 0 8px, #33363b 8px 12px)',
              borderBottom: '4px solid #22242a', pointerEvents: 'none' }} />
          )}
          {openOn && (
            <div style={{ position: 'absolute', left: '40%', top: '52%', width: '10%', aspectRatio: '2/1',
              borderRadius: '0 0 50% 50% / 0 0 100% 100%',
              background: 'linear-gradient(180deg, #e9e2d2, #b8ad96)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.5)', pointerEvents: 'none' }} />
          )}
          {(phase === 'collect' || phase === 'done') && <PaperBit x={42} y={60} />}
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
        onTap={onTap}
        onSwipe={onSwipe}
        renderOverlay={overlay}
        walker={walker}
        rings={rings}
        ringsNow={ringsNow}
        slots={SLOTS_23}
        bg="/story/a2-street.webp"
        intro={{ img: '/story/a2-windows.webp' }}
      />
      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
          <CollectCard label="糖 纸 · 贰 / 伍" />
        </div>
      )}
      <div className="act4-bar top" /><div className="act4-bar bottom" />
    </>
  )
}
