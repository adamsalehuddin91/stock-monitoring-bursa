// Free news headlines via Google News RSS (no API key). Feeds Claude's catalyst
// synthesis — the one job where AI genuinely beats a technical score: reading
// messy headlines and extracting what actually moves the market.
const isServer = typeof window === 'undefined'
const GNEWS = 'https://news.google.com/rss/search'

// What to search per module.
export const NEWS_TOPICS = {
  fcpo: ['palm oil FCPO Malaysia', 'MPOB palm oil export'],
  crypto: ['Bitcoin Ethereum crypto market'],
  global: ['US stock market Fed rate', 'S&P 500 Nasdaq'],
  bursa: ['Bursa Malaysia KLCI'],
}

const decode = s =>
  s.replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim()

const pick = (block, tag) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return m ? decode(m[1]) : null
}

async function fetchTopic(query, limit) {
  const url = `${GNEWS}?q=${encodeURIComponent(query)}&hl=en-MY&gl=MY&ceid=MY:en`
  const res = await fetch(url, { headers: isServer ? { 'User-Agent': 'Mozilla/5.0' } : undefined })
  if (!res.ok) return []
  const xml = await res.text()
  const items = []
  for (const block of xml.split('<item>').slice(1)) {
    const title = pick(block, 'title')
    if (!title) continue
    items.push({ title, source: pick(block, 'source') || 'News', date: pick(block, 'pubDate') || '' })
    if (items.length >= limit) break
  }
  return items
}

// Deduped headlines across the topics for a set of module keys.
export async function getHeadlines(moduleKeys, { perTopic = 4, max = 12 } = {}) {
  const topics = [...new Set(moduleKeys.flatMap(k => NEWS_TOPICS[k] || []))]
  const lists = await Promise.all(topics.map(t => fetchTopic(t, perTopic).catch(() => [])))
  const seen = new Set(), out = []
  for (const list of lists) {
    for (const h of list) {
      const key = h.title.toLowerCase().slice(0, 60)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(h)
      if (out.length >= max) return out
    }
  }
  return out
}
