var request = require("request");

const baseUrl = "http://localhost:3000";

describe("Dota Trivia Core", function(){
    describe("GET /", function() {
        it("has properly working session", function (done){
            request.get(baseUrl, function(error, response, body) {
                expect(response.statusCode).toBe(200);
                
                // fire second request
                request.get(baseUrl, function(error, response, body) {
                    expect(response.statusCode).toBe(200);
                    done();
                });
            });
        });
    });
});