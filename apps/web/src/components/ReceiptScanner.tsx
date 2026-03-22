import { useState, useRef } from 'react'
import { scanReceipt } from '../lib/vision'

interface ReceiptScannerProps {
  onResult: (total: number, description: string) => void
}

export default function ReceiptScanner({ onResult }: ReceiptScannerProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<{ name: string; amount: number }[]>([])
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setItems([])

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1]
        const result = await scanReceipt(base64)
        setItems(result.items)
        onResult(result.total, result.items.map((i) => i.name).join(', '))
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="font-ui text-[13px] text-text-secondary underline"
      >
        {loading ? 'Scanning receipt...' : 'Scan a receipt'}
      </button>

      {error && <p className="font-ui text-sm text-accent mt-2">{error}</p>}

      {items.length > 0 && (
        <div className="mt-3 bg-surface-alt rounded-sm p-3 space-y-1">
          <p className="font-ui text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted mb-2">
            Extracted Items
          </p>
          {items.map((item, i) => (
            <div key={i} className="flex justify-between font-ui text-[13px] text-text-secondary">
              <span>{item.name}</span>
              <span>${(item.amount / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
