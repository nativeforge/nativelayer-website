const ALLOWED_HOST = 'news.google.com'
const FETCH_TIMEOUT_MS = 8000

function isAllowedRssUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false
  if (parsed.hostname !== ALLOWED_HOST) return false
  if (!parsed.pathname.startsWith('/rss')) return false

  return true
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const targetUrl = req.query.url
  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).json({ error: 'Missing url query parameter' })
  }

  if (!isAllowedRssUrl(targetUrl)) {
    return res.status(403).json({ error: 'URL not allowed' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const upstream = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'nativelayer-rss-proxy/1.0',
      },
    })

    if (!upstream.ok) {
      return res.status(502).json({ error: 'Upstream RSS fetch failed' })
    }

    const body = await upstream.text()
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).send(body)
  } catch (err) {
    const timedOut = err?.name === 'AbortError'
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut ? 'Upstream RSS fetch timed out' : 'Upstream RSS fetch failed',
    })
  } finally {
    clearTimeout(timeoutId)
  }
}
