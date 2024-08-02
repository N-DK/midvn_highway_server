const autocannon = require('autocannon');

const createUrl = (lat, lng) =>
    `http://localhost:3001/api/v1/check-way?lat=${lat}&lng=${lng}`;

const urls = [];
for (let i = 0; i < 5000; i++) {
    const lat = (Math.random() * (21 - 20) + 20).toFixed(7);
    const lng = (Math.random() * (106 - 105) + 105).toFixed(7);
    urls.push(createUrl(lat, lng));
}

const config = {
    url: urls[0],
    connections: 100,
    duration: 10,
    requests: urls.map((url) => ({
        path: url.replace('http://localhost:3001', ''),
    })),
};

autocannon(config, (err, result) => {
    if (err) {
        console.error('Error:', err);
    } else {
        console.log('Result:', result);
    }
});
