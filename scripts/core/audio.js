export function createMusicController(button) {
  let audioCtx = null;
  let osc = null;
  let gain = null;
  let playing = false;

  const setLabel = text => {
    if (button) button.textContent = text;
  };

  const getContext = () => {
    if (audioCtx) return audioCtx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      audioCtx = new AudioContextClass();
      return audioCtx;
    } catch (error) {
      console.warn("Audio unavailable:", error);
      return null;
    }
  };

  const resumeContext = async context => {
    if (context?.state === "suspended") {
      try {
        await context.resume();
      } catch (error) {
        console.warn("Audio resume blocked:", error);
      }
    }
  };

  const start = async () => {
    const context = getContext();
    if (!context) {
      setLabel("MUSIC: UNAVAILABLE");
      return;
    }

    await resumeContext(context);

    try {
      osc = context.createOscillator();
      gain = context.createGain();
      osc.type = "triangle";
      osc.frequency.value = 110;
      gain.gain.value = 0.03;
      osc.connect(gain).connect(context.destination);
      osc.start();
      playing = true;
      setLabel("MUSIC: ON");
    } catch (error) {
      console.warn("Music start failed:", error);
      playing = false;
      setLabel("MUSIC: OFF");
    }
  };

  const stop = () => {
    try {
      if (osc) osc.stop();
    } catch (_) {
      // Oscillator may already be stopped.
    }
    osc = null;
    gain = null;
    playing = false;
    setLabel("MUSIC: OFF");
  };

  return {
    async toggle() {
      if (!playing) await start();
      else stop();
    },

    async blip() {
      const context = getContext();
      if (!context) return;

      await resumeContext(context);

      try {
        const bOsc = context.createOscillator();
        const bGain = context.createGain();
        bOsc.type = "square";
        bOsc.frequency.value = 420;
        bGain.gain.value = 0.04;
        bOsc.connect(bGain).connect(context.destination);
        bOsc.start();
        bGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.08);
        bOsc.stop(context.currentTime + 0.08);
      } catch (error) {
        console.warn("Audio blip failed:", error);
      }
    }
  };
}
