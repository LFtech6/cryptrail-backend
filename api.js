// api.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { fetchCryptoExchanges } = require('./coinmarketcap-fetcher');

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
  
  app.get('/cryptodata', async (req, res) => {
    try {
      const exchangeData = await fetchCryptoExchanges();
      res.json(exchangeData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  
// Start the server
const server = app.listen(0, () => {
  const actualPort = server.address().port; // This will give you the actual port the server is listening on
  console.log(`Server running on port ${actualPort}`);
});
