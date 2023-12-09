export class ScoringSystem {
    constructor() {
        this.coinsPicked = 0;
        this.startTime = 0;
        this.endTime = 0;
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
        const timeBonus = 1000; // Adjust this value as needed

        // Score formula: Number of coins picked * time bonus
        const score = this.coinsPicked * timeBonus;

        return score;
    }

    reset() {
        this.coinsPicked = 0;
        this.startTime = 0;
        this.endTime = 0;
    }
}

// // Example Usage:
// const scoringSystem = new ScoringSystem();

// // Start the game
// scoringSystem.startGame();

// // Player picks a coin
// scoringSystem.pickCoin();

// // ... (Continue picking coins and playing the game)

// // End the game
// scoringSystem.endGame();

// // Calculate and retrieve the final score
// const finalScore = scoringSystem.calculateScore();

// // Reset the scoring system for a new game
// scoringSystem.reset();
