const { parentPort, workerData } = require('worker_threads');
const highwayModule = require('../modules/_highways_');
const fetchDataRelation = require('../utils/fetchDataRelation');
const fs = require('fs');
const fetchData = require('../utils/fetchData');

const { task, req, col, region, deleteFlag, payloads } = workerData;

async function handleTask() {
    console.log(task, col);

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
            case 'insertMultipleData':
                const promises = payloads.map(async (route) => {
                    try {
                        const data = await fetchDataRelation(route);

                        if (data?.length > 0) {
                            if (data?.length > 0) {
                                data.forEach((item, index) => {
                                    let path = `./src/common/${col}/${col}-${index}.json`;

                                    while (fs.existsSync(path)) {
                                        index++;
                                        path = `./src/common/${col}/${col}-${index}.json`;
                                    }

                                    fs.writeFileSync(
                                        path,
                                        JSON.stringify({ ...item, id: index }),
                                    );
                                });
                            }
                        }
                    } catch (error) {
                        console.error(
                            `Error processing route: ${route} - ${error.message}`,
                        );
                    }
                });

                await Promise.all(promises);

                break;
            case 'insertUrl': {
                const promises = payloads.map(async (route) => {
                    try {
                        const data = await fetchData(
                            'trunks',
                            null,
                            `https://overpass-api.de/api/interpreter?data=[out:json];way["highway"~"trunk|primary"]["ref"="${route}"];out geom;`,
                        );

                        if (data?.length > 0) {
                            if (data?.length > 0) {
                                data.forEach((item, index) => {
                                    let path = `./src/common/${col}/${col}-${index}.json`;

                                    while (fs.existsSync(path)) {
                                        index++;
                                        path = `./src/common/${col}/${col}-${index}.json`;
                                    }

                                    fs.writeFileSync(
                                        path,
                                        JSON.stringify({ ...item, id: index }),
                                    );
                                });
                            }
                        }

                        // ghi file txt các route đã xử lý
                        fs.appendFileSync(
                            `./src/common/${col}/route.txt`,
                            `${route}\n`,
                        );
                    } catch (error) {
                        console.error(
                            `Error processing route: ${route} - ${error.message}`,
                        );
                        // ghi file txt các route lỗi
                        fs.appendFileSync(
                            `./src/common/${col}/error.txt`,
                            `${route}\n`,
                        );
                    }
                });

                await Promise.all(promises);

                break;
            }
            default:
                throw new Error('Unknown task');
        }
        parentPort.postMessage({ success: true, result });
    } catch (error) {
        parentPort.postMessage({ success: false, error: error.message });
    }
}

handleTask();
