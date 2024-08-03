const swith = require('../utils/switch');
const caculate = require('../utils/caculate');

const ways = (highways, ref, name) => {
    const writeData = [];
    const keyData = {};
    const hData = {};
    let ID = `${ref}-${0}`;
    let nodeCount = 0;
    let countD500 = 0;

    highways?.forEach?.((highway) => {
        const highwayName = highway?.highway_name;

        const ways = highway?.ways;

        ways?.forEach?.((way) => {
            const bounds_ = swith.getBound(way?.buffer_geometry);

            const nodes = way?.nodes;
            const bounds = bounds_;
            const maxSpeed = way?.maxSpeed;
            const minSpeed = way?.minSpeed;
            const lanes = way?.lanes;
            const buffer_geometry = way?.buffer_geometry;

            const returnData = {
                id: ID,
                name: highwayName,

                nodes,
                bounds,
                maxSpeed,
                minSpeed,
                lanes,
                buffer_geometry,
            };

            hData[ID] = returnData;

            writeData?.push(returnData);

            const cacular = (nodes) => {
                nodes?.forEach?.((node, index) => {
                    const key = swith.getKeyFloor2(node)?.key;

                    keyData[key] = keyData[key] || [];
                    if (!keyData[key]?.includes?.(ID)) {
                        keyData[key]?.push?.(ID);
                    }

                    const nextNode = nodes?.[index + 1];

                    if (nextNode && node) {
                        const d = caculate.getDistance(node, nextNode);

                        if (d >= 1) {
                            let c = 3;

                            countD500 += 1;

                            const pointList = swith.getPointBetween2Point(
                                node,
                                nextNode,
                                c,
                            );
                            cacular([
                                node,
                                ...pointList?.map?.((p) => [
                                    p?.latitude,
                                    p?.longitude,
                                ]),
                                nextNode,
                            ]);
                        }
                    }

                    nodeCount += 1;
                });
            };

            cacular(nodes);
            cacular(buffer_geometry);

            ID = `${ref}-${Number(ID.split('-')[1]) + 1}`;
        });
    });

    return {
        keyData, // keyData: keyData
        hData, // hData: hData
    };
};

module.exports = ways;
