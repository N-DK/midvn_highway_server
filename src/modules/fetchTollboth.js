const { default: axios } = require('axios');
const turf = require('@turf/turf');
const { VN_REGION_TOLL_BOTH, TOKEN } = require('../constants');
const vietnameseRegex =
    /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯăâêôơưÁÉÍÓÚÝ]/;

const fetchTollBoth = async () => {
    console.log('LOADING...');
    const res = await axios.get(
        `https://gps3.binhanh.vn/api/v1/landmarks/systemlandmark/1`,
        {
            headers: {
                Authorization: `Bearer ${TOKEN}`,
            },
        },
    );
    console.log('LOADED');
    const vietNameTollBoth = res?.data?.data?.filter(
        (node) =>
            node.lname.toLowerCase().includes('trạm thu phí') &&
            node.pgon !== '',
    );

    const tollBoth = vietNameTollBoth.map((node, index) => {
        // const point = turf.point([Number(node.lng), Number(node.lat)]);
        // const bufferedPoint = turf.buffer(point, 20, { units: 'meters' });
        // const bufferedLineCoords = bufferedPoint.geometry.coordinates[0].map(
        //     (coord) => [coord[1], coord[0]],
        // );
        var bufferedLineCoords = node.pgon
            .split(',')
            .map((coord, index) => {
                if (index % 2 === 0) {
                    return [
                        Number(node.pgon.split(',')[index + 1]),
                        Number(coord),
                    ];
                }
                return null;
            })
            .filter((buffer) => buffer !== null);

        return {
            id: index,
            ref: 'Trạm thu phí',
            highways: [
                {
                    highway_name: node?.lname,
                    ways: [
                        {
                            nodes: [[Number(node.lng), Number(node.lat)]],
                            buffer_geometry: bufferedLineCoords,
                        },
                    ],
                },
            ],
        };
    });
    return tollBoth;
};

module.exports = { fetchTollBoth };
