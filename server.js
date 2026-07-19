require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.API_PORT || 3001;

const rateBuckets = new Map();

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase admin credentials are not configured');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { error: 'Missing Authorization bearer token', status: 401 };
  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return { error: 'Invalid or expired token', status: 401 };
  return { user: data.user, admin };
}

function rateLimit(key, { limit = 20, windowMs = 60_000 } = {}) {
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

async function createApp() {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/flashcardGenerate', async (req, res) => {
    try {
      const auth = await requireUser(req);
      if (auth.error) return res.status(auth.status).json({ error: auth.error });
      const { user, admin } = auth;

      const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] || req.ip;
      if (!rateLimit(`gen:${user.id}:${ip}`, { limit: 30, windowMs: 60_000 })) {
        return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
      }
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: 'OpenAI API key is not configured' });
      }

      const { count, topic } = req.body || {};
      const n = Number(count);
      if (!n || n < 1 || n > 50 || !topic) {
        return res.status(400).json({ error: 'Invalid count or topic' });
      }

      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('pro, generation_count')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;

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
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cardAssist', async (req, res) => {
    try {
      const auth = await requireUser(req);
      if (auth.error) return res.status(auth.status).json({ error: auth.error });
      if (!rateLimit(`assist:${auth.user.id}`, { limit: 40, windowMs: 60_000 })) {
        return res.status(429).json({ error: 'Too many requests. Try again shortly.' });
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
