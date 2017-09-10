let DotaItemStore = require('../app/DotaItemStore');

module.exports = class DotaItemStoreHelper extends DotaItemStore {
    constructor() {
        super();
    }

    getComponentsForItem(itemName) {
        var result = Object.keys(this.itemsToPickFrom).filter(item => item === itemName);
        if(result.length != 1) {
            return;
        }

        return this.itemsToPickFrom[result[0]];
    }
};