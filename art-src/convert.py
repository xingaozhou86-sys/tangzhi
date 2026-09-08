# 《糖纸》插画后处理：裁水印 → 转 webp 覆盖到 public/
from pathlib import Path
from PIL import Image, ImageEnhance

SRC = Path(r"C:\Users\19591\Desktop\种自称游戏\zzc游戏\reframe-proto\art-src")
STORY = Path(r"C:\Users\19591\Desktop\种自称游戏\zzc游戏\reframe-proto\public\story")
ACT4 = Path(r"C:\Users\19591\Desktop\种自称游戏\zzc游戏\reframe-proto\public\act4")

def load(name):
    im = Image.open(SRC / f"{name}.png").convert("RGB")
    w, h = im.size
    return im.crop((0, 0, w, int(h * 0.932))).resize((1024, 1024), Image.LANCZOS)

done = []
for p in sorted(SRC.glob("*.png")):
    name = p.stem
    if name == "manifest":
        continue
    im = load(name)
    dst = ACT4 / f"{name}.webp" if name in ("workshop", "room") else STORY / f"{name}.webp"
    im.save(dst, "WEBP", quality=86)
    done.append(dst.name)

# a3-1978：同构图的亮版（时间层）
base = load("a3")
bright = ImageEnhance.Brightness(base).enhance(1.28)
bright = ImageEnhance.Color(bright).enhance(1.25)
bright.save(STORY / "a3-1978.webp", "WEBP", quality=86)
done.append("a3-1978.webp")

print("转换完成:", len(done), "张")
print(", ".join(done))
