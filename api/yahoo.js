// Vercel Serverless Function - Yahoo Finance Proxy
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract path after /api/yahoo/
  const path = req.url.replace('/api/yahoo', '');
  const yahooUrl = `https://query1.finance.yahoo.com${path}`;

  console.log('📊 Yahoo Finance Proxy:', yahooUrl);

  try {
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com',
        'Origin': 'https://finance.yahoo.com',
      }
    });

    console.log('📡 Yahoo Response Status:', response.status);

    if (!response.ok) {
      console.error('❌ Yahoo API Error:', response.status, response.statusText);
      // Return error so client can detect failure
      return res.status(response.status).json({
        error: 'Yahoo Finance API error',
        status: response.status,
        statusText: response.statusText
      });
    }

    const data = await response.json();
    console.log('✅ Yahoo Data Success:', data?.chart?.result ? 'Has Data' : 'No Data');

    return res.status(200).json(data);
  } catch (error) {
    console.error('💥 Yahoo API Exception:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error.message
    });
  }
}
