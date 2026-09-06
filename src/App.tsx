import { useEffect, useState } from 'react'
import { WLEVELS } from './game/world'
import TileArt from './game/TileArt'
import WorldView from './game/WorldView'
import Act4 from './act4/Act4'
import Story from './story/Story'
import './App.css'

// ------------------------------------------------------------
// 存档
// ------------------------------------------------------------
const SAVE_KEY = 'passage-progress-v1'

interface Progress {
  completed: number[]
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const p = JSON.parse(raw)
      return { completed: p.completed ?? [] }
    }
  } catch { /* ignore */ }
  return { completed: [] }
}

// ------------------------------------------------------------
// 标题 / 目录 / 终幕
// ------------------------------------------------------------
function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div className="frame title-frame" style={{ padding: 9, marginBottom: 30 }}>
        <div style={{ width: 132, height: 132, border: '1.5px solid #191713', background: '#f7f3ea', position: 'relative', overflow: 'hidden' }}>
          <TileArt tile={{ id: 'logo', ports: [], links: [], art: 10 }} litDirs={new Set()} />
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <circle cx={50} cy={34} r={8} fill="#d9a41c" style={{ filter: 'drop-shadow(0 0 4px rgba(217,164,28,0.9))' }} />
            <polyline points="50,92 38,72 58,58 44,40 50,34" fill="none" stroke="#d9a41c" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <h1 className="reframe-h1">穿 画</h1>
      <div style={{ letterSpacing: '0.5em', fontSize: 13, opacity: 0.6, margin: '10px 0 4px' }}>P A S S A G E</div>
      <p style={{ fontSize: 14, opacity: 0.7, margin: '22px 0 36px', letterSpacing: '0.15em' }}>从一幅画，走进另一幅画。</p>
      <button className="reframe-btn primary" onClick={onStart}>开 始</button>
    </div>
  )
}

function SelectScreen({ completed, onPick, onBack }: { completed: number[]; onPick: (i: number) => void; onBack: () => void }) {
  const unlocked = (i: number) => i === 0 || completed.includes(WLEVELS[i - 1].id)
  return (
    <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
      <div className="level-tag">目 录</div>
      <h2 style={{ fontSize: 26, letterSpacing: '0.15em', margin: '10px 0 4px' }}>展品墙</h2>
      <p style={{ fontSize: 12, opacity: 0.5, letterSpacing: '0.2em', marginTop: 8 }}>试玩切片 · 三幕</p>
      <div className="gallery-grid" style={{ marginTop: 30, gap: 26 }}>
        {WLEVELS.map((lv, i) => {
          const ok = unlocked(i)
          const done = completed.includes(lv.id)
          const rep = lv.scenes[lv.wall[0]]
          return (
            <button key={lv.id} className={`gallery-item ${done ? 'done' : ''}`} disabled={!ok} onClick={() => onPick(i)}>
              <span className="gallery-thumb" style={{ width: 92, height: 92 }}>
                <TileArt tile={{ id: lv.name, ports: [], links: [], art: rep.art }} litDirs={new Set()} />
              </span>
              <span className="gallery-cap" style={{ fontSize: 13 }}>
                {['一', '二', '三'][i]} · {lv.name}
                {done ? ' ◆' : ok ? '' : ' · 锁'}
              </span>
            </button>
          )
        })}
      </div>
      <button className="reframe-btn" style={{ marginTop: 40 }} onClick={onBack}>回标题</button>
    </div>
  )
}

function EndScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="paper-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
      <div className="level-tag">切 片 完</div>
      <h2 style={{ fontSize: 24, letterSpacing: '0.14em', margin: '26px 0 34px', fontWeight: 'normal', opacity: 0.9 }}>三幕，全部通了。</h2>
      <button className="reframe-btn" onClick={onRestart}>回到标题</button>
    </div>
  )
}

// ------------------------------------------------------------
// 深链：#/play/N 直接进入第 N 幕，#/select 进展品墙（自查用）
// ------------------------------------------------------------
function hashLevel(): number | null {
  try {
    const m = window.location.hash.match(/^#\/play\/(\d+)$/)
    if (!m) return null
    const n = Number(m[1])
    return n >= 1 && n <= WLEVELS.length ? n - 1 : null
  } catch {
    return null
  }
}

function hashScreen(): 'title' | 'select' | 'play' | 'act4' | 'story' {
  try {
    if (window.location.hash.startsWith('#/act4')) return 'act4'
    if (window.location.hash.startsWith('#/story')) return 'story'
  } catch { /* ignore */ }
  if (hashLevel() != null) return 'play'
  try {
    if (window.location.hash === '#/select') return 'select'
  } catch { /* ignore */ }
  return 'story' // 默认进入《情况属实》正片
}

export default function App() {
  const [screen, setScreen] = useState<'title' | 'select' | 'play' | 'end' | 'act4' | 'story'>(hashScreen)
  const [levelIdx, setLevelIdx] = useState(() => hashLevel() ?? 0)
  const [progress, setProgress] = useState(loadProgress)

  useEffect(() => {
    const onHash = () => {
      setScreen(hashScreen())
      const lv = hashLevel()
      if (lv != null) setLevelIdx(lv)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const save = (next: Progress) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    return next
  }

  const completeLevel = (id: number) => {
    setProgress((prev) =>
      save({ completed: prev.completed.includes(id) ? prev.completed : [...prev.completed, id] }),
    )
  }

  if (screen === 'act4') return <Act4 />
  if (screen === 'story') return <Story />
  if (screen === 'title') return <TitleScreen onStart={() => setScreen('select')} />
  if (screen === 'select')
    return (
      <SelectScreen
        completed={progress.completed}
        onPick={(i) => {
          setLevelIdx(i)
          setScreen('play')
        }}
        onBack={() => setScreen('title')}
      />
    )
  if (screen === 'end') return <EndScreen onRestart={() => setScreen('title')} />

  const level = WLEVELS[levelIdx]
  return (
    <WorldView
      key={levelIdx}
      level={level}
      levelIndex={levelIdx}
      levelCount={WLEVELS.length}
      onExit={() => setScreen('select')}
      onNext={() => {
        completeLevel(level.id)
        if (levelIdx + 1 < WLEVELS.length) {
          setLevelIdx(levelIdx + 1)
          setScreen('play')
        } else {
          setScreen('end')
        }
      }}
    />
  )
}
