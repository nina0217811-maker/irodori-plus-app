'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Profile = {
  name: string
  license: string
  experience_years: number
  areas: string[]
  skills: string[]
  age?: number
  gender?: string
  license_url?: string
}

type BankAccount = {
  bank_name: string
  branch_name: string
  account_type: string
  account_number: string
  account_holder: string
}

type Application = {
  id: string
  status: string
  created_at: string
  job_id: string
  job_work_date: string
  hire_flow?: string
  job_time_from: string
  job_time_to: string
  job_wage: number
  facility_name: string
  facility_type: string
}

type Favorite = {
  job_id: string
  work_date: string
  wage_amount: number
  facility_name: string
  facility_type: string
}

const C = {
  primary: '#E07070',
  dark: '#C45A5A',
  light: '#FDF0F0',
  teal: '#C0727A',
  text: '#1A2235',
  sub: '#64748B',
  border: '#EDE0E0',
  bg: '#FBF7F7',
  card: '#FFFFFF',
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: '審査中',      bg: '#FEF3C7', color: '#92400E' },
  accepted:  { label: '採用確定',    bg: '#DBEAFE', color: '#1E40AF' },
  rejected:  { label: '見送り',      bg: '#F1F5F9', color: '#64748B' },
  cancelled: { label: 'キャンセル済', bg: '#FEE2E2', color: '#991B1B' },
}

const REJECT_REASONS = ['応募要件と合わなかった', '定員に達した', '求人を取り下げた', 'その他']

function MyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mainTab, setMainTab] = useState<'apps' | 'calendar' | 'favs' | 'scouts'>('apps')
  const [settingView, setSettingView] = useState<null | 'profile' | 'pref' | 'tax' | 'email'>( null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [calMonth, setCalMonth] = useState(new Date())
  const [showPopup, setShowPopup] = useState(false)
  const [scouts, setScouts] = useState<any[]>([])
  const [nurseNames] = useState<Record<string, string>>({})

  const handleDismissPopup = () => {
    localStorage.setItem('profile_popup_dismissed', new Date().toISOString())
    setShowPopup(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: np } = await supabase
        .from('nurse_profiles')
        .select('name, license, experience_years, areas, skills, age, gender, license_url')
        .eq('id', user.id)
        .maybeSingle()
      if (np) setProfile(np as Profile)

      const { data: bank } = await supabase
        .from('bank_accounts')
        .select('bank_name, branch_name, account_type, account_number, account_holder')
        .eq('nurse_id', user.id)
        .maybeSingle()
      if (bank) setBankAccount(bank as BankAccount)

      const { data: apps } = await supabase
        .from('applications')
        .select('id, status, applied_at, job_id')
        .eq('nurse_id', user.id)
        .order('applied_at', { ascending: false })

      if (apps && apps.length > 0) {
        const jobIds = apps.map((a: any) => a.job_id)
        const { data: jobs } = await supabase.from('jobs').select('id, work_date, time_from, time_to, wage_amount, facility_id, hire_flow').in('id', jobIds)
        const facilityIds = [...new Set((jobs ?? []).map((j: any) => j.facility_id))]
        const { data: facilities } = await supabase.from('facilities').select('id, facility_name, facility_type').in('id', facilityIds)
        setApplications(apps.map((app: any) => {
          const job = (jobs ?? []).find((j: any) => j.id === app.job_id)
          const fac = (facilities ?? []).find((f: any) => f.id === job?.facility_id)
          return {
            id: app.id, status: app.status, created_at: app.applied_at, job_id: app.job_id,
            job_work_date: job?.work_date ?? '', job_time_from: job?.time_from ?? '',
            hire_flow: (job as any)?.hire_flow ?? 'direct',
            job_time_to: job?.time_to ?? '', job_wage: job?.wage_amount ?? 0,
            facility_name: fac?.facility_name ?? '—', facility_type: fac?.facility_type ?? '',
          }
        }))
      }

      const { data: favs } = await supabase.from('favorites').select('job_id').eq('nurse_id', user.id)
      if (favs && favs.length > 0) {
        const fJobIds = favs.map((f: any) => f.job_id)
        const { data: fJobs } = await supabase.from('jobs').select('id, work_date, wage_amount, facility_id').in('id', fJobIds)
        const fFacIds = [...new Set((fJobs ?? []).map((j: any) => j.facility_id))]
        const { data: fFacs } = await supabase.from('facilities').select('id, facility_name, facility_type').in('id', fFacIds)
        setFavorites((fJobs ?? []).map((j: any) => {
          const fac = (fFacs ?? []).find((f: any) => f.id === j.facility_id)
          return { job_id: j.id, work_date: j.work_date, wage_amount: j.wage_amount, facility_name: fac?.facility_name ?? '—', facility_type: fac?.facility_type ?? '' }
        }))
      }

      const { data: scoutData } = await supabase.from('scouts').select('id, message, status, created_at, job_id, facility_id').eq('nurse_id', user.id).order('created_at', { ascending: false })
      if (scoutData && scoutData.length > 0) {
        const facilityIds2 = [...new Set(scoutData.map((s: any) => s.facility_id))]
        const { data: facs2 } = await supabase.from('facilities').select('id, facility_name').in('id', facilityIds2)
        const fMap: Record<string, string> = {}
        facs2?.forEach((f: any) => { fMap[f.id] = f.facility_name })
        setScouts(scoutData.map((s: any) => ({ ...s, facility_name: fMap[s.facility_id] ?? '—' })))
      }

      // ポップアップ判定
      const isComplete = !!(np?.name && np?.license && np?.areas?.length > 0 && np?.skills?.length > 0 && np?.license_url)
      if (!isComplete) {
        const popup = searchParams.get('popup')
        const dismissed = localStorage.getItem('profile_popup_dismissed')
        const dismissedAt = dismissed ? new Date(dismissed) : null
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        if (popup === '1' || !dismissedAt || dismissedAt < threeDaysAgo) setShowPopup(true)
      }

      setLoading(false)
    }
    init()
  }, [])

  const removeFav = async (jobId: string) => {
    await supabase.from('favorites').delete().eq('nurse_id', userId).eq('job_id', jobId)
    setFavorites(prev => prev.filter(f => f.job_id !== jobId))
  }

  const cancelApplication = async (app: Application) => {
    if (!confirm('この応募をキャンセルしますか？')) return
    setCancelling(app.id)
    const workDateTime = new Date(`${app.job_work_date}T${app.job_time_from}`)
    const diffHours = (workDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
    const cancelType = diffHours < 0 ? 'absent' : diffHours < 12 ? 'direct' : 'normal'
    await supabase.from('cancel_history').insert({ nurse_id: userId, job_id: app.job_id, cancel_type: cancelType, note: `${app.facility_name} / ${app.job_work_date}` })
    await supabase.from('applications').update({ status: 'cancelled' }).eq('id', app.id)
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'cancelled' } : a))
    if (cancelType === 'absent') { await supabase.from('nurse_profiles').update({ is_suspended: true }).eq('id', userId); alert('無断欠勤として記録されました。') }
    else if (cancelType === 'direct') alert('直前キャンセルとして記録されました。')
    setCancelling(null)
  }

  const openGoogleCalendar = (app: Application) => {
    const start = `${app.job_work_date.replace(/-/g, '')}T${app.job_time_from.replace(':', '')}00`
    const end = `${app.job_work_date.replace(/-/g, '')}T${app.job_time_to.replace(':', '')}00`
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(app.facility_name + ' バイト')}&dates=${start}/${end}`, '_blank')
  }

  const respondScout = async (scoutId: string, status: 'interested' | 'declined') => {
    await supabase.from('scouts').update({ status }).eq('id', scoutId)
    setScouts(prev => prev.map(s => s.id === scoutId ? { ...s, status } : s))
  }

  const thisMonth = new Date()
  const monthlyIncome = applications.filter(a => a.status === 'accepted' && a.job_work_date?.startsWith(`${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`)).reduce((sum, a) => sum + (a.job_wage || 0), 0)
  const totalIncome = applications.filter(a => a.status === 'accepted').reduce((sum, a) => sum + (a.job_wage || 0), 0)

  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const completionSteps = [
    { label: '会員登録', done: true },
    { label: 'プロフィール入力', done: !!(profile?.name && profile?.experience_years) },
    { label: '看護師免許証', done: !!profile?.license_url },
    { label: '振込口座登録', done: !!(bankAccount?.bank_name) },
    { label: '初回バイト完了', done: applications.some(a => a.status === 'accepted') },
  ]
  const completionPct = Math.round(completionSteps.filter(s => s.done).length / completionSteps.length * 100)

  const nextStep = completionSteps.find(s => !s.done)

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }
  const btn = (bg: string, color: string, border: string) => ({ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: `1px solid ${border}`, background: bg, color, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' } as React.CSSProperties)

  if (loading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>読み込み中...</div>

  // 設定画面を開いてる時
  if (settingView) {
    return (
      <div style={{ background: C.bg, minHeight: '100vh', padding: '24px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <button onClick={() => setSettingView(null)} style={{ background: 'none', border: 'none', color: C.sub, fontSize: 13, cursor: 'pointer', marginBottom: 20, padding: 0 }}>← マイページに戻る</button>
          {settingView === 'profile' && <ProfileForm userId={userId} initial={profile} initialBank={bankAccount} onSaved={(p, b) => { setProfile(p); if (b) setBankAccount(b); setSettingView(null) }} />}
          {settingView === 'pref' && <PreferenceForm userId={userId} />}
          {settingView === 'email' && <EmailChangeForm />}
          {settingView === 'tax' && (
            <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>確定申告・収入管理</div>
              <button onClick={() => router.push('/tax')} style={{ padding: '10px 24px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>収入管理ページへ</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>

      {/* ポップアップ */}
      {showPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '28px 24px 24px', borderBottom: `0.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.1em', color: C.primary, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase' as const }}>Profile</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: C.text, lineHeight: 1.5 }}>プロフィールを<br />完成させましょう</div>
                </div>
                <button onClick={handleDismissPopup} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94A3B8', cursor: 'pointer', padding: 4 }}>✕</button>
              </div>
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, marginBottom: 20 }}>施設からのスカウトを受け取るためにあと少しの登録が必要です</div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>
                  <span>完了度</span><span style={{ color: C.primary }}>{completionPct}%</span>
                </div>
                <div style={{ height: 3, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionPct}%`, background: C.primary, borderRadius: 99 }} />
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: C.border, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                {completionSteps.slice(1).map(step => (
                  <div key={step.label} style={{ background: '#fff', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: step.done ? '#F0FDF4' : '#fff', border: step.done ? '1.5px solid #86EFAC' : `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {step.done && <span style={{ fontSize: 10, color: '#16A34A' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: step.done ? '#94A3B8' : C.text, textDecoration: step.done ? 'line-through' : 'none', opacity: step.done ? 0.6 : 1 }}>{step.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleDismissPopup} style={{ flex: 1, padding: 12, background: '#fff', color: '#94A3B8', border: `0.5px solid ${C.border}`, borderRadius: 10, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>あとで</button>
                <button onClick={() => { setShowPopup(false); setSettingView('profile') }} style={{ flex: 2, padding: 12, background: C.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>登録を続ける</button>
              </div>
              <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: '#94A3B8' }}>3日後にまたお知らせします</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

        {/* プロフィールヘッダー */}
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600 }}>
              {profile?.name?.charAt(0) ?? '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 3 }}>{profile?.name ?? '（未設定）'}</div>
              <div style={{ fontSize: 13, color: C.sub }}>
                {profile?.license === 'rn' ? '正看護師' : '准看護師'}
                {profile?.experience_years ? ` · 経験${profile.experience_years}年` : ''}
                {profile?.areas?.length ? ` · ${profile.areas.join('・')}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {profile?.license_url && <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>免許証提出済み</span>}
                {bankAccount?.bank_name && <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>口座登録済み</span>}
                {(profile?.skills ?? []).map(s => <span key={s} style={{ background: C.light, color: C.dark, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s}</span>)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 26, fontWeight: 600, color: C.primary }}>{completionPct}%</div>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 4 }}>完成度</div>
              <div style={{ width: 80, height: 3, background: C.border, borderRadius: 99, overflow: 'hidden', marginLeft: 'auto' }}>
                <div style={{ width: `${completionPct}%`, height: '100%', background: C.primary, borderRadius: 99 }} />
              </div>
            </div>
          </div>
        </div>

        {/* 次のステップバナー */}
        {nextStep && (
          <div onClick={() => setSettingView('profile')} style={{ background: '#fff', border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '11px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: C.text }}>次のステップ：<span style={{ color: C.primary, fontWeight: 600 }}>{nextStep.label}</span>を登録しましょう</div>
            <span style={{ color: C.primary, fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>登録する →</span>
          </div>
        )}

        {/* 統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
          {[
            { label: '今月の収入', value: `¥${monthlyIncome.toLocaleString()}`, color: C.primary },
            { label: '累計収入', value: `¥${totalIncome.toLocaleString()}`, color: C.primary },
            { label: '応募中', value: String(applications.filter(a => a.status === 'pending').length), color: C.sub },
            { label: '採用確定', value: String(applications.filter(a => a.status === 'accepted').length), color: '#1E40AF' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* メインコンテンツ+サイドバー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}>

          {/* 左: メインコンテンツ */}
          <div>
            {/* メインタブ */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
              {(['apps', 'calendar', 'favs', 'scouts'] as const).map((key, i) => {
                const labels = ['応募履歴', 'カレンダー', 'お気に入り', 'スカウト']
                return (
                  <button key={key} onClick={() => setMainTab(key)} style={{ padding: '10px 16px', fontSize: 13, color: mainTab === key ? C.primary : C.sub, borderBottom: `2px solid ${mainTab === key ? C.primary : 'transparent'}`, background: 'none', border: 'none', borderBottomStyle: 'solid', borderBottomWidth: 2, borderBottomColor: mainTab === key ? C.primary : 'transparent', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', fontWeight: mainTab === key ? 600 : 400 }}>
                    {labels[i]}
                  </button>
                )
              })}
            </div>

            {/* 応募履歴 */}
            {mainTab === 'apps' && (
              applications.length === 0
                ? <div style={{ textAlign: 'center', padding: '60px 20px', color: C.sub }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                    <div style={{ fontWeight: 600, marginBottom: 16, color: C.text }}>まだ応募した求人がありません</div>
                    <Link href="/jobs" style={{ padding: '10px 24px', background: C.primary, color: '#fff', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>求人を探す</Link>
                  </div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {applications.map(app => {
                      const st = STATUS[app.status] ?? STATUS.pending
                      return (
                        <div key={app.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{app.facility_name}</div>
                            <div style={{ fontSize: 12, color: C.sub }}>{app.job_work_date} · {app.job_time_from}〜{app.job_time_to}</div>
                    {(app as any).hire_flow === 'interview' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3C3489', background: '#EDE9FB', padding: '2px 8px', borderRadius: 99, marginTop: 4 }}>💬 面談型</span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9A4A36', background: '#FDF0F0', padding: '2px 8px', borderRadius: 99, marginTop: 4 }}>⚡ 即採用型</span>
                    )}
                            {app.job_wage > 0 && <div style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginTop: 4 }}>¥{app.job_wage.toLocaleString()}</div>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                            <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                            {app.status === 'accepted' && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <Link href={`/chat/${app.id}`} style={{ fontSize: 11, color: C.primary, fontWeight: 600, textDecoration: 'none' }}>チャットを開く →</Link>
                                <button onClick={() => openGoogleCalendar(app)} style={btn('#EFF6FF', '#1D4ED8', '#BFDBFE')}>Googleカレンダー</button>
                              </div>
                            )}
                            {(app.status === 'pending' || app.status === 'accepted') && (
                              <button onClick={() => cancelApplication(app)} disabled={cancelling === app.id} style={btn('#fff', '#ef4444', '#FCA5A5')}>
                                {cancelling === app.id ? 'キャンセル中...' : 'キャンセル'}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
            )}

            {/* カレンダー */}
            {mainTab === 'calendar' && (
              <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>勤務カレンダー</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.sub }}>←</button>
                    <div style={{ fontSize: 14, color: C.sub, minWidth: 80, textAlign: 'center' }}>{year}年{month + 1}月</div>
                    <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.sub }}>→</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
                  {['日','月','火','水','木','金','土'].map(d => <div key={d} style={{ fontSize: 12, color: C.sub, padding: '4px 0', fontWeight: 600 }}>{d}</div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const app = applications.find(a => a.job_work_date === dateStr)
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
                    let s: any = { width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 13 }
                    if (app?.status === 'accepted') s = { ...s, background: C.primary, color: '#fff', fontWeight: 700 }
                    else if (app?.status === 'pending') s = { ...s, background: C.light, color: C.dark, border: `1.5px solid ${C.primary}` }
                    else if (isToday) s = { ...s, border: `1.5px solid ${C.primary}`, color: C.primary }
                    else s = { ...s, color: C.sub }
                    return <div key={day} style={s}>{day}</div>
                  })}
                </div>
              </div>
            )}

            {/* お気に入り */}
            {mainTab === 'favs' && (
              favorites.length === 0
                ? <div style={{ textAlign: 'center', padding: '60px 20px', color: C.sub }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>❤️</div>
                    <div style={{ fontWeight: 600, marginBottom: 16, color: C.text }}>お気に入りした求人がありません</div>
                    <Link href="/jobs" style={{ padding: '10px 24px', background: C.primary, color: '#fff', borderRadius: 8, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>求人を探す</Link>
                  </div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {favorites.map(fav => (
                      <div key={fav.job_id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 18px', display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{fav.facility_name}</div>
                          <div style={{ fontSize: 12, color: C.sub }}>📅 {fav.work_date} · {fav.facility_type}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.primary, marginTop: 4 }}>¥{fav.wage_amount?.toLocaleString()}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Link href={`/jobs/${fav.job_id}`} style={{ padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${C.primary}`, color: C.primary, fontWeight: 600, fontSize: 12, textDecoration: 'none' }}>詳細を見る</Link>
                          <button onClick={() => removeFav(fav.job_id)} style={btn('#fff', C.sub, C.border)}>削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
            )}

            {/* スカウト */}
            {mainTab === 'scouts' && (
              scouts.length === 0
                ? <div style={{ textAlign: 'center', padding: '60px 20px', color: C.sub }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: C.text }}>まだスカウトが届いていません</div>
                    <div style={{ fontSize: 13 }}>希望条件を設定すると施設から見つけてもらいやすくなります</div>
                  </div>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {scouts.map(scout => {
                      const ST: Record<string, { label: string; bg: string; color: string }> = {
                        pending: { label: '未返答', bg: '#FEF3C7', color: '#92400E' },
                        interested: { label: '興味あり', bg: '#D1FAE5', color: '#065F46' },
                        declined: { label: '辞退', bg: '#F1F5F9', color: '#64748B' },
                      }
                      const st = ST[scout.status] ?? ST.pending
                      return (
                        <div key={scout.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div><div style={{ fontSize: 14, fontWeight: 600 }}>{scout.facility_name}</div><div style={{ fontSize: 12, color: C.sub }}>{new Date(scout.created_at).toLocaleDateString('ja-JP')}</div></div>
                            <span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                          </div>
                          <div style={{ background: '#FBF7F7', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 12 }}>{scout.message}</div>
                          {scout.status === 'pending' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => respondScout(scout.id, 'declined')} style={{ flex: 1, padding: 9, background: '#fff', color: C.sub, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>辞退する</button>
                              <button onClick={() => respondScout(scout.id, 'interested')} style={{ flex: 2, padding: 9, background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>興味あり</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
            )}
          </div>

          {/* 右: 設定サイドバー */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* 設定メニュー */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${C.border}`, fontSize: 13, fontWeight: 600, color: C.text }}>設定</div>
              <div style={{ padding: '6px 0' }}>
                {[
                  { icon: '👤', label: 'プロフィール編集', key: 'profile' as const },
                  { icon: '✉️', label: 'メールアドレス変更', key: 'email' as const },
                  { icon: '🎯', label: '希望条件', key: 'pref' as const },
                  { icon: '📊', label: '確定申告・収入管理', key: 'tax' as const },
                ].map(item => (
                  <button key={item.key} onClick={() => setSettingView(item.key)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 15 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 14, color: '#94A3B8' }}>›</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 登録状況 */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>登録状況</div>
                <div style={{ fontSize: 12, color: C.primary, fontWeight: 600 }}>{completionPct}%</div>
              </div>
              <div style={{ padding: '8px 0' }}>
                {completionSteps.map(step => (
                  <div key={step.label} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: step.done ? '#F0FDF4' : '#fff', border: step.done ? '1.5px solid #86EFAC' : `1.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {step.done && <span style={{ fontSize: 9, color: '#16A34A' }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 12, color: step.done ? '#94A3B8' : C.text, textDecoration: step.done ? 'line-through' : 'none', opacity: step.done ? 0.6 : 1 }}>{step.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0 16px 14px' }}>
                <div style={{ height: 3, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${completionPct}%`, height: '100%', background: C.primary, borderRadius: 99 }} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileForm({ userId, initial, initialBank, onSaved }: {
  userId: string; initial: Profile | null; initialBank: BankAccount | null
  onSaved: (p: Profile, b?: BankAccount) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [license, setLicense] = useState(initial?.license ?? 'rn')
  const [years, setYears] = useState(String(initial?.experience_years ?? ''))
  const [age, setAge] = useState(String(initial?.age ?? ''))
  const [gender, setGender] = useState(initial?.gender ?? '')
  const [areas, setAreas] = useState((initial?.areas ?? []).join('、'))
  const [skills, setSkills] = useState((initial?.skills ?? []).join('、'))
  const [licenseUrl, setLicenseUrl] = useState(initial?.license_url ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [bankName, setBankName] = useState(initialBank?.bank_name ?? '')
  const [branchName, setBranchName] = useState(initialBank?.branch_name ?? '')
  const [accountType, setAccountType] = useState(initialBank?.account_type ?? '普通')
  const [accountNumber, setAccountNumber] = useState(initialBank?.account_number ?? '')
  const [accountHolder, setAccountHolder] = useState(initialBank?.account_holder ?? '')
  const [bankSaving, setBankSaving] = useState(false)
  const [bankDone, setBankDone] = useState(false)

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/license.${ext}`
    const { error: uploadError } = await supabase.storage.from('licenses').upload(path, file, { upsert: true })
    if (uploadError) { alert('アップロードに失敗しました'); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('licenses').getPublicUrl(path)
    await supabase.from('nurse_profiles').update({ license_url: urlData.publicUrl }).eq('id', userId)
    setLicenseUrl(urlData.publicUrl)
    setUploading(false)
  }

  const save = async () => {
    setSaving(true); setError('')
    const areasArr = areas.split(/[、,，]+/).map(s => s.trim()).filter(Boolean)
    const skillsArr = skills.split(/[、,，]+/).map(s => s.trim()).filter(Boolean)
    const expYears = parseInt(years) || 0
    const ageNum = parseInt(age) || null
    const { data: existing } = await supabase.from('nurse_profiles').select('id').eq('id', userId).maybeSingle()
    const payload = { name, license, experience_years: expYears, areas: areasArr, skills: skillsArr, age: ageNum, gender: gender || null }
    let err = null
    if (existing) { const { error: e } = await supabase.from('nurse_profiles').update(payload).eq('id', userId); err = e }
    else { const { error: e } = await supabase.from('nurse_profiles').insert({ id: userId, ...payload }); err = e }
    if (err) { setError(err.message); setSaving(false); return }
    onSaved({ name, license, experience_years: expYears, areas: areasArr, skills: skillsArr, age: ageNum ?? undefined, gender: gender || undefined, license_url: licenseUrl })
    setSaving(false); setDone(true); setTimeout(() => setDone(false), 2000)
  }

  const saveBank = async () => {
    setBankSaving(true)
    const payload = { nurse_id: userId, bank_name: bankName, branch_name: branchName, account_type: accountType, account_number: accountNumber, account_holder: accountHolder, updated_at: new Date().toISOString() }
    const { data: existing } = await supabase.from('bank_accounts').select('id').eq('nurse_id', userId).maybeSingle()
    if (existing) { await supabase.from('bank_accounts').update(payload).eq('nurse_id', userId) }
    else { await supabase.from('bank_accounts').insert(payload) }
    onSaved({ name, license, experience_years: parseInt(years) || 0, areas: areas.split(/[、,，]+/).map(s => s.trim()).filter(Boolean), skills: skills.split(/[、,，]+/).map(s => s.trim()).filter(Boolean), license_url: licenseUrl }, { bank_name: bankName, branch_name: branchName, account_type: accountType, account_number: accountNumber, account_holder: accountHolder })
    setBankSaving(false); setBankDone(true); setTimeout(() => setBankDone(false), 2000)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }
  const label = (text: string) => <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>{text}</label>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: '24px 28px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>プロフィール編集</h2>
        <div style={{ marginBottom: 16 }}>{label('氏名')}<input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="田中 みなみ" /></div>
        <div style={{ marginBottom: 16 }}>{label('資格')}<select value={license} onChange={e => setLicense(e.target.value)} style={inp}><option value="rn">正看護師</option><option value="lpn">准看護師</option></select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>{label('年齢')}<input type="number" value={age} onChange={e => setAge(e.target.value)} style={inp} placeholder="30" /></div>
          <div>{label('性別')}<select value={gender} onChange={e => setGender(e.target.value)} style={inp}><option value="">選択</option><option value="女性">女性</option><option value="男性">男性</option><option value="その他">その他</option><option value="回答しない">回答しない</option></select></div>
        </div>
        <div style={{ marginBottom: 16 }}>{label('経験年数')}<input type="number" value={years} onChange={e => setYears(e.target.value)} style={inp} placeholder="8" /></div>
        <div style={{ marginBottom: 16 }}>{label('活動エリア（読点区切り）')}<input value={areas} onChange={e => setAreas(e.target.value)} style={inp} placeholder="那覇市、浦添市" /></div>
        <div style={{ marginBottom: 16 }}>{label('スキル・経験（読点区切り）')}<input value={skills} onChange={e => setSkills(e.target.value)} style={inp} placeholder="内科、外科、ICU" /></div>
        <div style={{ marginBottom: 24, background: '#FBF7F7', borderRadius: 10, padding: 16, border: '1px solid #EDE0E0' }}>
          {label('看護師免許証')}
          {licenseUrl
            ? <div><span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 10 }}>提出済み</span><br /><label style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, border: '1.5px solid #E07070', color: '#E07070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{uploading ? 'アップロード中...' : '再アップロード'}<input type="file" accept="image/*,.pdf" onChange={handleLicenseUpload} style={{ display: 'none' }} disabled={uploading} /></label></div>
            : <label style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 8, background: '#E07070', color: '#fff', fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>{uploading ? 'アップロード中...' : '免許証をアップロード'}<input type="file" accept="image/*,.pdf" onChange={handleLicenseUpload} style={{ display: 'none' }} disabled={uploading} /></label>
          }
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: done ? '#6BAF92' : '#E07070', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '保存中...' : done ? '保存しました！' : '保存する'}
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: '24px 28px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>振込口座情報</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>給与振込に使用する口座を登録してください</p>
        <div style={{ marginBottom: 14 }}>{label('銀行名')}<input value={bankName} onChange={e => setBankName(e.target.value)} style={inp} placeholder="○○銀行" /></div>
        <div style={{ marginBottom: 14 }}>{label('支店名')}<input value={branchName} onChange={e => setBranchName(e.target.value)} style={inp} placeholder="那覇支店" /></div>
        <div style={{ marginBottom: 14 }}>{label('口座種別')}<select value={accountType} onChange={e => setAccountType(e.target.value)} style={inp}><option value="普通">普通</option><option value="当座">当座</option></select></div>
        <div style={{ marginBottom: 14 }}>{label('口座番号')}<input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={inp} placeholder="1234567" maxLength={8} /></div>
        <div style={{ marginBottom: 20 }}>{label('口座名義（カタカナ）')}<input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} style={inp} placeholder="タナカ ミナミ" /></div>
        <button onClick={saveBank} disabled={bankSaving} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: bankDone ? '#6BAF92' : '#E07070', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
          {bankSaving ? '保存中...' : bankDone ? '保存しました！' : '口座情報を保存する'}
        </button>
      </div>
    </div>
  )
}

function PreferenceForm({ userId }: { userId: string }) {
  const AREAS = ['那覇市', '浦添市', '宜野湾市', '沖縄市', 'うるま市', '名護市', '糸満市', '豊見城市', '南城市', '読谷村', '恩納村', 'その他']
  const FACILITY_TYPES = ['病院', 'クリニック', '介護老人保健施設', '訪問看護', 'デイサービス', '訪問入浴', 'グループホーム', '特別養護老人ホーム', '有料老人ホーム', '障害者施設', '保育園', 'その他']
  const WAGE_OPTIONS = [{ label: '指定なし', value: 0 }, { label: '¥5,000以上', value: 5000 }, { label: '¥10,000以上', value: 10000 }, { label: '¥20,000以上', value: 20000 }]
  const [areas, setAreas] = useState<string[]>([])
  const [facilityTypes, setFacilityTypes] = useState<string[]>([])
  const [minWage, setMinWage] = useState(0)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [jobStatus, setJobStatus] = useState('looking_for_part')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('nurse_preferences').select('*').eq('nurse_id', userId).maybeSingle()
      if (data) { setAreas(data.areas ?? []); setFacilityTypes(data.facility_types ?? []); setMinWage(data.min_wage ?? 0); setNotifyEmail(data.notify_email ?? true) }
      const { data: np } = await supabase.from('nurse_profiles').select('job_status').eq('id', userId).maybeSingle()
      if (np?.job_status) setJobStatus(np.job_status)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) => set(arr.includes(val) ? arr.filter(a => a !== val) : [...arr, val])

  const save = async () => {
    setSaving(true)
    await supabase.from('nurse_profiles').update({ job_status: jobStatus }).eq('id', userId)
    const payload = { nurse_id: userId, areas, facility_types: facilityTypes, min_wage: minWage, notify_email: notifyEmail, updated_at: new Date().toISOString() }
    const { data: existing } = await supabase.from('nurse_preferences').select('id').eq('nurse_id', userId).maybeSingle()
    if (existing) await supabase.from('nurse_preferences').update(payload).eq('nurse_id', userId)
    else await supabase.from('nurse_preferences').insert(payload)
    setSaving(false); setDone(true); setTimeout(() => setDone(false), 2000)
  }

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400, background: active ? '#E07070' : '#fff', color: active ? '#fff' : '#64748B', border: `1px solid ${active ? '#E07070' : '#EDE0E0'}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>{label}</button>
  )

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>読み込み中...</div>

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>希望条件設定</div>
        <div style={{ fontSize: 13, color: '#64748B' }}>条件に合う求人が投稿されたら通知します</div>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>今の状況</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'looking_for_part', label: 'バイト探し中', desc: '単発・スポット勤務を探しています' },
            { value: 'looking_for_job', label: '転職活動中', desc: '正社員・パートを探しています' },
            { value: 'looking_for_both', label: 'どちらも検討中', desc: '単発も転職もどちらも見ています' },
            { value: 'not_looking', label: '現在募集停止中', desc: 'スカウトを受け取りたくない' },
          ].map(s => (
            <label key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${jobStatus === s.value ? '#E07070' : '#EDE0E0'}`, borderRadius: 10, cursor: 'pointer', background: jobStatus === s.value ? '#FDF0F0' : '#fff' }}>
              <input type="radio" name="jobStatus" value={s.value} checked={jobStatus === s.value} onChange={() => setJobStatus(s.value)} style={{ accentColor: '#E07070' }} />
              <div><div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div><div style={{ fontSize: 11, color: '#64748B' }}>{s.desc}</div></div>
            </label>
          ))}
        </div>
      </div>
      <div><div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>希望エリア</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{AREAS.map(a => chip(a, areas.includes(a), () => toggle(areas, a, setAreas)))}</div></div>
      <div><div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>希望施設種別</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{FACILITY_TYPES.map(t => chip(t, facilityTypes.includes(t), () => toggle(facilityTypes, t, setFacilityTypes)))}</div></div>
      <div><div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>希望最低日給</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{WAGE_OPTIONS.map(w => chip(w.label, minWage === w.value, () => setMinWage(w.value)))}</div></div>
      <button onClick={save} disabled={saving} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: done ? '#6BAF92' : '#E07070', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
        {saving ? '保存中...' : done ? '保存しました！' : '希望条件を保存する'}
      </button>
    </div>
  )
}

export default function MyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>読み込み中...</div>}>
      <MyPageContent />
    </Suspense>
  )
}

function EmailChangeForm() {
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    if (!email) return
    setSaving(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ email })
    if (error) { setError(error.message); setSaving(false); return }
    setSaving(false)
    setDone(true)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit' }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: '24px 28px' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>メールアドレス変更</h2>
      <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20, lineHeight: 1.7 }}>新しいメールアドレスを入力してください。確認メールが届きます。</p>
      {done ? (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '14px', borderRadius: 8, fontSize: 14, lineHeight: 1.7 }}>
          確認メールを送信しました！<br />新しいメールアドレスのリンクをクリックして変更を完了してください。
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>新しいメールアドレス</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inp} placeholder="new@example.com" />
          </div>
          {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button onClick={save} disabled={saving || !email} style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: saving || !email ? '#ccc' : '#E07070', color: '#fff', fontWeight: 700, fontSize: 15, cursor: saving || !email ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? '送信中...' : '確認メールを送る'}
          </button>
        </>
      )}
    </div>
  )
}
