import { useEffect, useRef, useState } from 'react'
import { Shell, LIGHTS, useLoop, useTimers } from './ui'
import type { Pt } from './ui'

// ------------------------------------------------------------
// 第一幕 · 夜班（2025）—— 教学：光会动 → 点灯 → 显影 → 走到糖纸
// ------------------------------------------------------------
export function Act1({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0) // 0黑场 1光漂 2等点灯 3显影 4书落 5等糖纸 6收尾
  const [light, setLight] = useState<Pt>({ x: 50, y: 62 })
  const later = useTimers()

  useEffect(() => {
    later(() => setStep(1), 1600)
    later(() => { setLight({ x: 55, y: 57 }); setStep(2) }, 3200)
  }, [later])

  const onTap = () => {
    if (step === 2) {
      setLight({ x: 30, y: 54 })
      setStep(3)
      later(() => setStep(4), 2600)   // 显影后书落下
      later(() => setStep(5), 4200)
    } else if (step === 5) {
      setLight({ x: 44, y: 72 })
      setStep(6)
      later(onDone, 2400)
    }
  }

  return (
    <Shell
      bg="/story/a1.webp"
      bgOn={step >= 3}
      light={light}
      lightColor={LIGHTS[1].core}
      lightGlow={LIGHTS[1].glow}
      rings={
        step === 2 ? [{ x: 30, y: 54 }]
        : step === 5 ? [{ x: 44, y: 72, size: 52 }]
        : []
      }
      onPointerDown={onTap}
    >
      {step >= 4 && (
        <svg width="70" height="54" viewBox="0 0 70 54" style={{ position: 'absolute', left: '41.5%', top: '63%', zIndex: 16 }}>
          <rect x="8" y="22" width="46" height="26" rx="2" fill="#3a2f1e" transform="rotate(-6 30 35)" />
          <rect x="12" y="24" width="38" height="21" rx="1" fill="#e8dcc0" transform="rotate(-6 30 35)" />
          <rect x="40" y="12" width="16" height="10" fill="rgba(255,205,100,0.85)" transform="rotate(14 48 17)"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,200,90,0.8))' }} />
        </svg>
      )}
    </Shell>
  )
}

// ------------------------------------------------------------
// 第二幕 · 空城（2020）—— 把光送进每一扇窗；"没有回应"也是结局
// ------------------------------------------------------------
const WIN_RESP: ('warm' | 'blink' | 'hollow')[] = [
  'warm', 'blink', 'warm', 'hollow',
  'blink', 'warm', 'blink', 'hollow',
  'blink', 'warm', 'blink', 'blink',
]

export function Act2({ onDone }: { onDone: () => void }) {
  const [wins, setWins] = useState<string[]>(Array(12).fill(''))
  const [light, setLight] = useState<Pt>({ x: 50, y: 88 })
  const [finale, setFinale] = useState(false)
  const later = useTimers()
  useLoop('/story/amb-city.mp3', 0.4)

  const visited = wins.filter((w) => w !== '').length
  useEffect(() => {
    if (visited === 12 && !finale) later(() => setFinale(true), 1200)
  }, [visited, finale, later])

  const tapWin = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation()
    if (wins[i]) return
    const resp = WIN_RESP[i]
    setWins((w) => { const n = [...w]; n[i] = resp; return n })
    // 光飞过去；空窗（hollow）的光自己退回来
    const gx = 49 + (i % 4) * 8.2
    const gy = 9 + Math.floor(i / 4) * 21
    setLight({ x: gx, y: gy })
    if (resp === 'hollow') later(() => setLight({ x: 50, y: 88 }), 1600)
  }

  const tapFinal = (e: React.PointerEvent) => {
    e.stopPropagation()
    setLight({ x: 60, y: 56 })
    later(onDone, 2600)
  }

  return (
    <Shell
      bg="/story/a2.webp"
      bgOn
      light={light}
      lightColor={LIGHTS[2].core}
      lightGlow={LIGHTS[2].glow}
    >
      <div className="win-grid" style={{ left: '46%', top: '4%', width: '30%', height: '60%' }}>
        {wins.map((w, i) => (
          <div key={i} className={`win ${w} ${w ? 'visited' : ''}`} onPointerDown={tapWin(i)} />
        ))}
      </div>
      {finale && (
        <div className="win final" style={{ position: 'absolute', left: '57.5%', top: '50%', width: '6.5%', aspectRatio: '3/4' }} onPointerDown={tapFinal}>
          <div className="phone">最近好吗</div>
        </div>
      )}
    </Shell>
  )
}

// ------------------------------------------------------------
// 第三幕 · 下岗（1998）—— 找名字 → 穿过落了一半的卷帘门 → 搪瓷缸进纸箱
// ------------------------------------------------------------
const NAMES = ['王建国', '刘桂香', '张铁柱', '顾长明', '陈爱华', '赵德福', '孙玉梅', '周保田']

export function Act3({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0) // 0名单 1门 2缸
  const [found, setFound] = useState(false)
  const [light, setLight] = useState<Pt>({ x: 50, y: 82 })
  const [passed, setPassed] = useState(0)
  const [door2up, setDoor2up] = useState(0) // 0-1
  const [mugDone, setMugDone] = useState(false)
  const [flash, setFlash] = useState(false)
  const later = useTimers()
  const drag = useRef<{ on: boolean; dx: number; dy: number }>({ on: false, dx: 0, dy: 0 })
  const [mugPos, setMugPos] = useState({ x: 16, y: 70 })
  const stageRef = useRef<HTMLDivElement | null>(null)

  const pickName = (n: string) => (e: React.PointerEvent) => {
    e.stopPropagation()
    if (n !== '顾长明' || found) return
    setFound(true)
    later(() => { setStep(1); setLight({ x: 18, y: 70 }) }, 1300)
  }

  // 门：1 缝（点过） 2 拖起来再点 3 破洞（点过）
  const passZone = (i: number) => (e: React.PointerEvent) => {
    e.stopPropagation()
    if (i === 1 && passed === 0) { setPassed(1); setLight({ x: 38, y: 66 }) }
    if (i === 2 && passed === 1 && door2up > 0.5) { setPassed(2); setLight({ x: 60, y: 62 }) }
    if (i === 3 && passed === 2) {
      setPassed(3)
      setLight({ x: 82, y: 58 })
      later(() => { setStep(2); setLight({ x: 24, y: 66 }) }, 1500)
    }
  }

  // 卷帘门 2 拖拽
  const doorDrag = useRef(false)
  const onDoor2Down = (e: React.PointerEvent) => {
    if (passed !== 1) return
    doorDrag.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onDoor2Move = (e: React.PointerEvent) => {
    if (!doorDrag.current || !stageRef.current) return
    const r = stageRef.current.getBoundingClientRect()
    const y = (e.clientY - r.top) / r.height
    setDoor2up(Math.max(0, Math.min(1, 1 - (y - 0.18) / 0.34)))
  }
  const onDoor2Up = () => { doorDrag.current = false }

  // 搪瓷缸拖拽
  const onMugDown = (e: React.PointerEvent) => {
    if (mugDone) return
    drag.current = { on: true, dx: 0, dy: 0 }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMugMove = (e: React.PointerEvent) => {
    if (!drag.current.on || !stageRef.current) return
    const r = stageRef.current.getBoundingClientRect()
    setMugPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
  }
  const onMugUp = () => {
    if (!drag.current.on) return
    drag.current.on = false
    if (mugPos.x > 70 && mugPos.x < 92 && mugPos.y > 60 && mugPos.y < 84) {
      setMugDone(true)
      setMugPos({ x: 81, y: 71 })
      setFlash(true)
      setLight({ x: 81, y: 66 })
      later(onDone, 2600)
    } else {
      setMugPos({ x: 16, y: 70 })
    }
  }

  return (
    <div ref={stageRef} style={{ position: 'fixed', inset: 0 }}>
      <Shell
        bg="/story/a3.webp"
        bgOn
        light={light}
        lightColor={LIGHTS[3].core}
        lightGlow={LIGHTS[3].glow}
        rings={
          step === 0 && !found ? [{ x: 20, y: 40, size: 90 }]
          : step === 1 && passed === 0 ? [{ x: 30, y: 74, size: 56 }]
          : step === 1 && passed === 1 ? [{ x: 52, y: 60, size: 56 }]
          : step === 1 && passed === 2 ? [{ x: 74, y: 58, size: 56 }]
          : step === 2 && !mugDone ? [{ x: 81, y: 71, size: 70 }]
          : []
        }
        onPointerDown={() => {}}
      >
        {/* 名单 */}
        {step === 0 && (
          <div className="prop-paper namelist" style={{ left: '8%', top: '16%', width: 230 }}>
            {NAMES.map((n) => (
              <div key={n} className={`row ${['王建国', '张铁柱', '孙玉梅'].includes(n) ? 'struck' : ''} ${found && n === '顾长明' ? 'found' : ''}`}
                onPointerDown={pickName(n)}>
                {n}
              </div>
            ))}
          </div>
        )}

        {/* 卷帘门 */}
        {step === 1 && (
          <>
            <div className="shutter" style={{ left: '26%', top: '18%', width: '10%', height: '52%' }} onPointerDown={passZone(1)} />
            <div
              className="shutter draggable"
              style={{ left: '48%', top: '18%', width: '10%', height: `${52 - door2up * 30}%`, touchAction: 'none' }}
              onPointerDown={onDoor2Down} onPointerMove={onDoor2Move} onPointerUp={onDoor2Up}
            />
            <div className="shutter" style={{ left: '70%', top: '18%', width: '10%', height: '52%' }} onPointerDown={passZone(3)}>
              <div style={{ position: 'absolute', left: '30%', top: '58%', width: '40%', height: '22%', background: '#060505', borderRadius: '40%' }} />
            </div>
            {/* 通过区域（门底缝 / 洞）的透明点击带 */}
            <div style={{ position: 'absolute', left: '26%', top: '70%', width: '10%', height: '16%', zIndex: 17 }} onPointerDown={passZone(1)} />
            <div style={{ position: 'absolute', left: '48%', top: `${70 - door2up * 30}%`, width: '10%', height: '16%', zIndex: 17 }} onPointerDown={passZone(2)} />
            <div style={{ position: 'absolute', left: '70%', top: '58%', width: '10%', height: '14%', zIndex: 17 }} onPointerDown={passZone(3)} />
          </>
        )}

        {/* 搪瓷缸 → 纸箱 */}
        {step === 2 && (
          <>
            <div className={`crate ${!mugDone ? 'hot' : ''}`} style={{ left: '72%', top: '62%', width: '18%', height: '20%' }}>纸箱</div>
            {!mugDone && (
              <svg className="mug" style={{ left: `${mugPos.x}%`, top: `${mugPos.y}%` }} width="52" height="60" viewBox="0 0 52 60"
                onPointerDown={onMugDown} onPointerMove={onMugMove} onPointerUp={onMugUp}>
                <rect x="8" y="10" width="30" height="40" rx="4" fill="#e8e2d2" />
                <rect x="8" y="10" width="30" height="8" rx="3" fill="#b3261e" opacity="0.8" />
                <path d="M38 20 q12 6 0 20" fill="none" stroke="#e8e2d2" strokeWidth="5" />
              </svg>
            )}
            {mugDone && (
              <svg className="mug" style={{ left: '78.5%', top: '60%' }} width="52" height="60" viewBox="0 0 52 60">
                <rect x="8" y="10" width="30" height="40" rx="4" fill="#e8e2d2" />
                <rect x="8" y="10" width="30" height="8" rx="3" fill="#b3261e" opacity="0.8" />
              </svg>
            )}
            {flash && <div className="goldflash" style={{ left: '81%', top: '68%' }} />}
          </>
        )}
      </Shell>
    </div>
  )
}
