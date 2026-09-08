// 《糖纸》关卡校验器：模拟每一章，保证不存在卡死
// 运行：node scripts/validate.mjs
import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { mkdirSync } from 'node:fs'

mkdirSync('scripts/.cache', { recursive: true })
execSync('npx esbuild src/game/chapters.ts --bundle --format=esm --outfile=scripts/.cache/chapters.mjs --log-level=error', { stdio: 'inherit' })
const mod = await import(pathToFileURL(process.cwd() + '/scripts/.cache/chapters.mjs').href)

const OPP = { l: 'r', r: 'l', t: 'b', b: 't' }
let fail = 0
const err = (ch, msg) => { console.error(`  ✗ [${ch}] ${msg}`); fail++ }

for (const [name, def] of Object.entries(mod)) {
  if (!def || !def.id) continue
  console.log(`校验 ${def.no}·${def.name} (${name})`)

  // 收集所有出现的画（初始 + spawn）
  const defs = new Map()
  for (const p of def.panels) defs.set(p.id, p)
  for (const s of def.steps) if (s.fx.spawn) defs.set(s.fx.spawn.def.id, s.fx.spawn.def)
  // 可取出的世界 = 虚拟画
  for (const s of def.steps) {
    const pv = s.fx.pushView
    if (pv?.extractId) defs.set(pv.extractId, { id: pv.extractId, img: pv.view.img, cell: 0, spots: pv.view.spots, layers: [pv.view] })
  }

  // 每幅画可出现的所有视野里的 spot
  const spotsOf = new Map()
  const addSpots = (pid, spots) => {
    if (!spots) return
    if (!spotsOf.has(pid)) spotsOf.set(pid, new Set())
    for (const sp of spots) spotsOf.get(pid).add(sp.id)
  }
  for (const [pid, d] of defs) {
    addSpots(pid, d.spots)
    for (const l of d.layers ?? []) addSpots(pid, l.spots)
  }
  for (const s of def.steps) {
    if (s.fx.pushView) addSpots(s.fx.pushView.panel, s.fx.pushView.view.spots)
    if (s.fx.swapView) addSpots(s.fx.swapView.panel, s.fx.swapView.spots)
  }

  // 静态检查：spot/back/peel/connect 引用存在
  const ids = new Set(def.steps.map(s => s.id))
  for (const s of def.steps) {
    for (const a of s.after ?? []) if (!ids.has(a)) err(def.id, `步骤 ${s.id} 依赖不存在的 ${a}`)
    const c = s.cond
    if ((c.kind === 'spot' || c.kind === 'dive')) {
      if (!defs.has(c.panel)) err(def.id, `步骤 ${s.id} 指向不存在的画 ${c.panel}`)
      if (!spotsOf.get(c.panel)?.has(c.spot)) err(def.id, `步骤 ${s.id} 的圆点 ${c.spot} 在 ${c.panel} 的任何视野里都不存在`)
    }
    if (c.kind === 'connect') {
      if (!defs.has(c.a)) err(def.id, `步骤 ${s.id} 连接端 ${c.a} 不存在`)
      if (!defs.has(c.b)) err(def.id, `步骤 ${s.id} 连接端 ${c.b} 不存在`)
    }
    if ((c.kind === 'peel' || c.kind === 'back') && !defs.has(c.panel)) err(def.id, `步骤 ${s.id} 指向不存在的画 ${c.panel}`)
  }

  // 模拟：边状态 / 层数 / 在场画
  const present = new Set(def.panels.map(p => p.id))
  const edgesOf = new Map()
  const layersLeft = new Map()
  for (const [pid, d] of defs) {
    const layers = d.layers ?? [{ img: d.img, edges: d.edges }]
    layersLeft.set(pid, layers)
    edgesOf.set(pid, { ...(layers[layers.length - 1].edges ?? layers[0].edges ?? {}) })
  }
  const curEdges = (pid) => {
    const L = layersLeft.get(pid)
    return L[0].edges ?? {}
  }

  const doneSet = new Set()
  let progress = true
  let guard = 0
  while (doneSet.size < def.steps.length && progress && guard++ < 200) {
    progress = false
    for (const s of def.steps) {
      if (doneSet.has(s.id)) continue
      if (!(s.after ?? []).every(a => doneSet.has(a))) continue
      const c = s.cond
      let ok = false
      if (c.kind === 'auto') ok = true
      else if (c.kind === 'spot' || c.kind === 'dive' || c.kind === 'back') ok = present.has(c.panel)
      else if (c.kind === 'peel') ok = present.has(c.panel) && layersLeft.get(c.panel).length > 1
      else if (c.kind === 'overlay') ok = present.has(c.a) && present.has(c.b)
      else if (c.kind === 'arrange') {
        ok = c.order.every(pid => present.has(pid))
        if (!ok) c.order.forEach(pid => { if (!defs.has(pid)) err(def.id, `排序 ${s.id} 引用不存在的画 ${pid}`) })
      }
      else if (c.kind === 'connect') {
        if (present.has(c.a) && present.has(c.b)) {
          const ka = curEdges(c.a)[c.aside]
          const kb = curEdges(c.b)[OPP[c.aside]]
          ok = !!ka && ka === kb
          if (!ok && ka !== undefined && kb !== undefined) err(def.id, `连接 ${s.id} 边键不匹配: ${ka} ≠ ${kb}`)
          if (ka === undefined || kb === undefined) err(def.id, `连接 ${s.id} 缺边: ${c.a}.${c.aside}=${ka} ${c.b}.${OPP[c.aside]}=${kb}`)
        }
      }
      if (!ok) continue
      doneSet.add(s.id)
      progress = true
      const fx = s.fx
      if (fx.spawn) present.add(fx.spawn.def.id)
      if (fx.pushView?.extractId) present.add(fx.pushView.extractId)
      if (fx.setEdges) {
        const L = layersLeft.get(fx.setEdges.panel)
        L[0] = { ...L[0], edges: fx.setEdges.edges }
      }
      if (c.kind === 'peel') layersLeft.get(c.panel).shift()
      if (fx.popView) { /* 视野栈在真实引擎里维护 */ }
    }
  }
  const stuck = def.steps.filter(s => !doneSet.has(s.id))
  if (stuck.length) err(def.id, `卡死！无法完成的步骤: ${stuck.map(s => s.id).join(', ')}`)
  else console.log(`  ✓ ${def.steps.length} 步全部可达`)
}

if (fail) { console.error(`\n共 ${fail} 个问题`); process.exit(1) }
console.log('\n全部章节校验通过')
