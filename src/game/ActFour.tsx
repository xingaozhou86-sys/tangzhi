import { useEffect, useRef, useState } from 'react'

// ------------------------------------------------------------
// 第肆幕 · 签字
// 车间 → 桌上的检讨书 → 五笔 → 章落下 → 那扇门
// 全程无说明文字：笔顺亮起来，你就知道该点哪。
// ------------------------------------------------------------
export function ActFour({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'floor' | 'doc' | 'after'>('floor')
  const [marks, setMarks] = useState(0)
  const [stamped, setStamped] = useState(false)
  const [hint, setHint] = useState(false)
  const idleRef = useRef<number>(0)

  const poke = () => {
    window.clearTimeout(idleRef.current)
    setHint(false)
    idleRef.current = window.setTimeout(() => setHint(true), 6000)
  }

  useEffect(() => {
    const a = new Audio('/act4/press-loop.mp3')
    a.loop = true
    a.volume = 0.22
    a.play().catch(() => {})
    idleRef.current = window.setTimeout(() => setHint(true), 1600)
    return () => { a.pause(); window.clearTimeout(idleRef.current) }
  }, [])

  const thud = (vol: number) => {
    const s = new Audio('/act4/thud.mp3')
    s.volume = vol
    s.play().catch(() => {})
  }

  const sign = () => {
    if (stamped) return
    poke()
    const n = marks + 1
    setMarks(n)
    const pen = new Audio('/sfx/pencil.wav')
    pen.volume = 0.5
    pen.play().catch(() => {})
    if (n >= 5) {
      setStamped(true)
      window.setTimeout(() => thud(0.9), 500)
      window.setTimeout(() => setPhase('after'), 2400)
    }
  }

  return (
    <div className="a4">
      {phase === 'floor' && (
        <div className="a4-scene" style={{ backgroundImage: 'url(/act4/workshop.webp)' }}>
          <div
            className="a4-desk"
            onPointerDown={() => { poke(); setPhase('doc') }}
          >
            {hint && <i className="ring in" />}
          </div>
        </div>
      )}

      {phase === 'doc' && (
        <div className="a4-doc-wrap">
          <div className="a4-dim" style={{ opacity: marks / 5 * 0.55 }} />
          <div className="a4-paper">
            <div className="a4-paper-title">检 讨 书</div>
            <div className="a4-paper-lines" />
            <div className="a4-strokes" onPointerDown={sign}>
              {[0, 1, 2, 3, 4].map(i => (
                <i key={i} className={`a4-stroke s${i} ${marks > i ? 'on' : ''}`} />
              ))}
              {!stamped && (hint || marks > 0) && marks < 5 && (
                <i className="ring in a4-next" style={{ left: `${14 + marks * 18}%` }} />
              )}
            </div>
            {stamped && <div className="a4-seal">属实</div>}
          </div>
        </div>
      )}

      {phase === 'after' && (
        <div className="a4-scene dark" style={{ backgroundImage: 'url(/act4/room.webp)' }}>
          <div className="a4-door" onPointerDown={() => onDone()}>
            <i className="ring in" />
          </div>
        </div>
      )}
    </div>
  )
}
