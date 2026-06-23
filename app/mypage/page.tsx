'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function MyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'apps' | 'favs' | 'calendar' | 'steps' | 'pref' | 'profile'>('apps')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [calMonth, setCalMonth] = useState(new Date())

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
        const { data: jobs } = await supabase.from('jobs').select('id, work_date, time_from, time_to, wage_amount, facility_id').in('id', jobIds)
        const facilityIds = [...new Set((jobs ?? []).map((j: any) => j.facility_id))]
        const { data: facilities } = await supabase.from('facilities').select('id, facility_name, facility_type').in('id', facilityIds)
        setApplications(apps.map((app: any) => {
          const job = (jobs ?? []).find((j: any) => j.id === app.job_id)
          const fac = (facilities ?? []).find((f: any) => f.id === job?.facility_id)
          return {
            id: app.id, status: app.status, created_at: app.applied_at, job_id: app.job_id,
            job_work_date: job?.work_date ?? '', job_time_from: job?.time_from ?? '',
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

      setLoading(false)
    }
    init()
  }, [])

  const removeFav = async (jobId: string) => {
    await supabase.from('favorites').delete().eq('nurse_id', userId).eq('job_id', jobId)
    setFavorites(prev => prev.filter(f => f.job_id !== jobId))
  }

  const cancelApplication = async (app: Application) => {
    if (!confirm('この応募をキャンセルしますか？キャンセル履歴が記録されます。')) return
    setCancelling(app.id)
    const workDateTime = new Date(`${app.job_work_date}T${app.job_time_from}`)
    const now = new Date()
    const diffHours = (workDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    let cancelType = 'normal'
    if (diffHours < 0) cancelType = 'absent'
    else if (diffHours < 12) cancelType = 'direct'
    await supabase.from('cancel_history').insert({
      nurse_id: userId, job_id: app.job_id, cancel_type: cancelType,
      note: `${app.facility_name} / ${app.job_work_date} ${app.job_time_from}〜${app.job_time_to}`,
    })
    await supabase.from('applications').update({ status: 'cancelled' }).eq('id', app.id)
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'cancelled' } : a))
    if (cancelType === 'absent') {
      await supabase.from('nurse_profiles').update({ is_suspended: true }).eq('id', userId)
      alert('無断欠勤として記録されました。アカウントが停止されました。')
    } else if (cancelType === 'direct') {
      const { data: cancelData } = await supabase.from('cancel_history').select('id').eq('nurse_id', userId).in('cancel_type', ['direct', 'absent'])
      if (cancelData && cancelData.length >= 3) {
        await supabase.from('nurse_profiles').update({ is_suspended: true }).eq('id', userId)
        alert('直前キャンセルが3回に達しました。アカウントが停止されました。')
      } else {
        alert('直前キャンセルとして記録されました。繰り返すとアカウントが停止される場合があります。')
      }
    }
    setCancelling(null)
  }

  const openGoogleCalendar = (app: Application) => {
    const start = `${app.job_work_date.replace(/-/g, '')}T${app.job_time_from.replace(':', '')}00`
    const end = `${app.job_work_date.replace(/-/g, '')}T${app.job_time_to.replace(':', '')}00`
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(app.facility_name + ' バイト')}&dates=${start}/${end}&details=${encodeURIComponent('irodori+ 採用確定\n日給: ¥' + app.job_wage.toLocaleString())}`
    window.open(url, '_blank')
  }

  const downloadIcs = (app: Application) => {
    const start = `${app.job_work_date.replace(/-/g, '')}T${app.job_time_from.replace(':', '')}00`
    const end = `${app.job_work_date.replace(/-/g, '')}T${app.job_time_to.replace(':', '')}00`
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`SUMMARY:${app.facility_name} バイト`,`DTSTART:${start}`,`DTEND:${end}`,`DESCRIPTION:irodori+ 採用確定\\n日給: ¥${app.job_wage.toLocaleString()}`,'END:VEVENT','END:VCALENDAR'].join('\n')
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${app.facility_name}.ics`; a.click()
    URL.revokeObjectURL(url)
  }

  const thisMonth = new Date()
  const monthlyIncome = applications.filter(a => a.status === 'accepted' && a.job_work_date?.startsWith(`${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}`)).reduce((sum, a) => sum + (a.job_wage || 0), 0)
  const totalIncome = applications.filter(a => a.status === 'accepted').reduce((sum, a) => sum + (a.job_wage || 0), 0)

  // カレンダー
  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const getDateStatus = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const app = applications.find(a => a.job_work_date === dateStr)
    return app ? app.status : null
  }

  const completionSteps = [
    {
      label: '会員登録',
      done: true,
      action: null,
      message: null,
    },
    {
      label: 'プロフィール入力',
      done: !!(profile?.name && profile?.experience_years),
      action: 'profile' as const,
      message: '名前・経験年数を入力すると施設に見つけてもらいやすくなります',
    },
    {
      label: '看護師免許証',
      done: !!profile?.license_url,
      action: 'profile' as const,
      message: '免許証を提出すると施設からの信頼度が大幅アップします',
    },
    {
      label: '振込口座登録',
      done: !!(bankAccount?.bank_name && bankAccount?.account_number),
      action: 'profile' as const,
      message: '給与振込のために口座を登録しておきましょう',
    },
    {
      label: '初回バイト完了',
      done: applications.some(a => a.status === 'accepted'),
      action: null,
      message: '求人を探して最初の一歩を踏み出しましょう！',
    },
  ]
  const completionPct = Math.round(completionSteps.filter(s => s.done).length / completionSteps.length * 100)

  if (loading) return <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>読み込み中...</div>

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

        {/* プロフィールヘッダー */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '24px 28px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
              {profile?.name?.charAt(0) ?? '?'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{profile?.name ?? '（未設定）'}</div>
              <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                {profile?.license === 'rn' ? '正看護師' : '准看護師'}
                {profile?.experience_years ? ` · 経験${profile.experience_years}年` : ''}
                {profile?.areas?.length ? ` · ${profile.areas.join('・')}` : ''}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {profile?.license_url && <span style={{ background: '#D1FAE5', color: '#065F46', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>免許証提出済み</span>}
                {bankAccount?.bank_name && <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>口座登録済み</span>}
                {(profile?.skills ?? []).map(s => <span key={s} style={{ background: C.light, color: C.dark, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s}</span>)}
              </div>
            </div>
            <div onClick={() => setTab('steps')} style={{ textAlign: 'right', minWidth: 80, cursor: 'pointer' }}>
              <div style={{ fontSize: 11, color: C.sub, marginBottom: 2 }}>プロフィール完成度</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.primary }}>{completionPct}%</div>
              <div style={{ width: 80, height: 6, background: '#EDE0E0', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                <div style={{ width: `${completionPct}%`, height: '100%', background: C.primary, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 10, color: C.primary, marginTop: 3 }}>タップして確認 →</div>
            </div>
          </div>
        </div>

        {/* 未完了バナー */}
        {completionPct < 100 && (
          <div
            onClick={() => setTab('steps')}
            style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
              📋 登録があと{completionSteps.filter(s => !s.done).length}ステップ残っています
            </div>
            <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>確認する →</span>
          </div>
        )}

        {/* 収入統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: '今月の想定収入', value: `¥${monthlyIncome.toLocaleString()}`, color: C.primary },
            { label: '累計バイト代', value: `¥${totalIncome.toLocaleString()}`, color: C.primary },
            { label: '応募中', value: String(applications.filter(a => a.status === 'pending').length), color: C.sub },
            { label: '採用確定', value: String(applications.filter(a => a.status === 'accepted').length), color: '#1E40AF' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 確定申告バナー */}
        <div
          onClick={() => router.push('/tax')}
          style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>📊 確定申告・給与計算</div>
            <div style={{ fontSize: 12, color: '#854F0B', marginTop: 2 }}>収支集計・経費メモ・PDF出力はこちら</div>
          </div>
          <span style={{ fontSize: 13, color: '#92400E' }}>→</span>
        </div>

        {/* 登録未完了アラート */}
        {[
          { condition: !profile?.license_url, icon: '📋', msg: '免許証を提出すると採用率が大幅にアップします！', action: 'profile' as const },
          { condition: !(bankAccount?.bank_name && bankAccount?.account_number), icon: '💳', msg: '給与受け取りのために口座を登録しましょう', action: 'profile' as const },
          { condition: !(profile?.name && profile?.experience_years), icon: '👤', msg: 'プロフィールを入力して施設に見つけてもらいやすくしましょう', action: 'profile' as const },
        ].filter(a => a.condition).map((alert, i) => (
          <div key={i} onClick={() => setTab(alert.action)} style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ fontSize: 13, color: '#92400E' }}>{alert.icon} {alert.msg}</div>
            <span style={{ fontSize: 12, color: '#92400E', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>登録する →</span>
          </div>
        ))}

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 20, overflowX: 'auto' }}>
          {(['apps', 'favs', 'calendar', 'steps', 'pref', 'profile'] as const).map((key, i) => {
            const labels = ['応募履歴', 'お気に入り', 'カレンダー', '登録状況', '希望条件', 'プロフィール']
            return (
              <button key={key} onClick={() => setTab(key)} style={{ background: 'none', border: 'none', padding: '12px 16px', fontWeight: tab === key ? 700 : 500, color: tab === key ? C.primary : C.sub, borderBottom: `2px solid ${tab === key ? C.primary : 'transparent'}`, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {labels[i]}
              </button>
            )
          })}
        </div>

        {/* 応募履歴 */}
        {tab === 'apps' && (
          applications.length === 0
            ? <Empty icon="📋" text="まだ応募した求人がありません" href="/jobs" linkLabel="求人を探す" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {applications.map(app => {
                  const st = STATUS[app.status] ?? STATUS.pending
                  return (
                    <div key={app.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{app.facility_name}</div>
                        <div style={{ fontSize: 12, color: C.sub }}>{app.job_work_date} · {app.job_time_from}〜{app.job_time_to}</div>
                        {app.job_wage > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginTop: 4 }}>¥{app.job_wage.toLocaleString()}</div>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ background: st.bg, color: st.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{st.label}</span>
                        {app.status === 'accepted' && <Link href={`/chat/${app.id}`} style={{ fontSize: 12, color: C.primary, fontWeight: 600, textDecoration: 'none' }}>チャットを開く →</Link>}
                        {app.status === 'accepted' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openGoogleCalendar(app)} style={{ padding: '3px 10px', background: '#EFF6FF', color: '#1D4ED8', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Googleカレンダー</button>
                            <button onClick={() => downloadIcs(app)} style={{ padding: '3px 10px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>.icsダウンロード</button>
                          </div>
                        )}
                        {(app.status === 'pending' || app.status === 'accepted') && (
                          <button onClick={() => cancelApplication(app)} disabled={cancelling === app.id} style={{ padding: '3px 10px', background: 'none', border: `1px solid #fca5a5`, borderRadius: 6, color: '#ef4444', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                            {cancelling === app.id ? 'キャンセル中...' : 'キャンセル'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
        )}

        {/* お気に入り */}
        {tab === 'favs' && (
          favorites.length === 0
            ? <Empty icon="❤️" text="お気に入りした求人がありません" href="/jobs" linkLabel="求人を探す" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {favorites.map(fav => (
                  <div key={fav.job_id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{fav.facility_name}</div>
                      <div style={{ fontSize: 12, color: C.sub }}>📅 {fav.work_date} · {fav.facility_type}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginTop: 4 }}>¥{fav.wage_amount?.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/jobs/${fav.job_id}`} style={{ padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${C.primary}`, color: C.primary, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>詳細を見る</Link>
                      <button onClick={() => removeFav(fav.job_id)} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>削除</button>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* カレンダー */}
        {tab === 'calendar' && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>勤務カレンダー</div>
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
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const status = getDateStatus(day)
                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
                const app = applications.find(a => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  return a.job_work_date === dateStr
                })
                let style: any = { width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 13, cursor: app ? 'pointer' : 'default', flexDirection: 'column' }
                if (status === 'accepted') style = { ...style, background: C.primary, color: '#fff', fontWeight: 700 }
                else if (status === 'pending') style = { ...style, background: '#FDF0F0', color: C.dark, fontWeight: 600, border: `1.5px solid ${C.primary}` }
                else if (isToday) style = { ...style, border: `1.5px solid ${C.primary}`, color: C.primary, fontWeight: 600 }
                else style = { ...style, color: C.sub }
                return <div key={day} style={style}>{day}</div>
              })}
            </div>

            {/* 凡例 */}
            <div style={{ display: 'flex', gap: 16, marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
              {[
                { color: C.primary, label: '採用確定' },
                { color: '#FDF0F0', label: '審査中', border: `1.5px solid ${C.primary}` },
              ].map(({ color, label, border }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.sub }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, border }} />
                  {label}
                </div>
              ))}
            </div>

            {/* その月の採用確定一覧 */}
            {(() => {
              const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
              const monthApps = applications.filter(a => a.status === 'accepted' && a.job_work_date?.startsWith(monthStr))
              if (monthApps.length === 0) return null
              return (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>今月の採用確定 ({monthApps.length}件)</div>
                  {monthApps.map(app => (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{app.job_work_date}</span>
                        <span style={{ color: C.sub, marginLeft: 8 }}>{app.facility_name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: C.primary }}>¥{app.job_wage.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                      合計 ¥{monthApps.reduce((sum, a) => sum + a.job_wage, 0).toLocaleString()}
                    </span>
                    <button
                      onClick={() => window.open(`/mypage/payslip?year=${year}&month=${month + 1}&nurseId=${userId}`, '_blank')}
                      style={{ padding: '6px 14px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      📄 この月の明細をDL
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* 登録状況 */}
        {tab === 'steps' && (
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '24px 28px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>登録状況</div>
            <div style={{ fontSize: 13, color: C.sub, marginBottom: 20 }}>完了すると施設からの信頼度が上がります</div>
            {completionSteps.map((step, i) => (
              <div key={step.label} style={{ padding: '14px 0', borderBottom: i < completionSteps.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 18, background: step.done ? '#D1FAE5' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {step.done
                      ? <span style={{ color: '#065F46', fontSize: 16 }}>✓</span>
                      : <span style={{ color: '#92400E', fontSize: 14 }}>{i + 1}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{step.label}</div>
                    {!step.done && step.message && (
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>{step.message}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {!step.done && step.action && (
                      <button onClick={() => setTab(step.action as any)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        登録する →
                      </button>
                    )}
                    {!step.done && !step.action && step.label === '初回バイト完了' && (
                      <button onClick={() => window.location.href = '/jobs'} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        求人を探す →
                      </button>
                    )}
                    <span style={{ background: step.done ? '#D1FAE5' : '#FEF3C7', color: step.done ? '#065F46' : '#92400E', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {step.done ? '完了' : '未完了'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 希望条件 */}
        {tab === 'pref' && (
          <PreferenceForm userId={userId} />
        )}

        {/* プロフィール編集 */}
        {tab === 'profile' && (
          <ProfileForm
            userId={userId}
            initial={profile}
            initialBank={bankAccount}
            onSaved={(p, b) => { setProfile(p); if (b) setBankAccount(b); setTab('apps') }}
          />
        )}

      </div>
    </div>
  )
}

function Empty({ icon, text, href, linkLabel }: { icon: string; text: string; href: string; linkLabel: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2235', marginBottom: 24 }}>{text}</div>
      <Link href={href} style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, background: '#E07070', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>{linkLabel}</Link>
    </div>
  )
}

function ProfileForm({ userId, initial, initialBank, onSaved }: {
  userId: string
  initial: Profile | null
  initialBank: BankAccount | null
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
  const [bankError, setBankError] = useState('')

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/license.${ext}`
    const { error: uploadError } = await supabase.storage.from('licenses').upload(path, file, { upsert: true })
    if (uploadError) { alert('アップロードに失敗しました: ' + uploadError.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('licenses').getPublicUrl(path)
    await supabase.from('nurse_profiles').update({ license_url: urlData.publicUrl }).eq('id', userId)
    setLicenseUrl(urlData.publicUrl)
    setUploading(false)
    alert('免許証をアップロードしました')
  }

  const save = async () => {
    setSaving(true); setError('')
    let uid = userId
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('ログイン情報が取得できませんでした。'); setSaving(false); return }
      uid = user.id
    }
    const areasArr = areas.split(/[、,，]+/).map(s => s.trim()).filter(Boolean)
    const skillsArr = skills.split(/[、,，]+/).map(s => s.trim()).filter(Boolean)
    const expYears = parseInt(years) || 0
    const ageNum = parseInt(age) || null
    const { data: existing } = await supabase.from('nurse_profiles').select('id').eq('id', uid).maybeSingle()
    const payload = { name, license, experience_years: expYears, areas: areasArr, skills: skillsArr, age: ageNum, gender: gender || null }
    let err = null
    if (existing) { const { error: e } = await supabase.from('nurse_profiles').update(payload).eq('id', uid); err = e }
    else { const { error: e } = await supabase.from('nurse_profiles').insert({ id: uid, ...payload }); err = e }
    if (err) { setError(err.message); setSaving(false); return }
    onSaved({ name, license, experience_years: expYears, areas: areasArr, skills: skillsArr, age: ageNum ?? undefined, gender: gender || undefined, license_url: licenseUrl })
    setSaving(false); setDone(true); setTimeout(() => setDone(false), 2000)
  }

  const saveBank = async () => {
    if (!bankName || !branchName || !accountNumber || !accountHolder) { setBankError('すべての項目を入力してください'); return }
    setBankSaving(true); setBankError('')
    const { data: existing } = await supabase.from('bank_accounts').select('id').eq('nurse_id', userId).maybeSingle()
    const payload = { nurse_id: userId, bank_name: bankName, branch_name: branchName, account_type: accountType, account_number: accountNumber, account_holder: accountHolder, updated_at: new Date().toISOString() }
    let err = null
    if (existing) { const { error: e } = await supabase.from('bank_accounts').update(payload).eq('nurse_id', userId); err = e }
    else { const { error: e } = await supabase.from('bank_accounts').insert(payload); err = e }
    if (err) { setBankError(err.message); setBankSaving(false); return }
    const newBank: BankAccount = { bank_name: bankName, branch_name: branchName, account_type: accountType, account_number: accountNumber, account_holder: accountHolder }
    onSaved({ name, license, experience_years: parseInt(years) || 0, areas: areas.split(/[、,，]+/).map(s => s.trim()).filter(Boolean), skills: skills.split(/[、,，]+/).map(s => s.trim()).filter(Boolean), license_url: licenseUrl }, newBank)
    setBankSaving(false); setBankDone(true); setTimeout(() => setBankDone(false), 2000)
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: 8, fontSize: 14, color: '#1A2235', background: '#fff', fontFamily: 'inherit', outline: 'none' } as React.CSSProperties

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE0E0', padding: '28px 32px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>プロフィール編集</h2>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>氏名</label>
          <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="田中 みなみ" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>資格</label>
          <select value={license} onChange={e => setLicense(e.target.value)} style={inp}>
            <option value="rn">正看護師</option>
            <option value="lpn">准看護師</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>年齢</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)} style={inp} placeholder="30" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>性別</label>
            <select value={gender} onChange={e => setGender(e.target.value)} style={inp}>
              <option value="">選択してください</option>
              <option value="女性">女性</option>
              <option value="男性">男性</option>
              <option value="その他">その他</option>
              <option value="回答しない">回答しない</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>経験年数</label>
          <input type="number" value={years} onChange={e => setYears(e.target.value)} style={inp} placeholder="8" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>活動エリア（読点区切り）</label>
          <input value={areas} onChange={e => setAreas(e.target.value)} style={inp} placeholder="那覇市、浦添市" />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>スキル・経験（読点区切り）</label>
          <input value={skills} onChange={e => setSkills(e.target.value)} style={inp} placeholder="内科、外科、ICU" />
        </div>
        <div style={{ marginBottom: 28, background: '#FBF7F7', borderRadius: 10, padding: 16, border: '1px solid #EDE0E0' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>看護師免許証</label>
          {licenseUrl ? (
            <div>
              <span style={{ background: '#D1FAE5', color: '#065F46', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 10 }}>提出済み</span><br />
              <label style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, border: '1.5px solid #E07070', color: '#E07070', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {uploading ? 'アップロード中...' : '再アップロード'}
                <input type="file" accept="image/*,.pdf" onChange={handleLicenseUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>免許証の画像またはPDFをアップロードしてください。</div>
              <label style={{ display: 'inline-block', padding: '10px 20px', borderRadius: 8, background: '#E07070', color: '#fff', fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? 'アップロード中...' : '免許証をアップロード'}
                <input type="file" accept="image/*,.pdf" onChange={handleLicenseUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </div>
          )}
        </div>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>エラー: {error}</div>}
        <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: done ? '#6BAF92' : '#E07070', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? '保存中...' : done ? '保存しました！' : '保存する'}
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE0E0', padding: '28px 32px' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>振込口座情報</h2>
        <p style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>給与振込に使用する口座を登録してください。採用確定した施設の担当者のみ確認できます。</p>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>銀行名</label>
          <input value={bankName} onChange={e => setBankName(e.target.value)} style={inp} placeholder="○○銀行" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>支店名</label>
          <input value={branchName} onChange={e => setBranchName(e.target.value)} style={inp} placeholder="那覇支店" />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>口座種別</label>
          <select value={accountType} onChange={e => setAccountType(e.target.value)} style={inp}>
            <option value="普通">普通</option>
            <option value="当座">当座</option>
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>口座番号</label>
          <input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} style={inp} placeholder="1234567" maxLength={8} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>口座名義（カタカナ）</label>
          <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} style={inp} placeholder="タナカ ミナミ" />
        </div>
        <div style={{ background: '#FBF7F7', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>
          🔒 口座情報は採用確定した施設の担当者のみ閲覧できます。
        </div>
        {bankError && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>エラー: {bankError}</div>}
        <button onClick={saveBank} disabled={bankSaving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: bankDone ? '#6BAF92' : '#E07070', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
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
  const [notifyLine, setNotifyLine] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [jobStatus, setJobStatus] = useState('looking_for_part')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('nurse_preferences').select('*').eq('nurse_id', userId).maybeSingle()
      if (data) {
        setAreas(data.areas ?? [])
        setFacilityTypes(data.facility_types ?? [])
        setMinWage(data.min_wage ?? 0)
        setNotifyLine(data.notify_line ?? true)
        setNotifyEmail(data.notify_email ?? true)
      }
      const { data: np } = await supabase.from('nurse_profiles').select('job_status').eq('id', userId).maybeSingle()
      if (np?.job_status) setJobStatus(np.job_status)
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const toggle = (arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(a => a !== val) : [...arr, val])
  }

  const save = async () => {
    setSaving(true)
    await supabase.from('nurse_profiles').update({ job_status: jobStatus }).eq('id', userId)
    const payload = { nurse_id: userId, areas, facility_types: facilityTypes, min_wage: minWage, notify_line: notifyLine, notify_email: notifyEmail, updated_at: new Date().toISOString() }
    const { data: existing } = await supabase.from('nurse_preferences').select('id').eq('nurse_id', userId).maybeSingle()
    if (existing) {
      await supabase.from('nurse_preferences').update(payload).eq('nurse_id', userId)
    } else {
      await supabase.from('nurse_preferences').insert(payload)
    }
    setSaving(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>読み込み中...</div>

  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button key={label} onClick={onClick} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400, background: active ? '#E07070' : '#fff', color: active ? '#fff' : '#64748B', border: `1px solid ${active ? '#E07070' : '#EDE0E0'}`, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EDE0E0', padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>希望条件設定</div>
        <div style={{ fontSize: 13, color: '#64748B' }}>条件に合う求人が投稿されたら自動で通知します</div>
      </div>

      {/* ステータス設定 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>🙋 今の状況</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { value: 'looking_for_part', label: 'バイト探し中', desc: '単発・スポット勤務を探しています' },
            { value: 'looking_for_job', label: '転職活動中', desc: '正社員・パートを探しています' },
            { value: 'looking_for_both', label: 'どちらも検討中', desc: '単発も転職もどちらも見ています' },
            { value: 'not_looking', label: '現在募集停止中', desc: 'スカウトを受け取りたくない' },
          ].map(s => (
            <label key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${jobStatus === s.value ? '#E07070' : '#EDE0E0'}`, borderRadius: 10, cursor: 'pointer', background: jobStatus === s.value ? '#FDF0F0' : '#fff' }}>
              <input type="radio" name="jobStatus" value={s.value} checked={jobStatus === s.value} onChange={() => setJobStatus(s.value)} style={{ accentColor: '#E07070' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{s.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* エリア */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>📍 希望エリア（複数選択可）</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {AREAS.map(a => chip(a, areas.includes(a), () => toggle(areas, a, setAreas)))}
        </div>
      </div>

      {/* 施設種別 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>🏥 希望施設種別（複数選択可）</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FACILITY_TYPES.map(t => chip(t, facilityTypes.includes(t), () => toggle(facilityTypes, t, setFacilityTypes)))}
        </div>
      </div>

      {/* 最低日給 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>💰 希望最低日給</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WAGE_OPTIONS.map(w => chip(w.label, minWage === w.value, () => setMinWage(w.value)))}
        </div>
      </div>

      {/* 通知設定 */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>🔔 通知方法</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
          <input type="checkbox" checked={notifyEmail} onChange={e => setNotifyEmail(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#E07070' }} />
          メールで通知
        </label>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>※ LINEには全体通知が届きます</div>
      </div>

      <div style={{ background: '#FBF7F7', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#64748B', lineHeight: 1.8 }}>
        💡 条件を指定しない項目はすべての求人が対象になります
      </div>

      <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: done ? '#6BAF92' : '#E07070', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
        {saving ? '保存中...' : done ? '保存しました！' : '希望条件を保存する'}
      </button>
    </div>
  )
}

function ScoutList({ userId }: { userId: string }) {
  const [scouts, setScouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('scouts').select('id, message, status, created_at, job_id, facility_id').eq('nurse_id', userId).order('created_at', { ascending: false })
      if (data && data.length > 0) {
        const facilityIds = [...new Set(data.map((s: any) => s.facility_id))]
        const { data: facilities } = await supabase.from('facilities').select('id, facility_name').in('id', facilityIds)
        const fMap: Record<string, string> = {}
        facilities?.forEach((f: any) => { fMap[f.id] = f.facility_name })
        const jobIds = data.filter((s: any) => s.job_id).map((s: any) => s.job_id)
        let jobMap: Record<string, any> = {}
        if (jobIds.length > 0) {
          const { data: jobs } = await supabase.from('jobs').select('id, work_date, time_from, time_to, wage_amount').in('id', jobIds)
          jobs?.forEach((j: any) => { jobMap[j.id] = j })
        }
        setScouts(data.map((s: any) => ({ ...s, facility_name: fMap[s.facility_id] ?? '—', job: jobMap[s.job_id] ?? null })))
      }
      setLoading(false)
    }
    if (userId) load()
  }, [userId])

  const respond = async (scoutId: string, status: 'interested' | 'declined') => {
    await supabase.from('scouts').update({ status }).eq('id', scoutId)
    setScouts(prev => prev.map(s => s.id === scoutId ? { ...s, status } : s))
  }

  const STATUS: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: '未返答', bg: '#FEF3C7', color: '#92400E' },
    interested: { label: '興味あり', bg: '#D1FAE5', color: '#065F46' },
    declined: { label: '辞退', bg: '#F1F5F9', color: '#64748B' },
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>読み込み中...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {scouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1A2235', marginBottom: 8 }}>まだスカウトが届いていません</div>
          <div style={{ fontSize: 13 }}>希望条件を設定すると施設から見つけてもらいやすくなります</div>
        </div>
      ) : scouts.map(scout => {
        const st = STATUS[scout.status] ?? STATUS.pending
        return (
          <div key={scout.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #EDE0E0', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{scout.facility_name}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{new Date(scout.created_at).toLocaleDateString('ja-JP')}</div>
              </div>
              <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{st.label}</span>
            </div>
            <div style={{ background: '#FBF7F7', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#1A2235', lineHeight: 1.7, marginBottom: scout.job ? 8 : 12 }}>
              {scout.message}
            </div>
            {scout.job && (
              <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#065F46', marginBottom: 12 }}>
                📅 {scout.job.work_date}　⏰ {scout.job.time_from}〜{scout.job.time_to}　💰 日給¥{scout.job.wage_amount.toLocaleString()}
              </div>
            )}
            {scout.status === 'pending' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => respond(scout.id, 'declined')} style={{ flex: 1, padding: '9px', background: '#fff', color: '#64748B', border: '1px solid #EDE0E0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>辞退する</button>
                <button onClick={() => respond(scout.id, 'interested')} style={{ flex: 2, padding: '9px', background: '#E07070', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>興味あり</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
