const swith = require('../utils/switch');
const { isPointInBounds } = require('../utils');
const { loadHighways } = require('./loadingHighWay');

const highwayModule = {
    checker: {
        highway(lat, lng, accessKey) {
            const key = swith.getKeyFloor2([lat, lng])?.key;
            const highway = loadHighways();

            var netKeys = highway.netKeys;
            var data = highway.data;

            const returnObj = {
                netKey: key,
                isIn: 0,
            };
            const boundList = netKeys?.[key] || [];

            if (!boundList?.length) return returnObj;

            let hReturn = {};

            for (let wayId of boundList) {
                const way = data?.[wayId];

                const isInside = isPointInBounds(
                    [lat, lng],
                    way?.buffer_geometry,
                );
                if (isInside) {
                    hReturn = way;
                    returnObj.isIn = 1;
                    break;
                }
            }

            if (!hReturn?.id) return returnObj;

            accessKey?.map?.((key) => {
                returnObj[key] = hReturn?.[key];
            });

            return returnObj;
        },
        trunk(lat, lng, accessKey) {
            const key = swith.getKeyFloor2([lat, lng])?.key;

            const netKeys = trunkNetKey;
            const data = trunkData;

            const returnObj = {
                netKey: key,
                isIn: 0,
            };

            const boundList = netKeys?.[key] || [];
            if (!boundList?.length) return returnObj;
            let hReturn = {};

            for (let wayId of boundList) {
                const way = data?.[wayId];
                const isInside = highwayModule.isInside(way, [lat, lng]);

                if (isInside) {
                    hReturn = way;
                    returnObj.isIn = 1;
                    break;
                }
            }

            if (!hReturn?.id) return returnObj;

            accessKey?.map?.((key) => {
                returnObj[key] = hReturn?.[key];
            });

            return returnObj;
        },
    },
};

module.exports = highwayModule;
