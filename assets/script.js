// IMPORT FROM VAULT.js (in source order)

let deck = [];      // questions still to be asked, easiest first
let current;        // the question on screen, with its options shuffled
let score = 0;
let contents = 0;   // questions answered so far
let total;          // size of the deck at engage


// constants

const difficulties = {
  1: `00FF00`,
  2: `66FF00`,
  3: `99FF00`,
  4: `CCFF00`,
  5: `FFFF00`,
  6: `FFCC00`,
  7: `FF9900`,
  8: `FF6600`,
  9: `FF3300`,
  10: `FF0000`
}; // hexes are changable


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

  const withdrawal = vault.filter(q => !allowed || allowed.includes(q.source));

  // shuffle first so questions of equal difficulty come out in random order
  return shuffle(withdrawal).sort((a, b) => a.difficulty - b.difficulty);
}

function generateSet() {
  current = deck.shift();
  current.options = shuffle([current.answer, ...current.alternates]);
}

function check(guess) {
  if (current.options[guess] === current.answer) {
    score++;
    flash('correct');
  } else {
    flash('incorrect');
  }

  contents++;

  if (deck.length) {
    generateSet();
    setButtons();
  } else {
    allStop();
  }
}


// keypress functionality

function keyRelease(event) {
  const x = event.key;

  if (1 <= x && x <= 4) {
    check(x - 1);
  }

  if (x === 'Escape') {
    allStop();
  }
}


// transition functions

function engage() {
  deck = withdraw();
  total = deck.length;
  generateSet();
  setButtons();
  show('game');
  document.addEventListener('keyup', keyRelease);
}

function allStop() {
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
  document.getElementById('score').innerHTML = 'score: ' + score;
  document.getElementById('remaining').innerHTML = 'remaining: ' + (deck.length || 'none'); // vanity
  const difficulty = document.getElementById('difficulty');
  difficulty.innerHTML = current.difficulty;
  difficulty.style.background = `#${difficulties[current.difficulty]}`;
  document.getElementById('bar').style.width = `${100 * contents / total}%`;
}

console.log(`Source successful!`);
