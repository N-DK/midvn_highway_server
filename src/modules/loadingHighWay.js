const { createPromise } = require('../utils');

let cachedResults = null;

function loadHighways() {
    if (!cachedResults) {
        console.time('Loading data');
        const highways = createPromise('highways').filter(
            (item) => item.isDelete !== 1,
        );
        const trunks = createPromise('trunks').filter(
            (item) => item.isDelete !== 1,
        );
        console.timeEnd('Loading data');
        // cachedResults = [...highways, ...trunks];
        var netKeys = {};
        var data = {};
        highways.forEach((h) => {
            Object.keys(h.keyData).forEach((key) => {
                netKeys[key] = h.keyData[key];
            });
            Object.keys(h.hData).forEach((key) => {
                data[key] = h.hData[key];
            });
        });
        cachedResults = {
            netKeys,
            data,
        };

        return cachedResults;
    } else if (cachedResults) {
        return cachedResults;
    }
}

function setCachedResults(results) {
    cachedResults = results;
}

module.exports = {
    setCachedResults,
    loadHighways,
};
