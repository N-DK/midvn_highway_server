const { createPromise } = require('../utils');

let cachedResults = null;

async function loadHighways() {
    if (!cachedResults) {
        console.time('Loading data');
        const highways = createPromise('highways').filter(
            (item) => item.isDelete !== 1,
        );
        const trunks = createPromise('trunks').filter(
            (item) => item.isDelete !== 1,
        );
        console.timeEnd('Loading data');
        cachedResults = [...highways, ...trunks];

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
