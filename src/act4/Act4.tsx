import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './act4.css'

// ------------------------------------------------------------
// 《情况属实》第四章 · 三秒 —— 垂直切片
// 夜 → 共犯流水线 → 一声响 → 只剩走 → 描字 → 三段签字 → 盖章黑场
// 无 UI 文字；指引只有呼吸金圈。
// ------------------------------------------------------------

type Phase =
  | 'night'   // 入夜：车间亮起
  | 'line'    // 共犯流水线：喂料保运转（可装挡板）
  | 'report'  // 他转身填报表
  | 'bam'     // 一声响
  | 'walk'    // 只剩走：走廊
  | 'room'    // 调查室
  | 'trace'   // 描"情况属实"
  | 'sign'    // 三段签字
  | 'stamp'   // 红字盖章
  | 'black'   // 黑场 15 秒
  | 'board'   // 计数牌 217→1
  | 'end'     // 片尾卡

const QUOTA = 18 // 计件目标（约一分钟）
const WALK_STEPS = 8
const BLACK_SECS = 15

function hashPhase(): Phase | null {
  try {
    const m = window.location.hash.match(/^#\/act4\?to=(\w+)$/)
    if (!m) return null
    const p = m[1] as Phase
    const all: Phase[] = ['night','line','report','bam','walk','room','trace','sign','stamp','black','board','end']
    return all.includes(p) ? p : null
  } catch { return null }
}

// 贝塞尔采样
function cubic(p0: number[], p1: number[], p2: number[], p3: number[], n = 40): number[][] {
  const pts: number[][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    pts.push([
      u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
      u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1],
    ])
  }
  return pts
}

interface Stroke { d: string; pts: number[][] }

// "情况属实" 每字三笔（100x100 视窗，笔意曲线）
const CHARS: { ch: string; strokes: Stroke[] }[] = [
  { ch: '情', strokes: [
    { d: 'M30,20 C28,45 32,60 28,82', pts: cubic([30,20],[28,45],[32,60],[28,82]) },
    { d: 'M44,32 C58,27 70,29 80,32', pts: cubic([44,32],[58,27],[70,29],[80,32]) },
    { d: 'M46,58 C60,63 68,60 76,58 C77,70 74,79 69,85', pts: cubic([46,58],[60,63],[68,60],[76,58]).concat(cubic([76,58],[77,70],[74,79],[69,85])) },
  ]},
  { ch: '况', strokes: [
    { d: 'M28,26 C24,44 30,60 26,78', pts: cubic([28,26],[24,44],[30,60],[26,78]) },
    { d: 'M44,30 C58,27 72,29 74,34 C74,44 72,50 67,55', pts: cubic([44,30],[58,27],[72,29],[74,34]).concat(cubic([74,34],[74,44],[72,50],[67,55])) },
    { d: 'M47,62 C50,73 55,81 63,83 C71,80 77,70 79,61', pts: cubic([47,62],[50,73],[55,81],[63,83]).concat(cubic([63,83],[71,80],[77,70],[79,61])) },
  ]},
  { ch: '属', strokes: [
    { d: 'M26,22 C50,17 70,19 79,24 C62,40 41,60 26,83', pts: cubic([26,22],[50,17],[70,19],[79,24]).concat(cubic([79,24],[62,40],[41,60],[26,83])) },
    { d: 'M40,44 C56,40 68,42 77,46', pts: cubic([40,44],[56,40],[68,42],[77,46]) },
    { d: 'M38,62 C54,67 66,65 78,60 C75,72 68,81 59,85', pts: cubic([38,62],[54,67],[66,65],[78,60]).concat(cubic([78,60],[75,72],[68,81],[59,85])) },
  ]},
  { ch: '实', strokes: [
    { d: 'M28,26 C44,17 62,17 76,26 C74,32 72,34 69,37', pts: cubic([28,26],[44,17],[62,17],[76,26]).concat(cubic([76,26],[74,32],[72,34],[69,37])) },
    { d: 'M26,45 C46,40 66,40 82,45', pts: cubic([26,45],[46,40],[66,40],[82,45]) },
    { d: 'M38,58 C50,67 62,67 74,58 C70,72 60,81 48,85', pts: cubic([38,58],[50,67],[62,67],[74,58]).concat(cubic([74,58],[70,72],[60,81],[48,85])) },
  ]},
]

const TOL = 15 // 描字容差（视窗单位）

function svgPoint(svg: SVGSVGElement, e: React.PointerEvent): { x: number; y: number } {
  const r = svg.getBoundingClientRect()
  return {
    x: ((e.clientX - r.left) / r.width) * 100,
    y: ((e.clientY - r.top) / r.height) * 100,
  }
}

export default function Act4({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => hashPhase() ?? 'night')
  const [light, setLight] = useState({ x: 50, y: 68 })
  const [lightDim, setLightDim] = useState(false)
  const [feeds, setFeeds] = useState(0)
  const [guardOn, setGuardOn] = useState(false)
  const [charDone, setCharDone] = useState<number[]>([])   // 每字完成的笔数
  const [signOn, setSignOn] = useState(false)
  const [signPct, setSignPct] = useState(0)
  const [penTremble, setPenTremble] = useState(false)
  const [flipDigits, setFlipDigits] = useState(false)

  const loopRef = useRef<HTMLAudioElement | null>(null)
  const thudRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const tinnitusRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null)
  const timers = useRef<number[]>([])
  const stageRef = useRef<HTMLDivElement | null>(null)
  const signLockRef = useRef(false)
  const signResumeRef = useRef(false)
  const tracingRef = useRef<{ char: number; stroke: number; prog: number } | null>(null)
  const [inkPaths, setInkPaths] = useState<Record<string, string>>({})
  const guardDragRef = useRef(false)
  const walkStepRef = useRef(0)

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const playLoop = useCallback(() => {
    if (!loopRef.current) {
      const a = new Audio('/act4/press-loop.mp3')
      a.loop = true; a.volume = 0.55
      loopRef.current = a
    }
    loopRef.current.play().catch(() => {})
  }, [])

  const stopAll = useCallback(() => {
    if (loopRef.current) { loopRef.current.pause(); loopRef.current.currentTime = 0 }
    if (tinnitusRef.current) {
      try { tinnitusRef.current.osc.stop() } catch { /* */ }
      tinnitusRef.current = null
    }
  }, [])

  const startTinnitus = useCallback(() => {
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = audioCtxRef.current ?? new Ctx()
      audioCtxRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 3600
      gain.gain.setValueAtTime(0.02, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 16)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      tinnitusRef.current = { osc, gain }
    } catch { /* 无音频环境 */ }
  }, [])

  // 首次手势解锁音频
  useEffect(() => {
    const unlock = () => { if (phase === 'night' || phase === 'line') playLoop() }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [phase, playLoop])

  // ---- 相位推进 ----
  useEffect(() => {
    if (phase === 'night') {
      later(() => setPhase('line'), 5200)
    } else if (phase === 'report') {
      later(() => {
        setPhase('bam')
      }, 4300)
    } else if (phase === 'bam') {
      if (loopRef.current) loopRef.current.pause()
      if (!thudRef.current) thudRef.current = new Audio('/act4/thud.mp3')
      thudRef.current.volume = 0.9
      thudRef.current.play().catch(() => {})
      startTinnitus()
      later(() => setPhase('walk'), 2600)
    } else if (phase === 'stamp') {
      later(() => setPhase('black'), 4600)
    } else if (phase === 'black') {
      later(() => setPhase('board'), BLACK_SECS * 1000)
    } else if (phase === 'board') {
      later(() => setFlipDigits(true), 2200)
      later(() => setPhase('end'), 6200)
    } else if (phase === 'end') {
      if (onDone) later(onDone, 3000)
    }
  }, [phase, later, startTinnitus, onDone])

  useEffect(() => () => stopAll(), [stopAll])

  // ---- 流水线喂料 ----
  const feed = useCallback(() => {
    if (phase !== 'line') return
    setFeeds((f) => {
      const n = f + 1
      if (n >= QUOTA) later(() => setPhase('report'), 1400)
      return n
    })
  }, [phase, later])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); feed() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [feed])

  // ---- 挡板拖拽 ----
  const guardRef = useRef<HTMLDivElement | null>(null)
  const guardPos = useRef({ x: 0, y: 0 })
  const onGuardDown = (e: React.PointerEvent) => {
    if (phase !== 'line') return
    guardDragRef.current = true
    const el = guardRef.current!
    const r = el.getBoundingClientRect()
    guardPos.current = { x: e.clientX - r.left, y: e.clientY - r.top }
    el.setPointerCapture(e.pointerId)
  }
  const onGuardMove = (e: React.PointerEvent) => {
    if (!guardDragRef.current || !guardRef.current || !stageRef.current) return
    const sr = stageRef.current.getBoundingClientRect()
    guardRef.current.style.left = `${e.clientX - sr.left - guardPos.current.x}px`
    guardRef.current.style.top = `${e.clientY - sr.top - guardPos.current.y}px`
  }
  const onGuardUp = (e: React.PointerEvent) => {
    if (!guardDragRef.current || !stageRef.current) return
    guardDragRef.current = false
    const sr = stageRef.current.getBoundingClientRect()
    const px = (e.clientX - sr.left) / sr.width
    // 拖到冲床区（右侧）= 装上；拖回左侧 = 拆下
    setGuardOn(px > 0.55)
  }

  // ---- 走路（一声响之后）----
  const walkTarget = useCallback((step: number) => {
    const t = step / WALK_STEPS
    return { x: 30 + t * 22, y: 74 - t * 26 }
  }, [])

  const onStagePointer = (e: React.PointerEvent) => {
    if (phase === 'line') { feed(); return }
    if (phase === 'walk') {
      const n = Math.min(walkStepRef.current + 1, WALK_STEPS)
      walkStepRef.current = n
      setLight(walkTarget(n))
      if (n >= WALK_STEPS) later(() => setPhase('room'), 2200)
      return
    }
    if (phase === 'room' && stageRef.current) {
      const sr = stageRef.current.getBoundingClientRect()
      const px = ((e.clientX - sr.left) / sr.width) * 100
      const py = ((e.clientY - sr.top) / sr.height) * 100
      // 桌子纸张区（画面中部偏左下）→ 进入描字
      if (px > 30 && px < 62 && py > 52 && py < 78) { setPhase('trace'); return }
      setLight({ x: px, y: py }) // 可以走，但没有任何回应
    }
  }

  // ---- 描字 ----
  const traceHit = (charIdx: number, x: number, y: number): { stroke: number; prog: number } | null => {
    const st = tracingRef.current
    const strokes = CHARS[charIdx].strokes
    const doneCount = charDone[charIdx] ?? 0
    const sIdx = st && st.char === charIdx ? st.stroke : doneCount
    if (sIdx >= strokes.length) return null
    const pts = strokes[sIdx].pts
    let best = Infinity, bestI = -1
    pts.forEach((p, i) => {
      const d = Math.hypot(p[0] - x, p[1] - y)
      if (d < best) { best = d; bestI = i }
    })
    if (best > TOL) return null
    return { stroke: sIdx, prog: bestI / (pts.length - 1) }
  }

  const onCharDown = (charIdx: number) => (e: React.PointerEvent<SVGSVGElement>) => {
    if (phase !== 'trace') return
    const svg = e.currentTarget
    svg.setPointerCapture(e.pointerId)
    const { x, y } = svgPoint(svg, e)
    const hit = traceHit(charIdx, x, y)
    const doneCount = charDone[charIdx] ?? 0
    if (hit && hit.stroke === doneCount && hit.prog < 0.25) {
      tracingRef.current = { char: charIdx, stroke: hit.stroke, prog: hit.prog }
    }
  }
  const onCharMove = (charIdx: number) => (e: React.PointerEvent<SVGSVGElement>) => {
    const tr = tracingRef.current
    if (!tr || tr.char !== charIdx || phase !== 'trace') return
    const svg = e.currentTarget
    const { x, y } = svgPoint(svg, e)
    const hit = traceHit(charIdx, x, y)
    if (!hit || hit.stroke !== tr.stroke) return
    if (hit.prog >= tr.prog - 0.06) {
      tr.prog = Math.max(tr.prog, hit.prog)
      const pts = CHARS[charIdx].strokes[tr.stroke].pts
      const upto = Math.max(2, Math.floor(tr.prog * (pts.length - 1)))
      const d = 'M' + pts.slice(0, upto).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')
      setInkPaths((prev) => ({ ...prev, [`${charIdx}-${tr.stroke}`]: d }))
      if (tr.prog > 0.96) {
        // 完成一笔
        setCharDone((prev) => {
          const next = [...prev]
          next[charIdx] = (next[charIdx] ?? 0) + 1
          return next
        })
        tracingRef.current = null
      }
    }
  }
  const onCharUp = (charIdx: number) => () => {
    const tr = tracingRef.current
    if (tr && tr.char === charIdx) {
      // 描错 / 中途松手：这一笔重来
      setInkPaths((prev) => {
        const next = { ...prev }
        delete next[`${charIdx}-${tr.stroke}`]
        return next
      })
      tracingRef.current = null
    }
  }

  const allCharsDone = CHARS.every((_, i) => (charDone[i] ?? 0) >= CHARS[i].strokes.length)
  useEffect(() => {
    if (allCharsDone && phase === 'trace') {
      later(() => { setSignOn(true); setPhase('sign') }, 900)
    }
  }, [allCharsDone, phase, later])

  // 盖章后光变暗一度
  useEffect(() => {
    setLightDim(phase === 'stamp' || phase === 'black')
  }, [phase])

  // ---- 签字 ----
  const signAreaRef = useRef<HTMLDivElement | null>(null)
  const signDragRef = useRef(false)
  const onSignDown = (e: React.PointerEvent) => {
    if (phase !== 'sign') return
    if (signLockRef.current && !signResumeRef.current) {
      // 笔停住之后：再按一次，手继续
      signResumeRef.current = true
      setPenTremble(false)
    }
    signDragRef.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    onSignMove(e)
  }
  const onSignMove = (e: React.PointerEvent) => {
    if (!signDragRef.current || phase !== 'sign' || !signAreaRef.current) return
    if (signLockRef.current && !signResumeRef.current) return // 笔自己停了
    const r = signAreaRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    if (!signLockRef.current && pct >= 0.55) {
      // 划到一半，笔自己停住
      signLockRef.current = true
      signDragRef.current = false
      setSignPct(0.55)
      setPenTremble(true)
      if (thudRef.current) {
        const a = thudRef.current.cloneNode() as HTMLAudioElement
        a.volume = 0.18; a.playbackRate = 0.7
        a.play().catch(() => {})
      }
      return
    }
    setSignPct((p) => Math.max(p, pct))
    if (pct > 0.97) {
      signDragRef.current = false
      later(() => setPhase('stamp'), 700)
    }
  }
  const onSignUp = () => { signDragRef.current = false }

  // ---- 渲染 ----
  const ring = useMemo(() => {
    if (phase === 'line') return { x: 72, y: 58 }
    if (phase === 'room') return { x: 45, y: 64 }
    return null
  }, [phase])

  const grey = ['bam', 'walk', 'room', 'trace', 'sign', 'stamp'].includes(phase)
  const workshopOn = ['night', 'line', 'report', 'bam'].includes(phase)
  const corridorOn = phase === 'walk'
  const roomOn = ['room', 'trace', 'sign', 'stamp'].includes(phase)

  return (
    <div className="act4-root">
      <div
        ref={stageRef}
        className={`act4-stage ${grey ? 'grey' : ''} ${guardOn ? 'guard-slow' : ''}`}
        onPointerDown={onStagePointer}
      >
        {/* 车间 */}
        <div className={`act4-bg workshop ${workshopOn ? 'on' : ''} ${phase === 'line' ? 'pulsing' : ''}`} style={{ backgroundImage: 'url(/act4/workshop.webp)' }} />
        {workshopOn && <div className="act4-lampglow" />}
        {workshopOn && [14, 30, 52, 66, 82].map((x, i) => (
          <span key={i} className="act4-dust" style={{ left: `${x}%`, top: `${(i * 17) % 40}%`, animationDelay: `${i * 2.3}s` }} />
        ))}

        {/* 计件牌 */}
        {phase === 'line' && (
          <div className="act4-quota">计件 <b>{String(feeds).padStart(2, '0')}</b> / {QUOTA}</div>
        )}

        {/* 挡板（虚影，可拖） */}
        {phase === 'line' && !guardOn && (
          <div ref={guardRef} className="act4-guard" style={{ left: '6%', top: '58%' }}
            onPointerDown={onGuardDown} onPointerMove={onGuardMove} onPointerUp={onGuardUp}>
            <svg width="110" height="130" viewBox="0 0 110 130">
              <rect x="6" y="6" width="98" height="118" fill="none" stroke="rgba(255,210,130,0.65)" strokeWidth="2" strokeDasharray="7 6" />
              <line x1="6" y1="6" x2="104" y2="124" stroke="rgba(255,210,130,0.4)" strokeWidth="1.5" strokeDasharray="7 6" />
              <line x1="104" y1="6" x2="6" y2="124" stroke="rgba(255,210,130,0.4)" strokeWidth="1.5" strokeDasharray="7 6" />
            </svg>
          </div>
        )}
        {phase === 'line' && guardOn && (
          <div ref={guardRef} className="act4-guard mounted" style={{ left: '62%', top: '42%' }}
            onPointerDown={onGuardDown} onPointerMove={onGuardMove} onPointerUp={onGuardUp}>
            <svg width="110" height="130" viewBox="0 0 110 130">
              <rect x="6" y="6" width="98" height="118" fill="rgba(40,32,20,0.85)" stroke="rgba(255,150,110,0.8)" strokeWidth="2" />
              <line x1="6" y1="6" x2="104" y2="124" stroke="rgba(255,150,110,0.5)" strokeWidth="1.5" />
              <line x1="104" y1="6" x2="6" y2="124" stroke="rgba(255,150,110,0.5)" strokeWidth="1.5" />
            </svg>
          </div>
        )}

        {/* 红标语闪 + 主任影子 */}
        <div className={`act4-redwash ${guardOn ? 'on' : ''}`} />
        <div className={`act4-foreman ${guardOn ? 'on' : ''}`} />

        {/* 填报表（他转身） */}
        {phase === 'report' && (
          <div className="act4-deskpen">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <rect x="8" y="34" width="44" height="20" fill="#171310" />
              <rect x="26" y="12" width="4" height="26" fill="#d8c9a3" transform="rotate(24 28 25)" />
            </svg>
          </div>
        )}

        {/* 走廊 */}
        <div className={`act4-corridor ${corridorOn ? 'on' : ''}`}>
          <div className="door" />
        </div>

        {/* 调查室 */}
        <div className={`act4-bg ${roomOn ? 'on' : ''}`} style={{ backgroundImage: 'url(/act4/room.webp)' }} />

        {/* 呼吸金圈（唯一指引） */}
        {ring && <div className="act4-ring" style={{ left: `${ring.x}%`, top: `${ring.y}%`, width: 64, height: 64 }} />}

        {/* 光粒 */}
        <div className={`act4-light ${lightDim ? 'dim' : ''}`} style={{ left: `${light.x}%`, top: `${light.y}%` }} />

        {/* 文件：描字 + 签字 */}
        {(phase === 'trace' || phase === 'sign' || phase === 'stamp') && (
          <div className="act4-docwrap" onPointerDown={(e) => e.stopPropagation()}>
            <div className="act4-doc">
              <h3>职工伤亡事故调查报告</h3>
              <div className="docsub">红星机械厂 · 一九八八年七月</div>
              <div className="act4-fakeline" style={{ width: '92%' }} />
              <div className="act4-fakeline" style={{ width: '98%' }} />
              <div className="act4-fakeline" style={{ width: '86%' }} />
              <div className="act4-fakeline" style={{ width: '60%' }} />
              <div className="act4-verdict">事故性质：<b>学徒违规操作</b></div>
              <div className="act4-chars">
                {CHARS.map((c, i) => {
                  const done = (charDone[i] ?? 0) >= c.strokes.length
                  return (
                    <svg key={i} className={`act4-char ${done ? 'done' : ''}`} viewBox="0 0 100 100"
                      onPointerDown={onCharDown(i)} onPointerMove={onCharMove(i)} onPointerUp={onCharUp(i)}>
                      <defs>
                        <filter id="act4rough">
                          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" result="n" />
                          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
                        </filter>
                      </defs>
                      <text className="ghost" x="50" y="82" fontSize="86" textAnchor="middle">{c.ch}</text>
                      {Object.entries(inkPaths)
                        .filter(([k]) => k.startsWith(`${i}-`))
                        .map(([k, d]) => (
                          <path key={k} className="inkpath" d={d} strokeWidth="7" />
                        ))}
                    </svg>
                  )
                })}
              </div>
              <div className={`act4-signrow ${signOn ? 'on' : ''}`}>
                <div style={{ fontSize: 15, letterSpacing: '0.12em' }}>调查人（签字）：</div>
                <div
                  ref={signAreaRef}
                  className="act4-signline"
                  onPointerDown={onSignDown} onPointerMove={onSignMove} onPointerUp={onSignUp}
                >
                  <svg width="100%" height="64" viewBox="0 0 400 64" preserveAspectRatio="none">
                    <line x1="8" y1="46" x2="392" y2="46" stroke="rgba(43,36,25,0.45)" strokeWidth="1.4" strokeDasharray="6 5" />
                    <path
                      d={`M8,46 C ${8 + 384 * signPct * 0.4},${46 - 22 * signPct} ${8 + 384 * signPct * 0.7},${46 + 14 * signPct} ${8 + 384 * signPct},46`}
                      stroke="rgba(30,22,12,0.9)" strokeWidth="2.6" fill="none" strokeLinecap="round"
                    />
                  </svg>
                  <svg className={`act4-pen ${penTremble ? 'tremble' : ''}`} style={{ left: `${8 + signPct * 84}%` }} viewBox="0 0 44 44">
                    <rect x="19" y="4" width="5" height="26" rx="2" fill="#2b2419" transform="rotate(30 21 17)" />
                    <polygon points="14,34 20,42 26,36" fill="#2b2419" />
                  </svg>
                </div>
              </div>
              {phase === 'stamp' && (
                <div className={`act4-stamp ${phase === 'stamp' ? 'slam' : ''}`}>
                  <span>情况属实</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 黑场 → 计数牌 → 片尾 */}
      <div className={`act4-black ${['black', 'board', 'end'].includes(phase) ? 'on' : ''}`} />
      <div className={`act4-board ${phase === 'board' ? 'on' : ''}`}>
        <div className="boardtitle">安 全 生 产 天 数</div>
        <div className="act4-digits">
          {(flipDigits ? '001' : '217').split('').map((d, i) => (
            <div key={i} className={`act4-digit ${flipDigits ? 'flip' : ''}`}>{d}</div>
          ))}
        </div>
      </div>
      <div className={`act4-endcard ${phase === 'end' ? 'on' : ''}`}>
        <div className="t">第四章 · 三秒</div>
        <div className="s">{onDone ? '' : '垂 直 切 片 · 完'}</div>
        {!onDone && <a href="#/">回到标题</a>}
      </div>

      <div className="act4-vignette" />
      <div className="act4-grain" />
      <div className="act4-bar top" />
      <div className="act4-bar bottom" />
    </div>
  )
}
