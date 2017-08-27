const DotaItemStore = require('./dotaItemStore.js'); 

module.exports = class DotaTriviaGame { 
    constructor (itemStore) {
        console.log('game ctor');
        this.state = {
            gameOver : false,
            currentStreak : 0,
            score : 0,
            retries : 3
        }
        this.itemStore = itemStore;
    }

    checkAnswer(currentQuestion, answer) {
        let neededComponents = currentQuestion.needed_components;
        if(neededComponents.length !== answer.length) {
            return false;
        }

        for(let i = 0; i < neededComponents.length; i++) {
            if(neededComponents[i] !== answer[i]) {
                return false;
            }
        }

        return true;
    }

    /*
     * Called when user submits an answer.
     * The answer will contain an array of components
     * currentQuestion is an item, containg an array called needed components
     * @param currentQuestion - current game question, stored in the session
     * @param answer, submitted by the user
     */
    submitAnswer (currentQuestion, answer) {
        if (checkAnswer(currentQuestion, answer)) {
            this.state.currentStreak++;
            this.state.score += 100;
        } else {
            if (--this.state.retries <= 0) {
                this.state.gameOver = true;
            }
            this.state.currentStreak = 0;
        }

        return state;
    }

    getNextQuestion() {
        return this.itemStore.pickItem();
    }
}
