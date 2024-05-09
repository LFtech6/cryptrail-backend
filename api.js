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
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

    // Start a transaction
    await pool.query('BEGIN');

    // Insert user
    const userResult = await pool.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING id',
      [username, hashedPassword, email]
    );
    const userId = userResult.rows[0].id;

    // Insert PIN
    await pool.query(
      'INSERT INTO pins (user_id, pin) VALUES ($1, $2)',
      [userId, randomPin]
    );

    // Commit transaction
    await pool.query('COMMIT');

    res.status(201).json({ userId: userId, pin: randomPin });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Update last_access column to the current timestamp
        await pool.query('UPDATE users SET last_access = NOW() WHERE id = $1', [user.id]);

        // Generate JWT
        //const token = jwt.sign({ id: user.id }, 'your-secret-key', { expiresIn: '269762h' });

        // Send back user details excluding the password, along with the JWT
        const { password: _, ...userData } = user;
        res.status(200).json({ message: 'Login successful', user: userData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Endpoint to reset password
app.post('/resetPassword', async (req, res) => {
  const { email, pin, newPassword } = req.body;

  if (!email || !pin || !newPassword) {
    return res.status(400).json({ message: 'Missing required parameters' });
  }

  try {
    // Fetch user by email
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Verify the PIN
    const pinResult = await pool.query('SELECT pin FROM pins WHERE user_id = $1', [userId]);
    if (pinResult.rows.length === 0 || pinResult.rows[0].pin !== pin) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
});


app.delete('/conversations/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    await pool.query('DELETE FROM conversations WHERE user_id = $1', [userId]);
    res.status(200).json({ message: 'Conversations deleted successfully' });
  } catch (error) {
    console.error('Database or server error:', error);
    res.status(500).json({ message: 'Failed to delete conversations', error: error.message });
  }
});

app.get('/conversations/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const result = await pool.query('SELECT * FROM conversations WHERE user_id = $1', [userId]);
    if (result.rows.length > 0) {
      console.log(result.rows[0]);
      const conversations = result.rows[0].content.map(row => {
        return {
          id: result.rows[0].id,
          role: row.role,
          content: row.content,  // Directly use the content without parsing
          createdAt: result.rows[0].created_at
        };
      });
      res.json(conversations);
    } else {
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Database or server error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
  }
});


app.post('/saveConversation', async (req, res) => {
  const { userId, content } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  try {
    // Insert the conversation into the database, associating it with the user ID
    const result = await pool.query('INSERT INTO conversations (id, user_id, content) VALUES ($1, $2, $3) ON CONFLICT(id) DO UPDATE SET content = EXCLUDED.content RETURNING id;', [userId, userId, JSON.stringify(content)]);
    // Respond with the ID of the saved conversation
    res.json({ conversationId: result.rows[0].id });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ message: 'Failed to save conversation', error: error.message });
  }
});

app.post('/saveConversion', async (req, res) => {
  const { userId, baseCurrency, targetCurrency, baseAmount, targetAmount } = req.body;

  if (!userId || !baseCurrency || !targetCurrency || !baseAmount || !targetAmount) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO conversion_history (user_id, base_currency, target_currency, base_amount, target_amount) VALUES ($1, $2, $3, $4, $5)',
      [userId, baseCurrency, targetCurrency, baseAmount, targetAmount]
    );
    res.status(201).json({ message: 'Conversion history saved successfully' });
  } catch (error) {
    console.error('Error saving conversion history:', error);
    res.status(500).json({ error: 'Failed to save conversion history', message: error.message });
  }
});


// Endpoint to get conversion history
app.get('/getConversions/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!userId) {
    return res.status(400).json({ message: "Invalid user ID format" });
  }

  try {
    const result = await pool.query('SELECT * FROM conversion_history WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Failed to fetch conversion history', error: error.message });
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
  console.log('Converting:', base, target, amount)
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
