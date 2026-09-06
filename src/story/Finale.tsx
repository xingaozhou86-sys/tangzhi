import { useEffect, useRef, useState } from 'react'
import { Shell, LIGHTS, useTimers, playOnce, fadeVol, useLoop, dbgPh } from './ui'
import type { Pt } from './ui'

// ------------------------------------------------------------
// 回程 —— 列车顺时间往回开，五站，每站一个偿还动作：
// 1978 补盖邮戳 → 1985 把两把椅子并到一起 → 1988 照亮"情况属实"
// → 1998 取下那把锁 → 2020 点亮自己的窗 → 到站
// ------------------------------------------------------------
const FLASH_BGS = ['/story/a6.webp', '/story/a5.webp', '/act4/workshop.webp', '/story/a3.webp', '/story/a2.webp', '/story/a1.webp']

type St = 'flash' | 's78' | 's85' | 's88' | 's98' | 's20' | 'go'
const ORDER: St[] = ['s78', 's85', 's88', 's98', 's20']

export function ReturnLeg({ onDone }: { onDone: () => void }) {
  const D = dbgPh() as St | null
  const [st, setSt] = useState<St>(D ?? 'flash')
  const [flashIdx, setFlashIdx] = useState(0)
  const [lit, setLit] = useState(false)
  const [stampAt, setStampAt] = useState({ x: 65, y: 60 })
  const [stamped, setStamped] = useState(false)
  const [chairX, setChairX] = useState(30)
  const [chaired, setChaired] = useState(false)
  const [lockAt, setLockAt] = useState({ x: 50, y: 66 })
  const [unlocked, setUnlocked] = useState(false)
  const [winLit, setWinLit] = useState(false)
  const later = useTimers()
  const rootRef = useRef<HTMLDivElement | null>(null)

  // ---- 回程总谱：每偿还一站，复活一层乐器；1988 站全场静默 ----
  const STEMS = ['/story/stem-mb.wav', '/story/stem-pad.wav', '/story/stem-piano.wav']
  const STEM_VOL = [0.32, 0.24, 0.3]
  const stems = useRef<(HTMLAudioElement | null)[]>([null, null, null])
  const startStem = (i: number) => {
    if (stems.current[i]) return
    const a = new Audio(STEMS[i])
    a.loop = true
    a.volume = 0
    a.play().then(() => fadeVol(a, STEM_VOL[i], 2200)).catch(() => {})
    stems.current[i] = a
  }
  const duckAll = (v: number, ms = 900) => stems.current.forEach((a) => a && fadeVol(a, v, ms))
  useEffect(() => () => {
    stems.current.forEach((a) => { if (a) { fadeVol(a, 0, 500); window.setTimeout(() => a.pause(), 600) } })
  }, [])

  useEffect(() => {
    if (st !== 'flash') return
    if (flashIdx < FLASH_BGS.length) later(() => setFlashIdx(flashIdx + 1), 560)
    else later(() => setSt('s78'), 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st, flashIdx])

  const next = () => {
    const i = ORDER.indexOf(st)
    if (i < 0) return
    // 偿还完成 → 复活乐器
    if (st === 's78') startStem(0)          // 八音盒
    if (st === 's85') startStem(1)          // 暖垫
    if (st === 's88') stems.current.forEach((a, j) => a && fadeVol(a, STEM_VOL[j], 2400)) // 静默之后缓回来
    if (st === 's98') startStem(2)          // 钢琴
    if (st === 's20') duckAll(0.42, 1800)   // 全量
    setSt('go')
    later(() => {
      if (ORDER[i + 1] === 's88') duckAll(0.04, 800) // 进 1988：全场静默
      if (i + 1 < ORDER.length) setSt(ORDER[i + 1])
      else onDone()
    }, 1500)
  }

  const pct = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }
  }
  const dragOn = useRef(false)
  const dDown = (e: React.PointerEvent) => {
    dragOn.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
  }

  // 1978 盖戳
  const s78Move = (e: React.PointerEvent) => { if (dragOn.current && !stamped) setStampAt(pct(e)) }
  const s78Up = () => {
    if (!dragOn.current) return
    dragOn.current = false
    if (!stamped && Math.abs(stampAt.x - 44) < 9 && Math.abs(stampAt.y - 70) < 11) {
      setStampAt({ x: 44, y: 70 })
      setStamped(true)
      playOnce('/act4/thud.mp3', 0.4, 1.5)
      later(next, 2100)
    }
  }
  // 1985 并椅子
  const s85Move = (e: React.PointerEvent) => { if (dragOn.current && !chaired) setChairX(Math.max(24, Math.min(56, pct(e).x))) }
  const s85Up = () => {
    if (!dragOn.current) return
    dragOn.current = false
    if (!chaired && chairX > 47) {
      setChairX(51)
      setChaired(true)
      later(next, 2200)
    }
  }
  // 1998 取锁
  const s98Move = (e: React.PointerEvent) => { if (dragOn.current && !unlocked) setLockAt(pct(e)) }
  const s98Up = () => {
    if (!dragOn.current) return
    dragOn.current = false
    if (!unlocked && lockAt.y > 72) {
      setUnlocked(true)
      playOnce('/act4/thud.mp3', 0.3, 2.1)
      later(next, 2200)
    } else if (!unlocked) setLockAt({ x: 50, y: 66 })
  }
  // 1988 照亮 / 2020 点灯
  const onStage = () => {
    if (st === 's88' && !lit) {
      setLit(true)
      later(next, 5200)
    } else if (st === 's20' && !winLit) {
      setWinLit(true)
      later(next, 2600)
    }
  }

  const rings = () => {
    if (st === 's78' && !stamped) return [{ x: stampAt.x, y: stampAt.y, size: 56 }]
    if (st === 's85' && !chaired) return [{ x: chairX + 2.5, y: 60, size: 60 }]
    if (st === 's88' && !lit) return [{ x: 50, y: 56, size: 90 }]
    if (st === 's98' && !unlocked) return [{ x: 50, y: 66, size: 56 }]
    if (st === 's20' && !winLit) return [{ x: 30, y: 56, size: 64 }]
    return []
  }

  if (st === 'flash') {
    const bg = FLASH_BGS[Math.min(flashIdx, FLASH_BGS.length - 1)]
    return (
      <div className="act4-root">
        <div className="act4-bg on" style={{ backgroundImage: `url(${bg})`, opacity: 0.12, transition: 'opacity 0.3s' }} />
        <div className="act4-bar top" /><div className="act4-bar bottom" />
      </div>
    )
  }

  if (st === 'go') {
    // 车窗流光
    return (
      <div className="act4-root">
        <div className="act4-stage" style={{ background: '#05060a', overflow: 'hidden' }}>
          {[12, 30, 48, 66, 84].map((t, i) => (
            <div key={i} className="streak" style={{ top: `${t}%`, animationDelay: `${i * 0.22}s`,
              background: i % 2 ? 'rgba(255,190,100,0.5)' : 'rgba(150,190,240,0.35)' }} />
          ))}
        </div>
        <div className="act4-vignette" />
        <div className="act4-bar top" /><div className="act4-bar bottom" />
      </div>
    )
  }

  const bgFor: Record<string, string | undefined> = {
    s78: '/story/a5-post1978.webp', s85: '/story/a5-roof.webp', s88: '/act4/room.webp',
    s98: '/story/a3-gate.webp', s20: '/story/a2-windows.webp',
  }
  const lightFor: Record<string, { x: number; y: number; c: number }> = {
    s78: { x: stampAt.x, y: stampAt.y, c: 5 },
    s85: { x: chairX + 6, y: 58, c: 5 },
    s88: { x: 50, y: 56, c: 4 },
    s98: { x: lockAt.x, y: lockAt.y, c: 3 },
    s20: { x: 30, y: 56, c: 2 },
  }
  const L = lightFor[st]

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0 }}>
      <Shell
        bg={bgFor[st]} bgOn
        grey={st === 's98' && !unlocked}
        light={{ x: L.x, y: L.y }}
        lightColor={LIGHTS[L.c].core} lightGlow={LIGHTS[L.c].glow}
        lightScale={st === 's88' && lit ? 1.6 : st === 's20' && winLit ? 1.4 : 1}
        rings={rings()}
        onPointerDown={onStage}
      >
        {/* 1978 · 补盖邮戳 */}
        {st === 's78' && (
          <>
            <div style={{ position: 'absolute', left: '38%', top: '66%', width: '12%', aspectRatio: '1.7/1',
              background: 'linear-gradient(160deg,#e2d3ac,#c9b586)', border: '1px solid #a08d60',
              filter: 'brightness(0.8) saturate(0.85)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.5)', zIndex: 14, pointerEvents: 'none', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom right, transparent 49.4%, rgba(120,100,60,0.6) 49.4% 50.6%, transparent 50.6%), linear-gradient(to bottom left, transparent 49.4%, rgba(120,100,60,0.6) 49.4% 50.6%, transparent 50.6%)' }} />
              <div style={{ position: 'absolute', right: '6%', top: '8%', width: '14%', aspectRatio: '4/5',
                background: '#a03a28', border: '1px dashed rgba(240,225,190,0.8)' }} />
              {stamped && (
                <div style={{ position: 'absolute', right: '6%', top: '10%', width: 26, height: 26,
                  border: '2.5px solid rgba(178,44,30,0.8)', borderRadius: '50%',
                  animation: 'propIn 0.5s ease' }} />
              )}
            </div>
            {!stamped && (
              <div onPointerDown={dDown} onPointerMove={s78Move} onPointerUp={s78Up}
                style={{ position: 'absolute', left: `${stampAt.x}%`, top: `${stampAt.y}%`, zIndex: 16,
                  width: 34, height: 52, marginLeft: -17, marginTop: -26, cursor: 'grab', touchAction: 'none',
                  filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.7))' }}>
                <div style={{ width: 34, height: 28, borderRadius: '17px 17px 4px 4px',
                  background: 'linear-gradient(160deg,#8a6238,#4e341a)',
                  border: '1px solid rgba(230,200,150,0.35)' }} />
                <div style={{ width: 34, height: 20, marginTop: 3, borderRadius: 4,
                  background: 'linear-gradient(160deg,#a83528,#6e2018)',
                  boxShadow: 'inset 0 2px 3px rgba(255,180,150,0.4)' }} />
              </div>
            )}
          </>
        )}

        {/* 1985 · 并椅子 */}
        {st === 's85' && (
          <>
            <div style={{ position: 'absolute', left: '56%', top: '56%', width: '5%', height: '16%', zIndex: 14,
              background: 'linear-gradient(180deg,#241a10,#171008)', borderRadius: 3, pointerEvents: 'none' }} />
            <div onPointerDown={chaired ? undefined : dDown} onPointerMove={s85Move} onPointerUp={s85Up}
              style={{ position: 'absolute', left: `${chairX}%`, top: '56%', width: '5%', height: '16%', zIndex: 15,
                background: 'linear-gradient(180deg,#2c2012,#1a1208)', borderRadius: 3,
                cursor: chaired ? 'default' : 'grab', touchAction: 'none',
                transition: chaired ? 'left 0.7s ease' : 'none' }} />
            {chaired && (
              <div style={{ position: 'absolute', left: '46%', top: '48%', width: '22%', height: '30%',
                zIndex: 13, pointerEvents: 'none', animation: 'propIn 1.6s ease',
                background: 'radial-gradient(ellipse, rgba(255,190,100,0.28), rgba(255,190,100,0) 70%)' }} />
            )}
          </>
        )}

        {/* 1988 · 情况属实 */}
        {st === 's88' && (
          <div style={{ position: 'absolute', left: '50%', top: '56%', transform: 'translate(-50%,-50%)', zIndex: 20,
            fontFamily: '"KaiTi","STKaiti",serif', fontSize: 'clamp(40px,7vw,84px)', letterSpacing: '0.12em',
            color: lit ? '#ffdf9a' : 'rgba(200,180,140,0.5)',
            textShadow: lit ? '0 0 30px rgba(255,200,90,0.9), 0 0 80px rgba(255,190,80,0.5)' : 'none',
            transition: 'all 2.4s ease', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            情况属实
          </div>
        )}

        {/* 1998 · 取锁 */}
        {st === 's98' && (
          <>
            {!unlocked && (
              <div onPointerDown={dDown} onPointerMove={s98Move} onPointerUp={s98Up}
                style={{ position: 'absolute', left: `${lockAt.x}%`, top: `${lockAt.y}%`, zIndex: 16,
                  width: 30, height: 38, marginLeft: -15, marginTop: -19, borderRadius: '5px 5px 7px 7px',
                  background: 'linear-gradient(160deg, #c8a44e, #7a5e22)',
                  boxShadow: '0 6px 14px rgba(0,0,0,0.75), inset 0 2px 3px rgba(255,240,190,0.6)',
                  cursor: 'grab', touchAction: 'none' }} />
            )}
            {unlocked && (
              <div style={{ position: 'absolute', left: '52.5%', top: '18%', width: '1.6%', height: '64%',
                zIndex: 15, pointerEvents: 'none', animation: 'propIn 2.2s ease',
                background: 'linear-gradient(180deg, transparent, rgba(255,220,150,0.9), transparent)',
                filter: 'blur(1.5px)' }} />
            )}
          </>
        )}

        {/* 2020 · 点亮自己的窗（她的窗回应地闪一下） */}
        {st === 's20' && (
          <>
            <div style={{ position: 'absolute', left: '65%', top: '21%', width: '6%', aspectRatio: '3/4',
              zIndex: 12, pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(255,206,120,0.55), rgba(255,206,120,0) 75%)',
              animation: winLit ? 'win-blink2 1.4s ease 0.8s' : undefined }} />
            {winLit && (
              <div style={{ position: 'absolute', left: '26.5%', top: '51%', width: '7%', aspectRatio: '3/4',
                zIndex: 12, pointerEvents: 'none', animation: 'propIn 1.4s ease',
                background: 'radial-gradient(circle, rgba(255,220,150,0.85), rgba(255,220,150,0) 75%)' }} />
            )}
          </>
        )}
      </Shell>
    </div>
  )
}

// ------------------------------------------------------------
// 终幕 —— 写信 / 发糖纸 / 送他上车 / 回应 / 村口分糖
// ------------------------------------------------------------

// 信：描一句话（三次写成，前两次笔抖纸皱）
const LETTER = '1988年7月那晚，冲床的挡板是拆了的。'
const LETTER_STROKES = [
  'M4,34 C 60,30 140,30 196,34',
  'M4,64 C 60,60 140,60 196,64',
  'M4,94 C 60,90 140,90 196,94',
]

function cubicPts(d: string, n = 60): number[][] {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
  const [x0, y0, x1, y1, x2, y2, x3, y3] = nums
  const pts: number[][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    pts.push([
      u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
      u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3,
    ])
  }
  return pts
}
const LETTER_PTS = LETTER_STROKES.map((d) => cubicPts(d))

type FinPhase = 'letter' | 'photo' | 'train' | 'answer' | 'village' | 'dark'

export function Finale({ onDone }: { onDone: () => void }) {
  const [fp, setFp] = useState<FinPhase>((dbgPh() as FinPhase) ?? 'letter')
  const [light, setLight] = useState<Pt>({ x: 50, y: 80 })
  const later = useTimers()

  // 写信/发糖纸：回程复活的乐器以极轻音量延续；上车后交由完整钢琴
  const quiet = fp === 'letter' || fp === 'photo'
  useLoop(quiet ? '/story/stem-mb.wav' : null, 0.09)
  useLoop(quiet ? '/story/stem-pad.wav' : null, 0.07)
  useLoop(quiet ? '/story/stem-piano.wav' : null, 0.1)

  // ---- 信 ----
  const [attempt, setAttempt] = useState(0)
  const [strokeIdx, setStrokeIdx] = useState(0)
  const [ink, setInk] = useState<string[]>([])
  const [crumple, setCrumple] = useState(false)
  const tracing = useRef<{ prog: number } | null>(null)
  const TOLL = 14

  const svgPt = (svg: SVGSVGElement, e: React.PointerEvent) => {
    const r = svg.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * 200, y: ((e.clientY - r.top) / r.height) * 120 }
  }
  const onLetterDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (fp !== 'letter') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = svgPt(e.currentTarget, e)
    const pts = LETTER_PTS[strokeIdx]
    if (!pts) return
    const d0 = Math.hypot(pts[0][0] - x, pts[0][1] - y)
    if (d0 < TOLL + 8) tracing.current = { prog: 0 }
  }
  const onLetterMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const tr = tracing.current
    if (!tr || fp !== 'letter') return
    const { x, y } = svgPt(e.currentTarget, e)
    const pts = LETTER_PTS[strokeIdx]
    let best = Infinity, bestI = -1
    pts.forEach((p, i) => {
      const d = Math.hypot(p[0] - x, p[1] - y)
      if (d < best) { best = d; bestI = i }
    })
    if (best > TOLL) return
    const prog = bestI / (pts.length - 1)
    if (prog < tr.prog - 0.08) return
    tr.prog = Math.max(tr.prog, prog)
    const upto = Math.max(2, Math.floor(tr.prog * (pts.length - 1)))
    const d = 'M' + pts.slice(0, upto).map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')
    setInk((prev) => { const n = [...prev]; n[strokeIdx] = d; return n })
    if (tr.prog > 0.985) {
      tracing.current = null
      const nextStroke = strokeIdx + 1
      // 前两次尝试：写到 80% 纸皱
      if (attempt < 2 && nextStroke === 2 && tr.prog > 0.9) {
        // 第三次笔画开始前皱掉
      }
      if (attempt < 2 && nextStroke >= 3) {
        setCrumple(true)
        later(() => {
          setAttempt(attempt + 1)
          setStrokeIdx(0)
          setInk([])
          setCrumple(false)
        }, 1400)
        return
      }
      if (nextStroke >= 3) {
        later(() => setFp('photo'), 1600)
        return
      }
      setStrokeIdx(nextStroke)
    }
  }
  const onLetterUp = () => {
    if (tracing.current && tracing.current.prog < 0.985) {
      setInk((prev) => { const n = [...prev]; n[strokeIdx] = ''; return n })
    }
    tracing.current = null
  }

  // ---- 发糖纸（拍照三步）----
  const [photoStep, setPhotoStep] = useState(0)

  // ---- 送他上车 ----
  const [himPos, setHimPos] = useState({ x: 22, y: 62 })
  const [boarded, setBoarded] = useState(false)
  const himDrag = useRef(false)
  const finStageRef = useRef<HTMLDivElement | null>(null)
  const pianoRef = useRef<HTMLAudioElement | null>(null)

  const onHimDown = (e: React.PointerEvent) => {
    if (boarded) return
    himDrag.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onHimMove = (e: React.PointerEvent) => {
    if (!himDrag.current || !finStageRef.current) return
    const r = finStageRef.current.getBoundingClientRect()
    setHimPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  const onHimUp = () => {
    if (!himDrag.current) return
    himDrag.current = false
    if (himPos.x > 64 && himPos.x < 90 && himPos.y > 25 && himPos.y < 75) {
      setBoarded(true)
      setHimPos({ x: 76, y: 48 })
      pianoRef.current = playOnce('/story/theme-piano.wav', 0.6)
      later(() => setFp('answer'), 3600)
    } else {
      setHimPos({ x: 22, y: 62 })
    }
  }

  // ---- 村口分糖 ----
  const [candyPos, setCandyPos] = useState({ x: 30, y: 76 })
  const [candyDone, setCandyDone] = useState(false)
  const candyDrag = useRef(false)
  const onCandyDown = (e: React.PointerEvent) => {
    if (candyDone) return
    candyDrag.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onCandyMove = (e: React.PointerEvent) => {
    if (!candyDrag.current || !finStageRef.current) return
    const r = finStageRef.current.getBoundingClientRect()
    setCandyPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  const onCandyUp = () => {
    if (!candyDrag.current) return
    candyDrag.current = false
    if (candyPos.x > 18 && candyPos.x < 42 && candyPos.y > 78 && candyPos.y < 96) {
      setCandyDone(true)
      setCandyPos({ x: 27, y: 85 })
      setLight({ x: 27, y: 82 })
      setFp('dark')
      if (pianoRef.current) { pianoRef.current.pause() }
      later(() => { playOnce('/story/horn.mp3', 0.8) }, 3200)
      later(onDone, 7200)
    } else {
      setCandyPos({ x: 30, y: 76 })
    }
  }

  // answer 阶段自动推进
  useEffect(() => {
    if (fp === 'answer') later(() => setFp('village'), 4200)
  }, [fp, later])

  const ringFor = (): { x: number; y: number; size?: number }[] => {
    if (fp === 'letter') return [{ x: 50, y: 50, size: 90 }]
    if (fp === 'photo') return [{ x: 50, y: 36, size: 70 }]
    if (fp === 'train' && !boarded) return [{ x: 75, y: 45, size: 90 }]
    if (fp === 'village' && !candyDone) return [{ x: 27, y: 85, size: 76 }]
    return []
  }

  return (
    <div ref={finStageRef} style={{ position: 'fixed', inset: 0 }}>
      <Shell
        bg={fp === 'village' ? '/story/fin.webp' : fp === 'train' ? '/story/fin-station.webp' : undefined}
        bgOn={fp === 'village' || fp === 'train'}
        light={light}
        lightColor={LIGHTS[6].core}
        lightGlow={LIGHTS[6].glow}
        rings={ringFor()}
        onPointerDown={() => {
          if (fp === 'photo') setPhotoStep((s) => Math.min(s + 1, 3))
          if (fp === 'photo' && photoStep >= 2) later(() => setFp('train'), 900)
        }}
      >
        {/* 写信 */}
        {fp === 'letter' && (
          <div className="act4-docwrap" onPointerDown={(e) => e.stopPropagation()}>
            <div className="act4-doc" style={{
              transform: crumple ? 'rotate(14deg) scale(0.6)' : 'rotate(-1.1deg)',
              opacity: crumple ? 0 : 1, transition: 'all 0.7s ease',
            }}>
              <h3>一 封 信</h3>
              <div className="docsub">{attempt > 0 ? `（第 ${attempt + 1} 张纸）` : '　'}</div>
              <svg width="100%" viewBox="0 0 200 120" style={{ touchAction: 'none' }}
                onPointerDown={onLetterDown} onPointerMove={onLetterMove} onPointerUp={onLetterUp}>
                <text x="100" y="42" textAnchor="middle" fontSize="12.5" fill="rgba(60,48,30,0.22)"
                  fontFamily="KaiTi, STKaiti, serif">{LETTER.slice(0, 15)}</text>
                <text x="100" y="72" textAnchor="middle" fontSize="12.5" fill="rgba(60,48,30,0.22)"
                  fontFamily="KaiTi, STKaiti, serif">{LETTER.slice(15)}</text>
                <text x="100" y="102" textAnchor="middle" fontSize="12.5" fill="rgba(60,48,30,0.22)"
                  fontFamily="KaiTi, STKaiti, serif">—— 顾长明</text>
                {ink.filter(Boolean).map((d, i) => (
                  <path key={i} d={d} stroke="rgba(30,22,12,0.9)" strokeWidth="5" fill="none" strokeLinecap="round" />
                ))}
              </svg>
            </div>
          </div>
        )}

        {/* 发糖纸 */}
        {fp === 'photo' && (
          <div className="fin-phone">
            <div className="screen">
              <img src="/story/a6.webp" alt="" style={{ filter: photoStep >= 1 ? 'none' : 'blur(3px) brightness(0.6)', transition: 'filter 0.8s' }} />
              <div style={{ padding: '8px 4px', color: '#cfe0ee', fontSize: 13.5, fontFamily: 'KaiTi, serif',
                letterSpacing: '0.06em', background: '#101418', opacity: photoStep >= 2 ? 1 : 0.3, transition: 'opacity 0.6s' }}>
                找一个人。赵青禾，1960年生，原红星机械厂。另半张糖纸在她那里。
              </div>
              <div style={{ textAlign: 'center', padding: '6px 0 4px', color: photoStep >= 3 ? '#ffd76a' : '#556',
                fontSize: 13, letterSpacing: '0.5em', fontFamily: 'KaiTi, serif' }}>
                {photoStep >= 3 ? '已 发 送' : '发 送'}
              </div>
            </div>
          </div>
        )}

        {/* 送他上车（画作打底，车门光圈对准画中门） */}
        {fp === 'train' && (
          <>
            <div style={{ position: 'absolute', inset: 0, zIndex: 11,
              background: 'rgba(4,6,10,0.22)', pointerEvents: 'none' }} />
            <div className="train-door" />
            {!boarded && (
              <svg className="him" style={{ left: `${himPos.x}%`, top: `${himPos.y}%` }} viewBox="0 0 54 120"
                onPointerDown={onHimDown} onPointerMove={onHimMove} onPointerUp={onHimUp}>
                <circle cx="27" cy="16" r="11" fill="#0d0c0a" />
                <path d="M14,32 Q27,24 40,32 L43,84 Q27,92 11,84 Z" fill="#0d0c0a" />
                <rect x="17" y="84" width="8" height="32" fill="#0d0c0a" />
                <rect x="29" y="84" width="8" height="32" fill="#0d0c0a" />
                <rect x="38" y="58" width="14" height="18" rx="2" fill="#161310" />
              </svg>
            )}
          </>
        )}

        {/* 回应 —— 照片里的半张糖纸：大小与第六章玩家撕给谁的那半张一致 */}
        {fp === 'answer' && (
          <div className="fin-phone" style={{ boxShadow: '0 0 90px rgba(255,210,120,0.4)' }}>
            <div className="screen" style={{ position: 'relative' }}>
              <img src="/story/a6.webp" alt="" style={{ transform: 'scaleX(-1) rotate(2deg)' }} />
              {(() => {
                let gaveBig = true
                try { gaveBig = localStorage.getItem('zzc.gaveBig') !== '0' } catch { /* 默认大半 */ }
                const w = gaveBig ? 34 : 24   // 她把那半张留了五十五年
                return (
                  <div style={{
                    position: 'absolute', left: '50%', top: '58%', transform: 'translateX(-50%) rotate(-4deg)',
                    width: w, height: 20,
                    background: 'linear-gradient(100deg,#f0c860 0 22%, #d6543c 22% 40%, #e8dcc0 40%)',
                    clipPath: gaveBig
                      ? 'polygon(0 0, 96% 4%, 100% 50%, 96% 96%, 0 100%)'
                      : 'polygon(4% 4%, 100% 0, 100% 100%, 4% 96%, 0 50%)',
                    boxShadow: '0 0 18px rgba(255,210,120,0.75)',
                    animation: 'propIn 1.8s ease',
                  }} />
                )
              })()}
            </div>
          </div>
        )}

        {/* 村口分糖 */}
        {fp === 'village' && !candyDone && (
          <div className="candy-half" style={{ left: `${candyPos.x}%`, top: `${candyPos.y}%` }}
            onPointerDown={onCandyDown} onPointerMove={onCandyMove} onPointerUp={onCandyUp} />
        )}
        {fp === 'dark' && <div className="act4-black on" />}
      </Shell>
    </div>
  )
}
