import { useEffect, useMemo, useRef, useState } from 'react'
import { buildGraph, flagsOf, layoutOf, DOCK_RINGS } from './world'
import type { GraphOut, WLevel, WPt, WScene, WShape } from './world'
import TileArt from './TileArt'
import { sfx, isMuted, setMuted, setAmbient, stopAmbient } from './audio'

const INK = '#2a2620'
const GOLD = '#d9a41c'

// ------------------------------------------------------------
// 画面基元
// ------------------------------------------------------------
function ShapeEl({ s, flags }: { s: WShape; flags: Set<string> }) {
  if (s.flag) {
    const has = flags.has(s.flag)
    const show = s.when === 'hide' ? !has : has
    if (!show) return null
  }
  const c = s.c ?? INK
  const glow = s.glow ? { filter: 'drop-shadow(0 0 3px rgba(217,164,28,0.9))' } : undefined
  if (s.k === 'line' && s.pts) {
    return (
      <polyline
        points={s.pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke={c}
        strokeWidth={s.w ?? 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={s.dash ? '3 3' : undefined}
        opacity={0.85}
        style={glow}
      />
    )
  }
  if (s.k === 'circle' && s.at) {
    return s.fill ? (
      <circle cx={s.at[0]} cy={s.at[1]} r={s.r ?? 3} fill={c} opacity={0.9} style={glow} />
    ) : (
      <circle cx={s.at[0]} cy={s.at[1]} r={s.r ?? 3} fill="none" stroke={c} strokeWidth={s.w ?? 1.4} style={glow} />
    )
  }
  if (s.k === 'rect' && s.at) {
    const w = s.w ?? 8
    const h = s.h ?? 8
    return (
      <rect
        x={s.at[0]}
        y={s.at[1]}
        width={w}
        height={h}
        fill={s.fill ? c : 'none'}
        stroke={c}
        strokeWidth={s.fill ? 0 : 1.4}
        transform={s.rot ? `rotate(${s.rot} ${s.at[0] + w / 2} ${s.at[1] + h / 2})` : undefined}
        opacity={0.9}
        style={glow}
      />
    )
  }
  return null
}

/** 一幅画的静态内容：底纹 + 形状（局部 0..100 坐标） */
function SceneBase({ scene, sid, flags }: { scene: WScene; sid: string; flags: Set<string> }) {
  return (
    <>
      <TileArt tile={{ id: sid, ports: [], links: [], art: scene.art }} litDirs={new Set()} />
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {scene.shapes.map((s, i) => (
          <ShapeEl key={i} s={s} flags={flags} />
        ))}
      </svg>
    </>
  )
}

function edgePath(pts: WPt[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
}

// ------------------------------------------------------------
// 主界面
// ------------------------------------------------------------
type DragState = {
  sid: string
  from: 'wall' | 'sub'
  x: number
  y: number
  overId: string | null
}

export default function WorldView({
  level,
  levelIndex,
  levelCount,
  onNext,
  onExit,
}: {
  level: WLevel
  levelIndex: number
  levelCount: number
  onNext: () => void
  onExit: () => void
}) {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [pulled, setPulled] = useState<Set<string>>(new Set())
  const [zoomId, setZoomId] = useState<string | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [denyId, setDenyId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [moves, setMoves] = useState(0)
  const [stamped, setStamped] = useState(false)
  const [won, setWon] = useState(false)
  const [mutedUI, setMutedUI] = useState(isMuted())

  // 光的行走进度：null = 未启程（停在起点）
  const [travel, setTravel] = useState<number | null>(null)
  const startedRef = useRef(false)

  const graph: GraphOut = useMemo(() => buildGraph(level, done, pulled), [level, done, pulled])
  const flags = useMemo(() => flagsOf(level, done), [level, done])
  const layout = useMemo(() => layoutOf(level, done), [level, done])

  const insideSet = useMemo(() => {
    const s = new Set<string>()
    for (const sc of Object.values(level.scenes)) if (sc.sub && !pulled.has(sc.sub.paint)) s.add(sc.sub.paint)
    return s
  }, [level, pulled])

  const inComposition = (sid: string) => layout.has(sid)
  const wallScenes = Object.keys(level.scenes).filter((sid) => !insideSet.has(sid) && !inComposition(sid))

  // 合成画面的坐标范围
  const compBox = useMemo(() => {
    if (layout.size === 0) return null
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [x, y] of layout.values()) {
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + 100)
      maxY = Math.max(maxY, y + 100)
    }
    return { minX: minX - 3, minY: minY - 3, w: maxX - minX + 6, h: maxY - minY + 6 }
  }, [layout])

  // 氛围音：三章循环使用
  useEffect(() => {
    if (!mutedUI) setAmbient(((level.id - 1) % 5) + 1)
    return () => stopAmbient()
  }, [level.id, mutedUI])

  // 过关：光出发 → 沿路走到目标 → 铃 → 盖章 → 卡片
  useEffect(() => {
    if (!graph.solved || startedRef.current || won) return
    startedRef.current = true
    const total = 1900
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / total)
      setTravel(t)
      if (t < 1) raf = requestAnimationFrame(step)
      else {
        sfx.chime()
        setTimeout(() => {
          setStamped(true)
          sfx.stamp()
        }, 350)
        setTimeout(() => setWon(true), 1100)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [graph.solved, won])

  // 路线插值
  const motePos = (t: number): WPt => {
    const pts = graph.route
    if (pts.length === 0) return [0, 0]
    let len = 0
    const segs: number[] = []
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
      segs.push(l)
      len += l
    }
    let d = t * len
    for (let i = 0; i < segs.length; i++) {
      if (d <= segs[i] || i === segs.length - 1) {
        const r = segs[i] === 0 ? 0 : d / segs[i]
        return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r]
      }
      d -= segs[i]
    }
    return pts[pts.length - 1]
  }

  const reset = () => {
    setDone(new Set())
    setPulled(new Set())
    setZoomId(null)
    setMoves(0)
    setStamped(false)
    setWon(false)
    setTravel(null)
    startedRef.current = false
    setToast(null)
  }

  const tryDock = (a: string, b: string) => {
    const d = level.docks.find(
      (x) => ((x.aP === a && x.bP === b) || (x.aP === b && x.bP === a)) && !done.has(x.id),
    )
    if (d && wallScenes.includes(d.aP) && wallScenes.includes(d.bP)) {
      const nd = new Set(done)
      nd.add(d.id)
      setDone(nd)
      setMoves((m) => m + 1)
      sfx.dock()
      setToast(d.hint)
      setTimeout(() => setToast(null), 2800)
    } else {
      sfx.deny()
      setDenyId(a)
      setTimeout(() => setDenyId(null), 450)
    }
  }

  const startDrag = (e: React.PointerEvent, sid: string, from: 'wall' | 'sub') => {
    e.stopPropagation()
    e.preventDefault()
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) moved = true
      if (moved) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY)
        const tgt = el?.closest('[data-wpaint]')
        setDrag({ sid, from, x: ev.clientX, y: ev.clientY, overId: tgt ? tgt.getAttribute('data-wpaint') : null })
      }
    }
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDrag(null)
      if (!moved) {
        // 点按：入画
        if (from === 'wall') {
          sfx.zoom()
          setZoomId(sid)
        }
        return
      }
      if (from === 'sub') {
        // 把小画从母画里拽出来
        const np = new Set(pulled)
        np.add(sid)
        setPulled(np)
        setMoves((m) => m + 1)
        sfx.zoom()
        return
      }
      const el = document.elementFromPoint(ev.clientX, ev.clientY)
      const tgt = el?.closest('[data-wpaint]')
      const tid = tgt?.getAttribute('data-wpaint')
      if (tid && tid !== sid) tryDock(sid, tid)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startSubClick = (e: React.PointerEvent, sid: string) => {
    // 画中画：点按 = 再进一层；拖动 = 拽出来
    e.stopPropagation()
    e.preventDefault()
    const sx = e.clientX
    const sy = e.clientY
    let moved = false
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 8) moved = true
      if (moved) setDrag({ sid, from: 'sub', x: ev.clientX, y: ev.clientY, overId: null })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDrag(null)
      if (!moved) {
        sfx.zoom()
        setZoomId(sid)
      } else {
        const np = new Set(pulled)
        np.add(sid)
        setPulled(np)
        setMoves((m) => m + 1)
        sfx.zoom()
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const startScene = level.start.scene
  const startNode = level.scenes[startScene].nodes.find((n) => n.id === level.start.node)!
  const goalNode = level.scenes[level.goal.scene].nodes.find((n) => n.id === level.goal.node)!

  /** 一幅画里的路（局部坐标）：可达金 / 未达墨 / 断路虚线 */
  const renderSceneEdges = (sid: string) => {
    const sc = level.scenes[sid]
    const idxs = graph.sceneEdgeIdx.get(sid) ?? []
    return sc.edges.map((e, i) => {
      const gi = idxs[i]
      const reach = gi !== undefined && graph.reachEdges.has(gi)
      const active = gi !== undefined ? graph.edges[gi].active : !e.needs || flags.has(e.needs)
      return (
        <path
          key={i}
          d={edgePath(e.pts)}
          fill="none"
          stroke={reach ? GOLD : INK}
          strokeWidth={reach ? 3 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={!active ? '4 4' : undefined}
          opacity={!active ? 0.35 : reach ? 1 : 0.75}
          style={reach ? { filter: 'drop-shadow(0 0 2.5px rgba(217,164,28,0.8))', transition: 'stroke 0.4s' } : { transition: 'stroke 0.4s' }}
        />
      )
    })
  }

  /** 指引圈：未完成的咬合在本画上的呼吸金圈（画中世界式提示） */
  const renderHintRings = (sid: string) =>
    level.docks.flatMap((d) => {
      if (done.has(d.id)) return []
      const pts = DOCK_RINGS[d.id]?.[sid] ?? []
      return pts.map(([x, y], i) => (
        <g key={`${d.id}${i}`} className="hint-ring">
          <circle cx={x} cy={y} r={6} fill="none" stroke={GOLD} strokeWidth={1.2} />
          <circle cx={x} cy={y} r={2} fill="none" stroke={GOLD} strokeWidth={0.8} opacity={0.6} />
        </g>
      ))
    })

  /** 目标金菱（局部坐标） */
  const renderGoalGem = (sid: string) => {
    if (sid !== level.goal.scene) return null
    const [gx, gy] = goalNode.at
    return <polygon points={`${gx},${gy - 5} ${gx + 4},${gy} ${gx},${gy + 5} ${gx - 4},${gy}`} fill={GOLD} className="goal-pulse" />
  }

  /** 渲染一幅墙上的画（含可达金光 / 指引圈 / 目标菱） */
  const renderWallPainting = (sid: string) => {
    const sc = level.scenes[sid]
    const isStart = sid === startScene && !inComposition(sid)
    return (
      <div
        key={sid}
        data-wpaint={sid}
        className={`wpaint ${drag?.overId === sid && drag.sid !== sid ? 'wpaint-drop' : ''} ${drag?.sid === sid ? 'drag-source' : ''} ${denyId === sid ? 'deny-shake' : ''}`}
        onPointerDown={(e) => startDrag(e, sid, 'wall')}
      >
        <div className="wpaint-inner">
          <SceneBase scene={sc} sid={sid} flags={flags} />
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {renderSceneEdges(sid)}
            {renderHintRings(sid)}
            {renderGoalGem(sid)}
            {isStart && travel === null && (
              <circle cx={startNode.at[0]} cy={startNode.at[1]} r={2.6} fill={GOLD} className="mote" />
            )}
          </svg>
          {sc.sub && insideSet.has(sc.sub.paint) && (
            <div
              className="subpaint-thumb"
              style={{ left: `${sc.sub.at[0]}%`, top: `${sc.sub.at[1]}%`, width: `${sc.sub.w}%`, height: `${sc.sub.h}%` }}
            >
              <SceneBase scene={level.scenes[sc.sub.paint]} sid={sc.sub.paint} flags={flags} />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '26px 16px 48px' }}>
      <div className="level-tag">第 {['一', '二', '三'][levelIndex] ?? level.id} 幕 · {level.id} / {levelCount}</div>
      <h2 style={{ margin: '6px 0 2px', fontSize: 30, letterSpacing: '0.3em' }}>{level.name}</h2>
      <p className="rule-line plate" style={{ margin: '6px 0 22px', opacity: 0.92 }}>{level.tip}</p>

      {/* 画廊墙：合成画面 + 挂着的画 */}
      <div style={{ display: 'flex', gap: 34, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', minHeight: 300 }}>
        {compBox && (
          <div className={`frame comp-frame ${stamped ? 'bump' : ''}`}>
            <div className="mat" style={{ padding: 22 }}>
              <div style={{ position: 'relative', width: `min(78vw, ${compBox.w * 3.1}px)`, aspectRatio: `${compBox.w} / ${compBox.h}` }}>
                {[...layout.entries()].map(([sid, [x, y]]) => (
                  <div
                    key={sid}
                    style={{
                      position: 'absolute',
                      left: `${((x - compBox.minX) / compBox.w) * 100}%`,
                      top: `${((y - compBox.minY) / compBox.h) * 100}%`,
                      width: `${(100 / compBox.w) * 100}%`,
                      height: `${(100 / compBox.h) * 100}%`,
                      border: '1.5px solid #191713',
                      overflow: 'hidden',
                    }}
                  >
                    <SceneBase scene={level.scenes[sid]} sid={sid} flags={flags} />
                  </div>
                ))}
                <svg viewBox={`${compBox.minX} ${compBox.minY} ${compBox.w} ${compBox.h}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {/* 咬合后补画的东西 */}
                  {[...done].flatMap((did) => {
                    const d = level.docks.find((x) => x.id === did)
                    if (!d?.addShapes) return []
                    return Object.entries(d.addShapes).flatMap(([sid, shapes]) => {
                      const off = layout.get(sid) ?? [0, 0]
                      return shapes.map((s, i) => (
                        <g key={`${did}${sid}${i}`} transform={`translate(${off[0]} ${off[1]})`}>
                          <ShapeEl s={s} flags={flags} />
                        </g>
                      ))
                    })
                  })}
                  {/* 路：可达的金 / 未达的墨 / 断的虚线 */}
                  {graph.edges.map((e, i) => {
                    const reach = graph.reachEdges.has(i)
                    return (
                      <path
                        key={i}
                        d={edgePath(e.pts)}
                        fill="none"
                        stroke={reach ? GOLD : INK}
                        strokeWidth={reach ? 3 : 2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={!e.active ? '4 4' : undefined}
                        opacity={!e.active ? 0.35 : reach ? 1 : 0.7}
                        style={reach ? { filter: 'drop-shadow(0 0 2.5px rgba(217,164,28,0.8))', transition: 'stroke 0.4s' } : { transition: 'stroke 0.4s' }}
                      />
                    )
                  })}
                  {/* 目标：呼吸的金菱 */}
                  {(() => {
                    const off = layout.get(level.goal.scene)
                    if (!off) return null
                    const gx = goalNode.at[0] + off[0]
                    const gy = goalNode.at[1] + off[1]
                    return <polygon points={`${gx},${gy - 5} ${gx + 4},${gy} ${gx},${gy + 5} ${gx - 4},${gy}`} fill={GOLD} className="goal-pulse" />
                  })()}
                  {/* 光：停在起点 / 走在路上 */}
                  {(() => {
                    if (travel === null) {
                      const off = layout.get(startScene)
                      if (!off) return null
                      return <circle cx={startNode.at[0] + off[0]} cy={startNode.at[1] + off[1]} r={2.6} fill={GOLD} className="mote" />
                    }
                    const [mx, my] = motePos(travel)
                    return <circle cx={mx} cy={my} r={2.8} fill="#ffd75e" className="mote" />
                  })()}
                </svg>
              </div>
            </div>
            {stamped && <div className="seal-stamp">通</div>}
          </div>
        )}
        {wallScenes.map(renderWallPainting)}
      </div>

      {/* 咬合提示语 */}
      {toast && <div className="dock-toast">{toast}</div>}

      {/* 控制区 */}
      <div style={{ display: 'flex', gap: 12, marginTop: 30, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="reframe-btn" onClick={reset}>重置</button>
        <button className="reframe-btn" onClick={onExit}>目录</button>
        <button className="reframe-btn" style={{ padding: '10px 14px' }} onClick={() => { const m = !isMuted(); setMuted(m); setMutedUI(m) }}>{mutedUI ? '静' : '♪'}</button>
      </div>

      {/* 入画：全景看一幅画 */}
      {zoomId && (
        <div className="zoom-veil" onPointerDown={() => setZoomId(null)}>
          <div className="zoom-card" onPointerDown={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
            <div className="frame">
              <div className="mat" style={{ padding: 18 }}>
                <div style={{ position: 'relative', width: 'min(76vw, 56vh)', aspectRatio: '1' }}>
                  <SceneBase scene={level.scenes[zoomId]} sid={zoomId} flags={flags} />
                  <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    {renderSceneEdges(zoomId)}
                    {renderHintRings(zoomId)}
                    {renderGoalGem(zoomId)}
                    {zoomId === startScene && travel === null && (
                      <circle cx={startNode.at[0]} cy={startNode.at[1]} r={2.6} fill={GOLD} className="mote" />
                    )}
                  </svg>
                  {/* 画中画：点按再进一层，拖动拽出来 */}
                  {(() => {
                    const sub = level.scenes[zoomId].sub
                    if (!sub) return null
                    if (insideSet.has(sub.paint)) {
                      return (
                        <div
                          className="subpaint"
                          style={{ left: `${sub.at[0]}%`, top: `${sub.at[1]}%`, width: `${sub.w}%`, height: `${sub.h}%` }}
                          onPointerDown={(e) => startSubClick(e, sub.paint)}
                        >
                          <SceneBase scene={level.scenes[sub.paint]} sid={sub.paint} flags={flags} />
                        </div>
                      )
                    }
                    return (
                      <div
                        className="subpaint-empty"
                        style={{ left: `${sub.at[0]}%`, top: `${sub.at[1]}%`, width: `${sub.w}%`, height: `${sub.h}%` }}
                      />
                    )
                  })()}
                </div>
              </div>
            </div>
            <button
              onPointerDown={(e) => {
                e.stopPropagation()
                setZoomId(null)
              }}
              style={{
                position: 'absolute', top: -14, right: -14, width: 34, height: 34, borderRadius: '50%',
                border: '1.5px solid rgba(232,224,207,0.5)', background: '#201b14', color: '#e8e0cf',
                cursor: 'pointer', fontSize: 15, lineHeight: 1, fontFamily: 'inherit',
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 拖拽浮动块 */}
      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y, transform: 'translate(-50%,-50%) rotate(-4deg)', width: 120, height: 120, position: 'fixed' }}>
          <SceneBase scene={level.scenes[drag.sid]} sid={drag.sid} flags={flags} />
        </div>
      )}

      {/* 过关卡片 */}
      {won && (
        <div className="win-veil">
          <div className="win-card">
            <div className="level-tag">第 {['一', '二', '三'][levelIndex] ?? level.id} 幕 · {moves} 步</div>
            <h3 style={{ fontSize: 36, margin: '12px 0 4px', letterSpacing: '0.28em', color: '#b0361e', textShadow: '0 0 18px rgba(176,54,30,0.3)' }}>通 了</h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 26 }}>
              <button className="reframe-btn" onClick={reset}>重玩本幕</button>
              <button className="reframe-btn primary" onClick={onNext}>
                {levelIndex + 1 < levelCount ? '下一幕 →' : '完成'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
