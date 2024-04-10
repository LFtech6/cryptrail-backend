
/* app.post('/send-message', async (req, res) => {
  const userMessage = req.body.message;
  
  const requestBody = {
    model: "gpt-4",
    messages: [
      {
        role: "user",
        content: userMessage
      }
    ]s
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