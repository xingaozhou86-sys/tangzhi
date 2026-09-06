import { useRef, useState } from 'react'
import { Shell, LIGHTS, useLoop, useTimers, dbgPh } from './ui'
import type { Pt } from './ui'
import { CollectCard, PaperBit, usePercentDrag } from './bits'

// ------------------------------------------------------------
// 第五章 · 舞会（1985）—— 动词：转
// 先转收音机旋钮/唱片，把舞会转起来（音乐 = 全游戏第一次响起的音乐）；
// 再把整幅画横着拧 180°——礼堂翻过去，就是同一年深夜的天台，
// 跳舞的两个人变成两把并排的椅子。
// 天台上靠着一幅小画：1978 的邮电所（画中画）。
// 进去，把他当年没寄出的信，寄掉。印台下压着第四角糖纸。
// ------------------------------------------------------------

type Phase = 'hall' | 'music' | 'spin' | 'roof' | 'post' | 'mailed' | 'ink' | 'collect' | 'done'

const DISC = { x: 70, y: 66 }

export default function Act5Chapter({ onDone }: { onDone: () => void }) {
  const D = dbgPh() as Phase | null
  const [phase, setPhase] = useState<Phase>(D ?? 'hall')
  const [light, setLight] = useState<Pt>({ x: 70, y: 66 })
  const [spinAcc, setSpinAcc] = useState(0)   // 唱片累计角度
  const [rot, setRot] = useState(D === 'spin' ? 90 : 0)           // 整幅画 0..180
  const [musicOn, setMusicOn] = useState(D ? ['music', 'spin', 'roof', 'post', 'mailed', 'ink', 'collect'].includes(D) : false)
  const [envPos, setEnvPos] = useState({ x: 30, y: 72 })
  const later = useTimers()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const lastAngle = useRef<number | null>(null)
  const inPost0 = ['post', 'mailed', 'ink', 'collect', 'done'].includes(phase)
  useLoop(musicOn && !inPost0 ? '/story/boombox.mp3' : null, 0.5)   // 舞会广播：进 1978 画中画时退场
  useLoop(inPost0 ? '/story/theme-mb.wav' : null, 0.26)             // 记忆深处：八音盒主题

  // ---- 转唱片 ----
  const discDown = (e: React.PointerEvent) => {
    if (phase !== 'hall') return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.stopPropagation()
    lastAngle.current = null
  }
  const discMove = (e: React.PointerEvent) => {
    if (phase !== 'hall' || !(e.buttons & 1)) return
    const r = rootRef.current!.getBoundingClientRect()
    const cx = r.left + (DISC.x / 100) * r.width
    const cy = r.top + (DISC.y / 100) * r.height
    const a = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI
    if (lastAngle.current != null) {
      let d = a - lastAngle.current
      if (d > 180) d -= 360
      if (d < -180) d += 360
      setSpinAcc((s) => {
        const n = s + Math.abs(d)
        if (n > 300) {
          setPhase('music')
          setMusicOn(true)
          setLight({ x: 50, y: 40 })
          later(() => setPhase('spin'), 3200)
        }
        return n
      })
    }
    lastAngle.current = a
  }

  // ---- 拧画 ----
  const spinDrag = usePercentDrag(rootRef,
    (_x, _y, dx) => { setRot((v) => Math.max(0, Math.min(180, v + dx * 1.4))) },
    () => {
      if (rot > 140) {
        setRot(180)
        later(() => { setPhase('roof'); setRot(0); setLight({ x: 64, y: 66 }) }, 700)
      } else {
        setRot(0)
      }
    })

  // ---- 寄信 ----
  const mail = usePercentDrag(rootRef,
    (x, y) => { if (phase === 'post') setEnvPos({ x: Math.max(6, Math.min(94, x)), y: Math.max(6, Math.min(94, y)) }) },
    (x, y) => {
      if (phase === 'post' && Math.abs(x - 83) < 8 && Math.abs(y - 30) < 12) {
        setEnvPos({ x: 83, y: 30 })
        setPhase('mailed')
        later(() => { setPhase('ink'); setLight({ x: 64, y: 62 }) }, 1600)
      }
    })

  const onStage = () => {
    if (phase === 'roof') {
      setPhase('post'); setLight({ x: 30, y: 72 })
    } else if (phase === 'ink') {
      setPhase('collect'); setLight({ x: 64, y: 64 })
    } else if (phase === 'collect') {
      setPhase('done')
      setMusicOn(false)
      later(onDone, 2600)
    }
  }

  const rings = () => {
    if (phase === 'hall') return [{ x: DISC.x, y: DISC.y, size: 72 }]
    if (phase === 'spin') return [{ x: 76, y: 50, size: 64 }]
    if (phase === 'roof') return [{ x: 64, y: 66, size: 56 }]
    if (phase === 'post') return [{ x: 83, y: 28, size: 56 }]
    if (phase === 'ink') return [{ x: 64, y: 66, size: 48 }]
    if (phase === 'collect') return [{ x: 64, y: 66, size: 44 }]
    return []
  }

  const inPost = ['post', 'mailed', 'ink', 'collect', 'done'].includes(phase)
  const roofT = phase === 'spin' ? Math.min(1, rot / 180) : 0

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0 }}>
      {!inPost && (
        <Shell
          light={light} lightColor={LIGHTS[5].core} lightGlow={LIGHTS[5].glow}
          rings={rings()}
          onPointerDown={phase === 'roof' ? onStage : undefined}
        >
          {/* 旋转中的整幅画：礼堂 ↔ 天台 */}
          <div style={{
            position: 'absolute', inset: 0,
            transform: `rotate(${rot}deg)`,
            transition: rot === 0 || rot === 180 ? 'transform 0.7s ease' : 'none',
          }}>
            <div style={{ position: 'absolute', inset: 0,
              backgroundImage: 'url(/story/a5.webp)', backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 1 - roofT }} />
            <div style={{ position: 'absolute', inset: 0,
              backgroundImage: 'url(/story/a5-roof.webp)', backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: roofT, transform: 'rotate(180deg)' }} />
            {/* 音乐响起后，整幅画暖一度 */}
            {(phase === 'music' || phase === 'spin') && (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at 50% 60%, rgba(255,180,90,0.16), rgba(255,150,60,0) 70%)',
                opacity: 1 - roofT, animation: 'propIn 2.4s ease' }} />
            )}
          </div>

          {/* 唱片/旋钮 */}
          {phase === 'hall' && (
            <div
              onPointerDown={discDown} onPointerMove={discMove}
              style={{
                position: 'absolute', left: `${DISC.x}%`, top: `${DISC.y}%`, zIndex: 16,
                width: 86, height: 86, marginLeft: -43, marginTop: -43, borderRadius: '50%',
                background: `conic-gradient(#1c1a18 0 40%, #2c2a26 40% 50%, #1c1a18 50% 90%, #2c2a26 90%)`,
                border: '5px solid #4a3a24',
                boxShadow: '0 8px 20px rgba(0,0,0,0.8), inset 0 0 18px rgba(0,0,0,0.8)',
                transform: `rotate(${spinAcc}deg)`,
                cursor: 'grab', touchAction: 'none',
              }}>
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: 16, height: 16,
                transform: 'translate(-50%,-50%)', borderRadius: '50%', background: '#c8a44e' }} />
            </div>
          )}

          {/* 拧画热区（右侧边） */}
          {phase === 'spin' && (
            <div
              onPointerDown={spinDrag.down} onPointerMove={spinDrag.move} onPointerUp={spinDrag.up}
              style={{ position: 'absolute', right: 0, top: '10%', width: '16%', height: '80%',
                zIndex: 17, cursor: 'ew-resize', touchAction: 'none' }} />
          )}

          {/* 天台：靠着收音机的小画（1978 邮电所） */}
          {phase === 'roof' && (
            <div style={{
              position: 'absolute', left: '58%', top: '60%', width: '13%', aspectRatio: '3/2', zIndex: 15,
              backgroundImage: 'url(/story/a5-post1978.webp)', backgroundSize: 'cover',
              border: '4px solid #3a3020', transform: 'rotate(-4deg)',
              boxShadow: '0 8px 18px rgba(0,0,0,0.7)', pointerEvents: 'none',
            }} />
          )}
        </Shell>
      )}

      {inPost && (
        <Shell
          bg="/story/a5-post1978.webp" bgOn
          light={light} lightColor={LIGHTS[5].core} lightGlow={LIGHTS[5].glow}
          rings={rings()}
          onPointerDown={onStage}
        >
          {/* 信封（翻盖线+邮票+地址行） */}
          {phase !== 'mailed' || true ? (
            <div
              onPointerDown={phase === 'post' ? mail.down : undefined}
              onPointerMove={mail.move} onPointerUp={mail.up}
              style={{
                position: 'absolute', left: `${envPos.x}%`, top: `${envPos.y}%`, zIndex: 16,
                width: '9%', aspectRatio: '1.7/1', marginLeft: '-4.5%', marginTop: '-2.6%',
                background: 'linear-gradient(160deg,#e2d3ac,#c9b586)',
                border: '1px solid #a08d60',
                filter: 'brightness(0.8) saturate(0.85)',
                boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
                cursor: phase === 'post' ? 'grab' : 'default', touchAction: 'none',
                transform: phase === 'mailed' ? 'scaleY(0.18)' : 'none',
                opacity: phase === 'mailed' ? 0 : 1,
                transition: 'transform 0.9s ease, opacity 0.9s ease',
                overflow: 'hidden',
              }}>
              <div style={{ position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom right, transparent 49.4%, rgba(120,100,60,0.6) 49.4% 50.6%, transparent 50.6%), linear-gradient(to bottom left, transparent 49.4%, rgba(120,100,60,0.6) 49.4% 50.6%, transparent 50.6%)' }} />
              <div style={{ position: 'absolute', right: '6%', top: '8%', width: '14%', aspectRatio: '4/5',
                background: '#a03a28', border: '1px dashed rgba(240,225,190,0.8)' }} />
              <div style={{ position: 'absolute', left: '8%', bottom: '14%', width: '46%', height: 2,
                background: 'rgba(90,70,40,0.55)' }} />
              <div style={{ position: 'absolute', left: '8%', bottom: '30%', width: '34%', height: 2,
                background: 'rgba(90,70,40,0.4)' }} />
            </div>
          ) : null}
          {(phase === 'collect' || phase === 'done') && <PaperBit x={62} y={64} />}
          {phase === 'done' && <CollectCard label="糖 纸 · 肆 / 伍" />}
        </Shell>
      )}
    </div>
  )
}
