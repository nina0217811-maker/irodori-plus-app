export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 20px', fontFamily: 'sans-serif', color: '#1A2235', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>プライバシーポリシー</h1>
      <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '48px' }}>最終更新日：2026年4月28日</p>
      <p style={{ marginBottom: '32px' }}>株式会社irodori（以下「当社」）は、irodori+（以下「本サービス」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。</p>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第1条（収集する個人情報）</h2>
        <p>当社は、本サービスの提供にあたり、以下の個人情報を収集します。</p>
        <ul style={{ paddingLeft: '24px', marginTop: '12px' }}><li>氏名・施設名</li><li>メールアドレス</li><li>保有資格・経験年数・スキル（看護師の場合）</li><li>求人情報・応募履歴</li><li>サービス利用履歴</li><li>決済に関する情報（Stripeを通じて処理されます）</li></ul>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第2条（個人情報の利用目的）</h2>
        <ul style={{ paddingLeft: '24px', marginTop: '12px' }}><li>本サービスの提供・運営</li><li>看護師と施設のマッチング</li><li>利用者へのお知らせ・連絡</li><li>サービスの改善・新機能開発</li><li>利用規約違反への対応</li><li>決済処理</li></ul>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第3条（第三者への提供）</h2>
        <p>当社は、以下の場合を除き、利用者の個人情報を第三者に提供しません。</p>
        <ul style={{ paddingLeft: '24px', marginTop: '12px' }}><li>利用者本人の同意がある場合</li><li>法令に基づく場合</li><li>人の生命・身体・財産の保護のために必要な場合</li><li>マッチングの目的において、看護師情報を施設側に、施設情報を看護師側に開示する場合</li></ul>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第4条（外部サービスの利用）</h2>
        <ul style={{ paddingLeft: '24px', marginTop: '12px' }}><li>Supabase：データベース・認証管理</li><li>Stripe：決済処理（クレジットカード情報は当社では保持しません）</li><li>Vercel：サービスホスティング</li></ul>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第5条（個人情報の管理）</h2>
        <p>当社は、個人情報の漏洩・滅失・毀損を防止するため、適切なセキュリティ対策を講じます。SSL暗号化通信を使用し、データは適切に保護されます。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第6条（開示・訂正・削除）</h2>
        <p>利用者は、当社が保有する自己の個人情報について、開示・訂正・削除を求めることができます。ご希望の場合は、下記お問い合わせ先までご連絡ください。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第7条（プライバシーポリシーの変更）</h2>
        <p>当社は、必要に応じて本ポリシーを変更することがあります。変更後のポリシーは、本サービス上に掲載した時点から効力を生じます。</p>
      </section>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #EDE0E0' }}>第8条（お問い合わせ）</h2>
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
