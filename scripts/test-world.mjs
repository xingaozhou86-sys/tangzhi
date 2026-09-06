// 穿画世界引擎的纯逻辑测试：三幕的"不可解 → 操作后可解"
import { buildSync } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { rmSync } from 'node:fs'

const out = buildSync({
  entryPoints: ['src/game/world.ts'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'))
  .then((m) => {
    const { WLEVELS, buildGraph } = m
    let pass = 0
    let fail = 0
    const t = (name, cond) => {
      if (cond) { pass++; console.log('PASS ', name) }
      else { fail++; console.log('FAIL ', name) }
    }
    const [L1, L2, L3] = WLEVELS

    // L1 岸：初始不可解；咬合 road↔river 后可解，且有完整路线
    t('L1 初始不可解', !buildGraph(L1, new Set(), new Set()).solved)
    const g1 = buildGraph(L1, new Set(['bank']), new Set())
    t('L1 咬合后可解', g1.solved)
    t('L1 路线非空且跨两画', g1.route.length > 3 && Math.max(...g1.route.map(p => p[0])) > 103)
    t('L1 金光可达入口路边', g1.reachEdges.size > 0)

    // L2 借月：初始不可解（路断在暗处）；overlay 借月后可解
    const g20 = buildGraph(L2, new Set(), new Set())
    t('L2 初始不可解', !g20.solved)
    t('L2 初始可达床边到灯（有金光）', g20.reachEdges.size === 1)
    const g2 = buildGraph(L2, new Set(['borrow']), new Set())
    t('L2 借月后可解', g2.solved)

    // L3 谷：不拽出小画，光永远进不了谷
    t('L3 初始不可解', !buildGraph(L3, new Set(), new Set()).solved)
    t('L3 只咬合不拽出不可解', !buildGraph(L3, new Set(['enter']), new Set()).solved)
    const g3 = buildGraph(L3, new Set(['enter']), new Set(['valley']))
    t('L3 拽出+咬合后可解', g3.solved)
    t('L3 谷不在合成时墙上可见', g3.offset.get('valley')?.[0] === 112)

    console.log(`\n${pass} passed, ${fail} failed`)
    process.exit(fail ? 1 : 0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
