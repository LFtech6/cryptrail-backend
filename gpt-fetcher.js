const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY='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';

async function callOpenAIWithRetry(retryCount = 3, interval = 1000) {
    try {
        // Your API call logic here
        const response = await axios.post(/* Your OpenAI request parameters here */);
        return response;
    } catch (error) {
        if (retryCount === 0) throw error; // If no retries left, throw the error

        if (error.response && error.response.status === 429) { // Check if error is due to rate limiting
            console.log(`Rate limit hit, retrying in ${interval / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, interval)); // Wait for the specified interval
            return callOpenAIWithRetry(retryCount - 1, interval * 2); // Recursive call, decrementing retryCount and doubling the interval
        } else {
            throw error; // If error is not due to rate limiting, throw it
        }
    }
}

app.post('/send-message', async (req, res) => {
    const userMessage = req.body.message;

    // Constructing the request body for the Chat Completions API
    const requestBody = {
        model: "gpt-3.5-turbo", // Use the appropriate model for your use case
        messages: [
            {
                role: "user",
                content: userMessage
            }
        ]
    };

    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        
        // Assuming the response structure includes 'choices' and we take the first one
        const gptResponse = response.data.choices[0].message.content.trim();
        res.json({ message: gptResponse });
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
