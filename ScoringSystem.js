export class ScoringSystem {
    constructor() {
        this.coinsPicked = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.timeBonus = 100;
        this.coinBonus = 50;
    }

    startGame() {
        this.startTime = performance.now(); // Start time when the game starts
    }

    pickCoin() {
        this.coinsPicked++;
    }

    endGame() {
        this.endTime = performance.now(); // End time when the game ends
    }

    calculateScore() {
        const elapsedSeconds = (this.endTime - this.startTime) / 1000; // Convert milliseconds to seconds
        const score = (elapsedSeconds * this.timeBonus) + (this.coinsPicked * this.coinBonus);

        return Math.round(score);
    }

    reset() {
        this.coinsPicked = 0;
        this.startTime = 0;
        this.endTime = 0;
    }
}
