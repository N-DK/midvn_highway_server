module.exports = async (lat, lng) => {
    const key = swith.getKeyFloor2([lat, lng])?.key;
    const luaScript = `
        if redis.call("GET", KEYS[1]) == '1' then
             redis.call("DECR", KEYS[1])
             return 1
        end return 0`;
    const { data } = await redisModel.eval(luaScript, 1, 'update_highway');
    if (data === 1) {
        setCachedRedis(await initDataRedis());
    }
    const highway = await loadingHighWayRedis();

    // var netKeys = highway.netKeys;
    // var data = highway.data;

    // console.log(netKeys?.[key]);

    const returnObj = {
        // net_key: key,
        is_in_bounds: false,
        result: 0,
    };

    const boundList = JSON.parse(highway?.[key] || '[]');

    if (!boundList?.length) return returnObj;

    let hReturn = {};

    for (let way of boundList) {
        // const way = data?.[wayId];

        // console.log(way, wayId);

        const isInside = isPointInBounds([lat, lng], way?.buffer_geometry);

        if (isInside) {
            hReturn = way;
            returnObj.is_in_bounds = true;
            returnObj.result = 1;
            // returnObj['result'] =
            //     wayId?.split('-')[0] === 'trunks' ? 2 : 1;
            break;
        }
    }

    if (!hReturn?.id) return returnObj;

    returnObj['max_speed'] = hReturn?.['maxSpeed'] ?? null;
    returnObj['min_speed'] = hReturn?.['minSpeed'] ?? null;

    return returnObj;
};
