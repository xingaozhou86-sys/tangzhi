// Reframe · 自动难度分析
// BFS 枚举每关的合法操作序列，求"从初始局面到通路"的最少步数。
// 操作模型严格镜像游戏内 performMove / rotateTile / expand：
//   - 拖动每格栈顶 tile：基底 → 空格移动 / 占格交换；滤片·遮片 → 叠到任意格或回托盘
//   - 点按旋转栈顶可旋转 tile
//   - 拉开边界（仅一次）
// 运行：npm run analyze
import { buildSync } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { rmSync } from 'node:fs'

buildSync({
  entryPoints: ['src/game/model.ts'],
  bundle: true,
  format: 'esm',
  outfile: 'scripts/.model.bundle.mjs',
  logLevel: 'silent',
})

const { LEVELS, computeFlow } = await import(pathToFileURL('./scripts/.model.bundle.mjs').href)

const MAX_STATES = 400000
const MAX_DEPTH = 24

function initState(level) {
  const stacks = level.initialCells.map((entry) => {
    if (!entry) return []
    const ids = Array.isArray(entry) ? entry : [entry]
    return ids.map((id) => ({ id, rot: level.tiles.find((t) => t.id === id).initialRot ?? 0 }))
  })
  return { cols: level.cols, stacks, tray: level.tray.map((id) => ({ id, rot: 0 })) }
}

function keyOf(s) {
  return `${s.cols}#${s.stacks.map((st) => st.map((p) => p.id + p.rot).join('+')).join('|')}#${s.tray.map((p) => p.id + p.rot).join('+')}`
}

function toPlaced(level, s) {
  return s.stacks.map((st) => st.map((p) => ({ tile: level.tiles.find((t) => t.id === p.id), rot: p.rot })))
}

function isSolved(level, s) {
  return computeFlow(level, s.cols, toPlaced(level, s)).solved
}

function* moves(level, s) {
  const tmap = (id) => level.tiles.find((t) => t.id === id)
  const N = s.stacks.length
  const clone = () => ({ cols: s.cols, stacks: s.stacks.map((x) => x.map((p) => ({ ...p }))), tray: s.tray.map((p) => ({ ...p })) })

  // 栈顶拖动
  for (let i = 0; i < N; i++) {
    const st = s.stacks[i]
    if (!st.length) continue
    const top = st[st.length - 1]
    const t = tmap(top.id)
    for (let j = 0; j < N; j++) {
      if (j === i) continue
      const dest = s.stacks[j]
      const ns = clone()
      const moved = ns.stacks[i].pop()
      if (t.isFilter || t.isCover) {
        ns.stacks[j].push(moved) // 叠合
      } else if (dest.length === 0) {
        ns.stacks[j].push(moved)
      } else {
        ns.stacks[i] = ns.stacks[j] // 交换
        ns.stacks[j] = [moved]
      }
      yield ns
    }
    // 回托盘（仅滤片/遮片）
    if (t.isFilter || t.isCover) {
      const ns = clone()
      ns.tray.push(ns.stacks[i].pop())
      yield ns
    }
    // 旋转
    if (t.rotatable) {
      for (const dr of [1, 2, 3]) {
        const ns = clone()
        ns.stacks[i][ns.stacks[i].length - 1].rot = (top.rot + dr) % 4
        yield ns
      }
    }
  }
  // 托盘 → 棋盘
  for (let ti = 0; ti < s.tray.length; ti++) {
    for (let j = 0; j < N; j++) {
      const ns = clone()
      ns.stacks[j].push(ns.tray.splice(ti, 1)[0])
      yield ns
    }
  }
  // 拉开边界
  if (level.expandCols && s.cols < level.expandCols) {
    const ns = clone()
    const newCols = level.expandCols
    const grown = []
    for (let y = 0; y < level.rows; y++) {
      for (let x = 0; x < newCols; x++) grown.push(x < s.cols ? ns.stacks[y * s.cols + x] : [])
    }
    ns.cols = newCols
    ns.stacks = grown
    yield ns
  }
}

function bfs(level) {
  const start = initState(level)
  const seen = new Set([keyOf(start)])
  let frontier = [{ s: start, d: 0 }]
  let minDepth = -1
  let solutionsAtMin = 0
  while (frontier.length) {
    const next = []
    for (const { s, d } of frontier) {
      if (d > MAX_DEPTH) continue
      if (isSolved(level, s)) {
        if (minDepth < 0) minDepth = d
        if (d === minDepth) solutionsAtMin++
        continue
      }
      if (minDepth >= 0 && d >= minDepth) continue
      for (const ns of moves(level, s)) {
        const k = keyOf(ns)
        if (seen.has(k)) continue
        seen.add(k)
        if (seen.size > MAX_STATES) return { minDepth, solutionsAtMin, states: seen.size, truncated: true }
        next.push({ s: ns, d: d + 1 })
      }
    }
    frontier = next
  }
  return { minDepth, solutionsAtMin, states: seen.size, truncated: false }
}

console.log('关  章  名称          最少步数  最短解个数  枚举局面数  备注')
console.log('─'.repeat(64))
for (const lv of LEVELS) {
  const r = bfs(lv)
  const note = r.truncated ? '（枚举被截断）' : r.minDepth < 0 ? '⚠ 无解！' : ''
  console.log(
    `${String(lv.id).padEnd(3)} ${String(lv.chapter).padEnd(3)} ${lv.name.padEnd(12)} ${String(r.minDepth).padEnd(8)} ${String(r.solutionsAtMin).padEnd(10)} ${String(r.states).padEnd(10)} ${note}`,
  )
}
rmSync('scripts/.model.bundle.mjs', { force: true })
