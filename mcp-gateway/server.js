// Minimal MCP Gateway for Cerebras LLaMA (hackathon sponsor requirement)
// Exposes HTTP endpoints that wrap Cerebras API calls
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 8008;
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;

if (!CEREBRAS_API_KEY) {
  console.error('❌ CEREBRAS_API_KEY environment variable required');
  process.exit(1);
}

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

function callCerebras(prompt, callback) {
  const data = JSON.stringify({
    model: 'llama3.1-8b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.3,
  });

  const options = {
    hostname: 'api.cerebras.ai',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CEREBRAS_API_KEY}`,
      'Content-Length': data.length,
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        callback(null, json);
      } catch (e) {
        callback(new Error('Invalid JSON from Cerebras: ' + body));
      }
    });
  });

  req.on('error', (e) => callback(e));
  req.write(data);
  req.end();
}

function classifyReport(description, callback) {
  const prompt = `Classify this Bangalore infrastructure report into category and severity.
Report: "${description}"

Categories: pothole, streetlight, garbage, water-leak, tree, traffic
Severities: low, medium, high

Respond ONLY with JSON: {"category":"...", "severity":"..."}`;

  callCerebras(prompt, (err, data) => {
    if (err) return callback(err);
    try {
      const text = data?.choices?.[0]?.message?.content || '';
      const match = text.match(/\{[^}]+\}/);
      if (!match) throw new Error('No JSON in response');
      const parsed = JSON.parse(match[0]);
      callback(null, {
        category: parsed.category || 'traffic',
        severity: parsed.severity || 'medium',
        simulated: false,
      });
    } catch (e) {
      callback(new Error('Failed to parse classification: ' + e.message));
    }
  });
}

const server = http.createServer((req, res) => {
  // CORS for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'mcp-gateway', cerebras: 'connected' }));
    return;
  }

  if (req.method === 'POST' && req.url === '/tools/generate.email') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { description, category, severity, lat, lng } = payload;
        
        const prompt = `Write a formal email to Bangalore civic authorities about this infrastructure issue:

Issue: ${description}
Category: ${category || 'General'}
Severity: ${severity || 'Medium'}
Location: ${lat}, ${lng}

Respond with ONLY JSON: {"subject":"...", "body":"..."}
Keep subject under 60 chars. Body should be 3-4 professional sentences requesting action.`;

        callCerebras(prompt, (err, data) => {
          if (err) {
            console.error('Email generation error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
          try {
            const text = data?.choices?.[0]?.message?.content || '';
            const match = text.match(/\{[^}]+\}/);
            if (!match) throw new Error('No JSON in response');
            const parsed = JSON.parse(match[0]);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              subject: parsed.subject || 'Infrastructure Report',
              body: parsed.body || description,
            }));
          } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              subject: 'Infrastructure Report',
              body: description,
            }));
          }
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/tools/generate.tweet') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { description, category, severity, locationName } = payload;
        
        const prompt = `Write a tweet about this Bangalore infrastructure issue. Tag @BBMPCOMM (Bangalore civic authority).

Issue: ${description}
Category: ${category || 'infrastructure'}
Severity: ${severity || 'medium'}
Location: ${locationName || 'Bangalore'}

Rules:
- Start with relevant emoji
- Tag @BBMPCOMM
- Keep under 250 characters
- Be professional but urgent
- Include category and location

Respond with ONLY the tweet text (no JSON, no quotes, just the tweet).`;

        callCerebras(prompt, (err, data) => {
          if (err) {
            console.error('Tweet generation error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
          try {
            let tweetText = data?.choices?.[0]?.message?.content || '';
            // Clean up any quotes or formatting
            tweetText = tweetText.replace(/^"|"$/g, '').trim();
            
            // Ensure @BBMPCOMM is included
            if (!tweetText.includes('@BBMPCOMM')) {
              tweetText = tweetText + ' @BBMPCOMM';
            }
            
            // Truncate if too long
            if (tweetText.length > 270) {
              tweetText = tweetText.slice(0, 267) + '...';
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ tweet: tweetText }));
          } catch (e) {
            // Fallback tweet
            const fallback = `🚨 ${category || 'Infrastructure'} issue reported in ${locationName || 'Bangalore'}. ${description.slice(0, 100)}... @BBMPCOMM please address urgently!`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ tweet: fallback.slice(0, 270) }));
          }
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/tools/classify.report') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const description = payload.description;
        if (!description) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'description required' }));
          return;
        }

        classifyReport(description, (err, result) => {
          if (err) {
            console.error('Classification error:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ MCP Gateway (Cerebras) listening on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Classify: POST http://localhost:${PORT}/tools/classify.report`);
  console.log(`   Email Gen: POST http://localhost:${PORT}/tools/generate.email`);
  console.log(`   Tweet Gen: POST http://localhost:${PORT}/tools/generate.tweet`);
});
