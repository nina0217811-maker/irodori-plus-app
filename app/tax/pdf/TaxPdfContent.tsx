'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Row = { month: string; facility: string; date: string; amount: number }
type Expense = { date: string; category: string; description: string; amount: number }

export default function TaxPdfContent() {
  const searchParams = useSearchParams()
  const year = searchParams.get('year') ?? String(new Date().getFullYear())
  const nurseId = searchParams.get('nurseId') ?? ''

  const [rows, setRows] = useState<Row[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [nurseName, setNurseName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: np } = await supabase.from('nurse_profiles').select('name').eq('id', nurseId).maybeSingle()
      if (np) setNurseName(np.name)

      const { data: apps } = await supabase.from('applications').select('job_id').eq('nurse_id', nurseId).eq('status', 'accepted')
      if (apps && apps.length > 0) {
        const jobIds = apps.map((a: any) => a.job_id)
        const { data: jobs } = await supabase.from('jobs').select('id, work_date, wage_amount, wage_type, time_from, time_to, facility_id').in('id', jobIds).like('work_date', `${year}-%`)
        if (jobs && jobs.length > 0) {
          const fIds = [...new Set(jobs.map((j: any) => j.facility_id))]
          const { data: facs } = await supabase.from('facilities').select('id, facility_name').in('id', fIds)
          const fMap: Record<string, string> = {}
          facs?.forEach((f: any) => { fMap[f.id] = f.facility_name })
          const calcAmt = (j: any) => {
            if (j.wage_type !== 'hourly') return j.wage_amount
            const [fh, fm] = j.time_from.split(':').map(Number)
            const [th, tm] = j.time_to.split(':').map(Number)
            return Math.round(j.wage_amount * (th * 60 + tm - fh * 60 - fm) / 60)
          }
          setRows(jobs.sort((a: any, b: any) => a.work_date.localeCompare(b.work_date)).map((j: any) => ({
            month: j.work_date.slice(0, 7), facility: fMap[j.facility_id] ?? '—', date: j.work_date, amount: calcAmt(j),
          })))
        }
      }

      const key = `tax_expenses_${nurseId}_${year}`
      const saved = localStorage.getItem(key)
      if (saved) setExpenses(JSON.parse(saved))

      setLoading(false)
    }
    init()
  }, [nurseId, year])

  const totalIncome = rows.reduce((s, r) => s + r.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
  const netIncome = totalIncome - totalExpense
  const issueDate = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>読み込み中...</div>

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif; }
        .no-print { display: flex; }
        @media print {
          .no-print { display: none !important; }
          body > *:not(#tax-root) { display: none !important; }
          #tax-root { display: block !important; }
          body { margin: 0; }
          @page { margin: 20mm; size: A4; }
        }
      `}</style>

      <div className="no-print" style={{ position: 'fixed', top: 16, right: 16, gap: 8, zIndex: 9999 }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🖨️ 印刷・PDF保存</button>
        <button onClick={() => window.close()} style={{ marginLeft: 8, padding: '10px 20px', background: '#fff', color: '#64748B', border: '1px solid #EDE0E0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>閉じる</button>
      </div>

      <div id="tax-root" style={{ maxWidth: 700, margin: '40px auto', padding: '40px 48px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, paddingBottom: 16, borderBottom: '2px solid #E07070' }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#E07070', marginBottom: 2 }}>irodori+</div>
            <div style={{ fontSize: 10, color: '#94A3B8' }}>株式会社irodori</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A2235', marginBottom: 2 }}>収支明細書（確定申告用）</div>
            <div style={{ fontSize: 12, color: '#64748B' }}>{year}年分</div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>発行日：{issueDate}</div>
          </div>
        </div>

        <div style={{ marginBottom: 24, padding: '14px 18px', background: '#FBF7F7', borderRadius: 10, border: '1px solid #EDE0E0' }}>
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>氏名</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2235' }}>{nurseName} 様</div>
        </div>

        {/* 収支サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: '総収入', value: `¥${totalIncome.toLocaleString()}`, color: '#E07070' },
            { label: '経費合計', value: `¥${totalExpense.toLocaleString()}`, color: '#64748B' },
            { label: '所得（利益）', value: `¥${netIncome.toLocaleString()}`, color: netIncome > 200000 ? '#D97706' : '#059669' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#FBF7F7', borderRadius: 8, padding: '12px', textAlign: 'center', border: '1px solid #EDE0E0' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 収入明細 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>収入明細</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#FDF0F0' }}>
                {['勤務日', '施設名', '金額'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#C45A5A', borderBottom: '1px solid #EDE0E0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: '#94A3B8' }}>勤務履歴がありません</td></tr>
                : rows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '8px 10px' }}>{r.date}</td>
                    <td style={{ padding: '8px 10px' }}>{r.facility}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#E07070' }}>¥{r.amount.toLocaleString()}</td>
                  </tr>
                ))}
              <tr style={{ borderTop: '1px solid #EDE0E0', background: '#FBF7F7' }}>
                <td colSpan={2} style={{ padding: '8px 10px', fontWeight: 700 }}>収入合計</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#E07070' }}>¥{totalIncome.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 経費明細 */}
        {expenses.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>経費明細</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#FDF0F0' }}>
                  {['日付', 'カテゴリ', '内容', '金額'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#C45A5A', borderBottom: '1px solid #EDE0E0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '8px 10px' }}>{e.date}</td>
                    <td style={{ padding: '8px 10px' }}>{e.category}</td>
                    <td style={{ padding: '8px 10px', color: '#64748B' }}>{e.description || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>¥{e.amount.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #EDE0E0', background: '#FBF7F7' }}>
                  <td colSpan={3} style={{ padding: '8px 10px', fontWeight: 700 }}>経費合計</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>¥{totalExpense.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 所得合計 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
          <div style={{ background: '#FDF0F0', border: '1px solid #EDE0E0', borderRadius: 10, padding: '14px 20px', textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>所得（収入−経費）</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#E07070' }}>¥{netIncome.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: netIncome > 200000 ? '#D97706' : '#059669', marginTop: 4, fontWeight: 600 }}>
              {netIncome > 200000 ? '⚠️ 確定申告が必要です（20万円超）' : '✓ 現時点では確定申告不要（20万円以下）'}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #EDE0E0', paddingTop: 16, fontSize: 10, color: '#94A3B8', lineHeight: 1.8 }}>
          <div>※ 本明細書は irodori+ システムより自動発行されたものです。</div>
          <div>※ 本資料は一般的な情報提供を目的としています。個別の税務相談は税理士または税務署にご相談ください。</div>
          <div>※ ご不明な点は info@irodori0305.jp までお問い合わせください。</div>
        </div>
      </div>
    </>
  )
}
