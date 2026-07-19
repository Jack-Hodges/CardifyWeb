import OpenAI from 'openai';
import { requireUser, rateLimit } from './_auth.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await requireUser(req);
    if (auth.error) {
      return res.status(auth.status).json({ error: auth.error });
    }
    const { user } = auth;

    if (!rateLimit(`assist:${user.id}`, { limit: 40, windowMs: 60_000 })) {
      return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    const { action, question, answer } = req.body || {};
    if (!['explain', 'simplify'].includes(action)) {
      return res.status(400).json({ error: 'action must be explain or simplify' });
    }

    const prompt =
      action === 'explain'
        ? `Explain this flashcard clearly for a student.\nQuestion: ${question}\nAnswer: ${answer}\nKeep it under 120 words.`
        : `Rewrite this flashcard answer to be simpler and clearer. Return only the simplified answer text.\nQuestion: ${question}\nAnswer: ${answer}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.6-luna',
      reasoning_effort: 'none',
      messages: [{ role: 'user', content: prompt }],
    });

    res.status(200).json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error('cardAssist error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
