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
  facility_type: string
  required_license: string
  description: string
  is_urgent: boolean
  tags: string[]
  facilities: {
    facility_name: string
    address: string
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)

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
    const { data } = await supabase
      .from('favorites')
      .select('job_id')
      .eq('nurse_id', uid)
    if (data) {
      setFavorites(data.map(f => f.job_id))
    }
  }

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select(`*, facilities (facility_name, address)`)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (!error && data) setJobs(data)
    setLoading(false)
  }

  const toggleFavorite = async (jobId: string) => {
    if (!userId) {
      alert('いいねするにはログインしてください')
      return
    }
    const isFav = favorites.includes(jobId)
    if (isFav) {
      await supabase.from('favorites').delete()
        .eq('nurse_id', userId).eq('job_id', jobId)
      setFavorites(prev => prev.filter(id => id !== jobId))
    } else {
      await supabase.from('favorites').insert({ nurse_id: userId, job_id: jobId })
      setFavorites(prev => [...prev, jobId])
    }
  }

  const filtered = jobs.filter(j =>
    !query ||
    j.facilities?.facility_name?.includes(query) ||
    j.facility_type?.includes(query)
  )

  return (
    <div style={{
      maxWidth: '1100px',
      margin: '0 auto',
      padding: '32px 20px',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        求人一覧
      </h1>

      {/* 検索バー */}
      <div style={{
        background: '#fff',
        padding: '16px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        marginBottom: '24px'
      }}>
        <input
          placeholder='施設名・種別で検索'
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
          読み込み中...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
          求人が見つかりませんでした
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {filtered.map(job => (
            <div key={job.id} style={{ position: 'relative' }}>

              {/* ❤️ いいねボタン */}
              <button
                onClick={() => toggleFavorite(job.id)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  zIndex: 10,
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  filter: favorites.includes(job.id) ? 'none' : 'grayscale(100%)',
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {favorites.includes(job.id) ? '❤️' : '🤍'}
              </button>

              <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  border: '1px solid #EDE0E0',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingRight: '32px' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>
                        {job.facilities?.facility_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {job.facilities?.address}
                      </div>
                    </div>
                    {job.is_urgent && (
                      <span style={{
                        background: '#FEE2E2', color: '#991B1B',
                        padding: '2px 8px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
                        height: 'fit-content'
                      }}>急募</span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '12px' }}>
                    📅 {job.work_date}　⏰ {job.time_from}〜{job.time_to}
                  </div>

                  {job.tags && job.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {job.tags.map(tag => (
                        <span key={tag} style={{
                          background: '#F1F5F9', color: '#64748B',
                          padding: '2px 8px', borderRadius: '20px', fontSize: '11px'
                        }}>{tag}</span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '22px', fontWeight: '700', color: '#E07070' }}>
                        ¥{job.wage_amount.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '4px' }}>日給</span>
                    </div>
                    <span style={{
                      background: '#FDF0F0', color: '#C45A5A',
                      padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                    }}>
                      {job.facility_type}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}