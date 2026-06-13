'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type MonthlyIncome = { month: string; amount: number; count: number }
type Expense = { id: string; date: string; category: string; description: string; amount: number }

const C = {
  primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0',
  border: '#EDE0E0', sub: '#64748B', bg: '#FBF7F7', card: '#FFFFFF', text: '#1A2235',
}

const CATEGORIES = ['交通費', 'ユニフォーム・被服費', '書籍・研修費', '通信費', 'その他']

export default function TaxPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<MonthlyIncome[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ date: '', category: '交通費', description: '', amount: '' })
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      await fetchData(user.id, selectedYear)
      loadExpenses(user.id, selectedYear)
      setLoading(false)
    }
    init()
  }, [])

  const fetchData = async (uid: string, year: number) => {
    const { data: apps } = await supabase
      .from('applications')
      .select('job_id')
      .eq('nurse_id', uid)
      .eq('status', 'accepted')

    if (!apps || apps.length === 0) return

    const jobIds = apps.map((a: any) => a.job_id)
    const { data: jobs } = await supabase
      .from('jobs')
      .select('work_date, wage_amount, wage_type, time_from, time_to')
      .in('id', jobIds)
      .like('work_date', `${year}-%`)

    if (!jobs) return

    const calcAmount = (job: any) => {
      if (job.wage_type !== 'hourly') return job.wage_amount
      const [fh, fm] = job.time_from.split(':').map(Number)
      const [th, tm] = job.time_to.split(':').map(Number)
      return Math.round(job.wage_amount * (th * 60 + tm - fh * 60 - fm) / 60)
    }

    const byMonth: Record<string, { amount: number; count: number }> = {}
    let total = 0
    jobs.forEach((j: any) => {
      const month = j.work_date.slice(0, 7)
      if (!byMonth[month]) byMonth[month] = { amount: 0, count: 0 }
      const amt = calcAmount(j)
      byMonth[month].amount += amt
      byMonth[month].count += 1
      total += amt
    })

    const sorted = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }))

    setMonthlyData(sorted)
    setTotalIncome(total)
  }

  const loadExpenses = (uid: string, year: number) => {
    const key = `tax_expenses_${uid}_${year}`
    const saved = localStorage.getItem(key)
    if (saved) setExpenses(JSON.parse(saved))
  }

  const saveExpenses = (uid: string, year: number, data: Expense[]) => {
    const key = `tax_expenses_${uid}_${year}`
    localStorage.setItem(key, JSON.stringify(data))
  }

  const addExpense = () => {
    if (!expenseForm.date || !expenseForm.amount) return
    const newExpense: Expense = {
      id: Date.now().toString(),
      date: expenseForm.date,
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseInt(expenseForm.amount),
    }
    const updated = [...expenses, newExpense].sort((a, b) => a.date.localeCompare(b.date))
    setExpenses(updated)
    saveExpenses(userId, selectedYear, updated)
    setExpenseForm({ date: '', category: '交通費', description: '', amount: '' })
    setShowExpenseForm(false)
  }

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id)
    setExpenses(updated)
    saveExpenses(userId, selectedYear, updated)
  }

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netIncome = totalIncome - totalExpense
  const needsTaxReturn = netIncome > 200000

  const downloadPDF = () => {
    window.open(`/tax/pdf?year=${selectedYear}&nurseId=${userId}`, '_blank')
  }

  const inp = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as React.CSSProperties

  if (loading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>読み込み中...</div>

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => router.push('/mypage')} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← マイページ</button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>確定申告サポート</h1>
          </div>
          <select value={selectedYear} onChange={async e => {
            const y = parseInt(e.target.value)
            setSelectedYear(y)
            await fetchData(userId, y)
            loadExpenses(userId, y)
          }} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: '#fff', fontFamily: 'inherit' }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}年</option>)}
          </select>
        </div>

        {/* 判定バナー */}
        <div style={{
          background: needsTaxReturn ? '#FEF3C7' : '#D1FAE5',
          border: `1px solid ${needsTaxReturn ? '#FCD34D' : '#6EE7B7'}`,
          borderRadius: 12, padding: '14px 18px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: needsTaxReturn ? '#92400E' : '#064E3B' }}>
              {needsTaxReturn ? '確定申告が必要です' : '現時点では確定申告不要です'}
            </div>
            <div style={{ fontSize: 12, color: needsTaxReturn ? '#854F0B' : '#065F46', marginTop: 2 }}>
              {needsTaxReturn
                ? `所得（収入−経費）が¥${netIncome.toLocaleString()}で20万円を超えています`
                : `所得（収入−経費）が¥${netIncome.toLocaleString()}で20万円以下です`}
            </div>
          </div>
          <span style={{
            background: needsTaxReturn ? '#FEF3C7' : '#D1FAE5',
            color: needsTaxReturn ? '#92400E' : '#064E3B',
            border: `1px solid ${needsTaxReturn ? '#FCD34D' : '#6EE7B7'}`,
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600
          }}>
            {needsTaxReturn ? '要申告' : '申告不要'}
          </span>
        </div>

        {/* 収入サマリー */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{selectedYear}年 収入サマリー</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: '総収入', value: `¥${totalIncome.toLocaleString()}`, color: C.primary },
              { label: '経費合計', value: `¥${totalExpense.toLocaleString()}`, color: C.sub },
              { label: '所得（利益）', value: `¥${netIncome.toLocaleString()}`, color: needsTaxReturn ? '#D97706' : '#059669' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.bg, borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* 月別収入 */}
          {monthlyData.length > 0 ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>月別収入</div>
              {monthlyData.map(d => (
                <div key={d.month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                  <span style={{ color: C.sub }}>{d.month.replace('-', '年')}月</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: C.sub }}>{d.count}回</span>
                    <span style={{ fontWeight: 600, color: C.text }}>¥{d.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: C.sub, fontSize: 13 }}>
              {selectedYear}年の採用確定した勤務はありません
            </div>
          )}
        </div>

        {/* 経費メモ */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>経費メモ</div>
            <button onClick={() => setShowExpenseForm(o => !o)} style={{ background: C.light, color: C.dark, border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {showExpenseForm ? 'キャンセル' : '+ 追加'}
            </button>
          </div>

          {showExpenseForm && (
            <div style={{ background: C.bg, borderRadius: 10, padding: '14px 16px', marginBottom: 14, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: C.sub, display: 'block', marginBottom: 4 }}>日付</label>
                  <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: C.sub, display: 'block', marginBottom: 4 }}>カテゴリ</label>
                  <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, background: '#fff' }}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: C.sub, display: 'block', marginBottom: 4 }}>内容</label>
                <input value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} style={inp} placeholder="バス代・テキスト代など" />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: C.sub, display: 'block', marginBottom: 4 }}>金額（円）</label>
                <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} style={inp} placeholder="3000" />
              </div>
              <button onClick={addExpense} style={{ width: '100%', padding: '10px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                追加する
              </button>
            </div>
          )}

          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: C.sub, fontSize: 13 }}>経費がまだ登録されていません</div>
          ) : (
            <>
              {expenses.map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{e.category}{e.description ? `・${e.description}` : ''}</div>
                    <div style={{ fontSize: 11, color: C.sub }}>{e.date}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>¥{e.amount.toLocaleString()}</span>
                  <button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>×</button>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontSize: 12, color: C.sub }}>経費合計</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>¥{totalExpense.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* 確定申告ガイド */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>確定申告の基本</div>
          <div style={{ background: C.light, borderRadius: 8, padding: '12px 14px', marginBottom: 12, fontSize: 12, color: C.dark, lineHeight: 1.8 }}>
            給与所得以外の所得（収入−経費）が年20万円を超える場合、確定申告が必要です。申告期間は毎年2月16日〜3月15日です。
          </div>
          {[
            { label: '申告方法', value: 'e-Tax（オンライン）または最寄りの税務署' },
            { label: '申告期間', value: '毎年2月16日〜3月15日' },
            { label: '副業バレ対策', value: '住民税の納付方法を「普通徴収」に設定する' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13, gap: 12 }}>
              <span style={{ color: C.sub, flexShrink: 0 }}>{label}</span>
              <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => window.open('https://www.e-tax.nta.go.jp/', '_blank')} style={{ flex: 1, padding: '9px', background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              e-Taxへ →
            </button>
            <button onClick={() => window.open('https://www.nta.go.jp/', '_blank')} style={{ flex: 1, padding: '9px', background: C.bg, color: C.sub, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              国税庁サイトへ →
            </button>
          </div>
        </div>

        {/* PDF出力 */}
        <button onClick={downloadPDF} style={{ width: '100%', padding: '14px', background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
          📄 収支明細PDFを出力
        </button>

        {/* 免責 */}
        <div style={{ background: C.bg, borderRadius: 10, padding: '12px 16px', fontSize: 11, color: C.sub, lineHeight: 1.8, border: `1px solid ${C.border}` }}>
          ※ 本機能は一般的な情報提供を目的としています。個別の税務相談は税理士または最寄りの税務署にご相談ください。irodoriは税務上の責任を負いかねます。
        </div>

      </div>
    </div>
  )
}
