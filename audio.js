const correctSound = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");
const wrongSound = new Audio("https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg");

export function playCorrect() {
  correctSound.currentTime = 0;
  correctSound.play();
}

export function playWrong() {
  wrongSound.currentTime = 0;
  wrongSound.play();
}
