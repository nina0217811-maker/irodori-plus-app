'use client'

const C = {
  primary: '#E07070',
  border: '#EDE0E0',
  sub: '#64748B',
  bg: '#FBF7F7',
  card: '#FFFFFF',
  text: '#1A2235',
}

const items = [
  { label: '事業者名', value: '株式会社irodori' },
  { label: '代表者名', value: '浜元新菜' },
  { label: '所在地', value: '沖縄県浦添市西原4丁目37-5-2 E&be living 102' },
  { label: '連絡先', value: 'info@irodori0305.jp' },
  { label: 'サービス名', value: 'irodori+（いろどりプラス）' },
  { label: 'サービスURL', value: 'https://irodori0305.jp' },
  { label: '料金', value: '【施設向け単発求人プラン】月額 ¥11,000（税込）\n【施設向け正社員・パート求人プラン】初期費用 ¥60,000 + 月額 ¥20,000（税込）\n【看護師向け】無料' },
  { label: '支払い方法', value: 'クレジットカード決済（Stripe）' },
  { label: '支払い時期', value: '登録時および毎月自動更新' },
  { label: 'サービス提供時期', value: 'お支払い確認後、即日ご利用いただけます' },
  { label: '解約方法', value: 'info@irodori0305.jp へメールにてご連絡ください。解約のご連絡後、翌月以降の請求を停止します。' },
  { label: '返金ポリシー', value: '月の途中での解約による日割り返金は行っておりません。ただし、システム障害等、当社起因の問題が発生した場合はこの限りではありません。' },
  { label: '動作環境', value: 'インターネットに接続されたPC・スマートフォン（最新のブラウザを推奨）' },
  { label: '特定募集情報等提供事業', value: '届出済み（厚生労働大臣への届出）' },
]

export default function TokushoPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', paddingBottom: 60, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>特定商取引法に基づく表記</h1>
        <p style={{ fontSize: 13, color: C.sub, marginBottom: 32 }}>
          特定商取引法第11条に基づき、以下の事項を表示します。
        </p>

        <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div key={item.label} style={{ display: 'flex', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none', flexWrap: 'wrap' }}>
              <div style={{ width: 180, minWidth: 140, padding: '14px 20px', background: '#FBF7F7', fontSize: 13, fontWeight: 600, color: C.sub, flexShrink: 0 }}>
                {item.label}
              </div>
              <div style={{ flex: 1, padding: '14px 20px', fontSize: 13, color: C.text, lineHeight: 1.8, whiteSpace: 'pre-line', minWidth: 200 }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: C.sub, marginTop: 24, lineHeight: 1.8 }}>
          ※ 本表記は予告なく変更する場合があります。最新の情報をご確認ください。<br />
          ※ ご不明な点は info@irodori0305.jp までお問い合わせください。
        </p>

      </div>
    </div>
  )
}
