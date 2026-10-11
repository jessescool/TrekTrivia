// IMPORT FROM VAULT.js (in source order)

let deck = [];      // questions still to be asked, easiest first
let current;        // the question on screen, with its options shuffled
let score = 0;
let contents = 0;   // questions answered so far


// helpful functions

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function flash(verdict) {
  document.body.classList.remove('correct', 'incorrect');
  void document.body.offsetWidth; // restart the animation if it's already running
  document.body.classList.add(verdict);
}

function show(id) {
  for (const section of ['welcome', 'game', 'end']) {
    document.getElementById(section).hidden = section !== id;
  }
}


// critical functions

function withdraw() {
  const checked = [...document.querySelectorAll('#seriesSelection input:checked')].map(box => box.value);
  const allowed = checked.length ? checked : null; // nothing checked means everything's allowed

  const count = Number(document.getElementById('count').value);

  const withdrawal = vault.filter(q => !allowed || allowed.includes(q.source));

  // shuffle, take a handful, then sort so the quiz ramps up
  return shuffle(withdrawal).slice(0, count).sort((a, b) => a.difficulty - b.difficulty);
}

function generateSet() {
  current = deck.shift();
  current.options = shuffle([current.answer, ...current.alternates]);
}

function check(guess) {
  const verdict = current.options[guess] === current.answer ? 'correct' : 'incorrect';

  if (verdict === 'correct') {
    score++;
  }

  flash(verdict);
  document.getElementById('progress').children[contents].className = verdict;

  contents++;

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
  deck = withdraw();
  document.getElementById('progress').innerHTML = '<span></span>'.repeat(deck.length); // one slice per question
  generateSet();
  setButtons();
  show('game');
  document.addEventListener('keydown', keyPress);
  document.addEventListener('keyup', keyRelease);
}

function allStop() {
  document.removeEventListener('keydown', keyPress);
  document.removeEventListener('keyup', keyRelease);
  show('end');

  const percentage = Math.round(100 * (score / contents)) || 0; // Checks for NaN values (divide by 0)

  document.getElementById('scoreReport').innerHTML = `You earned ${score} out of ${contents} points, or ${percentage}%.`;
}


// trivial functions

function setButtons() {
  document.getElementById('question').innerHTML = current.question;
  current.options.forEach((option, i) => {
    document.getElementById(`option${i}`).value = option;
  });
  document.getElementById('difficulty').innerHTML = `difficulty ${current.difficulty} of 10`;
}

console.log(`Source successful!`);
