import { Suspense } from 'react'
import FacilityPayslipContent from './FacilityPayslipContent'

export default function FacilityPayslipPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#64748B' }}>読み込み中...</div>}>
      <FacilityPayslipContent />
    </Suspense>
  )
}
