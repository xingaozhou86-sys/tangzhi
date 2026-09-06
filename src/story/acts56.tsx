import { useRef, useState } from 'react'
import { Shell, LIGHTS, useLoop, useTimers } from './ui'
import type { Pt } from './ui'

// ------------------------------------------------------------
// 第五幕 · 舞会（1985）—— 灯球 → 收录机 → 画中画（1978 等信）
// ------------------------------------------------------------
const BOARD_NAMES = ['王建国', '李卫东', '张秀敏', '刘志强', '顾长明', '陈桂芳', '李小云', '赵德柱']

export function Act5({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(0) // 0灯球 1收录机 2画中画 3收尾
  const [pip, setPip] = useState(false)
  const [taken, setTaken] = useState<string[]>([])
  const [mine, setMine] = useState(false)
  const [light, setLight] = useState<Pt>({ x: 50, y: 82 })
  const later = useTimers()
  const boomRef = useRef<HTMLAudioElement | null>(null)

  const startBoom = (vol: number) => {
    if (!boomRef.current) {
      boomRef.current = new Audio('/story/boombox.mp3')
      boomRef.current.loop = true
    }
    boomRef.current.volume = vol
    boomRef.current.play().catch(() => {})
  }

  const onTap = () => {
    if (pip) return
    if (beat === 0) { setLight({ x: 24, y: 52 }); startBoom(0.12); setBeat(1) }
    else if (beat === 1) { setLight({ x: 70, y: 74 }); startBoom(0.55); setBeat(2) }
  }

  const pickName = (n: string) => (e: React.PointerEvent) => {
    e.stopPropagation()
    if (mine) return
    if (n === '顾长明') { setMine(true); return }
    if (!taken.includes(n)) setTaken((t) => [...t, n]) // 别人的名字一个个被勾走
  }

  const closePip = () => {
    if (!mine) return
    setPip(false)
    setBeat(3)
    setLight({ x: 50, y: 58 })
    later(onDone, 3000)
  }

  return (
    <Shell
      bg="/story/a5.webp"
      bgOn
      light={light}
      lightColor={LIGHTS[5].core}
      lightGlow={LIGHTS[5].glow}
      rings={
        beat === 0 ? [{ x: 24, y: 52 }]
        : beat === 1 ? [{ x: 70, y: 74 }]
        : beat === 2 && !pip ? [{ x: 14, y: 14, size: 80 }]
        : []
      }
      onPointerDown={onTap}
    >
      {/* 灯球点亮后的暖光罩 */}
      {beat >= 1 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 12, pointerEvents: 'none', mixBlendMode: 'screen',
          background: 'radial-gradient(circle at 24% 48%, rgba(255,190,100,0.4), transparent 42%)' }} />
      )}

      {/* 画中画：墙上的旧宣传画 */}
      {beat === 2 && !pip && (
        <div className="pip-frame" style={{ left: '10%', top: '10%' }} onPointerDown={(e) => { e.stopPropagation(); setPip(true) }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #3d3423, #221b10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(230,205,140,0.5)',
            fontSize: 11, letterSpacing: '0.3em', fontFamily: 'KaiTi, serif' }}>一九七八</div>
        </div>
      )}

      {/* 1978 · 邮电所等信 */}
      {pip && (
        <div className="pip-overlay" onPointerDown={closePip}>
          <div className="prop-paper pip-board" onPointerDown={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 13, letterSpacing: '0.3em', opacity: 0.6, marginBottom: 12, textAlign: 'center' }}>
              公社邮电所 · 来信登记
            </div>
            <div className="blk">
              {BOARD_NAMES.map((n) => (
                <span key={n}
                  className={`nm ${taken.includes(n) ? 'taken' : ''} ${mine && n === '顾长明' ? 'mine' : ''}`}
                  onPointerDown={pickName(n)}>
                  {n}{'　'}
                </span>
              ))}
            </div>
            {mine && (
              <div className="pip-letter">
                <div className="cutline"><em>录 取 线</em></div>
                成绩通知单 · 顾长明 · 总分 342 · 录取线 344 —— 差两分
              </div>
            )}
            {mine && <div className="pip-exit">点 画 外 退 出</div>}
          </div>
        </div>
      )}
    </Shell>
  )
}

// ------------------------------------------------------------
// 第六幕 · 分糖（1970）—— 走三步 → 按住糖纸两秒 → 调头
// ------------------------------------------------------------
export function Act6({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0) // 0-2 走 3 按住 4 调头
  const [light, setLight] = useState<Pt>({ x: 26, y: 74 })
  const [hold, setHold] = useState(0)
  const holdRef = useRef<number | null>(null)
  const later = useTimers()
  useLoop('/story/cicadas.mp3', 0.45)
  useLoop('/story/theme-mb.wav', 0.4)

  const STEPS: Pt[] = [{ x: 34, y: 68 }, { x: 42, y: 59 }, { x: 48, y: 50 }]

  const onTap = () => {
    if (step < 3) {
      const next = step + 1
      if (next <= 3) setLight(STEPS[Math.min(step, 2)])
      if (next === 3) setLight({ x: 50, y: 46 })
      setStep(Math.min(next, 3))
    }
  }

  const startHold = (e: React.PointerEvent) => {
    if (step !== 3) return
    e.stopPropagation()
    const t0 = performance.now()
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / 2000)
      setHold(p)
      if (p >= 1) {
        holdRef.current = null
        setStep(4)
        later(onDone, 5200)
        return
      }
      holdRef.current = requestAnimationFrame(tick)
    }
    holdRef.current = requestAnimationFrame(tick)
    const cancel = () => {
      if (holdRef.current) cancelAnimationFrame(holdRef.current)
      holdRef.current = null
      setHold(0)
    }
    window.addEventListener('pointerup', cancel, { once: true })
  }

  const R = 34
  const CIRC = 2 * Math.PI * R

  return (
    <Shell
      bg="/story/a6.webp"
      bgOn
      upturn={step === 4}
      light={light}
      lightColor={LIGHTS[6].core}
      lightGlow={LIGHTS[6].glow}
      lightScale={step === 4 ? 1.9 : 1}
      rings={step === 3 ? [{ x: 50, y: 46, size: 76 }] : []}
      onPointerDown={onTap}
    >
      {step === 3 && (
        <svg className="hold-ring" style={{ left: '50%', top: '46%' }} width="96" height="96" viewBox="0 0 96 96"
          onPointerDown={startHold}>
          <circle cx="48" cy="48" r={R} fill="none" stroke="rgba(255,220,130,0.25)" strokeWidth="4" />
          <circle cx="48" cy="48" r={R} fill="none" stroke="#ffd76a" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - hold)} transform="rotate(-90 48 48)" />
        </svg>
      )}
    </Shell>
  )
}
