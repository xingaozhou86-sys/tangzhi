import { useState } from 'react'
import { PanelField } from './goro'
import type { GPanel } from './goro'
import { LIGHTS, useLoop, useTimers, playOnce, dbgPh } from './ui'
import { CollectCard, PaperBit } from './bits'

// ------------------------------------------------------------
// 第五章 · 舞会（1985）—— 动词：转（堆叠翻转）
// 开场桌上就有两幅画：礼堂，和角落一幅睡着的天台——发暗、安静。
// 礼堂的收音机在呼吸（圆圈）。点一下，舞会转起来——
// 全游戏第一次响起音乐；睡着的天台同时被照亮、醒来，
// 被虚线框轻轻圈住：把礼堂整幅拖进那个框——画翻过去，
// 跳舞的人变成天台上两把并排的椅子。天台角落靠着一幅更小的画
// （圆圈）：点它，进入 1978 的邮电所——把他当年没寄出的信
// 往上轻轻一推（或点一下），寄掉。印台下压着第四角糖纸。
// ------------------------------------------------------------

type Ch5Phase = 'hall' | 'merged' | 'post' | 'mailed' | 'ink' | 'collect' | 'done'

const HALL: GPanel = {
  id: 'hall', img: '/story/a5.webp', x: 5, y: 10, w: 50,
  zoomable: true, stackWith: 'roof',
}
const ROOF: GPanel = { id: 'roof', img: '/story/a5-roof.webp', x: 58, y: 46, w: 38, zoomable: true }

export default function Ch5Goro({ onDone }: { onDone: () => void }) {
  const D = dbgPh()
  const late = D === 'merged' || D === 'post' || D === 'mailed' || D === 'ink' || D === 'collect' || D === 'done'
  const [musicOn, setMusicOn] = useState(!!D && D !== 'hall')
  const [phase, setPhase] = useState<Ch5Phase>(
    D === 'merged' ? 'merged' : D === 'post' ? 'post' : D === 'mailed' ? 'mailed'
    : D === 'ink' ? 'ink' : D === 'collect' || D === 'done' ? 'collect' : 'hall')
  const later = useTimers()

  const inPost = phase === 'post' || phase === 'mailed' || phase === 'ink' || phase === 'collect' || phase === 'done'
  useLoop(musicOn && !inPost ? '/story/boombox.mp3' : null, 0.36)   // 舞会广播：进 1978 画中画时退场
  useLoop(inPost ? '/story/theme-mb.wav' : null, 0.17)             // 记忆深处：八音盒主题

  const merged = late || phase !== 'hall'
  const panels: GPanel[] = [
    {
      ...HALL,
      img: inPost ? '/story/a5-post1978.webp' : merged ? '/story/a5-roof.webp' : '/story/a5.webp',
      stackWith: musicOn && !merged ? 'roof' : undefined,   // 音乐没响之前，叠上去也不会翻
    },
    { ...ROOF, hide: merged },                              // 天台从开场就在桌上，只是睡着
  ]

  const onFuse = (_a: string, _b: string, key: string) => {
    if (key !== 'stack') return
    playOnce('/story/sfx-chime.mp3', 0.6, 0.8)
    setPhase('merged')
  }

  const mailLetter = () => {
    setPhase('mailed')
    playOnce('/story/sfx-chime.mp3', 0.5, 0.9)
    later(() => setPhase('ink'), 1700)
  }

  const onTap = (id: string, rx: number, ry: number, zoomed: boolean) => {
    if (!zoomed || id !== 'hall') return
    if (!musicOn && rx > 55 && rx < 78 && ry > 48 && ry < 78) {
      // 点收音机：舞会转起来
      setMusicOn(true)
      playOnce('/story/sfx-chime.mp3', 0.4, 1.3)
      return
    }
    if (phase === 'merged' && rx > 52 && rx < 74 && ry > 54 && ry < 82) {
      // 点天台角落那幅小画：进入 1978 邮电所
      setPhase('post')
      playOnce('/story/sfx-chime.mp3', 0.35, 1.1)
      return
    }
    if (phase === 'post' && rx > 26 && rx < 56 && ry > 62 && ry < 92) {
      mailLetter()                                   // 点一下信 = 寄掉
      return
    }
    if (phase === 'ink' && rx > 54 && rx < 76 && ry > 52 && ry < 74) {
      setPhase('collect')
      return
    }
    if (phase === 'collect' && rx > 54 && rx < 78 && ry > 52 && ry < 78) {
      setPhase('done')
      later(onDone, 2600)
    }
  }

  const onSwipe = (id: string, _dx: number, dy: number, rx0: number, ry0: number) => {
    if (id !== 'hall' || phase !== 'post') return
    // 把信往上轻轻一推：寄掉
    if (dy < -6 && rx0 > 26 && rx0 < 56 && ry0 > 62 && ry0 < 92) mailLetter()
  }

  // 光停在哪，下一步就在哪
  const lightAt =
    !musicOn ? { panel: 'hall', rx: 66, ry: 63 }
    : !merged ? { panel: 'roof', rx: 50, ry: 50 }
    : phase === 'merged' ? { panel: 'hall', rx: 63, ry: 68 }
    : phase === 'post' ? { panel: 'hall', rx: 41, ry: 79 }
    : phase === 'ink' ? { panel: 'hall', rx: 66, ry: 60 }
    : { panel: 'hall', rx: 70, ry: 64 }

  // 圆圈提示：现在该点哪里；musicOn 后用虚线框圈住天台（把礼堂拖进来）
  const rings: { panel: string; rx: number; ry: number; shape?: 'circle' | 'frame' }[] =
    !musicOn ? [{ panel: 'hall', rx: 66, ry: 61 }]
    : !merged ? [{ panel: 'roof', rx: 50, ry: 50, shape: 'frame' }]
    : phase === 'merged' ? [{ panel: 'hall', rx: 63, ry: 66 }]
    : phase === 'post' ? [{ panel: 'hall', rx: 41, ry: 77 }]
    : phase === 'ink' ? [{ panel: 'hall', rx: 66, ry: 59 }]
    : []

  const overlay = (id: string, zoomed: boolean) => {
    if (id === 'roof') {
      if (!musicOn) {
        // 睡着的天台：发暗、安静，但你能看见它在那儿
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'rgba(6,7,12,0.5)', transition: 'background 2s ease' }} />
        )
      }
      if (!merged) {
        // 音乐响起的那一刻：天台被照亮、醒来
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            animation: 'propIn 2.2s ease', mixBlendMode: 'screen',
            background: 'radial-gradient(ellipse at 50% 55%, rgba(255,200,120,0.4), rgba(255,180,90,0) 72%)' }} />
        )
      }
      return null
    }
    if (id !== 'hall') return null
    if (!musicOn) {
      // 收音机常驻微光：开场就有"这里能动"的信号
      return (
        <div style={{ position: 'absolute', left: '56%', top: '48%', width: '24%', height: '32%',
          pointerEvents: 'none', mixBlendMode: 'screen',
          background: 'radial-gradient(ellipse, rgba(255,205,120,0.5), rgba(255,205,120,0) 70%)',
          animation: 'port-breathe 3.4s ease-in-out infinite' }} />
      )
    }
    if (!inPost && musicOn && !merged) {
      // 音乐响起后，整幅礼堂暖一度
      return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,180,90,0.18), rgba(255,150,60,0) 70%)',
          animation: 'propIn 2.4s ease' }} />
      )
    }
    if (!inPost && merged) {
      // 天台：两把并排的椅子微微发光
      return (
        <div style={{ position: 'absolute', left: '50%', top: '52%', width: '34%', height: '34%',
          pointerEvents: 'none', animation: 'propIn 2s ease', mixBlendMode: 'screen',
          background: 'radial-gradient(ellipse, rgba(255,200,120,0.55), rgba(255,200,120,0) 72%)' }} />
      )
    }
    if (inPost && zoomed) {
      return (
        <>
          {/* 信封（翻盖线+红邮票+地址行） */}
          <div style={{
            position: 'absolute', left: '30%', top: '70%', zIndex: 16,
            width: '22%', aspectRatio: '1.7/1',
            background: 'linear-gradient(160deg,#e2d3ac,#c9b586)',
            border: '1px solid #a08d60',
            filter: 'brightness(0.85) saturate(0.85)',
            boxShadow: '0 6px 14px rgba(0,0,0,0.5)',
            transform: phase === 'post' ? 'none' : 'translateY(-160%) scaleY(0.2)',
            opacity: phase === 'post' ? 1 : 0,
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

  const idleGlow =
    !musicOn ? ['hall']
    : !merged ? ['hall', 'roof']
    : ['hall']

  return (
    <>
      <PanelField
        panels={panels}
        fused={[]}
        onFuse={onFuse}
        onTap={onTap}
        onSwipe={onSwipe}
        renderOverlay={overlay}
        idleGlowIds={idleGlow}
        rings={rings}
        bg="/story/a5.webp"
        intro={{ img: '/story/a5.webp' }}
        lightAt={lightAt}
        lightColor={LIGHTS[5].core}
        lightGlow={LIGHTS[5].glow}
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
