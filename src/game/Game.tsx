import { useEffect, useRef, useState } from 'react'
import { Board } from '../world/engine'
import { CH1, CH2, CH3, CH5, CH6, CHX1, CHX2, CHX3, CHX4 } from './chapters'
import { ActFour } from './ActFour'
import { Epilogue } from './Epilogue'
import './game.css'

// ------------------------------------------------------------
// 《糖纸》· 编排：片头 → 六幕 → 回程
// ------------------------------------------------------------
type Stage =
  | { kind: 'chapter'; def: typeof CH1 }
  | { kind: 'act4' }
  | { kind: 'epilogue' }

const STAGES: Stage[] = [
  { kind: 'chapter', def: CH1 },
  { kind: 'chapter', def: CHX1 },
  { kind: 'chapter', def: CH2 },
  { kind: 'chapter', def: CHX2 },
  { kind: 'chapter', def: CH3 },
  { kind: 'chapter', def: CHX3 },
  { kind: 'act4' },
  { kind: 'chapter', def: CHX4 },
  { kind: 'chapter', def: CH5 },
  { kind: 'chapter', def: CH6 },
  { kind: 'epilogue' },
]

const ACT4_CARD = { no: '柒', name: '签字', poem: '五个字，他签了一生。', where: '一九七一 · 厂办公室' }
const EP_CARD = { no: '终', name: '回程', poem: '往回走，走回糖纸发光的地方。', where: '如今' }

function cardOf(s: Stage) {
  if (s.kind === 'chapter') return { no: s.def.no, name: s.def.name, poem: s.def.poem, where: s.def.where ?? '' }
  if (s.kind === 'act4') return ACT4_CARD
  return EP_CARD
}

export default function Game() {
  const [idx, setIdx] = useState(() => {
    const s = new URLSearchParams(window.location.search).get('s')
    const n = s == null ? -1 : parseInt(s, 10)
    return Number.isFinite(n) && n >= 0 && n < STAGES.length ? n : -1
  })
  const [card, setCard] = useState(false)
  const [wrappers, setWrappers] = useState(0)

  const stage = idx >= 0 && idx < STAGES.length ? STAGES[idx] : null
  const scoreRef = useRef<HTMLAudioElement | null>(null)

  const startScore = () => {
    if (scoreRef.current) return
    const a = new Audio('/sfx/theme.wav')
    a.loop = true
    a.volume = 0
    a.play().then(() => {
      let v = 0
      const t = window.setInterval(() => {
        v = Math.min(0.16, v + 0.02)
        a.volume = v
        if (v >= 0.16) window.clearInterval(t)
      }, 150)
      scoreRef.current = a
    }).catch(() => {})
  }

  const advance = () => {
    startScore()
    setCard(true)
  }

  useEffect(() => {
    if (!card) return
    const t = window.setTimeout(() => {
      setIdx(i => i + 1)
      setCard(false)
    }, 2600)
    return () => window.clearTimeout(t)
  }, [card])

  return (
    <div className="game">
      {idx === -1 && !card && (
        <div className="t-screen">
          <div className="t-bg" />
          <div className="t-inner">
            <div className="t-seal">半生</div>
            <h1 className="t-title">糖纸</h1>
            <div className="t-sub">一个人，五十年，五张糖纸</div>
            <button className="t-start" onClick={advance}>开 始</button>
          </div>
        </div>
      )}

      {card && idx + 1 < STAGES.length && (() => {
        const c = cardOf(STAGES[idx + 1])
        return <Card no={c.no} name={c.name} poem={c.poem} where={c.where} />
      })()}

      {!card && stage?.kind === 'chapter' && (
        <Board
          key={stage.def.id}
          def={stage.def}
          onDone={advance}
          onCollect={() => setWrappers(w => Math.min(5, w + 1))}
        />
      )}
      {!card && stage?.kind === 'act4' && <ActFour onDone={advance} />}
      {!card && stage?.kind === 'epilogue' && <Epilogue />}

      {idx >= 0 && wrappers > 0 && (
        <div className="wstrip">
          {[0, 1, 2, 3, 4].map(k => (
            <i key={k} className={`wslot ${wrappers > k ? 'got' : ''}`} />
          ))}
        </div>
      )}
    </div>
  )
}

function Card({ no, name, poem, where }: { no: string; name: string; poem: string; where: string }) {
  return (
    <div className="card">
      <div className="card-no">第{no}幕</div>
      <div className="card-name">{name}</div>
      <div className="card-poem">{poem}</div>
      {where && <div className="card-where">{where}</div>}
    </div>
  )
}
