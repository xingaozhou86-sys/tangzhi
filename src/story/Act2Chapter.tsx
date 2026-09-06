import { useRef, useState } from 'react'
import { Shell, LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import type { Pt } from './ui'
import { CollectCard, PaperBit, usePercentDrag } from './bits'

// ------------------------------------------------------------
// 第二章 · 空城（2020）—— 动词：对
// 空街 → 对面楼的窗格：拖动窗台上的小镜子，
// 把她窗口漏出的光，对准自己黑着的窗。
// 光对上的一瞬间，两扇窗同时亮一下——那是他们全部的话。
// 然后饭馆最后一天：拉起卷帘门，碗底下压着第二角糖纸。
// ------------------------------------------------------------

type Phase = 'street' | 'windows' | 'aligned' | 'restaurant' | 'bowl' | 'collect' | 'done'

const HER = { x: 48, y: 44 }   // 她亮着的窗（画中人影所在）
const HIS = { x: 30, y: 56 }   // 他黑着的窗
const SILL_Y = 78              // 窗台，镜子在上面滑
const MIRROR_HIT = 52          // 对准点

export default function Act2Chapter({ onDone }: { onDone: () => void }) {
  const D = dbgPh() as Phase | null
  const [phase, setPhase] = useState<Phase>(D ?? 'street')
  const [light, setLight] = useState<Pt>(
    D === 'windows' || D === 'aligned' ? { x: HER.x, y: HER.y }
    : D && D !== 'street' ? { x: 45, y: 58 }
    : { x: 78, y: 24 })
  const [mirrorX, setMirrorX] = useState(D === 'aligned' ? MIRROR_HIT : 16)
  const [shutter, setShutter] = useState(D && ['restaurant', 'bowl', 'collect', 'done'].includes(D) ? 100 : 0)
  const [bowlUp, setBowlUp] = useState(D === 'collect' || D === 'done')
  const later = useTimers()
  const rootRef = useRef<HTMLDivElement | null>(null)
  useLoop('/story/amb-city.mp3', 0.22)

  const aligned = Math.abs(mirrorX - MIRROR_HIT) < 5

  // ---- 镜子 ----
  const mirrorDrag = usePercentDrag(rootRef,
    (x) => { setMirrorX(Math.max(8, Math.min(92, x))) },
    () => {
      if (phase === 'windows' && Math.abs(mirrorX - MIRROR_HIT) < 5) {
        setPhase('aligned')
        setLight({ x: HIS.x, y: HIS.y })
        playOnce('/story/sfx-chime.mp3', 0.65) // 对上了：全章唯一一个暖音
        later(() => { setPhase('restaurant'); setLight({ x: 50, y: 40 }) }, 2100)
      }
    })

  // ---- 卷帘门 ----
  const shutterDrag = usePercentDrag(rootRef,
    (_x, _y, _dx, dy) => {
      if (phase !== 'restaurant') return
      setShutter((s) => Math.max(0, Math.min(100, s - dy * 1.6)))
    },
    () => {
      if (phase === 'restaurant' && shutter > 78) {
        setShutter(100)
        setPhase('bowl')
        setLight({ x: 45, y: 58 })
      }
    })

  const onStage = () => {
    if (phase === 'street') {
      setPhase('windows'); setLight({ x: HER.x, y: HER.y })
    } else if (phase === 'bowl') {
      setBowlUp(true)
      later(() => { setPhase('collect'); setLight({ x: 48, y: 64 }) }, 900)
    } else if (phase === 'collect') {
      setPhase('done')
      later(onDone, 2600)
    }
  }

  const rings = () => {
    if (phase === 'street') return [{ x: 78, y: 24, size: 60 }]
    if (phase === 'windows') return [{ x: mirrorX, y: SILL_Y, size: 56 }]
    if (phase === 'restaurant') return [{ x: 50, y: 46, size: 74 }]
    if (phase === 'bowl') return [{ x: 45, y: 58, size: 52 }]
    if (phase === 'collect') return [{ x: 48, y: 64, size: 46 }]
    return []
  }

  const inRestaurant = ['restaurant', 'bowl', 'collect', 'done'].includes(phase)

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0 }}>
      {!inRestaurant && (
        <Shell
          bg={phase === 'street' ? '/story/a2-street.webp' : '/story/a2-windows.webp'}
          bgOn
          light={light} lightColor={LIGHTS[2].core} lightGlow={LIGHTS[2].glow}
          lightScale={phase === 'aligned' ? 1.5 : 1}
          rings={rings()}
          onPointerDown={onStage}
        >
          {(phase === 'windows' || phase === 'aligned') && (
            <>
              {/* 光束：她的窗 → 镜子 →（对上后）他的窗 */}
              <svg style={{ position: 'absolute', inset: 0, zIndex: 13, pointerEvents: 'none' }}
                viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1={HER.x} y1={HER.y} x2={mirrorX} y2={SILL_Y}
                  stroke="rgba(255,214,130,0.5)" strokeWidth="0.5" />
                {aligned && (
                  <line x1={mirrorX} y1={SILL_Y} x2={HIS.x} y2={HIS.y}
                    stroke="rgba(255,224,160,0.95)" strokeWidth="0.7"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(255,210,120,0.9))' }} />
                )}
              </svg>
              {/* 她的窗 · 常亮 */}
              <div style={{ position: 'absolute', left: `${HER.x - 3}%`, top: `${HER.y - 4}%`,
                width: '6%', aspectRatio: '3/4', zIndex: 12, pointerEvents: 'none',
                background: 'radial-gradient(circle, rgba(255,206,120,0.55), rgba(255,206,120,0) 75%)' }} />
              {/* 他的窗 · 对上才亮（实心窗格+外晕） */}
              {(aligned || phase === 'aligned') && (
                <>
                  <div style={{ position: 'absolute', left: `${HIS.x - 2}%`, top: `${HIS.y - 3.4}%`,
                    width: '4%', aspectRatio: '3/4', zIndex: 12, pointerEvents: 'none',
                    background: 'linear-gradient(180deg, #ffe2ae, #d99f4e)', borderRadius: 2,
                    boxShadow: '0 0 22px rgba(255,205,110,0.9)', animation: 'propIn 1.2s ease' }} />
                  <div style={{ position: 'absolute', left: `${HIS.x - 5}%`, top: `${HIS.y - 7}%`,
                    width: '10%', aspectRatio: '3/4', zIndex: 11, pointerEvents: 'none',
                    background: 'radial-gradient(circle, rgba(255,220,150,0.65), rgba(255,220,150,0) 75%)' }} />
                </>
              )}
              {/* 小圆镜 */}
              <div
                onPointerDown={phase === 'windows' ? mirrorDrag.down : undefined}
                onPointerMove={mirrorDrag.move}
                onPointerUp={mirrorDrag.up}
                style={{
                  position: 'absolute', left: `${mirrorX}%`, top: `${SILL_Y}%`, zIndex: 16,
                  width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 30%, #f4f0e4, #9aa4ac 55%, #4c545c)',
                  border: '2px solid #6b5f43', boxShadow: '0 4px 12px rgba(0,0,0,0.7)',
                  cursor: phase === 'windows' ? 'grab' : 'default', touchAction: 'none',
                }} />
            </>
          )}
        </Shell>
      )}

      {inRestaurant && (
        <Shell
          bg="/story/a2-restaurant.webp" bgOn
          light={light} lightColor={LIGHTS[2].core} lightGlow={LIGHTS[2].glow}
          rings={rings()}
          onPointerDown={onStage}
        >
          {/* 卷帘门 */}
          {shutter < 100 && (
            <div
              onPointerDown={phase === 'restaurant' ? shutterDrag.down : undefined}
              onPointerMove={shutterDrag.move}
              onPointerUp={shutterDrag.up}
              style={{
                position: 'absolute', left: '24%', top: 0, width: '52%', zIndex: 15,
                height: `${62 - shutter * 0.62}%`,
                background: 'repeating-linear-gradient(180deg, #4a4d52 0 8px, #33363b 8px 12px)',
                borderBottom: '4px solid #22242a', boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
                cursor: phase === 'restaurant' ? 'grab' : 'default', touchAction: 'none',
                transition: phase === 'restaurant' ? 'none' : 'height 0.8s ease',
              }} />
          )}
          {/* 碗 */}
          {(phase === 'bowl' || phase === 'collect' || phase === 'done') && (
            <div style={{
              position: 'absolute', left: '42%', top: '54%', zIndex: 16, width: '6%', aspectRatio: '2/1',
              borderRadius: '0 0 50% 50% / 0 0 100% 100%',
              background: 'linear-gradient(180deg, #e9e2d2, #b8ad96)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
              transform: bowlUp ? 'translateY(-26px) rotate(-14deg)' : 'none',
              opacity: bowlUp ? 0.92 : 1, transition: 'transform 0.8s ease, opacity 0.8s ease',
              pointerEvents: 'none',
            }} />
          )}
          {(phase === 'collect' || phase === 'done') && <PaperBit x={46} y={62} />}
          {phase === 'done' && <CollectCard label="糖 纸 · 贰 / 伍" />}
        </Shell>
      )}
    </div>
  )
}
