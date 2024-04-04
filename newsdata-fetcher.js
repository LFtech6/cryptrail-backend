const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

const NEWSDATA_API_URL = 'https://newsdata.io/api/1/news';
const NEWSDATA_API_KEY = 'pub_38980b5e753c820d59cd76830765c65d241e8';

app.use(cors()); // Enable CORS for all routes

app.get('/news', async (req, res) => {
  try {
    const response = await axios.get(NEWSDATA_API_URL, {
      params: {
        apikey: NEWSDATA_API_KEY,
        q: 'cryptocurrency',
        country: 'us',
        language: 'en'
      }
    });
    res.json(response.data.results);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ message: 'Failed to fetch news' });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

