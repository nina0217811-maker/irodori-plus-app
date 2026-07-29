'use client'

const C = {
  primary: '#E07070', dark: '#C45A5A', light: '#FDF0F0',
  border: '#EDE0E0', sub: '#64748B', bg: '#FBF7F7', card: '#FFFFFF', text: '#1A2235',
}

export default function ForFacilityPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 20px 80px' }}>

        {/* ヒーロー */}
        <div style={{ padding: '48px 0 40px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: 'inline-block', background: C.light, color: C.dark, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>施設の方へ</span>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.5, marginBottom: 14 }}>
            働き方に、いろどりを。<br />
            <span style={{ color: C.primary }}>採用から定着まで</span>、一括支援。
          </div>
          <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.9, marginBottom: 28 }}>
            急な欠員も、採用コストも、定着しない悩みも。<br />
            沖縄の260名以上の看護師ネットワークで、一緒に解決しませんか。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            <button onClick={() => window.location.href = '/contact'} style={{ padding: '13px 28px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              無料で資料請求する
            </button>
            <button onClick={() => window.location.href = '/register'} style={{ padding: '13px 28px', background: '#fff', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              今すぐ登録して試す
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[['260名+', '登録看護師数'], ['沖縄全域', '対応エリア'], ['当日対応', '最短即日マッチング']].map(([v, l]) => (
              <div key={l} style={{ background: C.light, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>{v}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 代表メッセージ */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: 'inline-block', background: C.light, color: C.dark, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>代表メッセージ</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>なぜirodori+を作ったのか</div>
          <div style={{ borderLeft: `3px solid ${C.primary}`, paddingLeft: 16 }}>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 2, marginBottom: 12 }}>
              看護師として紹介会社経由で転職した経験があります。でも、どうしてもイメージと現実にギャップがある。「こんなはずじゃなかった」という気持ちが、現場への期待が重荷になることもありました。
            </p>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 2, marginBottom: 12 }}>
              受け入れる側も経験しました。時間をかけて育てた看護師が辞めてしまう。その度に現場の士気が下がり、残ったスタッフへの負担が増えていく。
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.dark, lineHeight: 2 }}>
              だからirodori+は、単発マッチングから始めて「この人と一緒に働きたい」と思える出会いを積み重ねる仕組みを作りました。ミスマッチのない採用、長く定着できる現場を目指しています。
            </p>
          </div>
          <p style={{ fontSize: 12, color: C.sub, marginTop: 12 }}>代表　浜元新菜（正看護師・看護師歴7年目）</p>
        </div>

        {/* 課題 */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: 'inline-block', background: C.light, color: C.dark, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>こんなお悩みありませんか？</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>現場のリアルな声から生まれたサービスです</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '採用コストが高すぎる。紹介会社の手数料は年収の20〜30%にもなる',
              'せっかく育てても辞めてしまう。定着しないことで現場の士気が下がる',
              '急な欠員に対応できず、既存スタッフに負担がかかってしまう',
              '働き方が変われば、もっと医療現場で活躍したい看護師はたくさんいる。でも今の仕組みでは出会えていない',
            ].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: '#fff', borderRadius: 10, border: `1px solid ${C.border}` }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FEE2E2', color: '#991B1B', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>...</div>
                <span style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 解決策 */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: 'inline-block', background: C.light, color: C.dark, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>irodori+ができること</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 16 }}>まずは1日から。相性を確かめながら採用へ</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '👥', title: '単発から始める出会い', desc: '1日働いてみて、相性を確かめてから正規採用へ。ミスマッチをなくします' },
              { icon: '🛡️', title: '信頼できる看護師', desc: '免許証・評価・実績が全部見える。安心して採用の判断ができます' },
              { icon: '⏱️', title: '急な欠員も当日対応', desc: '投稿後すぐ260名に通知。最短当日マッチングで現場を守ります' },
              { icon: '📋', title: '管理もまとめてお任せ', desc: 'チャット・支払い明細・口座情報まで一元管理。経理も楽になります' },
            ].map(s => (
              <div key={s.title} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px' }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 料金 */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: 'inline-block', background: C.light, color: C.dark, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>料金プラン</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>シンプルで明快な料金です</div>
          <p style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>看護師の登録・利用は完全無料です</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 12, border: `2px solid ${C.primary}`, padding: '20px' }}>
              <span style={{ background: C.light, color: C.dark, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, display: 'inline-block', marginBottom: 12 }}>おすすめ</span>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>単発求人プラン</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>¥11,000<span style={{ fontSize: 12, color: C.sub, fontWeight: 400 }}>/月（税込）</span></div>
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.9 }}>
                単発求人を無制限掲載<br />看護師への即時LINE通知<br />チャット・支払い明細管理
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.border}`, padding: '20px' }}>
              <div style={{ height: 25, marginBottom: 12 }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>正社員・パートプラン</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.primary }}>初期¥60,000<br />+ 月額¥20,000</div>
              <div style={{ height: 1, background: C.border, margin: '12px 0' }} />
              <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.9 }}>
                特集ページ作成<br />irodori公式SNSへの投稿<br />求人掲載・応募者管理
              </div>
            </div>
          </div>
        </div>

        {/* 会社情報 */}
        <div style={{ padding: '40px 0', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ display: 'inline-block', background: C.light, color: C.dark, fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, marginBottom: 16 }}>会社情報</span>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 12 }}>株式会社irodoriについて</div>
          <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.9, marginBottom: 20 }}>
            沖縄を拠点に、看護師と医療・介護施設の新しい働き方を作っています。
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => window.open('https://www.irodori0305.jp', '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: C.bg, borderRadius: 8, fontSize: 13, color: C.text, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              🌐 公式ホームページ
            </button>
            <button onClick={() => window.open('https://www.instagram.com/irodori._.plus_nurse?igsh=MWh4c2treWRiMndldw%3D%3D&utm_source=qr', '_blank')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: C.bg, borderRadius: 8, fontSize: 13, color: C.text, border: `1px solid ${C.border}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              📸 Instagram
            </button>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>まずは気軽にご相談ください</div>
          <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.9, marginBottom: 24 }}>
            資料を無料でお送りします。導入のご相談もお気軽にどうぞ。<br />
            担当者より2営業日以内にご連絡いたします。
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
            <button onClick={() => window.location.href = '/contact'} style={{ padding: '14px 32px', background: C.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              無料で資料請求する
            </button>
            <button onClick={() => window.location.href = '/register'} style={{ padding: '14px 32px', background: '#fff', color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              今すぐ登録して試す
            </button>
          </div>
          <p style={{ fontSize: 12, color: C.sub }}>info@irodori0305.jp</p>
        </div>

      </div>
    </div>
  )
}
