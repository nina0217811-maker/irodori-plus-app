'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Application = {
  id: string
  nurse_id: string
  status: string
}

type Job = {
  id: string
  work_date: string
  time_from: string
  time_to: string
  wage_amount: number
  wage_type: string
  facility_type: string
  status: string
  is_urgent: boolean
  required_count: number
  applications: Application[]
}

type RegularJob = {
  id: string
  title: string
  employment_type: string
  salary_type: string
  salary_amount: number
  work_hours: string
  work_days: string
  location: string
  status: string
}

type BankAccount = {
  bank_name: string
  branch_name: string
  account_type: string
  account_number: string
  account_holder: string
}

type NurseProfile = {
  nurseId: string
  name: string
  license: string
  experience_years: number
  areas: string[]
  skills: string[]
  age?: number
  gender?: string
  avg_rating?: number
  review_count?: number
  direct_cancel_count?: number
  license_url?: string
  bank_account?: BankAccount
}

const REJECT_REASONS = ['応募要件と合わなかった', '定員に達した', '求人を取り下げた', 'その他']

const CANCEL_REASONS = [
  '採用が決まった',
  '費用が高い',
  '応募が来なかった',
  '使いにくかった',
  'サービスが期待と違った',
  'その他',
]

const S = {
  card: { background: '#fff', border: '0.5px solid #EDE0E0', borderRadius: '12px', padding: '16px 20px', marginBottom: '12px' } as React.CSSProperties,
  badge: (bg: string, color: string) => ({ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '500', background: bg, color } as React.CSSProperties),
  btn: (bg: string, border: string, color: string) => ({ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${border}`, background: bg, color, cursor: 'pointer', fontWeight: '500', fontFamily: 'inherit', whiteSpace: 'nowrap' } as React.CSSProperties),
  row: { display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #F1F5F9', gap: '10px' } as React.CSSProperties,
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: '#FDF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '500', color: '#C45A5A', flexShrink: 0 } as React.CSSProperties,
  divider: { height: '0.5px', background: '#EDE0E0', margin: '10px 0' } as React.CSSProperties,
}

export default function DashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [regularJobs, setRegularJobs] = useState<RegularJob[]>([])
  const [loading, setLoading] = useState(true)
  const [facilityName, setFacilityName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [reviewModal, setReviewModal] = useState<{ jobId: string, nurseId: string, nurseName: string } | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviews, setReviews] = useState<{ nurse_id: string, job_id: string }[]>([])
  const [nurseNames, setNurseNames] = useState<{ [key: string]: string }>({})
  const [renotifying, setRenotifying] = useState<string | null>(null)
  const [profileModal, setProfileModal] = useState<NurseProfile | null>(null)
  const [reportModal, setReportModal] = useState<{ nurseId: string; nurseName: string } | null>(null)
  const [editJobModal, setEditJobModal] = useState<Job | null>(null)
  const [editJobForm, setEditJobForm] = useState({ work_date: '', time_from: '', time_to: '', wage_amount: '', address: '', facility_type: '', description: '', items_to_bring: '', dress_code: '', parking: '', lunch: '' })
  const [savingJob, setSavingJob] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetail, setReportDetail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(true)
  const [isRegularLocked, setIsRegularLocked] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [rejectModal, setRejectModal] = useState<{ applicationId: string, nurseId: string, nurseName: string, jobId: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  // 解約関連
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelDetail, setCancelDetail] = useState('')
  const [canceling, setCanceling] = useState(false)

  useEffect(() => { fetchData() }, [])

  const handleSubscribe = async (plan: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ facilityId: user.id, facilityName, email: user.email, plan }) })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  const handleCancelPlan = async () => {
    if (!cancelReason || !userId) return
    setCanceling(true)
    const res = await fetch('/api/cancel-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facilityId: userId, reason: cancelReason, detail: cancelDetail }),
    })
    if (res.ok) {
      setShowCancelModal(false)
      setCancelReason('')
      setCancelDetail('')
      alert('解約申請を受け付けました。現在の契約期間終了後に解約されます。')
      fetchData()
    } else {
      alert('解約処理に失敗しました。お手数ですが info@irodori0305.jp までご連絡ください。')
    }
    setCanceling(false)
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('この求人を削除しますか？')) return
    const { data: apps } = await supabase.from('applications').select('id').eq('job_id', jobId)
    if (apps) { for (const app of apps) { await supabase.from('messages').delete().eq('application_id', app.id) } }
    await supabase.from('applications').delete().eq('job_id', jobId)
    await supabase.from('favorites').delete().eq('job_id', jobId)
    await supabase.from('reviews').delete().eq('job_id', jobId)
    await supabase.from('jobs').delete().eq('id', jobId)
    fetchData()
  }

  const handleDeleteRegularJob = async (jobId: string) => {
    if (!confirm('この求人を削除しますか？')) return
    await supabase.from('regular_jobs').delete().eq('id', jobId)
    fetchData()
  }

  const handleRenotify = async (job: Job) => {
    setRenotifying(job.id)
    await fetch('/api/line-notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `【再募集】キャンセルが出ました！\n📅 ${job.work_date}\n⏰ ${job.time_from}〜${job.time_to}\n🏥 ${job.facility_type}\n💰 日給 ¥${job.wage_amount?.toLocaleString()}\n\n急募！求人を見る👇\nhttps://irodori0305.jp/jobs` }) })
    setRenotifying(null)
    alert('再募集通知を送りました！')
  }

  const handleViewProfile = async (nurseId: string) => {
    const { data: np } = await supabase.from('nurse_profiles').select('name, license, experience_years, areas, skills, age, gender, license_url').eq('id', nurseId).single()
    const { data: reviewData } = await supabase.from('reviews').select('rating').eq('nurse_id', nurseId)
    const { data: cancelData } = await supabase.from('cancel_history').select('cancel_type').eq('nurse_id', nurseId)
    const { data: bankData } = await supabase.from('bank_accounts').select('bank_name, branch_name, account_type, account_number, account_holder').eq('nurse_id', nurseId).maybeSingle()
    const avgRating = reviewData && reviewData.length > 0 ? Math.round(reviewData.reduce((s: number, r: any) => s + r.rating, 0) / reviewData.length * 10) / 10 : undefined
    const directCancelCount = (cancelData ?? []).filter((c: any) => c.cancel_type === 'direct' || c.cancel_type === 'absent').length
    setProfileModal({ ...(np as NurseProfile), nurseId, avg_rating: avgRating, review_count: reviewData?.length ?? 0, direct_cancel_count: directCancelCount, license_url: np?.license_url ?? undefined, bank_account: bankData ?? undefined })
  }

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    setUserId(userData.user.id)

    const { data: facility } = await supabase
      .from('facilities')
      .select('facility_name, plan_status, is_subscribed, subscription_plan, allow_regular_jobs, created_at')
      .eq('id', userData.user.id)
      .single()

    if (facility) {
      setFacilityName(facility.facility_name)
      setIsSubscribed(facility.plan_status === 'active' || facility.is_subscribed)

      if (facility.allow_regular_jobs) {
        setIsRegularLocked(false)
      } else {
        const plan = facility.subscription_plan
        const isActive = facility.plan_status === 'active'
        const createdAt = new Date(facility.created_at)
        const daysSince = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        const isWithinTrial = daysSince <= 30
        const isLightOnly = isActive && plan === 'ume'
        const isExpiredFree = !isActive && !isWithinTrial
        setIsRegularLocked(isLightOnly || isExpiredFree)
      }
    }

    const { data: jobData } = await supabase.from('jobs').select('*, applications (id, nurse_id, status)').eq('facility_id', userData.user.id)
    if (jobData) {
      setJobs(jobData)
      const nurseIds = [...new Set(jobData.flatMap((j: any) => j.applications.map((a: any) => a.nurse_id)))]
      if (nurseIds.length > 0) {
        const { data: profiles } = await supabase.from('nurse_profiles').select('id, name').in('id', nurseIds)
        if (profiles) {
          const nameMap: { [key: string]: string } = {}
          profiles.forEach((p: any) => { nameMap[p.id] = p.name })
          setNurseNames(nameMap)
        }
      }
    }
    const { data: regularJobData } = await supabase.from('regular_jobs').select('*').eq('facility_id', userData.user.id)
    if (regularJobData) setRegularJobs(regularJobData)
    const { data: reviewData } = await supabase.from('reviews').select('nurse_id, job_id').eq('facility_id', userData.user.id)
    if (reviewData) setReviews(reviewData)
    setLoading(false)
  }

  const closeJob = async (jobId: string) => {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId)
    fetchData()
  }

  const acceptNurse = async (applicationId: string, nurseId: string, jobId: string) => {
    await supabase.from('applications').update({ status: 'accepted' }).eq('id', applicationId)
    await fetch('/api/notify-accepted', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nurseId, jobId, facilityId: userId }) })
    const { data: jobData } = await supabase.from('jobs').select('required_count, applications(id, status, nurse_id)').eq('id', jobId).single()
    if (jobData) {
      const acceptedCount = (jobData.applications as any[]).filter((a: any) => a.id === applicationId || a.status === 'accepted').length
      if (acceptedCount >= jobData.required_count) {
        await supabase.from('jobs').update({ status: 'filled' }).eq('id', jobId)
        const pendingNurseIds = (jobData.applications as any[]).filter((a: any) => a.status === 'pending' && a.id !== applicationId).map((a: any) => a.nurse_id)
        if (pendingNurseIds.length > 0) {
          await fetch('/api/notify-rejected', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nurseIds: pendingNurseIds, facilityName, jobId }) })
        }
      }
    }
    fetchData()
  }

  const rejectNurse = async () => {
    if (!rejectModal || !rejectReason) return
    setRejecting(true)
    await supabase.from('applications').update({ status: 'rejected' }).eq('id', rejectModal.applicationId)
    await fetch('/api/notify-rejected', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nurseIds: [rejectModal.nurseId], facilityName, jobId: rejectModal.jobId, reason: rejectReason }) })
    setRejecting(false)
    setRejectModal(null)
    setRejectReason('')
    fetchData()
  }

  const submitReview = async () => {
    if (!reviewModal || !userId || rating === 0) return
    setSubmitting(true)
    await supabase.from('reviews').insert({ job_id: reviewModal.jobId, facility_id: userId, nurse_id: reviewModal.nurseId, rating, comment })
    const { data: application } = await supabase.from('applications').select('id').eq('job_id', reviewModal.jobId).eq('nurse_id', reviewModal.nurseId).single()
    if (application) {
      const stars = '⭐'.repeat(rating)
      await supabase.from('messages').insert({ application_id: application.id, sender_id: userId, body: `${stars} 評価が届きました！\n評価：${rating} / 5${comment ? `\nコメント：${comment}` : ''}` })
    }
    await fetch('/api/notify-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nurseId: reviewModal.nurseId, rating, comment, facilityName }) })
    setReviewModal(null); setRating(0); setComment(''); setSubmitting(false)
    fetchData()
  }

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applications?.length || 0), 0)
  const openJobs = jobs.filter(j => j.status === 'open')
  const acceptedTotal = jobs.reduce((sum, j) => sum + (j.applications?.filter(a => a.status === 'accepted').length || 0), 0)

  const modalBase: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }
  const modalBox: React.CSSProperties = { background: '#fff', borderRadius: '16px', padding: '28px', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>

      {/* ===== 解約モーダル ===== */}
      {showCancelModal && (
        <div style={{ ...modalBase, zIndex: 600 }}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1A2235' }}>プランの解約</h2>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelDetail('') }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px', lineHeight: 1.7 }}>
              解約すると現在の契約期間終了後にプランが停止されます。<br />
              よろしければ解約理由をお聞かせください。
            </p>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A2235', marginBottom: '10px' }}>解約理由 *</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {CANCEL_REASONS.map(reason => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${cancelReason === reason ? '#E07070' : '#EDE0E0'}`, background: cancelReason === reason ? '#FDF0F0' : '#fff' }}>
                  <input type="radio" name="cancelReason" value={reason} checked={cancelReason === reason} onChange={() => setCancelReason(reason)} style={{ accentColor: '#E07070' }} />
                  <span style={{ fontSize: '14px' }}>{reason}</span>
                </label>
              ))}
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1A2235', marginBottom: '6px' }}>その他・詳細（任意）</div>
              <textarea
                value={cancelDetail}
                onChange={e => setCancelDetail(e.target.value)}
                placeholder="サービスへのご意見・改善点などがあればご記入ください"
                style={{ ...inp, height: '80px', resize: 'vertical' }}
              />
            </div>
            <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: '#92400E', lineHeight: 1.7 }}>
              ⚠️ 解約後も現在の契約期間終了日まではサービスをご利用いただけます。
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelDetail('') }} style={{ flex: 1, padding: '11px', background: '#fff', color: '#64748B', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                キャンセル
              </button>
              <button
                onClick={handleCancelPlan}
                disabled={!cancelReason || canceling}
                style={{ flex: 2, padding: '11px', background: !cancelReason || canceling ? '#ccc' : '#DC2626', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: !cancelReason || canceling ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {canceling ? '処理中...' : '解約を申請する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 不採用モーダル ===== */}
      {rejectModal && (
        <div style={modalBase}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>不採用通知を送る</h2>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>{rejectModal.nurseName} さんに不採用通知を送ります</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {REJECT_REASONS.map(reason => (
                <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px 14px', borderRadius: '8px', border: `1.5px solid ${rejectReason === reason ? '#E07070' : '#EDE0E0'}`, background: rejectReason === reason ? '#FDF0F0' : '#fff' }}>
                  <input type="radio" name="rejectReason" value={reason} checked={rejectReason === reason} onChange={() => setRejectReason(reason)} style={{ accentColor: '#E07070' }} />
                  <span style={{ fontSize: '14px' }}>{reason}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748B', fontFamily: 'inherit' }}>キャンセル</button>
              <button onClick={rejectNurse} disabled={!rejectReason || rejecting} style={{ flex: 2, padding: '10px', background: !rejectReason || rejecting ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: !rejectReason || rejecting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {rejecting ? '送信中...' : '不採用通知を送る'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 求人編集モーダル ===== */}
      {editJobModal && (
        <div style={modalBase}>
          <div style={{ ...modalBox, maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>求人を編集</h2>
              <button onClick={() => setEditJobModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            {[{ label: '勤務日', type: 'date', key: 'work_date' }].map(f => (
              <div key={f.key} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '5px' }}>{f.label}</label>
                <input type={f.type} value={(editJobForm as any)[f.key]} onChange={e => setEditJobForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={inp} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              {[{ label: '開始時間', key: 'time_from' }, { label: '終了時間', key: 'time_to' }].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '5px' }}>{f.label}</label>
                  <input type="time" value={(editJobForm as any)[f.key]} onChange={e => setEditJobForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
            </div>
            {[{ label: '日給（円）', key: 'wage_amount', type: 'number' }, { label: '勤務地', key: 'address', type: 'text' }].map(f => (
              <div key={f.key} style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '5px' }}>{f.label}</label>
                <input type={f.type} value={(editJobForm as any)[f.key]} onChange={e => setEditJobForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={inp} />
              </div>
            ))}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '5px' }}>施設種別</label>
              <select value={editJobForm.facility_type} onChange={e => setEditJobForm(f => ({ ...f, facility_type: e.target.value }))} style={inp}>
                <option value="">選択してください</option>
                {['病院','クリニック','介護老人保健施設','訪問看護','デイサービス','訪問入浴','グループホーム','特別養護老人ホーム','有料老人ホーム','障害者施設','保育園','その他'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '5px' }}>業務内容</label>
              <textarea value={editJobForm.description} onChange={e => setEditJobForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, height: '80px', resize: 'vertical' }} />
              <div style={{ background: '#FBF7F7', borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>追加情報（任意）</div>
                {[{ key: 'items_to_bring', label: '持ち物・準備物' }, { key: 'dress_code', label: '服装・身だしなみ' }, { key: 'parking', label: '駐車場' }, { key: 'lunch', label: '昼食' }].map(({ key, label }) => (
                  <div key={key} style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 3 }}>{label}</label>
                    <input type='text' value={(editJobForm as any)[key]} onChange={e => setEditJobForm(f => ({ ...f, [key]: e.target.value }))} style={{ ...inp, fontSize: 13 }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setEditJobModal(null)} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748B', fontFamily: 'inherit' }}>キャンセル</button>
              <button onClick={async () => {
                setSavingJob(true)
                const { error } = await supabase.from('jobs').update({ work_date: editJobForm.work_date, time_from: editJobForm.time_from, time_to: editJobForm.time_to, wage_amount: parseInt(editJobForm.wage_amount), address: editJobForm.address, facility_type: editJobForm.facility_type, description: editJobForm.description, items_to_bring: editJobForm.items_to_bring || null, dress_code: editJobForm.dress_code || null, parking: editJobForm.parking || null, lunch: editJobForm.lunch || null }).eq('id', editJobModal.id)
                setSavingJob(false)
                if (!error) { setEditJobModal(null); fetchData() } else alert('保存に失敗しました')
              }} disabled={savingJob} style={{ flex: 2, padding: '10px', background: savingJob ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                {savingJob ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 通報モーダル ===== */}
      {reportModal && (
        <div style={modalBase}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>通報する</h2>
              <button onClick={() => { setReportModal(null); setReportReason(''); setReportDetail('') }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>{reportModal.nurseName} さんを通報します</p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '5px' }}>通報理由 *</label>
              <select value={reportReason} onChange={e => setReportReason(e.target.value)} style={inp}>
                <option value="">選択してください</option>
                {['無断欠勤','虚偽情報','不適切な言動','その他'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '5px' }}>詳細</label>
              <textarea value={reportDetail} onChange={e => setReportDetail(e.target.value)} placeholder="詳しい状況を記入してください" style={{ ...inp, height: '80px', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setReportModal(null); setReportReason(''); setReportDetail('') }} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748B', fontFamily: 'inherit' }}>キャンセル</button>
              <button onClick={async () => {
                if (!reportReason) { alert('通報理由を選択してください'); return }
                setReporting(true)
                await supabase.from('reports').insert({ facility_id: userId, nurse_id: reportModal.nurseId, reason: reportReason, detail: reportDetail })
                setReporting(false); setReportModal(null); setReportReason(''); setReportDetail('')
                alert('通報を受け付けました。運営が確認します。')
              }} disabled={!reportReason || reporting} style={{ flex: 2, padding: '10px', background: !reportReason || reporting ? '#ccc' : '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                {reporting ? '送信中...' : '通報する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== プロフィールモーダル ===== */}
      {profileModal && (
        <div style={{ ...modalBase, zIndex: 400 }}>
          <div style={modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600' }}>看護師プロフィール</h2>
              <button onClick={() => setProfileModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: 48, height: 48, borderRadius: 24, background: 'linear-gradient(135deg, #E07070, #C0727A)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600 }}>{profileModal.name?.charAt(0) ?? '?'}</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>{profileModal.name ?? '未設定'}</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {profileModal.license === 'rn' ? '正看護師' : '准看護師'}{profileModal.age ? ` · ${profileModal.age}歳` : ''}{profileModal.gender ? ` · ${profileModal.gender}` : ''}
                </div>
                {profileModal.license_url && <span style={{ background: '#D1FAE5', color: '#065F46', padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>免許証提出済み</span>}
              </div>
            </div>
            <div style={{ background: '#FBF7F7', borderRadius: '10px', padding: '14px', marginBottom: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[['経験年数', profileModal.experience_years ? `${profileModal.experience_years}年` : '未設定'], ['活動エリア', profileModal.areas?.join('・') || '未設定']].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>{l}</div><div style={{ fontSize: '13px', fontWeight: '600' }}>{v}</div></div>
              ))}
            </div>
            {profileModal.skills?.length > 0 && (
              <div style={{ marginBottom: '14px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {profileModal.skills.map(s => <span key={s} style={{ background: '#FDF0F0', color: '#C45A5A', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>{s}</span>)}
              </div>
            )}
            {profileModal.license_url && (
              <div style={{ marginBottom: '14px' }}>
                <button onClick={() => window.open(profileModal.license_url, '_blank')} style={{ padding: '7px 14px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>免許証を確認する</button>
              </div>
            )}
            {(() => {
              const cancel = profileModal.direct_cancel_count ?? 0; const r = profileModal.avg_rating ?? 0; const rv = profileModal.review_count ?? 0
              let rank = { label: 'ブロンズ', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' }
              if (cancel >= 2) rank = { label: '要注意', bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' }
              else if (cancel === 0 && r >= 4.0 && rv >= 3) rank = { label: 'ゴールド', bg: '#FEF9C3', color: '#92400E', border: '#F59E0B' }
              else if (cancel <= 1 && r >= 3.0) rank = { label: 'シルバー', bg: '#F1F5F9', color: '#475569', border: '#94A3B8' }
              return <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}><div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: rank.bg, border: `1.5px solid ${rank.border}`, borderRadius: '20px', padding: '5px 14px' }}><span style={{ fontSize: '12px', fontWeight: '600', color: rank.color }}>信頼ランク：{rank.label}</span></div></div>
            })()}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: '#065F46' }}>{profileModal.avg_rating ?? '—'}</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>平均評価（{profileModal.review_count}件）</div>
              </div>
              <div style={{ background: profileModal.direct_cancel_count && profileModal.direct_cancel_count > 0 ? '#FEF2F2' : '#F0FDF4', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: '600', color: profileModal.direct_cancel_count && profileModal.direct_cancel_count > 0 ? '#991B1B' : '#065F46' }}>{profileModal.direct_cancel_count ?? 0}回</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>直前キャンセル履歴</div>
              </div>
            </div>
            {profileModal.bank_account ? (
              <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '14px 16px', marginBottom: '14px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#065F46', marginBottom: '10px' }}>💳 振込口座情報</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[['銀行名', profileModal.bank_account.bank_name], ['支店名', profileModal.bank_account.branch_name], ['口座種別', profileModal.bank_account.account_type], ['口座番号', profileModal.bank_account.account_number], ['口座名義', profileModal.bank_account.account_holder]].map(([label, value]) => (
                    <div key={label}><div style={{ fontSize: '10px', color: '#64748B', marginBottom: '2px' }}>{label}</div><div style={{ fontSize: '13px', fontWeight: '600', color: '#1A2235' }}>{value}</div></div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ background: '#FBF7F7', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', fontSize: '12px', color: '#94A3B8' }}>💳 口座情報未登録</div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { const name = profileModal.name ?? '不明'; const nurseId = profileModal.nurseId ?? ''; setProfileModal(null); setReportModal({ nurseId, nurseName: name }) }} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>通報</button>
              <button onClick={() => setProfileModal(null)} style={{ flex: 2, padding: '10px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 評価モーダル ===== */}
      {reviewModal && (
        <div style={{ ...modalBase, zIndex: 300 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '380px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>看護師を評価する</h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>{reviewModal.nurseName}</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
              {[1,2,3,4,5].map(s => <span key={s} onClick={() => setRating(s)} style={{ fontSize: '32px', cursor: 'pointer', opacity: s <= rating ? 1 : 0.25 }}>⭐</span>)}
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="コメント（任意）" style={{ ...inp, height: '70px', resize: 'vertical', marginBottom: '14px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setReviewModal(null); setRating(0); setComment('') }} style={{ flex: 1, padding: '10px', background: 'none', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#64748B', fontFamily: 'inherit' }}>キャンセル</button>
              <button onClick={submitReview} disabled={rating === 0 || submitting} style={{ flex: 1, padding: '10px', background: rating === 0 ? '#ccc' : '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: rating === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {submitting ? '送信中...' : '評価する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 未契約バナー ===== */}
      {!isSubscribed && (
        <div onClick={() => setShowPlanModal(true)} style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>プランに加入して求人を掲載しましょう</div>
            <div style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>単発求人プラン ¥11,000/月〜。タップしてプランを選択</div>
          </div>
          <span style={{ fontSize: 13, color: '#92400E', fontWeight: 700 }}>プランを見る →</span>
        </div>
      )}

      {/* ===== プラン選択モーダル ===== */}
      {showPlanModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>プランを選択</div>
              <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 20 }}>大手求人サイトは2週間で¥90,000〜。irodori+は月額で使い放題です。</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#fff', border: '1px solid #EDE0E0', borderRadius: 12, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div><span style={{ background: '#FBF7F7', color: '#94A3B8', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginBottom: 6, display: 'inline-block' }}>ライト</span><div style={{ fontSize: 15, fontWeight: 700 }}>単発求人プラン</div></div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#E07070' }}>¥11,000<span style={{ fontSize: 12, color: '#64748B', fontWeight: 400 }}>/月</span></div>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8, marginBottom: 14 }}>単発求人を無制限掲載・看護師への即時LINE通知・チャット・支払い明細管理</div>
                <button onClick={() => { setShowPlanModal(false); handleSubscribe('ume') }} style={{ width: '100%', padding: '10px', background: '#fff', color: '#E07070', border: '1.5px solid #E07070', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>ライトプランで始める</button>
              </div>
              <div style={{ background: '#FDF0F0', border: '2px solid #E07070', borderRadius: 12, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div><span style={{ background: '#E07070', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginBottom: 6, display: 'inline-block' }}>スタンダード・おすすめ</span><div style={{ fontSize: 15, fontWeight: 700 }}>正社員・パート求人プラン</div></div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#E07070' }}>¥29,800<span style={{ fontSize: 12, color: '#64748B', fontWeight: 400 }}>/月</span></div>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8, marginBottom: 14 }}>単発 + 正社員・パート求人掲載・引き抜きOK・チャット・支払い明細管理</div>
                <button onClick={() => { setShowPlanModal(false); handleSubscribe('take') }} style={{ width: '100%', padding: '10px', background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>スタンダードプランで始める</button>
              </div>
              <div style={{ background: '#fff', border: '1px solid #EDE0E0', borderRadius: 12, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div><span style={{ background: '#1A2235', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, marginBottom: 6, display: 'inline-block' }}>プレミアム・採用ブランディング</span><div style={{ fontSize: 15, fontWeight: 700 }}>プレミアムプラン</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 13, fontWeight: 700, color: '#E07070' }}>初期¥66,000</div><div style={{ fontSize: 13, fontWeight: 700, color: '#E07070' }}>+ 月額¥39,800</div></div>
                </div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8, marginBottom: 14 }}>竹の全機能 + 特集ページ作成 + irodori公式SNS投稿 + 引き抜きOK</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { setShowPlanModal(false); handleSubscribe('matsu_initial') }} style={{ flex: 1, padding: '10px', background: '#fff', color: '#1A2235', border: '1.5px solid #1A2235', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>初期費用を支払う</button>
                  <button onClick={() => { setShowPlanModal(false); handleSubscribe('matsu_monthly') }} style={{ flex: 1, padding: '10px', background: '#1A2235', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>月額を支払う</button>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, textAlign: 'center' }}>ご不明な点は info@irodori0305.jp までお問い合わせください</div>
            {/* 解約リンク */}
            {isSubscribed && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  onClick={() => { setShowPlanModal(false); setShowCancelModal(true) }}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
                >
                  プランを解約する
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== ヘッダー ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600' }}>施設ダッシュボード</h1>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{facilityName}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(() => {
            const now = new Date()
            return (
              <button onClick={() => window.open(`/dashboard/payslip?year=${now.getFullYear()}&month=${now.getMonth() + 1}&facilityId=${userId}`, '_blank')} style={{ padding: '8px 16px', background: '#fff', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                📄 今月の支払い明細
              </button>
            )
          })()}
          {isRegularLocked ? (
            <button onClick={() => setShowPlanModal(true)} style={{ padding: '8px 16px', background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
              🔒 常勤・パート
            </button>
          ) : (
            <button onClick={() => router.push('/post-regular-job')} style={{ padding: '8px 16px', background: '#fff', color: '#E07070', border: '1px solid #E07070', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              ＋ 常勤・パート
            </button>
          )}
          <button onClick={() => router.push('/post-job')} style={{ padding: '8px 16px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>＋ 単発求人を投稿</button>
          {userId === '2f22fea3-4f1f-4fac-9053-1f8d4b14f523' && (
            <button onClick={() => router.push('/admin/dashboard')} style={{ padding: '8px 16px', background: '#1A2235', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>管理画面</button>
          )}
        </div>
      </div>

      {/* ===== 統計 ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[['掲載中の求人', openJobs.length], ['総応募者数', totalApplicants], ['採用確定', acceptedTotal]].map(([l, v]) => (
          <div key={String(l)} style={{ background: '#FBF7F7', border: '0.5px solid #EDE0E0', borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: '#C45A5A' }}>{v}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ===== 単発求人リスト ===== */}
      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>掲載中の求人</div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>読み込み中...</div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '12px', border: '0.5px solid #EDE0E0', color: '#64748B', marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>まだ求人がありません</div>
          <button onClick={() => router.push('/post-job')} style={{ padding: '10px 24px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit' }}>最初の求人を投稿する</button>
        </div>
      ) : (
        <div style={{ marginBottom: '28px' }}>
          {jobs.map(job => {
            const wageLabel = (job.wage_type === 'hourly' ? '時給' : '日給') + ` ¥${job.wage_amount?.toLocaleString()}`
            const statusLabel = job.status === 'open' ? '掲載中' : job.status === 'filled' ? '満員' : '終了'
            const borderLeft = job.status === 'open' ? '3px solid #E07070' : job.status === 'filled' ? '3px solid #7F77DD' : '3px solid #CBD5E1'
            return (
              <div key={job.id} style={{ ...S.card, borderLeft, borderRadius: '0 12px 12px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: '600' }}>{job.work_date}　{job.time_from}〜{job.time_to}</span>
                      <span style={statusLabel === '掲載中' ? S.badge('#FDF0F0', '#991B1B') : statusLabel === '満員' ? S.badge('#EDE9FB', '#3C3489') : S.badge('#F1F5F9', '#475569')}>{statusLabel}</span>
                      <span style={S.badge('#FEF3DC', '#7A4D00')}>応募 {job.applications?.length || 0}名</span>
                      {job.is_urgent && job.status === 'open' && <span style={S.badge('#FEE2E2', '#991B1B')}>急募</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '5px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span>{wageLabel}</span><span>{job.facility_type}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                    {job.status === 'open' && (
                      <>
                        <button onClick={() => closeJob(job.id)} style={S.btn('#fff', '#CBD5E1', '#475569')}>終了する</button>
                        <button onClick={() => handleRenotify(job)} disabled={renotifying === job.id} style={S.btn('#FFF7ED', '#FED7AA', '#C2410C')}>{renotifying === job.id ? '送信中...' : '再募集通知'}</button>
                      </>
                    )}
                    <button onClick={() => { setEditJobModal(job); setEditJobForm({ work_date: job.work_date, time_from: job.time_from, time_to: job.time_to, wage_amount: String(job.wage_amount), address: (job as any).address ?? '', facility_type: job.facility_type, description: (job as any).description ?? '', items_to_bring: (job as any).items_to_bring ?? '', dress_code: (job as any).dress_code ?? '', parking: (job as any).parking ?? '', lunch: (job as any).lunch ?? '' }) }} style={S.btn('#EFF6FF', '#93C5FD', '#1D4ED8')}>編集</button>
                    <button onClick={() => handleDeleteJob(job.id)} style={S.btn('#fff', '#FCA5A5', '#DC2626')}>削除</button>
                  </div>
                </div>
                {job.applications?.length > 0 && (
                  <>
                    <div style={S.divider} />
                    <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500', marginBottom: '8px' }}>応募した看護師</div>
                    {job.applications.map((app, idx) => {
                      const nurseName = nurseNames[app.nurse_id] || '読み込み中'
                      const alreadyReviewed = reviews.some(r => r.nurse_id === app.nurse_id && r.job_id === job.id)
                      const isAccepted = app.status === 'accepted'
                      const isRejected = app.status === 'rejected'
                      return (
                        <div key={app.id} style={{ ...S.row, borderBottom: idx === job.applications.length - 1 ? 'none' : '0.5px solid #F1F5F9' }}>
                          <div style={S.avatar}>{nurseName?.charAt(0) ?? '?'}</div>
                          <button onClick={() => handleViewProfile(app.nurse_id)} style={{ fontSize: '13px', fontWeight: '600', color: '#1A2235', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', flex: 1, textAlign: 'left' }}>{nurseName}</button>
                          <span style={isAccepted ? S.badge('#D1FAE5', '#064E3B') : isRejected ? S.badge('#F1F5F9', '#475569') : S.badge('#FEF3DC', '#7A4D00')}>{isAccepted ? '採用確定' : isRejected ? '不採用済み' : '審査中'}</span>
                          {!isAccepted && !isRejected && <button onClick={() => acceptNurse(app.id, app.nurse_id, job.id)} style={S.btn('#E07070', '#C45A5A', '#fff')}>採用する</button>}
                          {!isAccepted && !isRejected && <button onClick={() => { setRejectModal({ applicationId: app.id, nurseId: app.nurse_id, nurseName, jobId: job.id }); setRejectReason('') }} style={S.btn('#fff', '#FCA5A5', '#991B1B')}>不採用</button>}
                          {isAccepted && <button onClick={() => router.push(`/chat/${app.id}`)} style={S.btn('#EDE9FB', '#7F77DD', '#26215C')}>チャット</button>}
                          {isAccepted && !alreadyReviewed && <button onClick={() => setReviewModal({ jobId: job.id, nurseId: app.nurse_id, nurseName })} style={S.btn('#FEF3DC', '#D97706', '#451A03')}>評価する</button>}
                          {isAccepted && alreadyReviewed && <span style={S.badge('#F1F5F9', '#64748B')}>評価済み</span>}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ===== 常勤・パート ===== */}
      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        常勤・パート求人
        {isRegularLocked && <span style={{ background: '#F1F5F9', color: '#94A3B8', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', fontWeight: '400' }}>スタンダード以上</span>}
      </div>

      {isRegularLocked ? (
        <div style={{ borderRadius: '12px', border: '1.5px dashed #E2E8F0', background: '#FAFAFA', overflow: 'hidden', position: 'relative' }}>
          <div style={{ filter: 'blur(3px)', pointerEvents: 'none', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px', opacity: 0.4 }}>
            {[{ title: '正看護師募集・訪問看護', type: '常勤', salary: '月給 ¥280,000', location: '那覇市', hours: '09:00〜18:00', days: '月〜金' }, { title: 'パート看護師募集', type: 'パート', salary: '時給 ¥1,800', location: '浦添市', hours: '10:00〜15:00', days: '週3日〜' }].map((j, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '10px', padding: '14px 18px', border: '0.5px solid #EDE0E0' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{j.title}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{j.type} · {j.salary} · {j.location}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>⏰ {j.hours}　📅 {j.days}</div>
              </div>
            ))}
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(250,250,250,0.8)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', fontSize: '22px' }}>🔒</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>スタンダード以上で利用できます</div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '16px', textAlign: 'center', lineHeight: 1.6 }}>常勤・パート求人の掲載は<br />スタンダード（¥29,800/月）から</div>
            <button onClick={() => setShowPlanModal(true)} style={{ padding: '9px 22px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              プランを確認する
            </button>
          </div>
        </div>
      ) : regularJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px', border: '0.5px solid #EDE0E0', color: '#64748B' }}>
          <div style={{ fontSize: '28px', marginBottom: '10px' }}>📄</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>常勤・パート求人がありません</div>
          <button onClick={() => router.push('/post-regular-job')} style={{ padding: '10px 24px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px', fontFamily: 'inherit' }}>投稿する</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {regularJobs.map(job => (
            <div key={job.id} style={{ background: '#fff', borderRadius: '10px', padding: '14px 18px', border: '0.5px solid #EDE0E0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{job.title}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{job.employment_type} · {job.salary_type} ¥{job.salary_amount?.toLocaleString()} · {job.location}</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>⏰ {job.work_hours}　📅 {job.work_days}</div>
              </div>
              <span style={job.status === 'open' ? S.badge('#D1FAE5', '#065F46') : S.badge('#F1F5F9', '#64748B')}>{job.status === 'open' ? '掲載中' : '終了'}</span>
              <button onClick={() => router.push(`/post-regular-job?edit=${job.id}`)} style={S.btn('#EFF6FF', '#93C5FD', '#1D4ED8')}>編集</button>
              <button onClick={() => handleDeleteRegularJob(job.id)} style={S.btn('#fff', '#FCA5A5', '#DC2626')}>削除</button>
            </div>
          ))}
        </div>
      )}

      {/* ===== 解約リンク（下部） ===== */}
      {isSubscribed && (
        <div style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '0.5px solid #EDE0E0' }}>
          <button
            onClick={() => setShowCancelModal(true)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
          >
            プランを解約する
          </button>
        </div>
      )}
    </div>
  )
}
