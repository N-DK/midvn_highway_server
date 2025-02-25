const autocannon = require('autocannon');
const {
    VN_REGION,
    VN_REGION_TRUNK,
    CONFIG_LOADTEST,
    VN_REGION_RESIDENTIAL,
} = require('../../constants');
const { fetchTollBoth } = require('../../utils/fetchTollboth');
const { isPointInHighway, createPromise } = require('../../utils');
const fs = require('fs');
const highwayModule = require('../../modules/_highways_');
const runWorker = require('../../utils/runWorker');
const {
    setCachedResults,
    initData,
    loadHighways,
} = require('../../utils/loadingHighWay');
const { default: axios } = require('axios');
const fetchDataRelation = require('../../utils/fetchDataRelation');
const redisModel = require('../../modules/redis.model');
const saveToRedis = require('../../utils/saveToRedis');

// Khởi tạo mảng Quốc lộ với các tên đặc biệt
// const routes = [
//     'Quốc lộ 1A',
//     'Quốc lộ 1B',
//     'Quốc lộ 1C',
//     'Quốc lộ 1D',
//     'Quốc lộ 1K',
//     'Quốc lộ 2A',
//     'Quốc lộ 2B',
//     'Quốc lộ 2C',
//     'Quốc lộ 2D',
//     'Quốc lộ 3A',
//     'Quốc lộ 3B',
//     'Quốc lộ 3C',
//     'Quốc lộ 3E',
//     'Quốc lộ 4A',
//     'Quốc lộ 4B',
//     'Quốc lộ 4C',
//     'Quốc lộ 4D',
//     'Quốc lộ 4H',
//     'Quốc lộ 4E',
//     'Quốc lộ 4G',
//     'Quốc lộ 5',
//     'Quốc lộ 5C',
//     'Quốc lộ 6A',
//     'Quốc lộ 6B',
//     'Quốc lộ 7A',
//     'Quốc lộ 7B',
//     'Quốc lộ 8',
//     'Quốc lộ 8B',
//     'Quốc lộ 8C',
//     'Quốc lộ 9A',
//     'Quốc lộ 9B',
//     'Quốc lộ 9C',
//     'Quốc lộ 9D',
//     'Quốc lộ 9E',
//     'Quốc lộ 9G',
//     'Quốc lộ 10',
//     'Quốc lộ 12',
//     'Quốc lộ 12A',
//     'Quốc lộ 12B',
//     'Quốc lộ 12C',
//     'Quốc lộ 13',
//     'Quốc lộ 14A',
//     'Quốc lộ 14B',
//     'Quốc lộ 14C',
//     'Quốc lộ 14D',
//     'Quốc lộ 14E',
//     'Quốc lộ 14G',
//     'Quốc lộ 14H',
//     'Quốc lộ 15',
//     'Quốc lộ 15A',
//     'Quốc lộ 15B',
//     'Quốc lộ 15C',
//     'Quốc lộ 15D',
//     'Quốc lộ 16',
//     'Quốc lộ 17',
//     'Quốc lộ 17B',
//     'Quốc lộ 18',
//     'Quốc lộ 18C',
//     'Quốc lộ 19A',
//     'Quốc lộ 19B',
//     'Quốc lộ 19C',
//     'Quốc lộ 20',
//     'Quốc lộ 21A',
//     'Quốc lộ 21B',
//     'Quốc lộ 21C',
//     'Quốc lộ 22A',
//     'Quốc lộ 22B',
//     'Quốc lộ 23',
//     'Quốc lộ 24A',
//     'Quốc lộ 24B',
//     'Quốc lộ 24C',
//     'Quốc lộ 25',
//     'Quốc lộ 26A',
//     'Quốc lộ 26B',
//     'Quốc lộ 27A',
//     'Quốc lộ 27B',
//     'Quốc lộ 27C',
//     'Quốc lộ 28A',
//     'Quốc lộ 28B',
//     'Quốc lộ 29',
//     'Quốc lộ 30',
//     'Quốc lộ 31',
//     'Quốc lộ 32',
//     'Quốc lộ 32B',
//     'Quốc lộ 32C',
//     'Quốc lộ 34',
//     'Quốc lộ 35',
//     'Quốc lộ 37A',
//     'Quốc lộ 37B',
//     'Quốc lộ 37C',
//     'Quốc lộ 38A',
//     'Quốc lộ 38B',
//     'Quốc lộ 39A',
//     'Quốc lộ 39B',
//     'Quốc lộ 40A',
//     'Quốc lộ 40B',
//     'Quốc lộ 43',
//     'Quốc lộ 45',
//     'Quốc lộ 46A',
//     'Quốc lộ 46B',
//     'Quốc lộ 46C',
//     'Quốc lộ 47',
//     'Quốc lộ 47B',
//     'Quốc lộ 47C',
//     'Quốc lộ 48',
//     'Quốc lộ 48B',
//     'Quốc lộ 48C',
//     'Quốc lộ 48D',
//     'Quốc lộ 48E',
//     'Quốc lộ 49A',
//     'Quốc lộ 49B',
//     'Quốc lộ 49C',
//     'Quốc lộ 50',
//     'Quốc lộ 51',
//     'Quốc lộ 52',
//     'Quốc lộ 53',
//     'Quốc lộ 54',
//     'Quốc lộ 55A',
//     'Quốc lộ 55B',
//     'Quốc lộ 56',
//     'Quốc lộ 56B',
//     'Quốc lộ 57A',
//     'Quốc lộ 57B',
//     'Quốc lộ 57C',
//     'Quốc lộ 60',
//     'Quốc lộ 61A',
//     'Quốc lộ 61B',
//     'Quốc lộ 61C',
//     'Quốc lộ 62',
//     'Quốc lộ 63',
//     'Quốc lộ 70A',
//     'Quốc lộ 70B',
//     'Quốc lộ 71',
//     'Quốc lộ 80',
//     'Quốc lộ 91A',
//     'Quốc lộ 91B',
//     'Quốc lộ 91C',
//     'Quốc lộ 217',
//     'Quốc lộ 217B',
//     'Quốc lộ 279',
//     'Quốc lộ 279D',
//     'Quốc lộ 280',
//     'Quốc lộ 281',
//     'Quốc lộ N1',
//     'Quốc lộ N2',
//     'Quốc lộ Quản Lộ – Phụng Hiệp',
//     'Quốc lộ 7C',
// ];

// Thêm các tuyến đường theo dạng "Quốc lộ n"
// for (let i = 100; i > 0; i--) {
//     if (routes.indexOf(`Quốc lộ ${i}`) === -1) {
//         routes.push(`Quốc lộ ${i}`);
//     }
// }

// console.log(routes.findIndex((route) => route === 'Quốc lộ 2'));
// const refs = ['QL.24'];

// console.log(refs.length);

class APIController {
    async index(req, res, next) {
        res.json({ message: 'Hello World' });
    }

    // [GET] /api/v1/check-way?lat=10.762622&lng=106.660172
    async highwayCheck(req, res, next) {
        const params = req?.query || {};

        const { lat, lng, query } = params;

        if (!lat || !lng)
            return res.json({
                result: 0,
                message: 'No lat, lng provided',
            });
        const highway = await highwayModule?.checker?.highway(lat, lng);
        return res.json({
            ...highway,
        });
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
                        length: inBounds.length,
                    });
                }
            });

            const result = (await Promise.all(promises)).filter(Boolean);
            if (result.length === 0) return res.json({ is_in_bounds: false });
        } catch (error) {}
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
            const highways = createPromise('highways');
            return res.json(highways);
        } catch (error) {
            // console.error(error);
        }
    }

    // [GET] /api/v1/trunk/get-all
    async getAllTrunks(req, res, next) {
        try {
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

    // [GET] /api/v1/residential/get-all
    async getAllResidential(req, res, next) {
        try {
            const residential = createPromise('residential');
            return res.json(residential);
        } catch (error) {
            // console.error(error);
        }
    }

    // [GET] /api/v1/highways/pull
    async pullHighways(req, res, next) {
        try {
            await runWorker('pullData', {}, 'highways', VN_REGION);
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            res.status(200).json({ message: 'success' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

    // [GET] /api/v1/trunks/pull
    async pullTrunks(req, res, next) {
        try {
            await runWorker('pullData', {}, 'trunks', VN_REGION_TRUNK);
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            res.status(200).json({ message: 'success' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

    // [GET] /api/v1/residential/pull
    async pullResidential(req, res, next) {
        try {
            await runWorker(
                'pullData',
                {},
                'residential',
                VN_REGION_RESIDENTIAL,
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            res.status(200).json({ message: 'success' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

    // [POST] /api/v1/highways
    async insertHighway(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'insertData',
                { body, params },
                'highways',
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

    // [POST] /api/v1/trunk
    async insertTrunk(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'insertData',
                { body, params },
                'trunks',
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/highways/delete/:id
    async deleteHighway(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'deleteAndRestoreData',
                { body, params },
                'highways',
                '',
                1,
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/trunks/delete/:id
    async deleteTrunk(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'deleteAndRestoreData',
                { body, params },
                'trunks',
                '',
                1,
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/tollboths/delete/:id
    async deleteTollBoth(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'deleteAndRestoreData',
                { body, params },
                'tollboths',
                '',
                1,
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/highways/update/:id
    async updateHighway(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'updateDate',
                { body, params },
                'highways',
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/trunks/update/:id
    async updateTrunk(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'updateDate',
                { body, params },
                'trunks',
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/highways/restore/:id
    async restoreHighway(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'deleteAndRestoreData',
                { body, params },
                'highways',
                '',
                0,
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/trunks/restore/:id
    async restoreTrunk(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'deleteAndRestoreData',
                { body, params },
                'trunks',
                '',
                0,
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [PUT] /api/v1/tollboths/restore/:id
    async restoreTollBoth(req, res, next) {
        const { body, params } = req;
        try {
            const result = await runWorker(
                'deleteAndRestoreData',
                { body, params },
                'tollboths',
                '',
                0,
            );
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [GET] /api/v1/highways/zoom?size=20
    async zoomHighways(req, res, next) {
        try {
            const { size } = req.query;
            console.log(size);
            highwayModule.zoomBufferGeometry('highways', size);
            return res.json({ message: 'Success' });
        } catch (error) {
            // console.error(error);
        }
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

    // [POST] /api/v1/trunks/insert-relations?start=?&end=?
    async insertTrunkRelations(req, res, next) {
        const { name, start, end } = req.query;

        const batch = routes.slice(start, end);

        try {
            await runWorker('insertMultipleData', {}, 'trunks', '', 0, batch);
            res.status(200).json({ message: 'success' });
        } catch (error) {
            console.error('Error processing batch:', error);
        }
    }

    // [POST] /api/v1/trunks/insert-relations-url?start=?&end=?
    async insertTrunkRelationsByUrl(req, res, next) {
        const { name, start, end } = req.query;

        const batch = refs.slice(start, end);

        try {
            await runWorker('insertUrl', {}, 'trunks', '', 0, batch);
            res.status(200).json({ message: 'success' });
        } catch (error) {
            console.error('Error processing batch:', error);
        }
    }

    // [POST] /api/v1/trunks/insert-relations-by-name?name=?
    async insertTrunkRelationsByName(req, res, next) {
        const { name } = req.query;
        try {
            console.log('LOADING...');
            const res = await axios.get(
                `http://overpass-api.de/api/interpreter?data=[out:json];relation["name"="${name}"];out geom;`,
            );
            console.log('LOADED');
            let count = 0;
            for (const member of res?.data?.elements[0]?.members) {
                const payload = {
                    ref: res?.data?.elements[0]?.tags?.ref,
                    highways: [
                        {
                            highway_name: name,
                            ways: [
                                {
                                    nodes: member.geometry?.map((node) => [
                                        node?.lat,
                                        node?.lon,
                                    ]),
                                    lanes: 0,
                                    maxSpeed: 0,
                                    minSpeed: 0,
                                },
                            ],
                        },
                    ],
                };
                await runWorker('insertData', { body: payload }, 'trunks');
                count++;
                console.log(
                    (count / res?.data?.elements[0]?.members.length) * 100 +
                        '%',
                );
            }
            setCachedResults(initData());
            await redisModel.set('update_highway', '1', 'API', Date.now());
            return res.status(200).json({ message: 'success', result });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // [POST] /api/v1/highways/save-redis
    async saveHighwaysToRedis(req, res, next) {
        try {
            await saveToRedis();
            return res.status(200).json({ message: 'success' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new APIController();
