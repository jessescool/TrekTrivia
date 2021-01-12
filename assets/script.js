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

  // verified checker
  for (i in withdrawal.verified) {
    if (!withdrawal.verified[i]) {
      toRemove.unshift(i);
    };
  };

  // source option checker
  for (i in sources) {
    if (!allowed.includes(sources[i])) {
      toRemove.unshift(i);
    };
  };

  // toRemove sorting and duplicate removal
  toRemove.sort((a, b) => b - a);
  toRemove = [...new Set(toRemove)];

  // remover
  for (i in toRemove) {
    removeCorrespondingItems(withdrawal, toRemove[i]);
  };

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
    allStop();
  };
};


// keypress functionality (make last two arrow functions)

function keyPress(event) {
  let x = event.key;

  if (1 <= x && x <= 4) {
    document.getElementById(`option${x - 1}`).classlist.add('button-active');
  };

  if (x === 'Escape') {
    document.getElementById(`endquiz`).classlist.toggle('button-active');
  };
};

function keyRelease(event) {
  let x = event.key;

  if (1 <= x && x <= 4) {
    check(x - 1);
  };

  if (x === 'Escape') {
    allStop();
  };
};

function enableKeyboardInput() {
  document.addEventListener('keypress', keyPress);
  document.addEventListener('keyup', keyRelease);
};

function disableKeyboardInput() {
  document.removeEventListener('keypress', keyPress);
  document.removeEventListener('keyup', keyRelease);
};


// transition functions

function engage() {

  if (!settings.series.length) {
    settings.series = settings._settings._series;
  };

  enableKeyboardInput();

  withdrawal = withdraw();

  remaining = withdrawal.questions.length;
  remaining--;

  generateSet();
  setButtons();

  let x = document.getElementById('welcome');
  let y = document.getElementById('game');
  x.style.display = 'none';
  y.style.display = 'inline-block';

};

function allStop() {

  disableKeyboardInput();

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

function isMobile() {
  var check = false;
  (function(a){
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))
      check = true;
  })(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

window.onload = function() {
  if (isMobile()) {
    alert(`TrekTrivia isn't yet optimized for mobile, but feel free to give it a go!`)
  };
};

console.log(`Source successful!`);
