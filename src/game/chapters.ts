import type { ChapterDef } from '../world/types'

// ------------------------------------------------------------
// 《糖纸》v5 · 十一章谜题数据
// 核心玩法（与画中世界同源）：
//   钻进小物件 —— 一盏灯、一扇窗、一张图纸的里面，是另一整个世界
//   取出世界 —— 把钻进去的世界拖到空框，它就立成墙上独立的一幅画
//   连画 / 排序 / 叠画 —— 铺路让他走过去
// 没有任何常驻提示。画面自己说话；发呆太久，才有暗示。
// ------------------------------------------------------------

export const CH1: ChapterDef = {
  id: 'ch1', no: '壹', name: '报名', poem: '窗子里还有一间屋。把它取出来。', where: '一九五七 · 夜校报名处',
  ambient: '/story/amb-city.mp3', weather: 'snow',
  hero: { panel: 'booth', x: 66, y: 68 },
  goal: 'below',
  panels: [
    {
      id: 'booth', img: '/story/a1.webp', cell: 0,
      spots: [
        { id: 'window', x: 4, y: 4, w: 52, h: 56 },
        { id: 'book', x: 6, y: 70, w: 36, h: 26 },
      ],
    },
  ],
  steps: [
    { id: 'd-win', cond: { kind: 'dive', panel: 'booth', spot: 'window' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'booth', extractId: 'hall', view: {
        img: '/story/a1-hall.webp',
        edges: { b: 'lib-b' },
        spots: [{ id: 'notice', x: 36, y: 28, w: 28, h: 28 }] } } } },
    { id: 's-notice', cond: { kind: 'spot', panel: 'hall', spot: 'notice' }, after: ['d-win'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'below', img: '/story/a1-below.webp', cell: 2, edges: { t: 'lib-b' } },
        cells: [2, 3, 1] } } },
    { id: 'c-below', cond: { kind: 'connect', a: 'hall', aside: 'b', b: 'below' }, after: ['s-notice'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-book', cond: { kind: 'spot', panel: 'booth', spot: 'book' }, after: ['c-below'],
      fx: { collect: true, done: true, glow: 'booth', sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX1: ChapterDef = {
  id: 'chx1', no: '贰', name: '学徒', poem: '图纸里藏着整个车间。取出来，装上。', where: '一九五八 · 机修车间',
  ambient: '/sfx/factory.wav',
  hero: { panel: 'lathe', x: 28, y: 74 },
  goal: 'shop',
  panels: [
    {
      id: 'lathe', img: '/story/b2-lathe.webp', cell: 0,
      spots: [{ id: 'paper', x: 50, y: 52, w: 36, h: 34 }],
    },
  ],
  steps: [
    { id: 'd-paper', cond: { kind: 'dive', panel: 'lathe', spot: 'paper' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'lathe', extractId: 'desk', view: {
        img: '/story/b2-desk.webp',
        edges: { b: 'chang' },
        spots: [{ id: 'gear', x: 36, y: 32, w: 28, h: 28 }] } } } },
    { id: 's-gear', cond: { kind: 'spot', panel: 'desk', spot: 'gear' }, after: ['d-paper'],
      fx: { burst: 'gear', burstPanel: 'desk', sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'shop', img: '/act4/workshop.webp', cell: 2, edges: { t: 'chang' },
          spots: [{ id: 'master', x: 58, y: 28, w: 24, h: 32 }] },
        cells: [2, 3, 1] } } },
    { id: 'c-shop', cond: { kind: 'connect', a: 'desk', aside: 'b', b: 'shop' }, after: ['s-gear'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-master', cond: { kind: 'spot', panel: 'shop', spot: 'master' }, after: ['c-shop'],
      fx: { glow: 'shop', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH2: ChapterDef = {
  id: 'ch2', no: '叁', name: '门与窗', poem: '门后是街，街尽头是窗，窗里是灯火。', where: '一九六〇 · 职工宿舍',
  ambient: '/story/amb-city.mp3',
  hero: { panel: 'room', x: 46, y: 72 },
  goal: 'windows',
  panels: [
    {
      id: 'room', img: '/story/a2-room.webp', cell: 0,
      spots: [{ id: 'door', x: 60, y: 20, w: 28, h: 60 }],
    },
  ],
  steps: [
    { id: 'd-door', cond: { kind: 'dive', panel: 'room', spot: 'door' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'room', extractId: 'street', view: {
        img: '/story/a2-street.webp',
        edges: { b: 'yue' },
        spots: [{ id: 'alley', x: 60, y: 14, w: 30, h: 50 }] } } } },
    { id: 's-alley', cond: { kind: 'spot', panel: 'street', spot: 'alley' }, after: ['d-door'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'windows', img: '/story/a2-windows.webp', cell: 2, edges: { t: 'yue' },
          spots: [{ id: 'lantern', x: 42, y: 40, w: 30, h: 34 }] },
        cells: [2, 1, 3] } } },
    { id: 'c-win', cond: { kind: 'connect', a: 'street', aside: 'b', b: 'windows' }, after: ['s-alley'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-lantern', cond: { kind: 'dive', panel: 'windows', spot: 'lantern' }, after: ['c-win'],
      fx: { burst: 'spark', burstPanel: 'windows', sfx: '/story/sfx-peel.mp3',
        pushView: { panel: 'windows', extractId: 'rest', view: {
          img: '/story/a2-restaurant.webp',
          spots: [{ id: 'table', x: 34, y: 46, w: 32, h: 30 }] } } } },
    { id: 's-table', cond: { kind: 'spot', panel: 'rest', spot: 'table' }, after: ['d-lantern'],
      fx: { glow: 'rest', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX2: ChapterDef = {
  id: 'chx2', no: '肆', name: '雨夜', poem: '檐下有一家书店。把灯点起来。', where: '一九六一 · 书店檐下',
  ambient: '/sfx/rain.wav', weather: 'rain',
  hero: { panel: 'rain', x: 50, y: 78 },
  goal: 'win',
  panels: [
    {
      id: 'rain', img: '/story/b4-rain.webp', cell: 0,
      spots: [{ id: 'eave', x: 2, y: 14, w: 32, h: 50 }],
    },
  ],
  steps: [
    { id: 'd-eave', cond: { kind: 'dive', panel: 'rain', spot: 'eave' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'rain', extractId: 'book', view: {
        img: '/story/b4-book.webp',
        edges: { r: 'deng' },
        spots: [{ id: 'lamp', x: 50, y: 2, w: 32, h: 30 }] } } } },
    { id: 's-lamp', cond: { kind: 'spot', panel: 'book', spot: 'lamp' }, after: ['d-eave'],
      fx: { burst: 'spark', burstPanel: 'book', sfx: '/story/sfx-chime.mp3',
        swapView: { panel: 'book', tint: 'brightness(1.2) sepia(0.25)' },
        spawn: { def: { id: 'win', img: '/story/a2-windows.webp', cell: 2, edges: { l: 'deng' },
          tint: 'brightness(0.8)',
          spots: [{ id: 'her', x: 44, y: 36, w: 24, h: 32 }] },
          cells: [2, 1, 3] } } },
    { id: 'c-win', cond: { kind: 'connect', a: 'book', aside: 'r', b: 'win' }, after: ['s-lamp'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-her', cond: { kind: 'spot', panel: 'win', spot: 'her' }, after: ['c-win'],
      fx: { glow: 'win', undim: 'win', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH3: ChapterDef = {
  id: 'ch3', no: '伍', name: '流年', poem: '四面墙，四个年头。路对上了，人才走得过去。', where: '一九六一至七八 · 厂门口',
  ambient: '/story/amb-wind.mp3', weather: 'dust',
  hero: { panel: 'y1961', x: 50, y: 78 },
  goal: 'y1978',
  panels: [
    { id: 'y1972', img: '/story/y1972.webp', cell: 0 },
    { id: 'y1966', img: '/story/y1966.webp', cell: 1 },
    { id: 'y1978', img: '/story/y1978.webp', cell: 3,
      spots: [{ id: 'gate', x: 60, y: 34, w: 34, h: 48 }] },
    { id: 'y1961', img: '/story/y1961.webp', cell: 2 },
  ],
  steps: [
    { id: 's-order', cond: { kind: 'arrange', order: ['y1961', 'y1966', 'y1972', 'y1978'], cells: [0, 1, 2, 3] },
      fx: { walkThrough: ['y1961', 'y1966', 'y1972', 'y1978'], burst: 'sun', burstPanel: 'y1978',
        yearFlash: '一九七八', sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-gate', cond: { kind: 'dive', panel: 'y1978', spot: 'gate' }, after: ['s-order'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'y1978', view: {
        img: '/story/a3-gate.webp',
        spots: [{ id: 'plaque', x: 36, y: 12, w: 28, h: 20 }] } } } },
    { id: 's-plaque', cond: { kind: 'spot', panel: 'y1978', spot: 'plaque' }, after: ['d-gate'],
      fx: { glow: 'y1978', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX3: ChapterDef = {
  id: 'chx3', no: '陆', name: '站台', poem: '汽笛里有整条站台。取出来，让她上车。', where: '一九七八 · 火车站台',
  ambient: '/sfx/train.wav',
  hero: { panel: 'platform', x: 36, y: 74 },
  goal: 'dawn',
  panels: [
    {
      id: 'platform', img: '/story/b6-platform.webp', cell: 0,
      spots: [{ id: 'whistle', x: 22, y: 50, w: 30, h: 36 }],
    },
  ],
  steps: [
    { id: 'd-whistle', cond: { kind: 'dive', panel: 'platform', spot: 'whistle' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'platform', extractId: 'station', view: {
        img: '/story/fin-station.webp',
        edges: { r: 'liang' },
        spots: [{ id: 'scarf', x: 50, y: 28, w: 28, h: 32 }] } } } },
    { id: 's-scarf', cond: { kind: 'spot', panel: 'station', spot: 'scarf' }, after: ['d-whistle'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'dawn', img: '/story/fin.webp', cell: 3, edges: { l: 'liang' },
          spots: [{ id: 'sun', x: 38, y: 16, w: 26, h: 28 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-dawn', cond: { kind: 'connect', a: 'station', aside: 'r', b: 'dawn' }, after: ['s-scarf'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-sun', cond: { kind: 'spot', panel: 'dawn', spot: 'sun' }, after: ['c-dawn'],
      fx: { burst: 'sun', glow: 'dawn', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX4: ChapterDef = {
  id: 'chx4', no: '捌', name: '婚礼', poem: '门后面是他们的新房。取出来，点烛。', where: '一九八〇 · 新房',
  ambient: '/sfx/murmur.wav',
  hero: { panel: 'wedding', x: 50, y: 80 },
  panels: [
    {
      id: 'wedding', img: '/story/b8-wedding.webp', cell: 0,
      spots: [{ id: 'door', x: 20, y: 2, w: 38, h: 40 }],
    },
  ],
  steps: [
    { id: 'd-door', cond: { kind: 'dive', panel: 'wedding', spot: 'door' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'wedding', extractId: 'newroom', view: {
        img: '/story/b8-room.webp',
        spots: [
          { id: 'candle', x: 54, y: 20, w: 28, h: 34 },
          { id: 'xi', x: 38, y: 12, w: 22, h: 22 },
        ] } } } },
    { id: 's-candle', cond: { kind: 'spot', panel: 'newroom', spot: 'candle' }, after: ['d-door'],
      fx: { burst: 'spark', burstPanel: 'newroom', music: '/sfx/fire.wav',
        swapView: { panel: 'newroom', tint: 'brightness(1.22) sepia(0.3) saturate(1.2)' },
        sfx: '/story/sfx-chime.mp3' } },
    { id: 's-xi', cond: { kind: 'spot', panel: 'newroom', spot: 'xi' }, after: ['s-candle'],
      fx: { glow: 'newroom', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH5: ChapterDef = {
  id: 'ch5', no: '玖', name: '天台', poem: '喇叭里有一个新早晨。取出来，让车铃响。', where: '一九八三 · 楼顶天台',
  ambient: '/story/amb-hum.mp3',
  hero: { panel: 'roof', x: 40, y: 78 },
  goal: 'bikes',
  panels: [
    {
      id: 'roof', img: '/story/a5.webp', cell: 0,
      spots: [
        { id: 'radio', x: 48, y: 50, w: 26, h: 26 },
        { id: 'wire', x: 68, y: 4, w: 30, h: 26 },
      ],
    },
  ],
  steps: [
    { id: 's-radio', cond: { kind: 'spot', panel: 'roof', spot: 'radio' },
      fx: { burst: 'spark', music: '/story/boombox.mp3', swap: { panel: 'roof', img: '/story/a5-roof.webp' },
        sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-wire', cond: { kind: 'dive', panel: 'roof', spot: 'wire' }, after: ['s-radio'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'roof', extractId: 'air', view: {
        img: '/story/a5-post1978.webp',
        edges: { r: 'lu' },
        spots: [{ id: 'horn', x: 34, y: 30, w: 32, h: 34 }] } } } },
    { id: 's-horn', cond: { kind: 'spot', panel: 'air', spot: 'horn' }, after: ['d-wire'],
      fx: { sfx: '/story/sfx-peel.mp3', spawn: {
        def: { id: 'bikes', img: '/story/a5-bikes.webp', cell: 3, edges: { l: 'lu' },
          spots: [{ id: 'bell', x: 42, y: 52, w: 28, h: 28 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-bikes', cond: { kind: 'connect', a: 'air', aside: 'r', b: 'bikes' }, after: ['s-horn'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-bell', cond: { kind: 'spot', panel: 'bikes', spot: 'bell' }, after: ['c-bikes'],
      fx: { glow: 'bikes', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH6: ChapterDef = {
  id: 'ch6', no: '拾', name: '水果糖', poem: '糖在玻璃后面发光。拿出来，给孩子。', where: '一九八六 · 供销社',
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
// 头两扇窗里都不是她——第三扇窗里的世界，要亲手取出来。
// ------------------------------------------------------------
export const CH7: ChapterDef = {
  id: 'ch7', no: '拾壹', name: '灯火', poem: '一千扇窗都是别人的。找到那一扇，把她取出来。', where: '二〇〇八 · 旧城夜色',
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
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'city', extractId: 'hope', view: {
        img: '/story/fin-station.webp', tint: 'brightness(1.08)',
        spots: [{ id: 'figure', x: 50, y: 36, w: 24, h: 32 }] } } } },
    { id: 's-figure', cond: { kind: 'spot', panel: 'hope', spot: 'figure' }, after: ['d-w3'],
      fx: { glow: 'hope', done: true, music: '/story/sfx-chime.mp3', sfx: '/story/sfx-chime.mp3' } },
  ],
}
