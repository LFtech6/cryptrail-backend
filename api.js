// api.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cryptrail',
  password: 'admin123',
  port: 5432,
});
  

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, email]
      );
      res.status(201).json({ userId: result.rows[0].id });
    } catch (err) {
      console.error(err); // Detailed error logging
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0 || !(await bcrypt.compare(password, result.rows[0].password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Update last_access column to the current timestamp
      await pool.query('UPDATE users SET last_access = NOW() WHERE id = $1', [result.rows[0].id]);
      
      res.status(200).json({ message: 'Login successful', user: { userId: result.rows[0].id, email: result.rows[0].email } });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  
  app.get('/news', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM news ORDER BY published_at DESC');
      console.log(result.rows);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching news from the database:', error);
      res.status(500).json({ message: 'Failed to fetch news from the database' });
    }
  });
  
  app.get('/coins', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM coins ORDER BY market_cap DESC LIMIT 100');
      res.json(result.rows); 
    } catch (error) {
      console.error('Error fetching coins data from the database:', error);
      res.status(500).json({ message: 'Failed to fetch coins data from the database' });
    }
  });
  
  app.get('/exchanges', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM exchanges LIMIT 1000');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching exchanges data from the database:', error);
      res.status(500).json({ message: 'Failed to fetch exchanges data from the database' });
    }
  });
  
  app.get('/convert', async (req, res) => {
    const { base, target } = req.query;
    let { amount } = req.query;

    if (!base || !target) {
      return res.status(400).json({ message: 'Missing base or target query parameter' });
    }
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/exchange_rates');
      const rates = response.data.rates;
  
      const baseLower = base.toLowerCase();
      const targetLower = target.toLowerCase();
  
      if (!rates[baseLower] || !rates[targetLower]) {
        return res.status(404).json({ message: `Conversion rate not found for ${base} to ${target}` });
      }
  
      amount = Number(amount);
  if (isNaN(amount)) {
    return res.status(400).json({ message: 'Invalid amount query parameter' });
  }

      const rate = rates[targetLower].value / rates[baseLower].value;
      const convertedAmount = (amount * rate).toFixed(6); // Calculate the converted amount
  
      res.json({ convertedAmount });
    } catch (error) {
      console.error('Error during conversion:', error);
      res.status(500).json({ message: 'Failed to perform conversion' });
    }
  });

  app.get('/rates', async (req, res) => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/exchange_rates');
        const rates = response.data.rates;
        res.json(rates);
    } catch (error) {
        console.error('Error fetching rates:', error);
        res.status(500).json({ message: 'Failed to fetch rates' });
    }
});

  

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
