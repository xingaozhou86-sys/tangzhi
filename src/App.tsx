import { useEffect, useState } from 'react'
import Act4 from './act4/Act4'
import Story from './story/Story'
import './App.css'

// ------------------------------------------------------------
// 《情况属实》—— 正片唯一入口
// 深链：#/act4 自查第四章；#/story/N?ph=<阶段> 跳幕调试
// ------------------------------------------------------------
function hashScreen(): 'act4' | 'story' {
  try {
    if (window.location.hash.startsWith('#/act4')) return 'act4'
  } catch { /* ignore */ }
  return 'story'
}

export default function App() {
  const [screen, setScreen] = useState<'act4' | 'story'>(hashScreen)

  useEffect(() => {
    const onHash = () => setScreen(hashScreen())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (screen === 'act4') return <Act4 />
  return <Story />
}
