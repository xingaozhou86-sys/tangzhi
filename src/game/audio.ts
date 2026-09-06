// Reframe · 程序化音效（WebAudio，无素材依赖）
// 克制、木质感的短音：移动=轻叩，连通=温音，旋转=拨片，过关=金色琶音

const MUTE_KEY = 'reframe-muted-v1';

let ac: AudioContext | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  if (m) stopAmbient();
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function ctx(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ac) ac = new AudioContext();
    if (ac.state === 'suspended') void ac.resume();
    return ac;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, glideTo?: number) {
  const a = ctx();
  if (!a) return;
  const t0 = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** 成功移动/叠放 */
  tick() {
    tone(1350, 0.05, 'sine', 0.045);
  },
  /** 新的线段被点亮 */
  connect() {
    tone(520, 0.14, 'triangle', 0.07);
    tone(780, 0.1, 'sine', 0.03, 0.03);
  },
  /** 旋转 */
  rotate() {
    tone(300, 0.06, 'square', 0.035);
    tone(450, 0.05, 'sine', 0.03, 0.04);
  },
  /** 拉开边界 */
  expand() {
    tone(220, 0.28, 'sine', 0.06, 0, 440);
  },
  /** 通路完成：金色琶音 */
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.5, 'sine', 0.07, i * 0.09));
    tone(1568, 0.7, 'sine', 0.035, 0.42);
  },
  /** 盖章「通」：低沉闷响 + 一点纸面脆响 */
  stamp() {
    tone(82, 0.22, 'sine', 0.1);
    tone(170, 0.07, 'triangle', 0.05, 0.015);
  },
  /** 两画咬合：木质磕碰 + 一声确认 */
  dock() {
    tone(190, 0.06, 'square', 0.05);
    tone(96, 0.14, 'sine', 0.08, 0.02);
    tone(660, 0.12, 'triangle', 0.04, 0.07);
  },
  /** 咬不上：低低的拒绝 */
  deny() {
    tone(140, 0.16, 'sine', 0.06, 0, 90);
  },
  /** 入画 / 出画：一声轻吸 */
  zoom() {
    tone(420, 0.18, 'sine', 0.045, 0, 640);
  },
  /** 光到达目标：铃 */
  chime() {
    tone(1174.66, 0.5, 'sine', 0.07);
    tone(1568, 0.6, 'sine', 0.05, 0.12);
    tone(2349.3, 0.4, 'sine', 0.025, 0.2);
  },
};

// ------------------------------------------------------------
// 章节氛围音：极轻的展厅低鸣（每个展厅一个根音）
// ------------------------------------------------------------
const AMBIENT_ROOT: Record<number, number> = {
  1: 110.0, // A2 · 颜色
  2: 98.0, // G2 · 轮廓
  3: 87.31, // F2 · 朝向
  4: 82.41, // E2 · 阴影
  5: 123.47, // B2 · 边界
};

let drone: { oscs: OscillatorNode[]; gain: GainNode } | null = null;
let droneChapter = 0;

export function stopAmbient() {
  if (!drone) return;
  const a = ctx();
  const { oscs, gain } = drone;
  drone = null;
  droneChapter = 0;
  try {
    if (a) gain.gain.linearRampToValueAtTime(0, a.currentTime + 0.8);
    setTimeout(() => oscs.forEach((o) => { try { o.stop(); } catch { /* ignore */ } }), 900);
  } catch { /* ignore */ }
}

export function setAmbient(chapter: number) {
  if (muted) return;
  const a = ctx();
  if (!a || droneChapter === chapter) return;
  stopAmbient();
  const root = AMBIENT_ROOT[chapter] ?? 110;
  const gain = a.createGain();
  gain.gain.setValueAtTime(0, a.currentTime);
  gain.gain.linearRampToValueAtTime(0.024, a.currentTime + 2.8);
  const parts: [number, OscillatorType, number][] = [
    [root, 'sine', 0.5],
    [root * 1.5, 'triangle', 0.18],
    [root * 2.02, 'sine', 0.08],
  ];
  const oscs = parts.map(([f, type, vol]) => {
    const o = a.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = a.createGain();
    g.gain.value = vol;
    o.connect(g).connect(gain);
    o.start();
    return o;
  });
  // 呼吸：极慢的音量起伏
  const lfo = a.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = a.createGain();
  lfoGain.gain.value = 0.009;
  lfo.connect(lfoGain).connect(gain.gain);
  lfo.start();
  oscs.push(lfo);
  gain.connect(a.destination);
  drone = { oscs, gain };
  droneChapter = chapter;
}
