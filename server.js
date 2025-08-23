/* Simple local proxy + static server for debugging API calls in terminal */
const express = require('express');
// Use global fetch if available (Node 18+), otherwise dynamic import for node-fetch (ESM)
const fetchFn = (...args) => (global.fetch ? global.fetch(...args) : import('node-fetch').then(({ default: f }) => f(...args)));
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent';
const API_KEY = process.env.GEMINI_API_KEY || '';

app.use(express.json({ limit: '2mb' }));

// CORS for local development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/gemini', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY in .env' });
  }
  const body = req.body;
  const startedAt = Date.now();
  console.log('\n[Proxy] → Forwarding to Gemini with payload keys:', Object.keys(body || {}));
  try {
    const upstream = await fetchFn(`${GOOGLE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await upstream.text();
    console.log(`[Proxy] ← Status: ${upstream.status} (${Date.now() - startedAt}ms)`);
    console.log('[Proxy] ← Body (first 1200 chars):\n', text.slice(0, 1200));
    res.status(upstream.status).type('application/json').send(text);
  } catch (e) {
    console.error('[Proxy] Error:', e);
    res.status(500).json({ error: 'Proxy error', details: String(e) });
  }
});

// Serve static files
app.use('/', express.static(path.resolve(__dirname)));

app.listen(PORT, () => {
  console.log(`Local server running at http://localhost:${PORT}`);
  console.log('Static files served from project root. Proxy endpoint: POST /api/gemini');
});


