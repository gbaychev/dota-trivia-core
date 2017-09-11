let DotaItemStore = require('../app/DotaItemStore');

module.exports = class DotaItemStoreHelper extends DotaItemStore {
    constructor() {
        super();
    }

    getComponentsForItem(itemName) {
        let result = Object.keys(this.itemsToPickFrom).filter(item => item === itemName);
        if(result.length != 1) {
            return;
        }

        return this.itemsToPickFrom[result[0]].components;
    }

    getNonAnswer(itemName) {
        let possibleItems = Object.keys(this.itemsToPickFrom).filter(item => item !== itemName);
        if(possibleItems.length == 0) {
            return;
        }
        let itemSlot = Math.floor(Math.random() * 10000) % possibleItems.length;

        return Object.values(this.itemsToPickFrom)[itemSlot].components;
    }
};