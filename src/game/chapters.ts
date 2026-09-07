import type { ChapterDef } from '../world/types'

// ------------------------------------------------------------
// 六章谜题数据。每条缝的 key 就是两幅画之间的"门"。
// ------------------------------------------------------------

export const CH1: ChapterDef = {
  id: 'ch1', no: '壹', name: '报名', poem: '那一夜，他第一个写下名字。',
  ambient: '/story/amb-city.mp3',
  panels: [
    {
      id: 'booth', img: '/story/a1.webp', cell: 0,
      edges: { r: 'lib-a', b: 'lib-b' },
      spots: [
        { id: 'window', x: 28, y: 16, w: 26, h: 32 },
        { id: 'desk', x: 56, y: 56, w: 32, h: 26 },
      ],
    },
  ],
  steps: [
    { id: 's-win', cond: { kind: 'spot', panel: 'booth', spot: 'window' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: { def: { id: 'hall', img: '/story/a1-hall.webp', cell: 2, edges: { l: 'lib-a' } }, cells: [2, 3, 1] } } },
    { id: 's-desk', cond: { kind: 'spot', panel: 'booth', spot: 'desk' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: { def: { id: 'below', img: '/story/a1-below.webp', cell: 3, edges: { t: 'lib-b' } }, cells: [3, 2, 1] } } },
    { id: 'c-hall', cond: { kind: 'connect', a: 'booth', aside: 'r', b: 'hall' }, after: ['s-win'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'c-below', cond: { kind: 'connect', a: 'booth', aside: 'b', b: 'below' }, after: ['s-desk'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-hall', 'c-below'],
      fx: { glow: 'booth', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH2: ChapterDef = {
  id: 'ch2', no: '贰', name: '门与窗', poem: '门通街巷，窗通远方。',
  ambient: '/story/amb-city.mp3',
  panels: [
    {
      id: 'room', img: '/story/a2-room.webp', cell: 0,
      edges: { r: 'jie', b: 'yue' },
      spots: [
        { id: 'door', x: 68, y: 28, w: 18, h: 46 },
        { id: 'window', x: 22, y: 20, w: 26, h: 28 },
      ],
    },
  ],
  steps: [
    { id: 's-door', cond: { kind: 'spot', panel: 'room', spot: 'door' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: { def: { id: 'street', img: '/story/a2-street.webp', cell: 3, edges: { l: 'jie', b: 'fan' } }, cells: [3, 2, 1] } } },
    { id: 's-win', cond: { kind: 'spot', panel: 'room', spot: 'window' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'windows', img: '/story/a2-windows.webp', cell: 1, edges: { t: 'yue' }, spots: [{ id: 'lantern', x: 56, y: 56, w: 20, h: 20 }] },
        cells: [1, 2, 3] } } },
    { id: 's-lantern', cond: { kind: 'spot', panel: 'windows', spot: 'lantern' }, after: ['s-win'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: { def: { id: 'rest', img: '/story/a2-restaurant.webp', cell: 2, edges: { t: 'fan' } }, cells: [2, 3, 1] } } },
    { id: 'c-street', cond: { kind: 'connect', a: 'room', aside: 'r', b: 'street' }, after: ['s-door'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'c-moon', cond: { kind: 'connect', a: 'room', aside: 'b', b: 'windows' }, after: ['s-win'],
      fx: { sfx: '/story/sfx-chime.mp3' } },
    { id: 'c-rest', cond: { kind: 'connect', a: 'street', aside: 'b', b: 'rest' }, after: ['s-lantern'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-street', 'c-moon', 'c-rest'],
      fx: { glow: 'rest', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH3: ChapterDef = {
  id: 'ch3', no: '叁', name: '年画', poem: '一年撕去一层，撕到一九七八。',
  ambient: '/story/amb-wind.mp3',
  panels: [
    {
      id: 'nianhua', img: '/story/a3.webp', cell: 0,
      layers: [
        { img: '/story/a3.webp', tint: 'sepia(0.55) brightness(0.9)', year: '一九六六' },
        { img: '/story/a3.webp', tint: 'sepia(0.3) brightness(0.96)', year: '一九七二' },
        { img: '/story/a3-1978.webp', edges: { r: 'bang' }, year: '一九七八' },
      ],
    },
    { id: 'gate', img: '/story/a3-gate.webp', cell: 1, edges: { l: 'bang' } },
  ],
  steps: [
    { id: 'p1', cond: { kind: 'peel', panel: 'nianhua' }, fx: { sfx: '/story/sfx-tear.mp3' } },
    { id: 'p2', cond: { kind: 'peel', panel: 'nianhua' }, after: ['p1'], fx: { sfx: '/story/sfx-tear.mp3' } },
    { id: 'c-gate', cond: { kind: 'connect', a: 'nianhua', aside: 'r', b: 'gate' }, after: ['p2'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-gate'],
      fx: { glow: 'gate', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH5: ChapterDef = {
  id: 'ch5', no: '伍', name: '天台', poem: '收音机响的时候，她还靠在他肩上。',
  ambient: '/story/amb-hum.mp3',
  panels: [
    {
      id: 'roof', img: '/story/a5.webp', cell: 0,
      edges: { r: 'lu' },
      spots: [
        { id: 'radio', x: 56, y: 58, w: 16, h: 16 },
        { id: 'wire', x: 76, y: 12, w: 22, h: 16 },
      ],
    },
  ],
  steps: [
    { id: 's-radio', cond: { kind: 'spot', panel: 'roof', spot: 'radio' },
      fx: { music: '/story/boombox.mp3', keepZoom: true, swap: { panel: 'roof', img: '/story/a5-roof.webp' } } },
    { id: 's-wire', cond: { kind: 'spot', panel: 'roof', spot: 'wire' }, after: ['s-radio'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: { def: { id: 'post', img: '/story/a5-post1978.webp', cell: 3, edges: { l: 'lu' } }, cells: [3, 2, 1] } } },
    { id: 'c-post', cond: { kind: 'connect', a: 'roof', aside: 'r', b: 'post' }, after: ['s-wire'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-mem', cond: { kind: 'auto' }, after: ['c-post'],
      fx: { sfx: '/story/sfx-chime.mp3', spawn: { def: { id: 'bikes', img: '/story/a5-bikes.webp', cell: 2 }, cells: [2, 1, 3] } } },
    { id: 'end', cond: { kind: 'auto' }, after: ['s-mem'],
      fx: { glow: 'bikes', collect: true, done: true } },
  ],
}

export const CH6: ChapterDef = {
  id: 'ch6', no: '陆', name: '水果糖', poem: '最甜的那颗，他始终没舍得吃。',
  ambient: '/story/cicadas.mp3',
  panels: [
    {
      id: 'store', img: '/story/a6-store.webp', cell: 0,
      edges: { r: 'tang' },
      spots: [
        { id: 'jar', x: 34, y: 40, w: 20, h: 26 },
        { id: 'hand', x: 50, y: 34, w: 14, h: 16 },
        { id: 'kid', x: 66, y: 38, w: 16, h: 24 },
      ],
    },
    { id: 'village', img: '/story/a6.webp', cell: 1, dim: true },
  ],
  steps: [
    { id: 's-jar', cond: { kind: 'spot', panel: 'store', spot: 'jar' }, fx: { sfx: '/story/sfx-chime.mp3', keepZoom: true } },
    { id: 's-hand', cond: { kind: 'spot', panel: 'store', spot: 'hand' }, after: ['s-jar'], fx: { sfx: '/story/sfx-chime.mp3', keepZoom: true } },
    { id: 's-give', cond: { kind: 'spot', panel: 'store', spot: 'kid' }, after: ['s-hand'],
      fx: { sfx: '/story/sfx-chime.mp3', swap: { panel: 'village', img: '/story/a6.webp', undim: true }, setEdges: { panel: 'village', edges: { l: 'tang' } } } },
    { id: 'c-village', cond: { kind: 'connect', a: 'store', aside: 'r', b: 'village' }, after: ['s-give'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-village'],
      fx: { glow: 'village', collect: true, done: true } },
  ],
}
