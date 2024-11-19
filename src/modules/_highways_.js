const swith = require('../utils/switch');
const { isPointInBounds, createPromise, bufferPolyline } = require('../utils');
const turf = require('@turf/turf');
const path = require('path');
const fs = require('fs');
const fetchData = require('../utils/fetchData');
const { loadHighways } = require('../utils/loadingHighWay');
const getWays = require('./getway');

const vehicleData = {
    3: {
        name: 'Xe ô tô con',
        type: 11,
        maxSpeed: 90,
        minSpeed: 80,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1717273260256,
        endDate: 1721358556447,
    },
    4: {
        name: 'Xe ô tô chở người đến 30 chỗ (trừ xe buýt)',
        type: 12,
        maxSpeed: 90,
        minSpeed: 80,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1717273373286,
        endDate: 1721358594242,
    },
    6: {
        name: 'Ô tô tải có trọng tải nhỏ hơn hoặc bằng 3,5 tấn',
        type: 10,
        maxSpeed: 90,
        minSpeed: 80,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1717273489882,
        endDate: 1721358651346,
    },
    15: {
        name: 'Xe ô tô chở người trên 30 chỗ (trừ xe buýt)',
        type: 12,
        maxSpeed: 80,
        minSpeed: 70,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358682255,
        endDate: null,
    },
    17: {
        name: 'Ô tô tải có trọng tải trên 3,5 tấn (trừ ô tô xi téc)',
        type: 10,
        maxSpeed: 80,
        minSpeed: 70,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358702555,
        endDate: null,
    },
    19: {
        name: 'Ô tô buýt',
        type: 12,
        maxSpeed: 70,
        minSpeed: 60,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358729061,
        endDate: null,
    },
    21: {
        name: 'Ô tô đầu kéo kéo sơ mi rơ moóc',
        type: 8,
        maxSpeed: 70,
        minSpeed: 60,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358752617,
        endDate: 1724923649269,
    },
    23: {
        name: 'Xe mô tô',
        type: 13,
        maxSpeed: 70,
        minSpeed: 60,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358774968,
        endDate: null,
    },
    25: {
        name: 'Ô tô chuyên dùng (trừ ô tô trộn vữa, ô tô trộn bê tông)',
        type: 10,
        maxSpeed: 70,
        minSpeed: 60,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358797030,
        endDate: null,
    },
    27: {
        name: 'Ô tô kéo rơ moóc',
        type: 8,
        maxSpeed: 60,
        minSpeed: 50,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358819649,
        endDate: 1724923657754,
    },
    29: {
        name: 'Ô tô kéo xe khác',
        type: 10,
        maxSpeed: 60,
        minSpeed: 50,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358837561,
        endDate: null,
    },
    31: {
        name: 'Ô tô trộn vữa',
        type: 10,
        maxSpeed: 60,
        minSpeed: 50,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358855868,
        endDate: null,
    },
    33: {
        name: 'Ô tô trộn bê tông',
        type: 15,
        maxSpeed: 60,
        minSpeed: 50,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358873578,
        endDate: 1730167339181,
    },
    35: {
        name: 'Ô tô xi téc',
        type: 10,
        maxSpeed: 60,
        minSpeed: 50,
        isActive: 1,
        isDelete: 0,
        isPremium: 0,
        startDate: 1721358895665,
        endDate: null,
    },
};

const highwayModule = {
    isInside(way, point) {
        const bounds = way?.bounds;

        const polygon = way?.buffer_geometry;

        const pointLatLng = swith.getLatLng(point);
        const boundsLatLng = bounds?.map?.((p) => swith.getLatLng(p));

        const isInBounds = geolib.isPointInPolygon(pointLatLng, boundsLatLng);

        if (!isInBounds) return false;

        const polygonLatLng = polygon?.map?.((p) => swith.getLatLng(p));
        const isInPolygon = geolib.isPointInPolygon(pointLatLng, polygonLatLng);

        return isInPolygon;
    },
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

            // console.log(netKeys?.[key]);

            const returnObj = {
                // net_key: key,
                is_in_bounds: false,
                result: 0,
            };
            const boundList = netKeys?.[key] || [];

            if (!boundList?.length) return returnObj;

            let hReturn = {};

            for (let wayId of boundList) {
                const way = data?.[wayId];

                // console.log(way, wayId);

                const isInside = isPointInBounds(
                    [lat, lng],
                    way?.buffer_geometry,
                );

                if (isInside) {
                    hReturn = way;
                    returnObj.is_in_bounds = true;
                    returnObj['result'] =
                        wayId?.split('-')[0] === 'trunks' ? 2 : 1;

                    break;
                }
            }

            if (!hReturn?.id) return returnObj;

            returnObj['max_speed'] = hReturn?.['maxSpeed'] ?? null;
            returnObj['min_speed'] = hReturn?.['minSpeed'] ?? null;

            return returnObj;
        },
    },
    insertData: async (req, col) => {
        try {
            const data = req.body;
            if (!data) {
                return { success: false, data: { message: 'Missing data' } };
            }

            const collections = createPromise(col);

            const existingRef = collections.find((ref) => ref.ref === data.ref);

            // Iterate over highways
            data.highways.forEach((highway) => {
                highway.ways.forEach((way) => {
                    const nodes = way.nodes;
                    let maxLat = -Infinity,
                        minLat = Infinity,
                        maxLng = -Infinity,
                        minLng = Infinity;

                    // Calculate bounds for each way
                    nodes.forEach(([lng, lat]) => {
                        if (lat > maxLat) maxLat = lat;
                        if (lat < minLat) minLat = lat;
                        if (lng > maxLng) maxLng = lng;
                        if (lng < minLng) minLng = lng;
                    });

                    way.bounds = [
                        [minLat, minLng],
                        [maxLat, maxLng],
                    ];

                    // Create buffered geometry for each way
                    const line = turf.lineString(
                        nodes.map(([lng, lat]) => [lat, lng]),
                    );
                    const bufferedLine = turf.buffer(line, 15, {
                        units: 'meters',
                    });
                    const bufferedLineCoords =
                        bufferedLine.geometry.coordinates[0].map(
                            ([lat, lng]) => [lng, lat],
                        );
                    way.buffer_geometry = bufferedLineCoords;
                });
            });

            if (existingRef) {
                // Update existing reference
                data.highways.forEach((newHighway) => {
                    const highwayIndex = existingRef.highways.findIndex(
                        (item) => item.highway_name === newHighway.highway_name,
                    );

                    if (highwayIndex >= 0) {
                        const existingWays =
                            existingRef.highways[highwayIndex].ways;

                        newHighway.ways.forEach((newWay) => {
                            newWay.id =
                                existingWays.length > 0
                                    ? existingWays[existingWays.length - 1].id +
                                      1
                                    : 0;
                            existingWays.push(newWay);
                        });
                    } else {
                        newHighway.id =
                            existingRef.highways.length > 0
                                ? existingRef.highways[
                                      existingRef.highways.length - 1
                                  ].id + 1
                                : 0;

                        newHighway.ways.forEach((newWay, index) => {
                            newWay.id = index;
                        });

                        existingRef.highways.push(newHighway);
                    }
                });

                const index = collections.indexOf(existingRef);

                const newDoc = {
                    ...existingRef,
                    hData: getWays(existingRef.highways, existingRef.ref, col)
                        .hData,
                    keyData: getWays(existingRef.highways, existingRef.ref, col)
                        .keyData,
                    highways: existingRef.highways,
                };

                fs.writeFileSync(
                    `./src/common/${col}/${col}-${index}.json`,
                    JSON.stringify(newDoc),
                );

                return { success: true, data: collections[index] };
            } else {
                // Create new reference
                data.id = collections.length;

                data.highways.forEach((highway, highwayIndex) => {
                    highway.id = highwayIndex;
                    highway.ways.forEach((way, wayIndex) => {
                        way.id = wayIndex;
                    });
                });

                const newDoc = {
                    id: data.id,
                    ref: data.ref,
                    hData: getWays(data.highways, data.ref, col).hData,
                    keyData: getWays(data.highways, data.ref, col).keyData,
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
            const data = await fetchData(col, region);
            if (data?.length > 0) {
                data.forEach((item, index) => {
                    const path = `./src/common/${col}/${col}-${index}.json`;
                    fs.writeFileSync(path, JSON.stringify(item));
                });

                return { success: true, data: { message: 'success' } };
            }
        } catch (error) {
            console.error(error);
        }
    },

    zoomBufferGeometry: (col, size) => {
        const length = fs.readdirSync(`./src/common/${col}`).length;

        for (let i = 0; i < length; i++) {
            try {
                const filePath = `./src/common/${col}/${col}-${i}.json`;
                let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                Object.keys(data.hData).forEach((key) => {
                    const nodes = data.hData[key].nodes;
                    data.hData[key].buffer_geometry = bufferPolyline(
                        nodes,
                        size,
                    );
                });

                data.highways.forEach((highway) => {
                    highway.ways.forEach((way) => {
                        way.buffer_geometry = bufferPolyline(way.nodes, size);
                    });
                });

                fs.writeFileSync(filePath, JSON.stringify(data));
            } catch (error) {
                console.log(error);
            }
        }
    },

    deleteAndRestoreData: (req, col, isDelete) => {
        try {
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
            } else if (data?.indexsWay?.length === 0) {
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
            } else {
                data?.indexsWay?.forEach((index) => {
                    highway.highways[data.indexs[0]].ways[index].isDelete =
                        isDelete;
                });

                const hDataObjects = highwayModule.findObjectByKeyValue(
                    highway.hData,
                    'way_id',
                    data?.indexsWay?.[0],
                );

                for (const hDataObject of hDataObjects) {
                    const hDataKey = Object.keys(hDataObject)[0];
                    if (hDataKey) {
                        hDataObject[hDataKey].isDelete = isDelete;
                        highway.hData[hDataKey] = hDataObject[hDataKey];
                    }
                }
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
                if (data.name && data.name.trim() !== '')
                    target.way_name = data.name;
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
