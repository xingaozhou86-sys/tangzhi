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
        { id: 'book', x: 24, y: 62, w: 26, h: 22 },
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
      fx: { glow: 'booth', sfx: '/story/sfx-chime.mp3' } },
    { id: 's-book', cond: { kind: 'spot', panel: 'booth', spot: 'book' }, after: ['end'],
      fx: { collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH2: ChapterDef = {
  id: 'ch2', no: '叁', name: '门与窗', poem: '门通街巷，窗通远方。',
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
  id: 'ch3', no: '伍', name: '年画', poem: '一年撕去一层，撕到一九七八。',
  ambient: '/story/amb-wind.mp3',
  panels: [
    {
      id: 'nianhua', img: '/story/a3.webp', cell: 0,
      layers: [
        { img: '/story/a3.webp', tint: 'sepia(0.75) brightness(0.82)', year: '一九六一' },
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
    { id: 'p3', cond: { kind: 'peel', panel: 'nianhua' }, after: ['p2'], fx: { sfx: '/story/sfx-tear.mp3' } },
    { id: 'c-gate', cond: { kind: 'connect', a: 'nianhua', aside: 'r', b: 'gate' }, after: ['p3'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-gate'],
      fx: { glow: 'gate', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH5: ChapterDef = {
  id: 'ch5', no: '玖', name: '天台', poem: '收音机响的时候，她还靠在他肩上。',
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
  id: 'ch6', no: '拾', name: '水果糖', poem: '最甜的那颗，他始终没舍得吃。',
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

// ------------------------------------------------------------
// 扩幕：学徒 / 雨夜 / 站台 / 婚礼
// ------------------------------------------------------------

export const CHX1: ChapterDef = {
  id: 'chx1', no: '贰', name: '学徒', poem: '师傅的手搭在他手上，铁就听话了。',
  ambient: '/sfx/factory.wav',
  panels: [
    {
      id: 'lathe', img: '/story/b2-lathe.webp', cell: 0,
      edges: { b: 'chang' },
      spots: [{ id: 'paper', x: 56, y: 58, w: 24, h: 22 }],
    },
  ],
  steps: [
    { id: 's-paper', cond: { kind: 'spot', panel: 'lathe', spot: 'paper' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'desk', img: '/story/b2-desk.webp', cell: 1, spots: [{ id: 'gear', x: 36, y: 32, w: 28, h: 28 }] },
        cells: [1, 3, 2] } } },
    { id: 's-overlay', cond: { kind: 'overlay', a: 'desk', b: 'lathe' }, after: ['s-paper'],
      fx: { glow: 'lathe', sfx: '/story/sfx-chime.mp3' } },
    { id: 's-part', cond: { kind: 'spot', panel: 'lathe', spot: 'paper' }, after: ['s-overlay'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'shop', img: '/act4/workshop.webp', cell: 2, edges: { t: 'chang' } },
        cells: [2, 3, 1] } } },
    { id: 'c-shop', cond: { kind: 'connect', a: 'lathe', aside: 'b', b: 'shop' }, after: ['s-part'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-shop'],
      fx: { glow: 'shop', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX2: ChapterDef = {
  id: 'chx2', no: '肆', name: '雨夜', poem: '一把伞，两个人，雨就小了。',
  ambient: '/sfx/rain.wav',
  panels: [
    {
      id: 'rain', img: '/story/b4-rain.webp', cell: 0,
      edges: { r: 'shu' },
      spots: [{ id: 'eave', x: 6, y: 18, w: 24, h: 42 }],
    },
  ],
  steps: [
    { id: 's-eave', cond: { kind: 'spot', panel: 'rain', spot: 'eave' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'book', img: '/story/b4-book.webp', cell: 3, edges: { l: 'shu', b: 'deng' }, spots: [{ id: 'lamp', x: 56, y: 8, w: 24, h: 22 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-book', cond: { kind: 'connect', a: 'rain', aside: 'r', b: 'book' }, after: ['s-eave'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-lamp', cond: { kind: 'spot', panel: 'book', spot: 'lamp' }, after: ['c-book'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'nightwin', img: '/story/a2-windows.webp', cell: 2, edges: { t: 'deng' } },
        cells: [2, 1, 3] } } },
    { id: 'c-win', cond: { kind: 'connect', a: 'book', aside: 'b', b: 'nightwin' }, after: ['s-lamp'],
      fx: { sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-win'],
      fx: { glow: 'nightwin', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX3: ChapterDef = {
  id: 'chx3', no: '陆', name: '站台', poem: '红围巾挥了三下，车就开了。',
  ambient: '/sfx/train.wav',
  panels: [
    {
      id: 'platform', img: '/story/b6-platform.webp', cell: 0,
      edges: { r: 'che' },
      spots: [{ id: 'whistle', x: 28, y: 56, w: 22, h: 28 }],
    },
  ],
  steps: [
    { id: 's-whistle', cond: { kind: 'spot', panel: 'platform', spot: 'whistle' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'train', img: '/story/fin-station.webp', cell: 3, edges: { l: 'che' }, spots: [{ id: 'window', x: 42, y: 26, w: 20, h: 28 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-train', cond: { kind: 'connect', a: 'platform', aside: 'r', b: 'train' }, after: ['s-whistle'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-window', cond: { kind: 'spot', panel: 'train', spot: 'window' }, after: ['c-train'],
      fx: { glow: 'train', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX4: ChapterDef = {
  id: 'chx4', no: '捌', name: '婚礼', poem: '两根红烛，就算成了家。',
  ambient: '/sfx/murmur.wav',
  panels: [
    {
      id: 'wedding', img: '/story/b8-wedding.webp', cell: 0,
      edges: { b: 'fang' },
      spots: [{ id: 'door', x: 26, y: 6, w: 30, h: 32 }],
    },
  ],
  steps: [
    { id: 's-door', cond: { kind: 'spot', panel: 'wedding', spot: 'door' },
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'newroom', img: '/story/b8-room.webp', cell: 3, edges: { t: 'fang' }, spots: [{ id: 'candle', x: 60, y: 26, w: 20, h: 26 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-fang', cond: { kind: 'connect', a: 'wedding', aside: 'b', b: 'newroom' }, after: ['s-door'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-candle', cond: { kind: 'spot', panel: 'newroom', spot: 'candle' }, after: ['c-fang'],
      fx: { glow: 'newroom', done: true, music: '/sfx/fire.wav' } },
  ],
}
