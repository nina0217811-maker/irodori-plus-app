'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Job = {
  id: string
  work_date: string
  time_from: string
  time_to: string
  wage_amount: number
  facility_type: string
  status: string
  is_urgent: boolean
  applications: { id: string }[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [facilityName, setFacilityName] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/login'); return }
    setUserId(userData.user.id)

    // 施設情報取得
    const { data: facility } = await supabase
      .from('facilities')
      .select('facility_name')
      .eq('id', userData.user.id)
      .single()
    if (facility) setFacilityName(facility.facility_name)

    // 求人一覧取得
    const { data: jobData } = await supabase
      .from('jobs')
      .select(`*, applications (id)`)
      .eq('facility_id', userData.user.id)
      .order('created_at', { ascending: false })
    if (jobData) setJobs(jobData)
    setLoading(false)
  }

  const closeJob = async (jobId: string) => {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId)
    fetchData()
  }

  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applications?.length || 0), 0)
  const openJobs = jobs.filter(j => j.status === 'open')

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>

      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>施設ダッシュボード</h1>
          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>{facilityName}</div>
        </div>
        <button
          onClick={() => router.push('/post-job')}
          style={{
            padding: '10px 20px',
            background: '#E07070',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          ＋ 新規求人を投稿
        </button>
      </div>

      {/* プランステータス */}
      <div style={{
        background: 'linear-gradient(135deg, #6B2D2D, #C0727A)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '13px', opacity: 0.8 }}>現在のプラン</div>
          <div style={{ fontSize: '20px', fontWeight: '700', marginTop: '4px' }}>スタンダード · ¥10,000/月</div>
          <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>求人掲載: 無制限</div>
        </div>
        <span style={{
          background: '#10B981', color: '#fff',
          padding: '4px 12px', borderRadius: '20px',
          fontSize: '13px', fontWeight: '600',
        }}>掲載中</span>
      </div>

      {/* 統計 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          ['掲載中の求人', openJobs.length, '📋'],
          ['総応募者数', totalApplicants, '👩‍⚕️'],
          ['総求人数', jobs.length, '✅'],
        ].map(([l, v, ic]) => (
          <div key={String(l)} style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #EDE0E0',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{ic}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#E07070' }}>{v}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* 求人一覧 */}
      <div style={{ fontWeight: '700', marginBottom: '12px', fontSize: '15px' }}>掲載中の求人</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>読み込み中...</div>
      ) : jobs.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px',
          background: '#fff', borderRadius: '12px',
          border: '1px solid #EDE0E0', color: '#64748B',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>まだ求人がありません</div>
          <button
            onClick={() => router.push('/post-job')}
            style={{
              padding: '10px 24px', background: '#E07070', color: '#fff',
              border: 'none', borderRadius: '8px', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer', marginTop: '8px',
            }}
          >
            最初の求人を投稿する
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {jobs.map(job => (
            <div key={job.id} style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              border: '1px solid #EDE0E0',
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', marginBottom: '3px' }}>
                  {job.work_date} · {job.time_from}〜{job.time_to}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B' }}>
                  日給 ¥{job.wage_amount?.toLocaleString()} · {job.facility_type}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{
                  background: job.status === 'open' ? '#D1FAE5' : '#F1F5F9',
                  color: job.status === 'open' ? '#065F46' : '#64748B',
                  padding: '3px 10px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: '600',
                }}>
                  {job.status === 'open' ? '掲載中' : '終了'}
                </span>

                <span style={{
                  background: '#FDF0F0', color: '#C45A5A',
                  padding: '4px 12px', borderRadius: '20px',
                  fontSize: '13px', fontWeight: '700',
                }}>
                  応募 {job.applications?.length || 0}名
                </span>

                {job.status === 'open' && (
                  <button
                    onClick={() => closeJob(job.id)}
                    style={{
                      padding: '6px 14px',
                      background: 'none',
                      border: '1.5px solid #EDE0E0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      color: '#64748B',
                    }}
                  >
                    終了する
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}