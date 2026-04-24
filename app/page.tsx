import Link from 'next/link'

export default function HomePage() {
  const stats = [
    { n: '2,400+', l: '登録看護師' },
    { n: '380+', l: '掲載施設' },
    { n: '98%', l: 'マッチング満足度' },
    { n: '¥0', l: '看護師の利用料' },
  ]

  const steps = [
    { n: '01', icon: '📝', t: '無料登録', d: 'スキル・希望条件を入力。5分で完了。' },
    { n: '02', icon: '🔍', t: '求人を検索', d: 'エリア・日付・施設種別で絞り込み。' },
    { n: '03', icon: '📨', t: 'ワンクリック応募', d: '気になる求人に即応募。施設から連絡が来ます。' },
    { n: '04', icon: '💰', t: '勤務・受取', d: '当日勤務後、翌週振込。手数料ゼロ。' },
  ]

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#1A2235' }}>

      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, #6B2D2D 0%, #C45A5A 55%, #C0727A 100%)',
        padding: '80px 20px 100px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <span style={{
          background: '#F59E0B', color: '#fff',
          padding: '4px 14px', borderRadius: '20px',
          fontSize: '13px', fontWeight: '700',
        }}>
          完全無料 × 手数料なし
        </span>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 52px)',
          fontWeight: '700',
          marginTop: '20px',
          marginBottom: '16px',
          lineHeight: '1.25',
          letterSpacing: '-1px',
        }}>
          看護師と施設をつなぐ<br />単発マッチング
        </h1>
        <p style={{
          fontSize: '18px',
          opacity: 0.85,
          maxWidth: '500px',
          margin: '0 auto 36px',
          lineHeight: '1.7',
        }}>
          「今日だけ働きたい」「今すぐ人手が欲しい」<br />
          双方の悩みをシンプルに解決します。
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register">
            <button style={{
              padding: '14px 28px',
              background: '#fff',
              color: '#C45A5A',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}>
              👩‍⚕️ 看護師として登録
            </button>
          </Link>
          <Link href="/register">
            <button style={{
              padding: '14px 28px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.4)',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
            }}>
              🏥 施設として掲載
            </button>
          </Link>
        </div>

        {/* 統計 */}
        <div style={{
          display: 'flex',
          gap: '32px',
          justifyContent: 'center',
          marginTop: '56px',
          flexWrap: 'wrap',
        }}>
          {stats.map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', letterSpacing: '-1px' }}>{s.n}</div>
              <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STEPS */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '700', marginBottom: '52px', letterSpacing: '-0.5px' }}>
          かんたん4ステップ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          {steps.map(s => (
            <div key={s.n} style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#C45A5A', marginBottom: '6px', letterSpacing: '1px' }}>{s.n}</div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{s.t}</div>
              <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FOR FACILITY */}
      <div style={{ background: '#6B2D2D', color: '#fff', padding: '60px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            background: '#F59E0B', color: '#fff',
            padding: '4px 14px', borderRadius: '20px',
            fontSize: '13px', fontWeight: '700',
          }}>
            施設・病院の方へ
          </span>
          <h2 style={{ fontSize: '26px', fontWeight: '700', margin: '16px 0 12px' }}>
            月額¥10,000で掲載し放題
          </h2>
          <p style={{ opacity: 0.8, lineHeight: '1.7', marginBottom: '28px' }}>
            マッチング手数料は一切かかりません。<br />
            求人投稿数・応募数も無制限。まずは1ヶ月お試しください。
          </p>
          <Link href="/register">
            <button style={{
              padding: '14px 32px',
              background: '#F59E0B',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
            }}>
              施設プランを見る
            </button>
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '16px' }}>
          今すぐ始めましょう
        </h2>
        <p style={{ color: '#64748B', lineHeight: '1.7', marginBottom: '28px' }}>
          登録は無料・5分で完了。今日から単発勤務を探せます。
        </p>
        <Link href="/register">
          <button style={{
            padding: '16px 48px',
            background: '#E07070',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(224,112,112,0.4)',
          }}>
            無料で登録する
          </button>
        </Link>
        <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748B' }}>
          クレジットカード不要 · いつでも退会可能
        </div>
      </div>

    </div>
  )
}