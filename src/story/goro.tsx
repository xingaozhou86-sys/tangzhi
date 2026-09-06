import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import type { Pt } from './ui'

// ------------------------------------------------------------
// Goro —— 画中世界式画框场引擎 v3
// 格子墙：画挂在墙上的空框（slot）里。拖动一幅画——
//   · 到空框 → 挪过去
//   · 到另一幅画上面 → 两画合体（章节判定 stackWith）
//   · 落好后与相邻格的画内容对得上 → 两画自己连成一幅（光穿过缝）
// 点画入画（放大，内部可点/可滑）。没有文字说明书；
// 空画框自己邀请你，能连的缝从零秒开始漏光。
// ------------------------------------------------------------

export interface Port { side: 'l' | 'r' | 't' | 'b'; at: number; key: string }

export interface GSlot { x: number; y: number; w: number; col: number; row: number }

export interface GPanel {
  id: string
  img: string
  x: number; y: number; w: number   // 自由模式坐标（%）；格子模式下由 slot 决定
  slot?: number                     // 初始格子编号（slots 模式必填）
  ports?: Port[]
  zoomable?: boolean
  locked?: boolean                  // 钉在墙上：可入画，不可拖动
  stackWith?: string                // 拖到这幅画上面 → 触发 'stack' 合体
  hide?: boolean
}

export interface GWalker {
  panel: string                     // 他站在哪幅画里
  rx: number; ry: number            // 画内相对位置（%）
  facing?: 1 | -1
  fade?: boolean                    // 到了：淡出去，融进画里那个人
}

interface FieldProps {
  panels: GPanel[]
  fused: [string, string][]                       // 已连合对（受控）
  onFuse: (a: string, b: string, key: string) => void
  slots?: GSlot[]                                 // 格子墙模式（缺省为自由拖拽模式）
  onTap?: (id: string, rx: number, ry: number, zoomed: boolean) => void | boolean
  // ^ 画内点按返回 true → 合上画框（用于「点一下就把细节揭出来」）
  onSwipe?: (id: string, dx: number, dy: number, rx0: number, ry0: number) => void | boolean
  // ^ 画内拖拽（返回 true → 合上上画框，用于「把细节从画里揭出来」）
  onDrop?: (id: string, x: number, y: number) => void        // 自由模式拖放落点
  renderOverlay?: (id: string, zoomed: boolean) => React.ReactNode
  idleGlowIds?: string[]                          // 漏光/静置呼吸的画
  walker?: GWalker | null                         // 他：想过去的人
  rings?: { panel: string; rx: number; ry: number; shape?: 'circle' | 'frame' }[]
  // ^ 圆圈提示：画内这里可以点；frame = 包住整幅画的虚线框（指示「拖到这里」）
  light?: Pt | null
  lightAt?: { panel: string; rx: number; ry: number } | null   // 光黏在某幅画的画内坐标上
  lightColor?: string
  lightGlow?: string
  bg?: string
  intro?: { img: string; ms?: number }            // 开场定场镜头
  children?: React.ReactNode
}

const AR = 2 / 3

export function PanelField(p: FieldProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const slotsMode = !!p.slots
  const slotPos = (i: number): Pt => {
    const s = p.slots![i]
    return { x: s.x, y: s.y }
  }
  const [pos, setPos] = useState<Record<string, Pt>>(() =>
    Object.fromEntries(p.panels.map((g) => [
      g.id,
      slotsMode && g.slot != null ? slotPos(g.slot) : { x: g.x, y: g.y },
    ])))
  const [slotOf, setSlotOf] = useState<Record<string, number>>(() =>
    Object.fromEntries(p.panels.filter((g) => g.slot != null).map((g) => [g.id, g.slot!])))
  const [zoomId, setZoomId] = useState<string | null>(() => {
    try {
      const q = window.location.hash.split('?')[1]
      return q ? new URLSearchParams(q).get('zoom') : null
    } catch { return null }
  })
  const [idleHint, setIdleHint] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  // 拖动中靠近对的缝：两边一起亮起来（共振），玩家拖着画在场上找「哪条边有反应」
  const [near, setNear] = useState<{ a: string; ka: string; b: string; kb: string } | null>(null)
  const [burst, setBurst] = useState<{ x: number; y: number; vertical: boolean } | null>(null)
  const [kick, setKick] = useState(false)
  const prevFusedCount = useRef(0)
  const lastAct = useRef(Date.now())
  const zoomDown = useRef<{ x: number; y: number } | null>(null)
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; moved: number } | null>(null)

  // 章节中途新出现的画（如被照亮才现身的那幅）→ 补登记坐标/格子
  useEffect(() => {
    setPos((prev) => {
      let changed = false
      const n = { ...prev }
      p.panels.forEach((g) => {
        if (!n[g.id]) {
          n[g.id] = slotsMode && g.slot != null ? slotPos(g.slot) : { x: g.x, y: g.y }
          changed = true
        }
      })
      return changed ? n : prev
    })
    setSlotOf((prev) => {
      let changed = false
      const n = { ...prev }
      p.panels.forEach((g) => {
        if (g.slot != null && n[g.id] == null) { n[g.id] = g.slot; changed = true }
      })
      return changed ? n : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.panels])

  // 连合瞬间：光爆 + 光流穿过两幅画 + 画面轻轻一震
  useEffect(() => {
    if (p.fused.length > prevFusedCount.current && rootRef.current) {
      const [a, b] = p.fused[p.fused.length - 1]
      const ga = p.panels.find((g) => g.id === a)
      const gb = p.panels.find((g) => g.id === b)
      if (ga && gb) {
        const fa = window.innerWidth / window.innerHeight
        const pa = pos[ga.id] ?? { x: ga.x, y: ga.y }
        const pb = pos[gb.id] ?? { x: gb.x, y: gb.y }
        const ha = ga.w * fa * AR
        const hb = gb.w * fa * AR
        const cax = pa.x + ga.w / 2
        const cay = pa.y + ha / 2
        const cbx = pb.x + gb.w / 2
        const cby = pb.y + hb / 2
        setBurst({
          x: (cax + cbx) / 2,
          y: (cay + cby) / 2,
          vertical: Math.abs(cbx - cax) > Math.abs(cby - cay),
        })
        setKick(true)
        window.setTimeout(() => setKick(false), 350)
        window.setTimeout(() => setBurst(null), 2200)
      }
    }
    prevFusedCount.current = p.fused.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.fused])

  // 他走动时：脚步动画 1.8 秒（与位置过渡同步）
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

  // 开场定场镜头：整幅画铺满屏幕，缓缓推近，再退成墙上的画（点击跳过）
  const [introPhase, setIntroPhase] = useState<'in' | 'out' | null>(p.intro ? 'in' : null)
  useEffect(() => {
    if (!p.intro) return
    const t1 = window.setTimeout(() => setIntroPhase('out'), p.intro.ms ?? 2400)
    const t2 = window.setTimeout(() => setIntroPhase(null), (p.intro.ms ?? 2400) + 1300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 静置 9 秒 → 接口边缘开始强呼吸
  useEffect(() => {
    const t = window.setInterval(() => {
      if (Date.now() - lastAct.current > 9000) setIdleHint(true)
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const poke = () => { lastAct.current = Date.now(); setIdleHint(false) }

  const panelH = (g: GPanel, rect: DOMRect) => (g.w / 100) * rect.width * AR / rect.height * 100

  const complement = (s: Port['side']) => (s === 'l' ? 'r' : s === 'r' ? 'l' : s === 't' ? 'b' : 't')

  const fusedKeys = new Set<string>()
  p.fused.forEach(([a, b]) => {
    const pa = p.panels.find((g) => g.id === a)
    const pb = p.panels.find((g) => g.id === b)
    pa?.ports?.forEach((paPort) => pb?.ports?.forEach((pbPort) => {
      if (paPort.key === pbPort.key) fusedKeys.add(`${a}:${paPort.key}`)
      if (paPort.key === pbPort.key) fusedKeys.add(`${b}:${paPort.key}`)
    }))
  })
  const partnerOf = (id: string) => {
    const out: string[] = []
    p.fused.forEach(([a, b]) => { if (a === id) out.push(b); if (b === id) out.push(a) })
    return out
  }

  // ---- 格子墙：相邻格内容对得上 → 自动连合 ----
  const adjacencyScan = (so: Record<string, number>) => {
    if (!p.slots) return
    const entries = Object.entries(so)
    for (const [a, ia] of entries) {
      const ga = p.panels.find((g) => g.id === a)
      if (!ga || ga.hide) continue
      const sa = p.slots[ia]
      for (const [b, ib] of entries) {
        if (a === b) continue
        const gb = p.panels.find((g) => g.id === b)
        if (!gb || gb.hide) continue
        const sb = p.slots[ib]
        // b 在 a 右边：a.r ↔ b.l；b 在 a 下边：a.b ↔ b.t
        const horiz = sb.col === sa.col + 1 && sb.row === sa.row
        const vert = sb.row === sa.row + 1 && sb.col === sa.col
        if (!horiz && !vert) continue
        const sideA: Port['side'] = horiz ? 'r' : 'b'
        const sideB = complement(sideA)
        for (const paPort of ga.ports ?? []) {
          if (paPort.side !== sideA) continue
          if (fusedKeys.has(`${a}:${paPort.key}`)) continue
          for (const pbPort of gb.ports ?? []) {
            if (pbPort.side !== sideB || pbPort.key !== paPort.key) continue
            if (fusedKeys.has(`${b}:${pbPort.key}`)) continue
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
    drag.current = {
      id: g.id,
      sx: e.clientX, sy: e.clientY,
      ox: pos[g.id].x, oy: pos[g.id].y,
      moved: 0,
    }
    if (!g.locked) setDragging(g.id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || !rootRef.current) return
    const g0 = p.panels.find((x) => x.id === d.id)
    if (g0?.locked) return      // 钉在墙上的画：拖不动
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
    // 共振侦测：这组画的每条缝，是不是靠近了能跟它对上的那条边
    const ddx = nx - pos[d.id].x
    const ddy = ny - pos[d.id].y
    let found: { a: string; ka: string; b: string; kb: string } | null = null
    outer: for (const mid of ids) {
      const gm = p.panels.find((x) => x.id === mid)
      if (!gm || gm.hide) continue
      const pm0 = pos[mid] ?? { x: gm.x, y: gm.y }
      const pm = { x: pm0.x + ddx, y: pm0.y + ddy }
      const hm = panelH(gm, rect)
      for (const go of p.panels) {
        if (ids.includes(go.id) || go.hide) continue
        const po = pos[go.id]
        if (!po) continue
        const ho = panelH(go, rect)
        for (const ptM of gm.ports ?? []) {
          if (fusedKeys.has(`${mid}:${ptM.key}`)) continue
          for (const ptO of go.ports ?? []) {
            if (ptO.key !== ptM.key || ptO.side !== complement(ptM.side)) continue
            if (fusedKeys.has(`${go.id}:${ptO.key}`)) continue
            let ddx2 = 0, ddy2 = 0
            if (ptM.side === 'r' || ptM.side === 'l') {
              ddx2 = ptM.side === 'r' ? po.x - (pm.x + gm.w) : (po.x + go.w) - pm.x
              ddy2 = (po.y + (ptO.at / 100) * ho) - (pm.y + (ptM.at / 100) * hm)
              if (Math.abs(ddx2) < 14 && Math.abs(ddy2) < 18) { found = { a: mid, ka: ptM.key, b: go.id, kb: ptO.key }; break outer }
            } else {
              ddy2 = ptM.side === 'b' ? po.y - (pm.y + hm) : (po.y + ho) - pm.y
              ddx2 = (po.x + (ptO.at / 100) * go.w) - (pm.x + (ptM.at / 100) * gm.w)
              if (Math.abs(ddx2) < 16 && Math.abs(ddy2) < 14) { found = { a: mid, ka: ptM.key, b: go.id, kb: ptO.key }; break outer }
            }
          }
        }
      }
    }
    setNear(found)
  }

  // ---- 自由模式：磁吸拼画——两幅画的边靠近、接口对得上，就吸合连通 ----
  const magnetFuse = (g: GPanel, rect: DOMRect) => {
    const group = [g.id, ...partnerOf(g.id)]
    for (const mid of group) {
      const gm = p.panels.find((x) => x.id === mid)
      if (!gm || gm.hide) continue
      const pm = pos[mid]
      if (!pm) continue
      const hm = panelH(gm, rect)
      for (const go of p.panels) {
        if (group.includes(go.id) || go.hide) continue
        const po = pos[go.id]
        if (!po) continue
        const ho = panelH(go, rect)
        for (const ptM of gm.ports ?? []) {
          if (fusedKeys.has(`${mid}:${ptM.key}`)) continue
          for (const ptO of go.ports ?? []) {
            if (ptO.key !== ptM.key || ptO.side !== complement(ptM.side)) continue
            if (fusedKeys.has(`${go.id}:${ptO.key}`)) continue
            let dx = 0, dy = 0, limA = 0, limB = 0
            if (ptM.side === 'r' || ptM.side === 'l') {
              dx = ptM.side === 'r' ? po.x - (pm.x + gm.w) : (po.x + go.w) - pm.x
              dy = (po.y + (ptO.at / 100) * ho) - (pm.y + (ptM.at / 100) * hm)
              limA = 7; limB = 12
            } else {
              dy = ptM.side === 'b' ? po.y - (pm.y + hm) : (po.y + ho) - pm.y
              dx = (po.x + (ptO.at / 100) * go.w) - (pm.x + (ptM.at / 100) * gm.w)
              limA = 10; limB = 9
            }
            if (Math.abs(dx) > limA || Math.abs(dy) > limB) continue
            setPos((prev) => {
              const n = { ...prev }
              group.forEach((id) => { if (n[id]) n[id] = { x: n[id].x + dx, y: n[id].y + dy } })
              return n
            })
            window.setTimeout(() => fitGroup([...group, go.id]), 80)
            p.onFuse(mid, go.id, ptM.key)
            return
          }
        }
      }
    }
  }

  // 连合后的整幅画出屏 → 轻轻挪回来
  const fitGroup = (ids: string[]) => {
    const rect = rootRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos((prev) => {
      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9
      ids.forEach((id) => {
        const g = p.panels.find((x) => x.id === id)
        const pp = prev[id]
        if (!g || !pp) return
        const h = panelH(g, rect)
        minX = Math.min(minX, pp.x); minY = Math.min(minY, pp.y)
        maxX = Math.max(maxX, pp.x + g.w); maxY = Math.max(maxY, pp.y + h)
      })
      if (minX > 1e8) return prev
      let dx = 0, dy = 0
      if (minX < 2) dx = 2 - minX
      if (maxX > 98) dx = 98 - maxX
      if (minY < 3) dy = 3 - minY
      if (maxY > 95) dy = 95 - maxY
      if (!dx && !dy) return prev
      const n = { ...prev }
      ids.forEach((id) => { if (n[id]) n[id] = { x: n[id].x + dx, y: n[id].y + dy } })
      return n
    })
  }

  const bounceBack = (ids: string[]) => {
    setPos((prev) => {
      const n = { ...prev }
      ids.forEach((id) => {
        const g = p.panels.find((x) => x.id === id)
        if (!g) return
        n[id] = slotsMode && slotOf[id] != null ? slotPos(slotOf[id]) : { x: g.x, y: g.y }
      })
      return n
    })
  }

  const up = (g: GPanel) => (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    setDragging(null)
    setNear(null)
    if (!d || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()

    // 点按（非拖动）→ 入画或热点
    if (d.moved < 8) {
      const rx = ((e.clientX - rect.left) / rect.width * 100 - pos[g.id].x) / g.w * 100
      const h = panelH(g, rect)
      const ry = ((e.clientY - rect.top) / rect.height * 100 - pos[g.id].y) / h * 100
      if (g.zoomable) setZoomId(g.id)
      p.onTap?.(g.id, rx, ry, false)
      return
    }

    if (slotsMode && p.slots) {
      // ---- 格子落点判定 ----
      const group = [g.id, ...partnerOf(g.id)]
      const me = pos[g.id]
      const h = panelH(g, rect)
      const cx = me.x + g.w / 2
      const cy = me.y + h / 2
      const targetIdx = p.slots.findIndex((s) => {
        const sh = (s.w / 100) * rect.width * AR / rect.height * 100
        return Math.abs(cx - (s.x + s.w / 2)) < s.w * 0.62 && Math.abs(cy - (s.y + sh / 2)) < sh * 0.62
      })
      if (targetIdx < 0) { bounceBack(group); return }

      const occupant = Object.entries(slotOf).find(([id, si]) => si === targetIdx && !group.includes(id))?.[0]
      if (occupant) {
        const og = p.panels.find((x) => x.id === occupant)
        // 叠上去合体
        if (og && g.stackWith === occupant) {
          const tp = pos[occupant]
          setPos((prev) => ({ ...prev, [g.id]: { x: tp.x + (og.w - g.w) / 2, y: tp.y } }))
          p.onFuse(g.id, occupant, 'stack')
        } else {
          bounceBack(group)
        }
        return
      }

      // 整组平移：保持相对格位
      const from = p.slots[slotOf[g.id]]
      const to = p.slots[targetIdx]
      const dCol = to.col - from.col
      const dRow = to.row - from.row
      const targets: Record<string, number> = {}
      for (const id of group) {
        const cur = p.slots[slotOf[id]]
        const ti = p.slots.findIndex((s) => s.col === cur.col + dCol && s.row === cur.row + dRow)
        if (ti < 0) { bounceBack(group); return }
        const occ = Object.entries(slotOf).find(([oid, si]) => si === ti && !group.includes(oid))
        if (occ) { bounceBack(group); return }
        targets[id] = ti
      }
      const newSlotOf = { ...slotOf, ...targets }
      setSlotOf(newSlotOf)
      setPos((prev) => {
        const n = { ...prev }
        Object.entries(targets).forEach(([id, ti]) => { n[id] = slotPos(ti) })
        return n
      })
      // 落好后：相邻格自动连合
      adjacencyScan(newSlotOf)
      return
    }

    // ---- 自由模式 ----
    p.onDrop?.(g.id, pos[g.id].x, pos[g.id].y)
    // 堆叠合体：拖到指定画上面
    if (g.stackWith) {
      const target = p.panels.find((x) => x.id === g.stackWith)
      if (target && !target.hide) {
        const me = pos[g.id]
        const tp = pos[target.id]
        const cx1 = me.x + g.w / 2
        const cy1 = me.y + panelH(g, rect) / 2
        const cx2 = tp.x + target.w / 2
        const cy2 = tp.y + panelH(target, rect) / 2
        if (Math.abs(cx1 - cx2) < g.w * 0.4 && Math.abs(cy1 - cy2) < panelH(g, rect) * 0.4) {
          setPos((prev) => ({ ...prev, [g.id]: { x: tp.x + (target.w - g.w) / 2, y: tp.y + (panelH(target, rect) - panelH(g, rect)) / 2 } }))
          p.onFuse(g.id, target.id, 'stack')
        }
      }
    }
    // 边对边磁吸连合
    magnetFuse(g, rect)
  }

  const zoomedPanel = p.panels.find((g) => g.id === zoomId)
  const occupiedSlots = new Set(Object.values(slotOf))

  // 光的丝线：所有「对得上但还没连」的边之间，牵一根会流动的光
  const fa0 = window.innerWidth / window.innerHeight
  const portPos = (g: GPanel, pt: Port): Pt => {
    const pp = pos[g.id] ?? (slotsMode && g.slot != null ? slotPos(g.slot) : { x: g.x, y: g.y })
    const h = g.w * fa0 * AR
    if (pt.side === 'l') return { x: pp.x, y: pp.y + (pt.at / 100) * h }
    if (pt.side === 'r') return { x: pp.x + g.w, y: pp.y + (pt.at / 100) * h }
    if (pt.side === 't') return { x: pp.x + (pt.at / 100) * g.w, y: pp.y }
    return { x: pp.x + (pt.at / 100) * g.w, y: pp.y + h }
  }
  const threads: { x1: number; y1: number; x2: number; y2: number }[] = []
  const outward = (s: Port['side']): Pt =>
    s === 'l' ? { x: -3.2, y: 0 } : s === 'r' ? { x: 3.2, y: 0 }
    : s === 't' ? { x: 0, y: -3.2 } : { x: 0, y: 3.2 }
  p.panels.forEach((ga, i) => p.panels.forEach((gb, j) => {
    if (j <= i || ga.hide || gb.hide) return
    ;(ga.ports ?? []).forEach((pta) => (gb.ports ?? []).forEach((ptb) => {
      if (pta.key !== ptb.key || pta.side !== complement(ptb.side)) return
      if (fusedKeys.has(`${ga.id}:${pta.key}`) || fusedKeys.has(`${gb.id}:${ptb.key}`)) return
      // 两条边的光各自向外伸出一截，互相够——不会穿过画面本身
      for (const [g, pt] of [[ga, pta], [gb, ptb]] as [GPanel, Port][]) {
        const A = portPos(g, pt)
        const o = outward(pt.side)
        threads.push({ x1: A.x, y1: A.y, x2: A.x + o.x, y2: A.y + o.y })
      }
    }))
  }))

  return (
    <div ref={rootRef} className={`goro-field ${dragging ? 'dragging' : ''} ${kick ? 'kick' : ''}`} onPointerDown={poke}>
      {p.bg && <div className="goro-bg" style={{ backgroundImage: `url(${p.bg})` }} />}

      {/* 空画框：自己邀请你 */}
      {p.slots?.map((s, i) => {
        if (occupiedSlots.has(i)) return null
        return (
          <div key={`slot-${i}`} className="goro-slot"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, aspectRatio: '3/2' }} />
        )
      })}

      {p.panels.map((g, gi) => {
        if (g.hide) return null
        const pp = pos[g.id] ?? (slotsMode && g.slot != null ? slotPos(g.slot) : { x: g.x, y: g.y })
        const idleGlow = idleHint && (p.idleGlowIds ?? []).includes(g.id)
        const hintedPanel = (p.idleGlowIds ?? []).includes(g.id)
        return (
          <div key={g.id}
            className={`goro-panel ${zoomId === g.id ? 'gone' : ''} ${idleGlow ? 'hinted' : ''} ${dragging === g.id ? 'drag' : ''}`}
            onPointerDown={down(g)} onPointerMove={move} onPointerUp={up(g)}
            style={{ left: `${pp.x}%`, top: `${pp.y}%`, width: `${g.w}%`, aspectRatio: '3/2',
              animationDelay: `${gi * 0.16}s` }}>
            <div className="goro-img" key={g.img} style={{ backgroundImage: `url(${g.img})` }} />
            {/* 接口漏光：被点名的画从零秒开始渗光；静置后全场接口呼吸；拖动靠近时共振增亮 */}
            {(idleHint || hintedPanel || dragging) && (g.ports ?? []).filter((pt) => !fusedKeys.has(`${g.id}:${pt.key}`)).map((pt, i) => {
              const isNear = !!near && ((near.a === g.id && near.ka === pt.key) || (near.b === g.id && near.kb === pt.key))
              return (
              <div key={i} className={`goro-port side-${pt.side} ${idleHint ? '' : 'leak'} ${isNear ? 'near' : ''}`} style={
                pt.side === 'l' || pt.side === 'r'
                  ? { [pt.side === 'l' ? 'left' : 'right']: 0, top: `${pt.at}%` }
                  : { [pt.side === 't' ? 'top' : 'bottom']: 0, left: `${pt.at}%` } as React.CSSProperties
              } />
              )
            })}
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

      {p.children}

      {/* 光的丝线：对得上的两幅画之间，牵着一根会流动的光——它们该在一起 */}
      {threads.length > 0 && !zoomId && (
        <svg className="goro-threads" viewBox="0 0 100 100" preserveAspectRatio="none">
          {threads.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              style={{ stroke: 'rgba(255,216,145,0.9)', strokeWidth: 0.3,
                strokeDasharray: '0.45 0.5', strokeLinecap: 'round' }} />
          ))}
        </svg>
      )}

      {/* 共振光桥：拖动靠近时，两条对的缝之间拉起一根亮线——「就是这里」 */}
      {near && !zoomId && (() => {
        const ga = p.panels.find((g) => g.id === near.a)
        const gb = p.panels.find((g) => g.id === near.b)
        const pa = ga?.ports?.find((pt) => pt.key === near.ka)
        const pb = gb?.ports?.find((pt) => pt.key === near.kb)
        if (!ga || !gb || !pa || !pb) return null
        const A = portPos(ga, pa)
        const B = portPos(gb, pb)
        return (
          <svg className="goro-nearline" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} />
          </svg>
        )
      })()}

      {/* 圆圈提示：画内这里可以点（场级，跟随画的位置） */}
      {!zoomId && (p.rings ?? []).map((rg, i) => {
        const g = p.panels.find((x) => x.id === rg.panel)
        if (!g || g.hide) return null
        const pp = pos[g.id] ?? (slotsMode && g.slot != null ? slotPos(g.slot) : { x: g.x, y: g.y })
        const h = g.w * fa0 * AR
        if (rg.shape === 'frame') {
          return (
            <div key={`ring-${i}`} className="goro-ring frame"
              style={{ left: `${pp.x - 1.6}%`, top: `${pp.y - 1.6}%`,
                width: `${g.w + 3.2}%`, height: `calc(${h + 3.2}% )` }} />
          )
        }
        return (
          <div key={`ring-${i}`} className="goro-ring"
            style={{ left: `${pp.x + (rg.rx / 100) * g.w}%`, top: `${pp.y + (rg.ry / 100) * h}%` }} />
        )
      })}

      {/* 光粒：这个游戏的主角。它停在哪，下一步就在哪 */}
      {(() => {
        let lp: Pt | null = p.light ?? null
        if (p.lightAt) {
          const g = p.panels.find((x) => x.id === p.lightAt!.panel)
          if (g && !g.hide) {
            const pp = pos[g.id] ?? (slotsMode && g.slot != null ? slotPos(g.slot) : { x: g.x, y: g.y })
            const fa = window.innerWidth / window.innerHeight
            const h = g.w * fa * AR
            lp = { x: pp.x + (p.lightAt.rx / 100) * g.w, y: pp.y + (p.lightAt.ry / 100) * h }
          } else lp = null
        }
        if (!lp) return null
        return (
          <div className={`goro-orb ${idleHint ? 'waiting' : ''}`} style={{
            left: `${lp.x}%`, top: `${lp.y}%`,
            background: `radial-gradient(circle, #fffbe8 0%, ${p.lightColor ?? '#ffd76a'} 45%, rgba(0,0,0,0) 72%)`,
            filter: `drop-shadow(0 0 18px ${p.lightGlow ?? 'rgba(255,200,90,0.9)'})`,
          }} />
        )
      })()}

      {/* 他：想过去的人（场级渲染，可以跨过两幅画的缝） */}
      {p.walker && (() => {
        const g = p.panels.find((x) => x.id === p.walker!.panel)
        if (!g || g.hide || zoomId) return null
        const pp = pos[g.id] ?? (slotsMode && g.slot != null ? slotPos(g.slot) : { x: g.x, y: g.y })
        const fa = window.innerWidth / window.innerHeight
        const h = g.w * fa * AR
        const fx = pp.x + (p.walker.rx / 100) * g.w
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

      {/* 入画：画框放大居中，内部可点/可滑 */}
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
                  if (pulled) setZoomId(null)   // 从画里揭下一幅新画 → 合上画框
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
            {(p.rings ?? []).filter((rg) => rg.panel === zoomedPanel.id).map((rg, i) => (
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
