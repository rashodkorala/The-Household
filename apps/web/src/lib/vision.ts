interface ReceiptResult {
  total: number
  items: { name: string; amount: number }[]
}

export async function scanReceipt(base64Image: string): Promise<ReceiptResult> {
  const apiKey = import.meta.env.VITE_VISION_API_KEY
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION' }],
        }],
      }),
    }
  )

  const data = await response.json()
  const text = data.responses?.[0]?.fullTextAnnotation?.text || ''
  const lines = text.split('\n')
  const pricePattern = /(\d+\.\d{2})/

  const candidates: { name: string; amount: number }[] = []

  for (const line of lines) {
    const match = line.match(pricePattern)
    if (match) {
      const amount = Math.round(parseFloat(match[1]) * 100)
      const name = line.replace(pricePattern, '').trim() || 'Item'
      candidates.push({ name, amount })
    }
  }

  candidates.sort((a, b) => b.amount - a.amount)
  const total = candidates.length > 0 ? candidates[0].amount : 0
  const items = candidates.slice(1)

  return { total, items }
}
