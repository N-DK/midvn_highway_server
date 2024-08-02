const autocannon = require('autocannon');
const {
    VN_REGION,
    VN_REGION_TRUNK,
    CONFIG_LOADTEST,
} = require('../../constant');
const fetchData = require('../../modules/fetchData');
const { fetchTollBoth } = require('../../modules/fetchTollBoth');
const {
    loadHighways,
    setCachedResults,
} = require('../../modules/loadingHighWay');
const { isPointInHighway, createPromise } = require('../../utils');
const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');

const insertData = async (req, res, col) => {
    try {
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: 'Missing data' });
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
                (item) => item.highway_name === data.highways[0].highway_name,
            );

            if (highwayIndex >= 0) {
                const existingWays = existingRef.highways[highwayIndex].ways;
                data.highways[0].ways[0].id =
                    existingWays[existingWays.length - 1].id + 1;
                existingRef.highways[highwayIndex].ways.push(
                    data.highways[0].ways[0],
                );
            } else {
                data.highways[0].id =
                    existingRef.highways[existingRef.highways.length - 1].id +
                    1;
                data.highways[0].ways[0].id = 1;
                existingRef.highways.push(data.highways[0]);
            }

            const index = collections.indexOf(existingRef);
            fs.writeFileSync(
                `./src/common/${col}/${col}-${index}.json`,
                JSON.stringify(existingRef),
            );
            setCachedResults(null);
            loadHighways();
            return res.json(collections[index]);
        } else {
            data.id = collections.length;
            data.highways[0].id = 0;
            data.highways[0].ways[0].id = 0;
            fs.writeFileSync(
                `./src/common/${col}/${col}-${collections.length}.json`,
                JSON.stringify(data),
            );
            setCachedResults(null);
            loadHighways();
            return res.json(collections[collections.length - 1]);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const pullData = async (res, col, type) => {
    try {
        const data = await fetchData(type);
        if (data.length > 0) {
            data.forEach((item, index) => {
                fs.writeFileSync(
                    `./src/common/${col}/${col}-${index}.json`,
                    JSON.stringify(item),
                );
            });

            return res.json({ message: 'Success' });
        } else {
            return res.json({ message: 'No data' });
        }
    } catch (error) {
        console.error(error);
    }
};

const deleteAndRestoreData = async (req, res, col, isDelete) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (!data) {
            return res.status(400).json({ message: 'Missing data' });
        }
        const filePath = path.join(`./src/common/${col}`, `${col}-${id}.json`);
        const highway = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data?.indexs?.length === 0) {
            highway.isDelete = isDelete;
            highway.highways.forEach((item) => {
                item.isDelete = isDelete;
            });
        } else {
            data?.indexs?.forEach((index) => {
                highway.highways[index].isDelete = isDelete;
            });
            if (
                highway.highways.length === data.indexs.length ||
                highway.highways.every((item) => item.isDelete === 0)
            )
                highway.isDelete = isDelete;
        }
        fs.writeFileSync(filePath, JSON.stringify(highway));
        setCachedResults(null);
        loadHighways();
        return res.json(highway);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

const updateDate = async (req, res, col) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const keys = data?.key.split('-');
        if (!data) {
            return res.status(400).json({ message: 'Missing data' });
        }
        const filePath = path.join(`./src/common/${col}`, `${col}-${id}.json`);
        const highway = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        switch (keys.length) {
            case 1: {
                highway.highways[keys[0]].maxSpeed = data.max_speed;
                highway.highways[keys[0]].minSpeed = data.min_speed;
                if (data.name)
                    highway.highways[keys[0]].highway_name = data.name;
                fs.writeFileSync(filePath, JSON.stringify(highway));
                setCachedResults(null);
                loadHighways();
                return res.json(highway);
            }
            case 2: {
                highway.highways[keys[0]].ways[keys[1]].maxSpeed =
                    data.max_speed;
                highway.highways[keys[0]].ways[keys[1]].minSpeed =
                    data.min_speed;
                highway.highways[keys[0]].ways[keys[1]].way_name = data.name;
                fs.writeFileSync(filePath, JSON.stringify(highway));
                setCachedResults(null);
                loadHighways();
                return res.json(highway);
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

class APIController {
    async index(req, res, next) {
        res.json({ message: 'Hello World' });
    }
    // [GET] /api/v1/check-way?lat=10.762622&lng=106.660172
    async getHighways(req, res, next) {
        if (!req.query.lat || !req.query.lng) {
            return res.json({ message: 'Missing lat or lng' });
        }

        try {
            const results = await loadHighways();
            const point = [req.query.lat, req.query.lng];

            // Sử dụng for...of thay vì map để tránh gửi phản hồi quá sớm
            const highwaysInBounds = [];
            for (const ref of results) {
                const inBounds = isPointInHighway(point, ref.highways);
                if (inBounds.isInBounds) {
                    highwaysInBounds.push({
                        _id: ref._id,
                        ref: ref.ref,
                        highway_name: inBounds.highway_name,
                        max_speed: inBounds.max_speed ?? null,
                        min_speed: inBounds.min_speed ?? null,
                        is_in_bounds: inBounds.isInBounds,
                    });
                }
            }

            if (highwaysInBounds.length > 0) {
                return res.json(highwaysInBounds[0]); // Trả về highway đầu tiên tìm thấy
            } else {
                return res.json({ is_in_bounds: false });
            }
        } catch (error) {
            // console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    // [GET] /api/v1/search?lat=10.762622&lng=106.660172&collection=highways
    async search(req, res, next) {
        if (!req.query.lat || !req.query.lng || !req.query.collection) {
            return res.json({ message: 'Missing lat or lng or collection' });
        }

        try {
            const results = await createPromise(req.query.collection);
            const promises = results.map(async (ref) => {
                const point = [
                    Number(req.query.lat).toFixed(7),
                    Number(req.query.lng).toFixed(7),
                ];
                const inBounds = isPointInHighway(point, ref.highways);
                if (inBounds.isInBounds) {
                    return res.json({
                        _id: ref.id,
                        ref: ref.ref,
                        highway_name: inBounds.highway_name,
                        max_speed: inBounds.max_speed ?? null,
                        min_speed: inBounds.min_speed ?? null,
                        is_in_bounds: inBounds.isInBounds,
                        key: `${ref.id}-${inBounds.key}`,
                    });
                }
            });

            const result = (await Promise.all(promises)).filter(Boolean);
            if (result.length === 0) return res.json({ is_in_bounds: false });
        } catch (error) {}
    }

    // [GET] /api/v1/highways/pull
    async pullHighways(req, res, next) {
        pullData(res, 'highways', VN_REGION);
    }

    // [GET] /api/v1/trunks/pull
    async pullTrunks(req, res, next) {
        pullData(res, 'trunks', VN_REGION_TRUNK);
    }

    // [GET] /api/v1/tollboths/pull
    async pullTollBoths(req, res, next) {
        try {
            const data = await fetchTollBoth();
            if (data.length > 0) {
                data.forEach((item, index) => {
                    fs.writeFileSync(
                        `./src/common/tollboths/tollboths-${index}.json`,
                        JSON.stringify(item),
                    );
                });

                return res.json({ message: 'Success' });
            } else {
                return res.json({ message: 'No data' });
            }
        } catch (error) {
            console.error(error);
        }
    }

    // [GET] /api/v1/highways/get-all
    async getAllHighways(req, res, next) {
        try {
            // const highways = await Highway.find({}).exec();
            const highways = createPromise('highways');
            return res.json(highways);
        } catch (error) {
            // console.error(error);
        }
    }

    // [GET] /api/v1/trunk/get-all
    async getAllTrunks(req, res, next) {
        try {
            // const trunks = await Trunk.find({}).exec();
            const trunks = createPromise('trunks');
            return res.json(trunks);
        } catch (error) {
            // console.error(error);
        }
    }

    // [GET] /api/v1/tollboths/get-all
    async getAllTollBoths(req, res, next) {
        try {
            const tollboths = createPromise('tollboths');
            return res.json(tollboths);
        } catch (error) {
            // console.error(error);
        }
    }

    // [POST] /api/v1/highways
    async insertHighway(req, res, next) {
        await insertData(req, res, 'highways');
    }

    // [POST] /api/v1/trunk
    async insertTrunk(req, res, next) {
        await insertData(req, res, 'trunks');
    }

    // [PUT] /api/v1/highways/delete/:id
    async deleteHighway(req, res, next) {
        deleteAndRestoreData(req, res, 'highways', 1);
    }

    // [PUT] /api/v1/trunks/delete/:id
    async deleteTrunk(req, res, next) {
        deleteAndRestoreData(req, res, 'trunks', 1);
    }

    // [PUT] /api/v1/tollboths/delete/:id
    async deleteTollBoth(req, res, next) {
        deleteAndRestoreData(req, res, 'tollboths', 1);
    }

    // [PUT] /api/v1/highways/update/:id
    async updateHighway(req, res, next) {
        updateDate(req, res, 'highways');
    }

    // [PUT] /api/v1/trunks/update/:id
    async updateTrunk(req, res, next) {
        updateDate(req, res, 'trunks');
    }

    // [PUT] /api/v1/highways/restore/:id
    async restoreHighway(req, res, next) {
        deleteAndRestoreData(req, res, 'highways', 0);
    }

    // [PUT] /api/v1/trunks/restore/:id
    async restoreTrunk(req, res, next) {
        deleteAndRestoreData(req, res, 'trunks', 0);
    }

    // [PUT] /api/v1/tollboths/restore/:id
    async restoreTollBoth(req, res, next) {
        deleteAndRestoreData(req, res, 'tollboths', 0);
    }

    // [GET] /api/v1/load-test
    async loadTest(req, res, next) {
        autocannon(CONFIG_LOADTEST, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            } else {
                return res.json({
                    requests_per_second: result.requests.average,
                    total_requests: result.requests.total,
                    duration: result.duration,
                });
            }
        });
    }
}

module.exports = new APIController();
