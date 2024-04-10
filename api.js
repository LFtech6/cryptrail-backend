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

  // app.get('/user/:id', async (req, res) => {
  //   const { id } = req.params;
  //   try {
  //     const result = await pool.query('SELECT username FROM users WHERE id = $1', [id]);
  //     if (result.rows.length > 0) {
  //       res.json(result.rows[0]);
  //     } else {
  //       res.status(404).json({ error: 'User not found' });
  //     }
  //   } catch (error) {
  //     console.error('Error fetching user details:', error);
  //     res.status(500).json({ message: 'Failed to fetch user details' });
  //   }
  // });

  
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
      const result = await pool.query('SELECT * FROM coins ORDER BY market_cap DESC LIMIT 5000');
      res.json(result.rows); 
    } catch (error) {
      console.error('Error fetching coins data from the database:', error);
      res.status(500).json({ message: 'Failed to fetch coins data from the database' });
    }
  });
  
  app.get('/exchanges', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM exchanges LIMIT 5000');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching exchanges data from the database:', error);
      res.status(500).json({ message: 'Failed to fetch exchanges data from the database' });
    }
  });
  
  app.get('/rates', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM conversion_rates');
      const formattedRates = result.rows.reduce((acc, curr) => {
        acc[curr.target_currency] = { ...acc[curr.target_currency], rate: curr.rate, name: curr.target_currency.toUpperCase() };
        return acc;
      }, {});
      res.json(formattedRates);
    } catch (error) {
      console.error('Error fetching rates from the database:', error);
      res.status(500).json({ message: 'Failed to fetch rates from the database' });
    }
  });
   
  app.get('/convert', async (req, res) => {
    const { base, target, amount } = req.query;
  
    if (!base || !target || !amount) {
      return res.status(400).json({ message: 'Missing required query parameters' });
    }
  
    try {
      // Convert base currency to BTC
      let baseToBTCRate = 1; // Default to 1 if base currency is BTC
      if (base.toLowerCase() !== 'btc') {
        const baseToBTCResult = await pool.query('SELECT rate FROM conversion_rates WHERE target_currency = $1', [base.toLowerCase()]);
        if (baseToBTCResult.rows.length === 0) {
          return res.status(404).json({ message: `Rate not found for base currency: ${base}` });
        }
        baseToBTCRate = 1 / parseFloat(baseToBTCResult.rows[0].rate);
      }
  
      // Convert BTC to target currency
      let btcToTargetRate = 1; // Default to 1 if target currency is BTC
      if (target.toLowerCase() !== 'btc') {
        const btcToTargetResult = await pool.query('SELECT rate FROM conversion_rates WHERE target_currency = $1', [target.toLowerCase()]);
        if (btcToTargetResult.rows.length === 0) {
          return res.status(404).json({ message: `Rate not found for target currency: ${target}` });
        }
        btcToTargetRate = parseFloat(btcToTargetResult.rows[0].rate);
      }
  
      // Perform conversion
      const convertedAmount = (parseFloat(amount) * baseToBTCRate * btcToTargetRate).toFixed(6);
  
      res.json({ convertedAmount });
    } catch (error) {
      console.error('Error during conversion:', error);
      res.status(500).json({ message: 'Failed to perform conversion', error: error.message });
    }
  });
  
  

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
