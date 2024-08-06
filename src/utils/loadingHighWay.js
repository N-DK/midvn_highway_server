const { createPromise } = require('.');

let cachedResults = null;

function initData() {
    console.time('Loading data');

    const highways = createPromise('highways');
    // const trunks = createPromise('trunks');

    let netKeys = {};
    let data = {};

    const processItems = (items) => {
        items
            .filter((item) => item.isDelete !== 1)
            .forEach((item) => {
                for (const [key, value] of Object.entries(item.keyData)) {
                    if (netKeys[key]) {
                        netKeys[key] = [...netKeys[key], ...value];
                    } else {
                        netKeys[key] = value;
                    }
                }
                for (const [key, value] of Object.entries(item.hData)) {
                    if (value.isDelete !== 1) {
                        data[key] = value;
                    }
                }
            });
    };

    processItems(highways);
    // processItems(trunks);

    console.timeEnd('Loading data');

    return { netKeys, data };
}

function loadHighways() {
    if (cachedResults) {
        return cachedResults;
    }

    cachedResults = initData();

    return cachedResults;
}

function setCachedResults(results) {
    cachedResults = results;
}

module.exports = {
    setCachedResults,
    loadHighways,
    initData,
};
