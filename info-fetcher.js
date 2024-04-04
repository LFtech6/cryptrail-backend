// info-fetcher.js
const { Pool } = require('pg');
const axios = require('axios');

const NEWSDATA_API_URL = 'https://newsdata.io/api/1/news';
const NEWSDATA_API_KEY='pub_38980b5e753c820d59cd76830765c65d241e8';
//const OPENAI_API_KEY='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';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cryptrail',
  password: 'admin123',
  port: 5432,
});

// Endpoint para as notícias
async function fetchNews() {
  console.log('Fetching news...');
  try {
    const response = await axios.get(NEWSDATA_API_URL, {
      params: {
        apikey: NEWSDATA_API_KEY,
        q: 'cryptocurrency',
        country: 'us',
        language: 'en'
      }
    });
    if (response.data.results) {
      const articles = response.data.results;
      console.log('Fetched news:', articles.length); 
      for (let article of articles) {
        console.log('Inserting article:', article);
        await pool.query(`INSERT INTO news (title, image_url, link, summary, published_at) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (title) DO UPDATE SET
        image_url = EXCLUDED.image_url,
        link = EXCLUDED.link,
        summary = EXCLUDED.summary,
        published_at = EXCLUDED.published_at`,
        [article.title, article.image_url, article.link, article.summary, article.published_at]
        );      
      }
    }
  } catch (error) {
    console.error('Error fetching news:', error);
  }
};

async function fetchCoins() {
  console.log('Fetching coins...');
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=eur', {
    params: {
      order: 'market_cap_desc',
      per_page: 3700,
      page: 1,
      sparkline: false,
    }
  });
  if (response.data) {
    const assets = response.data;
    console.log('Fetched coins:', assets.length); 
    for (let asset of assets) {
      console.log('Inserting coins:', asset);
      // Check if any field is null or not in the expected format
  if (!asset.name || !asset.symbol || !asset.market_cap || !asset.current_price || !asset.last_updated || !asset.image || asset.price_change_percentage_24h === null) {
    console.error('Invalid asset data:', asset);
    continue;
  }
      await pool.query(`INSERT INTO coins (name, symbol, market_cap, current_price, last_updated, image_url, price_change_percentage_24h) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (name) DO UPDATE SET
      symbol = EXCLUDED.symbol,
      market_cap = EXCLUDED.market_cap,
      current_price = EXCLUDED.current_price,
      last_updated = EXCLUDED.last_updated,
      image_url = EXCLUDED.image_url`,
      [asset.name, asset.symbol, asset.market_cap, asset.current_price, asset.last_updated, asset.image, asset.price_change_percentage_24h]
      );      
    }
  }
} catch (error) {
  console.error('Error fetching coins data:', error);
}
};

async function fetchExchanges (){
  console.log('Fetching exchanges...');
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/exchanges?vs_currency=eur', {
    params: {
      per_page: 1000,
      page: 1,
    }
  });
  if (response.data) {
    const exchanges = response.data;
    console.log('Fetched exchanges:', exchanges.length); 
    for (let exchange of exchanges) {
      if (exchange.url) {
        console.log('Inserting exchanges:', exchange);
        await pool.query(`INSERT INTO exchanges (name, url, trust_score, image_url) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE SET
        url = EXCLUDED.url,
        trust_score = EXCLUDED.trust_score,
        image_url = EXCLUDED.image_url`,
        [exchange.name, exchange.url, exchange.trust_score, exchange.image]
        );
      } else {
        console.log('Skipping exchange with null url:', exchange);
      }
    }
  }
} catch (error) {
  console.error('Error fetching exchanges data:', error);
}
};



(async () => {
  try {
    //await fetchNews();
    //await fetchCoins();
    //await fetchExchanges();
  } catch (err) {
    console.error(err);
  }
})();

setInterval(() => {
  //fetchNews().catch(err => console.error(err));
  //fetchCoins().catch(err => console.error(err));
  //fetchExchanges().catch(err => console.error(err));
}, 24 * 60 * 60 * 1000);


/* app.post('/send-message', async (req, res) => {
  const userMessage = req.body.message;
  
  const requestBody = {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: userMessage
      }
    ]
  };
  
  try {
    const response = await callOpenAIWithRetry(requestBody);
    const gptResponse = response.choices[0].message.content.trim();
    res.json({ message: gptResponse });
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error('Quota exceeded for OpenAI API:', error.response.data);
      res.status(429).json({ error: "We've hit our usage limit for now, please try again later." });
    } else {
      // Enhanced error logging
      console.error('Error calling OpenAI:', error.response ? error.response.data : error);
      res.status(500).json({ error: 'Something went wrong, please try again.', details: error.message });
    }
  }
});

async function callOpenAIWithRetry(requestBody, retryCount = 3, baseInterval = 1000) {
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    }
  });
  return response.data;
} catch (error) {
  console.log(error);
  return;
  if (retryCount <= 0 || (error.response && error.response.status === 429)) {
    throw error;
  }
  
  const waitTime = baseInterval * Math.pow(2, 3 - retryCount);
  console.log(`Request failed, retrying in ${waitTime}ms...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
  
  return callOpenAIWithRetry(requestBody, retryCount - 1, baseInterval);
}
} */