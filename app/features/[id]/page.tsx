'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

type Feature = {
  id: string
  title: string
  subtitle: string
  content: string
  image_url: string
  facility_id: string
  facilities?: { facility_name: string; facility_type: string; address: string }
}

const C = { primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0', bg: '#FBF7F7', card: '#FFFFFF', border: '#EDE0E0', sub: '#64748B' }

export default function FeatureDetailPage() {
  const { id } = useParams()
  const [feature, setFeature] = useState<Feature | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeature = async () => {
      const { data } = await supabase
        .from('features')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        const { data: fac } = await supabase.from('facilities').select('facility_name, facility_type, address').eq('id', data.facility_id).maybeSingle()
        setFeature({ ...data, facilities: fac ?? null })
      }
      setLoading(false)
    }
    fetchFeature()
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>読み込み中...</div>
  if (!feature) return <div style={{ textAlign: 'center', padding: 60 }}>特集が見つかりません</div>

  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        <Link href='/features' style={{ color: C.sub, fontSize: 13, textDecoration: 'none', display: 'block', marginBottom: 20 }}>← 特集一覧に戻る</Link>

        {feature.image_url && (
          <img src={feature.image_url} alt={feature.title} style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 16, marginBottom: 24 }} />
        )}

        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: '32px' }}>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 8 }}>
            🏥 {feature.facilities?.facility_name} · {feature.facilities?.facility_type}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>{feature.title}</h1>
          {feature.subtitle && (
            <p style={{ fontSize: 16, color: C.sub, marginBottom: 24, lineHeight: 1.7 }}>{feature.subtitle}</p>
          )}
          <hr style={{ border: 'none', borderTop: `1px solid ${C.border}`, marginBottom: 24 }} />
          <div style={{ fontSize: 15, lineHeight: 1.9, color: '#1A2235', whiteSpace: 'pre-wrap' }}>{feature.content}</div>

          {feature.facilities?.address && (
            <div style={{ background: C.light, borderRadius: 10, padding: 16, marginTop: 32, fontSize: 13, color: C.dark }}>
              📍 {feature.facilities.address}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
