const request = require('request').defaults({jar: true});
const DotaItemStoreHelper = require('./helpers');
request.debug = true;
var j = request.jar();

const baseUrl = 'http://localhost:3000';

const getDotaItem = () => {
    return new Promise((resolve, reject)=> {
        request.get(baseUrl, {jar: j}, (error, response, body) => {
            if(error !== undefined && error !== null) { 
                reject(error);
            }

            if(response.statusCode >= 400) {
                reject(new Error(response.statusCode));
            }

            resolve(response);
        });
    });
};

const sendAnswer = (answer) => {
    return new Promise((resolve, reject) => {
        request.post(baseUrl, {body: answer, json: true, jar: j} , (error, response, body) => {
            if(error !== undefined && error !== null) { 
                reject(error);
            }

            if(response.statusCode >= 400) {
                reject(new Error(response.statusCode));
            }

            resolve(response);
        });
    });
};

describe('Dota Trivia Core', () => {
    describe('GET /', () => {
        beforeAll(() => {
            j._jar.store.removeCookies('localhost', '/', e => {
                if(e) {
                    console.error(e);
                }
            });
        });

        it('has properly working session', done => {
            getDotaItem().then(response => {
                expect(response.statusCode).toBe(200);
                return getDotaItem();
            }).then(response => {
                expect(response.statusCode).toBe(200);
                done();
            }).catch(e => {
                console.error(e);
                fail(e);
                done();
            });
        });

        it('gives the same question, if it has no proper answer', done => {
            let itemName = '';
            getDotaItem().then(response => {
                expect(response.statusCode).toBe(200);
                itemName = JSON.parse(response.body).name;
                expect(itemName).not.toBe(undefined);
                expect(itemName).not.toBe(null);
                return getDotaItem();
            }).then(response => {
                expect(response.statusCode).toBe(200);
                let otherItemName = JSON.parse(response.body).name;
                expect(otherItemName).not.toBe(undefined);
                expect(otherItemName).not.toBe(null);
                expect(itemName).toBe(otherItemName);
                done();
            }).catch(e => {
                console.error(e);
                fail(e);
                done();
            });
        });
    });

    describe('POST /',() => {
        beforeAll(() => {
            j._jar.store.removeCookies('localhost', '/', e => {
                if(e) {
                    console.error(e);
                }
            });
        });

        it('gets 409, when sending answer without session', done => {
            sendAnswer().catch(e => {
                expect(parseInt(e.message)).toBe(409);
                done();
            });
        });

        it('can accept correct answers', done => {
            let helper = new DotaItemStoreHelper();
            getDotaItem().then(response => {
                expect(response.statusCode).toBe(200);
                itemName = JSON.parse(response.body).name;
                expect(itemName).not.toBe(undefined);
                expect(itemName).not.toBe(null);
                return itemName;
            }).then(itemName => {
                return helper.initialize();
            }).then(() => {
                let components = helper.getComponentsForItem(itemName);
                return sendAnswer({ answer: components});
            }).then(response => {
                expect(response.statusCode).toBe(200);
                done();
            }).catch(e => {
                console.error(e);
                fail(e);
                done();
            });
        });
    });
});