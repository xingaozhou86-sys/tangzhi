// Reframe · 规则引擎穷举测试（五章十八关）
// 运行：npm run test:rules
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

const L = (n) => LEVELS.find((l) => l.id === n)
const tile = (lv, id) => lv.tiles.find((t) => t.id === id)

// mapping: { cellIdx: [tileId, rot?, ...overlays] }，overlay 可以是 tileId 或 [tileId, rot]
function mkStacks(lv, size, mapping) {
  const stacks = Array.from({ length: size }, () => [])
  for (const [cell, spec] of Object.entries(mapping)) {
    const [id, rot = 0, ...overlays] = spec
    stacks[Number(cell)].push({ tile: tile(lv, id), rot })
    for (const o of overlays) {
      const [oid, orot] = Array.isArray(o) ? o : [o, 0]
      stacks[Number(cell)].push({ tile: tile(lv, oid), rot: orot })
    }
  }
  return stacks
}

function* permutations(arr) {
  if (arr.length <= 1) { yield arr; return }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const p of permutations(rest)) yield [arr[i], ...p]
  }
}

const solve = (lv, cols, m) => computeFlow(lv, cols, mkStacks(lv, cols * lv.rows, m)).solved

let pass = 0, fail = 0
const check = (name, cond) => {
  cond ? pass++ : fail++
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`)
}

// ============ 第一章 · 颜色 ============
{
  const lv = L(1)
  const INIT = ['B', 'A', 'C', 'D']
  check('L1 初始（光流沿左列下行死在黄红缝）不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 2: ['C'], 3: ['D'] }))
  check('L1 正解可解', solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['D'], 3: ['C'] }))
  let n = 0
  for (const perm of permutations(['A', 'B', 'C', 'D'])) {
    const m = {}
    perm.forEach((id, i) => (m[i] = [id]))
    if (solve(lv, 2, m)) n++
  }
  check(`L1 全排列穷举：解唯一（实际 ${n}）`, n === 1)
  let oneStep = 0
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const p = [...INIT]
    ;[p[i], p[j]] = [p[j], p[i]]
    const m = {}
    p.forEach((id, k) => (m[k] = [id]))
    if (solve(lv, 2, m)) oneStep++
  }
  check(`L1 从初始任意单交换都不可解（实际 ${oneStep}）`, oneStep === 0)
}
{
  const lv = L(2)
  check('L2 初始（金光绕满全画死在紫黄缝）不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C'] }))
  let n = 0
  for (const perm of permutations(['A', 'B', 'C', null])) {
    const m = {}
    perm.forEach((id, i) => id && (m[i] = [id]))
    if (solve(lv, 2, m)) n++
  }
  check(`L2 无滤片穷举 24 种全部不可解（实际 ${n}）`, n === 0)
  check('L2 竖缝片 F1 叠 C：方向不对，不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C', 0, 'F1'] }))
  check('L2 横缝片 F2 叠 C：通路', solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C', 0, 'F2'] }))
  check('L2 F2 叠 B 不可解', !solve(lv, 2, { 0: ['A'], 1: ['B', 0, 'F2'], 3: ['C'] }))
  check('L2 F2 放空格不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['F2'], 3: ['C'] }))
  check('L2 链路摆错 + F2 叠 C 仍不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 3: ['C', 0, 'F2'] }))
  check('L2 已知备选解：左列路线 + F2 叠 A 可解', solve(lv, 2, { 0: ['B'], 2: ['C'], 3: ['A', 0, 'F2'] }))
  check('L2 左列骨架 + F1 叠 A 不可解', !solve(lv, 2, { 0: ['B'], 2: ['C'], 3: ['A', 0, 'F1'] }))
}
{
  const lv = L(3)
  check('L3 初始（诱饵陷阱：蓝蓝相接通画外）不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 2: ['E2'], 3: ['C'] }))
  check('L3 初始 + 双色片叠 C：链没修，仍不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 2: ['E2'], 3: ['C', 0, 'D'] }))
  check('L3 骨架正确但不叠滤片：断在半空', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['E2'], 3: ['C'] }))
  check('L3 骨架 + 双色片叠 C：通路', solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['E2'], 3: ['C', 0, 'D'] }))
  check('L3 骨架 + 双色片叠 E2 不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['E2', 0, 'D'], 3: ['C'] }))
  check('L3 骨架 + 双色片叠 A 不可解', !solve(lv, 2, { 0: ['A', 0, 'D'], 1: ['B'], 2: ['E2'], 3: ['C'] }))
  check('L3 扰动块挡在入口不可解', !solve(lv, 2, { 0: ['E2'], 1: ['A'], 2: ['B'], 3: ['C', 0, 'D'] }))
}

// ============ 第二章 · 轮廓 ============
{
  const lv = L(4)
  const INIT4 = ['D', 'A', 'B', 'C']
  check('L4 初始（圆环堵在入口）不可解', !solve(lv, 2, { 0: ['D'], 1: ['A'], 2: ['B'], 3: ['C'] }))
  check('L4 正解可解', solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['D'], 3: ['C'] }))
  let n = 0
  for (const perm of permutations(['A', 'B', 'C', 'D'])) {
    const m = {}
    perm.forEach((id, i) => (m[i] = [id]))
    if (solve(lv, 2, m)) n++
  }
  check(`L4 穷举 24 种：解恰好 2 个（下路绕行也可），实际 ${n}`, n === 2)
  let oneStep = 0
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
    const p = [...INIT4]
    ;[p[i], p[j]] = [p[j], p[i]]
    const m = {}
    p.forEach((id, k) => (m[k] = [id]))
    if (solve(lv, 2, m)) oneStep++
  }
  check(`L4 从初始任意单交换都不可解（实际 ${oneStep}）`, oneStep === 0)
}
{
  const lv = L(5)
  check('L5 初始（光流断在半空，裂缝砖在画外）不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['C'] }))
  check('L5 初始只叠滤片于画外的 C 不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['C', 0, 'F'] }))
  let n = 0
  for (const perm of permutations(['A', 'B', 'C', null])) {
    const m = {}
    perm.forEach((id, i) => id && (m[i] = [id]))
    if (solve(lv, 2, m)) n++
  }
  check(`L5 无滤片穷举全部不可解（实际 ${n}）`, n === 0)
  check('L5 C 移到位但不显影不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C'] }))
  check('L5 滤片叠 C（显影裂缝）可解', solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C', 0, 'F'] }))
  check('L5 滤片叠错格不可解', !solve(lv, 2, { 0: ['A', 0, 'F'], 1: ['B'], 3: ['C'] }))
  check('L5 滤片放空格不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['F'], 3: ['C'] }))
}
{
  const lv = L(6)
  check('L6 初始（光流死在 B|G 红蓝缝）不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['G'], 3: ['C'], 5: ['D'] }))
  check('L6 初始只叠滤片于 D 不可解（侧路没拆）', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['G'], 3: ['C'], 5: ['D', 0, 'F'] }))
  check('L6 滤片叠 D 可解', solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 3: ['G'], 5: ['D', 0, 'F'] }))
  check('L6 滤片叠错格（A）不可解', !solve(lv, 3, { 0: ['A', 0, 'F'], 1: ['B'], 2: ['C'], 3: ['G'], 5: ['D'] }))
  check('L6 无滤片同构不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 3: ['G'], 5: ['D'] }))
}
{
  const lv = L(7)
  check('L7 无滤片不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 5: ['D'] }))
  check('L7 只补颜色断口（F1 转横叠 B）不可解', !solve(lv, 3, { 0: ['A'], 1: ['B', 0, ['F1', 1]], 2: ['C'], 5: ['D'] }))
  check('L7 只补显影断口（F2 叠 D）不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 5: ['D', 0, 'F2'] }))
  check('L7 滤片方向不对仍然不通（F1 竖放叠 B）', !solve(lv, 3, { 0: ['A'], 1: ['B', 0, 'F1'], 2: ['C'], 5: ['D', 0, 'F2'] }))
  check('L7 两片各就各位（F1 转横叠 A）可解', solve(lv, 3, { 0: ['A', 0, ['F1', 1]], 1: ['B'], 2: ['C'], 5: ['D', 0, 'F2'] }))
  check('L7 两片各就各位（F1 转横叠 B）可解', solve(lv, 3, { 0: ['A'], 1: ['B', 0, ['F1', 1]], 2: ['C'], 5: ['D', 0, 'F2'] }))
  check('L7 两片都叠 D 不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 5: ['D', 0, 'F1', 'F2'] }))
  check('L7 显影片叠 C 不算数', !solve(lv, 3, { 0: ['A'], 1: ['B', 0, ['F1', 1]], 2: ['C', 0, 'F2'], 5: ['D'] }))
}

// ============ 第三章 · 朝向 ============
{
  const lv = L(8)
  check('L8 初始（B 横躺入口，光向上出画）不可解', !solve(lv, 2, { 0: ['B', 1], 1: ['A'], 2: ['D'], 3: ['C'] }))
  let rotOnly = 0
  for (let rb = 0; rb < 4; rb++) {
    if (solve(lv, 2, { 0: ['B', rb], 1: ['A'], 2: ['D'], 3: ['C'] })) rotOnly++
  }
  check(`L8 初始只旋转 B（四朝向）全灭（实际 ${rotOnly}）`, rotOnly === 0)
  check('L8 只交换不旋转不可解', !solve(lv, 2, { 0: ['A'], 1: ['B', 1], 2: ['D'], 3: ['C'] }))
  check('L8 换位 + 转正 B 可解', solve(lv, 2, { 0: ['A'], 1: ['B', 0], 2: ['D'], 3: ['C'] }))
  check('L8 B 转到 rot2 不可解', !solve(lv, 2, { 0: ['A'], 1: ['B', 2], 2: ['D'], 3: ['C'] }))
  check('L8 B 转到 rot3 不可解', !solve(lv, 2, { 0: ['A'], 1: ['B', 3], 2: ['D'], 3: ['C'] }))
}
{
  const lv = L(9)
  check('L9 初始朝向不可解', !solve(lv, 2, { 0: ['A'], 1: ['B', 1], 2: ['D'], 3: ['C', 1] }))
  check('L9 正解（B、C 转正）可解', solve(lv, 2, { 0: ['A'], 1: ['B', 0], 2: ['D'], 3: ['C', 0] }))
  let n = 0
  for (const perm of permutations(['A', 'B', 'C', 'D'])) {
    for (let rb = 0; rb < 4; rb++) for (let rc = 0; rc < 4; rc++) for (let rd = 0; rd < 4; rd++) {
      const m = {}
      perm.forEach((id, i) => (m[i] = [id, id === 'B' ? rb : id === 'C' ? rc : id === 'D' ? rd : 0]))
      if (solve(lv, 2, m)) n++
    }
  }
  check(`L9 穷举 1536 种局面：有解但稀少（<10%），实际 ${n}`, n > 0 && n < 154)
}
{
  const lv = L(10)
  let n = 0
  for (let rb = 0; rb < 4; rb++) for (let rc = 0; rc < 4; rc++) {
    if (solve(lv, 2, { 0: ['A'], 1: ['B', rb], 3: ['C', rc] })) n++
  }
  check(`L10 不用滤片：16 种旋转组合全灭（实际 ${n}）`, n === 0)
  check('L10 转正 + 滤片叠 C 可解', solve(lv, 2, { 0: ['A'], 1: ['B', 0], 3: ['C', 0, 'F'] }))
  check('L10 转正 + 滤片叠 B 可解', solve(lv, 2, { 0: ['A'], 1: ['B', 0, 'F'], 3: ['C', 0] }))
  check('L10 滤片救不了错的朝向', !solve(lv, 2, { 0: ['A'], 1: ['B', 0], 3: ['C', 1, 'F'] }))
}

// ============ 第四章 · 阴影 ============
{
  const lv = L(11)
  check('L11 初始（断在半空 + 深色压路）不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 3: ['C', 0, 'K'] }))
  check('L11 只挪遮片、不修链不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 2: ['K'], 3: ['C'] }))
  check('L11 修好链但遮片压着 C：不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C', 0, 'K'] }))
  check('L11 修链 + 挪开遮片到空格：通路', solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['K'], 3: ['C'] }))
  check('L11 修链 + 遮片移出画面：通路', solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C'] }))
  let n = 0
  for (const perm of permutations(['A', 'B', 'CK', null])) {
    const m = {}
    perm.forEach((id, i) => {
      if (id === 'CK') m[i] = ['C', 0, 'K']
      else if (id) m[i] = [id]
    })
    if (solve(lv, 2, m)) n++
  }
  check(`L11 遮片不动穷举 24 种全部不可解（实际 ${n}）`, n === 0)
}
{
  const lv = L(12)
  check('L12 初始（与 L11 同构）不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 3: ['C', 0, 'K'] }))
  check('L12 只叠窗口不修链不可解', !solve(lv, 2, { 0: ['B'], 1: ['A'], 3: ['C', 0, 'K', 'W1'] }))
  check('L12 修好链但 K 压 C：不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 3: ['C', 0, 'K'] }))
  check('L12 修链 + 只挪开 K：露出的是诱饵死路，不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['K'], 3: ['C'] }))
  check('L12 修链 + 挪开 K + 窗口叠上 C：通路', solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['K'], 3: ['C', 0, 'W1'] }))
  check('L12 窗口放空格不可解', !solve(lv, 2, { 0: ['A'], 1: ['B'], 2: ['W1'], 3: ['C', 0, 'K'] }))
}
{
  const lv = L(13)
  const base = { 0: ['A'], 1: ['B'], 4: ['D', 0, 'K1'], 5: ['E', 0, 'K2'] }
  check('L13 初始（两片深色）不可解', !solve(lv, 3, base))
  check('L13 只挪开 K1 不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['K1'], 4: ['D'], 5: ['E', 0, 'K2'] }))
  check('L13 挪 K1 + 窗口叠 E：通路', solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['K1'], 4: ['D'], 5: ['E', 0, 'W1'] }))
  check('L13 窗口叠错格（D）反而封路', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['K1'], 4: ['D', 0, 'W1'], 5: ['E', 0, 'K2'] }))
  check('L13 K2 留在 E 上、窗口照样生效', solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['K1'], 4: ['D'], 5: ['E', 0, 'K2', 'W1'] }))
}
{
  const lv = L(14)
  check('L14 初始不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 4: ['C', 0, 'K'], 5: ['D'] }))
  check('L14 只挪遮片不可解（负空间未显影）', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['K'], 4: ['C'], 5: ['D'] }))
  check('L14 只叠滤片不可解（遮片未挪）', !solve(lv, 3, { 0: ['A'], 1: ['B'], 4: ['C', 0, 'K'], 5: ['D', 0, 'F'] }))
  check('L14 挪遮片 + 显影：通路', solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['K'], 4: ['C'], 5: ['D', 0, 'F'] }))
  check('L14 滤片叠错格不可解', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['K'], 4: ['C', 0, 'F'], 5: ['D'] }))
}

// ============ 第五章 · 边界 ============
{
  const lv = L(15)
  let n = 0
  for (const perm of permutations(['A', 'B', 'C', 'D'])) {
    const m = {}
    perm.forEach((id, i) => (m[i] = [id]))
    if (solve(lv, 2, m)) n++
  }
  check(`L15 未扩展穷举 24 种全部不可解（实际 ${n}）`, n === 0)
  let big = 0, needsNew = true
  for (const pick of permutations([0, 1, 2, 3, 4, 5])) {
    const m = {}
    ;['A', 'B', 'C', 'D'].forEach((id, i) => (m[pick[i]] = [id]))
    if (solve(lv, 3, m)) {
      big++
      if (!pick.slice(0, 4).some((c) => c % 3 === 2)) needsNew = false
    }
  }
  check(`L15 扩展后有解（实际 ${big} 个）`, big > 0)
  check('L15 所有解都必须用到新拉开的列', needsNew)
  check('L15 预期解可解', solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 5: ['D'] }))
}
{
  const lv = L(16)
  check('L16 初始排列不可解', !solve(lv, 3, { 0: ['E1'], 1: ['E2'], 2: ['S'], 3: ['X'], 4: ['E4'], 5: ['E3'] }))
  check('L16 正解可解', solve(lv, 3, { 0: ['S'], 1: ['E1'], 2: ['E4'], 3: ['X'], 4: ['E2'], 5: ['E3'] }))
  let n = 0
  for (const perm of permutations(['S', 'E1', 'E2', 'E3', 'E4', 'X'])) {
    const m = {}
    perm.forEach((id, i) => (m[i] = [id]))
    if (solve(lv, 3, m)) n++
  }
  check(`L16 穷举 720 种排列：有解但不泛滥（<20%），实际 ${n}`, n > 0 && n < 144)
}
{
  const lv = L(17)
  let n = 0
  for (const perm of permutations(['A', 'B', 'C', 'D'])) {
    const m = {}
    perm.forEach((id, i) => (m[i] = [id]))
    if (solve(lv, 2, m)) n++
  }
  check(`L17 未扩展穷举全部不可解（实际 ${n}）`, n === 0)
  check('L17 扩展但不叠滤片：颜色断口仍在', !solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 5: ['D'] }))
  check('L17 扩展 + 滤片叠 D：通路', solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C'], 5: ['D', 0, 'F'] }))
  check('L17 扩展 + 滤片叠 C：通路', solve(lv, 3, { 0: ['A'], 1: ['B'], 2: ['C', 0, 'F'], 5: ['D'] }))
}
{
  const lv = L(18)
  check('L18 初始不可解', !solve(lv, 3, { 0: ['A'], 1: ['B', 1], 2: ['C', 0, 'K'], 5: ['D'] }))
  check('L18 只转正 B 不可解', !solve(lv, 3, { 0: ['A'], 1: ['B', 0], 2: ['C', 0, 'K'], 5: ['D'] }))
  check('L18 转正 + 挪遮片，不显影不可解', !solve(lv, 3, { 0: ['A'], 1: ['B', 0], 2: ['C'], 3: ['K'], 5: ['D'] }))
  check('L18 转正 + 显影，不挪遮片不可解', !solve(lv, 3, { 0: ['A'], 1: ['B', 0], 2: ['C', 0, 'K'], 5: ['D', 0, 'F'] }))
  check('L18 三件事全做：通路', solve(lv, 3, { 0: ['A'], 1: ['B', 0], 2: ['C'], 3: ['K'], 5: ['D', 0, 'F'] }))
}

console.log(`\n${pass} passed, ${fail} failed`)
rmSync('scripts/.model.bundle.mjs', { force: true })
process.exit(fail ? 1 : 0)
