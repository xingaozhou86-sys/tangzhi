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
  id: 'ch1', no: '壹', name: '报名', poem: '窗子里还有一间屋。把它取出来，看清那张告示。', where: '一九五七 · 夜校报名处',
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
    { id: 'd-notice', cond: { kind: 'dive', panel: 'hall', spot: 'notice' }, after: ['d-win'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'hall', view: {
        img: '/story/a1-hall.webp',
        crop: { x: 28, y: 18, w: 44, h: 44 },
        spots: [{ id: 'seal', x: 46, y: 40, w: 16, h: 16 }] } } } },
    { id: 's-seal', cond: { kind: 'spot', panel: 'hall', spot: 'seal' }, after: ['d-notice'],
      fx: { burst: 'spark', burstPanel: 'hall', sfx: '/story/sfx-chime.mp3', spawn: {
        def: { id: 'below', img: '/story/a1-below.webp', cell: 2, edges: { t: 'lib-b' } },
        cells: [2, 3, 1] } } },
    { id: 'c-below', cond: { kind: 'connect', a: 'hall', aside: 'b', b: 'below' }, after: ['s-seal'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-book', cond: { kind: 'spot', panel: 'booth', spot: 'book' }, after: ['c-below'],
      fx: { collect: true, done: true, glow: 'booth', sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX1: ChapterDef = {
  id: 'chx1', no: '贰', name: '学徒', poem: '图纸里藏着整个车间。取出来，看清那颗齿轮。', where: '一九五八 · 机修车间',
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
    { id: 'd-gear', cond: { kind: 'dive', panel: 'desk', spot: 'gear' }, after: ['d-paper'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'desk', view: {
        img: '/story/b2-desk.webp',
        crop: { x: 26, y: 22, w: 48, h: 48 },
        spots: [{ id: 'tooth', x: 42, y: 38, w: 18, h: 18 }] } } } },
    { id: 's-tooth', cond: { kind: 'spot', panel: 'desk', spot: 'tooth' }, after: ['d-gear'],
      fx: { burst: 'gear', burstPanel: 'desk', sfx: '/story/sfx-chime.mp3', spawn: {
        def: { id: 'shop', img: '/act4/workshop.webp', cell: 2, edges: { t: 'chang' },
          spots: [{ id: 'master', x: 58, y: 28, w: 24, h: 32 }] },
        cells: [2, 3, 1] } } },
    { id: 'c-shop', cond: { kind: 'connect', a: 'desk', aside: 'b', b: 'shop' }, after: ['s-tooth'],
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
    { id: 's-lantern', cond: { kind: 'spot', panel: 'windows', spot: 'lantern' }, after: ['c-win'],
      fx: { burst: 'spark', burstPanel: 'windows', sfx: '/story/sfx-chime.mp3',
        swapView: { panel: 'windows', img: '/story/a2-windows-lit.webp' } } },
    { id: 'd-lantern', cond: { kind: 'dive', panel: 'windows', spot: 'lantern' }, after: ['s-lantern'],
      fx: { sfx: '/story/sfx-peel.mp3',
        pushView: { panel: 'windows', extractId: 'rest', view: {
          img: '/story/a2-restaurant.webp',
          spots: [{ id: 'table', x: 34, y: 46, w: 32, h: 30 }] } } } },
    { id: 's-table', cond: { kind: 'spot', panel: 'rest', spot: 'table' }, after: ['d-lantern'],
      fx: { glow: 'rest', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX2: ChapterDef = {
  id: 'chx2', no: '肆', name: '雨夜', poem: '檐下有一家书店。取出来，擦亮它。', where: '一九六一 · 书店檐下',
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
        tint: 'brightness(0.4) saturate(0.5)',
        edges: { r: 'deng' },
        under: { img: '/story/b4-book.webp', edges: { r: 'deng' },
          spots: [{ id: 'lamp', x: 50, y: 2, w: 32, h: 30 }] } } } } },
    { id: 'p-wipe', cond: { kind: 'peel', panel: 'book' }, after: ['d-eave'],
      fx: { sfx: '/story/sfx-peel.mp3', burst: 'spark', burstPanel: 'book' } },
    { id: 's-lamp', cond: { kind: 'spot', panel: 'book', spot: 'lamp' }, after: ['p-wipe'],
      fx: { sfx: '/story/sfx-chime.mp3',
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

// ------------------------------------------------------------
// 伍 · 渡口：一幅画撕成两半挂在墙上，一块年画混在其中
// 看出哪两块本是一幅 → 拼回去 → 江合上 → 他走过去 → 伞下是她
// ------------------------------------------------------------
export const CH2B: ChapterDef = {
  id: 'ch2b', no: '伍', name: '渡口', poem: '一幅画撕成了两半。拼回去，过江。', where: '一九六二 · 渡口',
  ambient: '/story/amb-city.mp3',
  hero: { panel: 'bank-l', x: 22, y: 80 },
  goal: 'bank-r',
  panels: [
    { id: 'bank-l', img: '/story/b5-left.webp', cell: 1, edges: { r: 'jiang' } },
    { id: 'bank-r', img: '/story/b5-right.webp', cell: 2, edges: { l: 'jiang' },
      spots: [{ id: 'umb', x: 58, y: 36, w: 24, h: 38 }] },
    { id: 'poster', img: '/story/a3.webp', cell: 3, dim: true },
  ],
  steps: [
    { id: 'c-join', cond: { kind: 'connect', a: 'bank-l', aside: 'r', b: 'bank-r' },
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-umb', cond: { kind: 'dive', panel: 'bank-r', spot: 'umb' }, after: ['c-join'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'bank-r', view: {
        img: '/story/b5-right.webp',
        crop: { x: 44, y: 16, w: 52, h: 64 },
        spots: [{ id: 'her', x: 62, y: 42, w: 18, h: 26 }] } } } },
    { id: 's-her', cond: { kind: 'spot', panel: 'bank-r', spot: 'her' }, after: ['d-umb'],
      fx: { burst: 'spark', burstPanel: 'bank-r', glow: 'bank-r', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH3: ChapterDef = {
  id: 'ch3', no: '陆', name: '流年', poem: '四面墙，四个年头。路对上了，人才走得过去。', where: '一九六一至七八 · 厂门口',
  ambient: '/story/amb-wind.mp3', weather: 'dust',
  hero: { panel: 'y1961', x: 50, y: 78 },
  goal: 'y1978',
  panels: [
    { id: 'y1972', img: '/story/y1972.webp', cell: 0,
      spots: [{ id: 'poster', x: 38, y: 22, w: 26, h: 40 }] },
    { id: 'y1966', img: '/story/y1966.webp', cell: 1,
      spots: [{ id: 'poster', x: 40, y: 24, w: 30, h: 40 }] },
    { id: 'y1978', img: '/story/y1978.webp', cell: 3,
      spots: [{ id: 'gate', x: 60, y: 34, w: 34, h: 48 }] },
    { id: 'y1961', img: '/story/y1961.webp', cell: 2 },
  ],
  steps: [
    { id: 'd-poster', cond: { kind: 'dive', panel: 'y1966', spot: 'poster' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'y1966', view: {
        img: '/story/y1966.webp',
        crop: { x: 32, y: 14, w: 44, h: 52 },
        spots: [{ id: 'slogan', x: 44, y: 30, w: 20, h: 18 }] } } } },
    { id: 's-slogan', cond: { kind: 'spot', panel: 'y1966', spot: 'slogan' }, after: ['d-poster'],
      fx: { yearFlash: '一九六六', burstPanel: 'y1966', sfx: '/story/sfx-chime.mp3' } },
    { id: 'd-wall', cond: { kind: 'dive', panel: 'y1972', spot: 'poster' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'y1972', view: {
        img: '/story/y1972.webp',
        crop: { x: 28, y: 12, w: 44, h: 50 },
        spots: [{ id: 'stamp', x: 42, y: 32, w: 18, h: 18 }] } } } },
    { id: 's-stamp', cond: { kind: 'spot', panel: 'y1972', spot: 'stamp' }, after: ['d-wall'],
      fx: { yearFlash: '一九七二', burstPanel: 'y1972', sfx: '/story/sfx-chime.mp3' } },
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
  id: 'chx3', no: '柒', name: '站台', poem: '汽笛里有整条站台。取出来，替她系好围巾。', where: '一九七八 · 火车站台',
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
    { id: 'd-scarf', cond: { kind: 'dive', panel: 'station', spot: 'scarf' }, after: ['d-whistle'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'station', view: {
        img: '/story/fin-station.webp',
        crop: { x: 40, y: 16, w: 46, h: 50 },
        spots: [{ id: 'knot', x: 56, y: 36, w: 16, h: 18 }] } } } },
    { id: 's-knot', cond: { kind: 'spot', panel: 'station', spot: 'knot' }, after: ['d-scarf'],
      fx: { burst: 'spark', burstPanel: 'station', sfx: '/story/sfx-chime.mp3', spawn: {
        def: { id: 'dawn', img: '/story/fin.webp', cell: 3, edges: { l: 'liang' },
          spots: [{ id: 'sun', x: 38, y: 16, w: 26, h: 28 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-dawn', cond: { kind: 'connect', a: 'station', aside: 'r', b: 'dawn' }, after: ['s-knot'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-sun', cond: { kind: 'spot', panel: 'dawn', spot: 'sun' }, after: ['c-dawn'],
      fx: { burst: 'sun', glow: 'dawn', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CHX4: ChapterDef = {
  id: 'chx4', no: '玖', name: '婚礼', poem: '门后面是他们的新房。取出来，擦亮，点烛。', where: '一九八〇 · 新房',
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
        tint: 'brightness(0.38) saturate(0.55)',
        under: { img: '/story/b8-room.webp',
          spots: [
            { id: 'candle', x: 54, y: 20, w: 28, h: 34 },
            { id: 'xi', x: 38, y: 12, w: 22, h: 22 },
          ] } } } } },
    { id: 'p-dark', cond: { kind: 'peel', panel: 'newroom' }, after: ['d-door'],
      fx: { sfx: '/story/sfx-peel.mp3', burst: 'spark', burstPanel: 'newroom' } },
    { id: 's-candle', cond: { kind: 'spot', panel: 'newroom', spot: 'candle' }, after: ['p-dark'],
      fx: { music: '/sfx/fire.wav',
        swapView: { panel: 'newroom', tint: 'brightness(1.22) sepia(0.3) saturate(1.2)' },
        sfx: '/story/sfx-chime.mp3' } },
    { id: 's-xi', cond: { kind: 'spot', panel: 'newroom', spot: 'xi' }, after: ['s-candle'],
      fx: { glow: 'newroom', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

// ------------------------------------------------------------
// 拾 · 月夜：她的窗是黑的，天上有一轮月亮
// 把月亮摘下来（取出来），挂进她的窗（叠上去）——窗就亮了
// ------------------------------------------------------------
export const CH5B: ChapterDef = {
  id: 'ch5b', no: '拾', name: '月夜', poem: '她的窗是黑的。把月亮摘下来，挂进去。', where: '一九八一 · 她下夜班',
  ambient: '/story/amb-hum.mp3',
  hero: { panel: 'sky', x: 26, y: 82 },
  goal: 'win2',
  panels: [
    { id: 'sky', img: '/story/b9-sky.webp', cell: 0,
      spots: [{ id: 'moon', x: 55, y: 8, w: 34, h: 36 }] },
    { id: 'win2', img: '/story/b9-lit.webp', cell: 1,
      tint: 'brightness(0.42) saturate(0.65)',
      spots: [{ id: 'her', x: 52, y: 44, w: 20, h: 22 }] },
  ],
  steps: [
    { id: 'd-moon', cond: { kind: 'dive', panel: 'sky', spot: 'moon' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'sky', extractId: 'moon', view: {
        img: '/story/b9-sky.webp',
        crop: { x: 50, y: 2, w: 46, h: 46 } } } } },
    { id: 'o-light', cond: { kind: 'overlay', a: 'moon', b: 'win2' }, after: ['d-moon'],
      fx: { burst: 'spark', burstPanel: 'win2', sfx: '/story/sfx-chime.mp3',
        swapView: { panel: 'win2', img: '/story/b9-lit.webp', tint: '' },
        glow: 'win2' } },
    { id: 's-her', cond: { kind: 'spot', panel: 'win2', spot: 'her' }, after: ['o-light'],
      fx: { done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH5: ChapterDef = {
  id: 'ch5', no: '拾壹', name: '天台', poem: '喇叭里有一个新早晨。取出来，按响它。', where: '一九八三 · 楼顶天台',
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
    { id: 'd-horn', cond: { kind: 'dive', panel: 'air', spot: 'horn' }, after: ['d-wire'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'air', view: {
        img: '/story/a5-post1978.webp',
        crop: { x: 24, y: 20, w: 52, h: 52 },
        spots: [{ id: 'switch', x: 44, y: 42, w: 18, h: 18 }] } } } },
    { id: 's-switch', cond: { kind: 'spot', panel: 'air', spot: 'switch' }, after: ['d-horn'],
      fx: { burst: 'spark', burstPanel: 'air', sfx: '/story/sfx-chime.mp3', spawn: {
        def: { id: 'bikes', img: '/story/a5-bikes.webp', cell: 3, edges: { l: 'lu' },
          spots: [{ id: 'bell', x: 42, y: 52, w: 28, h: 28 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-bikes', cond: { kind: 'connect', a: 'air', aside: 'r', b: 'bikes' }, after: ['s-switch'],
      fx: { walk: true, sfx: '/story/horn.mp3' } },
    { id: 's-bell', cond: { kind: 'spot', panel: 'bikes', spot: 'bell' }, after: ['c-bikes'],
      fx: { glow: 'bikes', collect: true, done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

// ------------------------------------------------------------
// 拾 · 照相馆：橱窗里有一台相机，镜头里是他们俩
// 取出相机 → 钻进镜头 → 按下快门 → 把回家的路铺上
// ------------------------------------------------------------
export const CH7B: ChapterDef = {
  id: 'ch7b', no: '拾贰', name: '照相馆', poem: '橱窗里有一台相机。取出来，替她留一张相。', where: '一九八五 · 红星照相馆',
  ambient: '/story/amb-hum.mp3',
  hero: { panel: 'studio', x: 50, y: 80 },
  goal: 'home',
  panels: [
    {
      id: 'studio', img: '/story/b7-photo.webp', cell: 0,
      spots: [{ id: 'door', x: 66, y: 26, w: 30, h: 64 }],
    },
  ],
  steps: [
    { id: 'd-door', cond: { kind: 'dive', panel: 'studio', spot: 'door' },
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'studio', extractId: 'camera', view: {
        img: '/story/b7-camera.webp',
        edges: { r: 'hui' },
        spots: [{ id: 'lens', x: 40, y: 30, w: 18, h: 16 }] } } } },
    { id: 'd-lens', cond: { kind: 'dive', panel: 'camera', spot: 'lens' }, after: ['d-door'],
      fx: { sfx: '/story/sfx-peel.mp3', pushView: { panel: 'camera', view: {
        img: '/story/b7-couple.webp',
        spots: [{ id: 'smile', x: 40, y: 32, w: 34, h: 40 }] } } } },
    { id: 's-smile', cond: { kind: 'spot', panel: 'camera', spot: 'smile' }, after: ['d-lens'],
      fx: { burst: 'spark', burstPanel: 'camera', sfx: '/story/sfx-chime.mp3', spawn: {
        def: { id: 'home', img: '/story/a2-street.webp', cell: 3, edges: { l: 'hui' },
          tint: 'brightness(1.12) sepia(0.18)',
          spots: [{ id: 'gate', x: 56, y: 10, w: 34, h: 56 }] },
        cells: [3, 2, 1] } } },
    { id: 'c-home', cond: { kind: 'connect', a: 'camera', aside: 'r', b: 'home' }, after: ['s-smile'],
      fx: { walk: true, sfx: '/story/sfx-chime.mp3' } },
    { id: 's-gate', cond: { kind: 'spot', panel: 'home', spot: 'gate' }, after: ['c-home'],
      fx: { glow: 'home', done: true, sfx: '/story/sfx-chime.mp3' } },
  ],
}

export const CH6: ChapterDef = {
  id: 'ch6', no: '拾叁', name: '水果糖', poem: '糖在玻璃后面发光。拿出来，给孩子。', where: '一九八六 · 供销社',
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
      fx: { burst: 'spark', burstPanel: 'store',
        swapView: { panel: 'store', tint: 'brightness(1.1) sepia(0.15)' },
        sfx: '/story/sfx-chime.mp3' } },
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
  id: 'ch7', no: '拾肆', name: '灯火', poem: '找到那一扇，把她取出来，放回灯火里。', where: '二〇〇八 · 旧城夜色',
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
      fx: { glow: 'hope', sfx: '/story/sfx-chime.mp3' } },
    { id: 'o-home', cond: { kind: 'overlay', a: 'hope', b: 'city' }, after: ['s-figure'],
      fx: { burst: 'sun', burstPanel: 'city', sfx: '/story/sfx-chime.mp3', music: '/story/sfx-chime.mp3',
        swapView: { panel: 'city', img: '/story/a7-lit.webp' },
        glow: 'city', done: true } },
  ],
}
