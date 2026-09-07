import { useEffect, useRef, useState } from 'react'
import type { Cell, ChapterDef, PanelDef, PanelState, Side, Step } from './types'
import './engine.css'

const OPP: Record<Side, Side> = { l: 'r', r: 'l', t: 'b', b: 't' }
const PAD = 2.4
const GAP = 2.2
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
  const dc = s === 'l' ? -1 : s === 'r' ? 1 : 0
  const dr = s === 't' ? -1 : s === 'b' ? 1 : 0
  const nc = col + dc
  const nr = row + dr
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

function play(src: string, vol = 0.38) {
  const a = new Audio(src)
  a.volume = vol
  a.play().catch(() => {})
}

function toState(d: PanelDef): PanelState {
  return { id: d.id, cell: d.cell, dim: !!d.dim, lit: false, layers: d.layers ?? [{ img: d.img, edges: d.edges }] }
}

interface Beam { id: number; x1: number; y1: number; x2: number; y2: number }

export function Board({ def, onDone, onCollect }: { def: ChapterDef; onDone: () => void; onCollect: () => void }) {
  const [panels, setPanels] = useState<PanelState[]>(() => def.panels.map(toState))
  const [done, setDone] = useState<string[]>([])
  const [hint, setHint] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)
  const [beams, setBeams] = useState<Beam[]>([])
  const [walker, setWalker] = useState<{ x: number; y: number; fast?: boolean } | null>(null)
  const [through, setThrough] = useState<string | null>(def.panels[0]?.img ?? null)

  // 开场穿画入场
  useEffect(() => {
    const t = window.setTimeout(() => setThrough(null), 1150)
    return () => window.clearTimeout(t)
  }, [def.id])
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [hoverCell, setHoverCell] = useState<Cell | null>(null)
  const [joined, setJoined] = useState<string[]>([])
  const boardRef = useRef<HTMLDivElement>(null)
  const panelsRef = useRef<PanelState[]>(panels)
  const doneRef = useRef<Set<string>>(new Set())
  const idleRef = useRef<number>(0)
  const beamSeq = useRef(0)
  panelsRef.current = panels

  // 所有出现过的画的定义（含 spawn 出来的），供查找入画点/边
  const allDefs: PanelDef[] = [
    ...def.panels,
    ...def.steps.flatMap(s => (s.fx.spawn ? [s.fx.spawn.def] : [])),
  ]
  const defOf = (id: string) => allDefs.find(d => d.id === id)

  const poke = () => {
    window.clearTimeout(idleRef.current)
    setHint(false)
    idleRef.current = window.setTimeout(() => setHint(true), 7000)
  }

  const availNow = () =>
    def.steps.filter(s => !doneRef.current.has(s.id) && (s.after ?? []).every(a => doneRef.current.has(a)))

  const fire = (step: Step) => {
    if (doneRef.current.has(step.id)) return
    doneRef.current.add(step.id)
    setDone(Array.from(doneRef.current))
    poke()
    const fx = step.fx
    if (fx.sfx) play(fx.sfx, 0.55)
    if (fx.music) play(fx.music, 0.5)
    let delay = 0
    const cond = step.cond
    if (cond.kind === 'overlay') {
      const b = panelsRef.current.find(q => q.id === cond.b)
      if (b) {
        setJoined([b.id])
        window.setTimeout(() => setJoined([]), 1700)
      }
    }
    if (cond.kind === 'connect') {
      const a = panelsRef.current.find(q => q.id === cond.a)
      const b = panelsRef.current.find(q => q.id === cond.b)
      if (a && b) {
        const p1 = edgeMid(a.cell, cond.aside)
        const p2 = edgeMid(b.cell, OPP[cond.aside])
        const id = ++beamSeq.current
        setBeams(bs => [...bs, { id, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }])
        window.setTimeout(() => setBeams(bs => bs.filter(x => x.id !== id)), 1700)
        setJoined([a.id, b.id])
        window.setTimeout(() => setJoined([]), 1700)
        if (fx.walk) {
          delay = 1200
          setWalker({ x: p1.x, y: p1.y })
          requestAnimationFrame(() => requestAnimationFrame(() => setWalker({ x: p2.x, y: p2.y })))
          window.setTimeout(() => setWalker(null), 2100)
        }
      }
    }
    if (fx.walkPath) {
      const pts = fx.walkPath
        .map(id => panelsRef.current.find(q => q.id === id))
        .filter((q): q is PanelState => !!q)
        .map(q => { const r = cellRect(q.cell); return { x: r.x + r.w / 2, y: r.y + r.h / 2 } })
      if (pts.length > 1) {
        setWalker({ ...pts[0], fast: true })
        pts.forEach((pt, i) => {
          if (i === 0) return
          window.setTimeout(() => setWalker({ ...pt, fast: true }), 120 + i * 950)
        })
        window.setTimeout(() => setWalker(null), 120 + pts.length * 950 + 500)
      }
    }
    window.setTimeout(() => {
      const applyFx = () => {
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
            ? { ...q, dim: fx.swap!.undim ? false : q.dim, layers: [{ ...q.layers[0], img: fx.swap!.img }] } : q)
          if (fx.setEdges) next = next.map(q => q.id === fx.setEdges!.panel
            ? { ...q, layers: [{ ...q.layers[0], edges: fx.setEdges!.edges }] } : q)
          if (fx.glow) next = next.map(q => q.id === fx.glow ? { ...q, lit: true } : q)
          return next
        })
        if (fx.collect) onCollect()
        if (fx.done) window.setTimeout(onDone, 1600)
      }
      // 穿画：新画先扑面而来，再落回墙上
      if (fx.spawn) {
        setThrough(fx.spawn.def.img)
        window.setTimeout(() => { setThrough(null); applyFx() }, 1200)
      } else {
        applyFx()
      }
    }, delay)
  }

  // 环境声：淡入到很低的音量，只当气氛不当主角
  useEffect(() => {
    if (!def.ambient) return
    const a = new Audio(def.ambient)
    a.loop = true
    a.volume = 0
    a.play().catch(() => {})
    let v = 0
    const t = window.setInterval(() => {
      v = Math.min(0.13, v + 0.016)
      a.volume = v
    }, 120)
    return () => { window.clearInterval(t); a.pause() }
  }, [def.ambient])

  // 开场第一次提示来得快一些
  useEffect(() => {
    setHint(false)
    idleRef.current = window.setTimeout(() => setHint(true), 1500)
    return () => window.clearTimeout(idleRef.current)
  }, [def.id])

  // 连画扫描 + auto 步骤
  useEffect(() => {
    const t = window.setTimeout(() => {
      for (const s of availNow()) {
        const c = s.cond
        if (c.kind === 'auto') { fire(s); continue }
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

  const dropPanel = (p: PanelState, pt: { x: number; y: number }) => {
    const target = cellAt(pt.x, pt.y)
    if (target == null || target === p.cell) return
    const cur = panelsRef.current.find(q => q.id === p.id) ?? p
    const occupant = panelsRef.current.find(q => q.id !== cur.id && q.cell === target)
    if (occupant) {
      // 叠画：把拖着的画叠到目标画上，合成新画面
      const ov = availNow().find(s => s.cond.kind === 'overlay' && s.cond.a === cur.id && s.cond.b === occupant.id)
      if (!ov) return
      setPanels(prev => prev.filter(q => q.id !== cur.id))
      fire(ov)
      return
    }
    const peelStep = availNow().find(s => s.cond.kind === 'peel' && s.cond.panel === cur.id)
    if (peelStep && cur.layers.length > 1) {
      const top = cur.layers[0]
      const nid = `${cur.id}~${cur.layers.length}`
      setPanels(prev => prev
        .map(q => q.id === cur.id ? { ...q, layers: q.layers.slice(1) } : q)
        .concat({ id: nid, cell: target, layers: [top], dim: false, lit: false, born: true }))
      fire(peelStep)
      return
    }
    setPanels(prev => prev.map(q => q.id === cur.id ? { ...q, cell: target } : q))
    play('/sfx/wooddrop.wav', 0.35)
    poke()
  }

  const onPanelDown = (e: React.PointerEvent, p: PanelState) => {
    e.preventDefault()
    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY }
    let moved = false
    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8) moved = true
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
        const d = defOf(p.id)
        if (d?.spots?.length) { setZoom(p.id); poke() }
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

  const clickSpot = (panelId: string, spotId: string) => {
    const s = availNow().find(st => st.cond.kind === 'spot' && st.cond.panel === panelId && st.cond.spot === spotId)
    if (!s) return
    fire(s)
    if (!s.fx.keepZoom) setZoom(null)
  }

  const avail = def.steps.filter(s => !done.includes(s.id) && (s.after ?? []).every(a => done.includes(a)))
  const liveEdges: Array<{ id: string; side: Side }> = []
  for (const s of avail) {
    if (s.cond.kind === 'connect') {
      liveEdges.push({ id: s.cond.a, side: s.cond.aside }, { id: s.cond.b, side: OPP[s.cond.aside] })
    }
  }
  const spotStepsFor = (pid: string) =>
    avail.filter(s => s.cond.kind === 'spot' && s.cond.panel === pid)
  const peelable = (pid: string) =>
    avail.some(s => s.cond.kind === 'peel' && s.cond.panel === pid)

  const zoomDef = zoom ? defOf(zoom) : undefined
  const zoomPanel = zoom ? panels.find(p => p.id === zoom) : undefined

  // 拖拽共振：拖着的画靠近能接的缝时，两缝之间拉起一根光须
  const resonance = (() => {
    if (!drag || hoverCell == null) return null
    const p = panels.find(q => q.id === drag.id)
    if (!p) return null
    if (panels.some(q => q.id !== p.id && q.cell === hoverCell)) return null
    for (const s of avail) {
      if (s.cond.kind !== 'connect') continue
      const c = s.cond
      if (c.a === p.id) {
        const b = panels.find(q => q.id === c.b)
        if (b && neighbor(hoverCell, c.aside) === b.cell) {
          const ka = p.layers[0].edges?.[c.aside]
          const kb = b.layers[0].edges?.[OPP[c.aside]]
          if (ka && ka === kb) {
            const m1 = edgeMid(hoverCell, c.aside)
            const m2 = edgeMid(b.cell, OPP[c.aside])
            return { x1: m1.x, y1: m1.y, x2: m2.x, y2: m2.y, other: b.id }
          }
        }
      }
      if (c.b === p.id) {
        const a = panels.find(q => q.id === c.a)
        if (a && neighbor(a.cell, c.aside) === hoverCell) {
          const ka = a.layers[0].edges?.[c.aside]
          const kb = p.layers[0].edges?.[OPP[c.aside]]
          if (ka && ka === kb) {
            const m1 = edgeMid(a.cell, c.aside)
            const m2 = edgeMid(hoverCell, OPP[c.aside])
            return { x1: m1.x, y1: m1.y, x2: m2.x, y2: m2.y, other: a.id }
          }
        }
      }
    }
    // 叠画共振：拖到目标画上时，目标画亮起来
    for (const s of avail) {
      if (s.cond.kind !== 'overlay') continue
      const c = s.cond
      if (c.a !== p.id) continue
      const b = panels.find(q => q.id === c.b)
      if (b && hoverCell === b.cell) {
        const r = cellRect(b.cell)
        const m1 = { x: drag.x + CW / 2, y: drag.y + CW / 2 }
        return { x1: m1.x, y1: m1.y, x2: r.x + r.w / 2, y2: r.y + r.h / 2, other: b.id }
      }
    }
    return null
  })()

  // 已连上的画对：缝要"消失"，两幅画变一个连续空间
  const linkedPairs = def.steps
    .filter(s => done.includes(s.id) && s.cond.kind === 'connect')
    .map(s => s.cond as { kind: 'connect'; a: string; aside: Side; b: string })

  return (
    <div className="board-wrap">
      <div className="board" ref={boardRef}>
        {([0, 1, 2, 3] as Cell[]).map(c => {
          const r = cellRect(c)
          return <div key={`slot-${c}`} className="slot" style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }} />
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

        {panels.map(p => {
          const top = p.layers[0]
          const r = cellRect(p.cell)
          const dragging = drag?.id === p.id
          const style = dragging
            ? { left: `${drag.x}%`, top: `${drag.y}%`, width: `${CW}%`, height: `${CW}%` }
            : { left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }
          const d = defOf(p.id)
          const rings = hint ? spotStepsFor(p.id) : []
          return (
            <div
              key={p.id}
              className={`pnl ${p.lit ? 'lit' : ''} ${p.dim ? 'dim' : ''} ${p.born ? 'born' : ''} ${dragging ? 'drag' : ''} ${zoom === p.id ? 'gone' : ''} ${joined.includes(p.id) ? 'joined' : ''} ${resonance && (resonance.other === p.id || drag?.id === p.id) ? 'resonant' : ''}`}
              style={style}
              onPointerDown={e => onPanelDown(e, p)}
            >
              <div className="pnl-art" style={{ backgroundImage: `url(${top.img})`, filter: top.tint }} />
              {top.year && <div className="pnl-year">{top.year}</div>}
              {Object.keys(top.edges ?? {}).map(side => (
                <i key={side} className={`leak side-${side} ${liveEdges.some(le => le.id === p.id && le.side === side) ? 'live' : ''}`} />
              ))}
              {rings.map(s => {
                const spot = d?.spots?.find(sp => sp.id === (s.cond as { spot: string }).spot)
                if (!spot) return null
                return <i key={s.id} className="ring" style={{ left: `${spot.x + spot.w / 2}%`, top: `${spot.y + spot.h / 2}%` }} />
              })}
              {hint && peelable(p.id) && p.layers.length > 1 && <i className="dogear" />}
              {hint && avail.some(s => s.cond.kind === 'overlay' && (s.cond.a === p.id || s.cond.b === p.id)) && (
                <i className="ring" style={{ left: '50%', top: '50%' }} />
              )}
            </div>
          )
        })}

        <svg className="beams" viewBox="0 0 100 100" preserveAspectRatio="none">
          {beams.map(b => (
            <line key={b.id} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />
          ))}
          {resonance && (
            <line className="res" x1={resonance.x1} y1={resonance.y1} x2={resonance.x2} y2={resonance.y2} />
          )}
        </svg>

        {walker && (
          <div
            className="walker"
            style={{
              left: `${walker.x}%`,
              top: `${walker.y}%`,
              transitionDuration: walker.fast ? '0.9s' : '1.9s',
            }}
          />
        )}

        {through && (
          <div className="through">
            <img src={through} draggable={false} alt="" />
          </div>
        )}

        {zoom && zoomDef && zoomPanel && (
          <div className="zoom" onPointerDown={() => setZoom(null)}>
            <div className="zoom-frame" onPointerDown={e => e.stopPropagation()}>
              <img src={zoomPanel.layers[0].img} draggable={false} alt="" />
              {zoomPanel.layers[0].year && <div className="pnl-year in-zoom">{zoomPanel.layers[0].year}</div>}
              {(zoomDef.spots ?? []).map(sp => {
                const active = spotStepsFor(zoom).some(s => (s.cond as { spot: string }).spot === sp.id)
                return (
                  <div
                    key={sp.id}
                    className="zoom-spot"
                    style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: `${sp.w}%`, height: `${sp.h}%` }}
                    onPointerDown={e => { e.stopPropagation(); clickSpot(zoom, sp.id) }}
                  >
                    {active && <i className="ring in" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
