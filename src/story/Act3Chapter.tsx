import { useRef, useState } from 'react'
import { Shell, LIGHTS, useTimers, useLoop, playOnce, dbgPh } from './ui'
import type { Pt } from './ui'
import { CollectCard, PaperBit, usePercentDrag } from './bits'

// ------------------------------------------------------------
// 第三章 · 下岗（1998）—— 动词：揭
// 同一面公布栏，三层纸 = 三个年份：
// 1998 下岗名单（有他）→ 1988 事故通报（有他的签字）→ 1978 招工红榜（也有他）。
// 每揭一层，颜色暖一分——这面墙就是他一生的倒带。
// 然后他给厂门上最后一道锁；工牌里掉出第三角糖纸。
// ------------------------------------------------------------

type Phase = 'board' | 'gate' | 'locked' | 'idcard' | 'flip' | 'collect' | 'done'

const NAMES_1998 = ['王德福', '赵铁柱', '孙爱华', '周明礼', '吴桂兰', '顾长明', '郑长顺', '马秀珍', '刘广田', '陈淑云', '郭守义', '高凤英']

export default function Act3Chapter({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const peelMap: Record<string, number> = { peel1: 1, peel2: 2, peel3: 3 }
  const [phase, setPhase] = useState<Phase>(
    D && D.startsWith('peel') ? 'board' : (D as Phase) ?? 'board')
  const [light, setLight] = useState<Pt>({ x: 50, y: 42 })
  const [peeled, setPeeled] = useState(D ? peelMap[D] ?? 0 : 0)
  const [peelDrag, setPeelDrag] = useState(0)   // 揭起的量
  const [locked, setLocked] = useState(D === 'locked')
  const [lockPos, setLockPos] = useState(D === 'locked' ? { x: 50, y: 66 } : { x: 30, y: 72 })
  const later = useTimers()
  useLoop('/story/amb-wind.mp3', 0.22) // 厂区寒风，1998 没有音乐
  const rootRef = useRef<HTMLDivElement | null>(null)

  // ---- 揭纸 ----
  const peel = usePercentDrag(rootRef,
    (_x, _y, _dx, dy) => { setPeelDrag((v) => Math.max(0, Math.min(40, v + dy))) },
    () => {
      if (peelDrag > 14) {
        playOnce('/story/sfx-peel.mp3', 0.7)
        const n = peeled + 1
        setPeeled(n)
        // 色温随层数变暖
        setLight({ x: 50, y: 42 })
        if (n === 3) later(() => { setPhase('gate'); setLight({ x: 50, y: 62 }) }, 1700)
      }
      setPeelDrag(0)
    })

  // ---- 上锁 ----
  const lock = usePercentDrag(rootRef,
    (x, y) => { if (!locked) setLockPos({ x: Math.max(8, Math.min(92, x)), y: Math.max(8, Math.min(92, y)) }) },
    (x, y) => {
      if (Math.abs(x - 50) < 7 && Math.abs(y - 66) < 9) {
        setLockPos({ x: 50, y: 66 })
        setLocked(true)
        playOnce('/act4/thud.mp3', 0.35, 1.9)
        setPhase('locked')
        later(() => { setPhase('idcard'); setLight({ x: 50, y: 55 }) }, 2200)
      }
    })

  const onStage = () => {
    if (phase === 'idcard') {
      setPhase('flip')
      later(() => { setPhase('collect'); setLight({ x: 55, y: 62 }) }, 1100)
    } else if (phase === 'collect') {
      setPhase('done')
      later(onDone, 2600)
    }
  }

  const layers = [
    { // 1998 下岗名单
      bg: '#e6ddc8', title: '优化组合人员名单', body: (
        <div style={{ columnCount: 3, columnGap: 14, fontSize: 10.5, lineHeight: 1.9, color: '#3a3226' }}>
          {NAMES_1998.map((n) => <div key={n}>{n}</div>)}
        </div>
      ),
    },
    { // 1988 事故通报
      bg: '#ddd2b8', title: '事 故 通 报', body: (
        <div style={{ fontSize: 10, lineHeight: 2, color: '#4a4030' }}>
          <p style={{ margin: 0, opacity: 0.65 }}>……冲压车间设备伤害事故一起……</p>
          <p style={{ margin: 0, opacity: 0.65 }}>……系当事人违反操作规程所致……</p>
          <p style={{ margin: '10px 0 0', textAlign: 'right', fontFamily: 'cursive', fontSize: 13, opacity: 0.85 }}>
            情况属实 —— 顾长明
          </p>
        </div>
      ),
    },
    { // 1978 招工红榜
      bg: '#c8b190', title: '招 工 光 荣 榜', red: true, body: (
        <div style={{ fontSize: 11, lineHeight: 2.1, color: '#5a2418' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>顾长明</div>
          <div style={{ opacity: 0.7 }}>赵铁柱　孙爱华　周明礼</div>
          <div style={{ opacity: 0.7 }}>吴桂兰　郑长顺　马秀珍</div>
        </div>
      ),
    },
  ]

  const rings = () => {
    if (phase === 'board' && peeled < 3) return [{ x: 68, y: 66, size: 52 }]
    if (phase === 'gate') return [{ x: 50, y: 66, size: 60 }]
    if (phase === 'idcard') return [{ x: 50, y: 55, size: 64 }]
    if (phase === 'collect') return [{ x: 55, y: 62, size: 46 }]
    return []
  }

  const inGate = ['gate', 'locked'].includes(phase)
  const inCard = ['idcard', 'flip', 'collect', 'done'].includes(phase)

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0 }}>
      {phase === 'board' && (
        <Shell
          bg="/story/a3.webp" bgOn
          light={light}
          lightColor={peeled === 0 ? LIGHTS[3].core : peeled === 1 ? '#ecd9a0' : peeled === 2 ? '#f6cd7e' : LIGHTS[4].core}
          lightGlow={LIGHTS[3].glow}
          rings={rings()}
          onPointerDown={onStage}
        >
          {/* 公布栏 */}
          <div style={{ position: 'absolute', left: '26%', top: '12%', width: '48%', height: '68%',
            background: '#4a3b28', border: '10px solid #332a1c', boxShadow: '0 18px 44px rgba(0,0,0,0.8)',
            zIndex: 14 }}>
            {layers.map((L, i) => {
              const gone = i < peeled
              const isTop = i === peeled
              return (
                <div key={i} style={{
                  position: 'absolute', left: '6%', top: '5%', width: '88%', height: '90%',
                  background: L.bg, padding: '4% 5%', overflow: 'hidden',
                  boxShadow: isTop ? '0 4px 16px rgba(0,0,0,0.45)' : 'none',
                  transform: gone ? 'translate(130%, 60%) rotate(14deg)' : isTop ? `translateY(${peelDrag * 0.7}%) rotate(${peelDrag * 0.25}deg)` : 'none',
                  opacity: gone ? 0 : 1,
                  transition: peelDrag ? 'none' : 'transform 1.2s ease, opacity 1.2s ease',
                  zIndex: 10 - i,
                }}>
                  <div style={{ textAlign: 'center', fontSize: 14, letterSpacing: '0.35em',
                    color: L.red ? '#7a1e10' : '#2e2820', borderBottom: `2px solid ${L.red ? '#7a1e10' : '#2e2820'}`,
                    paddingBottom: 6, marginBottom: 10, fontWeight: 700 }}>
                    {L.title}
                  </div>
                  {L.body}
                  {isTop && (
                    <div
                      onPointerDown={peel.down} onPointerMove={peel.move} onPointerUp={peel.up}
                      style={{ position: 'absolute', right: 0, bottom: 0, width: 56, height: 56,
                        cursor: 'grab', touchAction: 'none',
                        background: 'linear-gradient(315deg, rgba(0,0,0,0.28) 0%, rgba(255,255,255,0.35) 45%, transparent 46%)' }} />
                  )}
                </div>
              )
            })}
          </div>
        </Shell>
      )}

      {inGate && (
        <Shell
          bg="/story/a3-gate.webp" bgOn grey={phase === 'locked'}
          light={light} lightColor={LIGHTS[3].core} lightGlow={LIGHTS[3].glow}
          lightDim={phase === 'locked'}
          rings={rings()}
          onPointerDown={() => {}}
        >
          {/* 锁 */}
          <div
            onPointerDown={phase === 'gate' ? lock.down : undefined}
            onPointerMove={lock.move} onPointerUp={lock.up}
            style={{
              position: 'absolute', left: `${lockPos.x}%`, top: `${lockPos.y}%`, zIndex: 16,
              width: 30, height: 38, marginLeft: -15, marginTop: -19,
              borderRadius: '5px 5px 7px 7px',
              background: 'linear-gradient(160deg, #c8a44e, #7a5e22)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.75), inset 0 2px 3px rgba(255,240,190,0.6)',
              cursor: phase === 'gate' ? 'grab' : 'default', touchAction: 'none',
            }}>
            <div style={{ position: 'absolute', left: '50%', top: -14, width: 16, height: 18,
              transform: 'translateX(-50%)', border: '3.5px solid #8f7434', borderBottom: 'none',
              borderRadius: '9px 9px 0 0' }} />
          </div>
          {phase === 'locked' && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 17, pointerEvents: 'none',
              background: 'rgba(6,8,12,0.35)', animation: 'propIn 2s ease' }} />
          )}
        </Shell>
      )}

      {inCard && (
        <Shell
          light={light} lightColor={LIGHTS[3].core} lightGlow={LIGHTS[3].glow}
          rings={rings()}
          onPointerDown={onStage}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#141210,#1d1912)' }} />
          {/* 工作证 */}
          <div style={{
            position: 'absolute', left: '50%', top: '55%', zIndex: 15,
            width: '20%', aspectRatio: '3/4.2',
            transform: `translate(-50%,-50%) rotateY(${phase === 'idcard' ? 0 : 180}deg)`,
            transformStyle: 'preserve-3d', transition: 'transform 1.1s ease',
          }}>
            {/* 封面 */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: 'linear-gradient(160deg,#2d4470,#1c2c4c)', borderRadius: 6,
              border: '2px solid #15203a', boxShadow: '0 14px 30px rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#d8c98e', fontSize: 17, letterSpacing: '0.5em', writingMode: 'vertical-rl' }}>工作证</div>
            </div>
            {/* 内页 */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)', background: '#e9e0c8', borderRadius: 6,
              padding: '8%', boxShadow: '0 14px 30px rgba(0,0,0,0.7)' }}>
              <div style={{ width: '42%', aspectRatio: '3/4', background: '#b9ad92',
                border: '1px solid #8a7f66', marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: '#3a3226', letterSpacing: '0.2em' }}>顾长明</div>
              <div style={{ fontSize: 10, color: '#6a5f48', marginTop: 4 }}>冲压车间 · 钳工</div>
            </div>
          </div>
          {(phase === 'collect' || phase === 'done') && <PaperBit x={53} y={66} />}
          {phase === 'done' && <CollectCard label="糖 纸 · 叁 / 伍" />}
        </Shell>
      )}
    </div>
  )
}
