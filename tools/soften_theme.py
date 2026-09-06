"""给主题音乐做低通软化：削掉刺耳高频，音量降到 82%。备份原文件为 *.raw.wav"""
import sys
import wave
import shutil
from pathlib import Path

import numpy as np

def soften(path: Path, fc: float = 2400.0, gain: float = 0.82):
    backup = path.with_suffix('.raw.wav')
    if not backup.exists():
        shutil.copy2(path, backup)
    with wave.open(str(backup), 'rb') as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        sw = w.getsampwidth()
        n = w.getnframes()
        raw = w.readframes(n)
    if sw == 2:
        data = np.frombuffer(raw, dtype=np.int16).astype(np.float64) / 32768.0
    elif sw == 4:
        data = np.frombuffer(raw, dtype=np.int32).astype(np.float64) / 2147483648.0
    else:
        raise SystemExit(f'unsupported sample width {sw}')
    data = data.reshape(-1, ch)
    alpha = (2 * np.pi * fc) / (sr + 2 * np.pi * fc)
    out = np.zeros_like(data)
    for c in range(ch):
        x = data[:, c]
        y = np.empty_like(x)
        acc = 0.0
        for i in range(len(x)):
            acc += alpha * (x[i] - acc)
            y[i] = acc
        out[:, c] = y
    out *= gain
    peak = np.abs(out).max()
    if peak > 0.95:
        out *= 0.95 / peak
    pcm = (out * 32767.0).astype(np.int16)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())
    print(f'{path.name}: sr={sr} ch={ch} n={n} softened@{fc}Hz gain={gain}')

if __name__ == '__main__':
    base = Path(sys.argv[1])
    for name in ['theme-mb.wav', 'theme-piano.wav']:
        soften(base / name)
