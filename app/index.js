const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const DotaTriviaGame = require('./DotaTriviaGame.js');
const DotaItemStore = require('./DotaItemStore.js');
const crypto = require('crypto');

const port = process.env.PORT || 3000;

class EntryPoint {
    constructor() {
        this.app = express();
        this.itemStore = new DotaItemStore();
    }

    initEndpoints () {
        let cookieKey = "";

        if(process.env.cookie_key === undefined ||
           process.env.cookie_key === "") {
            const buf = Buffer.alloc(48);
            cookieKey = crypto.randomFillSync(buf).toString('hex');
        } else {
            cookieKey = process.env.cookie_key;       
        }

        this.app.use(session({
            secret: cookieKey,
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
