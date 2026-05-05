const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/playlist', async (req, res) => {
  const { apiKey, work, theme } = req.body;

  if (!apiKey || !work || !theme) {
    return res.status(400).json({ error: 'Missing apiKey, work, or theme.' });
  }

  const prompt = `You are a music curator and literary scholar. Generate a playlist of 6 real, well-known songs capturing the theme of "${theme}" in ${work}.

Return ONLY a raw JSON array. No markdown. No backticks. No explanation. Start with [ and end with ].

Structure:
[{"title":"Song Title","artist":"Artist Name","tag":"oneword","justification":"2-3 sentences referencing specific characters or moments from the work and explaining how the song connects to the theme."}]

Rules:
- Real, well-known songs only
- Vary genres (classical, jazz, indie, ambient, folk, pop, etc.)
- Tag must be a single evocative word
- Justification must cite specific elements from the literary work`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const raw = data.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('Unexpected response format.');
    const tracks = JSON.parse(raw.slice(start, end + 1));

    res.json({ tracks });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🎵 Literary Frequencies is running.`);
  console.log(`   Open http://localhost:${PORT} in your browser.\n`);
});
