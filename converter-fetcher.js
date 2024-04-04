const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/convert', async (req, res) => {
    const { base, target, amount } = req.query;
    console.log(req);
    console.log(`Converting: ${amount} from ${base} to ${target}`);
  

  try {
    const ratesResponse = await axios.get('https://api.coingecko.com/api/v3/exchange_rates');
    const rates = ratesResponse.data.conversion_rates;


    if (!rates[base] || !rates[target]) {
        const missingCurrency = !rates[base] ? base : target;
        console.log(`Missing rate for currency: ${missingCurrency}`);
        return res.status(404).json({ message: `Currency not found: ${missingCurrency}` });
    }
    
      

    const baseRate = rates[base].value;
    const targetRate = rates[target].value;
    const result = (amount * baseRate / targetRate).toFixed(6);

    res.json({ result });
  } catch (error) {
    console.error('Error during conversion:', error);
    res.status(500).json({ message: 'Failed to perform conversion' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
