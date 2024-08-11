const autocannon = require('autocannon');
const {
    VN_REGION,
    VN_REGION_TRUNK,
    CONFIG_LOADTEST,
} = require('../../constants');
const { fetchTollBoth } = require('../../utils/fetchTollboth');
const { isPointInHighway, createPromise } = require('../../utils');
const fs = require('fs');
const highwayModule = require('../../modules/_highways_');
const runWorker = require('../../utils/runWorker');
const { setCachedResults, initData } = require('../../utils/loadingHighWay');

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

        const highway = highwayModule?.checker?.highway(lat, lng, [
            'id',
            'maxSpeed',
            'minSpeed',
            'lanes',
            'name',
            'ref',
            'key',
            ...(query?.split?.(',') || []),
        ]);

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

    // [GET] /api/v1/highways/pull
    async pullHighways(req, res, next) {
        try {
            await runWorker('pullData', {}, 'highways', VN_REGION);
            setCachedResults(initData());
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
}

module.exports = new APIController();
