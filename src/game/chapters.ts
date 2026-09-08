import type { ChapterDef } from '../world/types'

// ------------------------------------------------------------
// 《糖纸》v3 · 十一章谜题数据
// 每一章是一条"钻进去 → 发现另一个空间 → 铺路让他走过去"的链。
// 圆圈常驻画面：实圈 = 点它；双层虚线圈 = 钻进去。
// ------------------------------------------------------------

export const CH1: ChapterDef = {
  id: 'ch1', no: '壹', name: '报名', poem: '那一夜，他第一个写下名字。', where: '一九五七 · 夜校报名处',
  ambient: '/story/amb-city.mp3', weather: 'snow',
  hero: { panel: 'booth', x: 66, y: 68 },
  goal: 'below',
  panels: [
    {
      id: 'booth', img: '/story/a1.webp', cell: 0,
      edges: { b: 'lib-b' },
      spots: [
        { id: 'window', x: 4, y: 4, w: 52, h: 56 },
        { id: 'book', x: 6, y: 70, w: 36, h: 26 },
      ],
    },
  ],
  steps: [
    { id: 'd-win', cond: { kind: 'dive', panel: 'booth', spot: 'window' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'booth', view: {
        img: '/story/a1-hall.webp',
        spots: [{ id: 'notice', x: 36, y: 28, w: 28, h: 28 }] } } } },
    { id: 's-notice', cond: { kind: 'spot', panel: 'booth', spot: 'notice' }, after: ['d-win'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'below', img: '/story/a1-below.webp', cell: 2, edges: { t: 'lib-b' } },
        cells: [2, 3, 1] } } },
    { id: 'c-below', cond: { kind: 'connect', a: 'booth', aside: 'b', b: 'below' }, after: ['s-notice'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-book', cond: { kind: 'spot', panel: 'booth', spot: 'book' }, after: ['c-below'],
      fx: { collect: true, done: true, glow: 'booth', sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX1: ChapterDef = {
  id: 'chx1', no: '贰', name: '学徒', poem: '师傅的手搭在他手上，铁就听话了。', where: '一九五八 · 机修车间',
  ambient: '/sfx/factory.wav',
  hero: { panel: 'lathe', x: 28, y: 74 },
  goal: 'shop',
  panels: [
    {
      id: 'lathe', img: '/story/b2-lathe.webp', cell: 0,
      edges: { b: 'chang' },
      spots: [{ id: 'paper', x: 56, y: 58, w: 24, h: 22 }],
    },
  ],
  steps: [
    { id: 'd-paper', cond: { kind: 'dive', panel: 'lathe', spot: 'paper' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'lathe', view: {
        img: '/story/b2-desk.webp',
        spots: [{ id: 'gear', x: 36, y: 32, w: 28, h: 28 }] } } } },
    { id: 's-gear', cond: { kind: 'spot', panel: 'lathe', spot: 'gear' }, after: ['d-paper'],
      fx: { burst: 'gear', sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'shop', img: '/act4/workshop.webp', cell: 2, edges: { t: 'chang' },
          spots: [{ id: 'master', x: 58, y: 28, w: 24, h: 32 }] },
        cells: [2, 3, 1] } } },
    { id: 'c-shop', cond: { kind: 'connect', a: 'lathe', aside: 'b', b: 'shop' }, after: ['s-gear'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-master', cond: { kind: 'spot', panel: 'shop', spot: 'master' }, after: ['c-shop'],
      fx: { glow: 'shop', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH2: ChapterDef = {
  id: 'ch2', no: '叁', name: '门与窗', poem: '门通街巷，窗通远方。', where: '一九六〇 · 职工宿舍',
  ambient: '/story/amb-city.mp3',
  hero: { panel: 'room', x: 46, y: 72 },
  goal: 'windows',
  panels: [
    {
      id: 'room', img: '/story/a2-room.webp', cell: 0,
      edges: { b: 'yue' },
      spots: [{ id: 'door', x: 68, y: 28, w: 18, h: 46 }],
    },
  ],
  steps: [
    { id: 'd-door', cond: { kind: 'dive', panel: 'room', spot: 'door' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'room', view: {
        img: '/story/a2-street.webp',
        spots: [{ id: 'alley', x: 64, y: 18, w: 24, h: 44 }] } } } },
    { id: 's-alley', cond: { kind: 'spot', panel: 'room', spot: 'alley' }, after: ['d-door'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'windows', img: '/story/a2-windows.webp', cell: 1, edges: { t: 'yue' },
          spots: [{ id: 'lantern', x: 52, y: 50, w: 24, h: 24 }] },
        cells: [1, 2, 3] } } },
    { id: 'c-win', cond: { kind: 'connect', a: 'room', aside: 'b', b: 'windows' }, after: ['s-alley'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-lantern', cond: { kind: 'dive', panel: 'windows', spot: 'lantern' }, after: ['c-win'],
      fx: { burst: 'spark', sfx: '/story/sfx-peel.mp3', pushView: { panel: 'windows', view: {
        img: '/story/a2-restaurant.webp',
        spots: [{ id: 'table', x: 38, y: 50, w: 28, h: 26 }] } } } },
    { id: 's-table', cond: { kind: 'spot', panel: 'windows', spot: 'table' }, after: ['d-lantern'],
      fx: { glow: 'windows', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX2: ChapterDef = {
  id: 'chx2', no: '肆', name: '雨夜', poem: '一把伞，两个人，雨就小了。', where: '一九六一 · 书店檐下',
  ambient: '/sfx/rain.wav', weather: 'rain',
  hero: { panel: 'rain', x: 50, y: 78 },
  goal: 'win',
  panels: [
    {
      id: 'rain', img: '/story/b4-rain.webp', cell: 0,
      spots: [{ id: 'eave', x: 6, y: 18, w: 24, h: 42 }],
    },
  ],
  steps: [
    { id: 'd-eave', cond: { kind: 'dive', panel: 'rain', spot: 'eave' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'rain', view: {
        img: '/story/b4-book.webp',
        spots: [{ id: 'lamp', x: 54, y: 6, w: 26, h: 24 }] } } } },
    { id: 's-lamp', cond: { kind: 'spot', panel: 'rain', spot: 'lamp' }, after: ['d-eave'],
      fx: { burst: 'spark', sfx: '/story/sfx-chime.mp3',
        swapView: { panel: 'rain', tint: 'brightness(1.2) sepia(0.25)' },
        setEdges: { panel: 'rain', edges: { r: 'deng' } },
        spawn: { def: { id: 'win', img: '/story/a2-windows.webp', cell: 2, edges: { l: 'deng' },
          tint: 'brightness(0.8)',
          spots: [{ id: 'her', x: 46, y: 38, w: 20, h: 28 }] },
          cells: [2, 1, 3] } } },
    { id: 'c-win', cond: { kind: 'connect', a: 'rain', aside: 'r', b: 'win' }, after: ['s-lamp'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-her', cond: { kind: 'spot', panel: 'win', spot: 'her' }, after: ['c-win'],
      fx: { glow: 'win', undim: 'win', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH3: ChapterDef = {
  id: 'ch3', no: '伍', name: '年画', poem: '一年撕去一层，撕到一九七八。', where: '一九六一至七八 · 厂门口',
  ambient: '/story/amb-wind.mp3', weather: 'dust',
  hero: { panel: 'nianhua', x: 62, y: 78 },
  goal: 'gate',
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
    { id: 'gate', img: '/story/a3-gate.webp', cell: 1, edges: { l: 'bang' },
      spots: [{ id: 'plaque', x: 36, y: 12, w: 28, h: 20 }] },
  ],
  steps: [
    { id: 'p1', cond: { kind: 'peel', panel: 'nianhua' }, fx: { yearFlash: '一九六六', sfx: '/story/sfx-tear.mp3' } },
    { id: 'p2', cond: { kind: 'peel', panel: 'nianhua' }, after: ['p1'], fx: { yearFlash: '一九七二', sfx: '/story/sfx-tear.mp3' } },
    { id: 'p3', cond: { kind: 'peel', panel: 'nianhua' }, after: ['p2'], fx: { yearFlash: '一九七八', sfx: '/story/sfx-tear.mp3' } },
    { id: 'c-gate', cond: { kind: 'connect', a: 'nianhua', aside: 'r', b: 'gate' }, after: ['p3'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-plaque', cond: { kind: 'spot', panel: 'gate', spot: 'plaque' }, after: ['c-gate'],
      fx: { glow: 'gate', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX3: ChapterDef = {
  id: 'chx3', no: '陆', name: '站台', poem: '红围巾挥了三下，车就开了。', where: '一九七八 · 火车站台',
  ambient: '/sfx/train.wav',
  hero: { panel: 'platform', x: 36, y: 74 },
  goal: 'dawn',
  panels: [
    {
      id: 'platform', img: '/story/b6-platform.webp', cell: 0,
      edges: { r: 'liang' },
      spots: [{ id: 'whistle', x: 28, y: 56, w: 22, h: 28 }],
    },
  ],
  steps: [
    { id: 'd-whistle', cond: { kind: 'dive', panel: 'platform', spot: 'whistle' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'platform', view: {
        img: '/story/fin-station.webp',
        spots: [{ id: 'scarf', x: 54, y: 32, w: 22, h: 26 }] } } } },
    { id: 's-scarf', cond: { kind: 'spot', panel: 'platform', spot: 'scarf' }, after: ['d-whistle'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'dawn', img: '/story/fin.webp', cell: 3, edges: { l: 'liang' },
          spots: [{ id: 'sun', x: 42, y: 22, w: 22, h: 22 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-dawn', cond: { kind: 'connect', a: 'platform', aside: 'r', b: 'dawn' }, after: ['s-scarf'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-sun', cond: { kind: 'spot', panel: 'dawn', spot: 'sun' }, after: ['c-dawn'],
      fx: { burst: 'sun', glow: 'dawn', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX4: ChapterDef = {
  id: 'chx4', no: '捌', name: '婚礼', poem: '两根红烛，就算成了家。', where: '一九八〇 · 新房',
  ambient: '/sfx/murmur.wav',
  hero: { panel: 'wedding', x: 50, y: 80 },
  panels: [
    {
      id: 'wedding', img: '/story/b8-wedding.webp', cell: 0,
      spots: [{ id: 'door', x: 26, y: 6, w: 30, h: 32 }],
    },
  ],
  steps: [
    { id: 'd-door', cond: { kind: 'dive', panel: 'wedding', spot: 'door' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'wedding', view: {
        img: '/story/b8-room.webp',
        spots: [
          { id: 'candle', x: 58, y: 24, w: 22, h: 28 },
          { id: 'xi', x: 42, y: 16, w: 16, h: 16 },
        ] } } } },
    { id: 's-candle', cond: { kind: 'spot', panel: 'wedding', spot: 'candle' }, after: ['d-door'],
      fx: { burst: 'spark', music: '/sfx/fire.wav', swapView: { panel: 'wedding', tint: 'brightness(1.22) sepia(0.3) saturate(1.2)' },
        sfx: '/story/sfx-chime.mp3' } },
    { id: 's-xi', cond: { kind: 'spot', panel: 'wedding', spot: 'xi' }, after: ['s-candle'],
      fx: { glow: 'wedding', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH5: ChapterDef = {
  id: 'ch5', no: '玖', name: '天台', poem: '收音机响的时候，她还靠在他肩上。', where: '一九八三 · 楼顶天台',
  ambient: '/story/amb-hum.mp3',
  hero: { panel: 'roof', x: 40, y: 78 },
  goal: 'bikes',
  panels: [
    {
      id: 'roof', img: '/story/a5.webp', cell: 0,
      edges: { r: 'lu' },
      spots: [
        { id: 'radio', x: 54, y: 56, w: 18, h: 18 },
        { id: 'wire', x: 74, y: 10, w: 24, h: 18 },
      ],
    },
  ],
  steps: [
    { id: 's-radio', cond: { kind: 'spot', panel: 'roof', spot: 'radio' },
      fx: { burst: 'spark', music: '/story/boombox.mp3', swap: { panel: 'roof', img: '/story/a5-roof.webp' },
        sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-wire', cond: { kind: 'dive', panel: 'roof', spot: 'wire' }, after: ['s-radio'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'roof', view: {
        img: '/story/a5-post1978.webp',
        spots: [{ id: 'horn', x: 38, y: 34, w: 26, h: 28 }] } } } },
    { id: 's-horn', cond: { kind: 'spot', panel: 'roof', spot: 'horn' }, after: ['d-wire'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'bikes', img: '/story/a5-bikes.webp', cell: 3, edges: { l: 'lu' },
          spots: [{ id: 'bell', x: 48, y: 56, w: 22, h: 22 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-bikes', cond: { kind: 'connect', a: 'roof', aside: 'r', b: 'bikes' }, after: ['s-horn'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-bell', cond: { kind: 'spot', panel: 'bikes', spot: 'bell' }, after: ['c-bikes'],
      fx: { glow: 'bikes', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH6: ChapterDef = {
  id: 'ch6', no: '拾', name: '水果糖', poem: '最甜的那颗，他始终没舍得吃。', where: '一九八六 · 供销社',
  ambient: '/story/cicadas.mp3',
  hero: { panel: 'store', x: 24, y: 72 },
  goal: 'village',
  panels: [
    {
      id: 'store', img: '/story/a6-store.webp', cell: 0,
      edges: { r: 'tang' },
      spots: [
        { id: 'jar', x: 14, y: 24, w: 40, h: 66 },
        { id: 'hand', x: 30, y: 10, w: 22, h: 24 },
        { id: 'kid', x: 38, y: 54, w: 24, h: 36 },
      ],
    },
    { id: 'village', img: '/story/a6.webp', cell: 1, dim: true },
  ],
  steps: [
    { id: 'd-jar', cond: { kind: 'dive', panel: 'store', spot: 'jar' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'store', view: {
        img: '/story/a6-store.webp',
        crop: { x: 30, y: 36, w: 26, h: 30 },
        spots: [{ id: 'candy', x: 36, y: 46, w: 18, h: 18 }] } } } },
    { id: 's-candy', cond: { kind: 'spot', panel: 'store', spot: 'candy' }, after: ['d-jar'],
      fx: { burst: 'spark', sfx: '/story/sfx-chime.mp3', popView: { panel: 'store' } } },
    { id: 's-hand', cond: { kind: 'spot', panel: 'store', spot: 'hand' }, after: ['s-candy'],
      fx: { sfx: '/story/sfx-chime.mp3' } },
    { id: 's-give', cond: { kind: 'spot', panel: 'store', spot: 'kid' }, after: ['s-hand'],
      fx: { sfx: '/story/sfx-chime.mp3',
        swap: { panel: 'village', img: '/story/a6.webp', undim: true },
        setEdges: { panel: 'village', edges: { l: 'tang' } } } },
    { id: 'c-village', cond: { kind: 'connect', a: 'store', aside: 'r', b: 'village' }, after: ['s-give'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'end', cond: { kind: 'auto' }, after: ['c-village'],
      fx: { glow: 'village', collect: true, done: true } },
  ],
}

// ------------------------------------------------------------
// 拾壹 · 灯火：多年后，他揣着糖纸在城里找那一扇窗
// ------------------------------------------------------------
export const CH7: ChapterDef = {
  id: 'ch7', no: '拾壹', name: '灯火', poem: '他数了一千扇窗，终于有一扇为她亮着。', where: '二〇〇八 · 旧城夜色',
  ambient: '/story/amb-city.mp3',
  hero: { panel: 'city', x: 50, y: 84 },
  panels: [
    {
      id: 'city', img: '/story/a2-windows.webp', cell: 0,
      tint: 'brightness(0.72) saturate(0.75) hue-rotate(185deg)',
      spots: [
        { id: 'w1', x: 14, y: 16, w: 22, h: 24 },
        { id: 'w2', x: 62, y: 18, w: 22, h: 24 },
        { id: 'w3', x: 40, y: 54, w: 22, h: 26 },
      ],
    },
  ],
  steps: [
    { id: 'd-w1', cond: { kind: 'dive', panel: 'city', spot: 'w1' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'city', view: {
        img: '/story/b8-room.webp', tint: 'brightness(0.55) saturate(0.5)',
        spots: [{ id: 'empty', x: 42, y: 38, w: 24, h: 26 }] } } } },
    { id: 's-empty', cond: { kind: 'spot', panel: 'city', spot: 'empty' }, after: ['d-w1'],
      fx: { sfx: '/story/sfx-tear.mp3', popView: { panel: 'city' } } },
    { id: 'd-w2', cond: { kind: 'dive', panel: 'city', spot: 'w2' }, after: ['s-empty'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'city', view: {
        img: '/story/a6-store.webp', tint: 'brightness(0.5) saturate(0.45)',
        spots: [{ id: 'dark', x: 38, y: 42, w: 26, h: 24 }] } } } },
    { id: 's-dark', cond: { kind: 'spot', panel: 'city', spot: 'dark' }, after: ['d-w2'],
      fx: { sfx: '/story/sfx-tear.mp3', popView: { panel: 'city' } } },
    { id: 's-glow', cond: { kind: 'auto' }, after: ['s-dark'],
      fx: { burst: 'spark', swapView: { panel: 'city', tint: 'brightness(1.02) saturate(0.95)' },
        sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-w3', cond: { kind: 'dive', panel: 'city', spot: 'w3' }, after: ['s-glow'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'city', view: {
        img: '/story/fin-station.webp', tint: 'brightness(1.08)',
        spots: [{ id: 'figure', x: 52, y: 38, w: 20, h: 28 }] } } } },
    { id: 's-figure', cond: { kind: 'spot', panel: 'city', spot: 'figure' }, after: ['d-w3'],
      fx: { glow: 'city', done: true, music: '/story/sfx-chime.mp3', sfx: '/story/sfx-chime.mp3' } },
  ],
}
