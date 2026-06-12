'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type PayslipRow = {
  work_date: string
  nurse_name: string
  nurse_license: string
  time_from: string
  time_to: string
  wage_type: string
  wage_amount: number
  amount: number
}

export default function FacilityPayslipContent() {
  const searchParams = useSearchParams()
  const year = searchParams.get('year') ?? ''
  const month = searchParams.get('month') ?? ''
  const facilityId = searchParams.get('facilityId') ?? ''

  const [rows, setRows] = useState<PayslipRow[]>([])
  const [facilityName, setFacilityName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!facilityId || !year || !month) return

      const { data: facility } = await supabase
        .from('facilities')
        .select('facility_name')
        .eq('id', facilityId)
        .maybeSingle()
      if (facility) setFacilityName(facility.facility_name)

      const monthStr = `${year}-${String(month).padStart(2, '0')}`

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, work_date, time_from, time_to, wage_type, wage_amount')
        .eq('facility_id', facilityId)
        .like('work_date', `${monthStr}%`)

      if (!jobs || jobs.length === 0) { setLoading(false); return }

      const jobIds = jobs.map((j: any) => j.id)
      const { data: apps } = await supabase
        .from('applications')
        .select('job_id, nurse_id')
        .in('job_id', jobIds)
        .eq('status', 'accepted')

      if (!apps || apps.length === 0) { setLoading(false); return }

      const nurseIds = [...new Set(apps.map((a: any) => a.nurse_id))]
      const { data: profiles } = await supabase
        .from('nurse_profiles')
        .select('id, name, license')
        .in('id', nurseIds)

      const profileMap: Record<string, { name: string; license: string }> = {}
      profiles?.forEach((p: any) => { profileMap[p.id] = { name: p.name, license: p.license } })

      const jobMap: Record<string, any> = {}
      jobs.forEach((j: any) => { jobMap[j.id] = j })

      const calcAmount = (job: any) => {
        if (job.wage_type !== 'hourly') return job.wage_amount
        const [fh, fm] = job.time_from.split(':').map(Number)
        const [th, tm] = job.time_to.split(':').map(Number)
        return Math.round(job.wage_amount * (th * 60 + tm - fh * 60 - fm) / 60)
      }

      const result: PayslipRow[] = apps.map((app: any) => {
        const job = jobMap[app.job_id]
        const profile = profileMap[app.nurse_id] ?? { name: '不明', license: 'rn' }
        return {
          work_date: job.work_date,
          nurse_name: profile.name,
          nurse_license: profile.license === 'rn' ? '正看護師' : '准看護師',
          time_from: job.time_from,
          time_to: job.time_to,
          wage_type: job.wage_type ?? 'daily',
          wage_amount: job.wage_amount,
          amount: calcAmount(job),
        }
      }).sort((a: PayslipRow, b: PayslipRow) => a.work_date.localeCompare(b.work_date))

      setRows(result)
      setLoading(false)
    }
    init()
  }, [facilityId, year, month])

  const total = rows.reduce((sum, r) => sum + r.amount, 0)
  const issueDate = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#64748B' }}>読み込み中...</div>

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; }
        .no-print { display: flex; }
        @media print {
          .no-print { display: none !important; }
          body > *:not(#payslip-root) { display: none !important; }
          #payslip-root { display: block !important; }
          body { margin: 0; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>

      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, gap: 8, zIndex: 9999 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🖨️ 印刷・PDF保存</button>
        <button onClick={() => window.close()} style={{ marginLeft: 8, padding: '10px 20px', background: '#fff', color: '#64748B', border: '1px solid #EDE0E0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>閉じる</button>
      </div>

      <div id="payslip-root" style={{ maxWidth: 760, margin: '40px auto', padding: '40px 48px', background: '#fff' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #E07070' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#E07070', marginBottom: 4 }}>irodori+</div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>株式会社irodori</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1A2235', marginBottom: 4 }}>支払い明細書</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>{year}年{month}月分</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>発行日：{issueDate}</div>
          </div>
        </div>

        {/* 施設情報 */}
        <div style={{ marginBottom: 28, padding: '16px 20px', background: '#FBF7F7', borderRadius: 10, border: '1px solid #EDE0E0' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>施設名</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2235' }}>{facilityName}</div>
        </div>

        {/* 明細テーブル */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2235', marginBottom: 12 }}>勤務明細</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#FDF0F0' }}>
                {['勤務日', '氏名', '資格', '勤務時間', '給与種別', '金額'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#C45A5A', borderBottom: '1px solid #EDE0E0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                    この月の採用確定した勤務はありません
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.work_date}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.nurse_name}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{row.nurse_license}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>{row.time_from}〜{row.time_to}</td>
                    <td style={{ padding: '10px 12px', color: '#64748B' }}>
                      {row.wage_type === 'hourly' ? `時給 ¥${row.wage_amount.toLocaleString()}` : '日給'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#E07070', fontWeight: 700, textAlign: 'right' }}>
                      ¥{row.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 合計 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36 }}>
          <div style={{ background: '#FDF0F0', border: '1px solid #EDE0E0', borderRadius: 10, padding: '16px 24px', textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>合計支払額</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#E07070' }}>¥{total.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>※税込</div>
          </div>
        </div>

        {/* フッター */}
        <div style={{ borderTop: '1px solid #EDE0E0', paddingTop: 20, fontSize: 11, color: '#94A3B8', lineHeight: 1.8 }}>
          <div>※ 本明細書は irodori+ システムより自動発行されたものです。</div>
          <div>※ 給与は各看護師へ直接お振込みください。</div>
          <div>※ ご不明な点は info@irodori0305.jp までお問い合わせください。</div>
        </div>

      </div>
    </>
  )
}
