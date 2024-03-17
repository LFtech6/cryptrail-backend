const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

console.log(Error);

app.use(cors());

// Endpoint para as moedas
app.get('/coins', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'eur',
        order: 'market_cap_desc',
        per_page: 100,
        page: 1,
        sparkline: false,
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching coins data:', error);
    res.status(500).json({ message: 'Failed to fetch coins data' });
  }
});

// Endpoint para as exchanges
app.get('/exchanges', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/exchanges', {
      params: {
        per_page: 1000,
        page: 1,
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching exchanges data:', error);
    res.status(500).json({ message: 'Failed to fetch exchanges data' });
  }
});

// Ligar o servidor numa porta disponível
const server = app.listen(0, () => {
  const actualPort = server.address().port;
  console.log(`Server running on port ${actualPort}`);
});