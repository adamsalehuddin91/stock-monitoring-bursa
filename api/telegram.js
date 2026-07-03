// Telegram delivery — reusable sender + a guarded manual-test endpoint.
//
// As a module:  import { sendTelegram } from './telegram.js'
// As an endpoint (test):  POST /api/telegram?secret=CRON_SECRET  { "text": "hi" }

export async function sendTelegram(text, { token, chatId, parseMode = 'Markdown' } = {}) {
  token = token || process.env.TELEGRAM_BOT_TOKEN
  chatId = chatId || process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) throw new Error('Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID')

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true }),
  })
  const data = await res.json()
  if (!data.ok) throw new Error(`Telegram error: ${data.description || res.status}`)
  return data
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const secret = process.env.CRON_SECRET
  if (secret && req.query?.secret !== secret) return res.status(401).json({ error: 'unauthorized' })

  let body
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body } catch { body = {} }
  const text = body?.text || '✅ TradeRadar test — Telegram wired up.'
  try {
    const data = await sendTelegram(text)
    return res.status(200).json({ ok: true, message_id: data.result?.message_id })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
