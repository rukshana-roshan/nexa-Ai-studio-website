/* ============================================================
   SIMON SAYS — script.js
   Complete game logic, audio, UI, animations
   ============================================================ */

'use strict';

/* ── 1. Constants & Config ────────────────────────────────── */

const COLOURS = ['green', 'red', 'yellow', 'blue'];

// Frequency (Hz) for each button's tone
const TONE_FREQ = {
  green:  415.30,   // Ab4
  red:    311.13,   // Eb4
  yellow: 252.00,   // B3
  blue:   209.00,   // Ab3
};

// Difficulty: playback speed (ms flash duration) & inter-step gap
const DIFFICULTY = {
  easy:   { flashMs: 600, gapMs: 250, label: 'Easy'   },
  medium: { flashMs: 400, gapMs: 180, label: 'Medium' },
  hard:   { flashMs: 220, gapMs: 100, label: 'Hard'   },
};

const LS_KEY = 'simonBest'; // localStorage key


/* ── 2. State ─────────────────────────────────────────────── */

const state = {
  mode:          'easy',     // current difficulty
  phase:         'idle',     // idle | countdown | playback | input | gameover
  simonSeq:      [],         // full generated sequence
  playerSeq:     [],         // what the player has pressed this round
  level:         0,
  score:         0,
  best:          0,
  soundEnabled:  true,
};


/* ── 3. DOM References ────────────────────────────────────── */

const els = {
  hudLevel:       document.getElementById('hud-level'),
  hudBest:        document.getElementById('hud-best'),
  hubScore:       document.getElementById('hub-score'),
  progressFill:   document.getElementById('progress-fill'),
  countdownOver:  document.getElementById('countdown-overlay'),
  countdownDigit: document.getElementById('countdown-digit'),
  resultOverlay:  document.getElementById('result-overlay'),
  resultEmoji:    document.getElementById('result-emoji'),
  resultHeading:  document.getElementById('result-heading'),
  resultSub:      document.getElementById('result-sub'),
  resultLevel:    document.getElementById('result-level'),
  resultBestLine: document.getElementById('result-best-line'),
  btnStart:       document.getElementById('btn-start'),
  btnRestart:     document.getElementById('btn-restart'),
  btnSound:       document.getElementById('btn-sound'),
  confetti:       document.getElementById('confetti-container'),
  appWrapper:     document.querySelector('.app-wrapper'),
  bgCanvas:       document.getElementById('bg-canvas'),
  simonBtns:      {
    green:  document.getElementById('btn-green'),
    red:    document.getElementById('btn-red'),
    yellow: document.getElementById('btn-yellow'),
    blue:   document.getElementById('btn-blue'),
  },
  modeBtns:       document.querySelectorAll('.mode-btn'),
};


/* ── 4. Web Audio API ─────────────────────────────────────── */

let audioCtx = null;

/** Lazily create AudioContext (browsers require user gesture first) */
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

/**
 * Play a pure sine-wave tone at `freq` Hz for `duration` ms.
 * @param {number} freq      - frequency in Hz
 * @param {number} duration  - note length in ms
 * @param {'sine'|'square'|'sawtooth'} type - oscillator waveshape
 * @param {number} [gain=0.4] - volume 0–1
 */
function playTone(freq, duration, type = 'sine', gain = 0.4) {
  if (!state.soundEnabled) return;
  const ctx = getAudioCtx();

  const osc  = ctx.createOscillator();
  const vol  = ctx.createGain();

  osc.type      = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  // Smooth attack + decay envelope to avoid clicks
  vol.gain.setValueAtTime(0, ctx.currentTime);
  vol.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration / 1000 + 0.05);
}

/** Play the tone mapped to a Simon colour */
function playColourSound(colour, duration) {
  playTone(TONE_FREQ[colour], duration ?? DIFFICULTY[state.mode].flashMs * 0.9, 'sine', 0.4);
}

/** Short descending two-note "wrong" sound */
function playWrongSound() {
  if (!state.soundEnabled) return;
  playTone(180, 300, 'sawtooth', 0.35);
  setTimeout(() => playTone(120, 500, 'sawtooth', 0.4), 180);
}

/** Ascending arpeggio for level-up / success */
function playSuccessSound() {
  if (!state.soundEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
  notes.forEach((f, i) => setTimeout(() => playTone(f, 180, 'sine', 0.35), i * 100));
}

/** Fanfare for new high score */
function playHighScoreSound() {
  if (!state.soundEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((f, i) => setTimeout(() => playTone(f, 220, 'triangle', 0.4), i * 110));
}

/** Countdown beep */
function playBeep(freq = 880) {
  playTone(freq, 120, 'sine', 0.25);
}


/* ── 5. Background Canvas (animated grid) ─────────────────── */

(function initBackground() {
  const canvas = els.bgCanvas;
  const ctx    = canvas.getContext('2d');
  let   W, H, dots;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildDots();
  }

  function buildDots() {
    const cols = Math.ceil(W / 44);
    const rows = Math.ceil(H / 44);
    dots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dots.push({
          x:     c * 44 + 22,
          y:     r * 44 + 22,
          alpha: Math.random() * 0.4 + 0.05,
          speed: Math.random() * 0.003 + 0.001,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  let raf;
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    // Deep space gradient
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H) * 0.7);
    grad.addColorStop(0, '#050d1f');
    grad.addColorStop(1, '#020510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Pulsing dot grid
    dots.forEach(d => {
      const a = d.alpha * (0.5 + 0.5 * Math.sin(t * d.speed + d.phase));
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80,130,220,${a})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  raf = requestAnimationFrame(draw);
})();


/* ── 6. Utility Helpers ───────────────────────────────────── */

/** Return a promise that resolves after `ms` milliseconds */
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Pick a random element from an array */
const randomOf = arr => arr[Math.floor(Math.random() * arr.length)];

/** Animate the hub score with a pop */
function updateScore(value) {
  state.score = value;
  els.hubScore.textContent = value;
  els.hubScore.classList.remove('pop');
  // Force reflow so the animation restarts
  void els.hubScore.offsetWidth;
  els.hubScore.classList.add('pop');
}

/** Pulse a HUD value element */
function pulseHud(el, value) {
  el.textContent = value;
  el.classList.remove('pulse');
  void el.offsetWidth;
  el.classList.add('pulse');
}

/** Update the progress bar (0–100%) */
function setProgress(pct) {
  els.progressFill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  els.progressFill.parentElement.setAttribute('aria-valuenow', Math.round(pct));
}

/** Enable / disable all Simon buttons */
function setButtonsEnabled(enabled) {
  COLOURS.forEach(c => {
    els.simonBtns[c].disabled = !enabled;
  });
}

/** Load best score from localStorage */
function loadBest() {
  state.best = parseInt(localStorage.getItem(LS_KEY) ?? '0', 10) || 0;
  els.hudBest.textContent = state.best;
}

/** Persist best score if beaten */
function maybeSaveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(LS_KEY, state.best);
    els.hudBest.textContent = state.best;
    return true; // new high score
  }
  return false;
}


/* ── 7. Confetti ──────────────────────────────────────────── */

const CONFETTI_COLOURS = [
  '#00ff88', '#ff2255', '#ffe600', '#00aaff',
  '#ff88ee', '#aaffcc', '#ffcc00', '#88eeff',
];

function launchConfetti(count = 80) {
  els.confetti.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${randomOf(CONFETTI_COLOURS)};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.6}s;
    `;
    els.confetti.appendChild(piece);
  }
  // Clean up after animation
  setTimeout(() => { els.confetti.innerHTML = ''; }, 3500);
}


/* ── 8. Screen Shake ──────────────────────────────────────── */

function triggerShake() {
  els.appWrapper.classList.remove('shake');
  void els.appWrapper.offsetWidth;
  els.appWrapper.classList.add('shake');
  setTimeout(() => els.appWrapper.classList.remove('shake'), 650);
}


/* ── 9. Button Flash (Simon playback) ─────────────────────── */

/**
 * Light up one Simon button for `duration` ms.
 * Returns a promise that resolves when the flash is done.
 */
function flashButton(colour, duration) {
  return new Promise(resolve => {
    const btn = els.simonBtns[colour];
    playColourSound(colour, duration);
    btn.classList.add('flash');
    setTimeout(() => {
      btn.classList.remove('flash');
      resolve();
    }, duration);
  });
}


/* ── 10. Countdown ────────────────────────────────────────── */

/**
 * Show 3-2-1 countdown, then hide.
 * Returns a promise that resolves when countdown finishes.
 */
async function runCountdown() {
  els.countdownOver.hidden = false;
  for (const digit of ['3', '2', '1', 'GO!']) {
    els.countdownDigit.textContent = digit;
    // Restart pop animation
    els.countdownDigit.style.animation = 'none';
    void els.countdownDigit.offsetWidth;
    els.countdownDigit.style.animation = '';
    playBeep(digit === 'GO!' ? 1200 : 660);
    await wait(digit === 'GO!' ? 500 : 750);
  }
  els.countdownOver.hidden = true;
}


/* ── 11. Simon Sequence Playback ──────────────────────────── */

/**
 * Play the entire current simonSeq back to the player,
 * honouring the active difficulty speed settings.
 */
async function playSequence() {
  setButtonsEnabled(false);
  state.phase = 'playback';

  const { flashMs, gapMs } = DIFFICULTY[state.mode];

  for (const colour of state.simonSeq) {
    await flashButton(colour, flashMs);
    await wait(gapMs);
  }

  setButtonsEnabled(true);
  state.phase = 'input';
  state.playerSeq = [];
}


/* ── 12. Round Management ─────────────────────────────────── */

/** Extend the sequence by one random colour and play it back. */
async function nextRound() {
  state.level++;
  pulseHud(els.hudLevel, state.level);
  setProgress(0);

  // Add one new random colour
  state.simonSeq.push(randomOf(COLOURS));

  // Brief pause before playback
  await wait(600);
  await playSequence();
}


/* ── 13. Player Input Handling ────────────────────────────── */

/**
 * Called when the player taps/clicks/keys a colour.
 * Validates against the current position in simonSeq.
 */
async function handlePlayerInput(colour) {
  if (state.phase !== 'input') return;

  const btn = els.simonBtns[colour];

  // Visual + audio feedback
  btn.classList.add('pressed');
  playColourSound(colour, 180);
  setTimeout(() => btn.classList.remove('pressed'), 180);

  // Record input
  state.playerSeq.push(colour);
  const idx = state.playerSeq.length - 1;

  // Update progress bar
  setProgress((state.playerSeq.length / state.simonSeq.length) * 100);

  // ── Wrong input ──
  if (state.playerSeq[idx] !== state.simonSeq[idx]) {
    await handleGameOver();
    return;
  }

  // ── Correct so far ──
  updateScore(state.score + state.level);

  // If the player completed the full sequence this round
  if (state.playerSeq.length === state.simonSeq.length) {
    state.phase = 'idle'; // lock out further input
    setButtonsEnabled(false);
    playSuccessSound();
    launchConfetti(60);
    await wait(1000);
    await nextRound();
  }
}


/* ── 14. Game Over ────────────────────────────────────────── */

async function handleGameOver() {
  state.phase = 'gameover';
  setButtonsEnabled(false);

  playWrongSound();
  triggerShake();
  document.body.classList.add('game-over');
  setTimeout(() => document.body.classList.remove('game-over'), 600);

  await wait(700);

  const isNewBest = maybeSaveBest();
  if (isNewBest) playHighScoreSound();

  // Populate result overlay
  els.resultEmoji.textContent   = state.level <= 3 ? '😬' : state.level <= 8 ? '😅' : '💀';
  els.resultHeading.textContent = 'Game Over';
  els.resultLevel.textContent   = `Level ${state.level} (score ${state.score})`;
  els.resultBestLine.hidden     = !isNewBest;
  els.resultOverlay.hidden      = false;

  els.btnRestart.disabled = false;
}


/* ── 15. Start / Restart ──────────────────────────────────── */

async function startGame() {
  // Reset state
  state.simonSeq  = [];
  state.playerSeq = [];
  state.level     = 0;
  state.score     = 0;
  state.phase     = 'countdown';

  // Reset UI
  els.resultOverlay.hidden = true;
  els.countdownOver.hidden = true;
  setProgress(0);
  updateScore(0);
  pulseHud(els.hudLevel, 0);
  setButtonsEnabled(false);

  els.btnStart.textContent   = 'Playing…';
  els.btnStart.disabled      = true;
  els.btnRestart.disabled    = false;

  await runCountdown();
  await nextRound();
}

function restartGame() {
  if (state.phase === 'countdown' || state.phase === 'playback') return;
  startGame();
}


/* ── 16. Difficulty Mode Selector ─────────────────────────── */

els.modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (state.phase !== 'idle' && state.phase !== 'gameover') return;

    state.mode = btn.dataset.mode;

    els.modeBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  });
});


/* ── 17. Sound Toggle ─────────────────────────────────────── */

els.btnSound.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  els.btnSound.setAttribute('aria-pressed', String(state.soundEnabled));
  // CSS handles icon swap via aria-pressed selector
});


/* ── 18. Start / Restart Button Listeners ─────────────────── */

els.btnStart.addEventListener('click', () => {
  if (state.phase === 'idle' || state.phase === 'gameover') startGame();
});

els.btnRestart.addEventListener('click', restartGame);

// Result overlay buttons
document.getElementById('btn-play-again').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', () => {
  els.resultOverlay.hidden = true;
  state.phase = 'idle';
  els.btnStart.textContent = 'Start';
  els.btnStart.disabled    = false;
  setButtonsEnabled(false);
});


/* ── 19. Simon Button Click Listeners ─────────────────────── */

COLOURS.forEach(colour => {
  els.simonBtns[colour].addEventListener('click', () => {
    handlePlayerInput(colour);
  });
});


/* ── 20. Keyboard Controls ────────────────────────────────── */

const KEY_MAP = {
  q: 'green',
  w: 'red',
  a: 'yellow',
  s: 'blue',
};

document.addEventListener('keydown', e => {
  // Prevent repeat fires when key is held
  if (e.repeat) return;

  const colour = KEY_MAP[e.key.toLowerCase()];
  if (colour && state.phase === 'input') {
    handlePlayerInput(colour);
    return;
  }

  // Space / Enter to start
  if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button')) {
    if (state.phase === 'idle' || state.phase === 'gameover') startGame();
  }
});


/* ── 21. Touch / Mobile Support ───────────────────────────── */

// Prevent double-fire from touch → click on mobile
COLOURS.forEach(colour => {
  const btn = els.simonBtns[colour];
  btn.addEventListener('touchstart', e => {
    e.preventDefault(); // blocks the subsequent click event
    handlePlayerInput(colour);
  }, { passive: false });
});


/* ── 22. Initialise ───────────────────────────────────────── */

(function init() {
  loadBest();
  setButtonsEnabled(false);
  els.btnRestart.disabled = true;

  // Show idle score
  els.hubScore.textContent = '0';
  els.hudLevel.textContent = '0';
})();
