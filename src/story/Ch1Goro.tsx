import { useState } from 'react'
import { PanelField } from './goro'
import type { GPanel, GWalker } from './goro'
import { LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第一章 · 夜班（2025）—— 画中世界式
// 开场只有一幅画：保安亭。他坐在里面，窗外一片黑。
// 入画，把「窗外的楼道」从窗里揭下来——它落成一幅新画。
// 把楼道拖到亭子窗边，两边一靠近就吸合成一幅：
//   他起身，自己走过缝，在楼道尽头的亮窗前停下。
// 入画楼道，把尽头窗里的「对面楼」揭下来。
// 把对面楼挂到亭子正下方——灯光灌进亭窗，
// 他走回桌前坐下，登记本显影，第一角糖纸就在本子里。
// ------------------------------------------------------------

type Ph = 'start' | 'hallOut' | 'seam' | 'belowOut' | 'lit' | 'collect' | 'done'
const ORDER: Ph[] = ['start', 'hallOut', 'seam', 'belowOut', 'lit', 'collect', 'done']

const BOOTH: GPanel = {
  id: 'booth', img: '/story/a1.webp', x: 19, y: 13, w: 62,
  ports: [{ side: 'r', at: 50, key: 'seam' }, { side: 'b', at: 55, key: 'lamp' }],
  zoomable: true,
}
const HALL: GPanel = {
  id: 'hall', img: '/story/a1-hall.webp', x: 30, y: 56, w: 40,
  ports: [{ side: 'l', at: 50, key: 'seam' }], zoomable: true,
}
const BELOW: GPanel = {
  id: 'below', img: '/story/a1-below.webp', x: 60, y: 64, w: 30,
  ports: [{ side: 't', at: 55, key: 'lamp' }], zoomable: true,
}

const inRect = (rx: number, ry: number, x0: number, y0: number, x1: number, y1: number) =>
  rx >= x0 && rx <= x1 && ry >= y0 && ry <= y1

export default function Ch1Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const initPhase: Ph =
    D === 'done' ? 'done' : D === 'collect' ? 'collect'
    : D === 'lit' ? 'lit' : D === 'belowOut' ? 'belowOut'
    : D === 'seam' ? 'seam' : D === 'hallOut' ? 'hallOut' : 'start'
  const [phase, setPhase] = useState<Ph>(initPhase)
  const atLeast = (x: Ph) => ORDER.indexOf(phase) >= ORDER.indexOf(x)

  const [fused, setFused] = useState<[string, string][]>(
    atLeast('lit') ? [['booth', 'hall'], ['booth', 'below']]
      : atLeast('seam') ? [['booth', 'hall']] : [])
  const [walker, setWalker] = useState<GWalker | null>(
    phase === 'seam' || phase === 'belowOut'
      ? { panel: 'hall', rx: 86, ry: 78, facing: 1 } : null)
  const later = useTimers()
  useLoop('/story/amb-hum.mp3', 0.15)

  const panels: GPanel[] = [BOOTH]
  if (atLeast('hallOut')) panels.push(HALL)
  if (atLeast('belowOut')) panels.push(BELOW)
  // 画多了，开场的画就收小一点；调试跳段时直接摆出连通后的位置
  const seamOn = atLeast('seam')
  const lampOn = atLeast('lit')
  if (!seamOn && atLeast('hallOut')) panels[0] = { ...BOOTH, w: 44 }
  if (seamOn && !lampOn) {
    panels[0] = { ...BOOTH, w: 44, x: 8, y: 29 }
    panels[1] = { ...HALL, x: 52, y: 29 }
  }
  if (lampOn) {
    panels[0] = { ...BOOTH, w: 44, x: 8, y: 24.9 }
    panels[1] = { ...HALL, x: 52, y: 24.9 }
    panels[2] = { ...BELOW, x: 15.7, y: 66.6 }
  }

  const onFuse = (a: string, b: string, key: string) => {
    setFused((f) => [...f, [a, b]])
    if (key === 'seam') {
      playOnce('/story/sfx-chime.mp3', 0.4, 0.8)
      setPhase('seam')
      // 他起身，自己走过缝，在楼道尽头的亮窗前停下
      later(() => setWalker({ panel: 'booth', rx: 56, ry: 76, facing: 1 }), 400)
      later(() => setWalker({ panel: 'hall', rx: 86, ry: 78, facing: 1 }), 1300)
    } else if (key === 'lamp') {
      playOnce('/story/sfx-chime.mp3', 0.4, 1)
      setPhase('lit')
      // 灯亮了，他走回桌前坐下——淡进画里那个人
      later(() => setWalker({ panel: 'booth', rx: 56, ry: 76, facing: -1 }), 700)
      later(() => setWalker((w) => (w ? { ...w, fade: true } : w)), 2700)
      later(() => setWalker(null), 3700)
    }
  }

  // 画里揭画：从发亮的细节往外拖，细节落成一幅新画
  const onSwipe = (id: string, _dx: number, _dy: number, rx0: number, ry0: number): boolean => {
    if (id === 'booth' && phase === 'start' && inRect(rx0, ry0, 10, 8, 50, 56)) {
      setPhase('hallOut')                       // 从亭窗揭下「楼道」
      playOnce('/story/sfx-chime.mp3', 0.35, 1.15)
      return true
    }
    if (id === 'hall' && phase === 'seam' && inRect(rx0, ry0, 72, 10, 99, 64)) {
      setPhase('belowOut')                      // 从尽头亮窗揭下「对面楼」
      playOnce('/story/sfx-chime.mp3', 0.35, 1.3)
      return true
    }
    return false
  }

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean): boolean => {
    if (!zoomed) return false
    // 点一下发亮的细节 = 把它揭下来（和拖出来等效，但更容易被发现）
    if (id === 'booth' && phase === 'start' && inRect(rx, ry, 10, 8, 50, 56)) {
      setPhase('hallOut')
      playOnce('/story/sfx-chime.mp3', 0.35, 1.15)
      return true
    }
    if (id === 'hall' && phase === 'seam' && inRect(rx, ry, 72, 10, 99, 64)) {
      setPhase('belowOut')
      playOnce('/story/sfx-chime.mp3', 0.35, 1.3)
      return true
    }
    if (id === 'booth' && phase === 'lit' && inRect(rx, ry, 20, 58, 50, 82)) {
      setPhase('collect')                       // 翻开登记本
      return false
    }
    if (id === 'booth' && phase === 'collect' && inRect(rx, ry, 22, 60, 48, 84)) {
      setPhase('done')                          // 收下糖纸
      later(onDone, 2800)
    }
    return false
  }

  // 圆圈提示：现在该点哪里
  const rings =
    phase === 'start' ? [{ panel: 'booth', rx: 30, ry: 32 }]
    : phase === 'seam' ? [{ panel: 'hall', rx: 86, ry: 34 }]
    : phase === 'lit' ? [{ panel: 'booth', rx: 32, ry: 66 }]
    : []

  // 光停在哪，下一步就在哪
  const lightAt =
    phase === 'start' ? { panel: 'booth', rx: 30, ry: 34 }
    : phase === 'hallOut' ? { panel: 'hall', rx: 5, ry: 50 }
    : phase === 'seam' ? { panel: 'hall', rx: 88, ry: 36 }
    : phase === 'belowOut' ? { panel: 'below', rx: 55, ry: 8 }
    : { panel: 'booth', rx: 30, ry: 66 }

  const idleGlow =
    phase === 'hallOut' ? ['hall', 'booth']
    : phase === 'belowOut' ? ['below', 'booth']
    : []

  const boothDark = atLeast('lit') ? 0 : 0.55
  const chairEmpty = phase === 'seam' || phase === 'belowOut'   // 他不在亭子里

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
          {atLeast('lit') && <PaperBit x={22} y={62} />}
        </>
      )
    }
    if (id === 'hall' && phase === 'seam') {
      return <div className="goro-hotspot" style={{ left: '72%', top: '10%', width: '27%', height: '54%' }} />
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
        bg="/story/a1.webp"
        intro={{ img: '/story/a1.webp' }}
        lightAt={lightAt}
        lightColor={LIGHTS[1].core}
        lightGlow={LIGHTS[1].glow}
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
