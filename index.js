const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const DotaTriviaGame = require('./dotaTriviaGame.js');
const DotaItemStore = require('./dotaItemStore.js');

const port = process.env.PORT || 3000;

class EntryPoint {
    constructor() {
        this.app = express();
        this.itemStore = new DotaItemStore();
    }

    initEndpoints () {
        this.app.use(session({
            secret: 'keyboard cat',
            resave: false,
            saveUninitialized: false
        }));
        
        this.app.use(bodyParser.json());
        
        this.app.get('/', (req, res) => {
            if (req.session.game === undefined) {
                req.session.game = new DotaTriviaGame(this.itemStore);
            }
            var nextQuestion = req.session.game.getNextQuestion();
            req.session.currentQuestion = nextQuestion;
            res.send(nextQuestion);
        });
        
        this.app.post('/', (req, res) => {
            var game = req.session.game;
            var answer = req.body.answer;
            if(game === undefined) {
                res.statusCode = 409;
                res.send('game state is undefined');
                return;
            }
            var state = game.submitAnswer(answer);
            res.send(state);
        });
        
        this.app.listen(port, _ => {
            console.log(`Listening to port ${port}`);
        });
    }

    run () {
        this.itemStore.initialize(() => this.initEndpoints(), () => {
            console.error('Item store failed to initialize, exiting');
        });
    }
}

const entryPoint = new EntryPoint();
entryPoint.run();
