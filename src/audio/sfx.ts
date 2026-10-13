type Wave = OscillatorType

let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

function audio(): AudioContext | null {
  if (!enabled || typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, dur: number, type: Wave = 'sine', gain = 0.07, delay = 0, slideTo?: number) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + delay
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(dur: number, gain = 0.05, delay = 0, hp = 1200) {
  const a = audio()
  if (!a) return
  const t0 = a.currentTime + delay
  const len = Math.max(1, Math.floor(a.sampleRate * dur))
  const buf = a.createBuffer(1, len, a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = a.createBufferSource()
  src.buffer = buf
  const filter = a.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = hp
  const g = a.createGain()
  g.gain.setValueAtTime(gain, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(g).connect(a.destination)
  src.start(t0)
}

export const sfx = {
  click() {
    tone(520, 0.06, 'triangle', 0.05)
  },
  select() {
    tone(660, 0.07, 'triangle', 0.05)
    tone(880, 0.08, 'triangle', 0.04, 0.05)
  },
  pick() {
    tone(392, 0.12, 'square', 0.04)
    tone(523, 0.12, 'square', 0.04, 0.09)
    tone(784, 0.22, 'square', 0.05, 0.18)
    noise(0.18, 0.03, 0.2, 3000)
  },
  cpuPick() {
    tone(330, 0.08, 'triangle', 0.035)
    tone(440, 0.1, 'triangle', 0.03, 0.07)
  },
  flip() {
    noise(0.12, 0.035, 0, 2500)
  },
  rare() {
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 'triangle', 0.05, i * 0.07))
    noise(0.5, 0.025, 0.3, 5000)
  },
  swish() {
    noise(0.35, 0.05, 0, 3500)
    tone(900, 0.2, 'sine', 0.02, 0, 300)
  },
  tick() {
    tone(1000, 0.04, 'square', 0.03)
  },
  buzzer() {
    tone(150, 0.7, 'sawtooth', 0.08)
    tone(155, 0.7, 'square', 0.04)
  },
  whistle() {
    tone(2200, 0.28, 'sine', 0.05, 0, 2500)
    tone(2300, 0.28, 'sine', 0.04, 0.32, 2000)
  },
  win() {
    ;[392, 523, 659, 784].forEach((f, i) => tone(f, 0.16, 'square', 0.045, i * 0.1))
    tone(1047, 0.5, 'square', 0.05, 0.42)
  },
  loss() {
    tone(330, 0.2, 'sawtooth', 0.05)
    tone(247, 0.3, 'sawtooth', 0.05, 0.18)
    tone(165, 0.5, 'sawtooth', 0.05, 0.4)
  },
  fanfare() {
    ;[523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i === 7 ? 0.7 : 0.14, 'square', 0.05, i * 0.13))
    noise(1.2, 0.03, 0.4, 4000)
  },
  heartbeat() {
    tone(70, 0.1, 'sine', 0.12)
    tone(60, 0.12, 'sine', 0.1, 0.16)
  },
}
