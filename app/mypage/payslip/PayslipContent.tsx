'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PayslipItem = {
  facility_name: string
  work_date: string
  time_from: string
  time_to: string
  wage_type: string
  wage_amount: number
}

type NurseInfo = {
  name: string
  license: string
}

export default function PayslipContent() {
  const searchParams = useSearchParams()
  const year = searchParams.get('year') ?? ''
  const month = searchParams.get('month') ?? ''
  const nurseId = searchParams.get('nurseId') ?? ''

  const [items, setItems] = useState<PayslipItem[]>([])
  const [nurseInfo, setNurseInfo] = useState<NurseInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!nurseId || !year || !month) return
      const { data: np } = await supabase.from('nurse_profiles').select('name, license').eq('id', nurseId).maybeSingle()
      if (np) setNurseInfo(np)
      const monthStr = `${year}-${String(month).padStart(2, '0')}`
      const { data: apps } = await supabase.from('applications').select('job_id').eq('nurse_id', nurseId).eq('status', 'accepted')
      if (apps && apps.length > 0) {
        const jobIds = apps.map((a: any) => a.job_id)
        const { data: jobs } = await supabase.from('jobs').select('id, work_date, time_from, time_to, wage_type, wage_amount, facility_id').in('id', jobIds).like('work_date', `${monthStr}%`)
        if (jobs && jobs.length > 0) {
          const facilityIds = [...new Set(jobs.map((j: any) => j.facility_id))]
          const { data: facilities } = await supabase.from('facilities').select('id, facility_name').in('id', facilityIds)
          const facilityMap: Record<string, string> = {}
          facilities?.forEach((f: any) => { facilityMap[f.id] = f.facility_name })
          setItems(jobs.sort((a: any, b: any) => a.work_date.localeCompare(b.work_date)).map((j: any) => ({
            facility_name: facilityMap[j.facility_id] ?? '—',
            work_date: j.work_date, time_from: j.time_from, time_to: j.time_to,
            wage_type: j.wage_type ?? 'daily', wage_amount: j.wage_amount ?? 0,
          })))
        }
      }
      setLoading(false)
    }
    init()
  }, [nurseId, year, month])

  const calcAmount = (item: PayslipItem) => {
    if (item.wage_type !== 'hourly') return item.wage_amount
    const [fh, fm] = item.time_from.split(':').map(Number)
    const [th, tm] = item.time_to.split(':').map(Number)
    return Math.round(item.wage_amount * (th * 60 + tm - fh * 60 - fm) / 60)
  }

  const total = items.reduce((sum, item) => sum + calcAmount(item), 0)
  const issueDate = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#64748B' }}>読み込み中...</div>

  return (
    <>
      <style>{`
        @media print { .no-print { display: none !important; } body { margin: 0; } nav, header { display: none !important; } @page { margin: 20mm; } }
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; }
      `}</style>
      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 100 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🖨️ 印刷・PDF保存</button>
        <button onClick={() => window.close()} style={{ padding: '10px 20px', background: '#fff', color: '#64748B', border: '1px solid #EDE0E0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>閉じる</button>
      </div>
      <div style={{ maxWidth: 700, margin: '40px auto', padding: '40px 48px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #E07070' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#E07070', marginBottom: 4 }}>irodori+</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>株式会社irodori</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1A2235', marginBottom: 4 }}>給与明細書</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>{year}年{month}月分</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>発行日：{issueDate}</div>
          </div>
        </div>
        <div style={{ marginBottom: 28, padding: '16px 20px', background: '#FBF7F7', borderRadius: 10, border: '1px solid #EDE0E0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>氏名</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2235' }}>{nurseInfo?.name ?? '—'} 様</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>資格</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2235' }}>{nurseInfo?.license === 'rn' ? '正看護師' : '准看護師'}</div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2235', marginBottom: 12 }}>勤務明細</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FDF0F0' }}>
                {['勤務日','施設名','勤務時間','給与種別','金額'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#C45A5A', borderBottom: '1px solid #EDE0E0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>この月の採用確定した勤務はありません</td></tr>
              ) : (
                items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{item.work_date}</td>
                    <td style={{ padding: '10px 12px' }}>{item.facility_name}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{item.time_from}〜{item.time_to}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{item.wage_type === 'hourly' ? `時給 ¥${item.wage_amount.toLocaleString()}` : '日給'}</td>
                    <td style={{ padding: '10px 12px', color: '#E07070', fontWeight: 700, textAlign: 'right' }}>¥{calcAmount(item).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
          <div style={{ background: '#FDF0F0', border: '1px solid #EDE0E0', borderRadius: 10, padding: '16px 24px', textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>合計支給額</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#E07070' }}>¥{total.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>※振込予定額（税込）</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #EDE0E0', paddingTop: 20, fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          <div>※ 本明細書は irodori+ システムより自動発行されたものです。</div>
          <div>※ 給与の振込は各施設より直接行われます。</div>
          <div>※ ご不明な点は info@irodori0305.jp までお問い合わせください。</div>
        </div>
      </div>
    </>
  )
}
