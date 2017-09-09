const request = require("request").defaults({jar: true});
request.debug = true;

const baseUrl = "http://localhost:3000";

const getDotaItem = () => {
    return new Promise((resolve, reject)=> {
        request.get(baseUrl, (error, response, body) => {
            if(error !== undefined && error !== null) { 
                reject(error);
            }

            if(response.statusCode >= 400) {
                reject(new Error(response.statusCode))
            }

            resolve(response);
        })
    });
};

describe("Dota Trivia Core", () => {
    describe("GET /", () => {
        it("has properly working session", done => {
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

        it("gives the same question, if it has no proper answer", done => {
            let itemName = "";
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
});