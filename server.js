require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PORT = process.env.API_PORT || 3001;

async function createApp() {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/flashcardGenerate', async (req, res) => {
    try {
      const { count, topic } = req.body || {};

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }
      if (!count || !topic) {
        return res.status(400).json({ error: 'Missing count or topic' });
      }

      const prompt = `Generate exactly ${count} flashcards about ${topic}. 
Format each flashcard as a question and answer pair, with each pair on a new line.
Do not include any additional text, just the questions and answers.
Example format:
What is photosynthesis?|The process by which plants convert light energy into chemical energy
What is the capital of France?|Paris

Make sure that you ONLY generate ${count} flashcards.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-5.6-luna',
        reasoning_effort: 'none',
        messages: [{ role: 'user', content: prompt }],
      });

      res.status(200).send(response.choices[0].message.content);
    } catch (error) {
      console.error('flashcardGenerate error:', error.message);
      res.status(500).json({
        error: error.message,
        details: 'Check local API server logs for more information',
      });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

createApp()
  .then((app) => {
    app.listen(PORT, () => {
      console.log(`Local API server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start API server:', err);
    process.exit(1);
  });
