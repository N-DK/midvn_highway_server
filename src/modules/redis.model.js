const { getRedis } = require('../dbs/init.redis');
const mylogger = require('../loggers/mylogger.log');

class RedisModel {
    constructor() {
        this.redis = getRedis();
        this.get = this.get.bind(this);
        this.hGet = this.hGet.bind(this);
        this.hGetAll = this.hGetAll.bind(this);
        this.set = this.set.bind(this);
        this.setWithExpired = this.setWithExpired.bind(this);
        this.hSet = this.hSet.bind(this);
        this.setnx = this.setnx.bind(this);
        this.expire = this.expire.bind(this);
        this.ttl = this.ttl.bind(this);
        this.exists = this.exists.bind(this);
        this.hdelOneKey = this.hdelOneKey.bind(this);
        this.del = this.del.bind(this);
        this.eval = this.eval.bind(this);
    }
    async get(key, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            const data = await client.get(key);
            return { result: true, data };
        } catch (error) {
            console.log(error);
            mylogger.error('interact get redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async hGet(key, field, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            // console.log("key, field, path, requestId", key, field, path, requestId);
            const data = await client.hGet(key, field);
            return { result: true, data };
        } catch (error) {
            // console.log(error);
            mylogger.error('interact hGet redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async hGetAll(key, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            const data = await client.hgetall(key);
            return { result: true, data };
        } catch (error) {
            console.log(error);
            mylogger.error('interact hGetAll redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async set(key, value, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            await client.set(key, value);
            return { result: true, data: [] };
        } catch (error) {
            mylogger.error('interact set redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async hSet(key, field, value, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            // console.log("field", field);
            // console.log("key", key);
            // console.log("client", value);
            await client.hset(key, field, value);
            return { result: true, data: [] };
        } catch (error) {
            console.log(error);
            mylogger.error('interact hSet redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async setWithExpired(key, value, times = 30, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            // console.log({ key, value, times, path, requestId });
            await client.setEx(key, times, value);
            return { result: true, data: [] };
        } catch (error) {
            mylogger.error('interact setWithExpired redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async setnx(key, value, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;

            await client.setNX(key, value);
            return { result: true, data: [] };
        } catch (error) {
            mylogger.error('interact setnx redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async expire(key, ttl, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;

            return await client.expire(key, ttl);
        } catch (error) {
            mylogger.error('interact expire redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            throw error.msg;
        }
    }

    async ttl(key, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;

            const data = await client.ttl(key);
            return { result: true, data };
        } catch (error) {
            mylogger.error('interact ttl redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async exists(key, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;

            const data = await client.exists(key);
            return { result: true, data };
        } catch (error) {
            mylogger.error('interact exists redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async hdelOneKey(key, field, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            await client.hDel(key, field);
            return { result: true, data: [] };
        } catch (error) {
            console.log('error', error);
            mylogger.error('interact hdelOneKey redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async del(key, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            await client.del(key);
            return { result: true, data: [] };
        } catch (error) {
            mylogger.error('interact del redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }

    async eval(script, keys, args, path, requestId) {
        try {
            const { instanceConnect: client } = this.redis;
            const data = await client.eval(script, keys, args);
            return { result: true, data };
        } catch (error) {
            mylogger.error('interact eval redis error', [
                path || '',
                requestId || Date.now,
                error,
            ]);
            return { result: false, error };
        }
    }
}

module.exports = new RedisModel();
