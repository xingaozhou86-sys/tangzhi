// src/game/chapters.ts
var CH1 = {
  id: "ch1",
  no: "\u58F9",
  name: "\u62A5\u540D",
  poem: "\u90A3\u4E00\u591C\uFF0C\u4ED6\u7B2C\u4E00\u4E2A\u5199\u4E0B\u540D\u5B57\u3002",
  where: "\u4E00\u4E5D\u4E94\u4E03 \xB7 \u591C\u6821\u62A5\u540D\u5904",
  ambient: "/story/amb-city.mp3",
  hero: { panel: "booth", x: 66, y: 68 },
  goal: "below",
  panels: [
    {
      id: "booth",
      img: "/story/a1.webp",
      cell: 0,
      edges: { b: "lib-b" },
      spots: [
        { id: "window", x: 28, y: 16, w: 26, h: 32 },
        { id: "book", x: 24, y: 62, w: 26, h: 22 }
      ]
    }
  ],
  steps: [
    {
      id: "d-win",
      cond: { kind: "dive", panel: "booth", spot: "window" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "booth", view: {
        img: "/story/a1-hall.webp",
        spots: [{ id: "notice", x: 36, y: 28, w: 28, h: 28 }]
      } } }
    },
    {
      id: "s-notice",
      cond: { kind: "spot", panel: "booth", spot: "notice" },
      after: ["d-win"],
      fx: { sfx: "/story/sfx-peel.mp3", spawn: {
        def: { id: "below", img: "/story/a1-below.webp", cell: 2, edges: { t: "lib-b" } },
        cells: [2, 3, 1]
      } }
    },
    {
      id: "c-below",
      cond: { kind: "connect", a: "booth", aside: "b", b: "below" },
      after: ["s-notice"],
      fx: { walk: true, sfx: "/story/sfx-chime.mp3" }
    },
    {
      id: "s-book",
      cond: { kind: "spot", panel: "booth", spot: "book" },
      after: ["c-below"],
      fx: { collect: true, done: true, glow: "booth", sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CHX1 = {
  id: "chx1",
  no: "\u8D30",
  name: "\u5B66\u5F92",
  poem: "\u5E08\u5085\u7684\u624B\u642D\u5728\u4ED6\u624B\u4E0A\uFF0C\u94C1\u5C31\u542C\u8BDD\u4E86\u3002",
  where: "\u4E00\u4E5D\u4E94\u516B \xB7 \u673A\u4FEE\u8F66\u95F4",
  ambient: "/sfx/factory.wav",
  hero: { panel: "lathe", x: 28, y: 74 },
  goal: "shop",
  panels: [
    {
      id: "lathe",
      img: "/story/b2-lathe.webp",
      cell: 0,
      edges: { b: "chang" },
      spots: [{ id: "paper", x: 56, y: 58, w: 24, h: 22 }]
    }
  ],
  steps: [
    {
      id: "d-paper",
      cond: { kind: "dive", panel: "lathe", spot: "paper" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "lathe", view: {
        img: "/story/b2-desk.webp",
        spots: [{ id: "gear", x: 36, y: 32, w: 28, h: 28 }]
      } } }
    },
    {
      id: "s-gear",
      cond: { kind: "spot", panel: "lathe", spot: "gear" },
      after: ["d-paper"],
      fx: { sfx: "/story/sfx-peel.mp3", spawn: {
        def: {
          id: "shop",
          img: "/act4/workshop.webp",
          cell: 2,
          edges: { t: "chang" },
          spots: [{ id: "master", x: 58, y: 28, w: 24, h: 32 }]
        },
        cells: [2, 3, 1]
      } }
    },
    {
      id: "c-shop",
      cond: { kind: "connect", a: "lathe", aside: "b", b: "shop" },
      after: ["s-gear"],
      fx: { walk: true, sfx: "/story/sfx-chime.mp3" }
    },
    {
      id: "s-master",
      cond: { kind: "spot", panel: "shop", spot: "master" },
      after: ["c-shop"],
      fx: { glow: "shop", done: true, sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CH2 = {
  id: "ch2",
  no: "\u53C1",
  name: "\u95E8\u4E0E\u7A97",
  poem: "\u95E8\u901A\u8857\u5DF7\uFF0C\u7A97\u901A\u8FDC\u65B9\u3002",
  where: "\u4E00\u4E5D\u516D\u3007 \xB7 \u804C\u5DE5\u5BBF\u820D",
  ambient: "/story/amb-city.mp3",
  hero: { panel: "room", x: 46, y: 72 },
  goal: "windows",
  panels: [
    {
      id: "room",
      img: "/story/a2-room.webp",
      cell: 0,
      edges: { b: "yue" },
      spots: [{ id: "door", x: 68, y: 28, w: 18, h: 46 }]
    }
  ],
  steps: [
    {
      id: "d-door",
      cond: { kind: "dive", panel: "room", spot: "door" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "room", view: {
        img: "/story/a2-street.webp",
        spots: [{ id: "alley", x: 64, y: 18, w: 24, h: 44 }]
      } } }
    },
    {
      id: "s-alley",
      cond: { kind: "spot", panel: "room", spot: "alley" },
      after: ["d-door"],
      fx: { sfx: "/story/sfx-peel.mp3", spawn: {
        def: {
          id: "windows",
          img: "/story/a2-windows.webp",
          cell: 1,
          edges: { t: "yue" },
          spots: [{ id: "lantern", x: 52, y: 50, w: 24, h: 24 }]
        },
        cells: [1, 2, 3]
      } }
    },
    {
      id: "c-win",
      cond: { kind: "connect", a: "room", aside: "b", b: "windows" },
      after: ["s-alley"],
      fx: { walk: true, sfx: "/story/sfx-chime.mp3" }
    },
    {
      id: "d-lantern",
      cond: { kind: "dive", panel: "windows", spot: "lantern" },
      after: ["c-win"],
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "windows", view: {
        img: "/story/a2-restaurant.webp",
        spots: [{ id: "table", x: 38, y: 50, w: 28, h: 26 }]
      } } }
    },
    {
      id: "s-table",
      cond: { kind: "spot", panel: "windows", spot: "table" },
      after: ["d-lantern"],
      fx: { glow: "windows", collect: true, done: true, sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CHX2 = {
  id: "chx2",
  no: "\u8086",
  name: "\u96E8\u591C",
  poem: "\u4E00\u628A\u4F1E\uFF0C\u4E24\u4E2A\u4EBA\uFF0C\u96E8\u5C31\u5C0F\u4E86\u3002",
  where: "\u4E00\u4E5D\u516D\u4E00 \xB7 \u4E66\u5E97\u6A90\u4E0B",
  ambient: "/sfx/rain.wav",
  hero: { panel: "rain", x: 50, y: 78 },
  goal: "win",
  panels: [
    {
      id: "rain",
      img: "/story/b4-rain.webp",
      cell: 0,
      spots: [{ id: "eave", x: 6, y: 18, w: 24, h: 42 }]
    }
  ],
  steps: [
    {
      id: "d-eave",
      cond: { kind: "dive", panel: "rain", spot: "eave" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "rain", view: {
        img: "/story/b4-book.webp",
        spots: [{ id: "lamp", x: 54, y: 6, w: 26, h: 24 }]
      } } }
    },
    {
      id: "s-lamp",
      cond: { kind: "spot", panel: "rain", spot: "lamp" },
      after: ["d-eave"],
      fx: {
        sfx: "/story/sfx-chime.mp3",
        swapView: { panel: "rain", tint: "brightness(1.2) sepia(0.25)" },
        setEdges: { panel: "rain", edges: { r: "deng" } },
        spawn: {
          def: {
            id: "win",
            img: "/story/a2-windows.webp",
            cell: 2,
            edges: { l: "deng" },
            tint: "brightness(0.8)",
            spots: [{ id: "her", x: 46, y: 38, w: 20, h: 28 }]
          },
          cells: [2, 1, 3]
        }
      }
    },
    {
      id: "c-win",
      cond: { kind: "connect", a: "rain", aside: "r", b: "win" },
      after: ["s-lamp"],
      fx: { walk: true, sfx: "/story/sfx-chime.mp3" }
    },
    {
      id: "s-her",
      cond: { kind: "spot", panel: "win", spot: "her" },
      after: ["c-win"],
      fx: { glow: "win", undim: "win", done: true, sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CH3 = {
  id: "ch3",
  no: "\u4F0D",
  name: "\u5E74\u753B",
  poem: "\u4E00\u5E74\u6495\u53BB\u4E00\u5C42\uFF0C\u6495\u5230\u4E00\u4E5D\u4E03\u516B\u3002",
  where: "\u4E00\u4E5D\u516D\u4E00\u81F3\u4E03\u516B \xB7 \u5382\u95E8\u53E3",
  ambient: "/story/amb-wind.mp3",
  hero: { panel: "nianhua", x: 62, y: 78 },
  goal: "gate",
  panels: [
    {
      id: "nianhua",
      img: "/story/a3.webp",
      cell: 0,
      layers: [
        { img: "/story/a3.webp", tint: "sepia(0.75) brightness(0.82)", year: "\u4E00\u4E5D\u516D\u4E00" },
        { img: "/story/a3.webp", tint: "sepia(0.55) brightness(0.9)", year: "\u4E00\u4E5D\u516D\u516D" },
        { img: "/story/a3.webp", tint: "sepia(0.3) brightness(0.96)", year: "\u4E00\u4E5D\u4E03\u4E8C" },
        { img: "/story/a3-1978.webp", edges: { r: "bang" }, year: "\u4E00\u4E5D\u4E03\u516B" }
      ]
    },
    {
      id: "gate",
      img: "/story/a3-gate.webp",
      cell: 1,
      edges: { l: "bang" },
      spots: [{ id: "plaque", x: 36, y: 12, w: 28, h: 20 }]
    }
  ],
  steps: [
    { id: "p1", cond: { kind: "peel", panel: "nianhua" }, fx: { sfx: "/story/sfx-tear.mp3" } },
    { id: "p2", cond: { kind: "peel", panel: "nianhua" }, after: ["p1"], fx: { sfx: "/story/sfx-tear.mp3" } },
    { id: "p3", cond: { kind: "peel", panel: "nianhua" }, after: ["p2"], fx: { sfx: "/story/sfx-tear.mp3" } },
    {
      id: "c-gate",
      cond: { kind: "connect", a: "nianhua", aside: "r", b: "gate" },
      after: ["p3"],
      fx: { walk: true, sfx: "/story/sfx-chime.mp3" }
    },
    {
      id: "s-plaque",
      cond: { kind: "spot", panel: "gate", spot: "plaque" },
      after: ["c-gate"],
      fx: { glow: "gate", collect: true, done: true, sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CHX3 = {
  id: "chx3",
  no: "\u9646",
  name: "\u7AD9\u53F0",
  poem: "\u7EA2\u56F4\u5DFE\u6325\u4E86\u4E09\u4E0B\uFF0C\u8F66\u5C31\u5F00\u4E86\u3002",
  where: "\u4E00\u4E5D\u4E03\u516B \xB7 \u706B\u8F66\u7AD9\u53F0",
  ambient: "/sfx/train.wav",
  hero: { panel: "platform", x: 36, y: 74 },
  goal: "dawn",
  panels: [
    {
      id: "platform",
      img: "/story/b6-platform.webp",
      cell: 0,
      edges: { r: "liang" },
      spots: [{ id: "whistle", x: 28, y: 56, w: 22, h: 28 }]
    }
  ],
  steps: [
    {
      id: "d-whistle",
      cond: { kind: "dive", panel: "platform", spot: "whistle" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "platform", view: {
        img: "/story/fin-station.webp",
        spots: [{ id: "scarf", x: 54, y: 32, w: 22, h: 26 }]
      } } }
    },
    {
      id: "s-scarf",
      cond: { kind: "spot", panel: "platform", spot: "scarf" },
      after: ["d-whistle"],
      fx: { sfx: "/story/sfx-peel.mp3", spawn: {
        def: {
          id: "dawn",
          img: "/story/fin.webp",
          cell: 3,
          edges: { l: "liang" },
          spots: [{ id: "sun", x: 42, y: 22, w: 22, h: 22 }]
        },
        cells: [3, 2, 1]
      } }
    },
    {
      id: "c-dawn",
      cond: { kind: "connect", a: "platform", aside: "r", b: "dawn" },
      after: ["s-scarf"],
      fx: { walk: true, sfx: "/story/horn.mp3" }
    },
    {
      id: "s-sun",
      cond: { kind: "spot", panel: "dawn", spot: "sun" },
      after: ["c-dawn"],
      fx: { glow: "dawn", done: true, sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CHX4 = {
  id: "chx4",
  no: "\u634C",
  name: "\u5A5A\u793C",
  poem: "\u4E24\u6839\u7EA2\u70DB\uFF0C\u5C31\u7B97\u6210\u4E86\u5BB6\u3002",
  where: "\u4E00\u4E5D\u516B\u3007 \xB7 \u65B0\u623F",
  ambient: "/sfx/murmur.wav",
  hero: { panel: "wedding", x: 50, y: 80 },
  panels: [
    {
      id: "wedding",
      img: "/story/b8-wedding.webp",
      cell: 0,
      spots: [{ id: "door", x: 26, y: 6, w: 30, h: 32 }]
    }
  ],
  steps: [
    {
      id: "d-door",
      cond: { kind: "dive", panel: "wedding", spot: "door" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "wedding", view: {
        img: "/story/b8-room.webp",
        spots: [
          { id: "candle", x: 58, y: 24, w: 22, h: 28 },
          { id: "xi", x: 42, y: 16, w: 16, h: 16 }
        ]
      } } }
    },
    {
      id: "s-candle",
      cond: { kind: "spot", panel: "wedding", spot: "candle" },
      after: ["d-door"],
      fx: {
        music: "/sfx/fire.wav",
        swapView: { panel: "wedding", tint: "brightness(1.22) sepia(0.3) saturate(1.2)" },
        sfx: "/story/sfx-chime.mp3"
      }
    },
    {
      id: "s-xi",
      cond: { kind: "spot", panel: "wedding", spot: "xi" },
      after: ["s-candle"],
      fx: { glow: "wedding", done: true, sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CH5 = {
  id: "ch5",
  no: "\u7396",
  name: "\u5929\u53F0",
  poem: "\u6536\u97F3\u673A\u54CD\u7684\u65F6\u5019\uFF0C\u5979\u8FD8\u9760\u5728\u4ED6\u80A9\u4E0A\u3002",
  where: "\u4E00\u4E5D\u516B\u4E09 \xB7 \u697C\u9876\u5929\u53F0",
  ambient: "/story/amb-hum.mp3",
  hero: { panel: "roof", x: 40, y: 78 },
  goal: "bikes",
  panels: [
    {
      id: "roof",
      img: "/story/a5.webp",
      cell: 0,
      edges: { r: "lu" },
      spots: [
        { id: "radio", x: 54, y: 56, w: 18, h: 18 },
        { id: "wire", x: 74, y: 10, w: 24, h: 18 }
      ]
    }
  ],
  steps: [
    {
      id: "s-radio",
      cond: { kind: "spot", panel: "roof", spot: "radio" },
      fx: {
        music: "/story/boombox.mp3",
        swap: { panel: "roof", img: "/story/a5-roof.webp" },
        sfx: "/story/sfx-chime.mp3"
      }
    },
    {
      id: "d-wire",
      cond: { kind: "dive", panel: "roof", spot: "wire" },
      after: ["s-radio"],
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "roof", view: {
        img: "/story/a5-post1978.webp",
        spots: [{ id: "horn", x: 38, y: 34, w: 26, h: 28 }]
      } } }
    },
    {
      id: "s-horn",
      cond: { kind: "spot", panel: "roof", spot: "horn" },
      after: ["d-wire"],
      fx: { sfx: "/story/sfx-peel.mp3", spawn: {
        def: {
          id: "bikes",
          img: "/story/a5-bikes.webp",
          cell: 3,
          edges: { l: "lu" },
          spots: [{ id: "bell", x: 48, y: 56, w: 22, h: 22 }]
        },
        cells: [3, 2, 1]
      } }
    },
    {
      id: "c-bikes",
      cond: { kind: "connect", a: "roof", aside: "r", b: "bikes" },
      after: ["s-horn"],
      fx: { walk: true, sfx: "/story/horn.mp3" }
    },
    {
      id: "s-bell",
      cond: { kind: "spot", panel: "bikes", spot: "bell" },
      after: ["c-bikes"],
      fx: { glow: "bikes", collect: true, done: true, sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
var CH6 = {
  id: "ch6",
  no: "\u62FE",
  name: "\u6C34\u679C\u7CD6",
  poem: "\u6700\u751C\u7684\u90A3\u9897\uFF0C\u4ED6\u59CB\u7EC8\u6CA1\u820D\u5F97\u5403\u3002",
  where: "\u4E00\u4E5D\u516B\u516D \xB7 \u4F9B\u9500\u793E",
  ambient: "/story/cicadas.mp3",
  hero: { panel: "store", x: 24, y: 72 },
  goal: "village",
  panels: [
    {
      id: "store",
      img: "/story/a6-store.webp",
      cell: 0,
      edges: { r: "tang" },
      spots: [
        { id: "jar", x: 34, y: 40, w: 20, h: 26 },
        { id: "hand", x: 50, y: 34, w: 14, h: 16 },
        { id: "kid", x: 66, y: 38, w: 16, h: 24 }
      ]
    },
    { id: "village", img: "/story/a6.webp", cell: 1, dim: true }
  ],
  steps: [
    {
      id: "d-jar",
      cond: { kind: "dive", panel: "store", spot: "jar" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "store", view: {
        img: "/story/a6-store.webp",
        crop: { x: 30, y: 36, w: 26, h: 30 },
        spots: [{ id: "candy", x: 36, y: 46, w: 18, h: 18 }]
      } } }
    },
    {
      id: "s-candy",
      cond: { kind: "spot", panel: "store", spot: "candy" },
      after: ["d-jar"],
      fx: { sfx: "/story/sfx-chime.mp3", popView: { panel: "store" } }
    },
    {
      id: "s-hand",
      cond: { kind: "spot", panel: "store", spot: "hand" },
      after: ["s-candy"],
      fx: { sfx: "/story/sfx-chime.mp3" }
    },
    {
      id: "s-give",
      cond: { kind: "spot", panel: "store", spot: "kid" },
      after: ["s-hand"],
      fx: {
        sfx: "/story/sfx-chime.mp3",
        swap: { panel: "village", img: "/story/a6.webp", undim: true },
        setEdges: { panel: "village", edges: { l: "tang" } }
      }
    },
    {
      id: "c-village",
      cond: { kind: "connect", a: "store", aside: "r", b: "village" },
      after: ["s-give"],
      fx: { walk: true, sfx: "/story/sfx-chime.mp3" }
    },
    {
      id: "end",
      cond: { kind: "auto" },
      after: ["c-village"],
      fx: { glow: "village", collect: true, done: true }
    }
  ]
};
var CH7 = {
  id: "ch7",
  no: "\u62FE\u58F9",
  name: "\u706F\u706B",
  poem: "\u4ED6\u6570\u4E86\u4E00\u5343\u6247\u7A97\uFF0C\u7EC8\u4E8E\u6709\u4E00\u6247\u4E3A\u5979\u4EAE\u7740\u3002",
  where: "\u4E8C\u3007\u3007\u516B \xB7 \u65E7\u57CE\u591C\u8272",
  ambient: "/story/amb-city.mp3",
  hero: { panel: "city", x: 50, y: 84 },
  panels: [
    {
      id: "city",
      img: "/story/a2-windows.webp",
      cell: 0,
      tint: "brightness(0.72) saturate(0.75) hue-rotate(185deg)",
      spots: [
        { id: "w1", x: 14, y: 16, w: 22, h: 24 },
        { id: "w2", x: 62, y: 18, w: 22, h: 24 },
        { id: "w3", x: 40, y: 54, w: 22, h: 26 }
      ]
    }
  ],
  steps: [
    {
      id: "d-w1",
      cond: { kind: "dive", panel: "city", spot: "w1" },
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "city", view: {
        img: "/story/b8-room.webp",
        tint: "brightness(0.55) saturate(0.5)",
        spots: [{ id: "empty", x: 42, y: 38, w: 24, h: 26 }]
      } } }
    },
    {
      id: "s-empty",
      cond: { kind: "spot", panel: "city", spot: "empty" },
      after: ["d-w1"],
      fx: { sfx: "/story/sfx-tear.mp3", popView: { panel: "city" } }
    },
    {
      id: "d-w2",
      cond: { kind: "dive", panel: "city", spot: "w2" },
      after: ["s-empty"],
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "city", view: {
        img: "/story/a6-store.webp",
        tint: "brightness(0.5) saturate(0.45)",
        spots: [{ id: "dark", x: 38, y: 42, w: 26, h: 24 }]
      } } }
    },
    {
      id: "s-dark",
      cond: { kind: "spot", panel: "city", spot: "dark" },
      after: ["d-w2"],
      fx: { sfx: "/story/sfx-tear.mp3", popView: { panel: "city" } }
    },
    {
      id: "s-glow",
      cond: { kind: "auto" },
      after: ["s-dark"],
      fx: {
        swapView: { panel: "city", tint: "brightness(1.02) saturate(0.95)" },
        sfx: "/story/sfx-chime.mp3"
      }
    },
    {
      id: "d-w3",
      cond: { kind: "dive", panel: "city", spot: "w3" },
      after: ["s-glow"],
      fx: { sfx: "/story/sfx-peel.mp3", pushView: { panel: "city", view: {
        img: "/story/fin-station.webp",
        tint: "brightness(1.08)",
        spots: [{ id: "figure", x: 52, y: 38, w: 20, h: 28 }]
      } } }
    },
    {
      id: "s-figure",
      cond: { kind: "spot", panel: "city", spot: "figure" },
      after: ["d-w3"],
      fx: { glow: "city", done: true, music: "/story/sfx-chime.mp3", sfx: "/story/sfx-chime.mp3" }
    }
  ]
};
export {
  CH1,
  CH2,
  CH3,
  CH5,
  CH6,
  CH7,
  CHX1,
  CHX2,
  CHX3,
  CHX4
};
