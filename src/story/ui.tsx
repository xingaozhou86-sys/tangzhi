import { useEffect, useRef } from 'react'
import '../act4/act4.css'
import './story.css'

// ------------------------------------------------------------
// 共享框架：舞台 / 光粒 / 呼吸金圈 / 音频
// ------------------------------------------------------------

export interface Pt { x: number; y: number }

// 调试：#/story/N?ph=<阶段> 直接落到某章某阶段（仅开发用）
export function dbgPh(): string | null {
  try {
    const q = window.location.hash.split('?')[1]
    return q ? new URLSearchParams(q).get('ph') : null
  } catch { return null }
}

export function useLoop(src: string | null, vol = 0.5) {
  useEffect(() => {
    if (!src) return
    const a = new Audio(src)
    a.loop = true
    a.volume = vol
    const tryPlay = () => a.play().catch(() => {})
    tryPlay()
    window.addEventListener('pointerdown', tryPlay)
    return () => {
      window.removeEventListener('pointerdown', tryPlay)
      a.pause()
    }
  }, [src, vol])
}

export function playOnce(src: string, vol = 0.8, rate = 1) {
  const a = new Audio(src)
  a.volume = vol
  a.playbackRate = rate
  a.play().catch(() => {})
  return a
}

// 音量渐变（淡入/淡出/回避）
export function fadeVol(a: HTMLAudioElement, target: number, ms = 1600) {
  const from = a.volume
  const t0 = performance.now()
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / ms)
    a.volume = from + (target - from) * k
    if (k < 1) requestAnimationFrame(tick)
  }
  tick()
}

export function useTimers() {
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  return later
}

interface ShellProps {
  bg?: string
  bgOn?: boolean
  grey?: boolean
  upturn?: boolean
  light?: Pt
  lightColor?: string   // 核心色
  lightGlow?: string    // 光晕
  lightDim?: boolean
  lightScale?: number
  rings?: { x: number; y: number; size?: number }[]
  onPointerDown?: (e: React.PointerEvent) => void
  children?: React.ReactNode
}

export function Shell(p: ShellProps) {
  const core = p.lightColor ?? '#ffd76a'
  const glow = p.lightGlow ?? 'rgba(255,200,90,0.9)'
  return (
    <div className="act4-root">
      <div
        className={`act4-stage ${p.grey ? 'grey' : ''} ${p.upturn ? 'upturn' : ''}`}
        onPointerDown={p.onPointerDown}
      >
        {p.bg && (
          <div
            className={`act4-bg ${p.bgOn ? 'on' : ''}`}
            style={{ backgroundImage: `url(${p.bg})` }}
          />
        )}
        {p.children}
        {p.rings?.map((r, i) => (
          <div
            key={i}
            className="act4-ring"
            style={{ left: `${r.x}%`, top: `${r.y}%`, width: r.size ?? 64, height: r.size ?? 64 }}
          />
        ))}
        {p.light && (
          <div
            className={`act4-light ${p.lightDim ? 'dim' : ''}`}
            style={{
              left: `${p.light.x}%`,
              top: `${p.light.y}%`,
              background: `radial-gradient(circle, #fffbe8 0%, ${core} 45%, rgba(0,0,0,0) 72%)`,
              filter: `drop-shadow(0 0 14px ${glow})`,
              transform: p.lightScale ? `scale(${p.lightScale})` : undefined,
            }}
          />
        )}
      </div>
      <div className="act4-vignette" />
      <div className="act4-grain" />
      <div className="act4-bar top" />
      <div className="act4-bar bottom" />
    </div>
  )
}

// 各幕光色（色温弧：蓝白 → 琥珀金）
export const LIGHTS: Record<number, { core: string; glow: string }> = {
  1: { core: '#b9d2f2', glow: 'rgba(150,190,240,0.8)' },
  2: { core: '#c9d4d8', glow: 'rgba(170,190,195,0.8)' },
  3: { core: '#e2d3a8', glow: 'rgba(220,195,130,0.85)' },
  4: { core: '#ffd76a', glow: 'rgba(255,200,90,0.9)' },
  5: { core: '#ffc078', glow: 'rgba(255,180,100,0.9)' },
  6: { core: '#ffc233', glow: 'rgba(255,195,60,1)' },
}
