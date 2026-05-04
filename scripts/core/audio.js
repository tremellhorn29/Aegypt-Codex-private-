export function createMusicController(button) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let osc;
  let gain;
  let playing = false;

  const start = () => {
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 110;
    gain.gain.value = 0.03;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    playing = true;
    button.textContent = "MUSIC: ON";
  };

  const stop = () => {
    if (osc) osc.stop();
    playing = false;
    button.textContent = "MUSIC: OFF";
  };

  return {
    toggle() { if (!playing) start(); else stop(); },
    blip() {
      const bOsc = audioCtx.createOscillator();
      const bGain = audioCtx.createGain();
      bOsc.type = "square";
      bOsc.frequency.value = 420;
      bGain.gain.value = 0.04;
      bOsc.connect(bGain).connect(audioCtx.destination);
      bOsc.start();
      bGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      bOsc.stop(audioCtx.currentTime + 0.08);
    }
  };
}
