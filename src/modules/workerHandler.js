const { parentPort, workerData } = require('worker_threads');
const highwayModule = require('../modules/_highways_');

const { task, req, col, region, deleteFlag } = workerData;

async function handleTask() {
    try {
        let result;
        switch (task) {
            case 'insertData':
                result = await highwayModule.insertData(req, col);
                break;
            case 'deleteAndRestoreData':
                result = await highwayModule.deleteAndRestoreData(
                    req,
                    col,
                    deleteFlag,
                );
                break;
            case 'updateDate':
                result = await highwayModule.updateDate(req, col);
                break;
            case 'pullData':
                result = await highwayModule.pullData(col, region);
                break;
            default:
                throw new Error('Unknown task');
        }
        parentPort.postMessage({ success: true, result });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
}

handleTask();
