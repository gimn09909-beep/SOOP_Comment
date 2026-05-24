const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Serve Frontend Static Files ---
// When bundled with pkg, assets are inside /snapshot/
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

async function openBrowser(url) {
  const { exec } = require('child_process');
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} ${url}`);
}

// In-Memory Cache with cleanup
let cache = new Map();
const CACHE_TTL = 2500;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) cache.delete(key);
  }
}, 30000).unref();

function parseSoopUrl(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(p => p);
    if (parts[0] === 'station' && parts[2] === 'post') return { bj_id: parts[1], post_id: parts[3] };
    if (parsed.hostname.includes('afreecatv.com')) return { bj_id: parts[0], post_id: parts[2] };
    return null;
  } catch (e) { return null; }
}

async function fetchPage(bj_id, post_id, page, per_page = 100) {
  const apiUrl = `https://api-channel.sooplive.com/v1.1/channel/${bj_id}/post/${post_id}/comment?page=${page}&per_page=${per_page}`;
  try {
    const response = await axios.get(apiUrl, {
      timeout: 4000,
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.sooplive.com',
        'Referer': `https://www.sooplive.com/station/${bj_id}/post/${post_id}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    return response.data;
  } catch (err) { return { data: [] }; }
}

app.get('/api/comments', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const ids = parseSoopUrl(url);
  if (!ids) return res.status(400).json({ error: '올바른 SOOP 주소가 아닙니다.' });

  const { bj_id, post_id } = ids;
  const cacheKey = `${bj_id}_${post_id}`;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return res.json(cached.data);

  try {
    const per_page = 100;
    const first = await fetchPage(bj_id, post_id, 1, per_page);
    let comments = [...(first.data || [])];
    
    // Safety limit: Max 50 pages (5000 comments) to prevent server timeout
    const totalPages = first.meta?.lastPage || 1;
    const lastPage = Math.min(totalPages, 50);

    if (lastPage > 1) {
      // Fetch in chunks of 10 to be polite to the API and avoid socket exhaustion
      const CHUNK_SIZE = 10;
      for (let i = 2; i <= lastPage; i += CHUNK_SIZE) {
        const end = Math.min(i + CHUNK_SIZE - 1, lastPage);
        const pagePromises = [];
        for (let p = i; p <= end; p++) {
          pagePromises.push(fetchPage(bj_id, post_id, p, per_page));
        }
        const results = await Promise.all(pagePromises);
        results.forEach(r => { if (r.data) comments.push(...r.data); });
      }
    }

    const formatted = comments.map(c => ({
      id: c.pCommentNo,
      author: c.userNick,
      userId: c.userId,
      profileImage: c.profileImage,
      content: c.comment,
      likes: c.likeCnt,
      date: c.regDate,
      image: c.photo ? (c.photo.url || (c.photo.domain && c.photo.filename ? `${c.photo.domain}/${c.photo.filename}` : null)) : null
    }));

    const result = { post_id, bj_id, comments: formatted };
    cache.set(cacheKey, { timestamp: Date.now(), data: result });
    res.json(result);
  } catch (error) { res.status(500).json({ error: '데이터를 가져오는데 실패했습니다.' }); }
});

app.get(/^.*$/, (req, res) => { res.sendFile(path.join(frontendPath, 'index.html')); });

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access at http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'development') {
      openBrowser(`http://localhost:${PORT}`);
    }
  });
}

module.exports = app;
