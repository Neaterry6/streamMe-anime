const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const BASE_URL = 'https://api.consumet.org';
const FALLBACK_URL = 'https://api.enime.moe';

app.get('/api/:endpoint(*)', async (req, res) => {
    try {
        const { endpoint } = req.params;
        const query = req.query;
        let url = `${BASE_URL}/anime/${endpoint}`;
        let response = await axios.get(url, { params: query });
        if (response.status !== 200) {
            url = `${FALLBACK_URL}/${endpoint}`;
            response = await axios.get(url, { params: query });
        }
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'API request failed' });
    }
});

module.exports = app
