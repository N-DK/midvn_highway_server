const { Worker } = require('worker_threads');
const { setCachedResults, initData } = require('./loadingHighWay');

function runWorker(
    task,
    req,
    col,
    region = '',
    deleteFlag = null,
    payloads = null,
) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./src/modules/workerHandler.js', {
            workerData: { task, req, col, region, deleteFlag, payloads },
        });

        worker.on('message', (message) => {
            if (message.success) {
                resolve(message.result);
            } else {
                reject(new Error(message.error));
            }
        });

        worker.on('error', (error) => {
            reject(error);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
}

module.exports = runWorker;
