'use client'

import { useEffect, useState } from 'react'
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
  facilities?: { facility_name: string; facility_type: string }
}

const C = { primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0', bg: '#FBF7F7', card: '#FFFFFF', border: '#EDE0E0', sub: '#64748B' }

export default function RegularJobsPage() {
  const [jobs, setJobs] = useState<RegularJob[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from('regular_jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      console.log('data:', JSON.stringify(data))
      console.log('error:', JSON.stringify(error))
      if (data) setJobs(data)
      setLoading(false)
    }
    fetchJobs()
  }, [])

  const filtered = jobs.filter(j => !filter || j.employment_type === filter)

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>常勤・パート求人</h1>
          <p style={{ color: C.sub, fontSize: 14 }}>沖縄県内の医療・介護施設の求人情報</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {['', '常勤', 'パート', '契約社員'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${filter === t ? C.primary : C.border}`, background: filter === t ? C.primary : '#fff', color: filter === t ? '#fff' : C.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {t || 'すべて'}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.sub }}>読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, color: C.sub }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600 }}>現在募集中の求人はありません</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(job => (
              <Link key={job.id} href={`/regular-jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px 24px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <span style={{ background: C.light, color: C.dark, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginRight: 8 }}>{job.employment_type}</span>
                      <span style={{ fontSize: 12, color: C.sub }}>{job.facilities?.facility_type}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.primary }}>{job.salary_type} ¥{job.salary_amount?.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>🏥 {job.facilities?.facility_name}</div>
                  <div style={{ fontSize: 13, color: C.sub, marginBottom: 4 }}>📍 {job.location}</div>
                  <div style={{ fontSize: 13, color: C.sub }}>⏰ {job.work_hours}　📅 {job.work_days}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
