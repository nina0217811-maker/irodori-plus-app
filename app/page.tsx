import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ fontFamily: 'sans-serif', color: '#1A2235' }}>

      {/* ファーストビュー */}
      <div style={{ background: '#FEF0F0', padding: '32px 20px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
          <div style={{ width: '20px', height: '1px', background: '#E07070' }}></div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#E07070', letterSpacing: '0.5px' }}>登録看護師260名以上が待っています</div>
          <div style={{ width: '20px', height: '1px', background: '#E07070' }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '26px', fontWeight: '700', lineHeight: '1.35', letterSpacing: '-0.5px', color: '#1A2235' }}>看護師採用なら<span style={{ color: '#E07070' }}>irodori+</span></div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.8', marginTop: '10px' }}>単発から正社員まで。沖縄特化・紹介手数料ゼロ。</div>
          </div>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 2px 12px rgba(224,112,112,0.2)' }}>
            <img src="/nurse1.jpg" alt="看護師" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '28px' }}>
          {[
            { label: '紹介手数料', value: '¥0' },
            { label: '登録看護師', value: '260名+' },
            { label: '最短', value: '当日〜' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '16px', padding: '16px 10px', textAlign: 'center', border: '1px solid #F0E0E0' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#E07070' }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/register">
            <button style={{ display: 'block', width: '100%', background: '#E07070', color: '#fff', border: 'none', borderRadius: '32px', padding: '18px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#E07070', fontSize: '10px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', border: '1px solid #E07070', whiteSpace: 'nowrap' }}>最短当日から掲載できます</span>
              無料で施設登録する
            </button>
          </Link>
          <Link href="/contact">
            <button style={{ display: 'block', width: '100%', background: '#fff', color: '#E07070', border: '2px solid #E07070', borderRadius: '32px', padding: '15px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              資料・料金表を請求する
            </button>
          </Link>
        </div>
      </div>

      {/* 課題 */}
      <div style={{ padding: '48px 20px', background: '#fff', borderBottom: '1px solid #F5EDED' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.6' }}>看護師採用でこんなお悩み<br />ありませんか？</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { icon: '😓', text: '採用コストが', em: '高すぎる' },
            { icon: '😰', text: '採用してもすぐ', em: '辞めてしまう' },
            { icon: '📋', text: '求人を出しても', em: '応募が来ない' },
            { icon: '🚨', text: '急な欠員に', em: '対応できない' },
          ].map(p => (
            <div key={p.em} style={{ background: '#FEF0F0', borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px', flexShrink: 0 }}>{p.icon}</span>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>{p.text}<span style={{ color: '#E07070' }}>{p.em}</span></div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ display: 'inline-block', background: '#E07070', color: '#fff', fontSize: '15px', fontWeight: '700', padding: '8px 24px', borderRadius: '4px' }}>irodori+なら解決！</span>
        </div>
      </div>

      {/* 解決策 */}
      <div style={{ background: '#FEF0F0', padding: '48px 20px', borderBottom: '1px solid #F5EDED' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.6' }}>irodori+で解決できること</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {[
            { icon: '🤝', title: '相性を確かめてから採用', desc: '単発で試してから正社員へ。定着率UP' },
            { icon: '💰', title: '紹介手数料ゼロ', desc: '月額定額で何名採用しても追加費用なし' },
            { icon: '📱', title: 'SNSで直接アプローチ', desc: '公式SNSで施設の魅力を発信' },
            { icon: '🎯', title: 'スカウト機能', desc: '気に入った看護師に直接スカウト' },
          ].map(s => (
            <div key={s.title} style={{ background: '#fff', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>{s.title}</div>
              <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.6' }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ borderRadius: '16px', overflow: 'hidden', height: '220px', maxWidth: '560px', margin: '0 auto' }}>
          <img src="/nurse2.jpg" alt="訪問看護" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }} />
        </div>
      </div>

      {/* 代表メッセージ */}
      <div style={{ padding: '48px 20px', background: '#fff', borderBottom: '1px solid #F5EDED' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', lineHeight: '1.6', marginBottom: '20px' }}>現場を知る看護師が、現場のために作りました。</div>
        <div style={{ borderLeft: '3px solid #E07070', paddingLeft: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '2' }}>「採用したら終わり」の紹介会社では、ミスマッチは防げない。単発で一緒に働いてみて、「この人と働きたい」と思ってから採用する。それだけで、現場が変わります。</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#E07070', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '16px', flexShrink: 0 }}>浜</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>浜元新菜</div>
            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>株式会社irodori 代表取締役</div>
          </div>
        </div>
      </div>

      {/* 料金 */}
      <div style={{ padding: '48px 20px', background: '#FAFAFA', borderBottom: '1px solid #F5EDED' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>料金プラン</div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '6px' }}>看護師の利用は完全無料</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #F0E0E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>ライト</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#E07070' }}>¥11,000<span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>/月</span></div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '2' }}>単発求人掲載・LINE通知・チャット管理</div>
          </div>
          <div style={{ background: '#FEF0F0', borderRadius: '14px', padding: '18px 20px', border: '2px solid #E07070', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-11px', left: '16px', background: '#E07070', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 12px', borderRadius: '20px' }}>おすすめ</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E07070' }}>スタンダード</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: '#E07070' }}>¥29,800<span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>/月</span></div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '2' }}>ライト全機能・正社員パート掲載・スカウト月5件・引き抜きOK</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 20px', border: '1px solid #F0E0E0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>プレミアム</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#E07070' }}>初期¥66,000</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#E07070' }}>+¥39,800/月</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: '2' }}>スタンダード全機能・特集ページ・SNS投稿・スカウト無制限</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link href="/register">
            <button style={{ display: 'block', width: '100%', background: '#E07070', color: '#fff', border: 'none', borderRadius: '32px', padding: '18px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#E07070', fontSize: '10px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', border: '1px solid #E07070', whiteSpace: 'nowrap' }}>最短当日から掲載できます</span>
              無料で施設登録する
            </button>
          </Link>
          <Link href="/contact">
            <button style={{ display: 'block', width: '100%', background: '#fff', color: '#E07070', border: '2px solid #E07070', borderRadius: '32px', padding: '15px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              資料・料金表を請求する
            </button>
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ padding: '48px 20px', background: '#fff', borderBottom: '1px solid #F5EDED' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', textAlign: 'center' }}>よくある質問</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { q: '契約期間はありますか？', a: '最低契約期間は3ヶ月です。その後は月単位でいつでも解約できます。' },
            { q: '採用成功時に追加費用はかかりますか？', a: '一切かかりません。何名採用しても月額定額のみです。' },
            { q: '請求書払いは可能ですか？', a: 'はい、対応しています。お問い合わせください。' },
            { q: '沖縄県外でも使えますか？', a: '現在は沖縄県内の施設・看護師を対象としています。' },
          ].map(faq => (
            <div key={faq.q} style={{ background: '#FAFAFA', borderRadius: '12px', padding: '16px 18px', border: '1px solid #F0E0E0' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', display: 'flex', gap: '8px' }}><span style={{ color: '#E07070' }}>Q.</span>{faq.q}</div>
              <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.8', paddingLeft: '20px' }}>A. {faq.a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 最終CTA */}
      <div style={{ padding: '56px 20px', background: '#FEF0F0', textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: '700', lineHeight: '1.6', marginBottom: '8px' }}>まずはご相談だけでもOK！</div>
        <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '32px', lineHeight: '1.8' }}>登録5分・ライトプランから気軽にお試しください。<br />3ヶ月後はいつでも解約できます。</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px', margin: '0 auto' }}>
          <Link href="/register">
            <button style={{ display: 'block', width: '100%', background: '#E07070', color: '#fff', border: 'none', borderRadius: '32px', padding: '18px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', position: 'relative' }}>
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#E07070', fontSize: '10px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', border: '1px solid #E07070', whiteSpace: 'nowrap' }}>最短当日から掲載できます</span>
              無料で施設登録する
            </button>
          </Link>
          <Link href="/contact">
            <button style={{ display: 'block', width: '100%', background: '#fff', color: '#E07070', border: '2px solid #E07070', borderRadius: '32px', padding: '15px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
              資料・料金表を請求する
            </button>
          </Link>
        </div>
        <div style={{ marginTop: '24px', fontSize: '11px', color: '#94A3B8' }}>info@irodori0305.jp</div>
      </div>

    </div>
  )
}
