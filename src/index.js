const express = require('express');
const http = require('http');
const cluster = require('cluster');
const os = require('os');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const route = require('./routes');
const { loadHighways } = require('./modules/loadingHighWay');

dotenv.config();

const port = process.env.PORT || 3000;

const numCPUs = os.cpus().length;

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(
            `Worker ${worker.process.pid} died. Forking a new worker...`,
        );
        cluster.fork();
    });
} else {
    const app = express();

    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    const connectDB = async () => {
        try {
            await loadHighways();
        } catch (error) {
            console.error('Error during initialization', error);
            process.exit(1);
        }
    };

    const server = http.createServer(app);

    connectDB().then(() => {
        route(app);

        server.listen(port, () => {
            console.log(
                `Worker ${process.pid} started. App listening on port ${port}`,
            );
        });
    });
}
