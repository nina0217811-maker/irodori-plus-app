import Link from 'next/link'

export default function HomePage() {
  const stats = [
    { n: '110名以上', l: '登録看護師' },
    { n: '¥0', l: '看護師の利用料' },
    { n: '沖縄発', l: '看護師が作ったサービス' },
  ]

  const steps = [
    { n: '01', icon: '📝', t: '無料登録', d: 'スキル・希望条件を入力。5分で完了。' },
    { n: '02', icon: '🔍', t: '求人を検索', d: 'エリア・日付・施設種別で絞り込み。' },
    { n: '03', icon: '📨', t: 'ワンクリック応募', d: '気になる求人に即応募。施設から連絡が来ます。' },
  ]

  const voices = [
    { text: '子どもが小さいので週1〜2日だけ働きたかった。irodori+なら無理なく続けられています。', name: '30代・訪問看護経験者' },
    { text: '急な欠員が出たとき、すぐに対応できる看護師さんが見つかって本当に助かりました。', name: '介護老人保健施設・担当者' },
    { text: '復職が怖かったけど、単発から始めたら自信が戻ってきました。', name: '40代・ブランク明け看護師' },
  ]

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#1A2235' }}>
      <div style={{
        background: 'linear-gradient(135deg, #FECDD3 0%, #E9D5FF 50%, #BFDBFE 100%)',
        padding: '80px 20px 100px',
        textAlign: 'center',
        color: '#3B2D6B',
      }}>
        <span style={{
          background: 'rgba(255,255,255,0.2)', color: "#3B2D6B",
          padding: '4px 14px', borderRadius: '20px',
          fontSize: '13px', fontWeight: '700',
          border: '1px solid rgba(255,255,255,0.3)',
        }}>
          看護師が作った、看護師のためのサービス
        </span>
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: '700',
          marginTop: '20px', marginBottom: '16px',
          lineHeight: '1.25', letterSpacing: '-1px',
        }}>
          看護師の経験が、<br />誰かの毎日を支える。
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9, maxWidth: '520px', margin: '0 auto 36px', lineHeight: '1.8' }}>
          忙しい施設に、力を貸したい看護師がいる。<br />
          irodori+は、そのつながりをつくります。
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register">
            <button style={{ padding: '14px 28px', background: '#fff', color: '#C45A5A', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              👩‍⚕️ 看護師として登録
            </button>
          </Link>
          <Link href="/register">
            <button style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
              🏥 施設として掲載
            </button>
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', marginTop: '56px', flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-1px' }}>{s.n}</div>
              <div style={{ fontSize: '13px', opacity: 0.75, marginTop: '4px' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#FBF7F7', padding: '72px 20px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#C45A5A', letterSpacing: '1px', display: 'block', marginBottom: '16px' }}>OUR STORY</span>
          <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px', lineHeight: '1.6' }}>
            現場を知る看護師が、<br />現場のために作りました。
          </h2>
          <p style={{ color: '#64748B', lineHeight: '1.9', fontSize: '15px' }}>
            「もっと自由に働きたい」「でも施設には迷惑をかけたくない」<br />
            そんなジレンマを抱えた看護師が、自分たちのために作ったのがirodori+です。<br /><br />
            単発OK・好きな時だけ・手数料ゼロ。<br />
            看護師の経験と誇りを、もっと活かせる場所をつくりたい。<br />
            その想いから、沖縄でスタートしました。
          </p>
        </div>
      </div>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '26px', fontWeight: '700', marginBottom: '52px' }}>かんたん4ステップ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
          {steps.map(s => (
            <div key={s.n} style={{ textAlign: 'center', padding: '28px 20px', background: '#fff', borderRadius: '16px', border: '1px solid #EDE0E0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>{s.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#C45A5A', marginBottom: '6px', letterSpacing: '1px' }}>{s.n}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{s.t}</div>
              <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#FBF7F7', padding: '72px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '26px', fontWeight: '700', marginBottom: '40px' }}>使っている方の声</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {voices.map((v, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #EDE0E0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px', color: '#C45A5A' }}>❝</div>
                <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#374151', marginBottom: '16px' }}>{v.text}</p>
                <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600' }}>{v.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ background: '#6B2D2D', color: '#fff', padding: '60px 20px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.3)' }}>施設・病院の方へ</span>
          <h2 style={{ fontSize: '26px', fontWeight: '700', margin: '16px 0 12px' }}>月額¥10,000で掲載し放題</h2>
          <p style={{ opacity: 0.85, lineHeight: '1.8', marginBottom: '28px', fontSize: '15px' }}>
            マッチング手数料は一切かかりません。<br />求人投稿数・応募数も無制限。まずは1ヶ月お試しください。
          </p>
          <Link href="/register">
            <button style={{ padding: '14px 32px', background: '#fff', color: '#C45A5A', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>施設プランを見る</button>
          </Link>
        </div>
      </div>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '16px' }}>今日から、一緒に始めましょう。</h2>
        <p style={{ color: '#64748B', lineHeight: '1.8', marginBottom: '28px', fontSize: '15px' }}>
          登録は無料・5分で完了。<br />あなたのペースで、看護を続けよう。
        </p>
        <Link href="/register">
          <button style={{ padding: '16px 48px', background: '#E07070', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(224,112,112,0.4)' }}>無料で登録する</button>
        </Link>
        <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748B' }}>クレジットカード不要 · いつでも退会可能</div>
      </div>
    </div>
  )
}
