'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Job = {
  id: string
  work_date: string
  time_from: string
  time_to: string
  wage_amount: number
  wage_type: string
  facility_type: string
  facility_id: string
  required_license: string
  description: string
  is_urgent: boolean
  tags: string[]
  status: string
  address?: string
  facility_name?: string
}

const AREAS = ['那覇市', '浦添市', '宜野湾市', '沖縄市', 'うるま市', '名護市', '糸満市', '豊見城市', '南城市', '読谷村', '恩納村', 'その他']
const FACILITY_TYPES = ['病院', 'クリニック', '介護老人保健施設', '訪問看護', 'デイサービス', '訪問入浴', 'グループホーム', '特別養護老人ホーム', '有料老人ホーム', '障害者施設', '保育園', 'その他']
const WAGE_RANGES = [
  { label: '¥5,000〜', min: 5000 },
  { label: '¥10,000〜', min: 10000 },
  { label: '¥20,000〜', min: 20000 },
]

const C = {
  primary: '#E07070',
  dark: '#C45A5A',
  light: '#FDF0F0',
  border: '#EDE0E0',
  sub: '#64748B',
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedWage, setSelectedWage] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    fetchJobs()
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      setUserId(data.user.id)
      fetchFavorites(data.user.id)
    }
  }

  const fetchFavorites = async (uid: string) => {
    const { data } = await supabase.from('favorites').select('job_id').eq('nurse_id', uid)
    if (data) setFavorites(data.map(f => f.job_id))
  }

  const fetchJobs = async () => {
    const { data: jobData, error } = await supabase
      .from('jobs')
      .select('*')
      .in('status', ['open', 'filled'])

    if (error || !jobData) { setLoading(false); return }

    const facilityIds = [...new Set(jobData.map(j => j.facility_id).filter(Boolean))]
    const { data: facilitiesData } = await supabase
      .from('facilities')
      .select('id, facility_name, address')
      .in('id', facilityIds)

    const facilityMap: Record<string, { facility_name: string; address: string }> = {}
    facilitiesData?.forEach(f => { facilityMap[f.id] = f })

    const merged = jobData.map(j => ({
      ...j,
      facility_name: facilityMap[j.facility_id]?.facility_name ?? '',
      // jobsテーブルのaddressを優先、なければfacilitiesのaddressを使う
      address: j.address || facilityMap[j.facility_id]?.address || '',
    }))

    merged.sort((a, b) => {
      if (a.status === b.status) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return a.status === 'open' ? -1 : 1
    })

    setJobs(merged)
    setLoading(false)
  }

  const toggleFavorite = async (jobId: string) => {
    if (!userId) { alert('いいねするにはログインしてください'); return }
    const isFav = favorites.includes(jobId)
    if (isFav) {
      await supabase.from('favorites').delete().eq('nurse_id', userId).eq('job_id', jobId)
      setFavorites(prev => prev.filter(id => id !== jobId))
    } else {
      await supabase.from('favorites').insert({ nurse_id: userId, job_id: jobId })
      setFavorites(prev => [...prev, jobId])
    }
  }

  const toggleArea = (area: string) => {
    setSelectedAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  const toggleType = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])
  }

  const calcEstimate = (job: Job) => {
    if (job.wage_type !== 'hourly') return null
    const [fh, fm] = job.time_from.split(':').map(Number)
    const [th, tm] = job.time_to.split(':').map(Number)
    const hours = (th * 60 + tm - fh * 60 - fm) / 60
    if (hours <= 0) return null
    return Math.round(job.wage_amount * hours)
  }

  const activeFilterCount = selectedAreas.length + selectedTypes.length + (selectedWage ? 1 : 0)

  const filtered = jobs.filter(j => {
    if (query && !j.facility_name?.includes(query) && !j.facility_type?.includes(query) && !j.address?.includes(query)) return false
    if (selectedAreas.length > 0 && !selectedAreas.some(a => j.address?.includes(a))) return false
    if (selectedTypes.length > 0 && !selectedTypes.includes(j.facility_type)) return false
    if (selectedWage !== null) {
      const amount = j.wage_type === 'hourly' ? (calcEstimate(j) ?? 0) : j.wage_amount
      if (amount < selectedWage) return false
    }
    return true
  })

  const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400,
        background: active ? C.primary : '#fff',
        color: active ? '#fff' : C.sub,
        border: `1px solid ${active ? C.primary : C.border}`,
        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>求人一覧</h1>

      <div style={{ background: '#fff', borderRadius: '12px', border: `1px solid ${C.border}`, marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            placeholder='施設名・種別・勤務地で検索'
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, padding: '9px 14px', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '14px', outline: 'none' }}
          />
          <button
            onClick={() => setFilterOpen(o => !o)}
            style={{
              padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: activeFilterCount > 0 ? C.primary : '#F1F5F9',
              color: activeFilterCount > 0 ? '#fff' : C.sub,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔍 絞り込み
            {activeFilterCount > 0 && (
              <span style={{ background: '#fff', color: C.primary, borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setSelectedAreas([]); setSelectedTypes([]); setSelectedWage(null) }}
              style={{ padding: '9px 12px', borderRadius: '8px', fontSize: '12px', background: 'none', border: `1px solid ${C.border}`, color: C.sub, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >
              クリア
            </button>
          )}
        </div>

        {filterOpen && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 16px 20px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>📍 エリア</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {AREAS.map(area => (
                  <FilterChip key={area} label={area} active={selectedAreas.includes(area)} onClick={() => toggleArea(area)} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>💰 給与（想定日給）</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {WAGE_RANGES.map(w => (
                  <FilterChip key={w.label} label={w.label} active={selectedWage === w.min} onClick={() => setSelectedWage(selectedWage === w.min ? null : w.min)} />
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 8 }}>🏥 施設種別</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FACILITY_TYPES.map(type => (
                  <FilterChip key={type} label={type} active={selectedTypes.includes(type)} onClick={() => toggleType(type)} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, color: C.sub, marginBottom: 14 }}>
        {loading ? '読み込み中...' : `${filtered.length}件の求人`}
        {activeFilterCount > 0 && <span style={{ color: C.primary, fontWeight: 600 }}>（絞り込み中）</span>}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.sub }}>読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: C.sub }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>条件に合う求人が見つかりませんでした</div>
          <button onClick={() => { setSelectedAreas([]); setSelectedTypes([]); setSelectedWage(null); setQuery('') }} style={{ padding: '8px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
            条件をリセットする
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(job => {
            const isFilled = job.status === 'filled'
            const estimate = calcEstimate(job)
            return (
              <div key={job.id} style={{ position: 'relative' }}>
                {isFilled && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(100, 116, 139, 0.85)', color: '#fff', textAlign: 'center', padding: '6px 0', fontSize: '13px', fontWeight: '700', borderRadius: '12px 12px 0 0', zIndex: 10, letterSpacing: '0.05em' }}>
                    🎉 募集人数に達しました！ありがとうございます
                  </div>
                )}
                {!isFilled && (
                  <button
                    onClick={() => toggleFavorite(job.id)}
                    style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', filter: favorites.includes(job.id) ? 'none' : 'grayscale(100%)' }}
                  >
                    {favorites.includes(job.id) ? '❤️' : '🤍'}
                  </button>
                )}
                <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    background: isFilled ? '#F8FAFC' : '#fff',
                    borderRadius: '12px', padding: '20px',
                    paddingTop: isFilled ? '44px' : '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    border: `1px solid ${isFilled ? '#CBD5E1' : C.border}`,
                    cursor: 'pointer', opacity: isFilled ? 0.75 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingRight: isFilled ? '0' : '32px' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{job.facility_name}</div>
                        <div style={{ fontSize: '12px', color: C.sub, marginTop: '2px' }}>{job.facility_type}</div>
                      </div>
                      {job.is_urgent && !isFilled && (
                        <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', height: 'fit-content' }}>急募</span>
                      )}
                    </div>
                    {job.address && (
                      <div style={{ fontSize: '12px', color: C.sub, marginBottom: '8px' }}>📍 {job.address}</div>
                    )}
                    <div style={{ fontSize: '13px', color: C.sub, marginBottom: '12px' }}>
                      📅 {job.work_date}　⏰ {job.time_from}〜{job.time_to}
                    </div>
                    {job.tags && job.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {job.tags.map(tag => (
                          <span key={tag} style={{ background: '#F1F5F9', color: C.sub, padding: '2px 8px', borderRadius: '20px', fontSize: '11px' }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <span style={{ fontSize: '22px', fontWeight: '700', color: isFilled ? '#94A3B8' : C.primary }}>
                          ¥{job.wage_amount.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '12px', color: C.sub, marginLeft: '4px' }}>
                          {job.wage_type === 'hourly' ? '時給' : '日給'}
                        </span>
                        {job.wage_type === 'hourly' && estimate && (
                          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                            想定日給 ¥{estimate.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <span style={{ background: isFilled ? '#F1F5F9' : C.light, color: isFilled ? '#94A3B8' : C.dark, padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                        {job.facility_type}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
