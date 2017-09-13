const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const DotaTriviaGame = require('./DotaTriviaGame.js');
const DotaItemStore = require('./DotaItemStore.js');
const crypto = require('crypto');
const winston = require('winston');

const port = process.env.PORT || 3000;

class EntryPoint {
    constructor() {
        this.app = express();
        this.itemStore = new DotaItemStore();
    }

    initEndpoints () {
        let cookieKey = '';

        if(process.env.cookie_key === undefined ||
           process.env.cookie_key === '') {
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
                winston.info(`${req.ip} GET /: Starting new session`);
                game = new DotaTriviaGame(this.itemStore);
                req.session.state = game.state;
                req.session.currentQuestion = game.getNextQuestion();
            } else {
                winston.info(`${req.ip} ${req.session.id} GET /: Continuing session`);
                game = new DotaTriviaGame(this.itemStore, req.session.state);
                if(req.session.answeredLastQuestionCorrectly === true) {
                    req.session.currentQuestion = game.getNextQuestion();
                }
            }
            
            res.send(req.session.currentQuestion);
        });
        
        this.app.post('/', (req, res) => {
            if(req.session.state === undefined) {
                winston.error(`${req.ip} POST /: undefined session state`);
                res.statusCode = 400;
                res.send('game state is undefined');
                return;
            }
            
            let answer = req.body.answer;
            if(answer === undefined) {
                winston.error(`${req.ip} ${req.session.id} POST /: no answer provided`);
                res.statusCode = 400;
                res.send('no answer provided');
                return;
            }            
            if(!(answer instanceof Array) || answer.some(component => typeof component !== "string")) {
                winston.error(`${req.ip} ${req.session.id} POST /: malformed answer provided`);
                res.statusCode = 400;
                res.send('answer is not an array of components');
                return;
            }

            let game = new DotaTriviaGame(this.itemStore, req.session.state);
            let answerCheck = game.submitAnswer(req.session.currentQuestion, answer);
            req.session.answeredLastQuestionCorrectly = answerCheck.isAnswerCorrect;
            req.session.state = answerCheck.state;
            winston.error(`${req.ip} ${req.session.id} POST /: ()`, req.session.state);
            res.send(req.session.state);
        });
        
        this.app.listen(port, _ => {
            winston.info(`Listening to port ${port}`);
        });
    }

    run () {
        this.itemStore.initialize()
            .then(() => this.initEndpoints())
            .catch(e => {
                winston.error(`Item store failed to initialize, error: ${e.message}, exiting`);
            });
    }
}

const entryPoint = new EntryPoint();
entryPoint.run();
