const { createPromise } = require('.');
const redisModel = require('../modules/redis.model');

let cachedResults = null;
let cachedRedis = null;

async function initData() {
    console.time('LOADING DATA');

    const highways = createPromise('highways');
    // const trunks = createPromise('trunks');

    let netKeys = {};
    let data = {};

    const processItems = (items) => {
        // const deletedWayIds = items.flatMap((item) =>
        //     item.highways.flatMap((highway) =>
        //         highway.ways
        //             .filter((way) => way.isDelete === 1)
        //             .map((way) => `${highway.id}-${way.id}`),
        //     ),
        // );

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
                    // if (!deletedWayIds.some((id) => id == value?.key)) {
                    //     data[key] = value;
                    // }
                    data[key] = value;
                }
            });
    };

    processItems(highways);
    // processItems(trunks);

    console.timeEnd('LOADING DATA');

    return { netKeys, data };
}

async function initDataRedis() {
    console.time('LOADING REDIS');
    const { data: dataRedis } = await redisModel.hGetAll(
        'highways',
        'asd',
        Date.now(),
    );
    console.timeEnd('LOADING REDIS');
    return dataRedis;
}

async function loadHighways() {
    if (cachedResults) {
        return cachedResults;
    }

    cachedResults = await initData();

    return cachedResults;
}

async function loadingHighWayRedis() {
    if (cachedRedis) {
        return cachedRedis;
    }

    cachedRedis = await initDataRedis();

    return cachedRedis;
}

function setCachedResults(results) {
    cachedResults = results;
}

function setCachedRedis(results) {
    cachedRedis = results;
}

module.exports = {
    setCachedResults,
    loadHighways,
    initData,
    loadingHighWayRedis,
    initDataRedis,
    setCachedRedis,
};
