import { useState } from 'react'
import { PanelField } from './goro'
import type { GPanel, GWalker } from './goro'
import { LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第二章 · 空城（2020）—— 画中世界式 · 自由组装
// 开场只有一幅画：他的房间。入画就能看到两处呼吸的细节——
// 对面楼那扇「她的窗」、他身下那片「楼下的街」。
// 先揭哪幅都行。街入画后，街尽头面馆的灯也可以揭。
// 四幅画都在桌上以后，怎么拼由你：
//   窗 → 房间上面（光流进来，他起身）
//   街 → 房间下面（他走下楼，站到空街上）
//   面馆 → 街尾（路通了，卷帘门自己卷起，他走进去）
// 拼的顺序不限——但只有路真正通了，他才走得到那碗面。
// 面碗下面，压着第二角糖纸。
// ------------------------------------------------------------

type Ph = 'start' | 'play' | 'open' | 'collect' | 'done'

const ROOM: GPanel = {
  id: 'room', img: '/story/a2-room.webp', x: 22, y: 12, w: 56,
  ports: [{ side: 't', at: 50, key: 'beam' }, { side: 'b', at: 50, key: 'spill' }],
  zoomable: true,
}
const FACADE: GPanel = {
  id: 'facade', img: '/story/a2-windows.webp', x: 62, y: 8, w: 30,
  ports: [{ side: 'b', at: 50, key: 'beam' }], zoomable: true,
}
const STREET: GPanel = {
  id: 'street', img: '/story/a2-street.webp', x: 62, y: 46, w: 30,
  ports: [{ side: 't', at: 50, key: 'spill' }, { side: 'r', at: 55, key: 'rest' }],
  zoomable: true,
}
const REST: GPanel = {
  id: 'rest', img: '/story/a2-restaurant.webp', x: 18, y: 58, w: 32,
  ports: [{ side: 'l', at: 55, key: 'rest' }], zoomable: true,
}

const inRect = (rx: number, ry: number, x0: number, y0: number, x1: number, y1: number) =>
  rx >= x0 && rx <= x1 && ry >= y0 && ry <= y1

export default function Ch2Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const initPhase: Ph =
    D === 'done' ? 'done' : D === 'collect' ? 'collect' : D === 'open' ? 'open'
    : D ? 'play' : 'start'
  const [phase, setPhase] = useState<Ph>(initPhase)
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

  const panels: GPanel[] = [{ ...ROOM, w: outFacade || outStreet || outRest ? 34 : 56 }]
  if (outFacade) panels.push(FACADE)
  if (outStreet) panels.push(STREET)
  if (outRest) panels.push(REST)
  // 调试跳段：直接摆出连通后的位置
  if (D === 'beam' || D === 'streetOut' || D === 'door' || D === 'open' || D === 'collect' || D === 'done') {
    panels[0] = { ...ROOM, w: 34, x: 25, y: 31.4 }
    panels[1] = { ...FACADE, w: 30, x: 27, y: 3 }
  }
  if (D === 'door' || D === 'open' || D === 'collect' || D === 'done') {
    panels[2] = { ...STREET, w: 30, x: 27, y: 63.6 }
    panels[3] = { ...REST, w: 32, x: 57, y: 62.5 }
  }

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
      // 光流进房间，他从窗前起身
      later(() => setWalker({ panel: 'room', rx: 50, ry: 82, facing: 1 }), 600)
      if (spillOn) {
        // 街早就接好了：他站直就往楼下走
        later(() => setWalker({ panel: 'street', rx: 46, ry: 80, facing: 1 }), 2400)
        if (restOn) walkIn(4000)
      }
    } else if (key === 'spill') {
      playOnce('/story/sfx-chime.mp3', 0.5, 0.85)
      // 他走下楼，自己走到空街上
      later(() => setWalker({ panel: 'street', rx: 46, ry: 80, facing: 1 }), 800)
      if (restOn) walkIn(2400)
    } else if (key === 'rest') {
      playOnce('/story/sfx-chime.mp3', 0.45, 1.1)
      if (spillOn) walkIn(500)                    // 人在街上：门卷起来他就进去了
      // 人还没下楼：面馆灯亮着等他，路通了门才开
    }
  }

  // 画里揭画
  const onSwipe = (id: string, dx: number, dy: number, rx0: number, ry0: number): boolean => {
    if (id === 'room' && !outFacade && inRect(rx0, ry0, 44, 20, 68, 48)) {
      setOutFacade(true); setPhase('play')        // 从对面楼的夜色里揭下「她的窗」
      playOnce('/story/sfx-chime.mp3', 0.35, 1.15)
      return true
    }
    if (id === 'room' && !outStreet && (dy > 6 || phase !== 'start') && inRect(rx0, ry0, 25, 52, 75, 92)) {
      setOutStreet(true); setPhase('play')        // 从他坐着的地方往下，揭下「楼下的街」
      playOnce('/story/sfx-chime.mp3', 0.35, 1.3)
      return true
    }
    if (id === 'street' && outStreet && !outRest && dx > 6 && inRect(rx0, ry0, 58, 36, 92, 82)) {
      setOutRest(true)                            // 从街尽头揭下「面馆」
      playOnce('/story/sfx-chime.mp3', 0.35, 1.1)
      return true
    }
    return false
  }

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean): boolean => {
    if (!zoomed) return false
    // 点一下发亮的细节 = 把它揭下来
    if (id === 'room' && !outFacade && inRect(rx, ry, 44, 20, 68, 48)) {
      setOutFacade(true); setPhase('play')
      playOnce('/story/sfx-chime.mp3', 0.35, 1.15)
      return true
    }
    if (id === 'room' && !outStreet && inRect(rx, ry, 25, 52, 75, 92)) {
      setOutStreet(true); setPhase('play')
      playOnce('/story/sfx-chime.mp3', 0.35, 1.3)
      return true
    }
    if (id === 'street' && outStreet && !outRest && inRect(rx, ry, 58, 36, 92, 82)) {
      setOutRest(true)
      playOnce('/story/sfx-chime.mp3', 0.35, 1.1)
      return true
    }
    if (id === 'rest' && phase === 'open' && inRect(rx, ry, 34, 46, 60, 72)) {
      setPhase('collect')                         // 掀开那碗面
      return false
    }
    if (id === 'rest' && phase === 'collect' && inRect(rx, ry, 36, 54, 62, 84)) {
      setPhase('done')                            // 收下糖纸
      later(onDone, 2800)
    }
    return false
  }

  // 圆圈提示：只指「还没被揭开的细节」；拼缝靠共振发光，不用圈
  const rings =
    !outFacade ? [{ panel: 'room', rx: 56, ry: 32 }]
    : !outStreet ? [{ panel: 'room', rx: 50, ry: 74 }]
    : !outRest ? [{ panel: 'street', rx: 76, ry: 58 }]
    : phase === 'open' ? [{ panel: 'rest', rx: 46, ry: 54 }]
    : []

  // 光停在哪，下一步就在哪：优先指还没揭的细节，再指还没连的缝
  const lightAt =
    phase === 'start' ? { panel: 'room', rx: 56, ry: 34 }
    : !outStreet ? { panel: 'room', rx: 50, ry: 80 }
    : !beamOn ? { panel: 'facade', rx: 50, ry: 94 }
    : !outRest ? { panel: 'street', rx: 78, ry: 58 }
    : !spillOn ? { panel: 'street', rx: 50, ry: 6 }
    : !restOn ? { panel: 'rest', rx: 6, ry: 55 }
    : { panel: 'rest', rx: 46, ry: 56 }

  // 所有没连上的缝从零秒开始漏光——它们自己在邀请你
  const idleGlow = panels.map((g) => g.id)

  const chairEmpty = beamOn                     // 他起身了，窗前空了
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
