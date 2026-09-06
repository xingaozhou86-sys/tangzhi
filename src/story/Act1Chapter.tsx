import { useRef, useState } from 'react'
import { Shell, LIGHTS, useTimers, useLoop, dbgPh } from './ui'
import type { Pt } from './ui'
import type React from 'react'

// ------------------------------------------------------------
// 第一章 · 夜班（2025）完整章 —— 墙面咬合引擎首章
// 三幅画：楼道 / 保安亭 / 楼下仰望
// 教学：点按入画 → 拖画咬合 → 光穿过缝 → 点灯显影 → 糖纸收集
// ------------------------------------------------------------

interface Frame { id: 'hall' | 'booth' | 'below'; img: string; x: number; y: number; w: number }

type ChPhase =
  | 'wall-hall'     // 指引：进楼道画
  | 'in-hall'       // 楼道内：走到尽头的窗
  | 'wall-drag'     // 指引：把楼道画拖到保安亭画旁边
  | 'in-hall-seam'  // 再进楼道：缝出现了
  | 'in-booth-dark' // 保安亭内（黑）：点灯
  | 'in-booth-lit'  // 显影，书落
  | 'collect'       // 糖纸
  | 'done'

export default function Act1Chapter({ onDone }: { onDone: () => void }) {
  const D = dbgPh() as ChPhase | null
  const dock0 = D ? ['in-hall-seam', 'in-booth-dark', 'in-booth-lit', 'collect', 'done'].includes(D) : false
  const [frames, setFrames] = useState<Frame[]>(() => {
    const base: Frame[] = [
      { id: 'hall', img: '/story/a1-hall.webp', x: 14, y: 30, w: 22 },
      { id: 'booth', img: '/story/a1.webp', x: 50, y: 22, w: 24 },
      { id: 'below', img: '/story/a1-below.webp', x: 76, y: 36, w: 19 },
    ]
    if (dock0) base[0] = { ...base[0], x: 50 - 22, y: 22 }
    return base
  })
  const [phase, setPhase] = useState<ChPhase>(D ?? 'wall-hall')
  const [docked, setDocked] = useState(dock0)
  const [light, setLight] = useState<Pt>({ x: 26, y: 60 })
  const later = useTimers()
  useLoop('/story/amb-hum.mp3', 0.15) // 深夜电流嗡鸣，2025 没有音乐
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const hall = frames.find((f) => f.id === 'hall')!
  const booth = frames.find((f) => f.id === 'booth')!

  // ---- 拖画 ----
  const onFrameDown = (id: string) => (e: React.PointerEvent) => {
    if (phase !== 'wall-drag') return
    const el = rootRef.current!
    const r = el.getBoundingClientRect()
    const f = frames.find((x) => x.id === id)!
    dragRef.current = {
      id,
      dx: ((e.clientX - r.left) / r.width) * 100 - f.x,
      dy: ((e.clientY - r.top) / r.height) * 100 - f.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onFrameMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d || !rootRef.current) return
    const r = rootRef.current.getBoundingClientRect()
    const nx = ((e.clientX - r.left) / r.width) * 100 - d.dx
    const ny = ((e.clientY - r.top) / r.height) * 100 - d.dy
    setFrames((fs) => fs.map((f) => (f.id === d.id ? { ...f, x: nx, y: ny } : f)))
  }
  const onFrameUp = () => {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return
    // 咬合判定：楼道右缘 ↔ 保安亭左缘
    const h = d.id === 'hall' ? { ...hall, ...frames.find((f) => f.id === 'hall')! } : hall
    const gap = Math.abs(h.x + h.w - booth.x)
    const vover = Math.abs(h.y - booth.y)
    if (gap < 5 && vover < 12) {
      setFrames((fs) => fs.map((f) => (f.id === 'hall' ? { ...f, x: booth.x - h.w, y: booth.y } : f)))
      setDocked(true)
      setPhase('in-hall-seam')
    }
  }

  // ---- 入画 ----
  const enterHall = () => {
    if (phase === 'wall-hall') { setPhase('in-hall'); setLight({ x: 24, y: 66 }) }
    else if (phase === 'in-hall-seam') { setLight({ x: 24, y: 66 }) }
  }

  const onHallTap = () => {
    if (phase === 'in-hall') {
      setLight({ x: 50, y: 40 }) // 尽头的窗
      later(() => setPhase('wall-drag'), 1600)
    } else if (phase === 'in-hall-seam' && docked) {
      setLight({ x: 88, y: 55 }) // 缝
      later(() => { setPhase('in-booth-dark'); setLight({ x: 16, y: 60 }) }, 1500)
    }
  }

  const onBoothTap = () => {
    if (phase === 'in-booth-dark') {
      setLight({ x: 30, y: 52 })
      setPhase('in-booth-lit')
      later(() => setPhase('collect'), 2800)
    } else if (phase === 'collect') {
      setLight({ x: 34, y: 73 })
      setPhase('done')
      later(onDone, 2800)
    }
  }

  // ---- 金圈 ----
  const rings = () => {
    if (phase === 'wall-hall') return [{ x: hall.x + hall.w / 2, y: hall.y + 14, size: 70 }]
    if (phase === 'wall-drag') return [{ x: booth.x + booth.w / 2, y: booth.y + 15, size: 70 }]
    return []
  }

  const inPainting = ['in-hall', 'in-hall-seam', 'in-booth-dark', 'in-booth-lit', 'collect', 'done'].includes(phase)

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0 }}>
      {!inPainting && (
        <Shell
          light={light}
          lightColor={LIGHTS[1].core}
          lightGlow={LIGHTS[1].glow}
          rings={rings()}
          onPointerDown={() => {}}
        >
          {/* 宿舍的墙 */}
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #171512 0%, #211d17 50%, #14110d 100%)' }} />
          {frames.map((f) => (
            <div key={f.id}
              onPointerDown={onFrameDown(f.id)}
              onPointerMove={onFrameMove}
              onPointerUp={onFrameUp}
              onClick={() => { if ((phase === 'wall-hall' || phase === 'in-hall-seam') && f.id === 'hall') enterHall() }}
              style={{
                position: 'absolute', left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`,
                aspectRatio: '3/2', zIndex: 14, cursor: phase === 'wall-drag' ? 'grab' : 'pointer',
                border: '6px solid #3a3020', boxShadow: '0 14px 34px rgba(0,0,0,0.75)',
                backgroundImage: `url(${f.img})`, backgroundSize: 'cover', backgroundPosition: 'center',
                transition: dragRef.current ? 'none' : 'left 0.6s ease, top 0.6s ease',
                touchAction: 'none',
              }} />
          ))}
          {/* 咬合缝的光 */}
          {docked && !inPainting && (
            <div style={{ position: 'absolute', left: `${booth.x - 0.4}%`, top: `${booth.y}%`,
              width: '0.8%', height: '32%', zIndex: 15, pointerEvents: 'none',
              background: 'linear-gradient(180deg, transparent, rgba(255,205,110,0.85), transparent)',
              filter: 'blur(2px)' }} />
          )}
        </Shell>
      )}

      {/* 楼道内 */}
      {(phase === 'in-hall' || phase === 'in-hall-seam') && (
        <Shell
          bg="/story/a1-hall.webp" bgOn
          light={light} lightColor={LIGHTS[1].core} lightGlow={LIGHTS[1].glow}
          rings={phase === 'in-hall' ? [{ x: 50, y: 40 }] : [{ x: 88, y: 55, size: 56 }]}
          onPointerDown={onHallTap}
        >
          {phase === 'in-hall-seam' && (
            <div style={{ position: 'absolute', left: '86.6%', top: '34%', width: '2.2%', height: '42%',
              zIndex: 15, pointerEvents: 'none', animation: 'propIn 1.6s ease',
              background: 'linear-gradient(180deg, transparent, rgba(255,205,110,0.9), transparent)',
              filter: 'blur(2px)' }} />
          )}
        </Shell>
      )}

      {/* 保安亭内 */}
      {['in-booth-dark', 'in-booth-lit', 'collect', 'done'].includes(phase) && (
        <Shell
          bg="/story/a1.webp" bgOn
          light={light} lightColor={LIGHTS[1].core} lightGlow={LIGHTS[1].glow}
          rings={
            phase === 'in-booth-dark' ? [{ x: 30, y: 52 }]
            : phase === 'collect' ? [{ x: 34, y: 73, size: 52 }]
            : []
          }
          onPointerDown={onBoothTap}
        >
          {phase === 'in-booth-dark' && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,4,8,0.78)', zIndex: 11, pointerEvents: 'none' }} />
          )}
          {(phase === 'collect' || phase === 'done') && (
            <svg width="70" height="54" viewBox="0 0 70 54" style={{ position: 'absolute', left: '30%', top: '69%', zIndex: 16 }}>
              <rect x="8" y="22" width="46" height="26" rx="2" fill="#3a2f1e" transform="rotate(-6 30 35)" />
              <rect x="12" y="24" width="38" height="21" rx="1" fill="#e8dcc0" transform="rotate(-6 30 35)" />
              <rect x="40" y="12" width="16" height="10" fill="rgba(255,205,100,0.85)" transform="rotate(14 48 17)"
                style={{ filter: 'drop-shadow(0 0 8px rgba(255,200,90,0.8))' }} />
            </svg>
          )}
          {phase === 'done' && (
            <div className="prop-paper" style={{ position: 'absolute', left: '50%', top: '10%', transform: 'translateX(-50%) rotate(-1deg)',
              zIndex: 20, padding: '8px 22px', fontSize: 14, letterSpacing: '0.3em', color: '#2b2419' }}>
              糖 纸 · 壹 / 伍
            </div>
          )}
        </Shell>
      )}
    </div>
  )
}
