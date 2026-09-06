import { useState } from 'react'
import { PanelField } from './goro'
import type { GPanel, GWalker } from './goro'
import { LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第二章 · 空城（2020）—— 画中世界式
// 开场只有一幅画：他的房间。他坐在窗前，对面楼只剩一扇亮窗。
// 入画，把那扇「她的窗」从夜色里揭下来——它落成一幅新画。
// 把她的窗挂到他的房间正上方（磁吸）：光流进房间，他起身。
// 入画房间，从他坐着的地方往下拖——「楼下的街」被揭下来。
// 把街接到房间正下方：他走下楼，自己走到空街上。
// 街尽头面馆的卷帘门画出现了——把它接到街尾，门自己卷起，
// 他走进去。那碗还温着的面下面，压着第二角糖纸。
// ------------------------------------------------------------

type Ph = 'start' | 'facadeOut' | 'beam' | 'streetOut' | 'door' | 'open' | 'collect' | 'done'
const ORDER: Ph[] = ['start', 'facadeOut', 'beam', 'streetOut', 'door', 'open', 'collect', 'done']

const ROOM: GPanel = {
  id: 'room', img: '/story/a2-room.webp', x: 22, y: 12, w: 56,
  ports: [{ side: 't', at: 50, key: 'beam' }, { side: 'b', at: 50, key: 'spill' }],
  zoomable: true,
}
const FACADE: GPanel = {
  id: 'facade', img: '/story/a2-windows.webp', x: 60, y: 54, w: 30,
  ports: [{ side: 'b', at: 50, key: 'beam' }], zoomable: true,
}
const STREET: GPanel = {
  id: 'street', img: '/story/a2-street.webp', x: 62, y: 16, w: 30,
  ports: [{ side: 't', at: 50, key: 'spill' }, { side: 'r', at: 55, key: 'rest' }],
  zoomable: true,
}
const REST: GPanel = {
  id: 'rest', img: '/story/a2-restaurant.webp', x: 62, y: 55, w: 32,
  ports: [{ side: 'l', at: 55, key: 'rest' }], zoomable: true,
}

const inRect = (rx: number, ry: number, x0: number, y0: number, x1: number, y1: number) =>
  rx >= x0 && rx <= x1 && ry >= y0 && ry <= y1

export default function Ch2Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const initPhase: Ph =
    D === 'done' ? 'done' : D === 'collect' ? 'collect' : D === 'open' ? 'open'
    : D === 'door' ? 'door' : D === 'streetOut' ? 'streetOut'
    : D === 'beam' ? 'beam' : D === 'facadeOut' ? 'facadeOut' : 'start'
  const [phase, setPhase] = useState<Ph>(initPhase)
  const atLeast = (x: Ph) => ORDER.indexOf(phase) >= ORDER.indexOf(x)

  const [fused, setFused] = useState<[string, string][]>(
    atLeast('open') ? [['facade', 'room'], ['room', 'street'], ['street', 'rest']]
      : atLeast('door') ? [['facade', 'room'], ['room', 'street']]
      : atLeast('beam') ? [['facade', 'room']] : [])
  const [walker, setWalker] = useState<GWalker | null>(
    phase === 'door' ? { panel: 'street', rx: 46, ry: 80, facing: 1 }
      : phase === 'beam' || phase === 'streetOut' ? { panel: 'room', rx: 50, ry: 82, facing: 1 }
      : null)
  const later = useTimers()
  useLoop('/story/amb-city.mp3', 0.2)

  const panels: GPanel[] = [ROOM]
  if (atLeast('facadeOut')) panels.push(FACADE)
  if (atLeast('streetOut')) panels.push(STREET)
  if (atLeast('door')) panels.push(REST)
  // 画多了，开场的画就收小一点；调试跳段时直接摆出连通后的位置
  const beamOn = atLeast('beam')
  const spillOn = atLeast('door')
  const restOn = atLeast('open')
  panels[0] = { ...ROOM, w: atLeast('facadeOut') ? 34 : 56, ...(beamOn ? { x: 25, y: 31.4 } : {}) }
  if (atLeast('facadeOut')) panels[1] = { ...FACADE, w: 30, ...(beamOn ? { x: 27, y: 3 } : {}) }
  if (atLeast('streetOut')) panels[2] = { ...STREET, w: 30, ...(spillOn ? { x: 27, y: 63.6 } : {}) }
  if (atLeast('door')) panels[3] = { ...REST, w: 32, ...(restOn ? { x: 57, y: 62.5 } : {}) }

  const onFuse = (a: string, b: string, key: string) => {
    setFused((f) => [...f, [a, b]])
    if (key === 'beam') {
      playOnce('/story/sfx-chime.mp3', 0.65)
      setPhase('beam')
      // 光流进房间，他从窗前起身
      later(() => setWalker({ panel: 'room', rx: 50, ry: 82, facing: 1 }), 600)
    } else if (key === 'spill') {
      playOnce('/story/sfx-chime.mp3', 0.5, 0.85)
      setPhase('door')
      // 他走下楼，自己走到空街上；街尾面馆的灯亮了
      later(() => setWalker({ panel: 'street', rx: 46, ry: 80, facing: 1 }), 800)
    } else if (key === 'rest') {
      playOnce('/story/sfx-chime.mp3', 0.45, 1.1)
      setPhase('open')
      // 卷帘门自己卷起，他走进去，坐下
      later(() => setWalker({ panel: 'rest', rx: 48, ry: 72, facing: 1 }), 500)
      later(() => setWalker((w) => (w ? { ...w, fade: true } : w)), 2100)
      later(() => setWalker(null), 3100)
    }
  }

  // 画里揭画
  const onSwipe = (id: string, _dx: number, dy: number, rx0: number, ry0: number): boolean => {
    if (id === 'room' && phase === 'start' && inRect(rx0, ry0, 44, 20, 68, 48)) {
      setPhase('facadeOut')                     // 从对面楼的夜色里揭下「她的窗」
      playOnce('/story/sfx-chime.mp3', 0.35, 1.15)
      return true
    }
    if (id === 'room' && phase === 'beam' && dy > 6 && inRect(rx0, ry0, 25, 52, 75, 92)) {
      setPhase('streetOut')                     // 从他坐着的地方往下，揭下「楼下的街」
      playOnce('/story/sfx-chime.mp3', 0.35, 1.3)
      return true
    }
    return false
  }

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean): boolean => {
    if (!zoomed) return false
    // 点一下发亮的细节 = 把它揭下来
    if (id === 'room' && phase === 'start' && inRect(rx, ry, 44, 20, 68, 48)) {
      setPhase('facadeOut')
      playOnce('/story/sfx-chime.mp3', 0.35, 1.15)
      return true
    }
    if (id === 'room' && phase === 'beam' && inRect(rx, ry, 25, 52, 75, 92)) {
      setPhase('streetOut')
      playOnce('/story/sfx-chime.mp3', 0.35, 1.3)
      return true
    }
    if (id === 'rest' && phase === 'open' && inRect(rx, ry, 34, 46, 60, 72)) {
      setPhase('collect')                       // 掀开那碗面
      return false
    }
    if (id === 'rest' && phase === 'collect' && inRect(rx, ry, 36, 54, 62, 84)) {
      setPhase('done')                          // 收下糖纸
      later(onDone, 2800)
    }
    return false
  }

  // 圆圈提示：现在该点哪里
  const rings =
    phase === 'start' ? [{ panel: 'room', rx: 56, ry: 32 }]
    : phase === 'beam' ? [{ panel: 'room', rx: 50, ry: 74 }]
    : phase === 'open' ? [{ panel: 'rest', rx: 46, ry: 54 }]
    : []

  // 光停在哪，下一步就在哪
  const lightAt =
    phase === 'start' ? { panel: 'room', rx: 56, ry: 34 }
    : phase === 'facadeOut' ? { panel: 'facade', rx: 50, ry: 94 }
    : phase === 'beam' ? { panel: 'room', rx: 50, ry: 80 }
    : phase === 'streetOut' ? { panel: 'street', rx: 50, ry: 6 }
    : phase === 'door' ? { panel: 'rest', rx: 6, ry: 55 }
    : { panel: 'rest', rx: 46, ry: 56 }

  const idleGlow =
    phase === 'facadeOut' ? ['facade', 'room']
    : phase === 'streetOut' ? ['street', 'room']
    : phase === 'door' ? ['rest', 'street']
    : []

  const chairEmpty = atLeast('beam')            // 他起身了，窗前空了

  const overlay = (id: string, zoomed: boolean) => {
    if (id === 'room') {
      return (
        <>
          {chairEmpty && (
            <div style={{ position: 'absolute', left: '26%', top: '48%', width: '48%', height: '50%',
              background: 'radial-gradient(ellipse, rgba(4,6,10,0.85) 25%, rgba(4,6,10,0) 72%)',
              pointerEvents: 'none' }} />
          )}
          {phase === 'start' && (
            <div className="goro-hotspot" style={{ left: '44%', top: '20%', width: '24%', height: '28%' }} />
          )}
          {phase === 'beam' && (
            <div className="goro-hotspot" style={{ left: '25%', top: '52%', width: '50%', height: '42%' }} />
          )}
          {atLeast('beam') && (
            <div style={{ position: 'absolute', left: '24%', top: '6%', width: '52%', height: '52%',
              pointerEvents: 'none', animation: 'propIn 1.4s ease', mixBlendMode: 'screen',
              background: 'radial-gradient(ellipse, rgba(255,216,140,0.85), rgba(255,190,100,0.25) 60%, rgba(255,190,100,0) 78%)' }} />
          )}
        </>
      )
    }
    if (id === 'street' && atLeast('door')) {
      // 光照到街上，面馆的门口亮了
      return (
        <div style={{ position: 'absolute', left: '58%', top: '40%', width: '26%', height: '40%',
          pointerEvents: 'none', animation: 'propIn 2s ease',
          background: 'radial-gradient(ellipse, rgba(255,210,130,0.5), rgba(255,210,130,0) 72%)' }} />
      )
    }
    if (id === 'rest' && zoomed) {
      return (
        <>
          {phase === 'door' && (
            <div style={{ position: 'absolute', left: '24%', top: 0, width: '52%', height: '58%',
              background: 'repeating-linear-gradient(180deg, #4a4d52 0 8px, #33363b 8px 12px)',
              borderBottom: '4px solid #22242a', pointerEvents: 'none' }} />
          )}
          {phase === 'open' && (
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
      <PanelField
        panels={panels}
        fused={fused}
        onFuse={onFuse}
        onTap={onTap}
        onSwipe={onSwipe}
        renderOverlay={overlay}
        idleGlowIds={idleGlow}
        walker={walker}
        rings={rings}
        bg="/story/a2-street.webp"
        intro={{ img: '/story/a2-windows.webp' }}
        lightAt={lightAt}
        lightColor={LIGHTS[2].core}
        lightGlow={LIGHTS[2].glow}
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
