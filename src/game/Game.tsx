import { useEffect, useRef, useState } from 'react'
import { Board } from '../world/engine'
import { CH1, CH2, CH2B, CH3, CH5, CH5B, CH6, CH6B, CH7, CH7B, CHX1, CHX2, CHX3, CHX4 } from './chapters'
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
  { kind: 'chapter', def: CH2B },
  { kind: 'chapter', def: CH3 },
  { kind: 'chapter', def: CHX3 },
  { kind: 'act4' },
  { kind: 'chapter', def: CHX4 },
  { kind: 'chapter', def: CH5B },
  { kind: 'chapter', def: CH5 },
  { kind: 'chapter', def: CH7B },
  { kind: 'chapter', def: CH6 },
  { kind: 'chapter', def: CH6B },
  { kind: 'chapter', def: CH7 },
  { kind: 'epilogue' },
]

const ACT4_CARD = { no: '捌', name: '签字', poem: '五个字，他签了一生。', where: '一九七一 · 厂办公室' }
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

  // 一声响之后，音乐退场——直到终幕天才亮
  const stopScore = () => {
    const a = scoreRef.current
    if (!a) return
    scoreRef.current = null
    const t = window.setInterval(() => {
      a.volume = Math.max(0, a.volume - 0.02)
      if (a.volume <= 0) { a.pause(); window.clearInterval(t) }
    }, 120)
  }

  useEffect(() => {
    if (stage?.kind === 'act4') stopScore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  // 幕卡亮起的 2.6 秒里，把下一幕的画全部预载——转场永远不掉帧
  useEffect(() => {
    if (!card || idx + 1 >= STAGES.length) return
    const next = STAGES[idx + 1]
    const urls = new Set<string>()
    if (next.kind === 'chapter') {
      const def = next.def
      for (const p of def.panels) { urls.add(p.img); for (const l of p.layers ?? []) urls.add(l.img) }
      for (const s of def.steps) {
        const fx = s.fx
        if (fx.pushView) { urls.add(fx.pushView.view.img); if (fx.pushView.view.under) urls.add(fx.pushView.view.under.img) }
        if (fx.spawn) urls.add(fx.spawn.def.img)
        if (fx.swap) urls.add(fx.swap.img)
        if (fx.swapView?.img) urls.add(fx.swapView.img)
      }
    } else if (next.kind === 'act4') {
      urls.add('/act4/workshop.webp'); urls.add('/act4/room.webp')
    }
    urls.forEach(u => { const im = new Image(); im.src = u })
  }, [card, idx])

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
