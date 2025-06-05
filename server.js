const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/generate', async (req, res) => {
  const { description, number } = req.body;
  if (!description || !number) {
    return res.status(400).json({ error: 'Missing description or number' });
  }

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You generate flashcards in CSV format. Return only the CSV.' },
          { role: 'user', content: `Create a CSV with ${number} flashcards about ${description}. Each line should be "question,answer".` }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error response:', err);
      return res.status(500).json({ error: 'Failed to generate flashcards' });
    }

    const data = await response.json();
    const csv = data.choices?.[0]?.message?.content?.trim() || '';
    res.json({ csv });
  } catch (error) {
    console.error('OpenAI request failed:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
