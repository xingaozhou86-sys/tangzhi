#!/bin/bash
# 《糖纸》全套插画批量生成（断点续跑：已存在则跳过）
cd "C:/Users/19591/AppData/Roaming/kimi-desktop/daimon-share/daimon/runtime/kimi-code/home/plugins/managed/image_generation"
REF="https://www.kimi.com/apiv2-files/sign-obj/kimi-fs%2Ffiles%2Fblob%2F7c27f0aa6c80cb84f21407b7c7e5b7cf5ca2683ee63714c02e7efb8731dc7da3?filename=a1.png&sig=Fwj1Slbbb-QgC8UgavmbAnltv8xbj6-l8huZcfLlBSA=&t=o"
STYLE=", modern Chinese picture-book illustration, flat gouache on textured rice paper, limited palette of deep indigo, warm ochre, vermilion red and cream, bold simplified shapes, cinematic soft light, poetic nostalgic mood, no text, no watermark, square composition"
OUT="C:/Users/19591/Desktop/种自称游戏/zzc游戏/reframe-proto/art-src"
N=${1:-99}
i=0
while IFS='|' read -r name prompt; do
  [ -z "$name" ] && continue
  [ -f "$OUT/$name.png" ] && continue
  i=$((i+1))
  [ "$i" -gt "$N" ] && break
  echo "=== 生成 $name ($i) ==="
  python scripts/image_generation_tool.py generate \
    --description "$prompt$STYLE" \
    --size "1024x1024" \
    --reference-image "$REF" \
    --output "$OUT/$name.png" 2>&1 | grep -E "Saved|Error|error|failed" | head -2
done < "$OUT/manifest.txt"
echo "=== 本轮完成 $i 张 ==="
