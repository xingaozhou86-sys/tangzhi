import { useEffect, useState } from 'react'

// ------------------------------------------------------------
// 终幕 · 回程
// 五张糖纸带着他往回走，走回糖纸发光的地方。
// 车站 → 点太阳 → 天亮 → 落款
// ------------------------------------------------------------
const REWIND = [
  '/story/a6.webp',
  '/story/a5-roof.webp',
  '/story/b8-room.webp',
  '/act4/workshop.webp',
  '/story/b6-platform.webp',
  '/story/a3-1978.webp',
  '/story/b4-rain.webp',
  '/story/a2-room.webp',
  '/story/b2-lathe.webp',
  '/story/a1.webp',
]

export function Epilogue() {
  const [i, setI] = useState(0)
  const [phase, setPhase] = useState<'rewind' | 'station' | 'dawn' | 'end'>('rewind')

  useEffect(() => {
    const a = new Audio('/story/amb-wind.mp3')
    a.loop = true
    a.volume = 0.12
    a.play().catch(() => {})
    return () => { a.pause() }
  }, [])

  useEffect(() => {
    if (phase !== 'rewind') return
    if (i >= REWIND.length - 1) {
      const t = window.setTimeout(() => setPhase('station'), 1900)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setI(i + 1), 1600)
    return () => window.clearTimeout(t)
  }, [i, phase])

  useEffect(() => {
    if (phase !== 'dawn') return
    const t = window.setTimeout(() => setPhase('end'), 3400)
    return () => window.clearTimeout(t)
  }, [phase])

  return (
    <div className="ep">
      {phase === 'rewind' && (
        <div className="ep-rewind">
          {REWIND.map((src, k) => (
            <div key={src} className={`ep-frame ${k === i ? 'on' : ''}`} style={{ backgroundImage: `url(${src})` }} />
          ))}
          <div className="ep-wrapper-fly" />
        </div>
      )}

      {(phase === 'station' || phase === 'dawn') && (
        <div className="ep-station">
          <div
            className="ep-frame on"
            style={{ backgroundImage: `url(${phase === 'dawn' ? '/story/fin.webp' : '/story/fin-station.webp'})` }}
          />
          {phase === 'station' && (
            <div className="ep-sun" onPointerDown={() => setPhase('dawn')}>
              <i className="ring in" />
            </div>
          )}
        </div>
      )}

      {phase === 'end' && (
        <div className="ep-end">
          <div className="ep-end-title">糖纸</div>
          <div className="ep-end-line">糖纸还在，天就亮了。</div>
          <button className="ep-again" onClick={() => window.location.reload()}>再玩一次</button>
        </div>
      )}
    </div>
  )
}
