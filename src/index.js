const express = require('express');
const app = express();
const http = require('http');
const route = require('./routes');
var bodyParser = require('body-parser');
const cors = require('cors');
const { loadHighways } = require('./utils/loadingHighWay');
const compression = require('compression');
require('dotenv').config();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const { createPromise } = require('./utils');

// app.use(
//     compression({
//         level: 6, // level compress
//         threshold: 100 * 1024, // > 100kb threshold to compress
//         filter: (req) => {
//             return !req.headers['x-no-compress'];
//         },
//     }),
// );
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

    // đọc file trunks-116.json nằm trong thư mục common và tìm ways có id = 7
    const run = async () => {
        const col = 'trunks';
        const basePath = `./src/common/${col}`;
        const length = fs.readdirSync(basePath).length;

        // Lấy danh sách các `way` bị xóa
        const deletedWayIds = createPromise(col).flatMap((item) =>
            item.highways.flatMap((highway) =>
                highway.ways
                    .filter((way) => way.isDelete === 1)
                    .map((way) => `${item.id}-${highway.id}-${way.id}`),
            ),
        );

        // Lặp qua từng file
        for (let i = 0; i < length; i++) {
            const filePath = path.join(basePath, `${col}-${i}.json`);
            let item = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            // Cập nhật `keyData`
            for (const [key, value] of Object.entries(item.keyData)) {
                item.keyData[key] = item.keyData[key]
                    ? [...item.keyData[key], ...value]
                    : value;
            }

            // Cập nhật `hData`, loại bỏ các `way` bị xóa
            for (const [key, value] of Object.entries(item.hData)) {
                if (
                    deletedWayIds.some(
                        (id) => id === `${item?.id}-${value?.key}`,
                    )
                ) {
                    console.log(item?.id, value?.key);

                    delete item.hData[key];
                }
            }

            // Loại bỏ các `way` bị xóa trong `highways`
            item.highways?.forEach((highway) => {
                highway.ways = highway.ways?.filter(
                    (way) => way?.isDelete !== 1,
                );
            });

            // Ghi lại nội dung đã sửa vào file
            // fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
        }
    };

    // run();

    // const trunks = JSON.parse(
    //     fs.readFileSync('./src/common/trunks/trunks-116.json', 'utf8'),
    // );

    // trunks.highways[1]?.ways?.forEach((way) => {
    //     if (way.id === 4511) {
    //         console.log(way);
    //     }
    // });
    // const findObjectByKeyValue = (obj, targetKey, targetValue) => {
    //     const results = [];

    //     for (const [key, value] of Object.entries(obj)) {
    //         if (value[targetKey] === targetValue) {
    //             results.push({ [key]: value });
    //         }
    //     }
    //     return results;
    // };

    // fs.writeFileSync(filePath, JSON.stringify(trunks));

    // let hDataObjects = findObjectByKeyValue(trunks.hData, 'way_id', 7);
    // console.log(hDataObjects);

    // console.log(
    //     Object.keys(trunks?.keyData).find((key) => {
    //         if (trunks?.keyData[key].includes('trunks-QL.1-191')) {
    //             console.log(key);
    //         }
    //         return;
    //     }),
    // );

    // console.log(hDataObjects);

    // hDataObjects = hDataObjects.filter((hDataObject) =>
    //     Object.values(hDataObject).some((hData) => hData?.highway_id == 1),
    // );

    // for (const hDataObject of hDataObjects) {
    //     const hDataKey = Object.keys(hDataObject)[0];
    //     // console.log(trunks.hData[hDataKey]?.key);

    //     if (hDataKey) {
    //         hDataObject[hDataKey].isDelete = 1;
    //         trunks.hData[hDataKey] = hDataObject[hDataKey];
    //     }
    // }

    server.listen(port, () => {
        console.log(`Example app listening on port ${port}`);
    });
});
