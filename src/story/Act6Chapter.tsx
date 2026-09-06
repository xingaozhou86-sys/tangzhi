import { useRef, useState } from 'react'
import { Shell, LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import type { Pt } from './ui'
import { CollectCard, PaperBit, usePercentDrag } from './bits'

// ------------------------------------------------------------
// 第六章 · 分糖（1970）—— 动词：撕
// 供销社：揭开玻璃糖罐 → 拿一颗 → 拧开糖纸 →
// 把糖纸沿折痕撕成两半（不齐，一大一小）→
// 把大的那一半给她。剩下的半张，他留了五十五年。
// ------------------------------------------------------------

type Phase = 'store' | 'open' | 'take' | 'unwrap' | 'tear' | 'give' | 'keep' | 'done'

const TEAR_AT = 58 // 折痕在 58%：左大右小

export default function Act6Chapter({ onDone }: { onDone: () => void }) {
  const D = dbgPh() as Phase | null
  const [phase, setPhase] = useState<Phase>(D ?? 'store')
  const [light, setLight] = useState<Pt>({ x: 55, y: 45 })
  const [lidY, setLidY] = useState(D && D !== 'store' ? 30 : 0)
  const [twist, setTwist] = useState(0)       // 拧开糖纸的量 0..100
  const [tearX, setTearX] = useState(D && ['give', 'keep', 'done'].includes(D) ? 20 : 0)       // 撕开的位移
  const [given, setGiven] = useState<'big' | 'small' | null>(D && ['keep', 'done'].includes(D) ? 'big' : null)
  const later = useTimers()
  const rootRef = useRef<HTMLDivElement | null>(null)
  useLoop('/story/cicadas.mp3', 0.22)
  useLoop(phase !== 'store' ? '/story/theme-mb.wav' : null, 0.3) // 糖罐揭开起：八音盒主题（全游戏最完整的音乐）

  // ---- 揭罐盖 ----
  const lid = usePercentDrag(rootRef,
    (_x, _y, _dx, dy) => { if (phase === 'store') setLidY((v) => Math.max(0, Math.min(30, v - dy))) },
    () => {
      if (phase === 'store' && lidY > 14) {
        setPhase('open'); setLight({ x: 53, y: 54 })
      } else setLidY(0)
    })

  // ---- 拧糖纸 ----
  const twistDrag = usePercentDrag(rootRef,
    (_x, _y, dx) => { if (phase === 'take') setTwist((v) => Math.max(0, Math.min(100, v + Math.abs(dx) * 2.2))) },
    () => {
      if (phase === 'take' && twist > 78) {
        setPhase('unwrap')
        later(() => { setPhase('tear'); setLight({ x: 50, y: 52 }) }, 1200)
      }
    })

  // ---- 撕 ----
  const tear = usePercentDrag(rootRef,
    (_x, _y, dx) => { if (phase === 'tear') setTearX((v) => Math.max(0, Math.min(20, v + dx))) },
    () => {
      if (phase === 'tear' && tearX > 9) {
        playOnce('/story/sfx-tear.mp3', 0.8)
        setTearX(20)
        setPhase('give')
        setLight({ x: 70, y: 74 })
      } else if (phase === 'tear') setTearX(0)
    })

  const giveHalf = (which: 'big' | 'small') => {
    setGiven(which)
    try { localStorage.setItem('zzc.gaveBig', which === 'big' ? '1' : '0') } catch { /* 无痕 */ }
    setPhase('keep')
    setLight({ x: 34, y: 52 })
  }

  const onStage = () => {
    if (phase === 'open') {
      setPhase('take'); setLight({ x: 50, y: 50 })
    } else if (phase === 'keep') {
      setPhase('done')
      later(onDone, 2800)
    }
  }

  const rings = () => {
    if (phase === 'store') return [{ x: 55, y: 45, size: 62 }]
    if (phase === 'open') return [{ x: 53, y: 54, size: 46 }]
    if (phase === 'take') return [{ x: 50, y: 50, size: 70 }]
    if (phase === 'tear') return [{ x: 56, y: 50, size: 60 }]
    if (phase === 'give') return [{ x: 70, y: 76, size: 56 }]
    if (phase === 'keep') return [{ x: 34, y: 52, size: 52 }]
    return []
  }

  const inHand = ['take', 'unwrap', 'tear', 'give', 'keep', 'done'].includes(phase)

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0 }}>
      {!inHand && (
        <Shell
          bg="/story/a6-store.webp" bgOn
          light={light} lightColor={LIGHTS[6].core} lightGlow={LIGHTS[6].glow}
          rings={rings()}
          onPointerDown={onStage}
        >
          {/* 罐盖 */}
          <div
            onPointerDown={phase === 'store' ? lid.down : undefined}
            onPointerMove={lid.move} onPointerUp={lid.up}
            style={{
              position: 'absolute', left: '47%', top: `${43 - lidY * 0.55}%`, zIndex: 16,
              width: '16%', aspectRatio: '2.6/1', borderRadius: '50%',
              background: 'radial-gradient(ellipse at 40% 30%, rgba(230,240,244,0.85), rgba(150,165,172,0.7) 60%, rgba(90,100,108,0.8))',
              border: '2px solid rgba(220,230,235,0.5)',
              boxShadow: '0 8px 18px rgba(0,0,0,0.5)',
              opacity: 1 - lidY / 34,
              cursor: phase === 'store' ? 'grab' : 'default', touchAction: 'none',
            }} />
          {phase === 'open' && (
            <div style={{ position: 'absolute', left: '49%', top: '48%', width: '12%', height: '12%',
              zIndex: 15, pointerEvents: 'none',
              background: 'radial-gradient(circle, rgba(255,214,120,0.65), rgba(255,214,120,0) 70%)' }} />
          )}
        </Shell>
      )}

      {inHand && (
        <Shell
          light={light} lightColor={LIGHTS[6].core} lightGlow={LIGHTS[6].glow}
          rings={rings()}
          onPointerDown={onStage}
        >
          <div style={{ position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 45%, #3a2c16 0%, #1c1509 70%)' }} />

          {/* 糖（未拧开时） */}
          {(phase === 'take' || phase === 'unwrap') && (
            <div
              onPointerDown={phase === 'take' ? twistDrag.down : undefined}
              onPointerMove={twistDrag.move} onPointerUp={twistDrag.up}
              style={{
                position: 'absolute', left: '50%', top: '50%', zIndex: 16,
                width: 130, height: 56, marginLeft: -65, marginTop: -28,
                cursor: phase === 'take' ? 'grab' : 'default', touchAction: 'none',
                opacity: phase === 'unwrap' ? 0 : 1, transform: phase === 'unwrap' ? 'translateY(-40px) scale(0.7)' : 'none',
                transition: 'all 0.9s ease',
              }}>
              <div style={{ position: 'absolute', left: 26, top: 8, width: 78, height: 40, borderRadius: 20,
                background: 'linear-gradient(160deg,#d6543c,#a03222)',
                transform: `rotate(${twist * 0.4}deg)`,
                boxShadow: '0 6px 16px rgba(0,0,0,0.6)' }} />
              <div style={{ position: 'absolute', left: 0, top: 12, width: 30, height: 32,
                background: '#e8dcc0', clipPath: 'polygon(0 50%, 100% 0, 100% 100%)',
                transform: `rotate(${-twist * 0.9}deg)`, transformOrigin: 'right center' }} />
              <div style={{ position: 'absolute', right: 0, top: 12, width: 30, height: 32,
                background: '#e8dcc0', clipPath: 'polygon(0 0, 100% 50%, 0 100%)',
                transform: `rotate(${twist * 0.9}deg)`, transformOrigin: 'left center' }} />
            </div>
          )}

          {/* 摊平的糖纸（撕开前/中/后） */}
          {['tear', 'give', 'keep', 'done'].includes(phase) && (
            <>
              {/* 左（大）半 */}
              {given !== 'big' && (
                <div
                  onPointerDown={phase === 'give' ? () => giveHalf('big') : undefined}
                  style={{
                    position: 'absolute', left: `calc(50% - 15%)`, top: '44%', zIndex: 15,
                    width: `${TEAR_AT * 0.26}%`, height: '12%',
                    background: 'linear-gradient(120deg,#e8dcc0 60%, #d6543c 60% 78%, #f0c860 78%)',
                    clipPath: tearX >= 20 ? 'polygon(0 0, 96% 4%, 100% 50%, 96% 96%, 0 100%)' : 'none',
                    transform: `translateX(${-tearX * 0.3}%) rotate(${-tearX * 0.15}deg)`,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.55)',
                    cursor: phase === 'give' ? 'pointer' : 'default',
                    animation: phase === 'tear' || phase === 'give' ? undefined : 'propIn 0.8s ease',
                  }} />
              )}
              {/* 右（小）半 */}
              {given !== 'small' && (
                <div
                  onPointerDown={phase === 'tear' ? tear.down : phase === 'give' ? () => giveHalf('small') : undefined}
                  onPointerMove={tear.move} onPointerUp={tear.up}
                  style={{
                    position: 'absolute', left: `calc(50% - 15% + ${TEAR_AT * 0.26}%)`, top: '44%', zIndex: 16,
                    width: `${(100 - TEAR_AT) * 0.26}%`, height: '12%',
                    background: 'linear-gradient(100deg,#f0c860 0 22%, #d6543c 22% 40%, #e8dcc0 40%)',
                    clipPath: tearX >= 20 ? 'polygon(4% 4%, 100% 0, 100% 100%, 4% 96%, 0 50%)' : 'none',
                    transform: `translateX(${tearX}%) rotate(${tearX * 0.4}deg)`,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.55)',
                    cursor: phase === 'tear' ? 'grab' : phase === 'give' ? 'pointer' : 'default',
                    touchAction: 'none',
                  }} />
              )}
              {/* 折痕提示 */}
              {phase === 'tear' && tearX < 20 && (
                <div style={{ position: 'absolute', left: `calc(50% - 15% + ${TEAR_AT * 0.26}%)`, top: '42%',
                  width: 0, height: '16%', zIndex: 17, pointerEvents: 'none',
                  borderLeft: '2px dashed rgba(255,220,140,0.85)',
                  filter: 'drop-shadow(0 0 6px rgba(255,210,120,0.9))' }} />
              )}

              {/* 两个小小的背影（她的在右） */}
              {phase === 'give' && (
                <>
                  <div style={{ position: 'absolute', left: '22%', top: '58%', width: '5%', height: '22%',
                    zIndex: 14, background: 'linear-gradient(180deg, rgba(24,16,8,0.9), rgba(24,16,8,0.5))',
                    borderRadius: '48% 48% 26% 26%', pointerEvents: 'none' }} />
                  <div style={{ position: 'absolute', left: '68%', top: '60%', width: '4.4%', height: '20%',
                    zIndex: 14, background: 'linear-gradient(180deg, rgba(30,18,10,0.92), rgba(30,18,10,0.55))',
                    borderRadius: '48% 48% 26% 26%', pointerEvents: 'none',
                    boxShadow: '0 0 24px rgba(255,200,100,0.25)' }} />
                </>
              )}
              {phase === 'give' && given == null && (
                <div style={{ position: 'absolute', left: '66%', top: '52%', zIndex: 18, pointerEvents: 'none',
                  fontSize: 0 }} />
              )}
            </>
          )}

          {phase === 'done' && <CollectCard label="糖 纸 · 伍 / 伍 · 半 张" />}
          {phase === 'done' && <PaperBit x={46} y={50} size={0.9} />}
        </Shell>
      )}
    </div>
  )
}
