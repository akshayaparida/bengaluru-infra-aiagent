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

function callCerebras(prompt, callback, maxTokens = 300) {
  const data = JSON.stringify({
    model: 'llama3.3-70b',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.2,
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
        const { description, category, severity, locationName, landmark, lat, lng, mapsLink, civicHandle, icccHandle } = payload;
        const handle = civicHandle || '@GBA_office';
        const iccc = icccHandle || '@ICCCBengaluru';
        const location = landmark || locationName || 'Bengaluru';
        
        // Direct prompt that produces complete tweets with enhanced description
        const emoji = category === 'pothole' ? '🕳️' : category === 'streetlight' ? '💡' : category === 'garbage' ? '🗑️' : category === 'water-leak' ? '💧' : '🚨';
        
        // Add severity/urgency keywords based on classification
        const urgencyWord = severity === 'high' ? 'URGENT:' : severity === 'medium' ? 'Attention needed:' : '';
        
        const prompt = `You are writing a civic infrastructure tweet for Bangalore authorities.

Original report: "${description}"
Category: ${category}
Severity: ${severity}
Location: ${location}

Enhance the description to be more specific and impactful:
- For potholes: mention size/depth, traffic impact, safety risk
- For streetlights: mention darkness, safety concerns, area affected
- For garbage: mention accumulation, health hazard, duration
- For water leaks: mention water waste, road damage, urgency

Write a complete tweet:
${emoji} ${urgencyWord} [enhanced 40-60 char description] 📍 ${location} 🗺️ ${mapsLink} ${handle} ${iccc}

Be urgent, specific, and civic-minded. Max 250 chars total.

Tweet:`;

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
            
            // If AI response is too short or empty, use smart template
            if (tweetText.length < 30) {
              // Enhanced fallback with urgency words
              const urgencyPrefix = severity === 'high' ? 'URGENT: ' : severity === 'medium' ? '' : '';
              const impactWord = category === 'pothole' ? 'causing traffic hazard' : 
                                category === 'streetlight' ? 'creating safety risk' : 
                                category === 'garbage' ? 'health hazard' : 
                                category === 'water-leak' ? 'wasting water' : 'needs attention';
              tweetText = `${emoji} ${urgencyPrefix}${description} - ${impactWord} 📍 ${location}`;
            }
            
            // Replace wrong handles if AI used old ones
            tweetText = tweetText.replace(/@BBMPCOMM/g, handle);
            tweetText = tweetText.replace(/@BBMP_MAYOR/g, handle);
            
            // Ensure both handles are included
            if (!tweetText.includes(handle)) {
              tweetText = tweetText + ' ' + handle;
            }
            if (!tweetText.includes(iccc)) {
              tweetText = tweetText + ' ' + iccc;
            }
            
            // Ensure location emoji and map link are included
            if (!tweetText.includes('📍')) {
              const firstLocationMatch = tweetText.indexOf(location);
              if (firstLocationMatch >= 0) {
                tweetText = tweetText.substring(0, firstLocationMatch) + `📍 ${location}` + tweetText.substring(firstLocationMatch + location.length);
              } else {
                tweetText = tweetText + ` 📍 ${location}`;
              }
            }
            if (!tweetText.includes(mapsLink)) {
              // Add map link with emoji if not present
              const mapPart = ` 🗺️ ${mapsLink}`;
              tweetText = tweetText + mapPart;
            }
            
            // Truncate if too long, but preserve map link and handles at end
            if (tweetText.length > 280) {
              // Extract the ending (map link + handles)
              const mapMatch = tweetText.match(/🗺️\s+https:\/\/[^\s]+/);
              const handlesPart = ` ${handle} ${iccc}`;
              const endingPart = (mapMatch ? mapMatch[0] : '') + handlesPart;
              
              // Truncate the description part
              const maxDescLength = 280 - endingPart.length - 3; // -3 for '...'
              if (maxDescLength > 50) {
                const descPart = tweetText.substring(0, maxDescLength);
                tweetText = descPart + '...' + endingPart;
              } else {
                // If too short, just hard truncate
                tweetText = tweetText.slice(0, 277) + '...';
              }
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ tweet: tweetText }));
          } catch (e) {
            // Fallback tweet with all required elements
            const fallbackEmoji = category === 'pothole' ? '🕳️' : category === 'streetlight' ? '💡' : '🚨';
            const fallback = `${fallbackEmoji} ${category || 'Infrastructure'} issue: ${description.slice(0, 60)} 📍 ${location} 🗺️ ${mapsLink} ${handle} ${iccc}`;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ tweet: fallback.slice(0, 280) }));
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
  console.log(`✅ MCP Gateway (Cerebras Llama 3.3 70B) listening on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Classify: POST http://localhost:${PORT}/tools/classify.report`);
  console.log(`   Email Gen: POST http://localhost:${PORT}/tools/generate.email`);
  console.log(`   Tweet Gen: POST http://localhost:${PORT}/tools/generate.tweet`);
});
