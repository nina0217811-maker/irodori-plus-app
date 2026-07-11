'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Feature = {
  id: string
  title: string
  subtitle: string
  content: string
  image_url: string
  published: boolean
  created_at: string
  facilities?: { facility_name: string; facility_type: string }
  facility_id: string
}

const C = { primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0', bg: '#FBF7F7', card: '#FFFFFF', border: '#EDE0E0', sub: '#64748B' }

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatures = async () => {
      const { data } = await supabase
        .from('features')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
      if (data && data.length > 0) {
        const facilityIds = [...new Set(data.map((f: any) => f.facility_id))]
        const { data: facs } = await supabase.from('facilities').select('id, facility_name, facility_type').in('id', facilityIds)
        const fMap: Record<string, any> = {}
        facs?.forEach((x: any) => { fMap[x.id] = x })
        setFeatures(data.map((f: any) => ({ ...f, facilities: fMap[f.facility_id] ?? null })))
      }
      setLoading(false)
    }
    fetchFeatures()
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>施設特集</h1>
          <p style={{ color: C.sub, fontSize: 14 }}>沖縄の医療・介護施設をご紹介します</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.sub }}>読み込み中...</div>
        ) : features.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, color: C.sub }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
            <div style={{ fontWeight: 600 }}>現在公開中の特集はありません</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {features.map(f => (
              <Link key={f.id} href={`/features/${f.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden', cursor: 'pointer' }}>
                  {f.image_url ? (
                    <img src={f.image_url} alt={f.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 180, background: 'linear-gradient(135deg, #E07070, #C0727A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏥</div>
                  )}
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>{f.facilities?.facility_name} · {f.facilities?.facility_type}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#1A2235' }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{f.subtitle}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
