// 画作样张：把全部 art 变体渲染成一张 contact sheet，供 headless 浏览器截图自查
import { buildSync } from 'esbuild'
import { writeFileSync, rmSync } from 'node:fs'

buildSync({
  entryPoints: ['scripts/art-proof-entry.tsx'],
  bundle: true,
  format: 'esm',
  outfile: 'scripts/.art-proof.bundle.mjs',
  logLevel: 'silent',
  jsx: 'automatic',
})

const { html } = await import('./.art-proof.bundle.mjs')
writeFileSync('scripts/art-proof.html', html)
rmSync('scripts/.art-proof.bundle.mjs', { force: true })
console.log('written scripts/art-proof.html')
