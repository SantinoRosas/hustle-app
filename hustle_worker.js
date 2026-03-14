// ╔══════════════════════════════════════════════════════════╗
// ║  HUSTLE$ — Cloudflare Worker (Claude API Proxy)         ║
// ║                                                         ║
// ║  DEPLOY INSTRUCTIONS:                                   ║
// ║  1. Install Wrangler: npm install -g wrangler           ║
// ║  2. Login: wrangler login                               ║
// ║  3. Create worker: wrangler init hustle-worker          ║
// ║  4. Replace worker.js contents with this file           ║
// ║  5. Add your key: wrangler secret put ANTHROPIC_KEY     ║
// ║     (paste your key from console.anthropic.com)         ║
// ║  6. Deploy: wrangler deploy                             ║
// ║  7. Copy the worker URL it gives you                    ║
// ║  8. In hustle_app.html, replace YOUR_WORKER_URL_HERE    ║
// ║     with your actual worker URL                         ║
// ║                                                         ║
// ║  Your worker URL looks like:                            ║
// ║  https://hustle-worker.YOUR-NAME.workers.dev            ║
// ╚══════════════════════════════════════════════════════════╝

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: cors });
    }

    try {
      const body = await request.json();
      const { messages, system, max_tokens = 2000 } = body;

      if (!messages || !messages.length) {
        return new Response(JSON.stringify({ error: 'No messages provided' }), {
          status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens,
          system,
          messages,
        }),
      });

      const data = await response.json();

      return new Response(JSON.stringify(data), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(
        JSON.stringify({ error: err.message || 'Worker error' }),
        { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } }
      );
    }
  },
};
