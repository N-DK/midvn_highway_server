const redisConfig = require('../config/redis.config');
const IoRedis = require('ioredis');
let client = {},
    statusConnectRedis = {
        CONNECT: 'connect',
        END: 'end',
        RECONNECTING: 'reconnecting',
        ERROR: 'error',
    };

async function handleEventConnection(connection) {
    try {
        connection.on(statusConnectRedis.CONNECT, () => {
            console.log('connectRedis - status: connected');
        });

        connection.on(statusConnectRedis.END, () => {
            console.log('connectRedis - status: connection closed');
        });

        connection.on(statusConnectRedis.RECONNECTING, (attempt) => {
            console.log(
                `connectRedis - status: reconnecting, attempt: ${attempt}`,
            );
        });

        connection.on(statusConnectRedis.ERROR, (err) => {
            console.log(`connectRedis - status: error ${err}`);
        });
        if (connection.status === 'end') await connection.connect();
    } catch (error) {
        console.log('error redis::::', error);
    }
}

class Redis {
    async init() {
        try {
            const instanceRedis = new IoRedis({
                ...redisConfig,
                // socket: {
                //     reconnectStrategy: function (retries) {
                //         // if (retries > 10) {
                //         //   return new Error("Too many connect");
                //         // } else {
                //         //   return retries * 500;
                //         // }
                //         return Math.min(retries * 500, 10000);
                //     },
                // },
                retryStrategy: (retries) => Math.min(retries * 500, 10000),
            });

            client.instanceConnect = instanceRedis;
            handleEventConnection(instanceRedis);
        } catch (error) {
            console.log({ error: JSON.stringify(error, null, 2) });
        }
    }

    get() {
        try {
            return client;
        } catch (error) {
            console.log(error);
        }
    }

    close() {
        if (client.instanceConnect) {
            client.instanceConnect.quit();
        }
    }
}
const { init, get, close } = new Redis();

module.exports = { initRedis: init, getRedis: get, closeRedis: close };
