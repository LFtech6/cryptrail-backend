// coinmarketcap-fetcher.js
const axios = require('axios');
require('dotenv').config();

const COINMARKETCAP_API_URL = 'https://pro-api.coinmarketcap.com/v1/exchange';
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// Fetches exchange data from CoinMarketCap
const fetchCryptoExchanges = async () => {
  try {
    const response = await axios.get(`${COINMARKETCAP_API_URL}/listings/latest`, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY
      }
    });
    return response.data.data; // Assuming the exchanges data is in the 'data' property
  } catch (error) {
    console.error('Error fetching exchanges data from CoinMarketCap:', error);
    throw new Error('Failed to fetch exchanges data from CoinMarketCap');
  }
};

module.exports = {
  fetchCryptoExchanges
};
