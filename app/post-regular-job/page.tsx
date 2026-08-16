'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

function PostRegularJobForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [planBlocked, setPlanBlocked] = useState(false)
  const [form, setForm] = useState({
    title: '',
    employment_type: '常勤',
    salary_type: '月給',
    salary_amount: '',
    work_hours: '',
    work_days: '',
    location: '',
    description: '',
    required_license: 'rn',
    hire_flow: 'interview',
    insurance: '',
    transportation: '',
    holidays: '',
    childcare_leave: '',
    parking: '',
    training: '',
    welfare: '',
    trial_period: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)

      if (!editId) {
        const { data: facility } = await supabase
          .from('facilities')
          .select('subscription_plan, plan_status, created_at, allow_regular_jobs')
          .eq('id', data.user.id)
          .maybeSingle()

        if (facility) {
          // allow_regular_jobs が true なら問答無用で通す（モニター・特別契約施設）
          if (facility.allow_regular_jobs) {
            // ブロックしない
          } else {
            const plan = facility.subscription_plan
            const isActive = facility.plan_status === 'active'
            const createdAt = new Date(facility.created_at)
            const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
            const isWithinTrial = daysSince <= 30
            const isLightOnly = isActive && plan === 'ume'
            const isExpiredFree = !isActive && !isWithinTrial

            if (isLightOnly || isExpiredFree) {
              setPlanBlocked(true)
            }
          }
        }
      }

      if (editId) {
        const { data: job } = await supabase.from('regular_jobs').select('*').eq('id', editId).eq('facility_id', data.user.id).maybeSingle()
        if (job) {
          setForm({
            title: job.title ?? '',
            employment_type: job.employment_type ?? '常勤',
            salary_type: job.salary_type ?? '月給',
            salary_amount: String(job.salary_amount ?? ''),
            work_hours: job.work_hours ?? '',
            work_days: job.work_days ?? '',
            location: job.location ?? '',
            description: job.description ?? '',
            required_license: job.required_license ?? 'rn',
            insurance: job.insurance ?? '',
            transportation: job.transportation ?? '',
            holidays: job.holidays ?? '',
            childcare_leave: job.childcare_leave ?? '',
            parking: job.parking ?? '',
            training: job.training ?? '',
            welfare: job.welfare ?? '',
            trial_period: job.trial_period ?? '',
          })
        }
      }
    })
  }, [editId])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setLoading(true)

    const payload = {
      facility_id: userId,
      title: form.title,
      employment_type: form.employment_type,
      salary_type: form.salary_type,
      salary_amount: parseInt(form.salary_amount),
      work_hours: form.work_hours,
      work_days: form.work_days,
      location: form.location,
      description: form.description,
      required_license: form.required_license,
      hire_flow: (form as any).hire_flow ?? 'interview',
      insurance: form.insurance || null,
      transportation: form.transportation || null,
      holidays: form.holidays || null,
      childcare_leave: form.childcare_leave || null,
      parking: form.parking || null,
      training: form.training || null,
      welfare: form.welfare || null,
      trial_period: form.trial_period || null,
      status: 'open',
    }

    const { error } = editId
      ? await supabase.from('regular_jobs').update(payload).eq('id', editId)
      : await supabase.from('regular_jobs').insert(payload)

    if (!error) {
      await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `【新着求人・${form.employment_type}】\n💼 ${form.title}\n📍 ${form.location}\n💰 ${form.salary_type} ¥${parseInt(form.salary_amount).toLocaleString()}\n⏰ ${form.work_hours}\n\n詳細はこちら👇\nhttps://irodori0305.jp/regular-jobs`,
        }),
      })
      setDone(true)
    } else {
      alert('投稿に失敗しました: ' + error.message)
    }
    setLoading(false)
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }

  if (done) return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>求人を投稿しました</h2>
      <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: 12, background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
        ダッシュボードへ
      </button>
    </div>
  )

  if (planBlocked) return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: 20, fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#1A2235' }}>
        常勤・パート掲載はスタンダード以上のプランで利用できます
      </h2>
      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.8, marginBottom: 24 }}>
        現在のプランでは単発求人のみ掲載可能です。<br />
        スタンダード（¥29,800/月）へアップグレードすると<br />
        常勤・パート求人の掲載ができるようになります。
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => window.open('https://irodori0305.jp/#plan', '_blank')}
          style={{ width: '100%', padding: 13, background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          プランを確認する
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ width: '100%', padding: 13, background: 'none', color: '#64748B', border: '1px solid #EDE0E0', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
        >
          ダッシュボードへ戻る
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>
      <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>← 戻る</button>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>{editId ? '常勤・パート求人を編集する' : '常勤・パート求人を投稿する'}</h1>

      <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #EDE0E0' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>求人タイトル *</label>
          <input required value={form.title} onChange={e => set('title', e.target.value)} style={inp} placeholder='例：正看護師募集・クリニック外来' />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>雇用形態 *</label>
            <select required value={form.employment_type} onChange={e => set('employment_type', e.target.value)} style={inp}>
              <option>常勤</option>
              <option>パート</option>
              <option>契約社員</option>
              <option>派遣</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>給与形態 *</label>
            <select required value={form.salary_type} onChange={e => set('salary_type', e.target.value)} style={inp}>
              <option>月給</option>
              <option>時給</option>
              <option>日給</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>給与金額（円） *</label>
          <input required type='number' value={form.salary_amount} onChange={e => set('salary_amount', e.target.value)} style={inp} placeholder='例：250000' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>勤務地 *</label>
          <input required value={form.location} onChange={e => set('location', e.target.value)} style={inp} placeholder='例：沖縄県那覇市おもろまち1-1-1' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>勤務時間 *</label>
          <input required value={form.work_hours} onChange={e => set('work_hours', e.target.value)} style={inp} placeholder='例：08:30〜17:30' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>勤務日 *</label>
          <input required value={form.work_days} onChange={e => set('work_days', e.target.value)} style={inp} placeholder='例：月〜金（土日祝休み）' />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>採用フロー *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { value: 'direct', label: '⚡ 即採用型', desc: '応募 → 採用/不採用 → チャット開放' },
              { value: 'interview', label: '💬 面談型', desc: '応募 → チャット開放 → 面談 → 採用確定（正社員におすすめ）' },
            ].map(option => (
              <label key={option.value} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${(form as any).hire_flow === option.value ? '#E07070' : '#EDE0E0'}`, background: (form as any).hire_flow === option.value ? '#FDF0F0' : '#fff', cursor: 'pointer' }}>
                <input type="radio" name="hire_flow" value={option.value} checked={(form as any).hire_flow === option.value} onChange={() => set('hire_flow', option.value)} style={{ marginTop: 3, accentColor: '#E07070' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2235', marginBottom: 2 }}>{option.label}</div>
                  <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>{option.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>必要資格 *</label>
          <select required value={form.required_license} onChange={e => set('required_license', e.target.value)} style={inp}>
            <option value='rn'>正看護師</option>
            <option value='lpn'>准看護師以上</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>業務内容 *</label>
          <textarea required value={form.description} onChange={e => set('description', e.target.value)}
            placeholder='業務内容、職場環境、待遇など...'
            style={{ ...inp, height: '120px', resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 16, background: '#FBF7F7', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 10 }}>追加情報（任意）</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'insurance', label: '社会保険', placeholder: '健康保険・厚生年金・雇用保険・労災保険完備' },
              { key: 'transportation', label: '交通費', placeholder: '全額支給・上限1万円/月など' },
              { key: 'holidays', label: '休日・休暇', placeholder: '完全週休2日制・年間休日120日・有給20日など' },
              { key: 'childcare_leave', label: '育児・産休', placeholder: '産休・育休取得実績あり' },
              { key: 'parking', label: '駐車場', placeholder: '無料駐車場あり' },
              { key: 'training', label: '研修・教育', placeholder: '入職時研修あり・資格取得支援制度あり' },
              { key: 'welfare', label: '福利厚生', placeholder: '院内保育所・寮完備・各種手当など' },
              { key: 'trial_period', label: '試用期間', placeholder: '3ヶ月（条件変更なし）' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: '#64748B', display: 'block', marginBottom: 4 }}>{label}</label>
                <input type='text' value={(form as any)[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #EDE0E0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const, fontFamily: 'inherit' }} />
              </div>
            ))}
          </div>
        </div>

        <button type='submit' disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '保存中...' : editId ? '変更を保存する' : '求人を投稿する'}
        </button>
      </form>
    </div>
  )
}

export default function PostRegularJobPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>読み込み中...</div>}>
      <PostRegularJobForm />
    </Suspense>
  )
}
