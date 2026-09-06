// contact sheet 入口：渲染所有画作变体
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement as h } from 'react'
import TileArt from '../src/game/TileArt'
import type { Tile } from '../src/game/model'

const cell = (t: Tile, extra: Record<string, unknown> = {}) =>
  `<div style="width:128px;height:128px;border:1.5px solid #191713;background:#f7f3ea">${renderToStaticMarkup(
    h(TileArt, { tile: t, litDirs: new Set<string>(), ...extra }),
  )}</div>`

const tiles: [string, Tile, Record<string, unknown>?][] = [
  ...[0, 1, 2, 3, 4, 5].map((art): [string, Tile] => [
    `art ${art}`,
    { id: `t${art}`, ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'blue' }], links: [['W', 'E']], art },
  ]),
  ['art 6 滤片', { id: 't6', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'orange' }], links: [['N', 'S']], art: 6, isFilter: true }],
  ['art 7 纹样', { id: 't7', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 7 }],
  ['art 8 遮片', { id: 't8', ports: [], links: [], art: 8, isCover: true }],
  ['art 8 窗口', { id: 't8w', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'red' }], links: [['N', 'E']], art: 8, isCover: true }],
  ['art 9 圆环', { id: 't9', ports: [{ dir: 'W', color: 'red' }], links: [], art: 9 }],
  ['art 10 缺口', { id: 't10', ports: [{ dir: 'W', color: 'red' }, { dir: 'E', color: 'red' }], links: [['W', 'E']], art: 10 }],
  ['art 2 金色+残端', { id: 't2g', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'yellow' }], links: [], hiddenLinks: [['N', 'E']], art: 2, gold: true }],
  ['art 2 显影后', { id: 't2r', ports: [{ dir: 'N', color: 'blue' }, { dir: 'E', color: 'yellow' }], links: [], hiddenLinks: [['N', 'E']], art: 2, gold: true }, { revealed: true }],
  ['双色双读', { id: 'du', ports: [{ dir: 'N', color: 'orange' }, { dir: 'S', color: 'purple' }], links: [['N', 'S']], art: 6, isFilter: true, dual: true }],
  ['转角+金色', { id: 'co', ports: [{ dir: 'W', color: 'red' }, { dir: 'S', color: 'red' }], links: [['W', 'S']], art: 3, gold: true }],
]

const cellsHtml = tiles
  .map(([label, t, extra]) => `<figure style="margin:0"><figcaption style="color:#e8e0cf;font:12px serif;letter-spacing:2px;margin-bottom:6px">${label}</figcaption>${cell(t, extra)}</figure>`)
  .join('')

export const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  svg { width: 100%; height: 100%; display: block; }
  body { margin: 0; }
</style></head><body style="background:#17140f;display:flex;flex-wrap:wrap;gap:16px;padding:24px;width:800px">${cellsHtml}</body></html>`
