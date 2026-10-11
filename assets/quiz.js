// IMPORT FROM VAULT.js (in source order)

const api = ''; // same origin: the Worker serves this page and the api

let pool = [];      // every question that fits the settings, shuffled
let deck = [];      // the hand dealt from the pool, easiest first
let current;        // the question on screen, with its options shuffled
let score = 0;
let contents = 0;   // questions answered so far
let played = [];    // every question answered this game, for the results screen
let paused = false; // true while the verdict is showing
let timer;          // the pause; clicking anywhere cuts it short

const hand = 25;    // questions per deal

const seen = new Set(JSON.parse(localStorage.getItem('seen') || '[]')); // questions this browser has already been asked


// helpful functions

function checked(selection) {
  const values = [...document.querySelectorAll(`#${selection} .selected`)].map(button => button.dataset.series);
  return values.length ? values : null; // nothing selected means everything's allowed
}

function toggleSeries(button) {
  button.classList.toggle('selected');
  beep(1);
}

function beep(n) {
  document.getElementById(`audio${n}`).play().catch(() => {}); // browsers refuse to beep before the first tap
}

function go(url) {
  beep(2);
  window.location.href = url;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const screens = { welcome: 'Quiz', game: 'Quiz', end: 'Results', contribute: 'Contribute' };

function show(id) {
  for (const section of ['welcome', 'game', 'end', 'contribute']) {
    document.getElementById(section).hidden = section !== id;
  }
  document.getElementById('screen').textContent = screens[id];
  window.scrollTo(0, 0);
}


// critical functions

function withdraw() {
  const series = checked('seriesSelection');
  const withdrawal = shuffle(vault.filter(q => !series || series.includes(q.source)));
  return withdrawal.sort((a, b) => seen.has(a.question) - seen.has(b.question)); // fresh ones first
}

function deal() {
  // take a hand from the pool and sort it so the quiz ramps up
  const dealt = pool.splice(0, hand).sort((a, b) => a.difficulty - b.difficulty);
  deck = deck.concat(dealt);
  document.getElementById('progress').innerHTML += '<span></span>'.repeat(dealt.length); // one slice per question
}

function generateSet() {
  current = deck.shift();
  current.options = shuffle([current.answer, ...current.alternates]);
}

function check(guess) {
  if (paused) return;
  paused = true;
  document.activeElement.blur(); // and don't leave the tapped button focused

  const verdict = current.options[guess] === current.answer ? 'correct' : 'incorrect';
  beep(verdict === 'correct' ? 3 : 4);

  if (verdict === 'correct') {
    score++;
  }
  played.push({ source: current.source, difficulty: current.difficulty, correct: verdict === 'correct' });

  // show the verdict on the buttons, then move along
  document.getElementById(`option${guess}`).classList.add(verdict);
  document.getElementById(`option${current.options.indexOf(current.answer)}`).classList.add('correct');
  document.getElementById('progress').children[contents].className = verdict;

  contents++;
  seen.add(current.question);
  localStorage.setItem('seen', JSON.stringify([...seen]));

  timer = setTimeout(advance, verdict === 'correct' ? 400 : 1200);
  setTimeout(() => document.addEventListener('click', advance), 0); // after this click has finished bubbling
}

function advance() {
  clearTimeout(timer);
  document.removeEventListener('click', advance);
  paused = false;

  for (const button of document.querySelectorAll('.guess')) {
    button.classList.remove('correct', 'incorrect');
  }

  if (deck.length) {
    generateSet();
    setButtons();
  } else {
    allStop();
  }
}


// keypress functionality

function keyPress(event) {
  const x = event.key;

  if (1 <= x && x <= 4) {
    document.getElementById(`option${x - 1}`).classList.add('button-active');
  }
}

function keyRelease(event) {
  const x = event.key;

  if (paused && x !== 'Escape') {
    advance();
    return;
  }

  if (1 <= x && x <= 4) {
    document.getElementById(`option${x - 1}`).classList.remove('button-active');
    check(x - 1);
  }

  if (x === 'Escape') {
    allStop();
  }
}


// transition functions

// back to the welcome screen without a reload, with the quiz state cleared
function home() {
  beep(2);
  clearTimeout(timer);
  document.removeEventListener('click', advance);
  document.removeEventListener('keydown', keyPress);
  document.removeEventListener('keyup', keyRelease);
  paused = false;
  pool = []; deck = []; score = 0; contents = 0; played = [];
  document.getElementById('progress').innerHTML = '';
  document.getElementById('source').textContent = '1701';
  document.getElementById('level').textContent = '00';
  history.replaceState(null, '', location.pathname);
  show('welcome');
}

function engage() {
  beep(2);
  pool = withdraw();
  const picked = checked('seriesSelection');
  document.getElementById('status').textContent =
    !picked ? 'All series' : picked.length > 4 ? 'Multiple series' : picked.join(' • ');
  more();
}

function more() {
  deal();
  generateSet();
  setButtons();
  show('game');
  document.addEventListener('keydown', keyPress);
  document.addEventListener('keyup', keyRelease);
}

function allStop() {
  document.getElementById('source').textContent = '1701'; // back to the resting readouts
  document.getElementById('level').textContent = '00';
  clearTimeout(timer);
  document.removeEventListener('click', advance);
  paused = false;
  document.removeEventListener('keydown', keyPress);
  document.removeEventListener('keyup', keyRelease);
  show('end');
  document.getElementById('more').hidden = !pool.length;

  const percentage = Math.round(100 * (score / contents)) || 0; // Checks for NaN values (divide by 0)

  document.getElementById('rank').textContent = deck.length ? 'Aborted.' : rank(percentage, contents); // no rank for a quiz you walked out of
  document.getElementById('scoreReport').innerHTML = `You earned ${score} out of ${contents} points, or ${percentage}%.`;
  document.getElementById('breakdown').innerHTML = breakdown();
}


// the results screen

const ranks = [[95, 'Admiral'], [80, 'Captain'], [60, 'Commander'], [40, 'Lieutenant'], [20, 'Ensign'], [0, 'Cadet']];

function rank(percentage, answered) {
  if (answered < 5) return 'Cadet'; // not enough to judge
  return ranks.find(([floor]) => percentage >= floor)[1];
}

function breakdown() {
  const bySeries = {};
  for (const q of played) {
    const s = q.source === 'Movie' ? 'Film' : q.source;
    bySeries[s] = bySeries[s] || { right: 0, total: 0 };
    bySeries[s].total++;
    if (q.correct) bySeries[s].right++;
  }
  const parts = Object.entries(bySeries).map(([s, r]) => `<span>${s} ${r.right}/${r.total}</span>`);
  const hardest = Math.max(0, ...played.filter(q => q.correct).map(q => q.difficulty));
  if (hardest) parts.push(`<span>hardest right ${String(hardest).padStart(2, '0')}</span>`);
  return parts.join('');
}


// trivial functions

function setButtons() {
  document.getElementById('text').textContent = current.question;
  document.getElementById('unchecked').hidden = current.checked !== false; // a tiny asterisk for the vetter's accepts
  current.options.forEach((option, i) => {
    document.getElementById(`option${i}`).textContent = option;
  });
  // the sidebar shows where this question is from and how hard the vetter rated it
  document.getElementById('source').textContent = current.source === 'Movie' ? 'Film' : current.source;
  document.getElementById('level').textContent = String(current.difficulty).padStart(2, '0');
  const dealt = document.getElementById('progress').children.length;
  document.getElementById('count').textContent = `Question ${String(contents + 1).padStart(2, '0')} of ${dealt}`;
  document.getElementById('score').textContent = `Score ${String(score).padStart(2, '0')}`;
}

// contribution

async function pose(event) {
  event.preventDefault();
  const form = event.target;
  const fields = new FormData(form);
  const response = document.getElementById('response');

  document.getElementById('send').disabled = true;
  response.innerHTML = 'Consulting Memory Alpha...';

  const reply = await fetch(`${api}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: fields.get('question'),
      answer: fields.get('answer'),
      alternates: fields.getAll('alternate'),
    }),
  }).then(r => r.json()).catch(() => ({ verdict: 'error', reason: 'The computer is not responding.' }));

  const openers = { accept: 'Added!', review: 'Sent to the captain for review.', reject: 'Not this time.' };
  response.innerHTML = `${openers[reply.verdict] || 'Hmm.'} ${reply.reason}`;

  document.getElementById('send').disabled = false;
  if (reply.verdict === 'accept') form.reset();
}


// ON LOAD

// the sidebar readouts
function readouts() {
  const put = (id, value) => { const e = document.getElementById(id); if (e) e.textContent = value; };
  // a series with no questions yet is shown but greyed out; it wakes up on its own once questions land
  const stocked = new Set(vault.map(q => q.source));
  for (const button of document.querySelectorAll('#seriesSelection button')) {
    button.disabled = !stocked.has(button.dataset.series);
    if (button.disabled) button.classList.remove('selected');
  }
  put('source', '1701'); // at rest the series panel wears a registry number; difficulty sits at zero
  put('level', '00');
  put('bank', vault.length);
  put('build', typeof build === 'undefined' ? 'dev' : build); // stamped by `npm run deploy`
}

// the bundled vault is the fallback; the live one has whatever's been accepted since
fetch(`${api}/vault`)
  .then(r => r.json())
  .then(fresh => { if (fresh.length) vault.splice(0, vault.length, ...fresh); })
  .catch(() => {})
  .finally(readouts);

// the series toggles wrap into even rows: 9, or 5 and 4, or 3 by 3, never 7 and 1
function layoutToggles() {
  const grid = document.getElementById('seriesSelection');
  if (!grid) return; // the About page has no toggles
  const buttons = [...grid.children];
  const gap = parseFloat(getComputedStyle(grid).columnGap);
  const widest = Math.max(...buttons.map(b => b.offsetWidth));
  const room = grid.parentElement.clientWidth; // the grid itself can be pushed wide by its own columns, so measure the space it's given
  const perRow = Math.max(1, Math.floor((room + gap) / (widest + gap)));
  const rows = Math.ceil(buttons.length / perRow);
  grid.style.setProperty('--cols', Math.ceil(buttons.length / rows));
}
layoutToggles();
document.fonts.ready.then(layoutToggles); // button widths change once Antonio arrives
addEventListener('load', layoutToggles);
addEventListener('resize', layoutToggles);
if (document.getElementById('seriesSelection')) { // and whenever the space it sits in changes, for whatever reason
  new ResizeObserver(layoutToggles).observe(document.getElementById('seriesSelection').parentElement);
}

// the sidebar's height is 95% of the window minus the header, and the header's height depends on the layout
const measureHeader = () => { const w = document.querySelector('.wrap'); document.documentElement.style.setProperty('--header-h', `${w.offsetTop + w.offsetHeight + 4}px`); };
measureHeader();
addEventListener('resize', measureHeader);

if (location.hash === '#pose') show('contribute');
window.addEventListener('hashchange', () => { if (location.hash === '#pose') show('contribute'); else if (!location.hash) home(); }); // the nav buttons, from this same page

console.log(`Source successful!`);
