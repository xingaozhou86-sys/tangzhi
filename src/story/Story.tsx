import { useEffect, useState } from 'react'
import Ch1Goro from './Ch1Goro'
import Ch2Goro from './Ch2Goro'
import Ch3Goro from './Ch3Goro'
import Act4 from '../act4/Act4'
import Ch5Goro from './Ch5Goro'
import Ch6Goro from './Ch6Goro'
import { ReturnLeg, Finale } from './Finale'
import { WrapperStrip } from './bits'

// ------------------------------------------------------------
// 《情况属实》正片总装：标题 → 六幕（倒叙）→ 回程 → 终幕 → 完
// ------------------------------------------------------------

const CARDS: [string, string, string][] = [
  ['第一幕 · 夜班', '2025', '这栋楼里，只有他的灯还亮着'],
  ['第二幕 · 空城', '2020', '全城静默，只剩一扇窗'],
  ['第三幕 · 下岗', '1998', '榜上第一个名字，是他'],
  ['第四幕 · 三秒', '1988', '挡板是拆了的'],
  ['第五幕 · 舞会', '1985', '那晚他跳了舞，信没寄出去'],
  ['第六幕 · 分糖', '1970', '糖只有一颗，他撕成两半'],
  ['回 　 程', '', '一站一站，往回还'],
  ['终 　 幕', '现在', '另半张糖纸，在她那里'],
]

function storyIdx(): number | null {
  try {
    const m = window.location.hash.match(/^#\/story\/(\d+)/)
    if (!m) return null
    const n = Number(m[1])
    return n >= 1 && n <= 8 ? n - 1 : null
  } catch { return null }
}

export default function Story() {
  const [screen, setScreen] = useState<'title' | 'card' | 'play' | 'end'>(() =>
    storyIdx() != null ? 'play' : 'title',
  )
  const [idx, setIdx] = useState(() => storyIdx() ?? 0)
  const [cardOn, setCardOn] = useState(false)

  useEffect(() => {
    if (screen !== 'card') return
    setCardOn(false)
    const t1 = window.setTimeout(() => setCardOn(true), 60)
    const t2 = window.setTimeout(() => { setCardOn(false); setScreen('play') }, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [screen, idx])

  const done = () => {
    if (idx + 1 < CARDS.length) {
      setIdx(idx + 1)
      setScreen('card')
    } else {
      setScreen('end')
    }
  }

  if (screen === 'title') {
    return (
      <div className="story-title">
        <div className="bg" style={{ backgroundImage: 'url(/story/a6.webp)' }} />
        <div className="inner">
          <h1>情况属实<span className="seal">糖纸</span></h1>
          <div className="sub">一个人，五十五年</div>
          <button className="story-start" onClick={() => setScreen('card')}>开 始</button>
        </div>
        <div className="act4-vignette" />
        <div className="act4-grain" />
      </div>
    )
  }

  if (screen === 'end') {
    return (
      <div className="story-end on">
        <div className="t">情况属实</div>
        <a href="#/story" onClick={() => { setIdx(0); setScreen('title') }}>回到标题</a>
      </div>
    )
  }

  return (
    <>
      {screen === 'play' && idx === 0 && <Ch1Goro key="a1" onDone={done} />}
      {screen === 'play' && idx === 1 && <Ch2Goro key="a2" onDone={done} />}
      {screen === 'play' && idx === 2 && <Ch3Goro key="a3" onDone={done} />}
      {screen === 'play' && idx === 3 && <Act4 key="a4" onDone={done} />}
      {screen === 'play' && idx === 4 && <Ch5Goro key="a5" onDone={done} />}
      {screen === 'play' && idx === 5 && <Ch6Goro key="a6" onDone={done} />}
      {screen === 'play' && idx === 6 && <ReturnLeg key="rt" onDone={done} />}
      {screen === 'play' && idx === 7 && <Finale key="fn" onDone={done} />}
      {screen === 'play' && (
        <WrapperStrip filled={idx >= 6 ? 5 : Math.min(idx, 4)} halfLast={idx >= 6} />
      )}
      <div className={`story-card ${cardOn ? 'on' : ''}`}>
        <div className="t">{CARDS[idx][0]}</div>
        <div className="y">{CARDS[idx][1]}</div>
        <div className="line">{CARDS[idx][2]}</div>
      </div>
    </>
  )
}
