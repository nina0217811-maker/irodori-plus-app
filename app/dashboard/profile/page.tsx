'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FEATURES = [
  '👥 チームワーク重視', '🌱 未経験OK', '📅 シフト自由',
  '🚗 車通勤OK', '👶 育休実績あり', '🏠 訪問看護',
  '💊 医療処置あり', '🌙 夜勤あり', '☀️ 日勤のみ',
  '💰 給与UP制度', '📚 研修充実', '🤝 引き抜きOK',
]

const FACILITY_TYPES = ['病院', 'クリニック', '介護老人保健施設', '訪問看護', 'デイサービス', '訪問入浴', 'グループホーム', '特別養護老人ホーム', '有料老人ホーム', '障害者施設', '保育園', 'その他']

export default function FacilityProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    facility_name: '',
    facility_type: '',
    address: '',
    phone: '',
    description: '',
    features: [] as string[],
    staff_count: '',
    established_year: '',
    instagram_url: '',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('facilities')
        .select('facility_name, facility_type, address, phone, description, features, staff_count, established_year, instagram_url, photos')
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({
          facility_name: data.facility_name ?? '',
          facility_type: data.facility_type ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          description: data.description ?? '',
          features: data.features ?? [],
          staff_count: data.staff_count ?? '',
          established_year: data.established_year ?? '',
          instagram_url: data.instagram_url ?? '',
        })
        setPhotos(data.photos ?? [])
      }
      setLoading(false)
    }
    init()
  }, [])

  const toggleFeature = (f: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter(x => x !== f)
        : [...prev.features, f]
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    const newPhotos: string[] = []
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('facility-photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('facility-photos').getPublicUrl(path)
        newPhotos.push(data.publicUrl)
      }
    }
    setPhotos(prev => [...prev, ...newPhotos])
    setUploading(false)
  }

  const handleDeletePhoto = (url: string) => {
    setPhotos(prev => prev.filter(p => p !== url))
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('facilities').update({
      facility_name: form.facility_name,
      facility_type: form.facility_type,
      address: form.address,
      phone: form.phone,
      description: form.description,
      features: form.features,
      staff_count: form.staff_count,
      established_year: form.established_year,
      instagram_url: form.instagram_url,
      photos: photos,
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0',
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
    background: '#fff', fontFamily: 'inherit',
  }

  const completionItems = [
    form.facility_name, form.facility_type, form.address,
    form.phone, form.description, form.features.length > 0 ? 'ok' : '',
  ]
  const completion = Math.round(completionItems.filter(Boolean).length / completionItems.length * 100)

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>読み込み中...</div>

  return (
    <div style={{ background: '#FBF7F7', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: 60 }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px' }}>

        {/* ヘッダー */}
        <div style={{ background: 'linear-gradient(135deg, #E07070, #C45A5A)', borderRadius: 16, padding: '20px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏥</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>施設プロフィールを作ろう</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>看護師があなたの施設を知るための大切なページです</div>
        </div>

        {/* 完成度 */}
        <div style={{ background: '#fff', border: '0.5px solid #EDE0E0', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', marginBottom: 8 }}>
            <span>プロフィール完成度</span>
            <span style={{ color: '#E07070', fontWeight: 700 }}>{completion}%</span>
          </div>
          <div style={{ height: 6, background: '#EDE0E0', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${completion}%`, height: '100%', background: 'linear-gradient(90deg, #E07070, #C45A5A)', borderRadius: 99, transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* 基本情報 */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 14, border: '0.5px solid #EDE0E0' }}>
          <div style={{ background: 'linear-gradient(135deg, #FDF0F0, #FBF7F7)', padding: '12px 16px', borderBottom: '0.5px solid #EDE0E0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>基本情報</span>
            <span style={{ fontSize: 10, color: '#E07070', background: '#FDF0F0', border: '0.5px solid #EDE0E0', padding: '2px 8px', borderRadius: 99, marginLeft: 'auto' }}>必須</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>施設名 *</label>
              <input value={form.facility_name} onChange={e => setForm(p => ({ ...p, facility_name: e.target.value }))} style={inp} placeholder="訪問看護ステーションはな" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>施設種別 *</label>
              <select value={form.facility_type} onChange={e => setForm(p => ({ ...p, facility_type: e.target.value }))} style={{ ...inp, background: '#fff' }}>
                <option value="">選択してください</option>
                {FACILITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>所在地 *</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} style={inp} placeholder="沖縄県那覇市〇〇 1-2-3" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>電話番号</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inp} placeholder="098-XXX-XXXX" />
            </div>
          </div>
        </div>

        {/* 施設の特徴 */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 14, border: '0.5px solid #EDE0E0' }}>
          <div style={{ background: 'linear-gradient(135deg, #EDE9FB, #F5F3FF)', padding: '12px 16px', borderBottom: '0.5px solid #EDE0E0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>施設の特徴・雰囲気</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>施設紹介（看護師へのメッセージ）</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={{ ...inp, height: 100, resize: 'vertical' as const }}
                placeholder="私たちのチームについて、働く環境、大切にしていることを教えてください。"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>施設の特徴（複数選択可）</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FEATURES.map(f => (
                  <button
                    key={f}
                    onClick={() => toggleFeature(f)}
                    style={{
                      padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                      background: form.features.includes(f) ? '#FDF0F0' : '#F1F5F9',
                      color: form.features.includes(f) ? '#E07070' : '#64748B',
                      border: `1.5px solid ${form.features.includes(f) ? '#E07070' : 'transparent'}`,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >{f}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 職場情報 */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '0.5px solid #EDE0E0' }}>
          <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', padding: '12px 16px', borderBottom: '0.5px solid #EDE0E0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>👩‍⚕️</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>職場情報</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>職員数</label>
                <input value={form.staff_count} onChange={e => setForm(p => ({ ...p, staff_count: e.target.value }))} style={inp} placeholder="例：10名" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>設立年</label>
                <input value={form.established_year} onChange={e => setForm(p => ({ ...p, established_year: e.target.value }))} style={inp} placeholder="例：2020年" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>Instagram URL（任意）</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #EDE0E0', borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ padding: '10px 12px', background: '#F1F5F9', fontSize: 16, borderRight: '1px solid #EDE0E0' }}>📸</span>
                <input value={form.instagram_url} onChange={e => setForm(p => ({ ...p, instagram_url: e.target.value }))} style={{ ...inp, border: 'none', borderRadius: 0 }} placeholder="https://instagram.com/..." />
              </div>
            </div>
          </div>
        </div>

        {/* 写真 */}
        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '0.5px solid #EDE0E0' }}>
          <div style={{ background: 'linear-gradient(135deg, #FEF9C3, #FEF3C7)', padding: '12px 16px', borderBottom: '0.5px solid #EDE0E0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📸</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>施設の写真</span>
          </div>
          <div style={{ padding: 16 }}>
            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                {photos.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt={`施設写真${i+1}`} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8 }} />
                    <button onClick={() => handleDeletePhoto(url)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ display: 'block', border: '2px dashed #EDE0E0', borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <div style={{ fontSize: 28, marginBottom: 6 }}>📷</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1A2235', marginBottom: 2 }}>{uploading ? 'アップロード中...' : '写真をアップロード'}</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>複数選択可。施設の外観・内観・スタッフ写真など</div>
            </label>
          </div>
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', padding: 14, background: saving ? '#ccc' : saved ? '#6BAF92' : '#E07070', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 10 }}
        >
          {saving ? '保存中...' : saved ? '✅ 保存しました！' : '🏥 プロフィールを保存する'}
        </button>

        <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: 12, background: 'none', border: '1px solid #EDE0E0', borderRadius: 12, fontSize: 14, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>
          ← ダッシュボードに戻る
        </button>

      </div>
    </div>
  )
}
