const { default: axios } = require('axios');
const turf = require('@turf/turf');
const getWays = require('../modules/getway');
const vietnameseRegex =
    /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯăâêôơưÁÉÍÓÚÝ]/;

const fetchDataRelation = async (route) => {
    try {
        console.log('LOADING...');
        const res = await axios.get(
            `http://overpass-api.de/api/interpreter?data=[out:json];relation["name"="${route}"];out geom;`,
        );

        console.log('LOADED');

        const highwayData = res?.data?.elements
            ?.map((element, elementIndex) =>
                element?.members.map((way, wayIndex) => ({
                    id: `${elementIndex}-${wayIndex}`,
                    highway_name: route,
                    ref: element?.tags?.ref ?? 'REF_NOT_FOUND',
                    nodes:
                        way?.geometry?.map((node) => [node.lat, node.lon]) ??
                        [],
                })),
            )
            .flat();

        const filteredHighwayData = highwayData?.filter(
            (way) => way.nodes.length > 0,
        );

        const groupedHighwayData = filteredHighwayData?.reduce((acc, way) => {
            const { ref, highway_name, nodes } = way;

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
                buffer_geometry: bufferedLineCoords,
            });

            return acc;
        }, {});

        const groupedHighwaysArray = Object.values(groupedHighwayData).map(
            (group, index) => ({
                id: index,
                ref: group.ref,
                highways: Object.entries(group.highways).map(
                    ([highway_name, highways], index) => ({
                        id: index,
                        highway_name,
                        ways: highways.map((highway, index) => ({
                            ...highway,
                            id: index,
                        })),
                    }),
                ),
            }),
        );

        return groupedHighwaysArray.map((ref) => ({
            id: ref.id,
            ref: ref.ref,
            hData: getWays(ref.highways, ref.ref, 'trunk').hData,
            keyData: getWays(ref.highways, ref.ref, 'trunk').keyData,
            highways: ref.highways.map((highway) => ({
                id: highway.id,
                highway_name: highway.highway_name,
                ways: highway.ways.map((way) => ({
                    id: way.id,
                    nodes: way.nodes,
                    buffer_geometry: way.buffer_geometry,
                })),
            })),
        }));
    } catch (error) {
        console.log(error);
    }
};

module.exports = fetchDataRelation;
