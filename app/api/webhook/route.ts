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
  green: '#6BAF92',
  text: '#1A2235',
  sub: '#64748B',
  border: '#EDE0E0',
  bg: '#FBF7F7',
  card: '#FFFFFF',
}

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  pending:  { label: '審査中',   bg: '#FEF3C7', color: '#92400E' },
  accepted: { label: '採用確定', bg: '#D1FAE5', color: '#065F46' },
  rejected: { label: '見送り',   bg: '#F1F5F9', color: C.sub },
}

export default function MyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'apps' | 'favs' | 'profile'>('apps')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // プロフィール
      const { data: np } = await supabase
        .from('nurse_profiles')
        .select('name, license, experience_years, areas, skills')
        .eq('id', user.id)
        .maybeSingle()
      if (np) setProfile(np as Profile)

      // 応募履歴
      const { data: apps } = await supabase
        .from('applications')
        .select('id, status, created_at, job_id')
        .eq('nurse_id', user.id)
        .order('created_at', { ascending: false })

      if (apps && apps.length > 0) {
        const jobIds = apps.map((a: any) => a.job_id)
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, work_date, time_from, time_to, wage_amount, facility_id')
          .in('id', jobIds)

        const facilityIds = [...new Set((jobs ?? []).map((j: any) => j.facility_id))]
        const { data: facilities } = await supabase
          .from('facilities')
          .select('user_id, facility_name, facility_type')
          .in('user_id', facilityIds)

        setApplications(apps.map((app: any) => {
          const job = (jobs ?? []).find((j: any) => j.id === app.job_id)
          const fac = (facilities ?? []).find((f: any) => f.user_id === job?.facility_id)
          return {
            id: app.id, status: app.status, created_at: app.created_at, job_id: app.job_id,
            job_work_date: job?.work_date ?? '', job_time_from: job?.time_from ?? '',
            job_time_to: job?.time_to ?? '', job_wage: job?.wage_amount ?? 0,
            facility_name: fac?.facility_name ?? '—', facility_type: fac?.facility_type ?? '',
          }
        }))
      }

      // お気に入り
      const { data: favs } = await supabase
        .from('favorites').select('job_id').eq('nurse_id', user.id)

      if (favs && favs.length > 0) {
        const fJobIds = favs.map((f: any) => f.job_id)
        const { data: fJobs } = await supabase
          .from('jobs').select('id, work_date, wage_amount, facility_id').in('id', fJobIds)
        const fFacIds = [...new Set((fJobs ?? []).map((j: any) => j.facility_id))]
        const { data: fFacs } = await supabase
          .from('facilities').select('user_id, facility_name, facility_type').in('user_id', fFacIds)
        setFavorites((fJobs ?? []).map((j: any) => {
          const fac = (fFacs ?? []).find((f: any) => f.user_id === j.facility_id)
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

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>
      読み込み中...
    </div>
  )

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

        {/* プロフィールヘッダー */}
        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '24px 28px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: `linear-gradient(135deg, ${C.primary}, ${C.teal})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700 }}>
            {profile?.name?.charAt(0) ?? '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{profile?.name ?? '（未設定）'}</div>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
              {profile?.license === 'rn' ? '正看護師' : profile?.license === 'lpn' ? '准看護師' : '—'}
              {profile?.experience_years ? ` · 経験${profile.experience_years}年` : ''}
              {profile?.areas?.length ? ` · ${profile.areas.join('・')}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {(profile?.skills ?? []).map(s => (
                <span key={s} style={{ background: C.light, color: C.dark, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>
          <button onClick={() => setTab('profile')} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.primary}`, background: 'transparent', color: C.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            プロフィール編集
          </button>
        </div>

        {/* サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: '応募中', value: applications.filter(a => a.status === 'pending').length, icon: '⏳' },
            { label: '採用確定', value: applications.filter(a => a.status === 'accepted').length, icon: '✅' },
            { label: 'お気に入り', value: favorites.length, icon: '❤️' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: C.primary }}>{value}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
          {(['apps', 'favs', 'profile'] as const).map((key, i) => {
            const labels = ['応募履歴', 'お気に入り', 'プロフィール']
            return (
              <button key={key} onClick={() => setTab(key)} style={{ background: 'none', border: 'none', padding: '12px 18px', fontWeight: tab === key ? 700 : 500, color: tab === key ? C.primary : C.sub, borderBottom: `2px solid ${tab === key ? C.primary : 'transparent'}`, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                {labels[i]}
              </button>
            )
          })}
        </div>

        {/* 応募履歴 */}
        {tab === 'apps' && (
          applications.length === 0
            ? <Empty icon="📋" text="まだ応募した求人がありません" href="/jobs" linkLabel="求人を探す" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applications.map(app => {
                  const st = STATUS[app.status] ?? STATUS.pending
                  return (
                    <div key={app.id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{app.facility_name}</div>
                        <div style={{ fontSize: 13, color: C.sub }}>📅 {app.job_work_date}　⏰ {app.job_time_from}〜{app.job_time_to}</div>
                        <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>💰 日給 ¥{app.job_wage.toLocaleString()}　🏥 {app.facility_type}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ background: st.bg, color: st.color, padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{st.label}</span>
                        {app.status === 'accepted' && (
                          <Link href={`/chat/${app.id}`} style={{ fontSize: 13, color: C.primary, fontWeight: 600, textDecoration: 'none' }}>💬 チャットを開く →</Link>
                        )}
                        <span style={{ fontSize: 11, color: C.sub }}>{app.created_at?.slice(0, 10)}</span>
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
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {favorites.map(fav => (
                  <div key={fav.job_id} style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{fav.facility_name}</div>
                      <div style={{ fontSize: 13, color: C.sub }}>📅 {fav.work_date}　🏥 {fav.facility_type}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.primary, marginTop: 4 }}>¥{fav.wage_amount?.toLocaleString()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Link href={`/jobs/${fav.job_id}`} style={{ padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.primary}`, color: C.primary, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>詳細を見る</Link>
                      <button onClick={() => removeFav(fav.job_id)} style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.sub, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>削除</button>
                    </div>
                  </div>
                ))}
              </div>
        )}

        {/* プロフィール編集 */}
        {tab === 'profile' && (
          <ProfileForm userId={userId} initial={profile} onSaved={p => { setProfile(p); setTab('apps') }} />
        )}

      </div>
    </div>
  )
}

function Empty({ icon, text, href, linkLabel }: { icon: string; text: string; href: string; linkLabel: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: C.sub }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 24 }}>{text}</div>
      <Link href={href} style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 8, background: C.primary, color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>{linkLabel}</Link>
    </div>
  )
}

function ProfileForm({ userId, initial, onSaved }: { userId: string; initial: Profile | null; onSaved: (p: Profile) => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [license, setLicense] = useState(initial?.license ?? 'rn')
  const [years, setYears] = useState(String(initial?.experience_years ?? ''))
  const [areas, setAreas] = useState((initial?.areas ?? []).join('、'))
  const [skills, setSkills] = useState((initial?.skills ?? []).join('、'))
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setSaving(true)
    setError('')

    const areasArr = areas.split(/[、,，]+/).map(s => s.trim()).filter(Boolean)
    const skillsArr = skills.split(/[、,，]+/).map(s => s.trim()).filter(Boolean)
    const expYears = parseInt(years) || 0

    // 既存レコードがあるかチェック
    const { data: existing } = await supabase
      .from('nurse_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    let err = null
    if (existing) {
      // 更新
      const { error: e } = await supabase
        .from('nurse_profiles')
        .update({ name, license, experience_years: expYears, areas: areasArr, skills: skillsArr })
        .eq('id', userId)
      err = e
    } else {
      // 新規作成
      const { error: e } = await supabase
        .from('nurse_profiles')
        .insert({ id: userId, name, license, experience_years: expYears, areas: areasArr, skills: skillsArr })
      err = e
    }

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }

    onSaved({ name, license, experience_years: expYears, areas: areasArr, skills: skillsArr })
    setSaving(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
  }

  const inp = { width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.text, background: '#fff', fontFamily: 'inherit', outline: 'none' } as React.CSSProperties

  return (
    <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '28px 32px' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>プロフィール編集</h2>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>氏名</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inp} placeholder="田中 みなみ" />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>資格</label>
        <select value={license} onChange={e => setLicense(e.target.value)} style={inp}>
          <option value="rn">正看護師</option>
          <option value="lpn">准看護師</option>
        </select>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>経験年数</label>
        <input type="number" value={years} onChange={e => setYears(e.target.value)} style={inp} placeholder="8" />
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>活動エリア（読点区切り）</label>
        <input value={areas} onChange={e => setAreas(e.target.value)} style={inp} placeholder="東京都、神奈川県" />
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>スキル・経験（読点区切り）</label>
        <input value={skills} onChange={e => setSkills(e.target.value)} style={inp} placeholder="内科、外科、ICU" />
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
          ❌ エラー: {error}
        </div>
      )}

      <button onClick={save} disabled={saving} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: done ? C.green : C.primary, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
        {saving ? '保存中...' : done ? '✅ 保存しました！' : '保存する'}
      </button>
    </div>
  )
}
