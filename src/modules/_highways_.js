const swith = require('../utils/switch');
const { isPointInBounds, createPromise } = require('../utils');
const turf = require('@turf/turf');
const path = require('path');
const fs = require('fs');
const fetchData = require('../utils/fetchData');
const { loadHighways } = require('../utils/loadingHighWay');
const getWays = require('./getway');

const highwayModule = {
    findObjectByKeyValue: (obj, targetKey, targetValue) => {
        const results = [];

        for (const [key, value] of Object.entries(obj)) {
            if (value[targetKey] === targetValue) {
                results.push({ [key]: value });
            }
        }
        return results;
    },
    checker: {
        highway(lat, lng, accessKey) {
            const key = swith.getKeyFloor2([lat, lng])?.key;
            const highway = loadHighways();

            var netKeys = highway.netKeys;
            var data = highway.data;

            const returnObj = {
                net_key: key,
                is_in_bounds: false,
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
                    returnObj.is_in_bounds = true;
                    break;
                }
            }

            if (!hReturn?.id) return returnObj;

            // accessKey?.map?.((key) => {
            //     returnObj[key] = hReturn?.[key];
            // });
            returnObj['max_speed'] = hReturn?.['maxSpeed'] ?? null;
            returnObj['min_speed'] = hReturn?.['minSpeed'] ?? null;
            returnObj['highway_name'] = hReturn?.['name'];
            returnObj['ref'] = hReturn?.['id'].split('-')[0];
            returnObj['lanes'] = hReturn?.['lanes'];

            return returnObj;
        },
    },
    insertData: async (req, col) => {
        try {
            const data = req.body;
            if (!data) {
                return { success: false, data: { message: 'Missing data' } };
            }

            const nodes = data.highways[0].ways[0].nodes;
            let maxLat = -Infinity,
                minLat = Infinity,
                maxLng = -Infinity,
                minLng = Infinity;

            nodes.forEach(([lng, lat]) => {
                if (lat > maxLat) maxLat = lat;
                if (lat < minLat) minLat = lat;
                if (lng > maxLng) maxLng = lng;
                if (lng < minLng) minLng = lng;
            });

            data.highways[0].ways[0].bounds = [
                [minLat, minLng],
                [maxLat, maxLng],
            ];

            const line = turf.lineString(nodes.map(([lng, lat]) => [lat, lng]));
            const bufferedLine = turf.buffer(line, 15, { units: 'meters' });
            const bufferedLineCoords = bufferedLine.geometry.coordinates[0].map(
                ([lat, lng]) => [lng, lat],
            );
            data.highways[0].ways[0].buffer_geometry = bufferedLineCoords;

            const collections = createPromise(col);

            const existingRef = collections.find((ref) => ref.ref === data.ref);

            if (existingRef) {
                const highwayIndex = existingRef.highways.findIndex(
                    (item) =>
                        item.highway_name === data.highways[0].highway_name,
                );

                if (highwayIndex >= 0) {
                    const existingWays =
                        existingRef.highways[highwayIndex].ways;
                    data.highways[0].ways[0].id =
                        existingWays[existingWays.length - 1].id + 1;
                    existingRef.highways[highwayIndex].ways.push(
                        data.highways[0].ways[0],
                    );
                } else {
                    data.highways[0].id =
                        existingRef.highways[existingRef.highways.length - 1]
                            .id + 1;
                    data.highways[0].ways[0].id = 1;
                    existingRef.highways.push(data.highways[0]);
                }

                const index = collections.indexOf(existingRef);

                const newDoc = {
                    ...existingRef,
                    hData: getWays(existingRef.highways, existingRef.ref).hData,
                    keyData: getWays(existingRef.highways, existingRef.ref)
                        .keyData,
                    highways: existingRef.highways,
                };
                fs.writeFileSync(
                    `./src/common/${col}/${col}-${index}.json`,
                    JSON.stringify(newDoc),
                );
                return { success: true, data: collections[index] };
            } else {
                data.id = collections.length;
                data.highways[0].id = 0;
                data.highways[0].ways[0].id = 0;

                const newDoc = {
                    id: data.id,
                    ref: data.ref,
                    hData: getWays(data.highways, data.ref).hData,
                    keyData: getWays(data.highways, data.ref).keyData,
                    highways: data.highways,
                };

                fs.writeFileSync(
                    `./src/common/${col}/${col}-${collections.length}.json`,
                    JSON.stringify(newDoc),
                );
                return { success: true, data: newDoc };
            }
        } catch (error) {
            console.error(error);
            return { success: false, data: { message: error.message } };
        }
    },

    pullData: async (col, region) => {
        try {
            const data = await fetchData(region);
            if (data.length > 0) {
                data.forEach((item, index) => {
                    fs.writeFileSync(
                        `./src/common/${col}/${col}-${index}.json`,
                        JSON.stringify(item),
                    );
                });

                return { success: true, data: { message: 'success' } };
            }
        } catch (error) {
            console.error(error);
        }
    },

    deleteAndRestoreData: (req, col, isDelete) => {
        try {
            console.log(req);

            const { id } = req.params;
            const data = req.body;
            if (!data) {
                return { success: false, data: { message: 'Missing data' } };
            }
            const filePath = path.join(
                `./src/common/${col}`,
                `${col}-${id}.json`,
            );
            const highway = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (data?.indexs?.length === 0) {
                highway.isDelete = isDelete;
                highway.highways.forEach((item) => {
                    item.isDelete = isDelete;
                });
                Object.keys(highway.hData).forEach((key) => {
                    highway.hData[key].isDelete = isDelete;
                });
            } else {
                data?.indexs?.forEach((index) => {
                    highway.highways[index].isDelete = isDelete;
                });
                const hDataObjects = highwayModule.findObjectByKeyValue(
                    highway.hData,
                    'highway_id',
                    data?.indexs?.[0],
                );
                for (const hDataObject of hDataObjects) {
                    const hDataKey = Object.keys(hDataObject)[0];
                    if (hDataKey) {
                        hDataObject[hDataKey].isDelete = isDelete;
                        highway.hData[hDataKey] = hDataObject[hDataKey];
                    }
                }
                if (
                    highway.highways.length === data.indexs.length ||
                    highway.highways.every((item) => item.isDelete === isDelete)
                )
                    highway.isDelete = isDelete;
            }
            fs.writeFileSync(filePath, JSON.stringify(highway));
            return { success: true, data: highway };
        } catch (error) {
            console.log(error);
            return { success: false, data: { message: error.message } };
        }
    },

    updateDate: async (req, col) => {
        try {
            const { id } = req.params;
            const data = req.body;

            if (!data || !data.key) {
                return { success: false, data: { message: 'Missing data' } };
            }

            const keys = data.key.split('-');
            const filePath = path.join(
                `./src/common/${col}`,
                `${col}-${id}.json`,
            );
            const highway = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            if (!highway || !highway.highways || keys.length < 1) {
                return { success: false, data: { message: 'Invalid key' } };
            }

            const updateHighwayData = (target, data) => {
                target.maxSpeed = data.max_speed;
                target.minSpeed = data.min_speed;
                if (data.name) target.highway_name = data.name;
            };

            const updateWayData = (target, data) => {
                target.maxSpeed = data.max_speed;
                target.minSpeed = data.min_speed;
                target.name = data.name;
            };

            switch (keys.length) {
                case 1:
                    if (highway.highways[keys[0]]) {
                        updateHighwayData(highway.highways[keys[0]], data);
                        fs.writeFileSync(filePath, JSON.stringify(highway));
                        return { success: true, data: highway };
                    }

                case 2:
                    if (
                        highway.highways[keys[0]] &&
                        highway.highways[keys[0]].ways[keys[1]]
                    ) {
                        updateWayData(
                            highway.highways[keys[0]].ways[keys[1]],
                            data,
                        );

                        const hDataObject = highwayModule.findObjectByKeyValue(
                            highway.hData,
                            'key',
                            data.key,
                        )[0];
                        const hDataKey = Object.keys(hDataObject)[0];
                        if (hDataObject) {
                            if (hDataKey) {
                                updateWayData(hDataObject[hDataKey], data);
                                highway.hData[hDataKey] = hDataObject[hDataKey];
                            }
                        }
                        fs.writeFileSync(filePath, JSON.stringify(highway));
                        return {
                            success: true,
                            data: highway.hData[hDataKey],
                        };
                    }

                default:
                    return { success: false, data: { message: 'Invalid key' } };
            }
        } catch (error) {
            console.error(error);
            // return res.status(500).json({ message: error.message });
        }
    },
};

module.exports = highwayModule;
