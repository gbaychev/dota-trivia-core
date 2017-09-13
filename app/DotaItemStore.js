const http = require('http');
const winston = require('winston');

module.exports = class DotaItemStore {

    constructor() {
        this.items = null;
        this.initialized = false;
        this.itemsToPickFrom = {};
        this.itemsToPickFromCount = 0;
        this.itemsComponents = new Array();
        this.itemsComponentsCount = 0;
        this.parseRequest = (rawData) => {
            this.items = JSON.parse(rawData).itemdata;
            if(this.items === undefined) {
                throw new Error('Could not parse items from the dota2 site');
            }
            this.postProcessItems();
            this.initialized = true;
        };
    }

    /*
     * Fetches the item information from dota2.com
     */
    initialize() {
        return new Promise((resolve, reject) => {
            http.get('http://www.dota2.com/jsfeed/itemdata', (res) => {
                const { statusCode } = res;

                if (statusCode != 200) {
                    winston.error(`Request Failed. Status Code: ${statusCode}`);
                    res.resume();
                    reject(new Error(statusCode));
                }

                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', chunk => rawData += chunk);
                res.on('end', () => {
                    try {
                        this.parseRequest(rawData);
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', (e) => {
                winston.error(`Error while initializing item store: ${e.message}`);
                reject(e);
            });
        });
    }

    /*
     * Currently there are the following group if items
     * "component" count 44
     * "secret_shop" count 12
     * "consumable" count 15
     * "common" count 17
     * "epic" count 29
     * "rare" count 33
     * "artifact" count 16
     * "false" count 1 (shadow amulet, wtf?)
     * We need rare and above
     * 
     * The information is structured as follows
     * {
     *  abysal_blade: { ...},
     *  blink_dagger: { ...}
     *  etc...
     * }
     * 
     * So, Object.keys(this.items) are the item names
     * and Object.values(this.items) - the items stats.
     * 
     * This functions extract items usable for the game and calculates the needed
     * components for a item
     */
    postProcessItems() {
        let itemKeys =  Object.keys(this.items).filter(key => {
            return (this.items[key].qual == 'epic' ||
                   this.items[key].qual == 'rare' ||
                   this.items[key].qual == 'artifact') &&
                   this.items[key].components !== null;
        });

        itemKeys.forEach(k => {
            let components = new Array();
            this.calculateNeededComponents(components, this.items[k]);
            this.itemsToPickFrom[k] =  Object.assign(this.items[k], { name: k, needed_components: components });
            this.itemsToPickFromCount++;
        });

        let componentKeys = Object.keys(this.items).filter(key => {
            return this.items[key].qual == 'component';
        });

        componentKeys.forEach(k => {
            this.itemsComponents.push(Object.assign(this.items[k], {name : k}));
        });
    }

    /*
     * calculates the neccessary components to build an item
     * @param components: array, containing the needed components
     * @param item: the item, whose components are being calculated
     */
    calculateNeededComponents(components, item) {
        if(item == null) {
            return;
        }

        if(item.components == null || item.qual == 'component')  {
            components.push(item);
            return;
        }

        item.components.forEach(c => {
            this.calculateNeededComponents(components, this.items[c]);
        });
    }

    /*
     * Selects an item for the next question of the game
     * @returns an item, containg the needed and filler components
     */
    pickItem () {
        let itemSlot = Math.floor(Math.random() * 10000) % this.itemsToPickFromCount;
        let item = Object.values(this.itemsToPickFrom)[itemSlot];
        let fillerComponents = this.pickFillerComponents(item);

        return Object.assign(item, { fillerComponents });
    }

    /*
     * Picks filler components for an item. This filler components are actually
     * the wrong answer to a question
     * @returns - an array, containing the filler components
     */
    pickFillerComponents(item) {
        let fillers = new Array();
        let neededFillerComponentsCount = Math.max(Math.floor((3 * item.needed_components.length) / 4), 2);
        let actualFillerComponents = this.itemsComponents.filter(c => {
            return !item.needed_components.some(nc => nc.name === c.name);
        });

        for(let i = 0; i < neededFillerComponentsCount; i++) {
            let itemSlot = (Math.floor(Math.random() * 10000)) % actualFillerComponents.length;
            fillers.push(actualFillerComponents[itemSlot]);
        }

        return fillers;
    }
};