// ------------------------------------------------------------
// 共享小件：糖纸收集卡 / 糖纸碎片 / 可拖件基座
// ------------------------------------------------------------
import { useRef } from 'react'
import type React from 'react'

export function CollectCard({ label }: { label: string }) {
  return (
    <div
      className="prop-paper"
      style={{
        position: 'absolute', left: '50%', top: '10%', zIndex: 30,
        transform: 'translateX(-50%) rotate(-1deg)',
        padding: '8px 22px', fontSize: 14, letterSpacing: '0.3em', color: '#2b2419',
        pointerEvents: 'none',
      }}
    >
      {label}
    </div>
  )
}

// 一小角发光的糖纸
export function PaperBit({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  return (
    <svg
      width={52 * size} height={40 * size} viewBox="0 0 52 40"
      style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, zIndex: 18, pointerEvents: 'none' }}
    >
      <rect x="6" y="10" width="40" height="24" rx="2" fill="#e8dcc0" transform="rotate(-7 26 22)" />
      <rect x="10" y="13" width="14" height="18" fill="rgba(214,84,60,0.75)" transform="rotate(-7 26 22)" />
      <rect x="28" y="13" width="14" height="18" fill="rgba(255,205,100,0.85)" transform="rotate(-7 26 22)"
        style={{ filter: 'drop-shadow(0 0 7px rgba(255,200,90,0.9))' }} />
    </svg>
  )
}

// 五格糖纸收集条：挂在屏幕下缘，收到一角就亮起一格；最后一格是半张
export function WrapperStrip({ filled, halfLast }: { filled: number; halfLast?: boolean }) {
  return (
    <div className="wrapper-strip">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`ws ${i < filled ? 'got' : ''} ${i < filled && halfLast && i === 4 ? 'half' : ''} ${i === filled - 1 ? 'fresh' : ''}`}
        />
      ))}
    </div>
  )
}

// 通用拖拽：给子元素 onPointerDown，回调移动量（% 坐标），松手回调
export function usePercentDrag(
  rootRef: React.RefObject<HTMLDivElement | null>,
  onMove: (x: number, y: number, dx: number, dy: number) => void,
  onUp?: (x: number, y: number) => void,
) {
  const drag = useRef<{ sx: number; sy: number; lx: number; ly: number } | null>(null)
  const pct = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
  }
  const down = (e: React.PointerEvent) => {
    const p = pct(e)
    drag.current = { sx: p.x, sy: p.y, lx: p.x, ly: p.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return
    const p = pct(e)
    onMove(p.x, p.y, p.x - drag.current.lx, p.y - drag.current.ly)
    drag.current.lx = p.x
    drag.current.ly = p.y
  }
  const up = (e: React.PointerEvent) => {
    if (!drag.current) return
    const p = pct(e)
    drag.current = null
    onUp?.(p.x, p.y)
  }
  return { down, move, up }
}
