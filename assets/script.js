// IMPORT FROM VAULT.js (in source order)

const api = ''; // same origin: the Worker serves this page and the api

let pool = [];      // every question that fits the settings, shuffled
let deck = [];      // the hand dealt from the pool, easiest first
let current;        // the question on screen, with its options shuffled
let score = 0;
let contents = 0;   // questions answered so far
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

function show(id) {
  for (const section of ['welcome', 'game', 'end', 'contribute']) {
    document.getElementById(section).hidden = section !== id;
  }
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

  const verdict = current.options[guess] === current.answer ? 'correct' : 'incorrect';
  beep(verdict === 'correct' ? 3 : 4);

  if (verdict === 'correct') {
    score++;
  }

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

function engage() {
  beep(2);
  pool = withdraw();
  document.getElementById('status').textContent = (checked('seriesSelection') || ['All series']).join(' • ');
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
  clearTimeout(timer);
  document.removeEventListener('click', advance);
  paused = false;
  document.removeEventListener('keydown', keyPress);
  document.removeEventListener('keyup', keyRelease);
  show('end');
  document.getElementById('more').hidden = !pool.length;

  const percentage = Math.round(100 * (score / contents)) || 0; // Checks for NaN values (divide by 0)

  document.getElementById('scoreReport').innerHTML = `You earned ${score} out of ${contents} points, or ${percentage}%.`;
}


// trivial functions

function setButtons() {
  document.getElementById('question').innerHTML = current.question;
  current.options.forEach((option, i) => {
    document.getElementById(`option${i}`).textContent = option;
  });
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

// the bundled vault is the fallback; the live one has whatever's been accepted since
fetch(`${api}/vault`)
  .then(r => r.json())
  .then(fresh => { if (fresh.length) vault.splice(0, vault.length, ...fresh); })
  .catch(() => {})
  .finally(() => { document.getElementById('bank').textContent = vault.length; });

if (location.hash === '#pose') show('contribute');

console.log(`Source successful!`);
