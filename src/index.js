const express = require('express');
const app = express();
const http = require('http');
const route = require('./routes');
const { loadHighways } = require('./modules/loadingHighWay');
var bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 3000;
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect DB
const connectDB = async () => {
    try {
        await loadHighways();
    } catch (error) {
        console.error('Error during initialization', error);
        process.exit(1);
    }
};

const server = http.createServer(app);

// Connect DB and load highways, then start server
connectDB().then(async () => {
    route(app);

    server.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
});
