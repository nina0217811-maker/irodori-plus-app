import { Suspense } from 'react'
import PayslipContent from './PayslipContent'

export default function PayslipPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#64748B' }}>読み込み中...</div>}>
      <PayslipContent />
    </Suspense>
  )
}
