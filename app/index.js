const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const DotaTriviaGame = require('./DotaTriviaGame.js');
const DotaItemStore = require('./DotaItemStore.js');

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
            let game = null;
            if (req.session.state === undefined) {
                game = new DotaTriviaGame(this.itemStore);
                req.session.state = game.state;
            } else {
                game = new DotaTriviaGame(this.itemStore, req.session.state);
            }
            let nextQuestion = game.getNextQuestion();
            req.session.currentQuestion = nextQuestion;
            res.send(nextQuestion);
        });

        this.app.get("/env", (req, res) => {
            res.json(process.env);
        });
        
        this.app.post('/', (req, res) => {
            if(req.session.state === undefined) {
                res.statusCode = 409;
                res.send('game state is undefined');
                return;
            }
            let game = new DotaTriviaGame(req.session.state);
            let answer = req.body.answer;
            req.session.state = game.submitAnswer(answer);
            res.send(req.session.state);
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
