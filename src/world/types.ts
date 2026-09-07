// ------------------------------------------------------------
// 《情况属实》· 世界引擎类型
// 语法只有四条：挪画（拖到空框）、揭画（拖开上层）、
// 入画（点画里的细节）、连画（两幅画的缝对上，人就走过去）
// ------------------------------------------------------------
export type Cell = 0 | 1 | 2 | 3
export type Side = 'l' | 'r' | 't' | 'b'

export interface Layer {
  img: string
  edges?: Partial<Record<Side, string>>
  tint?: string
  year?: string
}

export interface Spot { id: string; x: number; y: number; w: number; h: number }

export interface PanelDef {
  id: string
  img: string
  cell: Cell
  edges?: Partial<Record<Side, string>>
  layers?: Layer[]
  spots?: Spot[]
  dim?: boolean
}

export interface PanelState {
  id: string
  cell: Cell
  layers: Layer[]
  dim: boolean
  lit: boolean
  born?: boolean
}

export type Cond =
  | { kind: 'spot'; panel: string; spot: string }
  | { kind: 'peel'; panel: string }
  | { kind: 'connect'; a: string; aside: Side; b: string }
  | { kind: 'overlay'; a: string; b: string }
  | { kind: 'auto' }

export interface Fx {
  spawn?: { def: PanelDef; cells?: Cell[] }
  swap?: { panel: string; img: string; undim?: boolean }
  setEdges?: { panel: string; edges: Partial<Record<Side, string>> }
  glow?: string
  sfx?: string
  music?: string
  walk?: boolean
  walkPath?: string[]
  keepZoom?: boolean
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
  hero?: { panel: string; x: number; y: number }
  goal?: string
  panels: PanelDef[]
  steps: Step[]
}
