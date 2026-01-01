// Vercel Serverless Function - Yahoo Finance Proxy
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract path after /api/yahoo/
  const path = req.url.replace('/api/yahoo', '');
  const yahooUrl = `https://query1.finance.yahoo.com${path}`;

  try {
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Yahoo API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch stock data' });
  }
}
