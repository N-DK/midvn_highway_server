const redisModel = require('../modules/redis.model');
const { loadHighways } = require('./loadingHighWay');

module.exports = async () => {
    console.time('SAVE TO REDIS');
    const highway = await loadHighways();

    var netKeys = highway.netKeys;
    var data = highway.data;

    Object.keys(netKeys).forEach(
        async (key) =>
            await redisModel.hSet(
                'highways',
                key,
                JSON.stringify(
                    netKeys?.[key].map((item) => ({
                        id: data?.[item]?.id,
                        name: data?.[item]?.name,
                        buffer_geometry: data?.[item]?.buffer_geometry,
                        maxSpeed: data?.[item]?.maxSpeed,
                        minSpeed: data?.[item]?.minSpeed,
                    })),
                ),
                'API',
                Date.now(),
            ),
    );
    console.timeEnd('SAVE TO REDIS');
};
