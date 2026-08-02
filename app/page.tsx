import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'sans-serif', color: '#1A2235' }}>

      {/* ファーストビュー */}
      <div style={{ background: '#FEF0F0', padding: '32px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
          <div style={{ width: '20px', height: '1px', background: '#E07070' }}></div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#E07070', letterSpacing: '0.5px' }}>登録看護師260名以上</div>
          <div style={{ width: '20px', height: '1px', background: '#E07070' }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '700', lineHeight: '1.35', letterSpacing: '-0.5px', color: '#1A2235' }}>
              単発バイトも、<br />正社員転職も。<br /><span style={{ color: '#E07070' }}>irodori+</span>で探そう
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.8', marginTop: '10px' }}>沖縄特化・登録無料・紹介手数料ゼロ。</div>
          </div>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 2px 12px rgba(224,112,112,0.2)' }}>
            <img src="/nurse1.jpg" alt="看護師" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          </div>
        </div>

        {/* 求人タイプ選択 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <Link href="/jobs" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#E07070', borderRadius: '12px', padding: '16px 14px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>🔍</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>単発求人を探す</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', marginTop: '3px' }}>今日から働ける</div>
            </div>
          </Link>
          <Link href="/regular-jobs" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px 14px', textAlign: 'center', cursor: 'pointer', border: '1px solid #EDE0E0' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>💼</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A2235' }}>正社員・パートを探す</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>転職サポートあり</div>
            </div>
          </Link>
        </div>

        {/* 比較表 */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', border: '1px solid #EDE0E0' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '10px' }}>求人タイプの違い</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: '6px', padding: '6px 0', borderBottom: '0.5px solid #F1F5F9' }}>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}></div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#E07070', textAlign: 'center' }}>単発</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#1A2235', textAlign: 'center' }}>正社員・パート</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: '6px', padding: '8px 0', borderBottom: '0.5px solid #F1F5F9' }}>
              <div style={{ fontSize: '12px', color: '#64748B' }}>働き方</div>
              <div style={{ fontSize: '12px', color: '#1A2235', textAlign: 'center' }}>1日〜OK</div>
              <div style={{ fontSize: '12px', color: '#1A2235', textAlign: 'center' }}>長期安定</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: '6px', padding: '8px 0', borderBottom: '0.5px solid #F1F5F9' }}>
              <div style={{ fontSize: '12px', color: '#64748B' }}>給与</div>
              <div style={{ fontSize: '12px', color: '#1A2235', textAlign: 'center' }}>日給（振込）</div>
              <div style={{ fontSize: '12px', color: '#1A2235', textAlign: 'center' }}>月給・時給</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: '6px', padding: '8px 0' }}>
              <div style={{ fontSize: '12px', color: '#64748B' }}>登録</div>
              <div style={{ fontSize: '12px', color: '#E07070', fontWeight: '700', textAlign: 'center' }}>無料</div>
              <div style={{ fontSize: '12px', color: '#E07070', fontWeight: '700', textAlign: 'center' }}>無料</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '20px' }}>
          {[
            { label: '紹介手数料', value: '¥0' },
            { label: '登録看護師', value: '260名+' },
            { label: '最短', value: '当日〜' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '16px', padding: '16px 10px', textAlign: 'center', border: '1px solid #F0E0E0' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#E07070' }}>{s.value}</div>
            </div>
          ))}
        </div>

        <Link href="/register" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: '#E07070', color: '#fff', textAlign: 'center', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>
            👩‍⚕️ 無料で看護師登録する
          </div>
        </Link>
        <div style={{ textAlign: 'center', fontSize: '11px', color: '#94A3B8', marginBottom: '4px' }}>登録は無料・30秒で完了します</div>

        {/* 施設向けリンク */}
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '0.5px solid #EDE0E0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>看護師を採用したい施設の方はこちら</div>
          <Link href="/for-facility" style={{ textDecoration: 'none' }}>
            <div style={{ border: '1px solid #EDE0E0', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              🏥 施設向けページを見る →
            </div>
          </Link>
        </div>
      </div>

      {/* 特徴 */}
      <div style={{ padding: '32px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>irodori+が選ばれる理由</div>
        <div style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginBottom: '24px' }}>現役看護師が運営しているから、現場のことがわかる</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { emoji: '🔖', title: '紹介手数料0円', desc: '採用が決まっても施設側からの手数料は一切かかりません。看護師の登録・利用も完全無料。' },
            { emoji: '📍', title: '沖縄特化', desc: '沖縄県内に絞ったマッチングだから、地域に根ざした求人が見つかります。' },
            { emoji: '💬', title: 'チャットで直接やりとり', desc: '採用確定後はアプリ内チャットで施設と直接連絡。電話不要でスムーズ。' },
            { emoji: '👩‍⚕️', title: '現役看護師が運営', desc: '看護師の目線で設計されているから、使いやすくて安心。' },
          ].map(f => (
            <div key={f.title} style={{ background: '#FBF7F7', borderRadius: '12px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'flex-start', border: '1px solid #F0E0E0' }}>
              <div style={{ fontSize: '28px', flexShrink: 0 }}>{f.emoji}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{f.title}</div>
                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.7' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 使い方 */}
      <div style={{ background: '#FEF0F0', padding: '32px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>使い方はかんたん</div>
        <div style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', marginBottom: '24px' }}>登録から応募まで最短5分</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { step: '1', emoji: '📝', title: '無料で会員登録', desc: 'メールアドレスだけで30秒で完了' },
            { step: '2', emoji: '👤', title: 'プロフィール登録', desc: '資格・エリア・免許証を登録するとスカウトも届く' },
            { step: '3', emoji: '🔍', title: '求人を探して応募', desc: '単発・正社員どちらも1タップで応募' },
            { step: '4', emoji: '💬', title: '採用確定→チャットで確認', desc: '施設とチャットして勤務当日へ' },
          ].map((s, i) => (
            <div key={s.step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '16px 0', borderBottom: i < 3 ? '1px dashed #EDE0E0' : 'none' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E07070', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{s.step}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{s.emoji}</span>{s.title}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.7' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/register" style={{ display: 'block', textDecoration: 'none', marginTop: '24px' }}>
          <div style={{ background: '#E07070', color: '#fff', textAlign: 'center', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>
            👩‍⚕️ 無料で登録する
          </div>
        </Link>
      </div>

      {/* 施設向けセクション */}
      <div style={{ padding: '32px 20px', background: '#1A2235' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', textAlign: 'center', color: '#fff' }}>施設・病院の方へ</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '24px' }}>看護師採用をirodori+にお任せください</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {[
            { emoji: '💰', title: '紹介手数料0円', desc: '月額制だから採用人数が増えても追加費用なし' },
            { emoji: '⚡', title: '最短当日掲載', desc: '登録から求人公開まで最短10分' },
            { emoji: '📱', title: 'LINE応募通知', desc: '応募が来たらLINEで即通知' },
          ].map(f => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '24px', flexShrink: 0 }}>{f.emoji}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '3px' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <Link href="/for-facility" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.3)', color: '#fff', textAlign: 'center', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}>
            🏥 施設向けページを見る
          </div>
        </Link>
      </div>

      {/* FAQ */}
      <div style={{ padding: '32px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>よくある質問</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#EDE0E0', borderRadius: '12px', overflow: 'hidden' }}>
          {[
            { q: '登録は無料ですか？', a: 'はい、看護師の登録・利用は完全無料です。紹介手数料もかかりません。' },
            { q: '単発と正社員の両方に応募できますか？', a: 'はい、どちらも同じアカウントで利用できます。単発で試してから正社員を検討することも可能です。' },
            { q: '沖縄県外の求人はありますか？', a: '現在は沖縄県内の求人のみ対応しています。' },
            { q: '資格なしでも登録できますか？', a: '看護師免許をお持ちの方が対象です（正看護師・准看護師）。' },
          ].map((faq, i) => (
            <div key={i} style={{ background: '#fff', padding: '16px 18px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px', color: '#E07070' }}>Q. {faq.q}</div>
              <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.7' }}>A. {faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 最終CTA */}
      <div style={{ background: '#E07070', padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>さあ、はじめよう</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '20px', lineHeight: '1.7' }}>登録は無料・30秒で完了します</div>
        <Link href="/register" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: '#fff', color: '#E07070', textAlign: 'center', padding: '14px', borderRadius: '12px', fontSize: '15px', fontWeight: '700' }}>
            👩‍⚕️ 無料で看護師登録する
          </div>
        </Link>
      </div>

    </div>
  )
}
