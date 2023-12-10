export let audioBike = new Audio("./common/sounds/Bike.mp3");
export let audioAmbient = new Audio("./common/sounds/Ambient.mp3");
export let audioCrash = new Audio("./common/sounds/Crash.mp3");
export let audioCoin = new Audio("./common/sounds/Coin.mp3");

audioBike.loop = true;
audioAmbient.loop = true;

export function playMusic() {
    audioBike.play();
    audioAmbient.play();
}

export function pauseMusic() {
    audioBike.pause();
    audioAmbient.pause();
}

export function crashMusic() {
    audioCrash.play();
}

export function coinMusic() {
    audioCoin.play();
}