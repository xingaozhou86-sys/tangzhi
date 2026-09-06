import { useState } from 'react'
import { PanelField } from './goro'
import type { GPanel } from './goro'
import { LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第六章 · 分糖（1970）—— 动词：撕（画内滑动）
// 供销社那幅画里：糖罐盖上有圆圈在呼吸——往上掀（或点一下）→
// 点一颗糖 → 往右拧开糖纸 → 沿折痕撕开（不齐，一大一小）→
// 把其中一半推给她。剩下的半张，他留了五十五年。
// 全部动作都发生在画里；村子那幅画只在旁边安静地亮着。
// ------------------------------------------------------------

type Ch6Phase = 'store' | 'open' | 'take' | 'unwrap' | 'tear' | 'give' | 'keep' | 'done'

const TEAR_AT = 58 // 折痕在 58%：左大右小

const PANELS: GPanel[] = [
  { id: 'store', img: '/story/a6-store.webp', x: 5, y: 8, w: 52, zoomable: true },
  { id: 'village', img: '/story/a6.webp', x: 63, y: 54, w: 34, zoomable: true },
]

export default function Ch6Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const [phase, setPhase] = useState<Ch6Phase>((D as Ch6Phase | null) ?? 'store')
  const [given, setGiven] = useState<'big' | 'small' | null>(
    D === 'keep' || D === 'done' ? 'big' : null)
  const later = useTimers()

  useLoop('/story/cicadas.mp3', 0.22)
  // 糖罐揭开起：八音盒主题（全游戏最完整的音乐）
  useLoop(phase !== 'store' ? '/story/theme-mb.wav' : null, 0.19)

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean) => {
    if (!zoomed || id !== 'store') return
    if (phase === 'store' && rx > 38 && rx < 72 && ry > 30 && ry < 60) {
      // 点一下罐盖 = 掀开
      setPhase('open')
      playOnce('/story/sfx-chime.mp3', 0.4, 1.5)
      return
    }
    if (phase === 'open' && rx > 42 && rx < 62 && ry > 42 && ry < 64) {
      setPhase('take')
      return
    }
    if (phase === 'keep') {
      const inBig = given !== 'big' && rx > 30 && rx < 52 && ry > 38 && ry < 60
      const inSmall = given !== 'small' && rx > 50 && rx < 70 && ry > 38 && ry < 60
      if (inBig || inSmall) {
        setPhase('done')
        later(onDone, 2800)
      }
    }
  }

  const onSwipe = (id: string, dx: number, dy: number, rx0: number, ry0: number) => {
    if (id !== 'store') return
    if (phase === 'store' && dy < -6 && rx0 > 38 && rx0 < 72 && ry0 > 30 && ry0 < 60) {
      // 往上掀：罐盖开了
      setPhase('open')
      playOnce('/story/sfx-chime.mp3', 0.4, 1.5)
      return
    }
    if (phase === 'take' && dx > 6) {
      // 往右拧：糖纸开了
      setPhase('unwrap')
      later(() => setPhase('tear'), 1100)
      return
    }
    if (phase === 'tear' && dx > 6 && rx0 > 52) {
      // 从折痕右边往右撕
      playOnce('/story/sfx-tear.mp3', 0.8)
      setPhase('give')
      return
    }
    if (phase === 'give' && dx > 6) {
      // 把哪一半推给她？起点在哪半，推的就是哪半
      const which: 'big' | 'small' = rx0 < TEAR_AT * 0.9 + 4 ? 'big' : 'small'
      setGiven(which)
      try { localStorage.setItem('zzc.gaveBig', which === 'big' ? '1' : '0') } catch { /* 无痕 */ }
      setPhase('keep')
    }
  }

  // 光停在哪，下一步就在哪（黏在供销社画里的位置上）
  const lightAt =
    phase === 'store' ? { panel: 'store', rx: 55, ry: 45 }
    : phase === 'open' ? { panel: 'store', rx: 55, ry: 55 }
    : phase === 'take' || phase === 'unwrap' ? { panel: 'store', rx: 50, ry: 50 }
    : phase === 'tear' ? { panel: 'store', rx: 52, ry: 50 }
    : phase === 'give' ? { panel: 'store', rx: 76, ry: 68 }
    : { panel: 'store', rx: 43, ry: 50 }

  // 圆圈提示：现在该碰哪里
  const rings: { panel: string; rx: number; ry: number }[] =
    phase === 'store' ? [{ panel: 'store', rx: 55, ry: 44 }]
    : phase === 'open' ? [{ panel: 'store', rx: 53, ry: 52 }]
    : phase === 'take' ? [{ panel: 'store', rx: 50, ry: 48 }]
    : phase === 'tear' ? [{ panel: 'store', rx: 58, ry: 50 }]
    : phase === 'give' ? [{ panel: 'store', rx: 45, ry: 50 }]
    : phase === 'keep' ? [{ panel: 'store', rx: given === 'big' ? 60 : 41, ry: 49 }]
    : []

  const torn = phase === 'give' || phase === 'keep' || phase === 'done'
  const wrapperOut = phase === 'tear' || torn

  const overlay = (id: string, zoomed: boolean) => {
    if (id === 'village') {
      // 你把那一半推给她之后：村子那头，一扇窗悄悄亮了——跨画的回声
      if (phase === 'give' || phase === 'keep' || phase === 'done') {
        return (
          <>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
              animation: 'propIn 2.6s ease', mixBlendMode: 'screen',
              background: 'radial-gradient(ellipse at 42% 46%, rgba(255,196,110,0.4), rgba(255,180,90,0) 68%)' }} />
            <div style={{ position: 'absolute', left: '38%', top: '40%', width: '9%', height: '14%',
              pointerEvents: 'none', animation: 'propIn 2.2s ease', borderRadius: 2,
              background: 'radial-gradient(ellipse, rgba(255,226,160,0.95), rgba(255,200,110,0.35) 70%, rgba(255,200,110,0))',
              filter: 'blur(0.5px)', boxShadow: '0 0 18px rgba(255,205,120,0.6)' }} />
          </>
        )
      }
      return null
    }
    if (id !== 'store') return null
    if (!zoomed) {
      // 糖罐常驻流光：这幅小画上有一处一直在悄悄发亮
      if (phase !== 'store') return null
      return (
        <div style={{ position: 'absolute', left: '44%', top: '34%', width: '22%', height: '26%',
          pointerEvents: 'none', mixBlendMode: 'screen',
          background: 'radial-gradient(ellipse, rgba(255,215,130,0.55), rgba(255,215,130,0) 70%)',
          animation: 'port-breathe 3.2s ease-in-out infinite' }} />
      )
    }
    return (
      <>
        {/* 罐盖（掀开前） */}
        {(phase === 'store' || phase === 'open') && (
          <div style={{
            position: 'absolute', left: '46%', top: '40%', zIndex: 16,
            width: '18%', aspectRatio: '2.6/1', borderRadius: '50%',
            background: 'radial-gradient(ellipse at 40% 30%, rgba(230,240,244,0.85), rgba(150,165,172,0.7) 60%, rgba(90,100,108,0.8))',
            border: '2px solid rgba(220,230,235,0.5)',
            boxShadow: '0 8px 18px rgba(0,0,0,0.5)',
            transform: phase === 'open' ? 'translateY(-220%) rotate(-18deg)' : 'none',
            opacity: phase === 'open' ? 0 : 1,
            transition: 'all 0.9s ease', pointerEvents: 'none',
          }} />
        )}
        {/* 罐口糖光 */}
        {phase === 'open' && (
          <div style={{ position: 'absolute', left: '46%', top: '46%', width: '18%', height: '18%',
            zIndex: 15, pointerEvents: 'none', animation: 'propIn 1.2s ease',
            background: 'radial-gradient(circle, rgba(255,214,120,0.7), rgba(255,214,120,0) 70%)' }} />
        )}

        {/* 手里的糖（拧开前/飞出） */}
        {(phase === 'take' || phase === 'unwrap') && (
          <div style={{
            position: 'absolute', left: '50%', top: '50%', zIndex: 16,
            width: '30%', aspectRatio: '2.3/1', marginLeft: '-15%', marginTop: '-8%',
            opacity: phase === 'unwrap' ? 0 : 1,
            transform: phase === 'unwrap' ? 'translateY(-60%) scale(0.6) rotate(24deg)' : 'none',
            transition: 'all 0.9s ease', pointerEvents: 'none',
          }}>
            <div style={{ position: 'absolute', left: '20%', top: '14%', width: '60%', height: '72%',
              borderRadius: 20, background: 'linear-gradient(160deg,#d6543c,#a03222)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.6)' }} />
            <div style={{ position: 'absolute', left: 0, top: '22%', width: '23%', height: '56%',
              background: '#e8dcc0', clipPath: 'polygon(0 50%, 100% 0, 100% 100%)' }} />
            <div style={{ position: 'absolute', right: 0, top: '22%', width: '23%', height: '56%',
              background: '#e8dcc0', clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
          </div>
        )}

        {/* 摊平的糖纸（撕前/撕后） */}
        {wrapperOut && (
          <>
            {given !== 'big' && (
              <div style={{
                position: 'absolute', left: '35%', top: '44%', zIndex: 15,
                width: `${TEAR_AT * 0.26}%`, height: '12%',
                background: 'linear-gradient(120deg,#e8dcc0 60%, #d6543c 60% 78%, #f0c860 78%)',
                clipPath: torn ? 'polygon(0 0, 96% 4%, 100% 50%, 96% 96%, 0 100%)' : 'none',
                transform: torn ? 'translateX(-9%) rotate(-3deg)' : 'none',
                transition: 'all 0.8s ease',
                boxShadow: '0 6px 16px rgba(0,0,0,0.55)',
                animation: phase === 'keep' ? 'port-breathe 2.6s ease-in-out infinite' : undefined,
                pointerEvents: 'none',
              }} />
            )}
            {given !== 'small' && (
              <div style={{
                position: 'absolute', left: `${35 + TEAR_AT * 0.26}%`, top: '44%', zIndex: 16,
                width: `${(100 - TEAR_AT) * 0.26}%`, height: '12%',
                background: 'linear-gradient(100deg,#f0c860 0 22%, #d6543c 22% 40%, #e8dcc0 40%)',
                clipPath: torn ? 'polygon(4% 4%, 100% 0, 100% 100%, 4% 96%, 0 50%)' : 'none',
                transform: torn ? 'translateX(28%) rotate(8deg)' : 'none',
                transition: 'all 0.8s ease',
                boxShadow: '0 6px 16px rgba(0,0,0,0.55)',
                animation: phase === 'keep' ? 'port-breathe 2.6s ease-in-out infinite' : undefined,
                pointerEvents: 'none',
              }} />
            )}
            {/* 折痕 */}
            {phase === 'tear' && (
              <div style={{ position: 'absolute', left: `${35 + TEAR_AT * 0.26}%`, top: '42%',
                width: 0, height: '16%', zIndex: 17, pointerEvents: 'none',
                borderLeft: '2px dashed rgba(255,220,140,0.85)',
                filter: 'drop-shadow(0 0 6px rgba(255,210,120,0.9))' }} />
            )}
          </>
        )}

        {/* 她的剪影（分糖时才在） */}
        {(phase === 'give' || phase === 'keep' || phase === 'done') && (
          <>
            <div style={{ position: 'absolute', left: '16%', top: '56%', width: '6%', height: '26%',
              zIndex: 14, background: 'linear-gradient(180deg, rgba(24,16,8,0.9), rgba(24,16,8,0.5))',
              borderRadius: '48% 48% 26% 26%', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '74%', top: '58%', width: '5.4%', height: '24%',
              zIndex: 14, background: 'linear-gradient(180deg, rgba(30,18,10,0.92), rgba(30,18,10,0.55))',
              borderRadius: '48% 48% 26% 26%', pointerEvents: 'none',
              boxShadow: '0 0 24px rgba(255,200,100,0.25)',
              animation: 'propIn 1.6s ease' }} />
          </>
        )}

        {phase === 'done' && <PaperBit x={42} y={50} size={0.9} />}
      </>
    )
  }

  const idleGlow = ['store']

  return (
    <>
      <PanelField
        panels={PANELS}
        fused={[]}
        onFuse={() => {}}
        onTap={onTap}
        onSwipe={onSwipe}
        renderOverlay={overlay}
        idleGlowIds={idleGlow}
        rings={rings}
        bg="/story/a6.webp"
        intro={{ img: '/story/a6-store.webp' }}
        lightAt={lightAt}
        lightColor={LIGHTS[6].core}
        lightGlow={LIGHTS[6].glow}
      />
      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
          <CollectCard label="糖 纸 · 伍 / 伍 · 半 张" />
        </div>
      )}
      <div className="act4-bar top" /><div className="act4-bar bottom" />
    </>
  )
}
