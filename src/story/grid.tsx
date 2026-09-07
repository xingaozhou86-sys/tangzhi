import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import type { Pt } from './ui'

// ------------------------------------------------------------
// GridField —— 画中世界标准引擎 v1
// 一面墙，一排空画框（格子）。规则只有三条：
//   · 拖画到空框 → 挪过去（被占了又没配对 → 弹回）
//   · 拖到配对的那幅上面 → 两幅合体（'stack'）
//   · 相邻两格的画内容对得上 → 自动连合，光穿过缝，他能走过去
// 点画入画；画里发亮的细节可以揭下来，飞进空框落成一幅新画。
// 没有光粒引路——缝从零秒开始漏光，拖着画靠近时缝会亮；
// 只有当你很久不动，圆圈提示才出现。
// ------------------------------------------------------------

export interface Port { side: 'l' | 'r' | 't' | 'b'; at: number; key: string }
export interface GSlot { x: number; y: number; w: number; col: number; row: number }
export interface GPanel {
  id: string
  img: string
  slot: number                     // 初始画框编号
  ports?: Port[]
  zoomable?: boolean
  locked?: boolean                 // 钉在墙上：可入画，不可拖
  layerOn?: string                 // 拖到这幅画上面 → 'stack' 合体
  hide?: boolean
}
export interface GWalker { panel: string; rx: number; ry: number; facing?: 1 | -1; fade?: boolean }
export interface GRing { panel: string; rx: number; ry: number; shape?: 'circle' | 'frame' }

const AR = 2 / 3

// 2×2 画框墙
export const SLOTS_22: GSlot[] = [
  { x: 17, y: 19, w: 30, col: 0, row: 0 },
  { x: 53, y: 19, w: 30, col: 1, row: 0 },
  { x: 17, y: 52, w: 30, col: 0, row: 1 },
  { x: 53, y: 52, w: 30, col: 1, row: 1 },
]
// 2列×3行 画框墙（纵向三连的章节用）
export const SLOTS_23: GSlot[] = [
  { x: 24, y: 13.5, w: 22, col: 0, row: 0 },
  { x: 54, y: 13.5, w: 22, col: 1, row: 0 },
  { x: 24, y: 38.5, w: 22, col: 0, row: 1 },
  { x: 54, y: 38.5, w: 22, col: 1, row: 1 },
  { x: 24, y: 63.5, w: 22, col: 0, row: 2 },
  { x: 54, y: 63.5, w: 22, col: 1, row: 2 },
]

interface FieldProps {
  panels: GPanel[]
  fused: [string, string][]
  onFuse: (a: string, b: string, key: string) => void
  onSlotChange?: (id: string, to: number) => void
  slots?: GSlot[]
  onTap?: (id: string, rx: number, ry: number, zoomed: boolean) => void | boolean
  onSwipe?: (id: string, dx: number, dy: number, rx0: number, ry0: number) => void | boolean
  renderOverlay?: (id: string, zoomed: boolean) => React.ReactNode
  walker?: GWalker | null
  rings?: GRing[]        // 静置 12 秒后才出现
  ringsNow?: GRing[]     // 立即出现（只用于每章第一个动作的教学）
  bg?: string
  intro?: { img: string; ms?: number }
}

export function GridField(p: FieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const slots = p.slots ?? SLOTS_22
  const slotPos = (i: number): Pt => ({ x: slots[i].x, y: slots[i].y })
  const [pos, setPos] = useState<Record<string, Pt>>(() =>
    Object.fromEntries(p.panels.map((g) => [g.id, slotPos(g.slot)])))
  const [slotOf, setSlotOf] = useState<Record<string, number>>(() =>
    Object.fromEntries(p.panels.map((g) => [g.id, g.slot])))
  const [zoomId, setZoomId] = useState<string | null>(() => {
    try {
      const q = window.location.hash.split('?')[1]
      return q ? new URLSearchParams(q).get('zoom') : null
    } catch { return null }
  })
  const [idleHint, setIdleHint] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number; vertical: boolean } | null>(null)
  const [kick, setKick] = useState(false)
  const prevFusedCount = useRef(0)
  const lastAct = useRef(Date.now())
  const zoomDown = useRef<{ x: number; y: number } | null>(null)
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; moved: number } | null>(null)

  // 章节中途新出现的画 → 登记进它该去的空框
  useEffect(() => {
    setPos((prev) => {
      let changed = false
      const n = { ...prev }
      p.panels.forEach((g) => {
        if (!n[g.id]) { n[g.id] = slotPos(g.slot); changed = true }
      })
      return changed ? n : prev
    })
    // 画的内容变了（比如揭到底层露出新缝）→ 重扫一遍相邻格
    setSlotOf((prev) => {
      let changed = false
      const n = { ...prev }
      p.panels.forEach((g) => {
        if (n[g.id] == null) { n[g.id] = g.slot; changed = true }
      })
      const next = changed ? n : prev
      window.setTimeout(() => adjacencyScan(next), 60)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.panels])

  // 连合瞬间：光爆 + 光流 + 轻轻一震
  useEffect(() => {
    if (p.fused.length > prevFusedCount.current && rootRef.current) {
      const [a, b] = p.fused[p.fused.length - 1]
      const ga = p.panels.find((g) => g.id === a)
      const gb = p.panels.find((g) => g.id === b)
      if (ga && gb) {
        const pa = pos[ga.id]
        const pb = pos[gb.id]
        if (pa && pb) {
          const fa = window.innerWidth / window.innerHeight
          const wa = slots[slotOf[ga.id] ?? ga.slot].w
          const wb = slots[slotOf[gb.id] ?? gb.slot].w
          const ha = wa * fa * AR
          const hb = wb * fa * AR
          const cax = pa.x + wa / 2
          const cay = pa.y + ha / 2
          const cbx = pb.x + wb / 2
          const cby = pb.y + hb / 2
          setBurst({ x: (cax + cbx) / 2, y: (cay + cby) / 2, vertical: Math.abs(cbx - cax) > Math.abs(cby - cay) })
          setKick(true)
          window.setTimeout(() => setKick(false), 350)
          window.setTimeout(() => setBurst(null), 2200)
        }
      }
    }
    prevFusedCount.current = p.fused.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fused])

  // 他走动时：脚步动画 1.8 秒
  const [walking, setWalking] = useState(false)
  const prevWalker = useRef<string>('')
  useEffect(() => {
    const key = p.walker ? `${p.walker.panel}:${p.walker.rx}:${p.walker.ry}` : ''
    if (key && prevWalker.current && key !== prevWalker.current) {
      setWalking(true)
      const t = window.setTimeout(() => setWalking(false), 1800)
      prevWalker.current = key
      return () => clearTimeout(t)
    }
    prevWalker.current = key
  }, [p.walker])

  // 开场定场镜头
  const [introPhase, setIntroPhase] = useState<'in' | 'out' | null>(p.intro ? 'in' : null)
  useEffect(() => {
    if (!p.intro) return
    const t1 = window.setTimeout(() => setIntroPhase('out'), p.intro.ms ?? 2400)
    const t2 = window.setTimeout(() => setIntroPhase(null), (p.intro.ms ?? 2400) + 1300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 静置 12 秒 → 章节给的圆圈提示才出现
  useEffect(() => {
    const t = window.setInterval(() => {
      if (Date.now() - lastAct.current > 12000) setIdleHint(true)
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const poke = () => { lastAct.current = Date.now(); setIdleHint(false) }

  const panelH = (g: GPanel, rect: DOMRect) => {
    const w = slots[slotOf[g.id] ?? g.slot].w
    return (w / 100) * rect.width * AR / rect.height * 100
  }
  const panelW = (g: GPanel) => slots[slotOf[g.id] ?? g.slot].w

  const complement = (s: Port['side']) => (s === 'l' ? 'r' : s === 'r' ? 'l' : s === 't' ? 'b' : 't')

  const fusedKeys = new Set<string>()
  p.fused.forEach(([a, b]) => {
    const pa = p.panels.find((g) => g.id === a)
    const pb = p.panels.find((g) => g.id === b)
    pa?.ports?.forEach((paPort) => pb?.ports?.forEach((pbPort) => {
      if (paPort.key === pbPort.key) { fusedKeys.add(`${a}:${paPort.key}`); fusedKeys.add(`${b}:${paPort.key}`) }
    }))
  })
  const partnerOf = (id: string) => {
    const out: string[] = []
    p.fused.forEach(([a, b]) => { if (a === id) out.push(b); if (b === id) out.push(a) })
    return out
  }

  // 相邻格内容对得上 → 自动连合
  const adjacencyScan = (so: Record<string, number>) => {
    const entries = Object.entries(so)
    for (const [a, ia] of entries) {
      const ga = p.panels.find((g) => g.id === a)
      if (!ga || ga.hide) continue
      const sa = slots[ia]
      for (const [b, ib] of entries) {
        if (a === b) continue
        const gb = p.panels.find((g) => g.id === b)
        if (!gb || gb.hide) continue
        const sb = slots[ib]
        const horiz = sb.col === sa.col + 1 && sb.row === sa.row
        const vert = sb.row === sa.row + 1 && sb.col === sa.col
        if (!horiz && !vert) continue
        const sideA: Port['side'] = horiz ? 'r' : 'b'
        const sideB = complement(sideA)
        for (const paPort of ga.ports ?? []) {
          if (paPort.side !== sideA || fusedKeys.has(`${a}:${paPort.key}`)) continue
          for (const pbPort of gb.ports ?? []) {
            if (pbPort.side !== sideB || pbPort.key !== paPort.key || fusedKeys.has(`${b}:${pbPort.key}`)) continue
            p.onFuse(a, b, paPort.key)
            fusedKeys.add(`${a}:${paPort.key}`)
            fusedKeys.add(`${b}:${pbPort.key}`)
          }
        }
      }
    }
  }

  // ---- 拖拽 ----
  const down = (g: GPanel) => (e: React.PointerEvent) => {
    if (zoomId) return
    poke()
    drag.current = { id: g.id, sx: e.clientX, sy: e.clientY, ox: pos[g.id].x, oy: pos[g.id].y, moved: 0 }
    if (!g.locked) setDragging(g.id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !rootRef.current) return
    const g0 = p.panels.find((x) => x.id === d.id)
    if (g0?.locked) return
    poke()
    const rect = rootRef.current.getBoundingClientRect()
    const dx = ((e.clientX - d.sx) / rect.width) * 100
    const dy = ((e.clientY - d.sy) / rect.height) * 100
    d.moved = Math.max(d.moved, Math.hypot(e.clientX - d.sx, e.clientY - d.sy))
    if (d.moved < 8) return
    const nx = d.ox + dx
    const ny = d.oy + dy
    const ids = [d.id, ...partnerOf(d.id)]
    setPos((prev) => {
      const n = { ...prev }
      const ddx = nx - prev[d.id].x
      const ddy = ny - prev[d.id].y
      ids.forEach((id) => { if (n[id]) n[id] = { x: n[id].x + ddx, y: n[id].y + ddy } })
      return n
    })
  }

  const backToSlot = (ids: string[], so?: Record<string, number>) => {
    setPos((prev) => {
      const n = { ...prev }
      ids.forEach((id) => {
        const g = p.panels.find((x) => x.id === id)
        if (!g) return
        n[id] = slotPos((so ?? slotOf)[id] ?? g.slot)
      })
      return n
    })
  }

  const up = (g: GPanel) => (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setDragging(null)
    if (!d || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()

    // 点按（非拖动）→ 入画或热点
    if (d.moved < 8) {
      const w = panelW(g)
      const h = panelH(g, rect)
      const rx = ((e.clientX - rect.left) / rect.width * 100 - pos[g.id].x) / w * 100
      const ry = ((e.clientY - rect.top) / rect.height * 100 - pos[g.id].y) / h * 100
      if (g.zoomable) setZoomId(g.id)
      p.onTap?.(g.id, rx, ry, false)
      return
    }

    // ---- 落点判定 ----
    const group = [g.id, ...partnerOf(g.id)]
    const me = pos[g.id]
    const w = panelW(g)
    const h = panelH(g, rect)
    const cx = me.x + w / 2
    const cy = me.y + h / 2
    const targetIdx = slots.findIndex((s) => {
      const sh = (s.w / 100) * rect.width * AR / rect.height * 100
      return Math.abs(cx - (s.x + s.w / 2)) < s.w * 0.62 && Math.abs(cy - (s.y + sh / 2)) < sh * 0.62
    })
    if (targetIdx < 0) { backToSlot(group); return }

    const occupant = Object.entries(slotOf).find(([id, si]) => si === targetIdx && !group.includes(id))?.[0]
    if (occupant) {
      const og = p.panels.find((x) => x.id === occupant)
      if (og && g.layerOn === occupant) {
        // 叠上去合体
        const tp = pos[occupant]
        setPos((prev) => ({ ...prev, [g.id]: { x: tp.x + (panelW(og) - w) / 2, y: tp.y } }))
        p.onFuse(g.id, occupant, 'stack')
      } else {
        backToSlot(group)
      }
      return
    }

    // 整组平移：保持相对格位
    const from = slots[slotOf[g.id]]
    const to = slots[targetIdx]
    const dCol = to.col - from.col
    const dRow = to.row - from.row
    const targets: Record<string, number> = {}
    for (const id of group) {
      const cur = slots[slotOf[id]]
      const ti = slots.findIndex((s) => s.col === cur.col + dCol && s.row === cur.row + dRow)
      if (ti < 0) { backToSlot(group); return }
      const occ = Object.entries(slotOf).find(([oid, si]) => si === ti && !group.includes(oid))
      if (occ) { backToSlot(group); return }
      targets[id] = ti
    }
    const newSlotOf = { ...slotOf, ...targets }
    setSlotOf(newSlotOf)
    setPos((prev) => {
      const n = { ...prev }
      Object.entries(targets).forEach(([id, ti]) => { n[id] = slotPos(ti) })
      return n
    })
    group.forEach((id) => p.onSlotChange?.(id, targets[id]))
    adjacencyScan(newSlotOf)
  }

  const zoomedPanel = p.panels.find((g) => g.id === zoomId)
  const occupiedSlots = new Set(Object.values(slotOf))

  // 缝的坐标
  const fa0 = window.innerWidth / window.innerHeight
  const portPos = (g: GPanel, pt: Port): Pt => {
    const pp = pos[g.id] ?? slotPos(g.slot)
    const w = panelW(g)
    const h = w * fa0 * AR
    if (pt.side === 'l') return { x: pp.x, y: pp.y + (pt.at / 100) * h }
    if (pt.side === 'r') return { x: pp.x + w, y: pp.y + (pt.at / 100) * h }
    if (pt.side === 't') return { x: pp.x + (pt.at / 100) * w, y: pp.y }
    return { x: pp.x + (pt.at / 100) * w, y: pp.y + h }
  }
  const threads: { x1: number; y1: number; x2: number; y2: number }[] = []
  const outward = (s: Port['side']): Pt =>
    s === 'l' ? { x: -2.6, y: 0 } : s === 'r' ? { x: 2.6, y: 0 }
    : s === 't' ? { x: 0, y: -2.6 } : { x: 0, y: 2.6 }
  p.panels.forEach((ga, i) => p.panels.forEach((gb, j) => {
    if (j <= i || ga.hide || gb.hide) return
    ;(ga.ports ?? []).forEach((pta) => (gb.ports ?? []).forEach((ptb) => {
      if (pta.key !== ptb.key || pta.side !== complement(ptb.side)) return
      if (fusedKeys.has(`${ga.id}:${pta.key}`) || fusedKeys.has(`${gb.id}:${ptb.key}`)) return
      for (const [g, pt] of [[ga, pta], [gb, ptb]] as [GPanel, Port][]) {
        const A = portPos(g, pt)
        const o = outward(pt.side)
        threads.push({ x1: A.x, y1: A.y, x2: A.x + o.x, y2: A.y + o.y })
      }
    }))
  }))

  const ringList = [...(p.ringsNow ?? []), ...(idleHint ? (p.rings ?? []) : [])]

  return (
    <div ref={rootRef} className={`goro-field ${dragging ? 'dragging' : ''} ${kick ? 'kick' : ''}`} onPointerDown={poke}>
      {p.bg && <div className="goro-bg" style={{ backgroundImage: `url(${p.bg})` }} />}

      {/* 空画框：虚位以待 */}
      {slots.map((s, i) => {
        if (occupiedSlots.has(i)) return null
        return (
          <div key={`slot-${i}`} className="goro-slot"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, aspectRatio: '3/2' }} />
        )
      })}

      {p.panels.map((g, gi) => {
        if (g.hide) return null
        const pp = pos[g.id] ?? slotPos(g.slot)
        const w = panelW(g)
        return (
          <div key={g.id}
            className={`goro-panel ${zoomId === g.id ? 'gone' : ''} ${dragging === g.id ? 'drag' : ''}`}
            onPointerDown={down(g)} onPointerMove={move} onPointerUp={up(g)}
            style={{ left: `${pp.x}%`, top: `${pp.y}%`, width: `${w}%`, aspectRatio: '3/2',
              animationDelay: `${gi * 0.16}s` }}>
            <div className="goro-img" key={g.img} style={{ backgroundImage: `url(${g.img})` }} />
            {/* 缝从零秒开始漏光（弱）；静置后转强呼吸 */}
            {(g.ports ?? []).filter((pt) => !fusedKeys.has(`${g.id}:${pt.key}`)).map((pt, i) => (
              <div key={i} className={`goro-port side-${pt.side} ${idleHint ? '' : 'leak'}`} style={
                pt.side === 'l' || pt.side === 'r'
                  ? { [pt.side === 'l' ? 'left' : 'right']: 0, top: `${pt.at}%` }
                  : { [pt.side === 't' ? 'top' : 'bottom']: 0, left: `${pt.at}%` } as React.CSSProperties
              } />
            ))}
            {/* 连合缝的光 */}
            {(g.ports ?? []).filter((pt) => fusedKeys.has(`${g.id}:${pt.key}`)).map((pt, i) => (
              <div key={i} className={`goro-seam side-${pt.side}`} style={
                pt.side === 'l' || pt.side === 'r'
                  ? { [pt.side === 'l' ? 'left' : 'right']: 0, top: `${Math.max(0, pt.at - 18)}%`, height: '36%' }
                  : { [pt.side === 't' ? 'top' : 'bottom']: 0, left: `${Math.max(0, pt.at - 18)}%`, width: '36%' } as React.CSSProperties
              } />
            ))}
            {p.renderOverlay?.(g.id, false)}
          </div>
        )
      })}

      {/* 光的丝线：对得上的缝各自向外伸一截 */}
      {threads.length > 0 && !zoomId && (
        <svg className="goro-threads" viewBox="0 0 100 100" preserveAspectRatio="none">
          {threads.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              style={{ stroke: 'rgba(255,216,145,0.9)', strokeWidth: 0.3,
                strokeDasharray: '0.45 0.5', strokeLinecap: 'round' }} />
          ))}
        </svg>
      )}

      {/* 圆圈提示：ringsNow 立刻出现；rings 静置后才出现 */}
      {!zoomId && ringList.map((rg, i) => {
        const g = p.panels.find((x) => x.id === rg.panel)
        if (!g || g.hide) return null
        const pp = pos[g.id] ?? slotPos(g.slot)
        const w = panelW(g)
        const h = w * fa0 * AR
        if (rg.shape === 'frame') {
          return (
            <div key={`ring-${i}`} className="goro-ring frame"
              style={{ left: `${pp.x - 1.6}%`, top: `${pp.y - 1.6}%`,
                width: `${w + 3.2}%`, height: `calc(${h + 3.2}% )` }} />
          )
        }
        return (
          <div key={`ring-${i}`} className="goro-ring"
            style={{ left: `${pp.x + (rg.rx / 100) * w}%`, top: `${pp.y + (rg.ry / 100) * h}%` }} />
        )
      })}

      {/* 他：想过去的人 */}
      {p.walker && (() => {
        const g = p.panels.find((x) => x.id === p.walker!.panel)
        if (!g || g.hide || zoomId) return null
        const pp = pos[g.id] ?? slotPos(g.slot)
        const w = panelW(g)
        const h = w * fa0 * AR
        const fx = pp.x + (p.walker.rx / 100) * w
        const fy = pp.y + (p.walker.ry / 100) * h
        return (
          <div className={`goro-walker ${walking ? 'walking' : ''}`}
            style={{ left: `${fx}%`, top: `${fy}%`, opacity: p.walker.fade ? 0 : 1,
              transform: `translate(-50%,-92%) scaleX(${p.walker.facing ?? 1})` }}>
            <div className="wk-head" /><div className="wk-body" />
          </div>
        )
      })()}

      {/* 连合的光爆与光流 */}
      {burst && (
        <>
          <div className="goro-burst" style={{ left: `${burst.x}%`, top: `${burst.y}%` }} />
          <div className={`goro-flow ${burst.vertical ? 'vertical' : 'horizontal'}`}
            style={{ left: `${burst.x}%`, top: `${burst.y}%` }} />
        </>
      )}

      {/* 入画 */}
      {zoomedPanel && (
        <div className="goro-zoom-back" onPointerDown={() => setZoomId(null)}>
          <div className="goro-zoom-frame"
            onPointerDown={(e) => {
              e.stopPropagation()
              zoomDown.current = { x: e.clientX, y: e.clientY }
            }}
            onPointerUp={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
              const rx = ((e.clientX - r.left) / r.width) * 100
              const ry = ((e.clientY - r.top) / r.height) * 100
              poke()
              const d0 = zoomDown.current
              zoomDown.current = null
              if (d0) {
                const dx = ((e.clientX - d0.x) / r.width) * 100
                const dy = ((e.clientY - d0.y) / r.height) * 100
                if (Math.hypot(dx, dy) > 6) {
                  const rx0 = ((d0.x - r.left) / r.width) * 100
                  const ry0 = ((d0.y - r.top) / r.height) * 100
                  const pulled = p.onSwipe?.(zoomedPanel.id, dx, dy, rx0, ry0)
                  if (pulled) setZoomId(null)
                  return
                }
              }
              p.onTap?.(zoomedPanel.id, rx, ry, true) === true && setZoomId(null)
            }}>
            <div className="goro-img" key={zoomedPanel.img} style={{ backgroundImage: `url(${zoomedPanel.img})` }} />
            {p.walker && p.walker.panel === zoomedPanel.id && (
              <div className="goro-walker in-zoom"
                style={{ left: `${p.walker.rx}%`, top: `${p.walker.ry}%`, opacity: p.walker.fade ? 0 : 1,
                  transform: `translate(-50%,-92%) scaleX(${p.walker.facing ?? 1})` }}>
                <div className="wk-head" /><div className="wk-body" />
              </div>
            )}
            {[...(p.ringsNow ?? []), ...(p.rings ?? [])].filter((rg) => rg.panel === zoomedPanel.id).map((rg, i) => (
              <div key={`zring-${i}`} className="goro-ring in-zoom"
                style={{ left: `${rg.rx}%`, top: `${rg.ry}%` }} />
            ))}
            {p.renderOverlay?.(zoomedPanel.id, true)}
          </div>
        </div>
      )}

      {/* 开场定场镜头 */}
      {introPhase && p.intro && (
        <div className={`goro-intro ${introPhase === 'out' ? 'out' : ''}`}
          style={{ backgroundImage: `url(${p.intro.img})` }}
          onPointerDown={() => setIntroPhase('out')} />
      )}

      <div className="act4-vignette" />
      <div className="act4-grain" />
    </div>
  )
}
