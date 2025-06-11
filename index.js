const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const CONSUMET_API = 'https://api.consumet.org/anime/gogoanime';

// Middleware
app.use(cors());
app.use(express.json());

// Search anime
app.get('/api/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    try {
        const response = await axios.get(`${CONSUMET_API}/${encodeURIComponent(query)}`);
        res.json({
            results: response.data.results.map(item => ({
                id: item.id,
                title: item.title,
                image: item.image
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to search anime' });
    }
});

// Get anime details
app.get('/api/details', async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID is required' });
    try {
        const response = await axios.get(`${CONSUMET_API}/info/${encodeURIComponent(id)}`);
        res.json({
            id: response.data.id,
            title: response.data.title.english || response.data.title,
            episodes: response.data.totalEpisodes || 1
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch details' });
    }
});

// Get episode download links
app.get('/api/links', async (req, res) => {
    const { id, episode } = req.query;
    if (!id || !episode) return res.status(400).json({ error: 'ID and episode are required' });
    try {
        const response = await axios.get(`${CONSUMET_API}/watch/${encodeURIComponent(`${id}-episode-${episode}`)}`);
        res.json({
            links: {
                sub: response.data.sources.reduce((acc, source) => {
                    acc[source.quality || 'default'] = source.url;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch links' });
    }
});

// Get trending anime
app.get('/api/trending', async (req, res) => {
    try {
        const response = await axios.get(`${CONSUMET_API}/recent-episodes`);
        res.json({
            results: response.data.results.map(item => ({
                id: item.id,
                title: item.title,
                image: item.image
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trending anime' });
    }
});

// Serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));