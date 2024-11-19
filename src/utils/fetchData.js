const { default: axios } = require('axios');
const turf = require('@turf/turf');
const getWays = require('../modules/getway');
const vietnameseRegex =
    /[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯăâêôơưÁÉÍÓÚÝ]/;

const fetchData = async (type, region, url) => {
    try {
        console.log('LOADING...');
        const res = await axios.get(region ? region : url);
        console.log('LOADED');
        const highwayData = res?.data?.elements.map((way) => ({
            id: way.id,
            highway_name: way?.tags?.name ?? 'N/A',
            ref: way.tags.ref ?? 'N/A',
            nodes: way.geometry.map((node) => [node.lat, node.lon]),
            bounds: [
                [way.bounds.minlat, way.bounds.minlon],
                [way.bounds.maxlat, way.bounds.maxlon],
            ],
            maxSpeed: way.tags?.maxspeed ?? 0,
            minSpeed: way.tags?.minspeed ?? 0,
            lanes: way.tags?.lanes ?? 0,
        }));

        const vietNameHighways = highwayData.filter((highway) =>
            vietnameseRegex.test(highway.highway_name),
        );

        const groupedHighwayData = vietNameHighways.reduce((acc, way) => {
            const {
                ref,
                highway_name,
                nodes,
                bounds,
                maxSpeed,
                minSpeed,
                lanes,
            } = way;

            if (!ref || !highway_name) {
                return acc;
            }

            if (!acc[ref]) {
                acc[ref] = {
                    ref: ref,
                    highways: {},
                };
            }

            if (!acc[ref].highways[highway_name]) {
                acc[ref].highways[highway_name] = [];
            }

            const line = turf.lineString(
                nodes.map((node) => [node[1], node[0]]),
            );
            const bufferedLine = turf.buffer(line, 15, { units: 'meters' });
            const bufferedLineCoords =
                bufferedLine?.geometry.coordinates[0].map((coord) => [
                    coord[1],
                    coord[0],
                ]);

            acc[ref].highways[highway_name].push({
                id: way.id,
                nodes: nodes,
                bounds: bounds,
                maxSpeed: maxSpeed,
                minSpeed: minSpeed,
                lanes: lanes,
                buffer_geometry:
                    type === 'residential' ? [] : bufferedLineCoords,
            });

            return acc;
        }, {});

        const handleFindMaxSpeed = (data) => {
            return data.reduce(
                (max, way) => Math.max(max, Number(way.maxSpeed) || 0),
                0,
            );
        };

        const handleFindMinSpeed = (data) => {
            return data.reduce(
                (min, way) => Math.min(min, Number(way.minSpeed) || Infinity),
                Infinity,
            );
        };

        const groupedHighwaysArray = Object.values(groupedHighwayData).map(
            (group, index) => ({
                id: index,
                ref: group.ref,
                highways: Object.entries(group.highways).map(
                    ([highway_name, highways], index) => ({
                        id: index,
                        highway_name,
                        maxSpeed: handleFindMaxSpeed(highways),
                        minSpeed: handleFindMinSpeed(highways),
                        ways: highways.map((highway, index) => ({
                            ...highway,
                            id: index,
                            maxSpeed: highway.maxSpeed,
                            minSpeed: highway.minSpeed,
                        })),
                    }),
                ),
            }),
        );

        if (type === 'residential') {
            return groupedHighwaysArray;
        }

        return groupedHighwaysArray.map((ref) => ({
            id: ref.id,
            ref: ref.ref,
            hData: getWays(ref.highways, ref.ref, type).hData,
            keyData: getWays(ref.highways, ref.ref, type).keyData,
            highways: ref.highways.map((highway) => ({
                id: highway.id,
                highway_name: highway.highway_name,
                ways: highway.ways.map((way) => ({
                    id: way.id,
                    nodes: way.nodes,
                    bounds: way.bounds,
                    maxSpeed: way.maxSpeed,
                    minSpeed: way.minSpeed,
                    lanes: way.lanes,
                    buffer_geometry: way.buffer_geometry,
                })),
            })),
        }));
    } catch (error) {
        console.log(error);
        throw new Error("Can't fetch data");
    }
};

module.exports = fetchData;
