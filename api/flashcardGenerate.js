import OpenAI from 'openai';
import { requireUser, rateLimit, getProfileGenerationState, getAdminClient } from './_auth.js';

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
    const { user, admin } = auth;

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown';
    if (!rateLimit(`gen:${user.id}:${ip}`, { limit: 30, windowMs: 60_000 })) {
      return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    const { count, topic } = req.body || {};
    const n = Number(count);
    if (!n || n < 1 || n > 50 || !topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Invalid count or topic' });
    }

    const profile = await getProfileGenerationState(admin || getAdminClient(), user.id);
    const dailyLimit = profile.pro ? 60 : 20;
    const used = profile.generation_count || 0;
    if (used + n > dailyLimit) {
      return res.status(403).json({
        error: `Daily limit exceeded. You can generate ${Math.max(0, dailyLimit - used)} more cards today.`,
      });
    }

    const prompt = `Generate exactly ${n} flashcards about ${topic}. 
Format each flashcard as a question and answer pair, with each pair on a new line.
Do not include any additional text, just the questions and answers.
Example format:
What is photosynthesis?|The process by which plants convert light energy into chemical energy
What is the capital of France?|Paris

Make sure that you ONLY generate ${n} flashcards.`;

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
      details: 'Check Vercel logs for more information',
    });
  }
}
