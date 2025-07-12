const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const connectionString = 'postgresql://postgres:Demo@1234@db.cjnmrmeasxzdwufmgwth.supabase.co:5432/postgres';

app.post('/api/log', async (req, res) => {
  const body = req.body;
  if (!body || !body.documents || !Array.isArray(body.documents)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await client.query(`CREATE TABLE IF NOT EXISTS ai_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      timestamp TIMESTAMPTZ,
      query TEXT,
      token TEXT,
      subdomain TEXT,
      response_time_ms INTEGER,
      document JSONB,
      raw_log JSONB
    )`);
    for (const doc of body.documents) {
      await client.query(
        `INSERT INTO ai_logs (timestamp, query, token, subdomain, response_time_ms, document, raw_log)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          body.timestamp,
          body.query,
          body.token,
          doc.subdomain,
          (body.requests.find(r => r.subdomain === doc.subdomain) || {}).responseTimeMs || null,
          JSON.stringify(doc.document),
          JSON.stringify(body)
        ]
      );
    }
    await client.end();
    return res.status(200).json({ ok: true });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents', async (req, res) => {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query(
      `SELECT id, timestamp, query, token, subdomain, response_time_ms, document
       FROM ai_logs
       ORDER BY timestamp DESC
       LIMIT 20`
    );
    await client.end();
    return res.status(200).json({ documents: result.rows });
  } catch (err) {
    await client.end();
    return res.status(500).json({ error: err.message });
  }
});

app.listen(5174, () => {
  console.log('Custom API server running on http://localhost:5174');
}); 