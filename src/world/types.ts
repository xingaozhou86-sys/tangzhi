// ------------------------------------------------------------
// 《糖纸》v3 · 深画引擎类型
// 语法四条：
//   入画 —— 点画里的圆，镜头钻进那一处（可一路钻到另一个空间）
//   挪画 —— 把画拖到别的框；拖到能接上的缝旁边，缝就消失
//   揭画 —— 把上层画撕到空框，露出底下的年份
//   叠画 —— 把一幅画覆到另一幅上，合成新的画面
// 他永远站在画里。你铺路，他走。
// ------------------------------------------------------------
export type Cell = 0 | 1 | 2 | 3
export type Side = 'l' | 'r' | 't' | 'b'

export interface Spot { id: string; x: number; y: number; w: number; h: number }

/** 一层视野：一幅画当前看到的样子。crop = 只取原画的这一块（连续变焦） */
export interface View {
  img: string
  crop?: { x: number; y: number; w: number; h: number }
  tint?: string
  year?: string
  spots?: Spot[]
}

/** 可揭的一层画 */
export interface Layer extends View {
  edges?: Partial<Record<Side, string>>
}

export interface PanelDef {
  id: string
  img: string
  cell: Cell
  edges?: Partial<Record<Side, string>>
  tint?: string
  year?: string
  spots?: Spot[]
  layers?: Layer[]
  dim?: boolean
}

export interface PanelState {
  id: string
  cell: Cell
  layers: Layer[]
  /** 入画栈：栈顶 = 当前视野。空栈 = 看最上层整幅 */
  dive: View[]
  dim: boolean
  lit: boolean
  born?: boolean
}

export type Cond =
  | { kind: 'spot'; panel: string; spot: string }
  | { kind: 'dive'; panel: string; spot: string }
  | { kind: 'back'; panel: string }
  | { kind: 'peel'; panel: string }
  | { kind: 'connect'; a: string; aside: Side; b: string }
  | { kind: 'overlay'; a: string; b: string }
  | { kind: 'arrange'; order: string[]; cells: Cell[] }
  | { kind: 'auto' }

export interface Fx {
  spawn?: { def: PanelDef; cells?: Cell[] }
  swap?: { panel: string; img: string; undim?: boolean }
  setEdges?: { panel: string; edges: Partial<Record<Side, string>> }
  /** 传送门：这幅画变成另一个空间（入画栈压入新视野） */
  pushView?: { panel: string; view: View }
  /** 当前视野换个样子（灯亮了、帘拉开了） */
  swapView?: { panel: string; img?: string; tint?: string; spots?: Spot[] }
  popView?: { panel: string }
  glow?: string
  undim?: string
  sfx?: string
  music?: string
  /** 机关动画：齿轮咬合 / 火光迸亮 / 日出 */
  burst?: 'gear' | 'spark' | 'sun'
  burstPanel?: string
  /** 时间跳转：大字年份在画上闪过 */
  yearFlash?: string
  /** 他依次走过这几幅画 */
  walkThrough?: string[]
  /** 连画时他走过去 */
  walk?: boolean
  collect?: boolean
  done?: boolean
}

export interface Step { id: string; cond: Cond; after?: string[]; fx: Fx }

export interface ChapterDef {
  id: string
  no: string
  name: string
  poem: string
  where?: string
  ambient?: string
  /** 天气：雨 / 雪 / 岁月的尘 */
  weather?: 'rain' | 'snow' | 'dust'
  hero?: { panel: string; x: number; y: number }
  goal?: string
  panels: PanelDef[]
  steps: Step[]
}
