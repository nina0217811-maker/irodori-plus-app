export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', fontFamily: 'sans-serif', color: '#1A2235', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>利用規約</h1>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '48px' }}>最終更新日：2026年4月28日</p>
      <p style={{ marginBottom: '32px' }}>本利用規約（以下「本規約」）は、株式会社irodori（以下「当社」）が提供するirodori+（以下「本サービス」）の利用条件を定めるものです。利用者は本規約に同意のうえ、本サービスをご利用ください。</p>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第1条（サービスの概要）</h2>
        <p>本サービスは、看護師と医療・介護施設をつなぐ単発勤務マッチングプラットフォームです。看護師は求人への応募、施設は求人の掲載をそれぞれ行うことができます。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第2条（利用登録）</h2>
        <p>本サービスの利用には、所定の方法による登録が必要です。以下に該当する方は登録できません。</p>
        <ul style={{ paddingLeft: '24px', marginTop: '12px' }}><li>過去に本サービスの利用を停止・禁止された方</li><li>虚偽の情報を登録した方</li><li>未成年者（保護者の同意がある場合を除く）</li><li>反社会的勢力に関与する方</li></ul>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第3条（料金・支払い）</h2>
        <p>看護師の利用は無料です。施設利用者は月額¥10,000（税込）の掲載プランをご利用いただけます。料金は前払いとし、Stripeを通じてクレジットカードにて決済されます。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第4条（禁止事項）</h2>
        <ul style={{ paddingLeft: '24px', marginTop: '12px' }}><li>虚偽の情報の登録・掲載</li><li>他の利用者への迷惑行為・ハラスメント</li><li>本サービスを通じた違法行為</li><li>当社または第三者の知的財産権の侵害</li><li>本サービスの運営を妨げる行為</li><li>本サービス外での直接取引による手数料の不正回避</li><li>アカウントの第三者への譲渡・貸与</li></ul>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第5条（免責事項）</h2>
        <ul style={{ paddingLeft: '24px', marginTop: '12px' }}><li>看護師と施設間のトラブル・契約内容</li><li>システム障害・メンテナンスによるサービス停止</li><li>利用者が登録した情報の正確性</li><li>本サービスを通じた勤務中に発生した事故・損害</li></ul>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第6条（退会・利用停止）</h2>
        <p>利用者はいつでも退会することができます。当社は、利用者が本規約に違反した場合、事前通知なく利用を停止・アカウントを削除することがあります。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第7条（規約の変更）</h2>
        <p>当社は、必要に応じて本規約を変更することがあります。変更後の規約は、本サービス上に掲載した時点から効力を生じます。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第8条（準拠法・管轄）</h2>
        <p>本規約は日本法に準拠します。本サービスに関する紛争については、那覇地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第9条（お問い合わせ）</h2>
        <div style={{ padding: '20px', background: '#FBF7F7', borderRadius: '8px', border: '1px solid #EDE0E0' }}>
          <p style={{ margin: '0 0 8px' }}>株式会社irodori</p>
          <p style={{ margin: '0 0 8px' }}>代表取締役　浜元新菜</p>
          <p style={{ margin: '0 0 8px' }}>〒901-2131　沖縄県浦添市西原4丁目37番5−2 E＆be living 102</p>
          <p style={{ margin: '0' }}>メール：info@irodori0305.jp</p>
        </div>
      </section>
    </div>
  )
}
