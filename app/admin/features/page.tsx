'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Feature = {
  id: string
  title: string
  subtitle: string
  content: string
  image_url: string
  published: boolean
  facility_id: string
  facilities?: { facility_name: string }
}

const C = { primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0', bg: '#FBF7F7', card: '#FFFFFF', border: '#EDE0E0', sub: '#64748B' }

export default function AdminFeaturesPage() {
  const router = useRouter()
  const [features, setFeatures] = useState<Feature[]>([])
  const [facilities, setFacilities] = useState<{ id: string; facility_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [editModal, setEditModal] = useState<Feature | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState({ title: '', subtitle: '', content: '', image_url: '', facility_id: '', published: false, line_catch: '', linked_job_ids: [] as string[], linked_regular_job_ids: [] as string[] })
  const [facilityJobs, setFacilityJobs] = useState<any[]>([])
  const [facilityRegularJobs, setFacilityRegularJobs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') { router.push('/admin'); return }
    fetchAll()
  }, [])

  const fetchAll = async () => {
    const { data: f } = await supabase.from('features').select('*').order('created_at', { ascending: false })
    const { data: fac } = await supabase.from('facilities').select('id, facility_name')
    if (f && fac) {
      const fMap: Record<string, string> = {}
      fac.forEach((x: any) => { fMap[x.id] = x.facility_name })
      setFeatures(f.map((x: any) => ({ ...x, facilities: { facility_name: fMap[x.facility_id] ?? '' } })))
    } else if (f) {
      setFeatures(f)
    }
    if (fac) setFacilities(fac)
    setLoading(false)
  }

  const openNew = () => {
    setIsNew(true)
    setForm({ title: '', subtitle: '', content: '', image_url: '', facility_id: facilities[0]?.id ?? '', published: false, line_catch: '', linked_job_ids: [], linked_regular_job_ids: [] })
    setEditModal({} as Feature)
  }

  useEffect(() => {
    const loadJobs = async () => {
      if (!form.facility_id) { setFacilityJobs([]); setFacilityRegularJobs([]); return }
      const { data: jobs } = await supabase.from('jobs').select('id, work_date, time_from, time_to, wage_amount').eq('facility_id', form.facility_id).eq('status', 'open').order('work_date')
      const { data: rJobs } = await supabase.from('regular_jobs').select('id, title, salary_type, salary_amount').eq('facility_id', form.facility_id).eq('status', 'open')
      setFacilityJobs(jobs ?? [])
      setFacilityRegularJobs(rJobs ?? [])
    }
    if (editModal) loadJobs()
  }, [form.facility_id, editModal])

  const openEdit = (f: Feature) => {
    setIsNew(false)
    setForm({ title: f.title, subtitle: f.subtitle ?? '', content: f.content ?? '', image_url: f.image_url ?? '', facility_id: f.facility_id, published: f.published, line_catch: (f as any).line_catch ?? '', linked_job_ids: (f as any).linked_job_ids ?? [], linked_regular_job_ids: (f as any).linked_regular_job_ids ?? [] })
    setEditModal(f)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('features').upload(fileName, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('features').getPublicUrl(fileName)
      setForm(f => ({ ...f, image_url: data.publicUrl }))
    }
    setUploading(false)
  }

  const save = async () => {
    setSaving(true)
    if (isNew) {
      await supabase.from('features').insert({ ...form })
    } else {
      await supabase.from('features').update({ ...form }).eq('id', editModal!.id)
    }
    setSaving(false)
    setEditModal(null)
    fetchAll()
  }

  const deleteFeature = async (id: string) => {
    if (!confirm('この特集を削除しますか？')) return
    await supabase.from('features').delete().eq('id', id)
    fetchAll()
  }

  const togglePublish = async (f: Feature) => {
    const newPublished = !f.published
    await supabase.from('features').update({ published: newPublished }).eq('id', f.id)

    if (newPublished) {
      const { data: facilityData } = await supabase.from('facilities').select('facility_name, facility_type').eq('id', f.facility_id).single()
      const catchCopy = (f as any).line_catch
      await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `🌸 沖縄の施設特集、公開しました

📰 ${f.title}

${catchCopy ? `「${catchCopy}...」

この続きは特集ページで👇` : '詳しくはこちら👇'}
https://irodori0305.jp/features/${f.id}`,
        }),
      })
    }

    fetchAll()
  }

  const inp = { width: '100%', padding: '10px 12px', border: '1.5px solid #EDE0E0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' as const }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>施設特集管理</h1>
        <button onClick={openNew} style={{ padding: '10px 20px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          + 新規特集を作成
        </button>
      </div>

      {editModal !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{isNew ? '新規特集を作成' : '特集を編集'}</h2>
              <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>x</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>施設</label>
              <select value={form.facility_id} onChange={e => setForm(f => ({ ...f, facility_id: e.target.value }))} style={inp}>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.facility_name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>タイトル</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} placeholder='例：〇〇クリニックで働く魅力' />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>サブタイトル</label>
              <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} style={inp} placeholder='一言コメント' />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>本文</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                style={{ ...inp, height: '200px', resize: 'vertical' }} placeholder='施設の紹介文、職場環境、スタッフの声など...' />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 6 }}>画像アップロード</label>
              <input type='file' accept='image/*' onChange={handleImageUpload} style={{ marginBottom: 8 }} />
              {uploading && <div style={{ fontSize: 13, color: C.sub }}>アップロード中...</div>}
              {form.image_url && <img src={form.image_url} alt='preview' style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />}
            </div>

            <div style={{ marginBottom: 24 }}>
                            <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 6 }}>LINE用キャッチコピー（公開時の通知に使われます）</label>
                <textarea value={form.line_catch} onChange={e => setForm(f => ({ ...f, line_catch: e.target.value }))} placeholder='例：有給消化率90%!スタッフの声から見えた、この施設が選ばれる理由とは' style={{ width: '100%', height: 60, padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>💡 続きが読みたくなる一文を書くとクリック率が上がります</div>
              </div>

              <div style={{ marginBottom: 14, background: '#FDF0F0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#C45A5A', marginBottom: 8 }}>🔗 リンクする求人（任意・後から追加もOK）</div>
                {facilityRegularJobs.length === 0 && facilityJobs.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>この施設の公開中求人はありません</div>
                )}
                {facilityRegularJobs.map(j => (
                  <label key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fff', border: `1px solid ${form.linked_regular_job_ids.includes(j.id) ? '#E07070' : '#EDE0E0'}`, borderRadius: 8, marginBottom: 6, cursor: 'pointer', fontSize: 12 }}>
                    <input type='checkbox' checked={form.linked_regular_job_ids.includes(j.id)} onChange={e => {
                      setForm(f => ({ ...f, linked_regular_job_ids: e.target.checked ? [...f.linked_regular_job_ids, j.id] : f.linked_regular_job_ids.filter(x => x !== j.id) }))
                    }} style={{ accentColor: '#E07070' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>【{'常勤・パート'}】{j.title}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{j.salary_type} ¥{j.salary_amount?.toLocaleString()}</div>
                    </div>
                  </label>
                ))}
                {facilityJobs.map(j => (
                  <label key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#fff', border: `1px solid ${form.linked_job_ids.includes(j.id) ? '#E07070' : '#EDE0E0'}`, borderRadius: 8, marginBottom: 6, cursor: 'pointer', fontSize: 12 }}>
                    <input type='checkbox' checked={form.linked_job_ids.includes(j.id)} onChange={e => {
                      setForm(f => ({ ...f, linked_job_ids: e.target.checked ? [...f.linked_job_ids, j.id] : f.linked_job_ids.filter(x => x !== j.id) }))
                    }} style={{ accentColor: '#E07070' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>【単発】{j.work_date} {j.time_from}〜{j.time_to}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>日給 ¥{j.wage_amount?.toLocaleString()}</div>
                    </div>
                  </label>
                ))}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type='checkbox' checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>公開する</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: 10, background: 'none', border: '1.5px solid #EDE0E0', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: C.sub }}>キャンセル</button>
              <button onClick={save} disabled={saving || !form.title} style={{ flex: 2, padding: 10, background: saving || !form.title ? '#ccc' : C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.sub }}>読み込み中...</div>
      ) : features.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: C.card, borderRadius: 12, border: '1px solid #EDE0E0', color: C.sub }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
          <div style={{ fontWeight: 600 }}>特集がありません。新規作成してください。</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {features.map(f => (
            <div key={f.id} style={{ background: C.card, borderRadius: 12, border: '1px solid #EDE0E0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {f.image_url && <img src={f.image_url} alt={f.title} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: C.sub }}>{f.facilities?.facility_name}</div>
              </div>
              <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: f.published ? '#D1FAE5' : '#F1F5F9', color: f.published ? '#065F46' : C.sub }}>
                {f.published ? '公開中' : '非公開'}
              </span>
              <button onClick={() => togglePublish(f)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #EDE0E0', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: C.sub }}>
                {f.published ? '非公開にする' : '公開する'}
              </button>
              <button onClick={() => openEdit(f)} style={{ padding: '6px 12px', background: '#EFF6FF', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#1D4ED8', fontWeight: 600 }}>編集</button>
              <button onClick={() => deleteFeature(f.id)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#ef4444' }}>削除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
