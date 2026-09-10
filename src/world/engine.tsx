import { useEffect, useRef, useState } from 'react'
import type { Cell, ChapterDef, Layer, PanelDef, PanelState, Side, Step, View } from './types'
import './engine.css'

// ------------------------------------------------------------
// 《糖纸》v4 · 相机引擎
// 每幅画的后面是一台真正的相机：点哪里，镜头就推向哪里。
// 有深处，就穿过去；没有，就轻轻弹回来。探索本身就是玩法。
// 全部动画只走 transform / opacity（GPU），不再有一卡一卡。
// ------------------------------------------------------------

const OPP: Record<Side, Side> = { l: 'r', r: 'l', t: 'b', b: 't' }
const PAD = 1.1
const GAP = 1.4
const CW = (100 - PAD * 2 - GAP) / 2

function cellRect(c: Cell) {
  const col = c % 2
  const row = Math.floor(c / 2)
  return { x: PAD + col * (CW + GAP), y: PAD + row * (CW + GAP), w: CW, h: CW }
}
function edgeMid(c: Cell, s: Side) {
  const r = cellRect(c)
  if (s === 'l') return { x: r.x, y: r.y + r.h / 2 }
  if (s === 'r') return { x: r.x + r.w, y: r.y + r.h / 2 }
  if (s === 't') return { x: r.x + r.w / 2, y: r.y }
  return { x: r.x + r.w / 2, y: r.y + r.h }
}
function neighbor(c: Cell, s: Side): Cell | null {
  const col = c % 2
  const row = Math.floor(c / 2)
  const nc = col + (s === 'l' ? -1 : s === 'r' ? 1 : 0)
  const nr = row + (s === 't' ? -1 : s === 'b' ? 1 : 0)
  if (nc < 0 || nc > 1 || nr < 0 || nr > 1) return null
  return (nr * 2 + nc) as Cell
}
function cellAt(x: number, y: number): Cell | null {
  for (let c = 0; c < 4; c++) {
    const r = cellRect(c as Cell)
    if (x >= r.x - 1 && x <= r.x + r.w + 1 && y >= r.y - 1 && y <= r.y + r.h + 1) return c as Cell
  }
  return null
}
function play(src: string, vol = 0.4) {
  const a = new Audio(src)
  a.volume = vol
  a.play().catch(() => {})
}
function toState(d: PanelDef): PanelState {
  return {
    id: d.id, cell: d.cell, dim: !!d.dim, lit: false, dive: [],
    layers: d.layers ?? [{ img: d.img, edges: d.edges, tint: d.tint, year: d.year, spots: d.spots }],
  }
}
function curView(p: PanelState): View {
  return p.dive.length ? p.dive[p.dive.length - 1] : p.layers[0]
}
/** 视野坐标 → 面板显示坐标（crop 为方形时严格成立） */
function viewToPanel(v: View, fx: number, fy: number) {
  if (!v.crop) return { x: fx, y: fy, inside: true }
  const x = ((fx - v.crop.x) / v.crop.w) * 100
  const y = ((fy - v.crop.y) / v.crop.h) * 100
  return { x, y, inside: x >= -8 && x <= 108 && y >= -8 && y <= 108 }
}

interface Beam { id: number; x1: number; y1: number; x2: number; y2: number }
interface Look { panel: string; x: number; y: number }

export function Board({ def, onDone, onCollect }: { def: ChapterDef; onDone: () => void; onCollect: () => void }) {
  const [panels, setPanels] = useState<PanelState[]>(() => def.panels.map(d => ({ ...toState(d), born: true })))
  const [done, setDone] = useState<string[]>([])
  const [hint, setHint] = useState(0)
  const [beams, setBeams] = useState<Beam[]>([])
  const [hero, setHero] = useState(def.hero ?? null)
  const [through, setThrough] = useState<string | null>(def.panels[0]?.img ?? null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [hoverCell, setHoverCell] = useState<Cell | null>(null)
  const [joined, setJoined] = useState<string[]>([])
  const [morph, setMorph] = useState<Record<string, View>>({})
  const [look, setLook] = useState<Look | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const panelsRef = useRef<PanelState[]>(panels)
  const doneRef = useRef<Set<string>>(new Set())
  const heroRef = useRef(hero)
  const idle1 = useRef<number>(0)
  const idle2 = useRef<number>(0)
  const lookTimer = useRef<number>(0)
  const beamSeq = useRef(0)
  const burstSeq = useRef(0)
  const [bursts, setBursts] = useState<Array<{ id: number; panel: string; kind: string; year?: string }>>([])
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; strong: boolean }>>([])
  const [focus, setFocus] = useState<string | null>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number; hot: boolean; down: boolean } | null>(null)
  const [flies, setFlies] = useState<number[]>([])
  const rippleSeq = useRef(0)
  const flySeq = useRef(0)

  const ripple = (x: number, y: number, strong: boolean) => {
    const id = ++rippleSeq.current
    setRipples(rs => [...rs, { id, x, y, strong }])
    window.setTimeout(() => setRipples(rs => rs.filter(r => r.id !== id)), 750)
  }
  panelsRef.current = panels
  heroRef.current = hero

  const poke = () => {
    window.clearTimeout(idle1.current)
    window.clearTimeout(idle2.current)
    setHint(0)
    idle1.current = window.setTimeout(() => setHint(h => Math.max(h, 1)), 18000)
    idle2.current = window.setTimeout(() => setHint(2), 40000)
  }

  const availNow = () =>
    def.steps.filter(s => !doneRef.current.has(s.id) && (s.after ?? []).every(a => doneRef.current.has(a)))

  // 本章所有图一次性预载，消灭中途卡顿
  useEffect(() => {
    const urls = new Set<string>()
    const grab = (v?: View) => { if (v?.img) urls.add(v.img) }
    for (const d of def.panels) { grab(d); (d.layers ?? []).forEach(grab) }
    for (const s of def.steps) {
      if (s.fx.spawn) { grab(s.fx.spawn.def); (s.fx.spawn.def.layers ?? []).forEach(grab); (s.fx.spawn.def.spots ?? []).length }
      if (s.fx.pushView) grab(s.fx.pushView.view)
      if (s.fx.swap?.img) urls.add(s.fx.swap.img)
      if (s.fx.swapView?.img) urls.add(s.fx.swapView.img)
    }
    urls.forEach(u => { const im = new Image(); im.src = u })
  }, [def.id])

  useEffect(() => {
    const t = window.setTimeout(() => setThrough(null), 1150)
    idle1.current = window.setTimeout(() => setHint(1), 18000)
    idle2.current = window.setTimeout(() => setHint(2), 40000)
    return () => { window.clearTimeout(t); window.clearTimeout(idle1.current); window.clearTimeout(idle2.current) }
  }, [def.id])

  useEffect(() => {
    if (!def.ambient) return
    const a = new Audio(def.ambient)
    a.loop = true
    a.volume = 0
    a.play().catch(() => {})
    let v = 0
    const t = window.setInterval(() => { v = Math.min(0.12, v + 0.015); a.volume = v }, 120)
    return () => { window.clearInterval(t); a.pause() }
  }, [def.ambient])

  const fire = (step: Step) => {
    if (doneRef.current.has(step.id)) return
    doneRef.current.add(step.id)
    setDone(Array.from(doneRef.current))
    poke()
    const fx = step.fx
    if (fx.sfx) play(fx.sfx, 0.5)
    if (fx.music) play(fx.music, 0.5)
    if (fx.burst || fx.yearFlash) {
      const pid = fx.burstPanel ?? (step.cond as { panel?: string }).panel ?? (step.cond as { b?: string }).b ?? def.panels[0].id
      const id = ++burstSeq.current
      setBursts(bs => [...bs, { id, panel: pid, kind: fx.burst ?? 'year', year: fx.yearFlash }])
      window.setTimeout(() => setBursts(bs => bs.filter(x => x.id !== id)), 2200)
    }
    // 穿画运镜：世界把你吸进去——这幅画亮起放大，其余退入暗处
    if (fx.pushView) {
      const pid = fx.pushView.panel
      setFocus(pid)
      window.setTimeout(() => setFocus(f => (f === pid ? null : f)), 1050)
    }
    let delay = 0

    const cond = step.cond
    if (fx.walkThrough) {
      const pts = fx.walkThrough
        .map(id => panelsRef.current.find(q => q.id === id))
        .filter((q): q is PanelState => !!q)
      pts.forEach((pt, i) => {
        const x = i === 0 ? 14 : i === pts.length - 1 ? 86 : 50
        window.setTimeout(() => setHero({ panel: pt.id, x, y: 76 }), 250 + i * 950)
      })
      delay = Math.max(delay, 250 + pts.length * 950)
    }
    if (cond.kind === 'overlay') {
      const b = panelsRef.current.find(q => q.id === cond.b)
      if (b) { setJoined([b.id]); window.setTimeout(() => setJoined([]), 1700) }
    }
    if (cond.kind === 'connect') {
      const a = panelsRef.current.find(q => q.id === cond.a)
      const b = panelsRef.current.find(q => q.id === cond.b)
      if (a && b) {
        const p1 = edgeMid(a.cell, cond.aside)
        const p2 = edgeMid(b.cell, OPP[cond.aside])
        const id = ++beamSeq.current
        setBeams(bs => [...bs, { id, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }])
        window.setTimeout(() => setBeams(bs => bs.filter(x => x.id !== id)), 1800)
        setJoined([a.id, b.id])
        window.setTimeout(() => setJoined([]), 1700)
        if (fx.walk) {
          delay = 1100
          const h = heroRef.current
          if (h && h.panel === a.id) {
            const nx = cond.aside === 'r' ? 12 : cond.aside === 'l' ? 88 : 50
            const ny = cond.aside === 'b' ? 14 : cond.aside === 't' ? 86 : 64
            window.setTimeout(() => setHero({ panel: b.id, x: nx, y: ny }), 260)
          } else if (h && h.panel === b.id) {
            const nx = cond.aside === 'r' ? 88 : cond.aside === 'l' ? 12 : 50
            const ny = cond.aside === 'b' ? 86 : cond.aside === 't' ? 14 : 64
            window.setTimeout(() => setHero({ panel: a.id, x: nx, y: ny }), 260)
          }
        }
      }
    }

    window.setTimeout(() => {
      const applyFx = () => {
        const morphIn = (pid: string, fn: (p: PanelState) => PanelState) => {
          const p = panelsRef.current.find(q => q.id === pid)
          if (!p) return
          setMorph(m => ({ ...m, [pid]: curView(p) }))
          window.setTimeout(() => setMorph(m => { const n = { ...m }; delete n[pid]; return n }), 850)
          setPanels(prev => prev.map(q => q.id === pid ? fn(q) : q))
        }
        setPanels(prev => {
          let next = prev
          if (fx.spawn) {
            const d = fx.spawn.def
            const pref = fx.spawn.cells ?? [0, 1, 2, 3]
            const taken = new Set(next.map(q => q.cell))
            const cell = pref.find(c => !taken.has(c))
            if (cell != null) next = [...next, { ...toState(d), cell, born: true }]
          }
          if (fx.swap) next = next.map(q => q.id === fx.swap!.panel
            ? { ...q, dim: fx.swap!.undim ? false : q.dim, layers: [{ ...q.layers[0], img: fx.swap!.img }], dive: [] } : q)
          if (fx.setEdges) next = next.map(q => q.id === fx.setEdges!.panel
            ? { ...q, layers: [{ ...q.layers[0], edges: fx.setEdges!.edges }] } : q)
          if (fx.glow) next = next.map(q => q.id === fx.glow ? { ...q, lit: true } : q)
          if (fx.undim) next = next.map(q => q.id === fx.undim ? { ...q, dim: false } : q)
          if (fx.popView) next = next.map(q => q.id === fx.popView!.panel ? { ...q, dive: q.dive.slice(0, -1) } : q)
          return next
        })
        if (fx.popView && heroRef.current?.panel === fx.popView.panel) {
          setHero({ panel: fx.popView.panel, x: 50, y: 72 })
        }
        if (fx.pushView) {
          morphIn(fx.pushView.panel, q => {
            const top = q.dive[q.dive.length - 1]
            const intermediate = top && top.crop && !top.spots
            return { ...q, extractId: fx.pushView!.extractId, dive: [...(intermediate ? q.dive.slice(0, -1) : q.dive), fx.pushView!.view] }
          })
          if (heroRef.current?.panel === fx.pushView.panel) {
            setHero({ panel: fx.pushView.panel, x: 50, y: 74 })
          }
        }
        if (fx.swapView) morphIn(fx.swapView.panel, q => {
          if (!q.dive.length) return { ...q, layers: [{ ...q.layers[0], img: fx.swapView!.img ?? q.layers[0].img, tint: fx.swapView!.tint ?? q.layers[0].tint, spots: fx.swapView!.spots ?? q.layers[0].spots }] }
          const top = q.dive[q.dive.length - 1]
          return { ...q, dive: [...q.dive.slice(0, -1), { ...top, img: fx.swapView!.img ?? top.img, tint: fx.swapView!.tint ?? top.tint, spots: fx.swapView!.spots ?? top.spots }] }
        })
        if (fx.collect) {
          play('/sfx/pencil.wav', 0.35)
          const id = ++flySeq.current
          setFlies(fs => [...fs, id])
          window.setTimeout(() => setFlies(fs => fs.filter(f => f !== id)), 1300)
          onCollect()
        }
        if (fx.done) window.setTimeout(onDone, 1700)
      }
      if (fx.spawn) {
        setThrough(fx.spawn.def.img)
        window.setTimeout(() => { setThrough(null); applyFx() }, 1150)
      } else {
        applyFx()
      }
    }, delay)
  }

  // 连画扫描 + 排序谜题 + auto
  useEffect(() => {
    const t = window.setTimeout(() => {
      for (const s of availNow()) {
        const c = s.cond
        if (c.kind === 'auto') { fire(s); continue }
        if (c.kind === 'arrange') {
          const okArr = c.order.every((pid, i) =>
            panelsRef.current.find(q => q.id === pid)?.cell === c.cells[i])
          if (okArr) fire(s)
          continue
        }
        if (c.kind !== 'connect') continue
        const a = panelsRef.current.find(q => q.id === c.a)
        const b = panelsRef.current.find(q => q.id === c.b)
        if (!a || !b) continue
        if (neighbor(a.cell, c.aside) !== b.cell) continue
        const ka = a.layers[0].edges?.[c.aside]
        const kb = b.layers[0].edges?.[OPP[c.aside]]
        if (ka && ka === kb) fire(s)
      }
    }, 90)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panels, done])

  // ---------- 拖拽：挪 / 揭 / 叠 / 换 ----------

  const dropPanel = (p: PanelState, pt: { x: number; y: number }) => {
    const target = cellAt(pt.x, pt.y)
    if (target == null || target === p.cell) return
    const cur = panelsRef.current.find(q => q.id === p.id) ?? p
    const occupant = panelsRef.current.find(q => q.id !== cur.id && q.cell === target)

    if (occupant) {
      const ov = availNow().find(s => s.cond.kind === 'overlay' && s.cond.a === cur.id && s.cond.b === occupant.id)
      if (ov) {
        setPanels(prev => prev.filter(q => q.id !== cur.id))
        if (heroRef.current?.panel === cur.id) setHero({ panel: occupant.id, x: 50, y: 68 })
        fire(ov)
        return
      }
    }

    // 取出世界：钻进过深处的画拖到空框，里面的世界就立成一幅独立的画
    if (!occupant && cur.dive.length > 0 && cur.extractId && !panelsRef.current.some(q => q.id === cur.extractId)) {
      const v = curView(cur)
      const nid = cur.extractId
      const topLayer: Layer = { img: v.img, edges: (v as { edges?: PanelDef['edges'] }).edges, tint: v.tint, year: v.year, spots: v.spots }
      setPanels(prev => prev
        .map(q => q.id === cur.id ? { ...q, dive: q.dive.slice(0, -1), extractId: undefined } : q)
        .concat({
          id: nid, cell: target, dive: [], dim: false, lit: false, born: true,
          layers: v.under ? [topLayer, v.under] : [topLayer],
        }))
      if (heroRef.current?.panel === cur.id) setHero({ panel: nid, x: 50, y: 70 })
      play('/story/sfx-chime.mp3', 0.45)
      poke()
      return
    }

    // 揭画：撕掉的那一年直接飞走，不占格子
    const peelStep = availNow().find(s => s.cond.kind === 'peel' && s.cond.panel === cur.id)
    if (peelStep && cur.layers.length > 1 && cur.dive.length === 0) {
      setPanels(prev => prev.map(q => q.id === cur.id ? { ...q, layers: q.layers.slice(1), dive: [] } : q))
      setJoined([cur.id])
      window.setTimeout(() => setJoined([]), 900)
      fire(peelStep)
      return
    }

    if (occupant) {
      setPanels(prev => prev.map(q =>
        q.id === cur.id ? { ...q, cell: target } : q.id === occupant.id ? { ...q, cell: cur.cell } : q))
      play('/sfx/wooddrop.wav', 0.32)
      poke()
      return
    }
    setPanels(prev => prev.map(q => q.id === cur.id ? { ...q, cell: target } : q))
    play('/sfx/wooddrop.wav', 0.32)
    poke()
  }

  // ---------- 点画：探索 / 入画 / 触发 ----------

  const clickSpot = (panelId: string, spotId: string) => {
    const s = availNow().find(st =>
      (st.cond.kind === 'spot' || st.cond.kind === 'dive') &&
      st.cond.panel === panelId && st.cond.spot === spotId)
    if (!s) return
    const p = panelsRef.current.find(q => q.id === panelId)
    if (!p) return
    const v = curView(p)
    const sp = v.spots?.find(x => x.id === spotId)
    if (sp) setHero({ panel: panelId, x: sp.x + sp.w / 2, y: Math.min(92, sp.y + sp.h / 2 + 10) })

    const isDive = s.cond.kind === 'dive'
    if (isDive && s.fx.pushView && sp) {
      // 相机先推近这一块，再穿到另一个空间
      const side = Math.min(sp.w, sp.h)
      const cropView: View = {
        img: v.img,
        crop: { x: sp.x + sp.w / 2 - side / 2, y: sp.y + sp.h / 2 - side / 2, w: side, h: side },
        tint: v.tint,
      }
      window.setTimeout(() => {
        setPanels(prev => prev.map(q => q.id === panelId ? { ...q, dive: [...q.dive, cropView] } : q))
        window.setTimeout(() => fire(s), 560)
      }, 380)
    } else {
      fire(s) // 立即响应，他同时走过去，不再互相等待
    }
  }

  /** 点空处：镜头探一下又弹回来——探索的手感 */
  const peek = (panelId: string, x: number, y: number) => {
    window.clearTimeout(lookTimer.current)
    setLook({ panel: panelId, x, y })
    play('/sfx/wooddrop.wav', 0.08)
    lookTimer.current = window.setTimeout(() => setLook(null), 620)
  }

  /** 指针落在画的哪个圆点上（含 crop 换算） */
  const spotAt = (p: PanelState, fx: number, fy: number) => {
    const v = curView(p)
    let vx = fx, vy = fy
    if (v.crop) { vx = v.crop.x + (fx / 100) * v.crop.w; vy = v.crop.y + (fy / 100) * v.crop.h }
    return (v.spots ?? []).find(s => vx >= s.x && vx <= s.x + s.w && vy >= s.y && vy <= s.y + s.h) ?? null
  }

  const goBack = (panelId: string) => {
    const p = panelsRef.current.find(q => q.id === panelId)
    if (!p || !p.dive.length) return
    poke()
    play('/story/sfx-peel.mp3', 0.22)
    const backStep = availNow().find(s => s.cond.kind === 'back' && s.cond.panel === panelId)
    setPanels(prev => prev.map(q => q.id === panelId ? { ...q, dive: q.dive.slice(0, -1) } : q))
    if (heroRef.current?.panel === panelId) setHero({ panel: panelId, x: 50, y: 72 })
    if (backStep) fire(backStep)
  }

  const onPanelDown = (e: React.PointerEvent, p: PanelState) => {
    e.preventDefault()
    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY }
    let moved = false
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 9) moved = true
      if (moved) {
        const px = (ev.clientX - rect.left) / rect.width * 100
        const py = (ev.clientY - rect.top) / rect.height * 100
        setDrag({
          id: p.id,
          x: Math.max(-4, Math.min(100 - CW + 4, px - CW / 2)),
          y: Math.max(-4, Math.min(100 - CW + 4, py - CW / 2)),
        })
        setHoverCell(cellAt(px, py))
      }
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDrag(null)
      setHoverCell(null)
      if (!moved) {
        const r = cellRect(p.cell)
        const px = (ev.clientX - rect.left) / rect.width * 100
        const py = (ev.clientY - rect.top) / rect.height * 100
        const fx = ((px - r.x) / r.w) * 100
        const fy = ((py - r.y) / r.h) * 100
        const sp = spotAt(p, fx, fy)
        if (sp) { ripple(px, py, true); clickSpot(p.id, sp.id) }
        else { poke(); ripple(px, py, false); peek(p.id, fx, fy) }
        return
      }
      dropPanel(p, {
        x: (ev.clientX - rect.left) / rect.width * 100,
        y: (ev.clientY - rect.top) / rect.height * 100,
      })
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // ---------- 渲染数据 ----------

  const avail = def.steps.filter(s => !done.includes(s.id) && (s.after ?? []).every(a => done.includes(a)))
  const liveEdges: Array<{ id: string; side: Side }> = []
  for (const s of avail) {
    if (s.cond.kind === 'connect') {
      liveEdges.push({ id: s.cond.a, side: s.cond.aside }, { id: s.cond.b, side: OPP[s.cond.aside] })
    }
  }
  const spotStepsFor = (pid: string) =>
    avail.filter(s => (s.cond.kind === 'spot' || s.cond.kind === 'dive') && s.cond.panel === pid)
  const peelable = (pid: string) =>
    avail.some(s => s.cond.kind === 'peel' && s.cond.panel === pid)

  const hintBeams: Beam[] = []
  if (hint >= 2) {
    for (const s of avail) {
      if (s.cond.kind !== 'connect') continue
      const c = s.cond
      const a = panels.find(q => q.id === c.a)
      const b = panels.find(q => q.id === c.b)
      if (!a || !b) continue
      if (neighbor(a.cell, c.aside) === b.cell) continue
      const ka = a.layers[0].edges?.[c.aside]
      const kb = b.layers[0].edges?.[OPP[c.aside]]
      if (!ka || ka !== kb) continue
      const m1 = edgeMid(a.cell, c.aside)
      const m2 = edgeMid(b.cell, OPP[c.aside])
      hintBeams.push({ id: -1 - hintBeams.length, x1: m1.x, y1: m1.y, x2: m2.x, y2: m2.y })
    }
    // 排序谜题的深提示：相邻两个年头之间拉起光路
    for (const s of avail) {
      if (s.cond.kind !== 'arrange') continue
      const { order } = s.cond
      for (let i = 0; i < order.length - 1; i++) {
        const a = panels.find(q => q.id === order[i])
        const b = panels.find(q => q.id === order[i + 1])
        if (!a || !b) continue
        const ra = cellRect(a.cell)
        const rb = cellRect(b.cell)
        hintBeams.push({
          id: -10 - hintBeams.length,
          x1: ra.x + ra.w / 2, y1: ra.y + ra.h - 4,
          x2: rb.x + rb.w / 2, y2: rb.y + rb.h - 4,
        })
      }
    }
  }

  const resonance = (() => {
    if (!drag || hoverCell == null) return null
    const p = panels.find(q => q.id === drag.id)
    if (!p) return null
    const occupant = panels.find(q => q.id !== p.id && q.cell === hoverCell)
    if (occupant) {
      const ov = avail.find(s => s.cond.kind === 'overlay' && s.cond.a === p.id && s.cond.b === occupant.id)
      if (ov) {
        const r = cellRect(occupant.cell)
        return { x1: drag.x + CW / 2, y1: drag.y + CW / 2, x2: r.x + r.w / 2, y2: r.y + r.h / 2, other: occupant.id }
      }
      return null
    }
    for (const s of avail) {
      if (s.cond.kind !== 'connect') continue
      const c = s.cond
      const tryPair = (selfId: string, otherId: string, selfCell: Cell, side: Side) => {
        const other = panels.find(q => q.id === otherId)
        if (!other || neighbor(selfCell, side) !== other.cell) return null
        const k1 = selfId === c.a ? p.layers[0].edges?.[side] : other.layers[0].edges?.[side]
        const k2 = selfId === c.a ? other.layers[0].edges?.[OPP[side]] : p.layers[0].edges?.[OPP[side]]
        if (!k1 || k1 !== k2) return null
        const m1 = edgeMid(selfCell, side)
        const m2 = edgeMid(other.cell, OPP[side])
        return { x1: m1.x, y1: m1.y, x2: m2.x, y2: m2.y, other: otherId }
      }
      if (c.a === p.id) { const r = tryPair(c.a, c.b, hoverCell, c.aside); if (r) return r }
      if (c.b === p.id) { const r = tryPair(c.b, c.a, hoverCell, OPP[c.aside]); if (r) return r }
    }
    return null
  })()

  const linkedPairs = def.steps
    .filter(s => done.includes(s.id) && s.cond.kind === 'connect')
    .map(s => s.cond as { kind: 'connect'; a: string; aside: Side; b: string })

  /** 相机变换：crop 视野 / 探索探头 / 全景 */
  const cameraOf = (p: PanelState, v: View): React.CSSProperties => {
    let s = 1, cx = 50, cy = 50
    if (v.crop) {
      s = 100 / Math.min(v.crop.w, v.crop.h)
      cx = v.crop.x + v.crop.w / 2
      cy = v.crop.y + v.crop.h / 2
    } else if (look && look.panel === p.id) {
      s = 1.55
      cx = look.x
      cy = look.y
    }
    return { transform: `translate(${50 - s * cx}%, ${50 - s * cy}%) scale(${s})` }
  }

  return (
    <div
      className="board-wrap"
      onPointerMove={e => {
        const rect = boardRef.current?.getBoundingClientRect()
        if (!rect) return
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        setCursor(c => ({ x, y, hot: c?.hot ?? false, down: c?.down ?? false }))
      }}
      onPointerDown={() => setCursor(c => (c ? { ...c, down: true } : c))}
      onPointerUp={() => setCursor(c => (c ? { ...c, down: false } : c))}
      onPointerLeave={() => setCursor(null)}
    >
      {def.weather && <div className={`weather weather-${def.weather}`} />}
      <div className={`board ${focus ? 'hasfocus' : ''}`} ref={boardRef}>
        {([0, 1, 2, 3] as Cell[]).map(c => {
          const r = cellRect(c)
          // 拖着一幅"里面有世界"的画悬在空框上时，空框会亮起来等你松手
          const dp = drag ? panels.find(q => q.id === drag.id) : undefined
          const hot = !!dp && hoverCell === c && dp.dive.length > 0 && !!dp.extractId
            && !panels.some(q => q.id !== dp.id && q.cell === c)
          return <div key={`slot-${c}`} className={`slot ${hot ? 'slot-hot' : ''}`} style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }} />
        })}

        {linkedPairs.map((lp, i) => {
          const a = panels.find(p => p.id === lp.a)
          const b = panels.find(p => p.id === lp.b)
          if (!a || !b || neighbor(a.cell, lp.aside) !== b.cell) return null
          const ra = cellRect(a.cell)
          let st: React.CSSProperties
          if (lp.aside === 'r') st = { left: `${ra.x + ra.w - 0.7}%`, top: `${ra.y + 1}%`, width: `${GAP + 1.4}%`, height: `${ra.h - 2}%` }
          else if (lp.aside === 'l') st = { left: `${ra.x - GAP - 0.7}%`, top: `${ra.y + 1}%`, width: `${GAP + 1.4}%`, height: `${ra.h - 2}%` }
          else if (lp.aside === 'b') st = { left: `${ra.x + 1}%`, top: `${ra.y + ra.h - 0.7}%`, width: `${ra.w - 2}%`, height: `${GAP + 1.4}%` }
          else st = { left: `${ra.x + 1}%`, top: `${ra.y - GAP - 0.7}%`, width: `${ra.w - 2}%`, height: `${GAP + 1.4}%` }
          return <div key={`br-${i}`} className={`bridge ${lp.aside === 'r' || lp.aside === 'l' ? 'v' : 'h'}`} style={st} />
        })}

        {panels.map((p, pi) => {
          const v = curView(p)
          const r = cellRect(p.cell)
          const dragging = drag?.id === p.id
          const style = dragging
            ? { left: `${drag.x}%`, top: `${drag.y}%`, width: `${CW}%`, height: `${CW}%` }
            : { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%`, animationDelay: p.born ? `${pi * 0.14}s` : undefined }
          const rings = spotStepsFor(p.id)
            .map(s => ({ s, spot: (v.spots ?? []).find(sp => sp.id === (s.cond as { spot: string }).spot) }))
            .filter(x => !!x.spot)
          const backHot = p.dive.length > 0 && spotStepsFor(p.id).some(s =>
            !(v.spots ?? []).some(sp => sp.id === (s.cond as { spot: string }).spot))
          const old = morph[p.id]
          const viewKey = `${p.dive.length}:${v.img}`
          return (
            <div
              key={p.id}
              className={`pnl ${p.lit ? 'lit' : ''} ${p.dim ? 'dim' : ''} ${p.born ? 'born' : ''} ${dragging ? 'drag' : ''} ${joined.includes(p.id) ? 'joined' : ''} ${focus === p.id ? 'focus' : ''} ${resonance && (resonance.other === p.id || drag?.id === p.id) ? 'resonant' : ''} ${p.extractId && p.dive.length ? 'extractable' : ''} ${hint >= 1 && !dragging && p.extractId && p.dive.length ? 'tug' : ''}`}
              style={style}
              onPointerDown={e => onPanelDown(e, p)}
              onPointerMove={e => {
                const board = boardRef.current
                if (!board) return
                const rect = board.getBoundingClientRect()
                const px = ((e.clientX - rect.left) / rect.width) * 100
                const py = ((e.clientY - rect.top) / rect.height) * 100
                const rr = cellRect(p.cell)
                const fx = ((px - rr.x) / rr.w) * 100
                const fy = ((py - rr.y) / rr.h) * 100
                const hot = !!spotAt(p, fx, fy)
                setCursor(c => (c && c.hot !== hot ? { ...c, hot } : c))
              }}
              onPointerLeave={() => setCursor(c => (c?.hot ? { ...c, hot: false } : c))}
            >
              <div className="artwrap" key={viewKey}>
                <div className="camera" style={cameraOf(p, v)}>
                  <img src={v.img} draggable={false} alt="" style={{ filter: v.tint }} />
                </div>
                {old && (
                  <div className="camera ghost">
                    <img src={old.img} draggable={false} alt="" style={{ filter: old.tint }} />
                  </div>
                )}
              </div>
              {v.year && <div className="pnl-year">{v.year}</div>}
              {p.dive.length > 0 && (
                <div
                  className={`backchip ${backHot ? 'hot' : ''}`}
                  onPointerDown={e => { e.stopPropagation(); goBack(p.id) }}
                >‹</div>
              )}
              {Object.keys(p.layers[0].edges ?? {}).map(side => (
                <i key={side} className={`leak side-${side} ${liveEdges.some(le => le.id === p.id && le.side === side) ? 'live' : ''}`} />
              ))}
              {/* 画中微光：可交互处有一束画里的光，不是 UI，是画面的一部分 */}
              {rings.map(({ s, spot }) => {
                const c = viewToPanel(v, spot!.x + spot!.w / 2, spot!.y + spot!.h / 2)
                if (!c.inside) return null
                const zs = v.crop ? 100 / Math.min(v.crop.w, v.crop.h) : 1
                return (
                  <i
                    key={`g-${s.id}`}
                    className="glowspot"
                    style={{
                      left: `${c.x}%`, top: `${c.y}%`,
                      width: `${spot!.w * zs * 1.5}%`, height: `${spot!.h * zs * 1.5}%`,
                    }}
                  />
                )
              })}
              {hint >= 1 && rings.map(({ s, spot }) => {
                const m = viewToPanel(v, spot!.x + spot!.w / 2, spot!.y + spot!.h / 2)
                if (!m.inside) return null
                const isDive = s.cond.kind === 'dive'
                return (
                  <i
                    key={s.id}
                    className={`ring hot ${isDive ? 'dive' : ''}`}
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  />
                )
              })}
              {hint >= 1 && peelable(p.id) && p.layers.length > 1 && p.dive.length === 0 && (
                <i className="dogear hot" />
              )}
              {def.goal === p.id && <i className="beacon" />}
              {bursts.filter(b => b.panel === p.id).map(b => (
                <div key={b.id} className={`burst burst-${b.kind}`}>
                  {b.kind === 'gear' && (
                    <svg viewBox="0 0 100 100">
                      <g className="g1">
                        <path d="M50 18 l5 8 9-2 1 9 9 1 -2 9 8 5 -8 5 2 9 -9 1 -1 9 -9-2 -5 8 -5-8 -9 2 -1-9 -9-1 2-9 -8-5 8-5 -2-9 9-1 1-9 9 2z" />
                        <circle cx="50" cy="50" r="12" />
                      </g>
                      <g className="g2">
                        <path d="M76 58 l3 5 6-1 0 6 6 1 -2 6 5 3 -5 3 2 6 -6 0 0 6 -6-1 -3 5 -3-5 -6 1 0-6 -6 0 2-6 -5-3 5-3 -2-6 6 0 0-6 6 1z" />
                        <circle cx="76" cy="74" r="7" />
                      </g>
                    </svg>
                  )}
                  {b.kind === 'spark' && (<><i /><i /><i /></>)}
                  {b.kind === 'sun' && <i />}
                  {b.kind === 'year' && <span>{b.year}</span>}
                </div>
              ))}
              {hero && hero.panel === p.id && (() => {
                const m = viewToPanel(v, hero.x, hero.y)
                if (!m.inside) return null
                // 他会望向这幅画里当下可以互动的地方
                const tgt = rings[0]?.spot
                const dx = tgt ? tgt.x + tgt.w / 2 - hero.x : 0
                const lean = dx < -8 ? ' lean-l' : dx > 8 ? ' lean-r' : ''
                return <div className={`hero${lean}`} style={{ left: `${m.x}%`, top: `${m.y}%` }} />
              })()}
            </div>
          )
        })}

        <svg className="beams" viewBox="0 0 100 100" preserveAspectRatio="none">
          {beams.map(b => <line key={b.id} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
          {hintBeams.map(b => <line key={`h${b.id}`} className="res" x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
          {resonance && <line className="res" x1={resonance.x1} y1={resonance.y1} x2={resonance.x2} y2={resonance.y2} />}
        </svg>

        {ripples.map(rp => (
          <i key={rp.id} className={`ripple ${rp.strong ? 'strong' : ''}`} style={{ left: `${rp.x}%`, top: `${rp.y}%` }} />
        ))}

        {through && (
          <div className="through">
            <img src={through} draggable={false} alt="" />
          </div>
        )}

        {flies.map(f => <i key={f} className="wrap-fly" />)}

        {cursor && (
          <i
            className={`cursor ${cursor.hot ? 'hot' : ''} ${cursor.down ? 'down' : ''}`}
            style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
          />
        )}
      </div>
    </div>
  )
}
