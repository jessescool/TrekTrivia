// IMPORT FROM VAULT.js (in source order)

var settings = {
  series: [],
  movies: false,
  difficulty: 10,
  _settings: {
    _series: [`TOS`, `TNG`, `DS9`, `VOY`, `ENT`, `DIS`, `PIC`, `General`],
    _movies: true,
    _difficulty: 10
  }
};

var set = [];
var contents = 0;
var remaining;
var score = 0;
var withdrawal;


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

const profile = {}; // for form submission at end


// critical functions


// fix this to only take (verified === TRUE)
function withdraw() {

  function removeCorrespondingItems(object, index) {
    for (i in object) {
      object[i].splice(index, 1);
    };
  };

  function shuffleCorrespondingArrays(object) {

    // maybe put in a check for object type, and equal array length?

    function generateSeedArray(n) {

      let seed = [];
      for (let i = 0; i < n; i++) {
        seed.push(i);
      };

      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [seed[i], seed[j]] = [seed[j], seed[i]];
      };

      return seed;

    }; // correct

    function resequence(array, sequence) {

      let original = [...array];

      for (i in original) {
        array[sequence[i]] = original[i];
      };
    };

    let seed = generateSeedArray(object[Object.keys(object)[0]].length);
    // using the 0th index is arbitrary, as all arrays have equal length
    // doing it this way feels impure

    for (list in object) {
      resequence(object[list], seed);
    };

  };

  let withdrawal = {...vault};

  let sources = withdrawal.source;

  // let veified = withdrawal.verified;

  let allowed = settings.series;

  let toRemove = [];

  for (i in sources) {
    if (!allowed.includes(sources[i])) {
      toRemove.unshift(i);
    };
  };

  for (i in toRemove) {
    removeCorrespondingItems(withdrawal, toRemove[i]);
  };

  /* something like...

  verified.forEach(function() {
    if ()
  }

  */

  shuffleCorrespondingArrays(withdrawal);

  return withdrawal;
};

function generateSet() {

  // Helpful functions
  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  };

  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  };

  function takeItem(array, index) {
    let item = array.splice(index, 1);
    return item[0];
  };

  function ascendingPick(array, n) {

    // where n is the initial condition (integer)

    let k = n;

    while (array.indexOf(k) === -1) {
      k++;
    };

    return array.indexOf(k);

  };

  // Actual work
  let candidate = []

  let pick = ascendingPick(withdrawal.difficulty, 1);

  candidate.push(takeItem(withdrawal.questions, pick));
  candidate.push([])
  candidate[1].push(takeItem(withdrawal.answers, pick));
  candidate[1].push(takeItem(withdrawal.alternates1, pick));
  candidate[1].push(takeItem(withdrawal.alternates2, pick));
  candidate[1].push(takeItem(withdrawal.alternates3, pick));

  // --

  let correct = candidate[1][0];
  shuffleArray(candidate[1]);

  // --

  candidate.push(candidate[1].indexOf(correct))
  candidate.push(takeItem(withdrawal.difficulty, pick));
  candidate.push(takeItem(withdrawal.source, pick));

  set = candidate;

};

function check(guess) {

  // Priority 3 (make correct and incorrect arrow functions)

  function correct() {
    score++;
  };
  function incorrect() {
    // does nothing (for now)
  };

  if (guess === set[2]) {
    correct();
  } else {
    incorrect();
  };

  contents++;
  remaining--;

  if (remaining === 0) {
    remaining = 'none';
  }; // vanity

  if (withdrawal.questions.length > 0) {
    generateSet();
    setButtons();
  } else {
    gameOver();
  };
};


// keypress functionality (make last two arrow functions)

function keypress(event) {
  let x = event.key;

  if (1 <= x && x <= 4) {
    check(x - 1);
  };

  if (x === 'Escape') {
    gameOver();
  };
};

enableKeyInputs = () => document.addEventListener('keyup', keypress);
disableKeyInputs = () => document.removeEventListener('keyup', keypress);


// transition functions

function tutor() {
  let x = document.getElementById('welcome');
  let y = document.getElementById('tutorial');
  x.style.display = 'none';
  y.style.display = 'inline-block';
}

function gameOn() {

  if (!settings.series.length) {
    settings.series = settings._settings._series;
  };

  enableKeyInputs();

  withdrawal = withdraw();

  remaining = withdrawal.questions.length;
  remaining--;

  generateSet();
  setButtons();

  let x = document.getElementById('tutorial');
  let y = document.getElementById('game');
  x.style.display = 'none';
  y.style.display = 'inline-block';

};

function gameOver() {

  disableKeyInputs()

  let x = document.getElementById('game');
  let y = document.getElementById('end');
  x.style.display = 'none';
  y.style.display = 'inline-block';

  let percentage = Math.round(100*(score/contents));

  // Checks for NaN values (divide by 0)
  if (percentage) {
    percentage = percentage
  } else {
    percentage = 0
  };
  // --

  document.getElementById('scoreReport').innerHTML=`You earned ${score} out of ${contents} points, or ${percentage}%.`;

};


// trivial functions

function setButtons() {
  document.getElementById('question').innerHTML = set[0];
  document.getElementById('option0').value = set[1][0];
  document.getElementById('option1').value = set[1][1];
  document.getElementById('option2').value = set[1][2];
  document.getElementById('option3').value = set[1][3];
  document.getElementById('score').innerHTML = 'score: ' + score;
  document.getElementById('remaining').innerHTML = 'remaining: ' + remaining;
  document.getElementById('difficulty').style.background = `#${difficulties[set[3]]}`;
};

function toggleSeries(option) {
  if (settings.series.includes(option)) {
    settings.series.splice(settings.series.indexOf(option), 1);
  } else {
    settings.series.push(option);
  };
};

function toggleMovies() {
  if (settings.movies) {
    settings.movies = false;
  } else {
    settings.movies = true;
  };
};


// sounds

/*
const correctChime = new Audio();
const incorrectChime = new Audio();
*/

// ON LOAD
console.log(`Source successful!`);
