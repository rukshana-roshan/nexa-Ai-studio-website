/* ─────────────────────────────────────────────────────────
   Dicee — script.js
   Renders CSS dot-based dice faces and animates a roll.
───────────────────────────────────────────────────────── */

// Dot layout for each face (1-6).
// Each face is a 3×3 grid (9 cells, indexed 0-8).
// true = dot visible, false = empty cell.
const DOT_PATTERNS = {
  1: [false, false, false,
      false, true,  false,
      false, false, false],

  2: [true,  false, false,
      false, false, false,
      false, false, true ],

  3: [true,  false, false,
      false, true,  false,
      false, false, true ],

  4: [true,  false, true,
      false, false, false,
      true,  false, true ],

  5: [true,  false, true,
      false, true,  false,
      true,  false, true ],

  6: [true,  false, true,
      true,  false, true,
      true,  false, true ],
};

// ── Build dot grid inside a dice element ───────────────
function buildDotGrid(el) {
  el.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    dot.dataset.index = i;
    el.appendChild(dot);
  }
}

// ── Show a specific face value ─────────────────────────
function showFace(el, value) {
  const pattern = DOT_PATTERNS[value];
  const dots = el.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', pattern[i]);
  });
}

// ── Spawn ambient particles ────────────────────────────
function spawnParticles() {
  const container = document.getElementById('particles');
  container.innerHTML = '';
  const colors = ['#FFD700', '#FF4D6D', '#4D79FF', '#8892A4'];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 6 + 3;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${8 + Math.random() * 12}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(p);
  }
}

// ── Roll logic ─────────────────────────────────────────
function rollDice() {
  const dice1El  = document.getElementById('dice1');
  const dice2El  = document.getElementById('dice2');
  const card1    = document.getElementById('card1');
  const card2    = document.getElementById('card2');
  const resultEl = document.getElementById('result');
  const score1El = document.getElementById('score1');
  const score2El = document.getElementById('score2');

  // Clear win/lose classes
  card1.classList.remove('winner', 'loser', 'winner-p2');
  card2.classList.remove('winner', 'loser', 'winner-p2');
  resultEl.classList.remove('win1', 'win2', 'draw');
  resultEl.textContent = '…';

  // Trigger CSS roll animation
  dice1El.classList.remove('rolling');
  dice2El.classList.remove('rolling');
  void dice1El.offsetWidth; // reflow
  void dice2El.offsetWidth;
  dice1El.classList.add('rolling');
  dice2El.classList.add('rolling');

  // Random values
  const r1 = Math.floor(Math.random() * 6) + 1;
  const r2 = Math.floor(Math.random() * 6) + 1;

  // Show dots after animation peak (~250 ms)
  setTimeout(() => {
    showFace(dice1El, r1);
    showFace(dice2El, r2);
    score1El.textContent = r1;
    score2El.textContent = r2;

    if (r1 > r2) {
      resultEl.textContent = '🚩 Player 1 Wins!';
      resultEl.classList.add('win1');
      card1.classList.add('winner');
      card2.classList.add('loser');
    } else if (r2 > r1) {
      resultEl.textContent = 'Player 2 Wins! 🚩';
      resultEl.classList.add('win2');
      card2.classList.add('winner-p2');
      card1.classList.add('loser');
    } else {
      resultEl.textContent = '⚔️ Draw!';
      resultEl.classList.add('draw');
    }
  }, 260);
}

// ── Init ───────────────────────────────────────────────
(function init() {
  buildDotGrid(document.getElementById('dice1'));
  buildDotGrid(document.getElementById('dice2'));
  spawnParticles();
  // Auto-roll on load for first impression
  rollDice();
})();
