import { useState } from 'react'
import { GridField } from './grid'
import type { GPanel, GRing } from './grid'
import { useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第五章 · 舞会（1985）—— 格子墙 · 叠画翻转
// 墙上两幅画：礼堂，和右上角一幅睡着的天台——发暗、安静。
// 入画礼堂，点收音机：舞会转起来，全游戏第一次响起音乐；
// 睡着的天台同时被照亮、醒来。
// 把礼堂整幅拖到天台上面——画翻过去：跳舞的人变成
// 天台上两把并排的椅子。
// 入画天台，角落里靠着一幅更小的画（1978 邮电所）——
// 揭下来，它落成一幅新画。入画邮电所，把他当年没寄出的信
// 往上一推（或点一下），寄掉。印台下压着第四角糖纸。
// ------------------------------------------------------------

type Ch5Phase = 'hall' | 'merged' | 'post' | 'mailed' | 'ink' | 'collect' | 'done'

const HALL: GPanel = { id: 'hall', img: '/story/a5.webp', slot: 0, zoomable: true }
const ROOF: GPanel = { id: 'roof', img: '/story/a5-roof.webp', slot: 1, zoomable: true }
const POST: GPanel = { id: 'post', img: '/story/a5-post1978.webp', slot: 2, zoomable: true }

export default function Ch5Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const late = D === 'merged' || D === 'post' || D === 'mailed' || D === 'ink' || D === 'collect' || D === 'done'
  const [musicOn, setMusicOn] = useState(!!D && D !== 'hall')
  const [phase, setPhase] = useState<Ch5Phase>(
    D === 'post' || D === 'mailed' || D === 'ink' || D === 'collect' || D === 'done' ? D as Ch5Phase
    : D === 'merged' ? 'merged' : 'hall')
  const [postOut, setPostOut] = useState(
    D === 'post' || D === 'mailed' || D === 'ink' || D === 'collect' || D === 'done')
  const [fused, setFused] = useState<[string, string][]>(late ? [['hall', 'roof']] : [])
  const later = useTimers()

  const merged = late || phase !== 'hall'
  useLoop(musicOn && !postOut ? '/story/boombox.mp3' : null, 0.36)
  useLoop(postOut ? '/story/theme-mb.wav' : null, 0.17)

  const panels: GPanel[] = [
    {
      ...HALL,
      img: merged ? '/story/a5-roof.webp' : '/story/a5.webp',
      layerOn: musicOn && !merged ? 'roof' : undefined,   // 音乐没响之前，叠上去也不会翻
      slot: merged ? 1 : 0,
    },
    { ...ROOF, hide: merged },
    ...(postOut ? [POST] : []),
  ]

  const onFuse = (_a: string, _b: string, key: string) => {
    if (key !== 'stack') return
    setFused((f) => [...f, ['hall', 'roof']])
    playOnce('/story/sfx-chime.mp3', 0.6, 0.8)
    setPhase('merged')
  }

  const mailLetter = () => {
    setPhase('mailed')
    playOnce('/story/sfx-chime.mp3', 0.5, 0.9)
    later(() => setPhase('ink'), 1700)
  }

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean) => {
    if (!zoomed) return
    if (id === 'hall' && !musicOn && rx > 55 && rx < 78 && ry > 48 && ry < 78) {
      setMusicOn(true)                                  // 点收音机：舞会转起来
      playOnce('/story/sfx-chime.mp3', 0.4, 1.3)
      return
    }
    if (id === 'hall' && phase === 'merged' && !postOut && rx > 52 && rx < 74 && ry > 54 && ry < 82) {
      setPostOut(true)                                  // 揭下天台角落的邮电所
      playOnce('/story/sfx-chime.mp3', 0.35, 1.1)
      return
    }
    if (id === 'post' && phase === 'merged' && rx > 26 && rx < 56 && ry > 62 && ry < 92) {
      mailLetter()
      return
    }
    if (id === 'post' && phase === 'ink' && rx > 54 && rx < 76 && ry > 52 && ry < 74) {
      setPhase('collect')
      return
    }
    if (id === 'post' && phase === 'collect' && rx > 54 && rx < 78 && ry > 52 && ry < 78) {
      setPhase('done')
      later(onDone, 2600)
    }
  }

  const onSwipe = (id: string, _dx: number, dy: number, rx0: number, ry0: number) => {
    if (id === 'post' && phase === 'merged' && dy < -6 && rx0 > 26 && rx0 < 56 && ry0 > 62 && ry0 < 92) {
      mailLetter()                                      // 把信往上轻轻一推：寄掉
    }
  }

  // 第一动立刻给圆圈；其余静置后才出现
  const ringsNow: GRing[] = !musicOn ? [{ panel: 'hall', rx: 66, ry: 61 }] : []
  const rings: GRing[] =
    !merged && musicOn ? [{ panel: 'roof', rx: 50, ry: 50, shape: 'frame' }]
    : phase === 'merged' && !postOut ? [{ panel: 'hall', rx: 63, ry: 66 }]
    : phase === 'merged' && postOut ? [{ panel: 'post', rx: 41, ry: 77 }]
    : phase === 'ink' ? [{ panel: 'post', rx: 66, ry: 59 }]
    : []

  const overlay = (id: string, zoomed: boolean) => {
    if (id === 'roof') {
      if (!musicOn) {
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'rgba(6,7,12,0.5)', transition: 'background 2s ease' }} />
        )
      }
      return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          animation: 'propIn 2.2s ease', mixBlendMode: 'screen',
          background: 'radial-gradient(ellipse at 50% 55%, rgba(255,200,120,0.4), rgba(255,180,90,0) 72%)' }} />
      )
    }
    if (id === 'hall') {
      if (!musicOn) {
        return (
          <div style={{ position: 'absolute', left: '56%', top: '48%', width: '24%', height: '32%',
            pointerEvents: 'none', mixBlendMode: 'screen',
            background: 'radial-gradient(ellipse, rgba(255,205,120,0.5), rgba(255,205,120,0) 70%)',
            animation: 'port-breathe 3.4s ease-in-out infinite' }} />
        )
      }
      if (!merged) {
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 60%, rgba(255,180,90,0.18), rgba(255,150,60,0) 70%)',
            animation: 'propIn 2.4s ease' }} />
        )
      }
      if (merged && !postOut) {
        return (
          <div style={{ position: 'absolute', left: '50%', top: '52%', width: '34%', height: '34%',
            pointerEvents: 'none', animation: 'propIn 2s ease', mixBlendMode: 'screen',
            background: 'radial-gradient(ellipse, rgba(255,200,120,0.55), rgba(255,200,120,0) 72%)' }} />
        )
      }
      return null
    }
    if (id === 'post' && zoomed) {
      return (
        <>
          {/* 信封 */}
          <div style={{
            position: 'absolute', left: '30%', top: '70%', zIndex: 16,
            width: '22%', aspectRatio: '1.7/1',
            background: 'linear-gradient(160deg,#e2d3ac,#c9b586)',
            border: '1px solid #a08d60',
            filter: 'brightness(0.85) saturate(0.85)',
            boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
            transform: phase === 'merged' ? 'none' : 'translateY(-160%) scaleY(0.2)',
            opacity: phase === 'merged' ? 1 : 0,
            transition: 'transform 1s ease, opacity 1s ease',
            overflow: 'hidden', pointerEvents: 'none',
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
          {/* 寄出后的红邮戳 */}
          {(phase === 'mailed' || phase === 'ink' || phase === 'collect' || phase === 'done') && (
            <div style={{
              position: 'absolute', left: '70%', top: '14%', width: '16%', aspectRatio: '1/1', zIndex: 15,
              border: '3px solid rgba(160,58,40,0.85)', borderRadius: '50%',
              transform: 'rotate(-14deg)', pointerEvents: 'none',
              boxShadow: 'inset 0 0 0 2px rgba(160,58,40,0.35)',
              animation: 'propIn 0.7s ease',
            }}>
              <div style={{ position: 'absolute', inset: '22%', border: '1.5px solid rgba(160,58,40,0.6)',
                borderRadius: '50%' }} />
            </div>
          )}
          {/* 印台 */}
          {(phase === 'ink' || phase === 'collect' || phase === 'done') && (
            <div style={{
              position: 'absolute', left: '58%', top: '56%', width: '16%', aspectRatio: '2.2/1', zIndex: 15,
              borderRadius: 6, background: 'linear-gradient(160deg,#4a3226,#2c1e14)',
              boxShadow: phase === 'ink'
                ? '0 6px 14px rgba(0,0,0,0.6), 0 0 20px rgba(255,210,120,0.55)'
                : '0 6px 14px rgba(0,0,0,0.6)',
              animation: phase === 'ink' ? 'port-breathe 2.6s ease-in-out infinite' : undefined,
              pointerEvents: 'none',
            }}>
              <div style={{ position: 'absolute', inset: '18% 12%', borderRadius: 4,
                background: 'radial-gradient(ellipse, #7a1e10, #4a1208)' }} />
            </div>
          )}
          {(phase === 'collect' || phase === 'done') && <PaperBit x={64} y={62} />}
        </>
      )
    }
    return null
  }

  return (
    <>
      <GridField
        panels={panels}
        fused={fused}
        onFuse={onFuse}
        onTap={onTap}
        onSwipe={onSwipe}
        renderOverlay={overlay}
        rings={rings}
        ringsNow={ringsNow}
        bg="/story/a5.webp"
        intro={{ img: '/story/a5.webp' }}
      />
      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}>
          <CollectCard label="糖 纸 · 肆 / 伍" />
        </div>
      )}
      <div className="act4-bar top" /><div className="act4-bar bottom" />
    </>
  )
}
