import { Suspense } from 'react'
import TaxPdfContent from './TaxPdfContent'

export default function TaxPdfPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748B' }}>読み込み中...</div>}>
      <TaxPdfContent />
    </Suspense>
  )
}
