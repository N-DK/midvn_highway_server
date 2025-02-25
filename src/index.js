const express = require('express');
const app = express();
const http = require('http');
const route = require('./routes');
var bodyParser = require('body-parser');
const cors = require('cors');
const { loadHighways, loadingHighWayRedis } = require('./utils/loadingHighWay');
const compression = require('compression');
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(
    compression({
        level: 6, // level compress
        threshold: 100 * 1024, // > 100kb threshold to compress
        filter: (req) => {
            return !req.headers['x-no-compress'];
        },
    }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// init redis
const { initRedis } = require('./dbs/init.redis');
const saveToRedis = require('./utils/saveToRedis');

// loadData
const loadData = async () => {
    try {
        await loadHighways();
        // await saveToRedis();
        // await loadingHighWayRedis();
    } catch (error) {
        console.error('Error during initialization', error);
        process.exit(1);
    }
};

const server = http.createServer(app);

initRedis().then(async () => {
    loadData().then(async () => {
        route(app);
        server.listen(port, () => {
            console.log(`App listening on port ${port}`);
        });
    });
});
