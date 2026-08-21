import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function HomePage() {
  // 新着単発求人（最新4件）
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, work_date, time_from, time_to, wage_amount, wage_type, facility_type, facility_id, is_urgent, hire_flow, address')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(4)

  // 新着正社員・パート（最新2件）
  const { data: regularJobs } = await supabase
    .from('regular_jobs')
    .select('id, title, employment_type, salary_amount, salary_type, location, facility_id, hire_flow')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(2)

  // 施設名取得
  const facilityIds = [...new Set([
    ...(jobs ?? []).map((j: any) => j.facility_id),
    ...(regularJobs ?? []).map((j: any) => j.facility_id),
  ].filter(Boolean))]

  const { data: facilities } = facilityIds.length > 0
    ? await supabase.from('facilities').select('id, facility_name').in('id', facilityIds)
    : { data: [] }

  const facilityMap: Record<string, string> = {}
  facilities?.forEach((f: any) => { facilityMap[f.id] = f.facility_name })

  return (
    <div style={{ fontFamily: "'Noto Sans JP', sans-serif", color: '#1A2235', background: '#FAFAFA' }}>

      {/* ===== HERO ===== */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, #E0F7FA 0%, #FDF0F0 55%, #FBF7F0 100%)', padding: '32px 16px 0' }}>

        {/* 波パターン */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 40\'%3E%3Cpath d=\'M0,20 C200,40 400,0 600,20 C800,40 1000,0 1200,20 L1200,40 L0,40 Z\' fill=\'%23FAFAFA\'/%3E%3C/svg%3E") no-repeat bottom', backgroundSize: 'cover', zIndex: 2 }} />

        {/* タグ */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #0096A0', color: '#0096A0', borderRadius: 99, padding: '4px 12px', fontSize: 11, fontWeight: 600, marginBottom: 16 }}>
          🌺 沖縄の看護師求人プラットフォーム
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.45, marginBottom: 8 }}>
              <span style={{ color: '#0096A0' }}>沖縄</span>で働く<br />
              看護師のための<br />
              求人サイト <span style={{ color: '#E07070' }}>irodori+</span>
            </h1>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.8, marginBottom: 6 }}>
              単発バイトから正社員転職まで。<br />
              現役看護師が作った、看護師目線のプラットフォーム。
            </p>
            <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 15, color: '#0096A0', letterSpacing: '0.02em' }}>
              — 看護師の経験が、<br />誰かの毎日を支える —
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Image
              src="/nurse-hero.jpg"
              alt="訪問看護師"
              width={140}
              height={180}
              style={{ borderRadius: '16px 16px 0 0', objectFit: 'cover', objectPosition: 'center top', display: 'block', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            />
          </div>
        </div>

        {/* エリア選択 */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, position: 'relative', zIndex: 1 }}>
          {['📍 那覇市', '浦添市', '宜野湾市', '沖縄市', '名護市', '🏝️ 離島'].map((area, i) => (
            <Link key={area} href="/jobs" style={{
              background: i === 0 ? '#0096A0' : '#fff',
              color: i === 0 ? '#fff' : '#0096A0',
              border: '1px solid #0096A0',
              borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 500,
              textDecoration: 'none', whiteSpace: 'nowrap'
            }}>{area}</Link>
          ))}
        </div>

        {/* 検索ボタン2つ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 0, position: 'relative', zIndex: 1 }}>
          <Link href="/jobs" style={{ background: '#0096A0', color: '#fff', borderRadius: 12, padding: '13px 8px', fontSize: 13, fontWeight: 700, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            🔍 単発求人を探す
          </Link>
          <Link href="/regular-jobs" style={{ background: '#E07070', color: '#fff', borderRadius: 12, padding: '13px 8px', fontSize: 13, fontWeight: 700, textAlign: 'center', textDecoration: 'none', display: 'block' }}>
            💼 正社員・パート
          </Link>
        </div>

        {/* 統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 16, paddingBottom: 48, position: 'relative', zIndex: 1 }}>
          {[
            { num: '260名+', label: '登録看護師' },
            { num: '¥0', label: '紹介手数料' },
            { num: '全島', label: '沖縄全域対応' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '12px 8px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#E07070' }}>{s.num}</div>
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== エリアから探す ===== */}
      <div style={{ background: '#E0F7FA', padding: '24px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>🗺️ エリアから探す</div>
        <div style={{ fontSize: 12, color: '#0096A0', marginBottom: 14 }}>沖縄県内の全市町村に対応</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[
            { icon: '🏙️', name: '那覇・南部', sub: '糸満・豊見城' },
            { icon: '🌆', name: '中部', sub: '宜野湾・沖縄市' },
            { icon: '🌿', name: '北部', sub: '名護・恩納' },
            { icon: '🏝️', name: '離島', sub: '石垣・宮古' },
            { icon: '🚗', name: '車通勤OK', sub: '駐車場あり' },
            { icon: '🌊', name: 'すべて', sub: '全域を見る' },
          ].map(area => (
            <Link key={area.name} href="/jobs" style={{ background: '#fff', border: '1px solid rgba(0,150,160,0.2)', borderRadius: 10, padding: '12px 8px', textAlign: 'center', textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{area.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0096A0' }}>{area.name}</div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>{area.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== 新着求人 ===== */}
      <div style={{ padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>🆕 新着求人</div>
          <Link href="/jobs" style={{ fontSize: 12, color: '#E07070', textDecoration: 'none' }}>もっと見る →</Link>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3, marginBottom: 14 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: '#fff', color: '#E07070', fontSize: 13, fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>単発バイト</div>
          <div style={{ flex: 1, textAlign: 'center', padding: '8px', color: '#64748B', fontSize: 13 }}>正社員・パート</div>
        </div>

        {/* こだわりタグ */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {['🌟 すべて', '⚡ 急募', '💼 訪問看護', '🏥 クリニック', '💰 高給与'].map((tag, i) => (
            <div key={tag} style={{ background: i === 0 ? '#FDF0F0' : '#fff', color: i === 0 ? '#E07070' : '#64748B', border: `1px solid ${i === 0 ? '#E07070' : '#EDE0E0'}`, borderRadius: 99, padding: '4px 12px', fontSize: 11, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer' }}>{tag}</div>
          ))}
        </div>

        {/* 求人カード */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(jobs ?? []).map((job: any) => (
            <Link key={job.id} href={`/jobs/${job.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #EDE0E0' }}>
                <div style={{ height: 6, background: 'linear-gradient(90deg, #0096A0, #E07070)' }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>{facilityMap[job.facility_id] ?? '施設'}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{job.facility_type ?? '看護師'} 単発バイト</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {job.is_urgent && <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>急募</span>}
                    {job.hire_flow === 'interview' && <span style={{ background: '#EDE9FB', color: '#3C3489', fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>💬 面談型</span>}
                    {job.address && <span style={{ background: '#E0F7FA', color: '#0096A0', fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>📍 {job.address}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>📅 {job.work_date}　⏰ {job.time_from}〜{job.time_to}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#E07070' }}>¥{job.wage_amount?.toLocaleString()} <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>{job.wage_type === 'hourly' ? '時給' : '日給'}</span></span>
                    <span style={{ background: '#E07070', color: '#fff', borderRadius: 99, padding: '6px 16px', fontSize: 12, fontWeight: 600 }}>応募する</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {(jobs ?? []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: 13 }}>
              現在募集中の単発求人はありません
            </div>
          )}
        </div>
      </div>

      {/* ===== 看護師写真セクション ===== */}
      <div style={{ position: 'relative', overflow: 'hidden', margin: '0 16px 24px', borderRadius: 16 }}>
        <Image
          src="/nurse-hero.jpg"
          alt="訪問看護の現場"
          width={400}
          height={240}
          style={{ width: '100%', height: 220, objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,34,53,0.85) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>看護師の経験が、誰かの毎日を支える。</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>現役看護師が作った、看護師のためのサービス</div>
        </div>
      </div>

      {/* ===== なぜirodori+ ===== */}
      <div style={{ background: '#FBF7F0', padding: '24px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>✨ irodori+が選ばれる理由</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>現役看護師が作った、看護師のためのサービス</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '👩‍⚕️', title: '現役看護師が運営', desc: '「看護師が作った、看護師のためのサービス」。現場の気持ちがわかるから、使いやすくて安心。', color: '#E07070' },
            { icon: '💰', title: '紹介手数料0円・登録無料', desc: '大手は年収の15〜35%。irodori+は紹介手数料ゼロ。看護師の登録・利用も完全無料。', color: '#0096A0' },
            { icon: '🌺', title: '沖縄特化だから地域に根ざせる', desc: 'うちなーんちゅの看護師が、地元の施設で長く働き続けられるマッチングを目指しています。', color: '#E07070' },
            { icon: '💬', title: 'チャットで直接やりとり', desc: '採用確定後は施設とアプリ内チャットで直接連絡。電話不要でスムーズ。', color: '#0096A0' },
          ].map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, borderLeft: `4px solid ${f.color}` }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 使い方 ===== */}
      <div style={{ padding: '24px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>📝 使い方はかんたん</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>登録から応募まで最短5分</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: '1', emoji: '📝', title: '無料で会員登録', desc: 'メールアドレスだけで30秒で完了' },
            { step: '2', emoji: '👤', title: 'プロフィール登録', desc: '資格・エリア・免許証を登録するとスカウトも届く' },
            { step: '3', emoji: '🔍', title: '求人を探して応募', desc: '単発・正社員どちらも1タップで応募' },
            { step: '4', emoji: '💬', title: '採用確定→チャットで確認', desc: '施設とチャットして勤務当日へ' },
          ].map((s, i) => (
            <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0', borderBottom: i < 3 ? '1px dashed #EDE0E0' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0096A0, #E07070)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{s.step}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{s.emoji} {s.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/register" style={{ display: 'block', textDecoration: 'none', marginTop: 20 }}>
          <div style={{ background: '#E07070', color: '#fff', textAlign: 'center', padding: 14, borderRadius: 12, fontSize: 15, fontWeight: 700 }}>
            👩‍⚕️ 無料で登録する
          </div>
        </Link>
      </div>

      {/* ===== 施設向け ===== */}
      <div style={{ background: '#1A2235', padding: '24px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>施設・病院の方へ</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>看護師採用をirodori+にお任せください</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {[
            { emoji: '💰', title: '紹介手数料0円', desc: '月額制だから採用人数が増えても追加費用なし' },
            { emoji: '⚡', title: '最短当日掲載', desc: '登録から求人公開まで最短10分' },
            { emoji: '💬', title: 'チャットで直接やりとり', desc: '採用後はアプリ内チャットでスムーズに連絡' },
          ].map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{f.emoji}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/for-facility" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff', textAlign: 'center', padding: 13, borderRadius: 12, fontSize: 14, fontWeight: 600 }}>
            🏥 施設向けページを見る
          </div>
        </Link>
      </div>

      {/* ===== FAQ ===== */}
      <div style={{ padding: '24px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>よくある質問</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#EDE0E0', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { q: '登録は無料ですか？', a: 'はい、看護師の登録・利用は完全無料です。紹介手数料もかかりません。' },
            { q: '単発と正社員の両方に応募できますか？', a: 'はい、どちらも同じアカウントで利用できます。' },
            { q: '沖縄県外の求人はありますか？', a: '現在は沖縄県内の求人のみ対応しています。' },
            { q: '資格なしでも登録できますか？', a: '看護師免許をお持ちの方が対象です（正看護師・准看護師）。' },
          ].map((faq, i) => (
            <div key={i} style={{ background: '#fff', padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5, color: '#E07070' }}>Q. {faq.q}</div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>A. {faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 最終CTA ===== */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0096A0 0%, #006070 50%, #1A2235 100%)', padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 80, opacity: 0.08 }}>🌺</div>
        <div style={{ position: 'absolute', bottom: -10, left: -10, fontSize: 80, opacity: 0.08 }}>🌊</div>
        <div style={{ fontStyle: 'italic', fontSize: 20, color: 'rgba(255,255,255,0.9)', marginBottom: 8, fontFamily: 'Georgia, serif' }}>
          めんそーれ、irodori+へ
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>さあ、はじめよう</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 24, lineHeight: 1.8 }}>
          看護師の経験が、誰かの毎日を支える。<br />登録は無料・30秒で完了します 🌺
        </div>
        <Link href="/register" style={{ display: 'block', textDecoration: 'none', marginBottom: 10 }}>
          <div style={{ background: '#fff', color: '#0096A0', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700 }}>
            👩‍⚕️ 無料で看護師登録する
          </div>
        </Link>
        <Link href="/for-facility" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: '#E07070', color: '#fff', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 600 }}>
            🏥 施設向けページを見る
          </div>
        </Link>
      </div>

    </div>
  )
}
