'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type RegularJob = {
  id: string
  title: string
  employment_type: string
  salary_type: string
  salary_amount: number
  work_hours: string
  work_days: string
  location: string
  description: string
  insurance: string | null
  transportation: string | null
  holidays: string | null
  childcare_leave: string | null
  parking: string | null
  training: string | null
  welfare: string | null
  trial_period: string | null
  required_license: string
  facility_id: string
  facility_name?: string
  facility_type?: string
}

const C = {
  primary: '#E07070',
  dark: '#C45A5A',
  light: '#FDF0F0',
  bg: '#FBF7F7',
  card: '#FFFFFF',
  border: '#EDE0E0',
  sub: '#64748B',
}

const IRODORI_FACILITY_ID = '2f22fea3-4f1f-4fac-9053-1f8d4b14f523'

export default function RegularJobDetailPage() {
  const { id } = useParams()
  const [job, setJob] = useState<RegularJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [userRole, setUserRole] = useState<'nurse' | 'facility' | null>(null)

  useEffect(() => {
    const fetchJob = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: facility } = await supabase.from('facilities').select('id').eq('id', user.id).maybeSingle()
        setUserRole(facility ? 'facility' : 'nurse')
        // 応募済みチェック
        const { data: app } = await supabase.from('applications').select('id').eq('job_id', id).eq('nurse_id', user.id).maybeSingle()
        if (app) setApplied(true)
      }

      const { data: jobData } = await supabase
        .from('regular_jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (!jobData) { setLoading(false); return }

      const { data: facilityData } = await supabase
        .from('facilities')
        .select('facility_name, facility_type')
        .eq('id', jobData.facility_id)
        .maybeSingle()

      setJob({
        ...jobData,
        facility_name: facilityData?.facility_name ?? '',
        facility_type: facilityData?.facility_type ?? '',
      })
      setLoading(false)
    }
    fetchJob()
  }, [id])

  const handleApply = async () => {
    if (!currentUserId || applying || !job) return
    setApplying(true)
    await supabase.from('applications').insert({ job_id: job.id, nurse_id: currentUserId })

    // 施設のメールアドレスを取得してメール通知
    const { data: facilityAuth } = await supabase.auth.admin ? null : null
    await fetch('/api/regular-job-apply-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        facilityId: job.facility_id,
        nurseId: currentUserId,
        jobTitle: job.title,
      }),
    })
    setApplied(true)
    setApplying(false)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>読み込み中...</div>
  if (!job) return <div style={{ textAlign: 'center', padding: 60 }}>求人が見つかりません</div>

  const isIrodori = job.facility_id === IRODORI_FACILITY_ID

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        <Link href='/regular-jobs' style={{ color: C.sub, fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 20 }}>← 求人一覧に戻る</Link>
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '28px 32px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ background: C.light, color: C.dark, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>{job.employment_type}</span>
            <span style={{ background: '#F1F5F9', color: C.sub, padding: '4px 12px', borderRadius: 20, fontSize: 13 }}>{job.facility_type}</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{job.title}</h1>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.primary, marginBottom: 20 }}>
            {job.salary_type} ¥{job.salary_amount.toLocaleString()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#FBF7F7', borderRadius: 10, padding: 20, marginBottom: 20 }}>
            {[
              ['🏥 施設名', job.facility_name],
              ['📍 勤務地', job.location],
              ['⏰ 勤務時間', job.work_hours],
              ['📅 勤務日', job.work_days],
              ['💼 雇用形態', job.employment_type],
              ['🎓 必要資格', job.required_license === 'rn' ? '正看護師' : '准看護師以上'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>業務内容</div>
            <div style={{ fontSize: 14, color: '#1A2235', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{job.description}</div>
            {[
              { label: '社会保険', value: (job as any).insurance, icon: '🏥' },
              { label: '交通費', value: (job as any).transportation, icon: '🚃' },
              { label: '休日・休暇', value: (job as any).holidays, icon: '📅' },
              { label: '育児・産休', value: (job as any).childcare_leave, icon: '👶' },
              { label: '駐車場', value: (job as any).parking, icon: '🚗' },
              { label: '研修・教育', value: (job as any).training, icon: '📚' },
              { label: '福利厚生', value: (job as any).welfare, icon: '🎁' },
              { label: '試用期間', value: (job as any).trial_period, icon: '📋' },
            ].filter(item => item.value).map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 8, marginTop: 10, padding: '8px 12px', background: '#FBF7F7', borderRadius: 8 }}>
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: '#1A2235' }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          {isIrodori ? (
            <div style={{ background: C.light, borderRadius: 10, padding: 16, fontSize: 13, color: C.dark, lineHeight: 1.8 }}>
              💡 この求人に興味がある方は、irodori＋公式LINEにご連絡ください。<br />
              友だち追加後、求人タイトルとお名前をお送りください。
            </div>
          ) : userRole === 'facility' ? (
            <div style={{ background: '#F1F5F9', borderRadius: 10, padding: 16, fontSize: 13, color: C.sub }}>
              施設アカウントでは応募できません
            </div>
          ) : applied ? (
            <div style={{ textAlign: 'center', padding: 20, background: C.light, borderRadius: 10 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700, color: C.dark }}>応募済み</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>施設からの連絡をお待ちください</div>
            </div>
          ) : currentUserId ? (
            <button onClick={handleApply} disabled={applying} style={{ width: '100%', padding: 16, background: applying ? '#ccc' : C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: applying ? 'not-allowed' : 'pointer' }}>
              {applying ? '応募中...' : 'この求人に応募する'}
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: 16, background: C.light, borderRadius: 10, fontSize: 13 }}>
              応募するには<Link href='/login' style={{ color: C.primary, fontWeight: 700 }}>ログイン</Link>または<Link href='/register' style={{ color: C.primary, fontWeight: 700 }}>会員登録</Link>が必要です
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
